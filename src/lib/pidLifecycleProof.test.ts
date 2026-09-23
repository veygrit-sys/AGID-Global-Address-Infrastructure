import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createPidLifecycleProof,
  stripPrivatePidLifecycleProofMaterial,
  verifyPidLifecycleProof,
} from './pidLifecycleProof';

const issuerId = 'agid-pid-lifecycle-test';
const issuerSecret = 'test-only-pid-lifecycle-issuer-secret';
const privateLifecycleSalt = 'pid-lifecycle-private-salt-for-tests';

const pidA = 'AMT-11111111111111111111111111111111';
const pidB = 'AMT-22222222222222222222222222222222';
const pidC = 'AMT-33333333333333333333333333333333';
const pidD = 'AMT-44444444444444444444444444444444';

test('proves a PID history update without exposing hidden history roots', async () => {
  const envelope = await createPidLifecycleProof({
    issuerId,
    issuerSecret,
    operation: {
      kind: 'history-update',
      pid: pidA,
      previousStatus: 'verified',
      nextStatus: 'verified',
      reasonCode: 'delivery-success-observed',
      hiddenEventIds: ['private-delivery-event-1', 'private-device-confirmation-2'],
    },
    history: {
      previousHistoryRoot: 'private-before-history-root',
      nextHistoryRoot: 'private-after-history-root',
      previousSequence: 10,
      nextSequence: 12,
      eventCount: 2,
      actorScope: 'server-audit',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateLifecycleSalt,
  });

  assert.equal(envelope.claim.operation.kind, 'history-update');
  assert.equal(envelope.claim.operation.primaryPid, pidA);
  assert.equal(envelope.claim.history.previousSequence, 10);
  assert.equal(envelope.claim.history.nextSequence, 12);
  assert.equal(envelope.claim.history.eventCount, 2);
  assert.equal(envelope.claim.policy.sequenceAdvancedByEventCount, true);
  assert.equal(envelope.claim.proofHint.zkReady, true);
  assert.equal(envelope.claim.proofHint.zkpGenerated, false);
  assert.equal(envelope.localCacheKey?.startsWith('pid-lifecycle:'), true);

  const publicEnvelope = stripPrivatePidLifecycleProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal('privateLifecycleSalt' in publicEnvelope, false);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.equal(publicText.includes('private-before-history-root'), false);
  assert.equal(publicText.includes('private-after-history-root'), false);
  assert.equal(publicText.includes('private-delivery-event-1'), false);

  const verification = await verifyPidLifecycleProof(publicEnvelope, {
    issuerId,
    issuerSecret,
    expectedKind: 'history-update',
    expectedPrimaryPid: pidA,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.lifecyclePassed, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.proofCost, 'none');
});

test('proves a PID merge retired source PIDs and preserved lineage', async () => {
  const envelope = await createPidLifecycleProof({
    issuerId,
    issuerSecret,
    operation: {
      kind: 'merge',
      fromPids: [pidA, pidB],
      intoPid: pidC,
      reasonCode: 'same-place-consensus',
      hiddenSourceHistoryRoots: ['private-source-root-a', 'private-source-root-b'],
      hiddenTargetHistoryRoot: 'private-target-root-c',
      allSourcePidsRetired: true,
      targetLineageIncludesSources: true,
      conflictResolution: 'same-place',
    },
    history: {
      previousHistoryRoot: 'private-merge-before-root',
      nextHistoryRoot: 'private-merge-after-root',
      previousSequence: 4,
      nextSequence: 5,
      eventCount: 1,
      actorScope: 'server-audit',
    },
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateLifecycleSalt,
  });

  const publicEnvelope = stripPrivatePidLifecycleProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.operation.kind, 'merge');
  assert.equal(envelope.claim.operation.primaryPid, pidC);
  assert.deepEqual(envelope.claim.operation.sourcePids, [pidA, pidB]);
  assert.equal(envelope.claim.policy.mergeSourcesRetired, true);
  assert.equal(envelope.claim.policy.lineagePreserved, true);
  assert.equal(publicText.includes('private-source-root-a'), false);
  assert.equal(publicText.includes('private-target-root-c'), false);

  const verification = await verifyPidLifecycleProof(publicEnvelope, {
    issuerSecret,
    expectedKind: 'merge',
    expectedPrimaryPid: pidC,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.lifecyclePassed, true);
});

test('proves a PID split used disjoint hidden partitions and preserved lineage', async () => {
  const envelope = await createPidLifecycleProof({
    issuerId,
    issuerSecret,
    operation: {
      kind: 'split',
      sourcePid: pidC,
      targetPids: [pidA, pidB, pidD],
      reasonCode: 'cluster-overmerged',
      partitions: [
        { targetPid: pidA, hiddenCandidateIds: ['private-candidate-a1', 'private-candidate-a2'] },
        { targetPid: pidB, hiddenCandidateIds: ['private-candidate-b1'] },
        { targetPid: pidD, hiddenCandidateIds: ['private-candidate-d1'] },
      ],
      sourcePidRetired: true,
      targetLineageIncludesSource: true,
    },
    history: {
      previousHistoryRoot: 'private-split-before-root',
      nextHistoryRoot: 'private-split-after-root',
      previousSequence: 21,
      nextSequence: 22,
      eventCount: 1,
      actorScope: 'server-audit',
    },
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateLifecycleSalt,
  });

  const publicEnvelope = stripPrivatePidLifecycleProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.operation.kind, 'split');
  assert.equal(envelope.claim.operation.primaryPid, pidC);
  assert.deepEqual(envelope.claim.operation.targetPids, [pidA, pidB, pidD]);
  assert.equal(envelope.claim.policy.splitSourceRetired, true);
  assert.equal(envelope.claim.policy.lineagePreserved, true);
  assert.equal(envelope.claim.policy.partitionCount, 3);
  assert.equal(envelope.claim.policy.partitionAssignments, 4);
  assert.equal(envelope.claim.policy.partitionsDisjoint, true);
  assert.equal(publicText.includes('private-candidate-a1'), false);
  assert.equal(publicText.includes('private-split-before-root'), false);

  const verification = await verifyPidLifecycleProof(publicEnvelope, {
    issuerSecret,
    expectedKind: 'split',
    expectedPrimaryPid: pidC,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.lifecyclePassed, true);
});

test('rejects split proofs with overlapping hidden partitions', async () => {
  await assert.rejects(
    createPidLifecycleProof({
      issuerId,
      issuerSecret,
      operation: {
        kind: 'split',
        sourcePid: pidC,
        targetPids: [pidA, pidB],
        reasonCode: 'cluster-overmerged',
        partitions: [
          { targetPid: pidA, hiddenCandidateIds: ['private-candidate-1'] },
          { targetPid: pidB, hiddenCandidateIds: ['private-candidate-1'] },
        ],
        sourcePidRetired: true,
        targetLineageIncludesSource: true,
      },
      history: {
        previousHistoryRoot: 'private-split-before-root',
        nextHistoryRoot: 'private-split-after-root',
        previousSequence: 1,
        nextSequence: 2,
        eventCount: 1,
      },
      privateLifecycleSalt,
    }),
    /disjoint partitions/i
  );
});

test('rejects tampered PID lifecycle signatures', async () => {
  const envelope = await createPidLifecycleProof({
    issuerId,
    issuerSecret,
    operation: {
      kind: 'merge',
      fromPids: [pidA],
      intoPid: pidC,
      reasonCode: 'manual-audit',
      allSourcePidsRetired: true,
      targetLineageIncludesSources: true,
      conflictResolution: 'manual-audit',
    },
    history: {
      previousHistoryRoot: 'private-merge-before-root',
      nextHistoryRoot: 'private-merge-after-root',
      previousSequence: 1,
      nextSequence: 2,
      eventCount: 1,
    },
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateLifecycleSalt,
  });
  const publicEnvelope = stripPrivatePidLifecycleProofMaterial(envelope);
  const tampered = {
    ...publicEnvelope,
    claim: {
      ...publicEnvelope.claim,
      policy: {
        ...publicEnvelope.claim.policy,
        mergeSourcesRetired: false,
      },
    },
  };

  const verification = await verifyPidLifecycleProof(tampered, {
    issuerSecret,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, false);
  assert.ok(verification.errors.includes('signature-invalid'));
});

test('rejects unstripped local PID lifecycle material as public proof', async () => {
  const envelope = await createPidLifecycleProof({
    issuerId,
    issuerSecret,
    operation: {
      kind: 'history-update',
      pid: pidA,
      previousStatus: 'verified',
      nextStatus: 'verified',
      reasonCode: 'manual-confirmation',
      hiddenEventIds: ['private-event'],
    },
    history: {
      previousHistoryRoot: 'private-before-root',
      nextHistoryRoot: 'private-after-root',
      previousSequence: 1,
      nextSequence: 2,
      eventCount: 1,
    },
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateLifecycleSalt,
  });

  const verification = await verifyPidLifecycleProof(envelope, {
    issuerSecret,
    expectedKind: 'history-update',
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('privacy-fields-not-hidden'));
});

test('returns invalid instead of throwing for malformed PID lifecycle envelopes', async () => {
  const verification = await verifyPidLifecycleProof({} as never, {
    issuerSecret,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, null);
  assert.ok(verification.errors.includes('malformed-pid-lifecycle-proof'));
});
