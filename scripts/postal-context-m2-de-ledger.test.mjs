import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const ledger = readJson('docs/postal-context-m2-rollout.json');
const de = ledger.countries.find((country) => country.countryCode === 'DE');
const dk = ledger.countries.find((country) => country.countryCode === 'DK');
const manifest = readJson('data/postal_country_packs/de/postal-context/repository-manifest.json');
const sourceConfig = readJson('data/postal_country_packs/de/postal-context/m2-source-review.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/de-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/de-checks-2026-08-30.json', root));

test('Germany remains blocked under its current delivery-area criterion', () => {
  assert.equal(de.status, 'blocked');
  assert.equal(de.attempts, 1);
  assert.equal(de.evidence, null);
  assert.equal(de.m2Definition.id, 'M2_current_deutsche_post_delivery_area_visualization');
  assert.equal(manifest.promotion.stages.find((stage) => stage.id === de.m2Definition.id)?.id, de.m2Definition.id);
  assert.equal(sourceConfig.m2_criterion.id, de.m2Definition.id);
  assert.equal(de.blocker.evidence.documentedDeliveryPostcodeAreas, 8169);
});

test('compatibility and non-area records never become production German postal geometry', () => {
  assert.equal(de.blocker.evidence.testPolygonRecords, 3);
  assert.equal(de.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(de.blocker.evidence.specialCodeReceivesInventedArea, false);
  assert.equal(de.blocker.evidence.testPolygonPromotedToNationalArtifact, false);
  assert.match(de.m2Definition.definition, /non-area classes.*no invented surface/i);
});

test('Germany ledger pins exact reports and Denmark is next', () => {
  assert.equal(digest(sourceReport), de.lastAttempt.reportDigest);
  assert.equal(digest(checks), de.lastAttempt.engineeringReportDigest);
  assert.equal(de.blocker.evidence.sourceReviewDigest, de.lastAttempt.reportDigest);
  assert.equal(de.blocker.evidence.engineeringChecksDigest, de.lastAttempt.engineeringReportDigest);
  assert.equal(dk.status, 'pending');
  assert.equal(dk.region, 'europe');
});

test('shared map capability does not promote unavailable real DE area geometry', () => {
  assert.equal(de.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(de.blocker.evidence.sharedAppProvenanceContractComplete, false);
  assert.equal(de.blocker.evidence.realGermanyAgidPostalApiVerified, false);
  assert.equal(de.blocker.evidence.realGermanyAgidAppAreaVisualizationVerified, false);
  assert.equal(de.blocker.requiresExplicitApproval, true);
  assert.match(de.blocker.retryPolicy, /Do not authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
