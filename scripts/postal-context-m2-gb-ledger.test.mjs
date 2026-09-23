import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const ledger = readJson('docs/postal-context-m2-rollout.json');
const gb = ledger.countries.find(country => country.countryCode === 'GB');
const gg = ledger.countries.find(country => country.countryCode === 'GG');
const manifest = readJson('data/postal_country_packs/gb/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/gb-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/gb-checks-2026-08-30.json', root));

test('United Kingdom remains blocked under its current unit-postcode area criterion', () => {
  assert.equal(gb.status, 'blocked');
  assert.equal(gb.attempts, 1);
  assert.equal(gb.evidence, null);
  assert.equal(gb.m2Definition.id, 'M2_current_uk_unit_postcode_area_visualization');
  assert.equal(manifest.promotion.stages.find(stage => stage.id === gb.m2Definition.id)?.id, gb.m2Definition.id);
  assert.equal(gb.blocker.evidence.authorizedUnitPostcodePolygonRecordsAvailableToAgid, 0);
});

test('point products, synthetic fixtures, licensed samples and BT gaps never promote GB', () => {
  assert.equal(gb.blocker.evidence.codePointOpenGeometry, 'Point');
  assert.equal(gb.blocker.evidence.codePointWithPolygonsAccessAuthorized, false);
  assert.equal(gb.blocker.evidence.northernIrelandUnitPostcodePolygonAvailable, false);
  assert.equal(gb.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(gb.blocker.evidence.inventedNonAreaSurfaces, 0);
  assert.match(gb.m2Definition.definition, /Point-only products.*synthetic fixtures.*agreement-gated samples.*invented non-area surfaces/i);
});

test('United Kingdom ledger pins exact reports and Guernsey is next', () => {
  assert.equal(digest(sourceReport), gb.lastAttempt.reportDigest);
  assert.equal(digest(checks), gb.lastAttempt.engineeringReportDigest);
  assert.equal(gb.blocker.evidence.sourceReviewDigest, gb.lastAttempt.reportDigest);
  assert.equal(gb.blocker.evidence.engineeringChecksDigest, gb.lastAttempt.engineeringReportDigest);
  assert.equal(gg.status, 'pending');
  assert.equal(gg.region, 'europe');
});

test('shared map capability does not promote unavailable real GB area geometry', () => {
  assert.equal(gb.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(gb.blocker.evidence.realGbAgidPostalApiVerified, false);
  assert.equal(gb.blocker.evidence.realGbAgidAppAreaVisualizationVerified, false);
  assert.equal(gb.blocker.requiresExplicitApproval, true);
  assert.match(gb.blocker.retryPolicy, /Do not authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
