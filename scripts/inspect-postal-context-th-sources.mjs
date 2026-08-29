import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/th/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`th-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const normalizedMime=value=>(value??'').split(';')[0].trim().toLowerCase();

export function profileThailandReference(bytes,reference,contentType){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(normalizedMime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail('content-marker');
 if(reference.kind==='json'){
   let body;try{body=JSON.parse(text)}catch{fail('json')}
   return {markers_verified:reference.markers.length,json_verified:true,body};
 }
 return {markers_verified:reference.markers.length};
}

export function validateThailandAuditReport(report){
 if(report.countryCode!=='TH'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
   const receipt=report.references.find(item=>item.id===reference.id);
   if(!receipt||receipt.requestedUrl!==reference.url||!Number.isFinite(Date.parse(receipt.observedAt)))fail('receipt-binding');
   if(reference.kind==='expected-http-failure'){
     if(receipt.httpStatus!==reference.reviewed_http_status||receipt.failureKind!==reference.reviewed_failure||receipt.contentVerified!==false)fail('failure-binding');
   }else if(receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('content-binding');
 }
 if(report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0||report.realThaiPostalApiVerified||report.realThaiAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.assignmentExceptionTokens!==config.references.find(item=>item.kind==='reviewed-pdf').manual_pdf_review.exception_tokens)fail('exception-count');
 return {references:report.references.length,countryM2Achieved:false};
}

if(process.argv[1]&&new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).pathname.endsWith('/inspect-postal-context-th-sources.mjs')){
 const report=JSON.parse(readFileSync(process.argv[2]??new URL('../reports/postal-context-m2/th-source-review-2026-08-29.json',import.meta.url),'utf8'));
 console.log(JSON.stringify(validateThailandAuditReport(report)));
}
