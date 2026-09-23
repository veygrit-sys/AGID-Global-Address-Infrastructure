import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root=new URL('../',import.meta.url);
const readJson=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const ledger=readJson('docs/postal-context-m2-rollout.json');
const ci=ledger.countries.find(country=>country.countryCode==='CI');
const manifest=readJson('data/postal_country_packs/ci/postal-context/repository-manifest.json');
const profile=readJson('data/postal_country_packs/ci/postal-context/source-profile.json');
const draft=readJson('data/postal_country_packs/ci/manifest.json');
const address=readJson('src/data/address_formats/africa/western_africa/CI.json');
const sourceReport=readFileSync(new URL('reports/postal-context-m2/ci-source-review-2026-09-03.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/ci-checks-2026-09-03.json',root));

test('CI is blocked at M1 and excluded from current postcode data creation',()=>{
 assert.equal(ci.status,'blocked'); assert.equal(ci.attempts,1); assert.equal(ci.evidence,null);
 assert.equal(ci.m2Definition.id,'M2_future_competent_authority_postcode_assignment_and_area_visualization');
 assert.deepEqual(manifest.promotion.stages.find(stage=>stage.id===ci.m2Definition.id),ci.m2Definition);
 assert.equal(manifest.repository.maturity,'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified,false);
 assert.equal(ci.blocker.kind,'no-current-postcode-system'); assert.equal(ci.blocker.evidence.postcodeDataCreationTarget,false);
 assert.equal(address.postalCode.format,null); assert.equal(address.postalCode.regex,null);
});

test('official receipts establish current no-postcode, office-code and BP semantics',()=>{
 const e=ci.blocker.evidence;
 assert.equal(e.exactBodiesByteAndSha256Bound,3); assert.equal(e.exactOfficialReferenceBytes,818237);
 assert.equal(e.currentPostalSystemConfirmed,false); assert.equal(e.currentPostalCodeFormat,'none');
 assert.deepEqual(e.upuAddressExamples,['06 B.P. 37 ABIDJAN 06','17 B.P. 105 ABIDJAN 17']);
 assert.equal(e.twoDigitValuesClass,'post-office-code-not-postcode'); assert.match(e.homeDelivery104Class,/office-04-not-postcode/);
 assert.equal(e.bpClass,'po-box-delivery-object-not-postcode'); assert.match(e.jurisdictionIdentity,/CI.*Côte d'Ivoire/);
 assert.equal(e.currentCompletePostalCodeAssignmentsValidated,0); assert.ok(profile.sources.every(source=>source.bundled_here===false));
});

test('CI gate rejects postal geometry proxies, foreign assignments and model output',()=>{
 const e=ci.blocker.evidence;
 assert.equal(e.qualityGateImplemented,true); assert.equal(e.arbitraryDigitsRejected,true);
 assert.equal(e.twoDigitOfficeCodesRejectedAsPostcodes,true); assert.equal(e.homeDeliveryIndicator104RejectedAsPostcode,true);
 assert.equal(e.bpObjectsRejectedAsPostcodes,true); assert.equal(e.foreignAssignmentsPromotedToCi,0);
 assert.equal(e.pointRouteOfficeAdminBufferHullVoronoiRasterOrAgidProxiesPromoted,0);
 assert.equal(e.officialPostalPolygonOrMultiPolygonRecords,0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords,0);
 assert.equal(e.huggingFaceOrLibpostalProductionIngested,false); assert.equal(e.openStreetMapPromotedToPostalAssignmentOrArea,false);
});

test('draft CI planning pack remains unpromoted',()=>{
 const e=ci.blocker.evidence;
 assert.equal(draft.officialStatus,'draft'); assert.equal(draft.counts.localities,48); assert.equal(draft.counts.boundaries,12);
 assert.equal(draft.counts.planningCells,218); assert.equal(draft.counts.routeEvidence,55); assert.equal(draft.counts.qualityEvidence,41);
 assert.equal(draft.counts.testVectors,3); assert.equal(e.syntheticDraftRecordsPromoted,0);
});

test('CI reports are pinned and the queue advances to CM',()=>{
 assert.equal(digest(sourceReport),ci.lastAttempt.reportDigest); assert.equal(digest(checks),ci.lastAttempt.engineeringReportDigest);
 assert.equal(ci.blocker.evidence.sourceReviewDigest,ci.lastAttempt.reportDigest);
 assert.equal(ci.blocker.evidence.engineeringChecksDigest,ci.lastAttempt.engineeringReportDigest);
 const next=ledger.countries.find(country=>country.countryCode==='CM'); assert.equal(next.status,'pending'); assert.equal(next.attempts,0);
});

test('published artifacts and detailed real-app limitations are represented without M2 promotion',()=>{
 const e=ci.blocker.evidence;
 for(const item of e.artifacts){
  const path=new URL(item.url).pathname.split(`/${e.evidenceCommit}/`)[1];
  const bytes=execFileSync('git',['show',`${e.evidenceCommit}:${path}`]);
  assert.equal(bytes.length,item.bytes); assert.equal(digest(bytes),item.digest);
 }
 assert.equal(e.appStarted,true); assert.equal(e.appHttpStatus,200); assert.equal(e.realCiAgidPostalApiStatus,404);
 assert.equal(e.realCiAgidAppAreaVisualizationVerified,false); assert.equal(e.nonPostalAddressContextObserved,true);
 assert.match(e.detailedAddressContext,/Bibliothèque.*Boulevard Carde.*Le Plateau.*Abidjan/);
 assert.equal(e.detailedAddressContextNeedsReview,true); assert.equal(e.nonPostalAgidIdExample,'CI01ZMYVT7E8');
 assert.equal(e.nonPostalAgidIdPromotedToPostalId,false); assert.equal(e.postalApiMocked,false);
 assert.equal(e.manualVisualInspection,false); assert.equal(e.approvedAgidRuntimeArtifacts,0); assert.equal(e.rawSourceBodiesInGit,0);
 assert.match(ci.blocker.retryPolicy,/Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
