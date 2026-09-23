import {
  isValidAGIDFormat,
  normalizeAGIDInput,
  validatePublicAgidPayload,
} from './agidSecurity';
import { AGID_BASE32_ALPHABET } from './agidContract';

export const AGID_SECURE_PREFIX = 'AGIDS1-';
export const AGID_SECURE_MODEL_VERSION = 'agid-secure-share-v1';
export const AGID_SECURE_ALGORITHM = 'A256GCM';
export const AGID_SECURE_NONCE_BYTES = 12;
export const AGID_SECURE_TAG_BYTES = 16;
export const AGID_SECURE_KEY_BYTES = 32;
export const AGID_SECURE_DEFAULT_MAX_TTL_SECONDS = 60 * 60 * 24 * 30;
export const AGID_SECURE_HIGH_RISK_MAX_TTL_SECONDS = 5 * 60;

const BASE32_ALPHABET = AGID_BASE32_ALPHABET;
const BASE32_LOOKUP = new Map(BASE32_ALPHABET.split('').map((char, index) => [char, index]));
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export type AgidSecurePurpose =
  | 'delivery'
  | 'humanitarian'
  | 'evacuation'
  | 'domestic-violence'
  | 'refugee-support'
  | 'pos'
  | 'support'
  | 'general';

export type AgidSecurePrecision = 'coarse' | 'standard';

export type AgidSecurePayload = {
  agid: string;
  exp: number;
  purpose?: AgidSecurePurpose;
  precision?: AgidSecurePrecision;
  iat: number;
  jti: string;
};

export type AgidSecureEnvelope = {
  v: 1;
  alg: typeof AGID_SECURE_ALGORITHM;
  kid: string;
  n: string;
  c: string;
  t: string;
};

export type AgidSecureCreateInput = {
  agid: string;
  key: Uint8Array | ArrayBuffer | CryptoKey;
  keyId: string;
  exp: number;
  purpose?: AgidSecurePurpose;
  precision?: AgidSecurePrecision;
  now?: number;
  maxTtlSeconds?: number;
};

export type AgidSecureOpenInput = {
  token: string;
  key: Uint8Array | ArrayBuffer | CryptoKey;
  expectedKeyId?: string;
  expectedPurpose?: AgidSecurePurpose;
  now?: number;
  allowExpired?: boolean;
};

export type AgidSecureOpenResult =
  | {
      ok: true;
      payload: AgidSecurePayload;
      envelope: AgidSecureEnvelope;
    }
  | {
      ok: false;
      error: string;
      envelope?: AgidSecureEnvelope;
    };

const AGID_SECURE_PURPOSES: AgidSecurePurpose[] = [
  'delivery',
  'humanitarian',
  'evacuation',
  'domestic-violence',
  'refugee-support',
  'pos',
  'support',
  'general',
];
const AGID_SECURE_HIGH_RISK_PURPOSES = new Set<AgidSecurePurpose>([
  'humanitarian',
  'evacuation',
  'domestic-violence',
  'refugee-support',
]);

function isHighRiskAgidSecurePurpose(value: unknown): value is AgidSecurePurpose {
  return typeof value === 'string'
    && AGID_SECURE_HIGH_RISK_PURPOSES.has(value as AgidSecurePurpose);
}

function getWebCrypto() {
  const crypto = globalThis.crypto;
  if (!crypto?.subtle || typeof crypto.getRandomValues !== 'function') {
    throw new Error('WebCrypto is required for AGID-S.');
  }
  return crypto;
}

