import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gr = ledger.countries.find(country => country.countryCode === 'GR');
const hr = ledger.countries.find(country => country.countryCode === 'HR');
const manifest = readJson('data/postal_country_packs/gr/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/gr-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/gr-checks-2026-08-30.json', root));

test('Greece remains blocked under its current ELTA and real-area criterion', () => {
  assert.equal(gr.status, 'blocked');
  assert.equal(gr.attempts, 1);
  assert.equal(gr.evidence, null);
  assert.equal(gr.m2Definition.id, 'M2_current_elta_assignment_and_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === gr.m2Definition.id), gr.m2Definition);
  assert.equal(gr.blocker.evidence.officialPostalPolygonRecords, 0);
});

test('TERCET validity does not become ELTA completeness or a polygon', () => {
  assert.equal(gr.blocker.evidence.tercetCrosswalkRows, 1041);
  assert.equal(gr.blocker.evidence.distinctTercetPostcodes, 1041);
  assert.equal(gr.blocker.evidence.duplicateTercetPostcodes, 0);
  assert.equal(gr.blocker.evidence.invalidTercetPostcodes, 0);
  assert.equal(gr.blocker.evidence.authoritativeEltaAssignmentRows, 0);
  assert.equal(gr.blocker.evidence.currentEltaNationwideDenominatorEstablished, false);
  assert.equal(gr.blocker.evidence.pointNutsOrAdministrativeProxyPromoted, false);
});

test('Greece ledger pins exact reports and Croatia is next', () => {
  assert.equal(digest(sourceReport), gr.lastAttempt.reportDigest);
  assert.equal(digest(checks), gr.lastAttempt.engineeringReportDigest);
  assert.equal(gr.blocker.evidence.sourceReviewDigest, gr.lastAttempt.reportDigest);
  assert.equal(gr.blocker.evidence.engineeringChecksDigest, gr.lastAttempt.engineeringReportDigest);
  assert.equal(hr.status, 'pending');
  assert.equal(hr.region, 'europe');
});

test('shared UI capability does not promote fabricated real GR geometry', () => {
  assert.equal(gr.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(gr.blocker.evidence.realGrAgidPostalApiVerified, false);
  assert.equal(gr.blocker.evidence.realGrAgidAppAreaVisualizationVerified, false);
  assert.equal(gr.blocker.evidence.elstatFeatureRowsQueried, 0);
  assert.equal(gr.blocker.evidence.addressBuildingCadastreOrLandRowsCommitted, 0);
  assert.equal(gr.blocker.requiresExplicitApproval, false);
  assert.match(gr.blocker.retryPolicy, /Do not authenticate.*submit.*accept.*request.*pay.*query.*create.*publish.*deploy/i);
});
