import type { AddressVerificationStatus } from './addressVerificationEngine';
import {
  createInMemoryEthereumRegistryOnlyStore,
  type EthereumIssuerRegistrationInput,
  type EthereumIssuerRegistryRecord,
  type EthereumNullifierMarkUsedInput,
  type EthereumNullifierRecord,
  type EthereumPaymentRecord,
  type EthereumPaymentRecordInput,
  type EthereumRegistryOnlyResult,
  type EthereumRegistryOnlySnapshot,
  type EthereumRegistryOnlyTxPlan,
  type EthereumRevocationAnchorInput,
  type EthereumRevocationAnchorRecord,
  type InMemoryEthereumRegistryOnlyStore,
} from './ethereumRegistryOnlyMode';
import type {
  PrivateAddressPredicateProofEnvelope,
  VerifyPrivateAddressPredicateRequirement,
} from './privateAddressPredicateProof';
import { sha256Hex } from './sha256';
import {
  normalizeZkOnlyVerificationSurface,
  verifyZkOnlyPrivateAddressPredicate,
  type ZkOnlyPrivateAddressPredicateVerificationResult,
  type ZkOnlyVerificationSurface,
} from './zkOnlyMode';

export const FULL_ZK_ETHEREUM_MODE_VERSION = 'full-zk-ethereum-mode-v1';

export type FullZkEthereumMode = 'full-zk-ethereum';
export type FullZkEthereumOperationKind =
  | 'zk-private-address-predicate'
  | 'register-issuer'
  | 'anchor-revocation-root'
  | 'mark-nullifier-used'
  | 'record-payment';
export type FullZkEthereumNullifierStrength = 'domain-separated-nullifier' | 'proof-replay-nullifier';

export type FullZkEthereumModeCapabilities = {
  modeVersion: typeof FULL_ZK_ETHEREUM_MODE_VERSION;
  mode: FullZkEthereumMode;
  displayName: 'Mode 4: Full ZK + Ethereum';
  zkEnabled: true;
  ethereumEnabled: true;
  publicLedgerEnabled: true;
  gasRequired: true;
  networkRequired: true;
  heaviestMode: true;
  supportedOperations: FullZkEthereumOperationKind[];
  supportedProofs: string[];
  storage: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawProofsStored: false;
    agidSecureCiphertextStored: false;
    publicLedgerWrites: 'commitments-roots-nullifiers-and-payment-status-only';
  };
  privacyModel: {
    publishOnly: string[];
    neverPublish: string[];
    knownRisks: string[];
    mitigations: string[];
  };
  recommendedUseCases: string[];
  limitations: string[];
};

export type FullZkEthereumTxPlan = EthereumRegistryOnlyTxPlan & {
  fullModeVersion: typeof FULL_ZK_ETHEREUM_MODE_VERSION;
  zkProofGateRequired: true;
};

export type FullZkEthereumPrivateAddressPredicateInput = {
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
  store?: InMemoryEthereumRegistryOnlyStore;
  networkId?: string;
  issuerRegistration?: EthereumIssuerRegistrationInput;
  revocationAnchor?: EthereumRevocationAnchorInput;
  nullifier?: EthereumNullifierMarkUsedInput;
  payment?: EthereumPaymentRecordInput;
};

