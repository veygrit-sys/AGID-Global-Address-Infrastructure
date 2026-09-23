import type { CanonicalAddressParts } from './addressIntelligence';
import type { PostalEvidenceCandidate } from './addressVerificationEngine';
import type { OpenAddressesRecord } from './openAddressesReference';

export const EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION = 'external-address-validation-apps-v1';

export type ExternalAddressValidatorCapability =
  | 'parse'
  | 'postal-lookup'
  | 'address-verify'
  | 'delivery-point'
  | 'geocode'
  | 'reverse-geocode';

export type ExternalAddressValidatorPrivacyMode =
  | 'redacted-only'
  | 'plaintext-address-required'
  | 'commitment-only';

export type ExternalAddressValidatorAdapter =
  | 'agid-json-v1'
  | 'generic-json'
  | 'libpostal-compatible';

export type ExternalAddressValidatorManifest = {
  id: string;
  name: string;
  version?: string;
  adapter: ExternalAddressValidatorAdapter;
  capabilities: ExternalAddressValidatorCapability[];
  supportedCountries?: string[];
  privacyMode: ExternalAddressValidatorPrivacyMode;
  endpointId?: string;
  requiresCredential?: boolean;
  dataRetention?: 'none' | 'ephemeral' | 'provider-policy';
  sendsPlaintextAddress?: boolean;
};

export type ExternalAddressValidatorRuntimeConfig = ExternalAddressValidatorManifest & {
  endpoint: string;
  method?: 'POST';
  enabled?: boolean;
  timeoutMs?: number;
  apiKeyEnv?: string;
  allowInsecureLocalhost?: boolean;
};

export type ExternalAddressValidationNormalizedResult = {
  validatorId: string;
  ok: boolean;
  status?: string;
  confidence?: number;
  postalEvidence: PostalEvidenceCandidate[];
  referenceRecords: OpenAddressesRecord[];
  canonicalAddress?: CanonicalAddressParts;
  sources: string[];
  warnings: string[];
  error?: string;
};

export type ExternalAddressValidatorRunResult = {
  results: ExternalAddressValidationNormalizedResult[];
  postalEvidence: PostalEvidenceCandidate[];
  referenceRecords: OpenAddressesRecord[];
  sources: string[];
  warnings: string[];
};

type Fetcher = (url: string, options?: RequestInit, timeoutMs?: number, retries?: number) => Promise<Response>;

const VALID_CAPABILITIES = new Set<ExternalAddressValidatorCapability>([
  'parse',
  'postal-lookup',
  'address-verify',
  'delivery-point',
  'geocode',
  'reverse-geocode',
]);

const VALID_ADAPTERS = new Set<ExternalAddressValidatorAdapter>([
  'agid-json-v1',
  'generic-json',
  'libpostal-compatible',
]);

const VALID_PRIVACY_MODES = new Set<ExternalAddressValidatorPrivacyMode>([
  'redacted-only',
  'plaintext-address-required',
  'commitment-only',
]);

const VALID_RETENTION = new Set(['none', 'ephemeral', 'provider-policy']);

const IMPORT_FORBIDDEN_KEYS = [
  'endpoint',
  'url',
  'apiKey',
  'secret',
  'token',
  'authorization',
  'headers',
  'privateSalt',
  'recipient',
  'phone',
  'room',
  'unit',
  'address',
  'addressText',
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cleanText(value: unknown, maxLength = 120) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function cleanIdentifier(value: unknown) {
  return cleanText(value, 80).toLowerCase();
}

function cleanCountryCode(value: unknown) {
  const text = cleanText(value, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : '';
}

function cleanNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasForbiddenImportedMaterial(input: Record<string, unknown>) {
  const keys = new Set<string>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      keys.add(key);
      visit(child);
    }
  };
  visit(input);
  return IMPORT_FORBIDDEN_KEYS.filter((key) => keys.has(key));
}

