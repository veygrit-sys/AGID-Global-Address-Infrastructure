import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const sm = ledger.countries.find(country => country.countryCode === 'SM');
const manifest = readJson('data/postal_country_packs/sm/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/sm/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/sm-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/sm-checks-2026-08-31.json', root));

test('SM remains blocked under its complete assignment and area visualization criterion', () => {
  assert.equal(sm.status, 'blocked');
  assert.equal(sm.attempts, 1);
  assert.equal(sm.evidence, null);
  assert.equal(sm.m2Definition.id, 'M2_current_san_marino_cap_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === sm.m2Definition.id), sm.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('ten exact office CAP examples and ten official bodies do not become a denominator or rights grant', () => {
  const evidence = sm.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 10);
  assert.equal(evidence.exactOfficialBodiesBytes, 1699234);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNNNN');
  assert.equal(evidence.observedOfficeCodes, 10);
  assert.equal(evidence.observedOfficeCodeMin, '47890');
  assert.equal(evidence.observedOfficeCodeMax, '47899');
  assert.equal(evidence.completeAssignmentAndExceptionDenominatorEstablished, false);
  assert.equal(evidence.posteSanMarinoAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('administrative features, wrong bbox and missing Dogana Serravalle postal split fail closed', () => {
  const evidence = sm.blocker.evidence;
  assert.equal(evidence.officialCastelli, 9);
  assert.equal(evidence.administrativePolygonFeaturesInspected, 12);
  assert.equal(evidence.distinctAdministrativeCastelli, 9);
  assert.equal(evidence.serravalleAdministrativeSubpolygons, 3);
  assert.equal(evidence.borgoMaggioreAdministrativeSubpolygons, 2);
  assert.equal(evidence.finiteAdministrativePositions, 27446);
  assert.equal(evidence.closedAdministrativeRings, 12);
  assert.equal(evidence.invalidAdministrativeCoordinates, 0);
  assert.equal(evidence.returnedGeojsonDeclaresEpsg4326, true);
  assert.equal(evidence.returnedGeojsonBboxIntersectsExpectedSanMarino, false);
  assert.equal(evidence.resourceSpecificOpenReuseLicenseEstablished, false);
  assert.equal(evidence.doganaSerravallePostalSplitEstablished, false);
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.administrativeOfficeSettlementStreetAddressBuildingParcelProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('SM ledger pins exact reports and advances to the next pending country', () => {
  assert.equal(digest(sourceReport), sm.lastAttempt.reportDigest);
  assert.equal(digest(checks), sm.lastAttempt.engineeringReportDigest);
  assert.equal(sm.blocker.evidence.sourceReviewDigest, sm.lastAttempt.reportDigest);
  assert.equal(sm.blocker.evidence.engineeringChecksDigest, sm.lastAttempt.engineeringReportDigest);
  const statusScript = readFileSync(new URL('scripts/postal-context-m2-rollout.mjs', root), 'utf8');
  assert.match(statusScript, /next/i);
});

test('shared UI capability and source rows do not promote a missing real SM artifact', () => {
  const evidence = sm.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realSmAgidPostalApiVerified, false);
  assert.equal(evidence.realSmAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.smIdentityPreserved, true);
  assert.equal(sm.blocker.requiresExplicitApproval, false);
  assert.match(sm.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
