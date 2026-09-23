import { buildSpecialDeliveryProfile } from './specialDeliveryProfile';

export const EXTERNAL_DELIVERY_API_MODEL_VERSION = 'external-delivery-api-v1';

export type ExternalDeliveryApiOperation =
  | 'rate-quote'
  | 'service-availability'
  | 'shipment-create'
  | 'label-create'
  | 'tracking'
  | 'cancel'
  | 'pickup-schedule'
  | 'carrier-acceptance'
  | 'delivery-proof';

export type ExternalDeliveryApiAdapter =
  | 'agid-delivery-json-v1'
  | 'generic-json'
  | 'shippo-compatible'
  | 'easypost-compatible'
  | 'carrier-rest-compatible';

export type ExternalDeliveryApiPrivacyMode =
  | 'commitment-only'
  | 'redacted-shipping'
  | 'plaintext-shipping-required';

export type ExternalDeliveryApiManifest = {
  id: string;
  carrierId: string;
  name: string;
  version?: string;
  adapter: ExternalDeliveryApiAdapter;
  operations: ExternalDeliveryApiOperation[];
  supportedCountries?: string[];
  privacyMode: ExternalDeliveryApiPrivacyMode;
  endpointId?: string;
  requiresCredential?: boolean;
  supportsSandbox?: boolean;
  dataRetention?: 'none' | 'ephemeral' | 'provider-policy';
};

export type ExternalDeliveryApiRuntimeConfig = ExternalDeliveryApiManifest & {
  endpoint: string;
  method?: 'POST';
  enabled?: boolean;
  timeoutMs?: number;
  apiKeyEnv?: string;
  allowInsecureLocalhost?: boolean;
  allowRawLabelPayloadReturn?: boolean;
};

export type ExternalDeliveryApiNormalizedResult = {
  apiId: string;
  carrierId: string;
  operation: ExternalDeliveryApiOperation;
  ok: boolean;
  status?: string;
  serviceLevel?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrierReference?: string;
  label?: {
    available: boolean;
    format?: string;
    url?: string;
    payload?: string;
    rawPayloadReturned: boolean;
  };
  shipment?: {
    accepted?: boolean;
    shipmentId?: string;
    waybillAlias?: string;
    waybillCommitment?: string;
  };
  events: Array<{
    status: string;
    observedAt?: string;
    location?: string;
  }>;
  warnings: string[];
  sources: string[];
  error?: string;
};

export type ExternalDeliveryApiRunResult = {
  results: ExternalDeliveryApiNormalizedResult[];
  warnings: string[];
  sources: string[];
};

type Fetcher = (url: string, options?: RequestInit, timeoutMs?: number, retries?: number) => Promise<Response>;

const VALID_OPERATIONS = new Set<ExternalDeliveryApiOperation>([
  'rate-quote',
  'service-availability',
  'shipment-create',
  'label-create',
  'tracking',
  'cancel',
  'pickup-schedule',
  'carrier-acceptance',
  'delivery-proof',
]);

const VALID_ADAPTERS = new Set<ExternalDeliveryApiAdapter>([
  'agid-delivery-json-v1',
  'generic-json',
  'shippo-compatible',
  'easypost-compatible',
  'carrier-rest-compatible',
]);

const VALID_PRIVACY_MODES = new Set<ExternalDeliveryApiPrivacyMode>([
  'commitment-only',
  'redacted-shipping',
  'plaintext-shipping-required',
]);

const VALID_RETENTION = new Set(['none', 'ephemeral', 'provider-policy']);

