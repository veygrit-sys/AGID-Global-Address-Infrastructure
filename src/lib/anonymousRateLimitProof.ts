export const ANONYMOUS_RATE_LIMIT_PROOF_VERSION = 'anonymous-rate-limit-proof-v1';
export const ANONYMOUS_RATE_LIMIT_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const ANONYMOUS_RATE_LIMIT_NULLIFIER_ALGORITHM = 'hmac-sha256-anonymous-rate-limit-v1';
export const ANONYMOUS_RATE_LIMIT_COMMITMENT_ALGORITHM = 'sha256-salted-anonymous-rate-limit-v1';

export type AnonymousRateLimitPrivacyField =
  | 'subject-secret'
  | 'subject-id'
  | 'aoid'
  | 'agid'
  | 'pid'
  | 'address'
  | 'recipient'
  | 'phone'
  | 'device-id'
  | 'ip-address'
  | 'proof-salt';

export type AnonymousRateLimitProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'holder-knows-rate-limit-secret-for-window-scoped-nullifier';
};

export type AnonymousRateLimitWindow = {
  bucketId: string;
  startsAt: string;
  endsAt: string;
  maxRequests: number;
};

export type AnonymousRateLimitClaim = {
  version: typeof ANONYMOUS_RATE_LIMIT_PROOF_VERSION;
  scope: string;
  action: string;
  audience?: string;
  challengeHash: string;
  issuedAt: string;
  expiresAt: string;
  window: AnonymousRateLimitWindow;
  nullifiers: {
    algorithm: typeof ANONYMOUS_RATE_LIMIT_NULLIFIER_ALGORITHM;
    bucketNullifier: string;
    requestNullifier: string;
  };
  commitments: {
    subjectSecretCommitment: string;
    requestNonceCommitment: string;
  };
  privacy: {
    hides: AnonymousRateLimitPrivacyField[];
    reveals: Array<
      | 'scope'
      | 'action'
      | 'audience'
      | 'window'
      | 'quota'
      | 'bucket-nullifier'
      | 'request-nullifier'
      | 'challenge-hash'
      | 'commitments'
      | 'issuer'
    >;
  };
  proofHint: AnonymousRateLimitProofHint;
};

export type AnonymousRateLimitSignature = {
  algorithm: typeof ANONYMOUS_RATE_LIMIT_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type AnonymousRateLimitProofEnvelope = {
  claim: AnonymousRateLimitClaim;
  signature: AnonymousRateLimitSignature;
  privateProofSalt?: string;
  localCacheKey?: string;
};

export type CreateAnonymousRateLimitProofInput = {
  issuerId: string;
  issuerSecret: string;
  subjectSecret: string;
  scope: string;
  action: string;
  audience?: string;
  challenge?: string;
  issuedAt?: Date | string;
  ttlSeconds?: number;
  windowStartsAt?: Date | string;
  windowEndsAt?: Date | string;
  windowSeconds?: number;
  maxRequests: number;
  requestNonce?: string;
  privateProofSalt?: string;
};

export type AnonymousRateLimitLedgerEntry = {
  count: number;
  requestNullifiers: Set<string>;
};

export type AnonymousRateLimitLedger = Map<string, AnonymousRateLimitLedgerEntry>;

export type VerifyAnonymousRateLimitProofOptions = {
  issuerId?: string;
  issuerSecret?: string;
  expectedScope?: string;
  expectedAction?: string;
  expectedAudience?: string;
  expectedChallenge?: string;
  now?: Date | string;
  maxRequestsPerWindow?: number;
  minWindowSeconds?: number;
  maxWindowSeconds?: number;
  registeredRequestNullifiers?: Iterable<string>;
  observedBucketUsage?: number | Map<string, number> | AnonymousRateLimitLedger;
};

export type AnonymousRateLimitProofVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  windowActive: boolean;
  quotaExceeded: boolean;
  replay: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  remaining: number | null;
  errors: string[];
  warnings: string[];
};

export type AnonymousRateLimitRegistrationResult =
  AnonymousRateLimitProofVerificationResult & {
    registered: boolean;
    used: number;
  };

