import type { AddressVerificationStatus } from './addressVerificationEngine';
import {
  verifyPrivateAddressPredicateProof,
  type PrivateAddressPredicateKind,
  type PrivateAddressPredicateProofEnvelope,
  type VerifyPrivateAddressPredicateRequirement,
} from './privateAddressPredicateProof';
import {
  analyzeZkProofCompatibility,
  type ZkProofCompatibilityOptions,
  type ZkProofCompatibilityResult,
} from './zkProofCompatibility';

export const ZK_ONLY_MODE_VERSION = 'zk-only-mode-v1';

export type ZkOnlyVerificationSurface =
  | 'app'
  | 'pos-terminal'
  | 'humanitarian-server'
  | 'self-hosted-api';

export type ZkOnlyProofStrength =
  | 'cryptographic-zk'
  | 'zk-ready-simulated'
  | 'non-zk-compatible';

export type ZkOnlyModeCapabilities = {
  modeVersion: typeof ZK_ONLY_MODE_VERSION;
  mode: 'zk-only';
  displayName: 'Mode 2: ZK Only';
  zkEnabled: true;
  ethereumEnabled: false;
  publicLedgerEnabled: false;
  gasCost: 0;
  networkRequired: false;
  verificationSurfaces: ZkOnlyVerificationSurface[];
  supportedProofs: string[];
  storage: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawProofsStored: false;
    publicLedgerWritten: false;
  };
  strengths: string[];
  limitations: string[];
};

export type ZkOnlyLedgerStatus = {
  ethereumUsed: false;
  publicLedgerWritten: false;
  registryWrite: false;
  gasCost: 0;
};

export type ZkOnlyPrivateAddressPredicateStatementSummary = {
  scope: string;
  challengeHash: string;
  issuedAt: string;
  expiresAt: string | null;
  issuerId: string;
  credential: {
    issuerId: string;
    layer: 'AGID' | 'AOID';
    qualityBand: string;
    verificationStatus: AddressVerificationStatus;
    scoreFloor: number;
  };
  predicates: Array<{
    kind: PrivateAddressPredicateKind;
    target: string | null;
  }>;
};

export type ZkOnlyPrivateAddressPredicateVerificationInput = {
  envelope: PrivateAddressPredicateProofEnvelope;
  surface?: ZkOnlyVerificationSurface;
  issuerId?: string;
  issuerSecret?: string;
  expectedScope?: string;
  expectedChallenge?: string;
  requiredPredicates?: VerifyPrivateAddressPredicateRequirement[];
  minimumScore?: number;
  allowedStatuses?: AddressVerificationStatus[];
  now?: Date | string;
};

export type ZkOnlyPrivateAddressPredicateVerificationResult = {
  modeVersion: typeof ZK_ONLY_MODE_VERSION;
  mode: 'zk-only';
  surface: ZkOnlyVerificationSurface;
  valid: boolean;
  proofStrength: ZkOnlyProofStrength;
  statement: ZkOnlyPrivateAddressPredicateStatementSummary | null;
  ledger: ZkOnlyLedgerStatus;
  privacy: {
    privacyPreserved: boolean;
    rawAddressStored: false;
    rawAgidStored: false;
    rawProofsStored: false;
    publicLedgerWritten: false;
  };
  auditability: {
    verifierLocalOnly: true;
    globalNullifierAudit: false;
    publicLedgerAudit: false;
  };
  verification: {
    signatureValid: boolean | null;
    expired: boolean;
    predicatesSatisfied: boolean;
    proofCost: 'none';
  };
  errors: string[];
  warnings: string[];
};

export type ZkOnlyProofBundleVerificationInput = ZkProofCompatibilityOptions & {
  proofs: readonly unknown[];
  surface?: ZkOnlyVerificationSurface;
};

export type ZkOnlyProofBundleVerificationResult = {
  modeVersion: typeof ZK_ONLY_MODE_VERSION;
  mode: 'zk-only';
  surface: ZkOnlyVerificationSurface;
  valid: boolean;
  proofStrength: ZkOnlyProofStrength;
  ledger: ZkOnlyLedgerStatus;
  privacy: {
    privacySafe: boolean;
    rawProofsStored: false;
    publicLedgerWritten: false;
  };
  auditability: {
    verifierLocalOnly: true;
    globalNullifierAudit: false;
    publicLedgerAudit: false;
  };
  compatibility: ZkProofCompatibilityResult;
  errors: string[];
  warnings: string[];
};

