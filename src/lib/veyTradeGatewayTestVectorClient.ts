import {
  VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS,
  type VeyTradeGatewayIdempotencyFixture,
} from './veyTrading';

export const TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE = '/api/trade-gateway/v1/trade/test-vectors/idempotency';

export type VeyTradeGatewayTestVectorFetch = (
  url: string,
  init: {
    method: 'GET';
    headers: Record<string, string>;
  },
) => Promise<{
  status: number;
  json(): Promise<unknown>;
}>;

export type VeyTradeGatewayTestVectorClientOptions = {
  baseUrl?: string;
  publishableKey: string;
  fetcher?: VeyTradeGatewayTestVectorFetch;
};

export type VeyTradeGatewayTestVectorClientErrorCode =
  | 'unsafe_key'
  | 'http'
  | 'fixture_shape'
  | 'private_material';

export class VeyTradeGatewayTestVectorClientError extends Error {
  readonly name = 'VeyTradeGatewayTestVectorClientError';
  readonly code: VeyTradeGatewayTestVectorClientErrorCode;
  readonly status?: number;
  readonly details: string[];

  constructor(
    code: VeyTradeGatewayTestVectorClientErrorCode,
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

export function validateVeyTradeGatewayIdempotencyFixture(
  value: unknown,
): asserts value is VeyTradeGatewayIdempotencyFixture {
  const errors: string[] = [];
  if (!isRecord(value)) {
    throw new VeyTradeGatewayTestVectorClientError('fixture_shape', 'Trade Gateway fixture response must be an object.');
  }

  if (value.fixtureId !== VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID) errors.push('fixtureId-mismatch');
  if (value.boundaryGateId !== VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE) errors.push('boundaryGateId-mismatch');
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
  for (const vectorId of VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS) {
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
    throw new VeyTradeGatewayTestVectorClientError(
      'fixture_shape',
      'Trade Gateway fixture response failed local shape validation.',
      { details: errors },
    );
  }

  const blockedKeyPaths = collectBlockedKeyPaths(value);
  if (blockedKeyPaths.length > 0) {
    throw new VeyTradeGatewayTestVectorClientError(
      'private_material',
      'Trade Gateway fixture response exposed blocked public payload keys.',
      { details: blockedKeyPaths },
    );
  }
}

export function buildVeyTradeGatewayIdempotencyTestVectorUrl(baseUrl = '') {
  return `${normalizeBaseUrl(baseUrl)}${TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE}`;
}

export async function fetchVeyTradeGatewayIdempotencyTestVectors(
  options: VeyTradeGatewayTestVectorClientOptions,
): Promise<VeyTradeGatewayIdempotencyFixture> {
  if (!options.publishableKey.startsWith('pk_test_')) {
    throw new VeyTradeGatewayTestVectorClientError(
      'unsafe_key',
      'Trade Gateway test-vector client requires a test publishable key.',
    );
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(buildVeyTradeGatewayIdempotencyTestVectorUrl(options.baseUrl), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${options.publishableKey}`,
    },
  });
  const body = await response.json();

  if (response.status !== 200) {
    throw new VeyTradeGatewayTestVectorClientError(
      'http',
      `Trade Gateway test-vector request failed with status ${response.status}.`,
      { status: response.status },
    );
  }

  validateVeyTradeGatewayIdempotencyFixture(body);
  return body;
}
