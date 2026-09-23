import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root=new URL('../',import.meta.url);
const readJson=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const ledger=readJson('docs/postal-context-m2-rollout.json');
const cf=ledger.countries.find(country=>country.countryCode==='CF');
const manifest=readJson('data/postal_country_packs/cf/postal-context/repository-manifest.json');
const profile=readJson('data/postal_country_packs/cf/postal-context/source-profile.json');
const draft=readJson('data/postal_country_packs/cf/manifest.json');
const sourceReport=readFileSync(new URL('reports/postal-context-m2/cf-source-review-2026-09-03.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/cf-checks-2026-09-03.json',root));

test('CF is blocked at M1 and excluded from current postcode data creation',()=>{
 assert.equal(cf.status,'blocked'); assert.equal(cf.attempts,1); assert.equal(cf.evidence,null);
 assert.equal(cf.m2Definition.id,'M2_future_competent_authority_postcode_assignment_and_area_visualization');
 assert.deepEqual(manifest.promotion.stages.find(stage=>stage.id===cf.m2Definition.id),cf.m2Definition);
 assert.equal(manifest.repository.maturity,'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified,false);
 assert.equal(cf.blocker.kind,'no-current-postcode-system');
 assert.equal(cf.blocker.evidence.postcodeDataCreationTarget,false);
});

test('official receipts establish current no-postcode status and BP semantics',()=>{
 const e=cf.blocker.evidence;
 assert.equal(e.exactBodiesByteAndSha256Bound,4); assert.equal(e.exactOfficialReferenceBytes,845353);
 assert.equal(e.currentPostalSystemConfirmed,false); assert.equal(e.currentPostalCodeFormat,'none');
 assert.deepEqual(e.upuAddressExamples,['BP 729 / BANGUI','BP 655 / BANGUI']);
 assert.equal(e.bpClass,'po-box-delivery-object-not-postcode');
 assert.equal(e.currentCompletePostalCodeAssignmentsValidated,0);
 assert.ok(profile.sources.every(source=>source.bundled_here===false));
});

test('CF gate rejects postal geometry proxies and model output',()=>{
 const e=cf.blocker.evidence;
 assert.equal(e.qualityGateImplemented,true); assert.equal(e.postcodeLikeDigitsRejected,true);
 assert.equal(e.bpObjectsRejectedAsPostcodes,true);
 assert.equal(e.pointRouteOfficeAdminBufferHullVoronoiRasterOrAgidProxiesPromoted,0);
 assert.equal(e.officialPostalPolygonOrMultiPolygonRecords,0);
 assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords,0);
 assert.equal(e.huggingFaceOrLibpostalProductionIngested,false);
 assert.equal(e.openStreetMapPromotedToPostalAssignmentOrArea,false);
});

test('draft CF planning pack remains unpromoted',()=>{
 const e=cf.blocker.evidence;
 assert.equal(draft.officialStatus,'draft'); assert.equal(draft.counts.localities,48);
 assert.equal(draft.counts.boundaries,12); assert.equal(draft.counts.planningCells,218);
 assert.equal(draft.counts.routeEvidence,55); assert.equal(draft.counts.qualityEvidence,41);
 assert.equal(draft.counts.testVectors,3); assert.equal(e.syntheticDraftRecordsPromoted,0);
});

test('CF reports are pinned and the queue advances to CG',()=>{
 assert.equal(digest(sourceReport),cf.lastAttempt.reportDigest); assert.equal(digest(checks),cf.lastAttempt.engineeringReportDigest);
 assert.equal(cf.blocker.evidence.sourceReviewDigest,cf.lastAttempt.reportDigest);
 assert.equal(cf.blocker.evidence.engineeringChecksDigest,cf.lastAttempt.engineeringReportDigest);
 const next=ledger.countries.find(country=>country.countryCode==='CG');
 assert.equal(next.status,'pending'); assert.equal(next.attempts,0);
});

test('published artifacts and real app limitations are represented without M2 promotion',()=>{
 const e=cf.blocker.evidence;
 for(const item of e.artifacts){
  const path=new URL(item.url).pathname.split(`/${e.evidenceCommit}/`)[1];
  const bytes=execFileSync('git',['show',`${e.evidenceCommit}:${path}`]);
  assert.equal(bytes.length,item.bytes); assert.equal(digest(bytes),item.digest);
 }
 assert.equal(e.appStarted,true); assert.equal(e.appHttpStatus,200);
 assert.equal(e.realCfAgidPostalApiStatus,404); assert.equal(e.realCfAgidAppAreaVisualizationVerified,false);
 assert.equal(e.nonPostalAddressContextObserved,true); assert.equal(e.nonPostalAgidIdExample,'CF022WKY25JD');
 assert.equal(e.nonPostalAgidIdPromotedToPostalId,false); assert.equal(e.postalApiMocked,false);
 assert.equal(e.manualVisualInspection,false); assert.equal(e.approvedAgidRuntimeArtifacts,0);
 assert.equal(e.rawSourceBodiesInGit,0);
 assert.match(cf.blocker.retryPolicy,/Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