export type FullZkEthereumPrivateAddressPredicateResult = {
  modeVersion: typeof FULL_ZK_ETHEREUM_MODE_VERSION;
  mode: FullZkEthereumMode;
  surface: ZkOnlyVerificationSurface;
  valid: boolean;
  proof: Omit<ZkOnlyPrivateAddressPredicateVerificationResult, 'modeVersion' | 'mode'>;
  ethereum: {
    registryMode: 'ethereum-registry-only';
    issuerRegistration: EthereumRegistryOnlyResult<EthereumIssuerRegistryRecord> | null;
    revocationAnchor: EthereumRegistryOnlyResult<EthereumRevocationAnchorRecord> | null;
    nullifier: EthereumRegistryOnlyResult<EthereumNullifierRecord> | null;
    payment: EthereumRegistryOnlyResult<EthereumPaymentRecord> | null;
    nullifierStrength: FullZkEthereumNullifierStrength;
    registryWritePlanned: boolean;
    publicLedgerWritten: boolean;
    txPlans: FullZkEthereumTxPlan[];
    totalEstimatedGasUnits: number;
  };
  privacy: {
    privacyPreserved: boolean;
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawProofsStored: false;
    agidSecureCiphertextStored: false;
    zkProofRequired: true;
    publicLedgerWritten: boolean;
    onlyPublicCommitmentsPublished: boolean;
  };
  auditability: {
    verifierLocalOnly: false;
    globalNullifierAudit: boolean;
    publicLedgerAudit: boolean;
    revocationFreshnessAudit: boolean;
    paymentAudit: boolean;
  };
  cost: {
    gasRequired: true;
    networkRequired: true;
    estimatedGasUnits: number;
    proofGenerationCost: 'external-or-client-side';
  };
  errors: string[];
  warnings: string[];
};

const DEFAULT_NETWORK_ID = 'ethereum-l2-generic';

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter(key => record[key] !== undefined)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > 0 ? text : null;
}

function networkIdFor(input: FullZkEthereumPrivateAddressPredicateInput) {
  return normalizeText(input.networkId) ?? DEFAULT_NETWORK_ID;
}

function wrapTxPlan(plan: EthereumRegistryOnlyTxPlan): FullZkEthereumTxPlan {
  return {
    ...plan,
    fullModeVersion: FULL_ZK_ETHEREUM_MODE_VERSION,
    zkProofGateRequired: true,
  };
}

function collectTxPlans(
  ...results: Array<EthereumRegistryOnlyResult<unknown> | null>
): FullZkEthereumTxPlan[] {
  return results
    .map(result => result?.txPlan)
    .filter((plan): plan is EthereumRegistryOnlyTxPlan => Boolean(plan))
    .map(wrapTxPlan);
}

function resultErrors(...results: Array<EthereumRegistryOnlyResult<unknown> | null>) {
  return results.flatMap(result => result?.errors ?? []);
}

function resultWarnings(...results: Array<EthereumRegistryOnlyResult<unknown> | null>) {
  return results.flatMap(result => result?.warnings ?? []);
}

function registryResultOk(result: EthereumRegistryOnlyResult<unknown> | null) {
  return !result
    || (result.status !== 'rejected' && result.status !== 'duplicate' && result.errors.length === 0);
}

function strippedProofResult(result: ZkOnlyPrivateAddressPredicateVerificationResult) {
  const { modeVersion: _modeVersion, mode: _mode, ...rest } = result;
  return rest;
}

export function deriveFullZkEthereumNullifierHash(
  envelope: PrivateAddressPredicateProofEnvelope,
  scope = envelope.claim?.scope ?? 'FULL-ZK-ETHEREUM',
) {
  return `zketh_${sha256Hex(stableJson({
    modeVersion: FULL_ZK_ETHEREUM_MODE_VERSION,
    kind: 'proof-replay-nullifier',
    scope,
    challengeHash: envelope.claim?.challengeHash,
    credentialBindingCommitment: envelope.claim?.credential?.credentialBindingCommitment,
    predicateSetCommitment: envelope.claim?.commitments?.predicateSetCommitment,
    signature: envelope.signature?.value,
  })).slice(0, 48)}`;
}

