import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/ba/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`ba-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const mime=value=>(value??'').split(';')[0].trim().toLowerCase();
const clean=value=>value.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();

export function parseBhPostDropOff(html){
 return [...html.matchAll(/<tr[^>]*class="dxgvDataRow[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi)].map(match=>[...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(cell=>clean(cell[1]))).map(cells=>({code:cells[0],office:cells[1],address:cells[2],locality:cells[3],region:cells[4]})).filter(row=>/^\d{5}$/.test(row.code));
}

export function profilePosteSrpske(html){
 const raw=html.match(/var umsAllMapsInfo = (\[.*\]);/)?.[1];
 if(!raw)fail('srpske-map-json');
 const maps=JSON.parse(raw);const markers=maps.flatMap(map=>map.markers??[]);
 const codes=markers.map(marker=>marker.title.match(/^(\d{5})/)?.[1]).filter(Boolean);
 return {maps:maps.length,office_markers:markers.length,coded_markers:codes.length,distinct_codes:new Set(codes).size,coordinate_markers:markers.filter(marker=>marker.coord_x&&marker.coord_y).length,postal_geometry_records:(html.match(/Polygon|MultiPolygon|FeatureCollection/g)??[]).length};
}

export function profileBosniaReference(bytes,reference,contentType=reference.mime){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(mime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail(`content-marker-${missing[0]}`);
 let profile={markers_verified:(reference.markers??[]).length,postal_geometry_records:0};
 if(reference.kind==='bh-post-network'){
   const codes=[...text.matchAll(/"title":"(\d{5})/g)].map(match=>match[1]);
   profile={office_markers:codes.length,distinct_codes:new Set(codes).size,coordinate_markers:(text.match(/"lat":"-?\d+\.\d+"/g)??[]).length,postal_geometry_records:(text.match(/Polygon|MultiPolygon|FeatureCollection/g)??[]).length};
 }
 if(reference.kind==='bh-post-dropoff'){
   const rows=parseBhPostDropOff(text);profile={office_rows:rows.length,distinct_codes:new Set(rows.map(row=>row.code)).size,regions:Object.fromEntries([...new Set(rows.map(row=>row.region))].sort().map(region=>[region,rows.filter(row=>row.region===region).length])),postal_geometry_records:0};
 }
 if(reference.kind==='srpske-locator')profile=profilePosteSrpske(text);
 for(const [key,value] of Object.entries(reference.expected_profile??{}))if(JSON.stringify(profile[key])!==JSON.stringify(value))fail(`${reference.id}-${key}`);
 return profile;
}

export function validateBosniaAuditReport(report){
 if(report.countryCode!=='BA'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){const receipt=report.references.find(item=>item.id===reference.id);if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');}
 if(report.authorizedPublicPostalOperators!==3||report.bhPostNetworkMarkers!==285||report.bhPostDropOffRows!==468||report.posteSrpskeMarkers!==584)fail('locator-counts');
 if(report.currentCompleteThreeOperatorAssignments!==0||report.postcodeAddressMembershipRows!==0||report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0||report.realAgidRuntimeVerified||report.realAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.authenticatedRequests!==0||report.paidOperations!==0||report.contractAcceptances!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 if(report.postalPolicy.officePointIsPostcodeArea||report.postalPolicy.postalRegionPrefixIsFullCodeArea||report.postalPolicy.administrativeOrCadastralGeometryIsPostcodeArea)fail('authority-overclaim');
 return {references:12,operators:3,officeRecordsReviewed:1337,officialPostalGeometryRecords:0,countryM2Achieved:false};
}

export function auditBosniaSourceDirectory(sourceDirectory,report){
 const profiles={};for(const reference of config.references)profiles[reference.id]=profileBosniaReference(readFileSync(join(sourceDirectory,reference.audit_file)),reference,reference.mime);validateBosniaAuditReport(report);return profiles;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sourceDirectory=process.argv[2];const reportPath=process.argv[3]??fileURLToPath(new URL('../reports/postal-context-m2/ba-source-review-2026-08-29.json',import.meta.url));if(!sourceDirectory)fail('usage');const report=JSON.parse(readFileSync(reportPath,'utf8'));console.log(JSON.stringify({report:validateBosniaAuditReport(report),sourceProfiles:auditBosniaSourceDirectory(sourceDirectory,report)}));
}
