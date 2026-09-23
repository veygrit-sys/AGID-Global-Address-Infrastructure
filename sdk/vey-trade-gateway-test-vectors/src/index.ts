export const TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE = '/api/trade-gateway/v1/trade/test-vectors/idempotency';
export const TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID = 'vey-trade-gateway-idempotency-v0.1';
export const TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE = 'trade-gateway-local-idempotent-intent';
export const TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS = [
  'trade_gateway_intent_created_positive',
  'trade_gateway_intent_replayed_positive',
  'trade_gateway_intent_conflict_negative',
  'trade_gateway_intent_private_material_negative',
] as const;

export type TradeGatewayIdempotencyFixtureVectorId = typeof TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS[number];

export type TradeGatewaySafeRefs = {
  tradingIntentId: string;
  operatorWorkspaceRef?: string;
  deliveryGatewayShipmentRef?: string;
  playlistCommerceIntentRef?: string;
  financeIntentRef?: string;
  listingAlias?: string;
  orderAlias?: string;
};

export type TradeGatewayIdempotencyFixtureVector = {
  vectorId: TradeGatewayIdempotencyFixtureVectorId;
  ok: boolean;
  decision: 'created' | 'replayed' | 'conflict' | 'rejected';
  httpStatus: 201 | 400 | 409;
  replayed: boolean;
  attemptCount: number;
  tradeGatewayIntentRef?: string;
  bodyFingerprintRef?: string;
  conflictRef?: string;
  safeRefs?: TradeGatewaySafeRefs;
  errors: string[];
  warnings: string[];
  localOnly: true;
  productionTraffic: false;
  privateMaterialExposed: false;
  forbiddenValueMarkersFound: [];
  nonClaims: string[];
};

export type TradeGatewayIdempotencyFixture = {
  fixtureId: typeof TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID;
  status: 'synthetic-local-fixture';
  boundaryGateId: typeof TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE;
  privacy: {
    localOnly: true;
    productionTraffic: false;
    containsRawAddress: false;
    privateMaterialExposed: false;
  };
  vectors: TradeGatewayIdempotencyFixtureVector[];
  forbiddenValueMarkers: string[];
  localOnly: true;
  productionTraffic: false;
  privateMaterialExposed: false;
  nonClaims: string[];
  validationErrors: [];
};

export type TradeGatewayTestVectorFetch = (
  url: string,
  init: {
    method: 'GET';
    headers: Record<string, string>;
  },
) => Promise<{
  status: number;
  json(): Promise<unknown>;
}>;

export type TradeGatewayTestVectorClientOptions = {
  baseUrl?: string;
  publishableKey: string;
  fetcher?: TradeGatewayTestVectorFetch;
};

export type TradeGatewayTestVectorClient = {
  readonly route: typeof TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE;
  getIdempotencyTestVectors(): Promise<TradeGatewayIdempotencyFixture>;
};

export type TradeGatewayTestVectorClientErrorCode =
  | 'unsafe_key'
  | 'http'
  | 'fixture_shape'
  | 'private_material';

export class TradeGatewayTestVectorClientError extends Error {
  readonly name = 'TradeGatewayTestVectorClientError';
  readonly code: TradeGatewayTestVectorClientErrorCode;
  readonly status?: number;
  readonly details: string[];

  constructor(
    code: TradeGatewayTestVectorClientErrorCode,
    message: string,
    options: { status?: number; details?: string[] } = {},
  ) {
    super(message);
    this.code = code;
    this.status = options.status;
    this.details = options.details ?? [];
  }
}

export const TRADE_GATEWAY_TEST_VECTOR_BLOCKED_PUBLIC_PAYLOAD_KEYS = [
  'idempotencyKey',
  'rawAddress',
  'rawAgid',
  'rawAoid',
  'recipientName',
  'recipientPhone',
  'phone',
  'email',
  'proofWitness',
  'proofSecret',
  'privateKey',
  'seedPhrase',
  'walletPrivateKey',
  'productionCredential',
  'productionWebhookSecret',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBaseUrl(baseUrl = '') {
  return baseUrl.trim().replace(/\/+$/, '');
}

function collectBlockedKeyPaths(value: unknown, path: string[] = []): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectBlockedKeyPaths(item, [...path, String(index)]));
  }

  const paths: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = [...path, key];
    if ((TRADE_GATEWAY_TEST_VECTOR_BLOCKED_PUBLIC_PAYLOAD_KEYS as readonly string[]).includes(key)) {
      paths.push(nextPath.join('.'));
    }
    paths.push(...collectBlockedKeyPaths(child, nextPath));
  }
  return paths;
}

