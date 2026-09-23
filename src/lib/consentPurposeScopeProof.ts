export const CONSENT_PURPOSE_SCOPE_PROOF_VERSION = 'consent-purpose-scope-proof-v1';
export const CONSENT_PURPOSE_SCOPE_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const CONSENT_PURPOSE_SCOPE_COMMITMENT_ALGORITHM = 'sha256-salted-consent-purpose-scope-v1';

export type ConsentSubjectKind =
  | 'AGID'
  | 'AOID'
  | 'PID'
  | 'ADDRESS_CREDENTIAL'
  | 'DEVICE'
  | 'USER';

export type ConsentPurpose =
  | 'address-verification'
  | 'delivery'
  | 'cloud-sync'
  | 'quality-assistance'
  | 'registration'
  | 'pid-issuance'
  | 'audit'
  | 'fraud-prevention'
  | 'support'
  | 'emergency'
  | 'research-analytics'
  | 'custom'
  | (string & {});

export type ConsentDataScope =
  | 'public-agid'
  | 'aoid-reference'
  | 'address-credential'
  | 'address-quality'
  | 'postal-evidence'
  | 'region-membership'
  | 'recipient-contact'
  | 'unit-delivery-detail'
  | 'history-update'
  | 'revocation-status'
  | 'custom'
  | (string & {});

export type ConsentPurposeScopePrivacyField =
  | 'consent-grant-body'
  | 'consent-grant-id'
  | 'consent-private-salt'
  | 'subject-ref'
  | 'aoid'
  | 'agid'
  | 'pid'
  | 'address'
  | 'recipient'
  | 'phone'
  | 'unit'
  | 'revocation-handle'
  | 'revocation-list-contents'
  | 'proof-salt';

export type ConsentPurposeScopeProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'holder-has-active-consent-for-purpose-and-data-scopes';
};

export type ConsentPurposeScopeGrantRule = {
  purpose: ConsentPurpose;
  dataScopes: ConsentDataScope[];
  expiresAt?: Date | string;
  maxProofTtlSeconds?: number;
};

export type ConsentPurposeScopeGrant = {
  id: string;
  issuerId: string;
  subjectKind: ConsentSubjectKind;
  subjectRef: string;
  allowedPurposeScopes: ConsentPurposeScopeGrantRule[];
  consentedAt: Date | string;
  expiresAt?: Date | string;
  revokedAt?: Date | string;
  policyVersion?: string;
  sourceIds?: string[];
  privateSalt?: string;
};

export type ConsentPurposeScopeRevocationHandles = {
  grantHash: string;
  subjectHash: string;
  receiptHash: string;
  issuerScopedHash: string;
};

export type ConsentPurposeScopeRevocationRegistrySnapshot = {
  id: string;
  version: string;
  checkedAt?: Date | string;
  freshUntil?: Date | string;
  sourceIds?: string[];
  rootCommitment?: string;
  revokedGrantHashes?: Iterable<string>;
  revokedSubjectHashes?: Iterable<string>;
  revokedReceiptHashes?: Iterable<string>;
  revokedIssuerScopedHashes?: Iterable<string>;
};

export type ConsentPurposeScopeClaim = {
  version: typeof CONSENT_PURPOSE_SCOPE_PROOF_VERSION;
  scope: string;
  challengeHash: string;
  issuedAt: string;
  expiresAt: string;
  subject: {
    kind: ConsentSubjectKind;
    subjectCommitment: string;
  };
  authorization: {
    status: 'authorized';
    consentIssuerId: string;
    purpose: string;
    dataScopes: string[];
    policyVersion?: string;
    grantExpiresAt?: string;
    ruleExpiresAt?: string;
  };
  revocation: {
    status: 'not-revoked';
    registryId: string;
    registryVersion: string;
    checkedAt: string;
    freshUntil: string;
    listRootCommitment: string;
    sourceIds: string[];
  };
  commitments: {
    grantCommitment: string;
    authorizationCommitment: string;
    revocationHandleCommitment: string;
  };
  privacy: {
    hides: ConsentPurposeScopePrivacyField[];
    reveals: Array<
      | 'subject-kind'
      | 'purpose'
      | 'data-scopes'
      | 'authorization-status'
      | 'consent-issuer'
      | 'policy-version'
      | 'consent-expiry-window'
      | 'registry-id'
      | 'registry-version'
      | 'revocation-status'
      | 'freshness-window'
      | 'challenge-hash'
      | 'commitments'
      | 'issuer'
    >;
  };
  proofHint: ConsentPurposeScopeProofHint;
};

