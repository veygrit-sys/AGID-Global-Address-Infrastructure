import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const ledger = readJson('docs/postal-context-m2-rollout.json');
const es = ledger.countries.find(country => country.countryCode === 'ES');
const fi = ledger.countries.find(country => country.countryCode === 'FI');
const ea = ledger.countries.find(country => country.countryCode === 'EA');
const manifest = readJson('data/postal_country_packs/es/postal-context/repository-manifest.json');
const sourceConfig = readJson('data/postal_country_packs/es/postal-context/m2-source-review.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/es-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/es-checks-2026-08-30.json', root));

test('Spain remains blocked under its Correos postcode-area visualization criterion', () => {
  assert.equal(es.status, 'blocked');
  assert.equal(es.attempts, 1);
  assert.equal(es.evidence, null);
  assert.equal(es.m2Definition.id, 'M2_current_correos_postcode_area_visualization');
  assert.equal(manifest.promotion.stages.find(stage => stage.id === es.m2Definition.id)?.id, es.m2Definition.id);
  assert.equal(sourceConfig.m2_criterion.id, es.m2Definition.id);
});

test('one real 28013 Polygon remains fail-closed under view-only and completeness gates', () => {
  assert.equal(es.blocker.evidence.samplePostcode, '28013');
  assert.equal(es.blocker.evidence.sampleFindGeometryType, 'Point');
  assert.equal(es.blocker.evidence.sampleFeatureInfoGeometryType, 'Polygon');
  assert.equal(es.blocker.evidence.sampleFeatureInfoCoordinateCount, 16);
  assert.equal(es.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(es.blocker.evidence.surfaceGeometryExplicitlyViewOnly, true);
  assert.equal(es.blocker.evidence.publicFullPolygonRedistributionRightEstablished, false);
  assert.equal(es.blocker.evidence.publishedImmutableDataArtifacts, 0);
});

test('Spain ledger pins exact reports and Finland is next', () => {
  assert.equal(digest(sourceReport), es.lastAttempt.reportDigest);
  assert.equal(digest(checks), es.lastAttempt.engineeringReportDigest);
  assert.equal(es.blocker.evidence.sourceReviewDigest, es.lastAttempt.reportDigest);
  assert.equal(es.blocker.evidence.engineeringChecksDigest, es.lastAttempt.engineeringReportDigest);
  assert.equal(fi.status, 'pending');
  assert.equal(fi.region, 'europe');
});

test('identity and application gates remain separate and no protected operation was inferred', () => {
  assert.equal(ea.region, 'africa');
  assert.equal(es.blocker.evidence.eaLedgerIdentityRemainsSeparate, true);
  assert.equal(es.blocker.evidence.realSpainAgidPostalApiVerified, false);
  assert.equal(es.blocker.evidence.realSpainAgidAppAreaVisualizationVerified, false);
  assert.equal(es.blocker.evidence.facilityOrNonAreaCodeReceivesInventedArea, false);
  assert.equal(es.blocker.requiresExplicitApproval, true);
  assert.match(es.blocker.retryPolicy, /Do not purchase.*accept.*authenticate.*publish.*deploy/i);
});
