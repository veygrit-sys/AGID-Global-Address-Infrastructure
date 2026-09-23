import {
  verifyAddressCredential,
  type AddressCredentialEnvelope,
  type AddressCredentialLayer,
  type AddressCredentialQualityBand,
} from './addressCredential';
import type { AddressVerificationStatus } from './addressVerificationEngine';

export const ADDRESS_CREDENTIAL_FRESHNESS_PROOF_VERSION = 'address-credential-freshness-proof-v1';
export const ADDRESS_CREDENTIAL_FRESHNESS_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const ADDRESS_CREDENTIAL_FRESHNESS_COMMITMENT_ALGORITHM = 'sha256-salted-credential-freshness-v1';

export type AddressCredentialFreshnessPrivacyField =
  | 'credential-body'
  | 'credential-subject'
  | 'address'
  | 'postal-code'
  | 'address-commitment'
  | 'credential-private-salt'
  | 'revocation-handle'
  | 'revocation-list-contents'
  | 'freshness-proof-salt';

export type AddressCredentialFreshnessProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'holder-has-unexpired-non-revoked-address-credential';
};

export type AddressCredentialRevocationHandles = {
  credentialHash: string;
  subjectHash: string;
  addressCommitmentHash: string;
  issuerScopedHash: string;
};

export type AddressCredentialRevocationRegistrySnapshot = {
  id: string;
  version: string;
  checkedAt?: Date | string;
  freshUntil?: Date | string;
  sourceIds?: string[];
  rootCommitment?: string;
  revokedCredentialHashes?: Iterable<string>;
  revokedSubjectHashes?: Iterable<string>;
  revokedAddressCommitmentHashes?: Iterable<string>;
  revokedIssuerScopedHashes?: Iterable<string>;
};

export type AddressCredentialFreshnessClaim = {
  version: typeof ADDRESS_CREDENTIAL_FRESHNESS_PROOF_VERSION;
  scope: string;
  challengeHash: string;
  issuedAt: string;
  expiresAt: string;
  credential: {
    issuerId: string;
    layer: AddressCredentialLayer;
    countryCode: string | null;
    qualityBand: AddressCredentialQualityBand;
    verificationStatus: AddressVerificationStatus;
    scoreFloor: number;
    policyVersion?: string;
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
    credentialCommitment: string;
    possessionCommitment: string;
    revocationHandleCommitment: string;
  };
  privacy: {
    hides: AddressCredentialFreshnessPrivacyField[];
    reveals: Array<
      | 'credential-issuer'
      | 'credential-layer'
      | 'credential-quality'
      | 'registry-id'
      | 'registry-version'
      | 'revocation-status'
      | 'freshness-window'
      | 'challenge-hash'
      | 'commitments'
      | 'issuer'
    >;
  };
  proofHint: AddressCredentialFreshnessProofHint;
};

export type AddressCredentialFreshnessSignature = {
  algorithm: typeof ADDRESS_CREDENTIAL_FRESHNESS_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type AddressCredentialFreshnessProofEnvelope = {
  claim: AddressCredentialFreshnessClaim;
  signature: AddressCredentialFreshnessSignature;
  privateProofSalt?: string;
  localCacheKey?: string;
};

export type CreateAddressCredentialFreshnessProofInput = {
  issuerId: string;
  issuerSecret: string;
  credential: AddressCredentialEnvelope;
  revocationRegistry: AddressCredentialRevocationRegistrySnapshot;
  credentialIssuerSecret?: string;
  credentialPrivateSalt?: string;
  scope?: string;
  challenge?: string;
  issuedAt?: Date | string;
  freshnessSeconds?: number;
  ttlSeconds?: number;
  privateProofSalt?: string;
  minimumCredentialScore?: number;
  allowedCredentialStatuses?: AddressVerificationStatus[];
  expectedLayer?: AddressCredentialLayer;
};

export type VerifyAddressCredentialFreshnessProofOptions = {
  issuerId?: string;
  issuerSecret?: string;
  expectedScope?: string;
  expectedChallenge?: string;
  expectedCredentialIssuerId?: string;
  expectedLayer?: AddressCredentialLayer;
  trustedRegistryIds?: Iterable<string>;
  minimumCredentialScore?: number;
  allowedCredentialStatuses?: AddressVerificationStatus[];
  now?: Date | string;
  maxFreshnessAgeSeconds?: number;
};

export type AddressCredentialFreshnessProofVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  stale: boolean;
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
    throw new Error('Web Crypto API is required for address credential freshness proofs.');
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

function normalizeScope(value: unknown) {
  return (normalizeText(value) || 'ADDRESS-CREDENTIAL-FRESHNESS').toUpperCase();
}

function normalizeRegistryId(value: unknown) {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9:_.-]+/g, '-').replace(/^-+|-+$/g, '');
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

