import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const ledger = readJson('docs/postal-context-m2-rollout.json');
const gg = ledger.countries.find(country => country.countryCode === 'GG');
const gi = ledger.countries.find(country => country.countryCode === 'GI');
const manifest = readJson('data/postal_country_packs/gg/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/gg-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/gg-checks-2026-08-30.json', root));

test('Guernsey remains blocked under its current full-code postcode-area criterion', () => {
  assert.equal(gg.status, 'blocked');
  assert.equal(gg.attempts, 1);
  assert.equal(gg.evidence, null);
  assert.equal(gg.m2Definition.id, 'M2_current_guernsey_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === gg.m2Definition.id), gg.m2Definition);
  assert.equal(gg.blocker.evidence.authorizedPostcodePolygonRecordsAvailableToAgid, 0);
});

test('placeholders, centroids, parcels, tiles and fixtures never promote GG', () => {
  assert.equal(gg.blocker.evidence.onspdChannelIslandsPositionalQualityIndicator, 9);
  assert.equal(gg.blocker.evidence.onspdUsableGyPointRecords, 0);
  assert.equal(gg.blocker.evidence.pointOrCentroidPromotedToPolygon, false);
  assert.equal(gg.blocker.evidence.placeholderCoordinatePromoted, false);
  assert.equal(gg.blocker.evidence.parcelDissolves, 0);
  assert.equal(gg.blocker.evidence.inventedNonAreaSurfaces, 0);
  assert.match(gg.m2Definition.definition, /coordinate placeholders.*paid centroids.*cadastral parcels.*base-map tiles.*synthetic fixtures.*invented non-area surfaces/i);
});

test('Guernsey ledger pins exact reports and Gibraltar is next', () => {
  assert.equal(digest(sourceReport), gg.lastAttempt.reportDigest);
  assert.equal(digest(checks), gg.lastAttempt.engineeringReportDigest);
  assert.equal(gg.blocker.evidence.sourceReviewDigest, gg.lastAttempt.reportDigest);
  assert.equal(gg.blocker.evidence.engineeringChecksDigest, gg.lastAttempt.engineeringReportDigest);
  assert.equal(gi.status, 'pending');
  assert.equal(gi.region, 'europe');
});

test('shared map capability does not promote unavailable real GG area geometry', () => {
  assert.equal(gg.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(gg.blocker.evidence.realGgAgidPostalApiVerified, false);
  assert.equal(gg.blocker.evidence.realGgAgidAppAreaVisualizationVerified, false);
  assert.equal(gg.blocker.requiresExplicitApproval, true);
  assert.match(gg.blocker.retryPolicy, /Do not authenticate.*accept.*request.*pay.*create.*query.*publish.*deploy/i);
});
