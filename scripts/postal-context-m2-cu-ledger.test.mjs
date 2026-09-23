import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const cu = ledger.countries.find(country => country.countryCode === 'CU');
const manifest = readJson('data/postal_country_packs/cu/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/cu/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/cu-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/cu-checks-2026-09-01.json', root));

test('CU remains blocked under its complete assignment and real postal-area visualization criterion', () => {
  assert.equal(cu.status, 'blocked');
  assert.equal(cu.attempts, 1);
  assert.equal(cu.evidence, null);
  assert.equal(cu.m2Definition.id, 'M2_current_correos_cuba_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === cu.m2Definition.id), cu.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
});

test('exact receipts pin the Correos office-count mismatch and non-area contract', () => {
  const e = cu.blocker.evidence;
  assert.equal(e.exactOfficialBodiesByteAndSha256Bound, 11);
  assert.equal(e.exactOfficialBodiesBytes, 1492006);
  assert.equal(e.operatorPageNarrativeOfficeCount, 812);
  assert.equal(e.operatorApiOfficeCount, 841);
  assert.equal(e.observedPublicPostalOfficeRows, 10);
  assert.equal(e.officeCountNarrativeAndApiConsistent, false);
  assert.equal(e.officePayloadFields, 13);
  assert.equal(e.officePayloadGeometryFields, 0);
  assert.equal(e.currentCompleteFiveDigitAssignmentDenominatorAcquired, false);
  assert.equal(e.currentPostalCodeAssignmentsEligibleForAgid, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('UPU format and credentialed lookup remain non-area and non-redistributable', () => {
  const e = cu.blocker.evidence;
  assert.equal(e.upuSheetReferenceDate, '09/2004');
  assert.equal(e.upuApiKeyRequired, true);
  assert.equal(e.upuCdsSecurityTokenRequired, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.nonAreaOrProxyObjectsPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('CU ledger pins exact reports and advances to Curaçao', () => {
  assert.equal(digest(sourceReport), cu.lastAttempt.reportDigest);
  assert.equal(digest(checks), cu.lastAttempt.engineeringReportDigest);
  assert.equal(cu.blocker.evidence.sourceReviewDigest, cu.lastAttempt.reportDigest);
  assert.equal(cu.blocker.evidence.engineeringChecksDigest, cu.lastAttempt.engineeringReportDigest);
  const cw = ledger.countries.find(country => country.countryCode === 'CW');
  assert.equal(cw.status, 'pending');
  assert.equal(cw.attempts, 0);
});

test('shared and synthetic capability does not promote unavailable real CU areas', () => {
  const e = cu.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true);
  assert.equal(e.syntheticCuRuntimeContractsVerified, true);
  assert.equal(e.realCuAgidPostalRuntimeVerified, false);
  assert.equal(e.realCuAgidPostalApiVerified, false);
  assert.equal(e.realCuAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0);
  assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(cu.blocker.requiresExplicitApproval, false);
  assert.equal(cu.blocker.retryAfter, '2026-09-07T22:07:06.826Z');
  assert.match(cu.blocker.retryPolicy, /Do not contact.*register.*request.*key.*token.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});

test('CU identities and address authority remain separated', () => {
  const e = cu.blocker.evidence;
  assert.equal(e.cuIdentityPreserved, true);
  assert.equal(e.postalOfficePostcodeLocalityMunicipalityProvinceAndPostalAreaIdentitiesPreserved, true);
  assert.equal(e.postalAdministrativeStatisticalCartographicCadastralAddressBuildingAndAgidAuthoritiesSeparated, true);
});