export function getFullZkEthereumModeCapabilities(): FullZkEthereumModeCapabilities {
  return {
    modeVersion: FULL_ZK_ETHEREUM_MODE_VERSION,
    mode: 'full-zk-ethereum',
    displayName: 'Mode 4: Full ZK + Ethereum',
    zkEnabled: true,
    ethereumEnabled: true,
    publicLedgerEnabled: true,
    gasRequired: true,
    networkRequired: true,
    heaviestMode: true,
    supportedOperations: [
      'zk-private-address-predicate',
      'register-issuer',
      'anchor-revocation-root',
      'mark-nullifier-used',
      'record-payment',
    ],
    supportedProofs: [
      'private-address-predicate-proof-v1',
      'address-credential-v1',
      'domain-separated-nullifier',
      'revocation-freshness-root',
      'payment-escrow-commitment',
    ],
    storage: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawProofsStored: false,
      agidSecureCiphertextStored: false,
      publicLedgerWrites: 'commitments-roots-nullifiers-and-payment-status-only',
    },
    privacyModel: {
      publishOnly: [
        'issuer registry records',
        'salted commitments',
        'revocation and freshness roots',
        'domain-separated nullifier hashes',
        'payment or escrow commitments',
        'ZK verifier public signals',
      ],
      neverPublish: [
        'raw address text',
        'raw AGID',
        'raw AOID',
        'AGID-S QR ciphertext',
        'latitude/longitude',
        'building, room, unit, postal code, recipient name, phone, email',
        'private proof witnesses and salts',
      ],
      knownRisks: [
        'highest latency and gas cost of all modes',
        'issuer, nullifier, and payment timing metadata can still leak',
        'ZK circuit bugs can invalidate privacy assumptions',
        'wallet reuse can link otherwise private operations',
      ],
      mitigations: [
        'use relayers or paymasters for sensitive flows',
        'batch anchors and nullifier writes where possible',
        'separate wallets, keys, and nullifier domains by purpose',
        'keep AGID/AOID/AGID-S material off-chain',
        'audit ZK circuits and verifier contracts before production',
      ],
    },
    recommendedUseCases: [
      'humanitarian aid eligibility without address disclosure',
      'subsidy and benefit distribution with public unused-state audit',
      'multi-organization delivery eligibility checks',
      'anti-fraud flows where central server trust is insufficient',
      'public payment or escrow release tied to private address predicates',
    ],
    limitations: [
      'not needed for ordinary local POS or low-risk delivery flows',
      'gas fees and chain congestion can slow urgent operations',
      'does not prove real-world truth unless issuer and credential workflows are trusted',
      'public ledgers are unsuitable for raw address or encrypted AGID-S payload storage',
    ],
  };
}

export function getFullZkEthereumRegistrySnapshot(
  store: InMemoryEthereumRegistryOnlyStore,
): EthereumRegistryOnlySnapshot {
  return store.getSnapshot();
}