export type ConsentPurposeScopeSignature = {
  algorithm: typeof CONSENT_PURPOSE_SCOPE_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type ConsentPurposeScopeProofEnvelope = {
  claim: ConsentPurposeScopeClaim;
  signature: ConsentPurposeScopeSignature;
  privateProofSalt?: string;
  localCacheKey?: string;
};

export type CreateConsentPurposeScopeProofInput = {
  issuerId: string;
  issuerSecret: string;
  grant: ConsentPurposeScopeGrant;
  revocationRegistry: ConsentPurposeScopeRevocationRegistrySnapshot;
  requestedPurpose: ConsentPurpose;
  requestedDataScopes: ConsentDataScope[];
  scope?: string;
  challenge?: string;
  issuedAt?: Date | string;
  freshnessSeconds?: number;
  ttlSeconds?: number;
  privateProofSalt?: string;
  consentPrivateSalt?: string;
};

export type VerifyConsentPurposeScopeProofOptions = {
  issuerId?: string;
  issuerSecret?: string;
  expectedScope?: string;
  expectedChallenge?: string;
  expectedSubjectKind?: ConsentSubjectKind;
  expectedConsentIssuerId?: string;
  expectedPurpose?: ConsentPurpose;
  requiredDataScopes?: ConsentDataScope[];
  trustedRegistryIds?: Iterable<string>;
  now?: Date | string;
  maxFreshnessAgeSeconds?: number;
};

export type ConsentPurposeScopeProofVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  stale: boolean;
  authorizedAsserted: boolean;
  notRevokedAsserted: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  errors: string[];
  warnings: string[];
};

