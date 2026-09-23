import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const cr = ledger.countries.find(country => country.countryCode === 'CR');
const manifest = readJson('data/postal_country_packs/cr/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/cr/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/cr-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/cr-checks-2026-09-01.json', root));

test('CR remains blocked under its current assignment, dated alias and rights-cleared area criterion', () => {
  assert.equal(cr.status, 'blocked'); assert.equal(cr.attempts, 1); assert.equal(cr.evidence, null);
  assert.equal(cr.m2Definition.id, 'M2_current_correos_assignment_to_rights_cleared_district_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === cr.m2Definition.id), cr.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('exact receipts pin the 493-to-492 mismatch and unresolved Puerto Jiménez history', () => {
  const e = cr.blocker.evidence;
  assert.equal(e.exactTopLevelBodiesByteAndSha256Bound, 6); assert.equal(e.exactTopLevelOfficialBodiesBytes, 15518804);
  assert.equal(e.exactArchiveMemberMetadataBytes, 34595);
  assert.equal(e.operatorEnabledDistrictRows, 493); assert.equal(e.operatorUniquePostalCodes, 493);
  assert.equal(e.inecUgedPolygonRecords, 492); assert.equal(e.inecUgedUniqueCodes, 492); assert.equal(e.exactCodeJoins, 492);
  assert.deepEqual(e.operatorOnlyCodes, ['60702']); assert.deepEqual(e.geometryOnlyCodes, []);
  assert.deepEqual(e.ambiguousEnabledPuertoJimenezCodes, ['60702', '61301']);
  assert.equal(e.oneToOneOrDatedAliasCrosswalkEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('valid UGED geometry remains unpromoted while resource-level serving rights are unclear', () => {
  const e = cr.blocker.evidence;
  assert.equal(e.ugedGeometryType, 'Polygon'); assert.equal(e.ugedCrs, 'EPSG:8908');
  assert.equal(e.ugedEmptyGeometries, 0); assert.equal(e.ugedInvalidGeometries, 0);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.nonAreaOrProxyObjectsPromoted, 0); assert.equal(e.productionEligibleRecords, 0);
  assert.equal(e.crIdentityPreserved, true); assert.equal(e.provinceCantonDistrictAndUgedIdentitiesPreserved, true);
  assert.equal(e.postalAdministrativeGeostatisticalCadastralAddressBuildingAndAgidAuthoritiesSeparated, true);
});

test('CR ledger pins exact reports and advances to Cuba', () => {
  assert.equal(digest(sourceReport), cr.lastAttempt.reportDigest); assert.equal(digest(checks), cr.lastAttempt.engineeringReportDigest);
  assert.equal(cr.blocker.evidence.sourceReviewDigest, cr.lastAttempt.reportDigest);
  assert.equal(cr.blocker.evidence.engineeringChecksDigest, cr.lastAttempt.engineeringReportDigest);
  const cu = ledger.countries.find(country => country.countryCode === 'CU'); assert.equal(cu.status, 'pending'); assert.equal(cu.attempts, 0);
});

test('shared and synthetic capability does not promote unavailable real CR areas', () => {
  const e = cr.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.syntheticCrRuntimeContractsVerified, true);
  assert.equal(e.realCrAgidPostalRuntimeVerified, false); assert.equal(e.realCrAgidPostalApiVerified, false);
  assert.equal(e.realCrAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(cr.blocker.requiresExplicitApproval, false); assert.equal(cr.blocker.retryAfter, '2026-09-07T21:09:35.746Z');
  assert.match(cr.blocker.retryPolicy, /Do not contact.*submit.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
