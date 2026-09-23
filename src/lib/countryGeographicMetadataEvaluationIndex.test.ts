import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildCountryGeographicMetadataEvaluationIndex,
  projectCountryGeographicMetadataReadiness,
  type CountryGeographicMetadataSourceCandidate,
  type SyntheticAdministrativeKeyCandidate,
} from './countryGeographicMetadataEvaluationIndex';

const approvedSource: CountryGeographicMetadataSourceCandidate = {
  countryCode: 'GT',
  sourceId: 'synthetic-gt-official-admin',
  sourceOrigin: 'official-publication',
  componentSourceIds: [],
  sourceUrl: 'https://official.example.invalid/gt/admin',
  authorityEvidenceUrl: 'https://official.example.invalid/gt/authority',
  authorityStatus: 'official-country-or-territory',
  sourceVersion: '2026-07',
  versionStatus: 'verified-current',
  reuseLicense: 'Synthetic open-reuse test license',
  reuseTermsUrl: 'https://official.example.invalid/gt/terms',
  reuseStatus: 'reuse-approved',
  declaredScope: 'country',
  coverageStatus: 'country-or-territory-coverage-evidenced',
  correctionUrl: 'https://official.example.invalid/gt/corrections',
    correctionPathStatus: 'source-specific-confirmed',
  approvalStatus: 'approved-for-synthetic-administrative-evaluation',
  approvedAdministrativeKeyKinds: ['first-order-subdivision', 'municipality'],
  reviewedAt: '2026-07-01T00:00:00Z',
  reviewBy: '2027-07-01T00:00:00Z',
  rawPrivateMaterialStored: false,
};

const approvedKey: SyntheticAdministrativeKeyCandidate = {
  keyId: 'synthetic-admin-key:gt:synthetic-gt-official-admin:case-001',
  countryCode: 'GT',
  sourceId: 'synthetic-gt-official-admin',
  keyKind: 'municipality',
  syntheticKeyToken: 'synthetic:GT:case-001',
  synthetic: true,
  approvalStatus: 'approved',
};

test('indexes only fully approved source metadata and synthetic administrative keys', () => {
  const index = buildCountryGeographicMetadataEvaluationIndex({
    sources: [approvedSource],
    syntheticAdministrativeKeys: [approvedKey],
    now: '2026-07-25T00:00:00Z',
  });

  assert.equal(index.sources.length, 1);
  assert.equal(index.syntheticAdministrativeKeys.length, 1);
  assert.deepEqual(index.sources[0], {
    countryCode: 'GT',
    sourceId: 'synthetic-gt-official-admin',
    sourceOrigin: 'official-publication',
    componentSourceIds: [],
    sourceVersion: '2026-07',
    sourceUrl: 'https://official.example.invalid/gt/admin',
    authorityEvidenceUrl: 'https://official.example.invalid/gt/authority',
    reuseLicense: 'Synthetic open-reuse test license',
    reuseTermsUrl: 'https://official.example.invalid/gt/terms',
    declaredScope: 'country',
    correctionUrl: 'https://official.example.invalid/gt/corrections',
    correctionPathStatus: 'source-specific-confirmed',
    approvedAdministrativeKeyKinds: ['first-order-subdivision', 'municipality'],
    reviewedAt: '2026-07-01T00:00:00Z',
    reviewBy: '2027-07-01T00:00:00Z',
    syntheticAdministrativeKeyCount: 1,
    deliveryClaimsEnabled: false,
  });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(index, 'gt'), [{
    countryCode: 'GT',
    sourceId: 'synthetic-gt-official-admin',
    sourceOrigin: 'official-publication',
    approvedAdministrativeKeyCount: 1,
    syntheticAdministrativeEvaluationEligible: true,
    deliveryClaimsEnabled: false,
  }]);
  assert.deepEqual(index.privacyBoundary, {
    rawAddressDataAllowed: false,
    recipientDataAllowed: false,
    preciseCoordinatesAllowed: false,
    deliveryClaimsEnabled: false,
  });
});

