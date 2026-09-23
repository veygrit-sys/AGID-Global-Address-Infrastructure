import { decodeAGID } from './agid';
import { isValidAGIDFormat, normalizeAGIDInput } from './agidSecurity';
import { normalizeAOIDId } from './aoid';

export const REGION_MEMBERSHIP_PROOF_VERSION = 'region-membership-proof-v1';
export const REGION_MEMBERSHIP_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const REGION_MEMBERSHIP_COMMITMENT_ALGORITHM = 'sha256-salted-region-membership-v1';

export type RegionMembershipSubjectKind = 'AGID' | 'AOID' | 'POINT';
export type RegionMembershipRelation = 'inside';
export type RegionMembershipRegionPurpose =
  | 'administrative'
  | 'delivery-area'
  | 'country-border'
  | 'custom';

export type RegionMembershipGeometryType = 'bbox' | 'circle' | 'polygon';
export type RegionMembershipCoordinate = [number, number]; // [lon, lat]

export type RegionMembershipPoint = {
  lat: number;
  lon?: number;
  lng?: number;
};

export type RegionMembershipGeometry =
  | {
      type: 'bbox';
      north: number;
      south: number;
      west: number;
      east: number;
    }
  | {
      type: 'circle';
      center: RegionMembershipPoint;
      radiusMeters: number;
    }
  | {
      type: 'polygon';
      rings: RegionMembershipCoordinate[][];
    };

export type RegionMembershipRegion = {
  id: string;
  name?: string;
  purpose?: RegionMembershipRegionPurpose;
  version?: string;
  sourceIds?: string[];
  geometry: RegionMembershipGeometry;
};

export type RegionMembershipPrivacyField =
  | 'agid'
  | 'aoid'
  | 'subject-id'
  | 'latitude'
  | 'longitude'
  | 'address'
  | 'region-geometry'
  | 'membership-salt';

export type RegionMembershipProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'subject-is-inside-region-with-hidden-location';
};

export type RegionMembershipClaim = {
  version: typeof REGION_MEMBERSHIP_PROOF_VERSION;
  subjectKind: RegionMembershipSubjectKind;
  subjectRef?: string;
  scope: string;
  relation: RegionMembershipRelation;
  challengeHash: string;
  issuedAt: string;
  expiresAt?: string;
  membership: {
    inside: true;
    regionId: string;
    regionName?: string;
    regionPurpose: RegionMembershipRegionPurpose;
    regionVersion?: string;
    geometryType: RegionMembershipGeometryType;
    geometryCommitment: string;
    subjectCommitment: string;
    witnessCommitment: string;
  };
  privacy: {
    hides: RegionMembershipPrivacyField[];
    reveals: Array<
      | 'subject-kind'
      | 'subject-ref'
      | 'scope'
      | 'relation'
      | 'region-id'
      | 'region-name'
      | 'region-purpose'
      | 'challenge-hash'
      | 'commitments'
      | 'issuer'
    >;
  };
  proofHint: RegionMembershipProofHint;
};

export type RegionMembershipSignature = {
  algorithm: typeof REGION_MEMBERSHIP_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type RegionMembershipProofEnvelope = {
  claim: RegionMembershipClaim;
  signature: RegionMembershipSignature;
  privateMembershipSalt?: string;
  localCacheKey?: string;
};

export type CreateRegionMembershipProofInput = {
  issuerId: string;
  issuerSecret: string;
  subjectKind: RegionMembershipSubjectKind;
  subjectId?: string;
  agid?: string;
  point?: RegionMembershipPoint;
  address?: unknown;
  region: RegionMembershipRegion;
  scope?: string;
  challenge?: string;
  issuedAt?: Date | string;
  ttlSeconds?: number;
  privateMembershipSalt?: string;
  revealSubjectRef?: boolean;
  revealRegionName?: boolean;
};

export type VerifyRegionMembershipProofOptions = {
  issuerId?: string;
  issuerSecret?: string;
  expectedSubjectKind?: RegionMembershipSubjectKind;
  expectedScope?: string;
  expectedRegionId?: string;
  expectedChallenge?: string;
  requireSubjectRef?: boolean;
  now?: Date | string;
};

export type RegionMembershipProofVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  membershipAsserted: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  errors: string[];
  warnings: string[];
};

