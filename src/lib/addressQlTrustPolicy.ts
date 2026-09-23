import {
  createHash,
  createPublicKey,
  type KeyObject,
} from 'node:crypto';
import {
  existsSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

export const ADDRESSQL_TRUST_POLICY_VERSION = 'addressql-trust-store-v2';
export const ADDRESSQL_LEGACY_TRUST_STORE_VERSION = 'addressql-trust-store-v1';

const MAX_TRUST_STORE_BYTES = 256 * 1024;
const KEY_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;

export type AddressQlReviewerKeyStatus = 'active' | 'revoked' | 'rotated';

export type AddressQlReviewerKeyRecord = {
  reviewerId: string;
  publicKey: string;
  status: AddressQlReviewerKeyStatus;
  validFrom: string;
  validUntil: string;
  addedAt: string;
  replacesKeyId?: string;
  replacedByKeyId?: string;
  rotatedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
};

export type AddressQlTrustPolicy = {
  version: typeof ADDRESSQL_TRUST_POLICY_VERSION;
  policy: {
    minimumSignatures: number;
  };
  keys: Record<string, AddressQlReviewerKeyRecord>;
};

export type LoadedAddressQlTrustPolicy = {
  version:
    | typeof ADDRESSQL_TRUST_POLICY_VERSION
    | typeof ADDRESSQL_LEGACY_TRUST_STORE_VERSION;
  minimumSignatures: number;
  records: ReadonlyMap<string, AddressQlReviewerKeyRecord>;
  usableKeys: ReadonlyMap<string, KeyObject>;
  legacy: boolean;
};

function exactTimestamp(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be an exact UTC timestamp`);
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} is invalid`);
  return timestamp;
}

function readBoundedJson(path: string) {
  const absolutePath = resolve(path);
  const stats = statSync(absolutePath);
  if (!stats.isFile() || stats.size <= 0 || stats.size > MAX_TRUST_STORE_BYTES) {
    throw new Error('trust store must be a bounded regular file');
  }
  const value = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('trust store must be a JSON object');
  }
  return value as Record<string, unknown>;
}

function parsePublicKey(keyId: string, pem: string) {
  if (!KEY_ID.test(keyId)) throw new Error(`trust store key id ${keyId} is invalid`);
  if (/PRIVATE KEY/.test(pem)) throw new Error('trust store must not contain private keys');
  const key = createPublicKey(pem);
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new Error(`trust store key ${keyId} must be Ed25519`);
  }
  return key;
}

function canonicalPublicKey(key: KeyObject) {
  return key.export({
    type: 'spki',
    format: 'pem',
  }).toString();
}

function keyFingerprint(key: KeyObject) {
  return `sha256:${createHash('sha256')
    .update(key.export({ type: 'spki', format: 'der' }))
    .digest('hex')}`;
}

function parseV2Record(
  keyId: string,
  value: unknown,
  now: number,
) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`trust policy key ${keyId} must be an object`);
  }
  const record = value as AddressQlReviewerKeyRecord;
  if (
    typeof record.reviewerId !== 'string'
    || !KEY_ID.test(record.reviewerId)
    || typeof record.publicKey !== 'string'
    || !['active', 'revoked', 'rotated'].includes(record.status)
  ) {
    throw new Error(`trust policy key ${keyId} has invalid key material or status`);
  }
  const validFrom = exactTimestamp(record.validFrom, `${keyId}.validFrom`);
  const validUntil = exactTimestamp(record.validUntil, `${keyId}.validUntil`);
  const addedAt = exactTimestamp(record.addedAt, `${keyId}.addedAt`);
  if (validUntil <= validFrom) {
    throw new Error(`trust policy key ${keyId} validity window is invalid`);
  }
  if (addedAt > validUntil) {
    throw new Error(`trust policy key ${keyId} was added after expiry`);
  }
  if (record.status === 'revoked') {
    if (!record.revokedAt || !record.revocationReason?.trim()) {
      throw new Error(`revoked trust policy key ${keyId} needs time and reason`);
    }
    const revokedAt = exactTimestamp(record.revokedAt, `${keyId}.revokedAt`);
    if (revokedAt < addedAt) {
      throw new Error(`trust policy key ${keyId} was revoked before registration`);
    }
  }
  if (record.status === 'rotated') {
    if (
      !record.rotatedAt
      || !record.replacedByKeyId
      || !KEY_ID.test(record.replacedByKeyId)
    ) {
      throw new Error(`rotated trust policy key ${keyId} needs replacement metadata`);
    }
    const rotatedAt = exactTimestamp(record.rotatedAt, `${keyId}.rotatedAt`);
    if (rotatedAt < addedAt) {
      throw new Error(`trust policy key ${keyId} was rotated before registration`);
    }
  }
  if (
    record.replacesKeyId !== undefined
    && (
      typeof record.replacesKeyId !== 'string'
      || !KEY_ID.test(record.replacesKeyId)
    )
  ) {
    throw new Error(`trust policy key ${keyId} has an invalid predecessor`);
  }
  const key = parsePublicKey(keyId, record.publicKey);
  const usable = record.status === 'active' && now >= validFrom && now <= validUntil;
  return {
    record: {
      ...record,
      publicKey: canonicalPublicKey(key),
    },
    key,
    usable,
  };
}