test('indexes a licensed open-source composite only when each named component is approved', () => {
  const firstComponent = {
    ...approvedSource,
    countryCode: 'LS',
    sourceId: 'synthetic-ls-open-admin-a',
    sourceOrigin: 'maintained-open-source' as const,
    authorityStatus: 'open-source-maintainer' as const,
    sourceUrl: 'https://opensource.example.invalid/ls/admin-a',
    authorityEvidenceUrl: 'https://opensource.example.invalid/ls/governance',
    reuseTermsUrl: 'https://opensource.example.invalid/ls/license',
  };
  const secondComponent = {
    ...firstComponent,
    sourceId: 'synthetic-ls-open-admin-b',
    sourceUrl: 'https://opensource.example.invalid/ls/admin-b',
  };
  const composite = {
    ...firstComponent,
    sourceId: 'synthetic-ls-open-admin-composite',
    sourceOrigin: 'open-source-composite' as const,
    componentSourceIds: [firstComponent.sourceId, secondComponent.sourceId],
    sourceUrl: 'https://opensource.example.invalid/ls/composite',
  };
  const keyFor = (sourceId: string): SyntheticAdministrativeKeyCandidate => ({
    keyId: `synthetic-admin-key:ls:${sourceId}:holdout-v1`,
    countryCode: 'LS',
    sourceId,
    keyKind: 'municipality',
    syntheticKeyToken: `synthetic:LS:${sourceId}-holdout-v1`,
    synthetic: true,
    approvalStatus: 'approved',
  });

  const index = buildCountryGeographicMetadataEvaluationIndex({
    sources: [firstComponent, secondComponent, composite],
    syntheticAdministrativeKeys: [
      keyFor(firstComponent.sourceId),
      keyFor(secondComponent.sourceId),
      keyFor(composite.sourceId),
    ],
    now: '2026-07-25T00:00:00Z',
  });

  assert.equal(index.sources.length, 3);
  assert.deepEqual(index.sources.find(source => source.sourceId === composite.sourceId), {
    countryCode: 'LS',
    sourceId: 'synthetic-ls-open-admin-composite',
    sourceOrigin: 'open-source-composite',
    componentSourceIds: ['synthetic-ls-open-admin-a', 'synthetic-ls-open-admin-b'],
    sourceVersion: '2026-07',
    sourceUrl: 'https://opensource.example.invalid/ls/composite',
    authorityEvidenceUrl: 'https://opensource.example.invalid/ls/governance',
    reuseLicense: 'Synthetic open-reuse test license',
    reuseTermsUrl: 'https://opensource.example.invalid/ls/license',
    declaredScope: 'country',
    correctionUrl: 'https://official.example.invalid/gt/corrections',
    correctionPathStatus: 'source-specific-confirmed',
    approvedAdministrativeKeyKinds: ['first-order-subdivision', 'municipality'],
    reviewedAt: '2026-07-01T00:00:00Z',
    reviewBy: '2027-07-01T00:00:00Z',
    syntheticAdministrativeKeyCount: 1,
    deliveryClaimsEnabled: false,
  });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(index, 'LS'), [
    {
      countryCode: 'LS',
      sourceId: 'synthetic-ls-open-admin-a',
      sourceOrigin: 'maintained-open-source',
      approvedAdministrativeKeyCount: 1,
      syntheticAdministrativeEvaluationEligible: true,
      deliveryClaimsEnabled: false,
    },
    {
      countryCode: 'LS',
      sourceId: 'synthetic-ls-open-admin-b',
      sourceOrigin: 'maintained-open-source',
      approvedAdministrativeKeyCount: 1,
      syntheticAdministrativeEvaluationEligible: true,
      deliveryClaimsEnabled: false,
    },
    {
      countryCode: 'LS',
      sourceId: 'synthetic-ls-open-admin-composite',
      sourceOrigin: 'open-source-composite',
      approvedAdministrativeKeyCount: 1,
      syntheticAdministrativeEvaluationEligible: true,
      deliveryClaimsEnabled: false,
    },
  ]);
});

