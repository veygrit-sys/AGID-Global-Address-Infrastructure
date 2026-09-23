import type { CanonicalAddressParts } from './addressIntelligence';
import {
  normalizeCredentialAddress,
  verifyAddressCredential,
  type AddressCredentialEnvelope,
  type AddressCredentialQualityBand,
} from './addressCredential';
import type { AddressVerificationStatus } from './addressVerificationEngine';
import { pointInZkBoundingBox, pointInZkCircle } from './zkProofRuntime';

export const PRIVATE_ADDRESS_PREDICATE_PROOF_VERSION = 'private-address-predicate-proof-v1';
export const PRIVATE_ADDRESS_PREDICATE_WORKFLOW_VERSION = 'private-address-predicate-v1';
export const PRIVATE_ADDRESS_PREDICATE_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const PRIVATE_ADDRESS_PREDICATE_COMMITMENT_ALGORITHM = 'sha256-salted-private-address-predicate-v1';
export const PRIVATE_ADDRESS_PREDICATE_IDENTITY_BINDING_ALGORITHM = 'sha256-salted-private-address-identity-binding-v1';

export type PrivateAddressPredicateKind =
  | 'verified-address'
  | 'delivery-region'
  | 'same-address-resident'
  | 'country-resident'
  | 'city-resident';

export type PrivateAddressPredicateRegionPurpose =
  | 'delivery-area'
  | 'administrative'
  | 'country-border'
  | 'custom';

export type PrivateAddressPredicateIdentityProvider =
  | 'AGID'
  | 'AOID'
  | 'DID'
  | 'OIDC'
  | 'VC'
  | 'CUSTOM';

export type PrivateAddressPredicateIdentityBindingInput = {
  provider: PrivateAddressPredicateIdentityProvider;
  subjectId: string;
  issuer?: string;
  audience?: string;
  credentialId?: string;
  privateIdentityBindingSalt?: string;
};

export type PrivateAddressPredicateIdentityBindingClaim = {
  algorithm: typeof PRIVATE_ADDRESS_PREDICATE_IDENTITY_BINDING_ALGORITHM;
  provider: PrivateAddressPredicateIdentityProvider;
  issuer?: string;
  audience?: string;
  subjectCommitment: string;
  bindingCommitment: string;
};

export type PrivateAddressPredicatePoint = {
  lat: number;
  lon?: number;
  lng?: number;
};

export type PrivateAddressPredicateCoordinate = [number, number];

export type PrivateAddressPredicateRegion =
  {
    id: string;
    purpose?: PrivateAddressPredicateRegionPurpose;
    version?: string;
    geometry: {
      type: 'bbox';
      north: number;
      south: number;
      west: number;
      east: number;
    };
  }
  | {
    id: string;
    purpose?: PrivateAddressPredicateRegionPurpose;
    version?: string;
    geometry: {
      type: 'circle';
      center: PrivateAddressPredicatePoint;
      radiusMeters: number;
    };
  }
  | {
    id: string;
    purpose?: PrivateAddressPredicateRegionPurpose;
    version?: string;
    geometry: {
      type: 'polygon';
      rings: PrivateAddressPredicateCoordinate[][];
    };
  };

export type CreatePrivateAddressPredicateRequest =
  | {
    kind: 'verified-address';
  }
  | {
    kind: 'delivery-region';
    region: PrivateAddressPredicateRegion;
  }
  | {
    kind: 'same-address-resident';
    groupId: string;
  }
  | {
    kind: 'country-resident';
    countryCode: string;
  }
  | {
    kind: 'city-resident';
    countryCode?: string;
    city: string;
  };

export type PrivateAddressPredicateStatement =
  | {
    kind: 'verified-address';
    satisfied: true;
    credentialIssuerId: string;
    layer: 'AGID' | 'AOID';
    qualityBand: AddressCredentialQualityBand;
    verificationStatus: AddressVerificationStatus;
  }
  | {
    kind: 'delivery-region';
    satisfied: true;
    regionId: string;
    regionPurpose: PrivateAddressPredicateRegionPurpose;
    regionVersion?: string;
    geometryType: PrivateAddressPredicateRegion['geometry']['type'];
    geometryCommitment: string;
    witnessCommitment: string;
  }
  | {
    kind: 'same-address-resident';
    satisfied: true;
    groupId: string;
    sameAddressCommitment: string;
  }
  | {
    kind: 'country-resident';
    satisfied: true;
    countryCode: string;
  }
  | {
    kind: 'city-resident';
    satisfied: true;
    countryCode?: string;
    cityKey: string;
  };

