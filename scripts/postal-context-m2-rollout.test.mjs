import assert from 'node:assert/strict';
import test from 'node:test';
import { compareCountries, inventory, nextCountry, promotionErrors, validateLedger } from './postal-context-m2-rollout.mjs';

const item = (countryCode, region, status = 'pending') => ({ countryCode, region, status });
const ledger = countries => ({ schemaVersion: 'postal-context-m2-rollout/v1', countries });

test('continents, Japan first and stable country ordering are independent of input order', () => {
  const countries = [item('AU', 'oceania'), item('US', 'americas'), item('JP', 'asia'), item('ZA', 'africa'), item('FR', 'europe'), item('AF', 'asia'), item('AE', 'asia')];
  assert.deepEqual(countries.sort(compareCountries).map(c => c.countryCode), ['JP', 'AE', 'AF', 'FR', 'US', 'ZA', 'AU']);
});
test('continues one active country and does not start a second', () => {
  assert.equal(nextCountry(ledger([item('JP', 'asia'), item('FR', 'europe', 'in_progress')])).countryCode, 'FR');
  assert.throws(() => validateLedger(ledger([item('JP', 'asia', 'in_progress'), item('FR', 'europe', 'in_progress')])), /more-than-one/);
});
test('visits pending countries before due blockers and never retries before the deadline', () => {
  const jp = { ...item('JP', 'asia', 'blocked'), blocker: { reason: 'needs licensed snapshot', retryAfter: '2026-09-01T00:00:00Z' } };
  assert.equal(nextCountry(ledger([jp]), '2026-08-28T00:00:00Z'), null);
  assert.equal(nextCountry(ledger([jp]), '2026-09-01T00:00:00Z').countryCode, 'JP');
  assert.equal(nextCountry(ledger([jp, item('AU', 'oceania')]), '2026-09-01T00:00:00Z').countryCode, 'AU');
});
test('a maturity label and synthetic tests never prove M2', () => {
  const jp = { ...item('JP', 'asia', 'm2_verified'), declaredStage: 'M2_experimental' };
  assert.throws(() => validateLedger(ledger([jp])), /unproven-m2/);
  assert.ok(promotionErrors({ ...jp, evidence: { synthetic: true } }).includes('real-data-scope-required'));
});
test('M2 requires country definition, real pinned sources, rights, published artifacts and runtime verification', () => {
  const digest = `sha256:${'a'.repeat(64)}`;
  const jp = { ...item('JP', 'asia', 'm2_verified'), m2Definition: { id: 'M2_experimental' }, evidence: {
    criterionId: 'M2_experimental', criterionSatisfied: true, synthetic: false, scope: 'ordinary postal assignments',
    sources: [{ url: 'https://example.invalid/source', digest, version: 'v1', observedAt: '2026-08-28T00:00:00Z', termsUrl: 'https://example.invalid/terms', termsDigest: digest, rightsReviewed: true }],
    artifacts: [{ url: 'https://example.invalid/artifact', digest, bytes: 1024 }],
    validation: { passed: 10, failed: 0, command: 'node --test', reportDigest: digest },
    runtime: { descriptorDigest: digest, verificationCommand: 'verify pinned AGID pack' },
  } };
  assert.deepEqual(promotionErrors(jp), []);
  const broken = structuredClone(jp); broken.evidence.sources[0].rightsReviewed = false;
  assert.throws(() => validateLedger(ledger([broken])), /source-and-rights/);
});
test('inventory is deterministic, covers registered profiles, and does not promote M1 or missing packs', () => {
  const result = inventory(process.cwd());
  assert.ok(result.countries.length >= 249);
  assert.equal(result.countries[0].countryCode, 'JP');
  assert.equal(result.countries.find(c => c.countryCode === 'GU').region, 'oceania');
  assert.equal(result.countries.find(c => c.countryCode === 'GU').sourceRegion, 'americas');
  assert.equal(result.countries.find(c => c.countryCode === 'EA').region, 'africa');
  assert.ok(result.countries.every(c => c.status === 'pending'));
  assert.deepEqual(inventory(process.cwd(), result), result);
});
