import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import AdmZip from 'adm-zip';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/al/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`al-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const normalizedMime=value=>(value??'').split(';')[0].trim().toLowerCase();
const textContent=value=>value.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;|&apos;/gi,"'").replace(/&quot;/gi,'"').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim();

export function parsePostaTable(html){
 const rows=[];
 for(const match of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
   const cells=[...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(item=>textContent(item[1]));
   const codeIndex=cells.findIndex(value=>/^\d{4}$/.test(value));
   const number=cells.slice(0,codeIndex).find(value=>/^\d+$/.test(value));
   if(codeIndex>0&&number)rows.push({number,office:cells[codeIndex-1],code:cells[codeIndex]});
 }
 return rows;
}

const xmlText=value=>value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'");
const cellColumn=reference=>reference.match(/^[A-Z]+/)?.[0];
export function profileCadastralWorkbook(bytes){
 if(bytes.subarray(0,2).toString()!=='PK')fail('xlsx-signature');
 const zip=new AdmZip(bytes);
 const entry=name=>{const found=zip.getEntry(name);if(!found)fail('xlsx-entry');return found.getData().toString('utf8')};
 const shared=[...entry('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match=>[...match[1].matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)].map(item=>xmlText(item[1])).join(''));
 const rows=[...entry('xl/worksheets/sheet1.xml').matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map(match=>{
   const values={};
   for(const cell of match[2].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)){
     const reference=cell[1].match(/\br="([A-Z]+\d+)"/)?.[1];
     const type=cell[1].match(/\bt="([^"]+)"/)?.[1];
     const raw=cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1]??'';
     if(reference)values[cellColumn(reference)]=type==='s'?shared[Number(raw)]:xmlText(raw);
   }
   return values;
 });
 const header=rows[0]??{};
 if(header.A!=='Emertimi I Prones'||header.B!=='Zona Kadastrale'||header.C!=='Nr. Pasurie'||header.F!=='Vlera')fail('xlsx-schema');
 const data=rows.slice(1);const present=value=>value!==undefined&&value!==null&&String(value).trim()!=='';
 const zones=data.filter(row=>present(row.B)).map(row=>String(row.B));
 const properties=data.filter(row=>present(row.C)).map(row=>String(row.C).trim());
 const names=data.filter(row=>present(row.A)).map(row=>String(row.A).trim());
 const sheet=entry('xl/worksheets/sheet1.xml');
 const core=entry('docProps/core.xml');
 return {data_rows:data.length,named_rows:names.length,cadastral_zone_values:zones.length,distinct_cadastral_zones:new Set(zones).size,property_number_values:properties.length,distinct_property_numbers:new Set(properties).size,names_containing_post:names.filter(value=>/post/i.test(value)).length,formula_cells:(sheet.match(/<f(?: [^>]*)?>/g)??[]).length,postal_code_columns:0,geometry_columns:0,coordinate_columns:0,workbook_modified:core.match(/<dcterms:modified[^>]*>([^<]+)<\/dcterms:modified>/)?.[1]??null};
}

export function profileAlbaniaReference(bytes,reference,contentType=reference.mime){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(normalizedMime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true};
 }
 if(reference.kind==='xlsx'){
   const profile=profileCadastralWorkbook(bytes);
   for(const [key,value] of Object.entries(reference.expected_profile))if(profile[key]!==value)fail(`xlsx-${key}`);
   if(profile.workbook_modified!==reference.workbook_modified)fail('xlsx-modified');
   return profile;
 }
 const text=bytes.toString('utf8');
 if(reference.kind==='posta-table'){
   const rows=parsePostaTable(text);if(rows.length!==reference.expected_rows)fail('posta-row-count');
   return {rows,source_data_rows_reviewed:rows.length,postal_geometry_records:0};
 }
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail('content-marker');
 return {markers_verified:reference.markers.length,source_data_rows_reviewed:0,postal_geometry_records:0};
}

export function validateAlbaniaAuditReport(report){
 if(report.countryCode!=='AL'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
   const receipt=report.references.find(item=>item.id===reference.id);
   if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');
 }
 if(report.postaTableRowsObserved!==535||report.distinctPostcodesObserved!==532||report.duplicatePostcodeGroups!==3)fail('posta-counts');
 if(report.currentEditionCompletePostalRows!==0||report.postcodeAddressMembershipRows!==0)fail('row-overclaim');
 if(report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0||report.realAgidRuntimeVerified||report.realAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.authenticatedRequests!==0||report.paidOperations!==0||report.contractAcceptances!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 if(report.postalPolicy.cadastralZoneIsPostcodeArea||report.postalPolicy.officePointIsPostcodeArea||report.postalPolicy.addressBuildingIsPostcodeArea)fail('authority-overclaim');
 return {references:report.references.length,postaRows:535,distinctPostcodes:532,officialPostalGeometryRecords:0,countryM2Achieved:false};
}

export function auditAlbaniaSourceDirectory(sourceDirectory,report){
 const profiles={};
 for(const reference of config.references)profiles[reference.id]=profileAlbaniaReference(readFileSync(join(sourceDirectory,reference.audit_file)),reference,reference.mime);
 validateAlbaniaAuditReport(report);
 return profiles;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sourceDirectory=process.argv[2];
 const reportPath=process.argv[3]??fileURLToPath(new URL('../reports/postal-context-m2/al-source-review-2026-08-29.json',import.meta.url));
 if(!sourceDirectory)fail('usage');
 const report=JSON.parse(readFileSync(reportPath,'utf8'));
 const profiles=auditAlbaniaSourceDirectory(sourceDirectory,report);
 const postaRows=Object.entries(profiles).filter(([id])=>id.startsWith('posta-')&&id!=='posta-index'&&id!=='posta-open-data'&&id!=='posta-cadastral-assets').flatMap(([,profile])=>profile.rows??[]);
 const groups=new Map();for(const row of postaRows)(groups.get(row.code)||groups.set(row.code,[]).get(row.code)).push(row);
 const sourceProfiles=Object.fromEntries(Object.entries(profiles).map(([id,profile])=>[id,profile.rows?{source_data_rows_reviewed:profile.source_data_rows_reviewed,postal_geometry_records:profile.postal_geometry_records}:profile]));
 console.log(JSON.stringify({report:validateAlbaniaAuditReport(report),sourceProfiles,postaQuality:{rows:postaRows.length,distinctPostcodes:groups.size,duplicateGroups:[...groups].filter(([,rows])=>rows.length>1).length}}));
}