const textEncoder = new TextEncoder();
const EARTH_RADIUS_METERS = 6_371_008.8;
const POINT_ON_BOUNDARY_EPSILON = 1e-10;
const REGION_MEMBERSHIP_SUBJECT_KINDS = new Set<RegionMembershipSubjectKind>(['AGID', 'AOID', 'POINT']);
const REGION_MEMBERSHIP_PURPOSES = new Set<RegionMembershipRegionPurpose>([
  'administrative',
  'delivery-area',
  'country-border',
  'custom',
]);
const REGION_MEMBERSHIP_GEOMETRY_TYPES = new Set<RegionMembershipGeometryType>(['bbox', 'circle', 'polygon']);

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for region membership proofs.');
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
  return (normalizeText(value) || 'REGION-MEMBERSHIP').toUpperCase();
}

function normalizeRegionId(value: unknown) {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9:_.-]+/g, '-').replace(/^-+|-+$/g, '');
}

function isRegionMembershipSubjectKind(value: unknown): value is RegionMembershipSubjectKind {
  return typeof value === 'string' && REGION_MEMBERSHIP_SUBJECT_KINDS.has(value as RegionMembershipSubjectKind);
}

function isRegionMembershipPurpose(value: unknown): value is RegionMembershipRegionPurpose {
  return typeof value === 'string' && REGION_MEMBERSHIP_PURPOSES.has(value as RegionMembershipRegionPurpose);
}