export type PrivateAddressPredicatePrivacyField =
  | 'address'
  | 'address-credential-body'
  | 'address-commitment'
  | 'postal-code'
  | 'road'
  | 'house-number'
  | 'building'
  | 'unit'
  | 'recipient'
  | 'phone'
  | 'latitude'
  | 'longitude'
  | 'region-geometry'
  | 'identity-subject'
  | 'identity-credential'
  | 'identity-binding-salt'
  | 'credential-private-salt'
  | 'proof-salt';

export type PrivateAddressPredicatePrivacyReveal =
  | 'predicate-kind'
  | 'predicate-target'
  | 'predicate-result'
  | 'scope'
  | 'challenge-hash'
  | 'credential-quality'
  | 'commitments'
  | 'issuer'
  | 'identity-provider'
  | 'identity-audience'
  | 'identity-issuer'
  | 'identity-commitments';

export type PrivateAddressPredicateProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'holder-knows-hidden-address-satisfying-public-predicates';
};

export type PrivateAddressPredicateClaim = {
  version: typeof PRIVATE_ADDRESS_PREDICATE_PROOF_VERSION;
  workflowVersion: typeof PRIVATE_ADDRESS_PREDICATE_WORKFLOW_VERSION;
  scope: string;
  challengeHash: string;
  issuedAt: string;
  expiresAt?: string;
  credential: {
    issuerId: string;
    layer: 'AGID' | 'AOID';
    qualityBand: AddressCredentialQualityBand;
    verificationStatus: AddressVerificationStatus;
    scoreFloor: number;
    credentialBindingCommitment: string;
  };
  identityBinding?: PrivateAddressPredicateIdentityBindingClaim;
  predicates: PrivateAddressPredicateStatement[];
  commitments: {
    addressWitnessCommitment: string;
    predicateSetCommitment: string;
  };
  privacy: {
    hides: PrivateAddressPredicatePrivacyField[];
    reveals: PrivateAddressPredicatePrivacyReveal[];
  };
  proofHint: PrivateAddressPredicateProofHint;
};

export type PrivateAddressPredicateSignature = {
  algorithm: typeof PRIVATE_ADDRESS_PREDICATE_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type PrivateAddressPredicateProofEnvelope = {
  claim: PrivateAddressPredicateClaim;
  signature: PrivateAddressPredicateSignature;
  privateProofSalt?: string;
  privateIdentityBindingSalt?: string;
  localCacheKey?: string;
};

export type CreatePrivateAddressPredicateProofInput = {
  issuerId: string;
  issuerSecret: string;
  credential: AddressCredentialEnvelope;
  credentialIssuerSecret?: string;
  credentialPrivateSalt?: string;
  address: CanonicalAddressParts | Record<string, unknown>;
  point?: PrivateAddressPredicatePoint;
  predicates: CreatePrivateAddressPredicateRequest[];
  scope?: string;
  challenge?: string;
  issuedAt?: Date | string;
  ttlSeconds?: number;
  privateProofSalt?: string;
  identityBinding?: PrivateAddressPredicateIdentityBindingInput;
  minimumScore?: number;
  allowedStatuses?: AddressVerificationStatus[];
};

export type VerifyPrivateAddressPredicateRequirement =
  | {
    kind: 'verified-address';
  }
  | {
    kind: 'delivery-region';
    regionId: string;
  }
  | {
    kind: 'same-address-resident';
    groupId: string;
  }
  | {
    kind: 'country-resident';
    countryCode: string;
  }
  | {
    kind: 'city-resident';
    countryCode?: string;
    city: string;
  };

export type VerifyPrivateAddressPredicateProofOptions = {
  issuerId?: string;
  issuerSecret?: string;
  expectedScope?: string;
  expectedChallenge?: string;
  requiredPredicates?: VerifyPrivateAddressPredicateRequirement[];
  minimumScore?: number;
  allowedStatuses?: AddressVerificationStatus[];
  now?: Date | string;
};

export type PrivateAddressPredicateProofVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  predicatesSatisfied: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  errors: string[];
  warnings: string[];
};

