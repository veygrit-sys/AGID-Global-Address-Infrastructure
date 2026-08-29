import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/tj/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`tj-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const normalizedMime=value=>(value??'').split(';')[0].trim().toLowerCase();
const stripTags=text=>text.replaceAll('&nbsp;',' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const sixDigitTokens=text=>text.match(/(?<!\d)[0-9]{6}(?!\d)/g)??[];

export function profileTajikReference(bytes,reference,contentType){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(normalizedMime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true,geometry_records:0};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail('content-marker');
 if(reference.kind==='index-html'){
   const main=text.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
   if(!main)fail('index-main');
   const articleBodies=[...main.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map(match=>stripTags(match[0]));
   const tokens=articleBodies.flatMap(sixDigitTokens);
   const counts=new Map();for(const token of tokens)counts.set(token,(counts.get(token)??0)+1);
   return {article_count:articleBodies.length,six_digit_occurrences:tokens.length,distinct_six_digit_codes:counts.size,repeated_code_count:[...counts.values()].filter(count=>count>1).length,max_code_occurrences:Math.max(...counts.values()),contains_suspect_753456:tokens.includes('753456'),geometry_records:0};
 }
 if(reference.kind==='office-html'){
   const table=text.match(/<table\b[\s\S]*?<\/table>/i)?.[0];
   if(!table)fail('office-table');
   const rows=[...table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map(match=>stripTags(match[0])).filter(row=>sixDigitTokens(row).length);
   const tokens=rows.flatMap(sixDigitTokens);
   const counts=new Map();for(const token of tokens)counts.set(token,(counts.get(token)??0)+1);
   return {office_rows:rows.length,distinct_office_codes:counts.size,repeated_office_code_count:[...counts.values()].filter(count=>count>1).length,max_offices_per_code:Math.max(...counts.values()),geometry_records:0};
 }
 fail('reference-kind');
}

export function validateTajikAuditReport(report){
 if(report.countryCode!=='TJ'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
   const receipt=report.references.find(item=>item.id===reference.id);
   if(!receipt||receipt.requestedUrl!==reference.url||!Number.isFinite(Date.parse(receipt.observedAt)))fail('receipt-binding');
   if(receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('content-binding');
 }
 if(report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0||report.realTajikPostalApiVerified||report.realTajikAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.currentAssignmentCompletenessValidated)fail('current-completeness-overclaim');
 return {references:report.references.length,countryM2Achieved:false};
}

if(process.argv[1]&&new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).pathname.endsWith('/inspect-postal-context-tj-sources.mjs')){
 const report=JSON.parse(readFileSync(process.argv[2]??new URL('../reports/postal-context-m2/tj-source-review-2026-08-29.json',import.meta.url),'utf8'));
 console.log(JSON.stringify(validateTajikAuditReport(report)));
}
