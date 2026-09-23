import {
  AGID_SECURE_KEY_BYTES,
  type AgidSecureEnvelope,
  type AgidSecurePayload,
  type AgidSecurePurpose,
  generateAgidSecureKey,
  isAgidSecureToken,
  openAgidSecureToken,
  readAgidSecureEnvelope,
} from './agidSecureShare';
import {
  unwrapPosAcceptancePayload,
  type PosAcceptanceChannel,
} from './posAcceptance';

export const AGID_SECURE_POS_MODEL_VERSION = 'agid-secure-pos-flow-v1';
export const AGID_SECURE_POS_REGISTRY_FRESHNESS_SECONDS = 10 * 60;

export type PosSecureKeyStatus = 'active' | 'retiring' | 'revoked';

export type PosSecureKeyEntry = {
  keyId: string;
  keyMaterial: string;
  status: PosSecureKeyStatus;
  createdAt: string;
  recipientId?: string;
  label?: string;
  notBefore?: string;
  notAfter?: string;
  rotatedFrom?: string;
};

export type AgidSecurePosRegistrySnapshot = {
  registryId: string;
  version: string;
  checkedAt?: string;
  freshUntil?: string;
  revokedKeyIds?: Iterable<string>;
  revokedJtis?: Iterable<string>;
  usedJtis?: Iterable<string>;
  sourceIds?: string[];
};

export type AgidSecurePosRegistryDecision = {
  valid: boolean;
  checkedAt: string;
  registryId?: string;
  errors: string[];
  warnings: string[];
};

export type AgidSecurePosOpenResult =
  | {
      ok: true;
      modelVersion: typeof AGID_SECURE_POS_MODEL_VERSION;
      payload: AgidSecurePayload;
      envelope: AgidSecureEnvelope;
      key: PosSecureKeyEntry;
      channel: PosAcceptanceChannel;
      registryDecision: AgidSecurePosRegistryDecision;
      warnings: string[];
    }
  | {
      ok: false;
      modelVersion: typeof AGID_SECURE_POS_MODEL_VERSION;
      error: string;
      envelope?: AgidSecureEnvelope;
      key?: PosSecureKeyEntry;
      registryDecision?: AgidSecurePosRegistryDecision;
      warnings: string[];
    };

export type PosRecipientKeyPlanInput = {
  recipients: Array<{
    recipientId: string;
    label?: string;
  }>;
  createdAt?: string;
  activeDays?: number;
};

export type PosRecipientKeyPlan = {
  modelVersion: typeof AGID_SECURE_POS_MODEL_VERSION;
  distributionMode: 'per-recipient-key';
  sharedGroupKeyAllowed: false;
  keys: PosSecureKeyEntry[];
  notes: string[];
};

const HEX_KEY_PATTERN = /^[0-9a-f]{64}$/i;
const SAFE_KEY_ID_PATTERN = /^[A-Za-z0-9._:-]{1,48}$/;

function nowIso(now = Date.now()) {
  return new Date(now).toISOString();
}

function unixSeconds(now = Date.now()) {
  return Math.floor(now / 1000);
}

