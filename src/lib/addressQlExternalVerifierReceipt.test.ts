import assert from 'node:assert/strict';
import test from 'node:test';

import { createSyntheticAddressQlProofInput } from './addressQlZkProofHooks';
import {
  ADDRESSQL_EXTERNAL_VERIFIER_RECEIPT_VERSION,
  verifyExternalVerifierReceipt,
  type ExternalVerifierReceiptExpectation,
  type ExternalVerifierReceiptV1,
} from './addressQlExternalVerifierReceipt';

function fixture(): {
  receipt: ExternalVerifierReceiptV1;
  expected: ExternalVerifierReceiptExpectation;
} {
  const proofInput = createSyntheticAddressQlProofInput();
  proofInput.proofArtifact.format = 'external_verifier_receipt';
  proofInput.proofArtifact.proofCommitment = 'sha256:synthetic-proof';
  proofInput.proofArtifact.publicInputCommitment = 'sha256:synthetic-public-inputs';
  proofInput.publicSignals.challengeHash = 'sha256:synthetic-live-challenge';
  proofInput.publicSignals.verifierPolicyHash = 'sha256:synthetic-policy';
  proofInput.publicSignals.proofExpiry = '2026-07-28T10:00:00.000Z';
  proofInput.verifierPolicy.audience = 'carrier:synthetic-cross-border';

  const expected: ExternalVerifierReceiptExpectation = {
    proofInput,
    verifierId: proofInput.verifierPolicy.verifierId,
    proofSystem: 'synthetic-zkvm',
    backendId: 'verifier:synthetic-v1',
    circuitId: 'circuit:address-deliverable-v1',
    verificationKeyDigest: 'sha256:synthetic-vk',
    bindingVersion: 'addressql-checkpoint-binding-v0.1',
    now: '2026-07-28T09:00:00.000Z',
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
      verifiedAt: '2026-07-28T08:59:00.000Z',
      receiptExpiry: '2026-07-28T09:05:00.000Z',
      result: 'verified',
      authenticityVerified: true,
      cryptographicVerificationPerformed: true,
    },
  };
}

test('accepts a fully bound synthetic external verifier receipt', () => {
  const { receipt, expected } = fixture();
  const result = verifyExternalVerifierReceipt(receipt, expected);
  assert.equal(result.status, 'accept');
  assert.equal(result.verified, true);
  assert.deepEqual(result.errors, []);
});

test('blocks receipt substitution across proof and public-input commitments', () => {
  const { receipt, expected } = fixture();
  receipt.proofCommitment = 'sha256:proof-from-other-statement';
  receipt.publicInputCommitment = 'sha256:inputs-from-other-statement';
  const result = verifyExternalVerifierReceipt(receipt, expected);
  assert.equal(result.status, 'block');
  assert.ok(result.errors.includes('receipt-binding-mismatch:proofCommitment'));
  assert.ok(result.errors.includes('receipt-binding-mismatch:publicInputCommitment'));
});

test('blocks policy, challenge, audience, and purpose replay', () => {
  const { receipt, expected } = fixture();
  receipt.verifierPolicyHash = 'sha256:other-policy';
  receipt.challengeHash = 'sha256:old-challenge';
  receipt.audience = 'merchant:other';
  receipt.purpose = 'hotel_checkin';
  const result = verifyExternalVerifierReceipt(receipt, expected);
  for (const field of ['verifierPolicyHash', 'challengeHash', 'audience', 'purpose']) {
    assert.ok(result.errors.includes(`receipt-binding-mismatch:${field}`));
  }
});

test('blocks circuit, verification-key, backend, and binding-version confusion', () => {
  const { receipt, expected } = fixture();
  receipt.circuitId = 'circuit:weak-test';
  receipt.verificationKeyDigest = 'sha256:other-vk';
  receipt.backendId = 'verifier:other';
  receipt.bindingVersion = 'addressql-checkpoint-binding-v0';
  const result = verifyExternalVerifierReceipt(receipt, expected);
  for (const field of ['circuitId', 'verificationKeyDigest', 'backendId', 'bindingVersion']) {
    assert.ok(result.errors.includes(`receipt-binding-mismatch:${field}`));
  }
});

test('blocks success-only receipt without authenticated cryptographic evidence', () => {
  const { receipt, expected } = fixture();
  receipt.authenticityVerified = false;
  receipt.cryptographicVerificationPerformed = false;
  const result = verifyExternalVerifierReceipt(receipt, expected);
  assert.ok(result.errors.includes('receipt-authenticity-not-verified'));
  assert.ok(result.errors.includes('cryptographic-verification-not-performed'));
});

test('blocks expired receipts and receipts that outlive the proof', () => {
  const { receipt, expected } = fixture();
  receipt.receiptExpiry = '2026-07-28T10:01:00.000Z';
  expected.now = '2026-07-28T10:02:00.000Z';
  const result = verifyExternalVerifierReceipt(receipt, expected);
  assert.ok(result.errors.includes('receipt-expired'));
  assert.ok(result.errors.includes('receipt-outlives-proof'));
});
