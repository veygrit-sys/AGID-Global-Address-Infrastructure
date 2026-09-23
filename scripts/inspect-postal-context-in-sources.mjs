import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,probeOfficialReference,sourceDigest} from './lib/postal-context-source-probe.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/in/postal-context/m2-source-review.json',import.meta.url)));
const HOSTS=new Set(['www.data.gov.in','sikkim.data.gov.in','ap.data.gov.in','api.data.gov.in','www.pib.gov.in','www.indiapost.gov.in']);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function decode(bytes){if(!bytes.length||bytes.length>P.limits.max_response_bytes)throw Error('in-byte-limit');try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw Error('in-invalid-utf8');}}
const rendered=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head|template)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;|&#xA0;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const includes=(s,m)=>s.toLowerCase().includes(m.toLowerCase());
const date=value=>{if(!value)return null;const [d,m,y]=value.split('/').map(Number),t=new Date(Date.UTC(y,m-1,d));return y>=2000&&t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null;};

export function profileInPortal(bytes,marker){
  if(typeof marker!=='string'||!marker.length||marker.length>100)throw Error('in-marker-invalid');
  const html=rendered(decode(bytes)),text=plain(html);
  const sandbox=includes(text,'This is a sandbox environment'),noResult=/No Result Found/i.test(text),epoch=/01\/01\/1970/.test(text);
  const expectedBodyMarkerPresent=includes(text,marker),reasons=[];
  if(sandbox)reasons.push('sandbox-banner');if(noResult)reasons.push('no-result-placeholder');if(epoch)reasons.push('epoch-footer-placeholder');if(!expectedBodyMarkerPresent)reasons.push('missing-body-marker');
  let staticDirectDataLinkCount=0;
  for(const match of html.matchAll(/href=["']([^"']+)["']/gi)){
    try{const u=new URL(match[1],'https://www.data.gov.in');if(u.protocol==='https:'&&HOSTS.has(u.hostname)&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&/\.(csv|zip|geojson)$/i.test(u.pathname))staticDirectDataLinkCount++;}catch{/* No arbitrary URLs are exported or followed. */}
  }
  return {scope:'server-rendered-body-only',sandboxBannerPresent:sandbox,noResultPlaceholderPresent:noResult,epochFooterPresent:epoch,expectedBodyMarkerPresent,
    godlFooterOrTextPresent:includes(text,'Government Open Data License'),apiKeyGenerationPromptPresent:includes(text,'Generate API Key'),
    catalogPublishedDate:date(text.match(/Published On\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]),catalogUpdatedDate:date(text.match(/Updated On\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]),
    datesAreAssignmentValidity:false,staticDirectDataLinkCount,blockReasons:reasons,referenceTextComplete:reasons.length===0,
    assignmentRowsValidated:0,assignmentEdition:null,completeAssignmentVerified:false,exactArtifactRightsBound:false,productionGeometryRecords:0,sourceRowsPersisted:0};
}

export function profileInGodl(bytes){
  const text=plain(rendered(decode(bytes))),clauses=P.godl_clauses.map(name=>({name,present:includes(text,name)}));
  const sandbox=includes(text,'This is a sandbox environment');
  const substantive=['worldwide, royalty-free, non-exclusive license','must acknowledge the provider, source, and license','must not indicate or suggest','not liable for any errors or omissions','do not guarantee the continued supply','does not cover the following kinds of data','rights under this license to end automatically','governed by Indian law'];
  return {clauseChecks:clauses,sandboxBannerPresent:sandbox,legalTextComplete:!sandbox&&clauses.every(c=>c.present)&&substantive.every(s=>includes(text,s)),
    attributionRequired:includes(text,'acknowledge the provider, source, and license'),personalInformationExcluded:includes(text,'Personal Information'),
    licenseEffectiveDate:null,exactDatasetLicenseBound:false,rightsClearedForCurrentAssignment:false,sourceDataRecords:0};
}

