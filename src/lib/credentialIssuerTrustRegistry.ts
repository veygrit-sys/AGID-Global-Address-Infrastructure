import {
  ADDRESS_CREDENTIAL_VERSION,
  verifyAddressCredential,
  type AddressCredentialEnvelope,
  type AddressCredentialClaimKind,
  type AddressCredentialLayer,
  type AddressCredentialVerificationResult,
  type VerifyAddressCredentialOptions,
} from './addressCredential';
import type { AddressVerificationStatus } from './addressVerificationEngine';
import {
  buildPolkadotChainCommitment,
  type PolkadotChainCommitment,
} from './polkadotIntegration';
import { sha256Hex } from './sha256';

export const CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION = 'credential-issuer-trust-registry-v1';
export const CREDENTIAL_ISSUER_TRUST_REGISTRY_ALGORITHM = 'sha256-credential-issuer-trust-registry-v1';

export type CredentialIssuerTrustStatus =
  | 'trusted'
  | 'probationary'
  | 'suspended'
  | 'revoked';

export type CredentialIssuerTrustLevel =
  | 'root'
  | 'official'
  | 'verified-provider'
  | 'community';

export type CredentialIssuerTrustPolicy = {
  allowedStatuses?: CredentialIssuerTrustStatus[];
  minimumTrustScore?: number;
  requireValidWindow?: boolean;
  requireCredentialScopeMatch?: boolean;
};

export type CredentialIssuerTrustRecordInput = {
  issuerId: string;
  issuerDid: string;
  status: CredentialIssuerTrustStatus;
  trustLevel?: CredentialIssuerTrustLevel;
  credentialTypes?: string[];
  claimKinds?: AddressCredentialClaimKind[];
  layers?: AddressCredentialLayer[];
  countryCodes?: string[];
  regionCodes?: string[];
  schemaHashes?: string[];
  policyVersions?: string[];
  keyCommitments?: string[];
  publicAttestationRefs?: string[];
  trustScore?: number;
  validFrom?: Date | string;
  validUntil?: Date | string;
  sourceIds?: string[];
};

export type CredentialIssuerTrustRecord = {
  issuerId: string;
  issuerDid: string;
  status: CredentialIssuerTrustStatus;
  trustLevel: CredentialIssuerTrustLevel;
  credentialTypes: string[];
  claimKinds: AddressCredentialClaimKind[];
  layers: AddressCredentialLayer[];
  countryCodes: string[];
  regionCodes: string[];
  schemaHashes: string[];
  policyVersions: string[];
  keyCommitments: string[];
  publicAttestationRefs: string[];
  trustScore: number;
  validFrom: string | null;
  validUntil: string | null;
  sourceIds: string[];
};

export type CredentialIssuerTrustCounts = {
  total: number;
  trusted: number;
  probationary: number;
  suspended: number;
  revoked: number;
};

export type BuildCredentialIssuerTrustRegistrySnapshotInput = {
  registryId: string;
  registryVersion: string;
  issuers: CredentialIssuerTrustRecordInput[];
  trustPolicy?: CredentialIssuerTrustPolicy;
  now?: Date | string;
};

export type CredentialIssuerTrustRegistrySnapshot = {
  modelVersion: typeof CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION;
  algorithm: typeof CREDENTIAL_ISSUER_TRUST_REGISTRY_ALGORITHM;
  registryId: string;
  registryVersion: string;
  registryRoot: string;
  trustPolicy: Required<CredentialIssuerTrustPolicy>;
  trustPolicyHash: string;
  generatedAt: string;
  issuerCounts: CredentialIssuerTrustCounts;
  issuerRecords: CredentialIssuerTrustRecord[];
  sourceIds: string[];
  anchorable: boolean;
  chainCommitment: PolkadotChainCommitment;
  errors: string[];
  warnings: string[];
};

export type CredentialIssuerTrustEvaluationOptions = {
  now?: Date | string;
  credentialType?: string;
  requiredClaimKind?: AddressCredentialClaimKind;
  requiredLayer?: AddressCredentialLayer;
  requiredCountryCode?: string | null;
  requiredSchemaHash?: string | null;
  minimumTrustScore?: number;
  allowedIssuerStatuses?: CredentialIssuerTrustStatus[];
  trustedRegistryRoots?: readonly string[];
  maxRegistryAgeSeconds?: number;
};