export async function verifyFullZkEthereumPrivateAddressPredicate(
  input: FullZkEthereumPrivateAddressPredicateInput,
): Promise<FullZkEthereumPrivateAddressPredicateResult> {
  const surface = normalizeZkOnlyVerificationSurface(input.surface);
  const store = input.store ?? createInMemoryEthereumRegistryOnlyStore();
  const networkId = networkIdFor(input);
  const proof = await verifyZkOnlyPrivateAddressPredicate({
    envelope: input.envelope,
    surface,
    issuerId: input.issuerId,
    issuerSecret: input.issuerSecret,
    expectedScope: input.expectedScope,
    expectedChallenge: input.expectedChallenge,
    requiredPredicates: input.requiredPredicates,
    minimumScore: input.minimumScore,
    allowedStatuses: input.allowedStatuses,
    now: input.now,
  });

  let issuerRegistration: EthereumRegistryOnlyResult<EthereumIssuerRegistryRecord> | null = null;
  let revocationAnchor: EthereumRegistryOnlyResult<EthereumRevocationAnchorRecord> | null = null;
  let nullifier: EthereumRegistryOnlyResult<EthereumNullifierRecord> | null = null;
  let payment: EthereumRegistryOnlyResult<EthereumPaymentRecord> | null = null;
  const warnings = [...proof.warnings];

  const suppliedNullifierHash = normalizeText(input.nullifier?.nullifierHash);
  const nullifierStrength: FullZkEthereumNullifierStrength = suppliedNullifierHash
    ? 'domain-separated-nullifier'
    : 'proof-replay-nullifier';

  if (!proof.valid) {
    warnings.push('ethereum-registry-write-skipped-until-zk-proof-valid');
  } else {
    if (input.issuerRegistration) {
      issuerRegistration = store.registerIssuer({
        networkId,
        now: input.now,
        ...input.issuerRegistration,
      });
    } else {
      warnings.push('issuer-registry-write-not-requested');
    }

    if (input.revocationAnchor) {
      revocationAnchor = store.anchorRevocationRoot({
        networkId,
        now: input.now,
        issuerId: input.revocationAnchor.issuerId ?? input.envelope.claim.credential.issuerId,
        ...input.revocationAnchor,
      });
    } else {
      warnings.push('revocation-freshness-root-anchor-not-provided');
    }

    const nullifierScope = input.nullifier?.scope ?? input.envelope.claim.scope;
    nullifier = store.markNullifierUsed({
      networkId,
      now: input.now,
      scope: nullifierScope,
      nullifierHash: suppliedNullifierHash
        ?? deriveFullZkEthereumNullifierHash(
          input.envelope,
          nullifierScope,
        ),
      ...input.nullifier,
    });
    if (nullifierStrength === 'proof-replay-nullifier') {
      warnings.push('strong-domain-separated-nullifier-not-provided');
      warnings.push('derived-nullifier-prevents-proof-replay-but-not-all-reissuance');
    }

    if (input.payment) {
      payment = store.recordPayment({
        networkId,
        now: input.now,
        ...input.payment,
      });
    } else {
      warnings.push('payment-registry-write-not-requested');
    }
  }

  const registryResults = [issuerRegistration, revocationAnchor, nullifier, payment];
  const txPlans = collectTxPlans(...registryResults);
  const totalEstimatedGasUnits = txPlans.reduce((total, plan) => total + plan.estimatedGasUnits, 0);
  const publicLedgerWritten = txPlans.some(plan => Boolean(plan.observedTxHash));
  const registryErrors = resultErrors(...registryResults);
  const registryWarnings = resultWarnings(...registryResults);
  const errors = unique([...proof.errors, ...registryErrors]);
  const valid = proof.valid
    && Boolean(nullifier)
    && registryResults.every(registryResultOk);

  return {
    modeVersion: FULL_ZK_ETHEREUM_MODE_VERSION,
    mode: 'full-zk-ethereum',
    surface,
    valid,
    proof: strippedProofResult(proof),
    ethereum: {
      registryMode: 'ethereum-registry-only',
      issuerRegistration,
      revocationAnchor,
      nullifier,
      payment,
      nullifierStrength,
      registryWritePlanned: txPlans.length > 0,
      publicLedgerWritten,
      txPlans,
      totalEstimatedGasUnits,
    },
    privacy: {
      privacyPreserved: proof.privacy.privacyPreserved && registryErrors.length === 0,
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawProofsStored: false,
      agidSecureCiphertextStored: false,
      zkProofRequired: true,
      publicLedgerWritten,
      onlyPublicCommitmentsPublished: registryErrors.length === 0,
    },
    auditability: {
      verifierLocalOnly: false,
      globalNullifierAudit: Boolean(nullifier?.record),
      publicLedgerAudit: txPlans.length > 0,
      revocationFreshnessAudit: Boolean(revocationAnchor?.record),
      paymentAudit: Boolean(payment?.record),
    },
    cost: {
      gasRequired: true,
      networkRequired: true,
      estimatedGasUnits: totalEstimatedGasUnits,
      proofGenerationCost: 'external-or-client-side',
    },
    errors,
    warnings: unique([...warnings, ...registryWarnings]),
  };
}