const textEncoder = new TextEncoder();
const DEFAULT_WINDOW_SECONDS = 60;

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for anonymous rate limit proofs.');
  }
  return cryptoApi;
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/[\u3000\s]+/g, ' ')
    .trim();
}

function normalizeToken(value: unknown) {
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9:_.*/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  if (value instanceof Date) return JSON.stringify(value.toISOString());

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter(key => record[key] !== undefined).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function bytesToBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }

  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value: string) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64url'));
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toIsoDate(value?: Date | string) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function addSeconds(isoDate: string, seconds: number) {
  return new Date(new Date(isoDate).getTime() + seconds * 1000).toISOString();
}

function generateRandomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256Base64Url(payload: string) {
  const digest = await getCrypto().subtle.digest('SHA-256', textEncoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function hmacSha256Base64Url(secret: string, payload: string) {
  const cryptoApi = getCrypto();
  const key = await cryptoApi.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signature = await cryptoApi.subtle.sign('HMAC', key, textEncoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyHmacSha256(secret: string, payload: string, signature: string) {
  const cryptoApi = getCrypto();
  const key = await cryptoApi.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return cryptoApi.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signature),
    textEncoder.encode(payload)
  );
}

function signingPayload(claim: AnonymousRateLimitClaim) {
  return stableStringify(claim);
}

function assertPositiveInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Anonymous rate limit proof requires a positive integer ${label}.`);
  }
}

function buildRateLimitWindow(input: CreateAnonymousRateLimitProofInput, issuedAt: string): AnonymousRateLimitWindow {
  const maxRequests = Math.trunc(input.maxRequests);
  assertPositiveInteger(maxRequests, 'maxRequests');
  if (maxRequests > 10_000) throw new Error('Anonymous rate limit proof maxRequests is too high.');

  const windowSeconds = Math.trunc(input.windowSeconds ?? DEFAULT_WINDOW_SECONDS);
  assertPositiveInteger(windowSeconds, 'windowSeconds');

  const startsAt = input.windowStartsAt
    ? toIsoDate(input.windowStartsAt)
    : new Date(Math.floor(new Date(issuedAt).getTime() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString();
  const endsAt = input.windowEndsAt ? toIsoDate(input.windowEndsAt) : addSeconds(startsAt, windowSeconds);
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error('Anonymous rate limit proof requires a valid window.');
  }

  return {
    bucketId: normalizeToken(`${startsAt}/${endsAt}`),
    startsAt,
    endsAt,
    maxRequests,
  };
}

async function challengeHash(challenge: string) {
  return sha256Base64Url(stableStringify({
    algorithm: ANONYMOUS_RATE_LIMIT_COMMITMENT_ALGORITHM,
    kind: 'challenge',
    challenge,
  }));
}

function bucketPreimage(input: {
  scope: string;
  action: string;
  audience?: string;
  window: AnonymousRateLimitWindow;
}) {
  return stableStringify({
    version: ANONYMOUS_RATE_LIMIT_PROOF_VERSION,
    algorithm: ANONYMOUS_RATE_LIMIT_NULLIFIER_ALGORITHM,
    kind: 'bucket',
    scope: input.scope,
    action: input.action,
    audience: input.audience ?? null,
    window: input.window,
  });
}

function requestPreimage(input: {
  scope: string;
  action: string;
  audience?: string;
  window: AnonymousRateLimitWindow;
  requestNonce: string;
}) {
  return stableStringify({
    version: ANONYMOUS_RATE_LIMIT_PROOF_VERSION,
    algorithm: ANONYMOUS_RATE_LIMIT_NULLIFIER_ALGORITHM,
    kind: 'request',
    scope: input.scope,
    action: input.action,
    audience: input.audience ?? null,
    window: input.window,
    requestNonce: input.requestNonce,
  });
}

async function subjectSecretCommitment(input: {
  subjectSecret: string;
  scope: string;
  action: string;
  audience?: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: ANONYMOUS_RATE_LIMIT_COMMITMENT_ALGORITHM,
    kind: 'subject-secret',
    scope: input.scope,
    action: input.action,
    audience: input.audience ?? null,
    subjectSecret: input.subjectSecret,
    salt: input.salt,
  }));
}

async function requestNonceCommitment(input: {
  requestNonce: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: ANONYMOUS_RATE_LIMIT_COMMITMENT_ALGORITHM,
    kind: 'request-nonce',
    requestNonce: input.requestNonce,
    salt: input.salt,
  }));
}

export function generateAnonymousRateLimitSecret(byteLength = 32) {
  return generateRandomToken(byteLength);
}

export function createAnonymousRateLimitLedger(): AnonymousRateLimitLedger {
  return new Map<string, AnonymousRateLimitLedgerEntry>();
}

export async function createAnonymousRateLimitProof(
  input: CreateAnonymousRateLimitProofInput
): Promise<AnonymousRateLimitProofEnvelope> {
  const scope = normalizeToken(input.scope);
  const action = normalizeToken(input.action);
  const audience = normalizeToken(input.audience);
  const subjectSecret = normalizeText(input.subjectSecret);
  if (!scope) throw new Error('Anonymous rate limit proof requires a scope.');
  if (!action) throw new Error('Anonymous rate limit proof requires an action.');
  if (!subjectSecret) throw new Error('Anonymous rate limit proof requires a subject secret.');

  const issuedAt = toIsoDate(input.issuedAt);
  const window = buildRateLimitWindow(input, issuedAt);
  const issuedAtMs = new Date(issuedAt).getTime();
  if (issuedAtMs < new Date(window.startsAt).getTime() || issuedAtMs >= new Date(window.endsAt).getTime()) {
    throw new Error('Anonymous rate limit proof issuedAt must be inside the rate limit window.');
  }

  const challenge = normalizeText(input.challenge) || generateRandomToken(16);
  const requestNonce = normalizeText(input.requestNonce) || generateRandomToken(16);
  const privateProofSalt = input.privateProofSalt ?? generateRandomToken();
  const expiresAt = input.ttlSeconds
    ? new Date(Math.min(new Date(addSeconds(issuedAt, input.ttlSeconds)).getTime(), new Date(window.endsAt).getTime())).toISOString()
    : window.endsAt;

  const claim: AnonymousRateLimitClaim = {
    version: ANONYMOUS_RATE_LIMIT_PROOF_VERSION,
    scope,
    action,
    ...(audience ? { audience } : {}),
    challengeHash: await challengeHash(challenge),
    issuedAt,
    expiresAt,
    window,
    nullifiers: {
      algorithm: ANONYMOUS_RATE_LIMIT_NULLIFIER_ALGORITHM,
      bucketNullifier: await hmacSha256Base64Url(subjectSecret, bucketPreimage({ scope, action, audience, window })),
      requestNullifier: await hmacSha256Base64Url(subjectSecret, requestPreimage({
        scope,
        action,
        audience,
        window,
        requestNonce,
      })),
    },
    commitments: {
      subjectSecretCommitment: await subjectSecretCommitment({
        subjectSecret,
        scope,
        action,
        audience,
        salt: privateProofSalt,
      }),
      requestNonceCommitment: await requestNonceCommitment({
        requestNonce,
        salt: privateProofSalt,
      }),
    },
    privacy: {
      hides: [
        'subject-secret',
        'subject-id',
        'aoid',
        'agid',
        'pid',
        'address',
        'recipient',
        'phone',
        'device-id',
        'ip-address',
        'proof-salt',
      ],
      reveals: [
        'scope',
        'action',
        ...(audience ? ['audience' as const] : []),
        'window',
        'quota',
        'bucket-nullifier',
        'request-nullifier',
        'challenge-hash',
        'commitments',
        'issuer',
      ],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'holder-knows-rate-limit-secret-for-window-scoped-nullifier',
    },
  };

  return {
    claim,
    privateProofSalt,
    localCacheKey: `anonymous-rate-limit:${await sha256Base64Url(stableStringify({
      scope,
      action,
      audience: audience || null,
      bucketNullifier: claim.nullifiers.bucketNullifier,
      requestNullifier: claim.nullifiers.requestNullifier,
      issuerId: input.issuerId,
    }))}`,
    signature: {
      algorithm: ANONYMOUS_RATE_LIMIT_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, signingPayload(claim)),
    },
  };
}

export function stripPrivateAnonymousRateLimitProofMaterial(
  envelope: AnonymousRateLimitProofEnvelope
): Omit<AnonymousRateLimitProofEnvelope, 'privateProofSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    signature: envelope.signature,
  };
}

function observedUsageFor(
  bucketNullifier: string,
  observed?: number | Map<string, number> | AnonymousRateLimitLedger
) {
  if (observed === undefined) return 0;
  if (typeof observed === 'number') return Math.max(0, Math.trunc(observed));
  const value = observed.get(bucketNullifier);
  if (typeof value === 'number') return Math.max(0, Math.trunc(value));
  if (value && typeof value === 'object' && 'count' in value) {
    return Math.max(0, Math.trunc(Number((value as AnonymousRateLimitLedgerEntry).count)));
  }
  return 0;
}

function registeredRequestSet(values?: Iterable<string>) {
  return new Set(Array.from(values ?? []).map(normalizeText).filter(Boolean));
}

async function verifyAnonymousRateLimitProofUnchecked(
  envelope: AnonymousRateLimitProofEnvelope,
  options: VerifyAnonymousRateLimitProofOptions = {}
): Promise<AnonymousRateLimitProofVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== ANONYMOUS_RATE_LIMIT_PROOF_VERSION) {
    errors.push('unsupported-anonymous-rate-limit-proof-version');
  }
  if (claim.nullifiers.algorithm !== ANONYMOUS_RATE_LIMIT_NULLIFIER_ALGORITHM) {
    errors.push('unsupported-nullifier-algorithm');
  }
  if (envelope.signature.algorithm !== ANONYMOUS_RATE_LIMIT_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-signature-algorithm');
  }
  if (options.issuerId && options.issuerId !== envelope.signature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedScope && normalizeToken(options.expectedScope) !== claim.scope) errors.push('scope-mismatch');
  if (options.expectedAction && normalizeToken(options.expectedAction) !== claim.action) errors.push('action-mismatch');
  if (options.expectedAudience && normalizeToken(options.expectedAudience) !== (claim.audience ?? '')) {
    errors.push('audience-mismatch');
  }
  if (options.expectedChallenge && await challengeHash(options.expectedChallenge) !== claim.challengeHash) {
    errors.push('challenge-mismatch');
  }
  if (options.maxRequestsPerWindow !== undefined && claim.window.maxRequests > options.maxRequestsPerWindow) {
    errors.push('quota-too-high');
  }

  const windowSeconds = Math.round(
    (new Date(claim.window.endsAt).getTime() - new Date(claim.window.startsAt).getTime()) / 1000
  );
  if (windowSeconds <= 0) errors.push('rate-limit-window-invalid');
  if (options.minWindowSeconds !== undefined && windowSeconds < options.minWindowSeconds) {
    errors.push('rate-limit-window-too-short');
  }
  if (options.maxWindowSeconds !== undefined && windowSeconds > options.maxWindowSeconds) {
    errors.push('rate-limit-window-too-long');
  }

  const now = options.now ? new Date(options.now) : new Date();
  const startsAt = new Date(claim.window.startsAt);
  const endsAt = new Date(claim.window.endsAt);
  const expiresAt = new Date(claim.expiresAt);
  const expired = expiresAt.getTime() <= now.getTime() || endsAt.getTime() <= now.getTime();
  const windowActive = startsAt.getTime() <= now.getTime() && now.getTime() < endsAt.getTime();
  if (expired) errors.push('anonymous-rate-limit-proof-expired');
  if (!windowActive && startsAt.getTime() > now.getTime()) errors.push('rate-limit-window-not-yet-active');
  if (!windowActive && endsAt.getTime() <= now.getTime()) errors.push('rate-limit-window-expired');

  const replay = registeredRequestSet(options.registeredRequestNullifiers).has(claim.nullifiers.requestNullifier);
  if (replay) errors.push('request-nullifier-replayed');

  const used = observedUsageFor(claim.nullifiers.bucketNullifier, options.observedBucketUsage);
  const quotaExceeded = used >= claim.window.maxRequests;
  if (quotaExceeded) errors.push('anonymous-rate-limit-exceeded');
  const remaining = Math.max(0, claim.window.maxRequests - used - 1);

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(options.issuerSecret, signingPayload(claim), envelope.signature.value);
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  const publicEnvelope = stripPrivateAnonymousRateLimitProofMaterial(envelope);
  const publicText = stableStringify(publicEnvelope);
  const privacyPreserved = !('privateProofSalt' in envelope)
    && !('localCacheKey' in envelope)
    && !('privateProofSalt' in publicEnvelope)
    && !('localCacheKey' in publicEnvelope)
    && !publicText.includes('"privateProofSalt"')
    && !publicText.includes('"localCacheKey"')
    && !publicText.includes('"subjectSecret"')
    && !publicText.includes('"holderSecret"')
    && !publicText.includes('"privateSecret"')
    && !publicText.includes('"privateSalt"')
    && !/"(?:subjectId|subjectRef|aoid|agid|pid|userId|deviceId|ipAddress|email|phone|recipient|unit|addressText)"\s*:/iu.test(publicText)
    && claim.privacy.hides.includes('subject-secret')
    && claim.privacy.hides.includes('subject-id')
    && claim.privacy.hides.includes('aoid')
    && claim.privacy.hides.includes('agid')
    && claim.privacy.hides.includes('pid')
    && claim.privacy.hides.includes('address')
    && claim.privacy.hides.includes('recipient')
    && claim.privacy.hides.includes('phone')
    && claim.privacy.hides.includes('device-id')
    && claim.privacy.hides.includes('ip-address')
    && claim.privacy.hides.includes('proof-salt');
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    valid: errors.length === 0 && signatureValid === true && windowActive && !quotaExceeded && !replay,
    signatureValid,
    expired,
    windowActive,
    quotaExceeded,
    replay,
    privacyPreserved,
    proofCost: 'none',
    remaining,
    errors,
    warnings,
  };
}

export async function verifyAnonymousRateLimitProof(
  envelope: AnonymousRateLimitProofEnvelope,
  options: VerifyAnonymousRateLimitProofOptions = {}
): Promise<AnonymousRateLimitProofVerificationResult> {
  try {
    return await verifyAnonymousRateLimitProofUnchecked(envelope, options);
  } catch {
    return {
      valid: false,
      signatureValid: null,
      expired: false,
      windowActive: false,
      quotaExceeded: false,
      replay: false,
      privacyPreserved: false,
      proofCost: 'none',
      remaining: null,
      errors: ['malformed-anonymous-rate-limit-proof'],
      warnings: ['verification-runtime-guarded'],
    };
  }
}

export async function registerAnonymousRateLimitProof(
  envelope: AnonymousRateLimitProofEnvelope,
  ledger: AnonymousRateLimitLedger,
  options: Omit<VerifyAnonymousRateLimitProofOptions, 'observedBucketUsage' | 'registeredRequestNullifiers'> = {}
): Promise<AnonymousRateLimitRegistrationResult> {
  const entry = ledger.get(envelope.claim.nullifiers.bucketNullifier) ?? {
    count: 0,
    requestNullifiers: new Set<string>(),
  };
  const verification = await verifyAnonymousRateLimitProof(envelope, {
    ...options,
    observedBucketUsage: ledger,
    registeredRequestNullifiers: entry.requestNullifiers,
  });

  if (verification.valid) {
    entry.count += 1;
    entry.requestNullifiers.add(envelope.claim.nullifiers.requestNullifier);
    ledger.set(envelope.claim.nullifiers.bucketNullifier, entry);
  }

  return {
    ...verification,
    registered: verification.valid,
    used: entry.count,
  };
}
