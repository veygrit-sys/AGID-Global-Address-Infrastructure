import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AGID_REGISTRY_API_VERSION,
  collectAgidRegistryPrivateMaterialErrors,
  createInMemoryAgidRegistryApiStore,
  getAgidRegistryCapabilities,
} from './agidRegistryApi';

test('Mode 1 registry capabilities are local-server and do not require ZK, Ethereum, or gas', () => {
  const capabilities = getAgidRegistryCapabilities();

  assert.equal(capabilities.modeVersion, AGID_REGISTRY_API_VERSION);
  assert.equal(capabilities.mode, 'local-server-registry');
  assert.equal(capabilities.zkProofRequired, false);
  assert.equal(capabilities.ethereumRequired, false);
  assert.equal(capabilities.gasRequired, false);
  assert.equal(capabilities.privacy.rawAddressStored, false);
  assert.equal(capabilities.privacy.rawAgidStored, false);
  assert.equal(capabilities.privacy.rawAoidStored, false);
});

test('Mode 1 registry accepts issuer, freshness root, and public commitments', () => {
  const store = createInMemoryAgidRegistryApiStore();
  const issuer = store.registerIssuer({
    issuerId: 'issuer-a',
    trustScore: 0.91,
    publicKeyCommitment: '0xABCDEF',
    sourceIds: ['test'],
  });
  const freshness = store.anchorFreshnessRoot({
    freshnessRoot: '0xFRESH',
    registryId: 'registry-a',
    issuerId: 'issuer-a',
    freshUntil: '2026-06-18T00:00:00.000Z',
  });
  const verification = store.verify({
    issuerId: 'issuer-a',
    credentialCommitment: '0xCREDENTIAL',
    addressReferenceCommitment: '0xADDRESSREF',
    freshnessRoot: '0xFRESH',
    nullifierHash: '0xNULLIFIER',
    scope: 'delivery',
    now: '2026-06-17T00:00:00.000Z',
  });

  assert.equal(issuer.status, 'recorded');
  assert.equal(freshness.status, 'recorded');
  assert.equal(verification.valid, true);
  assert.equal(verification.issuer?.trustScore, 0.91);
  assert.equal(verification.freshness.anchored, true);
  assert.equal(verification.freshness.fresh, true);
});

test('Mode 1 registry rejects private raw address material before storage', () => {
  const store = createInMemoryAgidRegistryApiStore();
  const result = store.registerIssuer({
    issuerId: 'issuer-private',
    address: '東京都千代田区丸の内1-1',
  });
  const errors = collectAgidRegistryPrivateMaterialErrors({
    credentialCommitment: '0xpublic',
    agid: 'AGID-SECRET-123456',
  });

  assert.equal(result.status, 'rejected');
  assert.match(result.errors.join('\n'), /address.*private material/i);
  assert.match(errors.join('\n'), /agid.*private material/i);
  assert.equal(store.snapshot().issuers.length, 0);
});

test('Mode 1 registry detects revoked commitments and stale freshness windows', () => {
  const store = createInMemoryAgidRegistryApiStore();
  store.registerIssuer({ issuerId: 'issuer-revoke' });
  store.revokeCommitment({
    commitment: '0xdeadbeef',
    commitmentType: 'credential',
    issuerId: 'issuer-revoke',
  });

  const verification = store.verify({
    issuerId: 'issuer-revoke',
    credentialCommitment: '0xdeadbeef',
    freshUntil: '2026-01-01T00:00:00.000Z',
    now: '2026-06-17T00:00:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('commitment-revoked'));
  assert.ok(verification.errors.includes('freshness-window-stale'));
});

test('Mode 1 registry uses scope-separated nullifiers and detects duplicate use', () => {
  const store = createInMemoryAgidRegistryApiStore();
  const first = store.markNullifierUsed({
    nullifierHash: '0xabc',
    scope: 'aid-event',
  });
  const second = store.markNullifierUsed({
    nullifierHash: '0xabc',
    scope: 'aid-event',
  });
  const separateScope = store.markNullifierUsed({
    nullifierHash: '0xabc',
    scope: 'delivery-event',
  });

  assert.equal(first.status, 'recorded');
  assert.equal(second.status, 'duplicate');
  assert.match(second.errors.join('\n'), /nullifier-already-used/);
  assert.equal(separateScope.status, 'recorded');
});
