import assert from 'node:assert/strict';
import test from 'node:test';

import { createSyntheticAddressQlProofInput } from './addressQlZkProofHooks';
import {
  ADDRESSQL_EXTERNAL_VERIFIER_RECEIPT_VERSION,
  type ExternalVerifierReceiptExpectation,
  type ExternalVerifierReceiptV1,
} from './addressQlExternalVerifierReceipt';
import { runAddressQlExternalVerifierAdapter } from './addressQlExternalVerifierAdapter';
import {
  ADDRESSQL_VERIFIER_LIFECYCLE_VERSION,
  type ChallengeConsumptionEvidence,
  type VerifierKeyLifecycleEvidence,
} from './addressQlVerifierLifecycle';

function fixture(): {
  receipt: ExternalVerifierReceiptV1;
  expected: ExternalVerifierReceiptExpectation;
  key: VerifierKeyLifecycleEvidence;
  challenge: ChallengeConsumptionEvidence;
} {
  const proofInput = createSyntheticAddressQlProofInput({
    claim: { kind: 'deliverable', purpose: 'delivery', statement: 'addressql:deliverable' },
    proofArtifact: {
      format: 'external_verifier_receipt',
      proofCommitment: 'sha256:synthetic-proof',
      publicInputCommitment: 'sha256:synthetic-public-inputs',
    },
    publicSignals: {
      ...createSyntheticAddressQlProofInput().publicSignals,
      challengeHash: 'sha256:synthetic-live-challenge',
      verifierPolicyHash: 'sha256:synthetic-policy',
      proofExpiry: '2026-07-29T10:00:00.000Z',
    },
    verifierPolicy: {
      ...createSyntheticAddressQlProofInput().verifierPolicy,
      audience: 'carrier:synthetic-cross-border',
    },
  });
  const expected: ExternalVerifierReceiptExpectation = {
    proofInput,
    verifierId: proofInput.verifierPolicy.verifierId,
    proofSystem: 'synthetic-zkvm',
    backendId: 'verifier:synthetic-v1',
    circuitId: 'circuit:address-deliverable-v1',
    verificationKeyDigest: 'sha256:synthetic-vk',
    bindingVersion: 'addressql-checkpoint-binding-v0.1',
    now: '2026-07-29T09:00:00.000Z',
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
      verifiedAt: '2026-07-29T08:59:00.000Z',
      receiptExpiry: '2026-07-29T09:05:00.000Z',
      result: 'verified',
      authenticityVerified: true,
      cryptographicVerificationPerformed: true,
    };
  return {
    expected,
    receipt,
    key: {
      lifecycleVersion: ADDRESSQL_VERIFIER_LIFECYCLE_VERSION,
      verifierId: receipt.verifierId,
      verificationKeyDigest: receipt.verificationKeyDigest,
      status: 'active',
      validFrom: '2026-07-01T00:00:00.000Z',
      validUntil: '2026-08-01T00:00:00.000Z',
      statusCheckedAt: expected.now,
      statusRootDigest: 'sha256:synthetic-key-status-root',
      statusAuthenticityVerified: true,
    },
    challenge: {
      lifecycleVersion: ADDRESSQL_VERIFIER_LIFECYCLE_VERSION,
      challengeHash: receipt.challengeHash,
      verifierId: receipt.verifierId,
      audience: receipt.audience,
      purpose: receipt.purpose,
      issuedAt: '2026-07-29T08:58:00.000Z',
      expiresAt: '2026-07-29T09:01:00.000Z',
      state: 'consumed',
      consumedProofCommitment: receipt.proofCommitment,
      consumedPublicInputCommitment: receipt.publicInputCommitment,
      ledgerAuthenticityVerified: true,
    },
  };
}

test('accepts only the meet of schema safety and a fully bound verified receipt', () => {
  const { receipt, expected, key, challenge } = fixture();
  const decision = runAddressQlExternalVerifierAdapter(receipt, expected, key, challenge);
  assert.equal(decision.status, 'accept');
  assert.equal(decision.verified, true);
  assert.deepEqual(decision.errors, []);
});

test('a valid receipt cannot upgrade an unsafe AddressQL input', () => {
  const { receipt, expected, key, challenge } = fixture();
  (expected.proofInput as unknown as Record<string, unknown>).rawAddressText =
    'synthetic material that must be rejected';
  const decision = runAddressQlExternalVerifierAdapter(receipt, expected, key, challenge);
  assert.equal(decision.status, 'block');
  assert.equal(decision.receiptDecision.verified, true);
  assert.ok(decision.errors.some(error => error.startsWith('schema:')));
});

test('a schema-safe hook cannot upgrade a substituted receipt', () => {
  const { receipt, expected, key, challenge } = fixture();
  receipt.publicInputCommitment = 'sha256:other-public-inputs';
  const decision = runAddressQlExternalVerifierAdapter(receipt, expected, key, challenge);
  assert.equal(decision.status, 'block');
  assert.equal(decision.schemaDecision.schemaAccepted, true);
  assert.ok(
    decision.errors.includes('receipt:receipt-binding-mismatch:publicInputCommitment'),
  );
});

test('success-only adapter flags cannot bypass authenticity and proof execution', () => {
  const { receipt, expected, key, challenge } = fixture();
  receipt.authenticityVerified = false;
  receipt.cryptographicVerificationPerformed = false;
  const decision = runAddressQlExternalVerifierAdapter(receipt, expected, key, challenge);
  assert.equal(decision.verified, false);
  assert.ok(decision.errors.includes('receipt:receipt-authenticity-not-verified'));
  assert.ok(decision.errors.includes('receipt:cryptographic-verification-not-performed'));
});

test('a valid receipt cannot upgrade revoked-key or unconsumed-challenge evidence', () => {
  const { receipt, expected, key, challenge } = fixture();
  key.status = 'revoked';
  challenge.state = 'issued';
  const decision = runAddressQlExternalVerifierAdapter(
    receipt,
    expected,
    key,
    challenge,
  );
  assert.equal(decision.receiptDecision.verified, true);
  assert.equal(decision.status, 'block');
  assert.ok(
    decision.errors.includes('lifecycle:verification-key-not-active:revoked'),
  );
  assert.ok(decision.errors.includes('lifecycle:challenge-not-consumed:issued'));
});

test('lifecycle evidence cannot upgrade an unsafe schema or substituted receipt', () => {
  const { receipt, expected, key, challenge } = fixture();
  receipt.publicInputCommitment = 'sha256:substituted';
  const decision = runAddressQlExternalVerifierAdapter(
    receipt,
    expected,
    key,
    challenge,
  );
  assert.equal(decision.lifecycleDecision.verified, false);
  assert.equal(decision.status, 'block');
  assert.ok(
    decision.errors.includes('receipt:receipt-binding-mismatch:publicInputCommitment'),
  );
});
