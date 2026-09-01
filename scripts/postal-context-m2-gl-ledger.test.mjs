import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gl = ledger.countries.find(country => country.countryCode === 'GL');
const manifest = readJson('data/postal_country_packs/gl/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gl/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/gl-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/gl-checks-2026-09-01.json', root));

test('GL remains blocked under its current official-polygon and rights criterion', () => {
  assert.equal(gl.status, 'blocked');
  assert.equal(gl.attempts, 1);
  assert.equal(gl.evidence, null);
  assert.equal(gl.m2Definition.id, 'M2_current_greenland_address_register_postcode_polygon_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === gl.m2Definition.id), gl.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve the complete current observation and Tusass discrepancy', () => {
  const e = gl.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 5);
  assert.equal(e.exactOfficialBodiesBytes, 363762);
  assert.equal(e.addressRegisterFeatures, 32);
  assert.equal(e.addressRegisterDistinctPostcodes, 31);
  assert.equal(e.tusassRowsWithFourDigitCode, 28);
  assert.equal(e.tusassRowsWithDashNoSeparateCode, 44);
  assert.deepEqual(e.registerCodesMissingFromTusassTable, [3940, 3972, 3982]);
});

test('empty geometry and unlicensed source data never promote', () => {
  const e = gl.blocker.evidence;
  assert.equal(e.nonEmptyOfficialPostalPolygonRecordsObserved, 30);
  assert.equal(e.emptyPolygonRecordsObserved, 2);
  assert.deepEqual(e.emptyPolygonObjectIds, [42399, 42400]);
  assert.deepEqual(e.emptyPolygonPostcodes, [2412, 3992]);
  assert.equal(e.validAlternativeForEmptyFeaturePostcode.postcode, 3992);
  assert.equal(e.validAlternativeForEmptyFeaturePostcode.objectId, 42369);
  assert.equal(e.explicitCompatibleRedistributionAndPublicServingLicencePublished, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecordsEligibleForAgid, 0);
  assert.equal(e.productionEligibleRecords, 0);
  assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('GL reports are digest-pinned and the ledger advances exactly one country', () => {
  assert.equal(digest(sourceReport), gl.lastAttempt.reportDigest);
  assert.equal(digest(checks), gl.lastAttempt.engineeringReportDigest);
  assert.equal(gl.blocker.evidence.sourceReviewDigest, gl.lastAttempt.reportDigest);
  assert.equal(gl.blocker.evidence.engineeringChecksDigest, gl.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'GP');
  assert.equal(next.status, 'pending');
  assert.equal(next.attempts, 0);
});

test('shared capability does not promote missing GL inputs or artifacts', () => {
  const e = gl.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true);
  assert.equal(e.realGlAgidPostalApiVerified, false);
  assert.equal(e.realGlAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0);
  assert.equal(gl.blocker.requiresExplicitApproval, false);
  assert.match(gl.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('GL identity and non-postal proxies stay separate from postal authority', () => {
  const e = gl.blocker.evidence;
  assert.equal(e.glIdentityPreserved, true);
  assert.equal(e.greenlandKalaallitNunaatIdentityPreserved, true);
  assert.equal(e.denmarkFaroeCanadaOrOtherArcticIdentityMerged, false);
  assert.equal(e.municipalityLocalityPlacenameAddressBuildingRouteProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0);
  assert.equal(e.convexOrConcaveHulls, 0);
  assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidCellsPromoted, 0);
  assert.match(manifest.postal_system.jurisdiction_rule, /Preserve ISO GL/);
});
