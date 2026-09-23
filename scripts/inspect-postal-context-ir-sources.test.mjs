import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {inspectIrSources,irFailureKind,profileIrReference} from './inspect-postal-context-ir-sources.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/ir/postal-context/m2-source-review.json',import.meta.url)));
const html=P.reference_probes[0],pdf=P.reference_probes.at(-1);
test('IR failure taxonomy distinguishes timeout, DNS, TLS and boundaries without exporting error payloads',()=>{
 for(const [error,expected] of [[{cause:{code:'UND_ERR_CONNECT_TIMEOUT'}},'connect-timeout'],[{name:'TimeoutError'},'request-timeout'],[{cause:{errors:[{code:'EAI_AGAIN'}]}},'dns-unresolved'],[{cause:{code:'UNABLE_TO_VERIFY_LEAF_SIGNATURE'}},'tls-verification-failed'],[Error('unapproved-reference-host'),'unapproved-reference-host'],[Error('PRIVATE@example.test?key=SECRET'),'network-or-parser-error']])assert.equal(irFailureKind(error),expected);
});
test('IR script/head-only markers and HTTP-200 error shells cannot verify a reference',()=>{
 for(const content of ['<head>پست</head><body>Unavailable</body>','<script>پست</script>','<p>Unavailable</p>'])assert.equal(profileIrReference(Buffer.from(content),html,'text/html').contentVerified,false);
 const p=profileIrReference(Buffer.from('<main>پست</main>'),html,'text/html; charset=utf-8');assert.equal(p.contentVerified,true);assert.equal(p.currentAssignmentVerified,false);assert.equal(p.sourceDocumentDigest,null);assert.equal(p.exactRightsReviewed,false);
});
test('IR PDF magic, unreviewed bytes or wrong MIME never replace complete document review',()=>{
 const valid=profileIrReference(Buffer.from('%PDF-1.7\nsynthetic-not-real-data'),pdf,'application/pdf');assert.equal(valid.status,'pdf-manual-review-required');assert.equal(valid.contentVerified,false);assert.equal(valid.pdfVisuallyReviewed,false);assert.match(valid.responseDigest,/^sha256:[a-f0-9]{64}$/);assert.equal(valid.sourceDocumentDigest,null);
 assert.equal(profileIrReference(Buffer.from('<h1>error</h1>'),pdf,'application/pdf').status,'unexpected-pdf-signature');
 assert.equal(profileIrReference(Buffer.from('%PDF-1.7'),pdf,'text/html').status,'unexpected-mime');
});
test('IR rejects oversized, invalid UTF-8 and unapproved reference inputs',()=>{
 assert.throws(()=>profileIrReference(Buffer.alloc(P.limits.max_response_bytes+1),html,'text/html'),/byte-limit/);
 assert.equal(profileIrReference(Buffer.from([255]),html,'text/html').status,'invalid-utf8');
 assert.throws(()=>profileIrReference(Buffer.from('x'),{...html,url:'https://evil.test'},'text/html'),/not-approved/);
});
test('IR non-200 bodies are cancelled, not hashed or persisted as source data',async()=>{
 const r=await inspectIrSources(async()=>new Response('PRIVATE@example.test secret body',{status:502,headers:{'content-type':'text/html'}}));
 assert.equal(r.references.length,6);assert.ok(r.references.every(x=>x.status==='http-error'&&x.byteLength===null&&x.responseDigest===null&&x.contentVerified===false));
 assert.equal(r.assignmentQuality.invalidCodeRate,null);assert.equal(r.countryM2Achieved,false);assert.doesNotMatch(JSON.stringify(r),/PRIVATE|secret body/);
});
test('IR normal government redirect remains typed context, never a postcode or geometry release',async()=>{
 const calls=[];const r=await inspectIrSources(async url=>{calls.push(url);if(url==='https://iransdi.ir/')return new Response(null,{status:301,headers:{location:'https://iransdi.ncc.gov.ir/'}});return new Response(null,{status:502});});
 const nsdi=r.references.find(x=>x.id==='iran-nsdi');assert.deepEqual(nsdi.redirects,['https://iransdi.ncc.gov.ir/']);assert.equal(nsdi.httpStatus,502);assert.equal(nsdi.assignmentRowsValidated,0);assert.equal(calls.length,7);
});
test('IR rejects HTTP downgrade, unexpected hosts and redirects with credentials before fetching them',async()=>{
 for(const location of ['http://post.ir/','https://evil.test/private','https://secret@post.ir/']){const calls=[];const r=await inspectIrSources(async url=>{calls.push(url);return new Response(null,{status:301,headers:{location}});});assert.equal(calls.length,6);assert.ok(r.references.every(x=>x.failureKind==='unapproved-reference-host'));assert.doesNotMatch(JSON.stringify(r),/secret@/);}
});
test('IR reference retrieval is bounded and never falls back to lookup, cached PDF or authentication',async()=>{
 let active=0,max=0;const calls=[];const r=await inspectIrSources(async(url,options)=>{active++;max=Math.max(max,active);calls.push(url);assert.equal(options.redirect,'manual');assert.ok(options.signal);await new Promise(resolve=>setTimeout(resolve,5));active--;throw {cause:{code:'UND_ERR_CONNECT_TIMEOUT'}};});
 assert.ok(max<=2);assert.deepEqual(calls,P.reference_probes.map(p=>p.url));assert.ok(r.references.every(x=>x.failureKind==='connect-timeout'));
 for(const k of ['sourceDataSnapshotsRetained','sourceRowsPersisted','postalLookupRequests','coordinateQueries','certificateRequests','authenticatedRequests','bulkDataDownloads','publishedDataArtifacts','paidOperations'])assert.equal(r[k],0);
 assert.equal(r.cacheCanReplaceCurrentBytes,false);assert.equal(r.realAgidRuntimeVerified,false);assert.equal(r.countryM2Achieved,false);
});