export function normalizeExternalAddressValidatorManifest(value: unknown): {
  accepted: boolean;
  manifest?: ExternalAddressValidatorManifest;
  errors: string[];
  warnings: string[];
} {
  const input = asRecord(value);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input) {
    return {
      accepted: false,
      errors: ['External validator manifest must be a JSON object'],
      warnings,
    };
  }

  const forbidden = hasForbiddenImportedMaterial(input);
  if (forbidden.length) {
    errors.push(`Imported manifests must not contain runtime URLs, secrets, or address payload fields: ${forbidden.join(', ')}`);
  }

  const id = cleanIdentifier(input.id);
  if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(id)) {
    errors.push('External validator id must be 2-64 chars: lowercase letters, numbers, dot, underscore, or dash');
  }

  const name = cleanText(input.name);
  if (!name) errors.push('External validator name is required');

  const adapter = cleanText(input.adapter) as ExternalAddressValidatorAdapter;
  if (!VALID_ADAPTERS.has(adapter)) {
    errors.push(`External validator adapter must be one of: ${[...VALID_ADAPTERS].join(', ')}`);
  }

  const privacyMode = cleanText(input.privacyMode ?? input.privacy_mode) as ExternalAddressValidatorPrivacyMode;
  if (!VALID_PRIVACY_MODES.has(privacyMode)) {
    errors.push(`External validator privacyMode must be one of: ${[...VALID_PRIVACY_MODES].join(', ')}`);
  }

  const capabilities = Array.isArray(input.capabilities)
    ? [...new Set(input.capabilities.map((item) => cleanText(item) as ExternalAddressValidatorCapability))]
    : [];
  const invalidCapabilities = capabilities.filter((item) => !VALID_CAPABILITIES.has(item));
  if (!capabilities.length) errors.push('External validator capabilities are required');
  if (invalidCapabilities.length) {
    errors.push(`Unsupported external validator capabilities: ${invalidCapabilities.join(', ')}`);
  }

  const supportedCountries = Array.isArray(input.supportedCountries)
    ? [...new Set(input.supportedCountries.map(cleanCountryCode).filter(Boolean))]
    : Array.isArray(input.supported_countries)
      ? [...new Set(input.supported_countries.map(cleanCountryCode).filter(Boolean))]
      : undefined;

  const endpointId = input.endpointId || input.endpoint_id
    ? cleanIdentifier(input.endpointId ?? input.endpoint_id)
    : undefined;
  if (endpointId && !/^[a-z0-9][a-z0-9._-]{1,63}$/.test(endpointId)) {
    errors.push('endpointId must be 2-64 chars: lowercase letters, numbers, dot, underscore, or dash');
  }

  const dataRetention = cleanText(input.dataRetention ?? input.data_retention) as ExternalAddressValidatorManifest['dataRetention'];
  if (dataRetention && !VALID_RETENTION.has(dataRetention)) {
    errors.push(`dataRetention must be one of: ${[...VALID_RETENTION].join(', ')}`);
  }

  if (privacyMode === 'plaintext-address-required') {
    warnings.push('This validator requires plaintext address material and should only be enabled for trusted deployments.');
  }

  const manifest: ExternalAddressValidatorManifest = {
    id,
    name,
    version: input.version ? cleanText(input.version, 40) : undefined,
    adapter,
    capabilities,
    supportedCountries,
    privacyMode,
    endpointId,
    requiresCredential: Boolean(input.requiresCredential ?? input.requires_credential),
    dataRetention: dataRetention || 'provider-policy',
    sendsPlaintextAddress: Boolean(input.sendsPlaintextAddress ?? input.sends_plaintext_address),
  };

  return {
    accepted: errors.length === 0,
    manifest: errors.length === 0 ? manifest : undefined,
    errors,
    warnings,
  };
}

