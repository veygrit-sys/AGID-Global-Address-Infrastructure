import { createHash, randomUUID } from 'node:crypto';

export const ORACLE_OPERA_ADAPTER_VERSION = 'oracle-opera-ohip-adapter-v1';

export type OracleOperaEndpointKind = 'profile-address' | 'reservation-profile-address' | 'custom-address';

export type OracleOperaAddressValue = {
  recipient?: string;
  building?: string;
  company?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  street?: string;
  houseNumber?: string;
  locality?: string;
  city?: string;
  district?: string;
  region?: string;
  state?: string;
  province?: string;
  postalCode?: string;
  postcode?: string;
  countryCode?: string;
  country?: string;
  addressLines?: string[];
  lines?: string[];
  displayText?: string;
  formatted?: string;
};

export type OracleOperaAddressSyncRequest = {
  agid?: string;
  address?: OracleOperaAddressValue | string;
  addressText?: string;
  language?: string;
  countryCode?: string;
  tenantId?: string;
  profileId?: string;
  reservationId?: string;
  externalReferenceId?: string;
  propertyCode?: string;
  hotelId?: string;
  addressType?: string;
  coordinates?: {
    lat?: number;
    lon?: number;
    latitude?: number;
    longitude?: number;
  };
  confidence?: number;
  sources?: string[];
  warnings?: string[];
};

export type OracleOperaConfig = {
  enabled: boolean;
  dryRun: boolean;
  endpointKind: OracleOperaEndpointKind;
  baseUrl?: string;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  appKey?: string;
  enterpriseId?: string;
  hotelId?: string;
  scope?: string;
  addressSyncPath?: string;
  addressSyncMethod: 'POST' | 'PUT' | 'PATCH';
  timeoutMs: number;
  retries: number;
  returnRawResponse: boolean;
  gatewayAllowlist: string[];
  secretStorage: 'unset' | 'plaintext' | 'env-encrypted' | 'vault' | 'kms';
  allowedAddressTypes: string[];
  circuitBreakerFailureThreshold: number;
  circuitBreakerCooldownMs: number;
};

export type OracleOperaHealth = {
  adapterVersion: string;
  enabled: boolean;
  dryRun: boolean;
  credentialsConfigured: boolean;
  writePathConfigured: boolean;
  liveWritesEnabled: boolean;
  baseUrlHost?: string;
  hotelIdConfigured: boolean;
  appKeyConfigured: boolean;
  supportedOperations: string[];
  endpointKind: OracleOperaEndpointKind;
  gatewayAllowlistConfigured: boolean;
  secretStorage: OracleOperaConfig['secretStorage'];
  circuitBreaker: OracleOperaCircuitSnapshot;
  deadLetterCount: number;
  auditEventCount: number;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  missingEnvVars: string[];
};

export type OracleOperaAddressPayload = {
  sourceSystem: 'AGID';
  adapterVersion: string;
  agid?: string;
  externalReferenceId: string;
  profileId?: string;
  reservationId?: string;
  propertyCode?: string;
  hotelId?: string;
  address: {
    recipient?: string;
    company?: string;
    building?: string;
    lines: string[];
    street?: string;
    houseNumber?: string;
    locality?: string;
    city?: string;
    district?: string;
    region?: string;
    stateProvince?: string;
    postalCode?: string;
    countryCode?: string;
    country?: string;
    language?: string;
    displayText?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  quality: {
    confidence?: number;
    sources: string[];
    warnings: string[];
  };
};

export type OracleOperaEndpointRequest = {
  endpointKind: OracleOperaEndpointKind;
  mapperId: string;
  method: OracleOperaConfig['addressSyncMethod'];
  pathTemplate: string;
  endpointPath: string;
  body: Record<string, unknown>;
};

export type OracleOperaValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  addressType: string;
  lineCount: number;
  addressLineMaxLength: number;
};

export type OracleOperaRequestSummary = {
  sourceSystem: 'AGID';
  adapterVersion: string;
  endpointKind: OracleOperaEndpointKind;
  mapperId: string;
  method: OracleOperaConfig['addressSyncMethod'];
  agidHash?: string;
  externalReferenceHash: string;
  profileIdHash?: string;
  reservationIdHash?: string;
  tenantId?: string;
  hotelId?: string;
  propertyCode?: string;
  countryCode?: string;
  postalCodePresent: boolean;
  language?: string;
  addressLineCount: number;
  validation: OracleOperaValidationResult;
};

export type OracleOperaAddressSyncResult = {
  ok: boolean;
  mode: 'dry-run' | 'live';
  operation: 'address-sync';
  adapterVersion: string;
  endpoint?: string;
  method: OracleOperaConfig['addressSyncMethod'];
  requestSummary: OracleOperaRequestSummary;
  response?: {
    status: number;
    ok: boolean;
    bodyReturned: false;
    bodyRedacted: true;
    retryAfterSeconds?: number;
  };
  error?: string;
  errorCode?: string;
  deadLetter?: Pick<OracleOperaDeadLetterRecord, 'id' | 'reasonCode' | 'retryAfterSeconds'>;
  warnings: string[];
  sources: string[];
};

