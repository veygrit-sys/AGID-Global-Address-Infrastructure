import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const im = ledger.countries.find(country => country.countryCode === 'IM');
const is = ledger.countries.find(country => country.countryCode === 'IS');
const manifest = readJson('data/postal_country_packs/im/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/im-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/im-checks-2026-08-30.json', root));

test('Isle of Man remains blocked under its truthful unit and postal-context criterion', () => {
  assert.equal(im.status, 'blocked');
  assert.equal(im.attempts, 1);
  assert.equal(im.evidence, null);
  assert.equal(im.m2Definition.id, 'M2_current_unit_postcode_and_truthful_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === im.m2Definition.id), im.m2Definition);
  assert.match(manifest.postal_system.normalization_rule, /IM/);
  assert.match(manifest.postal_system.full_code_geometry_rule, /Never buffer/);
});

test('the complete current ONSPD query remains a coordinate-less code denominator', () => {
  const evidence = im.blocker.evidence;
  assert.equal(evidence.liveOnspdRows, 4591);
  assert.equal(evidence.distinctLiveUnitPostcodes, 4591);
  assert.equal(evidence.duplicateLiveUnitPostcodes, 0);
  assert.equal(evidence.invalidLiveUnitPostcodes, 0);
  assert.equal(evidence.gridIndicator9Rows, 4591);
  assert.equal(evidence.nullEastingRows, 4591);
  assert.equal(evidence.nullNorthingRows, 4591);
  assert.equal(evidence.sentinelLatitudeLongitudeRows, 4591);
  assert.equal(evidence.onspdReturnedGeometryRows, 0);
});

test('public government GIS facility points never become IM postcode polygons', () => {
  const evidence = im.blocker.evidence;
  assert.equal(evidence.publicGisServicesReviewed, 25);
  assert.equal(evidence.publicGisServiceMetadataErrors, 0);
  assert.equal(evidence.publicGisLayersReviewed, 122);
  assert.equal(evidence.publicGisTablesReviewed, 4);
  assert.equal(evidence.publicGisPostcodeOrPostalNameMatches, 0);
  assert.equal(evidence.publicGisBroadPostPointLayers, 2);
  assert.equal(evidence.officialUnitPostcodePolygonRecords, 0);
  assert.equal(evidence.officialOutwardCodePolygonRecords, 0);
  assert.equal(evidence.postBoxOrPostOfficePointsPromoted, 0);
  assert.equal(evidence.administrativeOrConstituencyProxyPromoted, false);
});

test('Post Office restrictions and authority separation remain fail-closed', () => {
  const evidence = im.blocker.evidence;
  assert.equal(evidence.onspdNonBtOglReuseEstablished, true);
  assert.equal(evidence.finderPersonalUseRestrictionObserved, true);
  assert.equal(evidence.finderRowsOrAddressesExtracted, 0);
  assert.equal(evidence.internalPostOfficeApiObserved, true);
  assert.equal(evidence.publicPostOfficeApiAuthorityEstablished, false);
  assert.equal(evidence.authenticatedPaidOrContractedOperations, 0);
  assert.equal(evidence.addressBuildingCadastreOrLandRowsQueried, 0);
  assert.equal(evidence.inventedPointPoBoxRouteOrOrganizationAreas, 0);
});

test('Isle of Man ledger pins exact reports and Iceland is next', () => {
  assert.equal(digest(sourceReport), im.lastAttempt.reportDigest);
  assert.equal(digest(checks), im.lastAttempt.engineeringReportDigest);
  assert.equal(im.blocker.evidence.sourceReviewDigest, im.lastAttempt.reportDigest);
  assert.equal(im.blocker.evidence.engineeringChecksDigest, im.lastAttempt.engineeringReportDigest);
  assert.equal(is.status, 'pending');
  assert.equal(is.region, 'europe');
});

test('shared UI capability does not promote fabricated real IM geometry', () => {
  const evidence = im.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realImAgidPostalApiVerified, false);
  assert.equal(evidence.realImAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(im.blocker.requiresExplicitApproval, false);
  assert.match(im.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*request.*pay.*crawl.*query.*create.*publish.*deploy/i);
});
