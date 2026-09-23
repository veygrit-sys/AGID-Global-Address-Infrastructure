import {
  collectAddressDnsPrivateMaterialErrors,
} from './addressDnsRecord';
import {
  validatePublicPayloadSeparation,
} from './publicPrivateSeparation';
import { sha256Hex } from './sha256';

export const ADDRESS_INTERNET_PROTOCOLS_VERSION = 'address-internet-protocols-v1';
export const ADDRESS_PROTOCOL_SIGNATURE_ALGORITHM = 'sha256-domain-separated-address-protocol-signature-v1';

export type AddressProtocolSignature = {
  algorithm: typeof ADDRESS_PROTOCOL_SIGNATURE_ALGORITHM | 'ed25519' | 'secp256k1' | 'external';
  keyId: string;
  signatureValue: string;
  signedAt?: string;
};

export type AddressRouteServiceClass =
  | 'address-resolution'
  | 'delivery'
  | 'pickup'
  | 'return'
  | 'humanitarian'
  | 'audit';

export type AddressServiceRecordType =
  | 'RESOLVER'
  | 'CARRIER'
  | 'ISSUER'
  | 'REVOCATION'
  | 'CREDENTIAL_STATUS'
  | 'MX'
  | 'SRV';

export type AddressServiceEndpointPurpose =
  | 'resolver'
  | 'carrier'
  | 'issuer'
  | 'revocation'
  | 'credential-status'
  | 'delivery-notification'
  | 'audit'
  | 'payment'
  | 'local-sync';

export type AddressCacheProfile =
  | 'postal-code'
  | 'address-rule'
  | 'administrative-boundary'
  | 'delivery-eligibility'
  | 'issuer-metadata'
  | 'route-advertisement'
  | 'disaster-shelter'
  | 'agid-secure'
  | 'local-mdns';

export type AddressCachePolicy = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  cacheClass: 'address-cache-control';
  profile: AddressCacheProfile;
  ttlSeconds: number;
  cacheControl: string;
  etag: string;
  generatedAt: string;
  expiresAt: string;
  revalidateAfter: string;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressServiceRecord = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  recordClass: 'address-dns-service-record';
  recordId: string;
  recordHash: string;
  zone: string;
  ownerName: string;
  recordType: AddressServiceRecordType;
  service: AddressServiceEndpointPurpose;
  endpoint: string;
  priority: number;
  weight: number;
  ttlSeconds: number;
  validFrom: string;
  validUntil: string;
  countries: string[];
  regions: string[];
  carrierIds: string[];
  issuerIds: string[];
  serviceClasses: AddressRouteServiceClass[];
  cachePolicy?: AddressCachePolicy;
  signature: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressServiceRecordInput = Omit<
  Partial<AddressServiceRecord>,
  'version' | 'recordClass' | 'recordId' | 'recordHash' | 'signature' | 'privacy'
> & {
  zone: string;
  ownerName?: string;
  recordType: AddressServiceRecordType;
  service: AddressServiceEndpointPurpose;
  endpoint: string;
  signature?: AddressProtocolSignature;
};

export type AddressSignedZoneBundle = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  bundleClass: 'dnssec-rpki-style-address-zone';
  zone: string;
  parentZone?: string;
  serial: number;
  validFrom: string;
  validUntil: string;
  authorizedIssuerIds: string[];
  authorizedKeyIds: string[];
  serviceRecords: AddressServiceRecord[];
  routeAdvertisements: AddressRouteAdvertisement[];
  bundleHash: string;
  signature: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressCertificateTransparencyEntry = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  logClass: 'address-certificate-transparency';
  logId: string;
  entryId: string;
  issuerId: string;
  subjectKind: 'resolver' | 'carrier' | 'aoid-issuer' | 'municipality' | 'humanitarian-org' | 'pos-terminal';
  subjectId: string;
  publicKeyCommitment: string;
  notBefore: string;
  notAfter: string;
  previousEntryHash?: string;
  entryHash: string;
  signature?: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressRevocationSubjectKind =
  | 'credential'
  | 'agid-secure'
  | 'aoid-authority'
  | 'delivery-qr'
  | 'issuer-key'
  | 'service-record'
  | 'route-advertisement';

export type AddressRevocationStatus = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  revocationClass: 'ocsp-crl-address-status';
  subjectKind: AddressRevocationSubjectKind;
  subjectCommitment: string;
  issuerId: string;
  status: 'good' | 'revoked' | 'unknown';
  reason?: 'key-compromise' | 'superseded' | 'misissued' | 'expired' | 'user-request' | 'used' | 'policy';
  thisUpdate: string;
  nextUpdate: string;
  statusHash: string;
  signature: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressConsentScope =
  | 'delivery:read'
  | 'recipient:verify'
  | 'return:label'
  | 'aid:eligibility'
  | 'issuer:verify'
  | 'revocation:read'
  | 'audit:write'
  | 'pos:handoff'
  | 'address:display';

export type AddressConsentGrant = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  consentClass: 'oauth-scope-address-consent';
  grantId: string;
  subjectCommitment: string;
  issuerId: string;
  audience: string;
  purpose: string;
  scopes: AddressConsentScope[];
  issuedAt: string;
  expiresAt: string;
  nonceCommitment: string;
  signature?: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressEphemeralAlias = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  aliasClass: 'ipv6-privacy-nat-address-alias';
  aliasCommitment: string;
  stableCommitmentHash: string;
  domain: string;
  purpose: string;
  issuedAt: string;
  expiresAt: string;
  nonceCommitment: string;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressEdgeRoutingContext = {
  country?: string;
  region?: string;
  carrierId?: string;
  serviceClass?: AddressRouteServiceClass;
  preferredZone?: string;
};

export type AddressEdgeRouteSelection = {
  selected: boolean;
  recordId?: string;
  routeId?: string;
  zone?: string;
  endpoint?: string;
  score: number;
  reasons: string[];
  warnings: string[];
};

export type AddressLocalDiscoveryRecord = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  discoveryClass: 'mdns-local-address-resolver';
  serviceName: string;
  instanceId: string;
  endpoint: string;
  capabilities: AddressServiceEndpointPurpose[];
  ttlSeconds: number;
  validUntil: string;
  signature?: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressResolutionHttpStatus = {
  code: 200 | 202 | 206 | 409 | 410 | 422 | 451;
  text:
    | 'resolved'
    | 'pending-review'
    | 'partial'
    | 'conflict'
    | 'revoked'
    | 'unresolved'
    | 'restricted-high-risk';
  retryable: boolean;
  operatorMeaning: string;
};

export type AddressRouteAdvertisement = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  routeId: string;
  routeHash: string;
  routeClass: 'address-bgp';
  zone: string;
  countries: string[];
  regions: string[];
  carrierIds: string[];
  serviceClasses: AddressRouteServiceClass[];
  resolverEndpoint: string;
  rdapEndpoint?: string;
  priority: number;
  trustScore: number;
  validFrom: string;
  validUntil: string;
  roots: {
    addressDnsSnapshotRoot?: string;
    officialAddressSnapshotRoot?: string;
    postalDatasetRoot?: string;
    boundaryRoot?: string;
    revocationRoot?: string;
    freshnessRoot?: string;
  };
  policyHash?: string;
  signature: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressRouteAdvertisementInput = Omit<
  Partial<AddressRouteAdvertisement>,
  'version' | 'routeClass' | 'routeId' | 'routeHash' | 'signature' | 'privacy'
> & {
  zone: string;
  countries?: string[];
  regions?: string[];
  carrierIds?: string[];
  serviceClasses?: AddressRouteServiceClass[];
  resolverEndpoint: string;
  signature?: AddressProtocolSignature;
};

export type AddressRdapMetadata = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  rdapClass: 'agid-zone' | 'issuer' | 'resolver';
  handle: string;
  zone?: string;
  issuerId?: string;
  organization: string;
  status: 'active' | 'suspended' | 'revoked';
  roles: Array<'technical' | 'abuse' | 'security' | 'policy' | 'operations'>;
  serviceEndpoints: string[];
  policyUri?: string;
  publicKeyCommitments: string[];
  metadataHash: string;
  updatedAt: string;
  signature?: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressIssuerAuthPolicy = {
  domain: string;
  dmarcPolicy: 'none' | 'quarantine' | 'reject';
  alignment: 'strict' | 'relaxed';
  allowedIssuerIds: string[];
  allowedFromDomains: string[];
  allowedSigningDomains: string[];
  allowedResolverHosts: string[];
  requiredDkimSelectors: string[];
  publicKeyCommitments: string[];
};

export type AddressIssuerAuthEnvelope = {
  kind: 'delivery-notification' | 'address-credential' | 'issuer-metadata' | 'audit-event';
  issuerId: string;
  fromDomain: string;
  signingDomain: string;
  dkimSelector: string;
  resolverHost?: string;
  messageHash: string;
  signature: AddressProtocolSignature;
  scope?: string;
};

export type AddressContentSnapshot = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  snapshotClass: 'content-addressed-address-data';
  datasetKind:
    | 'address-rules'
    | 'postal-codes'
    | 'boundary-cells'
    | 'issuer-metadata'
    | 'route-advertisements'
    | 'public-policy';
  sourceUri: string;
  license: string;
  generatedAt: string;
  mediaType: string;
  payloadHash: string;
  contentAddress: string;
  ipfsCid?: string;
  byteLength: number;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressWebhookEventType =
  | 'address.revoked'
  | 'credential.updated'
  | 'delivery.completed'
  | 'audit.flagged'
  | 'issuer.suspended'
  | 'route.changed';

