import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const mc = ledger.countries.find(country => country.countryCode === 'MC');
const md = ledger.countries.find(country => country.countryCode === 'MD');
const manifest = readJson('data/postal_country_packs/mc/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/mc/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/mc-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/mc-checks-2026-08-30.json', root));

test('Monaco remains blocked under its current postcode-area criterion', () => {
  assert.equal(mc.status, 'blocked');
  assert.equal(mc.attempts, 1);
  assert.equal(mc.evidence, null);
  assert.equal(mc.m2Definition.id, 'M2_current_monaco_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === mc.m2Definition.id), mc.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('current official assignment evidence stays distinct from geometry', () => {
  const evidence = mc.blocker.evidence;
  assert.equal(evidence.officialPostalRows, 39192);
  assert.equal(evidence.officialDistinctPostalCodes, 6328);
  assert.equal(evidence.officialMonacoRows, 1);
  assert.equal(evidence.officialMonacoOrdinaryCode, '98000');
  assert.equal(evidence.officialMonacoGeopoints, 0);
  assert.equal(evidence.completeOrdinaryAndExceptionAllocationDenominatorAvailable, false);
  assert.equal(profile.sources.find(source => source.source_id === 'la-poste-official-postal-codes-monaco').geometry_authority, 'none');
});

test('Principality, endpoints and reviewed proxies never become postcode areas', () => {
  const evidence = mc.blocker.evidence;
  assert.equal(evidence.historicalDerivedHullFeatures, 6158);
  assert.equal(evidence.historicalDerivedHullPrefix98Features, 0);
  assert.equal(evidence.officialPostcodePolygonRecords, 0);
  assert.equal(evidence.rightsClearedDerivedPostcodePolygonRecords, 0);
  assert.equal(evidence.principalityOrCommuneBoundaryPromoted, 0);
  assert.equal(evidence.cedexOrganizationServiceOrPoBoxAreasInvented, 0);
  assert.equal(evidence.administrativeQuartierUrbanPlanRoadBuildingProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHullsCreated, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('Monaco ledger pins exact reports and Moldova is next', () => {
  assert.equal(digest(sourceReport), mc.lastAttempt.reportDigest);
  assert.equal(digest(checks), mc.lastAttempt.engineeringReportDigest);
  assert.equal(mc.blocker.evidence.sourceReviewDigest, mc.lastAttempt.reportDigest);
  assert.equal(mc.blocker.evidence.engineeringChecksDigest, mc.lastAttempt.engineeringReportDigest);
  assert.equal(md.status, 'pending');
  assert.equal(md.region, 'europe');
});

test('shared UI capability does not promote fabricated real MC geometry', () => {
  const evidence = mc.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realMcAgidPostalApiVerified, false);
  assert.equal(evidence.realMcAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(mc.blocker.requiresExplicitApproval, false);
  assert.match(mc.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
