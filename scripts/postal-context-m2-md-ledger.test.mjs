import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const md = ledger.countries.find(country => country.countryCode === 'MD');
const me = ledger.countries.find(country => country.countryCode === 'ME');
const manifest = readJson('data/postal_country_packs/md/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/md/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/md-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/md-checks-2026-08-30.json', root));

test('Moldova remains blocked under its current postcode-area criterion', () => {
  assert.equal(md.status, 'blocked'); assert.equal(md.attempts, 1); assert.equal(md.evidence, null);
  assert.equal(md.m2Definition.id, 'M2_current_moldova_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === md.m2Definition.id), md.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('current operator facility evidence stays distinct from postal geometry', () => {
  const e = md.blocker.evidence;
  assert.equal(e.publicOperatorRecords, 1164); assert.equal(e.publicOperatorDistinctPostalCodes, 1144);
  assert.equal(e.publicOperatorPointRecords, 1164); assert.equal(e.officialPostcodePolygonRecords, 0);
  assert.equal(e.completeOrdinaryAndExceptionAllocationDenominatorAvailable, false);
  assert.equal(profile.sources.find(source => source.source_id === 'posta-moldovei-current-public-map-api').geometry_authority, 'facility_point_only');
});

test('legacy membership, distribution zones and reviewed proxies never become postcode areas', () => {
  const e = md.blocker.evidence;
  assert.equal(e.legacyWorkbookCodeBearingRows, 4873); assert.equal(e.legacyWorkbookGeometryRecords, 0);
  assert.equal(e.legacyDatasetSpecificLicenceEstablished, false); assert.equal(e.distributionQualityZonesPromoted, 0);
  assert.equal(e.addressMembershipRowsPromoted, 0); assert.equal(e.localityAdministrativeAddressBuildingParcelProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHullsCreated, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.syntheticFixturePromoted, false);
});

test('Moldova ledger pins exact reports and Montenegro is next', () => {
  assert.equal(digest(sourceReport), md.lastAttempt.reportDigest); assert.equal(digest(checks), md.lastAttempt.engineeringReportDigest);
  assert.equal(md.blocker.evidence.sourceReviewDigest, md.lastAttempt.reportDigest);
  assert.equal(md.blocker.evidence.engineeringChecksDigest, md.lastAttempt.engineeringReportDigest);
  assert.equal(me.status, 'pending'); assert.equal(me.region, 'europe');
});

test('shared UI capability does not promote fabricated real MD geometry', () => {
  const e = md.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realMdAgidPostalApiVerified, false);
  assert.equal(e.realMdAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.rawSourceBodiesInGit, 0); assert.equal(md.blocker.requiresExplicitApproval, false);
  assert.match(md.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
