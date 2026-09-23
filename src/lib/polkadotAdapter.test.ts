import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPolkadotChainCommitment } from './polkadotIntegration';
import { createInMemoryPolkadotAdapter, POLKADOT_ADAPTER_MODEL_VERSION } from './polkadotAdapter';

function safeChainCommitment() {
  return buildPolkadotChainCommitment({
    stageId: 'chain-commitment',
    entityType: 'zk-proof',
    entityId: 'proof:chain:tokyo',
    salt: 'chain-salt',
    publicPayload: {
      verifierVersion: 'zk-address-v1',
      policyHash: 'POLICY-ROOT-2026',
    },
  });
}

function safeAddressProofCommitment() {
  return buildPolkadotChainCommitment({
    stageId: 'zk-address-proof',
    entityType: 'zk-proof',
    entityId: 'proof:address:tokyo',
    salt: 'address-proof-salt',
    publicPayload: {
      regionClaim: 'JP-13',
      proofCommitment: 'PROOF-COMMITMENT',
      subjectCommitment: 'SUBJECT-COMMITMENT',
      bindingCommitment: 'BINDING-COMMITMENT',
      nullifier: 'NULLIFIER-2026',
    },
  });
}

test('in-memory Polkadot adapter anchors a publishable commitment through the planned pallet and stores a queryable record', async () => {
  const adapter = createInMemoryPolkadotAdapter({
    networkId: 'rococo-local',
    parachainId: 4813,
    genesisHash: '0xgenesis',
    initialBlockNumber: 100,
  });
  const commitment = safeChainCommitment();

  const result = await adapter.anchorCommitment(commitment, {
    observedAt: '2026-06-05T00:00:00.000Z',
  });

  assert.equal(result.modelVersion, POLKADOT_ADAPTER_MODEL_VERSION);
  assert.equal(result.status, 'anchored');
  assert.equal(result.stageId, 'chain-commitment');
  assert.equal(result.pallet, 'agidCommitments');
  assert.equal(result.extrinsic, 'anchorCommitment');
  assert.equal(result.blockNumber, 100);
  assert.match(result.txHash ?? '', /^0x[0-9a-f]{64}$/);
  assert.match(result.blockHash ?? '', /^0x[0-9a-f]{64}$/);

  const stored = await adapter.queryCommitment(commitment.commitmentId);
  assert.equal(stored?.commitmentHash, commitment.commitmentHash);
  assert.equal(stored?.publicPayload.policyHash, 'POLICY-ROOT-2026');
  assert.equal(stored?.network.networkId, 'rococo-local');
});

test('in-memory Polkadot adapter rejects private payload commitments before storage', async () => {
  const adapter = createInMemoryPolkadotAdapter();
  const commitment = buildPolkadotChainCommitment({
    stageId: 'zk-address-proof',
    entityType: 'zk-proof',
    entityId: 'proof:private',
    publicPayload: {
      proofCommitment: 'PROOF-COMMITMENT',
      addressText: '1-2-3 private street',
      phone: '+81-00-0000-0000',
    },
  });

  const result = await adapter.anchorCommitment(commitment);

  assert.equal(result.status, 'rejected');
  assert.ok(result.errors.includes('private-fields-forbidden'));
  assert.ok(result.errors.includes('forbidden-field:payload.addressText'));
  assert.ok(result.errors.includes('forbidden-field:payload.phone'));
  assert.equal(await adapter.queryCommitment(commitment.commitmentId), null);
});

test('in-memory Polkadot adapter enforces stage dependencies before anchoring later stages', async () => {
  const adapter = createInMemoryPolkadotAdapter();
  const proofCommitment = safeAddressProofCommitment();

  const blocked = await adapter.anchorCommitment(proofCommitment);

  assert.equal(blocked.status, 'rejected');
  assert.ok(blocked.errors.includes('stage-dependency-missing:chain-commitment'));
  assert.equal(await adapter.queryCommitment(proofCommitment.commitmentId), null);

  await adapter.anchorCommitment(safeChainCommitment());
  const accepted = await adapter.anchorCommitment(proofCommitment);

  assert.equal(accepted.status, 'anchored');
  assert.equal(accepted.pallet, 'agidZkProofs');
  assert.equal(accepted.extrinsic, 'registerAddressProofCommitment');
});

test('in-memory Polkadot adapter returns an idempotent result for duplicate commitments', async () => {
  const adapter = createInMemoryPolkadotAdapter({ initialBlockNumber: 42 });
  const commitment = safeChainCommitment();

  const first = await adapter.anchorCommitment(commitment);
  const second = await adapter.anchorCommitment(commitment);

  assert.equal(first.status, 'anchored');
  assert.equal(second.status, 'already_anchored');
  assert.equal(second.blockNumber, first.blockNumber);
  assert.equal(second.txHash, first.txHash);
  assert.equal(second.blockHash, first.blockHash);
});

test('in-memory Polkadot adapter verifies finality from finalized block depth', async () => {
  const adapter = createInMemoryPolkadotAdapter({ initialBlockNumber: 10 });
  const commitment = safeChainCommitment();

  await adapter.anchorCommitment(commitment);

  const pending = await adapter.verifyFinality(commitment.commitmentId, {
    finalizedBlockNumber: 10,
    requiredConfirmations: 2,
  });
  assert.equal(pending.status, 'pending');
  assert.equal(pending.confirmations, 1);
  assert.equal(pending.finalized, false);

  const finalized = await adapter.verifyFinality(commitment.commitmentId, {
    finalizedBlockNumber: 11,
    requiredConfirmations: 2,
  });
  assert.equal(finalized.status, 'finalized');
  assert.equal(finalized.confirmations, 2);
  assert.equal(finalized.finalized, true);

  const missing = await adapter.verifyFinality('POLKA-MISSING');
  assert.equal(missing.status, 'missing');
  assert.equal(missing.finalized, false);
});
