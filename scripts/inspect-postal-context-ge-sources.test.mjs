import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { profileGePostalResult, parseGeNsdiPage, profileGeNsdiTerms, profileGeNsdiCatalog, profileGeResourceLicense, inspectGeSources } from './inspect-postal-context-ge-sources.mjs';
const profile=JSON.parse(readFileSync(new URL('../data/postal_country_packs/ge/postal-context/m2-source-review.json',import.meta.url)));
const bytes=s=>Buffer.from(s);
const heading=label=>`<div class="com-district com-cl-pal-02">${label}</div>`;
const card=(code,label,hidden=false)=>`<div data-grid-cell="" ${hidden?'data-card-visibility="gone" ':''}class="com-cell-postcode${hidden?' com-hide':''}"><div class="com-pad"><div class="com-postcode-name com-cl-pal-02">${code}</div><div class="com-location-name">${label}</div></div></div>`;
const result=heading('SYNTHETIC GROUP')+card('0007','SYNTHETIC ROAD 1')+card('0007','SYNTHETIC ROAD 1',true)+card('0012','SYNTHETIC ROAD 2',true);
const page=(component,props)=>bytes('<div data-page="'+JSON.stringify({component,props}).replaceAll('&','&amp;').replaceAll('"','&quot;')+'"></div>');
const entries=profile.nsdi_probe.resources.map(r=>({id:r.id,label:r.label,identifier:r.identifier,downloadUrl:null}));
const catalog=()=>({themes:{national:[{children:entries}],inspire:[{children:[entries[0]]}]},totalPublishedCount:3});
const termProps=()=>({terms:{id:1,content:profile.nsdi_probe.terms_markers.join('<p>')}});

test('GE result profiler preserves leading zeroes and includes cards hidden by show-more UI',()=>{
  const p=profileGePostalResult(bytes(result));
  assert.equal(p.observedRows,3);assert.equal(p.distinctCodes,2);assert.equal(p.leadingZeroRows,3);assert.equal(p.initiallyHiddenRows,2);
  assert.equal(p.excessDuplicateComparisonRows,1);assert.equal(p.duplicateExcessRate,1/3);assert.deepEqual(p.groupSizes,[3]);
  assert.equal(p.numericLocatorLabelRows,3);assert.equal(p.exactCivicAddressRelations,0);assert.equal(p.exactBuildingRelations,0);
  assert.equal(p.geometryType,'none');assert.equal(p.sourceRowsPersisted,0);assert.equal(p.rowsDeduplicated,0);
  assert.ok(!JSON.stringify(p).includes('SYNTHETIC ROAD'));assert.ok(!JSON.stringify(p).includes('0007'));
});
test('GE reports missing and malformed codes rather than correcting or inventing assignments',()=>{
  const p=profileGePostalResult(bytes(heading('A')+card('','')+card('12345','B')+card('00X1','C')));
  assert.equal(p.missingCodeRows,1);assert.equal(p.missingLocationRows,1);assert.equal(p.invalidCodeRows,2);assert.equal(p.codesInferred,0);
  assert.equal(p.missingCodeRate,1/3);assert.equal(p.invalidCodeRate,2/3);
});
test('GE comparison grain includes heading and location; one location can have multiple codes',()=>{
  const p=profileGePostalResult(bytes(heading('A')+card('0001','SYNTHETIC')+card('0002','SYNTHETIC')+heading('B')+card('0001','SYNTHETIC')));
  assert.equal(p.groupCount,2);assert.equal(p.distinctGroupLocationLabels,2);assert.equal(p.labelsWithMultipleCodes,1);assert.equal(p.excessDuplicateComparisonRows,0);
});
test('GE rejects partial card parsing, changed classes and an ungrouped card',()=>{
  for(const s of [result.replace('com-location-name','unknown-class'),result+card('0001','<b>nested</b>'),card('0001','X'),'<form>'+result+'</form>','<iframe></iframe>'+result])assert.throws(()=>profileGePostalResult(bytes(s)),/ge-/);
});
test('GE rejects undecodable, oversized or overlong input and zero-card ambiguity',()=>{
  for(const b of [Buffer.from([255]),Buffer.alloc(4194305),bytes(heading('A')+card('0001','x'.repeat(4001))),bytes(heading('A'))])assert.throws(()=>profileGePostalResult(b),/ge-/);
});
test('GE entities are decoded once without executing markup or repairing source labels',()=>{
  assert.equal(profileGePostalResult(bytes(heading('A')+card('0001','A&nbsp;&#49;'))).numericLocatorLabelRows,1);
  for(const label of ['&unknown;','&#0;','&#xD800;','&lt;script&gt;'])assert.throws(()=>profileGePostalResult(bytes(heading('A')+card('0001',label))),/ge-/);
});
test('GE NSDI page parser requires the reviewed component and a single JSON attribute',()=>{
  assert.equal(parseGeNsdiPage(page('Terms',termProps()),'Terms').terms.id,1);
  for(const b of [page('Login',{}),bytes('<div></div>'),bytes(page('Terms',{}).toString().repeat(2)),bytes('<div data-page="broken"></div>')])assert.throws(()=>parseGeNsdiPage(b,'Terms'),/ge-/);
});
test('GE NSDI terms distinguish free viewing from resource-specific download and reuse rights',()=>{
  const p=profileGeNsdiTerms(page('Terms',termProps()));assert.equal(p.freeSearchAndView,true);assert.equal(p.blanketDataReuseLicense,false);assert.equal(p.contractAcceptancePerformed,false);
  assert.throws(()=>profileGeNsdiTerms(page('Terms',{terms:{id:1,content:'different terms'}})),/ge-nsdi-terms-drift/);
});
test('GE repeated NSDI theme memberships are not extra datasets or postal coverage',()=>{
  const p=profileGeNsdiCatalog(page('Geoportal',catalog()));assert.equal(p.themeOccurrences,4);assert.equal(p.distinctMetadataIds,3);assert.equal(p.repeatedThemeOccurrences,1);
  assert.equal(p.resources[0].themeOccurrences,2);assert.equal(p.countsArePostalCoverage,false);assert.ok(p.resources.every(r=>r.geometryFeaturesFetched===0));
});
test('GE NSDI selected-resource identities and changed download permissions fail closed for review',()=>{
  for(const mutation of [{id:999},{label:'Other'},{identifier:'other'},{downloadUrl:'https://example.test/new.zip'}]){
    const p=catalog();p.themes.national[0].children=entries.map((e,i)=>i===1?{...e,...mutation}:e);
    assert.throws(()=>profileGeNsdiCatalog(page('Geoportal',p)),/ge-nsdi-resource-drift/);
  }
});
test('GE resource licence checks require the reviewed exact bytes, not a permissive label',()=>{
  for(const id of [92,35,80]){
    assert.throws(()=>profileGeResourceLicense(bytes(JSON.stringify({license:{type:'CC0',url:null,text:'public'}})),id),/ge-resource-license-drift/);
    assert.throws(()=>profileGeResourceLicense(bytes(JSON.stringify({license:{type:profile.nsdi_probe.resources.find(r=>r.id===id).expected_license,url:null,text:'changed text'}})),id),/ge-resource-license-drift/);
  }
  assert.throws(()=>profileGeResourceLicense(bytes('{}'),999),/ge-resource-not-reviewed/);
});

