import type { CanonicalAddressParts } from './addressIntelligence';
import type {
  AddressVerificationEngineResult,
  AddressVerificationStatus,
} from './addressVerificationEngine';

export const ADDRESS_CREDENTIAL_VERSION = 'address-credential-v1';
export const ADDRESS_COMMITMENT_ALGORITHM = 'sha256-address-commitment-v1';
export const ADDRESS_CREDENTIAL_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';

export type AddressCredentialLayer = 'AGID' | 'AOID';

export type AddressCredentialClaimKind =
  | 'address-reference'
  | 'residence'
  | 'legal-ownership'
  | 'delivery-eligibility';

export type AddressCredentialAssuranceLevel =
  | 'self-asserted'
  | 'source-checked'
  | 'issuer-attested'
  | 'legal-attested';

export type AddressCredentialQualityBand =
  | 'verified-high'
  | 'verified-medium'
  | 'partial'
  | 'unresolved';

export type AddressCredentialProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'holder-knows-address-opening-for-signed-commitment';
};

export type AddressCredentialClaim = {
  version: typeof ADDRESS_CREDENTIAL_VERSION;
  subjectId: string;
  layer: AddressCredentialLayer;
  claimKind: AddressCredentialClaimKind;
  assuranceLevel: AddressCredentialAssuranceLevel;
  countryCode: string | null;
  postalCodeHash: string | null;
  addressCommitment: string;
  commitmentAlgorithm: typeof ADDRESS_COMMITMENT_ALGORITHM;
  evidenceCommitmentRefs: string[];
  qualityBand: AddressCredentialQualityBand;
  verificationStatus: AddressVerificationStatus;
  verificationScore: number;
  sourceIds: string[];
  issuedAt: string;
  expiresAt?: string;
  policyVersion?: string;
  proofHint: AddressCredentialProofHint;
};

export type AddressCredentialSignature = {
  algorithm: typeof ADDRESS_CREDENTIAL_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type AddressCredentialEnvelope = {
  claim: AddressCredentialClaim;
  signature: AddressCredentialSignature;
  privateSalt?: string;
  localCacheKey?: string;
};

export type AddressCommitment = {
  algorithm: typeof ADDRESS_COMMITMENT_ALGORITHM;
  commitment: string;
  addressHash: string;
  salt: string;
};

export type IssueAddressCredentialInput = {
  issuerId: string;
  issuerSecret: string;
  address: CanonicalAddressParts | Record<string, unknown>;
  layer?: AddressCredentialLayer;
  subjectId?: string;
  countryCode?: string | null;
  postalCode?: string | null;
  verificationStatus: AddressVerificationStatus;
  verificationScore: number;
  sourceIds?: string[];
  policyVersion?: string;
  claimKind?: AddressCredentialClaimKind;
  assuranceLevel?: AddressCredentialAssuranceLevel;
  evidenceCommitmentRefs?: string[];
  issuedAt?: Date | string;
  ttlSeconds?: number;
  privateSalt?: string;
};

export type AddressCredentialCacheInput = {
  address: CanonicalAddressParts | Record<string, unknown>;
  layer?: AddressCredentialLayer;
  countryCode?: string | null;
  postalCode?: string | null;
  verificationStatus: AddressVerificationStatus;
  verificationScore: number;
  sourceIds?: string[];
  policyVersion?: string;
  claimKind?: AddressCredentialClaimKind;
  assuranceLevel?: AddressCredentialAssuranceLevel;
  evidenceCommitmentRefs?: string[];
};

export type BuildAddressCredentialFromVerificationInput = {
  issuerId: string;
  issuerSecret: string;
  verification: AddressVerificationEngineResult;
  layer?: AddressCredentialLayer;
  subjectId?: string;
  claimKind?: AddressCredentialClaimKind;
  assuranceLevel?: AddressCredentialAssuranceLevel;
  evidenceCommitmentRefs?: string[];
  issuedAt?: Date | string;
  ttlSeconds?: number;
  privateSalt?: string;
};

export type VerifyAddressCredentialOptions = {
  issuerSecret?: string;
  issuerId?: string;
  now?: Date | string;
  expectedLayer?: AddressCredentialLayer;
  requiredClaimKind?: AddressCredentialClaimKind;
  minimumAssuranceLevel?: AddressCredentialAssuranceLevel;
  minimumScore?: number;
  allowedStatuses?: AddressVerificationStatus[];
  address?: CanonicalAddressParts | Record<string, unknown>;
  privateSalt?: string;
};

export type AddressCredentialRefreshOptions = {
  now?: Date | string;
  minRemainingSeconds?: number;
};

export type AddressCredentialVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  addressMatches?: boolean;
  proofCost: 'none';
  warnings: string[];
  errors: string[];
};