function base32Encode(bytes: Uint8Array) {
  let value = 0;
  let bits = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(value: string) {
  const cleaned = value.trim().toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of cleaned) {
    const digit = BASE32_LOOKUP.get(char);
    if (digit === undefined) throw new Error(`Invalid AGID-S base32 character: ${char}`);
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  if (bits > 0 && ((buffer << (8 - bits)) & 0xff) !== 0) {
    throw new Error('Invalid AGID-S base32 padding bits.');
  }

  return new Uint8Array(bytes);
}

function encodeJson(value: unknown) {
  return base32Encode(TEXT_ENCODER.encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(TEXT_DECODER.decode(base32Decode(value))) as T;
}

function concatBytes(...parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function cleanKeyId(value: string) {
  const cleaned = value.trim();
  if (!/^[A-Za-z0-9._:-]{1,48}$/.test(cleaned)) {
    throw new Error('AGID-S key_id must be 1-48 URL-safe label characters.');
  }
  return cleaned;
}

function unixSeconds(value = Date.now()) {
  return Math.floor(value / 1000);
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  getWebCrypto().getRandomValues(bytes);
  return bytes;
}

async function importAesKey(key: Uint8Array | ArrayBuffer | CryptoKey, usages: KeyUsage[]) {
  if (key instanceof CryptoKey) {
    if (key.type !== 'secret' || key.algorithm.name !== 'AES-GCM') {
      throw new Error('AGID-S requires an AES-GCM secret key.');
    }
    return key;
  }

  const raw = key instanceof Uint8Array ? key : new Uint8Array(key);
  if (raw.byteLength !== AGID_SECURE_KEY_BYTES) {
    throw new Error('AGID-S requires a 256-bit symmetric key.');
  }
  const keyMaterial = new Uint8Array(new ArrayBuffer(AGID_SECURE_KEY_BYTES));
  keyMaterial.set(raw);
  return getWebCrypto().subtle.importKey('raw', keyMaterial, 'AES-GCM', false, usages);
}

function aadForEnvelope(envelope: Pick<AgidSecureEnvelope, 'v' | 'alg' | 'kid'>) {
  return TEXT_ENCODER.encode(`${AGID_SECURE_MODEL_VERSION}|v=${envelope.v}|alg=${envelope.alg}|kid=${envelope.kid}`);
}

function validatePlainPayload(value: unknown): AgidSecurePayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('AGID-S payload must be an object.');
  }
  const payload = value as Partial<AgidSecurePayload> & Record<string, unknown>;
  const allowedKeys = new Set(['agid', 'exp', 'purpose', 'precision', 'iat', 'jti']);
  const extraKeys = Object.keys(payload).filter(key => !allowedKeys.has(key));
  if (extraKeys.length > 0) {
    throw new Error(`AGID-S payload has unsupported fields: ${extraKeys.join(', ')}`);
  }
  const agid = normalizeAGIDInput(payload.agid);
  if (!agid || !isValidAGIDFormat(agid)) {
    throw new Error('AGID-S payload contains an invalid AGID.');
  }
  if (!Number.isInteger(payload.exp) || Number(payload.exp) <= 0) {
    throw new Error('AGID-S payload must include an integer exp.');
  }
  if (!Number.isInteger(payload.iat) || Number(payload.iat) <= 0) {
    throw new Error('AGID-S payload must include an integer iat.');
  }
  if (typeof payload.jti !== 'string' || !/^[0-9A-Z]{16,64}$/.test(payload.jti)) {
    throw new Error('AGID-S payload must include a random jti.');
  }
  if (payload.purpose && !AGID_SECURE_PURPOSES.includes(payload.purpose)) {
    throw new Error('AGID-S purpose is unsupported.');
  }
  if (payload.precision && !['coarse', 'standard'].includes(payload.precision)) {
    throw new Error('AGID-S precision is unsupported.');
  }
  if (isHighRiskAgidSecurePurpose(payload.purpose) && payload.precision !== 'coarse') {
    throw new Error('AGID-S high-risk sharing requires coarse precision.');
  }
  if (!validatePublicAgidPayload(payload).ok) {
    throw new Error('AGID-S payload must not contain private address material.');
  }

  return {
    agid,
    exp: Number(payload.exp),
    ...(payload.purpose ? { purpose: payload.purpose } : {}),
    ...(payload.precision ? { precision: payload.precision } : {}),
    iat: Number(payload.iat),
    jti: payload.jti,
  };
}

function validateEnvelope(value: unknown): AgidSecureEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('AGID-S envelope must be an object.');
  }
  const envelope = value as Partial<AgidSecureEnvelope>;
  if (envelope.v !== 1) throw new Error('AGID-S version is unsupported.');
  if (envelope.alg !== AGID_SECURE_ALGORITHM) throw new Error('AGID-S algorithm is unsupported.');
  const kid = cleanKeyId(String(envelope.kid ?? ''));
  if (typeof envelope.n !== 'string' || base32Decode(envelope.n).byteLength !== AGID_SECURE_NONCE_BYTES) {
    throw new Error('AGID-S nonce is invalid.');
  }
  if (typeof envelope.c !== 'string' || base32Decode(envelope.c).byteLength === 0) {
    throw new Error('AGID-S ciphertext is invalid.');
  }
  if (typeof envelope.t !== 'string' || base32Decode(envelope.t).byteLength !== AGID_SECURE_TAG_BYTES) {
    throw new Error('AGID-S auth tag is invalid.');
  }
  return {
    v: 1,
    alg: AGID_SECURE_ALGORITHM,
    kid,
    n: envelope.n,
    c: envelope.c,
    t: envelope.t,
  };
}

export function generateAgidSecureKey() {
  return randomBytes(AGID_SECURE_KEY_BYTES);
}

export function isAgidSecureToken(value: unknown): value is string {
  return typeof value === 'string' && value.trim().toUpperCase().startsWith(AGID_SECURE_PREFIX);
}

export function readAgidSecureEnvelope(token: string): AgidSecureEnvelope | null {
  const cleaned = token.trim().toUpperCase();
  if (!cleaned.startsWith(AGID_SECURE_PREFIX)) return null;
  try {
    return validateEnvelope(decodeJson(cleaned.slice(AGID_SECURE_PREFIX.length)));
  } catch {
    return null;
  }
}