export type CredentialIssuerTrustEvaluation = {
  modelVersion: typeof CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION;
  trusted: boolean;
  issuer: CredentialIssuerTrustRecord | null;
  registryRootTrusted: boolean;
  errors: string[];
  warnings: string[];
};

export type VerifyAddressCredentialWithIssuerTrustOptions = {
  issuerSecret?: string;
  issuerSecretsById?: Record<string, string>;
  now?: Date | string;
  expectedLayer?: AddressCredentialLayer;
  requiredClaimKind?: AddressCredentialClaimKind;
  minimumAssuranceLevel?: VerifyAddressCredentialOptions['minimumAssuranceLevel'];
  minimumCredentialScore?: number;
  allowedCredentialStatuses?: AddressVerificationStatus[];
  address?: VerifyAddressCredentialOptions['address'];
  privateSalt?: VerifyAddressCredentialOptions['privateSalt'];
  requiredCountryCode?: string | null;
  requiredSchemaHash?: string | null;
  minimumTrustScore?: number;
  allowedIssuerStatuses?: CredentialIssuerTrustStatus[];
  trustedRegistryRoots?: readonly string[];
  maxRegistryAgeSeconds?: number;
};

export type AddressCredentialWithIssuerTrustVerification = {
  modelVersion: typeof CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION;
  valid: boolean;
  credential: AddressCredentialVerificationResult;
  trust: CredentialIssuerTrustEvaluation;
  errors: string[];
  warnings: string[];
};

const DEFAULT_TRUST_POLICY: Required<CredentialIssuerTrustPolicy> = {
  allowedStatuses: ['trusted'],
  minimumTrustScore: 0.8,
  requireValidWindow: true,
  requireCredentialScopeMatch: true,
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value instanceof Date) return JSON.stringify(value.toISOString());
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
  return String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();
}

function normalizeRegistryId(value: unknown) {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9:_.-]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizeCountryCode(value: unknown) {
  return normalizeText(value).toUpperCase();
}

function normalizeIsoDate(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeIsoDateWithFallback(value: unknown, fallback = new Date().toISOString()) {
  return normalizeIsoDate(value) ?? fallback;
}

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(1, score));
}

function sortedUnique(values: readonly unknown[] | undefined, normalize = normalizeText) {
  return Array.from(new Set((values ?? []).map(normalize).filter(Boolean))).sort();
}

function sortedLayers(values: readonly unknown[] | undefined): AddressCredentialLayer[] {
  return sortedUnique(values)
    .map(value => value.toUpperCase())
    .filter((value): value is AddressCredentialLayer => value === 'AGID' || value === 'AOID');
}

function sortedClaimKinds(values: readonly unknown[] | undefined): AddressCredentialClaimKind[] {
  return sortedUnique(values)
    .map(value => value.toLowerCase())
    .filter((value): value is AddressCredentialClaimKind => (
      value === 'address-reference'
      || value === 'residence'
      || value === 'legal-ownership'
      || value === 'delivery-eligibility'
    ));
}

function normalizeTrustPolicy(policy: CredentialIssuerTrustPolicy | undefined): Required<CredentialIssuerTrustPolicy> {
  return {
    allowedStatuses: sortedUnique(policy?.allowedStatuses ?? DEFAULT_TRUST_POLICY.allowedStatuses) as CredentialIssuerTrustStatus[],
    minimumTrustScore: clampScore(policy?.minimumTrustScore ?? DEFAULT_TRUST_POLICY.minimumTrustScore),
    requireValidWindow: policy?.requireValidWindow ?? DEFAULT_TRUST_POLICY.requireValidWindow,
    requireCredentialScopeMatch: policy?.requireCredentialScopeMatch ?? DEFAULT_TRUST_POLICY.requireCredentialScopeMatch,
  };
}

