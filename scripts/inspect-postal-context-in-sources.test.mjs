import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {inspectInSources,profileInPortal,profileInGodl,profileInSwagger} from './inspect-postal-context-in-sources.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/in/postal-context/m2-source-review.json',import.meta.url))),s=P.swagger;
const b=s=>Buffer.from(s),json=d=>b(JSON.stringify(d)),html=(body,head='')=>b(`<html><head>${head}</head><body>${body}</body></html>`);
const spec=()=>({swagger:'2.0',info:{title:s.title,version:null,license:{name:s.license_name,url:s.license_url},contact:{email:'PRIVATE@example.invalid'}},host:s.host,basePath:'/',schemes:['https'],paths:{[s.path]:{get:{parameters:[
 {name:'api-key',in:'query',required:true,type:'string',default:'SYNTHETIC-KEY-DO-NOT-USE'}, {name:'format',in:'query',required:true,type:'string'},
 ...['offset','limit'].map(name=>({name,in:'query',required:false,type:'integer'})),...Object.entries(s.filters).map(([name,type])=>({name:`filters[${name}]`,in:'query',required:false,type}))],responses:{200:{},400:{},403:{}}}}}});

test('IN cannot accept an HTTP-200-like sandbox body with the correct title and licence footer',()=>{
 const p=profileInPortal(html('All India Pincode Directory Government Open Data License This is a sandbox environment Last updated 01/01/1970 - 05:30:00'),'All India Pincode Directory');
 assert.equal(p.expectedBodyMarkerPresent,true);assert.equal(p.referenceTextComplete,false);assert.deepEqual(p.blockReasons,['sandbox-banner','epoch-footer-placeholder']);assert.equal(p.completeAssignmentVerified,false);
});
test('IN ignores scripts, head, style, comments and template payloads when checking body evidence',()=>{
 const p=profileInPortal(html('<script>All India Pincode Directory</script><style>All India Pincode Directory</style><!-- All India Pincode Directory --><template>All India Pincode Directory</template>','<title>All India Pincode Directory</title>'),'All India Pincode Directory');
 assert.equal(p.expectedBodyMarkerPresent,false);assert.deepEqual(p.blockReasons,['missing-body-marker']);
});
test('IN catalog dates are calendar-checked DD/MM/YYYY metadata, never assignment validity',()=>{
 const p=profileInPortal(html('All India Pincode Directory Published On: 04/12/2020 Updated On: 03/10/2025 No Result Found...'),'All India Pincode Directory');
 assert.equal(p.catalogPublishedDate,'2020-12-04');assert.equal(p.catalogUpdatedDate,'2025-10-03');assert.equal(p.datesAreAssignmentValidity,false);assert.equal(p.assignmentEdition,null);assert.equal(p.noResultPlaceholderPresent,true);
 assert.equal(profileInPortal(html('PIN Updated On: 31/02/2026'),'PIN').catalogUpdatedDate,null);
});
test('IN static download links are only counts, never fetched or an artifact evidence gate',()=>{
 const p=profileInPortal(html('PIN <a href="https://www.data.gov.in/synthetic.csv">download</a><a href="https://unapproved.invalid/private.csv">other</a><a href="https://www.data.gov.in/private.zip?api-key=SYNTHETIC">restricted</a><a href="javascript:alert(1)">x</a>'),'PIN');
 assert.equal(p.staticDirectDataLinkCount,1);assert.equal(p.referenceTextComplete,true);assert.equal(p.completeAssignmentVerified,false);assert.equal(p.exactArtifactRightsBound,false);assert.ok(!JSON.stringify(p).includes('SYNTHETIC'));
});
test('IN requires real GODL clauses rather than the footer, without granting dataset rights',()=>{
 assert.equal(profileInGodl(html('Government Open Data License - India')).legalTextComplete,false);
 assert.equal(profileInGodl(html(P.godl_clauses.join(' '))).legalTextComplete,false);
 const p=profileInGodl(html(P.godl_clauses.join(' ')+' worldwide, royalty-free, non-exclusive license must acknowledge the provider, source, and license must not indicate or suggest not liable for any errors or omissions do not guarantee the continued supply does not cover the following kinds of data Personal Information rights under this license to end automatically governed by Indian law'));
 assert.equal(p.legalTextComplete,true);assert.equal(p.attributionRequired,true);assert.equal(p.personalInformationExcluded,true);assert.equal(p.exactDatasetLicenseBound,false);assert.equal(p.licenseEffectiveDate,null);
 assert.equal(profileInGodl(html(P.godl_clauses.join(' ')+' This is a sandbox environment')).legalTextComplete,false);
});
test('IN Swagger exports allowlisted evidence, never default credentials or publisher contacts',()=>{
 const p=profileInSwagger(json(spec()));assert.equal(p.apiKeyRequired,true);assert.equal(p.defaultCredentialValuePresent,true);assert.equal(p.parameterCount,15);assert.equal(p.queryFilterCount,11);
 assert.equal(p.pinFilterType,'number');assert.equal(p.pinResponseTypeVerified,false);assert.equal(p.pinStorageType,'six-digit-string');assert.equal(p.apiSpecificationVersion,null);assert.equal(p.catalogRouteIsAssignmentSnapshot,false);
 assert.doesNotMatch(JSON.stringify(p),/SYNTHETIC-KEY|PRIVATE@/);
});
test('IN Swagger refuses host/path/licence/parameter drift instead of discovering arbitrary endpoints',()=>{
 const ds=[];let d=spec();d.host='unapproved.invalid';ds.push(d);d=spec();d.paths['/other']=d.paths[s.path];ds.push(d);d=spec();d.info.license.url='https://unapproved.invalid';ds.push(d);
 d=spec();d.paths[s.path].get.parameters[0].required=false;ds.push(d);d=spec();d.paths[s.path].get.parameters.push({name:'owner',in:'query',type:'string'});ds.push(d);
 d=spec();d.paths[s.path].get.parameters.find(p=>p.name==='filters[pincode]').type='integer';ds.push(d);
 for(const value of ds)assert.throws(()=>profileInSwagger(json(value)),/in-/);
});
test('IN parsers bound bytes and UTF8, reject malformed JSON and duplicate parameters',()=>{
 for(const bytes of [b(''),Buffer.alloc(P.limits.max_response_bytes+1),Buffer.from([0xff])])assert.throws(()=>profileInPortal(bytes,'PIN'),/in-/);
 assert.throws(()=>profileInSwagger(b('not json')),/in-invalid-json/);const d=spec();d.paths[s.path].get.parameters[1]=d.paths[s.path].get.parameters[0];assert.throws(()=>profileInSwagger(json(d)),/in-swagger-parameters/);
});
test('IN preflight never sends a key/default, follows bulk links or treats failed access as empty data',async()=>{
 const calls=[];const r=await inspectInSources(async(url,options)=>{calls.push(url);assert.equal(options.redirect,'manual');assert.ok(!new URL(url).searchParams.has('api-key'));
  if(url===s.url)return new Response(json(spec()),{headers:{'content-type':'application/json'}});
  if(url===s.keyless_probe_url)return new Response('PRIVATE-ERROR',{status:400,headers:{'content-type':'application/json'}});
  return new Response(html('This is a sandbox environment'),{headers:{'content-type':'text/html'}});
 });
 assert.equal(calls.length,12);assert.equal(r.catalogProbeRequests,1);assert.equal(r.keylessCatalog.httpStatus,400);assert.equal(r.keylessCatalog.responseDigest,null);
 assert.equal(r.assignmentQuality.missingPinRate,null);assert.equal(r.assignmentRowsValidated,0);assert.equal(r.countryM2Achieved,false);assert.equal(r.authenticatedRequests,0);assert.equal(r.bulkDownloads,0);
 assert.doesNotMatch(JSON.stringify(r),/PRIVATE-ERROR|SYNTHETIC-KEY|PRIVATE@/);
});
test('IN unavailable or malformed Swagger stops the dependent catalog request and sanitizes errors',async()=>{
 const r=await inspectInSources(async url=>{if(url===s.url)return new Response(json({secret:'PRIVATE'}),{headers:{'content-type':'application/json'}});throw Error('SYNTHETIC-SECRET');});
 assert.equal(r.catalogProbeRequests,0);assert.equal(r.swagger.status,'parser-error');assert.equal(r.keylessCatalog,undefined);assert.doesNotMatch(JSON.stringify(r),/PRIVATE|SYNTHETIC-SECRET/);
});
test('IN refuses unapproved redirects and unexpected MIME without claiming successful reference data',async()=>{
 const calls=[];const r=await inspectInSources(async url=>{calls.push(url);return new Response(null,{status:302,headers:{location:'https://unapproved.invalid/'}});});
 assert.ok(calls.every(u=>new URL(u).hostname!=='unapproved.invalid'));assert.equal(r.swagger.status,'fetch-error');assert.equal(r.catalogProbeRequests,0);assert.equal(r.countryM2Achieved,false);
 const r2=await inspectInSources(async()=>new Response('{}',{headers:{'content-type':'application/json'}}));assert.equal(r2.portals[0].status,'unexpected-mime');
});
