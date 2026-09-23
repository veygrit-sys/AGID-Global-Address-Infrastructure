import assert from 'node:assert/strict';
import { test } from 'node:test';

import { issueAddressCredential } from './addressCredential';
import { createInMemoryEthereumRegistryOnlyStore } from './ethereumRegistryOnlyMode';
import {
  createPrivateAddressPredicateProof,
  stripPrivateAddressPredicateProofMaterial,
  type PrivateAddressPredicateRegion,
} from './privateAddressPredicateProof';
import {
  deriveFullZkEthereumNullifierHash,
  getFullZkEthereumModeCapabilities,
  verifyFullZkEthereumPrivateAddressPredicate,
} from './fullZkEthereumMode';

const issuerId = 'agid-mode4-test-issuer';
const issuerSecret = 'test-only-mode4-issuer-secret';
const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  district: 'Marunouchi',
  road: 'Marunouchi',
  house_number: '1',
  building: 'Mode Four Hidden Tower',
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

async function createMode4Proof() {
  const credential = await issueAddressCredential({
    issuerId,
    issuerSecret,
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    layer: 'AOID',
    subjectId: 'aoid:test:mode4-resident',
    verificationStatus: 'verified',
    verificationScore: 0.95,
    sourceIds: ['japan-post', 'tokyo-open-admin-boundary'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-mode4',
  });
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
    scope: 'aid-distribution-2026-06',
    challenge: 'mode4-zk-ethereum-nonce-001',
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateProofSalt: 'private-mode4-proof-salt',
  });

  return stripPrivateAddressPredicateProofMaterial(envelope);
}

test('Mode 4 capabilities combine ZK privacy with Ethereum public audit', () => {
  const capabilities = getFullZkEthereumModeCapabilities();

  assert.equal(capabilities.mode, 'full-zk-ethereum');
  assert.equal(capabilities.zkEnabled, true);
  assert.equal(capabilities.ethereumEnabled, true);
  assert.equal(capabilities.publicLedgerEnabled, true);
  assert.equal(capabilities.gasRequired, true);
  assert.equal(capabilities.heaviestMode, true);
  assert.equal(capabilities.storage.rawAddressStored, false);
  assert.ok(capabilities.privacyModel.neverPublish.includes('raw AGID'));
});

test('Mode 4 verifies proof, records public registry state, and avoids hidden address leakage', async () => {
  const store = createInMemoryEthereumRegistryOnlyStore();
  const envelope = await createMode4Proof();
  const result = await verifyFullZkEthereumPrivateAddressPredicate({
    envelope,
    store,
    surface: 'humanitarian-server',
    issuerId,
    issuerSecret,
    expectedScope: 'aid-distribution-2026-06',
    expectedChallenge: 'mode4-zk-ethereum-nonce-001',
    requiredPredicates: [
      { kind: 'delivery-region', regionId: 'DELIVERY:TOKYO-CENTRAL' },
      { kind: 'country-resident', countryCode: 'JP' },
      { kind: 'city-resident', countryCode: 'JP', city: 'Chiyoda-ku' },
    ],
    minimumScore: 0.9,
    now: '2026-01-01T00:06:00.000Z',
    networkId: 'base-sepolia',
    issuerRegistration: {
      issuerId,
      issuerAddress: '0x1234567890abcdef1234567890abcdef12345678',
      issuerPublicKeyCommitment: 'mode4_issuer_public_key_commitment',
    },
    revocationAnchor: {
      registryId: 'mode4-revocation-registry',
      revocationRoot: 'mode4_revocation_root_public',
      freshnessRoot: 'mode4_freshness_root_public',
      validUntil: '2026-01-01T01:00:00.000Z',
    },
    nullifier: {
      nullifierHash: 'mode4_domain_separated_nullifier_hash',
      scope: 'aid-distribution-2026-06',
    },
    payment: {
      payerCommitment: 'mode4_payer_commitment',
      payeeCommitment: 'mode4_payee_commitment',
      purposeHash: 'mode4_aid_payment_purpose_hash',
      tokenSymbol: 'USDC',
      amount: '25.00',
    },
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.valid, true);
  assert.equal(result.surface, 'humanitarian-server');
  assert.equal(result.proof.valid, true);
  assert.equal(result.ethereum.nullifierStrength, 'domain-separated-nullifier');
  assert.equal(result.ethereum.nullifier?.status, 'recorded');
  assert.equal(result.ethereum.revocationAnchor?.status, 'recorded');
  assert.equal(result.ethereum.payment?.status, 'recorded');
  assert.equal(result.ethereum.txPlans.length, 4);
  assert.equal(result.ethereum.txPlans.every(plan => plan.zkProofGateRequired), true);
  assert.ok(result.ethereum.totalEstimatedGasUnits > 0);
  assert.equal(result.privacy.zkProofRequired, true);
  assert.equal(result.privacy.rawAddressStored, false);
  assert.equal(result.privacy.rawAgidStored, false);
  assert.equal(result.privacy.rawAoidStored, false);
  assert.equal(result.privacy.rawProofsStored, false);
  assert.equal(result.auditability.globalNullifierAudit, true);
  assert.equal(result.auditability.revocationFreshnessAudit, true);
  assert.equal(result.auditability.paymentAudit, true);
  assert.doesNotMatch(serialized, /Mode Four Hidden Tower|Marunouchi|100-0001|35\.6812|139\.7671|private-mode4-proof-salt/i);
});

test('Mode 4 rejects duplicate public nullifier use', async () => {
  const store = createInMemoryEthereumRegistryOnlyStore();
  const envelope = await createMode4Proof();
  const input = {
    envelope,
    store,
    issuerId,
    issuerSecret,
    expectedScope: 'aid-distribution-2026-06',
    expectedChallenge: 'mode4-zk-ethereum-nonce-001',
    now: '2026-01-01T00:06:00.000Z',
    nullifier: {
      nullifierHash: 'mode4_duplicate_nullifier_hash',
      scope: 'aid-distribution-2026-06',
    },
  };
  const first = await verifyFullZkEthereumPrivateAddressPredicate(input);
  const second = await verifyFullZkEthereumPrivateAddressPredicate(input);

  assert.equal(first.valid, true);
  assert.equal(second.valid, false);
  assert.equal(second.ethereum.nullifier?.status, 'duplicate');
  assert.ok(second.errors.includes('nullifier-already-used'));
});

test('Mode 4 can derive a proof-replay nullifier but warns that it is weaker', async () => {
  const store = createInMemoryEthereumRegistryOnlyStore();
  const envelope = await createMode4Proof();
  const result = await verifyFullZkEthereumPrivateAddressPredicate({
    envelope,
    store,
    issuerId,
    issuerSecret,
    expectedScope: 'aid-distribution-2026-06',
    expectedChallenge: 'mode4-zk-ethereum-nonce-001',
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(result.valid, true);
  assert.equal(result.ethereum.nullifierStrength, 'proof-replay-nullifier');
  assert.equal(result.ethereum.nullifier?.record?.nullifierHash, deriveFullZkEthereumNullifierHash(envelope));
  assert.ok(result.warnings.includes('strong-domain-separated-nullifier-not-provided'));
});
