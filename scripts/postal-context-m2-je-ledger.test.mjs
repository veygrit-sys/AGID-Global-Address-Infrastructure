import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const je = ledger.countries.find(country => country.countryCode === 'JE');
const li = ledger.countries.find(country => country.countryCode === 'LI');
const manifest = readJson('data/postal_country_packs/je/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/je-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/je-checks-2026-08-30.json', root));

test('Jersey remains blocked under its truthful unit and broader postal-context criterion', () => {
  assert.equal(je.status, 'blocked');
  assert.equal(je.attempts, 1);
  assert.equal(je.evidence, null);
  assert.equal(je.m2Definition.id, 'M2_current_jersey_unit_postcode_and_truthful_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === je.m2Definition.id), je.m2Definition);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.match(manifest.postal_system.normalization_rule, /JE/);
  assert.match(manifest.postal_system.full_code_geometry_rule, /Never buffer/);
});

test('the complete current ONSPD denominator remains coordinate-less for Jersey', () => {
  const evidence = je.blocker.evidence;
  assert.equal(evidence.onspdRows, 3674);
  assert.equal(evidence.liveOnspdRows, 3215);
  assert.equal(evidence.terminatedOnspdRows, 459);
  assert.equal(evidence.distinctOnspdUnitPostcodes, 3674);
  assert.equal(evidence.duplicateOnspdUnitPostcodes, 0);
  assert.equal(evidence.invalidOnspdUnitPostcodes, 0);
  assert.equal(evidence.gridIndicator9Rows, 3674);
  assert.equal(evidence.nullEastingRows, 3674);
  assert.equal(evidence.nullNorthingRows, 3674);
  assert.equal(evidence.sentinelLatitudeLongitudeRows, 3674);
  assert.equal(evidence.onspdGeometrySampleRowsWithGeometry, 0);
});

test('incomplete or stale JSearch points never become Jersey postcode polygons', () => {
  const evidence = je.blocker.evidence;
  assert.equal(evidence.jsearchRows, 1914);
  assert.equal(evidence.jsearchDistinctValues, 1914);
  assert.equal(evidence.jsearchFormatValidValues, 1913);
  assert.equal(evidence.jsearchInvalidValues, 1);
  assert.equal(evidence.jsearchLiveOnspdOverlap, 1891);
  assert.equal(evidence.jsearchTerminatedOnspdOverlap, 19);
  assert.equal(evidence.jsearchNotInOnspd, 4);
  assert.equal(evidence.jsearchMissingLiveOnspd, 1324);
  assert.equal(evidence.jsearchGeometryType, 'esriGeometryPoint');
  assert.equal(evidence.jsearchPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.jsearchPointsPromoted, 0);
});

test('rights and authority separation remain fail-closed', () => {
  const evidence = je.blocker.evidence;
  assert.equal(evidence.onspdNonBtOglReuseEstablished, true);
  assert.equal(evidence.jerseyOpenDataOgljObserved, true);
  assert.equal(evidence.openDataPostcodeDatasetCount, 0);
  assert.equal(evidence.jsearchLicenceOrAccessGrantEstablished, false);
  assert.equal(evidence.finderRowsOrAddressesExtracted, 0);
  assert.equal(evidence.finderBulkExtractionOrRedistributionRightEstablished, false);
  assert.equal(evidence.authenticatedPaidOrContractedOperations, 0);
  assert.equal(evidence.addressBuildingCadastreOrLandRowsQueried, 0);
  assert.equal(evidence.parishOrAdministrativeProxyPromoted, false);
  assert.equal(evidence.inventedPointPoBoxRouteOrOrganizationAreas, 0);
});

test('Jersey ledger pins exact reports and Liechtenstein is next', () => {
  assert.equal(digest(sourceReport), je.lastAttempt.reportDigest);
  assert.equal(digest(checks), je.lastAttempt.engineeringReportDigest);
  assert.equal(je.blocker.evidence.sourceReviewDigest, je.lastAttempt.reportDigest);
  assert.equal(je.blocker.evidence.engineeringChecksDigest, je.lastAttempt.engineeringReportDigest);
  assert.equal(li.status, 'pending');
  assert.equal(li.region, 'europe');
});

test('shared UI capability does not promote fabricated real Jersey geometry', () => {
  const evidence = je.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realJeAgidPostalApiVerified, false);
  assert.equal(evidence.realJeAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(je.blocker.requiresExplicitApproval, false);
  assert.match(je.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*request.*pay.*crawl.*query.*create.*publish.*deploy/i);
});