const FORBIDDEN_IMPORT_KEYS = [
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
  'email',
  'street',
  'room',
  'unit',
  'building',
  'address',
  'addressText',
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cleanText(value: unknown, maxLength = 160) {
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
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function collectForbiddenKeys(input: Record<string, unknown>) {
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
  return FORBIDDEN_IMPORT_KEYS.filter((key) => keys.has(key));
}

export function normalizeExternalDeliveryApiManifest(value: unknown): {
  accepted: boolean;
  manifest?: ExternalDeliveryApiManifest;
  errors: string[];
  warnings: string[];
} {
  const input = asRecord(value);
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input) {
    return {
      accepted: false,
      errors: ['External delivery API manifest must be a JSON object'],
      warnings,
    };
  }

  const forbidden = collectForbiddenKeys(input);
  if (forbidden.length) {
    errors.push(`Imported delivery manifests must not contain runtime URLs, secrets, or shipment payload fields: ${forbidden.join(', ')}`);
  }

  const id = cleanIdentifier(input.id);
  if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(id)) {
    errors.push('External delivery API id must be 2-64 chars: lowercase letters, numbers, dot, underscore, or dash');
  }

  const carrierId = cleanIdentifier(input.carrierId ?? input.carrier_id ?? id);
  if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(carrierId)) {
    errors.push('carrierId must be 2-64 chars: lowercase letters, numbers, dot, underscore, or dash');
  }

  const name = cleanText(input.name);
  if (!name) errors.push('External delivery API name is required');

  const adapter = cleanText(input.adapter) as ExternalDeliveryApiAdapter;
  if (!VALID_ADAPTERS.has(adapter)) {
    errors.push(`External delivery API adapter must be one of: ${[...VALID_ADAPTERS].join(', ')}`);
  }

  const privacyMode = cleanText(input.privacyMode ?? input.privacy_mode) as ExternalDeliveryApiPrivacyMode;
  if (!VALID_PRIVACY_MODES.has(privacyMode)) {
    errors.push(`External delivery API privacyMode must be one of: ${[...VALID_PRIVACY_MODES].join(', ')}`);
  }

  const operations = Array.isArray(input.operations)
    ? [...new Set(input.operations.map((item) => cleanText(item) as ExternalDeliveryApiOperation))]
    : [];
  const invalidOperations = operations.filter((operation) => !VALID_OPERATIONS.has(operation));
  if (!operations.length) errors.push('External delivery API operations are required');
  if (invalidOperations.length) errors.push(`Unsupported external delivery API operations: ${invalidOperations.join(', ')}`);

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

  const dataRetention = cleanText(input.dataRetention ?? input.data_retention) as ExternalDeliveryApiManifest['dataRetention'];
  if (dataRetention && !VALID_RETENTION.has(dataRetention)) {
    errors.push(`dataRetention must be one of: ${[...VALID_RETENTION].join(', ')}`);
  }

  if (privacyMode === 'plaintext-shipping-required') {
    warnings.push('This delivery API requires plaintext shipment data and must only be enabled for trusted carrier integrations.');
  }

  const manifest: ExternalDeliveryApiManifest = {
    id,
    carrierId,
    name,
    version: input.version ? cleanText(input.version, 40) : undefined,
    adapter,
    operations,
    supportedCountries,
    privacyMode,
    endpointId,
    requiresCredential: Boolean(input.requiresCredential ?? input.requires_credential),
    supportsSandbox: Boolean(input.supportsSandbox ?? input.supports_sandbox),
    dataRetention: dataRetention || 'provider-policy',
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

export function loadExternalDeliveryApiRuntimeConfig(raw = process.env.AGID_EXTERNAL_DELIVERY_APIS_JSON): {
  apis: ExternalDeliveryApiRuntimeConfig[];
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!raw || !String(raw).trim()) return { apis: [], errors, warnings };

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    return {
      apis: [],
      errors: ['AGID_EXTERNAL_DELIVERY_APIS_JSON is not valid JSON'],
      warnings,
    };
  }

  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const apis: ExternalDeliveryApiRuntimeConfig[] = [];

  entries.forEach((entry, index) => {
    const record = asRecord(entry);
    if (!record) {
      errors.push(`External delivery API runtime config at index ${index} must be an object`);
      return;
    }

    const validation = normalizeExternalDeliveryApiManifest({
      id: record.id,
      carrierId: record.carrierId ?? record.carrier_id,
      name: record.name,
      version: record.version,
      adapter: record.adapter,
      operations: record.operations,
      supportedCountries: record.supportedCountries ?? record.supported_countries,
      privacyMode: record.privacyMode ?? record.privacy_mode,
      endpointId: record.endpointId ?? record.endpoint_id,
      requiresCredential: record.requiresCredential ?? record.requires_credential,
      supportsSandbox: record.supportsSandbox ?? record.supports_sandbox,
      dataRetention: record.dataRetention ?? record.data_retention,
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

    apis.push({
      ...validation.manifest,
      endpoint,
      method: 'POST',
      enabled: record.enabled !== false,
      timeoutMs: typeof record.timeoutMs === 'number' && record.timeoutMs > 0 ? Math.min(record.timeoutMs, 15_000) : 6_000,
      apiKeyEnv: record.apiKeyEnv ? cleanText(record.apiKeyEnv, 80) : undefined,
      allowInsecureLocalhost,
      allowRawLabelPayloadReturn: Boolean(record.allowRawLabelPayloadReturn),
    });
  });

  return { apis, errors, warnings };
}

export function publicExternalDeliveryApiProfile(config: ExternalDeliveryApiRuntimeConfig) {
  const { endpoint, apiKeyEnv, allowInsecureLocalhost, allowRawLabelPayloadReturn, ...publicProfile } = config;
  void endpoint;
  void apiKeyEnv;
  void allowInsecureLocalhost;
  return {
    ...publicProfile,
    serverConfigured: true,
    credentialConfigured: Boolean(config.apiKeyEnv && process.env[config.apiKeyEnv]),
    rawLabelPayloadReturnEnabled: Boolean(allowRawLabelPayloadReturn),
  };
}

function operationFrom(value: unknown): ExternalDeliveryApiOperation | undefined {
  const operation = cleanText(value) as ExternalDeliveryApiOperation;
  return VALID_OPERATIONS.has(operation) ? operation : undefined;
}

function compactPayload(record: Record<string, unknown>) {
  Object.keys(record).forEach((key) => {
    const value = record[key];
    if (
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0)
    ) {
      delete record[key];
    }
  });
  return record;
}

