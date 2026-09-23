import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const si = ledger.countries.find(country => country.countryCode === 'SI');
const sj = ledger.countries.find(country => country.countryCode === 'SJ');
const manifest = readJson('data/postal_country_packs/si/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/si/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/si-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/si-checks-2026-08-31.json', root));

test('Slovenia remains blocked under its assignment crosswalk and area visualization criterion', () => {
  assert.equal(si.status, 'blocked');
  assert.equal(si.attempts, 1);
  assert.equal(si.evidence, null);
  assert.equal(si.m2Definition.id, 'M2_current_slovenia_assignment_crosswalk_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === si.m2Definition.id), si.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('twenty exact bodies pin the current Pošta denominator and every GURS postal district geometry', () => {
  const evidence = si.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 20);
  assert.equal(evidence.exactOfficialBodiesBytes, 17226218);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNNN');
  assert.equal(evidence.normalPostcodeRows, 570);
  assert.equal(evidence.uniqueNormalPostcodeCodes, 569);
  assert.deepEqual(evidence.duplicateNormalPostcodeCodes, ['1002']);
  assert.equal(evidence.gursPostalDistrictFeatures, 466);
  assert.equal(evidence.polygonFeaturesValidated, 445);
  assert.equal(evidence.multiPolygonFeaturesValidated, 21);
  assert.equal(evidence.validFiniteClosedPolygonOrMultiPolygonFeatures, 466);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('special-code, rights, complete reconciliation, artifact and proxy gates fail closed', () => {
  const evidence = si.blocker.evidence;
  assert.equal(evidence.postaSpecialPdfHttpStatus, 404);
  assert.equal(evidence.currentSpecialCodeClassificationBodyInspected, false);
  assert.equal(evidence.gursCcBy4Observed, true);
  assert.equal(evidence.gursCodesWithoutPostaAssignment, 0);
  assert.equal(evidence.postaCodesWithoutGursGeometryOrFixedException, 103);
  assert.equal(evidence.completeCurrentNormalAndSpecialAssignmentExceptionDenominatorEstablished, false);
  assert.equal(evidence.postaAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.fixedAuthorizedGeometryArtifactsInspected, 0);
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 466);
  assert.equal(evidence.pointDeliveryAreaAdministrativeBuildingParcelProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('Slovenia ledger pins exact reports and preserves SJ next-country order', () => {
  assert.equal(digest(sourceReport), si.lastAttempt.reportDigest);
  assert.equal(digest(checks), si.lastAttempt.engineeringReportDigest);
  assert.equal(si.blocker.evidence.sourceReviewDigest, si.lastAttempt.reportDigest);
  assert.equal(si.blocker.evidence.engineeringChecksDigest, si.lastAttempt.engineeringReportDigest);
  assert.equal(sj.status, 'pending');
  assert.equal(sj.region, 'europe');
});

test('shared UI and audited GURS geometry do not promote a missing real SI artifact', () => {
  const evidence = si.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realSiAgidPostalApiVerified, false);
  assert.equal(evidence.realSiAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.siIdentityPreserved, true);
  assert.equal(si.blocker.requiresExplicitApproval, false);
  assert.match(si.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
