import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {config,profileSyriaReference,sourceDigest} from './inspect-postal-context-sy-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/sy-source-review-2026-08-29.json',import.meta.url),'utf8'));

test('Syria review binds all configured reference receipts',()=>{
 assert.equal(report.countryCode,'SY');assert.equal(report.criterionId,'M2_scoped_no_postcode_address_context');assert.equal(report.references.length,config.references.length);
 for(const reference of report.references){
   const configured=config.references.find(candidate=>candidate.id===reference.id);assert.ok(configured);
   assert.equal(reference.requestedUrl,configured.url);
   if(configured.kind==='expected-network-failure'){assert.equal(reference.failureKind,configured.reviewed_failure);assert.equal(reference.contentVerified,false);}
   else{assert.equal(reference.responseDigest,configured.expected_digest);assert.equal(reference.byteLength,configured.reviewed_bytes);assert.equal(reference.contentVerified,true);}
 }
});

test('Syria no-postcode policy cannot manufacture a postal polygon or M2 evidence',()=>{
 assert.equal(report.postalPolicy.postalCode,null);assert.equal(report.postalPolicy.postcodeRequired,false);assert.equal(report.postalPolicy.officialPostalGeometry,'none_verified');assert.equal(report.postalPolicy.derivedPostalGeometry,'not_generated');
 assert.equal(report.currentPostalAssignmentRowsValidated,0);assert.equal(report.currentAddressRowsValidated,0);assert.equal(report.officialPostalGeometryRecords,0);assert.equal(report.explicitAddressBuildingRelations,0);assert.equal(report.publishedImmutableDataArtifacts,0);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.countryM2Achieved,false);
});

test('Syria audit records zero authenticated, paid, contract, publication or raw-data operation',()=>{
 assert.equal(report.authenticatedRequests,0);assert.equal(report.paidOperations,0);assert.equal(report.contractAcceptances,0);assert.equal(report.newAccountsRepositoriesOrDestinations,0);assert.equal(report.rawSourceBodiesInGit,0);assert.equal(report.quality.addressMissingnessRate,null);assert.match(report.blockerSummary,/remains M1/);
});

test('reference profiler fails closed on drift, MIME and marker changes',()=>{
 const html=Buffer.from('Syrian Arab Rep. ISO Code 3166/Alpha-2 15.05.1946');
 const reference={kind:'html',mime:'text/html',markers:['Syrian Arab Rep.','15.05.1946'],reviewed_bytes:html.length,expected_digest:sourceDigest(html)};
 assert.equal(profileSyriaReference(html,reference,'text/html; charset=utf-8').markers_verified,2);
 assert.throws(()=>profileSyriaReference(Buffer.concat([html,Buffer.from('x')]),reference,'text/html'),/drift/);
 assert.throws(()=>profileSyriaReference(html,reference,'application/pdf'),/mime/);
 assert.throws(()=>profileSyriaReference(html,{...reference,markers:['missing']},'text/html'),/marker/);
});

test('sourceDigest is stable and uses the required prefix',()=>{
 assert.equal(sourceDigest(Buffer.from('AGID Syria M2')),'sha256:ca13c1f4655af472992e012846272626a24aa4fc270a62f2aa1f4c8c056a3bd8');
});
