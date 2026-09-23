export const EXTERNAL_POS_INTEGRATION_MODEL_VERSION = 'external-pos-integration-v1';

export type ExternalPosOperation =
  | 'sale-link'
  | 'pickup-ready'
  | 'handoff-complete'
  | 'receipt-export'
  | 'customer-note'
  | 'refund-release';

export type ExternalPosAdapter =
  | 'agid-pos-json-v1'
  | 'generic-json'
  | 'square-compatible'
  | 'stripe-terminal-compatible'
  | 'shopify-pos-compatible'
  | 'custom-rest-compatible';

export type ExternalPosPrivacyMode =
  | 'commitment-only'
  | 'receipt-only'
  | 'redacted-order'
  | 'plaintext-address-required';

export type ExternalPosManifest = {
  id: string;
  providerId: string;
  name: string;
  version?: string;
  adapter: ExternalPosAdapter;
  operations: ExternalPosOperation[];
  supportedCountries?: string[];
  privacyMode: ExternalPosPrivacyMode;
  endpointId?: string;
  requiresCredential?: boolean;
  supportsSandbox?: boolean;
  dataRetention?: 'none' | 'ephemeral' | 'provider-policy';
};

export type ExternalPosRuntimeConfig = ExternalPosManifest & {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  enabled?: boolean;
  timeoutMs?: number;
  apiKeyEnv?: string;
  authScheme?: 'bearer' | 'api-key' | 'none';
  apiKeyHeader?: string;
  allowInsecureLocalhost?: boolean;
  allowRawResponseReturn?: boolean;
};

export type ExternalPosNormalizedResult = {
  apiId: string;
  providerId: string;
  operation: ExternalPosOperation;
  ok: boolean;
  status?: string;
  providerReference?: string;
  orderId?: string;
  receiptId?: string;
  pickupCodeAlias?: string;
  events: Array<{
    status: string;
    observedAt?: string;
    location?: string;
  }>;
  warnings: string[];
  sources: string[];
  error?: string;
  rawResponseReturned: boolean;
  rawResponse?: unknown;
};

export type ExternalPosRunResult = {
  results: ExternalPosNormalizedResult[];
  warnings: string[];
  sources: string[];
};

type Fetcher = (url: string, options?: RequestInit, timeoutMs?: number, retries?: number) => Promise<Response>;

const VALID_OPERATIONS = new Set<ExternalPosOperation>([
  'sale-link',
  'pickup-ready',
  'handoff-complete',
  'receipt-export',
  'customer-note',
  'refund-release',
]);

const VALID_ADAPTERS = new Set<ExternalPosAdapter>([
  'agid-pos-json-v1',
  'generic-json',
  'square-compatible',
  'stripe-terminal-compatible',
  'shopify-pos-compatible',
  'custom-rest-compatible',
]);

const VALID_PRIVACY_MODES = new Set<ExternalPosPrivacyMode>([
  'commitment-only',
  'receipt-only',
  'redacted-order',
  'plaintext-address-required',
]);

const VALID_RETENTION = new Set(['none', 'ephemeral', 'provider-policy']);
const VALID_METHODS = new Set(['POST', 'PUT', 'PATCH']);

