import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gi = ledger.countries.find(country => country.countryCode === 'GI');
const gr = ledger.countries.find(country => country.countryCode === 'GR');
const manifest = readJson('data/postal_country_packs/gi/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/gi-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/gi-checks-2026-08-30.json', root));

test('Gibraltar remains blocked under its virtual territory criterion', () => {
  assert.equal(gi.status, 'blocked');
  assert.equal(gi.attempts, 1);
  assert.equal(gi.evidence, null);
  assert.equal(gi.m2Definition.id, 'M2_current_gibraltar_generic_postcode_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === gi.m2Definition.id), gi.m2Definition);
  assert.equal(gi.blocker.evidence.rightsClearedVirtualTerritoryPolygonRecords, 0);
});

test('one generic code and E/V exception do not invent a postal boundary', () => {
  assert.equal(gi.blocker.evidence.currentPostcodes, 1);
  assert.equal(gi.blocker.evidence.normalizedPostcode, 'GX11 1AA');
  assert.equal(gi.blocker.evidence.singleCodeWholeCountry, true);
  assert.equal(gi.blocker.evidence.evDomesticAlternativeIsPostcode, false);
  assert.equal(gi.blocker.evidence.officialSubCountryPostalAreas, 0);
  assert.equal(gi.blocker.evidence.inventedDeliveryZones, 0);
});

test('Gibraltar ledger pins exact reports and Greece is next', () => {
  assert.equal(digest(sourceReport), gi.lastAttempt.reportDigest);
  assert.equal(digest(checks), gi.lastAttempt.engineeringReportDigest);
  assert.equal(gi.blocker.evidence.sourceReviewDigest, gi.lastAttempt.reportDigest);
  assert.equal(gi.blocker.evidence.engineeringChecksDigest, gi.lastAttempt.engineeringReportDigest);
  assert.equal(gr.status, 'pending');
  assert.equal(gr.region, 'europe');
});

test('shared UI capability does not promote unauthorized real GI geometry', () => {
  assert.equal(gi.blocker.evidence.geoportalReproductionAndDistributionPermissionEstablished, false);
  assert.equal(gi.blocker.evidence.geoportalFeatureRowsQueried, 0);
  assert.equal(gi.blocker.evidence.oarRowsQueried, 0);
  assert.equal(gi.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(gi.blocker.evidence.realGiAgidPostalApiVerified, false);
  assert.equal(gi.blocker.evidence.realGiAgidAppAreaVisualizationVerified, false);
  assert.equal(gi.blocker.requiresExplicitApproval, true);
  assert.match(gi.blocker.retryPolicy, /Do not authenticate.*accept.*request.*pay.*query.*create.*publish.*deploy/i);
});
