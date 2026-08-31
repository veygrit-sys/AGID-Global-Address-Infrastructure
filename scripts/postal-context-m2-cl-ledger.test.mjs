import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const cl = ledger.countries.find(country => country.countryCode === 'CL');
const manifest = readJson('data/postal_country_packs/cl/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/cl/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/cl-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/cl-checks-2026-08-31.json', root));

test('CL remains blocked under its current assignment and real seven-digit area criterion', () => {
  assert.equal(cl.status, 'blocked'); assert.equal(cl.attempts, 1); assert.equal(cl.evidence, null);
  assert.equal(cl.m2Definition.id, 'M2_current_correoschile_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === cl.m2Definition.id), cl.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts pin public lookup, UPU and catalog evidence without acquiring rows', () => {
  const e = cl.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 8); assert.equal(e.exactOfficialBodiesBytes, 692958);
  assert.equal(e.currentPostalCodeFormat, 'NNNNNNN'); assert.equal(e.currentCompleteAssignmentReleaseIdentified, false);
  assert.equal(e.currentCompleteAssignmentAcquired, false); assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.completeAssignmentDenominatorEstablished, false); assert.equal(e.featureOrAddressRowsQueried, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('block-face and every non-area or geographic proxy fail closed', () => {
  const e = cl.blocker.evidence;
  assert.equal(e.normalFullCodeSemantics, 'address-dependent sequential block face');
  assert.deepEqual(e.exceptionSemantics, ['commune_fallback', 'post_office', 'po_box', 'rural_no_number']);
  assert.equal(e.officialSevenDigitPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualSevenDigitPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.nonAreaPostalObjectsExpandedIntoSurfaces, 0);
  assert.equal(e.dpaCommuneCensusRoadAddressParcelPointBuildingBufferCellModelOrAgidProxiesPromoted, 0);
});

test('credentialed API and official Geoportal DPA remain separate authorities', () => {
  const e = cl.blocker.evidence;
  assert.equal(e.operatorApiRequiresCustomerCredentials, true);
  assert.equal(e.operatorIntegrationRequiresCustomerAndCompanyDetails, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.catalogMatchedCodigoPostalRecords, 0); assert.equal(e.broadPostalCatalogResults, 2);
  assert.equal(e.broadPostalResultsArePostcodeLayers, false); assert.equal(e.dpaCommunePolygonsArePostalGeometry, false);
  assert.equal(e.clIdentityPreserved, true); assert.equal(e.mainlandIslandAntarcticClaimMaritimeBorderAndAdministrativeIdentitiesPreserved, true);
  assert.equal(e.postalAdministrativeStatisticalCadastralAddressBuildingAndAgidAuthoritiesSeparated, true);
});

test('CL ledger pins exact reports and advances to Colombia', () => {
  assert.equal(digest(sourceReport), cl.lastAttempt.reportDigest); assert.equal(digest(checks), cl.lastAttempt.engineeringReportDigest);
  assert.equal(cl.blocker.evidence.sourceReviewDigest, cl.lastAttempt.reportDigest);
  assert.equal(cl.blocker.evidence.engineeringChecksDigest, cl.lastAttempt.engineeringReportDigest);
  const co = ledger.countries.find(country => country.countryCode === 'CO'); assert.equal(co.status, 'pending'); assert.equal(co.attempts, 0);
});

test('shared and synthetic capability does not promote unavailable real CL assignments or areas', () => {
  const e = cl.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.syntheticClRuntimeContractsVerified, true);
  assert.equal(e.realClAgidPostalRuntimeVerified, false); assert.equal(e.realClAgidPostalApiVerified, false);
  assert.equal(e.realClAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.productionEligibleRecords, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(cl.blocker.requiresExplicitApproval, true); assert.equal(cl.blocker.retryAfter, '2026-09-07T17:13:59.841Z');
  assert.match(cl.blocker.retryPolicy, /Do not contact.*submit.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