const textEncoder = new TextEncoder();
const DEFAULT_FRESHNESS_SECONDS = 300;

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for consent purpose scope proofs.');
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
    .replace(/[^A-Z0-9:_.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeScope(value: unknown) {
  return normalizeToken(value) || 'CONSENT-PURPOSE-SCOPE';
}

function normalizeSubjectKind(value: unknown): ConsentSubjectKind {
  const kind = normalizeToken(value);
  if (
    kind === 'AGID'
    || kind === 'AOID'
    || kind === 'PID'
    || kind === 'ADDRESS_CREDENTIAL'
    || kind === 'DEVICE'
    || kind === 'USER'
  ) {
    return kind;
  }
  throw new Error('Consent purpose scope proof requires a supported subject kind.');
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

function minIsoDate(...values: Array<string | undefined>) {
  const times = values
    .filter((value): value is string => Boolean(value))
    .map(value => new Date(value).getTime())
    .filter(time => Number.isFinite(time));
  if (times.length === 0) return undefined;
  return new Date(Math.min(...times)).toISOString();
}

function generateProofSalt(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function normalizedSet(values: Iterable<unknown>) {
  return new Set(Array.from(values).map(normalizeToken).filter(Boolean));
}

function normalizedSortedTokens(values: Iterable<unknown>) {
  return Array.from(normalizedSet(values)).sort();
}

function normalizedSourceIds(values?: string[]) {
  return Array.from(new Set((values ?? []).map(normalizeText).filter(Boolean))).sort();
}

function normalizedHashSet(values?: Iterable<string>) {
  return new Set(Array.from(values ?? []).map(normalizeText).filter(Boolean));
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

function signingPayload(claim: ConsentPurposeScopeClaim) {
  return stableStringify(claim);
}

function isExpiredAt(value: Date | string | undefined, nowIso: string) {
  if (!value) return false;
  return new Date(value).getTime() <= new Date(nowIso).getTime();
}

function isRevokedAt(value: Date | string | undefined, nowIso: string) {
  if (!value) return false;
  return new Date(value).getTime() <= new Date(nowIso).getTime();
}

function findMatchingGrantRule(
  grant: ConsentPurposeScopeGrant,
  requestedPurpose: string,
  requestedDataScopes: string[],
  nowIso: string
) {
  return grant.allowedPurposeScopes.find(rule => {
    if (normalizeToken(rule.purpose) !== requestedPurpose) return false;
    if (isExpiredAt(rule.expiresAt, nowIso)) return false;

    const allowed = normalizedSet(rule.dataScopes);
    return requestedDataScopes.every(scope => allowed.has(scope));
  });
}

export async function deriveConsentPurposeScopeRevocationHandles(
  grant: ConsentPurposeScopeGrant
): Promise<ConsentPurposeScopeRevocationHandles> {
  const subjectKind = normalizeSubjectKind(grant.subjectKind);
  const grantHash = await sha256Base64Url(stableStringify({
    kind: 'consent-grant',
    issuerId: normalizeText(grant.issuerId),
    grantId: normalizeText(grant.id),
  }));
  const subjectHash = await sha256Base64Url(stableStringify({
    kind: 'consent-subject',
    issuerId: normalizeText(grant.issuerId),
    subjectKind,
    subjectRef: normalizeText(grant.subjectRef),
  }));
  const receiptHash = await sha256Base64Url(stableStringify({
    kind: 'consent-receipt',
    issuerId: normalizeText(grant.issuerId),
    grantId: normalizeText(grant.id),
    subjectKind,
    subjectRef: normalizeText(grant.subjectRef),
    consentedAt: toIsoDate(grant.consentedAt),
  }));
  const issuerScopedHash = await sha256Base64Url(stableStringify({
    kind: 'issuer-scoped-consent-grant',
    issuerId: normalizeText(grant.issuerId),
    grantHash,
  }));

  return {
    grantHash,
    subjectHash,
    receiptHash,
    issuerScopedHash,
  };
}

async function challengeHash(challenge: string) {
  return sha256Base64Url(stableStringify({
    algorithm: CONSENT_PURPOSE_SCOPE_COMMITMENT_ALGORITHM,
    kind: 'challenge',
    challenge,
  }));
}

async function subjectCommitment(input: {
  subjectKind: ConsentSubjectKind;
  subjectRef: string;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: CONSENT_PURPOSE_SCOPE_COMMITMENT_ALGORITHM,
    kind: 'subject',
    subjectKind: input.subjectKind,
    subjectRef: input.subjectRef,
    scope: input.scope,
    salt: input.salt,
  }));
}

async function grantCommitment(input: {
  grant: ConsentPurposeScopeGrant;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: CONSENT_PURPOSE_SCOPE_COMMITMENT_ALGORITHM,
    kind: 'grant',
    scope: input.scope,
    salt: input.salt,
    grant: input.grant,
  }));
}

async function authorizationCommitment(input: {
  grant: ConsentPurposeScopeGrant;
  consentPrivateSalt: string;
  requestedPurpose: string;
  requestedDataScopes: string[];
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: CONSENT_PURPOSE_SCOPE_COMMITMENT_ALGORITHM,
    kind: 'purpose-scope-authorization',
    grantId: input.grant.id,
    subjectKind: input.grant.subjectKind,
    subjectRef: input.grant.subjectRef,
    requestedPurpose: input.requestedPurpose,
    requestedDataScopes: input.requestedDataScopes,
    consentPrivateSalt: input.consentPrivateSalt,
    scope: input.scope,
    salt: input.salt,
  }));
}

async function revocationHandleCommitment(input: {
  handles: ConsentPurposeScopeRevocationHandles;
  registryId: string;
  registryVersion: string;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: CONSENT_PURPOSE_SCOPE_COMMITMENT_ALGORITHM,
    kind: 'revocation-handle',
    registryId: input.registryId,
    registryVersion: input.registryVersion,
    scope: input.scope,
    salt: input.salt,
    handles: input.handles,
  }));
}

