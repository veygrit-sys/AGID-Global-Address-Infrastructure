import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root=new URL('../',import.meta.url);
const readJson=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const ledger=readJson('docs/postal-context-m2-rollout.json');
const cm=ledger.countries.find(country=>country.countryCode==='CM');
const manifest=readJson('data/postal_country_packs/cm/postal-context/repository-manifest.json');
const profile=readJson('data/postal_country_packs/cm/postal-context/source-profile.json');
const draft=readJson('data/postal_country_packs/cm/manifest.json');
const address=readJson('src/data/address_formats/africa/central_africa/CM.json');
const sourceReport=readFileSync(new URL('reports/postal-context-m2/cm-source-review-2026-09-03.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/cm-checks-2026-09-03.json',root));

test('CM is blocked at M1 and excluded from current postcode data creation',()=>{
 assert.equal(cm.status,'blocked'); assert.equal(cm.attempts,1); assert.equal(cm.evidence,null);
 assert.equal(cm.m2Definition.id,'M2_future_competent_authority_postcode_assignment_and_area_visualization');
 assert.deepEqual(manifest.promotion.stages.find(stage=>stage.id===cm.m2Definition.id),cm.m2Definition);
 assert.equal(manifest.repository.maturity,'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified,false);
 assert.equal(cm.blocker.kind,'no-current-postcode-system'); assert.equal(cm.blocker.evidence.postcodeDataCreationTarget,false);
 assert.equal(address.postalCode.format,null); assert.equal(address.postalCode.regex,null);
});

test('official receipts establish current no-postcode and BP semantics',()=>{
 const e=cm.blocker.evidence;
 assert.equal(e.exactBodiesByteAndSha256Bound,5); assert.equal(e.exactOfficialReferenceBytes,938084);
 assert.equal(e.currentPostalSystemConfirmed,false); assert.equal(e.currentPostalCodeFormat,'none');
 assert.equal(e.upuAddressExample,'BP 6000 / YAOUNDE');
 assert.deepEqual(e.minesupBpAddressExamples,['B.P. 54190','BP 1739 Yaoundé-Cameroun']);
 assert.equal(e.bpClass,'po-box-delivery-object-not-postcode'); assert.match(e.jurisdictionIdentity,/CM.*Cameroon\/Cameroun/);
 assert.equal(e.currentCompletePostalCodeAssignmentsValidated,0); assert.ok(profile.sources.every(source=>source.bundled_here===false));
});

test('CM gate rejects postal geometry proxies, foreign assignments and model output',()=>{
 const e=cm.blocker.evidence;
 assert.equal(e.qualityGateImplemented,true); assert.equal(e.arbitraryDigitsRejected,true);
 assert.equal(e.bpAndNumericPoBoxRejectedAsPostcodes,true); assert.equal(e.foreignAssignmentsPromotedToCm,0);
 assert.equal(e.pointRouteOfficeAdminBufferHullVoronoiRasterOrAgidProxiesPromoted,0);
 assert.equal(e.officialPostalPolygonOrMultiPolygonRecords,0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords,0);
 assert.equal(e.huggingFaceOrLibpostalProductionIngested,false); assert.equal(e.openStreetMapPromotedToPostalAssignmentOrArea,false);
});

test('draft CM planning pack remains unpromoted',()=>{
 const e=cm.blocker.evidence;
 assert.equal(draft.officialStatus,'draft'); assert.equal(draft.counts.localities,48); assert.equal(draft.counts.boundaries,12);
 assert.equal(draft.counts.planningCells,218); assert.equal(draft.counts.routeEvidence,55); assert.equal(draft.counts.qualityEvidence,41);
 assert.equal(draft.counts.testVectors,3); assert.equal(e.syntheticDraftRecordsPromoted,0);
});

test('CM reports are pinned and the queue advances to CV',()=>{
 assert.equal(digest(sourceReport),cm.lastAttempt.reportDigest); assert.equal(digest(checks),cm.lastAttempt.engineeringReportDigest);
 assert.equal(cm.blocker.evidence.sourceReviewDigest,cm.lastAttempt.reportDigest);
 assert.equal(cm.blocker.evidence.engineeringChecksDigest,cm.lastAttempt.engineeringReportDigest);
 const next=ledger.countries.find(country=>country.countryCode==='CV'); assert.equal(next.status,'pending'); assert.equal(next.attempts,0);
});

test('published artifacts and detailed real-app limitations are represented without M2 promotion',()=>{
 const e=cm.blocker.evidence;
 for(const item of e.artifacts){
  const path=new URL(item.url).pathname.split('/'+e.evidenceCommit+'/')[1];
  const bytes=execFileSync('git',['show',e.evidenceCommit+':'+path]);
  assert.equal(bytes.length,item.bytes); assert.equal(digest(bytes),item.digest);
 }
 assert.equal(e.appStarted,true); assert.equal(e.appHttpStatus,200); assert.equal(e.realCmAgidPostalApiStatus,404);
 assert.equal(e.realCmAgidAppAreaVisualizationVerified,false); assert.equal(e.nonPostalAddressContextObserved,true);
 assert.match(e.detailedAddressContext,/Rue 7\.082.*Étoug-ébé.*Yaoundé.*Centre.*Cameroun/);
 assert.equal(e.detailedAddressContextNeedsReview,true); assert.equal(e.nonPostalAgidIdExample,'CM0224YJ5QS9');
 assert.equal(e.nonPostalAgidIdPromotedToPostalId,false); assert.equal(e.postalApiMocked,false);
 assert.equal(e.manualVisualInspection,false); assert.equal(e.approvedAgidRuntimeArtifacts,0); assert.equal(e.rawSourceBodiesInGit,0);
 assert.match(cm.blocker.retryPolicy,/Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
