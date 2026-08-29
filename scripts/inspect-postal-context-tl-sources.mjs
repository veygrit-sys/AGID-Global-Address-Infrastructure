import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/tl/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`tl-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const normalizedMime=value=>(value??'').split(';')[0].trim().toLowerCase();

export function profileTimorLesteReference(bytes,reference,contentType){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(normalizedMime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true,geometry_records:0,assignment_rows:0};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail('content-marker');
 const canonicalExamples=[...new Set(text.match(/(?<![A-Z0-9])TL[0-9]{5}(?![A-Z0-9])/gi)?.map(value=>value.toUpperCase())??[])];
 if(reference.kind==='contact-html') return {canonical_example_codes:canonicalExamples,contains_unclassified_535022:text.includes('535022'),geometry_records:0,assignment_rows:0};
 if(reference.kind==='operator-html') return {canonical_example_codes:canonicalExamples,contains_public_postcode_dataset_link:/\b(postcode|postal code|código postal)\b/i.test(text),geometry_records:0,assignment_rows:0};
 if(reference.kind==='licensed-product-html') return {licensed_product_contract_markers_present:true,geometry_records:0,assignment_rows:0};
 if(reference.kind==='government-program-html') return {describes_future_or_planned_postal_expansion:true,geometry_records:0,assignment_rows:0};
 fail('reference-kind');
}

export function validateTimorLesteAuditReport(report){
 if(report.countryCode!=='TL'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
   const receipt=report.references.find(item=>item.id===reference.id);
   if(!receipt||receipt.requestedUrl!==reference.url||!Number.isFinite(Date.parse(receipt.observedAt)))fail('receipt-binding');
   if(receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('content-binding');
 }
 if(report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0||report.realTimorLestePostalApiVerified||report.realTimorLesteAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.currentAssignmentCompletenessValidated||report.officialContactNumberClassifiedAsPostcode)fail('assignment-overclaim');
 return {references:report.references.length,countryM2Achieved:false};
}

if(process.argv[1]&&new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).pathname.endsWith('/inspect-postal-context-tl-sources.mjs')){
 const report=JSON.parse(readFileSync(process.argv[2]??new URL('../reports/postal-context-m2/tl-source-review-2026-08-29.json',import.meta.url),'utf8'));
 console.log(JSON.stringify(validateTimorLesteAuditReport(report)));
}