function cleanLabel(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function addDaysIso(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * 24 * 60 * 60 * 1000).toISOString();
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value: string) {
  const cleaned = value.trim().toLowerCase();
  if (!HEX_KEY_PATTERN.test(cleaned)) {
    throw new Error('POS AGID-S key material must be a 64-character hex encoded 256-bit key.');
  }
  const bytes = new Uint8Array(AGID_SECURE_KEY_BYTES);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(cleaned.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function cleanKeyId(value: string) {
  const cleaned = value.trim();
  if (!SAFE_KEY_ID_PATTERN.test(cleaned)) {
    throw new Error('POS AGID-S key id must be 1-48 URL-safe label characters.');
  }
  return cleaned;
}

function setFromIterable(values: Iterable<string> | undefined) {
  return new Set(Array.from(values ?? []).map(value => String(value).trim()).filter(Boolean));
}

function readTimestamp(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function makeKeyId(prefix: string, createdAt: string, index = 0) {
  const suffix = Math.abs(stableHash(`${prefix}|${createdAt}|${index}`))
    .toString(36)
    .toUpperCase()
    .padStart(6, '0')
    .slice(-6);
  return cleanKeyId(`${prefix}-${suffix}`);
}

function stableHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function isPosSecureKeyEntry(value: unknown): value is PosSecureKeyEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const key = value as Partial<PosSecureKeyEntry>;
  return typeof key.keyId === 'string'
    && SAFE_KEY_ID_PATTERN.test(key.keyId)
    && typeof key.keyMaterial === 'string'
    && HEX_KEY_PATTERN.test(key.keyMaterial)
    && (key.status === 'active' || key.status === 'retiring' || key.status === 'revoked')
    && typeof key.createdAt === 'string';
}

export function generatePosSecureKeyEntry(input: {
  keyId?: string;
  recipientId?: string;
  label?: string;
  createdAt?: string;
  activeDays?: number;
} = {}): PosSecureKeyEntry {
  const createdAt = input.createdAt || nowIso();
  const keyId = cleanKeyId(input.keyId || makeKeyId('pos-key', createdAt));
  const activeDays = input.activeDays ?? 90;
  return {
    keyId,
    keyMaterial: bytesToHex(generateAgidSecureKey()),
    status: 'active',
    createdAt,
    ...(input.recipientId ? { recipientId: cleanLabel(input.recipientId) } : {}),
    ...(input.label ? { label: cleanLabel(input.label) } : {}),
    notBefore: createdAt,
    notAfter: addDaysIso(createdAt, activeDays),
  };
}

export function rotatePosSecureKeyEntry(
  current: PosSecureKeyEntry,
  input: {
    newKeyId?: string;
    rotatedAt?: string;
    retireAfterDays?: number;
    activeDays?: number;
  } = {},
) {
  const rotatedAt = input.rotatedAt || nowIso();
  const previous: PosSecureKeyEntry = {
    ...current,
    status: current.status === 'revoked' ? 'revoked' : 'retiring',
    notAfter: addDaysIso(rotatedAt, input.retireAfterDays ?? 7),
  };
  const next = generatePosSecureKeyEntry({
    keyId: input.newKeyId || makeKeyId(current.keyId, rotatedAt),
    recipientId: current.recipientId,
    label: current.label ? `${current.label} rotated` : undefined,
    createdAt: rotatedAt,
    activeDays: input.activeDays ?? 90,
  });
  return {
    previous,
    next: {
      ...next,
      rotatedFrom: current.keyId,
    },
  };
}

export function buildPosRecipientKeyPlan(input: PosRecipientKeyPlanInput): PosRecipientKeyPlan {
  const createdAt = input.createdAt || nowIso();
  const keys = input.recipients.map((recipient, index) => generatePosSecureKeyEntry({
    keyId: makeKeyId(`recipient-${recipient.recipientId || index + 1}`, createdAt, index),
    recipientId: recipient.recipientId,
    label: recipient.label,
    createdAt,
    activeDays: input.activeDays,
  }));

  return {
    modelVersion: AGID_SECURE_POS_MODEL_VERSION,
    distributionMode: 'per-recipient-key',
    sharedGroupKeyAllowed: false,
    keys,
    notes: [
      'Issue one AGID-S token per recipient key_id instead of sharing one group key.',
      'The POS registry stores used/revoked jti values, not decrypted AGIDs or private addresses.',
      'Rotate recipient keys independently so one compromised recipient does not expose other recipients.',
    ],
  };
}

export function summarizePosSecureKeyRing(keys: PosSecureKeyEntry[]) {
  const safeKeys = keys.filter(isPosSecureKeyEntry);
  return {
    modelVersion: AGID_SECURE_POS_MODEL_VERSION,
    total: safeKeys.length,
    active: safeKeys.filter(key => key.status === 'active').length,
    retiring: safeKeys.filter(key => key.status === 'retiring').length,
    revoked: safeKeys.filter(key => key.status === 'revoked').length,
    recipients: new Set(safeKeys.map(key => key.recipientId).filter(Boolean)).size,
  };
}

export function verifyAgidSecurePosRegistry(input: {
  registry?: AgidSecurePosRegistrySnapshot | null;
  keyId?: string;
  jti?: string;
  exp?: number;
  now?: number;
}): AgidSecurePosRegistryDecision {
  const nowMs = input.now ?? Date.now();
  const checkedAt = nowIso(nowMs);
  const errors: string[] = [];
  const warnings: string[] = [];
  const registry = input.registry;

  if (!registry) {
    warnings.push('registry-not-configured');
    return {
      valid: true,
      checkedAt,
      errors,
      warnings,
    };
  }

  const freshUntil = readTimestamp(registry.freshUntil);
  if (!freshUntil || freshUntil <= nowMs) errors.push('registry-stale');

  const keyId = cleanLabel(input.keyId);
  const jti = cleanLabel(input.jti);
  if (keyId && setFromIterable(registry.revokedKeyIds).has(keyId)) {
    errors.push('key-revoked-by-registry');
  }
  if (jti && setFromIterable(registry.revokedJtis).has(jti)) {
    errors.push('token-revoked');
  }
  if (jti && setFromIterable(registry.usedJtis).has(jti)) {
    errors.push('token-already-used');
  }
  if (input.exp && input.exp <= unixSeconds(nowMs)) {
    errors.push('token-expired');
  }

  return {
    valid: errors.length === 0,
    checkedAt,
    registryId: registry.registryId,
    errors,
    warnings,
  };
}

export async function openAgidSecureForPos(input: {
  token: string;
  keyRing: PosSecureKeyEntry[];
  channel?: PosAcceptanceChannel;
  expectedPurpose?: AgidSecurePurpose;
  registry?: AgidSecurePosRegistrySnapshot | null;
  now?: number;
}): Promise<AgidSecurePosOpenResult> {
  const unwrapped = unwrapPosAcceptancePayload({
    payload: input.token,
    channel: input.channel ?? 'manual',
  });
  const warnings = [...unwrapped.warnings];

  if (!isAgidSecureToken(unwrapped.payload)) {
    return {
      ok: false,
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      error: 'not-agid-s',
      warnings,
    };
  }

  const envelope = readAgidSecureEnvelope(unwrapped.payload) ?? undefined;
  if (!envelope) {
    return {
      ok: false,
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      error: 'invalid-envelope',
      warnings,
    };
  }

  const key = input.keyRing.find(entry => isPosSecureKeyEntry(entry) && entry.keyId === envelope.kid);
  if (!key) {
    return {
      ok: false,
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      error: 'key-not-found',
      envelope,
      warnings,
    };
  }

  const nowMs = input.now ?? Date.now();
  const notBefore = readTimestamp(key.notBefore);
  const notAfter = readTimestamp(key.notAfter);
  if (key.status === 'revoked') {
    return {
      ok: false,
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      error: 'key-revoked',
      envelope,
      key,
      warnings,
    };
  }
  if (notBefore && notBefore > nowMs) {
    return {
      ok: false,
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      error: 'key-not-yet-valid',
      envelope,
      key,
      warnings,
    };
  }
  if (notAfter && notAfter <= nowMs) {
    return {
      ok: false,
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      error: 'key-expired',
      envelope,
      key,
      warnings,
    };
  }
  if (key.status === 'retiring') warnings.push('key-retiring');

  const opened = await openAgidSecureToken({
    token: unwrapped.payload,
    key: hexToBytes(key.keyMaterial),
    expectedKeyId: key.keyId,
    expectedPurpose: input.expectedPurpose,
    now: nowMs,
  });
  if (opened.ok === false) {
    return {
      ok: false,
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      error: opened.error,
      envelope,
      key,
      warnings,
    };
  }

  const registryDecision = verifyAgidSecurePosRegistry({
    registry: input.registry,
    keyId: opened.envelope.kid,
    jti: opened.payload.jti,
    exp: opened.payload.exp,
    now: nowMs,
  });
  if (!registryDecision.valid) {
    return {
      ok: false,
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      error: registryDecision.errors[0] || 'registry-rejected',
      envelope,
      key,
      registryDecision,
      warnings: [...warnings, ...registryDecision.warnings],
    };
  }

  return {
    ok: true,
    modelVersion: AGID_SECURE_POS_MODEL_VERSION,
    payload: opened.payload,
    envelope: opened.envelope,
    key,
    channel: unwrapped.channel,
    registryDecision,
    warnings: [...warnings, ...registryDecision.warnings],
  };
}

export function markAgidSecurePosUsed(
  registry: AgidSecurePosRegistrySnapshot,
  input: {
    jti: string;
    usedAt?: string;
  },
): AgidSecurePosRegistrySnapshot {
  const usedJtis = setFromIterable(registry.usedJtis);
  usedJtis.add(cleanLabel(input.jti));
  const usedAt = input.usedAt || nowIso();
  return {
    ...registry,
    checkedAt: usedAt,
    freshUntil: addDaysIso(usedAt, AGID_SECURE_POS_REGISTRY_FRESHNESS_SECONDS / (24 * 60 * 60)),
    version: `${registry.version}+used.${Math.abs(stableHash(`${input.jti}|${usedAt}`)).toString(36).toUpperCase()}`,
    usedJtis,
  };
}
