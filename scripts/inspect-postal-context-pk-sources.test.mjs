import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {profilePakistanReference,inspectPakistanObservations,inspectPakistanSources} from './inspect-postal-context-pk-sources.mjs';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/pk/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const bytes=Buffer.from('%PDF-synthetic-only');
const ref={id:'test',kind:'pdf',accepted_mime:['application/pdf'],reviewed_digest:sourceDigest(bytes),reviewed_bytes:bytes.length,reviewed_profile:{synthetic:true}};
test('exact PDF bytes preserve a reference review but never promote data',()=>{
  const r=profilePakistanReference(bytes,ref,'application/pdf');
  assert.equal(r.contentVerified,true);assert.equal(r.countryM2Achieved,false);
  assert.equal(r.currentPostalAssignmentsValidated,0);assert.equal(r.productionGeometryRecords,0);
  assert.equal(r.humanReviewReusedByExactDigest,true);
});
test('changed source requires human review',()=>assert.throws(()=>profilePakistanReference(Buffer.concat([bytes,Buffer.from('x')]),ref,'application/pdf'),/source-changed/));
test('MIME mismatch is rejected',()=>assert.throws(()=>profilePakistanReference(bytes,ref,'text/html'),/unexpected-mime/));
test('HTML behind a PDF URL is rejected even with matching bytes',()=>{
  const b=Buffer.from('<html>synthetic error</html>');
  assert.throws(()=>profilePakistanReference(b,{...ref,reviewed_digest:sourceDigest(b),reviewed_bytes:b.length},'application/pdf'),/invalid-pdf/);
});
test('byte limits reject empty, non-buffer and oversized bodies',()=>{
  for(const b of [Buffer.alloc(0),'not-buffer',Buffer.alloc(4194305)])assert.throws(()=>profilePakistanReference(b,ref,'application/pdf'),/byte-limit/);
});
test('JPEG signature is checked',()=>assert.throws(()=>profilePakistanReference(bytes,{...ref,kind:'jpeg',accepted_mime:['image/jpeg']},'image/jpeg'),/invalid-jpeg/));
test('directory counts must match a fresh recomputation',()=>{
  const b=Buffer.from('<table>POST CODE DELIVERY POST OFFICES NON DELIVERY POST OFFICES</table>');
  const r={...ref,id:'directory',kind:'directory-html',accepted_mime:['text/html'],reviewed_digest:sourceDigest(b),reviewed_bytes:b.length,reviewed_profile:{synthetic:true,rows:2}};
  assert.throws(()=>profilePakistanReference(b,r,'text/html',{synthetic:true,rows:3}),/profile-mismatch/);
  assert.equal(profilePakistanReference(b,r,'text/html',r.reviewed_profile).structureRecomputed,true);
});
test('incomplete or duplicate capture sets are rejected',()=>{
  for(const os of [null,[],config.references.map(()=>({id:'same'}))])assert.throws(()=>inspectPakistanObservations(os),/observation-set/);
});
test('invented receipts do not pass verification',()=>assert.throws(()=>inspectPakistanObservations(config.references.map(r=>({id:r.id}))),/receipt-binding/));
test('live access errors remain unverified, not licensed data',async()=>{
  let calls=0;const r=await inspectPakistanSources(async()=>{calls++;return new Response(null,{status:403});});
  assert.equal(calls,config.references.length);assert.ok(r.references.every(x=>x.status==='http-error'&&!x.contentVerified));
  assert.equal(r.countryM2Achieved,false);assert.equal(r.realAgidRuntimeVerified,false);
});
test('network details do not leak into published reports',async()=>{
  const r=await inspectPakistanSources(async()=>{throw Error('private detail');});
  assert.equal(JSON.stringify(r).includes('private detail'),false);
  assert.ok(r.references.every(x=>x.sourceDocumentDigest===null));
});
test('unexpected live HTML never inherits reviewed evidence',async()=>{
  const r=await inspectPakistanSources(async()=>new Response('<html>unexpected</html>',{headers:{'content-type':'text/html'}}));
  assert.ok(r.references.every(x=>!x.contentVerified&&x.sourceDocumentDigest===null));
});
test('review retains PK-specific M2 and document-time separation',()=>{
  assert.match(config.m2_criterion.definition,/delivery and non-delivery.*with amendments/);
  const r=new Map(config.references.map(r=>[r.id,r]));
  assert.equal(r.get('amendment').reviewed_profile.noticeDate,'2022-04-16');
  assert.equal(r.get('amendment').reviewed_profile.pdfTimestampIsEffectiveEdition,false);
  assert.equal(r.get('allotment-image').reviewed_profile.filenameDateIsEffectiveDate,false);
  assert.equal(r.get('upu').reviewed_profile.printedEdition,'09/2004');
});
test('snapshot exceptions and unknown quality never become zero-error M2',()=>{
  const p=config.references.find(r=>r.id==='directory').reviewed_profile;
  assert.equal(p.tables.dpo.populatedRows,2298);assert.equal(p.tables.ndpo.populatedRows,832);
  assert.equal(p.tables.ndpo.nonLeadingZeroRows,1);assert.equal(p.tables.ndpo.repeatedHeaderRows,15);
  assert.ok(p.tables.dpo.sharedCodeGroups>0);assert.ok(p.tables.ndpo.sharedCodeGroups>0);
  assert.equal(p.nationalCompleteness,null);assert.equal(config.decision.country_m2_achieved,false);
});