const ADDRESS_CREDENTIAL_CLAIM_KINDS: AddressCredentialClaimKind[] = [
  'address-reference',
  'residence',
  'legal-ownership',
  'delivery-eligibility',
];

const ADDRESS_CREDENTIAL_ASSURANCE_LEVELS: AddressCredentialAssuranceLevel[] = [
  'self-asserted',
  'source-checked',
  'issuer-attested',
  'legal-attested',
];

const ASSURANCE_RANK: Record<AddressCredentialAssuranceLevel, number> = {
  'self-asserted': 0,
  'source-checked': 1,
  'issuer-attested': 2,
  'legal-attested': 3,
};

const ADDRESS_FIELDS: Array<keyof CanonicalAddressParts> = [
  'country_code',
  'country',
  'state',
  'city',
  'district',
  'subdistrict',
  'suburb',
  'road',
  'house_number',
  'building',
  'postcode',
  'poi',
  'plus_code',
];

const textEncoder = new TextEncoder();

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for address credentials.');
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

function normalizeCountryCode(value: string) {
  return value.toUpperCase();
}

function normalizePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, ' ');
}

function normalizeClaimKind(value: unknown): AddressCredentialClaimKind {
  const normalized = normalizeText(value).toLowerCase();
  return ADDRESS_CREDENTIAL_CLAIM_KINDS.includes(normalized as AddressCredentialClaimKind)
    ? normalized as AddressCredentialClaimKind
    : 'address-reference';
}

function defaultAssuranceLevel(claimKind: AddressCredentialClaimKind): AddressCredentialAssuranceLevel {
  if (claimKind === 'legal-ownership') return 'legal-attested';
  if (claimKind === 'residence') return 'issuer-attested';
  return 'source-checked';
}

function normalizeAssuranceLevel(
  value: unknown,
  claimKind: AddressCredentialClaimKind
): AddressCredentialAssuranceLevel {
  const normalized = normalizeText(value).toLowerCase();
  return ADDRESS_CREDENTIAL_ASSURANCE_LEVELS.includes(normalized as AddressCredentialAssuranceLevel)
    ? normalized as AddressCredentialAssuranceLevel
    : defaultAssuranceLevel(claimKind);
}

function sortedUnique(values: readonly unknown[] | undefined) {
  return Array.from(new Set((values ?? []).map(normalizeText).filter(Boolean))).sort();
}

function isAuthorityBoundClaimKind(claimKind: AddressCredentialClaimKind) {
  return claimKind === 'residence' || claimKind === 'legal-ownership';
}