export type AddressWebhookSubscription = {
  subscriptionId: string;
  endpoint: string;
  eventTypes: AddressWebhookEventType[];
  signingKeyId: string;
  active: boolean;
  minTrustScore?: number;
};

export type AddressWebhookEvent = {
  version: typeof ADDRESS_INTERNET_PROTOCOLS_VERSION;
  eventId: string;
  eventType: AddressWebhookEventType;
  createdAt: string;
  subjectCommitment: string;
  publicPayload: Record<string, unknown>;
  signature: AddressProtocolSignature;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressAbuseOperation =
  | 'resolve'
  | 'reverse-lookup'
  | 'route-advertise'
  | 'rdap-lookup'
  | 'webhook-dispatch'
  | 'proof-verify';

export type AddressAbuseControlInput = {
  actorKey: string;
  operation: AddressAbuseOperation;
  limit: number;
  windowMs: number;
  now?: number;
};

export type AddressAbuseControlResult = {
  allowed: boolean;
  actorKeyHash: string;
  operation: AddressAbuseOperation;
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
  warnings: string[];
};

export type AddressProtocolPrivacyPosture = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawCoordinatesStored: false;
  recipientIdentityStored: false;
  acceptedMaterial: string[];
  rejectedMaterial: string[];
};

export type AddressProtocolValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  signatureVerified: boolean;
  privacy: AddressProtocolPrivacyPosture;
};

export type AddressContentLanguageDecision = {
  requested: string;
  selected: string;
  fallback: boolean;
  candidates: Array<{ language: string; q: number }>;
};

type JsonRecord = Record<string, unknown>;

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function normalizeId(value: unknown) {
  return clean(value).replace(/\s+/g, '-');
}

function normalizeDomain(value: unknown) {
  return clean(value)
    .replace(/\.$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCommitment(value: unknown) {
  const text = clean(value);
  if (!text) return '';
  return text.startsWith('0x') ? `0x${text.slice(2).toLowerCase()}` : text.toLowerCase();
}

function normalizeCountry(value: unknown) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9_-]+/g, '');
}

function normalizeIso(value: unknown, fallback = new Date()) {
  const text = clean(value);
  const date = text ? new Date(text) : fallback;
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback.toISOString();
}

