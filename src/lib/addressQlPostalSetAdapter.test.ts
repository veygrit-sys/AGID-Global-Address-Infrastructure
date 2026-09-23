import assert from 'node:assert/strict';
import test from 'node:test';

import { createAddressQlPostalSetAdapter } from './addressQlPostalSetAdapter';
import {
  createAddressQlRuntimeAdapterRegistry,
  type AddressQlRuntimeAdapterEvidence,
} from './addressQlRuntimeAdapter';

const digest = (character: string) => `sha256:${character.repeat(64)}`;

function evidence(): AddressQlRuntimeAdapterEvidence {
  return {
    sourceId: 'synthetic-postal-set',
    sourceVersion: 'fixture-v1',
    reuseRights: 'Synthetic conformance fixture',
    coverageStatement: 'Synthetic country-level postcode set.',
    correctionUrl: 'https://example.invalid/corrections',
    retrievedAt: '2026-07-01T00:00:00Z',
    validUntil: '2027-07-01T00:00:00Z',
    datasetDigest: digest('a'),
    holdoutDigest: digest('b'),
    reportDigest: digest('c'),
    attestationKeyId: 'fixture-reviewer',
    attestationSignature: 'synthetic-signature',
  };
}

test('complete postal sets support positive and negative existence decisions', () => {
  const adapter = createAddressQlPostalSetAdapter({
    id: 'jp-complete-set',
    version: 'v1',
    mode: 'approved',
    countryCode: 'JP',
    purpose: 'existence',
    coverage: 'complete',
    postalCodes: ['100-0001', '１００－０００２'],
    evidence: evidence(),
  });
  const registry = createAddressQlRuntimeAdapterRegistry([adapter], {
    now: '2026-07-26T00:00:00Z',
    verifyIndependentAttestation: () => true,
  });

  assert.equal(registry.evaluate({
    countryCode: 'JP',
    postalCode: '１００－０００２',
    purpose: 'existence',
  })?.status, 'pass');
  assert.equal(registry.evaluate({
    countryCode: 'JP',
    postalCode: '999-9999',
    purpose: 'existence',
  })?.status, 'fail');
});

test('partial postal sets never turn absence into a negative claim', () => {
  const adapter = createAddressQlPostalSetAdapter({
    id: 'jp-partial-set',
    version: 'v1',
    mode: 'conformance',
    countryCode: 'JP',
    purpose: 'existence',
    coverage: 'partial',
    postalCodes: ['100-0001'],
    evidence: evidence(),
  });
  const registry = createAddressQlRuntimeAdapterRegistry([adapter], {
    now: '2026-07-26T00:00:00Z',
    allowConformanceAdapters: true,
  });

  assert.equal(registry.evaluate({
    countryCode: 'JP',
    postalCode: '999-9999',
    purpose: 'existence',
  })?.status, 'unknown');
  assert.equal(registry.capability({
    countryCode: 'JP',
    purpose: 'existence',
  })?.liveEligible, false);
});

test('JP postal sets treat ASCII and full-width hyphen forms as one code', () => {
  const adapter = createAddressQlPostalSetAdapter({
    id: 'jp-postal-normalization',
    version: 'fixture-v1',
    mode: 'conformance',
    countryCode: 'JP',
    purpose: 'existence',
    coverage: 'partial',
    postalCodes: ['1000001'],
    evidence: evidence(),
  });

  assert.equal(adapter.evaluate({
    countryCode: 'JP',
    postalCode: '100-0001',
    purpose: 'existence',
  }).status, 'pass');
  assert.equal(adapter.evaluate({
    countryCode: 'JP',
    postalCode: '１００－０００１',
    purpose: 'existence',
  }).status, 'pass');
});