function minIsoDate(...values: string[]) {
  return new Date(Math.min(...values.map(value => new Date(value).getTime()))).toISOString();
}

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(1, score));
}

function scoreFloor(score: number) {
  return Math.floor(clampScore(score) * 100) / 100;
}

function generateProofSalt(byteLength = 32) {
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

function signingPayload(claim: AddressCredentialFreshnessClaim) {
  return stableStringify(claim);
}

function normalizedHashSet(values?: Iterable<string>) {
  return new Set(Array.from(values ?? []).map(normalizeText).filter(Boolean));
}

function normalizedSourceIds(values?: string[]) {
  return Array.from(new Set((values ?? []).map(normalizeText).filter(Boolean))).sort();
}

function credentialExpiredAt(credential: AddressCredentialEnvelope, nowIso: string) {
  return Boolean(
    credential.claim.expiresAt
      && new Date(credential.claim.expiresAt).getTime() <= new Date(nowIso).getTime()
  );
}

export async function deriveAddressCredentialRevocationHandles(
  credential: AddressCredentialEnvelope
): Promise<AddressCredentialRevocationHandles> {
  const credentialHash = await sha256Base64Url(stableStringify({
    kind: 'credential',
    claim: credential.claim,
    signature: credential.signature,
  }));
  const subjectHash = await sha256Base64Url(stableStringify({
    kind: 'credential-subject',
    issuerId: credential.signature.issuerId,
    subjectId: credential.claim.subjectId,
  }));
  const addressCommitmentHash = await sha256Base64Url(stableStringify({
    kind: 'address-commitment',
    issuerId: credential.signature.issuerId,
    addressCommitment: credential.claim.addressCommitment,
  }));
  const issuerScopedHash = await sha256Base64Url(stableStringify({
    kind: 'issuer-scoped-credential',
    issuerId: credential.signature.issuerId,
    credentialHash,
  }));

  return {
    credentialHash,
    subjectHash,
    addressCommitmentHash,
    issuerScopedHash,
  };
}

async function revocationHandleCommitment(input: {
  handles: AddressCredentialRevocationHandles;
  registryId: string;
  registryVersion: string;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: ADDRESS_CREDENTIAL_FRESHNESS_COMMITMENT_ALGORITHM,
    kind: 'revocation-handle',
    registryId: input.registryId,
    registryVersion: input.registryVersion,
    scope: input.scope,
    salt: input.salt,
    handles: input.handles,
  }));
}

async function credentialCommitment(input: {
  credential: AddressCredentialEnvelope;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: ADDRESS_CREDENTIAL_FRESHNESS_COMMITMENT_ALGORITHM,
    kind: 'credential',
    scope: input.scope,
    salt: input.salt,
    claim: input.credential.claim,
    signature: input.credential.signature,
  }));
}

async function possessionCommitment(input: {
  credential: AddressCredentialEnvelope;
  credentialPrivateSalt: string;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: ADDRESS_CREDENTIAL_FRESHNESS_COMMITMENT_ALGORITHM,
    kind: 'credential-possession',
    scope: input.scope,
    salt: input.salt,
    subjectId: input.credential.claim.subjectId,
    addressCommitment: input.credential.claim.addressCommitment,
    credentialPrivateSalt: input.credentialPrivateSalt,
  }));
}

async function challengeHash(challenge: string) {
  return sha256Base64Url(stableStringify({
    algorithm: ADDRESS_CREDENTIAL_FRESHNESS_COMMITMENT_ALGORITHM,
    kind: 'challenge',
    challenge,
  }));
}

