import {
  analyzeAddress,
  normalizeApiAddress,
  parseAddressText,
  type CanonicalAddressParts,
} from './addressIntelligence';
import {
  verifyAddressCandidate,
  type AddressVerificationEngineResult,
  type PostalEvidenceCandidate,
} from './addressVerificationEngine';
import {
  createAddressDnsRecord,
  validateAddressDnsRecord,
  type AddressDnsRecord,
} from './addressDnsRecord';
import {
  encodeAGID,
  decodeAGID,
  type AGIDResult,
} from './agid';
import {
  isValidAGIDFormat,
  normalizeAGIDInput,
} from './agidSecurity';
import {
  resolveFederatedAddress,
  type FederatedResolverMode,
  type FederatedResolverResult,
  type FederatedResolverSource,
  type FederatedResolverSourceResponse,
} from './federatedResolver';
import {
  type AgidRegistryApiStoreAdapter,
  type AgidRegistryVerifyResult,
} from './agidRegistryApi';
import {
  createAddressCachePolicy,
  mapAddressResolutionToHttpStatus,
  negotiateAddressContentLanguage,
  selectAddressEdgeRoute,
  validateAddressConsentGrant,
  validateAddressCachePolicy,
  validateAddressLocalDiscoveryRecord,
  validateAddressRevocationList,
  validateAddressRouteSet,
  validateAddressServiceRecordSet,
  validateIssuerAuthenticationEnvelope,
  type AddressCachePolicy,
  type AddressConsentGrant,
  type AddressConsentScope,
  type AddressContentLanguageDecision,
  type AddressEdgeRoutingContext,
  type AddressIssuerAuthEnvelope,
  type AddressIssuerAuthPolicy,
  type AddressLocalDiscoveryRecord,
  type AddressRevocationStatus,
  type AddressRouteAdvertisement,
  type AddressServiceRecord,
} from './addressInternetProtocols';
import {
  resolveAddressEntities,
  type AddressEntityResolutionCandidate,
  type AddressEntityResolutionResult,
} from './addressEntityResolution';
import {
  summarizeAddressInformationArchitecture,
  type AddressInformationArchitectureSummary,
} from './addressInformationArchitecture';
import { sha256Hex } from './sha256';

export const ADDRESS_RESOLUTION_SYSTEM_VERSION = 'address-resolution-system-v1';

export type AddressResolutionMode =
  | 'local-only'
  | 'server-registry'
  | 'address-dns'
  | 'zk-proof'
  | 'ethereum-registry'
  | 'hybrid';

export type AddressResolutionStatus =
  | 'resolved'
  | 'partial'
  | 'unresolved'
  | 'conflict'
  | 'blocked'
  | 'rejected';

export type AddressResolutionDecision =
  | 'accept'
  | 'review'
  | 'reject';

export type AddressResolutionInput = {
  payload?: unknown;
  address?: CanonicalAddressParts & Record<string, unknown>;
  addressText?: string;
  countryCode?: string;
  targetCountries?: string[];
  postalCode?: string;
  postalEvidence?: PostalEvidenceCandidate[];
  referenceRecords?: Parameters<typeof verifyAddressCandidate>[0]['referenceRecords'];
  agid?: string;
  lat?: number;
  lon?: number;
  language?: string;
  acceptLanguage?: string;
  availableLanguages?: string[];
  mode?: AddressResolutionMode;
  domain?: string;
  salt?: string;
  now?: string;
  highRiskMode?: boolean;
  allowPublicAgid?: boolean;
  sources?: FederatedResolverSource[];
  includeLocalSource?: boolean;
  registryStore?: Pick<AgidRegistryApiStoreAdapter, 'verify'>;
  quorum?: number;
  minTrustScore?: number;
  timeoutMs?: number;
  minResolvedConfidence?: number;
  zone?: string;
  ownerName?: string;
  issuerId?: string;
  credentialCommitment?: string;
  addressReferenceCommitment?: string;
  aoidCommitment?: string;
  agidCommitment?: string;
  freshnessRoot?: string;
  revocationRoot?: string;
  evidenceRoot?: string;
  nullifierHash?: string;
  scope?: string;
  requireAnchoredFreshnessRoot?: boolean;
  includePrivateLocal?: boolean;
  routeAdvertisements?: AddressRouteAdvertisement[];
  routeSignatureSecrets?: Record<string, string>;
  requireVerifiedRouteSignatures?: boolean;
  issuerAuthEnvelope?: AddressIssuerAuthEnvelope;
  issuerAuthPolicy?: AddressIssuerAuthPolicy;
  issuerAuthSecrets?: Record<string, string>;
  requireVerifiedIssuerSignature?: boolean;
  serviceRecords?: AddressServiceRecord[];
  serviceRecordSignatureSecrets?: Record<string, string>;
  requireVerifiedServiceRecordSignatures?: boolean;
  revocationStatuses?: AddressRevocationStatus[];
  revocationSignatureSecrets?: Record<string, string>;
  requireVerifiedRevocationSignatures?: boolean;
  consentGrant?: AddressConsentGrant;
  requiredConsentScopes?: AddressConsentScope[];
  consentSecrets?: Record<string, string>;
  requireVerifiedConsentSignature?: boolean;
  cachePolicy?: AddressCachePolicy;
  edgeRoutingContext?: AddressEdgeRoutingContext;
  localDiscoveryRecords?: AddressLocalDiscoveryRecord[];
  entityCandidates?: AddressEntityResolutionCandidate[];
  entityResolutionThreshold?: number;
  strictEntityUnitSeparation?: boolean;
};