export function buildTradeGatewayIdempotencyTestVectorUrl(baseUrl = '') {
  return `${normalizeBaseUrl(baseUrl)}${TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE}`;
}

export function validateTradeGatewayIdempotencyFixture(
  value: unknown,
): asserts value is TradeGatewayIdempotencyFixture {
  const errors: string[] = [];
  if (!isRecord(value)) {
    throw new TradeGatewayTestVectorClientError(
      'fixture_shape',
      'Trade Gateway fixture response must be an object.',
    );
  }

  if (value.fixtureId !== TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID) errors.push('fixtureId-mismatch');
  if (value.boundaryGateId !== TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE) errors.push('boundaryGateId-mismatch');
  if (value.localOnly !== true) errors.push('localOnly-not-true');
  if (value.productionTraffic !== false) errors.push('productionTraffic-not-false');
  if (value.privateMaterialExposed !== false) errors.push('privateMaterialExposed-not-false');

  const privacy = isRecord(value.privacy) ? value.privacy : {};
  if (privacy.localOnly !== true) errors.push('privacy.localOnly-not-true');
  if (privacy.productionTraffic !== false) errors.push('privacy.productionTraffic-not-false');
  if (privacy.containsRawAddress !== false) errors.push('privacy.containsRawAddress-not-false');
  if (privacy.privateMaterialExposed !== false) errors.push('privacy.privateMaterialExposed-not-false');

  const vectors = Array.isArray(value.vectors) ? value.vectors : [];
  const vectorIds = new Set(vectors.map((vector) => isRecord(vector) ? vector.vectorId : undefined));
  for (const vectorId of TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS) {
    if (!vectorIds.has(vectorId)) errors.push(`vector-missing:${vectorId}`);
  }

  for (const [index, vector] of vectors.entries()) {
    if (!isRecord(vector)) {
      errors.push(`vector-invalid:${index}`);
      continue;
    }
    if (vector.localOnly !== true) errors.push(`vector-localOnly-not-true:${index}`);
    if (vector.productionTraffic !== false) errors.push(`vector-productionTraffic-not-false:${index}`);
    if (vector.privateMaterialExposed !== false) errors.push(`vector-privateMaterialExposed-not-false:${index}`);
    if (!Array.isArray(vector.forbiddenValueMarkersFound) || vector.forbiddenValueMarkersFound.length !== 0) {
      errors.push(`vector-forbidden-markers-found:${index}`);
    }
  }

  if (errors.length > 0) {
    throw new TradeGatewayTestVectorClientError(
      'fixture_shape',
      'Trade Gateway fixture response failed local shape validation.',
      { details: errors },
    );
  }

  const blockedKeyPaths = collectBlockedKeyPaths(value);
  if (blockedKeyPaths.length > 0) {
    throw new TradeGatewayTestVectorClientError(
      'private_material',
      'Trade Gateway fixture response exposed blocked public payload keys.',
      { details: blockedKeyPaths },
    );
  }
}

export async function fetchTradeGatewayIdempotencyTestVectors(
  options: TradeGatewayTestVectorClientOptions,
): Promise<TradeGatewayIdempotencyFixture> {
  if (!options.publishableKey.startsWith('pk_test_')) {
    throw new TradeGatewayTestVectorClientError(
      'unsafe_key',
      'Trade Gateway test-vector client requires a test publishable key.',
    );
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(buildTradeGatewayIdempotencyTestVectorUrl(options.baseUrl), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${options.publishableKey}`,
    },
  });
  const body = await response.json();

  if (response.status !== 200) {
    throw new TradeGatewayTestVectorClientError(
      'http',
      `Trade Gateway test-vector request failed with status ${response.status}.`,
      { status: response.status },
    );
  }

  validateTradeGatewayIdempotencyFixture(body);
  return body;
}

export function createTradeGatewayTestVectorClient(
  options: TradeGatewayTestVectorClientOptions,
): TradeGatewayTestVectorClient {
  return {
    route: TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
    getIdempotencyTestVectors: () => fetchTradeGatewayIdempotencyTestVectors(options),
  };
}