async function revocationListRootCommitment(input: {
  registry: AddressCredentialRevocationRegistrySnapshot;
  registryId: string;
  registryVersion: string;
}) {
  const providedRoot = normalizeText(input.registry.rootCommitment);
  if (providedRoot) return providedRoot;

  return sha256Base64Url(stableStringify({
    algorithm: ADDRESS_CREDENTIAL_FRESHNESS_COMMITMENT_ALGORITHM,
    kind: 'revocation-list-root',
    registryId: input.registryId,
    registryVersion: input.registryVersion,
    sourceIds: normalizedSourceIds(input.registry.sourceIds),
    revokedCredentialHashes: Array.from(normalizedHashSet(input.registry.revokedCredentialHashes)).sort(),
    revokedSubjectHashes: Array.from(normalizedHashSet(input.registry.revokedSubjectHashes)).sort(),
    revokedAddressCommitmentHashes: Array.from(normalizedHashSet(input.registry.revokedAddressCommitmentHashes)).sort(),
    revokedIssuerScopedHashes: Array.from(normalizedHashSet(input.registry.revokedIssuerScopedHashes)).sort(),
  }));
}

export async function buildAddressCredentialRevocationRootCommitment(
  registry: AddressCredentialRevocationRegistrySnapshot
): Promise<string> {
  const registryId = normalizeRegistryId(registry.id);
  const registryVersion = normalizeText(registry.version);
  if (!registryId) throw new Error('Address credential revocation root requires a registry id.');
  if (!registryVersion) throw new Error('Address credential revocation root requires a registry version.');

  return revocationListRootCommitment({
    registry,
    registryId,
    registryVersion,
  });
}

function assertRegistryNotRevoked(
  handles: AddressCredentialRevocationHandles,
  registry: AddressCredentialRevocationRegistrySnapshot
) {
  const revokedCredentialHashes = normalizedHashSet(registry.revokedCredentialHashes);
  const revokedSubjectHashes = normalizedHashSet(registry.revokedSubjectHashes);
  const revokedAddressCommitmentHashes = normalizedHashSet(registry.revokedAddressCommitmentHashes);
  const revokedIssuerScopedHashes = normalizedHashSet(registry.revokedIssuerScopedHashes);

  if (revokedCredentialHashes.has(handles.credentialHash)) {
    throw new Error('Address credential freshness proof cannot be issued for a revoked credential.');
  }
  if (revokedSubjectHashes.has(handles.subjectHash)) {
    throw new Error('Address credential freshness proof cannot be issued for a revoked credential subject.');
  }
  if (revokedAddressCommitmentHashes.has(handles.addressCommitmentHash)) {
    throw new Error('Address credential freshness proof cannot be issued for a revoked address commitment.');
  }
  if (revokedIssuerScopedHashes.has(handles.issuerScopedHash)) {
    throw new Error('Address credential freshness proof cannot be issued for a revoked issuer-scoped credential.');
  }
}

