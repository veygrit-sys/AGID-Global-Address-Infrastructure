import {
  buildAddressCredentialRevocationRootCommitment,
  type AddressCredentialFreshnessProofEnvelope,
  type AddressCredentialRevocationRegistrySnapshot,
} from './addressCredentialFreshnessProof';
import {
  buildPolkadotChainCommitment,
  type PolkadotChainCommitment,
} from './polkadotIntegration';
import { sha256Hex } from './sha256';

export const REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION = 'agid-revocation-freshness-root-anchor-v1';
export const REVOCATION_FRESHNESS_ROOT_ANCHOR_ALGORITHM = 'sha256-revocation-freshness-root-anchor-v1';

export type RevocationFreshnessPolicy = {
  maxFreshnessAgeSeconds?: number;
  statusListSourcePolicyHash?: string;
};

export type BuildRevocationFreshnessRootAnchorInput = {
  registry: AddressCredentialRevocationRegistrySnapshot;
  issuerDid: string;
  credentialType: string;
  schemaHash: string;
  freshnessPolicy?: RevocationFreshnessPolicy;
  now?: Date | string;
};

export type RevocationHandleCounts = {
  credential: number;
  subject: number;
  addressCommitment: number;
  issuerScoped: number;
};

export type RevocationFreshnessRootAnchor = {
  modelVersion: typeof REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION;
  algorithm: typeof REVOCATION_FRESHNESS_ROOT_ANCHOR_ALGORITHM;
  anchorId: string;
  registryId: string;
  registryVersion: string;
  issuerDid: string;
  credentialType: string;
  schemaHash: string;
  revocationRoot: string;
  freshnessRoot: string;
  freshnessPolicyHash: string;
  checkedAt: string;
  freshUntil: string;
  sourceIds: string[];
  revocationHandleCounts: RevocationHandleCounts;
  stale: boolean;
  anchorable: boolean;
  chainCommitment: PolkadotChainCommitment;
  errors: string[];
  warnings: string[];
};

export type VerifyFreshnessProofRootAnchorOptions = {
  now?: Date | string;
};

export type FreshnessProofRootAnchorVerification = {
  modelVersion: typeof REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION;
  valid: boolean;
  rootMatched: boolean;
  stale: boolean;
  errors: string[];
  warnings: string[];
};

const DEFAULT_MAX_FRESHNESS_AGE_SECONDS = 300;

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