function isRegionMembershipGeometryType(value: unknown): value is RegionMembershipGeometryType {
  return typeof value === 'string' && REGION_MEMBERSHIP_GEOMETRY_TYPES.has(value as RegionMembershipGeometryType);
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

function addSeconds(isoDate: string, ttlSeconds: number) {
  return new Date(new Date(isoDate).getTime() + ttlSeconds * 1000).toISOString();
}

function generateMembershipSalt(byteLength = 32) {
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

function signingPayload(claim: RegionMembershipClaim) {
  return stableStringify(claim);
}

function numericPoint(point: RegionMembershipPoint) {
  const lat = Number(point.lat);
  const lon = Number(point.lon ?? point.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error('Region membership proof requires a valid latitude witness.');
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error('Region membership proof requires a valid longitude witness.');
  }
  return { lat, lon };
}

function normalizeLon(lon: number) {
  let normalized = lon;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function normalizeSubject(input: CreateRegionMembershipProofInput) {
  if (!isRegionMembershipSubjectKind(input.subjectKind)) {
    throw new Error('Region membership proof requires subjectKind to be AGID, AOID, or POINT.');
  }

  if (input.subjectKind === 'AGID') {
    const agid = normalizeAGIDInput(input.agid ?? input.subjectId);
    if (!agid || !isValidAGIDFormat(agid)) {
      throw new Error('Region membership proof requires a valid AGID subject.');
    }
    return agid;
  }

  if (input.subjectKind === 'AOID') {
    return normalizeAOIDId(input.subjectId);
  }

  return normalizeText(input.subjectId) || 'POINT';
}

function subjectPoint(input: CreateRegionMembershipProofInput, subject: string) {
  if (input.subjectKind === 'AGID' && !input.point) {
    const decoded = decodeAGID(subject);
    if (!decoded) throw new Error('Region membership proof cannot decode the AGID subject.');
    return { lat: decoded.lat, lon: decoded.lon };
  }

  if (!input.point) {
    throw new Error('Region membership proof requires a hidden point witness for AOID or POINT subjects.');
  }
  return numericPoint(input.point);
}

function canonicalGeometry(geometry: RegionMembershipGeometry) {
  if (!geometry || typeof geometry !== 'object' || !isRegionMembershipGeometryType((geometry as { type?: unknown }).type)) {
    throw new Error('Region membership proof requires a supported geometry type: bbox, circle, or polygon.');
  }

  if (geometry.type === 'bbox') {
    const north = Number(geometry.north);
    const south = Number(geometry.south);
    const west = normalizeLon(Number(geometry.west));
    const east = normalizeLon(Number(geometry.east));
    if (![north, south, west, east].every(Number.isFinite) || south > north || south < -90 || north > 90) {
      throw new Error('Region membership proof requires a valid bbox geometry.');
    }
    return { type: 'bbox' as const, north, south, west, east };
  }

  if (geometry.type === 'circle') {
    const center = numericPoint(geometry.center);
    const radiusMeters = Number(geometry.radiusMeters);
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      throw new Error('Region membership proof requires a positive circle radius.');
    }
    return { type: 'circle' as const, center, radiusMeters };
  }

  if (!geometry.rings.length || geometry.rings.some(ring => ring.length < 4)) {
    throw new Error('Region membership proof requires a polygon ring with at least four points.');
  }

  return {
    type: 'polygon' as const,
    rings: geometry.rings.map(ring => ring.map(([lon, lat]) => {
      const normalized = [normalizeLon(Number(lon)), Number(lat)] as RegionMembershipCoordinate;
      if (!Number.isFinite(normalized[0]) || !Number.isFinite(normalized[1])) {
        throw new Error('Region membership proof requires finite polygon coordinates.');
      }
      return normalized;
    })),
  };
}

function canonicalRegion(region: RegionMembershipRegion) {
  const id = normalizeRegionId(region.id);
  if (!id) throw new Error('Region membership proof requires a region id.');
  if (region.purpose !== undefined && !isRegionMembershipPurpose(region.purpose)) {
    throw new Error('Region membership proof requires a supported region purpose.');
  }
  const purpose = region.purpose ?? 'custom';
  return {
    id,
    ...(normalizeText(region.name) ? { name: normalizeText(region.name) } : {}),
    purpose,
    ...(normalizeText(region.version) ? { version: normalizeText(region.version) } : {}),
    sourceIds: [...(region.sourceIds ?? [])].map(normalizeText).filter(Boolean).sort(),
    geometry: canonicalGeometry(region.geometry),
  };
}

function bboxContains(point: { lat: number; lon: number }, bbox: Extract<ReturnType<typeof canonicalGeometry>, { type: 'bbox' }>) {
  const lon = normalizeLon(point.lon);
  const inLon = bbox.west <= bbox.east
    ? lon >= bbox.west - POINT_ON_BOUNDARY_EPSILON && lon <= bbox.east + POINT_ON_BOUNDARY_EPSILON
    : lon >= bbox.west - POINT_ON_BOUNDARY_EPSILON || lon <= bbox.east + POINT_ON_BOUNDARY_EPSILON;
  return point.lat >= bbox.south - POINT_ON_BOUNDARY_EPSILON
    && point.lat <= bbox.north + POINT_ON_BOUNDARY_EPSILON
    && inLon;
}

function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const phi1 = a.lat * Math.PI / 180;
  const phi2 = b.lat * Math.PI / 180;
  const deltaPhi = (b.lat - a.lat) * Math.PI / 180;
  const deltaLambda = (normalizeLon(b.lon - a.lon)) * Math.PI / 180;
  const sinPhi = Math.sin(deltaPhi / 2);
  const sinLambda = Math.sin(deltaLambda / 2);
  const h = sinPhi * sinPhi + Math.cos(phi1) * Math.cos(phi2) * sinLambda * sinLambda;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

function pointOnSegment(
  point: { lat: number; lon: number },
  a: RegionMembershipCoordinate,
  b: RegionMembershipCoordinate
) {
  let x = normalizeLon(point.lon);
  const y = point.lat;
  const x1 = a[0];
  const y1 = a[1];
  const x2 = b[0];
  const y2 = b[1];

  while (x - x1 > 180) x -= 360;
  while (x - x1 < -180) x += 360;

  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (Math.abs(cross) > POINT_ON_BOUNDARY_EPSILON) return false;

  const dot = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
  if (dot < -POINT_ON_BOUNDARY_EPSILON) return false;

  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  return dot <= lengthSquared + POINT_ON_BOUNDARY_EPSILON;
}

function unwrapRingForPoint(ring: RegionMembershipCoordinate[], pointLon: number) {
  const reference = normalizeLon(pointLon);
  return ring.map(([lon, lat]) => {
    let adjustedLon = normalizeLon(lon);
    while (adjustedLon - reference > 180) adjustedLon -= 360;
    while (adjustedLon - reference < -180) adjustedLon += 360;
    return [adjustedLon, lat] as RegionMembershipCoordinate;
  });
}

function ringContainsPoint(point: { lat: number; lon: number }, ring: RegionMembershipCoordinate[]) {
  const unwrapped = unwrapRingForPoint(ring, point.lon);
  for (let index = 0, previous = unwrapped.length - 1; index < unwrapped.length; previous = index, index += 1) {
    if (pointOnSegment(point, unwrapped[previous], unwrapped[index])) return true;
  }

  let inside = false;
  const x = normalizeLon(point.lon);
  const y = point.lat;
  for (let index = 0, previous = unwrapped.length - 1; index < unwrapped.length; previous = index, index += 1) {
    const [xi, yi] = unwrapped[index];
    const [xj, yj] = unwrapped[previous];
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function polygonContains(point: { lat: number; lon: number }, rings: RegionMembershipCoordinate[][]) {
  const [outer, ...holes] = rings;
  if (!ringContainsPoint(point, outer)) return false;
  return !holes.some(hole => ringContainsPoint(point, hole));
}

function isPointInsideRegion(point: { lat: number; lon: number }, geometry: ReturnType<typeof canonicalGeometry>) {
  if (geometry.type === 'bbox') return bboxContains(point, geometry);
  if (geometry.type === 'circle') return haversineMeters(point, geometry.center) <= geometry.radiusMeters + 0.001;
  return polygonContains(point, geometry.rings);
}

async function challengeHash(challenge: string) {
  return sha256Base64Url(stableStringify({
    algorithm: REGION_MEMBERSHIP_COMMITMENT_ALGORITHM,
    kind: 'challenge',
    challenge,
  }));
}

async function geometryCommitment(region: ReturnType<typeof canonicalRegion>) {
  return sha256Base64Url(stableStringify({
    algorithm: REGION_MEMBERSHIP_COMMITMENT_ALGORITHM,
    kind: 'region-geometry',
    region,
  }));
}

async function subjectCommitment(input: {
  subjectKind: RegionMembershipSubjectKind;
  subject: string;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: REGION_MEMBERSHIP_COMMITMENT_ALGORITHM,
    kind: 'subject',
    subjectKind: input.subjectKind,
    subject: input.subject,
    scope: input.scope,
    salt: input.salt,
  }));
}

async function witnessCommitment(input: {
  subjectKind: RegionMembershipSubjectKind;
  subject: string;
  point: { lat: number; lon: number };
  address: unknown;
  regionId: string;
  geometryCommitment: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: REGION_MEMBERSHIP_COMMITMENT_ALGORITHM,
    kind: 'membership-witness',
    subjectKind: input.subjectKind,
    subject: input.subject,
    point: input.point,
    address: input.address ?? null,
    regionId: input.regionId,
    geometryCommitment: input.geometryCommitment,
    salt: input.salt,
  }));
}

