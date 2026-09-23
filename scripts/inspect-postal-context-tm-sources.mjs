import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/tm/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`tm-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const normalizedMime=value=>(value??'').split(';')[0].trim().toLowerCase();

export function profileTurkmenistanReference(bytes,reference,contentType){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(normalizedMime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true,geometry_records:0,assignment_rows:0};
 }
 if(reference.kind==='office-directory-json'){
   const data=JSON.parse(bytes.toString('utf8'));
   const rows=Array.isArray(data.departments)?data.departments:[];
   const indices=rows.map(row=>row.index);
   const unique=new Set(indices);
   const rowsWithPoint=rows.filter(row=>Number.isFinite(row.location?.lat)&&Number.isFinite(row.location?.lng)).length;
   const areaFields=new Set(rows.flatMap(row=>Object.keys(row).filter(key=>/polygon|geometry|boundary/i.test(key))));
   if(!Array.isArray(data.regions)||data.regions.length!==reference.manual_data_review.regions
      ||rows.length!==reference.manual_data_review.office_rows||unique.size!==reference.manual_data_review.unique_six_digit_indices
      ||indices.some(value=>!/^[0-9]{6}$/.test(value))||rowsWithPoint!==reference.manual_data_review.rows_with_point
      ||areaFields.size!==reference.manual_data_review.polygon_or_boundary_fields)fail('directory-profile');
   return {regions:data.regions.length,office_rows:rows.length,unique_six_digit_indices:unique.size,
     duplicate_index_groups:rows.length-unique.size,rows_with_point:rowsWithPoint,rows_without_point:rows.length-rowsWithPoint,
     polygon_or_boundary_fields:areaFields.size,geometry_records:0,complete_delivery_assignment:false};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail('content-marker');
 if(reference.kind==='operator-html') return {official_operator_surface:true,geometry_records:0,assignment_rows:0};
 if(reference.kind==='operator-javascript') return {public_departments_api_route_present:true,all_rights_reserved_marker_present:true,geometry_records:0,assignment_rows:0};
 if(reference.kind==='licensed-product-html') return {licensed_product_contract_markers_present:true,geometry_records:0,assignment_rows:0};
 if(reference.kind==='government-html') return {government_operator_identity_reference:true,geometry_records:0,assignment_rows:0};
 fail('reference-kind');
}

export function validateTurkmenistanAuditReport(report){
 if(report.countryCode!=='TM'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
   const receipt=report.references.find(item=>item.id===reference.id);
   if(!receipt||receipt.requestedUrl!==reference.url||!Number.isFinite(Date.parse(receipt.observedAt)))fail('receipt-binding');
   if(receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('content-binding');
 }
 if(report.officeDirectory.rows!==153||report.officeDirectory.uniqueSixDigitIndices!==153||report.officeDirectory.rowsWithPoint!==137)fail('directory-counts');
 if(report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0||report.realTurkmenistanPostalApiVerified||report.realTurkmenistanAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.currentAssignmentCompletenessValidated||report.officeIndexDirectoryClassifiedAsDeliveryAreas)fail('assignment-overclaim');
 return {references:report.references.length,officeRows:153,countryM2Achieved:false};
}

if(process.argv[1]&&new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).pathname.endsWith('/inspect-postal-context-tm-sources.mjs')){
 const report=JSON.parse(readFileSync(process.argv[2]??new URL('../reports/postal-context-m2/tm-source-review-2026-08-29.json',import.meta.url),'utf8'));
 console.log(JSON.stringify(validateTurkmenistanAuditReport(report)));
}
