import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const lu = ledger.countries.find(country => country.countryCode === 'LU');
const lv = ledger.countries.find(country => country.countryCode === 'LV');
const manifest = readJson('data/postal_country_packs/lu/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/lu/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/lu-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/lu-checks-2026-08-30.json', root));

test('Luxembourg remains blocked under its current postcode-area criterion', () => {
  assert.equal(lu.status, 'blocked');
  assert.equal(lu.attempts, 1);
  assert.equal(lu.evidence, null);
  assert.equal(lu.m2Definition.id, 'M2_current_luxembourg_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === lu.m2Definition.id), lu.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('current assignment sources remain distinct and preserve leading-zero codes', () => {
  const evidence = lu.blocker.evidence;
  assert.equal(evidence.postCsvRows, 9715);
  assert.equal(evidence.postDistinctCodes, 4750);
  assert.equal(evidence.postCodesStartingZero, 275);
  assert.equal(evidence.caclrDistinctCodes, 4430);
  assert.equal(evidence.postOnlyVsCaclrCodes, 389);
  assert.equal(evidence.caclrOnlyVsPostCodes, 69);
  assert.equal(evidence.postLeadingZeroCodesWithAddressPoint, 0);
  assert.match(manifest.postal_system.full_code_format, /NNNN/);
});

test('address points, endpoints and context proxies never become postcode areas', () => {
  const evidence = lu.blocker.evidence;
  assert.equal(evidence.addressPointRows, 179491);
  assert.equal(evidence.addressPointGeometryType, 'Point');
  assert.equal(evidence.officialPostcodePolygonRecords, 0);
  assert.equal(evidence.rightsClearedDerivedPostcodePolygonRecords, 0);
  assert.equal(evidence.addressPointsPromotedToAreas, 0);
  assert.equal(evidence.packupPointPostPoBoxOrganizationOrRouteAreasInvented, 0);
  assert.equal(evidence.administrativeParcelOrBuildingProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
  const pointSource = profile.sources.find(source => source.source_id === 'act-bd-adresses');
  assert.equal(pointSource.geometry_authority, 'official_address_point');
});

test('Luxembourg ledger pins exact reports and Latvia is next', () => {
  assert.equal(digest(sourceReport), lu.lastAttempt.reportDigest);
  assert.equal(digest(checks), lu.lastAttempt.engineeringReportDigest);
  assert.equal(lu.blocker.evidence.sourceReviewDigest, lu.lastAttempt.reportDigest);
  assert.equal(lu.blocker.evidence.engineeringChecksDigest, lu.lastAttempt.engineeringReportDigest);
  assert.equal(lv.status, 'pending');
  assert.equal(lv.region, 'europe');
});

test('shared UI capability does not promote fabricated real LU geometry', () => {
  const evidence = lu.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realLuAgidPostalApiVerified, false);
  assert.equal(evidence.realLuAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.postExplicitProcessingRightEstablished, false);
  assert.equal(evidence.postExplicitPublicServingRightEstablished, false);
  assert.equal(evidence.postExplicitRedistributionRightEstablished, false);
  assert.equal(lu.blocker.requiresExplicitApproval, false);
  assert.match(lu.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
