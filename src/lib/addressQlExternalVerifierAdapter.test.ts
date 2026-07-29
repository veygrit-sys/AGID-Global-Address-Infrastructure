import assert from 'node:assert/strict';
import test from 'node:test';

import { createSyntheticAddressQlProofInput } from './addressQlZkProofHooks';
import {
  ADDRESSQL_EXTERNAL_VERIFIER_RECEIPT_VERSION,
  type ExternalVerifierReceiptExpectation,
  type ExternalVerifierReceiptV1,
} from './addressQlExternalVerifierReceipt';
import { runAddressQlExternalVerifierAdapter } from './addressQlExternalVerifierAdapter';

function fixture(): {
  receipt: ExternalVerifierReceiptV1;
  expected: ExternalVerifierReceiptExpectation;
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
  return {
    expected,
    receipt: {
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
    },
  };
}

test('accepts only the meet of schema safety and a fully bound verified receipt', () => {
  const { receipt, expected } = fixture();
  const decision = runAddressQlExternalVerifierAdapter(receipt, expected);
  assert.equal(decision.status, 'accept');
  assert.equal(decision.verified, true);
  assert.deepEqual(decision.errors, []);
});

test('a valid receipt cannot upgrade an unsafe AddressQL input', () => {
  const { receipt, expected } = fixture();
  (expected.proofInput as unknown as Record<string, unknown>).rawAddressText =
    'synthetic material that must be rejected';
  const decision = runAddressQlExternalVerifierAdapter(receipt, expected);
  assert.equal(decision.status, 'block');
  assert.equal(decision.receiptDecision.verified, true);
  assert.ok(decision.errors.some(error => error.startsWith('schema:')));
});

test('a schema-safe hook cannot upgrade a substituted receipt', () => {
  const { receipt, expected } = fixture();
  receipt.publicInputCommitment = 'sha256:other-public-inputs';
  const decision = runAddressQlExternalVerifierAdapter(receipt, expected);
  assert.equal(decision.status, 'block');
  assert.equal(decision.schemaDecision.schemaAccepted, true);
  assert.ok(
    decision.errors.includes('receipt:receipt-binding-mismatch:publicInputCommitment'),
  );
});

test('success-only adapter flags cannot bypass authenticity and proof execution', () => {
  const { receipt, expected } = fixture();
  receipt.authenticityVerified = false;
  receipt.cryptographicVerificationPerformed = false;
  const decision = runAddressQlExternalVerifierAdapter(receipt, expected);
  assert.equal(decision.verified, false);
  assert.ok(decision.errors.includes('receipt:receipt-authenticity-not-verified'));
  assert.ok(decision.errors.includes('receipt:cryptographic-verification-not-performed'));
});
