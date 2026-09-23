export type SkipshipServicePreference = 'fastest' | 'cheapest' | 'balanced';

export type SkipshipShipmentIntentCreateRequest = {
  merchantRef: string;
  recipientTokenRef: string;
  parcelProfileRef: string;
  addressValidationRef: string;
  walletConsentRef?: string;
  servicePreference?: SkipshipServicePreference;
  requestedAt?: string;
};

export type SkipshipShipmentIntentCreateResult = {
  version: 'shipment-intent-v0.1';
  intent_id: string;
  merchant_ref: string;
  recipient_token_ref: string;
  parcel_profile_ref: string;
  service_preference: SkipshipServicePreference;
  address_validation_ref: string;
  wallet_consent_ref: string;
  status: 'requires_wallet_consent' | 'ready_for_rate_quote';
  required_next_action: 'request_wallet_consent' | 'quote_rates';
  privacy: {
    contains_raw_address: false;
    production_traffic: false;
    carrier_credentials_present: false;
    log_safe: true;
  };
  blocked_material: string[];
  local_only: true;
  non_claims: string[];
};

export type SkipshipRateQuoteRequest = {
  addressAliasRef: string;
  parcelProfileRef: string;
  objective: 'fastest' | 'cheapest' | 'balanced' | 'risk-minimized';
  requestedServiceLevels: Array<'economy' | 'standard' | 'express' | 'same-day'>;
  policyRef?: string;
};

export type SkipshipRateQuoteResult = {
  rateRef: string;
  carrierAlias: string;
  serviceLevel: 'economy' | 'standard' | 'express' | 'same-day';
  objective: 'fastest' | 'cheapest' | 'balanced' | 'risk-minimized';
  etaWindow: {
    earliest: string;
    latest: string;
  };
  priceQuote: {
    amount: number;
    currency: string;
  };
  capabilityWarnings: string[];
};

export type SkipshipCarrierAllocationRequest = {
  rateRef: string;
  walletConsentRef: string;
  objective: 'fastest' | 'cheapest' | 'balanced' | 'risk-minimized';
  merchantPolicyRef: string;
};

export type SkipshipCarrierAllocationResult = {
  allocationRef: string;
  selectedCarrierAlias: string;
  objective: 'fastest' | 'cheapest' | 'balanced' | 'risk-minimized';
  selectionReasonCodes: string[];
};

export type SkipshipShipmentCreateRequest = {
  merchantRef?: string;
  recipientId: string;
  addressFormVersion?: string;
  parcelProfileRef: string;
  walletConsentRef: string;
  servicePreference?: SkipshipServicePreference;
  requestedAt?: string;
};

export type SkipshipShipmentRefs = {
  rateRef: string;
  allocationRef: string;
  labelRef: string;
  trackingReceiptRef: string;
  deliveryProofRef: string;
};

export type SkipshipShipmentCreateResult = {
  shipmentId: string;
  apiVersion: 'delivery-gateway-carrier-api-v0.1';
  developerCall: 'shipping.createShipment';
  status: 'sandbox_label_ready';
  servicePreference: SkipshipServicePreference;
  carrierAlias: 'sandbox-carrier';
  recipientId: string;
  safeRefs: SkipshipShipmentRefs;
  webhookEvents: string[];
  blockedMaterial: string[];
  localOnly: true;
  productionTraffic: false;
  rawAddressFixtures: false;
  nonClaims: string[];
  validationErrors: string[];
};

export type SkipshipTransportRequest = {
  method: 'POST';
  url: string;
  headers: Record<string, string>;
  body: SkipshipShipmentCreateRequest | SkipshipShipmentIntentCreateRequest | SkipshipRateQuoteRequest | SkipshipCarrierAllocationRequest;
};

export type SkipshipTransportResponse<T> = {
  status: number;
  body: T;
};

export type SkipshipTransport = (request: SkipshipTransportRequest) => Promise<SkipshipTransportResponse<unknown>>;

export type SkipshipFetchLike = (url: string, init: {
  method: string;
  headers: Record<string, string>;
  body: string;
}) => Promise<{
  status: number;
  json(): Promise<unknown>;
}>;

export type SkipshipClientOptions = {
  baseUrl: string;
  publishableKey: string;
  transport: SkipshipTransport;
};

export type SkipshipRequestOptions = {
  idempotencyKey?: string;
};

export type SkipshipOperation =
  | 'createShipmentIntent'
  | 'quoteRates'
  | 'createCarrierAllocation'
  | 'createShipment';

export class SkipshipApiError extends Error {
  readonly name = 'SkipshipApiError';
  readonly operation: SkipshipOperation;
  readonly status: number;
  readonly body: unknown;

  constructor(operation: SkipshipOperation, status: number, body: unknown) {
    super(`Skipship ${operation} failed with status ${status}`);
    this.operation = operation;
    this.status = status;
    this.body = body;
  }
}

export type SkipshipClient = {
  createShipmentIntent(input: SkipshipShipmentIntentCreateRequest, requestOptions?: SkipshipRequestOptions): Promise<SkipshipShipmentIntentCreateResult>;
  quoteRates(input: SkipshipRateQuoteRequest, requestOptions?: SkipshipRequestOptions): Promise<SkipshipRateQuoteResult>;
  createCarrierAllocation(input: SkipshipCarrierAllocationRequest, requestOptions?: SkipshipRequestOptions): Promise<SkipshipCarrierAllocationResult>;
  createShipment(input: SkipshipShipmentCreateRequest, requestOptions?: SkipshipRequestOptions): Promise<SkipshipShipmentCreateResult>;
};