const textEncoder = new TextEncoder();
const DEFAULT_SCOPE = 'PRIVATE-ADDRESS-PREDICATE';
const DEFAULT_ALLOWED_STATUSES: AddressVerificationStatus[] = ['verified'];

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for private address predicate proofs.');
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

function normalizeIdentityProvider(value: unknown): PrivateAddressPredicateIdentityProvider {
  const provider = normalizeToken(value);
  if (
    provider === 'AGID'
    || provider === 'AOID'
    || provider === 'DID'
    || provider === 'OIDC'
    || provider === 'VC'
  ) {
    return provider;
  }
  return 'CUSTOM';
}

function normalizeIdentityIssuer(value: unknown) {
  const issuer = normalizeText(value);
  return issuer || undefined;
}

function normalizeIdentityAudience(value: unknown) {
  const audience = normalizeToken(value);
  return audience || undefined;
}

function normalizeIdentitySubject(value: unknown) {
  return normalizeText(value);
}

function normalizeScope(value: unknown) {
  return normalizeToken(value || DEFAULT_SCOPE);
}

function normalizeCountryCode(value: unknown) {
  return normalizeToken(value);
}

function normalizeCityKey(countryCode: unknown, city: unknown) {
  const normalizedCountry = normalizeCountryCode(countryCode);
  const normalizedCity = normalizeToken(city);
  return normalizedCountry ? `${normalizedCountry}:${normalizedCity}` : normalizedCity;
}

function cityFromAddress(address: CanonicalAddressParts | Record<string, unknown>) {
  const record = address as Record<string, unknown>;
  return normalizeText(record.city)
    || normalizeText(record.town)
    || normalizeText(record.village)
    || normalizeText(record.municipality)
    || normalizeText(record.locality);
}