function redactedAddress(value: unknown) {
  const address = asRecord(value);
  if (!address) return undefined;
  return compactPayload({
    countryCode: cleanCountryCode(address.countryCode ?? address.country_code ?? address.cc),
    state: cleanText(address.state ?? address.province ?? address.region),
    city: cleanText(address.city ?? address.town ?? address.locality),
    district: cleanText(address.district ?? address.county),
    postcode: cleanText(address.postcode ?? address.postalCode ?? address.postal_code ?? address.zip, 32),
  });
}

function parcelPayload(value: unknown) {
  const parcel = asRecord(value);
  if (!parcel) return undefined;
  return compactPayload({
    weightGrams: cleanNumber(parcel.weightGrams ?? parcel.weight_grams),
    weightKg: cleanNumber(parcel.weightKg ?? parcel.weight_kg),
    lengthCm: cleanNumber(parcel.lengthCm ?? parcel.length_cm),
    widthCm: cleanNumber(parcel.widthCm ?? parcel.width_cm),
    heightCm: cleanNumber(parcel.heightCm ?? parcel.height_cm),
    declaredValue: cleanNumber(parcel.declaredValue ?? parcel.declared_value),
    currency: cleanText(parcel.currency, 8).toUpperCase(),
    contentsCategory: cleanText(parcel.contentsCategory ?? parcel.category, 80),
  });
}

function safeStringArray(value: unknown, maxItemLength = 80) {
  if (!Array.isArray(value)) return [];
  return value.map(item => cleanText(item, maxItemLength)).filter(Boolean);
}

function specialDeliveryPayload(input: Record<string, unknown>) {
  const destinationProfile = asRecord(input.destinationProfile ?? input.specialDelivery ?? input.deliveryDestination) ?? {};
  const destination = asRecord(input.destination ?? input.address ?? input.recipientAddress) ?? {};
  const parcel = asRecord(input.parcel) ?? {};
  const profile = buildSpecialDeliveryProfile({
    destinationKind: input.destinationKind ?? destinationProfile.destinationKind ?? destinationProfile.kind ?? destination.destinationKind,
    parcelKind: input.parcelKind ?? destinationProfile.parcelKind ?? parcel.parcelKind ?? parcel.contentsCategory ?? parcel.category,
    handoffPoint: input.handoffPoint ?? destinationProfile.handoffPoint ?? destinationProfile.handoff_point,
    placeLabel: input.placeLabel ?? destinationProfile.placeLabel ?? destination.placeLabel ?? destination.name,
  });
  const requestedHandling = safeStringArray(input.specialHandlingCodes ?? destinationProfile.specialHandlingCodes);
  const specialHandlingCodes = [...new Set([...profile.specialHandlingCodes, ...requestedHandling])];
  const isStandard = profile.destinationKind === 'standard'
    && profile.parcelKind === 'standard-parcel'
    && !profile.handoffPoint
    && specialHandlingCodes.length === 0;
  if (isStandard) return undefined;

  return compactPayload({
    modelVersion: profile.modelVersion,
    destinationKind: profile.destinationKind,
    parcelKind: profile.parcelKind,
    handoffPoint: profile.handoffPoint,
    handoffOptions: profile.handoffOptions,
    requiredSkills: profile.requiredSkills,
    recommendedVehicleModes: profile.recommendedVehicleModes,
    minimumServiceMinutes: profile.minimumServiceMinutes,
    recipientProofRequired: profile.recipientProofRequired,
    counterAcceptanceRequired: profile.counterAcceptanceRequired,
    specialHandlingCodes,
    warnings: profile.warnings,
  });
}