function normalizeIssuerRecord(input: CredentialIssuerTrustRecordInput): CredentialIssuerTrustRecord {
  return {
    issuerId: normalizeText(input.issuerId),
    issuerDid: normalizeText(input.issuerDid),
    status: input.status,
    trustLevel: input.trustLevel ?? 'verified-provider',
    credentialTypes: sortedUnique(input.credentialTypes),
    claimKinds: sortedClaimKinds(input.claimKinds),
    layers: sortedLayers(input.layers),
    countryCodes: sortedUnique(input.countryCodes, normalizeCountryCode),
    regionCodes: sortedUnique(input.regionCodes),
    schemaHashes: sortedUnique(input.schemaHashes),
    policyVersions: sortedUnique(input.policyVersions),
    keyCommitments: sortedUnique(input.keyCommitments),
    publicAttestationRefs: sortedUnique(input.publicAttestationRefs),
    trustScore: clampScore(input.trustScore ?? 0),
    validFrom: normalizeIsoDate(input.validFrom),
    validUntil: normalizeIsoDate(input.validUntil),
    sourceIds: sortedUnique(input.sourceIds),
  };
}

function buildTrustPolicyHash(policy: Required<CredentialIssuerTrustPolicy>) {
  return sha256Hex(stableJson({
    algorithm: CREDENTIAL_ISSUER_TRUST_REGISTRY_ALGORITHM,
    kind: 'credential-issuer-trust-policy',
    policy,
  }));
}

function buildRegistryRoot(input: {
  registryId: string;
  registryVersion: string;
  trustPolicyHash: string;
  issuerRecords: readonly CredentialIssuerTrustRecord[];
}) {
  return sha256Hex(stableJson({
    algorithm: CREDENTIAL_ISSUER_TRUST_REGISTRY_ALGORITHM,
    kind: 'credential-issuer-trust-registry-root',
    registryId: input.registryId,
    registryVersion: input.registryVersion,
    trustPolicyHash: input.trustPolicyHash,
    issuerRecords: input.issuerRecords,
  }));
}

function countIssuers(issuerRecords: readonly CredentialIssuerTrustRecord[]): CredentialIssuerTrustCounts {
  return {
    total: issuerRecords.length,
    trusted: issuerRecords.filter(record => record.status === 'trusted').length,
    probationary: issuerRecords.filter(record => record.status === 'probationary').length,
    suspended: issuerRecords.filter(record => record.status === 'suspended').length,
    revoked: issuerRecords.filter(record => record.status === 'revoked').length,
  };
}

function collectRegistrySourceIds(issuerRecords: readonly CredentialIssuerTrustRecord[]) {
  return Array.from(new Set(issuerRecords.flatMap(record => record.sourceIds))).sort();
}

function isBefore(leftIso: string, rightIso: string) {
  return new Date(leftIso).getTime() < new Date(rightIso).getTime();
}

function isBeforeOrEqual(leftIso: string, rightIso: string) {
  return new Date(leftIso).getTime() <= new Date(rightIso).getTime();
}

function includesValue(values: readonly string[], value: string) {
  return values.length === 0 || values.includes(value);
}

function addRegistryWarningsAndErrors(
  records: readonly CredentialIssuerTrustRecord[],
  policy: Required<CredentialIssuerTrustPolicy>
) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const issuerIds = new Set<string>();

  records.forEach(record => {
    if (!record.issuerId) errors.push('issuer-id-missing');
    if (!record.issuerDid) errors.push('issuer-did-missing');
    if (record.issuerId && issuerIds.has(record.issuerId)) errors.push(`duplicate-issuer-id:${record.issuerId}`);
    issuerIds.add(record.issuerId);

    if (record.validFrom && record.validUntil && isBeforeOrEqual(record.validUntil, record.validFrom)) {
      errors.push(`issuer-validity-window-invalid:${record.issuerId}`);
    }
    if (record.status === 'trusted' && record.trustScore < policy.minimumTrustScore) {
      errors.push(`trusted-issuer-score-too-low:${record.issuerId}`);
    }
    if (record.status === 'trusted' && record.keyCommitments.length === 0) {
      warnings.push(`trusted-issuer-has-no-key-commitment:${record.issuerId}`);
    }
    if (record.sourceIds.length === 0) warnings.push(`issuer-has-no-source-ids:${record.issuerId}`);
  });

  return { errors, warnings };
}

