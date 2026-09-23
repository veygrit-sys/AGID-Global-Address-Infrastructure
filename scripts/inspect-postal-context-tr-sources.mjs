import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/tr/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`tr-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const normalizedMime=value=>(value??'').split(';')[0].trim().toLowerCase();
const geometryKey=key=>/geometry|coordinates|polygon|multipolygon|boundary|bbox|(^|_)(lat|latitude|lon|lng|longitude|geom|wkt|geojson)($|_)/i.test(key);

export function profileTurkiyeReference(bytes,reference,contentType){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(normalizedMime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='reviewed-pdf'){
  if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
  return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true,geometry_records:0};
 }
 if(reference.kind==='province-directory-json'||reference.kind==='district-directory-json'){
  const rows=JSON.parse(bytes.toString('utf8'));
  if(!Array.isArray(rows))fail('directory-shape');
  const fields=rows.length?Object.keys(rows[0]):[];
  const areaFields=new Set(rows.flatMap(row=>Object.keys(row).filter(geometryKey)));
  const actual=rows.filter(row=>Number(row.kod)>0);
  const reviewed=reference.manual_data_review;
  const expectedActual=reviewed.actual_provinces??reviewed.actual_districts;
  if(rows.length!==reviewed.rows_including_sentinel||actual.length!==expectedActual
    ||JSON.stringify(fields)!==JSON.stringify(['ad','kod'])||areaFields.size!==reviewed.polygon_or_coordinate_fields)fail('directory-profile');
  return {rows_including_sentinel:rows.length,actual_rows:actual.length,fields,geometry_fields:areaFields.size};
 }
 if(reference.kind==='assignment-sample-json'){
  const rows=JSON.parse(bytes.toString('utf8'));
  if(!Array.isArray(rows)||!rows.length)fail('assignment-shape');
  const fields=Object.keys(rows[0]);
  const codes=rows.map(row=>String(row.posta_Kodu??''));
  const neighbourhoods=new Set(rows.map(row=>row.mahalleAdi).filter(Boolean));
  const streets=new Set(rows.map(row=>row.sokakAdi).filter(Boolean));
  const areaFields=new Set(rows.flatMap(row=>Object.keys(row).filter(geometryKey)));
  const reviewed=reference.manual_data_review;
  if(rows.length!==reviewed.rows||new Set(codes).size!==reviewed.unique_five_digit_postcodes
    ||codes.filter(code=>!/^[0-9]{5}$/.test(code)).length!==reviewed.invalid_postcodes
    ||neighbourhoods.size!==reviewed.unique_neighbourhoods||streets.size!==reviewed.unique_streets
    ||rows.filter(row=>!row.mahalleAdi).length!==reviewed.empty_neighbourhoods
    ||rows.filter(row=>!row.sokakAdi).length!==reviewed.empty_streets
    ||JSON.stringify(fields)!==JSON.stringify(reviewed.fields)||areaFields.size!==reviewed.polygon_or_coordinate_fields)fail('assignment-profile');
  return {rows:rows.length,unique_five_digit_postcodes:new Set(codes).size,invalid_postcodes:0,
   unique_neighbourhoods:neighbourhoods.size,unique_streets:streets.size,geometry_fields:areaFields.size,
   complete_national_assignment:false,delivery_area_geometry:false};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail('content-marker');
 if(reference.kind==='operator-html')return {official_operator_lookup:true,geometry_records:0};
 if(reference.kind==='operator-javascript')return {public_post_actions_present:true,textual_result_fields_present:true,geometry_records:0};
 if(reference.kind==='rights-html')return {prior_permission_restriction_present:true,geometry_records:0};
 if(reference.kind==='government-geospatial-html')return {owner_permission_and_open_data_classification_present:true,postcode_area_service_verified:false};
 fail('reference-kind');
}

export function validateTurkiyeAuditReport(report){
 if(report.countryCode!=='TR'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
  const receipt=report.references.find(item=>item.id===reference.id);
  if(!receipt||receipt.requestedUrl!==reference.url||!Number.isFinite(Date.parse(receipt.observedAt)))fail('receipt-binding');
  if(receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('content-binding');
 }
 if(report.pttLookupProfile.sampleRows!==3269||report.pttLookupProfile.uniqueFiveDigitPostcodes!==8
   ||report.pttLookupProfile.polygonCoordinateOrBoundaryFields!==0)fail('lookup-counts');
 if(report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0
   ||report.realTurkiyePostalApiVerified||report.realTurkiyeAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.currentAssignmentCompletenessValidated||report.boundedAssignmentSampleClassifiedAsDeliveryAreas)fail('assignment-overclaim');
 return {references:report.references.length,sampleRows:3269,countryM2Achieved:false};
}

if(process.argv[1]&&new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).pathname.endsWith('/inspect-postal-context-tr-sources.mjs')){
 const report=JSON.parse(readFileSync(process.argv[2]??new URL('../reports/postal-context-m2/tr-source-review-2026-08-29.json',import.meta.url),'utf8'));
 console.log(JSON.stringify(validateTurkiyeAuditReport(report)));
}
