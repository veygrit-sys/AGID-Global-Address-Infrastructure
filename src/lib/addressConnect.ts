import { sha256Hex } from './sha256';

export const ADDRESS_CONNECT_MODEL_VERSION = 'agid-address-connect-v1';

export const ADDRESS_CONNECT_ROLES = [
  'issuer',
  'carrier',
  'municipality',
  'ngo',
  'ec',
  'warehouse',
  'pos-provider',
  'customs',
  'auditor',
] as const;

export const ADDRESS_CONNECT_ENDPOINT_KINDS = [
  'resolver',
  'carrier',
  'issuer',
  'revocation',
  'webhook',
  'trust-registry',
  'terminal-sync',
  'audit',
  'identity',
  'dispute',
  'tax-customs',
  'dashboard',
] as const;

export const ADDRESS_CONNECT_WEBHOOK_TOPICS = [
  'address_intent.verified',
  'credential.issued',
  'credential.revoked',
  'revocation.updated',
  'endpoint.changed',
  'terminal.sync.required',
  'handoff.completed',
  'qr.used',
  'audit.case.opened',
  'dispute.opened',
  'dispute.resolved',
  'identity.verified',
  'customs.review.required',
] as const;

export const ADDRESS_CONNECT_SCOPES = [
  'issuer:register',
  'carrier:register',
  'endpoint:discover',
  'trust:read',
  'trust:write',
  'revocation:read',
  'revocation:write',
  'webhook:subscribe',
  'terminal:read',
  'terminal:write',
  'audit:read',
  'identity:verify',
  'dispute:read',
  'dispute:write',
  'tax-customs:read',
  'dashboard:read',
  'review:write',
] as const;

export type AddressConnectRole = (typeof ADDRESS_CONNECT_ROLES)[number];
export type AddressConnectEndpointKind = (typeof ADDRESS_CONNECT_ENDPOINT_KINDS)[number];
export type AddressConnectWebhookTopic = (typeof ADDRESS_CONNECT_WEBHOOK_TOPICS)[number];
export type AddressConnectScope = (typeof ADDRESS_CONNECT_SCOPES)[number];

export type AddressConnectParticipantStatus = 'active' | 'probationary' | 'suspended' | 'revoked';
export type AddressConnectTrustLevel =
  | 'root'
  | 'official'
  | 'verified-provider'
  | 'community'
  | 'self-hosted';

export type AddressConnectEndpointRef = {
  endpointId: string;
  kind: AddressConnectEndpointKind;
  label: string;
  publicBaseUrl?: string;
  capabilities: string[];
  countryCodes: string[];
  status: AddressConnectParticipantStatus;
};

export type AddressConnectApiKeyRef = {
  keyId: string;
  fingerprint: string;
  scopes: AddressConnectScope[];
  status: AddressConnectParticipantStatus;
  lastRotatedAt?: string;
};

export type AddressConnectParticipantInput = {
  participantId?: string;
  orgId?: string;
  id?: string;
  displayName?: string;
  name?: string;
  roles?: unknown;
  countries?: unknown;
  countryCodes?: unknown;
  regionCodes?: unknown;
  status?: unknown;
  trustLevel?: unknown;
  publicKeyCommitments?: unknown;
  endpointRefs?: unknown;
  endpoints?: unknown;
  webhookSubscriptions?: unknown;
  webhookTopics?: unknown;
  apiKeyRefs?: unknown;
  metadata?: unknown;
};

export type AddressConnectParticipant = {
  participantId: string;
  displayName: string;
  roles: AddressConnectRole[];
  countryCodes: string[];
  regionCodes: string[];
  status: AddressConnectParticipantStatus;
  trustLevel: AddressConnectTrustLevel;
  publicKeyCommitments: string[];
  endpointRefs: AddressConnectEndpointRef[];
  webhookSubscriptions: AddressConnectWebhookTopic[];
  apiKeyRefs: AddressConnectApiKeyRef[];
  metadataFingerprint: string | null;
};

export type AddressConnectRegistryInput = {
  registryId?: string;
  participants?: unknown;
  participant?: unknown;
  generatedAt?: string;
};

export type AddressConnectRegistry = {
  modelVersion: string;
  registryId: string;
  generatedAt: string;
  accepted: boolean;
  registryRoot: string;
  participants: AddressConnectParticipant[];
  rejectedParticipants: Array<{
    index: number;
    errors: string[];
    warnings: string[];
  }>;
  counts: {
    participants: number;
    endpoints: number;
    issuers: number;
    carriers: number;
    revokedOrSuspended: number;
  };
  privacy: AddressConnectPrivacyBoundary;
  warnings: string[];
};

export type AddressConnectDiscoverQuery = {
  role?: unknown;
  endpointKind?: unknown;
  countryCode?: unknown;
  capability?: unknown;
  includeSuspended?: unknown;
};

