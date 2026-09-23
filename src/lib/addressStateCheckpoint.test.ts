import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSyntheticAddressStateCheckpoint,
  verifyAddressStateCheckpoint,
  type CheckpointEvidence,
  type CheckpointPolicy,
} from './addressStateCheckpoint';

const policy: CheckpointPolicy = {
  expectedLogId: 'synthetic:postal-zone-log',
  expectedAuthorityKind: 'postal_zone',
  expectedPolicyVersion: 'synthetic-policy-v2',
  expectedBoundaryEpoch: 4,
  minimumWitnessCosignatures: 2,
  now: '2026-07-23T01:00:00Z',
};

const evidence: CheckpointEvidence = {
  signatureVerified: true,
  inclusionVerified: true,
  consistencyVerified: true,
  witnessCosignaturesVerified: 2,
  observedAt: '2026-07-23T00:05:00Z',
  sharedMetadataKinds: ['log_id', 'epoch', 'tree_size', 'root_hash', 'policy_version', 'boundary_epoch'],
};

const previous = createSyntheticAddressStateCheckpoint({
  epoch: 7,
  treeSize: 120,
  rootHash: 'sha256:synthetic-root-7',
  previousRootHash: 'sha256:synthetic-root-6',
});

test('accepts a synthetic privacy-safe append-only checkpoint', () => {
  const result = verifyAddressStateCheckpoint(createSyntheticAddressStateCheckpoint(), evidence, policy, previous);
  assert.deepEqual(result, { status: 'accept', errors: [], forkEvidence: false });
});

test('blocks two fresh signed views with the same log position and different roots', () => {
  const checkpoint = createSyntheticAddressStateCheckpoint();
  const peer = createSyntheticAddressStateCheckpoint({ rootHash: 'sha256:synthetic-conflicting-root' });
  const result = verifyAddressStateCheckpoint(checkpoint, evidence, policy, previous, [peer]);
  assert.equal(result.status, 'block');
  assert.equal(result.forkEvidence, true);
  assert.ok(result.errors.includes('signed-fork-detected'));
});

test('does not let valid inclusion override invalid consistency', () => {
  const result = verifyAddressStateCheckpoint(
    createSyntheticAddressStateCheckpoint(),
    { ...evidence, consistencyVerified: false },
    policy,
    previous,
  );
  assert.equal(result.status, 'manual_review');
  assert.ok(result.errors.includes('consistency-unverified'));
});

test('blocks rollback and downgrades stale boundary or insufficient witnesses', () => {
  const rollback = verifyAddressStateCheckpoint(
    createSyntheticAddressStateCheckpoint({ epoch: 6, treeSize: 100 }),
    evidence,
    policy,
    previous,
  );
  assert.equal(rollback.status, 'block');
  assert.ok(rollback.errors.includes('epoch-rollback'));
  assert.ok(rollback.errors.includes('tree-size-rollback'));

  const weak = verifyAddressStateCheckpoint(
    createSyntheticAddressStateCheckpoint({ boundaryEpoch: 3 }),
    { ...evidence, witnessCosignaturesVerified: 1 },
    policy,
    previous,
  );
  assert.equal(weak.status, 'manual_review');
  assert.ok(weak.errors.includes('boundary-epoch-mismatch'));
  assert.ok(weak.errors.includes('insufficient-witness-quorum'));
});

test('blocks audit gossip that discloses address or credential query metadata', () => {
  const result = verifyAddressStateCheckpoint(
    createSyntheticAddressStateCheckpoint(),
    { ...evidence, sharedMetadataKinds: [...evidence.sharedMetadataKinds, 'credential_status_index'] },
    policy,
    previous,
  );
  assert.equal(result.status, 'block');
  assert.ok(result.errors.includes('private-audit-metadata'));
});