const FORBIDDEN_IMPORT_KEYS = [
  'endpoint',
  'url',
  'apiKey',
  'secret',
  'token',
  'authorization',
  'headers',
  'recipient',
  'customer',
  'customerName',
  'phone',
  'email',
  'street',
  'room',
  'unit',
  'building',
  'address',
  'addressText',
  'rawPayload',
  'proofCode',
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cleanText(value: unknown, maxLength = 160) {
  const text = String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
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

function compactPayload<T extends Record<string, unknown>>(record: T) {
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

export function normalizeExternalPosManifest(value: unknown): {
  accepted: boolean;
  manifest?: ExternalPosManifest;
  errors: string[];
  warnings: string[];
} {
  const input = asRecord(value);
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input) {
    return {
      accepted: false,
      errors: ['External POS manifest must be a JSON object'],
      warnings,
    };
  }

  const forbidden = collectForbiddenKeys(input);
  if (forbidden.length) {
    errors.push(`Imported POS manifests must not contain runtime URLs, secrets, or private customer/address payload fields: ${forbidden.join(', ')}`);
  }

  const id = cleanIdentifier(input.id);
  if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(id)) {
    errors.push('External POS API id must be 2-64 chars: lowercase letters, numbers, dot, underscore, or dash');
  }

  const providerId = cleanIdentifier(input.providerId ?? input.provider_id ?? id);
  if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(providerId)) {
    errors.push('providerId must be 2-64 chars: lowercase letters, numbers, dot, underscore, or dash');
  }

  const name = cleanText(input.name);
  if (!name) errors.push('External POS API name is required');

  const adapter = cleanText(input.adapter) as ExternalPosAdapter;
  if (!VALID_ADAPTERS.has(adapter)) {
    errors.push(`External POS adapter must be one of: ${[...VALID_ADAPTERS].join(', ')}`);
  }

  const privacyMode = cleanText(input.privacyMode ?? input.privacy_mode) as ExternalPosPrivacyMode;
  if (!VALID_PRIVACY_MODES.has(privacyMode)) {
    errors.push(`External POS privacyMode must be one of: ${[...VALID_PRIVACY_MODES].join(', ')}`);
  }

  const operations = Array.isArray(input.operations)
    ? [...new Set(input.operations.map((item) => cleanText(item) as ExternalPosOperation))]
    : [];
  const invalidOperations = operations.filter((operation) => !VALID_OPERATIONS.has(operation));
  if (!operations.length) errors.push('External POS operations are required');
  if (invalidOperations.length) errors.push(`Unsupported external POS operations: ${invalidOperations.join(', ')}`);

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

  const dataRetention = cleanText(input.dataRetention ?? input.data_retention) as ExternalPosManifest['dataRetention'];
  if (dataRetention && !VALID_RETENTION.has(dataRetention)) {
    errors.push(`dataRetention must be one of: ${[...VALID_RETENTION].join(', ')}`);
  }

  if (privacyMode === 'plaintext-address-required') {
    warnings.push('This POS API requires plaintext customer/address data and must only be enabled for trusted first-party deployments.');
  }

  const manifest: ExternalPosManifest = {
    id,
    providerId,
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

export function loadExternalPosRuntimeConfig(raw = process.env.AGID_EXTERNAL_POS_APIS_JSON): {
  apis: ExternalPosRuntimeConfig[];
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
      errors: ['AGID_EXTERNAL_POS_APIS_JSON is not valid JSON'],
      warnings,
    };
  }

  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const apis: ExternalPosRuntimeConfig[] = [];

  entries.forEach((entry, index) => {
    const record = asRecord(entry);
    if (!record) {
      errors.push(`External POS runtime config at index ${index} must be an object`);
      return;
    }

    const validation = normalizeExternalPosManifest({
      id: record.id,
      providerId: record.providerId ?? record.provider_id,
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

    const method = cleanText(record.method || 'POST').toUpperCase();
    if (!VALID_METHODS.has(method)) {
      errors.push(`${record.id ?? `index-${index}`}: method must be POST, PUT, or PATCH`);
      return;
    }

    const authScheme = cleanText(record.authScheme ?? record.auth_scheme) as ExternalPosRuntimeConfig['authScheme'];
    const normalizedAuthScheme = authScheme === 'api-key' || authScheme === 'none' ? authScheme : 'bearer';

    apis.push({
      ...validation.manifest,
      endpoint,
      method: method as ExternalPosRuntimeConfig['method'],
      enabled: record.enabled !== false,
      timeoutMs: typeof record.timeoutMs === 'number' && record.timeoutMs > 0 ? Math.min(record.timeoutMs, 15_000) : 6_000,
      apiKeyEnv: record.apiKeyEnv ? cleanText(record.apiKeyEnv, 80) : undefined,
      authScheme: normalizedAuthScheme,
      apiKeyHeader: record.apiKeyHeader ? cleanText(record.apiKeyHeader, 80) : undefined,
      allowInsecureLocalhost,
      allowRawResponseReturn: Boolean(record.allowRawResponseReturn),
    });
  });

  return { apis, errors, warnings };
}

export function publicExternalPosProfile(config: ExternalPosRuntimeConfig) {
  const {
    endpoint,
    apiKeyEnv,
    apiKeyHeader,
    allowInsecureLocalhost,
    allowRawResponseReturn,
    ...publicProfile
  } = config;
  void endpoint;
  void apiKeyEnv;
  void apiKeyHeader;
  void allowInsecureLocalhost;
  return {
    ...publicProfile,
    serverConfigured: true,
    credentialConfigured: Boolean(config.apiKeyEnv && process.env[config.apiKeyEnv]),
    rawResponseReturnEnabled: Boolean(allowRawResponseReturn),
  };
}

function operationFrom(value: unknown): ExternalPosOperation | undefined {
  const operation = cleanText(value) as ExternalPosOperation;
  return VALID_OPERATIONS.has(operation) ? operation : undefined;
}

function safeReceipt(value: unknown) {
  const receipt = asRecord(value);
  if (!receipt) return undefined;
  const record = asRecord(receipt.record) ?? {};
  const shippingLabel = asRecord(receipt.shippingLabel) ?? {};
  const ethereumPayment = asRecord(receipt.ethereumPayment) ?? {};

  return compactPayload({
    receiptId: cleanText(receipt.receiptId, 120),
    accepted: typeof receipt.accepted === 'boolean' ? receipt.accepted : undefined,
    status: cleanText(receipt.status, 40),
    channel: cleanText(receipt.channel, 40),
    terminalId: cleanText(receipt.terminalId, 120),
    operatorId: cleanText(receipt.operatorId, 120),
    purpose: cleanText(receipt.purpose, 120),
    amount: cleanNumber(receipt.amount),
    currency: cleanText(receipt.currency, 8).toUpperCase(),
    createdAt: cleanText(receipt.createdAt, 80),
    record: compactPayload({
      recordType: cleanText(record.recordType, 40),
      entityIdTail: cleanText(record.entityIdTail, 40),
      agidTail: cleanText(record.agidTail, 40),
      country: cleanCountryCode(record.country),
      city: cleanText(record.city, 120),
      postcode: cleanText(record.postcode, 40),
      label: cleanText(record.label, 120),
      rawPayloadStored: false,
    }),
    shippingLabel: compactPayload({
      waybillAlias: cleanText(shippingLabel.waybillId, 120),
      waybillCommitment: cleanText(shippingLabel.waybillCommitment, 180),
      addressReferenceCommitment: cleanText(shippingLabel.addressReferenceCommitment, 180),
      nullifier: cleanText(shippingLabel.nullifier, 120),
      riskLevel: cleanText(shippingLabel.riskLevel, 40),
      scanRole: cleanText(shippingLabel.scanRole, 40),
      proofLevel: cleanText(shippingLabel.proofLevel, 80),
      addressVerified: typeof shippingLabel.addressVerified === 'boolean' ? shippingLabel.addressVerified : undefined,
      addressAccuracyStatus: cleanText(shippingLabel.addressAccuracyStatus, 40),
      addressAccuracyDecision: cleanText(shippingLabel.addressAccuracyDecision, 40),
      recipientControlVerified: typeof shippingLabel.recipientControlVerified === 'boolean' ? shippingLabel.recipientControlVerified : undefined,
      packageReceiptVerified: typeof shippingLabel.packageReceiptVerified === 'boolean' ? shippingLabel.packageReceiptVerified : undefined,
      terminalEvidenceSignature: cleanText(shippingLabel.terminalEvidenceSignature, 180),
      terminalSignedAt: cleanText(shippingLabel.terminalSignedAt, 80),
      storePosId: cleanText(shippingLabel.storePosId, 120),
    }),
    ethereumPayment: compactPayload({
      paymentKind: cleanText(ethereumPayment.paymentKind, 80),
      settlementMode: cleanText(ethereumPayment.settlementMode, 80),
      status: cleanText(ethereumPayment.status, 80),
      tokenSymbol: cleanText(ethereumPayment.tokenSymbol, 20),
      networkId: cleanText(ethereumPayment.networkId, 80),
    }),
  });
}

function safeOrder(value: unknown, input: Record<string, unknown>) {
  const order = asRecord(value) ?? {};
  return compactPayload({
    orderId: cleanText(input.orderId ?? order.orderId ?? order.id, 120),
    orderAlias: cleanText(input.orderAlias ?? order.orderAlias ?? order.alias, 120),
    locationId: cleanText(input.locationId ?? order.locationId ?? order.storeId, 120),
    storeId: cleanText(input.storeId ?? order.storeId, 120),
    registerId: cleanText(input.registerId ?? order.registerId, 120),
    amount: cleanNumber(input.amount ?? order.amount ?? order.total),
    currency: cleanText(input.currency ?? order.currency, 8).toUpperCase(),
    status: cleanText(input.status ?? order.status, 80),
    lineItemCount: cleanNumber(input.lineItemCount ?? order.lineItemCount),
    pickupCodeAlias: cleanText(input.pickupCodeAlias ?? order.pickupCodeAlias, 120),
    pickupWindowStart: cleanText(input.pickupWindowStart ?? order.pickupWindowStart, 80),
    pickupWindowEnd: cleanText(input.pickupWindowEnd ?? order.pickupWindowEnd, 80),
  });
}

function redactedAddressReference(value: unknown, receiptPayload: Record<string, unknown> | undefined) {
  const address = asRecord(value) ?? {};
  const record = asRecord(receiptPayload?.record);
  const shippingLabel = asRecord(receiptPayload?.shippingLabel);
  return compactPayload({
    countryCode: cleanCountryCode(address.countryCode ?? address.country_code ?? address.cc ?? record?.country),
    city: cleanText(address.city ?? address.town ?? address.locality ?? record?.city, 120),
    postcode: cleanText(address.postcode ?? address.postalCode ?? address.postal_code ?? address.zip ?? record?.postcode, 40),
    addressReferenceCommitment: cleanText(
      address.addressReferenceCommitment ??
      address.referenceCommitment ??
      shippingLabel?.addressReferenceCommitment,
      180,
    ),
    agidTail: cleanText(address.agidTail ?? record?.agidTail, 40),
  });
}

function buildExternalPosRequestPayload(
  input: Record<string, unknown>,
  api: ExternalPosRuntimeConfig,
  operation: ExternalPosOperation,
  allowPlaintextToExternalPos: boolean,
) {
  const receiptPayload = safeReceipt(input.receipt ?? input.posReceipt);
  const orderPayload = safeOrder(input.order, input);
  const payload: Record<string, unknown> = compactPayload({
    operation,
    providerId: api.providerId,
    adapter: api.adapter,
    mode: api.privacyMode,
    sourceSystem: 'AGID',
    idempotencyKey: cleanText(
      input.idempotencyKey ??
      input.requestId ??
      (receiptPayload?.receiptId ? `pos-${receiptPayload.receiptId}` : undefined),
      160,
    ),
    receipt: api.privacyMode === 'commitment-only'
      ? compactPayload({
        receiptId: receiptPayload?.receiptId,
        status: receiptPayload?.status,
        accepted: receiptPayload?.accepted,
        terminalId: receiptPayload?.terminalId,
      })
      : receiptPayload,
    order: orderPayload,
    addressReference: api.privacyMode === 'redacted-order' || api.privacyMode === 'receipt-only'
      ? redactedAddressReference(input.address ?? input.addressReference, receiptPayload)
      : undefined,
    notes: cleanText(input.notes, 500),
  });

  if (api.privacyMode === 'plaintext-address-required' && allowPlaintextToExternalPos) {
    payload.address = input.address;
    payload.customer = input.customer;
    payload.recipient = input.recipient;
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
    }) as ExternalPosNormalizedResult['events'][number];
  }).filter((event) => event.status);
}

