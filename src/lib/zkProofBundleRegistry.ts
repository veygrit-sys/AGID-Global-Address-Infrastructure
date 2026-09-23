import { sha256Hex } from './sha256';
import {
  analyzeZkProofCompatibility,
  type ZkProofCompatibilityManifest,
  type ZkProofCompatibilityOptions,
  type ZkProofCompatibilityResult,
  type ZkProofDescriptor,
  type ZkProofNullifierUsage,
  type ZkProofValidityWindow,
} from './zkProofCompatibility';

export const ZK_PROOF_BUNDLE_REGISTRY_VERSION = 'zk-proof-bundle-registry-v1';

export type ZkProofBundleStatus = 'active' | 'revoked';
export type ZkProofBundleRegistrationStatus = 'registered' | 'already_registered' | 'rejected';
export type ZkProofBundleVerificationStatus = 'valid' | 'invalid' | 'missing';

export type ZkProofBundleRegistryOptions = {
  allowUnknownProofVersions?: boolean;
  allowDuplicateNullifiers?: boolean;
  allowSharedCommitments?: boolean;
  requireSameScope?: boolean;
  requireSameChallenge?: boolean;
  requireCommonValidityWindow?: boolean;
};

export type ZkProofBundleRegistrationInput = {
  proofs: readonly unknown[];
  scope?: string;
  audience?: string;
  operationId?: string;
  expectedChallengeHash?: string;
  expectedChallengeHashesByVersion?: Record<string, string>;
  now?: Date | string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ZkProofBundleRegistrationResult = {
  registryVersion: typeof ZK_PROOF_BUNDLE_REGISTRY_VERSION;
  status: ZkProofBundleRegistrationStatus;
  bundleId: string | null;
  record: ZkProofBundleRecord | null;
  compatibility: ZkProofCompatibilityResult;
  errors: string[];
  warnings: string[];
};

export type ZkProofBundleRecord = {
  registryVersion: typeof ZK_PROOF_BUNDLE_REGISTRY_VERSION;
  bundleId: string;
  bundleHash: string;
  status: ZkProofBundleStatus;
  proofCount: number;
  proofs: ZkProofDescriptor[];
  manifest: ZkProofCompatibilityManifest;
  commonValidityWindow: ZkProofValidityWindow;
  scope: string | null;
  audience: string | null;
  operationId: string | null;
  registeredAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
  nullifierHashes: ZkProofBundleNullifierHash[];
  commitmentHashes: ZkProofBundleCommitmentHash[];
  rawProofsStored: false;
  metadata: Record<string, string | number | boolean | null>;
  warnings: string[];
};

export type ZkProofBundleNullifierHash = {
  proofIndex: number;
  proofVersion: string | null;
  path: string;
  usage: ZkProofNullifierUsage;
  valueHash: string;
};

export type ZkProofBundleCommitmentHash = {
  proofIndex: number;
  proofVersion: string | null;
  path: string;
  valueHash: string;
};

export type ZkProofBundleVerificationOptions = {
  now?: Date | string;
};

export type ZkProofBundleVerificationResult = {
  registryVersion: typeof ZK_PROOF_BUNDLE_REGISTRY_VERSION;
  status: ZkProofBundleVerificationStatus;
  valid: boolean;
  bundleId: string;
  record: ZkProofBundleRecord | null;
  errors: string[];
  warnings: string[];
};

export type ZkProofBundleRevocationInput = {
  reason: string;
  revokedAt?: Date | string;
};

export type ZkProofBundleRegistryStats = {
  registryVersion: typeof ZK_PROOF_BUNDLE_REGISTRY_VERSION;
  totalBundles: number;
  activeBundles: number;
  revokedBundles: number;
  singleUseNullifiers: number;
  bucketNullifiers: number;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > 0 ? text : null;
}

function normalizeIsoDate(value: unknown, fallback = new Date().toISOString()) {
  if (value === undefined || value === null || value === '') return fallback;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function parseIsoDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isPublicProofValue(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 12;
}

function shouldCollectNullifier(key: string) {
  const lowerKey = key.toLowerCase();
  return lowerKey.includes('nullifier') && !lowerKey.includes('algorithm');
}

function shouldCollectCommitment(key: string) {
  const lowerKey = key.toLowerCase();
  return lowerKey.includes('commitment') && !lowerKey.includes('algorithm');
}

function nullifierUsageForPath(path: string): ZkProofNullifierUsage {
  const lowerPath = path.toLowerCase();
  if (lowerPath.includes('requestnullifier') || lowerPath.endsWith('.nullifier')) return 'single-use';
  if (lowerPath.includes('bucketnullifier')) return 'bucket';
  return 'other';
}

function visitObject(
  value: unknown,
  path: string,
  visit: (key: string, child: unknown, childPath: string) => void
) {
  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      const childPath = `${path}[${index}]`;
      visit(String(index), child, childPath);
      visitObject(child, childPath, visit);
    });
    return;
  }

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;
    visit(key, child, childPath);
    visitObject(child, childPath, visit);
  });
}