export async function createAddressCredentialFreshnessProof(
  input: CreateAddressCredentialFreshnessProofInput
): Promise<AddressCredentialFreshnessProofEnvelope> {
  const registryId = normalizeRegistryId(input.revocationRegistry.id);
  const registryVersion = normalizeText(input.revocationRegistry.version);
  if (!registryId) throw new Error('Address credential freshness proof requires a revocation registry id.');
  if (!registryVersion) throw new Error('Address credential freshness proof requires a revocation registry version.');

  const scope = normalizeScope(input.scope);
  const challenge = normalizeText(input.challenge) || generateProofSalt(16);
  const checkedAt = toIsoDate(input.revocationRegistry.checkedAt ?? input.issuedAt);
  const issuedAt = toIsoDate(input.issuedAt ?? checkedAt);
  const freshnessSeconds = input.freshnessSeconds ?? DEFAULT_FRESHNESS_SECONDS;
  const registryFreshUntil = input.revocationRegistry.freshUntil
    ? toIsoDate(input.revocationRegistry.freshUntil)
    : addSeconds(checkedAt, freshnessSeconds);
  const localFreshUntil = addSeconds(checkedAt, freshnessSeconds);
  const freshUntil = minIsoDate(registryFreshUntil, localFreshUntil);
  const expiresAt = input.ttlSeconds
    ? minIsoDate(addSeconds(issuedAt, input.ttlSeconds), freshUntil)
    : freshUntil;
  const privateProofSalt = input.privateProofSalt ?? generateProofSalt();
  const credentialPrivateSalt = input.credentialPrivateSalt ?? input.credential.privateSalt;
  const warnings: string[] = [];

  if (!credentialPrivateSalt) {
    throw new Error('Address credential freshness proof requires the credential private salt for possession binding.');
  }

  const minimumScore = input.minimumCredentialScore ?? 0;
  const allowedCredentialStatuses = input.allowedCredentialStatuses ?? ['verified', 'partial'];
  const expectedLayer = input.expectedLayer ?? input.credential.claim.layer;

  if (credentialExpiredAt(input.credential, checkedAt)) {
    throw new Error('Address credential freshness proof cannot be issued for an expired credential.');
  }
  if (input.credential.claim.verificationScore < minimumScore) {
    throw new Error('Address credential freshness proof credential score is below the required minimum.');
  }
  if (!allowedCredentialStatuses.includes(input.credential.claim.verificationStatus)) {
    throw new Error('Address credential freshness proof credential status is not allowed.');
  }
  if (input.credential.claim.layer !== expectedLayer) {
    throw new Error('Address credential freshness proof credential layer does not match the expected layer.');
  }

  if (input.credentialIssuerSecret) {
    const credentialCheck = await verifyAddressCredential(input.credential, {
      issuerSecret: input.credentialIssuerSecret,
      issuerId: input.credential.signature.issuerId,
      expectedLayer,
      minimumScore,
      allowedStatuses: allowedCredentialStatuses,
      now: checkedAt,
    });
    if (!credentialCheck.valid) {
      throw new Error(`Address credential freshness proof credential check failed: ${credentialCheck.errors.join(', ')}`);
    }
  } else {
    warnings.push('credential-signature-not-checked');
  }

  const handles = await deriveAddressCredentialRevocationHandles(input.credential);
  assertRegistryNotRevoked(handles, input.revocationRegistry);

  const listRootCommitment = await revocationListRootCommitment({
    registry: input.revocationRegistry,
    registryId,
    registryVersion,
  });

  const claim: AddressCredentialFreshnessClaim = {
    version: ADDRESS_CREDENTIAL_FRESHNESS_PROOF_VERSION,
    scope,
    challengeHash: await challengeHash(challenge),
    issuedAt,
    expiresAt,
    credential: {
      issuerId: input.credential.signature.issuerId,
      layer: input.credential.claim.layer,
      countryCode: input.credential.claim.countryCode,
      qualityBand: input.credential.claim.qualityBand,
      verificationStatus: input.credential.claim.verificationStatus,
      scoreFloor: scoreFloor(input.credential.claim.verificationScore),
      ...(input.credential.claim.policyVersion ? { policyVersion: input.credential.claim.policyVersion } : {}),
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
      credentialCommitment: await credentialCommitment({
        credential: input.credential,
        scope,
        salt: privateProofSalt,
      }),
      possessionCommitment: await possessionCommitment({
        credential: input.credential,
        credentialPrivateSalt,
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
        'credential-body',
        'credential-subject',
        'address',
        'postal-code',
        'address-commitment',
        'credential-private-salt',
        'revocation-handle',
        'revocation-list-contents',
        'freshness-proof-salt',
      ],
      reveals: [
        'credential-issuer',
        'credential-layer',
        'credential-quality',
        'registry-id',
        'registry-version',
        'revocation-status',
        'freshness-window',
        'challenge-hash',
        'commitments',
        'issuer',
      ],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'holder-has-unexpired-non-revoked-address-credential',
    },
  };

  return {
    claim,
    privateProofSalt,
    localCacheKey: `address-credential-freshness:${await sha256Base64Url(stableStringify({
      scope,
      challengeHash: claim.challengeHash,
      credentialCommitment: claim.commitments.credentialCommitment,
      revocationHandleCommitment: claim.commitments.revocationHandleCommitment,
      registryId,
      registryVersion,
      issuerId: input.issuerId,
    }))}`,
    signature: {
      algorithm: ADDRESS_CREDENTIAL_FRESHNESS_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, signingPayload(claim)),
    },
  };
}

export function stripPrivateAddressCredentialFreshnessProofMaterial(
  envelope: AddressCredentialFreshnessProofEnvelope
): Omit<AddressCredentialFreshnessProofEnvelope, 'privateProofSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    signature: envelope.signature,
  };
}

