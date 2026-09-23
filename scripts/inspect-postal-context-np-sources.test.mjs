import assert from 'node:assert/strict';import {test} from 'node:test';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
import {config,inspectNepalReference,inspectNepalObservations,inspectNepalSources} from './inspect-postal-context-np-sources.mjs';

const body=Buffer.from('<title>Synthetic Reference</title>');
const reference={kind:'html',reviewed_bytes:body.length,reviewed_digest:sourceDigest(body),reviewed_mime:'text/html',markers:['Synthetic Reference'],reviewed_profile:{rightsVerified:false}};
test('NP exact-byte reference review cannot become assignment or reuse evidence',()=>{
  const r=inspectNepalReference(body,reference,'text/html; charset=utf-8');assert.equal(r.status,'reference-verified-not-data');assert.equal(r.profile.rightsVerified,false);
});
test('NP byte, size, MIME, title and PDF signature drift fail closed',()=>{
  assert.throws(()=>inspectNepalReference(Buffer.from('changed'),reference,'text/html'),/reference-drift/);
  assert.throws(()=>inspectNepalReference(body,{...reference,reviewed_digest:'sha256:'+'0'.repeat(64)},'text/html'),/reference-drift/);
  assert.throws(()=>inspectNepalReference(body,reference,'application/pdf'),/reference-mime/);
  assert.throws(()=>inspectNepalReference(body,{...reference,markers:['missing']},'text/html'),/reference-markers/);
  assert.throws(()=>inspectNepalReference(body,{...reference,kind:'pdf'},'text/html'),/pdf-magic/);
});
test('NP viewer shells are byte-observed but not content or data verified',()=>{
  const r=inspectNepalReference(body,{...reference,kind:'shell'},'text/html');assert.equal(r.contentVerified,false);assert.equal(r.status,'viewer-shell-not-data');
});
test('NP incomplete or duplicate observation sets cannot replay as source evidence',()=>{
  assert.throws(()=>inspectNepalObservations([]),/observation-set/);
  assert.throws(()=>inspectNepalObservations(config.references.map(()=>({id:'duplicate'}))),/observation-set/);
  assert.throws(()=>inspectNepalObservations(config.references.map(r=>({id:r.id,requestedUrl:r.url,observedAt:'2000-01-01T00:00:00Z'}))),/observation-binding/);
});
test('NP live recheck skips known failures and never promotes changed references',async()=>{
  let count=0;const report=await inspectNepalSources(async(url,options)=>{count++;assert.equal(options.redirect,'manual');assert.ok(options.signal);assert.equal(options.headers,undefined);return new Response(body,{headers:{'content-type':'text/html'}});});
  assert.equal(count,config.references.filter(r=>r.kind!=='failure').length);assert.equal(report.references.filter(r=>r.status==='known-failure-skipped-until-review').length,2);assert.equal(report.countryM2Achieved,false);assert.ok(report.references.every(r=>r.contentVerified===false));assert.equal(report.rawBodiesPersisted,false);
});
test('NP live recheck does not follow redirects to unapproved hosts or access denials',async()=>{
  const denied=await inspectNepalSources(async()=>new Response(null,{status:403}));assert.ok(denied.references.filter(r=>r.status!=='known-failure-skipped-until-review').every(r=>r.httpStatus===403&&!r.contentVerified));
  let calls=0;const redirected=await inspectNepalSources(async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://example.invalid/private'}});});assert.equal(calls,config.references.filter(r=>r.kind!=='failure').length);assert.ok(redirected.references.every(r=>!r.contentVerified));
});