export type AddressResolutionSystemCapabilities = {
  version: typeof ADDRESS_RESOLUTION_SYSTEM_VERSION;
  modes: AddressResolutionMode[];
  endpoints: string[];
  localOnly: {
    zkRequired: false;
    ethereumRequired: false;
    gasRequired: false;
    offlineCapable: true;
  };
  integrations: string[];
  informationArchitecture: AddressInformationArchitectureSummary;
  privacy: {
    publicFederationPayload: 'commitments-and-public-metadata-only';
    rawAddressToFederation: false;
    rawAgidToFederation: false;
    rawAoidToFederation: false;
    rawCoordinatesToFederation: false;
    addressDnsStoresRawPrivateMaterial: false;
    registryStoresRawPrivateMaterial: false;
  };
};

export type AddressResolutionSystemResult = {
  version: typeof ADDRESS_RESOLUTION_SYSTEM_VERSION;
  mode: AddressResolutionMode;
  domain: string;
  createdAt: string;
  resolutionId: string;
  status: AddressResolutionStatus;
  decision: AddressResolutionDecision;
  confidence: number;
  displayHints: {
    language: string;
    operatorState:
      | 'Address OK'
      | 'Address Review'
      | 'Address Blocked'
      | 'Address Rejected';
    confidenceLabel: 'high' | 'medium' | 'low';
  };
  agid?: Pick<AGIDResult, 'id' | 'regionCode' | 'regionName' | 'isSea' | 'gridSize' | 'bounds'>;
  decodedAgid?: ReturnType<typeof decodeAGID>;
  canonicalAddress?: CanonicalAddressParts;
  verification: AddressVerificationEngineResult;
  entityResolution: AddressEntityResolutionResult;
  federated: FederatedResolverResult;
  registryVerification?: AgidRegistryVerifyResult;
  addressDnsRecord?: AddressDnsRecord;
  internetProtocols: {
    contentLanguage: AddressContentLanguageDecision;
    routeAdvertisements: ReturnType<typeof validateAddressRouteSet>;
    serviceRecords: ReturnType<typeof validateAddressServiceRecordSet>;
    issuerAuthentication?: ReturnType<typeof validateIssuerAuthenticationEnvelope>;
    revocationStatuses: ReturnType<typeof validateAddressRevocationList>;
    consentGrant?: ReturnType<typeof validateAddressConsentGrant>;
    cachePolicy: ReturnType<typeof createAddressCachePolicy>;
    cacheValidation: ReturnType<typeof validateAddressCachePolicy>;
    edgeRoute: ReturnType<typeof selectAddressEdgeRoute>;
    localDiscovery: {
      accepted: number;
      rejected: number;
      results: Array<{
        serviceName: string;
        instanceId: string;
        validation: ReturnType<typeof validateAddressLocalDiscoveryRecord>;
      }>;
      errors: string[];
      warnings: string[];
    };
    httpStatus: ReturnType<typeof mapAddressResolutionToHttpStatus>;
    controls: {
      signedRouteAdvertisementsRequired: true;
      personalWhoisRdapDisabled: true;
      issuerAuthenticationModel: 'dmarc-spf-dkim-inspired';
      contentAddressedPublicData: true;
      signedWebhookEvents: true;
      abuseControlsAvailable: true;
      dnsSrvMxRecordsAvailable: true;
      dnssecRpkiStyleValidationAvailable: true;
      pkiTransparencyLogAvailable: true;
      ocspCrlStyleRevocationAvailable: true;
      cacheControlEtagAvailable: true;
      oauthScopeConsentAvailable: true;
      ephemeralAddressAliasesAvailable: true;
      anycastEdgeRoutingAvailable: true;
      mdnsLocalFirstAvailable: true;
    };
  };
  commitments: {
    addressReferenceCommitment?: string;
    agidCommitment?: string;
    aoidCommitment?: string;
    credentialCommitment?: string;
    all: string[];
  };
  privacy: {
    privateInputKeptLocal: true;
    rawAddressSentToFederation: false;
    rawAgidSentToFederation: false;
    rawAoidSentToFederation: false;
    rawCoordinatesSentToFederation: false;
    addressDnsRecordContainsPrivateMaterial: false;
    registryCheckContainsPrivateMaterial: false;
    includePrivateLocal: boolean;
  };
  warnings: string[];
  errors: string[];
  nextActions: string[];
  sources: string[];
  auditFingerprint: string;
};

type JsonRecord = Record<string, unknown>;

const MODES: AddressResolutionMode[] = [
  'local-only',
  'server-registry',
  'address-dns',
  'zk-proof',
  'ethereum-registry',
  'hybrid',
];

const DEFAULT_DOMAIN = 'address-resolution:default';
const DEFAULT_ZONE = 'resolver.agid';

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function isPlainRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeDomain(value: unknown) {
  const text = clean(value || DEFAULT_DOMAIN).toLowerCase().replace(/[^a-z0-9:._-]+/g, '-');
  return text || DEFAULT_DOMAIN;
}

function normalizeCountryCode(value: unknown) {
  const text = clean(value).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return text === 'UK' ? 'GB' : text;
}