const session='SYNTHETIC_ANTIFORGERY_TOKEN_ONLY';
const form=()=>bytes(`<form Id="FindPostalCodeForm" action="/Help/FindPostalCode" method="post"><input name="__RequestVerificationToken" type="hidden" value="${session}" /><input name="regionTypeId" type="hidden" value="1" /><input name="postalCodeSearchValue" /></form>`);
function fakeFetcher(calls,{brokenForm=false,badMime=false}={}){
  return async(url,options={})=>{
    calls.push({url,options});let body='',type='text/html',cookie=false;
    if(url===profile.postal_probe.form_url){body=brokenForm?form().toString().replace('/Help/FindPostalCode','https://example.test/steal'):form();cookie=true;}
    else if(url===profile.postal_probe.search_url){body=result;type=badMime?'application/json':'text/html';}
    else if(url===profile.postal_probe.legacy_url)body='<a href="/help/postal-codes">finder</a>';
    else if(url===profile.nsdi_probe.terms_url)body=page('Terms',termProps());
    else if(url===profile.nsdi_probe.portal_url)body=page('Geoportal',catalog());
    else if(profile.nsdi_probe.resources.some(r=>r.license_url===url)){body='{}';type='application/json';}
    else body=profile.reference_probes.find(r=>r.url===url)?.markers.join(' ')??'';
    return new Response(body,{status:200,headers:{'content-type':type,...(cookie?{'set-cookie':`__RequestVerificationToken=${session}; Path=/; HttpOnly`}:{})}});
  };
}
test('GE public form replay sends only its standard ephemeral CSRF session and never exports it',async()=>{
  const calls=[],report=await inspectGeSources(fakeFetcher(calls));const posts=calls.filter(c=>c.options.method==='POST');
  assert.equal(posts.length,2);assert.ok(posts.every(c=>c.url===profile.postal_probe.search_url&&c.options.redirect==='manual'));
  for(const p of posts){assert.equal(p.options.headers.Authorization,undefined);assert.equal(new URLSearchParams(p.options.body).get('regionTypeId'),'1');}
  assert.equal(report.anonymousFormSessionUsed,true);assert.equal(report.userAuthenticationPerformed,false);
  assert.equal(report.postalSearch.byteIdenticalRepeat,true);assert.equal(report.postalSearch.first.profile.observedRows,3);
  for(const value of [session,'SYNTHETIC ROAD','0007'])assert.ok(!JSON.stringify(report).includes(value));
  assert.equal(report.countryM2Achieved,false);assert.equal(report.sourceSnapshotsRetained,0);assert.equal(report.publishedDataArtifacts,0);
});
test('GE refuses an altered form target before any POST, rather than bypassing protection',async()=>{
  const calls=[],r=await inspectGeSources(fakeFetcher(calls,{brokenForm:true}));assert.equal(calls.filter(c=>c.options.method==='POST').length,0);
  assert.equal(r.postalSearch.error,'ge-form-contract-drift');assert.equal(r.anonymousFormSessionUsed,false);
});
test('GE rejects wrong search MIME without calling it source data',async()=>{
  const calls=[],r=await inspectGeSources(fakeFetcher(calls,{badMime:true}));assert.equal(r.postalSearch.error,'ge-search-mime');assert.equal(r.countryM2Achieved,false);
});
