import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const hu = ledger.countries.find(country => country.countryCode === 'HU');
const ie = ledger.countries.find(country => country.countryCode === 'IE');
const manifest = readJson('data/postal_country_packs/hu/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/hu-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/hu-checks-2026-08-30.json', root));

test('Hungary remains blocked under its current assignment, classification and real-area criterion', () => {
  assert.equal(hu.status, 'blocked');
  assert.equal(hu.attempts, 1);
  assert.equal(hu.evidence, null);
  assert.equal(hu.m2Definition.id, 'M2_current_magyar_posta_assignment_and_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === hu.m2Definition.id), hu.m2Definition);
  assert.equal(hu.blocker.evidence.officialPostalPolygonRecords, 0);
});

test('current operator validity does not become special classification or a postal polygon', () => {
  assert.equal(hu.blocker.evidence.currentMagyarPostaRows, 3817);
  assert.equal(hu.blocker.evidence.distinctCurrentMagyarPostaPostcodes, 3817);
  assert.equal(hu.blocker.evidence.invalidCurrentMagyarPostaPostcodes, 0);
  assert.equal(hu.blocker.evidence.currentSpecialClassFields, 0);
  assert.equal(hu.blocker.evidence.tercetCrosswalkRows, 3156);
  assert.equal(hu.blocker.evidence.currentTercetOverlap, 3049);
  assert.equal(hu.blocker.evidence.currentOnlyCodes, 768);
  assert.equal(hu.blocker.evidence.tercetOnlyCodes, 107);
  assert.equal(hu.blocker.evidence.kcrAddressRowsQueried, 0);
  assert.equal(hu.blocker.evidence.pointNutsOrAdministrativeProxyPromoted, false);
});

test('Hungary ledger pins exact reports and Ireland is next', () => {
  assert.equal(digest(sourceReport), hu.lastAttempt.reportDigest);
  assert.equal(digest(checks), hu.lastAttempt.engineeringReportDigest);
  assert.equal(hu.blocker.evidence.sourceReviewDigest, hu.lastAttempt.reportDigest);
  assert.equal(hu.blocker.evidence.engineeringChecksDigest, hu.lastAttempt.engineeringReportDigest);
  assert.equal(ie.status, 'pending');
  assert.equal(ie.region, 'europe');
});

test('shared UI capability does not promote fabricated real HU geometry', () => {
  assert.equal(hu.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(hu.blocker.evidence.realHuAgidPostalApiVerified, false);
  assert.equal(hu.blocker.evidence.realHuAgidAppAreaVisualizationVerified, false);
  assert.equal(hu.blocker.evidence.addressBuildingCadastreOrLandRowsQueried, 0);
  assert.equal(hu.blocker.evidence.syntheticFixturePromoted, false);
  assert.equal(hu.blocker.requiresExplicitApproval, false);
  assert.match(hu.blocker.retryPolicy, /Do not authenticate.*request.*accept.*pay.*query.*create.*publish.*deploy/i);
});