function countryFromAddress(address: CanonicalAddressParts | Record<string, unknown>) {
  const record = address as Record<string, unknown>;
  return normalizeCountryCode(record.country_code || record.countryCode);
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

  if (value instanceof Date) return JSON.stringify(value.toISOString());

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

function generateRandomToken(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256Base64Url(payload: unknown) {
  const digest = await getCrypto().subtle.digest('SHA-256', textEncoder.encode(
    typeof payload === 'string' ? payload : stableStringify(payload)
  ));
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
  return cryptoApi.subtle.verify('HMAC', key, base64UrlToBytes(signature), textEncoder.encode(payload));
}

async function challengeHash(challenge: string) {
  return sha256Base64Url(`${PRIVATE_ADDRESS_PREDICATE_PROOF_VERSION}.challenge.${challenge}`);
}

function signingPayload(claim: PrivateAddressPredicateClaim) {
  return `${PRIVATE_ADDRESS_PREDICATE_PROOF_VERSION}.${stableStringify(claim)}`;
}

function pointLon(point: PrivateAddressPredicatePoint) {
  return point.lon ?? point.lng;
}

function assertPoint(point: PrivateAddressPredicatePoint | undefined) {
  if (!point) throw new Error('Delivery-region predicate requires a hidden point witness.');
  const lon = pointLon(point);
  if (!Number.isFinite(point.lat) || !Number.isFinite(lon)) {
    throw new Error('Delivery-region predicate requires finite hidden coordinates.');
  }
  return { lat: point.lat, lon: lon as number };
}

function pointInPolygon(point: { lat: number; lon: number }, rings: PrivateAddressPredicateCoordinate[][]) {
  const ring = rings[0] || [];
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    if (!currentPoint || !previousPoint) continue;
    const [xi, yi] = currentPoint;
    const [xj, yj] = previousPoint;
    const intersects = yi > point.lat !== yj > point.lat
      && point.lon < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function isPointInsideRegion(point: { lat: number; lon: number }, region: PrivateAddressPredicateRegion) {
  const geometry = region.geometry;
  if (geometry.type === 'bbox') {
    return pointInZkBoundingBox(point, geometry).satisfied;
  }
  if (geometry.type === 'circle') {
    const centerLon = pointLon(geometry.center);
    if (centerLon === undefined) return false;
    return pointInZkCircle(point, { lat: geometry.center.lat, lon: centerLon }, geometry.radiusMeters).satisfied;
  }
  return pointInPolygon(point, geometry.rings);
}

async function geometryCommitment(region: PrivateAddressPredicateRegion) {
  return sha256Base64Url({
    algorithm: PRIVATE_ADDRESS_PREDICATE_COMMITMENT_ALGORITHM,
    kind: 'region-geometry',
    region,
  });
}

async function credentialBindingCommitment(credential: AddressCredentialEnvelope, privateProofSalt: string) {
  return sha256Base64Url({
    algorithm: PRIVATE_ADDRESS_PREDICATE_COMMITMENT_ALGORITHM,
    kind: 'credential-binding',
    credentialClaim: credential.claim,
    salt: privateProofSalt,
  });
}

async function addressWitnessCommitment(
  address: CanonicalAddressParts | Record<string, unknown>,
  credential: AddressCredentialEnvelope,
  privateProofSalt: string
) {
  return sha256Base64Url({
    algorithm: PRIVATE_ADDRESS_PREDICATE_COMMITMENT_ALGORITHM,
    kind: 'address-witness',
    address: normalizeCredentialAddress(address),
    credentialAddressCommitment: credential.claim.addressCommitment,
    salt: privateProofSalt,
  });
}

async function identityBindingClaim(input: {
  identityBinding: PrivateAddressPredicateIdentityBindingInput;
  scope: string;
  challengeDigest: string;
  credentialBindingCommitment: string;
  addressWitnessCommitment: string;
}) {
  const provider = normalizeIdentityProvider(input.identityBinding.provider);
  const subjectId = normalizeIdentitySubject(input.identityBinding.subjectId);
  if (!subjectId) throw new Error('Identity binding requires a private subject id.');

  const issuer = normalizeIdentityIssuer(input.identityBinding.issuer);
  const audience = normalizeIdentityAudience(input.identityBinding.audience);
  const credentialId = normalizeIdentitySubject(input.identityBinding.credentialId);
  const privateIdentityBindingSalt = input.identityBinding.privateIdentityBindingSalt ?? generateRandomToken();
  const subjectCommitment = await sha256Base64Url({
    algorithm: PRIVATE_ADDRESS_PREDICATE_IDENTITY_BINDING_ALGORITHM,
    kind: 'identity-subject',
    provider,
    ...(issuer ? { issuer } : {}),
    ...(audience ? { audience } : {}),
    ...(credentialId ? { credentialId } : {}),
    subjectId,
    salt: privateIdentityBindingSalt,
  });
  const bindingCommitment = await sha256Base64Url({
    algorithm: PRIVATE_ADDRESS_PREDICATE_IDENTITY_BINDING_ALGORITHM,
    kind: 'address-proof-identity-binding',
    provider,
    ...(issuer ? { issuer } : {}),
    ...(audience ? { audience } : {}),
    subjectCommitment,
    scope: input.scope,
    challengeHash: input.challengeDigest,
    credentialBindingCommitment: input.credentialBindingCommitment,
    addressWitnessCommitment: input.addressWitnessCommitment,
    salt: privateIdentityBindingSalt,
  });

  return {
    claim: {
      algorithm: PRIVATE_ADDRESS_PREDICATE_IDENTITY_BINDING_ALGORITHM,
      provider,
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
      subjectCommitment,
      bindingCommitment,
    } satisfies PrivateAddressPredicateIdentityBindingClaim,
    privateIdentityBindingSalt,
  };
}

async function deliveryWitnessCommitment(input: {
  address: CanonicalAddressParts | Record<string, unknown>;
  point: { lat: number; lon: number };
  regionId: string;
  geometryCommitment: string;
  privateProofSalt: string;
}) {
  return sha256Base64Url({
    algorithm: PRIVATE_ADDRESS_PREDICATE_COMMITMENT_ALGORITHM,
    kind: 'delivery-region-witness',
    address: normalizeCredentialAddress(input.address),
    point: input.point,
    regionId: input.regionId,
    geometryCommitment: input.geometryCommitment,
    salt: input.privateProofSalt,
  });
}

async function sameAddressCommitment(input: {
  address: CanonicalAddressParts | Record<string, unknown>;
  groupId: string;
  scope: string;
  challengeDigest: string;
}) {
  return sha256Base64Url({
    algorithm: PRIVATE_ADDRESS_PREDICATE_COMMITMENT_ALGORITHM,
    kind: 'same-address-context',
    address: normalizeCredentialAddress(input.address),
    groupId: normalizeToken(input.groupId),
    scope: input.scope,
    challengeHash: input.challengeDigest,
  });
}

async function buildPredicateStatement(
  request: CreatePrivateAddressPredicateRequest,
  input: CreatePrivateAddressPredicateProofInput,
  scope: string,
  challengeDigest: string,
  privateProofSalt: string
): Promise<PrivateAddressPredicateStatement> {
  const addressCountry = countryFromAddress(input.address);
  const addressCity = cityFromAddress(input.address);

  if (request.kind === 'verified-address') {
    return {
      kind: 'verified-address',
      satisfied: true,
      credentialIssuerId: input.credential.signature.issuerId,
      layer: input.credential.claim.layer,
      qualityBand: input.credential.claim.qualityBand,
      verificationStatus: input.credential.claim.verificationStatus,
    };
  }

  if (request.kind === 'country-resident') {
    const requestedCountry = normalizeCountryCode(request.countryCode);
    if (!requestedCountry || requestedCountry !== addressCountry) {
      throw new Error('Hidden address does not satisfy the requested country resident predicate.');
    }
    return {
      kind: 'country-resident',
      satisfied: true,
      countryCode: requestedCountry,
    };
  }

  if (request.kind === 'city-resident') {
    const requestedCountry = normalizeCountryCode(request.countryCode || addressCountry);
    const requestedCityKey = normalizeCityKey(requestedCountry, request.city);
    const addressCityKey = normalizeCityKey(requestedCountry, addressCity);
    if (!addressCity || requestedCityKey !== addressCityKey) {
      throw new Error('Hidden address does not satisfy the requested city resident predicate.');
    }
    return {
      kind: 'city-resident',
      satisfied: true,
      ...(requestedCountry ? { countryCode: requestedCountry } : {}),
      cityKey: requestedCityKey,
    };
  }

  if (request.kind === 'same-address-resident') {
    const groupId = normalizeToken(request.groupId);
    if (!groupId) throw new Error('Same-address resident predicate requires a group id.');
    return {
      kind: 'same-address-resident',
      satisfied: true,
      groupId,
      sameAddressCommitment: await sameAddressCommitment({
        address: input.address,
        groupId,
        scope,
        challengeDigest,
      }),
    };
  }

  const point = assertPoint(input.point);
  if (!isPointInsideRegion(point, request.region)) {
    throw new Error('Hidden address point is outside the requested delivery region.');
  }
  const regionId = normalizeToken(request.region.id);
  if (!regionId) throw new Error('Delivery region predicate requires a region id.');
  const regionPurpose = request.region.purpose ?? 'delivery-area';
  const regionGeometryCommitment = await geometryCommitment(request.region);
  return {
    kind: 'delivery-region',
    satisfied: true,
    regionId,
    regionPurpose,
    ...(request.region.version ? { regionVersion: request.region.version } : {}),
    geometryType: request.region.geometry.type,
    geometryCommitment: regionGeometryCommitment,
    witnessCommitment: await deliveryWitnessCommitment({
      address: input.address,
      point,
      regionId,
      geometryCommitment: regionGeometryCommitment,
      privateProofSalt,
    }),
  };
}

function privacyFields(): PrivateAddressPredicatePrivacyField[] {
  return [
    'address',
    'address-credential-body',
    'address-commitment',
    'postal-code',
    'road',
    'house-number',
    'building',
    'unit',
    'recipient',
    'phone',
    'latitude',
    'longitude',
    'region-geometry',
    'identity-subject',
    'identity-credential',
    'identity-binding-salt',
    'credential-private-salt',
    'proof-salt',
  ];
}

export async function createPrivateAddressPredicateProof(
  input: CreatePrivateAddressPredicateProofInput
): Promise<PrivateAddressPredicateProofEnvelope> {
  if (input.predicates.length === 0) {
    throw new Error('Private address predicate proof requires at least one predicate.');
  }

  const credentialVerification = await verifyAddressCredential(input.credential, {
    issuerSecret: input.credentialIssuerSecret ?? input.issuerSecret,
    address: input.address,
    privateSalt: input.credentialPrivateSalt ?? input.credential.privateSalt,
    minimumScore: input.minimumScore ?? 0.7,
    allowedStatuses: input.allowedStatuses ?? DEFAULT_ALLOWED_STATUSES,
    now: input.issuedAt,
  });
  if (!credentialVerification.valid || credentialVerification.addressMatches !== true) {
    throw new Error(`Address credential does not bind the hidden address: ${credentialVerification.errors.join(',')}`);
  }

  const scope = normalizeScope(input.scope);
  const challenge = normalizeText(input.challenge) || generateRandomToken();
  const challengeDigest = await challengeHash(challenge);
  const issuedAt = toIsoDate(input.issuedAt);
  const privateProofSalt = input.privateProofSalt ?? generateRandomToken();
  const predicateStatements = await Promise.all(input.predicates.map(predicate => buildPredicateStatement(
    predicate,
    input,
    scope,
    challengeDigest,
    privateProofSalt
  )));
  const credentialBinding = await credentialBindingCommitment(input.credential, privateProofSalt);
  const addressWitness = await addressWitnessCommitment(input.address, input.credential, privateProofSalt);
  const identityBinding = input.identityBinding
    ? await identityBindingClaim({
      identityBinding: input.identityBinding,
      scope,
      challengeDigest,
      credentialBindingCommitment: credentialBinding,
      addressWitnessCommitment: addressWitness,
    })
    : undefined;

  const claim: PrivateAddressPredicateClaim = {
    version: PRIVATE_ADDRESS_PREDICATE_PROOF_VERSION,
    workflowVersion: PRIVATE_ADDRESS_PREDICATE_WORKFLOW_VERSION,
    scope,
    challengeHash: challengeDigest,
    issuedAt,
    ...(input.ttlSeconds ? { expiresAt: addSeconds(issuedAt, input.ttlSeconds) } : {}),
    credential: {
      issuerId: input.credential.signature.issuerId,
      layer: input.credential.claim.layer,
      qualityBand: input.credential.claim.qualityBand,
      verificationStatus: input.credential.claim.verificationStatus,
      scoreFloor: Math.floor(input.credential.claim.verificationScore * 100) / 100,
      credentialBindingCommitment: credentialBinding,
    },
    ...(identityBinding ? { identityBinding: identityBinding.claim } : {}),
    predicates: predicateStatements,
    commitments: {
      addressWitnessCommitment: addressWitness,
      predicateSetCommitment: await sha256Base64Url({
        algorithm: PRIVATE_ADDRESS_PREDICATE_COMMITMENT_ALGORITHM,
        kind: 'predicate-set',
        predicates: predicateStatements,
        addressWitness,
        salt: privateProofSalt,
      }),
    },
    privacy: {
      hides: privacyFields(),
      reveals: [
        'predicate-kind',
        'predicate-target',
        'predicate-result',
        'scope',
        'challenge-hash',
        'credential-quality',
        'commitments',
        'issuer',
        ...(identityBinding
          ? [
            'identity-provider' as const,
            'identity-audience' as const,
            'identity-issuer' as const,
            'identity-commitments' as const,
          ]
          : []),
      ],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'holder-knows-hidden-address-satisfying-public-predicates',
    },
  };

  return {
    claim,
    signature: {
      algorithm: PRIVATE_ADDRESS_PREDICATE_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, signingPayload(claim)),
    },
    privateProofSalt,
    ...(identityBinding ? { privateIdentityBindingSalt: identityBinding.privateIdentityBindingSalt } : {}),
    localCacheKey: `private-address-predicate:${await sha256Base64Url({
      credentialBinding,
      identityBindingCommitment: identityBinding?.claim.bindingCommitment,
      predicates: predicateStatements,
      scope,
      issuerId: input.issuerId,
    })}`,
  };
}

export function stripPrivateAddressPredicateProofMaterial(
  envelope: PrivateAddressPredicateProofEnvelope
): Omit<PrivateAddressPredicateProofEnvelope, 'privateProofSalt' | 'privateIdentityBindingSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    signature: envelope.signature,
  };
}