export function buildCredentialIssuerTrustRegistrySnapshot(
  input: BuildCredentialIssuerTrustRegistrySnapshotInput
): CredentialIssuerTrustRegistrySnapshot {
  const generatedAt = normalizeIsoDateWithFallback(input.now);
  const registryId = normalizeRegistryId(input.registryId);
  const registryVersion = normalizeText(input.registryVersion);
  const trustPolicy = normalizeTrustPolicy(input.trustPolicy);
  const trustPolicyHash = buildTrustPolicyHash(trustPolicy);
  const issuerRecords = input.issuers
    .map(normalizeIssuerRecord)
    .sort((left, right) => `${left.issuerId}:${left.issuerDid}`.localeCompare(`${right.issuerId}:${right.issuerDid}`));
  const sourceIds = collectRegistrySourceIds(issuerRecords);
  const validation = addRegistryWarningsAndErrors(issuerRecords, trustPolicy);
  const errors = [...validation.errors];
  const warnings = [...validation.warnings];

  if (!registryId) errors.push('trust-registry-id-missing');
  if (!registryVersion) errors.push('trust-registry-version-missing');
  if (issuerRecords.length === 0) errors.push('trust-registry-has-no-issuers');

  const registryRoot = buildRegistryRoot({
    registryId,
    registryVersion,
    trustPolicyHash,
    issuerRecords,
  });
  const issuerCounts = countIssuers(issuerRecords);
  const publicPayload = {
    registryId,
    registryVersion,
    trustRegistryRoot: registryRoot,
    trustPolicyHash,
    issuerCounts,
    sourceIds,
    generatedAt,
  };
  const chainCommitment = buildPolkadotChainCommitment({
    stageId: 'credential-marketplace',
    entityType: 'credential-issuer',
    entityId: registryId || `issuer-trust-registry:${registryRoot.slice(0, 16)}`,
    publicPayload,
    salt: trustPolicyHash,
  });

  errors.push(...chainCommitment.forbiddenFields.map(field => `forbidden-chain-field:${field}`));

  return {
    modelVersion: CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION,
    algorithm: CREDENTIAL_ISSUER_TRUST_REGISTRY_ALGORITHM,
    registryId,
    registryVersion,
    registryRoot,
    trustPolicy,
    trustPolicyHash,
    generatedAt,
    issuerCounts,
    issuerRecords,
    sourceIds,
    anchorable: errors.length === 0 && chainCommitment.publishable,
    chainCommitment,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set([...warnings, ...chainCommitment.warnings])),
  };
}

