import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_CAPABILITY_LEVELS,
  ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION,
  buildAddressQlGlobalCountryCoverage,
  summarizeAddressQlGlobalCountryCoverage,
  validateAddressQlGlobalCountryCoverage,
} from './addressQlGlobalCountryCoverage';

function addressQlDocPath(fileName: string) {
  const workspacePath = `docs/addressql/${fileName}`;
  return existsSync(workspacePath) ? workspacePath : `docs/${fileName}`;
}

test('AddressQL publishes explicit execution coverage for every core country and region', () => {
  const records = buildAddressQlGlobalCountryCoverage();
  const summary = summarizeAddressQlGlobalCountryCoverage();

  assert.equal(summary.version, ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION);
  assert.equal(summary.coreCountryRegionProfiles, 250);
  assert.equal(summary.totalProfiles, 276);
  assert.equal(summary.localProfiles, summary.totalProfiles);
  assert.ok(summary.metadataPackProfiles >= 78);
  assert.ok(summary.postalFormatEnabledProfiles > 200);
  assert.ok(summary.postalEquivalentProfiles > 50);
  assert.equal(summary.postalExistenceEnabledProfiles, 0);
  assert.equal(summary.deliveryPointEnabledProfiles, 0);
  assert.equal(summary.manualReviewProfiles, 0);
  assert.deepEqual(validateAddressQlGlobalCountryCoverage(records), []);
});

test('AddressQL models HM as non-addressable instead of leaving a seed-only gap', () => {
  const hm = buildAddressQlGlobalCountryCoverage()
    .find(record => record.countryCode === 'HM');

  assert.equal(hm?.scope, 'core-country-region');
  assert.equal(hm?.profileSource, 'local');
  assert.equal(hm?.nativeAddressFormat, 'not_applicable');
  assert.equal(hm?.internationalEnglishFormat, 'not_applicable');
  assert.equal(hm?.postalFormatValidation, 'not_applicable');
  assert.equal(hm?.postalExistenceLookup, 'not_applicable');
  assert.equal(hm?.deliveryPointValidation, 'blocked');
  assert.equal(hm?.highestEnabledLevel, 'L0');
});

test('AddressQL separates format support from postal existence and delivery claims', () => {
  const records = buildAddressQlGlobalCountryCoverage();
  const jp = records.find(record => record.countryCode === 'JP');
  const de = records.find(record => record.countryCode === 'DE');
  const hk = records.find(record => record.countryCode === 'HK');

  assert.equal(jp?.nativeAddressFormat, 'enabled');
  assert.equal(jp?.internationalEnglishFormat, 'enabled');
  assert.equal(jp?.postalFormatValidation, 'enabled');
  assert.equal(jp?.countryPackState, 'draft_metadata_only');
  assert.equal(jp?.postalExistenceLookup, 'blocked');
  assert.equal(jp?.highestEnabledLevel, 'L1');
  assert.deepEqual(
    jp?.capabilityGates.map(gate => gate.level),
    [...ADDRESSQL_CAPABILITY_LEVELS],
  );
  assert.equal(jp?.capabilityGates.find(gate => gate.level === 'L2')?.approvedEvidence.length, 0);
  assert.ok(jp?.blockers.includes('country-pack-is-metadata-only'));

  assert.equal(de?.postalFormatValidation, 'enabled');
  assert.equal(de?.countryPackState, 'absent');
  assert.equal(de?.postalExistenceLookup, 'blocked');
  assert.ok(de?.blockers.includes('country-postal-pack-required'));

  assert.equal(hk?.postalFormatValidation, 'not_applicable');
  assert.equal(hk?.postalExistenceLookup, 'not_applicable');
  assert.equal(hk?.deliveryPointValidation, 'blocked');
});

test('coverage validation rejects unsupported postal-existence and delivery enablement', () => {
  const records = buildAddressQlGlobalCountryCoverage();
  const unsafe = records.map(record => record.countryCode === 'JP'
    ? {
      ...record,
      postalExistenceLookup: 'enabled' as const,
      deliveryPointValidation: 'enabled' as const,
    }
    : record);
  const errors = validateAddressQlGlobalCountryCoverage(unsafe);

  assert.ok(errors.includes('JP:L2-capability-state-mismatch'));
  assert.ok(errors.includes('JP:L5-capability-state-mismatch'));
});

test('L2 and higher cannot be enabled with partial evidence', () => {
  const records = buildAddressQlGlobalCountryCoverage();
  const unsafe = records.map(record => record.countryCode === 'JP'
    ? {
      ...record,
      postalExistenceLookup: 'enabled' as const,
      highestEnabledLevel: 'L2' as const,
      capabilityGates: record.capabilityGates.map(gate => gate.level === 'L2'
        ? {
          ...gate,
          state: 'enabled' as const,
          approvedEvidence: ['source-identity'],
        }
        : gate),
    }
    : record);
  const errors = validateAddressQlGlobalCountryCoverage(unsafe);

  assert.ok(errors.includes('JP:L2:missing-approved-evidence:reuse-rights'));
  assert.ok(errors.includes('JP:L2:missing-approved-evidence:independent-signature'));
});

test('P2 connects reviewed administrative metadata to L3 candidacy without enabling L3', () => {
  const records = buildAddressQlGlobalCountryCoverage(process.cwd(), {
    now: '2026-07-26T00:00:00Z',
  });
  const summary = summarizeAddressQlGlobalCountryCoverage(process.cwd(), {
    now: '2026-07-26T00:00:00Z',
  });
  const gt = records.find(record => record.countryCode === 'GT')!;
  const l3 = gt.capabilityGates.find(gate => gate.level === 'L3')!;

  assert.equal(summary.dataPromotionReviewCandidateProfiles, 4);
  assert.equal(summary.dataPromotionEnabledProfiles, 0);
  assert.equal(gt.dataPromotion.highestReviewCandidateLevel, 'L3');
  assert.equal(gt.dataPromotion.highestEnabledLevel, null);
  assert.equal(l3.state, 'blocked');
  assert.deepEqual(l3.approvedEvidence, [
    'alias-policy',
    'hierarchy-version',
    'synthetic-holdout',
  ]);
  assert.ok(gt.blockers.includes('country-data-promotion-review-candidate:L3'));
  assert.ok(gt.blockers.includes('country-data-promotion:L3:independent-signature'));
  assert.ok(gt.blockers.includes('country-data-promotion:L3:runtime-adapter'));
});

test('global coverage documentation keeps format, existence, and delivery boundaries separate', () => {
  const readme = readFileSync(addressQlDocPath('README.md'), 'utf8');
  const coverage = readFileSync(addressQlDocPath('global-country-coverage-v0.1.md'), 'utf8');

  assert.match(readme, /global-country-coverage-v0\.1\.md/);
  assert.match(coverage, /250 core country and region codes/);
  assert.match(coverage, /78 draft metadata packs/);
  assert.match(coverage, /postal existence lookup remains blocked/i);
  assert.match(coverage, /delivery-point validation remains blocked/i);
  assert.match(coverage, /does not imply address existence/i);
});
