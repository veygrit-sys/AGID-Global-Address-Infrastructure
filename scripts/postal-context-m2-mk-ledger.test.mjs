import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const mk = ledger.countries.find(country => country.countryCode === 'MK');
const mt = ledger.countries.find(country => country.countryCode === 'MT');
const manifest = readJson('data/postal_country_packs/mk/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/mk/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/mk-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/mk-checks-2026-08-30.json', root));

test('North Macedonia remains blocked under its current postcode-area criterion', () => {
  assert.equal(mk.status, 'blocked'); assert.equal(mk.attempts, 1); assert.equal(mk.evidence, null);
  assert.equal(mk.m2Definition.id, 'M2_current_north_macedonia_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === mk.m2Definition.id), mk.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('official locality and facility sources remain distinct non-area grains', () => {
  const evidence = mk.blocker.evidence;
  assert.equal(evidence.operatorAddressingRows, 1831); assert.equal(evidence.operatorAddressingDistinctPostcodes, 230);
  assert.equal(evidence.operatorFacilityPoints, 331); assert.equal(evidence.distinctOperatorFacilityIds, 331);
  assert.equal(evidence.operatorInvalidWorldCoordinates, 0); assert.equal(evidence.officialPostcodePolygonRecords, 0);
  assert.equal(profile.sources.find(source => source.source_id === 'posta-north-macedonia-current-office-locator').geometry_authority, 'facility_point_only');
});

test('source set mismatch, rights and geometric proxies fail closed', () => {
  const evidence = mk.blocker.evidence;
  assert.equal(evidence.sharedPostcodes, 218); assert.equal(evidence.addressingOnlyPostcodes, 12); assert.equal(evidence.locatorOnlyPostcodes, 108);
  assert.equal(evidence.completeOrdinaryAndExceptionAllocationDenominatorAvailable, false);
  assert.equal(evidence.operatorDatasetSpecificBulkProcessingAndRedistributionGrantEstablished, false);
  assert.equal(evidence.localityOrFacilityPointsPromoted, 0); assert.equal(evidence.municipalityBranchAddressCadastralProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0); assert.equal(evidence.convexOrConcaveHullsCreated, 0); assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('North Macedonia ledger pins exact reports and preserves the next-country order', () => {
  assert.equal(digest(sourceReport), mk.lastAttempt.reportDigest); assert.equal(digest(checks), mk.lastAttempt.engineeringReportDigest);
  assert.equal(mk.blocker.evidence.sourceReviewDigest, mk.lastAttempt.reportDigest);
  assert.equal(mk.blocker.evidence.engineeringChecksDigest, mk.lastAttempt.engineeringReportDigest);
  assert.equal(mt.status, 'pending'); assert.equal(mt.region, 'europe');
});

test('shared UI capability does not promote fabricated real MK geometry', () => {
  const evidence = mk.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true); assert.equal(evidence.realMkAgidPostalApiVerified, false);
  assert.equal(evidence.realMkAgidAppAreaVisualizationVerified, false); assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.rawSourceBodiesInGit, 0); assert.equal(mk.blocker.requiresExplicitApproval, false);
  assert.match(mk.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