function privacyHidesForSubject(subjectKind: RegionMembershipSubjectKind, revealSubjectRef?: boolean) {
  const hides: RegionMembershipPrivacyField[] = [
    'latitude',
    'longitude',
    'address',
    'region-geometry',
    'membership-salt',
  ];

  if (!revealSubjectRef) {
    hides.push('subject-id');
    if (subjectKind === 'AGID') hides.push('agid');
    if (subjectKind === 'AOID') hides.push('aoid');
  }

  return hides;
}

export async function createRegionMembershipProof(
  input: CreateRegionMembershipProofInput
): Promise<RegionMembershipProofEnvelope> {
  const subject = normalizeSubject(input);
  const point = subjectPoint(input, subject);
  const region = canonicalRegion(input.region);
  const scope = normalizeScope(input.scope);
  const challenge = normalizeText(input.challenge) || generateMembershipSalt(16);
  const privateMembershipSalt = input.privateMembershipSalt ?? generateMembershipSalt();
  const inside = isPointInsideRegion(point, region.geometry);
  if (!inside) {
    throw new Error('Region membership proof witness is outside the requested region.');
  }

  const regionGeometryCommitment = await geometryCommitment(region);
  const issuedAt = toIsoDate(input.issuedAt);
  const reveals: RegionMembershipClaim['privacy']['reveals'] = [
    'subject-kind',
    'scope',
    'relation',
    'region-id',
    'region-purpose',
    'challenge-hash',
    'commitments',
    'issuer',
  ];
  if (input.revealSubjectRef) reveals.push('subject-ref');
  if (input.revealRegionName && region.name) reveals.push('region-name');

  const claim: RegionMembershipClaim = {
    version: REGION_MEMBERSHIP_PROOF_VERSION,
    subjectKind: input.subjectKind,
    ...(input.revealSubjectRef ? { subjectRef: subject } : {}),
    scope,
    relation: 'inside',
    challengeHash: await challengeHash(challenge),
    issuedAt,
    ...(input.ttlSeconds ? { expiresAt: addSeconds(issuedAt, input.ttlSeconds) } : {}),
    membership: {
      inside: true,
      regionId: region.id,
      ...(input.revealRegionName && region.name ? { regionName: region.name } : {}),
      regionPurpose: region.purpose,
      ...(region.version ? { regionVersion: region.version } : {}),
      geometryType: region.geometry.type,
      geometryCommitment: regionGeometryCommitment,
      subjectCommitment: await subjectCommitment({
        subjectKind: input.subjectKind,
        subject,
        scope,
        salt: privateMembershipSalt,
      }),
      witnessCommitment: await witnessCommitment({
        subjectKind: input.subjectKind,
        subject,
        point,
        address: input.address,
        regionId: region.id,
        geometryCommitment: regionGeometryCommitment,
        salt: privateMembershipSalt,
      }),
    },
    privacy: {
      hides: privacyHidesForSubject(input.subjectKind, input.revealSubjectRef),
      reveals,
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'subject-is-inside-region-with-hidden-location',
    },
  };

  return {
    claim,
    privateMembershipSalt,
    localCacheKey: `region-membership:${await sha256Base64Url(stableStringify({
      subjectKind: claim.subjectKind,
      subjectCommitment: claim.membership.subjectCommitment,
      witnessCommitment: claim.membership.witnessCommitment,
      regionId: claim.membership.regionId,
      scope,
      issuerId: input.issuerId,
    }))}`,
    signature: {
      algorithm: REGION_MEMBERSHIP_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, signingPayload(claim)),
    },
  };
}