function getClaim(proof: unknown) {
  if (isRecord(proof) && isRecord(proof.claim)) return proof.claim;
  return proof;
}

function getProofVersion(proof: unknown) {
  const claim = getClaim(proof);
  if (!isRecord(claim) || typeof claim.version !== 'string') return null;
  const version = claim.version.trim();
  return version.length > 0 ? version : null;
}

function hashProofValue(domain: string, value: string) {
  return sha256Hex(`${ZK_PROOF_BUNDLE_REGISTRY_VERSION}:${domain}:${value}`);
}

function collectHashedProofValues(proofs: readonly unknown[]) {
  const nullifierHashes: ZkProofBundleNullifierHash[] = [];
  const commitmentHashes: ZkProofBundleCommitmentHash[] = [];

  proofs.forEach((proof, proofIndex) => {
    const proofVersion = getProofVersion(proof);
    visitObject(proof, 'proof', (key, child, childPath) => {
      if (!isPublicProofValue(child)) return;
      const value = child.trim();

      if (shouldCollectNullifier(key)) {
        nullifierHashes.push({
          proofIndex,
          proofVersion,
          path: childPath,
          usage: nullifierUsageForPath(childPath),
          valueHash: hashProofValue('nullifier', value),
        });
        return;
      }

      if (shouldCollectCommitment(key)) {
        commitmentHashes.push({
          proofIndex,
          proofVersion,
          path: childPath,
          valueHash: hashProofValue('commitment', value),
        });
      }
    });
  });

  return { nullifierHashes, commitmentHashes };
}

function uniqueValues<T>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function createCompatibilityOptions(
  input: ZkProofBundleRegistrationInput,
  registryOptions: ZkProofBundleRegistryOptions
): ZkProofCompatibilityOptions {
  return {
    expectedScope: input.scope,
    expectedChallengeHash: input.expectedChallengeHash,
    expectedChallengeHashesByVersion: input.expectedChallengeHashesByVersion,
    requireSameScope: registryOptions.requireSameScope ?? true,
    requireSameChallenge: registryOptions.requireSameChallenge ?? true,
    requireCommonValidityWindow: registryOptions.requireCommonValidityWindow ?? true,
    allowUnknownProofVersions: registryOptions.allowUnknownProofVersions,
    allowDuplicateNullifiers: registryOptions.allowDuplicateNullifiers,
    allowSharedCommitments: registryOptions.allowSharedCommitments,
    now: input.now,
  };
}

export function buildZkProofBundleId(input: {
  manifest: ZkProofCompatibilityManifest;
  scope: string | null;
  audience: string | null;
  operationId: string | null;
  nullifierHashes: readonly ZkProofBundleNullifierHash[];
  commitmentHashes: readonly ZkProofBundleCommitmentHash[];
}) {
  const bundleHash = sha256Hex(stableJson({
    registryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
    manifest: input.manifest,
    scope: input.scope,
    audience: input.audience,
    operationId: input.operationId,
    nullifierHashes: input.nullifierHashes,
    commitmentHashes: input.commitmentHashes,
  }));
  return {
    bundleHash,
    bundleId: `ZKB-${bundleHash.slice(0, 24).toUpperCase()}`,
  };
}

export class InMemoryZkProofBundleRegistry {
  private readonly options: ZkProofBundleRegistryOptions;
  private readonly recordsByBundleId = new Map<string, ZkProofBundleRecord>();
  private readonly singleUseNullifierHashes = new Set<string>();
  private readonly bucketNullifierHashes = new Set<string>();

  constructor(options: ZkProofBundleRegistryOptions = {}) {
    this.options = { ...options };
  }