function buildRequestPayload(
  input: Record<string, unknown>,
  api: ExternalDeliveryApiRuntimeConfig,
  operation: ExternalDeliveryApiOperation,
  allowPlaintextToExternalDeliveryApi: boolean,
) {
  const shippingLabel = asRecord(input.shippingLabel) ?? asRecord(input.waybill) ?? {};
  const destination = input.destination ?? input.address ?? input.recipientAddress;
  const origin = input.origin ?? input.shipperAddress;
  const payload: Record<string, unknown> = compactPayload({
    operation,
    carrierId: api.carrierId,
    adapter: api.adapter,
    mode: api.privacyMode,
    waybillAlias: cleanText(input.waybillAlias ?? shippingLabel.waybillAlias ?? shippingLabel.waybillId, 120),
    waybillCommitment: cleanText(input.waybillCommitment ?? shippingLabel.waybillCommitment, 160),
    addressReferenceCommitment: cleanText(
      input.addressReferenceCommitment ??
      shippingLabel.addressReferenceCommitment ??
      (asRecord(shippingLabel.address)?.referenceCommitment),
      160,
    ),
    jti: cleanText(input.jti ?? shippingLabel.jti, 80),
    trackingNumber: cleanText(input.trackingNumber ?? input.tracking_number, 80),
    serviceLevel: cleanText(input.serviceLevel ?? input.service_level ?? shippingLabel.serviceLevel, 80),
    parcel: parcelPayload(input.parcel),
    specialDelivery: specialDeliveryPayload(input),
    customs: asRecord(input.customs)
      ? compactPayload({
        hsCode: cleanText((input.customs as Record<string, unknown>).hsCode, 16),
        declaredValue: cleanNumber((input.customs as Record<string, unknown>).declaredValue),
        currency: cleanText((input.customs as Record<string, unknown>).currency, 8).toUpperCase(),
        contentsCategory: cleanText((input.customs as Record<string, unknown>).contentsCategory, 80),
      })
      : undefined,
  });

  if (api.privacyMode !== 'commitment-only') {
    payload.origin = redactedAddress(origin);
    payload.destination = redactedAddress(destination);
  }

  if (api.privacyMode === 'plaintext-shipping-required' && allowPlaintextToExternalDeliveryApi) {
    payload.origin = origin;
    payload.destination = destination;
    payload.recipient = input.recipient;
    payload.shipper = input.shipper;
  }

  return compactPayload(payload);
}

function normalizeEvents(value: unknown) {
  const events = Array.isArray(value) ? value : [];
  return events.map((item) => {
    const record = asRecord(item) ?? {};
    return compactPayload({
      status: cleanText(record.status ?? record.code ?? record.description, 80),
      observedAt: cleanText(record.observedAt ?? record.timestamp ?? record.time, 80),
      location: cleanText(record.location ?? record.place, 120),
    }) as ExternalDeliveryApiNormalizedResult['events'][number];
  }).filter((event) => event.status);
}

export function normalizeExternalDeliveryApiResponse(
  api: Pick<ExternalDeliveryApiRuntimeConfig, 'id' | 'carrierId' | 'allowRawLabelPayloadReturn'>,
  operation: ExternalDeliveryApiOperation,
  raw: unknown,
  allowLabelPayloadReturn = false,
): ExternalDeliveryApiNormalizedResult {
  const record = asRecord(raw) ?? {};
  const data = asRecord(record.data) ?? record;
  const labelRecord = asRecord(data.label) ?? {};
  const rawLabelPayload = cleanText(
    labelRecord.payload ??
    labelRecord.base64 ??
    data.labelPayload ??
    data.label_base64,
    1_000_000,
  );
  const canReturnRawLabel = Boolean(api.allowRawLabelPayloadReturn && allowLabelPayloadReturn);
  const labelUrl = cleanText(labelRecord.url ?? data.labelUrl ?? data.label_url, 500);
  const labelFormat = cleanText(labelRecord.format ?? data.labelFormat ?? data.label_format, 40);

  return {
    apiId: api.id,
    carrierId: api.carrierId,
    operation,
    ok: record.ok !== false && data.ok !== false,
    status: cleanText(data.status ?? record.status, 80) || undefined,
    serviceLevel: cleanText(data.serviceLevel ?? data.service_level, 80) || undefined,
    trackingNumber: cleanText(data.trackingNumber ?? data.tracking_number, 80) || undefined,
    trackingUrl: cleanText(data.trackingUrl ?? data.tracking_url, 500) || undefined,
    carrierReference: cleanText(data.carrierReference ?? data.carrier_reference ?? data.shipmentId ?? data.shipment_id, 120) || undefined,
    label: labelUrl || labelFormat || rawLabelPayload
      ? {
        available: true,
        format: labelFormat || undefined,
        url: labelUrl || undefined,
        payload: canReturnRawLabel ? rawLabelPayload || undefined : undefined,
        rawPayloadReturned: Boolean(canReturnRawLabel && rawLabelPayload),
      }
      : undefined,
    shipment: {
      accepted: data.accepted === true || data.shipmentAccepted === true,
      shipmentId: cleanText(data.shipmentId ?? data.shipment_id, 120) || undefined,
      waybillAlias: cleanText(data.waybillAlias ?? data.waybill_alias, 120) || undefined,
      waybillCommitment: cleanText(data.waybillCommitment ?? data.waybill_commitment, 160) || undefined,
    },
    events: normalizeEvents(data.events ?? data.trackingEvents ?? data.tracking_events),
    warnings: [
      ...(Array.isArray(record.warnings) ? record.warnings.map((item) => cleanText(item, 240)).filter(Boolean) : []),
      ...(Array.isArray(data.warnings) ? data.warnings.map((item) => cleanText(item, 240)).filter(Boolean) : []),
      ...(!canReturnRawLabel && rawLabelPayload ? ['raw-label-payload-suppressed'] : []),
    ],
    sources: [...new Set([api.id, api.carrierId])],
    error: cleanText(record.error ?? data.error, 240) || undefined,
  };
}

