import type {
  ExternalVerifierReceiptExpectation,
  ExternalVerifierReceiptV1,
} from './addressQlExternalVerifierReceipt';

export const ADDRESSQL_VERIFIER_LIFECYCLE_VERSION =
  'addressql-verifier-lifecycle-v1';

export type VerifierKeyLifecycleEvidence = {
  lifecycleVersion: typeof ADDRESSQL_VERIFIER_LIFECYCLE_VERSION;
  verifierId: string;
  verificationKeyDigest: string;
  status: 'active' | 'suspended' | 'revoked' | 'retired' | 'unknown';
  validFrom: string;
  validUntil: string;
  statusCheckedAt: string;
  statusRootDigest: string;
  statusAuthenticityVerified: boolean;
};

export type ChallengeConsumptionEvidence = {
  lifecycleVersion: typeof ADDRESSQL_VERIFIER_LIFECYCLE_VERSION;
  challengeHash: string;
  verifierId: string;
  audience: string;
  purpose: string;
  issuedAt: string;
  expiresAt: string;
  state: 'issued' | 'consumed' | 'expired' | 'unknown';
  consumedProofCommitment?: string;
  consumedPublicInputCommitment?: string;
  ledgerAuthenticityVerified: boolean;
};

export type VerifierLifecycleDecision = {
  status: 'accept' | 'block';
  errors: string[];
  verified: boolean;
  nonClaims: string[];
};

function parseTime(value: string, field: string, errors: string[]): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) errors.push(`invalid-lifecycle-time:${field}`);
  return parsed;
}

function mismatch(errors: string[], field: string, actual: string, expected: string): void {
  if (actual !== expected) errors.push(`lifecycle-binding-mismatch:${field}`);
}

/**
 * Pure conformance gate for evidence produced by a trusted key-status adapter
 * and an atomic challenge-consumption ledger. It performs no network access.
 */
export function verifyVerifierLifecycle(
  receipt: ExternalVerifierReceiptV1,
  expected: ExternalVerifierReceiptExpectation,
  key: VerifierKeyLifecycleEvidence,
  challenge: ChallengeConsumptionEvidence,
): VerifierLifecycleDecision {
  const errors: string[] = [];

  if (
    key.lifecycleVersion !== ADDRESSQL_VERIFIER_LIFECYCLE_VERSION
    || challenge.lifecycleVersion !== ADDRESSQL_VERIFIER_LIFECYCLE_VERSION
  ) {
    errors.push('unsupported-lifecycle-version');
  }

  mismatch(errors, 'key.verifierId', key.verifierId, receipt.verifierId);
  mismatch(
    errors,
    'key.verificationKeyDigest',
    key.verificationKeyDigest,
    receipt.verificationKeyDigest,
  );
  mismatch(errors, 'challenge.challengeHash', challenge.challengeHash, receipt.challengeHash);
  mismatch(errors, 'challenge.verifierId', challenge.verifierId, receipt.verifierId);
  mismatch(errors, 'challenge.audience', challenge.audience, receipt.audience);
  mismatch(errors, 'challenge.purpose', challenge.purpose, receipt.purpose);

  if (key.status !== 'active') errors.push(`verification-key-not-active:${key.status}`);
  if (!key.statusAuthenticityVerified) errors.push('key-status-authenticity-not-verified');
  if (!key.statusRootDigest.trim()) errors.push('key-status-root-missing');
  if (challenge.state !== 'consumed') {
    errors.push(`challenge-not-consumed:${challenge.state}`);
  }
  if (!challenge.ledgerAuthenticityVerified) {
    errors.push('challenge-ledger-authenticity-not-verified');
  }
  mismatch(
    errors,
    'challenge.consumedProofCommitment',
    challenge.consumedProofCommitment ?? '',
    receipt.proofCommitment,
  );
  mismatch(
    errors,
    'challenge.consumedPublicInputCommitment',
    challenge.consumedPublicInputCommitment ?? '',
    receipt.publicInputCommitment,
  );

  const now = parseTime(expected.now, 'now', errors);
  const verifiedAt = parseTime(receipt.verifiedAt, 'receipt.verifiedAt', errors);
  const keyFrom = parseTime(key.validFrom, 'key.validFrom', errors);
  const keyUntil = parseTime(key.validUntil, 'key.validUntil', errors);
  const keyCheckedAt = parseTime(key.statusCheckedAt, 'key.statusCheckedAt', errors);
  const challengeIssued = parseTime(challenge.issuedAt, 'challenge.issuedAt', errors);
  const challengeExpires = parseTime(challenge.expiresAt, 'challenge.expiresAt', errors);

  if (Number.isFinite(keyFrom) && Number.isFinite(verifiedAt) && verifiedAt < keyFrom) {
    errors.push('receipt-before-key-validity');
  }
  if (Number.isFinite(keyUntil) && Number.isFinite(verifiedAt) && verifiedAt > keyUntil) {
    errors.push('receipt-after-key-validity');
  }
  if (Number.isFinite(keyCheckedAt) && Number.isFinite(verifiedAt) && keyCheckedAt < verifiedAt) {
    errors.push('key-status-predates-verification');
  }
  if (Number.isFinite(keyCheckedAt) && Number.isFinite(now) && keyCheckedAt > now) {
    errors.push('key-status-from-future');
  }
  if (
    Number.isFinite(challengeIssued)
    && Number.isFinite(verifiedAt)
    && verifiedAt < challengeIssued
  ) {
    errors.push('receipt-before-challenge');
  }
  if (
    Number.isFinite(challengeExpires)
    && Number.isFinite(verifiedAt)
    && verifiedAt > challengeExpires
  ) {
    errors.push('challenge-expired-before-verification');
  }

  return {
    status: errors.length === 0 ? 'accept' : 'block',
    errors,
    verified: errors.length === 0,
    nonClaims: [
      'This gate does not verify key-status signatures, status roots, or ledger consensus.',
      'Atomic challenge consumption and status authenticity remain adapter obligations.',
      'Lifecycle acceptance does not prove address or delivery correctness.',
    ],
  };
}