async function verifyAddressCredentialFreshnessProofUnchecked(
  envelope: AddressCredentialFreshnessProofEnvelope,
  options: VerifyAddressCredentialFreshnessProofOptions = {}
): Promise<AddressCredentialFreshnessProofVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== ADDRESS_CREDENTIAL_FRESHNESS_PROOF_VERSION) {
    errors.push('unsupported-freshness-proof-version');
  }
  if (envelope.signature.algorithm !== ADDRESS_CREDENTIAL_FRESHNESS_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-signature-algorithm');
  }
  if (options.issuerId && options.issuerId !== envelope.signature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedScope && normalizeScope(options.expectedScope) !== claim.scope) errors.push('scope-mismatch');
  if (options.expectedCredentialIssuerId && options.expectedCredentialIssuerId !== claim.credential.issuerId) {
    errors.push('credential-issuer-mismatch');
  }
  if (options.expectedLayer && options.expectedLayer !== claim.credential.layer) errors.push('credential-layer-mismatch');
  if (options.expectedChallenge && await challengeHash(options.expectedChallenge) !== claim.challengeHash) {
    errors.push('challenge-mismatch');
  }
  if (options.minimumCredentialScore !== undefined && claim.credential.scoreFloor < options.minimumCredentialScore) {
    errors.push('credential-score-too-low');
  }
  if (options.allowedCredentialStatuses && !options.allowedCredentialStatuses.includes(claim.credential.verificationStatus)) {
    errors.push('credential-status-not-allowed');
  }

  if (options.trustedRegistryIds) {
    const trusted = new Set(Array.from(options.trustedRegistryIds).map(normalizeRegistryId));
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

  if (expired) errors.push('freshness-proof-expired');
  if (freshnessWindowExpired) errors.push('freshness-window-expired');
  if (tooOld) errors.push('freshness-check-too-old');
  if (checkedAt.getTime() > now.getTime() + 30_000) errors.push('freshness-check-in-future');
  if (freshUntil.getTime() < checkedAt.getTime()) errors.push('freshness-window-invalid');

  const notRevokedAsserted = claim.revocation.status === 'not-revoked';
  if (!notRevokedAsserted) errors.push('not-revoked-not-asserted');

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(options.issuerSecret, signingPayload(claim), envelope.signature.value);
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  const publicEnvelope = stripPrivateAddressCredentialFreshnessProofMaterial(envelope);
  const publicText = stableStringify(publicEnvelope);
  const privacyPreserved = !('privateProofSalt' in envelope)
    && !('localCacheKey' in envelope)
    && !('privateProofSalt' in publicEnvelope)
    && !('localCacheKey' in publicEnvelope)
    && !publicText.includes('"privateProofSalt"')
    && !publicText.includes('"localCacheKey"')
    && !publicText.includes('"privateSalt"')
    && !publicText.includes('"credentialPrivateSalt"')
    && !/"(?:subjectId|addressCommitment|postalCodeHash|revokedCredentialHashes|revokedSubjectHashes|revokedAddressCommitmentHashes|revokedIssuerScopedHashes)"\s*:/u.test(publicText)
    && claim.privacy.hides.includes('credential-body')
    && claim.privacy.hides.includes('credential-subject')
    && claim.privacy.hides.includes('address')
    && claim.privacy.hides.includes('postal-code')
    && claim.privacy.hides.includes('address-commitment')
    && claim.privacy.hides.includes('credential-private-salt')
    && claim.privacy.hides.includes('revocation-handle')
    && claim.privacy.hides.includes('revocation-list-contents')
    && claim.privacy.hides.includes('freshness-proof-salt');
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    valid: errors.length === 0 && signatureValid === true && notRevokedAsserted && !stale,
    signatureValid,
    expired,
    stale,
    notRevokedAsserted,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}

export async function verifyAddressCredentialFreshnessProof(
  envelope: AddressCredentialFreshnessProofEnvelope,
  options: VerifyAddressCredentialFreshnessProofOptions = {}
): Promise<AddressCredentialFreshnessProofVerificationResult> {
  try {
    return await verifyAddressCredentialFreshnessProofUnchecked(envelope, options);
  } catch {
    return {
      valid: false,
      signatureValid: null,
      expired: false,
      stale: true,
      notRevokedAsserted: false,
      privacyPreserved: false,
      proofCost: 'none',
      errors: ['malformed-address-credential-freshness-proof'],
      warnings: ['verification-runtime-guarded'],
    };
  }
}