export async function runExternalDeliveryApiOperation({
  apis,
  requestedApiIds,
  operation,
  input,
  fetcher,
  allowPlaintextToExternalDeliveryApi = false,
  allowLabelPayloadReturn = false,
}: {
  apis: ExternalDeliveryApiRuntimeConfig[];
  requestedApiIds?: string[];
  operation: ExternalDeliveryApiOperation;
  input: Record<string, unknown>;
  fetcher: Fetcher;
  allowPlaintextToExternalDeliveryApi?: boolean;
  allowLabelPayloadReturn?: boolean;
}): Promise<ExternalDeliveryApiRunResult> {
  const requested = requestedApiIds?.length ? new Set(requestedApiIds.map(cleanIdentifier)) : null;
  const selected = apis.filter((api) => (
    api.enabled !== false &&
    api.operations.includes(operation) &&
    (!requested || requested.has(api.id))
  ));
  const results: ExternalDeliveryApiNormalizedResult[] = [];
  const warnings: string[] = [];

  if (!selected.length) {
    warnings.push(`no-server-allowlisted-delivery-api-for-operation:${operation}`);
  }

  for (const api of selected) {
    if (api.privacyMode === 'plaintext-shipping-required' && !allowPlaintextToExternalDeliveryApi) {
      const warning = `${api.id}: skipped because plaintext external delivery API calls were not explicitly allowed`;
      warnings.push(warning);
      results.push({
        apiId: api.id,
        carrierId: api.carrierId,
        operation,
        ok: false,
        events: [],
        warnings: [warning],
        sources: [api.id, api.carrierId],
        error: warning,
      });
      continue;
    }

    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (api.apiKeyEnv && process.env[api.apiKeyEnv]) {
        headers.authorization = `Bearer ${process.env[api.apiKeyEnv]}`;
      }
      const response = await fetcher(
        api.endpoint,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(buildRequestPayload(input, api, operation, allowPlaintextToExternalDeliveryApi)),
        },
        api.timeoutMs ?? 6_000,
        0,
      );
      if (!response.ok) {
        const warning = `${api.id}: external delivery API returned HTTP ${response.status}`;
        warnings.push(warning);
        results.push({
          apiId: api.id,
          carrierId: api.carrierId,
          operation,
          ok: false,
          events: [],
          warnings: [warning],
          sources: [api.id, api.carrierId],
          error: warning,
        });
        continue;
      }
      const raw = await response.json().catch(() => ({}));
      results.push(normalizeExternalDeliveryApiResponse(api, operation, raw, allowLabelPayloadReturn));
    } catch (error) {
      const warning = `${api.id}: external delivery API failed`;
      warnings.push(warning);
      results.push({
        apiId: api.id,
        carrierId: api.carrierId,
        operation,
        ok: false,
        events: [],
        warnings: [warning],
        sources: [api.id, api.carrierId],
        error: error instanceof Error ? error.message : warning,
      });
    }
  }

  return {
    results,
    warnings: [...warnings, ...results.flatMap((result) => result.warnings)],
    sources: [...new Set(results.flatMap((result) => result.sources))],
  };
}

export function readExternalDeliveryApiOperation(value: unknown): ExternalDeliveryApiOperation | undefined {
  return operationFrom(value);
}