const UNSAFE_PUBLIC_KEYS = [
  'rawAddress',
  'addressLine1',
  'addressLine2',
  'recipientName',
  'recipientPhone',
  'phone',
  'carrierApiKey',
  'carrierCredential',
  'commercialRateSecret',
  'carrierSecret',
  'rawLabelPayload',
  'proofWitness',
  'privateKey',
  'proofSecret',
] as const;

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  const record = value as Record<string, unknown>;
  return [
    ...Object.keys(record),
    ...Object.values(record).flatMap(collectKeys),
  ];
}

function assertSafeShipmentRequest(input: SkipshipShipmentCreateRequest) {
  const keys = new Set(collectKeys(input));
  const rejectedKeys = UNSAFE_PUBLIC_KEYS.filter(key => keys.has(key));
  if (rejectedKeys.length > 0) {
    throw new Error(`Unsafe Skipship createShipment payload keys: ${rejectedKeys.join(',')}`);
  }
}

function assertSafeShipmentIntentRequest(input: SkipshipShipmentIntentCreateRequest) {
  const keys = new Set(collectKeys(input));
  const rejectedKeys = UNSAFE_PUBLIC_KEYS.filter(key => keys.has(key));
  if (rejectedKeys.length > 0) {
    throw new Error(`Unsafe Skipship createShipmentIntent payload keys: ${rejectedKeys.join(',')}`);
  }
}

function assertSafeRateQuoteRequest(input: SkipshipRateQuoteRequest) {
  const keys = new Set(collectKeys(input));
  const rejectedKeys = UNSAFE_PUBLIC_KEYS.filter(key => keys.has(key));
  if (rejectedKeys.length > 0) {
    throw new Error(`Unsafe Skipship quoteRates payload keys: ${rejectedKeys.join(',')}`);
  }
}

function assertSafeCarrierAllocationRequest(input: SkipshipCarrierAllocationRequest) {
  const keys = new Set(collectKeys(input));
  const rejectedKeys = UNSAFE_PUBLIC_KEYS.filter(key => keys.has(key));
  if (rejectedKeys.length > 0) {
    throw new Error(`Unsafe Skipship createCarrierAllocation payload keys: ${rejectedKeys.join(',')}`);
  }
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

function buildHeaders(publishableKey: string, requestOptions?: SkipshipRequestOptions): Record<string, string> {
  return {
    authorization: `Bearer ${publishableKey}`,
    'content-type': 'application/json',
    ...(requestOptions?.idempotencyKey ? { 'idempotency-key': requestOptions.idempotencyKey } : {}),
  };
}

function assertOk<T>(operation: SkipshipOperation, response: SkipshipTransportResponse<unknown>): T {
  if (response.status < 200 || response.status >= 300) {
    throw new SkipshipApiError(operation, response.status, response.body);
  }
  return response.body as T;
}

export function createSkipshipFetchTransport(fetchImpl: SkipshipFetchLike = fetch): SkipshipTransport {
  return async (request: SkipshipTransportRequest): Promise<SkipshipTransportResponse<unknown>> => {
    const response = await fetchImpl(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });
    return {
      status: response.status,
      body: await response.json(),
    };
  };
}

export function createSkipshipClient(options: SkipshipClientOptions): SkipshipClient {
  return {
    async createShipmentIntent(input, requestOptions) {
      assertSafeShipmentIntentRequest(input);
      const response = await options.transport({
        method: 'POST',
        url: joinUrl(options.baseUrl, '/v1/shipment-intents'),
        headers: buildHeaders(options.publishableKey, requestOptions),
        body: input,
      });
      return assertOk<SkipshipShipmentIntentCreateResult>('createShipmentIntent', response);
    },
    async quoteRates(input, requestOptions) {
      assertSafeRateQuoteRequest(input);
      const response = await options.transport({
        method: 'POST',
        url: joinUrl(options.baseUrl, '/v1/delivery/rates'),
        headers: buildHeaders(options.publishableKey, requestOptions),
        body: input,
      });
      return assertOk<SkipshipRateQuoteResult>('quoteRates', response);
    },
    async createCarrierAllocation(input, requestOptions) {
      assertSafeCarrierAllocationRequest(input);
      const response = await options.transport({
        method: 'POST',
        url: joinUrl(options.baseUrl, '/v1/delivery/allocate'),
        headers: buildHeaders(options.publishableKey, requestOptions),
        body: input,
      });
      return assertOk<SkipshipCarrierAllocationResult>('createCarrierAllocation', response);
    },
    async createShipment(input, requestOptions) {
      assertSafeShipmentRequest(input);
      const response = await options.transport({
        method: 'POST',
        url: joinUrl(options.baseUrl, '/v1/shipments'),
        headers: buildHeaders(options.publishableKey, requestOptions),
        body: input,
      });
      return assertOk<SkipshipShipmentCreateResult>('createShipment', response);
    },
  };
}
