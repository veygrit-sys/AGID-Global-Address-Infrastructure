import assert from 'node:assert/strict';
import test from 'node:test';

import { createSyntheticAddressStateCheckpoint } from './addressStateCheckpoint';
import {
  ADDRESSQL_CHECKPOINT_BINDING_VERSION,
  checkpointBindingPublicInputCommitment,
  checkpointDigest,
  createCheckpointBindingRef,
  verifyAddressQlCheckpointBinding,
  verifyCheckpointBindingPublicInputCommitment,
  type AddressQlStatementCheckpointBinding,
} from './addressQlCheckpointBinding';

const kinds = ['issuer', 'revocation', 'postal_zone', 'translation_profile', 'carrier', 'customs'] as const;
const checkpoints = kinds.map((authorityKind, index) =>
  createSyntheticAddressStateCheckpoint({
    authorityKind,
    logId: `synthetic:${authorityKind}`,
    rootHash: `sha256:synthetic-${authorityKind}`,
    boundaryEpoch: 4,
    epoch: 8 + index,
  }),
);

function binding(): AddressQlStatementCheckpointBinding {
  return {
    version: ADDRESSQL_CHECKPOINT_BINDING_VERSION,
    claimKind: 'deliverable',
    purpose: 'research_fixture',
    refs: checkpoints.map(createCheckpointBindingRef),
    transition: null,
  };
}

test('accepts a synthetic delivery statement bound to every authority checkpoint', () => {
  assert.deepEqual(
    verifyAddressQlCheckpointBinding(binding(), checkpoints),
    { status: 'accept', errors: [] },
  );
});

test('blocks root and authority-checkpoint substitution', () => {
  const candidate = binding();
  candidate.refs = candidate.refs.map(ref =>
    ref.authorityKind === 'customs'
      ? { ...ref, rootHash: 'sha256:attacker-root', checkpointDigest: 'forged-digest' }
      : ref,
  );
  const result = verifyAddressQlCheckpointBinding(candidate, checkpoints);
  assert.equal(result.status, 'block');
  assert.ok(result.errors.includes('root-substitution:customs'));
  assert.ok(result.errors.includes('checkpoint-substitution:customs'));
});

test('blocks replay of a proof ref from an older boundary epoch', () => {
  const candidate = binding();
  candidate.refs = candidate.refs.map(ref =>
    ref.authorityKind === 'postal_zone' ? { ...ref, boundaryEpoch: 3 } : ref,
  );
  const result = verifyAddressQlCheckpointBinding(candidate, checkpoints);
  assert.equal(result.status, 'block');
  assert.ok(result.errors.includes('boundary-epoch-replay:postal_zone'));
});

test('requires a total split/merge transition across boundary epochs', () => {
  const candidate = binding();
  candidate.refs = candidate.refs.map(ref =>
    ref.authorityKind === 'translation_profile' ? { ...ref, boundaryEpoch: 5 } : ref,
  );
  candidate.transition = {
    fromBoundaryEpoch: 4,
    toBoundaryEpoch: 5,
    sourceZoneIds: ['zone-a', 'zone-b'],
    targetZoneIds: ['zone-a1', 'zone-a2', 'zone-b'],
    sourceToTargets: { 'zone-a': ['zone-a1', 'zone-a2'] },
    translatedReferentBefore: 'referent:synthetic-1',
    translatedReferentAfter: 'referent:synthetic-1',
  };
  const result = verifyAddressQlCheckpointBinding(candidate, checkpoints);
  assert.equal(result.status, 'block');
  assert.ok(result.errors.includes('boundary-epoch-replay:translation_profile'));
  assert.ok(result.errors.includes('transition-not-total'));
});

test('downgrades a forward transition that changes the translated referent', () => {
  const candidate = binding();
  candidate.transition = {
    fromBoundaryEpoch: 4,
    toBoundaryEpoch: 5,
    sourceZoneIds: ['zone-a'],
    targetZoneIds: ['zone-a1', 'zone-a2'],
    sourceToTargets: { 'zone-a': ['zone-a1', 'zone-a2'] },
    translatedReferentBefore: 'referent:synthetic-1',
    translatedReferentAfter: 'referent:synthetic-2',
  };
  const result = verifyAddressQlCheckpointBinding(candidate, checkpoints);
  assert.equal(result.status, 'manual_review');
  assert.ok(result.errors.includes('translation-naturality-violation'));
});

test('canonical checkpoint digest rejects delimiter-style ambiguity', () => {
  const left = createSyntheticAddressStateCheckpoint({
    authorityKind: 'issuer',
    logId: 'synthetic|issuer',
    rootHash: 'sha256:left',
    policyVersion: 'policy',
  });
  const right = createSyntheticAddressStateCheckpoint({
    authorityKind: 'issuer',
    logId: 'synthetic',
    rootHash: 'sha256:left',
    policyVersion: 'issuer|policy',
  });
  assert.notEqual(checkpointDigest(left), checkpointDigest(right));
});

