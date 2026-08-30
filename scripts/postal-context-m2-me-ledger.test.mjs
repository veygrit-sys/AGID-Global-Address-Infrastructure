import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const me = ledger.countries.find(country => country.countryCode === 'ME');
const mk = ledger.countries.find(country => country.countryCode === 'MK');
const manifest = readJson('data/postal_country_packs/me/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/me/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/me-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/me-checks-2026-08-30.json', root));

test('Montenegro remains blocked under its current postcode-area criterion', () => {
  assert.equal(me.status, 'blocked'); assert.equal(me.attempts, 1); assert.equal(me.evidence, null);
  assert.equal(me.m2Definition.id, 'M2_current_montenegro_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === me.m2Definition.id), me.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('current operator facility points stay distinct from postcode geometry', () => {
  const e = me.blocker.evidence;
  assert.equal(e.publicOperatorMarkers, 164); assert.equal(e.distinctOperatorMarkerIds, 164);
  assert.equal(e.operatorPointRecords, 164); assert.equal(e.operatorInvalidWorldCoordinates, 0);
  assert.equal(e.officialPostcodePolygonRecords, 0); assert.equal(e.completeOrdinaryAndExceptionAllocationDenominatorAvailable, false);
  assert.equal(profile.sources.find(source => source.source_id === 'posta-crne-gore-current-office-map').geometry_authority, 'facility_point_only');
});

test('PAK, UZN context and geometric proxies never become postcode areas', () => {
  const e = me.blocker.evidence;
  assert.equal(e.operatorRightsPageUnderConstruction, true); assert.equal(e.operatorBulkProcessingAndRedistributionGrantEstablished, false);
  assert.equal(e.governmentPostalDatasetsFound, 0); assert.equal(e.pakRouteOrStreetPartAreasInvented, 0);
  assert.equal(e.facilityOrAddressPointsPromoted, 0); assert.equal(e.municipalitySpatialUnitAddressParcelBuildingProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHullsCreated, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.syntheticFixturePromoted, false);
});

test('Montenegro ledger pins exact reports and North Macedonia is next', () => {
  assert.equal(digest(sourceReport), me.lastAttempt.reportDigest); assert.equal(digest(checks), me.lastAttempt.engineeringReportDigest);
  assert.equal(me.blocker.evidence.sourceReviewDigest, me.lastAttempt.reportDigest);
  assert.equal(me.blocker.evidence.engineeringChecksDigest, me.lastAttempt.engineeringReportDigest);
  assert.equal(mk.status, 'pending'); assert.equal(mk.region, 'europe');
});

test('shared UI capability does not promote fabricated real ME geometry', () => {
  const e = me.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realMeAgidPostalApiVerified, false);
  assert.equal(e.realMeAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.rawSourceBodiesInGit, 0); assert.equal(me.blocker.requiresExplicitApproval, false);
  assert.match(me.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