export async function createAgidSecureToken(input: AgidSecureCreateInput) {
  const agid = normalizeAGIDInput(input.agid);
  if (!agid || !isValidAGIDFormat(agid)) {
    throw new Error('AGID-S can only wrap a valid public AGID.');
  }

  const issuedAt = unixSeconds(input.now);
  const exp = Number(input.exp);
  const highRiskPurpose = isHighRiskAgidSecurePurpose(input.purpose);
  const maxTtl = highRiskPurpose
    ? Math.min(input.maxTtlSeconds ?? AGID_SECURE_HIGH_RISK_MAX_TTL_SECONDS, AGID_SECURE_HIGH_RISK_MAX_TTL_SECONDS)
    : input.maxTtlSeconds ?? AGID_SECURE_DEFAULT_MAX_TTL_SECONDS;
  const precision = input.precision ?? (highRiskPurpose ? 'coarse' : undefined);
  if (!Number.isInteger(exp) || exp <= issuedAt) {
    throw new Error('AGID-S requires a future integer exp.');
  }
  if (exp - issuedAt > maxTtl) {
    throw new Error('AGID-S exp exceeds the allowed maximum TTL.');
  }

  const keyId = cleanKeyId(input.keyId);
  const nonce = randomBytes(AGID_SECURE_NONCE_BYTES);
  const envelopeHeader = {
    v: 1,
    alg: AGID_SECURE_ALGORITHM,
    kid: keyId,
  } satisfies Pick<AgidSecureEnvelope, 'v' | 'alg' | 'kid'>;
  const payload = validatePlainPayload({
    agid,
    exp,
    ...(input.purpose ? { purpose: input.purpose } : {}),
    ...(precision ? { precision } : {}),
    iat: issuedAt,
    jti: base32Encode(randomBytes(16)),
  });
  const cryptoKey = await importAesKey(input.key, ['encrypt']);
  const encrypted = new Uint8Array(await getWebCrypto().subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      additionalData: aadForEnvelope(envelopeHeader),
      tagLength: AGID_SECURE_TAG_BYTES * 8,
    },
    cryptoKey,
    TEXT_ENCODER.encode(JSON.stringify(payload)),
  ));
  const ciphertext = encrypted.slice(0, -AGID_SECURE_TAG_BYTES);
  const tag = encrypted.slice(-AGID_SECURE_TAG_BYTES);
  const envelope: AgidSecureEnvelope = {
    ...envelopeHeader,
    n: base32Encode(nonce),
    c: base32Encode(ciphertext),
    t: base32Encode(tag),
  };

  return `${AGID_SECURE_PREFIX}${encodeJson(envelope)}`;
}

export async function openAgidSecureToken(input: AgidSecureOpenInput): Promise<AgidSecureOpenResult> {
  const cleaned = input.token.trim().toUpperCase();
  if (!cleaned.startsWith(AGID_SECURE_PREFIX)) {
    return { ok: false, error: 'not-agid-s' };
  }

  let envelope: AgidSecureEnvelope;
  try {
    envelope = validateEnvelope(decodeJson(cleaned.slice(AGID_SECURE_PREFIX.length)));
  } catch {
    return { ok: false, error: 'invalid-envelope' };
  }

  if (input.expectedKeyId && envelope.kid !== input.expectedKeyId) {
    return { ok: false, error: 'key-id-mismatch', envelope };
  }

  try {
    const cryptoKey = await importAesKey(input.key, ['decrypt']);
    const plaintext = await getWebCrypto().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base32Decode(envelope.n),
        additionalData: aadForEnvelope(envelope),
        tagLength: AGID_SECURE_TAG_BYTES * 8,
      },
      cryptoKey,
      concatBytes(base32Decode(envelope.c), base32Decode(envelope.t)),
    );
    const payload = validatePlainPayload(JSON.parse(TEXT_DECODER.decode(plaintext)));
    const now = unixSeconds(input.now);
    if (!input.allowExpired && payload.exp <= now) {
      return { ok: false, error: 'expired', envelope };
    }
    if (input.expectedPurpose && payload.purpose !== input.expectedPurpose) {
      return { ok: false, error: 'purpose-mismatch', envelope };
    }
    return { ok: true, payload, envelope };
  } catch {
    return { ok: false, error: 'decrypt-failed', envelope };
  }
}

export function summarizeAgidSecureToken(token: string) {
  const envelope = readAgidSecureEnvelope(token);
  return envelope
    ? {
        kind: 'AGID-S' as const,
        modelVersion: AGID_SECURE_MODEL_VERSION,
        algorithm: envelope.alg,
        keyId: envelope.kid,
        encrypted: true,
        revealsAgid: false,
        containsPersonalData: false,
      }
    : null;
}