test('public-input commitment is independent of ref order', () => {
  const candidate = binding();
  const commitment = checkpointBindingPublicInputCommitment(candidate);
  candidate.refs.reverse();
  assert.equal(checkpointBindingPublicInputCommitment(candidate), commitment);
});

test('blocks proof commitment reuse after claim, purpose, or authority substitution', () => {
  const original = binding();
  const commitment = checkpointBindingPublicInputCommitment(original);

  const changedPurpose = { ...original, purpose: 'address_login' as const };
  assert.deepEqual(
    verifyCheckpointBindingPublicInputCommitment(changedPurpose, commitment),
    { status: 'block', errors: ['public-input-binding-mismatch'] },
  );

  const changedAuthority = binding();
  changedAuthority.refs = changedAuthority.refs.map(ref =>
    ref.authorityKind === 'customs' ? { ...ref, rootHash: 'sha256:substitute' } : ref,
  );
  assert.deepEqual(
    verifyCheckpointBindingPublicInputCommitment(changedAuthority, commitment),
    { status: 'block', errors: ['public-input-binding-mismatch'] },
  );
});

test('binds the complete transition relation and translated referents', () => {
  const candidate = binding();
  candidate.transition = {
    fromBoundaryEpoch: 4,
    toBoundaryEpoch: 5,
    sourceZoneIds: ['zone-a'],
    targetZoneIds: ['zone-a1', 'zone-a2'],
    sourceToTargets: { 'zone-a': ['zone-a1', 'zone-a2'] },
    translatedReferentBefore: 'referent:synthetic-1',
    translatedReferentAfter: 'referent:synthetic-1',
  };
  const commitment = checkpointBindingPublicInputCommitment(candidate);
  candidate.transition.sourceToTargets['zone-a'] = ['zone-a2'];
  assert.equal(
    verifyCheckpointBindingPublicInputCommitment(candidate, commitment).status,
    'block',
  );
});

test('rejects ambiguous duplicate authority refs', () => {
  const candidate = binding();
  candidate.refs.push({ ...candidate.refs.find(ref => ref.authorityKind === 'customs')! });
  const result = verifyAddressQlCheckpointBinding(candidate, checkpoints);
  assert.equal(result.status, 'block');
  assert.ok(result.errors.includes('duplicate-authority-ref:customs'));
});

test('blocks non-NFC Unicode before cross-language commitment verification', () => {
  const candidate = binding();
  candidate.transition = {
    fromBoundaryEpoch: 4,
    toBoundaryEpoch: 5,
    sourceZoneIds: ['zone-e\u0301'],
    targetZoneIds: ['zone-é'],
    sourceToTargets: { 'zone-e\u0301': ['zone-é'] },
    translatedReferentBefore: 'referent:synthetic-1',
    translatedReferentAfter: 'referent:synthetic-1',
  };
  const result = verifyAddressQlCheckpointBinding(candidate, checkpoints);
  assert.equal(result.status, 'block');
  assert.ok(result.errors.some(error => error.startsWith('non-canonical-unicode:')));
});

test('blocks unsafe integers and duplicate transition keys or edges', () => {
  const candidate = binding();
  candidate.transition = {
    fromBoundaryEpoch: Number.MAX_SAFE_INTEGER + 1,
    toBoundaryEpoch: Number.MAX_SAFE_INTEGER + 2,
    sourceZoneIds: ['zone-a', 'zone-a'],
    targetZoneIds: ['zone-b'],
    sourceToTargets: { 'zone-a': ['zone-b', 'zone-b'] },
    translatedReferentBefore: 'referent:synthetic-1',
    translatedReferentAfter: 'referent:synthetic-1',
  };
  const result = verifyAddressQlCheckpointBinding(candidate, checkpoints);
  assert.equal(result.status, 'block');
  assert.ok(result.errors.includes('invalid-canonical-integer:transition.fromBoundaryEpoch'));
  assert.ok(result.errors.includes('duplicate-transition-source-zone'));
  assert.ok(result.errors.includes('duplicate-transition-target-edge'));
});

test('has a fixed digest vector for independent implementations', () => {
  const checkpoint = createSyntheticAddressStateCheckpoint({
    authorityKind: 'issuer',
    logId: 'synthetic:東京',
    rootHash: 'sha256:0123456789abcdef',
    policyVersion: 'policy-v1',
    epoch: 7,
    treeSize: 11,
    boundaryEpoch: 3,
  });
  assert.equal(
    checkpointDigest(checkpoint),
    'sha256:b7fd1ed040bad34b043e2c2a9ad3c0410fca5f18121e0308151cde4f09bf0c2f',
  );
});
