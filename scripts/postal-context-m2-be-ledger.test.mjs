import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root = new URL('../', import.meta.url);
const ledger = JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json', root), 'utf8'));
const be = ledger.countries.find(country => country.countryCode === 'BE');
const bg = ledger.countries.find(country => country.countryCode === 'BG');
const manifest = JSON.parse(readFileSync(new URL('data/postal_country_packs/be/postal-context/repository-manifest.json', root), 'utf8'));
const digest = path => 'sha256:' + createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');

test('BE stays blocked under its rights-cleared assignment and postal-canton visualization criterion', () => {
  assert.equal(be.status, 'blocked');
  assert.equal(be.attempts, 1);
  assert.equal(be.evidence, null);
  assert.equal(be.m2Definition.id, 'M2_current_assignment_and_rights_cleared_postal_canton_visualization');
  assert.ok(manifest.promotion.stages.some(stage => stage.id === be.m2Definition.id));
});

test('valid source geometry does not override assignment and publication rights gates', () => {
  assert.equal(be.blocker.evidence.sourcePostalCantonFeatures, 1268);
  assert.equal(be.blocker.evidence.invalidGeometryRecords, 0);
  assert.deepEqual(be.blocker.evidence.nonFourCharacterSourceValues, ['612', '9']);
  assert.equal(be.blocker.evidence.currentCompleteAssignmentVerified, false);
  assert.equal(be.blocker.evidence.internalUseGranted, true);
  assert.equal(be.blocker.evidence.commercialUseGranted, false);
  assert.equal(be.blocker.evidence.publicRedistributionApiRightsCleared, false);
  assert.equal(be.blocker.evidence.rightsClearedProductionPostalGeometryRecords, 0);
});

test('ledger pins both reports and Bulgaria is next', () => {
  assert.equal(digest('reports/postal-context-m2/be-source-review-2026-08-29.json'), be.lastAttempt.reportDigest);
  assert.equal(digest('reports/postal-context-m2/be-checks-2026-08-29.json'), be.lastAttempt.engineeringReportDigest);
  assert.equal(bg.status, 'pending');
  assert.equal(bg.region, 'europe');
});

test('shared visualization capability cannot promote BE without real rights-cleared data', () => {
  assert.equal(be.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(be.blocker.evidence.realBelgiumAgidPostalApiVerified, false);
  assert.equal(be.blocker.evidence.realBelgiumAgidAppAreaVisualizationVerified, false);
  assert.match(be.blocker.retryPolicy, /Do not authenticate.*accept.*pay/i);
});