export type AddressConnectDiscoveryResult = {
  modelVersion: string;
  matchedEndpointCount: number;
  matches: Array<{
    participantId: string;
    displayName: string;
    roles: AddressConnectRole[];
    trustLevel: AddressConnectTrustLevel;
    endpoint: AddressConnectEndpointRef;
  }>;
  query: {
    role?: AddressConnectRole;
    endpointKind?: AddressConnectEndpointKind;
    countryCode?: string;
    capability?: string;
    includeSuspended: boolean;
  };
  privacy: AddressConnectPrivacyBoundary;
  warnings: string[];
};

export type AddressConnectPrivacyBoundary = {
  organizationsOnly: true;
  personalAddressStorage: false;
  rawAddressStorage: false;
  rawAgidStorage: false;
  rawAoidStorage: false;
  rawApiKeyStorage: false;
  endpointDiscoveryOnly: true;
  apiKeyMaterialAccepted: false;
};

const ADDRESS_CONNECT_PRIVACY: AddressConnectPrivacyBoundary = {
  organizationsOnly: true,
  personalAddressStorage: false,
  rawAddressStorage: false,
  rawAgidStorage: false,
  rawAoidStorage: false,
  rawApiKeyStorage: false,
  endpointDiscoveryOnly: true,
  apiKeyMaterialAccepted: false,
};

const FORBIDDEN_PRIVATE_PUBLIC_API_KEYS = new Set([
  'address',
  'rawaddress',
  'addresstext',
  'plaintextaddress',
  'recipient',
  'recipientname',
  'phone',
  'phonenumber',
  'unit',
  'room',
  'roomnumber',
  'proofcode',
  'recipientsecret',
  'privatekey',
  'secret',
  'apikey',
  'api_key',
  'token',
  'authorization',
  'rawagid',
  'rawaoid',
]);

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  const text = cleanText(value);
  return text ? [text] : [];
}

function cleanCountryCodes(value: unknown): string[] {
  return Array.from(new Set(cleanArray(value).map(item => item.toUpperCase()).filter(item => /^[A-Z0-9-]{2,12}$/.test(item))));
}

function cleanEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const cleaned = cleanText(value) as T;
  return allowed.includes(cleaned) ? cleaned : fallback;
}

function cleanEnums<T extends string>(value: unknown, allowed: readonly T[], fallback: T[]): T[] {
  const selected = cleanArray(value).filter((item): item is T => allowed.includes(item as T));
  return selected.length > 0 ? Array.from(new Set(selected)) : fallback;
}

function statusFromUnknown(value: unknown): AddressConnectParticipantStatus {
  return cleanEnum(value, ['active', 'probationary', 'suspended', 'revoked'] as const, 'active');
}

function trustLevelFromUnknown(value: unknown): AddressConnectTrustLevel {
  return cleanEnum(
    value,
    ['root', 'official', 'verified-provider', 'community', 'self-hosted'] as const,
    'self-hosted',
  );
}

function stableId(prefix: string, seed: string) {
  return `${prefix}-${sha256Hex(seed).slice(0, 16).toUpperCase()}`;
}

export function addressConnectPrivateMaterialPaths(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => addressConnectPrivateMaterialPaths(item, `${prefix}[${index}]`));
  }

  const paths: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (FORBIDDEN_PRIVATE_PUBLIC_API_KEYS.has(normalizedKey)) paths.push(path);
    if ((normalizedKey === 'agid' || normalizedKey === 'aoid') && cleanText(nested)) paths.push(path);
    paths.push(...addressConnectPrivateMaterialPaths(nested, path));
  }
  return Array.from(new Set(paths));
}

function normalizeEndpointRef(
  value: unknown,
  participantSeed: string,
  index: number,
  participantCountries: string[],
): { endpoint?: AddressConnectEndpointRef; warnings: string[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { warnings: [`endpoint-${index}-ignored-non-object`] };
  }

  const source = value as Record<string, unknown>;
  const kind = cleanEnum(
    source.kind ?? source.type,
    ADDRESS_CONNECT_ENDPOINT_KINDS,
    'resolver',
  );
  const publicBaseUrl = cleanText(source.publicBaseUrl ?? source.url ?? source.endpoint);
  const endpointId = cleanText(source.endpointId ?? source.id)
    || stableId('ACE', `${participantSeed}|${kind}|${publicBaseUrl || index}`);
  const status = statusFromUnknown(source.status);
  const countryCodes = cleanCountryCodes(source.countryCodes ?? source.countries);
  const warnings: string[] = [];

  if (publicBaseUrl && !/^https:\/\//i.test(publicBaseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(publicBaseUrl)) {
    warnings.push(`endpoint-${endpointId}-not-https`);
  }

  return {
    endpoint: {
      endpointId,
      kind,
      label: cleanText(source.label ?? source.name) || kind,
      publicBaseUrl: publicBaseUrl || undefined,
      capabilities: cleanArray(source.capabilities),
      countryCodes: countryCodes.length > 0 ? countryCodes : participantCountries,
      status,
    },
    warnings,
  };
}

