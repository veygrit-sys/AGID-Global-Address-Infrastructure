import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createInMemoryEthereumRegistryOnlyStore,
  getEthereumRegistryOnlyCapabilities,
} from './ethereumRegistryOnlyMode';

test('Mode 3 capabilities use Ethereum without ZK and without raw address storage', () => {
  const capabilities = getEthereumRegistryOnlyCapabilities();

  assert.equal(capabilities.mode, 'ethereum-registry-only');
  assert.equal(capabilities.zkEnabled, false);
  assert.equal(capabilities.ethereumEnabled, true);
  assert.equal(capabilities.publicLedgerEnabled, true);
  assert.equal(capabilities.gasRequired, true);
  assert.equal(capabilities.storesRawAddress, false);
  assert.equal(capabilities.storesRawAgid, false);
  assert.equal(capabilities.storesRawAoid, false);
  assert.ok(capabilities.privacyModel.neverPublish.includes('raw AGID'));
});

test('Mode 3 registers only public issuer material and produces an Ethereum tx plan', () => {
  const store = createInMemoryEthereumRegistryOnlyStore();
  const result = store.registerIssuer({
    issuerId: 'tokyo-aid-issuer',
    issuerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    issuerPublicKeyCommitment: 'pkc_test_issuer_public_key_commitment',
    metadataHash: '0xabc123',
    policyHash: '0xdef456',
    networkId: 'base-sepolia',
    now: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(result.status, 'recorded');
  assert.equal(result.errors.length, 0);
  assert.equal(result.record?.issuerId, 'tokyo-aid-issuer');
  assert.equal(result.txPlan?.contractRole, 'issuer-registry');
  assert.equal(result.txPlan?.zkProofRequired, false);
  assert.equal(result.txPlan?.gasRequired, true);
  assert.equal(result.txPlan?.networkId, 'base-sepolia');
  assert.equal(result.privacy.rawAddressStored, false);
});

test('Mode 3 rejects raw address, AGID, and AOID material', () => {
  const store = createInMemoryEthereumRegistryOnlyStore();
  const unsafeInput = {
    nullifierHash: 'nullifier_hash_public_only',
    scope: 'delivery-2026-06',
    address: '東京都千代田区丸の内1-1',
    agid: 'AGID-SECRET-1234',
    aoid: 'AOID-SECRET-5678',
  };
  const result = store.markNullifierUsed(unsafeInput);

  assert.equal(result.status, 'rejected');
  assert.match(result.errors.join('\n'), /raw-private-material-not-allowed-in-mode3/);
  assert.equal(result.record, null);
  assert.equal(result.txPlan, null);
});

test('Mode 3 prevents duplicate nullifier use within the same scope', () => {
  const store = createInMemoryEthereumRegistryOnlyStore();
  const first = store.markNullifierUsed({
    nullifierHash: 'nullifier_hash_same_event',
    scope: 'aid-distribution-2026-06',
    now: '2026-06-01T00:00:00.000Z',
  });
  const second = store.markNullifierUsed({
    nullifierHash: 'nullifier_hash_same_event',
    scope: 'aid-distribution-2026-06',
    now: '2026-06-01T00:01:00.000Z',
  });

  assert.equal(first.status, 'recorded');
  assert.equal(second.status, 'duplicate');
  assert.deepEqual(second.errors, ['nullifier-already-used']);
});

test('Mode 3 records payment commitments without AGID or AOID payloads', () => {
  const store = createInMemoryEthereumRegistryOnlyStore();
  const result = store.recordPayment({
    paymentId: 'payment-001',
    escrowId: 'escrow-001',
    payerCommitment: 'payer_commitment_public_hash',
    payeeCommitment: 'payee_commitment_public_hash',
    purposeHash: 'purpose_hash_delivery',
    tokenSymbol: 'USDC',
    amount: '12.50',
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.status, 'recorded');
  assert.equal(result.record?.paymentStatus, 'authorized');
  assert.equal(result.txPlan?.contractRole, 'payment-escrow');
  assert.doesNotMatch(serialized, /AGID-SECRET|AOID-SECRET|東京都|丸の内/i);
  assert.match(result.warnings.join('\n'), /payment-wallet-metadata/);
});
