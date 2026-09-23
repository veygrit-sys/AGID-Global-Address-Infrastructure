import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,probeOfficialReference,sourceDigest} from './lib/postal-context-source-probe.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/iq/postal-context/m2-source-review.json',import.meta.url)));
const HOSTS=new Set(['post.iq','app.post.iq','nogp.gov.iq','igp.ur.gov.iq','cosit.gov.iq','govinfo.library.unt.edu','www.upu.int','www.arcgis.com']);
const WINDOWS_URLS=new Set(['https://nogp.gov.iq/',P.nogp.policy_url,P.nogp.documentation_url,P.nogp.discovery_url,...P.nogp.searches.map(s=>s.url)]);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const decode=bytes=>{if(!bytes.length||bytes.length>P.limits.max_response_bytes)throw Error('iq-byte-limit');try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw Error('iq-invalid-utf8');}};
const json=bytes=>{try{return JSON.parse(decode(bytes));}catch(e){if(/^iq-/.test(e.message))throw e;throw Error('iq-invalid-json');}};
const plain=bytes=>decode(bytes).replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head|template)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const has=(s,phrase)=>s.toLowerCase().includes(phrase.toLowerCase());
function license(d){if(!object(d)||d.success!==true||d.license?.name!==P.nogp.license_name||d.license?.url!==P.nogp.license_url)throw Error('iq-catalog-envelope-or-license');}

export function profileIqPolicy(bytes){
 const text=plain(bytes),clauses=['reuse and redistribution of government data','data protection, privacy, and information security','all public data and information produced by government entities','reviewed at least annually'];
 return {clauseChecks:clauses.map(c=>({clause:c,present:has(text,c)})),legalSummaryVerified:clauses.every(c=>has(text,c)),policyEffectiveDate:null,
  attachmentReviewed:false,exactPostalArtifactRightsBound:false,assignmentRowsValidated:0};
}
export function profileIqApiDocs(bytes){
 const text=plain(bytes),clauses=['read-only and needs no registration and no API key','at least one file approved by a System Administrator','Data retrieved through this API is published under CC BY 4.0','including commercially, provided you credit the source','has_license_document is true, check the dataset page'];
 return {clauseChecks:clauses.map(c=>({clause:c,present:has(text,c)})),documentationVerified:clauses.every(c=>has(text,c)),apiKeyRequired:false,
  declaredLicenseName:P.nogp.license_name,declaredLicenseUrl:P.nogp.license_url,individualFileTermsMustBeReviewed:true,exactPostalArtifactRightsBound:false,
  advertisedHttpBase:has(text,'http://nogp.gov.iq/api/v1'),httpLinksFollowed:false,assignmentRowsValidated:0};
}
export function profileIqDiscovery(bytes){
 const d=json(bytes);license(d);const v=d.data;
 if(!object(v)||v.name!=='NOGP Open Data API'||v.version!=='v1'||v.status!=='ok'||!object(v.totals)||!object(v.limits)||!object(v.endpoints))throw Error('iq-discovery-identity');
 for(const k of ['datasets','resources','organizations','categories'])if(!integer(v.totals[k]))throw Error('iq-discovery-counts');
 for(const k of ['requests_per_minute','requests_per_day','max_page_size'])if(!integer(v.limits[k])||v.limits[k]<1)throw Error('iq-discovery-limits');
 if(v.limits.max_page_size<P.limits.catalog_page_size||v.endpoints.search!=='http://nogp.gov.iq/api/v1/search?q=')throw Error('iq-discovery-contract-changed');
 return {apiVersion:v.version,reportedTotals:Object.fromEntries(['datasets','resources','organizations','categories'].map(k=>[k,v.totals[k]])),
  limits:Object.fromEntries(['requests_per_minute','requests_per_day','max_page_size'].map(k=>[k,v.limits[k]])),declaredLicenseName:d.license.name,
  declaredLicenseUrl:d.license.url,advertisedSearchUsesHttp:true,advertisedUrlsFollowed:false,reportedTotalsArePostalCoverage:false,assignmentRowsValidated:0};
}
export function profileIqCatalogSearch(bytes){
 const d=json(bytes);license(d);const m=d.meta,n=d.data?.length;
 if(!Array.isArray(d.data)||n>P.limits.catalog_page_size||!object(m)||m.page!==1||m.page_size!==P.limits.catalog_page_size||!integer(m.total)||m.total<n
  ||m.total_pages!==Math.ceil(m.total/m.page_size)||!object(d.links)||d.links.prev!==null||n!==Math.min(m.total,m.page_size))throw Error('iq-search-shape');
 if(n===0&&d.links.next!==null)throw Error('iq-search-empty-next');
 if(d.data.some(row=>!object(row)))throw Error('iq-search-row-shape');
 const missingIds=d.data.filter(row=>!integer(row.id)||row.id<1).length;
 const ids=d.data.filter(row=>integer(row.id)&&row.id>0).map(row=>row.id);
 return {observedCatalogRows:n,reportedMatchingDatasets:m.total,page:m.page,pageSize:m.page_size,totalPages:m.total_pages,missingOrInvalidIdRows:missingIds,
  missingOrInvalidIdRate:n?missingIds/n:null,excessDuplicateIds:ids.length-new Set(ids).size,declaredLicenseName:d.license.name,
  nextLinkFollowed:false,positiveHitsRequireManualReview:n>0,fullCatalogScanned:false,noMatchesProveNationalAbsence:false,assignmentRowsValidated:0,sourceRowsPersisted:0};
}
export function profileIqArcgisItem(bytes,expected,now=Date.now()){
 const d=json(bytes);
 if(!P.arcgis_items.some(x=>x.item_id===expected.item_id)||!object(d)||d.id!==expected.item_id||d.type!==expected.type)throw Error('iq-arcgis-identity');
 if(!integer(d.created)||!integer(d.modified)||d.created>d.modified||d.modified>now)throw Error('iq-arcgis-time');
 if(typeof d.title!=='string'||typeof d.owner!=='string'||!['public','private','org','shared'].includes(d.access))throw Error('iq-arcgis-fields');
 for(const key of ['licenseInfo','accessInformation'])if(d[key]!==null&&typeof d[key]!=='string')throw Error('iq-arcgis-rights-field');
 const state=value=>value===null?'null':value.trim()===''?'empty':'present-unreviewed';
 return {itemId:d.id,itemType:d.type,expectedTitleMatches:d.title.trim()===expected.expected_title,expectedOwnerMatches:d.owner===expected.expected_owner,
  access:d.access,createdAt:new Date(d.created).toISOString(),modifiedAt:new Date(d.modified).toISOString(),itemTimestampsAreAssignmentValidity:false,
  licenseFieldState:state(d.licenseInfo),accessInformationFieldState:state(d.accessInformation),exactRightsReviewed:false,
  officialAssignmentAuthorityVerified:false,officialDeploymentVerified:false,itemDataFetched:false,geometryRecords:0,assignmentRowsValidated:0};
}

