import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createAddressQlRuntimeAdapterRegistry,
  type AddressQlRuntimeAdapter,
  type AddressQlRuntimeAdapterEvidence,
} from './addressQlRuntimeAdapter';

const digest = (character: string) => `sha256:${character.repeat(64)}`;

function evidence(
  overrides: Partial<AddressQlRuntimeAdapterEvidence> = {},
): AddressQlRuntimeAdapterEvidence {
  return {
    sourceId: 'synthetic-postal-source',
    sourceVersion: 'synthetic-v1',
    reuseRights: 'Synthetic conformance fixture',
    coverageStatement: 'Synthetic postal-code existence coverage for adapter tests.',
    correctionUrl: 'https://example.invalid/addressql-corrections',
    retrievedAt: '2026-07-01T00:00:00Z',
    validUntil: '2027-07-01T00:00:00Z',
    datasetDigest: digest('c'),
    holdoutDigest: digest('a'),
    reportDigest: digest('b'),
    attestationKeyId: 'fixture-reviewer',
    attestationSignature: 'synthetic-signature',
    ...overrides,
  };
}

function adapter(
  overrides: Partial<AddressQlRuntimeAdapter> = {},
): AddressQlRuntimeAdapter {
  return {
    id: 'synthetic-jp-postal',
    version: 'v1',
    mode: 'conformance',
    countryCodes: ['JP'],
    purposes: ['existence'],
    evidence: evidence(),
    evaluate: input => ({
      status: input.postalCode === '100-0001' ? 'pass' : 'fail',
      confidence: 0.99,
      reasonCode: 'synthetic_postal_fixture',
    }),
    ...overrides,
  };
}

test('runtime adapters fail closed unless their mode is explicitly authorized', () => {
  const conformance = createAddressQlRuntimeAdapterRegistry(
    [adapter()],
    { now: new Date('2026-07-26T00:00:00Z') },
  );
  assert.equal(conformance.adapterCount, 0);

  const unverifiedApproved = createAddressQlRuntimeAdapterRegistry(
    [adapter({ mode: 'approved' })],
    { now: new Date('2026-07-26T00:00:00Z') },
  );
  assert.equal(unverifiedApproved.adapterCount, 0);
});

test('conformance adapters execute without becoming live validation evidence', () => {
  const registry = createAddressQlRuntimeAdapterRegistry(
    [adapter()],
    {
      now: new Date('2026-07-26T00:00:00Z'),
      allowConformanceAdapters: true,
    },
  );
  const result = registry.evaluate({
    countryCode: 'jp',
    postalCode: '100-0001',
    purpose: 'existence',
  });

  assert.equal(result?.status, 'pass');
  assert.equal(result?.liveEligible, false);
  assert.equal(result?.evidenceLevel, 'synthetic_conformance');
  assert.deepEqual(result?.adapterIds, ['synthetic-jp-postal']);
});

test('approved adapters require an independent attestation verifier', () => {
  const approved = adapter({ mode: 'approved' });
  const registry = createAddressQlRuntimeAdapterRegistry(
    [approved],
    {
      now: new Date('2026-07-26T00:00:00Z'),
      verifyIndependentAttestation: candidate =>
        candidate.attestationKeyId === 'fixture-reviewer',
    },
  );
  const result = registry.evaluate({
    countryCode: 'JP',
    postalCode: '100-0001',
    purpose: 'existence',
  });

  assert.equal(result?.status, 'pass');
  assert.equal(result?.liveEligible, true);
  assert.equal(result?.evidenceLevel, 'independently_attested');
  assert.match(result?.sourceRefs.join('\n') || '', /holdout:sha256:/);
  assert.match(result?.sourceRefs.join('\n') || '', /report:sha256:/);
});

test('independent adapter disagreement becomes a conflict instead of a pass', () => {
  const registry = createAddressQlRuntimeAdapterRegistry(
    [
      adapter({ id: 'synthetic-source-a' }),
      adapter({
        id: 'synthetic-source-b',
        evaluate: () => ({
          status: 'fail',
          confidence: 0.98,
          reasonCode: 'synthetic_negative_fixture',
        }),
      }),
    ],
    {
      now: new Date('2026-07-26T00:00:00Z'),
      allowConformanceAdapters: true,
    },
  );
  const result = registry.evaluate({
    countryCode: 'JP',
    postalCode: '100-0001',
    purpose: 'existence',
  });

  assert.equal(result?.status, 'conflict');
  assert.equal(result?.reasonCode, 'runtime_adapter_conflict');
});

test('expired and malformed evidence cannot enter the registry', () => {
  const registry = createAddressQlRuntimeAdapterRegistry(
    [
      adapter({
        id: 'expired-adapter',
        evidence: evidence({ validUntil: '2026-07-20T00:00:00Z' }),
      }),
      adapter({
        id: 'invalid-evidence',
        evidence: evidence({ correctionUrl: 'http://example.invalid/corrections' }),
      }),
    ],
    {
      now: new Date('2026-07-26T00:00:00Z'),
      allowConformanceAdapters: true,
    },
  );

  assert.equal(registry.adapterCount, 0);
});

test('an adapter expires automatically while the registry remains running', () => {
  let now = '2026-07-26T00:00:00Z';
  const registry = createAddressQlRuntimeAdapterRegistry(
    [adapter({
      evidence: evidence({ validUntil: '2026-07-27T00:00:00Z' }),
    })],
    {
      clock: () => now,
      allowConformanceAdapters: true,
    },
  );

  assert.equal(registry.adapterCount, 1);
  assert.ok(registry.capability({
    countryCode: 'JP',
    purpose: 'existence',
  }));

  now = '2026-07-27T00:00:00Z';
  assert.equal(registry.adapterCount, 0);
  assert.equal(registry.capability({
    countryCode: 'JP',
    purpose: 'existence',
  }), null);
  assert.equal(registry.evaluate({
    countryCode: 'JP',
    postalCode: '100-0001',
    purpose: 'existence',
  }), null);
});

test('approved adapters take precedence over conformance adapters', () => {
  const registry = createAddressQlRuntimeAdapterRegistry(
    [
      adapter({ id: 'approved-adapter', mode: 'approved' }),
      adapter({
        id: 'conformance-adapter',
        evaluate: () => ({
          status: 'fail',
          confidence: 0.99,
          reasonCode: 'synthetic_negative_fixture',
        }),
      }),
    ],
    {
      now: new Date('2026-07-26T00:00:00Z'),
      allowConformanceAdapters: true,
      verifyIndependentAttestation: () => true,
    },
  );

  const result = registry.evaluate({
    countryCode: 'JP',
    postalCode: '100-0001',
    purpose: 'existence',
  });
  assert.equal(result?.status, 'pass');
  assert.equal(result?.liveEligible, true);
  assert.deepEqual(result?.adapterIds, ['approved-adapter']);
});