const DEFAULT_SURFACE: ZkOnlyVerificationSurface = 'app';
const LEDGER_STATUS: ZkOnlyLedgerStatus = {
  ethereumUsed: false,
  publicLedgerWritten: false,
  registryWrite: false,
  gasCost: 0,
};

const SURFACES = new Set<ZkOnlyVerificationSurface>([
  'app',
  'pos-terminal',
  'humanitarian-server',
  'self-hosted-api',
]);

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function normalizeZkOnlyVerificationSurface(value: unknown): ZkOnlyVerificationSurface {
  return typeof value === 'string' && SURFACES.has(value as ZkOnlyVerificationSurface)
    ? value as ZkOnlyVerificationSurface
    : DEFAULT_SURFACE;
}

export function getZkOnlyModeCapabilities(): ZkOnlyModeCapabilities {
  return {
    modeVersion: ZK_ONLY_MODE_VERSION,
    mode: 'zk-only',
    displayName: 'Mode 2: ZK Only',
    zkEnabled: true,
    ethereumEnabled: false,
    publicLedgerEnabled: false,
    gasCost: 0,
    networkRequired: false,
    verificationSurfaces: ['app', 'pos-terminal', 'humanitarian-server', 'self-hosted-api'],
    supportedProofs: [
      'private-address-predicate-proof-v1',
      'address-credential-v1',
      'proof-bundle-compatibility-check',
    ],
    storage: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawProofsStored: false,
      publicLedgerWritten: false,
    },
    strengths: [
      'no-gas-cost',
      'offline-verifier-compatible',
      'address-and-agid-hidden-from-public-output',
      'app-pos-and-self-hosted-api-verification',
    ],
    limitations: [
      'no-public-ledger-audit',
      'nullifier-replay-prevention-is-local-to-the-verifier',
      'issuer-trust-and-revocation-must-be-configured-off-chain',
    ],
  };
}

function proofStrengthFromHint(zkReady: unknown, zkpGenerated: unknown): ZkOnlyProofStrength {
  if (zkReady !== true) return 'non-zk-compatible';
  return zkpGenerated === true ? 'cryptographic-zk' : 'zk-ready-simulated';
}

function proofStrengthFromEnvelope(envelope: PrivateAddressPredicateProofEnvelope): ZkOnlyProofStrength {
  return proofStrengthFromHint(
    envelope.claim?.proofHint?.zkReady,
    envelope.claim?.proofHint?.zkpGenerated,
  );
}

function proofStrengthFromCompatibility(compatibility: ZkProofCompatibilityResult): ZkOnlyProofStrength {
  if (compatibility.proofs.some(proof => !proof.zkReady)) return 'non-zk-compatible';
  return compatibility.proofs.every(proof => proof.zkpGenerated === true)
    ? 'cryptographic-zk'
    : 'zk-ready-simulated';
}

function targetForPredicate(predicate: PrivateAddressPredicateProofEnvelope['claim']['predicates'][number]) {
  if (predicate.kind === 'verified-address') return predicate.verificationStatus;
  if (predicate.kind === 'delivery-region') return predicate.regionId;
  if (predicate.kind === 'same-address-resident') return predicate.groupId;
  if (predicate.kind === 'country-resident') return predicate.countryCode;
  if (predicate.kind === 'city-resident') return predicate.cityKey;
  return null;
}

function statementSummary(
  envelope: PrivateAddressPredicateProofEnvelope
): ZkOnlyPrivateAddressPredicateStatementSummary | null {
  const claim = envelope.claim;
  if (!claim) return null;
  return {
    scope: claim.scope,
    challengeHash: claim.challengeHash,
    issuedAt: claim.issuedAt,
    expiresAt: claim.expiresAt ?? null,
    issuerId: envelope.signature.issuerId,
    credential: {
      issuerId: claim.credential.issuerId,
      layer: claim.credential.layer,
      qualityBand: claim.credential.qualityBand,
      verificationStatus: claim.credential.verificationStatus,
      scoreFloor: claim.credential.scoreFloor,
    },
    predicates: claim.predicates.map(predicate => ({
      kind: predicate.kind,
      target: targetForPredicate(predicate),
    })),
  };
}

