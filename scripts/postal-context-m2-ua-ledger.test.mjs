import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ua = ledger.countries.find(country => country.countryCode === 'UA');
const manifest = readJson('data/postal_country_packs/ua/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ua/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ua-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ua-checks-2026-08-31.json', root));

test('UA remains blocked under its current complete assignment and area visualization criterion', () => {
  assert.equal(ua.status, 'blocked');
  assert.equal(ua.attempts, 1);
  assert.equal(ua.evidence, null);
  assert.equal(ua.m2Definition.id, 'M2_current_ukraine_postal_index_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ua.m2Definition.id), ua.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('the exact CC BY August 2025 archive is reproducible but stale and non-geometric', () => {
  const evidence = ua.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 6);
  assert.equal(evidence.exactOfficialBodiesBytes, 13280996);
  assert.equal(evidence.openDataLicense, 'CC BY');
  assert.equal(evidence.openDataPortalStatus, 'not-updated');
  assert.equal(evidence.openDataRows, 320249);
  assert.equal(evidence.openDataColumns, 16);
  assert.equal(evidence.distinctValidFiveDigitCodes, 28796);
  assert.equal(evidence.leadingZeroCodes, 1435);
  assert.equal(evidence.geometryLikeColumns, 0);
  assert.equal(evidence.polygonOrMultiPolygonColumns, 0);
  assert.equal(evidence.currentCompleteAssignmentOperationalExceptionAndNonAreaDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('the current contract API documents membership, boolean and points but no postcode area', () => {
  const evidence = ua.blocker.evidence;
  assert.equal(evidence.addressClassifierVersion, '3.20');
  assert.equal(evidence.contractAndBearerRequired, true);
  assert.equal(evidence.contractAcceptedOrCredentialsObtained, false);
  assert.equal(evidence.addressMembershipEndpointDocumented, true);
  assert.equal(evidence.courierAreaBooleanEndpointDocumented, true);
  assert.equal(evidence.officePointLatitudeLongitudeDocumented, true);
  assert.equal(evidence.postcodePolygonOrMultiPolygonEndpointDocumented, false);
  assert.equal(evidence.fixedAuthorizedPostcodeGeometryArtifactsInspected, 0);
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.addressOfficeAdministrativeSettlementStreetBuildingParcelProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('UA ledger pins exact reports and advances to the next pending country', () => {
  assert.equal(digest(sourceReport), ua.lastAttempt.reportDigest);
  assert.equal(digest(checks), ua.lastAttempt.engineeringReportDigest);
  assert.equal(ua.blocker.evidence.sourceReviewDigest, ua.lastAttempt.reportDigest);
  assert.equal(ua.blocker.evidence.engineeringChecksDigest, ua.lastAttempt.engineeringReportDigest);
  const statusScript = readFileSync(new URL('scripts/postal-context-m2-rollout.mjs', root), 'utf8');
  assert.match(statusScript, /next/i);
});

test('shared UI capability and address rows do not promote a missing real UA artifact', () => {
  const evidence = ua.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realUaAgidPostalApiVerified, false);
  assert.equal(evidence.realUaAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.uaIdentityPreserved, true);
  assert.equal(ua.blocker.requiresExplicitApproval, false);
  assert.match(ua.blocker.retryPolicy, /Do not contact.*contract.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
