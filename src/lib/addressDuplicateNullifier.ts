import type { CanonicalAddressParts } from './addressIntelligence';
import {
  createAddressCommitment,
  normalizeCredentialAddress,
  verifyAddressCredential,
  type AddressCredentialEnvelope,
  type AddressCredentialQualityBand,
} from './addressCredential';
import { normalizeAOIDId } from './aoid';
import type { AddressVerificationStatus } from './addressVerificationEngine';

export const ADDRESS_DUPLICATE_NULLIFIER_VERSION = 'address-duplicate-nullifier-v1';
export const ADDRESS_DUPLICATE_NULLIFIER_ALGORITHM = 'hmac-sha256-address-aoid-region-v1';

export type AddressDuplicateNullifierRegionLevel =
  | 'country'
  | 'state'
  | 'city'
  | 'district'
  | 'grid'
  | 'custom';

export type AddressDuplicateNullifierPrivacyField =
  | 'aoid'
  | 'address'
  | 'person'
  | 'phone'
  | 'unit'
  | 'owner-device-secret';

export type AddressDuplicateNullifierProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'holder-knows-aoid-address-and-region-opening-for-unique-nullifier';
};

export type AddressDuplicateNullifierProof = {
  version: typeof ADDRESS_DUPLICATE_NULLIFIER_VERSION;
  nullifierAlgorithm: typeof ADDRESS_DUPLICATE_NULLIFIER_ALGORITHM;
  nullifier: string;
  registryId: string;
  regionKey: string;
  regionLevel: AddressDuplicateNullifierRegionLevel;
  issuedAt: string;
  expiresAt?: string;
  credential: {
    issuerId: string;
    layer: 'AOID';
    countryCode: string | null;
    qualityBand: AddressCredentialQualityBand;
    verificationStatus: AddressVerificationStatus;
    scoreFloor: number;
    policyVersion?: string;
  };
  privacy: {
    hides: AddressDuplicateNullifierPrivacyField[];
    reveals: Array<'nullifier' | 'registryId' | 'regionKey' | 'regionLevel' | 'credential-quality'>;
  };
  proofHint: AddressDuplicateNullifierProofHint;
  warnings: string[];
};

export type CreateAddressDuplicateNullifierProofInput = {
  credential: AddressCredentialEnvelope;
  address: CanonicalAddressParts | Record<string, unknown>;
  aoid: string;
  ownerNullifierSecret: string;
  registryId: string;
  regionKey: string;
  regionLevel?: AddressDuplicateNullifierRegionLevel;
  credentialIssuerSecret?: string;
  credentialPrivateSalt?: string;
  issuedAt?: Date | string;
  ttlSeconds?: number;
  minimumScore?: number;
};

export type VerifyAddressDuplicateNullifierProofOptions = {
  registryId?: string;
  regionKey?: string;
  now?: Date | string;
  registeredNullifiers?: Iterable<string>;
  minimumScore?: number;
  allowedStatuses?: AddressVerificationStatus[];
};

export type AddressDuplicateNullifierVerificationResult = {
  accepted: boolean;
  duplicate: boolean;
  expired: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  errors: string[];
  warnings: string[];
};

export type AddressDuplicateNullifierRegistrationResult =
  AddressDuplicateNullifierVerificationResult & {
    registered: boolean;
  };

const textEncoder = new TextEncoder();

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for address duplicate nullifiers.');
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