test('blocks a source when any official reuse, version, coverage, correction, approval, or freshness gate is missing', () => {
  const cases = [
    { field: 'reuseStatus', value: 'pending' },
    { field: 'versionStatus', value: 'observed-unverified' },
    { field: 'coverageStatus', value: 'partial' },
    { field: 'correctionPathStatus', value: 'general-contact-only' },
    { field: 'approvalStatus', value: 'candidate' },
    { field: 'reviewBy', value: '2026-07-24T00:00:00Z' },
    { field: 'reviewBy', value: '2026-07-25T00:00:00Z' },
  ];

  for (const invalid of cases) {
    const source = { ...approvedSource, [invalid.field]: invalid.value } as CountryGeographicMetadataSourceCandidate;
    const index = buildCountryGeographicMetadataEvaluationIndex({
      sources: [source],
      syntheticAdministrativeKeys: [approvedKey],
      now: '2026-07-25T00:00:00Z',
    });
    assert.equal(index.sources.length, 0, invalid.field);
    assert.equal(index.syntheticAdministrativeKeys.length, 0, invalid.field);
    assert.ok(index.blockedCandidates.some(candidate => candidate.sourceId === approvedSource.sourceId), invalid.field);
  }
});

test('does not index an otherwise approved source until it has an approved synthetic administrative key', () => {
  const index = buildCountryGeographicMetadataEvaluationIndex({
    sources: [approvedSource],
    syntheticAdministrativeKeys: [],
    now: '2026-07-25T00:00:00Z',
  });

  assert.equal(index.sources.length, 0);
  assert.equal(index.syntheticAdministrativeKeys.length, 0);
  assert.ok(index.blockedCandidates.some(candidate => (
    candidate.reason === 'approved-synthetic-administrative-key-required'
  )));
});

test('blocks keys that are non-synthetic, unapproved, unscoped, or use an unapproved key kind', () => {
  const cases = [
    { field: 'synthetic', value: false },
    { field: 'approvalStatus', value: 'candidate' },
    { field: 'keyKind', value: 'district' },
    { field: 'syntheticKeyToken', value: 'real-key' },
  ];

  for (const invalid of cases) {
    const key = { ...approvedKey, [invalid.field]: invalid.value } as SyntheticAdministrativeKeyCandidate;
    const index = buildCountryGeographicMetadataEvaluationIndex({
      sources: [approvedSource],
      syntheticAdministrativeKeys: [key],
      now: '2026-07-25T00:00:00Z',
    });
    assert.equal(index.sources.length, 0, invalid.field);
    assert.equal(index.syntheticAdministrativeKeys.length, 0, invalid.field);
    assert.ok(index.blockedCandidates.some(candidate => candidate.reason !== ''));
  }
});

test('rejects duplicate synthetic tokens so one fixture cannot inflate holdout coverage', () => {
  const duplicateTokenKey: SyntheticAdministrativeKeyCandidate = {
    ...approvedKey,
    keyId: 'synthetic-admin-key:gt:synthetic-gt-official-admin:case-002',
    keyKind: 'first-order-subdivision',
  };
  const index = buildCountryGeographicMetadataEvaluationIndex({
    sources: [approvedSource],
    syntheticAdministrativeKeys: [approvedKey, duplicateTokenKey],
    now: '2026-07-25T00:00:00Z',
  });

  assert.equal(index.sources.length, 0);
  assert.equal(index.syntheticAdministrativeKeys.length, 0);
  assert.equal(
    index.blockedCandidates.filter(candidate => candidate.reason === 'duplicate-synthetic-key-token').length,
    2,
  );
});

test('rejects fields outside the metadata-only contract and never projects delivery claims', () => {
  assert.throws(() => buildCountryGeographicMetadataEvaluationIndex({
    sources: [{ ...approvedSource, address: 'must-not-be-accepted' } as unknown as CountryGeographicMetadataSourceCandidate],
    syntheticAdministrativeKeys: [approvedKey],
    now: '2026-07-25T00:00:00Z',
  }), /disallowed field address/);

  const index = buildCountryGeographicMetadataEvaluationIndex({
    sources: [approvedSource],
    syntheticAdministrativeKeys: [approvedKey],
    now: '2026-07-25T00:00:00Z',
  });
  const projectedFields = [
    ...Object.keys(index.sources[0] || {}),
    ...Object.keys(index.syntheticAdministrativeKeys[0] || {}),
  ];
  for (const forbiddenField of [
    'address',
    'recipient',
    'postcode',
    'latitude',
    'longitude',
    'credential',
    'secret',
  ]) {
    assert.ok(!projectedFields.includes(forbiddenField), `${forbiddenField} is never projected`);
  }
  assert.throws(
    () => projectCountryGeographicMetadataReadiness(index, 'Guatemala'),
    /ISO 3166-1 alpha-2/,
  );
});