export function loadAddressQlTrustPolicy(
  path: string,
  options: { now?: string | number | Date; requireV2?: boolean } = {},
): LoadedAddressQlTrustPolicy {
  const parsed = readBoundedJson(path);
  const now = new Date(options.now ?? Date.now()).getTime();
  if (!Number.isFinite(now)) throw new Error('trust policy evaluation time is invalid');

  if (parsed.version === ADDRESSQL_LEGACY_TRUST_STORE_VERSION) {
    if (options.requireV2) throw new Error('release quorum requires addressql-trust-store-v2');
    if (!parsed.keys || typeof parsed.keys !== 'object' || Array.isArray(parsed.keys)) {
      throw new Error('legacy trust store keys must be an object');
    }
    const records = new Map<string, AddressQlReviewerKeyRecord>();
    const usableKeys = new Map<string, KeyObject>();
    for (const [keyId, value] of Object.entries(parsed.keys as Record<string, unknown>)) {
      if (typeof value !== 'string') throw new Error('legacy trust store PEM must be a string');
      const key = parsePublicKey(keyId, value);
      usableKeys.set(keyId, key);
      records.set(keyId, {
        reviewerId: keyId,
        publicKey: canonicalPublicKey(key),
        status: 'active',
        validFrom: '1970-01-01T00:00:00Z',
        validUntil: '9999-12-31T23:59:59Z',
        addedAt: '1970-01-01T00:00:00Z',
      });
    }
    return {
      version: ADDRESSQL_LEGACY_TRUST_STORE_VERSION,
      minimumSignatures: 1,
      records,
      usableKeys,
      legacy: true,
    };
  }

  if (parsed.version !== ADDRESSQL_TRUST_POLICY_VERSION) {
    throw new Error('trust store version is unsupported');
  }
  const policy = parsed.policy as { minimumSignatures?: unknown } | undefined;
  const minimumSignatures = policy?.minimumSignatures;
  if (
    !Number.isInteger(minimumSignatures)
    || Number(minimumSignatures) < 2
    || Number(minimumSignatures) > 10
  ) {
    throw new Error('trust policy minimumSignatures must be between 2 and 10');
  }
  if (!parsed.keys || typeof parsed.keys !== 'object' || Array.isArray(parsed.keys)) {
    throw new Error('trust policy keys must be an object');
  }
  const records = new Map<string, AddressQlReviewerKeyRecord>();
  const usableKeys = new Map<string, KeyObject>();
  const fingerprints = new Map<string, string>();
  for (const [keyId, value] of Object.entries(parsed.keys as Record<string, unknown>)) {
    const loaded = parseV2Record(keyId, value, now);
    const fingerprint = keyFingerprint(loaded.key);
    const duplicateKeyId = fingerprints.get(fingerprint);
    if (duplicateKeyId) {
      throw new Error(`trust policy keys ${duplicateKeyId} and ${keyId} reuse one public key`);
    }
    fingerprints.set(fingerprint, keyId);
    records.set(keyId, loaded.record);
    if (loaded.usable) usableKeys.set(keyId, loaded.key);
  }
  for (const [keyId, record] of records) {
    if (record.replacesKeyId && !records.has(record.replacesKeyId)) {
      throw new Error(`trust policy key ${keyId} replaces an unknown key`);
    }
    if (record.replacedByKeyId && !records.has(record.replacedByKeyId)) {
      throw new Error(`trust policy key ${keyId} references an unknown replacement`);
    }
    if (record.replacesKeyId) {
      const predecessor = records.get(record.replacesKeyId)!;
      if (
        predecessor.replacedByKeyId !== keyId
        || predecessor.reviewerId !== record.reviewerId
      ) {
        throw new Error(`trust policy key ${keyId} has an inconsistent rotation chain`);
      }
    }
    if (record.replacedByKeyId) {
      const replacement = records.get(record.replacedByKeyId)!;
      if (
        replacement.replacesKeyId !== keyId
        || replacement.reviewerId !== record.reviewerId
      ) {
        throw new Error(`trust policy key ${keyId} has an inconsistent replacement`);
      }
    }
  }
  return {
    version: ADDRESSQL_TRUST_POLICY_VERSION,
    minimumSignatures: Number(minimumSignatures),
    records,
    usableKeys,
    legacy: false,
  };
}

export function loadAddressQlTrustedPublicKeys(
  path: string,
  options: { now?: string | number | Date } = {},
) {
  return loadAddressQlTrustPolicy(path, options).usableKeys;
}