function normalizeScopeKey(value: unknown) {
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
    ['sign']
  );
  const signature = await cryptoApi.subtle.sign('HMAC', key, textEncoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function generateOwnerNullifierSecret(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function buildNullifierPreimage(input: {
  address: CanonicalAddressParts | Record<string, unknown>;
  aoid: string;
  registryId: string;
  regionKey: string;
  regionLevel: AddressDuplicateNullifierRegionLevel;
}) {
  const addressWitnessHash = await sha256Base64Url(stableStringify(normalizeCredentialAddress(input.address)));
  const aoidWitnessHash = await sha256Base64Url(`aoid.${normalizeAOIDId(input.aoid)}`);

  return stableStringify({
    version: ADDRESS_DUPLICATE_NULLIFIER_VERSION,
    registryId: input.registryId,
    regionKey: input.regionKey,
    regionLevel: input.regionLevel,
    addressWitnessHash,
    aoidWitnessHash,
  });
}

function includesRegisteredNullifier(registeredNullifiers: Iterable<string> | undefined, nullifier: string) {
  if (!registeredNullifiers) return false;
  if (registeredNullifiers instanceof Set) return registeredNullifiers.has(nullifier);
  if (Array.isArray(registeredNullifiers)) return registeredNullifiers.includes(nullifier);

  for (const registeredNullifier of registeredNullifiers) {
    if (registeredNullifier === nullifier) return true;
  }
  return false;
}

export async function createAddressDuplicateNullifierProof(
  input: CreateAddressDuplicateNullifierProofInput
): Promise<AddressDuplicateNullifierProof> {
  const registryId = normalizeScopeKey(input.registryId);
  const regionKey = normalizeScopeKey(input.regionKey);
  const regionLevel = input.regionLevel ?? 'custom';
  const minimumScore = input.minimumScore ?? 0.7;
  const warnings: string[] = [];

  if (!registryId) throw new Error('Duplicate nullifier proof requires a registry id.');
  if (!regionKey) throw new Error('Duplicate nullifier proof requires a region key.');
  if (!normalizeText(input.ownerNullifierSecret)) {
    throw new Error('Duplicate nullifier proof requires an owner nullifier secret.');
  }
  normalizeAOIDId(input.aoid);

  const claim = input.credential.claim;
  if (claim.layer !== 'AOID') {
    throw new Error('Duplicate nullifier proof requires an AOID address credential.');
  }
  if (claim.verificationStatus !== 'verified' || claim.verificationScore < minimumScore) {
    throw new Error('Duplicate nullifier proof requires a verified address credential.');
  }

  const privateSalt = input.credentialPrivateSalt ?? input.credential.privateSalt;
  if (!privateSalt) {
    throw new Error('Duplicate nullifier proof requires the private address credential salt for local witness binding.');
  }

  const localCommitment = await createAddressCommitment(input.address, privateSalt);
  if (localCommitment.commitment !== claim.addressCommitment) {
    throw new Error('Duplicate nullifier proof address does not match the signed address credential.');
  }

  if (input.credentialIssuerSecret) {
    const credentialCheck = await verifyAddressCredential(input.credential, {
      issuerSecret: input.credentialIssuerSecret,
      issuerId: input.credential.signature.issuerId,
      expectedLayer: 'AOID',
      minimumScore,
      allowedStatuses: ['verified'],
      address: input.address,
      privateSalt,
    });
    if (!credentialCheck.valid) {
      throw new Error(`Duplicate nullifier proof credential check failed: ${credentialCheck.errors.join(', ')}`);
    }
  } else {
    warnings.push('credential-signature-not-checked');
  }

  const issuedAt = toIsoDate(input.issuedAt);
  const preimage = await buildNullifierPreimage({
    address: input.address,
    aoid: input.aoid,
    registryId,
    regionKey,
    regionLevel,
  });
  const nullifier = await hmacSha256Base64Url(input.ownerNullifierSecret, preimage);

  return {
    version: ADDRESS_DUPLICATE_NULLIFIER_VERSION,
    nullifierAlgorithm: ADDRESS_DUPLICATE_NULLIFIER_ALGORITHM,
    nullifier,
    registryId,
    regionKey,
    regionLevel,
    issuedAt,
    ...(input.ttlSeconds ? { expiresAt: addSeconds(issuedAt, input.ttlSeconds) } : {}),
    credential: {
      issuerId: input.credential.signature.issuerId,
      layer: 'AOID',
      countryCode: claim.countryCode,
      qualityBand: claim.qualityBand,
      verificationStatus: claim.verificationStatus,
      scoreFloor: Math.floor(clampScore(claim.verificationScore) * 100) / 100,
      ...(claim.policyVersion ? { policyVersion: claim.policyVersion } : {}),
    },
    privacy: {
      hides: ['aoid', 'address', 'person', 'phone', 'unit', 'owner-device-secret'],
      reveals: ['nullifier', 'registryId', 'regionKey', 'regionLevel', 'credential-quality'],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'holder-knows-aoid-address-and-region-opening-for-unique-nullifier',
    },
    warnings,
  };
}

export function verifyAddressDuplicateNullifierProof(
  proof: AddressDuplicateNullifierProof,
  options: VerifyAddressDuplicateNullifierProofOptions = {}
): AddressDuplicateNullifierVerificationResult {
  const errors: string[] = [];
  const warnings = [...proof.warnings];

  if (proof.version !== ADDRESS_DUPLICATE_NULLIFIER_VERSION) errors.push('unsupported-nullifier-proof-version');
  if (proof.nullifierAlgorithm !== ADDRESS_DUPLICATE_NULLIFIER_ALGORITHM) {
    errors.push('unsupported-nullifier-algorithm');
  }
  if (!proof.nullifier) errors.push('nullifier-missing');
  if (options.registryId && normalizeScopeKey(options.registryId) !== proof.registryId) errors.push('registry-mismatch');
  if (options.regionKey && normalizeScopeKey(options.regionKey) !== proof.regionKey) errors.push('region-mismatch');

  const now = options.now ? new Date(options.now) : new Date();
  const expired = Boolean(proof.expiresAt && new Date(proof.expiresAt).getTime() <= now.getTime());
  if (expired) errors.push('nullifier-proof-expired');

  const minimumScore = options.minimumScore ?? 0;
  if (proof.credential.scoreFloor < minimumScore) errors.push('credential-score-too-low');

  const allowedStatuses = options.allowedStatuses ?? ['verified'];
  if (!allowedStatuses.includes(proof.credential.verificationStatus)) {
    errors.push('credential-status-not-allowed');
  }

  const duplicate = includesRegisteredNullifier(options.registeredNullifiers, proof.nullifier);
  if (duplicate) errors.push('nullifier-already-registered');

  const proofText = stableStringify(proof);
  const privacyPreserved = !/(?:address|aoid|phone|person|unit)-witness/iu.test(proofText)
    && proof.privacy.hides.includes('aoid')
    && proof.privacy.hides.includes('address')
    && proof.privacy.hides.includes('person');
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    accepted: errors.length === 0,
    duplicate,
    expired,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}

export function registerAddressDuplicateNullifier(
  proof: AddressDuplicateNullifierProof,
  registeredNullifiers: Set<string>,
  options: Omit<VerifyAddressDuplicateNullifierProofOptions, 'registeredNullifiers'> = {}
): AddressDuplicateNullifierRegistrationResult {
  const verification = verifyAddressDuplicateNullifierProof(proof, {
    ...options,
    registeredNullifiers,
  });

  if (verification.accepted) {
    registeredNullifiers.add(proof.nullifier);
  }

  return {
    ...verification,
    registered: verification.accepted,
  };
}
