import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {createIqWindowsFetcher,inspectIqSources,profileIqApiDocs,profileIqArcgisItem,profileIqCatalogSearch,profileIqDiscovery,profileIqPolicy} from './inspect-postal-context-iq-sources.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/iq/postal-context/m2-source-review.json',import.meta.url)));
const bytes=x=>Buffer.from(JSON.stringify(x));
const license={name:'CC BY 4.0',url:'https://creativecommons.org/licenses/by/4.0/'};
const search=()=>({success:true,data:[],meta:{page:1,page_size:5,total:0,total_pages:0},links:{prev:null,next:null},license:{...license}});
const discovery=()=>({success:true,license:{...license},data:{name:'NOGP Open Data API',version:'v1',status:'ok',totals:{datasets:41,resources:88,organizations:17,categories:7},limits:{requests_per_minute:30,requests_per_day:2000,max_page_size:50},endpoints:{search:'http://nogp.gov.iq/api/v1/search?q='}}});
const item=()=>({id:P.arcgis_items[0].item_id,type:'StoryMap',title:'Iraqi Postal Code ',owner:'fatima_atlasgis',access:'public',created:1737967854000,modified:1751539892000,licenseInfo:null,accessInformation:null});
test('IQ empty catalogue is not proof of absent national data or perfect quality',()=>{
 const p=profileIqCatalogSearch(bytes(search()));assert.equal(p.observedCatalogRows,0);assert.equal(p.reportedMatchingDatasets,0);assert.equal(p.missingOrInvalidIdRate,null);
 assert.equal(p.noMatchesProveNationalAbsence,false);assert.equal(p.fullCatalogScanned,false);assert.equal(p.assignmentRowsValidated,0);
});
test('IQ catalogue checks bounded count and pagination contracts',()=>{
 for(const mutate of [d=>d.meta.page=2,d=>d.meta.page_size=50,d=>d.meta.total=-1,d=>d.meta.total_pages=1,d=>d.links.next='https://evil.test',d=>d.success=false,d=>d.license.name='unknown']){
  const d=search();mutate(d);assert.throws(()=>profileIqCatalogSearch(bytes(d)),/^Error: iq-/);
 }
 const d=search();d.data=Array.from({length:6},()=>({id:1}));d.meta.total=6;d.meta.total_pages=2;assert.throws(()=>profileIqCatalogSearch(bytes(d)),/iq-search-shape/);
});
test('IQ positive catalogue hits require manual review and export no names, rows or download links',()=>{
 const d=search();d.data=[{id:3,name:'PRIVATE@example.test',download_url:'https://evil.test'},{id:3},{id:'4'}];d.meta.total=3;d.meta.total_pages=1;
 const p=profileIqCatalogSearch(bytes(d));assert.equal(p.positiveHitsRequireManualReview,true);assert.equal(p.excessDuplicateIds,1);assert.equal(p.missingOrInvalidIdRate,1/3);
 assert.equal(p.assignmentRowsValidated,0);assert.doesNotMatch(JSON.stringify(p),/PRIVATE|evil|download_url/);
});
test('IQ discovery counts and HTTP advertisement do not authorize downloads or establish coverage',()=>{
 const p=profileIqDiscovery(bytes(discovery()));assert.equal(p.reportedTotals.datasets,41);assert.equal(p.advertisedUrlsFollowed,false);assert.equal(p.reportedTotalsArePostalCoverage,false);
 for(const mutate of [d=>d.data.name='Other API',d=>d.data.totals.datasets='41',d=>d.data.limits.max_page_size=1,d=>d.data.endpoints.search='https://evil.test']){const d=discovery();mutate(d);assert.throws(()=>profileIqDiscovery(bytes(d)),/^Error: iq-/);}
});
test('IQ API and policy text must be substantive rather than headings or script-only markers',()=>{
 assert.equal(profileIqApiDocs(Buffer.from('<h1>Developer API</h1>')).documentationVerified,false);
 assert.equal(profileIqPolicy(Buffer.from('<h1>Policies</h1>')).legalSummaryVerified,false);
 const policy='reuse and redistribution of government data; data protection, privacy, and information security; all public data and information produced by government entities; reviewed at least annually';
 assert.equal(profileIqPolicy(Buffer.from('<p>'+policy+'</p>')).legalSummaryVerified,true);
 assert.equal(profileIqPolicy(Buffer.from('<script>'+policy+'</script>')).legalSummaryVerified,false);
 assert.equal(profileIqPolicy(Buffer.from('<p>'+policy+'</p>')).exactPostalArtifactRightsBound,false);
});
test('IQ public StoryMap metadata is not an official deployed postal system or a rights grant',()=>{
 const p=profileIqArcgisItem(bytes(item()),P.arcgis_items[0]);assert.equal(p.expectedOwnerMatches,true);assert.equal(p.licenseFieldState,'null');
 for(const key of ['officialAssignmentAuthorityVerified','officialDeploymentVerified','itemDataFetched','itemTimestampsAreAssignmentValidity','exactRightsReviewed'])assert.equal(p[key],false);
 const d=item();d.licenseInfo='<p>CC BY 4.0</p>';d.accessInformation='PRIVATE@example.test';const q=profileIqArcgisItem(bytes(d),P.arcgis_items[0]);
 assert.equal(q.licenseFieldState,'present-unreviewed');assert.equal(q.exactRightsReviewed,false);assert.doesNotMatch(JSON.stringify(q),/PRIVATE/);
});
test('IQ ArcGIS date, identity and drift checks fail closed without exposing unexpected text',()=>{
 for(const mutate of [d=>d.id='wrong',d=>d.type='Feature Service',d=>d.modified=-1,d=>d.created=d.modified+1,d=>d.modified=Date.now()+86400000,d=>d.licenseInfo={},d=>delete d.accessInformation]){const d=item();mutate(d);assert.throws(()=>profileIqArcgisItem(bytes(d),P.arcgis_items[0]),/^Error: iq-/);}
 const d=item();d.owner='changed';d.title='PRIVATE@example.test';const p=profileIqArcgisItem(bytes(d),P.arcgis_items[0]);assert.equal(p.expectedOwnerMatches,false);assert.equal(p.expectedTitleMatches,false);assert.doesNotMatch(JSON.stringify(p),/PRIVATE/);
});
test('IQ rejects malformed JSON, UTF-8 and oversized metadata',()=>{
 for(const b of [Buffer.from('{'),Buffer.from([255]),Buffer.alloc(P.limits.max_response_bytes+1)])assert.throws(()=>profileIqCatalogSearch(b),/^Error: iq-/);
});
test('IQ Windows adapter allows only exact public NOGP URLs and never constructs shell commands',async()=>{
 const calls=[];const run=async(cmd,args)=>{calls.push({cmd,args});return {stdout:JSON.stringify({status:200,headers:{'content-type':'application/json'},bodyBase64:bytes(search()).toString('base64')})};};
 const f=createIqWindowsFetcher(run,async()=>new Response('fallback'));
 for(const u of ['http://nogp.gov.iq/ApiDocs.aspx','https://nogp.gov.iq/api/v1/resources/212/download','https://user@nogp.gov.iq/ApiDocs.aspx','https://nogp.gov.iq/ApiDocs.aspx?key=SECRET'])await assert.rejects(()=>f(u),/iq-windows-url-not-approved/);
 assert.equal(calls.length,0);assert.equal((await f(P.nogp.searches[0].url)).status,200);assert.equal(calls.length,1);assert.ok(calls[0].args.includes('-File'));assert.ok(!calls[0].args.includes('-Command'));
 assert.equal(await (await f('https://post.iq/')).text(),'fallback');
 const ps=readFileSync(new URL('./lib/postal-context-iq-windows-fetch.ps1',import.meta.url),'utf8');
 assert.doesNotMatch(ps,/SkipCertificateCheck|ServerCertificateCustomValidationCallback|SecurityProtocol|ExecutionPolicy|Invoke-Expression/);
 for(const marker of ['AllowAutoRedirect = $false','UseCookies = $false','UseDefaultCredentials = $false','2097152'])assert.ok(ps.includes(marker));
});
test('IQ Windows adapter validates envelopes without persisting response bodies',async()=>{
 for(const response of [{status:200,headers:{},bodyBase64:'invalid!'},{status:0,headers:{},bodyBase64:''},{status:200,headers:null,bodyBase64:''}]){
  const f=createIqWindowsFetcher(async()=>({stdout:JSON.stringify(response)}));await assert.rejects(()=>f(P.nogp.policy_url),/iq-windows-response/);
 }
});
test('IQ failed reference and discovery responses never trigger searches, downloads or M2',async()=>{
 const calls=[];const r=await inspectIqSources(async url=>{calls.push(url);return new Response('do not persist this body',{status:403,headers:{'content-type':'text/html'}});});
 assert.equal(r.catalogSearchRequests,0);assert.equal(r.arcgisMetadataRequests,2);assert.equal(r.assignmentQuality.invalidCodeRate,null);assert.equal(r.countryM2Achieved,false);
 assert.ok(calls.every(u=>!u.includes('/download')&&!u.includes('/data?')&&!u.includes('platform')));assert.doesNotMatch(JSON.stringify(r),/do not persist/);
});