function hasPredicate(
  claim: PrivateAddressPredicateClaim,
  requirement: VerifyPrivateAddressPredicateRequirement
) {
  return claim.predicates.some(predicate => {
    if (predicate.kind !== requirement.kind || predicate.satisfied !== true) return false;
    if (requirement.kind === 'verified-address') {
      return predicate.kind === 'verified-address';
    }
    if (requirement.kind === 'delivery-region') {
      return predicate.kind === 'delivery-region' && predicate.regionId === normalizeToken(requirement.regionId);
    }
    if (requirement.kind === 'same-address-resident') {
      return predicate.kind === 'same-address-resident' && predicate.groupId === normalizeToken(requirement.groupId);
    }
    if (requirement.kind === 'country-resident') {
      return predicate.kind === 'country-resident' && predicate.countryCode === normalizeCountryCode(requirement.countryCode);
    }
    const requestedCountry = normalizeCountryCode(requirement.countryCode || '');
    return predicate.kind === 'city-resident'
      && predicate.cityKey === normalizeCityKey(requestedCountry || predicate.countryCode, requirement.city);
  });
}

async function verifyPrivateAddressPredicateProofUnchecked(
  envelope: PrivateAddressPredicateProofEnvelope,
  options: VerifyPrivateAddressPredicateProofOptions = {}
): Promise<PrivateAddressPredicateProofVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== PRIVATE_ADDRESS_PREDICATE_PROOF_VERSION) errors.push('unsupported-private-address-predicate-version');
  if (claim.workflowVersion !== PRIVATE_ADDRESS_PREDICATE_WORKFLOW_VERSION) errors.push('unsupported-private-address-predicate-workflow');
  if (envelope.signature.algorithm !== PRIVATE_ADDRESS_PREDICATE_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-signature-algorithm');
  }
  if (options.issuerId && options.issuerId !== envelope.signature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedScope && normalizeScope(options.expectedScope) !== claim.scope) errors.push('scope-mismatch');
  if (options.expectedChallenge && await challengeHash(options.expectedChallenge) !== claim.challengeHash) {
    errors.push('challenge-mismatch');
  }
  if (options.minimumScore !== undefined && claim.credential.scoreFloor < options.minimumScore) {
    errors.push('minimum-score-not-met');
  }
  if (options.allowedStatuses && !options.allowedStatuses.includes(claim.credential.verificationStatus)) {
    errors.push('status-not-allowed');
  }

  const now = options.now ? new Date(options.now) : new Date();
  const expired = Boolean(claim.expiresAt && new Date(claim.expiresAt).getTime() <= now.getTime());
  if (expired) errors.push('private-address-predicate-proof-expired');

  const predicatesSatisfied = claim.predicates.length > 0
    && claim.predicates.every(predicate => predicate.satisfied === true)
    && (options.requiredPredicates ?? []).every(requirement => hasPredicate(claim, requirement));
  if (!predicatesSatisfied) errors.push('required-predicate-not-proven');

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(options.issuerSecret, signingPayload(claim), envelope.signature.value);
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  const publicEnvelope = stripPrivateAddressPredicateProofMaterial(envelope);
  const publicText = stableStringify(publicEnvelope);
  const privacyPreserved = !('privateProofSalt' in envelope)
    && !('privateIdentityBindingSalt' in envelope)
    && !('localCacheKey' in envelope)
    && !('privateProofSalt' in publicEnvelope)
    && !('privateIdentityBindingSalt' in publicEnvelope)
    && !('localCacheKey' in publicEnvelope)
    && !publicText.includes('"privateProofSalt"')
    && !publicText.includes('"privateIdentityBindingSalt"')
    && !publicText.includes('"privateSalt"')
    && !publicText.includes('"addressCommitment"')
    && !publicText.includes('"postalCodeHash"')
    && !/"(?:lat|lon|lng|latitude|longitude|north|south|west|east|radiusMeters|rings|subjectId|credentialId)"\s*:/iu.test(publicText)
    && privacyFields().every(field => claim.privacy.hides.includes(field));
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    valid: errors.length === 0 && signatureValid === true && predicatesSatisfied,
    signatureValid,
    expired,
    predicatesSatisfied,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}

export async function verifyPrivateAddressPredicateProof(
  envelope: PrivateAddressPredicateProofEnvelope,
  options: VerifyPrivateAddressPredicateProofOptions = {}
): Promise<PrivateAddressPredicateProofVerificationResult> {
  try {
    return await verifyPrivateAddressPredicateProofUnchecked(envelope, options);
  } catch {
    return {
      valid: false,
      signatureValid: null,
      expired: false,
      predicatesSatisfied: false,
      privacyPreserved: false,
      proofCost: 'none',
      errors: ['malformed-private-address-predicate-proof'],
      warnings: ['verification-runtime-guarded'],
    };
  }
}
