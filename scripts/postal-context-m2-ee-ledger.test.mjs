import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const ledger = readJson('docs/postal-context-m2-rollout.json');
const ee = ledger.countries.find(country => country.countryCode === 'EE');
const es = ledger.countries.find(country => country.countryCode === 'ES');
const manifest = readJson('data/postal_country_packs/ee/postal-context/repository-manifest.json');
const sourceConfig = readJson('data/postal_country_packs/ee/postal-context/m2-source-review.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ee-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ee-checks-2026-08-30.json', root));

test('Estonia remains blocked under its current AKS postal-area visualization criterion', () => {
  assert.equal(ee.status, 'blocked');
  assert.equal(ee.attempts, 1);
  assert.equal(ee.evidence, null);
  assert.equal(ee.m2Definition.id, 'M2_current_aks_sihtnumbri_alad_visualization');
  assert.equal(manifest.promotion.stages.find(stage => stage.id === ee.m2Definition.id)?.id, ee.m2Definition.id);
  assert.equal(sourceConfig.m2_criterion.id, ee.m2Definition.id);
  assert.equal(ee.blocker.evidence.currentOfficialFeatures, 5436);
});

test('real AKS polygons remain fail-closed until one fixed valid and publishable artifact exists', () => {
  assert.equal(ee.blocker.evidence.currentOfficialPolygonRecords, 4320);
  assert.equal(ee.blocker.evidence.currentOfficialMultiPolygonRecords, 1116);
  assert.equal(ee.blocker.evidence.turfBooleanInvalidRecords, 91);
  assert.equal(ee.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(ee.blocker.evidence.pagingTransactionSafe, false);
  assert.equal(ee.blocker.evidence.releaseEditionEmbedded, false);
  assert.equal(ee.blocker.evidence.invalidGeometryAutomaticallyRepaired, false);
  assert.equal(ee.blocker.evidence.facilityOrNonAreaCodeReceivesInventedArea, false);
});

test('Estonia ledger pins exact reports and Spain is next', () => {
  assert.equal(digest(sourceReport), ee.lastAttempt.reportDigest);
  assert.equal(digest(checks), ee.lastAttempt.engineeringReportDigest);
  assert.equal(ee.blocker.evidence.sourceReviewDigest, ee.lastAttempt.reportDigest);
  assert.equal(ee.blocker.evidence.engineeringChecksDigest, ee.lastAttempt.engineeringReportDigest);
  assert.equal(es.status, 'pending');
  assert.equal(es.region, 'europe');
});

test('agency reuse terms and shared drawing capability do not substitute for a real EE artifact path', () => {
  assert.equal(ee.blocker.evidence.agencyWfsReuseTermsEstablished, true);
  assert.equal(ee.blocker.evidence.externalGeometryPublicationTermsResolved, false);
  assert.equal(ee.blocker.evidence.omnivaDatabasePublicationWithoutPriorConsentPermitted, false);
  assert.equal(ee.blocker.evidence.publishedImmutableDataArtifacts, 0);
  assert.equal(ee.blocker.evidence.sharedAppAreaPathVerified, true);
  assert.equal(ee.blocker.evidence.sharedAppProvenanceContractComplete, false);
  assert.equal(ee.blocker.evidence.realEstoniaAgidPostalApiVerified, false);
  assert.equal(ee.blocker.evidence.realEstoniaAgidAppAreaVisualizationVerified, false);
  assert.equal(ee.blocker.requiresExplicitApproval, true);
  assert.match(ee.blocker.retryPolicy, /Do not create an account.*accept an agreement.*authenticate.*publish.*deploy/i);
});