function parseDate(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function boundedInt(value: unknown, fallback: number, max: number) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(0, Math.min(max, numeric));
}

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.entries(value as JsonRecord)
    .filter(([, nested]) => nested !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(',')}}`;
}

function safePrivacy(): AddressProtocolPrivacyPosture {
  return {
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    rawCoordinatesStored: false,
    recipientIdentityStored: false,
    acceptedMaterial: [
      'routeHash',
      'zone',
      'country/region scope',
      'carrierId',
      'resolverEndpoint',
      'RDAP metadata',
      'issuerId',
      'publicKeyCommitment',
      'policyHash',
      'dataset root',
      'content address',
      'webhook event commitment',
      'service endpoint metadata',
      'signed zone bundle',
      'certificate transparency entry',
      'revocation status commitment',
      'cache policy and ETag',
      'consent scope grant',
      'ephemeral alias commitment',
      'edge route selection',
      'mDNS local resolver metadata',
      'signature',
    ],
    rejectedMaterial: [
      'raw address',
      'raw AGID',
      'raw AOID',
      'latitude/longitude',
      'recipient name',
      'phone number',
      'email',
      'room or unit number',
      'AGID-S ciphertext',
    ],
  };
}

function privateMaterialErrors(value: unknown, path = 'input') {
  const addressDnsErrors = collectAddressDnsPrivateMaterialErrors(value, path).filter(error => {
    if (!error.includes('appears to contain raw location material')) return true;
    const errorPath = error.split(' ')[0] || '';
    return !/(\.(version|routeClass|routeId|routeHash|zone|resolverEndpoint|rdapEndpoint|organization|status|metadataHash|datasetKind|sourceUri|license|mediaType|payloadHash|contentAddress|eventId|eventType|subjectCommitment|recordClass|recordId|recordHash|ownerName|recordType|service|endpoint|cacheClass|profile|cacheControl|etag|generatedAt|expiresAt|revalidateAfter|bundleClass|parentZone|serial|bundleHash|logClass|logId|entryId|issuerId|subjectKind|subjectId|publicKeyCommitment|notBefore|notAfter|previousEntryHash|entryHash|revocationClass|reason|thisUpdate|nextUpdate|statusHash|consentClass|grantId|audience|purpose|issuedAt|nonceCommitment|aliasClass|aliasCommitment|stableCommitmentHash|domain|discoveryClass|serviceName|instanceId|validUntil|ttlSeconds|priority|weight)|\.(countries|regions|carrierIds|issuerIds|serviceClasses|roles|serviceEndpoints|publicKeyCommitments|authorizedIssuerIds|authorizedKeyIds|capabilities|scopes)\[\d+\]|\.(policyHash|messageHash|[a-zA-Z0-9]+Commitment|[a-zA-Z0-9]+Hash|[a-zA-Z0-9]+Root)|\.publicPayload\.status$)/.test(errorPath);
  });
  return unique([
    ...addressDnsErrors,
    ...validatePublicPayloadSeparation(value).errors,
  ]);
}

function canonicalSignedPayload(value: unknown) {
  return stableStringify(value);
}

function signingPayload(value: unknown, keyId: string) {
  return stableStringify({
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    algorithm: ADDRESS_PROTOCOL_SIGNATURE_ALGORITHM,
    keyId: normalizeId(keyId),
    payload: value,
  });
}

function endpointIsSafe(endpoint: string) {
  if (!endpoint) return false;
  if (endpoint.startsWith('/.well-known/')) return true;
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function localEndpointIsSafe(endpoint: string) {
  if (!endpoint) return false;
  if (endpoint.startsWith('/.well-known/')) return true;
  try {
    const url = new URL(endpoint);
    const host = url.hostname.toLowerCase();
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:'
      && (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local'));
  } catch {
    return false;
  }
}

function cacheTtlForProfile(profile: AddressCacheProfile) {
  switch (profile) {
    case 'postal-code':
    case 'address-rule':
      return 7 * 24 * 60 * 60;
    case 'administrative-boundary':
      return 24 * 60 * 60;
    case 'issuer-metadata':
    case 'route-advertisement':
      return 60 * 60;
    case 'delivery-eligibility':
      return 15 * 60;
    case 'disaster-shelter':
      return 5 * 60;
    case 'agid-secure':
      return 5 * 60;
    case 'local-mdns':
      return 60;
    default:
      return 15 * 60;
  }
}

function futureIso(base: string, seconds: number) {
  const date = parseDate(base) ?? new Date();
  return new Date(date.getTime() + Math.max(0, seconds) * 1000).toISOString();
}

function hostOf(endpoint: string) {
  try {
    return new URL(endpoint).host.toLowerCase();
  } catch {
    return '';
  }
}

function relaxedDomainMatch(left: string, right: string) {
  const a = normalizeDomain(left).split('.').filter(Boolean);
  const b = normalizeDomain(right).split('.').filter(Boolean);
  if (a.length < 2 || b.length < 2) return normalizeDomain(left) === normalizeDomain(right);
  return a.slice(-2).join('.') === b.slice(-2).join('.');
}

function canonicalRoutePayload(route: Omit<AddressRouteAdvertisement, 'routeId' | 'routeHash' | 'signature'>) {
  return route;
}

function routeHashFromPayload(payload: Omit<AddressRouteAdvertisement, 'routeId' | 'routeHash' | 'signature'>) {
  return sha256Hex(canonicalSignedPayload(canonicalRoutePayload(payload)));
}

function routeIdFromHash(hash: string) {
  return `ARTE-${hash.slice(0, 24).toUpperCase()}`;
}

function routeSignaturePayload(route: AddressRouteAdvertisement) {
  const { signature: _signature, ...unsignedRoute } = route;
  return unsignedRoute;
}

function canonicalServiceRecordPayload(record: Omit<AddressServiceRecord, 'recordId' | 'recordHash' | 'signature'>) {
  return record;
}

function serviceRecordHashFromPayload(payload: Omit<AddressServiceRecord, 'recordId' | 'recordHash' | 'signature'>) {
  return sha256Hex(canonicalSignedPayload(canonicalServiceRecordPayload(payload)));
}

function serviceRecordIdFromHash(hash: string) {
  return `ASRV-${hash.slice(0, 24).toUpperCase()}`;
}

function serviceRecordSignaturePayload(record: AddressServiceRecord) {
  const { signature: _signature, ...unsignedRecord } = record;
  return unsignedRecord;
}

function zoneBundleSignaturePayload(bundle: AddressSignedZoneBundle) {
  const { signature: _signature, privacy: _privacy, ...unsignedBundle } = bundle;
  return unsignedBundle;
}

function revocationStatusSignaturePayload(status: AddressRevocationStatus) {
  const { signature: _signature, privacy: _privacy, ...unsignedStatus } = status;
  return unsignedStatus;
}

export function addressEtagForPayload(payload: unknown) {
  return `"agid-${sha256Hex(typeof payload === 'string' ? payload : stableStringify(payload)).slice(0, 32)}"`;
}

export function createAddressCachePolicy(input: {
  profile: AddressCacheProfile;
  payload?: unknown;
  ttlSeconds?: number;
  generatedAt?: string;
}): AddressCachePolicy {
  const generatedAt = normalizeIso(input.generatedAt, new Date());
  const ttlSeconds = boundedInt(input.ttlSeconds, cacheTtlForProfile(input.profile), 31_536_000);
  const revalidateAfter = futureIso(generatedAt, Math.max(1, Math.floor(ttlSeconds / 2)));
  const expiresAt = futureIso(generatedAt, ttlSeconds);
  return {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    cacheClass: 'address-cache-control',
    profile: input.profile,
    ttlSeconds,
    cacheControl: `public, max-age=${ttlSeconds}, must-revalidate`,
    etag: addressEtagForPayload(input.payload ?? {
      profile: input.profile,
      generatedAt,
      ttlSeconds,
    }),
    generatedAt,
    expiresAt,
    revalidateAfter,
    privacy: safePrivacy(),
  };
}

export function validateAddressCachePolicy(
  policy: AddressCachePolicy,
  options: { now?: string; payload?: unknown } = {},
): AddressProtocolValidationResult & { stale: boolean; expired: boolean } {
  const errors = privateMaterialErrors(policy, 'cachePolicy');
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const generatedAt = parseDate(policy.generatedAt);
  const expiresAt = parseDate(policy.expiresAt);
  const revalidateAfter = parseDate(policy.revalidateAfter);

  if (policy.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-cache-policy-version');
  if (policy.cacheClass !== 'address-cache-control') errors.push('unsupported-cache-policy-class');
  if (!Number.isFinite(policy.ttlSeconds) || policy.ttlSeconds <= 0) errors.push('ttlSeconds must be positive');
  if (!/^"agid-[0-9a-f]{32}"$/.test(policy.etag)) errors.push('etag must be an AGID weak content tag');
  if (!generatedAt) errors.push('generatedAt must be an ISO date');
  if (!expiresAt) errors.push('expiresAt must be an ISO date');
  if (!revalidateAfter) errors.push('revalidateAfter must be an ISO date');
  if (generatedAt && expiresAt && expiresAt.getTime() <= generatedAt.getTime()) {
    errors.push('expiresAt must be later than generatedAt');
  }
  if (options.payload !== undefined && policy.etag !== addressEtagForPayload(options.payload)) {
    errors.push('etag does not match supplied payload');
  }

  const stale = Boolean(revalidateAfter && checkedAt.getTime() >= revalidateAfter.getTime());
  const expired = Boolean(expiresAt && checkedAt.getTime() >= expiresAt.getTime());
  if (stale && !expired) warnings.push('cache-policy-revalidation-recommended');
  if (expired) errors.push('cache-policy-expired');

  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: false,
    privacy: safePrivacy(),
    stale,
    expired,
  };
}

export function signAddressProtocolPayload(
  payload: unknown,
  keyId: string,
  secret: string,
  signedAt?: string,
): AddressProtocolSignature {
  const normalizedKeyId = normalizeId(keyId);
  const digest = sha256Hex(stableStringify({
    secret,
    signingPayload: signingPayload(payload, normalizedKeyId),
  }));
  return {
    algorithm: ADDRESS_PROTOCOL_SIGNATURE_ALGORITHM,
    keyId: normalizedKeyId,
    signatureValue: digest,
    signedAt: normalizeIso(signedAt, new Date()),
  };
}

export function verifyAddressProtocolSignature(
  payload: unknown,
  signature: AddressProtocolSignature | undefined,
  secretsByKeyId: Record<string, string> = {},
) {
  if (!signature) {
    return {
      verified: false,
      errors: ['signature-required'],
      warnings: [],
    };
  }

  if (signature.algorithm !== ADDRESS_PROTOCOL_SIGNATURE_ALGORITHM) {
    return {
      verified: false,
      errors: [],
      warnings: ['external-signature-present-but-local-verifier-not-configured'],
    };
  }

  const keyId = normalizeId(signature.keyId);
  const secret = secretsByKeyId[keyId];
  if (!secret) {
    return {
      verified: false,
      errors: [],
      warnings: ['signature-secret-not-configured-for-local-verification'],
    };
  }

  const expected = signAddressProtocolPayload(payload, keyId, secret, signature.signedAt).signatureValue;
  return {
    verified: expected === signature.signatureValue,
    errors: expected === signature.signatureValue ? [] : ['signature-verification-failed'],
    warnings: [],
  };
}

export function createAddressServiceRecord(
  input: AddressServiceRecordInput,
  signing: { keyId: string; secret: string; signedAt?: string },
): AddressServiceRecord {
  const now = new Date();
  const validFrom = normalizeIso(input.validFrom, now);
  const validUntil = normalizeIso(input.validUntil, new Date(now.getTime() + cacheTtlForProfile('route-advertisement') * 1000));
  const zone = normalizeDomain(input.zone);
  const ownerName = normalizeDomain(input.ownerName || input.zone);
  const ttlSeconds = boundedInt(input.ttlSeconds, cacheTtlForProfile(input.cachePolicy?.profile || 'route-advertisement'), 31_536_000);
  const payloadWithoutSignature: Omit<AddressServiceRecord, 'recordId' | 'recordHash' | 'signature'> = {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    recordClass: 'address-dns-service-record',
    zone,
    ownerName: ownerName.endsWith(zone) ? ownerName : `${ownerName}.${zone}`,
    recordType: input.recordType,
    service: input.service,
    endpoint: clean(input.endpoint),
    priority: boundedInt(input.priority, 100, 65_535),
    weight: boundedInt(input.weight, 0, 65_535),
    ttlSeconds,
    validFrom,
    validUntil,
    countries: unique((input.countries || []).map(normalizeCountry)),
    regions: unique((input.regions || []).map(normalizeId)),
    carrierIds: unique((input.carrierIds || []).map(normalizeId)),
    issuerIds: unique((input.issuerIds || []).map(normalizeId)),
    serviceClasses: input.serviceClasses?.length ? input.serviceClasses : ['address-resolution'],
    cachePolicy: input.cachePolicy || createAddressCachePolicy({
      profile: 'route-advertisement',
      ttlSeconds,
      generatedAt: validFrom,
      payload: {
        zone,
        ownerName,
        recordType: input.recordType,
        service: input.service,
        endpoint: clean(input.endpoint),
      },
    }),
    privacy: safePrivacy(),
  };
  const recordHash = serviceRecordHashFromPayload(payloadWithoutSignature);
  const unsignedRecord = {
    ...payloadWithoutSignature,
    recordId: serviceRecordIdFromHash(recordHash),
    recordHash,
  };
  return {
    ...unsignedRecord,
    signature: input.signature || signAddressProtocolPayload(unsignedRecord, signing.keyId, signing.secret, signing.signedAt),
  };
}

export function validateAddressServiceRecord(
  record: AddressServiceRecord,
  options: {
    now?: string;
    secretsByKeyId?: Record<string, string>;
    requireVerifiedSignature?: boolean;
  } = {},
): AddressProtocolValidationResult {
  const errors = privateMaterialErrors(record, 'serviceRecord');
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const validFrom = parseDate(record.validFrom);
  const validUntil = parseDate(record.validUntil);

  if (record.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-service-record-version');
  if (record.recordClass !== 'address-dns-service-record') errors.push('unsupported-service-record-class');
  if (!normalizeDomain(record.zone)) errors.push('zone is required');
  if (!normalizeDomain(record.ownerName)) errors.push('ownerName is required');
  if (!record.ownerName.endsWith(record.zone)) warnings.push('ownerName is outside advertised zone');
  if (!endpointIsSafe(record.endpoint)) errors.push('service endpoint must be HTTPS or /.well-known/');
  if (!record.countries.length && !record.regions.length && !record.carrierIds.length && !record.issuerIds.length) {
    warnings.push('service-record-has-broad-scope');
  }
  if (!validFrom) errors.push('validFrom must be an ISO date');
  if (!validUntil) errors.push('validUntil must be an ISO date');
  if (validFrom && validUntil && validUntil.getTime() <= validFrom.getTime()) {
    errors.push('validUntil must be later than validFrom');
  }
  if (validFrom && validFrom.getTime() > checkedAt.getTime()) warnings.push('service-record-not-yet-valid');
  if (validUntil && validUntil.getTime() <= checkedAt.getTime()) errors.push('service-record-expired');
  if (record.cachePolicy) {
    const cacheValidation = validateAddressCachePolicy(record.cachePolicy, { now: options.now });
    errors.push(...cacheValidation.errors.map(error => `cachePolicy:${error}`));
    warnings.push(...cacheValidation.warnings.map(warning => `cachePolicy:${warning}`));
  }

  const { signature: _signature, recordId: _recordId, recordHash: _recordHash, ...payloadWithoutIdentity } = record;
  const expectedHash = serviceRecordHashFromPayload(payloadWithoutIdentity);
  const expectedRecordId = serviceRecordIdFromHash(expectedHash);
  if (record.recordHash !== expectedHash) errors.push('recordHash does not match canonical service record payload');
  if (record.recordId !== expectedRecordId) errors.push('recordId does not match recordHash');
  if (!record.signature) errors.push('signed-service-record-required');

  const signatureCheck = verifyAddressProtocolSignature(serviceRecordSignaturePayload(record), record.signature, options.secretsByKeyId);
  errors.push(...signatureCheck.errors);
  warnings.push(...signatureCheck.warnings);
  if (options.requireVerifiedSignature && !signatureCheck.verified) {
    errors.push('service-record-signature-verification-required');
  }

  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: signatureCheck.verified,
    privacy: safePrivacy(),
  };
}

export function validateAddressServiceRecordSet(
  records: AddressServiceRecord[],
  options: Parameters<typeof validateAddressServiceRecord>[1] = {},
) {
  const results = records.map(record => ({
    recordId: record.recordId,
    zone: record.zone,
    service: record.service,
    recordType: record.recordType,
    validation: validateAddressServiceRecord(record, options),
  }));
  return {
    accepted: results.filter(item => item.validation.valid).length,
    rejected: results.filter(item => !item.validation.valid).length,
    results,
    errors: unique(results.flatMap(item => item.validation.errors.map(error => `${item.recordId || item.zone}: ${error}`))),
    warnings: unique(results.flatMap(item => item.validation.warnings.map(warning => `${item.recordId || item.zone}: ${warning}`))),
  };
}

export function selectAddressEdgeRoute(input: {
  serviceRecords?: AddressServiceRecord[];
  routeAdvertisements?: AddressRouteAdvertisement[];
  context?: AddressEdgeRoutingContext;
  now?: string;
}): AddressEdgeRouteSelection {
  const context = input.context || {};
  const country = normalizeCountry(context.country);
  const region = normalizeId(context.region);
  const carrierId = normalizeId(context.carrierId);
  const preferredZone = normalizeDomain(context.preferredZone || '');
  const candidates: AddressEdgeRouteSelection[] = [];

  for (const record of input.serviceRecords || []) {
    const validation = validateAddressServiceRecord(record, { now: input.now });
    if (!validation.valid) continue;
    let score = 100_000 - record.priority * 10 + record.weight;
    const reasons: string[] = ['valid-service-record'];
    if (country && record.countries.includes(country)) { score += 4000; reasons.push('country-match'); }
    if (region && record.regions.includes(region)) { score += 2000; reasons.push('region-match'); }
    if (carrierId && record.carrierIds.includes(carrierId)) { score += 2000; reasons.push('carrier-match'); }
    if (context.serviceClass && record.serviceClasses.includes(context.serviceClass)) { score += 1000; reasons.push('service-class-match'); }
    if (preferredZone && record.zone === preferredZone) { score += 500; reasons.push('preferred-zone'); }
    candidates.push({
      selected: true,
      recordId: record.recordId,
      zone: record.zone,
      endpoint: record.endpoint,
      score,
      reasons,
      warnings: validation.warnings,
    });
  }

  for (const route of input.routeAdvertisements || []) {
    const validation = validateAddressRouteAdvertisement(route, { now: input.now });
    if (!validation.valid) continue;
    let score = 90_000 - route.priority * 10 + Math.round(route.trustScore * 1000);
    const reasons: string[] = ['valid-route-advertisement'];
    if (country && route.countries.includes(country)) { score += 4000; reasons.push('country-match'); }
    if (region && route.regions.includes(region)) { score += 2000; reasons.push('region-match'); }
    if (carrierId && route.carrierIds.includes(carrierId)) { score += 2000; reasons.push('carrier-match'); }
    if (context.serviceClass && route.serviceClasses.includes(context.serviceClass)) { score += 1000; reasons.push('service-class-match'); }
    if (preferredZone && route.zone === preferredZone) { score += 500; reasons.push('preferred-zone'); }
    candidates.push({
      selected: true,
      routeId: route.routeId,
      zone: route.zone,
      endpoint: route.resolverEndpoint,
      score,
      reasons,
      warnings: validation.warnings,
    });
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] || {
    selected: false,
    score: 0,
    reasons: [],
    warnings: ['no-valid-edge-route-found'],
  };
}

export function createAddressRouteAdvertisement(
  input: AddressRouteAdvertisementInput,
  signing: { keyId: string; secret: string; signedAt?: string },
): AddressRouteAdvertisement {
  const now = new Date();
  const validFrom = normalizeIso(input.validFrom, now);
  const validUntil = normalizeIso(input.validUntil, new Date(now.getTime() + 15 * 60 * 1000));
  const payloadWithoutSignature: Omit<AddressRouteAdvertisement, 'routeId' | 'routeHash' | 'signature'> = {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    routeClass: 'address-bgp',
    zone: normalizeDomain(input.zone),
    countries: unique((input.countries || []).map(normalizeCountry)),
    regions: unique((input.regions || []).map(normalizeId)),
    carrierIds: unique((input.carrierIds || []).map(normalizeId)),
    serviceClasses: input.serviceClasses?.length ? input.serviceClasses : ['address-resolution'],
    resolverEndpoint: clean(input.resolverEndpoint),
    rdapEndpoint: clean(input.rdapEndpoint) || undefined,
    priority: boundedInt(input.priority, 100, 65_535),
    trustScore: clamp01(input.trustScore ?? 0.5),
    validFrom,
    validUntil,
    roots: {
      addressDnsSnapshotRoot: normalizeCommitment(input.roots?.addressDnsSnapshotRoot) || undefined,
      officialAddressSnapshotRoot: normalizeCommitment(input.roots?.officialAddressSnapshotRoot) || undefined,
      postalDatasetRoot: normalizeCommitment(input.roots?.postalDatasetRoot) || undefined,
      boundaryRoot: normalizeCommitment(input.roots?.boundaryRoot) || undefined,
      revocationRoot: normalizeCommitment(input.roots?.revocationRoot) || undefined,
      freshnessRoot: normalizeCommitment(input.roots?.freshnessRoot) || undefined,
    },
    policyHash: normalizeCommitment(input.policyHash) || undefined,
    privacy: safePrivacy(),
  };
  const routeHash = routeHashFromPayload(payloadWithoutSignature);
  const unsignedRoute = {
    ...payloadWithoutSignature,
    routeId: routeIdFromHash(routeHash),
    routeHash,
  };
  return {
    ...unsignedRoute,
    signature: input.signature || signAddressProtocolPayload(unsignedRoute, signing.keyId, signing.secret, signing.signedAt),
  };
}

export function validateAddressRouteAdvertisement(
  route: AddressRouteAdvertisement,
  options: {
    now?: string;
    secretsByKeyId?: Record<string, string>;
    requireVerifiedSignature?: boolean;
  } = {},
): AddressProtocolValidationResult {
  const errors = privateMaterialErrors(route, 'route');
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const validFrom = parseDate(route.validFrom);
  const validUntil = parseDate(route.validUntil);

  if (route.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-route-version');
  if (route.routeClass !== 'address-bgp') errors.push('unsupported-route-class');
  if (!normalizeDomain(route.zone)) errors.push('zone is required');
  if (!endpointIsSafe(route.resolverEndpoint)) errors.push('resolverEndpoint must be HTTPS or /.well-known/');
  if (route.rdapEndpoint && !endpointIsSafe(route.rdapEndpoint)) errors.push('rdapEndpoint must be HTTPS or /.well-known/');
  if (!route.countries.length && !route.regions.length && !route.carrierIds.length) {
    errors.push('route scope must include country, region, or carrier');
  }
  if (!validFrom) errors.push('validFrom must be an ISO date');
  if (!validUntil) errors.push('validUntil must be an ISO date');
  if (validFrom && validUntil && validUntil.getTime() <= validFrom.getTime()) {
    errors.push('validUntil must be later than validFrom');
  }
  if (validFrom && validFrom.getTime() > checkedAt.getTime()) warnings.push('route-not-yet-valid');
  if (validUntil && validUntil.getTime() <= checkedAt.getTime()) errors.push('route-expired');

  const { signature: _signature, routeId: _routeId, routeHash: _routeHash, ...payloadWithoutIdentity } = route;
  const expectedHash = routeHashFromPayload(payloadWithoutIdentity);
  const expectedRouteId = routeIdFromHash(expectedHash);
  if (route.routeHash !== expectedHash) errors.push('routeHash does not match canonical route payload');
  if (route.routeId !== expectedRouteId) errors.push('routeId does not match routeHash');
  if (!route.signature) errors.push('signed-route-advertisement-required');

  const signatureCheck = verifyAddressProtocolSignature(routeSignaturePayload(route), route.signature, options.secretsByKeyId);
  errors.push(...signatureCheck.errors);
  warnings.push(...signatureCheck.warnings);
  if (options.requireVerifiedSignature && !signatureCheck.verified) {
    errors.push('route-signature-verification-required');
  }

  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: signatureCheck.verified,
    privacy: safePrivacy(),
  };
}

export function validateAddressRouteSet(
  routes: AddressRouteAdvertisement[],
  options: Parameters<typeof validateAddressRouteAdvertisement>[1] = {},
) {
  const results = routes.map(route => ({
    routeId: route.routeId,
    zone: route.zone,
    validation: validateAddressRouteAdvertisement(route, options),
  }));
  return {
    accepted: results.filter(item => item.validation.valid).length,
    rejected: results.filter(item => !item.validation.valid).length,
    results,
    errors: unique(results.flatMap(item => item.validation.errors.map(error => `${item.routeId || item.zone}: ${error}`))),
    warnings: unique(results.flatMap(item => item.validation.warnings.map(warning => `${item.routeId || item.zone}: ${warning}`))),
  };
}

export function createSignedAddressZoneBundle(
  input: Omit<Partial<AddressSignedZoneBundle>, 'version' | 'bundleClass' | 'bundleHash' | 'signature' | 'privacy'> & {
    zone: string;
    serviceRecords?: AddressServiceRecord[];
    routeAdvertisements?: AddressRouteAdvertisement[];
  },
  signing: { keyId: string; secret: string; signedAt?: string },
): AddressSignedZoneBundle {
  const now = new Date();
  const validFrom = normalizeIso(input.validFrom, now);
  const validUntil = normalizeIso(input.validUntil, new Date(now.getTime() + 60 * 60 * 1000));
  const unsigned: Omit<AddressSignedZoneBundle, 'bundleHash' | 'signature' | 'privacy'> = {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    bundleClass: 'dnssec-rpki-style-address-zone',
    zone: normalizeDomain(input.zone),
    parentZone: normalizeDomain(input.parentZone) || undefined,
    serial: boundedInt(input.serial, 1, Number.MAX_SAFE_INTEGER),
    validFrom,
    validUntil,
    authorizedIssuerIds: unique((input.authorizedIssuerIds || []).map(normalizeId)),
    authorizedKeyIds: unique((input.authorizedKeyIds || []).map(normalizeId)),
    serviceRecords: input.serviceRecords || [],
    routeAdvertisements: input.routeAdvertisements || [],
  };
  const bundleHash = sha256Hex(stableStringify(unsigned));
  const withHash = {
    ...unsigned,
    bundleHash,
  };
  return {
    ...withHash,
    signature: signAddressProtocolPayload(withHash, signing.keyId, signing.secret, signing.signedAt),
    privacy: safePrivacy(),
  };
}

export function validateSignedAddressZoneBundle(
  bundle: AddressSignedZoneBundle,
  options: {
    now?: string;
    secretsByKeyId?: Record<string, string>;
    requireVerifiedSignature?: boolean;
    serviceRecordSecretsByKeyId?: Record<string, string>;
    routeSecretsByKeyId?: Record<string, string>;
  } = {},
): AddressProtocolValidationResult & {
  serviceRecords: ReturnType<typeof validateAddressServiceRecordSet>;
  routeAdvertisements: ReturnType<typeof validateAddressRouteSet>;
} {
  const errors = privateMaterialErrors(bundle, 'zoneBundle');
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const validFrom = parseDate(bundle.validFrom);
  const validUntil = parseDate(bundle.validUntil);

  if (bundle.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-zone-bundle-version');
  if (bundle.bundleClass !== 'dnssec-rpki-style-address-zone') errors.push('unsupported-zone-bundle-class');
  if (!normalizeDomain(bundle.zone)) errors.push('zone is required');
  if (!validFrom) errors.push('validFrom must be an ISO date');
  if (!validUntil) errors.push('validUntil must be an ISO date');
  if (validFrom && validUntil && validUntil.getTime() <= validFrom.getTime()) errors.push('validUntil must be later than validFrom');
  if (validFrom && validFrom.getTime() > checkedAt.getTime()) warnings.push('zone-bundle-not-yet-valid');
  if (validUntil && validUntil.getTime() <= checkedAt.getTime()) errors.push('zone-bundle-expired');

  const serviceRecords = validateAddressServiceRecordSet(bundle.serviceRecords, {
    now: options.now,
    secretsByKeyId: options.serviceRecordSecretsByKeyId,
  });
  const routeAdvertisements = validateAddressRouteSet(bundle.routeAdvertisements, {
    now: options.now,
    secretsByKeyId: options.routeSecretsByKeyId,
  });
  for (const record of bundle.serviceRecords) {
    if (record.zone !== bundle.zone) errors.push(`service-record-zone-outside-bundle:${record.recordId}`);
  }
  for (const route of bundle.routeAdvertisements) {
    if (route.zone !== bundle.zone) errors.push(`route-zone-outside-bundle:${route.routeId}`);
  }

  const { signature: _signature, privacy: _privacy, ...unsigned } = bundle;
  const expectedHash = sha256Hex(stableStringify({
    ...unsigned,
    bundleHash: undefined,
  }));
  if (bundle.bundleHash !== expectedHash) errors.push('bundleHash does not match canonical zone bundle');
  const signatureCheck = verifyAddressProtocolSignature(zoneBundleSignaturePayload(bundle), bundle.signature, options.secretsByKeyId);
  errors.push(...signatureCheck.errors);
  warnings.push(...signatureCheck.warnings);
  if (options.requireVerifiedSignature && !signatureCheck.verified) errors.push('zone-bundle-signature-verification-required');

  return {
    valid: errors.length === 0 && serviceRecords.rejected === 0 && routeAdvertisements.rejected === 0,
    errors: unique([
      ...errors,
      ...serviceRecords.errors.map(error => `serviceRecord:${error}`),
      ...routeAdvertisements.errors.map(error => `routeAdvertisement:${error}`),
    ]),
    warnings: unique([
      ...warnings,
      ...serviceRecords.warnings.map(warning => `serviceRecord:${warning}`),
      ...routeAdvertisements.warnings.map(warning => `routeAdvertisement:${warning}`),
    ]),
    signatureVerified: signatureCheck.verified,
    privacy: safePrivacy(),
    serviceRecords,
    routeAdvertisements,
  };
}

export function createAddressCertificateTransparencyEntry(input: {
  logId: string;
  issuerId: string;
  subjectKind: AddressCertificateTransparencyEntry['subjectKind'];
  subjectId: string;
  publicKeyCommitment: string;
  notBefore?: string;
  notAfter?: string;
  previousEntryHash?: string;
  signature?: AddressProtocolSignature;
}): AddressCertificateTransparencyEntry {
  const notBefore = normalizeIso(input.notBefore, new Date());
  const notAfter = normalizeIso(input.notAfter, new Date(Date.parse(notBefore) + 365 * 24 * 60 * 60 * 1000));
  const unsigned: Omit<AddressCertificateTransparencyEntry, 'entryId' | 'entryHash' | 'signature' | 'privacy'> = {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    logClass: 'address-certificate-transparency' as const,
    logId: normalizeId(input.logId),
    issuerId: normalizeId(input.issuerId),
    subjectKind: input.subjectKind,
    subjectId: normalizeId(input.subjectId),
    publicKeyCommitment: normalizeCommitment(input.publicKeyCommitment),
    notBefore,
    notAfter,
    previousEntryHash: normalizeCommitment(input.previousEntryHash) || undefined,
  };
  const entryHash = sha256Hex(stableStringify(unsigned));
  return {
    ...unsigned,
    entryId: `ACT-${entryHash.slice(0, 24).toUpperCase()}`,
    entryHash,
    signature: input.signature,
    privacy: safePrivacy(),
  };
}

export function validateAddressCertificateTransparencyLog(
  entries: AddressCertificateTransparencyEntry[],
  options: { now?: string } = {},
) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  let previousHash = '';

  entries.forEach((entry, index) => {
    errors.push(...privateMaterialErrors(entry, `ctLog[${index}]`));
    if (entry.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push(`${entry.entryId}:unsupported-ct-entry-version`);
    if (entry.logClass !== 'address-certificate-transparency') errors.push(`${entry.entryId}:unsupported-ct-entry-class`);
    if (!entry.logId) errors.push(`${entry.entryId}:logId is required`);
    if (!entry.publicKeyCommitment) errors.push(`${entry.entryId}:publicKeyCommitment is required`);
    const notBefore = parseDate(entry.notBefore);
    const notAfter = parseDate(entry.notAfter);
    if (!notBefore) errors.push(`${entry.entryId}:notBefore must be an ISO date`);
    if (!notAfter) errors.push(`${entry.entryId}:notAfter must be an ISO date`);
    if (notBefore && notAfter && notAfter.getTime() <= notBefore.getTime()) errors.push(`${entry.entryId}:notAfter must be later than notBefore`);
    if (notBefore && notBefore.getTime() > checkedAt.getTime()) warnings.push(`${entry.entryId}:ct-entry-not-yet-valid`);
    if (notAfter && notAfter.getTime() <= checkedAt.getTime()) errors.push(`${entry.entryId}:ct-entry-expired`);
    if (index > 0 && entry.previousEntryHash !== previousHash) errors.push(`${entry.entryId}:ct-log-chain-broken`);

    const { entryId: _entryId, entryHash: _entryHash, signature: _signature, privacy: _privacy, ...unsigned } = entry;
    const expected = sha256Hex(stableStringify(unsigned));
    if (entry.entryHash !== expected) errors.push(`${entry.entryId}:entryHash does not match canonical CT entry`);
    if (entry.entryId !== `ACT-${expected.slice(0, 24).toUpperCase()}`) errors.push(`${entry.entryId}:entryId does not match entryHash`);
    previousHash = entry.entryHash;
  });

  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    privacy: safePrivacy(),
  };
}

export function createAddressRevocationStatus(
  input: Omit<Partial<AddressRevocationStatus>, 'version' | 'revocationClass' | 'statusHash' | 'signature' | 'privacy'> & {
    subjectKind: AddressRevocationSubjectKind;
    subjectCommitment: string;
    issuerId: string;
    status: AddressRevocationStatus['status'];
  },
  signing: { keyId: string; secret: string; signedAt?: string },
): AddressRevocationStatus {
  const now = new Date();
  const thisUpdate = normalizeIso(input.thisUpdate, now);
  const nextUpdate = normalizeIso(input.nextUpdate, new Date(now.getTime() + 15 * 60 * 1000));
  const unsigned: Omit<AddressRevocationStatus, 'statusHash' | 'signature' | 'privacy'> = {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    revocationClass: 'ocsp-crl-address-status',
    subjectKind: input.subjectKind,
    subjectCommitment: normalizeCommitment(input.subjectCommitment),
    issuerId: normalizeId(input.issuerId),
    status: input.status,
    reason: input.reason,
    thisUpdate,
    nextUpdate,
  };
  const statusHash = sha256Hex(stableStringify(unsigned));
  const withHash = {
    ...unsigned,
    statusHash,
  };
  return {
    ...withHash,
    signature: signAddressProtocolPayload(withHash, signing.keyId, signing.secret, signing.signedAt),
    privacy: safePrivacy(),
  };
}

export function validateAddressRevocationStatus(
  status: AddressRevocationStatus,
  options: { now?: string; secretsByKeyId?: Record<string, string>; requireVerifiedSignature?: boolean } = {},
): AddressProtocolValidationResult & { revoked: boolean; stale: boolean } {
  const errors = privateMaterialErrors(status, 'revocationStatus');
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const thisUpdate = parseDate(status.thisUpdate);
  const nextUpdate = parseDate(status.nextUpdate);
  if (status.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-revocation-status-version');
  if (status.revocationClass !== 'ocsp-crl-address-status') errors.push('unsupported-revocation-status-class');
  if (!status.subjectCommitment) errors.push('subjectCommitment is required');
  if (!status.issuerId) errors.push('issuerId is required');
  if (!thisUpdate) errors.push('thisUpdate must be an ISO date');
  if (!nextUpdate) errors.push('nextUpdate must be an ISO date');
  if (thisUpdate && nextUpdate && nextUpdate.getTime() <= thisUpdate.getTime()) errors.push('nextUpdate must be later than thisUpdate');
  if (thisUpdate && thisUpdate.getTime() > checkedAt.getTime()) warnings.push('revocation-status-not-yet-valid');
  const stale = Boolean(nextUpdate && nextUpdate.getTime() <= checkedAt.getTime());
  if (stale) errors.push('revocation-status-stale');
  const { signature: _signature, privacy: _privacy, statusHash: _statusHash, ...unsigned } = status;
  const expected = sha256Hex(stableStringify(unsigned));
  if (status.statusHash !== expected) errors.push('statusHash does not match canonical revocation status');
  const signatureCheck = verifyAddressProtocolSignature(revocationStatusSignaturePayload(status), status.signature, options.secretsByKeyId);
  errors.push(...signatureCheck.errors);
  warnings.push(...signatureCheck.warnings);
  if (options.requireVerifiedSignature && !signatureCheck.verified) errors.push('revocation-status-signature-verification-required');
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: signatureCheck.verified,
    privacy: safePrivacy(),
    revoked: status.status === 'revoked',
    stale,
  };
}

export function validateAddressRevocationList(
  statuses: AddressRevocationStatus[],
  options: Parameters<typeof validateAddressRevocationStatus>[1] = {},
) {
  const results = statuses.map(status => ({
    subjectCommitment: status.subjectCommitment,
    subjectKind: status.subjectKind,
    status: status.status,
    validation: validateAddressRevocationStatus(status, options),
  }));
  return {
    accepted: results.filter(item => item.validation.valid).length,
    rejected: results.filter(item => !item.validation.valid).length,
    revoked: results.filter(item => item.validation.valid && item.validation.revoked).length,
    results,
    errors: unique(results.flatMap(item => item.validation.errors.map(error => `${item.subjectCommitment}: ${error}`))),
    warnings: unique(results.flatMap(item => item.validation.warnings.map(warning => `${item.subjectCommitment}: ${warning}`))),
  };
}

export function createAddressRdapMetadata(
  input: Omit<Partial<AddressRdapMetadata>, 'version' | 'metadataHash' | 'privacy'> & {
    rdapClass: AddressRdapMetadata['rdapClass'];
    handle: string;
    organization: string;
  },
): AddressRdapMetadata {
  const payload: Omit<AddressRdapMetadata, 'metadataHash'> = {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    rdapClass: input.rdapClass,
    handle: normalizeId(input.handle),
    zone: normalizeDomain(input.zone) || undefined,
    issuerId: normalizeId(input.issuerId) || undefined,
    organization: clean(input.organization),
    status: input.status && ['active', 'suspended', 'revoked'].includes(input.status) ? input.status : 'active',
    roles: input.roles?.length ? input.roles : ['technical'],
    serviceEndpoints: (input.serviceEndpoints || []).map(clean).filter(Boolean),
    policyUri: clean(input.policyUri) || undefined,
    publicKeyCommitments: (input.publicKeyCommitments || []).map(normalizeCommitment).filter(Boolean),
    updatedAt: normalizeIso(input.updatedAt, new Date()),
    signature: input.signature,
    privacy: safePrivacy(),
  };
  return {
    ...payload,
    metadataHash: sha256Hex(stableStringify(payload)),
  };
}

export function validateAddressRdapMetadata(metadata: AddressRdapMetadata): AddressProtocolValidationResult {
  const errors = privateMaterialErrors(metadata, 'rdap');
  const warnings: string[] = [];
  if (metadata.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-rdap-version');
  if (!metadata.handle) errors.push('handle is required');
  if (!metadata.organization) errors.push('organization is required');
  if (metadata.zone && !normalizeDomain(metadata.zone)) errors.push('zone is invalid');
  if (!metadata.issuerId && !metadata.zone) warnings.push('rdap-metadata-has-no-zone-or-issuer');
  for (const endpoint of metadata.serviceEndpoints) {
    if (!endpointIsSafe(endpoint)) errors.push(`service endpoint must be HTTPS or /.well-known/: ${endpoint}`);
  }
  const { metadataHash: _hash, ...payload } = metadata;
  const expected = sha256Hex(stableStringify(payload));
  if (metadata.metadataHash !== expected) errors.push('metadataHash does not match canonical RDAP metadata');
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: false,
    privacy: safePrivacy(),
  };
}

export function negotiateAddressContentLanguage(
  acceptLanguage: string,
  availableLanguages: string[],
  defaultLanguage = 'en',
): AddressContentLanguageDecision {
  const available = unique(availableLanguages.map(language => language.toLowerCase()));
  const fallback = available.includes(defaultLanguage.toLowerCase()) ? defaultLanguage.toLowerCase() : available[0] || 'en';
  const candidates = clean(acceptLanguage)
    .split(',')
    .map(part => {
      const [languagePart, ...params] = part.trim().split(';');
      const qParam = params.find(param => param.trim().startsWith('q='));
      const q = qParam ? Number(qParam.split('=')[1]) : 1;
      return {
        language: languagePart.toLowerCase(),
        q: Number.isFinite(q) ? Math.max(0, Math.min(1, q)) : 1,
      };
    })
    .filter(item => item.language)
    .sort((left, right) => right.q - left.q);

  for (const candidate of candidates) {
    if (available.includes(candidate.language)) {
      return { requested: acceptLanguage, selected: candidate.language, fallback: false, candidates };
    }
    const base = candidate.language.split('-')[0];
    const match = available.find(language => language === base || language.startsWith(`${base}-`));
    if (match) return { requested: acceptLanguage, selected: match, fallback: false, candidates };
    if (candidate.language === '*' && available.length > 0) {
      return { requested: acceptLanguage, selected: available[0], fallback: false, candidates };
    }
  }

  return {
    requested: acceptLanguage,
    selected: fallback,
    fallback: true,
    candidates,
  };
}

export function createContentAddressedAddressSnapshot(input: {
  datasetKind: AddressContentSnapshot['datasetKind'];
  sourceUri: string;
  license: string;
  payload: unknown;
  generatedAt?: string;
  mediaType?: string;
  ipfsCid?: string;
}): AddressContentSnapshot {
  const serialized = typeof input.payload === 'string' ? input.payload : stableStringify(input.payload);
  const payloadHash = sha256Hex(serialized);
  return {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    snapshotClass: 'content-addressed-address-data',
    datasetKind: input.datasetKind,
    sourceUri: clean(input.sourceUri),
    license: clean(input.license) || 'unknown',
    generatedAt: normalizeIso(input.generatedAt, new Date()),
    mediaType: clean(input.mediaType) || 'application/json',
    payloadHash,
    contentAddress: `agid-sha256-${payloadHash}`,
    ipfsCid: clean(input.ipfsCid) || undefined,
    byteLength: serialized.length,
    privacy: safePrivacy(),
  };
}

export function validateContentAddressedAddressSnapshot(
  snapshot: AddressContentSnapshot,
  payload?: unknown,
): AddressProtocolValidationResult {
  const errors = privateMaterialErrors(snapshot, 'snapshot');
  const warnings: string[] = [];
  if (snapshot.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-snapshot-version');
  if (snapshot.snapshotClass !== 'content-addressed-address-data') errors.push('unsupported-snapshot-class');
  if (!snapshot.sourceUri) warnings.push('sourceUri is recommended for public dataset provenance');
  if (!snapshot.license) errors.push('license is required');
  if (!/^agid-sha256-[0-9a-f]{64}$/.test(snapshot.contentAddress)) errors.push('contentAddress must be agid-sha256-{sha256}');
  if (payload !== undefined) {
    const serialized = typeof payload === 'string' ? payload : stableStringify(payload);
    const expected = sha256Hex(serialized);
    if (snapshot.payloadHash !== expected) errors.push('payloadHash does not match supplied payload');
    if (snapshot.contentAddress !== `agid-sha256-${expected}`) errors.push('contentAddress does not match supplied payload');
  }
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: false,
    privacy: safePrivacy(),
  };
}

export function validateIssuerAuthenticationEnvelope(
  envelope: AddressIssuerAuthEnvelope,
  policy: AddressIssuerAuthPolicy,
  options: { secretsByKeyId?: Record<string, string>; requireVerifiedSignature?: boolean } = {},
): AddressProtocolValidationResult {
  const errors = privateMaterialErrors(envelope, 'issuerAuth');
  const warnings: string[] = [];
  const issuerAllowed = policy.allowedIssuerIds.includes(envelope.issuerId);
  const fromAllowed = policy.allowedFromDomains.includes(normalizeDomain(envelope.fromDomain));
  const signingAllowed = policy.allowedSigningDomains.includes(normalizeDomain(envelope.signingDomain));
  const selectorAllowed = policy.requiredDkimSelectors.length === 0 || policy.requiredDkimSelectors.includes(envelope.dkimSelector);
  const resolverHost = normalizeDomain(envelope.resolverHost || '');
  const resolverAllowed = !resolverHost || policy.allowedResolverHosts.includes(resolverHost);
  const aligned = policy.alignment === 'strict'
    ? normalizeDomain(envelope.fromDomain) === normalizeDomain(envelope.signingDomain)
    : relaxedDomainMatch(envelope.fromDomain, envelope.signingDomain);

  if (!issuerAllowed) errors.push('issuer-not-authorized-by-policy');
  if (!fromAllowed) errors.push('spf-like-from-domain-not-authorized');
  if (!signingAllowed) errors.push('dkim-like-signing-domain-not-authorized');
  if (!selectorAllowed) errors.push('dkim-like-selector-not-authorized');
  if (!resolverAllowed) errors.push('resolver-host-not-authorized');
  if (!aligned) {
    if (policy.dmarcPolicy === 'reject') errors.push('dmarc-like-domain-alignment-failed');
    else warnings.push('dmarc-like-domain-alignment-failed');
  }

  const signatureCheck = verifyAddressProtocolSignature(
    {
      kind: envelope.kind,
      issuerId: envelope.issuerId,
      fromDomain: normalizeDomain(envelope.fromDomain),
      signingDomain: normalizeDomain(envelope.signingDomain),
      dkimSelector: envelope.dkimSelector,
      resolverHost,
      messageHash: normalizeCommitment(envelope.messageHash),
      scope: normalizeId(envelope.scope) || undefined,
    },
    envelope.signature,
    options.secretsByKeyId,
  );
  errors.push(...signatureCheck.errors);
  warnings.push(...signatureCheck.warnings);
  if (options.requireVerifiedSignature && !signatureCheck.verified) errors.push('issuer-signature-verification-required');

  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: signatureCheck.verified,
    privacy: safePrivacy(),
  };
}

export function createAddressConsentGrant(
  input: Omit<Partial<AddressConsentGrant>, 'version' | 'consentClass' | 'grantId' | 'nonceCommitment' | 'signature' | 'privacy'> & {
    subjectCommitment: string;
    issuerId: string;
    audience: string;
    purpose: string;
    scopes: AddressConsentScope[];
    nonce?: string;
    nonceCommitment?: string;
  },
  signing?: { keyId: string; secret: string; signedAt?: string },
): AddressConsentGrant {
  const issuedAt = normalizeIso(input.issuedAt, new Date());
  const expiresAt = normalizeIso(input.expiresAt, new Date(Date.parse(issuedAt) + 15 * 60 * 1000));
  const subjectCommitment = normalizeCommitment(input.subjectCommitment);
  const unsigned: Omit<AddressConsentGrant, 'signature' | 'privacy'> = {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    consentClass: 'oauth-scope-address-consent',
    grantId: `ACG-${sha256Hex(stableStringify({
      subjectCommitment,
      issuerId: normalizeId(input.issuerId),
      audience: normalizeDomain(input.audience),
      purpose: normalizeId(input.purpose),
      scopes: unique(input.scopes).sort(),
      issuedAt,
      nonce: input.nonce || input.nonceCommitment || '',
    })).slice(0, 24).toUpperCase()}`,
    subjectCommitment,
    issuerId: normalizeId(input.issuerId),
    audience: normalizeDomain(input.audience),
    purpose: normalizeId(input.purpose),
    scopes: unique(input.scopes) as AddressConsentScope[],
    issuedAt,
    expiresAt,
    nonceCommitment: normalizeCommitment(input.nonceCommitment) || sha256Hex(input.nonce || `${subjectCommitment}:${issuedAt}`),
  };
  return {
    ...unsigned,
    signature: signing ? signAddressProtocolPayload(unsigned, signing.keyId, signing.secret, signing.signedAt) : undefined,
    privacy: safePrivacy(),
  };
}

export function validateAddressConsentGrant(
  grant: AddressConsentGrant,
  requiredScopes: AddressConsentScope[] = [],
  options: { now?: string; secretsByKeyId?: Record<string, string>; requireVerifiedSignature?: boolean; expectedAudience?: string } = {},
): AddressProtocolValidationResult & { missingScopes: AddressConsentScope[]; expired: boolean } {
  const errors = privateMaterialErrors(grant, 'consentGrant');
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const issuedAt = parseDate(grant.issuedAt);
  const expiresAt = parseDate(grant.expiresAt);
  if (grant.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-consent-grant-version');
  if (grant.consentClass !== 'oauth-scope-address-consent') errors.push('unsupported-consent-grant-class');
  if (!grant.subjectCommitment) errors.push('subjectCommitment is required');
  if (!grant.issuerId) errors.push('issuerId is required');
  if (!grant.audience) errors.push('audience is required');
  if (!grant.purpose) errors.push('purpose is required');
  if (!grant.scopes.length) errors.push('at least one consent scope is required');
  if (!issuedAt) errors.push('issuedAt must be an ISO date');
  if (!expiresAt) errors.push('expiresAt must be an ISO date');
  if (issuedAt && expiresAt && expiresAt.getTime() <= issuedAt.getTime()) errors.push('expiresAt must be later than issuedAt');
  const expired = Boolean(expiresAt && expiresAt.getTime() <= checkedAt.getTime());
  if (expired) errors.push('consent-grant-expired');
  if (options.expectedAudience && normalizeDomain(options.expectedAudience) !== normalizeDomain(grant.audience)) {
    errors.push('consent-grant-audience-mismatch');
  }
  const normalizedScopes = new Set(grant.scopes.map(scope => clean(scope)));
  const missingScopes = unique(requiredScopes).filter(scope => !normalizedScopes.has(scope)) as AddressConsentScope[];
  if (missingScopes.length) errors.push(`consent-scope-missing:${missingScopes.join(',')}`);
  const { signature: _signature, privacy: _privacy, ...unsigned } = grant;
  const expectedGrantId = `ACG-${sha256Hex(stableStringify({
    subjectCommitment: grant.subjectCommitment,
    issuerId: grant.issuerId,
    audience: grant.audience,
    purpose: grant.purpose,
    scopes: [...grant.scopes].sort(),
    issuedAt: grant.issuedAt,
    nonce: grant.nonceCommitment,
  })).slice(0, 24).toUpperCase()}`;
  if (grant.grantId !== expectedGrantId) warnings.push('consent-grant-id-derived-from-private-nonce-or-legacy-input');
  const signatureCheck = verifyAddressProtocolSignature(unsigned, grant.signature, options.secretsByKeyId);
  errors.push(...signatureCheck.errors);
  warnings.push(...signatureCheck.warnings);
  if (options.requireVerifiedSignature && !signatureCheck.verified) errors.push('consent-grant-signature-verification-required');
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: signatureCheck.verified,
    privacy: safePrivacy(),
    missingScopes,
    expired,
  };
}

export function createEphemeralAddressAlias(input: {
  stableCommitment: string;
  domain: string;
  purpose: string;
  nonce: string;
  issuedAt?: string;
  expiresAt?: string;
}): AddressEphemeralAlias {
  const issuedAt = normalizeIso(input.issuedAt, new Date());
  const expiresAt = normalizeIso(input.expiresAt, new Date(Date.parse(issuedAt) + 10 * 60 * 1000));
  const domain = normalizeDomain(input.domain);
  const purpose = normalizeId(input.purpose);
  const stableCommitment = normalizeCommitment(input.stableCommitment);
  const nonceCommitment = sha256Hex(`${domain}:${purpose}:${input.nonce}`);
  const stableCommitmentHash = sha256Hex(`${domain}:stable:${stableCommitment}`);
  return {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    aliasClass: 'ipv6-privacy-nat-address-alias',
    aliasCommitment: `aalias:${sha256Hex(stableStringify({
      domain,
      purpose,
      stableCommitment,
      nonceCommitment,
      issuedAt,
      expiresAt,
    }))}`,
    stableCommitmentHash,
    domain,
    purpose,
    issuedAt,
    expiresAt,
    nonceCommitment,
    privacy: safePrivacy(),
  };
}

export function validateEphemeralAddressAlias(
  alias: AddressEphemeralAlias,
  options: { now?: string; expectedDomain?: string; expectedPurpose?: string } = {},
): AddressProtocolValidationResult & { expired: boolean } {
  const errors = privateMaterialErrors(alias, 'ephemeralAlias');
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const issuedAt = parseDate(alias.issuedAt);
  const expiresAt = parseDate(alias.expiresAt);
  if (alias.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-ephemeral-alias-version');
  if (alias.aliasClass !== 'ipv6-privacy-nat-address-alias') errors.push('unsupported-ephemeral-alias-class');
  if (!alias.aliasCommitment.startsWith('aalias:')) errors.push('aliasCommitment must be address alias commitment');
  if (!alias.stableCommitmentHash) errors.push('stableCommitmentHash is required');
  if (!alias.domain) errors.push('domain is required');
  if (!alias.purpose) errors.push('purpose is required');
  if (!issuedAt) errors.push('issuedAt must be an ISO date');
  if (!expiresAt) errors.push('expiresAt must be an ISO date');
  if (issuedAt && expiresAt && expiresAt.getTime() <= issuedAt.getTime()) errors.push('expiresAt must be later than issuedAt');
  const expired = Boolean(expiresAt && expiresAt.getTime() <= checkedAt.getTime());
  if (expired) errors.push('ephemeral-alias-expired');
  if (options.expectedDomain && normalizeDomain(options.expectedDomain) !== alias.domain) errors.push('ephemeral-alias-domain-mismatch');
  if (options.expectedPurpose && normalizeId(options.expectedPurpose) !== alias.purpose) errors.push('ephemeral-alias-purpose-mismatch');
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: false,
    privacy: safePrivacy(),
    expired,
  };
}

export function createAddressLocalDiscoveryRecord(input: {
  serviceName: string;
  instanceId: string;
  endpoint: string;
  capabilities: AddressServiceEndpointPurpose[];
  ttlSeconds?: number;
  validUntil?: string;
  signature?: AddressProtocolSignature;
}): AddressLocalDiscoveryRecord {
  const ttlSeconds = boundedInt(input.ttlSeconds, cacheTtlForProfile('local-mdns'), 3600);
  return {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    discoveryClass: 'mdns-local-address-resolver',
    serviceName: normalizeId(input.serviceName) || '_agid-address._tcp.local',
    instanceId: normalizeId(input.instanceId),
    endpoint: clean(input.endpoint),
    capabilities: input.capabilities.length ? input.capabilities : ['resolver'],
    ttlSeconds,
    validUntil: normalizeIso(input.validUntil, new Date(Date.now() + ttlSeconds * 1000)),
    signature: input.signature,
    privacy: safePrivacy(),
  };
}

export function validateAddressLocalDiscoveryRecord(
  record: AddressLocalDiscoveryRecord,
  options: { now?: string } = {},
): AddressProtocolValidationResult {
  const errors = privateMaterialErrors(record, 'localDiscoveryRecord');
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const validUntil = parseDate(record.validUntil);
  if (record.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-local-discovery-version');
  if (record.discoveryClass !== 'mdns-local-address-resolver') errors.push('unsupported-local-discovery-class');
  if (!record.serviceName) errors.push('serviceName is required');
  if (!record.instanceId) errors.push('instanceId is required');
  if (!localEndpointIsSafe(record.endpoint)) errors.push('local endpoint must be HTTPS, loopback HTTP, .local HTTP, or /.well-known/');
  if (!record.capabilities.length) errors.push('at least one local resolver capability is required');
  if (!validUntil) errors.push('validUntil must be an ISO date');
  if (validUntil && validUntil.getTime() <= checkedAt.getTime()) errors.push('local-discovery-record-expired');
  if (record.ttlSeconds > 300) warnings.push('local-discovery-ttl-is-long-for-offline-use');
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: false,
    privacy: safePrivacy(),
  };
}

export function mapAddressResolutionToHttpStatus(input: {
  status: 'resolved' | 'partial' | 'unresolved' | 'conflict' | 'blocked' | 'rejected';
  decision?: 'accept' | 'review' | 'reject';
  errors?: string[];
  warnings?: string[];
  highRiskMode?: boolean;
}): AddressResolutionHttpStatus {
  const errorText = (input.errors || []).join('\n');
  if (input.highRiskMode && input.status === 'blocked') {
    return {
      code: 451,
      text: 'restricted-high-risk',
      retryable: false,
      operatorMeaning: 'Address or proof is restricted by high-risk safety policy.',
    };
  }
  if (/revoked|stale|expired/.test(errorText)) {
    return {
      code: 410,
      text: 'revoked',
      retryable: false,
      operatorMeaning: 'The credential, QR, route, or authority is revoked or no longer fresh.',
    };
  }
  if (input.status === 'resolved') {
    return {
      code: 200,
      text: 'resolved',
      retryable: false,
      operatorMeaning: 'Address resolution is complete and accepted.',
    };
  }
  if (input.status === 'partial') {
    return {
      code: 206,
      text: 'partial',
      retryable: true,
      operatorMeaning: 'Address is usable only with operator review or additional evidence.',
    };
  }
  if (input.status === 'conflict') {
    return {
      code: 409,
      text: 'conflict',
      retryable: true,
      operatorMeaning: 'Resolvers disagree or a duplicate/used state was detected.',
    };
  }
  if (input.status === 'unresolved') {
    return {
      code: 422,
      text: 'unresolved',
      retryable: true,
      operatorMeaning: 'Address could not be resolved from the supplied evidence.',
    };
  }
  if (input.decision === 'review') {
    return {
      code: 202,
      text: 'pending-review',
      retryable: true,
      operatorMeaning: 'The request is accepted for manual or asynchronous review.',
    };
  }
  return {
    code: 409,
    text: 'conflict',
    retryable: true,
    operatorMeaning: 'The request was rejected or blocked by validation policy.',
  };
}

export function createAddressWebhookEvent(
  input: {
    eventType: AddressWebhookEventType;
    subjectCommitment: string;
    publicPayload?: Record<string, unknown>;
    createdAt?: string;
  },
  signing: { keyId: string; secret: string; signedAt?: string },
): AddressWebhookEvent {
  const createdAt = normalizeIso(input.createdAt, new Date());
  const subjectCommitment = normalizeCommitment(input.subjectCommitment);
  const eventId = `AWH-${sha256Hex(stableStringify({
    eventType: input.eventType,
    subjectCommitment,
    createdAt,
    publicPayload: input.publicPayload || {},
  })).slice(0, 24).toUpperCase()}`;
  const unsigned: Omit<AddressWebhookEvent, 'signature' | 'privacy'> = {
    version: ADDRESS_INTERNET_PROTOCOLS_VERSION,
    eventId,
    eventType: input.eventType,
    createdAt,
    subjectCommitment,
    publicPayload: input.publicPayload || {},
  };
  return {
    ...unsigned,
    signature: signAddressProtocolPayload(unsigned, signing.keyId, signing.secret, signing.signedAt),
    privacy: safePrivacy(),
  };
}

export function validateAddressWebhookSubscription(subscription: AddressWebhookSubscription) {
  const errors = privateMaterialErrors(subscription, 'webhookSubscription');
  const warnings: string[] = [];
  if (!normalizeId(subscription.subscriptionId)) errors.push('subscriptionId is required');
  if (!endpointIsSafe(subscription.endpoint)) errors.push('webhook endpoint must be HTTPS or /.well-known/');
  if (!subscription.eventTypes.length) errors.push('at least one webhook event type is required');
  if (!normalizeId(subscription.signingKeyId)) errors.push('signingKeyId is required');
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: false,
    privacy: safePrivacy(),
  };
}

export function validateAddressWebhookEvent(
  event: AddressWebhookEvent,
  options: { secretsByKeyId?: Record<string, string>; requireVerifiedSignature?: boolean } = {},
): AddressProtocolValidationResult {
  const errors = privateMaterialErrors(event, 'webhookEvent');
  const warnings: string[] = [];
  if (event.version !== ADDRESS_INTERNET_PROTOCOLS_VERSION) errors.push('unsupported-webhook-event-version');
  if (!normalizeCommitment(event.subjectCommitment)) errors.push('subjectCommitment is required');
  const { signature: _signature, privacy: _privacy, ...unsigned } = event;
  const expectedEventId = `AWH-${sha256Hex(stableStringify({
    eventType: event.eventType,
    subjectCommitment: normalizeCommitment(event.subjectCommitment),
    createdAt: event.createdAt,
    publicPayload: event.publicPayload || {},
  })).slice(0, 24).toUpperCase()}`;
  if (event.eventId !== expectedEventId) errors.push('eventId does not match canonical webhook payload');
  const signatureCheck = verifyAddressProtocolSignature(unsigned, event.signature, options.secretsByKeyId);
  errors.push(...signatureCheck.errors);
  warnings.push(...signatureCheck.warnings);
  if (options.requireVerifiedSignature && !signatureCheck.verified) errors.push('webhook-signature-verification-required');
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    signatureVerified: signatureCheck.verified,
    privacy: safePrivacy(),
  };
}

export class InMemoryAddressAbuseLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  check(input: AddressAbuseControlInput): AddressAbuseControlResult {
    const now = Number.isFinite(input.now) ? input.now! : Date.now();
    const actorKeyHash = sha256Hex(`${input.operation}:${input.actorKey}`).slice(0, 32);
    const key = `${input.operation}:${actorKeyHash}`;
    const existing = this.buckets.get(key);
    const windowMs = Math.max(1000, Math.floor(input.windowMs));
    const limit = Math.max(1, Math.floor(input.limit));
    const bucket = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    this.buckets.set(key, bucket);
    const allowed = bucket.count <= limit;

    return {
      allowed,
      actorKeyHash,
      operation: input.operation,
      used: bucket.count,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: new Date(bucket.resetAt).toISOString(),
      warnings: allowed ? [] : ['abuse-rate-limit-exceeded'],
    };
  }
}

export function makeIssuerAuthSignaturePayload(envelope: Omit<AddressIssuerAuthEnvelope, 'signature'>) {
  return {
    kind: envelope.kind,
    issuerId: envelope.issuerId,
    fromDomain: normalizeDomain(envelope.fromDomain),
    signingDomain: normalizeDomain(envelope.signingDomain),
    dkimSelector: envelope.dkimSelector,
    resolverHost: normalizeDomain(envelope.resolverHost || ''),
    messageHash: normalizeCommitment(envelope.messageHash),
    scope: normalizeId(envelope.scope) || undefined,
  };
}

export function makeRouteSignaturePayload(route: AddressRouteAdvertisement) {
  return routeSignaturePayload(route);
}

export function contentAddressForPayload(payload: unknown) {
  const serialized = typeof payload === 'string' ? payload : stableStringify(payload);
  return `agid-sha256-${sha256Hex(serialized)}`;
}

export function resolverHostFromRoute(route: Pick<AddressRouteAdvertisement, 'resolverEndpoint'>) {
  return hostOf(route.resolverEndpoint);
}
