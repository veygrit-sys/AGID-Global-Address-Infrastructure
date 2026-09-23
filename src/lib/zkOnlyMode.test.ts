import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  issueAddressCredential,
  stripPrivateAddressCredentialMaterial,
} from './addressCredential';
import {
  createPrivateAddressPredicateProof,
  stripPrivateAddressPredicateProofMaterial,
  type PrivateAddressPredicateRegion,
} from './privateAddressPredicateProof';
import {
  getZkOnlyModeCapabilities,
  verifyZkOnlyPrivateAddressPredicate,
  verifyZkOnlyProofBundle,
} from './zkOnlyMode';

const issuerId = 'agid-zk-only-test-issuer';
const issuerSecret = 'test-only-zk-only-mode-issuer-secret';
const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  district: 'Marunouchi',
  road: 'Marunouchi',
  house_number: '1',
  building: 'Hidden Tower',
  postcode: '100-0001',
};
const deliveryRegion: PrivateAddressPredicateRegion = {
  id: 'DELIVERY:TOKYO-CENTRAL',
  purpose: 'delivery-area',
  version: 'tokyo-central-v1',
  geometry: {
    type: 'bbox',
    north: 35.9,
    south: 35.5,
    west: 139.55,
    east: 139.95,
  },
};

async function issueTokyoCredential() {
  return issueAddressCredential({
    issuerId,
    issuerSecret,
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    layer: 'AOID',
    subjectId: 'aoid:test:zk-only-resident',
    verificationStatus: 'verified',
    verificationScore: 0.94,
    sourceIds: ['japan-post', 'tokyo-open-admin-boundary'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-zk-only-mode',
  });
}

async function createPublicPredicateProof() {
  const credential = await issueTokyoCredential();
  const envelope = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    point: { lat: 35.6812, lon: 139.7671 },
    predicates: [
      { kind: 'delivery-region', region: deliveryRegion },
      { kind: 'country-resident', countryCode: 'JP' },
      { kind: 'city-resident', countryCode: 'JP', city: 'Chiyoda-ku' },
    ],
    scope: 'delivery-checkout',
    challenge: 'zk-only-mode-nonce-001',
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateProofSalt: 'private-zk-only-mode-proof-salt',
  });

  return {
    credential,
    envelope,
    publicEnvelope: stripPrivateAddressPredicateProofMaterial(envelope),
  };
}

test('Mode 2 capabilities explicitly disable Ethereum and public ledger writes', () => {
  const capabilities = getZkOnlyModeCapabilities();

  assert.equal(capabilities.mode, 'zk-only');
  assert.equal(capabilities.zkEnabled, true);
  assert.equal(capabilities.ethereumEnabled, false);
  assert.equal(capabilities.publicLedgerEnabled, false);
  assert.equal(capabilities.gasCost, 0);
  assert.equal(capabilities.storage.rawAddressStored, false);
  assert.equal(capabilities.storage.rawAgidStored, false);
  assert.equal(capabilities.storage.rawProofsStored, false);
  assert.ok(capabilities.verificationSurfaces.includes('pos-terminal'));
});

test('Mode 2 verifies private address predicates without ledger writes or hidden address leakage', async () => {
  const { publicEnvelope } = await createPublicPredicateProof();
  const result = await verifyZkOnlyPrivateAddressPredicate({
    envelope: publicEnvelope,
    surface: 'pos-terminal',
    issuerId,
    issuerSecret,
    expectedScope: 'delivery-checkout',
    expectedChallenge: 'zk-only-mode-nonce-001',
    requiredPredicates: [
      { kind: 'delivery-region', regionId: 'DELIVERY:TOKYO-CENTRAL' },
      { kind: 'country-resident', countryCode: 'JP' },
      { kind: 'city-resident', countryCode: 'JP', city: 'Chiyoda-ku' },
    ],
    minimumScore: 0.9,
    now: '2026-01-01T00:06:00.000Z',
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.valid, true);
  assert.equal(result.surface, 'pos-terminal');
  assert.equal(result.ledger.ethereumUsed, false);
  assert.equal(result.ledger.publicLedgerWritten, false);
  assert.equal(result.ledger.registryWrite, false);
  assert.equal(result.ledger.gasCost, 0);
  assert.equal(result.privacy.privacyPreserved, true);
  assert.equal(result.privacy.rawAddressStored, false);
  assert.equal(result.privacy.rawAgidStored, false);
  assert.equal(result.privacy.rawProofsStored, false);
  assert.equal(result.proofStrength, 'zk-ready-simulated');
  assert.ok(result.warnings.includes('zk-proof-currently-simulated'));
  assert.doesNotMatch(serialized, /Marunouchi|100-0001|Hidden Tower|35\.6812|139\.7671|private-zk-only-mode-proof-salt/i);
});

test('Mode 2 rejects unstripped private proof material', async () => {
  const { envelope } = await createPublicPredicateProof();
  const result = await verifyZkOnlyPrivateAddressPredicate({
    envelope,
    issuerId,
    issuerSecret,
    expectedScope: 'delivery-checkout',
    expectedChallenge: 'zk-only-mode-nonce-001',
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(result.valid, false);
  assert.equal(result.privacy.privacyPreserved, false);
  assert.ok(result.errors.includes('privacy-fields-not-hidden'));
});

test('Mode 2 verifies proof bundle compatibility without storing raw proofs', async () => {
  const { credential, publicEnvelope } = await createPublicPredicateProof();
  const result = verifyZkOnlyProofBundle({
    proofs: [publicEnvelope, stripPrivateAddressCredentialMaterial(credential)],
    surface: 'humanitarian-server',
    expectedScope: 'delivery-checkout',
    allowSharedCommitments: true,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(result.valid, true);
  assert.equal(result.surface, 'humanitarian-server');
  assert.equal(result.ledger.ethereumUsed, false);
  assert.equal(result.privacy.rawProofsStored, false);
  assert.equal(result.privacy.publicLedgerWritten, false);
  assert.equal(result.compatibility.proofCount, 2);
  assert.ok(result.compatibility.manifest.proofVersions.includes('private-address-predicate-proof-v1'));
  assert.ok(result.compatibility.manifest.proofVersions.includes('address-credential-v1'));
  assert.ok(result.warnings.includes('zk-proof-currently-simulated'));
});
