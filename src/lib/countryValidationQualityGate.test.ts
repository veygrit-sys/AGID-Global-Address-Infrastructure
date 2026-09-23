import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { buildApprovedCountryGeographicMetadataEvaluationIndex } from './countryGeographicMetadataEvaluationCatalog';
import {
  COUNTRY_VALIDATION_HOLDOUT_DIGEST_ALGORITHM,
  COUNTRY_VALIDATION_QUALITY_GATE_VERSION,
  buildAllCountryValidationQualityReports,
  buildCountryValidationQualityReport,
  createCountryValidationQualityPolicy,
} from './countryValidationQualityGate';

const addressFormatRoot = join(process.cwd(), 'src', 'data', 'address_formats');

function walkJsonFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

test('requires reuse, freshness, scope, correction, policy, and a synthetic holdout for approved country metadata', () => {
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T12:00:00Z' });
  const report = buildCountryValidationQualityReport(index, 'NZ', '2026-07-25T12:00:00Z');

  assert.equal(COUNTRY_VALIDATION_QUALITY_GATE_VERSION, 'country-validation-quality-gate-v3');
  assert.deepEqual(report.sourceIds, ['stats-nz-geographic-boundaries-2026']);
  assert.ok(report.gates.every(result => result.status === 'passed'));
  assert.equal(report.policy?.multilingualStandardization.aliasEvidence, 'source-gated');
  assert.equal(report.policy?.multilingualStandardization.automaticTypoCorrection, 'disabled-until-country-holdout-evidence');
  assert.equal(report.policy?.neutralScope.geographicScope, 'registry-label-only');
  assert.equal(report.syntheticAdministrativeEvaluationEligible, true);
  assert.equal(report.syntheticHoldoutDigestAlgorithm, COUNTRY_VALIDATION_HOLDOUT_DIGEST_ALGORITHM);
  assert.match(report.syntheticHoldoutDigest || '', /^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(report.geographicMetadataReadiness, [{
    countryCode: 'NZ',
    sourceId: 'stats-nz-geographic-boundaries-2026',
    sourceOrigin: 'official-publication',
    approvedAdministrativeKeyCount: 2,
    syntheticAdministrativeEvaluationEligible: true,
    deliveryClaimsEnabled: false,
  }]);
  assert.equal(report.postalLookupEnabled, false);
  assert.equal(report.addressValidationEnabled, false);
  assert.equal(report.deliveryClaimsEnabled, false);
});

test('binds eligible synthetic holdouts to an order-independent digest', () => {
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T12:00:00Z' });
  const reordered = {
    ...index,
    sources: [...index.sources].reverse(),
    syntheticAdministrativeKeys: [...index.syntheticAdministrativeKeys].reverse(),
  };
  const originalReport = buildCountryValidationQualityReport(index, 'GT', '2026-07-25T12:00:00Z');
  const reorderedReport = buildCountryValidationQualityReport(reordered, 'GT', '2026-07-25T12:00:00Z');
  const changedReport = buildCountryValidationQualityReport({
    ...index,
    syntheticAdministrativeKeys: index.syntheticAdministrativeKeys.map(key => (
      key.countryCode === 'GT' && key.keyKind === 'municipality'
        ? { ...key, syntheticKeyToken: 'synthetic:GT:municipality-holdout-v2' }
        : key
    )),
  }, 'GT', '2026-07-25T12:00:00Z');

  assert.equal(originalReport.syntheticHoldoutDigest, reorderedReport.syntheticHoldoutDigest);
  assert.notEqual(originalReport.syntheticHoldoutDigest, changedReport.syntheticHoldoutDigest);
});

test('blocks a country when the index no longer has a current source even though its universal policy is present', () => {
  const expiredIndex = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-08-26T00:00:00Z' });
  const expired = buildCountryValidationQualityReport(expiredIndex, 'GT', '2026-08-26T00:00:00Z');
  const unsupported = buildCountryValidationQualityReport(expiredIndex, 'DE', '2026-08-26T00:00:00Z');

  assert.equal(expired.syntheticAdministrativeEvaluationEligible, false);
  assert.deepEqual(expired.geographicMetadataReadiness, []);
  assert.ok(expired.gates.some(result => result.id === 'source-version-and-freshness' && result.status === 'blocked'));
  assert.equal(unsupported.policy?.countryCode, 'DE');
  assert.equal(unsupported.syntheticHoldoutDigestAlgorithm, null);
  assert.equal(unsupported.syntheticHoldoutDigest, null);
  assert.ok(unsupported.gates.some(result => result.id === 'reuse-terms' && result.status === 'blocked'));
  assert.ok(unsupported.gates.some(result => result.id === 'synthetic-holdout' && result.status === 'blocked'));
  assert.ok(unsupported.nonClaims.some(nonClaim => nonClaim.includes('postal lookup')));
});

test('treats an exact review deadline as expired for country-quality decisions', () => {
  const deadline = '2026-08-25T00:00:00Z';
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: deadline });
  const report = buildCountryValidationQualityReport(index, 'GT', deadline);

  assert.equal(index.sources.length, 0);
  assert.ok(report.gates.some(result => (
    result.id === 'source-version-and-freshness' && result.status === 'blocked'
  )));
  assert.equal(report.syntheticAdministrativeEvaluationEligible, false);
});

test('applies the same safe multilingual and neutral-scope policy to every ISO country code', () => {
  const policy = createCountryValidationQualityPolicy('de');

  assert.equal(policy?.countryCode, 'DE');
  assert.equal(policy?.multilingualStandardization.aliasEvidence, 'source-gated');
  assert.equal(policy?.multilingualStandardization.automaticTypoCorrection, 'disabled-until-country-holdout-evidence');
  assert.equal(policy?.neutralScope.geographicScope, 'registry-label-only');
  assert.equal(policy?.neutralScope.deliveryClaimsEnabled, false);
  assert.equal(createCountryValidationQualityPolicy('CL-EA'), null);
});

test('covers every ISO country address-format registry entry while keeping unsupported sources blocked', () => {
  const countryCodes = walkJsonFiles(addressFormatRoot)
    .map(path => JSON.parse(readFileSync(path, 'utf8')) as { countryCode?: string })
    .map(format => format.countryCode || '')
    .filter(countryCode => /^[A-Z]{2}$/.test(countryCode));
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T12:00:00Z' });
  const coverage = buildAllCountryValidationQualityReports(index, countryCodes, '2026-07-25T12:00:00Z');

  assert.ok(coverage.countryCodes.length > 200);
  assert.equal(coverage.reports.length, coverage.countryCodes.length);
  assert.ok(coverage.reports.every(report => report.policy?.countryCode === report.countryCode));
  assert.deepEqual(coverage.syntheticAdministrativeEvaluationEligibleCountryCodes, ['AU', 'GT', 'NZ', 'PA']);
  assert.ok(coverage.blockedCountryCodes.includes('DE'));
  assert.equal(coverage.postalLookupEnabled, false);
  assert.equal(coverage.addressValidationEnabled, false);
  assert.equal(coverage.deliveryClaimsEnabled, false);
});