export function createIqWindowsFetcher(run=promisify(execFile),fallback=fetch){
 return async(url,options)=>{
  if(new URL(url).hostname!=='nogp.gov.iq')return fallback(url,options);
  if(!WINDOWS_URLS.has(url))throw Error('iq-windows-url-not-approved');
  const file=fileURLToPath(new URL('./lib/postal-context-iq-windows-fetch.ps1',import.meta.url));
  const {stdout}=await run('C:/Program Files/PowerShell/7/pwsh.exe',['-NoProfile','-NonInteractive','-File',file,'-Url',url],{encoding:'utf8',maxBuffer:4*1024*1024,timeout:30000,windowsHide:true});
  const d=JSON.parse(stdout);
  if(!object(d)||!Number.isInteger(d.status)||d.status<200||d.status>599||!object(d.headers)||typeof d.bodyBase64!=='string'||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(d.bodyBase64))throw Error('iq-windows-response');
  const bytes=Buffer.from(d.bodyBase64,'base64');if(bytes.length>P.limits.max_response_bytes)throw Error('iq-byte-limit');
  return new Response([204,205,304].includes(d.status)?null:bytes,{status:d.status,headers:d.headers});
 };
}
const safeError=e=>/^iq-[a-z-]+$/.test(e?.message)?e.message:e?.cause?.code==='UNABLE_TO_VERIFY_LEAF_SIGNATURE'?'tls-chain-unverified':'network-or-parser-error';
async function inspect(url,mime,profiler,fetcher){
 const r=await fetchBoundedOfficialResponse(url,{allowedHosts:HOSTS,fetcher,maxBytes:P.limits.max_response_bytes});
 const base={...r.metadata,observedAt:new Date().toISOString(),byteLength:r.bytes?.length??0,responseDigest:r.bytes?sourceDigest(r.bytes):null};
 if(!r.bytes)return {...base,status:'http-error'};
 if((r.metadata.contentType??'').split(';')[0].trim().toLowerCase()!==mime)return {...base,status:'unexpected-mime'};
 try{return {...base,status:'profiled-not-assignment-data',profile:profiler(r.bytes)};}catch(e){return {...base,status:'parser-error',error:safeError(e)};}
}
export async function inspectIqSources(fetcher=fetch,transport='node-default-tls'){
 const result={schemaVersion:'postal-context-iq-source-review/v1',countryCode:'IQ',observedAt:new Date().toISOString(),transport,references:[],catalogSearches:[],arcgisItems:[],
  assignmentRowsValidated:0,assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,invalidCodeRate:null,reason:'no-current-assignment-rows-acquired'},
  catalogSearchRequests:0,arcgisMetadataRequests:0,sourceRowsPersisted:0,sourceDataSnapshotsRetained:0,authenticatedRequests:0,bulkDownloads:0,
  privatePlatformRequests:0,locationQueries:0,publishedDataArtifacts:0,paidOperations:0,tlsVerificationDisabled:false,httpDowngradePerformed:false,
  contractAcceptancePerformed:false,realAgidRuntimeVerified:false,countryM2Achieved:false};
 const attempt=async(url,mime,profiler)=>{try{return await inspect(url,mime,profiler,fetcher);}catch(e){return {requestedUrl:url,observedAt:new Date().toISOString(),status:'fetch-error',error:safeError(e)};}};
 for(const ref of P.reference_probes){try{result.references.push({...await probeOfficialReference(ref,HOSTS,fetcher),observedAt:new Date().toISOString()});}
  catch(e){result.references.push({id:ref.id,requestedUrl:ref.url,observedAt:new Date().toISOString(),status:'fetch-error',error:safeError(e),contentVerified:false});}}
 result.policy=await attempt(P.nogp.policy_url,'text/html',profileIqPolicy);
 result.apiDocumentation=await attempt(P.nogp.documentation_url,'text/html',profileIqApiDocs);
 result.discovery=await attempt(P.nogp.discovery_url,'application/json',profileIqDiscovery);
 if(result.apiDocumentation.profile?.documentationVerified&&result.discovery.profile){
  if(P.nogp.searches.length!==3||P.limits.max_catalog_search_requests!==3)throw Error('iq-query-budget');
  for(const s of P.nogp.searches){result.catalogSearchRequests++;result.catalogSearches.push({term:s.term,...await attempt(s.url,'application/json',profileIqCatalogSearch)});}
 }
 if(P.arcgis_items.length!==2||P.limits.max_arcgis_metadata_requests!==2)throw Error('iq-item-budget');
 for(const item of P.arcgis_items){result.arcgisMetadataRequests++;result.arcgisItems.push({id:item.id,...await attempt(item.url,'application/json',b=>profileIqArcgisItem(b,item))});}
 result.completedAt=new Date().toISOString();return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),windows=args[0]==='--windows-tls';if(windows)args.shift();
 if(args.length!==2||args[0]!=='--report')throw Error('usage: node scripts/inspect-postal-context-iq-sources.mjs [--windows-tls] --report new.json');
 if(windows&&process.platform!=='win32')throw Error('iq-windows-platform-required');
 const path=resolve(args[1]);if(existsSync(path))throw Error('report-already-exists');
 const r=await inspectIqSources(windows?createIqWindowsFetcher():fetch,windows?'windows-dotnet-default-tls-for-nogp; node-default-tls-for-other-hosts':'node-default-tls');
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(r,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({country:'IQ',references:r.references.map(x=>({id:x.id,status:x.status})),policy:r.policy.status,apiDocs:r.apiDocumentation.profile?.documentationVerified,
  discovery:r.discovery.profile,catalogSearches:r.catalogSearches.map(x=>({term:x.term,status:x.status,profile:x.profile})),arcgisItems:r.arcgisItems.map(x=>({id:x.id,status:x.status,profile:x.profile})),countryM2Achieved:false}));
}