function normalizeApiKeyRef(value: unknown, participantSeed: string, index: number): AddressConnectApiKeyRef | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const keyId = cleanText(source.keyId ?? source.id ?? source.refId)
    || stableId('ACK', `${participantSeed}|${index}`);
  const scopes = cleanEnums(source.scopes, ADDRESS_CONNECT_SCOPES, ['endpoint:discover']);
  return {
    keyId,
    fingerprint: cleanText(source.fingerprint)
      || sha256Hex(`${participantSeed}|${keyId}|${scopes.join(',')}`).slice(0, 32),
    scopes,
    status: statusFromUnknown(source.status),
    lastRotatedAt: cleanText(source.lastRotatedAt) || undefined,
  };
}

export function normalizeAddressConnectParticipant(input: unknown, index = 0): {
  accepted: boolean;
  participant?: AddressConnectParticipant;
  errors: string[];
  warnings: string[];
} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { accepted: false, errors: ['participant-must-be-object'], warnings: [] };
  }

  const source = input as AddressConnectParticipantInput;
  const privatePaths = addressConnectPrivateMaterialPaths(source);
  const errors = privatePaths.map(path => `private-material-not-accepted:${path}`);
  const warnings: string[] = [];

  if (errors.length > 0) {
    return { accepted: false, errors, warnings };
  }

  const displayName = cleanText(source.displayName ?? source.name) || `Address Connect participant ${index + 1}`;
  const participantId = cleanText(source.participantId ?? source.orgId ?? source.id)
    || stableId('ACP', displayName);
  const roles = cleanEnums(source.roles, ADDRESS_CONNECT_ROLES, ['issuer']);
  const countryCodes = cleanCountryCodes(source.countryCodes ?? source.countries);
  const regionCodes = cleanArray(source.regionCodes).map(item => item.toUpperCase());
  const publicKeyCommitments = cleanArray(source.publicKeyCommitments);
  const endpointInputs = Array.isArray(source.endpointRefs)
    ? source.endpointRefs
    : Array.isArray(source.endpoints)
      ? source.endpoints
      : [];
  const endpointRefs = endpointInputs.flatMap((endpoint, endpointIndex) => {
    const normalized = normalizeEndpointRef(endpoint, participantId, endpointIndex, countryCodes);
    warnings.push(...normalized.warnings);
    return normalized.endpoint ? [normalized.endpoint] : [];
  });
  const apiKeyRefs = (Array.isArray(source.apiKeyRefs) ? source.apiKeyRefs : [])
    .map((item, keyIndex) => normalizeApiKeyRef(item, participantId, keyIndex))
    .filter((item): item is AddressConnectApiKeyRef => Boolean(item));
  const webhookSubscriptions = cleanEnums(
    source.webhookSubscriptions ?? source.webhookTopics,
    ADDRESS_CONNECT_WEBHOOK_TOPICS,
    [],
  );

  if (roles.includes('issuer') && publicKeyCommitments.length === 0) {
    warnings.push('issuer-public-key-commitment-missing');
  }
  if (roles.includes('carrier') && !endpointRefs.some(endpoint => endpoint.kind === 'carrier')) {
    warnings.push('carrier-endpoint-missing');
  }
  if (endpointRefs.length === 0) warnings.push('no-discoverable-endpoint');

  return {
    accepted: true,
    participant: {
      participantId,
      displayName,
      roles,
      countryCodes,
      regionCodes,
      status: statusFromUnknown(source.status),
      trustLevel: trustLevelFromUnknown(source.trustLevel),
      publicKeyCommitments,
      endpointRefs,
      webhookSubscriptions,
      apiKeyRefs,
      metadataFingerprint: source.metadata && typeof source.metadata === 'object'
        ? sha256Hex(stableJson(source.metadata)).slice(0, 32)
        : null,
    },
    errors: [],
    warnings,
  };
}

