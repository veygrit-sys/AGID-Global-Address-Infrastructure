import {
  verifyAddressCredential,
  type AddressCredentialEnvelope,
  type AddressCredentialQualityBand,
} from './addressCredential';
import { normalizeAOIDId } from './aoid';
import type { AddressVerificationStatus } from './addressVerificationEngine';

export const AOID_OWNERSHIP_PROOF_VERSION = 'aoid-ownership-proof-v1';
export const AOID_OWNERSHIP_ISSUER_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const AOID_OWNERSHIP_OWNER_SIGNATURE_ALGORITHM = 'ECDSA-P256-SHA-256';
export const AOID_OWNERSHIP_COMMITMENT_ALGORITHM = 'sha256-salted-aoid-ownership-commitment-v1';

export type AOIDOwnershipProofMethod =
  | 'owner-key'
  | 'address-credential'
  | 'owner-key-and-address-credential';

export type AOIDOwnershipPrivacyField =
  | 'aoid'
  | 'aoid-body'
  | 'input-address'
  | 'recipient'
  | 'phone'
  | 'unit'
  | 'credential-private-salt'
  | 'owner-private-key';

export type AOIDOwnershipProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'holder-knows-aoid-owner-key-or-registered-address-credential';
};

export type AOIDOwnershipCredentialSummary = {
  credentialClaimHash: string;
  credentialPossessionCommitment: string;
  issuerId: string;
  qualityBand: AddressCredentialQualityBand;
  verificationStatus: AddressVerificationStatus;
  scoreFloor: number;
  policyVersion?: string;
};

export type AOIDOwnershipClaim = {
  version: typeof AOID_OWNERSHIP_PROOF_VERSION;
  method: AOIDOwnershipProofMethod;
  scope: string;
  challengeHash: string;
  issuedAt: string;
  expiresAt?: string;
  aoidCommitment?: string;
  ownerKeyFingerprint?: string;
  credential?: AOIDOwnershipCredentialSummary;
  privacy: {
    hides: AOIDOwnershipPrivacyField[];
    reveals: Array<'method' | 'scope' | 'challenge-hash' | 'key-fingerprint' | 'credential-quality' | 'commitments' | 'issuer'>;
  };
  proofHint: AOIDOwnershipProofHint;
};

