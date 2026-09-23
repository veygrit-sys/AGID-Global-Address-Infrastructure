import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
  buildPolkadotChainCommitment,
  buildPolkadotExtrinsicPlan,
  evaluatePolkadotPublication,
  getNextPolkadotIntegrationStage,
  listPolkadotIntegrationStages,
} from './polkadotIntegration';

test('Polkadot integration stages are ordered from commitments to DAO governance', () => {
  const stages = listPolkadotIntegrationStages();

  assert.deepEqual(stages.map(stage => stage.id), [
    'chain-commitment',
    'zk-address-proof',
    'zk-delivery',
    'address-credential',
    'credential-marketplace',
    'aoid-ownership',
    'aoid-inheritance',
    'address-reputation',
    'humanitarian-identity',
    'disaster-address',
    'address-lineage',
    'aoid-history-proof',
    'address-dao',
  ]);
  assert.equal(stages[0].modelVersion, AGID_POLKADOT_INTEGRATION_MODEL_VERSION);
  assert.ok(stages.find(stage => stage.id === 'address-dao')?.dependsOn.includes('address-lineage'));
  assert.equal(getNextPolkadotIntegrationStage([])?.id, 'chain-commitment');
  assert.equal(getNextPolkadotIntegrationStage(['chain-commitment', 'zk-address-proof'])?.id, 'zk-delivery');
});

test('Polkadot chain commitments publish only safe public ZK proof metadata', () => {
  const commitment = buildPolkadotChainCommitment({
    stageId: 'zk-address-proof',
    entityType: 'zk-proof',
    entityId: 'proof:hokkaido-residence-001',
    publicPayload: {
      proofType: 'ZK Address Proof',
      regionClaim: 'JP:HOKKAIDO',
      verifierVersion: 'private-address-predicate-proof-v1',
      issuerDid: 'did:kilt:agid-issuer',
      subjectCommitment: 'sub_3OJt8P9K8p0bN0QhdQ80p0vQ',
      bindingCommitment: 'bind_MmM5fLbJl6b1r6pU0RkqUQ',
      nullifier: 'nullifier_north_japan_epoch_2026',
    },
    salt: 'test-chain-commitment-salt',
  });
  const publicText = JSON.stringify(commitment);

  assert.equal(commitment.modelVersion, AGID_POLKADOT_INTEGRATION_MODEL_VERSION);
  assert.equal(commitment.publishable, true);
  assert.match(commitment.commitmentHash, /^[a-f0-9]{64}$/u);
  assert.equal(commitment.publicPayload.regionClaim, 'JP:HOKKAIDO');
  assert.doesNotMatch(publicText, /Sapporo|Private Receiver|\+81|room|phone/iu);
});

test('Polkadot publication gate blocks raw address and AOID private fields', () => {
  const decision = evaluatePolkadotPublication({
    stageId: 'zk-delivery',
    publicPayload: {
      deliveryEligible: true,
      recipient: 'Private Receiver',
      phone: '+81 3 0000 0000',
      addressText: '1-1 Sapporo private apartment 901',
      lat: 43.0618,
      lon: 141.3545,
    },
  });
  const commitment = buildPolkadotChainCommitment({
    stageId: 'zk-delivery',
    entityType: 'zk-proof',
    entityId: 'proof:delivery-001',
    publicPayload: decision.redactedPayload,
    salt: 'safe-redacted-commitment',
  });

  assert.equal(decision.publishable, false);
  assert.ok(decision.forbiddenFields.includes('payload.recipient'));
  assert.ok(decision.forbiddenFields.includes('payload.phone'));
  assert.ok(decision.forbiddenFields.includes('payload.addressText'));
  assert.ok(decision.forbiddenFields.includes('payload.lat'));
  assert.equal(JSON.stringify(decision.redactedPayload).includes('Private Receiver'), false);
  assert.equal(commitment.publishable, true);
});

test('Polkadot extrinsic plans map stages to minimal pallets and commitments', () => {
  const ownershipCommitment = buildPolkadotChainCommitment({
    stageId: 'aoid-ownership',
    entityType: 'aoid-ownership',
    entityId: 'aoid-owner-proof-001',
    publicPayload: {
      aoidCommitment: 'aoid_commitment_safe_value',
      ownerKeyCommitment: 'owner_key_commitment_safe_value',
      delegationPolicyHash: 'policy_hash_safe_value',
    },
    salt: 'ownership-chain-salt',
  });
  const ownershipPlan = buildPolkadotExtrinsicPlan({
    stageId: 'aoid-ownership',
    commitment: ownershipCommitment,
  });
  const daoPlan = buildPolkadotExtrinsicPlan({
    stageId: 'address-dao',
  });

  assert.equal(ownershipPlan.ready, true);
  assert.equal(ownershipPlan.pallet, 'agidAoidOwnership');
  assert.equal(ownershipPlan.extrinsic, 'registerOwnershipCommitment');
  assert.ok(ownershipPlan.requiredCommitments.includes('aoidCommitment'));
  assert.ok(ownershipPlan.forbiddenOnChainFields.includes('recipient'));

  assert.equal(daoPlan.ready, false);
  assert.equal(daoPlan.pallet, 'agidAddressDao');
  assert.equal(daoPlan.extrinsic, 'proposeRuleSetHash');
  assert.ok(daoPlan.requiredCommitments.includes('ruleSetHash'));
});