async function revocationListRootCommitment(input: {
  registry: ConsentPurposeScopeRevocationRegistrySnapshot;
  registryId: string;
  registryVersion: string;
}) {
  const providedRoot = normalizeText(input.registry.rootCommitment);
  if (providedRoot) return providedRoot;

  return sha256Base64Url(stableStringify({
    algorithm: CONSENT_PURPOSE_SCOPE_COMMITMENT_ALGORITHM,
    kind: 'consent-revocation-list-root',
    registryId: input.registryId,
    registryVersion: input.registryVersion,
    sourceIds: normalizedSourceIds(input.registry.sourceIds),
    revokedGrantHashes: Array.from(normalizedHashSet(input.registry.revokedGrantHashes)).sort(),
    revokedSubjectHashes: Array.from(normalizedHashSet(input.registry.revokedSubjectHashes)).sort(),
    revokedReceiptHashes: Array.from(normalizedHashSet(input.registry.revokedReceiptHashes)).sort(),
    revokedIssuerScopedHashes: Array.from(normalizedHashSet(input.registry.revokedIssuerScopedHashes)).sort(),
  }));
}

function assertRegistryNotRevoked(
  handles: ConsentPurposeScopeRevocationHandles,
  registry: ConsentPurposeScopeRevocationRegistrySnapshot
) {
  const revokedGrantHashes = normalizedHashSet(registry.revokedGrantHashes);
  const revokedSubjectHashes = normalizedHashSet(registry.revokedSubjectHashes);
  const revokedReceiptHashes = normalizedHashSet(registry.revokedReceiptHashes);
  const revokedIssuerScopedHashes = normalizedHashSet(registry.revokedIssuerScopedHashes);

  if (revokedGrantHashes.has(handles.grantHash)) {
    throw new Error('Consent purpose scope proof cannot be issued for a revoked consent grant.');
  }
  if (revokedSubjectHashes.has(handles.subjectHash)) {
    throw new Error('Consent purpose scope proof cannot be issued for a revoked consent subject.');
  }
  if (revokedReceiptHashes.has(handles.receiptHash)) {
    throw new Error('Consent purpose scope proof cannot be issued for a revoked consent receipt.');
  }
  if (revokedIssuerScopedHashes.has(handles.issuerScopedHash)) {
    throw new Error('Consent purpose scope proof cannot be issued for a revoked issuer-scoped consent grant.');
  }
}

