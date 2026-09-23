import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assertBookletBytes,summarizeBookletQuality,probeBnReference} from './inspect-postal-context-bn-sources.mjs';
import {fetchBoundedOfficialResponse} from './lib/postal-context-source-probe.mjs';
const fixture=()=>({groups:{locality:{rows:438,districtPrefixCounts:{B:192,T:84,K:84,P:78}},'government-organization':{rows:94},'postal-branch':{rows:19,serialSequenceMismatches:1}}});
test('BN digest, MIME and magic checks reject changed source instead of extracting arbitrary PDF',()=>{
 assert.throws(()=>assertBookletBytes(Buffer.from('%PDF-synthetic'),'application/pdf'),/digest/);
 assert.throws(()=>assertBookletBytes(Buffer.from('<html>'),'application/pdf'),/format/);
 assert.throws(()=>assertBookletBytes(Buffer.from('%PDF-synthetic'),'text/html'),/format/);
});
test('BN mixed grain and heading differences never become a national completion claim',()=>{
 const q=summarizeBookletQuality(fixture());assert.equal(q.rowsObserved,551);assert.deepEqual(q.headingComparisons.map(c=>c.difference),[-2,2,3,3]);
 assert.equal(q.headingCountsReconciled,false);assert.equal(q.postalBranchSerialMismatches,1);assert.equal(q.currentNationalCoverageEstablished,false);assert.equal(q.rightsForPublicM2ArtifactCleared,false);assert.equal(q.sourceRowsExported,0);
});
test('BN all source kinds are mandatory and source serial gaps are not synthesized',()=>{
 const f=fixture();delete f.groups['postal-branch'];assert.throws(()=>summarizeBookletQuality(f),/table-kind/);
});
test('BN source preflight cannot follow login hosts, HTTP or credential-bearing redirects',async()=>{
 const allowedHosts=new Set(['www.skn.gov.bn']);let calls=0;
 const fetcher=async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://unapproved.example/data'}});};
 await assert.rejects(fetchBoundedOfficialResponse('https://www.skn.gov.bn/Help/Buku_Poskod_Edisi_ke2.pdf',{allowedHosts,fetcher}),/unapproved/);assert.equal(calls,1);
 for(const url of ['http://www.skn.gov.bn/','https://user:pass@www.skn.gov.bn/'])await assert.rejects(fetchBoundedOfficialResponse(url,{allowedHosts}),/unapproved/);
});

test('BN exact guide links must exist as href attributes, not merely as visible text',async()=>{
 const ref={id:'synthetic-guide',url:'https://www.skn.gov.bn/en/Home/UserGuide',mime:'text/html',markers:['Synthetic guide'],requiredLinks:['https://www.skn.gov.bn/Help/Buku_Poskod_Edisi_ke2.pdf']};
 const body='<h1>Synthetic guide</h1><a href="https://www.skn.gov.bn/Help/Buku_Poskod_Edisi_ke2.pdf">Booklet</a>';
 const good=await probeBnReference(ref,async()=>new Response(body,{headers:{'content-type':'text/html'}}));assert.equal(good.contentVerified,true);
 const bad=await probeBnReference(ref,async()=>new Response('Synthetic guide https://www.skn.gov.bn/Help/Buku_Poskod_Edisi_ke2.pdf',{headers:{'content-type':'text/html'}}));assert.equal(bad.contentVerified,false);assert.equal(bad.missingLinks.length,1);
});
test('BN linked-reference errors and MIME changes remain unverified',async()=>{
 const ref={id:'synthetic-guide',url:'https://www.skn.gov.bn/en/Home/UserGuide',mime:'text/html',markers:['Synthetic guide'],requiredLinks:[]};
 const bad=await probeBnReference(ref,async()=>new Response('Synthetic guide',{headers:{'content-type':'application/json'}}));assert.equal(bad.contentVerified,false);
 const denied=await probeBnReference(ref,async()=>new Response(null,{status:403}));assert.equal(denied.status,'http-error');assert.equal(denied.contentVerified,false);
});
