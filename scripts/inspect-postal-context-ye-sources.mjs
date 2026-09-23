import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/ye/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`ye-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const normalizedMime=value=>(value??'').split(';')[0].trim().toLowerCase();

function bind(bytes,reference,contentType=reference.mime){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(normalizedMime(contentType)!==reference.mime)fail('mime');
}

export function profileYemenReference(bytes,reference,contentType){
 bind(bytes,reference,contentType);
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail('content-marker');
 const base={markers_verified:reference.markers.length,source_data_rows_reviewed:0};
 if(reference.kind==='office-map-html')return {...base,digital_map_claimed:/الخارطة الرقمية/.test(text),map_link:/target="_blank" href="#"/.test(text)?'#':null,postal_geometry_client:/Polygon|MultiPolygon|GeoJSON|WKT|fitBounds|setBounds/i.test(text)};
 if(reference.kind==='po-box-html')return {...base,po_box_number_separate:/رقم صندوق خاص/.test(text),postal_code_tied_to_office_by_area:/رمز بريدي يتبع لمكتب البريد حسب المنطقة/.test(text),published_code_values:0,postal_geometry:/Polygon|MultiPolygon|GeoJSON|WKT/i.test(text)};
 return base;
}

export function validateYemenAuditReport(report){
 if(report.countryCode!=='YE'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
   const receipt=report.references.find(item=>item.id===reference.id);
   if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');
 }
 if(report.postalPolicy.postcodeRequired||!report.postalPolicy.operatorPoBoxOfficeAreaCodeMentioned||report.postalPolicy.poBoxNumberIsPostcode||report.postalPolicy.operatorCodeIsPostalArea)fail('policy-overclaim');
 if(report.currentPostalCodeRowsValidated!==0||report.currentOfficeRowsValidated!==0||report.currentAddressRowsValidated!==0)fail('row-overclaim');
 if(report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0||report.realAgidRuntimeVerified||report.realAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.authenticatedRequests!==0||report.paidOperations!==0||report.contractAcceptances!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 return {references:report.references.length,currentPostalCodeRows:0,officialPostalGeometryRecords:0,countryM2Achieved:false};
}

export function auditYemenSourceDirectory(sourceDirectory,report){
 const profiles={};
 for(const reference of config.references){
   profiles[reference.id]=profileYemenReference(readFileSync(join(sourceDirectory,reference.audit_file)),reference,reference.mime);
 }
 validateYemenAuditReport(report);
 return profiles;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sourceDirectory=process.argv[2];
 const reportPath=process.argv[3]??fileURLToPath(new URL('../reports/postal-context-m2/ye-source-review-2026-08-29.json',import.meta.url));
 if(!sourceDirectory)fail('usage');
 const report=JSON.parse(readFileSync(reportPath,'utf8'));
 console.log(JSON.stringify({report:validateYemenAuditReport(report),sourceProfiles:auditYemenSourceDirectory(sourceDirectory,report)}));
}
