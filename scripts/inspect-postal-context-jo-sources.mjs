import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {profileJordanOfficeCsv} from './lib/postal-context-jo-offices.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/jo/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(P.allowed_hosts);
const safeErrors=new Set(['unapproved-reference-host','redirect-without-location','reference-byte-limit','empty-reference','reference-redirect-limit','jo-package-shape','jo-package-not-public','jo-resource-binding','jo-csv-byte-limit','jo-csv-mime','jo-csv-invalid-utf8','jo-csv-header','jo-csv-row-limit','jo-csv-invalid-quote','jo-csv-unclosed-quote']);
export function jordanReviewFailure(e){if(safeErrors.has(e?.message))return e.message;const code=e?.cause?.code??e?.code;if(['UND_ERR_CONNECT_TIMEOUT','ETIMEDOUT'].includes(code))return 'connect-timeout';if(['ENOTFOUND','EAI_AGAIN'].includes(code))return 'dns-unresolved';if(e?.name==='TimeoutError'||e?.name==='AbortError')return 'request-timeout';return 'network-or-parser-error';}
export function profileJordanPackage(body){
 const p=body?.result;
 if(body?.success!==true||p?.id!==P.package_id||p?.name!==P.package_name||!Array.isArray(p.resources)||p.resources.length!==2)throw Error('jo-package-shape');
 if(p.private!==false||p.state!=='active')throw Error('jo-package-not-public');
 for(const x of p.resources)if(!P.office_resources.some(r=>r.id===x.id&&r.url===x.url)||x.format!=='CSV')throw Error('jo-resource-binding');
 if(new Set(p.resources.map(r=>r.id)).size!==2)throw Error('jo-resource-binding');
 return {id:p.id,name:p.name,catalogueYear:p.ds_year??null,version:p.version??null,metadataModified:p.metadata_modified??null,migrationStatus:p.migration_status??null,publishingStatus:p.publishing_status??null,private:p.private,isopen:p.isopen===true,licence:{id:p.license_id??null,title:p.license_title??null,url:p.license_url??null,exactVersionBindingVerified:false},resources:p.resources.map(r=>({id:r.id,url:r.url,format:r.format,declaredBytes:r.size??null,declaredHash:r.hash||null,lastModified:r.last_modified??null,datastoreActive:r.datastore_active===true,datastoreComplete:r.datastore_contains_all_records_of_source_file===true})),currentAssignmentVerified:false,productionEligible:false};
}
export function profileJordanReference(bytes,ref,mime){
 if(!P.references.some(r=>r.id===ref.id&&r.url===ref.url))throw Error('unapproved-reference-host');
 const digest=sourceDigest(bytes),base={byteLength:bytes.length,responseDigest:digest,sourceDocumentDigest:null};
 if((mime??'').split(';')[0].trim().toLowerCase()!==ref.mime)return {...base,status:'unexpected-mime',contentVerified:false};
 if(ref.mime==='application/pdf'){const ok=bytes.subarray(0,5).toString()==='%PDF-'&&digest===ref.expected_digest&&ref.visually_reviewed_pages.length>0;return {...base,status:ok?'reviewed-reference-not-data':'pdf-re-review-required',contentVerified:ok,sourceDocumentDigest:ok?digest:null,edition:ok?ref.edition:null,visuallyReviewedPages:ok?ref.visually_reviewed_pages:[],currentAssignmentVerified:false};}
 const html=new TextDecoder('utf8',{fatal:true}).decode(bytes),body=html.match(/<div class="content-body">([\s\S]*?)<\/div>/i)?.[1]??html;
 const text=body.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const markers=ref.markers.map(value=>({value,present:text.toLowerCase().includes(value.toLowerCase())})),ok=markers.every(m=>m.present)&&!text.includes('Content will be displayed as it becomes available');
 return {...base,status:ok?'public-reference-not-assignment':'placeholder-or-unconfirmed-body',contentVerified:ok,sourceDocumentDigest:ok?digest:null,markers,bodyCharacters:text.length,currentAssignmentVerified:false,exactLicenceBindingVerified:false};
}
export async function inspectJordanSources(fetcher=fetch){
 const report={schemaVersion:'postal-context-jo-source-review/v1',countryCode:'JO',observedAt:new Date().toISOString(),references:[],package:null,officeDownloads:[],sourceRowsPersisted:0,currentAssignmentRowsValidated:0,assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,reason:'no-current-assignment-input'},publishedDataArtifacts:0,productionGeometryRecords:0,civicBuildingRelations:0,realAgidRuntimeVerified:false,paidOperations:0,authenticatedRequests:0,explicitClickthroughOrContractAcceptancePerformed:false,countryM2Achieved:false};
 const get=async(url,limit=P.limits.reference_bytes)=>{const r=await fetchBoundedOfficialResponse(url,{allowedHosts:hosts,fetcher,maxBytes:limit});return {...r,receipt:{...r.metadata,observedAt:new Date().toISOString(),byteLength:r.bytes?.length??null,responseDigest:r.bytes?sourceDigest(r.bytes):null}};};
 const reference=async ref=>{try{const r=await get(ref.url);return {id:ref.id,role:ref.role,...r.receipt,...(r.bytes?profileJordanReference(r.bytes,ref,r.metadata.contentType):{status:'http-error',contentVerified:false,sourceDocumentDigest:null})};}catch(e){return {id:ref.id,url:ref.url,observedAt:new Date().toISOString(),status:'fetch-error',failureKind:jordanReviewFailure(e),contentVerified:false,sourceDocumentDigest:null};}};
 for(let i=0;i<P.references.length;i+=2)report.references.push(...await Promise.all(P.references.slice(i,i+2).map(reference)));
 try{const r=await get(P.package_url);report.package={...r.receipt,status:r.bytes?'metadata-reviewed':'http-error'};if(r.bytes)report.package.profile=profileJordanPackage(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(r.bytes)));}catch(e){report.package={url:P.package_url,observedAt:new Date().toISOString(),status:'review-failed',failureKind:jordanReviewFailure(e)};}
 if(report.package.profile){
  for(const [i,ref] of [...P.office_resources,P.office_resources[0]].entries()){try{const r=await get(ref.url,P.limits.csv_bytes);report.officeDownloads.push({id:ref.id,repeat:i===2,...r.receipt,status:r.bytes?'office-file-profiled-not-current-assignment':'http-error',quality:r.bytes?profileJordanOfficeCsv(r.bytes,r.metadata.contentType??''):null});}catch(e){report.officeDownloads.push({id:ref.id,repeat:i===2,url:ref.url,observedAt:new Date().toISOString(),status:'review-failed',failureKind:jordanReviewFailure(e),quality:null});}}
 }
 const successful=report.officeDownloads.filter(r=>r.quality),unique=[...new Map(successful.map(r=>[r.responseDigest,r])).values()];
 report.officeSummary={successfulDownloads:successful.length,uniqueFileDigests:unique.length,uniqueFileOfficeRows:unique.reduce((sum,r)=>sum+r.quality.officeRows,0),repeatBytesAgree:successful.length===3&&successful[0].responseDigest===successful[2].responseDigest,resourceAliasesSameBytes:successful.length>=2&&successful[0].responseDigest===successful[1].responseDigest,notNationalCoverage:true};
 report.completedAt=new Date().toISOString();return report;
}
export const JORDAN_CATALOG_URL='https://opendata.gov.jo/api/3/action/package_search?fq=organization%3Ajpc-migrated_2127&rows=30&sort=metadata_modified%20desc';
export function profileJordanCatalog(body){
 const r=body?.result;if(body?.success!==true||!Number.isInteger(r?.count)||r.count<0||!Array.isArray(r.results)||r.results.length>30||r.count<r.results.length)throw Error('jo-package-shape');
 if(r.results.some(p=>p.private!==false||p.organization?.name!=='jpc-migrated_2127'))throw Error('jo-package-not-public');
 return {count:r.count,returned:r.results.length,completeForQuery:r.count===r.results.length,notNationalAbsenceProof:true,items:r.results.map(p=>({name:p.name,title:p.title,year:p.ds_year??null,modified:p.metadata_modified??null,version:p.version??null,licenceId:p.license_id??null,licenceUrl:p.license_url??null,resourceCount:p.num_resources??null})),sourceRowsPersisted:0,currentAssignmentRowsValidated:0};
}
export async function inspectJordanCatalog(fetcher=fetch){
 const report={schemaVersion:'postal-context-jo-catalog-review/v1',countryCode:'JO',observedAt:new Date().toISOString(),requestedUrl:JORDAN_CATALOG_URL,privateQueries:0,sourceRowsPersisted:0,countryM2Achieved:false};
 try{const r=await fetchBoundedOfficialResponse(JORDAN_CATALOG_URL,{allowedHosts:new Set(['opendata.gov.jo']),fetcher,maxBytes:2*1024*1024});Object.assign(report,r.metadata,{byteLength:r.bytes?.length??null,responseDigest:r.bytes?sourceDigest(r.bytes):null,status:r.bytes?'catalog-reviewed':'http-error'});if(r.bytes)report.profile=profileJordanCatalog(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(r.bytes)));}catch(e){report.status='review-failed';report.failureKind=jordanReviewFailure(e);}
 report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const a=process.argv.slice(2);if(a.length!==2||!['--report','--catalog-report'].includes(a[0]))throw Error('usage: node scripts/inspect-postal-context-jo-sources.mjs --report|--catalog-report new.json');const path=resolve(a[1]);if(existsSync(path))throw Error('report-already-exists');const r=await (a[0]==='--catalog-report'?inspectJordanCatalog():inspectJordanSources());mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(r));}