export type OracleOperaFetch = (
  url: string,
  options?: RequestInit,
  timeoutMs?: number,
  retries?: number,
) => Promise<Response>;

export type OracleOperaCircuitSnapshot = {
  status: 'closed' | 'open';
  failureCount: number;
  openUntil?: string;
  threshold: number;
  cooldownMs: number;
};

export type OracleOperaDeadLetterRecord = {
  id: string;
  createdAt: string;
  operation: 'address-sync';
  endpointKind: OracleOperaEndpointKind;
  endpointHost?: string;
  hotelId?: string;
  tenantId?: string;
  requestFingerprint: string;
  reasonCode: string;
  retryAfterSeconds?: number;
  httpStatus?: number;
  replayAllowed: false;
};

export type OracleOperaAuditEvent = {
  id: string;
  createdAt: string;
  operation: 'address-sync' | 'health' | 'audit-read' | 'dead-letter-read';
  outcome: 'allowed' | 'rejected' | 'dry-run' | 'dead-lettered';
  mode?: 'dry-run' | 'live';
  endpointKind?: OracleOperaEndpointKind;
  requestId?: string;
  actorId?: string;
  tenantId?: string;
  hotelId?: string;
  agidHash?: string;
  externalReferenceHash?: string;
  profileIdHash?: string;
  reservationIdHash?: string;
  status?: number;
  reasonCode?: string;
  warnings: string[];
};