export function stripPrivateRegionMembershipProofMaterial(
  envelope: RegionMembershipProofEnvelope
): Omit<RegionMembershipProofEnvelope, 'privateMembershipSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    signature: envelope.signature,
  };
}

async function verifyRegionMembershipProofUnchecked(
  envelope: RegionMembershipProofEnvelope,
  options: VerifyRegionMembershipProofOptions = {}
): Promise<RegionMembershipProofVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== REGION_MEMBERSHIP_PROOF_VERSION) errors.push('unsupported-region-membership-version');
  if (envelope.signature.algorithm !== REGION_MEMBERSHIP_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-signature-algorithm');
  }
  if (options.issuerId && options.issuerId !== envelope.signature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedSubjectKind && options.expectedSubjectKind !== claim.subjectKind) errors.push('subject-kind-mismatch');
  if (options.expectedScope && normalizeScope(options.expectedScope) !== claim.scope) errors.push('scope-mismatch');
  if (options.expectedRegionId && normalizeRegionId(options.expectedRegionId) !== claim.membership.regionId) {
    errors.push('region-mismatch');
  }
  if (options.requireSubjectRef && !claim.subjectRef) errors.push('subject-ref-required');
  if (options.expectedChallenge && await challengeHash(options.expectedChallenge) !== claim.challengeHash) {
    errors.push('challenge-mismatch');
  }

  const now = options.now ? new Date(options.now) : new Date();
  const expired = Boolean(claim.expiresAt && new Date(claim.expiresAt).getTime() <= now.getTime());
  if (expired) errors.push('region-membership-proof-expired');

  const membershipAsserted = claim.relation === 'inside' && claim.membership.inside === true;
  if (!membershipAsserted) errors.push('membership-not-asserted');

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(options.issuerSecret, signingPayload(claim), envelope.signature.value);
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  const publicEnvelope = stripPrivateRegionMembershipProofMaterial(envelope);
  const publicText = stableStringify(publicEnvelope);
  const privacyPreserved = !('privateMembershipSalt' in envelope)
    && !('localCacheKey' in envelope)
    && !('privateMembershipSalt' in publicEnvelope)
    && !('localCacheKey' in publicEnvelope)
    && !/"(?:lat|lon|lng|latitude|longitude)"\s*:/iu.test(publicText)
    && !/"(?:address|geometry|rings|north|south|west|east|center|radiusMeters|coordinates)"\s*:/iu.test(publicText)
    && claim.privacy.hides.includes('latitude')
    && claim.privacy.hides.includes('longitude')
    && claim.privacy.hides.includes('address')
    && claim.privacy.hides.includes('region-geometry')
    && claim.privacy.hides.includes('membership-salt');
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    valid: errors.length === 0 && signatureValid === true && membershipAsserted,
    signatureValid,
    expired,
    membershipAsserted,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}

export async function verifyRegionMembershipProof(
  envelope: RegionMembershipProofEnvelope,
  options: VerifyRegionMembershipProofOptions = {}
): Promise<RegionMembershipProofVerificationResult> {
  try {
    return await verifyRegionMembershipProofUnchecked(envelope, options);
  } catch {
    return {
      valid: false,
      signatureValid: null,
      expired: false,
      membershipAsserted: false,
      privacyPreserved: false,
      proofCost: 'none',
      errors: ['malformed-region-membership-proof'],
      warnings: ['verification-runtime-guarded'],
    };
  }
}