function normalizeDnsName(value: unknown, fallback = DEFAULT_ZONE) {
  const text = clean(value || fallback)
    .replace(/\.$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return text || fallback;
}

function parseDate(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function numberOrUndefined(value: unknown) {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(numeric) ? numeric : undefined;
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

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function normalizeCommitment(value: unknown) {
  const text = clean(value);
  if (!text) return '';
  return text.startsWith('0x') ? `0x${text.slice(2).toLowerCase()}` : text.toLowerCase();
}

function payloadRecord(value: unknown): JsonRecord {
  return isPlainRecord(value) ? { ...value } : {};
}

function stripUndefined(record: JsonRecord): JsonRecord {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function entityCandidatesFromPayload(payload: JsonRecord): AddressEntityResolutionCandidate[] {
  const value = payload.entityCandidates;
  if (!Array.isArray(value)) return [];
  return value.filter(isPlainRecord).map(candidate => candidate as AddressEntityResolutionCandidate);
}

function firstDefined<T>(...values: T[]) {
  return values.find(value => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return clean(value) !== '';
    return true;
  });
}

function buildMixedPayload(input: AddressResolutionInput): JsonRecord {
  const payload = payloadRecord(input.payload);
  const maybeAddress = input.address || (isPlainRecord(payload.address) ? payload.address as JsonRecord : undefined);

  return stripUndefined({
    ...payload,
    address: maybeAddress ?? payload.address,
    addressText: firstDefined(input.addressText, payload.addressText, payload.fullAddress, payload.rawAddress),
    postalCode: firstDefined(input.postalCode, payload.postalCode, payload.postcode, payload.zip),
    countryCode: firstDefined(input.countryCode, payload.countryCode, payload.country_code),
    agid: firstDefined(input.agid, payload.agid),
    issuerId: firstDefined(input.issuerId, payload.issuerId),
    credentialCommitment: firstDefined(input.credentialCommitment, payload.credentialCommitment),
    addressReferenceCommitment: firstDefined(input.addressReferenceCommitment, payload.addressReferenceCommitment),
    aoidCommitment: firstDefined(input.aoidCommitment, payload.aoidCommitment),
    agidCommitment: firstDefined(input.agidCommitment, payload.agidCommitment),
    freshnessRoot: firstDefined(input.freshnessRoot, payload.freshnessRoot),
    revocationRoot: firstDefined(input.revocationRoot, payload.revocationRoot),
    evidenceRoot: firstDefined(input.evidenceRoot, payload.evidenceRoot),
    nullifierHash: firstDefined(input.nullifierHash, payload.nullifierHash),
    scope: firstDefined(input.scope, payload.scope),
    ownerName: firstDefined(input.ownerName, payload.ownerName),
    zone: firstDefined(input.zone, payload.zone),
  });
}

function buildCanonical(input: AddressResolutionInput, payload: JsonRecord) {
  const addressInput = input.address || (isPlainRecord(payload.address) ? payload.address as JsonRecord : {});
  const parsedAddressText = clean(firstDefined(input.addressText, payload.addressText, payload.fullAddress, payload.rawAddress));
  const analysis = analyzeAddress({
    apiAddress: addressInput,
    displayName: parsedAddressText,
    sources: ['address-resolution-system-input'],
  });
  const canonical = {
    ...analysis.canonical,
    ...normalizeApiAddress(addressInput),
  };
  const countryCode = normalizeCountryCode(firstDefined(input.countryCode, payload.countryCode, payload.country_code, canonical.country_code));
  const postcode = clean(firstDefined(input.postalCode, payload.postalCode, payload.postcode, payload.zip, canonical.postcode));

  if (countryCode) canonical.country_code = countryCode;
  if (postcode) canonical.postcode = postcode;
  return {
    canonical: canonical as CanonicalAddressParts,
    addressText: parsedAddressText,
  };
}

function buildAgid(input: AddressResolutionInput, payload: JsonRecord) {
  const lat = numberOrUndefined(firstDefined(input.lat, payload.lat, payload.latitude));
  const lon = numberOrUndefined(firstDefined(input.lon, payload.lon, payload.lng, payload.longitude));
  const rawAgid = clean(firstDefined(input.agid, payload.agid));
  const normalizedAgid = normalizeAGIDInput(rawAgid);
  const decodedAgid = normalizedAgid && isValidAGIDFormat(normalizedAgid)
    ? decodeAGID(normalizedAgid)
    : null;
  const generated = lat !== undefined && lon !== undefined
    ? encodeAGID(lat, lon)
    : undefined;

  return {
    agid: generated,
    decodedAgid,
    hasCoordinates: lat !== undefined && lon !== undefined,
    hasAgid: Boolean(generated || decodedAgid),
    normalizedAgid: generated?.id || (decodedAgid ? normalizedAgid : ''),
  };
}

function makeCommitment(input: {
  domain: string;
  salt?: string;
  kind: string;
  value: unknown;
  createdAt: string;
  localOnly?: boolean;
}) {
  const base = {
    version: ADDRESS_RESOLUTION_SYSTEM_VERSION,
    domain: input.domain,
    kind: input.kind,
    value: input.value,
    salt: input.salt || (input.localOnly ? input.createdAt : ''),
  };
  return `ars:${input.domain}:${sha256Hex(stableStringify(base))}`;
}

function commitmentInputs(input: AddressResolutionInput, payload: JsonRecord) {
  return {
    credentialCommitment: normalizeCommitment(firstDefined(input.credentialCommitment, payload.credentialCommitment)),
    addressReferenceCommitment: normalizeCommitment(firstDefined(input.addressReferenceCommitment, payload.addressReferenceCommitment)),
    agidCommitment: normalizeCommitment(firstDefined(input.agidCommitment, payload.agidCommitment)),
    aoidCommitment: normalizeCommitment(firstDefined(input.aoidCommitment, payload.aoidCommitment)),
  };
}

function buildLocalSource(options: {
  targetKey: string;
  agidCommitment?: string;
  aoidCommitment?: string;
  verification: AddressVerificationEngineResult;
  freshnessRoot?: string;
  revocationRoot?: string;
  evidenceRoot?: string;
}): FederatedResolverSource {
  return {
    sourceId: 'address-resolution-local',
    sourceKind: 'local-cache',
    trustScore: 0.82,
    resolve: async (): Promise<FederatedResolverSourceResponse> => {
      const status = options.verification.status === 'verified'
        ? 'resolved'
        : options.verification.status === 'partial'
          ? 'partial'
          : 'unresolved';

      return {
        status,
        confidence: clamp01(options.verification.score || 0.5),
        addressReferenceCommitment: options.targetKey,
        agidCommitment: options.agidCommitment,
        aoidCommitment: options.aoidCommitment,
        freshnessRoot: normalizeCommitment(options.freshnessRoot) || undefined,
        revocationRoot: normalizeCommitment(options.revocationRoot) || undefined,
        evidenceRoot: normalizeCommitment(options.evidenceRoot) || undefined,
        publicPayload: {
          verificationStatus: options.verification.status,
          verificationScore: options.verification.score,
          country: options.verification.country.resolved,
        },
        warnings: options.verification.warnings,
      };
    },
  };
}

function registryVerifyInput(options: {
  input: AddressResolutionInput;
  payload: JsonRecord;
  federated: FederatedResolverResult;
  commitments: {
    credentialCommitment?: string;
    addressReferenceCommitment?: string;
    agidCommitment?: string;
    aoidCommitment?: string;
  };
  verification: AddressVerificationEngineResult;
  createdAt: string;
}) {
  const allCommitments = unique([
    options.commitments.credentialCommitment,
    options.commitments.addressReferenceCommitment,
    options.commitments.agidCommitment,
    options.commitments.aoidCommitment,
    ...options.federated.commitments.map(item => item.commitment),
  ]);
  return {
    issuerId: clean(firstDefined(options.input.issuerId, options.payload.issuerId)) || undefined,
    credentialCommitment: options.commitments.credentialCommitment,
    addressReferenceCommitment: options.commitments.addressReferenceCommitment,
    agidCommitment: options.commitments.agidCommitment,
    aoidCommitment: options.commitments.aoidCommitment,
    commitments: allCommitments,
    freshnessRoot: normalizeCommitment(firstDefined(options.input.freshnessRoot, options.payload.freshnessRoot)) || undefined,
    requireAnchoredFreshnessRoot: Boolean(firstDefined(options.input.requireAnchoredFreshnessRoot, options.payload.requireAnchoredFreshnessRoot)),
    freshUntil: clean(options.payload.freshUntil) || undefined,
    nullifierHash: normalizeCommitment(firstDefined(options.input.nullifierHash, options.payload.nullifierHash)) || undefined,
    scope: clean(firstDefined(options.input.scope, options.payload.scope)) || undefined,
    now: options.createdAt,
    localResolverStatus: options.verification.status,
  };
}

function createSafeAddressDnsRecord(options: {
  input: AddressResolutionInput;
  payload: JsonRecord;
  domain: string;
  targetKey: string;
  agidCommitment?: string;
  aoidCommitment?: string;
  createdAt: string;
  highRiskMode?: boolean;
}) {
  const zone = normalizeDnsName(firstDefined(options.input.zone, options.payload.zone), DEFAULT_ZONE);
  const ownerName = normalizeDnsName(
    firstDefined(options.input.ownerName, options.payload.ownerName),
    `res-${sha256Hex(options.targetKey).slice(0, 24)}.${zone}`,
  );
  const record = createAddressDnsRecord({
    ownerName: ownerName.endsWith(zone) ? ownerName : `${ownerName}.${zone}`,
    zone,
    target: {
      addressReferenceCommitment: options.targetKey,
      agidCommitment: options.agidCommitment,
      aoidCommitment: options.aoidCommitment,
    },
    issuerId: clean(firstDefined(options.input.issuerId, options.payload.issuerId)) || undefined,
    freshnessRoot: normalizeCommitment(firstDefined(options.input.freshnessRoot, options.payload.freshnessRoot)) || undefined,
    revocationRoot: normalizeCommitment(firstDefined(options.input.revocationRoot, options.payload.revocationRoot)) || undefined,
    evidenceRoot: normalizeCommitment(firstDefined(options.input.evidenceRoot, options.payload.evidenceRoot)) || undefined,
    scope: clean(firstDefined(options.input.scope, options.payload.scope)) || options.domain,
    issuedAt: options.createdAt,
  }, {
    now: options.createdAt,
    highRiskMode: options.highRiskMode,
  });
  const validation = validateAddressDnsRecord(record, {
    now: options.createdAt,
    highRiskMode: options.highRiskMode,
  });
  if (!validation.valid) return undefined;
  return record;
}

function finalStatus(input: {
  federated: FederatedResolverResult;
  verification: AddressVerificationEngineResult;
  registry?: AgidRegistryVerifyResult;
}) {
  const hardRegistryFailure = input.registry && !input.registry.valid && input.registry.errors.some(error =>
    [
      'commitment-revoked',
      'issuer-revoked',
      'issuer-suspended',
      'nullifier-already-used',
      'freshness-window-stale',
      'freshness-root-not-anchored',
    ].includes(error)
  );

  if (input.federated.status === 'blocked') return { status: 'blocked' as const, decision: 'reject' as const };
  if (hardRegistryFailure) return { status: 'rejected' as const, decision: 'reject' as const };
  if (input.federated.status === 'conflict') return { status: 'conflict' as const, decision: 'review' as const };
  if (input.federated.status === 'unresolved') return { status: 'unresolved' as const, decision: 'reject' as const };
  if (input.verification.status === 'verified' && input.federated.decision === 'accept') {
    return { status: 'resolved' as const, decision: 'accept' as const };
  }
  if (input.verification.status === 'country_mismatch' || input.verification.status === 'unsupported_country') {
    return { status: 'unresolved' as const, decision: 'reject' as const };
  }
  return { status: 'partial' as const, decision: 'review' as const };
}

function confidenceLabel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.82) return 'high';
  if (confidence >= 0.55) return 'medium';
  return 'low';
}

function operatorState(status: AddressResolutionStatus): AddressResolutionSystemResult['displayHints']['operatorState'] {
  if (status === 'resolved') return 'Address OK';
  if (status === 'blocked') return 'Address Blocked';
  if (status === 'rejected' || status === 'unresolved') return 'Address Rejected';
  return 'Address Review';
}

export function getAddressResolutionSystemCapabilities(): AddressResolutionSystemCapabilities {
  return {
    version: ADDRESS_RESOLUTION_SYSTEM_VERSION,
    modes: MODES,
    endpoints: [
      'GET /api/address-resolution/capabilities',
      'POST /api/address-resolution/resolve',
    ],
    localOnly: {
      zkRequired: false,
      ethereumRequired: false,
      gasRequired: false,
      offlineCapable: true,
    },
    integrations: [
      'AGID encode/decode',
      'address verification engine',
      'public/private separation',
      'federated resolver',
      'Mode 1 server registry',
      'Address DNS record format',
      'BGP-style signed address route advertisements',
      'WHOIS/RDAP-style public AGID zone and issuer metadata',
      'DMARC/SPF/DKIM-style issuer and delivery notification authentication',
      'Accept-Language-style address display language negotiation',
      'IPFS/content-addressed public address datasets',
      'signed webhooks for revocation, delivery, credential, and audit events',
      'rate limit and abuse controls for reverse lookup and enumeration',
      'DNS/SRV/MX-style address service records',
      'DNSSEC/RPKI-style signed address zones',
      'TLS/PKI/Certificate-Transparency-style issuer key logs',
      'OCSP/CRL-style credential, AGID-S, AOID, and delivery QR revocation',
      'TTL/Cache-Control/ETag address metadata freshness',
      'HTTP-status-style address resolution decisions',
      'OAuth-scope-style consent and purpose restrictions',
      'IPv6 privacy-address/NAT-style ephemeral address aliases',
      'Anycast/edge routing for nearest resolver and carrier endpoint selection',
      'mDNS/local-first address resolver discovery',
    ],
    informationArchitecture: summarizeAddressInformationArchitecture(),
    privacy: {
      publicFederationPayload: 'commitments-and-public-metadata-only',
      rawAddressToFederation: false,
      rawAgidToFederation: false,
      rawAoidToFederation: false,
      rawCoordinatesToFederation: false,
      addressDnsStoresRawPrivateMaterial: false,
      registryStoresRawPrivateMaterial: false,
    },
  };
}

export async function resolveAddressSystem(input: AddressResolutionInput): Promise<AddressResolutionSystemResult> {
  const mode = input.mode || 'local-only';
  const domain = normalizeDomain(input.domain || mode);
  const createdAt = (parseDate(input.now) ?? new Date()).toISOString();
  const payload = buildMixedPayload(input);
  const { canonical, addressText } = buildCanonical(input, payload);
  const agidContext = buildAgid(input, payload);
  const countryCode = normalizeCountryCode(firstDefined(input.countryCode, payload.countryCode, payload.country_code, canonical.country_code, agidContext.agid?.regionCode));
  const targetCountries = unique((input.targetCountries || []).map(normalizeCountryCode));
  const sourceIds = unique([
    'address-resolution-system',
    agidContext.hasAgid ? 'agid-core' : undefined,
    isPlainRecord(input.payload) ? 'input-payload' : undefined,
  ]);
  const contentLanguage = negotiateAddressContentLanguage(
    clean(firstDefined(input.acceptLanguage, payload.acceptLanguage, input.language, payload.language)) || 'en',
    unique([
      ...(input.availableLanguages || []),
      clean(firstDefined(input.language, payload.language)),
      'en',
    ]),
    clean(firstDefined(input.language, payload.language)) || 'en',
  );

  const verification = verifyAddressCandidate({
    countryCode,
    targetCountries,
    address: canonical,
    addressText,
    postalCode: clean(firstDefined(input.postalCode, payload.postalCode, payload.postcode, payload.zip, canonical.postcode)),
    scope: 'address',
    postalEvidence: input.postalEvidence,
    referenceRecords: input.referenceRecords,
    sources: sourceIds,
    allowFallbackCountryFromAddress: true,
    standardLibrary: {
      sourceLanguage: contentLanguage.selected,
      targetLanguage: contentLanguage.selected,
      hasCoordinates: agidContext.hasCoordinates,
      needsNaturalGeographyContext: agidContext.agid?.isSea,
      sparseOrRemoteArea: agidContext.agid?.regionCode === 'AQ' || agidContext.agid?.isSea,
    },
    systemConnection: {
      hasCoordinates: agidContext.hasCoordinates,
      hasAgid: agidContext.hasAgid,
      hasAoid: Boolean(payload.aoid || payload.aoidCommitment || input.aoidCommitment),
      purpose: mode === 'local-only' ? 'verification' : 'audit',
    },
  });

  const suppliedCommitments = commitmentInputs(input, payload);
  const addressReferenceCommitment = suppliedCommitments.addressReferenceCommitment || makeCommitment({
    domain,
    salt: input.salt,
    kind: 'address-reference',
    createdAt,
    localOnly: mode === 'local-only',
    value: {
      canonical,
      countryCode: verification.country.resolved,
      postcode: verification.postal.normalized,
      agid: agidContext.normalizedAgid,
    },
  });
  const agidCommitment = suppliedCommitments.agidCommitment || (agidContext.normalizedAgid ? makeCommitment({
    domain,
    salt: input.salt,
    kind: 'agid',
    createdAt,
    localOnly: mode === 'local-only',
    value: {
      agid: agidContext.normalizedAgid,
      regionCode: agidContext.agid?.regionCode,
    },
  }) : undefined);
  const aoidCommitment = suppliedCommitments.aoidCommitment;
  const credentialCommitment = suppliedCommitments.credentialCommitment;
  const freshnessRoot = normalizeCommitment(firstDefined(input.freshnessRoot, payload.freshnessRoot)) || undefined;
  const revocationRoot = normalizeCommitment(firstDefined(input.revocationRoot, payload.revocationRoot)) || undefined;
  const evidenceRoot = normalizeCommitment(firstDefined(input.evidenceRoot, payload.evidenceRoot)) || undefined;
  const entityResolution = resolveAddressEntities({
    primary: {
      candidateId: 'primary-address',
      source: 'address-resolution-system',
      canonical,
      addressText,
      countryCode: verification.country.resolved || countryCode,
      agid: agidContext.normalizedAgid,
      addressReferenceCommitment,
      agidCommitment,
      aoidCommitment,
      credentialCommitment,
      confidence: verification.score,
      observedAt: createdAt,
    },
    candidates: [
      ...entityCandidatesFromPayload(payload),
      ...(input.entityCandidates || []),
    ],
    threshold: input.entityResolutionThreshold,
    strictUnitSeparation: input.strictEntityUnitSeparation,
    now: createdAt,
    domain,
  });

  const localSource = buildLocalSource({
    targetKey: addressReferenceCommitment,
    agidCommitment,
    aoidCommitment,
    verification,
    freshnessRoot,
    revocationRoot,
    evidenceRoot,
  });
  const sources = [
    ...(input.includeLocalSource === false ? [] : [localSource]),
    ...(input.sources || []),
  ];

  const federated = await resolveFederatedAddress({
    payload,
    mode: mode as FederatedResolverMode,
    domain,
    salt: input.salt,
    now: createdAt,
    highRiskMode: input.highRiskMode,
    allowPublicAgid: input.allowPublicAgid,
    sources,
    quorum: input.quorum ?? 1,
    minTrustScore: input.minTrustScore,
    timeoutMs: input.timeoutMs,
    minResolvedConfidence: input.minResolvedConfidence,
  });

  const registryVerification = input.registryStore && mode !== 'local-only'
    ? await input.registryStore.verify(registryVerifyInput({
        input,
        payload,
        federated,
        commitments: {
          credentialCommitment,
          addressReferenceCommitment,
          agidCommitment,
          aoidCommitment,
        },
        verification,
        createdAt,
      }))
    : undefined;

  const routeAdvertisements = validateAddressRouteSet(input.routeAdvertisements || [], {
    now: createdAt,
    secretsByKeyId: input.routeSignatureSecrets,
    requireVerifiedSignature: input.requireVerifiedRouteSignatures,
  });
  const issuerAuthentication = input.issuerAuthEnvelope && input.issuerAuthPolicy
    ? validateIssuerAuthenticationEnvelope(input.issuerAuthEnvelope, input.issuerAuthPolicy, {
        secretsByKeyId: input.issuerAuthSecrets,
        requireVerifiedSignature: input.requireVerifiedIssuerSignature,
      })
    : undefined;
  const serviceRecords = validateAddressServiceRecordSet(input.serviceRecords || [], {
    now: createdAt,
    secretsByKeyId: input.serviceRecordSignatureSecrets,
    requireVerifiedSignature: input.requireVerifiedServiceRecordSignatures,
  });
  const revocationStatuses = validateAddressRevocationList(input.revocationStatuses || [], {
    now: createdAt,
    secretsByKeyId: input.revocationSignatureSecrets,
    requireVerifiedSignature: input.requireVerifiedRevocationSignatures,
  });
  const consentGrant = input.consentGrant
    ? validateAddressConsentGrant(input.consentGrant, input.requiredConsentScopes || [], {
        now: createdAt,
        secretsByKeyId: input.consentSecrets,
        requireVerifiedSignature: input.requireVerifiedConsentSignature,
        expectedAudience: domain,
      })
    : undefined;
  const cachePolicy = input.cachePolicy || createAddressCachePolicy({
    profile: input.highRiskMode ? 'agid-secure' : 'delivery-eligibility',
    generatedAt: createdAt,
    payload: {
      mode,
      domain,
      addressReferenceCommitment,
      agidCommitment,
      contentLanguage: contentLanguage.selected,
    },
  });
  const cacheValidation = validateAddressCachePolicy(cachePolicy, { now: createdAt });
  const edgeRoute = selectAddressEdgeRoute({
    serviceRecords: input.serviceRecords,
    routeAdvertisements: input.routeAdvertisements,
    now: createdAt,
    context: {
      country: verification.country.resolved || countryCode,
      region: clean(firstDefined(canonical.state, canonical.city)),
      serviceClass: mode === 'local-only' ? 'address-resolution' : 'audit',
      ...input.edgeRoutingContext,
    },
  });
  const localDiscoveryResults = (input.localDiscoveryRecords || []).map(record => ({
    serviceName: record.serviceName,
    instanceId: record.instanceId,
    validation: validateAddressLocalDiscoveryRecord(record, { now: createdAt }),
  }));
  const localDiscovery = {
    accepted: localDiscoveryResults.filter(item => item.validation.valid).length,
    rejected: localDiscoveryResults.filter(item => !item.validation.valid).length,
    results: localDiscoveryResults,
    errors: unique(localDiscoveryResults.flatMap(item => item.validation.errors.map(error => `${item.instanceId || item.serviceName}: ${error}`))),
    warnings: unique(localDiscoveryResults.flatMap(item => item.validation.warnings.map(warning => `${item.instanceId || item.serviceName}: ${warning}`))),
  };
  const routeProtocolReview = Boolean(input.routeAdvertisements?.length && routeAdvertisements.accepted === 0);
  const serviceRecordReview = Boolean(input.serviceRecords?.length && serviceRecords.accepted === 0);
  const issuerProtocolRejected = Boolean(issuerAuthentication && !issuerAuthentication.valid);
  const revocationProtocolRejected = Boolean(revocationStatuses.revoked > 0 || revocationStatuses.rejected > 0);
  const consentProtocolRejected = Boolean(consentGrant && !consentGrant.valid);
  const localDiscoveryReview = Boolean(input.localDiscoveryRecords?.length && localDiscovery.accepted === 0);
  const entityResolutionReview = entityResolution.evidence.candidateCount > 1
    && ['ambiguous', 'distinct'].includes(entityResolution.status);

  let final = finalStatus({ federated, verification, registry: registryVerification });
  if (issuerProtocolRejected || revocationProtocolRejected || consentProtocolRejected) {
    final = { status: 'rejected', decision: 'reject' };
  } else if ((routeProtocolReview || serviceRecordReview || localDiscoveryReview || entityResolutionReview) && final.decision === 'accept') {
    final = { status: 'partial', decision: 'review' };
  }
  const confidence = clamp01(Math.max(
    verification.score * 0.6 + federated.consensus.confidence * 0.4,
    final.status === 'resolved' ? 0.75 : 0,
  ));
  const record = final.status === 'blocked'
    ? undefined
    : createSafeAddressDnsRecord({
        input,
        payload,
        domain,
        targetKey: addressReferenceCommitment,
        agidCommitment,
        aoidCommitment,
        createdAt,
        highRiskMode: input.highRiskMode,
      });
  const allCommitments = unique([
    credentialCommitment,
    addressReferenceCommitment,
    agidCommitment,
    aoidCommitment,
    ...federated.commitments.map(item => item.commitment),
  ]);
  const resolutionId = `ARS-${sha256Hex(stableStringify({
    version: ADDRESS_RESOLUTION_SYSTEM_VERSION,
    mode,
    domain,
    createdAt,
    addressReferenceCommitment,
    federated: federated.auditFingerprint,
    registry: registryVerification?.checkedAt,
  })).slice(0, 24).toUpperCase()}`;
  const warnings = unique([
    ...verification.warnings,
    ...entityResolution.warnings,
    ...federated.warnings,
    ...(registryVerification?.warnings || []),
    ...routeAdvertisements.warnings,
    ...(routeProtocolReview ? routeAdvertisements.errors : []),
    ...serviceRecords.warnings,
    ...(serviceRecordReview ? serviceRecords.errors : []),
    ...revocationStatuses.warnings,
    ...(consentGrant?.warnings || []),
    ...cacheValidation.warnings,
    ...localDiscovery.warnings,
    edgeRoute.selected ? undefined : edgeRoute.warnings[0],
    ...(issuerAuthentication?.warnings || []),
    contentLanguage.fallback ? 'address-display-language-fallback-used' : undefined,
    record ? undefined : final.status === 'blocked' ? undefined : 'address-dns-record-not-created',
  ]);
  const errors = unique([
    ...entityResolution.errors,
    ...federated.errors,
    ...(registryVerification?.errors || []),
    ...(issuerAuthentication?.errors || []),
    ...revocationStatuses.errors,
    revocationStatuses.revoked > 0 ? 'address-protocol-subject-revoked' : undefined,
    ...(consentGrant?.errors || []),
    ...cacheValidation.errors,
    verification.status === 'country_mismatch' ? 'address-country-outside-targets' : undefined,
    verification.status === 'unsupported_country' ? 'unsupported-address-country' : undefined,
  ]);
  const httpStatus = mapAddressResolutionToHttpStatus({
    status: final.status,
    decision: final.decision,
    errors,
    warnings,
    highRiskMode: input.highRiskMode,
  });
  const nextActions = unique([
    ...verification.nextActions,
    ...federated.actions,
    final.decision === 'review' ? 'operator-review' : undefined,
    final.status === 'rejected' ? 'do-not-complete-handoff' : undefined,
    final.status === 'blocked' ? 'remove-private-material-or-add-salt-for-public-mode' : undefined,
    routeProtocolReview ? 'use-only-valid-signed-route-advertisements' : undefined,
    serviceRecordReview ? 'use-only-valid-signed-address-service-records' : undefined,
    revocationProtocolRejected ? 'reject-revoked-or-stale-address-authority' : undefined,
    consentProtocolRejected ? 'request-purpose-bound-address-consent' : undefined,
    localDiscoveryReview ? 'check-local-resolver-discovery' : undefined,
    issuerProtocolRejected ? 'reject-unverified-issuer-or-delivery-signature' : undefined,
    entityResolutionReview ? 'review-entity-resolution-clusters' : undefined,
    contentLanguage.fallback ? 'confirm-address-display-language' : undefined,
  ]);
  const auditFingerprint = sha256Hex(stableStringify({
    resolutionId,
    status: final.status,
    decision: final.decision,
    verificationStatus: verification.status,
    federatedAudit: federated.auditFingerprint,
    registryValid: registryVerification?.valid,
    recordHash: record?.recordHash,
    routeAdvertisementsAccepted: routeAdvertisements.accepted,
    serviceRecordsAccepted: serviceRecords.accepted,
    revocationStatusesAccepted: revocationStatuses.accepted,
    revocationStatusesRevoked: revocationStatuses.revoked,
    consentGrantValid: consentGrant?.valid,
    issuerAuthenticationValid: issuerAuthentication?.valid,
    httpStatus: httpStatus.code,
    edgeRoute: edgeRoute.recordId || edgeRoute.routeId,
    contentLanguage: contentLanguage.selected,
    commitments: allCommitments,
    entityResolution: {
      status: entityResolution.status,
      decision: entityResolution.decision,
      selectedClusterId: entityResolution.selectedClusterId,
      confidence: entityResolution.confidence,
      clusters: entityResolution.clusters.map(cluster => ({
        clusterId: cluster.clusterId,
        size: cluster.candidates.length,
        confidence: cluster.confidence,
        needsReview: cluster.needsReview,
      })),
    },
  })).slice(0, 32);

  return {
    version: ADDRESS_RESOLUTION_SYSTEM_VERSION,
    mode,
    domain,
    createdAt,
    resolutionId,
    status: final.status,
    decision: final.decision,
    confidence,
    displayHints: {
      language: contentLanguage.selected,
      operatorState: operatorState(final.status),
      confidenceLabel: confidenceLabel(confidence),
    },
    agid: agidContext.agid ? {
      id: agidContext.agid.id,
      regionCode: agidContext.agid.regionCode,
      regionName: agidContext.agid.regionName,
      isSea: agidContext.agid.isSea,
      gridSize: agidContext.agid.gridSize,
      bounds: agidContext.agid.bounds,
    } : undefined,
    decodedAgid: agidContext.decodedAgid,
    canonicalAddress: input.includePrivateLocal === false ? undefined : verification.canonicalAddress,
    verification,
    entityResolution,
    federated,
    registryVerification,
    addressDnsRecord: record,
    internetProtocols: {
      contentLanguage,
      routeAdvertisements,
      serviceRecords,
      issuerAuthentication,
      revocationStatuses,
      consentGrant,
      cachePolicy,
      cacheValidation,
      edgeRoute,
      localDiscovery,
      httpStatus,
      controls: {
        signedRouteAdvertisementsRequired: true,
        personalWhoisRdapDisabled: true,
        issuerAuthenticationModel: 'dmarc-spf-dkim-inspired',
        contentAddressedPublicData: true,
        signedWebhookEvents: true,
        abuseControlsAvailable: true,
        dnsSrvMxRecordsAvailable: true,
        dnssecRpkiStyleValidationAvailable: true,
        pkiTransparencyLogAvailable: true,
        ocspCrlStyleRevocationAvailable: true,
        cacheControlEtagAvailable: true,
        oauthScopeConsentAvailable: true,
        ephemeralAddressAliasesAvailable: true,
        anycastEdgeRoutingAvailable: true,
        mdnsLocalFirstAvailable: true,
      },
    },
    commitments: {
      addressReferenceCommitment,
      agidCommitment,
      aoidCommitment,
      credentialCommitment,
      all: allCommitments,
    },
    privacy: {
      privateInputKeptLocal: true,
      rawAddressSentToFederation: false,
      rawAgidSentToFederation: false,
      rawAoidSentToFederation: false,
      rawCoordinatesSentToFederation: false,
      addressDnsRecordContainsPrivateMaterial: false,
      registryCheckContainsPrivateMaterial: false,
      includePrivateLocal: input.includePrivateLocal !== false,
    },
    warnings,
    errors,
    nextActions,
    sources: unique([
      ADDRESS_RESOLUTION_SYSTEM_VERSION,
      ...verification.sources,
      'address-entity-resolution',
      ...federated.sourceResults.map(source => source.sourceId),
      registryVerification ? 'agid-registry-api-mode1' : undefined,
      record ? 'address-dns-record' : undefined,
      'address-internet-protocols',
      contentLanguage.selected ? 'accept-language-address-display' : undefined,
      input.routeAdvertisements?.length ? 'signed-address-route-advertisements' : undefined,
      input.serviceRecords?.length ? 'dns-srv-mx-address-service-records' : undefined,
      input.revocationStatuses?.length ? 'ocsp-crl-address-revocation-status' : undefined,
      consentGrant ? 'oauth-scope-address-consent' : undefined,
      cachePolicy ? 'ttl-cache-control-etag-address-metadata' : undefined,
      edgeRoute.selected ? 'anycast-edge-address-routing' : undefined,
      input.localDiscoveryRecords?.length ? 'mdns-local-first-address-discovery' : undefined,
      issuerAuthentication ? 'issuer-authentication-envelope' : undefined,
    ]),
    auditFingerprint,
  };
}
