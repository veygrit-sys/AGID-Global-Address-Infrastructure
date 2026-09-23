import type { AddressQlProofInput } from './addressQlZkProofHooks';

export const ADDRESSQL_EXTERNAL_VERIFIER_RECEIPT_VERSION =
  'addressql-external-verifier-receipt-v1';

export type ExternalVerifierReceiptV1 = {
  receiptVersion: typeof ADDRESSQL_EXTERNAL_VERIFIER_RECEIPT_VERSION;
  verifierId: string;
  proofSystem: string;
  backendId: string;
  circuitId: string;
  verificationKeyDigest: string;
  proofCommitment: string;
  publicInputCommitment: string;
  verifierPolicyHash: string;
  claimKind: AddressQlProofInput['claim']['kind'];
  purpose: AddressQlProofInput['claim']['purpose'];
  audience: string;
  challengeHash: string;
  bindingVersion: string;
  verifiedAt: string;
  receiptExpiry: string;
  result: 'verified' | 'rejected';
  /** Evidence supplied by an authenticated verifier adapter, not inferred here. */
  authenticityVerified: boolean;
  /** Evidence that the named proof backend actually returned success. */
  cryptographicVerificationPerformed: boolean;
};

export type ExternalVerifierReceiptExpectation = {
  proofInput: AddressQlProofInput;
  verifierId: string;
  proofSystem: string;
  backendId: string;
  circuitId: string;
  verificationKeyDigest: string;
  bindingVersion: string;
  now: string;
};

export type ExternalVerifierReceiptDecision = {
  status: 'accept' | 'block';
  errors: string[];
  verified: boolean;
  nonClaims: string[];
};

const NON_CLAIMS = [
  'This validator does not verify receipt signatures or zero-knowledge proofs.',
  'Adapter booleans are trusted inputs and require an authenticated production adapter.',
  'Receipt acceptance does not prove address resolution or delivery correctness.',
] as const;

function addMismatch(
  errors: string[],
  field: string,
  actual: string,
  expected: string,
): void {
  if (actual !== expected) errors.push(`receipt-binding-mismatch:${field}`);
}

function timestamp(value: string, field: string, errors: string[]): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) errors.push(`invalid-receipt-time:${field}`);
  return parsed;
}

/**
 * Checks fail-closed semantic binding for an externally authenticated receipt.
 * Signature/proof verification remain explicit adapter obligations.
 */
export function verifyExternalVerifierReceipt(
  receipt: ExternalVerifierReceiptV1,
  expected: ExternalVerifierReceiptExpectation,
): ExternalVerifierReceiptDecision {
  const errors: string[] = [];
  const input = expected.proofInput;

  if (receipt.receiptVersion !== ADDRESSQL_EXTERNAL_VERIFIER_RECEIPT_VERSION) {
    errors.push('unsupported-receipt-version');
  }
  addMismatch(errors, 'verifierId', receipt.verifierId, expected.verifierId);
  addMismatch(errors, 'proofSystem', receipt.proofSystem, expected.proofSystem);
  addMismatch(errors, 'backendId', receipt.backendId, expected.backendId);
  addMismatch(errors, 'circuitId', receipt.circuitId, expected.circuitId);
  addMismatch(
    errors,
    'verificationKeyDigest',
    receipt.verificationKeyDigest,
    expected.verificationKeyDigest,
  );
  addMismatch(
    errors,
    'proofCommitment',
    receipt.proofCommitment,
    input.proofArtifact.proofCommitment,
  );
  addMismatch(
    errors,
    'publicInputCommitment',
    receipt.publicInputCommitment,
    input.proofArtifact.publicInputCommitment,
  );
  addMismatch(
    errors,
    'verifierPolicyHash',
    receipt.verifierPolicyHash,
    input.publicSignals.verifierPolicyHash,
  );
  addMismatch(errors, 'claimKind', receipt.claimKind, input.claim.kind);
  addMismatch(errors, 'purpose', receipt.purpose, input.claim.purpose);
  addMismatch(errors, 'audience', receipt.audience, input.verifierPolicy.audience);
  addMismatch(errors, 'challengeHash', receipt.challengeHash, input.publicSignals.challengeHash);
  addMismatch(errors, 'bindingVersion', receipt.bindingVersion, expected.bindingVersion);

  if (receipt.result !== 'verified') errors.push('external-verifier-rejected');
  if (!receipt.authenticityVerified) errors.push('receipt-authenticity-not-verified');
  if (!receipt.cryptographicVerificationPerformed) {
    errors.push('cryptographic-verification-not-performed');
  }

  const now = timestamp(expected.now, 'now', errors);
  const verifiedAt = timestamp(receipt.verifiedAt, 'verifiedAt', errors);
  const receiptExpiry = timestamp(receipt.receiptExpiry, 'receiptExpiry', errors);
  const proofExpiry = timestamp(input.publicSignals.proofExpiry, 'proofExpiry', errors);
  if (Number.isFinite(verifiedAt) && Number.isFinite(now) && verifiedAt > now) {
    errors.push('receipt-from-future');
  }
  if (Number.isFinite(receiptExpiry) && Number.isFinite(now) && receiptExpiry < now) {
    errors.push('receipt-expired');
  }
  if (
    Number.isFinite(receiptExpiry)
    && Number.isFinite(proofExpiry)
    && receiptExpiry > proofExpiry
  ) {
    errors.push('receipt-outlives-proof');
  }

  return {
    status: errors.length === 0 ? 'accept' : 'block',
    errors,
    verified: errors.length === 0,
    nonClaims: [...NON_CLAIMS],
  };
}