export function normalizeExternalPosResponse(
  api: Pick<ExternalPosRuntimeConfig, 'id' | 'providerId' | 'allowRawResponseReturn'>,
  operation: ExternalPosOperation,
  raw: unknown,
  allowRawResponseReturn = false,
): ExternalPosNormalizedResult {
  const record = asRecord(raw) ?? {};
  const data = asRecord(record.data) ?? record;
  const canReturnRawResponse = Boolean(api.allowRawResponseReturn && allowRawResponseReturn);

  return {
    apiId: api.id,
    providerId: api.providerId,
    operation,
    ok: record.ok !== false && data.ok !== false,
    status: cleanText(data.status ?? record.status, 80) || undefined,
    providerReference: cleanText(data.providerReference ?? data.provider_reference ?? data.reference ?? data.id, 120) || undefined,
    orderId: cleanText(data.orderId ?? data.order_id, 120) || undefined,
    receiptId: cleanText(data.receiptId ?? data.receipt_id, 120) || undefined,
    pickupCodeAlias: cleanText(data.pickupCodeAlias ?? data.pickup_code_alias, 120) || undefined,
    events: normalizeEvents(data.events ?? data.posEvents ?? data.pos_events),
    warnings: [
      ...(Array.isArray(record.warnings) ? record.warnings.map((item) => cleanText(item, 240)).filter(Boolean) : []),
      ...(Array.isArray(data.warnings) ? data.warnings.map((item) => cleanText(item, 240)).filter(Boolean) : []),
      ...(!canReturnRawResponse && Object.keys(record).length ? ['raw-pos-response-suppressed'] : []),
    ],
    sources: [...new Set([api.id, api.providerId])],
    error: cleanText(record.error ?? data.error, 240) || undefined,
    rawResponseReturned: canReturnRawResponse,
    rawResponse: canReturnRawResponse ? raw : undefined,
  };
}

