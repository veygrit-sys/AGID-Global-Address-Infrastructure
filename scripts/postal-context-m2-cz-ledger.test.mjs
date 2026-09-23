import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const ledger = readJson('docs/postal-context-m2-rollout.json');
const cz = ledger.countries.find((country) => country.countryCode === 'CZ');
const de = ledger.countries.find((country) => country.countryCode === 'DE');
const manifest = readJson('data/postal_country_packs/cz/postal-context/repository-manifest.json');
const sourceConfig = readJson('data/postal_country_packs/cz/postal-context/m2-source-review.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/cz-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/cz-checks-2026-08-30.json', root));

test('Czechia remains blocked under its current-assignment and derived-area criterion', () => {
  assert.equal(cz.status, 'blocked');
  assert.equal(cz.attempts, 1);
  assert.equal(cz.evidence, null);
  assert.equal(cz.m2Definition.id, 'M2_current_assignment_and_derived_postcode_area_visualization');
  assert.equal(manifest.promotion.stages.find((stage) => stage.id === cz.m2Definition.id)?.id, cz.m2Definition.id);
  assert.equal(sourceConfig.m2_criterion.id, cz.m2Definition.id);
  assert.equal(cz.blocker.evidence.operatorAddressPostcodeCodes, 15666);
  assert.equal(cz.blocker.evidence.ruianAddressRows, 3020222);
  assert.equal(cz.blocker.evidence.ruianPostcodes, 2677);
});

test('points, special classes, and assignments never become Czech postcode polygons', () => {
  assert.equal(cz.blocker.evidence.operatorOfficialPolygonRecords, 0);
  assert.equal(cz.blocker.evidence.ruianPolygonOrMultiPolygonRecords, 0);
  assert.equal(cz.blocker.evidence.derivedPolygonRecords, 0);
  assert.equal(cz.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(cz.blocker.evidence.pointOrAssignmentReceivesInventedArea, false);
  assert.equal(cz.blocker.evidence.specialCodeReceivesInventedArea, false);
  assert.match(cz.m2Definition.definition, /special and non-area classes remain explicit/);
});

test('Czechia ledger pins exact reports and Germany is next', () => {
  assert.equal(digest(sourceReport), cz.lastAttempt.reportDigest);
  assert.equal(digest(checks), cz.lastAttempt.engineeringReportDigest);
  assert.equal(cz.blocker.evidence.sourceReviewDigest, cz.lastAttempt.reportDigest);
  assert.equal(cz.blocker.evidence.engineeringChecksDigest, cz.lastAttempt.engineeringReportDigest);
  assert.equal(de.status, 'pending');
  assert.equal(de.region, 'europe');
});

test('shared map capability does not promote unavailable real CZ area geometry', () => {
  assert.equal(cz.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(cz.blocker.evidence.sharedAppProvenanceContractComplete, false);
  assert.equal(cz.blocker.evidence.realCzechiaAgidPostalApiVerified, false);
  assert.equal(cz.blocker.evidence.realCzechiaAgidAppAreaVisualizationVerified, false);
  assert.match(cz.blocker.retryPolicy, /Do not authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