  registerBundle(input: ZkProofBundleRegistrationInput): ZkProofBundleRegistrationResult {
    const compatibility = analyzeZkProofCompatibility(
      input.proofs,
      createCompatibilityOptions(input, this.options)
    );
    const hashedValues = collectHashedProofValues(input.proofs);
    const scope = normalizeText(input.scope);
    const audience = normalizeText(input.audience);
    const operationId = normalizeText(input.operationId);
    const { bundleHash, bundleId } = buildZkProofBundleId({
      manifest: compatibility.manifest,
      scope,
      audience,
      operationId,
      nullifierHashes: hashedValues.nullifierHashes,
      commitmentHashes: hashedValues.commitmentHashes,
    });
    const errors = [...compatibility.errors];

    if (this.recordsByBundleId.has(bundleId)) {
      return {
        registryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
        status: 'already_registered',
        bundleId,
        record: this.getBundle(bundleId),
        compatibility,
        errors,
        warnings: [...compatibility.warnings],
      };
    }

    if (!compatibility.compatible || !compatibility.privacySafe || !compatibility.collisionFree) {
      return this.rejectedResult(bundleId, compatibility, errors);
    }

    const reusedSingleUseNullifiers = hashedValues.nullifierHashes
      .filter(hash => hash.usage === 'single-use' || hash.usage === 'other')
      .filter(hash => this.singleUseNullifierHashes.has(hash.valueHash));

    if (reusedSingleUseNullifiers.length > 0) {
      errors.push('single-use-nullifier-reused');
      return this.rejectedResult(bundleId, compatibility, errors);
    }

    const record: ZkProofBundleRecord = {
      registryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
      bundleId,
      bundleHash,
      status: 'active',
      proofCount: compatibility.proofCount,
      proofs: clone(compatibility.proofs),
      manifest: clone(compatibility.manifest),
      commonValidityWindow: clone(compatibility.commonValidityWindow),
      scope,
      audience,
      operationId,
      registeredAt: normalizeIsoDate(input.now),
      revokedAt: null,
      revocationReason: null,
      nullifierHashes: clone(hashedValues.nullifierHashes),
      commitmentHashes: clone(hashedValues.commitmentHashes),
      rawProofsStored: false,
      metadata: clone(input.metadata ?? {}),
      warnings: [...compatibility.warnings],
    };

    this.recordsByBundleId.set(bundleId, record);
    hashedValues.nullifierHashes.forEach(hash => {
      if (hash.usage === 'bucket') {
        this.bucketNullifierHashes.add(hash.valueHash);
        return;
      }
      this.singleUseNullifierHashes.add(hash.valueHash);
    });

    return {
      registryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
      status: 'registered',
      bundleId,
      record: clone(record),
      compatibility,
      errors: [],
      warnings: [...compatibility.warnings],
    };
  }

  getBundle(bundleId: string | null | undefined): ZkProofBundleRecord | null {
    if (!bundleId) return null;
    const record = this.recordsByBundleId.get(bundleId);
    return record ? clone(record) : null;
  }

  verifyBundle(
    bundleId: string | null | undefined,
    options: ZkProofBundleVerificationOptions = {}
  ): ZkProofBundleVerificationResult {
    const normalizedBundleId = normalizeText(bundleId) ?? '';
    const record = this.recordsByBundleId.get(normalizedBundleId);
    if (!record) {
      return {
        registryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
        status: 'missing',
        valid: false,
        bundleId: normalizedBundleId,
        record: null,
        errors: ['bundle-not-found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const nowIso = normalizeIsoDate(options.now);
    const issuedAt = parseIsoDate(record.commonValidityWindow.issuedAt);
    const expiresAt = parseIsoDate(record.commonValidityWindow.expiresAt);

    if (record.status === 'revoked') errors.push('bundle-revoked');
    if (issuedAt && nowIso < issuedAt) errors.push('bundle-not-yet-valid');
    if (expiresAt && nowIso > expiresAt) errors.push('bundle-expired');

    return {
      registryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
      status: errors.length === 0 ? 'valid' : 'invalid',
      valid: errors.length === 0,
      bundleId: record.bundleId,
      record: clone(record),
      errors,
      warnings: clone(record.warnings),
    };
  }

  revokeBundle(bundleId: string | null | undefined, input: ZkProofBundleRevocationInput): boolean {
    if (!bundleId) return false;
    const record = this.recordsByBundleId.get(bundleId);
    if (!record) return false;

    record.status = 'revoked';
    record.revokedAt = normalizeIsoDate(input.revokedAt);
    record.revocationReason = normalizeText(input.reason) ?? 'unspecified';
    return true;
  }

  getStats(): ZkProofBundleRegistryStats {
    const records = Array.from(this.recordsByBundleId.values());
    return {
      registryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
      totalBundles: records.length,
      activeBundles: records.filter(record => record.status === 'active').length,
      revokedBundles: records.filter(record => record.status === 'revoked').length,
      singleUseNullifiers: this.singleUseNullifierHashes.size,
      bucketNullifiers: this.bucketNullifierHashes.size,
    };
  }

  private rejectedResult(
    bundleId: string,
    compatibility: ZkProofCompatibilityResult,
    errors: string[]
  ): ZkProofBundleRegistrationResult {
    return {
      registryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
      status: 'rejected',
      bundleId: null,
      record: null,
      compatibility,
      errors: uniqueValues(errors),
      warnings: [...compatibility.warnings],
    };
  }
}

export function createInMemoryZkProofBundleRegistry(
  options: ZkProofBundleRegistryOptions = {}
) {
  return new InMemoryZkProofBundleRegistry(options);
}