export type AOIDOwnershipIssuerSignature = {
  algorithm: typeof AOID_OWNERSHIP_ISSUER_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type AOIDOwnershipOwnerSignature = {
  algorithm: typeof AOID_OWNERSHIP_OWNER_SIGNATURE_ALGORITHM;
  value: string;
};

export type AOIDOwnerKeyPairJwk = {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
};

export type AOIDOwnershipProofEnvelope = {
  claim: AOIDOwnershipClaim;
  issuerSignature: AOIDOwnershipIssuerSignature;
  ownerSignature?: AOIDOwnershipOwnerSignature;
  publicOwnerKeyJwk?: JsonWebKey;
  privateProofSalt?: string;
  localCacheKey?: string;
};

export type CreateAOIDOwnershipProofInput = {
  issuerId: string;
  issuerSecret: string;
  scope: string;
  challenge?: string;
  aoid?: string;
  ownerPrivateKeyJwk?: JsonWebKey;
  ownerPublicKeyJwk?: JsonWebKey;
  includePublicOwnerKey?: boolean;
  registeredCredential?: AddressCredentialEnvelope;
  credentialIssuerSecret?: string;
  credentialPrivateSalt?: string;
  issuedAt?: Date | string;
  ttlSeconds?: number;
  privateProofSalt?: string;
  minimumCredentialScore?: number;
  allowedCredentialStatuses?: AddressVerificationStatus[];
};

export type VerifyAOIDOwnershipProofOptions = {
  issuerId?: string;
  issuerSecret?: string;
  ownerPublicKeyJwk?: JsonWebKey;
  expectedScope?: string;
  expectedChallenge?: string;
  now?: Date | string;
  allowedMethods?: AOIDOwnershipProofMethod[];
  requireOwnerKey?: boolean;
  requireCredential?: boolean;
  minimumCredentialScore?: number;
  allowedCredentialStatuses?: AddressVerificationStatus[];
};

export type AOIDOwnershipProofVerificationResult = {
  valid: boolean;
  issuerSignatureValid: boolean | null;
  ownerSignatureValid: boolean | null;
  expired: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  errors: string[];
  warnings: string[];
};

const textEncoder = new TextEncoder();

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for AOID ownership proofs.');
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
  return normalizeText(value).toUpperCase();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

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

function addSeconds(isoDate: string, ttlSeconds: number) {
  return new Date(new Date(isoDate).getTime() + ttlSeconds * 1000).toISOString();
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

function claimSigningPayload(claim: AOIDOwnershipClaim) {
  return stableStringify(claim);
}

function normalizeOptionalAoid(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  return normalizeAOIDId(text.replace(/^aoid:/iu, ''));
}

async function aoidCommitment(aoid: string, scope: string, salt: string) {
  return sha256Base64Url(stableStringify({
    algorithm: AOID_OWNERSHIP_COMMITMENT_ALGORITHM,
    kind: 'aoid',
    aoid,
    scope,
    salt,
  }));
}

async function challengeHash(challenge: string) {
  return sha256Base64Url(stableStringify({
    algorithm: AOID_OWNERSHIP_COMMITMENT_ALGORITHM,
    kind: 'challenge',
    challenge,
  }));
}

async function credentialClaimHash(credential: AddressCredentialEnvelope) {
  return sha256Base64Url(stableStringify(credential.claim));
}

async function credentialPossessionCommitment(
  credential: AddressCredentialEnvelope,
  privateSalt: string,
  proofSalt: string,
  scope: string
) {
  return sha256Base64Url(stableStringify({
    algorithm: AOID_OWNERSHIP_COMMITMENT_ALGORITHM,
    kind: 'credential-possession',
    scope,
    proofSalt,
    credentialSubject: credential.claim.subjectId,
    credentialCommitment: credential.claim.addressCommitment,
    credentialPrivateSalt: privateSalt,
  }));
}

async function importOwnerPrivateKey(privateKeyJwk: JsonWebKey) {
  return getCrypto().subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

async function importOwnerPublicKey(publicKeyJwk: JsonWebKey) {
  return getCrypto().subtle.importKey(
    'jwk',
    publicKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
}

async function signOwnerClaim(privateKeyJwk: JsonWebKey, claim: AOIDOwnershipClaim) {
  const privateKey = await importOwnerPrivateKey(privateKeyJwk);
  const signature = await getCrypto().subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    textEncoder.encode(claimSigningPayload(claim))
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyOwnerClaim(publicKeyJwk: JsonWebKey, claim: AOIDOwnershipClaim, signature: string) {
  const publicKey = await importOwnerPublicKey(publicKeyJwk);
  return getCrypto().subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    base64UrlToBytes(signature),
    textEncoder.encode(claimSigningPayload(claim))
  );
}

export async function generateAOIDOwnerKeyPair(): Promise<AOIDOwnerKeyPairJwk> {
  const keyPair = await getCrypto().subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  return {
    publicKeyJwk: await getCrypto().subtle.exportKey('jwk', keyPair.publicKey),
    privateKeyJwk: await getCrypto().subtle.exportKey('jwk', keyPair.privateKey),
  };
}

export async function fingerprintAOIDOwnerPublicKey(publicKeyJwk: JsonWebKey) {
  const publicOnly = {
    crv: publicKeyJwk.crv,
    ext: publicKeyJwk.ext,
    key_ops: publicKeyJwk.key_ops,
    kty: publicKeyJwk.kty,
    x: publicKeyJwk.x,
    y: publicKeyJwk.y,
  };
  return sha256Base64Url(stableStringify(publicOnly));
}

function ownershipMethod(input: CreateAOIDOwnershipProofInput): AOIDOwnershipProofMethod {
  const hasOwnerKey = Boolean(input.ownerPrivateKeyJwk && input.ownerPublicKeyJwk);
  const hasCredential = Boolean(input.registeredCredential);
  if (hasOwnerKey && hasCredential) return 'owner-key-and-address-credential';
  if (hasOwnerKey) return 'owner-key';
  if (hasCredential) return 'address-credential';
  throw new Error('AOID ownership proof requires an owner key or a registered address credential.');
}

async function buildCredentialSummary(input: CreateAOIDOwnershipProofInput, proofSalt: string, scope: string) {
  const credential = input.registeredCredential;
  if (!credential) return undefined;
  if (credential.claim.layer !== 'AOID') {
    throw new Error('AOID ownership proof requires an AOID address credential.');
  }

  const privateSalt = input.credentialPrivateSalt ?? credential.privateSalt;
  if (!privateSalt) {
    throw new Error('AOID ownership proof requires the registered credential private salt.');
  }

  const minimumScore = input.minimumCredentialScore ?? 0.7;
  const allowedStatuses = input.allowedCredentialStatuses ?? ['verified'];
  if (credential.claim.verificationScore < minimumScore || !allowedStatuses.includes(credential.claim.verificationStatus)) {
    throw new Error('AOID ownership proof registered credential does not meet the required quality gate.');
  }

  if (input.credentialIssuerSecret) {
    const verification = await verifyAddressCredential(credential, {
      issuerSecret: input.credentialIssuerSecret,
      issuerId: credential.signature.issuerId,
      expectedLayer: 'AOID',
      minimumScore,
      allowedStatuses,
    });
    if (!verification.valid) {
      throw new Error(`AOID ownership credential verification failed: ${verification.errors.join(', ')}`);
    }
  }

  return {
    credentialClaimHash: await credentialClaimHash(credential),
    credentialPossessionCommitment: await credentialPossessionCommitment(credential, privateSalt, proofSalt, scope),
    issuerId: credential.signature.issuerId,
    qualityBand: credential.claim.qualityBand,
    verificationStatus: credential.claim.verificationStatus,
    scoreFloor: scoreFloor(credential.claim.verificationScore),
    ...(credential.claim.policyVersion ? { policyVersion: credential.claim.policyVersion } : {}),
  };
}

export async function createAOIDOwnershipProof(
  input: CreateAOIDOwnershipProofInput
): Promise<AOIDOwnershipProofEnvelope> {
  const method = ownershipMethod(input);
  const scope = normalizeScope(input.scope);
  if (!scope) throw new Error('AOID ownership proof requires a scope.');

  const challenge = normalizeText(input.challenge) || generateProofSalt(16);
  const privateProofSalt = input.privateProofSalt ?? generateProofSalt();
  const normalizedAoid = normalizeOptionalAoid(input.aoid);
  const issuedAt = toIsoDate(input.issuedAt);
  const ownerKeyFingerprint = input.ownerPublicKeyJwk
    ? await fingerprintAOIDOwnerPublicKey(input.ownerPublicKeyJwk)
    : undefined;
  const credential = await buildCredentialSummary(input, privateProofSalt, scope);

  const claim: AOIDOwnershipClaim = {
    version: AOID_OWNERSHIP_PROOF_VERSION,
    method,
    scope,
    challengeHash: await challengeHash(challenge),
    issuedAt,
    ...(input.ttlSeconds ? { expiresAt: addSeconds(issuedAt, input.ttlSeconds) } : {}),
    ...(normalizedAoid ? { aoidCommitment: await aoidCommitment(normalizedAoid, scope, privateProofSalt) } : {}),
    ...(ownerKeyFingerprint ? { ownerKeyFingerprint } : {}),
    ...(credential ? { credential } : {}),
    privacy: {
      hides: ['aoid', 'aoid-body', 'input-address', 'recipient', 'phone', 'unit', 'credential-private-salt', 'owner-private-key'],
      reveals: ['method', 'scope', 'challenge-hash', 'commitments', 'issuer'],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'holder-knows-aoid-owner-key-or-registered-address-credential',
    },
  };

  if (ownerKeyFingerprint) {
    claim.privacy.reveals.push('key-fingerprint');
  }
  if (credential) {
    claim.privacy.reveals.push('credential-quality');
  }

  return {
    claim,
    privateProofSalt,
    localCacheKey: `aoid-ownership:${await sha256Base64Url(stableStringify({
      method,
      scope,
      challengeHash: claim.challengeHash,
      aoidCommitment: claim.aoidCommitment ?? null,
      ownerKeyFingerprint: claim.ownerKeyFingerprint ?? null,
      credentialClaimHash: claim.credential?.credentialClaimHash ?? null,
      issuerId: input.issuerId,
    }))}`,
    ...(input.includePublicOwnerKey && input.ownerPublicKeyJwk ? { publicOwnerKeyJwk: input.ownerPublicKeyJwk } : {}),
    ...(input.ownerPrivateKeyJwk ? {
      ownerSignature: {
        algorithm: AOID_OWNERSHIP_OWNER_SIGNATURE_ALGORITHM,
        value: await signOwnerClaim(input.ownerPrivateKeyJwk, claim),
      },
    } : {}),
    issuerSignature: {
      algorithm: AOID_OWNERSHIP_ISSUER_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, claimSigningPayload(claim)),
    },
  };
}

export function stripPrivateAOIDOwnershipProofMaterial(
  envelope: AOIDOwnershipProofEnvelope
): Omit<AOIDOwnershipProofEnvelope, 'privateProofSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    issuerSignature: envelope.issuerSignature,
    ...(envelope.ownerSignature ? { ownerSignature: envelope.ownerSignature } : {}),
    ...(envelope.publicOwnerKeyJwk ? { publicOwnerKeyJwk: envelope.publicOwnerKeyJwk } : {}),
  };
}

export async function verifyAOIDOwnershipProof(
  envelope: AOIDOwnershipProofEnvelope,
  options: VerifyAOIDOwnershipProofOptions = {}
): Promise<AOIDOwnershipProofVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== AOID_OWNERSHIP_PROOF_VERSION) errors.push('unsupported-aoid-ownership-proof-version');
  if (envelope.issuerSignature.algorithm !== AOID_OWNERSHIP_ISSUER_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-issuer-signature-algorithm');
  }
  if (options.issuerId && options.issuerId !== envelope.issuerSignature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedScope && normalizeScope(options.expectedScope) !== claim.scope) errors.push('scope-mismatch');
  if (options.allowedMethods && !options.allowedMethods.includes(claim.method)) errors.push('method-not-allowed');
  if (options.requireOwnerKey && !claim.ownerKeyFingerprint) errors.push('owner-key-required');
  if (options.requireCredential && !claim.credential) errors.push('credential-required');
  if (options.minimumCredentialScore !== undefined && (!claim.credential || claim.credential.scoreFloor < options.minimumCredentialScore)) {
    errors.push('credential-score-too-low');
  }
  if (options.allowedCredentialStatuses && (!claim.credential || !options.allowedCredentialStatuses.includes(claim.credential.verificationStatus))) {
    errors.push('credential-status-not-allowed');
  }
  if (options.expectedChallenge && await challengeHash(options.expectedChallenge) !== claim.challengeHash) {
    errors.push('challenge-mismatch');
  }

  const now = options.now ? new Date(options.now) : new Date();
  const expired = Boolean(claim.expiresAt && new Date(claim.expiresAt).getTime() <= now.getTime());
  if (expired) errors.push('aoid-ownership-proof-expired');

  let issuerSignatureValid: boolean | null = null;
  if (options.issuerSecret) {
    issuerSignatureValid = await verifyHmacSha256(
      options.issuerSecret,
      claimSigningPayload(claim),
      envelope.issuerSignature.value
    );
    if (!issuerSignatureValid) errors.push('issuer-signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  let ownerSignatureValid: boolean | null = null;
  if (claim.ownerKeyFingerprint || envelope.ownerSignature) {
    const publicKey = options.ownerPublicKeyJwk ?? envelope.publicOwnerKeyJwk;
    if (!publicKey) {
      errors.push('owner-public-key-not-provided');
    } else if (!envelope.ownerSignature) {
      errors.push('owner-signature-not-provided');
    } else {
      const fingerprint = await fingerprintAOIDOwnerPublicKey(publicKey);
      if (claim.ownerKeyFingerprint !== fingerprint) errors.push('owner-key-fingerprint-mismatch');
      ownerSignatureValid = await verifyOwnerClaim(publicKey, claim, envelope.ownerSignature.value);
      if (!ownerSignatureValid) errors.push('owner-signature-invalid');
    }
  }

  const publicEnvelope = stripPrivateAOIDOwnershipProofMaterial(envelope);
  const publicText = stableStringify(publicEnvelope);
  const privacyPreserved = !('privateProofSalt' in envelope)
    && !('localCacheKey' in envelope)
    && !('privateProofSalt' in publicEnvelope)
    && !('localCacheKey' in publicEnvelope)
    && !publicText.includes('"privateProofSalt"')
    && !publicText.includes('"localCacheKey"')
    && !publicText.includes('"privateKeyJwk"')
    && !publicText.includes('"credentialPrivateSalt"')
    && !publicText.includes('"privateSalt"')
    && !/"d":/u.test(publicText)
    && claim.privacy.hides.includes('aoid')
    && claim.privacy.hides.includes('aoid-body')
    && claim.privacy.hides.includes('input-address')
    && claim.privacy.hides.includes('credential-private-salt')
    && claim.privacy.hides.includes('owner-private-key')
    && claim.privacy.hides.includes('recipient')
    && claim.privacy.hides.includes('phone')
    && claim.privacy.hides.includes('unit');
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  const methodNeedsOwnerSignature = claim.method === 'owner-key' || claim.method === 'owner-key-and-address-credential';
  const ownerKeySatisfied = !methodNeedsOwnerSignature || ownerSignatureValid === true;
  const issuerSatisfied = issuerSignatureValid === true;

  return {
    valid: errors.length === 0 && issuerSatisfied && ownerKeySatisfied,
    issuerSignatureValid,
    ownerSignatureValid,
    expired,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}