type TokenCache = {
  key: string;
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | undefined;

const OPERA_PROFILE_ADDRESS_PATH = '/ohip/v1/hotels/{hotelId}/profiles/{profileId}/addresses';
const OPERA_RESERVATION_PROFILE_ADDRESS_PATH = '/ohip/v1/hotels/{hotelId}/reservations/{reservationId}/profileAddresses';
const ADDRESS_LINE_MAX_LENGTH = 80;
const MAX_AUDIT_EVENTS = 200;
const MAX_DEAD_LETTERS = 100;
const SAFE_RETRY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

let circuitFailureCount = 0;
let circuitOpenUntil = 0;
const oracleOperaAuditEvents: OracleOperaAuditEvent[] = [];
const oracleOperaDeadLetters: OracleOperaDeadLetterRecord[] = [];

function envString(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function envBoolean(env: NodeJS.ProcessEnv, key: string, fallback: boolean) {
  const value = envString(env, key);
  if (!value) return fallback;
  return /^(1|true|yes|y|on)$/i.test(value);
}

function envNumber(env: NodeJS.ProcessEnv, key: string, fallback: number) {
  const value = Number(envString(env, key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function envList(env: NodeJS.ProcessEnv, key: string) {
  return (envString(env, key) || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function normalizeEndpointKind(value: string | undefined): OracleOperaEndpointKind {
  if (value === 'profile-address' || value === 'reservation-profile-address' || value === 'custom-address') {
    return value;
  }
  return 'profile-address';
}

function normalizeSecretStorage(value: string | undefined): OracleOperaConfig['secretStorage'] {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'env-encrypted' || normalized === 'vault' || normalized === 'kms' || normalized === 'plaintext') {
    return normalized;
  }
  return 'unset';
}

function cleanText(value: unknown, max = 500) {
  if (Array.isArray(value)) return cleanText(value[0], max);
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text ? text.slice(0, max) : undefined;
}

function cleanLines(values: unknown[]) {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const value of values) {
    const line = cleanText(value, 180);
    if (!line) continue;
    const key = line.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
    if (lines.length >= 6) break;
  }
  return lines;
}

function cleanOperaAddressLines(values: unknown[]) {
  return cleanLines(values).map(line => line.slice(0, ADDRESS_LINE_MAX_LENGTH));
}

function sha256Short(value: unknown, namespace = 'opera') {
  const text = typeof value === 'string'
    ? cleanText(value, 2000)
    : value === undefined || value === null
      ? undefined
      : JSON.stringify(value);
  if (!text) return undefined;
  return `${namespace}_${createHash('sha256').update(text).digest('hex').slice(0, 24)}`;
}

function normalizeAddressObject(value: OracleOperaAddressSyncRequest['address'], addressText?: string): OracleOperaAddressValue {
  if (typeof value === 'string') return { displayText: cleanText(value, 1000) };
  if (value && typeof value === 'object') return value;
  return { displayText: cleanText(addressText, 1000) };
}

function coordinatesFrom(input: OracleOperaAddressSyncRequest) {
  const lat = input.coordinates?.lat ?? input.coordinates?.latitude;
  const lon = input.coordinates?.lon ?? input.coordinates?.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  return { lat: Number(lat), lon: Number(lon) };
}

function buildAddressLines(address: OracleOperaAddressValue) {
  const explicitLines = cleanLines([
    ...(Array.isArray(address.addressLines) ? address.addressLines : []),
    ...(Array.isArray(address.lines) ? address.lines : []),
  ]);
  if (explicitLines.length) return explicitLines;

  const streetWithHouseNo = cleanLines([address.houseNumber, address.street]).join(' ');
  return cleanLines([
    address.recipient,
    address.company,
    address.building,
    address.line1,
    address.line2,
    address.line3,
    address.line4,
    streetWithHouseNo,
    address.locality,
    address.district,
    address.city,
    address.region ?? address.state ?? address.province,
  ]);
}

function sourceList(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values
    .map(value => cleanText(value, 100))
    .filter((value): value is string => Boolean(value));
}

function warningList(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values
    .map(value => cleanText(value, 180))
    .filter((value): value is string => Boolean(value));
}

function safeUrlHost(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).host;
  } catch {
    return undefined;
  }
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizePath(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function fillPathTemplate(path: string, input: OracleOperaAddressSyncRequest, config: OracleOperaConfig) {
  const replacements: Record<string, string | undefined> = {
    profileId: input.profileId,
    reservationId: input.reservationId,
    externalReferenceId: input.externalReferenceId ?? input.agid,
    agid: input.agid,
    hotelId: input.hotelId ?? config.hotelId,
    propertyCode: input.propertyCode,
  };
  return path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key: string) => {
    const value = replacements[key];
    return value ? encodeURIComponent(value) : '';
  });
}

function endpointTemplateFor(config: OracleOperaConfig) {
  if (config.addressSyncPath) return config.addressSyncPath;
  if (config.endpointKind === 'profile-address') return OPERA_PROFILE_ADDRESS_PATH;
  if (config.endpointKind === 'reservation-profile-address') return OPERA_RESERVATION_PROFILE_ADDRESS_PATH;
  return undefined;
}

function ensureHttpsUrl(value: string | undefined) {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function hostFromUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return undefined;
  }
}

function hostAllowed(value: string | undefined, allowlist: string[]) {
  if (!allowlist.length) return true;
  const host = hostFromUrl(value);
  return Boolean(host && allowlist.map(item => item.toLowerCase()).includes(host));
}

function circuitSnapshot(config: Pick<OracleOperaConfig, 'circuitBreakerFailureThreshold' | 'circuitBreakerCooldownMs'>): OracleOperaCircuitSnapshot {
  const now = Date.now();
  return {
    status: circuitOpenUntil > now ? 'open' : 'closed',
    failureCount: circuitFailureCount,
    openUntil: circuitOpenUntil > now ? new Date(circuitOpenUntil).toISOString() : undefined,
    threshold: config.circuitBreakerFailureThreshold,
    cooldownMs: config.circuitBreakerCooldownMs,
  };
}

function noteCircuitSuccess() {
  circuitFailureCount = 0;
  circuitOpenUntil = 0;
}

function noteCircuitFailure(config: OracleOperaConfig) {
  circuitFailureCount += 1;
  if (circuitFailureCount >= config.circuitBreakerFailureThreshold) {
    circuitOpenUntil = Date.now() + config.circuitBreakerCooldownMs;
  }
}

function trimRing<T>(items: T[], limit: number) {
  while (items.length > limit) items.shift();
}

function requestFingerprint(summary: OracleOperaRequestSummary) {
  return sha256Short({
    endpointKind: summary.endpointKind,
    externalReferenceHash: summary.externalReferenceHash,
    profileIdHash: summary.profileIdHash,
    reservationIdHash: summary.reservationIdHash,
    hotelId: summary.hotelId,
    tenantId: summary.tenantId,
    countryCode: summary.countryCode,
  }, 'opera_req')!;
}

function enqueueOracleOperaDeadLetter(input: {
  config: OracleOperaConfig;
  endpoint?: string;
  summary: OracleOperaRequestSummary;
  reasonCode: string;
  retryAfterSeconds?: number;
  httpStatus?: number;
}) {
  const record: OracleOperaDeadLetterRecord = {
    id: `opdl_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    operation: 'address-sync',
    endpointKind: input.summary.endpointKind,
    endpointHost: hostFromUrl(input.endpoint),
    hotelId: input.summary.hotelId,
    tenantId: input.summary.tenantId,
    requestFingerprint: requestFingerprint(input.summary),
    reasonCode: input.reasonCode,
    retryAfterSeconds: input.retryAfterSeconds,
    httpStatus: input.httpStatus,
    replayAllowed: false,
  };
  oracleOperaDeadLetters.push(record);
  trimRing(oracleOperaDeadLetters, MAX_DEAD_LETTERS);
  return record;
}

export function recordOracleOperaAuditEvent(input: Omit<OracleOperaAuditEvent, 'id' | 'createdAt' | 'warnings'> & { warnings?: string[] }) {
  const event: OracleOperaAuditEvent = {
    id: `opaudit_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...input,
    warnings: Array.isArray(input.warnings) ? input.warnings.slice(0, 20) : [],
  };
  oracleOperaAuditEvents.push(event);
  trimRing(oracleOperaAuditEvents, MAX_AUDIT_EVENTS);
  return event;
}

export function listOracleOperaAuditEvents(limit = 50) {
  return oracleOperaAuditEvents.slice(-Math.max(1, Math.min(100, limit))).reverse();
}

export function listOracleOperaDeadLetters(limit = 50) {
  return oracleOperaDeadLetters.slice(-Math.max(1, Math.min(100, limit))).reverse();
}

export function resetOracleOperaRuntimeState() {
  tokenCache = undefined;
  circuitFailureCount = 0;
  circuitOpenUntil = 0;
  oracleOperaAuditEvents.length = 0;
  oracleOperaDeadLetters.length = 0;
}

export function createOracleOperaNoCacheFetch(fetcher: OracleOperaFetch = defaultFetch): OracleOperaFetch {
  return (url, options = {}, timeoutMs, retries = 0) => {
    const method = String(options.method || 'GET').toUpperCase();
    const headers = headersToRecord(options.headers);
    const safeRetries = SAFE_RETRY_METHODS.has(method) ? retries : 0;
    return fetcher(url, {
      ...options,
      cache: 'no-store',
      headers: {
        ...headers,
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    }, timeoutMs, safeRetries);
  };
}

function defaultFetch(url: string, options?: RequestInit) {
  return fetch(url, options);
}

function headersToRecord(headers: HeadersInit | undefined) {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers } as Record<string, string>;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function publicErrorCode(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  if (message.includes('timeout') || message.includes('aborted')) return 'OPERA_TIMEOUT';
  if (message.includes('circuit')) return 'OPERA_CIRCUIT_OPEN';
  return 'OPERA_UPSTREAM_UNAVAILABLE';
}

function parseRetryAfterSeconds(value: string | null) {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(86400, Math.floor(seconds));
  const dateMs = Date.parse(value);
  if (!Number.isFinite(dateMs)) return undefined;
  return Math.max(0, Math.min(86400, Math.ceil((dateMs - Date.now()) / 1000)));
}

function missingCredentialEnvVars(config: OracleOperaConfig) {
  const missing: string[] = [];
  if (!config.baseUrl) missing.push('OPERA_BASE_URL');
  if (!config.appKey) missing.push('OPERA_APP_KEY');
  if (!config.accessToken) {
    if (!config.tokenUrl) missing.push('OPERA_TOKEN_URL');
    if (!config.clientId) missing.push('OPERA_CLIENT_ID');
    if (!config.clientSecret) missing.push('OPERA_CLIENT_SECRET');
  }
  return missing;
}

export function getOracleOperaConfig(env: NodeJS.ProcessEnv = process.env): OracleOperaConfig {
  const method = (envString(env, 'OPERA_ADDRESS_SYNC_METHOD') || 'POST').toUpperCase();
  const allowedAddressTypes = envList(env, 'OPERA_ALLOWED_ADDRESS_TYPES').map(value => value.toUpperCase());
  return {
    enabled: envBoolean(env, 'OPERA_ENABLED', true),
    dryRun: envBoolean(env, 'OPERA_DRY_RUN', true),
    endpointKind: normalizeEndpointKind(envString(env, 'OPERA_ENDPOINT_KIND')),
    baseUrl: envString(env, 'OPERA_BASE_URL'),
    tokenUrl: envString(env, 'OPERA_TOKEN_URL'),
    clientId: envString(env, 'OPERA_CLIENT_ID'),
    clientSecret: envString(env, 'OPERA_CLIENT_SECRET'),
    accessToken: envString(env, 'OPERA_ACCESS_TOKEN'),
    appKey: envString(env, 'OPERA_APP_KEY'),
    enterpriseId: envString(env, 'OPERA_ENTERPRISE_ID'),
    hotelId: envString(env, 'OPERA_HOTEL_ID'),
    scope: envString(env, 'OPERA_SCOPE'),
    addressSyncPath: normalizePath(envString(env, 'OPERA_ADDRESS_SYNC_PATH')),
    addressSyncMethod: method === 'PUT' || method === 'PATCH' ? method : 'POST',
    timeoutMs: envNumber(env, 'OPERA_TIMEOUT_MS', 15000),
    retries: Math.max(0, Math.min(3, Math.floor(envNumber(env, 'OPERA_RETRIES', 1)))),
    returnRawResponse: envBoolean(env, 'OPERA_RETURN_RAW_RESPONSE', false),
    gatewayAllowlist: envList(env, 'OPERA_GATEWAY_ALLOWLIST'),
    secretStorage: normalizeSecretStorage(envString(env, 'OPERA_SECRET_STORAGE')),
    allowedAddressTypes: allowedAddressTypes.length ? allowedAddressTypes : ['HOME', 'BUSINESS', 'OTHER'],
    circuitBreakerFailureThreshold: Math.max(1, Math.min(10, Math.floor(envNumber(env, 'OPERA_CIRCUIT_BREAKER_FAILURE_THRESHOLD', 3)))),
    circuitBreakerCooldownMs: Math.max(1000, Math.floor(envNumber(env, 'OPERA_CIRCUIT_BREAKER_COOLDOWN_MS', 60000))),
  };
}

export function isOracleOperaCredentialConfigured(config: OracleOperaConfig) {
  return Boolean(
    config.enabled &&
    config.baseUrl &&
    config.appKey &&
    (config.accessToken || (config.tokenUrl && config.clientId && config.clientSecret)),
  );
}

export function getOracleOperaMissingEnvVars(config: OracleOperaConfig) {
  const missing = missingCredentialEnvVars(config);
  if (!endpointTemplateFor(config)) missing.push('OPERA_ADDRESS_SYNC_PATH');
  if (!config.dryRun && (config.secretStorage === 'unset' || config.secretStorage === 'plaintext')) {
    missing.push('OPERA_SECRET_STORAGE');
  }
  return missing;
}

export function maskOracleOperaConfig(config: OracleOperaConfig): OracleOperaHealth {
  const credentialsConfigured = isOracleOperaCredentialConfigured(config);
  const writePathConfigured = Boolean(endpointTemplateFor(config));
  const circuitBreaker = circuitSnapshot(config);
  return {
    adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
    enabled: config.enabled,
    dryRun: config.dryRun,
    credentialsConfigured,
    writePathConfigured,
    liveWritesEnabled: credentialsConfigured && writePathConfigured && !config.dryRun,
    baseUrlHost: safeUrlHost(config.baseUrl),
    hotelIdConfigured: Boolean(config.hotelId),
    appKeyConfigured: Boolean(config.appKey),
    supportedOperations: ['address-sync'],
    endpointKind: config.endpointKind,
    gatewayAllowlistConfigured: config.gatewayAllowlist.length > 0,
    secretStorage: config.secretStorage,
    circuitBreaker,
    deadLetterCount: oracleOperaDeadLetters.length,
    auditEventCount: oracleOperaAuditEvents.length,
    requiredEnvVars: [
      'OPERA_BASE_URL',
      'OPERA_APP_KEY',
      'OPERA_TOKEN_URL or OPERA_ACCESS_TOKEN',
      'OPERA_CLIENT_ID',
      'OPERA_CLIENT_SECRET',
      'OPERA_ENDPOINT_KIND or OPERA_ADDRESS_SYNC_PATH',
      'OPERA_SECRET_STORAGE for live writes',
    ],
    optionalEnvVars: [
      'OPERA_ENABLED',
      'OPERA_DRY_RUN',
      'OPERA_HOTEL_ID',
      'OPERA_GATEWAY_ALLOWLIST',
      'OPERA_ENTERPRISE_ID',
      'OPERA_SCOPE',
      'OPERA_ENDPOINT_KIND',
      'OPERA_ADDRESS_SYNC_METHOD',
      'OPERA_TIMEOUT_MS',
      'OPERA_RETRIES',
      'OPERA_RETURN_RAW_RESPONSE',
      'OPERA_ALLOWED_ADDRESS_TYPES',
      'OPERA_CIRCUIT_BREAKER_FAILURE_THRESHOLD',
      'OPERA_CIRCUIT_BREAKER_COOLDOWN_MS',
    ],
    missingEnvVars: getOracleOperaMissingEnvVars(config),
  };
}

export function buildOracleOperaAddressPayload(
  input: OracleOperaAddressSyncRequest,
  config: Pick<OracleOperaConfig, 'hotelId'> = {},
): OracleOperaAddressPayload {
  const address = normalizeAddressObject(input.address, input.addressText);
  const lines = buildAddressLines(address);
  const displayText = cleanText(address.displayText ?? address.formatted ?? input.addressText, 1200);
  const countryCode = cleanText(input.countryCode ?? address.countryCode, 8)?.toUpperCase();
  const postalCode = cleanText(address.postalCode ?? address.postcode, 40);
  const reference = cleanText(input.externalReferenceId ?? input.agid ?? `agid-${Date.now().toString(36)}`, 120) || 'agid-address';

  return {
    sourceSystem: 'AGID',
    adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
    agid: cleanText(input.agid, 120),
    externalReferenceId: reference,
    profileId: cleanText(input.profileId, 120),
    reservationId: cleanText(input.reservationId, 120),
    propertyCode: cleanText(input.propertyCode, 80),
    hotelId: cleanText(input.hotelId ?? config.hotelId, 80),
    address: {
      recipient: cleanText(address.recipient, 180),
      company: cleanText(address.company, 180),
      building: cleanText(address.building, 180),
      lines: lines.length ? lines : displayText ? [displayText] : [],
      street: cleanText(address.street, 180),
      houseNumber: cleanText(address.houseNumber, 80),
      locality: cleanText(address.locality, 180),
      city: cleanText(address.city, 180),
      district: cleanText(address.district, 180),
      region: cleanText(address.region, 180),
      stateProvince: cleanText(address.state ?? address.province ?? address.region, 180),
      postalCode,
      countryCode,
      country: cleanText(address.country, 180),
      language: cleanText(input.language, 40),
      displayText,
      coordinates: coordinatesFrom(input),
    },
    quality: {
      confidence: Number.isFinite(input.confidence) ? Number(input.confidence) : undefined,
      sources: sourceList(input.sources),
      warnings: warningList(input.warnings),
    },
  };
}

function normalizeOperaAddressType(value: unknown, config: OracleOperaConfig) {
  const text = cleanText(value, 24)?.toUpperCase() || 'HOME';
  return config.allowedAddressTypes.includes(text) ? text : '';
}

export function validateOracleOperaPreflight(
  payload: OracleOperaAddressPayload,
  input: OracleOperaAddressSyncRequest,
  config: OracleOperaConfig,
): OracleOperaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const addressType = normalizeOperaAddressType(input.addressType, config);

  if (!addressType) errors.push('invalid-lov-address-type');
  if (!payload.address.lines.length) errors.push('address-lines-required');
  if (payload.address.lines.some(line => line.length > ADDRESS_LINE_MAX_LENGTH)) {
    errors.push(`address-line-exceeds-${ADDRESS_LINE_MAX_LENGTH}`);
  }
  if (!payload.address.countryCode || !/^[A-Z]{2}$/.test(payload.address.countryCode)) {
    errors.push('country-code-must-be-iso-alpha-2');
  }
  if (payload.address.postalCode && payload.address.postalCode.length > 20) {
    errors.push('postal-code-too-long');
  }
  if (payload.address.language && !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(payload.address.language)) {
    errors.push('language-tag-invalid');
  }
  if (!endpointTemplateFor(config)) errors.push('opera-endpoint-template-missing');

  if (!config.dryRun) {
    if (!ensureHttpsUrl(config.baseUrl)) errors.push('opera-base-url-must-be-https');
    if (config.tokenUrl && !ensureHttpsUrl(config.tokenUrl)) errors.push('opera-token-url-must-be-https');
    if (!hostAllowed(config.baseUrl, config.gatewayAllowlist)) errors.push('opera-base-host-not-allowlisted');
    if (config.tokenUrl && !hostAllowed(config.tokenUrl, config.gatewayAllowlist)) errors.push('opera-token-host-not-allowlisted');
    if (config.secretStorage === 'unset' || config.secretStorage === 'plaintext') {
      errors.push('opera-secret-storage-must-be-encrypted-or-vault-backed');
    }
  } else {
    if (!ensureHttpsUrl(config.baseUrl)) warnings.push('live OPERA base URL must use HTTPS before OPERA_DRY_RUN=false.');
    if (config.returnRawResponse) warnings.push('OPERA_RETURN_RAW_RESPONSE is ignored; Oracle response bodies are redacted.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    addressType: addressType || cleanText(input.addressType, 24)?.toUpperCase() || 'INVALID',
    lineCount: payload.address.lines.length,
    addressLineMaxLength: ADDRESS_LINE_MAX_LENGTH,
  };
}

function buildOracleOperaRequestSummary(
  payload: OracleOperaAddressPayload,
  input: OracleOperaAddressSyncRequest,
  config: OracleOperaConfig,
  validation: OracleOperaValidationResult,
  endpointRequest?: Pick<OracleOperaEndpointRequest, 'endpointKind' | 'mapperId' | 'method'>,
): OracleOperaRequestSummary {
  const endpointKind = endpointRequest?.endpointKind ?? config.endpointKind;
  return {
    sourceSystem: 'AGID',
    adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
    endpointKind,
    mapperId: endpointRequest?.mapperId ?? `ohip-${endpointKind}-mapper-v1`,
    method: endpointRequest?.method ?? config.addressSyncMethod,
    agidHash: sha256Short(payload.agid, 'agid'),
    externalReferenceHash: sha256Short(payload.externalReferenceId, 'extref')!,
    profileIdHash: sha256Short(payload.profileId, 'profile'),
    reservationIdHash: sha256Short(payload.reservationId, 'reservation'),
    tenantId: cleanText(input.tenantId, 80),
    hotelId: payload.hotelId,
    propertyCode: payload.propertyCode,
    countryCode: payload.address.countryCode,
    postalCodePresent: Boolean(payload.address.postalCode),
    language: payload.address.language,
    addressLineCount: payload.address.lines.length,
    validation,
  };
}

type OracleOperaOhipAddressCommon = {
  externalReferenceId?: string;
  addressType: string;
  primaryInd: boolean;
  address: {
    addressLine: string[];
    cityName?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
    language?: string;
  };
};

type OracleOperaEndpointMapper = (common: OracleOperaOhipAddressCommon) => {
  mapperId: string;
  body: Record<string, unknown>;
};

const ORACLE_OPERA_OHIP_ENDPOINT_MAPPERS: Record<OracleOperaEndpointKind, OracleOperaEndpointMapper> = {
  'profile-address': (common) => ({
    mapperId: 'ohip-profile-address-mapper-v1',
    body: { profileAddress: common },
  }),
  'reservation-profile-address': (common) => ({
    mapperId: 'ohip-reservation-profile-address-mapper-v1',
    body: { reservationProfileAddress: common },
  }),
  'custom-address': (common) => ({
    mapperId: 'ohip-custom-address-mapper-v1',
    body: { address: common },
  }),
};

export function buildOracleOperaEndpointRequest(
  payload: OracleOperaAddressPayload,
  input: OracleOperaAddressSyncRequest,
  config: OracleOperaConfig,
  validation: OracleOperaValidationResult,
): OracleOperaEndpointRequest {
  const pathTemplate = endpointTemplateFor(config);
  if (!pathTemplate) {
    throw new Error('Oracle OPERA endpoint template is not configured.');
  }

  const addressLines = cleanOperaAddressLines(payload.address.lines).slice(0, 4);
  const ohipAddress = {
    addressLine: addressLines,
    cityName: payload.address.city,
    state: payload.address.stateProvince,
    postalCode: payload.address.postalCode,
    countryCode: payload.address.countryCode,
    language: payload.address.language,
  };
  const common = {
    externalReferenceId: payload.externalReferenceId,
    addressType: validation.addressType,
    primaryInd: true,
    address: ohipAddress,
  };
  const mapped = ORACLE_OPERA_OHIP_ENDPOINT_MAPPERS[config.endpointKind](common);

  return {
    endpointKind: config.endpointKind,
    mapperId: mapped.mapperId,
    method: config.addressSyncMethod,
    pathTemplate,
    endpointPath: fillPathTemplate(pathTemplate, input, config),
    body: mapped.body,
  };
}

export function buildOracleOperaHeaders(config: OracleOperaConfig, accessToken?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (config.appKey) headers['x-app-key'] = config.appKey;
  if (config.hotelId) headers['x-hotelid'] = config.hotelId;
  if (config.enterpriseId) headers['x-enterprise-id'] = config.enterpriseId;
  return headers;
}

export async function requestOracleOperaAccessToken(
  config: OracleOperaConfig,
  fetcher: OracleOperaFetch = defaultFetch,
) {
  if (config.accessToken) return config.accessToken;
  if (!config.tokenUrl || !config.clientId || !config.clientSecret) {
    throw new Error('Oracle OPERA OAuth credentials are not configured.');
  }

  const cacheKey = [config.tokenUrl, config.clientId, config.scope || ''].join('|');
  const now = Date.now();
  if (tokenCache?.key === cacheKey && tokenCache.expiresAt > now + 30000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  body.set('client_id', config.clientId);
  body.set('client_secret', config.clientSecret);
  if (config.scope) body.set('scope', config.scope);

  const response = await fetcher(config.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  }, config.timeoutMs, config.retries);

  if (!response.ok) {
    throw new Error(`Oracle OPERA token request failed with HTTP ${response.status}.`);
  }

  const json = await response.json() as { access_token?: unknown; expires_in?: unknown };
  const token = cleanText(json.access_token, 4000);
  if (!token) throw new Error('Oracle OPERA token response did not include access_token.');

  const expiresInSeconds = Number(json.expires_in);
  tokenCache = {
    key: cacheKey,
    token,
    expiresAt: now + (Number.isFinite(expiresInSeconds) ? Math.max(60, expiresInSeconds) : 300) * 1000,
  };
  return token;
}

export async function syncAddressToOracleOpera(
  input: OracleOperaAddressSyncRequest,
  options: {
    env?: NodeJS.ProcessEnv;
    fetcher?: OracleOperaFetch;
  } = {},
): Promise<OracleOperaAddressSyncResult> {
  const config = getOracleOperaConfig(options.env ?? process.env);
  const fetcher = createOracleOperaNoCacheFetch(options.fetcher ?? defaultFetch);
  const payload = buildOracleOperaAddressPayload(input, config);
  const validation = validateOracleOperaPreflight(payload, input, config);
  let endpointRequest: OracleOperaEndpointRequest | undefined;
  try {
    if (validation.ok) endpointRequest = buildOracleOperaEndpointRequest(payload, input, config, validation);
  } catch {
    // Validation already reports missing endpoint templates. Keep the public result generic.
  }
  const requestSummary = buildOracleOperaRequestSummary(payload, input, config, validation, endpointRequest);
  const warnings = [...payload.quality.warnings, ...validation.warnings];

  if (!config.enabled) warnings.push('Oracle OPERA integration is disabled by OPERA_ENABLED=false.');
  if (!payload.address.postalCode) warnings.push('Postal code is missing; this may be valid only for countries or areas without postal codes.');
  if (config.returnRawResponse) warnings.push('OPERA_RETURN_RAW_RESPONSE is ignored; raw Oracle response bodies are never returned.');

  if (!validation.ok) {
    return {
      ok: false,
      mode: config.dryRun ? 'dry-run' : 'live',
      operation: 'address-sync',
      adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
      method: config.addressSyncMethod,
      requestSummary,
      error: 'Oracle OPERA address sync failed preflight validation.',
      errorCode: 'OPERA_PREFLIGHT_VALIDATION_FAILED',
      warnings: [...warnings, ...validation.errors],
      sources: [ORACLE_OPERA_ADAPTER_VERSION, 'oracle-hospitality-integration-platform'],
    };
  }

  const credentialConfigured = isOracleOperaCredentialConfigured(config);
  const pathConfigured = Boolean(endpointTemplateFor(config));
  const dryRunReasons = [
    config.dryRun ? 'OPERA_DRY_RUN is enabled.' : undefined,
    !credentialConfigured ? `Missing OPERA configuration: ${missingCredentialEnvVars(config).join(', ')}` : undefined,
    !pathConfigured ? 'OPERA endpoint template is not configured.' : undefined,
    !config.enabled ? 'OPERA_ENABLED is false.' : undefined,
  ].filter((value): value is string => Boolean(value));

  if (dryRunReasons.length) {
    return {
      ok: true,
      mode: 'dry-run',
      operation: 'address-sync',
      adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
      method: config.addressSyncMethod,
      requestSummary,
      warnings: [...warnings, ...dryRunReasons],
      sources: [ORACLE_OPERA_ADAPTER_VERSION, 'oracle-hospitality-integration-platform'],
    };
  }

  const circuit = circuitSnapshot(config);
  if (circuit.status === 'open') {
    const deadLetter = enqueueOracleOperaDeadLetter({
      config,
      summary: requestSummary,
      reasonCode: 'OPERA_CIRCUIT_OPEN',
    });
    return {
      ok: false,
      mode: 'live',
      operation: 'address-sync',
      adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
      method: config.addressSyncMethod,
      requestSummary,
      error: 'Oracle OPERA address sync is temporarily blocked by the circuit breaker.',
      errorCode: 'OPERA_CIRCUIT_OPEN',
      deadLetter,
      warnings,
      sources: [ORACLE_OPERA_ADAPTER_VERSION, 'oracle-hospitality-integration-platform'],
    };
  }

  endpointRequest = endpointRequest ?? buildOracleOperaEndpointRequest(payload, input, config, validation);
  const endpoint = `${normalizeBaseUrl(config.baseUrl!)}${endpointRequest.endpointPath}`;

  try {
    const token = await requestOracleOperaAccessToken(config, fetcher);
    const response = await fetcher(endpoint, {
      method: endpointRequest.method,
      headers: buildOracleOperaHeaders(config, token),
      body: JSON.stringify(endpointRequest.body),
    }, config.timeoutMs, 0);
    const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get('retry-after'));
    const deadLetter = response.status === 429 || response.status >= 500
      ? enqueueOracleOperaDeadLetter({
          config,
          endpoint,
          summary: requestSummary,
          reasonCode: response.status === 429 ? 'OPERA_RATE_LIMITED' : 'OPERA_UPSTREAM_ERROR',
          retryAfterSeconds,
          httpStatus: response.status,
        })
      : undefined;
    if (response.ok) noteCircuitSuccess();
    else if (response.status === 429 || response.status >= 500) noteCircuitFailure(config);
    return {
      ok: response.ok,
      mode: 'live',
      operation: 'address-sync',
      adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
      endpoint,
      method: endpointRequest.method,
      requestSummary,
      response: {
        status: response.status,
        ok: response.ok,
        bodyReturned: false,
        bodyRedacted: true,
        retryAfterSeconds,
      },
      error: response.ok ? undefined : 'Oracle OPERA address sync was rejected by the upstream service.',
      errorCode: response.ok ? undefined : response.status === 429 ? 'OPERA_RATE_LIMITED' : 'OPERA_UPSTREAM_REJECTED',
      deadLetter,
      warnings,
      sources: [ORACLE_OPERA_ADAPTER_VERSION, 'oracle-hospitality-integration-platform'],
    };
  } catch (error) {
    noteCircuitFailure(config);
    const errorCode = publicErrorCode(error);
    const deadLetter = enqueueOracleOperaDeadLetter({
      config,
      endpoint,
      summary: requestSummary,
      reasonCode: errorCode,
    });
    return {
      ok: false,
      mode: 'live',
      operation: 'address-sync',
      adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
      endpoint,
      method: endpointRequest.method,
      requestSummary,
      error: 'Oracle OPERA address sync could not be completed.',
      errorCode,
      deadLetter,
      warnings,
      sources: [ORACLE_OPERA_ADAPTER_VERSION, 'oracle-hospitality-integration-platform'],
    };
  }
}
