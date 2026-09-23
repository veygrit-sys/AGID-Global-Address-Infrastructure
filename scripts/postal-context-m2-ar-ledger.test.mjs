import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ar = ledger.countries.find(country => country.countryCode === 'AR');
const manifest = readJson('data/postal_country_packs/ar/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ar/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ar-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ar-checks-2026-08-31.json', root));

test('AR remains blocked under its current CPA denominator and real-area criterion', () => {
  assert.equal(ar.status, 'blocked'); assert.equal(ar.attempts, 1); assert.equal(ar.evidence, null);
  assert.equal(ar.m2Definition.id, 'M2_current_correo_argentino_cpa_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ar.m2Definition.id), ar.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve individual lookup versus commercial bulk access', () => {
  const e = ar.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 8); assert.equal(e.exactOfficialBodiesBytes, 432562);
  assert.equal(e.currentCpaFormat, 'ANNNNAAA'); assert.equal(e.individualEpistolaryLookupFree, true);
  assert.equal(e.partialOrTotalDatabaseProcessingCommercial, true); assert.equal(e.bulkServicesRequireParticularAgreements, true);
  assert.equal(e.correoAssertsIntellectualPropertyProtection, true); assert.equal(e.currentCompleteCpaAssignmentRowsValidated, 0);
  assert.equal(e.currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('Georef and non-postal proxies never promote', () => {
  const e = ar.blocker.evidence;
  assert.equal(e.georefOpenapiVersion, '0.5.X'); assert.equal(e.georefEndpointCount, 10);
  assert.deepEqual(e.georefPostalOrCpaSchemaKeys, []); assert.equal(e.georefPostalAreaEndpoint, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.individualLookupRowsPromoted, 0); assert.equal(e.georefAddressOrTerritorialFeaturesPromoted, 0);
  assert.equal(e.blockFaceStreetRangeLocalityAdminCensusParcelBuildingProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidCellsPromoted, 0); assert.equal(e.productionEligibleRecords, 0);
});

test('AR ledger pins exact reports and advances to Aruba', () => {
  assert.equal(digest(sourceReport), ar.lastAttempt.reportDigest); assert.equal(digest(checks), ar.lastAttempt.engineeringReportDigest);
  assert.equal(ar.blocker.evidence.sourceReviewDigest, ar.lastAttempt.reportDigest);
  assert.equal(ar.blocker.evidence.engineeringChecksDigest, ar.lastAttempt.engineeringReportDigest);
  const aw = ledger.countries.find(country => country.countryCode === 'AW'); assert.equal(aw.status, 'pending'); assert.equal(aw.attempts, 0);
});

test('shared capability does not promote a missing real AR artifact', () => {
  const e = ar.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realArAgidPostalApiVerified, false);
  assert.equal(e.realArAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0); assert.equal(e.arIdentityPreserved, true);
  assert.equal(ar.blocker.requiresExplicitApproval, false);
  assert.match(ar.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