function isSafeRuntimeEndpoint(endpoint: string, allowInsecureLocalhost = false) {
  try {
    const url = new URL(endpoint);
    if (url.protocol === 'https:') return true;
    if (
      allowInsecureLocalhost &&
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function loadExternalAddressValidatorRuntimeConfig(raw = process.env.AGID_EXTERNAL_ADDRESS_VALIDATORS_JSON): {
  validators: ExternalAddressValidatorRuntimeConfig[];
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!raw || !String(raw).trim()) return { validators: [], errors, warnings };

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    return {
      validators: [],
      errors: ['AGID_EXTERNAL_ADDRESS_VALIDATORS_JSON is not valid JSON'],
      warnings,
    };
  }

  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const validators: ExternalAddressValidatorRuntimeConfig[] = [];

  entries.forEach((entry, index) => {
    const record = asRecord(entry);
    if (!record) {
      errors.push(`External validator runtime config at index ${index} must be an object`);
      return;
    }

    const validation = normalizeExternalAddressValidatorManifest({
      id: record.id,
      name: record.name,
      version: record.version,
      adapter: record.adapter,
      capabilities: record.capabilities,
      supportedCountries: record.supportedCountries ?? record.supported_countries,
      privacyMode: record.privacyMode ?? record.privacy_mode,
      endpointId: record.endpointId ?? record.endpoint_id,
      requiresCredential: record.requiresCredential ?? record.requires_credential,
      dataRetention: record.dataRetention ?? record.data_retention,
      sendsPlaintextAddress: record.sendsPlaintextAddress ?? record.sends_plaintext_address,
    });
    errors.push(...validation.errors.map((error) => `${record.id ?? `index-${index}`}: ${error}`));
    warnings.push(...validation.warnings);

    const endpoint = cleanText(record.endpoint, 500);
    const allowInsecureLocalhost = Boolean(record.allowInsecureLocalhost);
    if (!endpoint) errors.push(`${record.id ?? `index-${index}`}: endpoint is required for runtime execution`);
    if (endpoint && !isSafeRuntimeEndpoint(endpoint, allowInsecureLocalhost)) {
      errors.push(`${record.id ?? `index-${index}`}: endpoint must be HTTPS, or localhost HTTP with allowInsecureLocalhost=true`);
    }

    if (!validation.accepted || !validation.manifest || !endpoint || !isSafeRuntimeEndpoint(endpoint, allowInsecureLocalhost)) {
      return;
    }

    validators.push({
      ...validation.manifest,
      endpoint,
      method: 'POST',
      enabled: record.enabled !== false,
      timeoutMs: typeof record.timeoutMs === 'number' && record.timeoutMs > 0 ? Math.min(record.timeoutMs, 10_000) : 4_000,
      apiKeyEnv: record.apiKeyEnv ? cleanText(record.apiKeyEnv, 80) : undefined,
      allowInsecureLocalhost,
    });
  });

  return { validators, errors, warnings };
}

export function publicExternalAddressValidatorProfile(config: ExternalAddressValidatorRuntimeConfig) {
  const { endpoint, apiKeyEnv, allowInsecureLocalhost, ...publicProfile } = config;
  void endpoint;
  void apiKeyEnv;
  void allowInsecureLocalhost;
  return {
    ...publicProfile,
    serverConfigured: true,
    credentialConfigured: Boolean(config.apiKeyEnv && process.env[config.apiKeyEnv]),
  };
}

function normalizeCanonicalAddress(input: unknown): CanonicalAddressParts | undefined {
  const record = asRecord(input);
  if (!record) return undefined;
  const canonical: CanonicalAddressParts = {
    country_code: cleanCountryCode(record.country_code ?? record.countryCode ?? record.cc) || undefined,
    country: cleanText(record.country),
    state: cleanText(record.state ?? record.province ?? record.region),
    city: cleanText(record.city ?? record.town ?? record.locality),
    district: cleanText(record.district ?? record.county),
    subdistrict: cleanText(record.subdistrict ?? record.neighbourhood ?? record.neighborhood),
    suburb: cleanText(record.suburb),
    road: cleanText(record.road ?? record.street),
    house_number: cleanText(record.house_number ?? record.houseNumber ?? record.house),
    building: cleanText(record.building ?? record.premise),
    postcode: cleanText(record.postcode ?? record.postalCode ?? record.postal_code ?? record.zip),
    poi: cleanText(record.poi ?? record.name),
  };
  Object.keys(canonical).forEach((key) => {
    if (!canonical[key as keyof CanonicalAddressParts]) delete canonical[key as keyof CanonicalAddressParts];
  });
  return Object.keys(canonical).length ? canonical : undefined;
}

function normalizePostalEvidence(input: unknown, validatorId: string): PostalEvidenceCandidate | null {
  const record = asRecord(input);
  if (!record) return null;
  const evidence: PostalEvidenceCandidate = {
    source: cleanText(record.source ?? validatorId, 80),
    sourceId: cleanText(record.sourceId ?? record.source_id ?? validatorId, 120),
    url: undefined,
    countryCode: cleanCountryCode(record.countryCode ?? record.country_code ?? record.cc) || undefined,
    postalCode: cleanText(record.postalCode ?? record.postal_code ?? record.postcode ?? record.zip, 32),
    postcode: cleanText(record.postcode ?? record.postalCode ?? record.postal_code ?? record.zip, 32),
    state: cleanText(record.state ?? record.province ?? record.region),
    city: cleanText(record.city ?? record.town ?? record.locality),
    district: cleanText(record.district ?? record.county),
    subdistrict: cleanText(record.subdistrict ?? record.neighbourhood ?? record.neighborhood),
    suburb: cleanText(record.suburb),
    lat: cleanNumber(record.lat ?? record.latitude),
    lon: cleanNumber(record.lon ?? record.lng ?? record.longitude),
    confidence: cleanNumber(record.confidence ?? record.score),
  };
  Object.keys(evidence).forEach((key) => {
    const value = evidence[key as keyof PostalEvidenceCandidate];
    if (value === '' || value === undefined) delete evidence[key as keyof PostalEvidenceCandidate];
  });
  return evidence.postalCode || evidence.postcode || evidence.city || evidence.state ? evidence : null;
}

function normalizeReferenceRecord(input: unknown, validatorId: string): OpenAddressesRecord | null {
  const record = asRecord(input);
  if (!record) return null;
  const reference: OpenAddressesRecord = {
    source: cleanText(record.source ?? validatorId, 80),
    countryCode: cleanCountryCode(record.countryCode ?? record.country_code ?? record.cc) || undefined,
    state: cleanText(record.state ?? record.province ?? record.region),
    city: cleanText(record.city ?? record.town ?? record.locality),
    street: cleanText(record.street ?? record.road),
    houseNumber: cleanText(record.houseNumber ?? record.house_number ?? record.house),
    postcode: cleanText(record.postcode ?? record.postalCode ?? record.postal_code ?? record.zip, 32),
    lat: cleanNumber(record.lat ?? record.latitude),
    lon: cleanNumber(record.lon ?? record.lng ?? record.longitude),
  };
  Object.keys(reference).forEach((key) => {
    const value = reference[key as keyof OpenAddressesRecord];
    if (value === '' || value === undefined) delete reference[key as keyof OpenAddressesRecord];
  });
  return reference.city || reference.street || reference.postcode ? reference : null;
}

export function normalizeExternalAddressValidationResponse(
  config: Pick<ExternalAddressValidatorRuntimeConfig, 'id'>,
  raw: unknown,
): ExternalAddressValidationNormalizedResult {
  const record = asRecord(raw) ?? {};
  const data = asRecord(record.data) ?? record;
  const postalEvidenceInput =
    Array.isArray(data.postalEvidence) ? data.postalEvidence :
      Array.isArray(data.postal_evidence) ? data.postal_evidence :
        Array.isArray(data.postalCandidates) ? data.postalCandidates :
          data.postalEvidence ? [data.postalEvidence] : [];
  const referenceInput =
    Array.isArray(data.referenceRecords) ? data.referenceRecords :
      Array.isArray(data.reference_records) ? data.reference_records :
        Array.isArray(data.openAddressesRecords) ? data.openAddressesRecords :
          data.referenceRecord ? [data.referenceRecord] : [];

  const canonicalAddress = normalizeCanonicalAddress(data.canonicalAddress ?? data.canonical ?? data.address);
  const postalEvidence = postalEvidenceInput
    .map((item) => normalizePostalEvidence(item, config.id))
    .filter(Boolean) as PostalEvidenceCandidate[];
  const referenceRecords = referenceInput
    .map((item) => normalizeReferenceRecord(item, config.id))
    .filter(Boolean) as OpenAddressesRecord[];

  if (canonicalAddress) {
    postalEvidence.push({
      source: config.id,
      sourceId: `${config.id}:canonical`,
      countryCode: canonicalAddress.country_code?.toUpperCase(),
      postalCode: canonicalAddress.postcode,
      postcode: canonicalAddress.postcode,
      state: canonicalAddress.state,
      city: canonicalAddress.city,
      district: canonicalAddress.district,
      subdistrict: canonicalAddress.subdistrict,
      suburb: canonicalAddress.suburb,
      confidence: cleanNumber(data.confidence ?? data.score),
    });
    referenceRecords.push({
      source: config.id,
      countryCode: canonicalAddress.country_code?.toUpperCase(),
      state: canonicalAddress.state,
      city: canonicalAddress.city,
      street: canonicalAddress.road,
      houseNumber: canonicalAddress.house_number,
      postcode: canonicalAddress.postcode,
    });
  }

  const warnings = [
    ...(Array.isArray(record.warnings) ? record.warnings.map((item) => cleanText(item, 240)).filter(Boolean) : []),
    ...(Array.isArray(data.warnings) ? data.warnings.map((item) => cleanText(item, 240)).filter(Boolean) : []),
  ];

  return {
    validatorId: config.id,
    ok: record.ok !== false && data.ok !== false,
    status: cleanText(data.status ?? record.status, 40) || undefined,
    confidence: cleanNumber(data.confidence ?? data.score ?? record.confidence),
    postalEvidence,
    referenceRecords,
    canonicalAddress,
    sources: [...new Set([config.id, ...postalEvidence.map((item) => item.source), ...referenceRecords.map((item) => item.source)])],
    warnings,
    error: cleanText(record.error ?? data.error, 240) || undefined,
  };
}

function redactedRequestPayload(input: Record<string, unknown>, validator: ExternalAddressValidatorRuntimeConfig) {
  const address = asRecord(input.address);
  const body: Record<string, unknown> = {
    countryCode: cleanCountryCode(input.countryCode ?? input.country_code),
    targetCountries: Array.isArray(input.targetCountries)
      ? input.targetCountries.map(cleanCountryCode).filter(Boolean)
      : undefined,
    postalCode: cleanText(input.postalCode ?? input.postcode, 32),
    postcode: cleanText(input.postcode ?? input.postalCode, 32),
    scope: cleanText(input.scope, 40),
    capabilities: validator.capabilities,
    adapter: validator.adapter,
  };

  if (address) {
    body.address = {
      country_code: cleanCountryCode(address.country_code ?? address.countryCode ?? address.cc) || undefined,
      country: cleanText(address.country),
      state: cleanText(address.state),
      city: cleanText(address.city),
      district: cleanText(address.district),
      subdistrict: cleanText(address.subdistrict),
      suburb: cleanText(address.suburb),
      postcode: cleanText(address.postcode ?? address.postalCode, 32),
    };
  }

  if (validator.privacyMode === 'plaintext-address-required') {
    body.addressText = cleanText(input.addressText, 500);
    if (address) body.address = address;
  }

  Object.keys(body).forEach((key) => {
    const value = body[key];
    if (value === '' || value === undefined || (Array.isArray(value) && value.length === 0)) delete body[key];
  });
  return body;
}

export async function runExternalAddressValidators({
  validators,
  requestedValidatorIds,
  input,
  fetcher,
  allowPlaintextToExternalValidators = false,
}: {
  validators: ExternalAddressValidatorRuntimeConfig[];
  requestedValidatorIds?: string[];
  input: Record<string, unknown>;
  fetcher: Fetcher;
  allowPlaintextToExternalValidators?: boolean;
}): Promise<ExternalAddressValidatorRunResult> {
  const requested = requestedValidatorIds?.length ? new Set(requestedValidatorIds.map(cleanIdentifier)) : null;
  const selected = validators.filter((validator) => validator.enabled !== false && (!requested || requested.has(validator.id)));
  const results: ExternalAddressValidationNormalizedResult[] = [];
  const warnings: string[] = [];

  for (const validator of selected) {
    if (validator.privacyMode === 'plaintext-address-required' && !allowPlaintextToExternalValidators) {
      const warning = `${validator.id}: skipped because plaintext external validation was not explicitly allowed`;
      warnings.push(warning);
      results.push({
        validatorId: validator.id,
        ok: false,
        postalEvidence: [],
        referenceRecords: [],
        sources: [validator.id],
        warnings: [warning],
        error: warning,
      });
      continue;
    }

    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (validator.apiKeyEnv && process.env[validator.apiKeyEnv]) {
        headers.authorization = `Bearer ${process.env[validator.apiKeyEnv]}`;
      }
      const response = await fetcher(
        validator.endpoint,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(redactedRequestPayload(input, validator)),
        },
        validator.timeoutMs ?? 4_000,
        0,
      );
      if (!response.ok) {
        const warning = `${validator.id}: external validator returned HTTP ${response.status}`;
        warnings.push(warning);
        results.push({
          validatorId: validator.id,
          ok: false,
          postalEvidence: [],
          referenceRecords: [],
          sources: [validator.id],
          warnings: [warning],
          error: warning,
        });
        continue;
      }
      const raw = await response.json().catch(() => ({}));
      results.push(normalizeExternalAddressValidationResponse(validator, raw));
    } catch (error) {
      const warning = `${validator.id}: external validator failed`;
      warnings.push(warning);
      results.push({
        validatorId: validator.id,
        ok: false,
        postalEvidence: [],
        referenceRecords: [],
        sources: [validator.id],
        warnings: [warning],
        error: error instanceof Error ? error.message : warning,
      });
    }
  }

  return {
    results,
    postalEvidence: results.flatMap((result) => result.postalEvidence),
    referenceRecords: results.flatMap((result) => result.referenceRecords),
    sources: [...new Set(results.flatMap((result) => result.sources))],
    warnings: [...warnings, ...results.flatMap((result) => result.warnings)],
  };
}