export function evaluateCredentialIssuerTrust(
  credential: Pick<AddressCredentialEnvelope, 'claim' | 'signature'>,
  snapshot: CredentialIssuerTrustRegistrySnapshot,
  options: CredentialIssuerTrustEvaluationOptions = {}
): CredentialIssuerTrustEvaluation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nowIso = normalizeIsoDateWithFallback(options.now);
  const issuerId = normalizeText(credential?.signature?.issuerId);
  const issuer = snapshot.issuerRecords.find(record => record.issuerId === issuerId) ?? null;
  const registryRootTrusted = !options.trustedRegistryRoots
    || options.trustedRegistryRoots.includes(snapshot.registryRoot);

  if (!snapshot.anchorable) errors.push('trust-registry-not-anchorable');
  if (!registryRootTrusted) errors.push('trust-registry-root-not-trusted');
  if (options.maxRegistryAgeSeconds !== undefined) {
    const ageMs = new Date(nowIso).getTime() - new Date(snapshot.generatedAt).getTime();
    if (ageMs > Math.max(0, options.maxRegistryAgeSeconds) * 1000) {
      errors.push('trust-registry-stale');
    }
  }

  if (!issuerId) errors.push('credential-issuer-id-missing');
  if (!issuer) {
    errors.push('issuer-not-registered');
    return {
      modelVersion: CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION,
      trusted: false,
      issuer,
      registryRootTrusted,
      errors: Array.from(new Set(errors)),
      warnings,
    };
  }

  const allowedStatuses = options.allowedIssuerStatuses ?? snapshot.trustPolicy.allowedStatuses;
  if (!allowedStatuses.includes(issuer.status)) errors.push('issuer-not-trusted');

  const minimumTrustScore = options.minimumTrustScore ?? snapshot.trustPolicy.minimumTrustScore;
  if (issuer.trustScore < minimumTrustScore) errors.push('issuer-trust-score-too-low');

  if (snapshot.trustPolicy.requireValidWindow) {
    if (issuer.validFrom && isBefore(nowIso, issuer.validFrom)) errors.push('issuer-trust-not-yet-valid');
    if (issuer.validUntil && isBeforeOrEqual(issuer.validUntil, nowIso)) errors.push('issuer-trust-expired');
  }

  const credentialType = normalizeText(options.credentialType ?? credential.claim?.version ?? ADDRESS_CREDENTIAL_VERSION);
  if (snapshot.trustPolicy.requireCredentialScopeMatch && !includesValue(issuer.credentialTypes, credentialType)) {
    errors.push('issuer-credential-type-not-allowed');
  }

  const requiredClaimKind = options.requiredClaimKind ?? credential.claim?.claimKind;
  if (requiredClaimKind && !includesValue(issuer.claimKinds, requiredClaimKind)) {
    errors.push('issuer-claim-kind-not-allowed');
  }

  const requiredLayer = options.requiredLayer ?? credential.claim?.layer;
  if (requiredLayer && !includesValue(issuer.layers, requiredLayer)) errors.push('issuer-layer-not-allowed');

  const requiredCountryCode = normalizeCountryCode(options.requiredCountryCode ?? credential.claim?.countryCode);
  if (requiredCountryCode && !includesValue(issuer.countryCodes, requiredCountryCode)) {
    errors.push('issuer-country-not-allowed');
  }

  const requiredSchemaHash = normalizeText(options.requiredSchemaHash);
  if (requiredSchemaHash && !includesValue(issuer.schemaHashes, requiredSchemaHash)) {
    errors.push('issuer-schema-not-allowed');
  }

  const policyVersion = normalizeText(credential.claim?.policyVersion);
  if (policyVersion && !includesValue(issuer.policyVersions, policyVersion)) {
    errors.push('issuer-policy-version-not-allowed');
  }

  if (issuer.keyCommitments.length === 0) warnings.push('issuer-key-commitment-not-published');

  return {
    modelVersion: CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION,
    trusted: errors.length === 0,
    issuer,
    registryRootTrusted,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}

export async function verifyAddressCredentialWithIssuerTrust(
  credential: AddressCredentialEnvelope,
  snapshot: CredentialIssuerTrustRegistrySnapshot,
  options: VerifyAddressCredentialWithIssuerTrustOptions = {}
): Promise<AddressCredentialWithIssuerTrustVerification> {
  const issuerId = normalizeText(credential.signature?.issuerId);
  const issuerSecret = options.issuerSecret ?? options.issuerSecretsById?.[issuerId];
  const credentialResult = await verifyAddressCredential(credential, {
    issuerId,
    issuerSecret,
    now: options.now,
    expectedLayer: options.expectedLayer,
    requiredClaimKind: options.requiredClaimKind,
    minimumAssuranceLevel: options.minimumAssuranceLevel,
    minimumScore: options.minimumCredentialScore,
    allowedStatuses: options.allowedCredentialStatuses,
    address: options.address,
    privateSalt: options.privateSalt,
  });
  const trust = evaluateCredentialIssuerTrust(credential, snapshot, {
    now: options.now,
    credentialType: ADDRESS_CREDENTIAL_VERSION,
    requiredClaimKind: options.requiredClaimKind,
    requiredLayer: options.expectedLayer,
    requiredCountryCode: options.requiredCountryCode,
    requiredSchemaHash: options.requiredSchemaHash,
    minimumTrustScore: options.minimumTrustScore,
    allowedIssuerStatuses: options.allowedIssuerStatuses,
    trustedRegistryRoots: options.trustedRegistryRoots,
    maxRegistryAgeSeconds: options.maxRegistryAgeSeconds,
  });
  const errors = Array.from(new Set([...credentialResult.errors, ...trust.errors]));
  const warnings = Array.from(new Set([...credentialResult.warnings, ...trust.warnings]));

  return {
    modelVersion: CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION,
    valid: credentialResult.valid && trust.trusted,
    credential: credentialResult,
    trust,
    errors,
    warnings,
  };
}
