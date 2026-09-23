import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const sj = ledger.countries.find(country => country.countryCode === 'SJ');
const sk = ledger.countries.find(country => country.countryCode === 'SK');
const manifest = readJson('data/postal_country_packs/sj/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/sj/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/sj-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/sj-checks-2026-08-31.json', root));

test('SJ remains blocked under its assignment and official area visualization criterion', () => {
  assert.equal(sj.status, 'blocked');
  assert.equal(sj.attempts, 1);
  assert.equal(sj.evidence, null);
  assert.equal(sj.m2Definition.id, 'M2_current_svalbard_jan_mayen_assignment_and_official_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === sj.m2Definition.id), sj.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('five exact bodies reproduce the complete Posten register and exact SJ denominator', () => {
  const evidence = sj.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 5);
  assert.equal(evidence.exactOfficialBodiesBytes, 723960);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNNN');
  assert.equal(evidence.completePostenRegisterRows, 5122);
  assert.equal(evidence.completePostenRegisterUniqueCodes, 5122);
  assert.equal(evidence.completePostenRegisterMalformedRows, 0);
  assert.equal(evidence.completePostenRegisterDuplicateCodes, 0);
  assert.deepEqual(evidence.completePostenCategoryCounts, { G: 3318, P: 1740, B: 60, S: 4 });
  assert.equal(evidence.sjAssignmentRows, 8);
  assert.equal(evidence.svalbardRows, 7);
  assert.equal(evidence.janMayenRows, 1);
  assert.deepEqual(evidence.sjCategoryCounts, { G: 6, P: 1, B: 1, S: 0 });
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('rights, fixed geometry, reconciliation, artifact and proxy gates fail closed', () => {
  const evidence = sj.blocker.evidence;
  assert.equal(evidence.kartverketPostnummeromraaderCcBy4Observed, true);
  assert.equal(evidence.kartverketEndpointAttempts, 5);
  assert.equal(evidence.kartverketSuccessfulGeometryBodies, 0);
  assert.equal(evidence.officialPostcodeAreaProductSjCoverageVerified, false);
  assert.equal(evidence.postenAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.fixedAuthorizedGeometryArtifactsInspected, 0);
  assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.pointMunicipalitySettlementIslandAdministrativeBuildingProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('SJ ledger pins exact reports and preserves SK next-country order', () => {
  assert.equal(digest(sourceReport), sj.lastAttempt.reportDigest);
  assert.equal(digest(checks), sj.lastAttempt.engineeringReportDigest);
  assert.equal(sj.blocker.evidence.sourceReviewDigest, sj.lastAttempt.reportDigest);
  assert.equal(sj.blocker.evidence.engineeringChecksDigest, sj.lastAttempt.engineeringReportDigest);
  assert.equal(sk.status, 'pending');
  assert.equal(sk.region, 'europe');
});

test('shared UI capability and source rows do not promote a missing real SJ artifact', () => {
  const evidence = sj.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realSjAgidPostalApiVerified, false);
  assert.equal(evidence.realSjAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.sjIdentityPreserved, true);
  assert.equal(evidence.noAndSjSilentlyMerged, false);
  assert.equal(sj.blocker.requiresExplicitApproval, false);
  assert.match(sj.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