export function profileInSwagger(bytes){
  let d;try{d=JSON.parse(decode(bytes));}catch(e){if(/^in-/.test(e.message))throw e;throw Error('in-invalid-json');}
  const s=P.swagger;
  if(!object(d)||d.swagger!=='2.0'||d.info?.title!==s.title||d.host!==s.host||d.basePath!=='/'||JSON.stringify(d.schemes)!=='["https"]'
    ||!object(d.paths)||JSON.stringify(Object.keys(d.paths))!==JSON.stringify([s.path])||JSON.stringify(Object.keys(d.paths[s.path]))!=='["get"]')throw Error('in-swagger-identity');
  if(d.info.license?.name!==s.license_name||d.info.license?.url!==s.license_url)throw Error('in-swagger-license');
  const version=d.info.version;if(version!==null&&(typeof version!=='string'||version.length>128||/[\u0000-\u001f<>]/.test(version)))throw Error('in-swagger-version');
  const op=d.paths[s.path].get,params=op.parameters,expected=['api-key','format','offset','limit',...Object.keys(s.filters).map(f=>`filters[${f}]`)];
  if(!Array.isArray(params)||params.length!==expected.length||new Set(params.map(p=>p.name)).size!==params.length||params.some(p=>p.in!=='query'||!expected.includes(p.name)))throw Error('in-swagger-parameters');
  const byName=new Map(params.map(p=>[p.name,p])),key=byName.get('api-key');
  if(key.required!==true||key.type!=='string'||byName.get('format').required!==true||byName.get('format').type!=='string')throw Error('in-swagger-required-parameters');
  for(const f of ['offset','limit'])if(byName.get(f).type!=='integer'||byName.get(f).required!==false)throw Error('in-swagger-pagination');
  for(const [f,type] of Object.entries(s.filters))if(byName.get(`filters[${f}]`).type!==type||byName.get(`filters[${f}]`).required!==false)throw Error('in-swagger-filter-schema');
  if(!object(op.responses)||!['200','400','403'].every(k=>Object.hasOwn(op.responses,k)))throw Error('in-swagger-response-schema');
  return {swaggerVersion:d.swagger,catalogId:s.catalog_id,apiHost:d.host,catalogPath:s.path,operation:'get',apiKeyRequired:true,
    defaultCredentialValuePresent:Object.hasOwn(key,'default'),credentialValuesExported:false,apiSpecificationVersion:version,
    declaredLicenseName:s.license_name,declaredLicenseUrl:s.license_url,parameterCount:params.length,queryFilterCount:Object.keys(s.filters).length,
    queryFilterTypes:s.filters,pinFilterType:'number',pinResponseTypeVerified:false,pinStorageType:'six-digit-string',catalogRouteIsAssignmentSnapshot:false,
    sourceDataRecords:0,exactDatasetLicenseBound:false,sourceEdition:null,sourceCoverageVerified:false};
}

const safeError=e=>/^in-[a-z-]+$/.test(e?.message)?e.message:'network-or-parser-error';
async function inspect(url,mime,profiler,fetcher){
  const r=await fetchBoundedOfficialResponse(url,{allowedHosts:HOSTS,fetcher,maxBytes:P.limits.max_response_bytes});
  const record={...r.metadata,observedAt:new Date().toISOString(),byteLength:r.bytes?.length??0,responseDigest:r.bytes?sourceDigest(r.bytes):null};
  if(!r.bytes)return {...record,status:'http-error'};
  if((r.metadata.contentType??'').split(';')[0].trim().toLowerCase()!==mime)return {...record,status:'unexpected-mime'};
  if(!profiler)return {...record,status:'catalog-response-not-assignment-reviewed'};
  try{return {...record,status:'profiled-not-assignment-data',profile:profiler(r.bytes)};}catch(e){return {...record,status:'parser-error',error:safeError(e)};}
}
export async function inspectInSources(fetcher=fetch){
  const result={schemaVersion:'postal-context-in-source-review/v1',countryCode:'IN',observedAt:new Date().toISOString(),portals:[],references:[],
    sourceRowsPersisted:0,sourceSnapshotsRetained:0,assignmentRowsValidated:0,assignmentQuality:{missingPinRate:null,duplicateOfficeRate:null,invalidPinRate:null,reason:'no-current-assignment-rows-acquired'},
    catalogProbeRequests:0,authenticatedRequests:0,bulkDownloads:0,thirdPartyLookupRequests:0,locationQueries:0,publishedDataArtifacts:0,paidOperations:0,
    credentialValuesPersisted:false,contractAcceptancePerformed:false,realAgidRuntimeVerified:false,countryM2Achieved:false};
  const attempt=async(url,mime,profiler)=>{try{return await inspect(url,mime,profiler,fetcher);}catch(e){return {requestedUrl:url,status:'fetch-error',error:safeError(e),observedAt:new Date().toISOString()};}};
  for(const p of P.portal_probes)result.portals.push({id:p.id,...await attempt(p.url,'text/html',b=>profileInPortal(b,p.marker))});
  result.godl=await attempt(P.godl_url,'text/html',profileInGodl);
  result.swagger=await attempt(P.swagger.url,'application/json',profileInSwagger);
  if(result.swagger.profile){
    const u=new URL(P.swagger.keyless_probe_url);
    if(u.hostname!==P.swagger.host||u.pathname!==P.swagger.path||u.search!=='?format=json&limit=1'||P.limits.max_catalog_requests!==1||P.limits.catalog_limit!==1)throw Error('in-keyless-query-budget');
    result.catalogProbeRequests++;result.keylessCatalog=await attempt(u.href,'application/json',null);
  }
  for(const ref of P.references){try{result.references.push({...await probeOfficialReference(ref,HOSTS,fetcher),observedAt:new Date().toISOString()});}
    catch(e){result.references.push({id:ref.id,requestedUrl:ref.url,status:'fetch-error',contentVerified:false,error:safeError(e),observedAt:new Date().toISOString()});}}
  result.completedAt=new Date().toISOString();return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--report')throw Error('usage: node scripts/inspect-postal-context-in-sources.mjs --report new.json');
 const path=resolve(args[1]);if(existsSync(path))throw Error('report-already-exists');
 const report=await inspectInSources();mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({country:'IN',portals:report.portals.map(p=>({id:p.id,http:p.httpStatus,blockReasons:p.profile?.blockReasons??p.status})),godlComplete:report.godl.profile?.legalTextComplete,
 apiKeyRequired:report.swagger.profile?.apiKeyRequired,keylessHttp:report.keylessCatalog?.httpStatus,references:report.references.map(r=>({id:r.id,status:r.status})),countryM2Achieved:false}));
}
