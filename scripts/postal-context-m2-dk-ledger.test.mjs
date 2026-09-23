import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const ledger = readJson('docs/postal-context-m2-rollout.json');
const dk = ledger.countries.find(country => country.countryCode === 'DK');
const ee = ledger.countries.find(country => country.countryCode === 'EE');
const manifest = readJson('data/postal_country_packs/dk/postal-context/repository-manifest.json');
const sourceConfig = readJson('data/postal_country_packs/dk/postal-context/m2-source-review.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/dk-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/dk-checks-2026-08-30.json', root));

test('Denmark remains blocked under its current DAGI visualization criterion', () => {
  assert.equal(dk.status, 'blocked');
  assert.equal(dk.attempts, 1);
  assert.equal(dk.evidence, null);
  assert.equal(dk.m2Definition.id, 'M2_current_dagi_postnummerinddeling_visualization');
  assert.equal(manifest.promotion.stages.find(stage => stage.id === dk.m2Definition.id)?.id, dk.m2Definition.id);
  assert.equal(sourceConfig.m2_criterion.id, dk.m2Definition.id);
  assert.equal(dk.blocker.evidence.currentOfficialMultiPolygonRecords, 1089);
});

test('real public source polygons remain fail-closed until fixed, complete and valid', () => {
  assert.equal(dk.blocker.evidence.matchingPostcodeListRecords, 1089);
  assert.equal(dk.blocker.evidence.turfBooleanInvalidRecords, 39);
  assert.deepEqual(dk.blocker.evidence.malformedThreePositionRingPostcodes, ['4000', '8543']);
  assert.equal(dk.blocker.evidence.erGadepostnummerFieldRecords, 0);
  assert.equal(dk.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(dk.blocker.evidence.liveResponsePubliclyRetainedAtImmutableUrl, false);
  assert.equal(dk.blocker.evidence.specialCodeReceivesInventedArea, false);
  assert.equal(dk.blocker.evidence.greenlandOrFaroePresentedAsDk, false);
});

test('Denmark ledger pins exact reports and Estonia is next', () => {
  assert.equal(digest(sourceReport), dk.lastAttempt.reportDigest);
  assert.equal(digest(checks), dk.lastAttempt.engineeringReportDigest);
  assert.equal(dk.blocker.evidence.sourceReviewDigest, dk.lastAttempt.reportDigest);
  assert.equal(dk.blocker.evidence.engineeringChecksDigest, dk.lastAttempt.engineeringReportDigest);
  assert.equal(ee.status, 'pending');
  assert.equal(ee.region, 'europe');
});

test('reuse rights and shared drawing capability do not substitute for a real DK artifact path', () => {
  assert.equal(dk.blocker.evidence.freeGeodataUseAndRedistributionTermsEstablished, true);
  assert.equal(dk.blocker.evidence.publishedImmutableDataArtifacts, 0);
  assert.equal(dk.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(dk.blocker.evidence.sharedAppProvenanceContractComplete, false);
  assert.equal(dk.blocker.evidence.realDenmarkAgidPostalApiVerified, false);
  assert.equal(dk.blocker.evidence.realDenmarkAgidAppAreaVisualizationVerified, false);
  assert.equal(dk.blocker.requiresExplicitApproval, true);
  assert.match(dk.blocker.retryPolicy, /Do not create an account.*authenticate.*publish.*deploy/i);
});
