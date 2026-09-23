import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const xu = ledger.countries.find(country => country.countryCode === 'XU');
const manifest = readJson('data/postal_country_packs/xu/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/xu/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/xu-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/xu-checks-2026-08-31.json', root));

test('XU remains blocked under its BFPO and Cyprus postal-area reconciliation criterion', () => {
  assert.equal(xu.status, 'blocked'); assert.equal(xu.attempts, 1); assert.equal(xu.evidence, null);
  assert.equal(xu.m2Definition.id, 'M2_current_akrotiri_bfpo_and_cyprus_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === xu.m2Definition.id), xu.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('BFPO, DLS and identity evidence remains an incomplete cross-system denominator', () => {
  const e = xu.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 9); assert.equal(e.exactOfficialBodiesBytes, 8102778);
  assert.equal(e.bfpoNumber, '57'); assert.equal(e.shadowPostcode, 'BF1 2AT'); assert.equal(e.cyprusPostalCodeObservedInDls, '4640');
  assert.equal(e.distinctEpiskopiBfpoNumber, '53'); assert.equal(e.distinctEpiskopiShadowPostcode, 'BF1 2AS');
  assert.equal(e.currentCompleteDualSystemAssignmentEligibilityAliasExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.equal(e.bfpoCyprusDlsCrossSystemReconciliationEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('real valid DLS Akrotiri geometry does not promote an unreconciled rights-uncleared area', () => {
  const e = xu.blocker.evidence;
  assert.equal(e.dlsFeatures, 870); assert.equal(e.dlsUniquePostalCodeValues, 848); assert.equal(e.dlsInvalidGeometry, 0);
  assert.equal(e.akrotiriPostalCode, '4640'); assert.equal(e.akrotiriGeometryType, 'Polygon'); assert.equal(e.akrotiriGeometryPoints, 1285);
  assert.equal(e.fixedOfficialGeometryArtifactsInspected, 1);
  assert.equal(e.cyprusPostalOperatorCurrent4640AssignmentAndExceptionDenominatorEstablished, false);
  assert.equal(e.dlsResourceSpecificAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(e.assignmentsReconciledToAreaOrExplicitNonArea, 0); assert.equal(e.dls4640NameOrContainmentAssumptionsPromoted, 0);
  assert.equal(e.bfpoRouteOrShadowPostcodePromotedAsArea, 0);
  assert.equal(e.territoryAdministrativeEnvironmentalOfficeAddressBuildingParcelProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.xuIdentityPreserved, true);
});

test('XU ledger pins exact reports and advances to Antigua and Barbuda', () => {
  assert.equal(digest(sourceReport), xu.lastAttempt.reportDigest); assert.equal(digest(checks), xu.lastAttempt.engineeringReportDigest);
  assert.equal(xu.blocker.evidence.sourceReviewDigest, xu.lastAttempt.reportDigest);
  assert.equal(xu.blocker.evidence.engineeringChecksDigest, xu.lastAttempt.engineeringReportDigest);
  const ag = ledger.countries.find(country => country.countryCode === 'AG'); assert.equal(ag.status, 'pending'); assert.equal(ag.attempts, 0);
});

test('shared UI capability does not promote the missing real XU artifact', () => {
  const e = xu.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realXuAgidPostalApiVerified, false);
  assert.equal(e.realXuAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(xu.blocker.requiresExplicitApproval, false);
  assert.match(xu.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