function writePolicy(path: string, policy: AddressQlTrustPolicy) {
  const absolutePath = resolve(path);
  const temporaryPath = `${absolutePath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temporaryPath, `${JSON.stringify(policy, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  renameSync(temporaryPath, absolutePath);
}

function newPolicy(minimumSignatures: number): AddressQlTrustPolicy {
  if (
    !Number.isInteger(minimumSignatures)
    || minimumSignatures < 2
    || minimumSignatures > 10
  ) {
    throw new Error('minimum signatures must be between 2 and 10');
  }
  return {
    version: ADDRESSQL_TRUST_POLICY_VERSION,
    policy: { minimumSignatures },
    keys: {},
  };
}

function readMutableV2Policy(path: string, minimumSignatures: number) {
  if (!existsSync(resolve(path))) return newPolicy(minimumSignatures);
  const parsed = readBoundedJson(path);
  if (parsed.version !== ADDRESSQL_TRUST_POLICY_VERSION) {
    throw new Error('reviewer key lifecycle changes require addressql-trust-store-v2');
  }
  loadAddressQlTrustPolicy(path, { requireV2: true });
  return parsed as unknown as AddressQlTrustPolicy;
}

export function registerAddressQlReviewerKey(input: {
  trustStorePath: string;
  keyId: string;
  reviewerId: string;
  publicKeyPath: string;
  validFrom: string;
  validUntil: string;
  addedAt: string;
  replacesKeyId?: string;
  minimumSignatures?: number;
}) {
  if (!KEY_ID.test(input.keyId)) throw new Error('reviewer key id is invalid');
  if (!KEY_ID.test(input.reviewerId)) throw new Error('reviewer id is invalid');
  const validFrom = exactTimestamp(input.validFrom, 'validFrom');
  const validUntil = exactTimestamp(input.validUntil, 'validUntil');
  const addedAt = exactTimestamp(input.addedAt, 'addedAt');
  if (validUntil <= validFrom || addedAt > validUntil) {
    throw new Error('reviewer key validity window is invalid');
  }
  const publicKeyText = readFileSync(resolve(input.publicKeyPath), 'utf8');
  const key = parsePublicKey(input.keyId, publicKeyText);
  const policy = readMutableV2Policy(
    input.trustStorePath,
    input.minimumSignatures ?? 2,
  );
  if (policy.keys[input.keyId]) {
    throw new Error(`reviewer key ${input.keyId} already exists`);
  }
  const publicKey = canonicalPublicKey(key);
  if (
    Object.values(policy.keys)
      .some(record => record.publicKey === publicKey)
  ) {
    throw new Error('one Ed25519 public key cannot be registered more than once');
  }
  if (input.replacesKeyId) {
    const replaced = policy.keys[input.replacesKeyId];
    if (!replaced || replaced.status !== 'active') {
      throw new Error('rotated reviewer key must replace one active key');
    }
    if (replaced.reviewerId !== input.reviewerId) {
      throw new Error('rotated reviewer key must retain its reviewer id');
    }
    policy.keys[input.replacesKeyId] = {
      ...replaced,
      status: 'rotated',
      rotatedAt: input.addedAt,
      replacedByKeyId: input.keyId,
    };
  }
  policy.keys[input.keyId] = {
    reviewerId: input.reviewerId,
    publicKey,
    status: 'active',
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    addedAt: input.addedAt,
    ...(input.replacesKeyId ? { replacesKeyId: input.replacesKeyId } : {}),
  };
  writePolicy(input.trustStorePath, policy);
  return {
    status: 'ok' as const,
    version: ADDRESSQL_TRUST_POLICY_VERSION,
    keyId: input.keyId,
    reviewerId: input.reviewerId,
    fingerprint: keyFingerprint(key),
    minimumSignatures: policy.policy.minimumSignatures,
    activeKeyCount: Object.values(policy.keys)
      .filter(record => record.status === 'active').length,
    rotatedKeyId: input.replacesKeyId ?? null,
    containsPrivateKey: false,
  };
}

export function revokeAddressQlReviewerKey(input: {
  trustStorePath: string;
  keyId: string;
  revokedAt: string;
  reason: string;
}) {
  exactTimestamp(input.revokedAt, 'revokedAt');
  if (!input.reason.trim() || input.reason.length > 500) {
    throw new Error('revocation reason must be between 1 and 500 characters');
  }
  const policy = readMutableV2Policy(input.trustStorePath, 2);
  const record = policy.keys[input.keyId];
  if (!record || record.status !== 'active') {
    throw new Error('only an active reviewer key can be revoked');
  }
  policy.keys[input.keyId] = {
    ...record,
    status: 'revoked',
    revokedAt: input.revokedAt,
    revocationReason: input.reason.trim(),
  };
  writePolicy(input.trustStorePath, policy);
  return {
    status: 'ok' as const,
    version: ADDRESSQL_TRUST_POLICY_VERSION,
    keyId: input.keyId,
    revokedAt: input.revokedAt,
    activeKeyCount: Object.values(policy.keys)
      .filter(candidate => candidate.status === 'active').length,
    containsPrivateKey: false,
  };
}