function toIsoDate(value: Date | string | undefined, fallback: string) {
  if (value === undefined || value === null || value === '') return fallback;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function addSeconds(isoDate: string, seconds: number) {
  return new Date(new Date(isoDate).getTime() + seconds * 1000).toISOString();
}

function sortedSourceIds(values?: string[]) {
  return Array.from(new Set((values ?? []).map(normalizeText).filter(Boolean))).sort();
}

function countIterable(values?: Iterable<string>) {
  return Array.from(values ?? []).filter(value => normalizeText(value).length > 0).length;
}

function countRevocationHandles(registry: AddressCredentialRevocationRegistrySnapshot): RevocationHandleCounts {
  return {
    credential: countIterable(registry.revokedCredentialHashes),
    subject: countIterable(registry.revokedSubjectHashes),
    addressCommitment: countIterable(registry.revokedAddressCommitmentHashes),
    issuerScoped: countIterable(registry.revokedIssuerScopedHashes),
  };
}

function buildPolicyHash(policy: Required<RevocationFreshnessPolicy>) {
  return sha256Hex(stableJson({
    algorithm: REVOCATION_FRESHNESS_ROOT_ANCHOR_ALGORITHM,
    kind: 'freshness-policy',
    policy,
  }));
}

function buildFreshnessRoot(input: {
  registryId: string;
  registryVersion: string;
  issuerDid: string;
  credentialType: string;
  schemaHash: string;
  revocationRoot: string;
  checkedAt: string;
  freshUntil: string;
  sourceIds: string[];
  revocationHandleCounts: RevocationHandleCounts;
  freshnessPolicyHash: string;
}) {
  return sha256Hex(stableJson({
    algorithm: REVOCATION_FRESHNESS_ROOT_ANCHOR_ALGORITHM,
    kind: 'freshness-root',
    ...input,
  }));
}

function isIsoBeforeOrEqual(left: string, right: string) {
  return new Date(left).getTime() <= new Date(right).getTime();
}

function isIsoBefore(left: string, right: string) {
  return new Date(left).getTime() < new Date(right).getTime();
}

export async function buildRevocationFreshnessRootAnchor(
  input: BuildRevocationFreshnessRootAnchorInput
): Promise<RevocationFreshnessRootAnchor> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const nowIso = toIsoDate(input.now, new Date().toISOString());
  const registryId = normalizeRegistryId(input.registry.id);
  const registryVersion = normalizeText(input.registry.version);
  const issuerDid = normalizeText(input.issuerDid);
  const credentialType = normalizeText(input.credentialType);
  const schemaHash = normalizeText(input.schemaHash);
  const maxFreshnessAgeSeconds = Math.max(
    1,
    Math.floor(input.freshnessPolicy?.maxFreshnessAgeSeconds ?? DEFAULT_MAX_FRESHNESS_AGE_SECONDS)
  );
  const freshnessPolicy: Required<RevocationFreshnessPolicy> = {
    maxFreshnessAgeSeconds,
    statusListSourcePolicyHash: normalizeText(input.freshnessPolicy?.statusListSourcePolicyHash) || 'default-status-list-source-policy',
  };

  if (!registryId) errors.push('revocation-registry-id-missing');
  if (!registryVersion) errors.push('revocation-registry-version-missing');
  if (!issuerDid) errors.push('issuer-did-missing');
  if (!credentialType) errors.push('credential-type-missing');
  if (!schemaHash) errors.push('schema-hash-missing');

  const checkedAt = toIsoDate(input.registry.checkedAt, nowIso);
  const freshUntil = toIsoDate(input.registry.freshUntil, addSeconds(checkedAt, maxFreshnessAgeSeconds));
  if (!isIsoBefore(checkedAt, freshUntil)) errors.push('freshness-window-invalid');

  const stale = isIsoBeforeOrEqual(freshUntil, nowIso);
  if (stale) errors.push('freshness-root-stale');

  const sourceIds = sortedSourceIds(input.registry.sourceIds);
  if (sourceIds.length === 0) warnings.push('freshness-root-has-no-source-ids');

  const revocationRoot = await buildAddressCredentialRevocationRootCommitment(input.registry);
  const revocationHandleCounts = countRevocationHandles(input.registry);
  const freshnessPolicyHash = buildPolicyHash(freshnessPolicy);
  const freshnessRoot = buildFreshnessRoot({
    registryId,
    registryVersion,
    issuerDid,
    credentialType,
    schemaHash,
    revocationRoot,
    checkedAt,
    freshUntil,
    sourceIds,
    revocationHandleCounts,
    freshnessPolicyHash,
  });
  const anchorId = `RFA-${freshnessRoot.slice(0, 24).toUpperCase()}`;
  const publicPayload = {
    credentialType,
    issuerDid,
    schemaHash,
    revocationRoot,
    freshnessRoot,
    freshnessPolicyHash,
    registryId,
    registryVersion,
    checkedAt,
    freshUntil,
    sourceIds,
    revocationHandleCounts,
  };
  const chainCommitment = buildPolkadotChainCommitment({
    stageId: 'address-credential',
    entityType: 'credential',
    entityId: anchorId,
    publicPayload,
    salt: freshnessPolicyHash,
  });

  errors.push(...chainCommitment.forbiddenFields.map(field => `forbidden-chain-field:${field}`));

  return {
    modelVersion: REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION,
    algorithm: REVOCATION_FRESHNESS_ROOT_ANCHOR_ALGORITHM,
    anchorId,
    registryId,
    registryVersion,
    issuerDid,
    credentialType,
    schemaHash,
    revocationRoot,
    freshnessRoot,
    freshnessPolicyHash,
    checkedAt,
    freshUntil,
    sourceIds,
    revocationHandleCounts,
    stale,
    anchorable: errors.length === 0 && chainCommitment.publishable,
    chainCommitment,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set([...warnings, ...chainCommitment.warnings])),
  };
}

export function verifyFreshnessProofRootAnchor(
  envelope: Pick<AddressCredentialFreshnessProofEnvelope, 'claim' | 'signature'>,
  anchor: RevocationFreshnessRootAnchor,
  options: VerifyFreshnessProofRootAnchorOptions = {}
): FreshnessProofRootAnchorVerification {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nowIso = toIsoDate(options.now, new Date().toISOString());
  const claim = envelope?.claim;
  const revocation = claim?.revocation;

  if (!claim || !revocation) {
    return {
      modelVersion: REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION,
      valid: false,
      rootMatched: false,
      stale: true,
      errors: ['malformed-freshness-proof'],
      warnings,
    };
  }

  const proofRegistryId = normalizeRegistryId(revocation.registryId);
  const proofRegistryVersion = normalizeText(revocation.registryVersion);
  if (proofRegistryId !== anchor.registryId) errors.push('revocation-registry-id-mismatch');
  if (proofRegistryVersion !== anchor.registryVersion) errors.push('revocation-registry-version-mismatch');

  const rootMatched = revocation.listRootCommitment === anchor.revocationRoot;
  if (!rootMatched) errors.push('revocation-root-mismatch');

  const proofCheckedAt = toIsoDate(revocation.checkedAt, '');
  const proofFreshUntil = toIsoDate(revocation.freshUntil, '');
  if (proofCheckedAt && isIsoBefore(proofCheckedAt, anchor.checkedAt)) {
    errors.push('freshness-proof-before-anchor-window');
  }
  if (proofFreshUntil && isIsoBefore(anchor.freshUntil, proofFreshUntil)) {
    errors.push('freshness-proof-exceeds-anchor-window');
  }

  const proofStale = Boolean(proofFreshUntil && isIsoBeforeOrEqual(proofFreshUntil, nowIso));
  const anchorStale = anchor.stale || isIsoBeforeOrEqual(anchor.freshUntil, nowIso);
  if (proofStale) errors.push('freshness-proof-stale');
  if (anchorStale) errors.push('freshness-root-stale');
  if (!anchor.anchorable) errors.push('freshness-root-not-anchorable');

  return {
    modelVersion: REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION,
    valid: errors.length === 0,
    rootMatched,
    stale: proofStale || anchorStale,
    errors: Array.from(new Set(errors)),
    warnings,
  };
}
