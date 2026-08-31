import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const va = ledger.countries.find(country => country.countryCode === 'VA');
const manifest = readJson('data/postal_country_packs/va/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/va/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/va-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/va-checks-2026-08-31.json', root));

test('VA remains blocked under its complete 00120 delivery-zone area criterion', () => {
  assert.equal(va.status, 'blocked');
  assert.equal(va.attempts, 1);
  assert.equal(va.evidence, null);
  assert.equal(va.m2Definition.id, 'M2_current_vatican_00120_assignment_delivery_zone_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === va.m2Definition.id), va.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('single 00120 and four-zone operator topology do not become a rights-cleared GIS denominator', () => {
  const evidence = va.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 8);
  assert.equal(evidence.exactOfficialBodiesBytes, 1667950);
  assert.equal(evidence.canonicalPostcode, '00120');
  assert.equal(evidence.upuSinglePostcodeForWholeCountryEstablished, true);
  assert.equal(evidence.designatedVaticanPostalOperatorEstablished, true);
  assert.equal(evidence.deliveryZones, 4);
  assert.equal(evidence.zonesOneToThreeInsideVaticanWalls, true);
  assert.equal(evidence.zoneFourIncludesExtraterritorialDestinations, true);
  assert.equal(evidence.currentCompleteAssignmentDeliveryZoneExceptionAndNonAreaDenominatorEstablished, false);
  assert.equal(evidence.resourceSpecificAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('raster zones, addresses, recipient categories and P.O. boxes fail closed', () => {
  const evidence = va.blocker.evidence;
  assert.equal(evidence.zoneFourAddressRowsWith00120, 32);
  assert.equal(evidence.zoneFourRecipientCategories, 24);
  assert.equal(evidence.zoneFourIncludesPostOfficeBoxes, true);
  assert.equal(evidence.pageOneRasterImages, 1);
  assert.equal(evidence.pageOneVectorRectsCurvesAndLines, 0);
  assert.equal(evidence.geospatialCrsCoordinatesOrTopologyPresent, false);
  assert.equal(evidence.fixedAuthorizedPostcodeGeometryArtifactsInspected, 0);
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.sovereignPropertyAddressRecipientOfficeBuildingParcelProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('VA ledger pins exact reports and advances to Dhekelia', () => {
  assert.equal(digest(sourceReport), va.lastAttempt.reportDigest);
  assert.equal(digest(checks), va.lastAttempt.engineeringReportDigest);
  assert.equal(va.blocker.evidence.sourceReviewDigest, va.lastAttempt.reportDigest);
  assert.equal(va.blocker.evidence.engineeringChecksDigest, va.lastAttempt.engineeringReportDigest);
  const xd = ledger.countries.find(country => country.countryCode === 'XD');
  assert.equal(xd.status, 'pending');
  assert.equal(xd.attempts, 0);
});

test('shared UI capability and source references do not promote a missing real VA artifact', () => {
  const evidence = va.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realVaAgidPostalApiVerified, false);
  assert.equal(evidence.realVaAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.vaIdentityPreserved, true);
  assert.equal(va.blocker.requiresExplicitApproval, false);
  assert.match(va.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