export async function runExternalPosOperation({
  apis,
  requestedApiIds,
  operation,
  input,
  fetcher,
  allowPlaintextToExternalPos = false,
  allowRawResponseReturn = false,
}: {
  apis: ExternalPosRuntimeConfig[];
  requestedApiIds?: string[];
  operation: ExternalPosOperation;
  input: Record<string, unknown>;
  fetcher: Fetcher;
  allowPlaintextToExternalPos?: boolean;
  allowRawResponseReturn?: boolean;
}): Promise<ExternalPosRunResult> {
  const requested = requestedApiIds?.length ? new Set(requestedApiIds.map(cleanIdentifier)) : null;
  const selected = apis.filter((api) => (
    api.enabled !== false &&
    api.operations.includes(operation) &&
    (!requested || requested.has(api.id))
  ));
  const results: ExternalPosNormalizedResult[] = [];
  const warnings: string[] = [];

  if (!selected.length) {
    warnings.push(`no-server-allowlisted-pos-api-for-operation:${operation}`);
  }

  for (const api of selected) {
    if (api.privacyMode === 'plaintext-address-required' && !allowPlaintextToExternalPos) {
      const warning = `${api.id}: skipped because plaintext external POS calls were not explicitly allowed`;
      warnings.push(warning);
      results.push({
        apiId: api.id,
        providerId: api.providerId,
        operation,
        ok: false,
        events: [],
        warnings: [warning],
        sources: [api.id, api.providerId],
        error: warning,
        rawResponseReturned: false,
      });
      continue;
    }

    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (api.apiKeyEnv && process.env[api.apiKeyEnv]) {
        if (api.authScheme === 'api-key') {
          headers[api.apiKeyHeader || 'x-api-key'] = process.env[api.apiKeyEnv]!;
        } else if (api.authScheme !== 'none') {
          headers.authorization = `Bearer ${process.env[api.apiKeyEnv]}`;
        }
      }
      const response = await fetcher(
        api.endpoint,
        {
          method: api.method ?? 'POST',
          headers,
          body: JSON.stringify(buildExternalPosRequestPayload(input, api, operation, allowPlaintextToExternalPos)),
        },
        api.timeoutMs ?? 6_000,
        0,
      );
      if (!response.ok) {
        const warning = `${api.id}: external POS API returned HTTP ${response.status}`;
        warnings.push(warning);
        results.push({
          apiId: api.id,
          providerId: api.providerId,
          operation,
          ok: false,
          events: [],
          warnings: [warning],
          sources: [api.id, api.providerId],
          error: warning,
          rawResponseReturned: false,
        });
        continue;
      }
      const raw = await response.json().catch(() => ({}));
      results.push(normalizeExternalPosResponse(api, operation, raw, allowRawResponseReturn));
    } catch (error) {
      const warning = `${api.id}: external POS API failed`;
      warnings.push(warning);
      results.push({
        apiId: api.id,
        providerId: api.providerId,
        operation,
        ok: false,
        events: [],
        warnings: [warning],
        sources: [api.id, api.providerId],
        error: error instanceof Error ? error.message : warning,
        rawResponseReturned: false,
      });
    }
  }

  return {
    results,
    warnings: [...warnings, ...results.flatMap((result) => result.warnings)],
    sources: [...new Set(results.flatMap((result) => result.sources))],
  };
}

export function readExternalPosOperation(value: unknown): ExternalPosOperation | undefined {
  return operationFrom(value);
}