function validateCredentialLayerForClaimKind(input: {
  layer: AddressCredentialLayer;
  claimKind: AddressCredentialClaimKind;
  evidenceCommitmentRefs: readonly string[];
}) {
  if (!isAuthorityBoundClaimKind(input.claimKind)) return;
  if (input.layer !== 'AOID') {
    throw new Error(`${input.claimKind} credentials must be issued as AOID credentials.`);
  }
  if (input.evidenceCommitmentRefs.length === 0) {
    throw new Error(`${input.claimKind} credentials require at least one evidence commitment reference.`);
  }
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

function credentialSigningPayload(claim: AddressCredentialClaim) {
  return stableStringify(claim);
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

export function normalizeCredentialAddress(
  address: CanonicalAddressParts | Record<string, unknown>
): CanonicalAddressParts {
  const normalized: CanonicalAddressParts = {};

  ADDRESS_FIELDS.forEach(field => {
    const value = normalizeText((address as Record<string, unknown>)[field]);
    if (!value) return;
    if (field === 'country_code') {
      normalized[field] = normalizeCountryCode(value);
      return;
    }
    if (field === 'postcode') {
      normalized[field] = normalizePostcode(value);
      return;
    }
    normalized[field] = value;
  });

  return normalized;
}

export function generateAddressCredentialSalt(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function createAddressCredentialCacheKey(input: AddressCredentialCacheInput) {
  const sourceIds = sortedUnique(input.sourceIds);
  const claimKind = normalizeClaimKind(input.claimKind);
  const assuranceLevel = normalizeAssuranceLevel(input.assuranceLevel, claimKind);
  const payload = {
    version: ADDRESS_CREDENTIAL_VERSION,
    address: normalizeCredentialAddress(input.address),
    layer: input.layer ?? 'AGID',
    claimKind,
    assuranceLevel,
    evidenceCommitmentRefs: sortedUnique(input.evidenceCommitmentRefs),
    countryCode: normalizeText(input.countryCode).toUpperCase() || null,
    postalCode: normalizePostcode(normalizeText(input.postalCode)),
    verificationStatus: input.verificationStatus,
    verificationScore: Math.round(clampScore(input.verificationScore) * 1000) / 1000,
    sourceIds,
    policyVersion: input.policyVersion ?? null,
  };
  return `address-credential:${await sha256Base64Url(stableStringify(payload))}`;
}

export function shouldRefreshAddressCredential(
  credential: AddressCredentialEnvelope,
  options: AddressCredentialRefreshOptions = {}
) {
  if (!credential.claim.expiresAt) return false;
  const now = options.now ? new Date(options.now).getTime() : Date.now();
  const expiresAt = new Date(credential.claim.expiresAt).getTime();
  const minRemainingSeconds = options.minRemainingSeconds ?? 0;
  return expiresAt - now <= minRemainingSeconds * 1000;
}

export async function createAddressCommitment(
  address: CanonicalAddressParts | Record<string, unknown>,
  privateSalt = generateAddressCredentialSalt()
): Promise<AddressCommitment> {
  const normalizedAddress = normalizeCredentialAddress(address);
  const normalizedPayload = stableStringify(normalizedAddress);
  const addressHash = await sha256Base64Url(normalizedPayload);
  const commitment = await sha256Base64Url(`${ADDRESS_COMMITMENT_ALGORITHM}.${privateSalt}.${addressHash}`);

  return {
    algorithm: ADDRESS_COMMITMENT_ALGORITHM,
    commitment,
    addressHash,
    salt: privateSalt,
  };
}

export function deriveAddressCredentialQualityBand(
  verificationStatus: AddressVerificationStatus,
  verificationScore: number
): AddressCredentialQualityBand {
  const score = clampScore(verificationScore);
  if (verificationStatus === 'verified' && score >= 0.86) return 'verified-high';
  if (verificationStatus === 'verified' && score >= 0.7) return 'verified-medium';
  if (verificationStatus === 'partial' && score >= 0.45) return 'partial';
  return 'unresolved';
}

export async function issueAddressCredential(
  input: IssueAddressCredentialInput
): Promise<AddressCredentialEnvelope> {
  const issuedAt = toIsoDate(input.issuedAt);
  const commitment = await createAddressCommitment(input.address, input.privateSalt);
  const layer = input.layer ?? 'AGID';
  const claimKind = normalizeClaimKind(input.claimKind);
  const assuranceLevel = normalizeAssuranceLevel(input.assuranceLevel, claimKind);
  const evidenceCommitmentRefs = sortedUnique(input.evidenceCommitmentRefs);
  validateCredentialLayerForClaimKind({ layer, claimKind, evidenceCommitmentRefs });
  const countryCode = normalizeText(input.countryCode).toUpperCase() || null;
  const postalCode = normalizeText(input.postalCode);
  const postalCodeHash = postalCode
    ? await sha256Base64Url(`postal-code.${commitment.salt}.${normalizePostcode(postalCode)}`)
    : null;
  const sourceIds = sortedUnique(input.sourceIds);

  const claim: AddressCredentialClaim = {
    version: ADDRESS_CREDENTIAL_VERSION,
    subjectId: input.subjectId || `addr:${commitment.commitment.slice(0, 24)}`,
    layer,
    claimKind,
    assuranceLevel,
    countryCode,
    postalCodeHash,
    addressCommitment: commitment.commitment,
    commitmentAlgorithm: ADDRESS_COMMITMENT_ALGORITHM,
    evidenceCommitmentRefs,
    qualityBand: deriveAddressCredentialQualityBand(input.verificationStatus, input.verificationScore),
    verificationStatus: input.verificationStatus,
    verificationScore: clampScore(input.verificationScore),
    sourceIds,
    issuedAt,
    ...(input.ttlSeconds ? { expiresAt: addSeconds(issuedAt, input.ttlSeconds) } : {}),
    ...(input.policyVersion ? { policyVersion: input.policyVersion } : {}),
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'holder-knows-address-opening-for-signed-commitment',
    },
  };

  return {
    claim,
    privateSalt: commitment.salt,
    localCacheKey: await createAddressCredentialCacheKey(input),
    signature: {
      algorithm: ADDRESS_CREDENTIAL_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, credentialSigningPayload(claim)),
    },
  };
}

export async function buildAddressCredentialFromVerification(
  input: BuildAddressCredentialFromVerificationInput
) {
  const verification = input.verification;
  return issueAddressCredential({
    issuerId: input.issuerId,
    issuerSecret: input.issuerSecret,
    address: verification.canonicalAddress,
    layer: input.layer,
    subjectId: input.subjectId,
    claimKind: input.claimKind,
    assuranceLevel: input.assuranceLevel,
    evidenceCommitmentRefs: input.evidenceCommitmentRefs,
    countryCode: verification.country.resolved ?? verification.country.requested,
    postalCode: verification.postal.normalized || verification.postal.input,
    verificationStatus: verification.status,
    verificationScore: verification.score,
    sourceIds: verification.sources,
    policyVersion: verification.engineVersion,
    issuedAt: input.issuedAt,
    ttlSeconds: input.ttlSeconds,
    privateSalt: input.privateSalt,
  });
}

export function stripPrivateAddressCredentialMaterial(
  credential: AddressCredentialEnvelope
): Omit<AddressCredentialEnvelope, 'privateSalt' | 'localCacheKey'> {
  return {
    claim: credential.claim,
    signature: credential.signature,
  };
}

export async function verifyAddressCredential(
  credential: AddressCredentialEnvelope,
  options: VerifyAddressCredentialOptions = {}
): Promise<AddressCredentialVerificationResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const claim = credential.claim;

  if (claim.version !== ADDRESS_CREDENTIAL_VERSION) errors.push('unsupported-credential-version');
  if (claim.commitmentAlgorithm !== ADDRESS_COMMITMENT_ALGORITHM) errors.push('unsupported-commitment-algorithm');
  if (credential.signature.algorithm !== ADDRESS_CREDENTIAL_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-signature-algorithm');
  }
  if (options.issuerId && options.issuerId !== credential.signature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedLayer && options.expectedLayer !== claim.layer) errors.push('layer-mismatch');
  if (options.requiredClaimKind && options.requiredClaimKind !== claim.claimKind) errors.push('claim-kind-mismatch');
  if (
    options.minimumAssuranceLevel
    && ASSURANCE_RANK[claim.assuranceLevel] < ASSURANCE_RANK[options.minimumAssuranceLevel]
  ) {
    errors.push('assurance-level-too-low');
  }
  if (isAuthorityBoundClaimKind(claim.claimKind) && claim.layer !== 'AOID') {
    errors.push('authority-bound-claim-must-use-aoid-layer');
  }
  if (isAuthorityBoundClaimKind(claim.claimKind) && claim.evidenceCommitmentRefs.length === 0) {
    errors.push('authority-bound-claim-evidence-missing');
  }
  if (options.minimumScore !== undefined && claim.verificationScore < options.minimumScore) {
    errors.push('minimum-score-not-met');
  }
  if (options.allowedStatuses && !options.allowedStatuses.includes(claim.verificationStatus)) {
    errors.push('status-not-allowed');
  }

  const now = options.now ? new Date(options.now) : new Date();
  const expired = Boolean(claim.expiresAt && new Date(claim.expiresAt).getTime() <= now.getTime());
  if (expired) errors.push('credential-expired');

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(
      options.issuerSecret,
      credentialSigningPayload(claim),
      credential.signature.value
    );
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  let addressMatches: boolean | undefined;
  if (options.address) {
    const privateSalt = options.privateSalt ?? credential.privateSalt;
    if (!privateSalt) {
      warnings.push('private-salt-not-provided');
    } else {
      const commitment = await createAddressCommitment(options.address, privateSalt);
      addressMatches = commitment.commitment === claim.addressCommitment;
      if (!addressMatches) errors.push('address-commitment-mismatch');
    }
  }

  return {
    valid: errors.length === 0 && signatureValid === true,
    signatureValid,
    expired,
    ...(addressMatches !== undefined ? { addressMatches } : {}),
    proofCost: 'none',
    warnings,
    errors,
  };
}
