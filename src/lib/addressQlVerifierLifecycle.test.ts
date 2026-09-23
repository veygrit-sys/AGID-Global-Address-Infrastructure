import assert from 'node:assert/strict';
import test from 'node:test';

import { createSyntheticAddressQlProofInput } from './addressQlZkProofHooks';
import {
  ADDRESSQL_EXTERNAL_VERIFIER_RECEIPT_VERSION,
  type ExternalVerifierReceiptExpectation,
  type ExternalVerifierReceiptV1,
} from './addressQlExternalVerifierReceipt';
import {
  ADDRESSQL_VERIFIER_LIFECYCLE_VERSION,
  verifyVerifierLifecycle,
  type ChallengeConsumptionEvidence,
  type VerifierKeyLifecycleEvidence,
} from './addressQlVerifierLifecycle';

function fixture() {
  const proofInput = createSyntheticAddressQlProofInput();
  proofInput.proofArtifact.proofCommitment = 'sha256:synthetic-proof-30';
  proofInput.proofArtifact.publicInputCommitment = 'sha256:synthetic-input-30';
  proofInput.publicSignals.challengeHash = 'sha256:single-use-challenge-30';
  proofInput.publicSignals.verifierPolicyHash = 'sha256:policy-30';
  proofInput.publicSignals.proofExpiry = '2026-07-30T10:00:00.000Z';
  proofInput.verifierPolicy.audience = 'customs:synthetic-border';
  const expected: ExternalVerifierReceiptExpectation = {
    proofInput,
    verifierId: proofInput.verifierPolicy.verifierId,
    proofSystem: 'synthetic-zkvm',
    backendId: 'verifier:synthetic',
    circuitId: 'circuit:cross-border-v1',
    verificationKeyDigest: 'sha256:vk-epoch-7',
    bindingVersion: 'addressql-checkpoint-binding-v0.1',
    now: '2026-07-30T09:00:00.000Z',
  };
  const receipt: ExternalVerifierReceiptV1 = {
    receiptVersion: ADDRESSQL_EXTERNAL_VERIFIER_RECEIPT_VERSION,
    verifierId: expected.verifierId,
    proofSystem: expected.proofSystem,
    backendId: expected.backendId,
    circuitId: expected.circuitId,
    verificationKeyDigest: expected.verificationKeyDigest,
    proofCommitment: proofInput.proofArtifact.proofCommitment,
    publicInputCommitment: proofInput.proofArtifact.publicInputCommitment,
    verifierPolicyHash: proofInput.publicSignals.verifierPolicyHash,
    claimKind: proofInput.claim.kind,
    purpose: proofInput.claim.purpose,
    audience: proofInput.verifierPolicy.audience,
    challengeHash: proofInput.publicSignals.challengeHash,
    bindingVersion: expected.bindingVersion,
    verifiedAt: '2026-07-30T08:59:00.000Z',
    receiptExpiry: '2026-07-30T09:05:00.000Z',
    result: 'verified',
    authenticityVerified: true,
    cryptographicVerificationPerformed: true,
  };
  const key: VerifierKeyLifecycleEvidence = {
    lifecycleVersion: ADDRESSQL_VERIFIER_LIFECYCLE_VERSION,
    verifierId: receipt.verifierId,
    verificationKeyDigest: receipt.verificationKeyDigest,
    status: 'active',
    validFrom: '2026-07-01T00:00:00.000Z',
    validUntil: '2026-08-01T00:00:00.000Z',
    statusCheckedAt: '2026-07-30T09:00:00.000Z',
    statusRootDigest: 'sha256:synthetic-key-status-root',
    statusAuthenticityVerified: true,
  };
  const challenge: ChallengeConsumptionEvidence = {
    lifecycleVersion: ADDRESSQL_VERIFIER_LIFECYCLE_VERSION,
    challengeHash: receipt.challengeHash,
    verifierId: receipt.verifierId,
    audience: receipt.audience,
    purpose: receipt.purpose,
    issuedAt: '2026-07-30T08:58:00.000Z',
    expiresAt: '2026-07-30T09:01:00.000Z',
    state: 'consumed',
    consumedProofCommitment: receipt.proofCommitment,
    consumedPublicInputCommitment: receipt.publicInputCommitment,
    ledgerAuthenticityVerified: true,
  };
  return { receipt, expected, key, challenge };
}

test('accepts active key evidence and atomically consumed bound challenge', () => {
  const f = fixture();
  assert.equal(
    verifyVerifierLifecycle(f.receipt, f.expected, f.key, f.challenge).status,
    'accept',
  );
});

test('blocks a receipt produced outside the verification-key validity interval', () => {
  const f = fixture();
  f.key.validUntil = '2026-07-30T08:58:30.000Z';
  const result = verifyVerifierLifecycle(f.receipt, f.expected, f.key, f.challenge);
  assert.ok(result.errors.includes('receipt-after-key-validity'));
});

test('blocks revoked, suspended, retired, or unknown verification keys', () => {
  for (const status of ['revoked', 'suspended', 'retired', 'unknown'] as const) {
    const f = fixture();
    f.key.status = status;
    const result = verifyVerifierLifecycle(f.receipt, f.expected, f.key, f.challenge);
    assert.ok(result.errors.includes(`verification-key-not-active:${status}`));
  }
});

test('blocks replay when challenge is not atomically consumed for this proof', () => {
  const f = fixture();
  f.challenge.state = 'issued';
  f.challenge.consumedProofCommitment = 'sha256:other-proof';
  const result = verifyVerifierLifecycle(f.receipt, f.expected, f.key, f.challenge);
  assert.ok(result.errors.includes('challenge-not-consumed:issued'));
  assert.ok(
    result.errors.includes('lifecycle-binding-mismatch:challenge.consumedProofCommitment'),
  );
});

test('blocks challenge reuse across audience, purpose, or public input', () => {
  const f = fixture();
  f.challenge.audience = 'carrier:other';
  f.challenge.purpose = 'registration';
  f.challenge.consumedPublicInputCommitment = 'sha256:other-input';
  const result = verifyVerifierLifecycle(f.receipt, f.expected, f.key, f.challenge);
  for (const field of [
    'challenge.audience',
    'challenge.purpose',
    'challenge.consumedPublicInputCommitment',
  ]) {
    assert.ok(result.errors.includes(`lifecycle-binding-mismatch:${field}`));
  }
});

test('blocks unauthenticated lifecycle assertions and stale key status', () => {
  const f = fixture();
  f.key.statusAuthenticityVerified = false;
  f.key.statusCheckedAt = '2026-07-30T08:58:00.000Z';
  f.challenge.ledgerAuthenticityVerified = false;
  const result = verifyVerifierLifecycle(f.receipt, f.expected, f.key, f.challenge);
  assert.ok(result.errors.includes('key-status-authenticity-not-verified'));
  assert.ok(result.errors.includes('key-status-predates-verification'));
  assert.ok(result.errors.includes('challenge-ledger-authenticity-not-verified'));
});