function addProofStrengthWarning(
  proofStrength: ZkOnlyProofStrength,
  warnings: string[]
) {
  if (proofStrength === 'zk-ready-simulated') warnings.push('zk-proof-currently-simulated');
  if (proofStrength === 'non-zk-compatible') warnings.push('proof-not-zk-compatible');
  return unique(warnings);
}

export async function verifyZkOnlyPrivateAddressPredicate(
  input: ZkOnlyPrivateAddressPredicateVerificationInput
): Promise<ZkOnlyPrivateAddressPredicateVerificationResult> {
  const surface = normalizeZkOnlyVerificationSurface(input.surface);
  const verification = await verifyPrivateAddressPredicateProof(input.envelope, {
    issuerId: input.issuerId,
    issuerSecret: input.issuerSecret,
    expectedScope: input.expectedScope,
    expectedChallenge: input.expectedChallenge,
    requiredPredicates: input.requiredPredicates,
    minimumScore: input.minimumScore,
    allowedStatuses: input.allowedStatuses,
    now: input.now,
  });
  const proofStrength = proofStrengthFromEnvelope(input.envelope);
  const warnings = addProofStrengthWarning(proofStrength, verification.warnings);
  const errors = [...verification.errors];
  if (proofStrength === 'non-zk-compatible') errors.push('proof-not-zk-compatible');

  return {
    modeVersion: ZK_ONLY_MODE_VERSION,
    mode: 'zk-only',
    surface,
    valid: verification.valid && proofStrength !== 'non-zk-compatible',
    proofStrength,
    statement: statementSummary(input.envelope),
    ledger: LEDGER_STATUS,
    privacy: {
      privacyPreserved: verification.privacyPreserved,
      rawAddressStored: false,
      rawAgidStored: false,
      rawProofsStored: false,
      publicLedgerWritten: false,
    },
    auditability: {
      verifierLocalOnly: true,
      globalNullifierAudit: false,
      publicLedgerAudit: false,
    },
    verification: {
      signatureValid: verification.signatureValid,
      expired: verification.expired,
      predicatesSatisfied: verification.predicatesSatisfied,
      proofCost: verification.proofCost,
    },
    errors: unique(errors),
    warnings,
  };
}

export function verifyZkOnlyProofBundle(
  input: ZkOnlyProofBundleVerificationInput
): ZkOnlyProofBundleVerificationResult {
  const surface = normalizeZkOnlyVerificationSurface(input.surface);
  const compatibility = analyzeZkProofCompatibility(input.proofs, {
    expectedScope: input.expectedScope,
    expectedChallengeHash: input.expectedChallengeHash,
    expectedChallengeHashesByVersion: input.expectedChallengeHashesByVersion,
    requireSameScope: input.requireSameScope,
    requireSameChallenge: input.requireSameChallenge,
    requireCommonValidityWindow: input.requireCommonValidityWindow,
    allowUnknownProofVersions: input.allowUnknownProofVersions,
    allowDuplicateNullifiers: input.allowDuplicateNullifiers,
    allowSharedCommitments: input.allowSharedCommitments,
    now: input.now,
  });
  const proofStrength = proofStrengthFromCompatibility(compatibility);
  const errors = [...compatibility.errors];
  if (proofStrength === 'non-zk-compatible') errors.push('proof-not-zk-compatible');
  const warnings = addProofStrengthWarning(proofStrength, compatibility.warnings);

  return {
    modeVersion: ZK_ONLY_MODE_VERSION,
    mode: 'zk-only',
    surface,
    valid: compatibility.compatible
      && compatibility.privacySafe
      && compatibility.collisionFree
      && proofStrength !== 'non-zk-compatible',
    proofStrength,
    ledger: LEDGER_STATUS,
    privacy: {
      privacySafe: compatibility.privacySafe,
      rawProofsStored: false,
      publicLedgerWritten: false,
    },
    auditability: {
      verifierLocalOnly: true,
      globalNullifierAudit: false,
      publicLedgerAudit: false,
    },
    compatibility,
    errors: unique(errors),
    warnings,
  };
}