export function buildAddressConnectRegistry(input: AddressConnectRegistryInput = {}): AddressConnectRegistry {
  const generatedAt = cleanText(input.generatedAt) || new Date().toISOString();
  const registryId = cleanText(input.registryId) || 'agid-address-connect-local';
  const rawParticipants = Array.isArray(input.participants)
    ? input.participants
    : input.participant
      ? [input.participant]
      : [];
  const normalized = rawParticipants.map((participant, index) => normalizeAddressConnectParticipant(participant, index));
  const participants = normalized.flatMap(item => item.participant ? [item.participant] : []);
  const rejectedParticipants = normalized.flatMap((item, index) => item.accepted ? [] : [{
    index,
    errors: item.errors,
    warnings: item.warnings,
  }]);
  const warnings = Array.from(new Set(normalized.flatMap(item => item.warnings)));
  const registryRoot = sha256Hex(stableJson({
    modelVersion: ADDRESS_CONNECT_MODEL_VERSION,
    registryId,
    participants,
  }));

  return {
    modelVersion: ADDRESS_CONNECT_MODEL_VERSION,
    registryId,
    generatedAt,
    accepted: rejectedParticipants.length === 0,
    registryRoot,
    participants,
    rejectedParticipants,
    counts: {
      participants: participants.length,
      endpoints: participants.reduce((count, participant) => count + participant.endpointRefs.length, 0),
      issuers: participants.filter(participant => participant.roles.includes('issuer')).length,
      carriers: participants.filter(participant => participant.roles.includes('carrier')).length,
      revokedOrSuspended: participants.filter(participant => participant.status === 'revoked' || participant.status === 'suspended').length,
    },
    privacy: ADDRESS_CONNECT_PRIVACY,
    warnings,
  };
}

function readRegistry(value: unknown): AddressConnectRegistry {
  if (value && typeof value === 'object' && 'participants' in value && 'registryRoot' in value) {
    return value as AddressConnectRegistry;
  }
  return buildAddressConnectRegistry(value as AddressConnectRegistryInput);
}

export function discoverAddressConnectEndpoints(
  registryOrInput: AddressConnectRegistry | AddressConnectRegistryInput,
  query: AddressConnectDiscoverQuery = {},
): AddressConnectDiscoveryResult {
  const registry = readRegistry(registryOrInput);
  const role = cleanText(query.role) as AddressConnectRole;
  const endpointKind = cleanText(query.endpointKind) as AddressConnectEndpointKind;
  const countryCode = cleanText(query.countryCode).toUpperCase();
  const capability = cleanText(query.capability);
  const includeSuspended = query.includeSuspended === true;
  const roleFilter = ADDRESS_CONNECT_ROLES.includes(role) ? role : undefined;
  const endpointKindFilter = ADDRESS_CONNECT_ENDPOINT_KINDS.includes(endpointKind) ? endpointKind : undefined;

  const matches = registry.participants.flatMap(participant => {
    if (roleFilter && !participant.roles.includes(roleFilter)) return [];
    if (!includeSuspended && (participant.status === 'suspended' || participant.status === 'revoked')) return [];
    return participant.endpointRefs
      .filter((endpoint) => {
        if (endpointKindFilter && endpoint.kind !== endpointKindFilter) return false;
        if (!includeSuspended && (endpoint.status === 'suspended' || endpoint.status === 'revoked')) return false;
        if (countryCode && endpoint.countryCodes.length > 0 && !endpoint.countryCodes.includes(countryCode)) return false;
        if (capability && !endpoint.capabilities.includes(capability)) return false;
        return true;
      })
      .map(endpoint => ({
        participantId: participant.participantId,
        displayName: participant.displayName,
        roles: participant.roles,
        trustLevel: participant.trustLevel,
        endpoint,
      }));
  });

  return {
    modelVersion: ADDRESS_CONNECT_MODEL_VERSION,
    matchedEndpointCount: matches.length,
    matches,
    query: {
      role: roleFilter,
      endpointKind: endpointKindFilter,
      countryCode: countryCode || undefined,
      capability: capability || undefined,
      includeSuspended,
    },
    privacy: ADDRESS_CONNECT_PRIVACY,
    warnings: registry.warnings,
  };
}

export function listAddressConnectCapabilities() {
  return {
    modelVersion: ADDRESS_CONNECT_MODEL_VERSION,
    roles: [...ADDRESS_CONNECT_ROLES],
    endpointKinds: [...ADDRESS_CONNECT_ENDPOINT_KINDS],
    webhookTopics: [...ADDRESS_CONNECT_WEBHOOK_TOPICS],
    scopes: [...ADDRESS_CONNECT_SCOPES],
    supports: {
      issuerRegistration: true,
      carrierRegistration: true,
      endpointDiscovery: true,
      trustRegistry: true,
      revocationRegistry: true,
      webhookSubscription: true,
      webhookOperations: true,
      slaMonitoring: true,
      logRetentionPolicy: true,
      roleBasedAccess: true,
      apiKeyReferenceManagement: true,
      identityVerificationEndpoint: true,
      disputeEndpoint: true,
      taxCustomsEndpoint: true,
      dashboardEndpoint: true,
    },
    privacy: ADDRESS_CONNECT_PRIVACY,
    storageBoundary: 'organization-endpoint-trust-metadata-only',
  };
}
