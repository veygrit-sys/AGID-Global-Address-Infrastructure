import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const cd = ledger.countries.find(country => country.countryCode === 'CD');
const manifest = readJson('data/postal_country_packs/cd/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/cd/postal-context/source-profile.json');
const draft = readJson('data/postal_country_packs/cd/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/cd-source-review-2026-09-03.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/cd-checks-2026-09-03.json', root));

test('CD remains blocked at M1 despite a confirmed seven-digit system', () => {
  assert.equal(cd.status, 'blocked'); assert.equal(cd.attempts, 1); assert.equal(cd.evidence, null);
  assert.equal(cd.m2Definition.id, 'M2_current_scpt_seven_digit_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === cd.m2Definition.id), cd.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(cd.blocker.evidence.dataCreationScope, 'blocked_current_postcode_system_no_redistributable_complete_assignments_or_area_geometry');
  assert.equal(cd.blocker.evidence.postcodeDataCreationTarget, true);
});

test('official receipts establish format and examples but not a complete assignment denominator', () => {
  const e = cd.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 17); assert.equal(e.exactOfficialReferenceBodies, 11);
  assert.equal(e.exactOfficialReferenceBytes, 4063260); assert.equal(e.currentPostalCodeFormat, 'NNNNNNN');
  assert.equal(e.scptValidatedOfficialExamples, 2); assert.deepEqual(e.scptExamplePostcodes, ['1004131', '3202011']);
  assert.deepEqual(e.scptExampleRowIds, [175, 1160]);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.completeVersionedNationalAssignmentDenominatorEstablished, false);
  assert.equal(e.scptPublicApiHasGeometry, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('geometry quality gate rejects observed proxies and generated surfaces', () => {
  const e = cd.blocker.evidence;
  assert.equal(e.observedExactNeighbourhoodGeometry, 'Point'); assert.equal(e.pointCandidatesRejected, true);
  assert.equal(e.observedBroaderAdminGeometry, 'MultiPolygon'); assert.equal(e.broaderAdminCandidatesRejected, true);
  assert.equal(e.observedUnrelatedFeatureGeometry, 'Polygon'); assert.equal(e.unrelatedFeatureCandidatesRejected, true);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.pointRouteFacilityAdminBufferHullVoronoiRasterOrAgidProxiesPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('Hugging Face and libpostal stay candidate-only', () => {
  const e = cd.blocker.evidence;
  assert.equal(e.huggingFaceDataset, 'ellenhp/libpostal');
  assert.equal(e.huggingFaceRevision, '79e9bdd2145dcd2040e0bafea4596a49e0c2f70b');
  assert.equal(e.huggingFaceLicenceTagPresent, false); assert.equal(e.huggingFaceCdCoverageEstablished, false);
  assert.equal(e.huggingFaceGeometryAvailable, false); assert.equal(e.huggingFaceOrModelOutputPromoted, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
});

test('existing CD pack remains unpromoted draft synthetic material', () => {
  const e = cd.blocker.evidence;
  assert.equal(draft.officialStatus, 'draft'); assert.equal(draft.counts.localities, 48);
  assert.equal(draft.counts.boundaries, 12); assert.equal(draft.counts.planningCells, 217);
  assert.equal(draft.counts.routeEvidence, 55); assert.equal(draft.counts.qualityEvidence, 41);
  assert.equal(draft.counts.testVectors, 3); assert.equal(e.syntheticDraftRecordsPromoted, 0);
});

test('CD ledger pins reports and advances to Central African Republic', () => {
  assert.equal(digest(sourceReport), cd.lastAttempt.reportDigest); assert.equal(digest(checks), cd.lastAttempt.engineeringReportDigest);
  assert.equal(cd.blocker.evidence.sourceReviewDigest, cd.lastAttempt.reportDigest);
  assert.equal(cd.blocker.evidence.engineeringChecksDigest, cd.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'CF');
  assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('published artifacts and app limitations are represented without M2 promotion', () => {
  const e = cd.blocker.evidence;
  for (const item of e.artifacts) {
    const path = new URL(item.url).pathname.split(`/${e.evidenceCommit}/`)[1];
    const bytes = execFileSync('git', ['show', `${e.evidenceCommit}:${path}`]);
    assert.equal(bytes.length, item.bytes); assert.equal(digest(bytes), item.digest);
  }
  assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realCdAgidPostalApiStatus, 404); assert.equal(e.realCdAgidPostalApiVerified, false);
  assert.equal(e.realCdAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.nonPostalAddressContextObserved, true); assert.equal(e.nonPostalAgidIdExample, 'CD039MNVG8PJ');
  assert.equal(e.nonPostalAgidIdPromotedToPostalId, false); assert.equal(e.postalApiMocked, false);
  assert.equal(e.manualVisualInspection, false); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.match(cd.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
