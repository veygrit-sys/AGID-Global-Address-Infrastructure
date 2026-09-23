import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const lv = ledger.countries.find(country => country.countryCode === 'LV');
const mc = ledger.countries.find(country => country.countryCode === 'MC');
const manifest = readJson('data/postal_country_packs/lv/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/lv/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/lv-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/lv-checks-2026-08-30.json', root));

test('Latvia remains blocked under its current postcode-area criterion', () => {
  assert.equal(lv.status, 'blocked');
  assert.equal(lv.attempts, 1);
  assert.equal(lv.evidence, null);
  assert.equal(lv.m2Definition.id, 'M2_current_latvia_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === lv.m2Definition.id), lv.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('current VZD rows remain postcode-bearing address points', () => {
  const evidence = lv.blocker.evidence;
  assert.equal(evidence.vzdAddressRows, 610513);
  assert.equal(evidence.vzdDistinctObjectIds, 610513);
  assert.equal(evidence.vzdActiveAddressRows, 550515);
  assert.equal(evidence.vzdActiveApprovedRows, 550515);
  assert.equal(evidence.vzdActiveValidPostcodeRows, 550515);
  assert.equal(evidence.vzdActiveDistinctPostcodes, 693);
  assert.equal(evidence.vzdActiveMissingCoordinateRows, 0);
  assert.equal(evidence.vzdAddressGeometryType, 'Point');
  const addressSource = profile.sources.find(source => source.source_id === 'vzd-latvia-address-register');
  assert.equal(addressSource.geometry_authority, 'official_address_registry_geometry');
});

test('operator references, address points and context proxies never become postcode areas', () => {
  const evidence = lv.blocker.evidence;
  assert.equal(evidence.operatorBooksListed, 11);
  assert.equal(evidence.operatorBooksBytePinned, 8);
  assert.equal(evidence.completeOperatorAssignmentDenominatorAvailable, false);
  assert.equal(evidence.officialPostcodePolygonRecords, 0);
  assert.equal(evidence.rightsClearedDerivedPostcodePolygonRecords, 0);
  assert.equal(evidence.addressPointsPromotedToAreas, 0);
  assert.equal(evidence.organizationInstitutionPostOfficePoBoxOrRouteAreasInvented, 0);
  assert.equal(evidence.administrativeLocalityRoadParcelOrBuildingProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('Latvia ledger pins exact reports and Monaco is next', () => {
  assert.equal(digest(sourceReport), lv.lastAttempt.reportDigest);
  assert.equal(digest(checks), lv.lastAttempt.engineeringReportDigest);
  assert.equal(lv.blocker.evidence.sourceReviewDigest, lv.lastAttempt.reportDigest);
  assert.equal(lv.blocker.evidence.engineeringChecksDigest, lv.lastAttempt.engineeringReportDigest);
  assert.equal(mc.status, 'pending');
  assert.equal(mc.region, 'europe');
});

test('shared UI capability does not promote fabricated real LV geometry', () => {
  const evidence = lv.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realLvAgidPostalApiVerified, false);
  assert.equal(evidence.realLvAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.latvijasPastsExplicitProcessingRightEstablished, false);
  assert.equal(evidence.latvijasPastsExplicitPublicServingRightEstablished, false);
  assert.equal(evidence.latvijasPastsExplicitRedistributionRightEstablished, false);
  assert.equal(lv.blocker.requiresExplicitApproval, false);
  assert.match(lv.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