export async function createConsentPurposeScopeProof(
  input: CreateConsentPurposeScopeProofInput
): Promise<ConsentPurposeScopeProofEnvelope> {
  const registryId = normalizeScope(input.revocationRegistry.id);
  const registryVersion = normalizeText(input.revocationRegistry.version);
  if (!registryId) throw new Error('Consent purpose scope proof requires a revocation registry id.');
  if (!registryVersion) throw new Error('Consent purpose scope proof requires a revocation registry version.');

  const subjectKind = normalizeSubjectKind(input.grant.subjectKind);
  const grantId = normalizeText(input.grant.id);
  const consentIssuerId = normalizeText(input.grant.issuerId);
  const subjectRef = normalizeText(input.grant.subjectRef);
  if (!grantId) throw new Error('Consent purpose scope proof requires a consent grant id.');
  if (!consentIssuerId) throw new Error('Consent purpose scope proof requires a consent issuer id.');
  if (!subjectRef) throw new Error('Consent purpose scope proof requires a consent subject reference.');
  if (!input.grant.allowedPurposeScopes.length) {
    throw new Error('Consent purpose scope proof requires at least one allowed purpose scope.');
  }

  const requestedPurpose = normalizeToken(input.requestedPurpose);
  const requestedDataScopes = normalizedSortedTokens(input.requestedDataScopes);
  if (!requestedPurpose) throw new Error('Consent purpose scope proof requires a requested purpose.');
  if (requestedDataScopes.length === 0) {
    throw new Error('Consent purpose scope proof requires at least one requested data scope.');
  }

  const scope = normalizeScope(input.scope);
  const challenge = normalizeText(input.challenge) || generateProofSalt(16);
  const checkedAt = toIsoDate(input.revocationRegistry.checkedAt ?? input.issuedAt);
  const issuedAt = toIsoDate(input.issuedAt ?? checkedAt);
  const freshnessSeconds = input.freshnessSeconds ?? DEFAULT_FRESHNESS_SECONDS;
  const registryFreshUntil = input.revocationRegistry.freshUntil
    ? toIsoDate(input.revocationRegistry.freshUntil)
    : addSeconds(checkedAt, freshnessSeconds);
  const freshUntil = minIsoDate(registryFreshUntil, addSeconds(checkedAt, freshnessSeconds)) ?? registryFreshUntil;
  const privateProofSalt = input.privateProofSalt ?? generateProofSalt();
  const consentPrivateSalt = input.consentPrivateSalt ?? input.grant.privateSalt;
  if (!consentPrivateSalt) {
    throw new Error('Consent purpose scope proof requires the consent private salt for local witness binding.');
  }

  if (isExpiredAt(input.grant.expiresAt, issuedAt)) {
    throw new Error('Consent purpose scope proof cannot be issued for an expired consent grant.');
  }
  if (isRevokedAt(input.grant.revokedAt, issuedAt)) {
    throw new Error('Consent purpose scope proof cannot be issued for a locally revoked consent grant.');
  }

  const matchingRule = findMatchingGrantRule(input.grant, requestedPurpose, requestedDataScopes, issuedAt);
  if (!matchingRule) {
    throw new Error('Consent purpose scope proof requested purpose or data scope is not covered by the consent grant.');
  }

  const handles = await deriveConsentPurposeScopeRevocationHandles(input.grant);
  assertRegistryNotRevoked(handles, input.revocationRegistry);

  const listRootCommitment = await revocationListRootCommitment({
    registry: input.revocationRegistry,
    registryId,
    registryVersion,
  });

  const grantExpiresAt = input.grant.expiresAt ? toIsoDate(input.grant.expiresAt) : undefined;
  const ruleExpiresAt = matchingRule.expiresAt ? toIsoDate(matchingRule.expiresAt) : undefined;
  const maxProofTtlSeconds = matchingRule.maxProofTtlSeconds ?? input.ttlSeconds;
  const expiresAt = minIsoDate(
    maxProofTtlSeconds ? addSeconds(issuedAt, maxProofTtlSeconds) : undefined,
    input.ttlSeconds ? addSeconds(issuedAt, input.ttlSeconds) : undefined,
    grantExpiresAt,
    ruleExpiresAt,
    freshUntil
  ) ?? freshUntil;

  const reveals: ConsentPurposeScopeClaim['privacy']['reveals'] = [
    'subject-kind',
    'purpose',
    'data-scopes',
    'authorization-status',
    'consent-issuer',
    'registry-id',
    'registry-version',
    'revocation-status',
    'freshness-window',
    'challenge-hash',
    'commitments',
    'issuer',
  ];
  if (input.grant.policyVersion) reveals.push('policy-version');
  if (grantExpiresAt || ruleExpiresAt) reveals.push('consent-expiry-window');

  const claim: ConsentPurposeScopeClaim = {
    version: CONSENT_PURPOSE_SCOPE_PROOF_VERSION,
    scope,
    challengeHash: await challengeHash(challenge),
    issuedAt,
    expiresAt,
    subject: {
      kind: subjectKind,
      subjectCommitment: await subjectCommitment({
        subjectKind,
        subjectRef,
        scope,
        salt: privateProofSalt,
      }),
    },
    authorization: {
      status: 'authorized',
      consentIssuerId,
      purpose: requestedPurpose,
      dataScopes: requestedDataScopes,
      ...(input.grant.policyVersion ? { policyVersion: input.grant.policyVersion } : {}),
      ...(grantExpiresAt ? { grantExpiresAt } : {}),
      ...(ruleExpiresAt ? { ruleExpiresAt } : {}),
    },
    revocation: {
      status: 'not-revoked',
      registryId,
      registryVersion,
      checkedAt,
      freshUntil,
      listRootCommitment,
      sourceIds: normalizedSourceIds(input.revocationRegistry.sourceIds),
    },
    commitments: {
      grantCommitment: await grantCommitment({
        grant: input.grant,
        scope,
        salt: privateProofSalt,
      }),
      authorizationCommitment: await authorizationCommitment({
        grant: input.grant,
        consentPrivateSalt,
        requestedPurpose,
        requestedDataScopes,
        scope,
        salt: privateProofSalt,
      }),
      revocationHandleCommitment: await revocationHandleCommitment({
        handles,
        registryId,
        registryVersion,
        scope,
        salt: privateProofSalt,
      }),
    },
    privacy: {
      hides: [
        'consent-grant-body',
        'consent-grant-id',
        'consent-private-salt',
        'subject-ref',
        'aoid',
        'agid',
        'pid',
        'address',
        'recipient',
        'phone',
        'unit',
        'revocation-handle',
        'revocation-list-contents',
        'proof-salt',
      ],
      reveals,
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'holder-has-active-consent-for-purpose-and-data-scopes',
    },
  };

  return {
    claim,
    privateProofSalt,
    localCacheKey: `consent-purpose-scope:${await sha256Base64Url(stableStringify({
      scope,
      challengeHash: claim.challengeHash,
      subjectKind,
      purpose: requestedPurpose,
      dataScopes: requestedDataScopes,
      grantCommitment: claim.commitments.grantCommitment,
      authorizationCommitment: claim.commitments.authorizationCommitment,
      registryId,
      registryVersion,
      issuerId: input.issuerId,
    }))}`,
    signature: {
      algorithm: CONSENT_PURPOSE_SCOPE_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, signingPayload(claim)),
    },
  };
}

