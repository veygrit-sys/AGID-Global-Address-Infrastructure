import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const hr = ledger.countries.find(country => country.countryCode === 'HR');
const hu = ledger.countries.find(country => country.countryCode === 'HU');
const manifest = readJson('data/postal_country_packs/hr/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/hr-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/hr-checks-2026-08-30.json', root));

test('Croatia remains blocked under its current operator-assignment and real-area criterion', () => {
  assert.equal(hr.status, 'blocked');
  assert.equal(hr.attempts, 1);
  assert.equal(hr.evidence, null);
  assert.equal(hr.m2Definition.id, 'M2_current_hrvatska_posta_assignment_and_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === hr.m2Definition.id), hr.m2Definition);
  assert.equal(hr.blocker.evidence.officialPostalPolygonRecords, 0);
});

test('TERCET validity does not become Hrvatska pošta completeness or a polygon', () => {
  assert.equal(hr.blocker.evidence.tercetCrosswalkRows, 667);
  assert.equal(hr.blocker.evidence.distinctTercetPostcodes, 667);
  assert.equal(hr.blocker.evidence.duplicateTercetPostcodes, 0);
  assert.equal(hr.blocker.evidence.invalidTercetPostcodes, 0);
  assert.equal(hr.blocker.evidence.authoritativeHrvatskaPostaAssignmentRows, 0);
  assert.equal(hr.blocker.evidence.currentHrvatskaPostaNationwideDenominatorEstablished, false);
  assert.equal(hr.blocker.evidence.dguDeliveryOfficeAreaRowsAcquired, 0);
  assert.equal(hr.blocker.evidence.operatorOfficeToDguCrosswalkRows, 0);
  assert.equal(hr.blocker.evidence.pointNutsOrAdministrativeProxyPromoted, false);
});

test('Croatia ledger pins exact reports and Hungary is next', () => {
  assert.equal(digest(sourceReport), hr.lastAttempt.reportDigest);
  assert.equal(digest(checks), hr.lastAttempt.engineeringReportDigest);
  assert.equal(hr.blocker.evidence.sourceReviewDigest, hr.lastAttempt.reportDigest);
  assert.equal(hr.blocker.evidence.engineeringChecksDigest, hr.lastAttempt.engineeringReportDigest);
  assert.equal(hu.status, 'pending');
  assert.equal(hu.region, 'europe');
});

test('shared UI capability does not promote fabricated real HR geometry', () => {
  assert.equal(hr.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(hr.blocker.evidence.realHrAgidPostalApiVerified, false);
  assert.equal(hr.blocker.evidence.realHrAgidAppAreaVisualizationVerified, false);
  assert.equal(hr.blocker.evidence.addressBuildingCadastreOrLandRowsQueried, 0);
  assert.equal(hr.blocker.evidence.syntheticFixturePromoted, false);
  assert.equal(hr.blocker.requiresExplicitApproval, false);
  assert.match(hr.blocker.retryPolicy, /Do not authenticate.*download.*consent.*submit.*accept.*request.*pay.*query.*create.*publish.*deploy/i);
});
