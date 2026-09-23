import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bb = ledger.countries.find(country => country.countryCode === 'BB');
const manifest = readJson('data/postal_country_packs/bb/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bb/postal-context/source-profile.json');
const sourceReportBytes = readFileSync(new URL('reports/postal-context-m2/bb-source-review-2026-08-31.json', root));
const checksBytes = readFileSync(new URL('reports/postal-context-m2/bb-checks-2026-08-31.json', root));

test('BB remains blocked under its assignment and real-area criterion', () => {
  assert.equal(bb.status, 'blocked'); assert.equal(bb.attempts, 1); assert.equal(bb.evidence, null);
  assert.equal(bb.m2Definition.id, 'M2_current_bps_assignments_and_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bb.m2Definition.id), bb.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('exact receipts preserve the BPS and UPU format evidence without feature rows', () => {
  const e = bb.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 11); assert.equal(e.exactOfficialBodiesBytes, 1951330);
  assert.deepEqual(e.currentPostalCodeFormats, ['BBNNNNN', 'BBNNNNN-AAAAA']);
  assert.equal(e.bpsSearchInput, 'neighbourhood-or-district'); assert.equal(e.upuEdition, '11/2014');
  assert.equal(e.featureRowsQueried, 0); assert.equal(e.currentCompleteLegacyAndUpdatedAssignmentsValidated, 0);
  assert.equal(e.completeAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.equal(profile.m2_review.exact_official_publication_and_metadata_bodies, 11);
});

test('copyright and empty ArcGIS rights metadata fail closed', () => {
  const e = bb.blocker.evidence;
  assert.equal(e.bpsSiteCopyrightYear, 2026);
  assert.equal(e.bpsTermsRestrictElectronicCopiesOfCopyrightMaterialWithoutPermission, true);
  assert.equal(e.arcgisExperienceAccess, 'public'); assert.equal(e.arcgisExperienceLicenseInfo, null);
  assert.equal(e.arcgisExperienceTermsFieldPresent, false); assert.equal(e.arcgisWebMapLicenseInfo, '');
  assert.equal(e.arcgisBuildingItemLicenseInfo, '');
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('building polygons never stand in for legacy postcode areas', () => {
  const e = bb.blocker.evidence;
  assert.equal(e.bbidBuildingLayerName, 'Simplified Buildings 24082026');
  assert.equal(e.bbidBuildingLayerGeometryType, 'esriGeometryPolygon'); assert.equal(e.bbidBuildingLayerSpatialReferenceWkid, 21292);
  assert.deepEqual(e.bbidFieldsValidated, ['BuildingID', 'ShortPosta', 'LongPostal']);
  assert.equal(e.publicBbidBuildingPolygonLayerMetadataValidated, 1); assert.equal(e.rightsClearedBbidBuildingPolygonArtifacts, 0);
  assert.equal(e.officialLegacyPostalAreaPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalAreaPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.buildingFootprintsPromotedAsLegacyPostalAreas, 0); assert.equal(e.localityOrParishProxiesPromoted, 0);
  assert.equal(e.buffersHullsVoronoiRasterOrAgidCellsPromoted, 0); assert.equal(e.productionEligibleRecords, 0);
});

test('BB ledger pins exact reports and advances to Saint Barthelemy', () => {
  assert.equal(digest(sourceReportBytes), bb.lastAttempt.reportDigest); assert.equal(digest(checksBytes), bb.lastAttempt.engineeringReportDigest);
  assert.equal(bb.blocker.evidence.sourceReviewDigest, bb.lastAttempt.reportDigest);
  assert.equal(bb.blocker.evidence.engineeringChecksDigest, bb.lastAttempt.engineeringReportDigest);
  const bl = ledger.countries.find(country => country.countryCode === 'BL'); assert.equal(bl.status, 'pending'); assert.equal(bl.attempts, 0);
});

test('shared capability does not promote missing BB inputs or artifacts', () => {
  const e = bb.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realBbAgidPostalApiVerified, false);
  assert.equal(e.realBbAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0); assert.equal(e.bbIdentityPreserved, true);
  assert.equal(bb.blocker.requiresExplicitApproval, false); assert.equal(bb.blocker.retryAfter, '2026-09-07T09:32:18.170Z');
  assert.match(bb.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