export function stripPrivateConsentPurposeScopeProofMaterial(
  envelope: ConsentPurposeScopeProofEnvelope
): Omit<ConsentPurposeScopeProofEnvelope, 'privateProofSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    signature: envelope.signature,
  };
}

async function verifyConsentPurposeScopeProofUnchecked(
  envelope: ConsentPurposeScopeProofEnvelope,
  options: VerifyConsentPurposeScopeProofOptions = {}
): Promise<ConsentPurposeScopeProofVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== CONSENT_PURPOSE_SCOPE_PROOF_VERSION) {
    errors.push('unsupported-consent-purpose-scope-proof-version');
  }
  if (envelope.signature.algorithm !== CONSENT_PURPOSE_SCOPE_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-signature-algorithm');
  }
  if (options.issuerId && options.issuerId !== envelope.signature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedScope && normalizeScope(options.expectedScope) !== claim.scope) errors.push('scope-mismatch');
  if (options.expectedSubjectKind && normalizeSubjectKind(options.expectedSubjectKind) !== claim.subject.kind) {
    errors.push('subject-kind-mismatch');
  }
  if (options.expectedConsentIssuerId && normalizeText(options.expectedConsentIssuerId) !== claim.authorization.consentIssuerId) {
    errors.push('consent-issuer-mismatch');
  }
  if (options.expectedPurpose && normalizeToken(options.expectedPurpose) !== claim.authorization.purpose) {
    errors.push('purpose-mismatch');
  }
  if (options.requiredDataScopes) {
    const provedScopes = normalizedSet(claim.authorization.dataScopes);
    const missing = normalizedSortedTokens(options.requiredDataScopes).filter(scope => !provedScopes.has(scope));
    if (missing.length > 0) errors.push('data-scope-missing');
  }
  if (options.expectedChallenge && await challengeHash(options.expectedChallenge) !== claim.challengeHash) {
    errors.push('challenge-mismatch');
  }
  if (options.trustedRegistryIds) {
    const trusted = new Set(Array.from(options.trustedRegistryIds).map(normalizeScope));
    if (!trusted.has(claim.revocation.registryId)) errors.push('revocation-registry-not-trusted');
  }

  const now = options.now ? new Date(options.now) : new Date();
  const expiresAt = new Date(claim.expiresAt);
  const freshUntil = new Date(claim.revocation.freshUntil);
  const checkedAt = new Date(claim.revocation.checkedAt);
  const expired = expiresAt.getTime() <= now.getTime();
  const freshnessWindowExpired = freshUntil.getTime() <= now.getTime();
  const tooOld = options.maxFreshnessAgeSeconds !== undefined
    && now.getTime() - checkedAt.getTime() > options.maxFreshnessAgeSeconds * 1000;
  const stale = freshnessWindowExpired || tooOld;

  if (expired) errors.push('consent-purpose-scope-proof-expired');
  if (freshnessWindowExpired) errors.push('freshness-window-expired');
  if (tooOld) errors.push('freshness-check-too-old');
  if (checkedAt.getTime() > now.getTime() + 30_000) errors.push('freshness-check-in-future');
  if (freshUntil.getTime() < checkedAt.getTime()) errors.push('freshness-window-invalid');
  if (claim.authorization.grantExpiresAt && new Date(claim.authorization.grantExpiresAt).getTime() <= now.getTime()) {
    errors.push('consent-grant-expired');
  }
  if (claim.authorization.ruleExpiresAt && new Date(claim.authorization.ruleExpiresAt).getTime() <= now.getTime()) {
    errors.push('consent-rule-expired');
  }

  const authorizedAsserted = claim.authorization.status === 'authorized';
  if (!authorizedAsserted) errors.push('authorization-not-asserted');
  const notRevokedAsserted = claim.revocation.status === 'not-revoked';
  if (!notRevokedAsserted) errors.push('not-revoked-not-asserted');

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(options.issuerSecret, signingPayload(claim), envelope.signature.value);
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  const publicEnvelope = stripPrivateConsentPurposeScopeProofMaterial(envelope);
  const publicText = stableStringify(publicEnvelope);
  const privacyPreserved = !('privateProofSalt' in envelope)
    && !('localCacheKey' in envelope)
    && !('privateProofSalt' in publicEnvelope)
    && !('localCacheKey' in publicEnvelope)
    && !publicText.includes('"privateProofSalt"')
    && !publicText.includes('"localCacheKey"')
    && !publicText.includes('"privateSalt"')
    && !publicText.includes('"consentPrivateSalt"')
    && !/"(?:id|grantId|subjectRef|revokedGrantHashes|revokedSubjectHashes|revokedReceiptHashes|revokedIssuerScopedHashes)"\s*:/u.test(publicText)
    && !/"(?:recipient|phone|unit|address|aoid|agid|pid)"\s*:/iu.test(publicText)
    && claim.privacy.hides.includes('consent-grant-body')
    && claim.privacy.hides.includes('consent-grant-id')
    && claim.privacy.hides.includes('consent-private-salt')
    && claim.privacy.hides.includes('subject-ref')
    && claim.privacy.hides.includes('address')
    && claim.privacy.hides.includes('recipient')
    && claim.privacy.hides.includes('phone')
    && claim.privacy.hides.includes('unit')
    && claim.privacy.hides.includes('revocation-handle')
    && claim.privacy.hides.includes('revocation-list-contents')
    && claim.privacy.hides.includes('proof-salt');
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    valid: errors.length === 0 && signatureValid === true && authorizedAsserted && notRevokedAsserted && !stale,
    signatureValid,
    expired,
    stale,
    authorizedAsserted,
    notRevokedAsserted,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}

export async function verifyConsentPurposeScopeProof(
  envelope: ConsentPurposeScopeProofEnvelope,
  options: VerifyConsentPurposeScopeProofOptions = {}
): Promise<ConsentPurposeScopeProofVerificationResult> {
  try {
    return await verifyConsentPurposeScopeProofUnchecked(envelope, options);
  } catch {
    return {
      valid: false,
      signatureValid: null,
      expired: false,
      stale: true,
      authorizedAsserted: false,
      notRevokedAsserted: false,
      privacyPreserved: false,
      proofCost: 'none',
      errors: ['malformed-consent-purpose-scope-proof'],
      warnings: ['verification-runtime-guarded'],
    };
  }
}
