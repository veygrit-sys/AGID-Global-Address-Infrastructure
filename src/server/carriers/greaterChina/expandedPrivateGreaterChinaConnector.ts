import { randomUUID } from 'node:crypto';

/**
 * Direct, carrier-owned integrations for Greater China.
 *
 * The official portals issue API hosts, routes and signing material only after
 * merchant/ISV approval. Those values are resolved on the server from a secret
 * reference. Browser payloads can never provide credentials or carrier hosts.
 */
export const EXPANDED_PRIVATE_GREATER_CHINA_CONNECTOR_VERSION =
  'veygrit-ship-expanded-private-greater-china-v1' as const;

export type ExpandedPrivateGreaterChinaCarrierId =
  | 'zto_express'
  | 'yto_express'
  | 'sto_express'
  | 'deppon'
  | 'jd_logistics'
  | 'cainiao_express';

export type ExpandedPrivateGreaterChinaOperation =
  | 'address_validation'
  | 'rate'
  | 'shipment'
  | 'shipment_update'
  | 'label'
  | 'return'
  | 'void'
  | 'tracking'
  | 'pickup'
  | 'manifest'
  | 'pickup_point'
  | 'webhook'
  | 'document'
  | 'warehouse';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ExpandedPrivateGreaterChinaAuth =
  | { type: 'none' }
  | { type: 'api_key'; headerName: string; value: string; prefix?: string }
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'header_set'; values: Readonly<Record<string, string>> };

export type ExpandedPrivateGreaterChinaRoute = {
  method: HttpMethod;
  path: string;
  safeToRetry: boolean;
  bodyEncoding?: 'json' | 'form';
  queryPayload?: boolean;
  headers?: Readonly<Record<string, string>>;
  fixedPayload?: Readonly<Record<string, unknown>>;
  /** Contract-defined field containing the serialized business payload. */
  serializedPayloadField?: string;
};

export type GreaterChinaSigningInput = {
  carrier: ExpandedPrivateGreaterChinaCarrierId;
  operation: ExpandedPrivateGreaterChinaOperation;
  requestId: string;
  method: HttpMethod;
  path: string;
  payload: Readonly<Record<string, unknown>>;
};

export type GreaterChinaSigningResult = {
  headers?: Readonly<Record<string, string>>;
  payload?: Readonly<Record<string, unknown>>;
};

export type ExpandedPrivateGreaterChinaConnectorConfig = {
  carrier: ExpandedPrivateGreaterChinaCarrierId;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  auth: ExpandedPrivateGreaterChinaAuth;
  routes: Partial<Record<ExpandedPrivateGreaterChinaOperation, ExpandedPrivateGreaterChinaRoute>>;
  /** Contract fields added only after a server-side secret lookup. */
  credentialPayload?: Readonly<Record<string, unknown>>;
  /**
   * Carrier-specific official signing callback. It is created on the server
   * after secret resolution and is never accepted from an API request body.
   */
  signRequest?: (input: GreaterChinaSigningInput) => Promise<GreaterChinaSigningResult> | GreaterChinaSigningResult;
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type ExpandedPrivateGreaterChinaDependencies = {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type ExpandedPrivateGreaterChinaSuccess = {
  carrier: ExpandedPrivateGreaterChinaCarrierId;
  operation: ExpandedPrivateGreaterChinaOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export class ExpandedPrivateGreaterChinaConnectorError extends Error {
  constructor(readonly common: {
    carrier: ExpandedPrivateGreaterChinaCarrierId;
    operation: ExpandedPrivateGreaterChinaOperation;
    requestId: string;
    status: number;
    retryable: boolean;
    outcomeUnknown: boolean;
    code: string;
    message: string;
    retryAfterMs?: number;
  }) {
    super(common.message);
    this.name = 'ExpandedPrivateGreaterChinaConnectorError';
  }
}

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Official Greater China carrier configuration is missing ${name}.`);
  return value.trim();
}

function httpsUrl(value: string, name: string): string {
  const url = new URL(required(value, name));
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS.`);
  return url.toString().replace(/\/+$/, '');
}

function interpolate(path: string, source: Record<string, unknown>): {
  path: string;
  payload: Record<string, unknown>;
} {
  const payload = { ...source };
  return {
    path: path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key: string) => {
      const value = payload[key];
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError(`Official Greater China carrier route requires ${key}.`);
      }
      delete payload[key];
      return encodeURIComponent(String(value));
    }),
    payload,
  };
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1_000) : undefined;
}

function errorValue(payload: unknown, keys: string[], fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value) return value;
  }
  return fallback;
}

function formBody(payload: Readonly<Record<string, unknown>>): string {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    form.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  return form.toString();
}

function routePayload(
  route: ExpandedPrivateGreaterChinaRoute,
  credentials: Readonly<Record<string, unknown>>,
  source: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const businessPayload = { ...route.fixedPayload, ...source };
  if (route.serializedPayloadField) {
    return {
      ...credentials,
      [route.serializedPayloadField]: JSON.stringify(businessPayload),
    };
  }
  return { ...credentials, ...businessPayload };
}

async function responseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (
    contentType.includes('application/pdf')
    || contentType.includes('application/zpl')
    || contentType.includes('application/octet-stream')
  ) {
    return new Uint8Array(await response.arrayBuffer());
  }
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export class ExpandedPrivateGreaterChinaConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly timeoutMs: number;
  private readonly maxSafeRetries: number;

  constructor(
    readonly config: ExpandedPrivateGreaterChinaConnectorConfig,
    dependencies: ExpandedPrivateGreaterChinaDependencies = {},
  ) {
    this.baseUrl = httpsUrl(config.baseUrl, `${config.carrier} baseUrl`);
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maxSafeRetries = config.maxSafeRetries ?? 2;
  }

  execute(
    operation: ExpandedPrivateGreaterChinaOperation,
    payload: Record<string, unknown>,
  ): Promise<ExpandedPrivateGreaterChinaSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`${this.config.carrier} does not have an official ${operation} route configured.`);
    return this.request(operation, route, payload);
  }

  private authHeaders(): Record<string, string> {
    const auth = this.config.auth;
    switch (auth.type) {
      case 'none':
        return {};
      case 'api_key':
        return { [required(auth.headerName, 'API key header')]: `${auth.prefix ?? ''}${required(auth.value, 'API key')}` };
      case 'bearer':
        return { authorization: `Bearer ${required(auth.token, 'bearer token')}` };
      case 'basic':
        return {
          authorization: `Basic ${Buffer.from(
            `${required(auth.username, 'username')}:${required(auth.password, 'password')}`,
            'utf8',
          ).toString('base64')}`,
        };
      case 'header_set':
        return Object.fromEntries(Object.entries(auth.values).map(([name, value]) => [
          required(name, 'authentication header name'),
          required(value, `${name} authentication header value`),
        ]));
    }
  }

  private async request(
    operation: ExpandedPrivateGreaterChinaOperation,
    route: ExpandedPrivateGreaterChinaRoute,
    source: Record<string, unknown>,
  ): Promise<ExpandedPrivateGreaterChinaSuccess> {
    const requestId = this.requestId();
    const resolved = interpolate(route.path, source);
    let payload = routePayload(route, this.config.credentialPayload ?? {}, resolved.payload);
    const signed = await this.config.signRequest?.({
      carrier: this.config.carrier,
      operation,
      requestId,
      method: route.method,
      path: resolved.path,
      payload,
    });
    if (signed?.payload) payload = { ...signed.payload };

    let path = resolved.path;
    let body = '';
    if (route.queryPayload) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) query.set(key, String(value));
      }
      path += `${path.includes('?') ? '&' : '?'}${query}`;
    } else if (route.method !== 'GET') {
      body = route.bodyEncoding === 'form' ? formBody(payload) : JSON.stringify(payload);
    }

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let attempt = 0;
    while (true) {
      try {
        const headers: Record<string, string> = {
          accept: 'application/json, application/pdf, application/zpl, application/xml, text/xml',
          'x-veygrit-request-id': requestId,
          ...route.headers,
          ...this.authHeaders(),
          ...signed?.headers,
        };
        if (body) {
          headers['content-type'] = route.bodyEncoding === 'form'
            ? 'application/x-www-form-urlencoded'
            : 'application/json';
        }
        const response = await this.fetchWithTimeout(url, {
          method: route.method,
          headers,
          body: body || undefined,
        });
        const data = await responseData(response);
        if (response.ok) {
          return {
            carrier: this.config.carrier,
            operation,
            requestId,
            status: response.status,
            data,
            retryable: false,
            outcomeUnknown: false,
          };
        }
        const retryable = response.status === 429 || response.status >= 500;
        if (route.safeToRetry && retryable && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(retryAfter(response) ?? attempt * 250);
          continue;
        }
        throw new ExpandedPrivateGreaterChinaConnectorError({
          carrier: this.config.carrier,
          operation,
          requestId,
          status: response.status,
          retryable,
          outcomeUnknown: false,
          code: errorValue(data, ['code', 'errorCode', 'statusCode'], `CARRIER_HTTP_${response.status}`),
          message: errorValue(data, ['message', 'error', 'description'], `${this.config.carrier} rejected the request.`),
          retryAfterMs: retryAfter(response),
        });
      } catch (error) {
        if (error instanceof ExpandedPrivateGreaterChinaConnectorError) throw error;
        if (route.safeToRetry && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        const aborted = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
        throw new ExpandedPrivateGreaterChinaConnectorError({
          carrier: this.config.carrier,
          operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !route.safeToRetry,
          code: aborted ? 'CARRIER_TIMEOUT' : 'CARRIER_NETWORK',
          message: `${this.config.carrier} could not be reached.`,
        });
      }
    }
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}

export type PrivateGreaterChinaContractConfig = Pick<
  ExpandedPrivateGreaterChinaConnectorConfig,
  | 'environment'
  | 'auth'
  | 'routes'
  | 'credentialPayload'
  | 'signRequest'
  | 'timeoutMs'
  | 'maxSafeRetries'
> & {
  sandboxBaseUrl: string;
  productionBaseUrl: string;
};

function contractConnector(
  carrier: ExpandedPrivateGreaterChinaCarrierId,
  config: PrivateGreaterChinaContractConfig,
  dependencies?: ExpandedPrivateGreaterChinaDependencies,
): ExpandedPrivateGreaterChinaConnector {
  return new ExpandedPrivateGreaterChinaConnector({
    ...config,
    carrier,
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : config.productionBaseUrl,
  }, dependencies);
}

/** ZTO Open Platform: order, waybill, address intelligence, tracking and reverse pickup. */
export function createZtoExpressConnector(
  config: PrivateGreaterChinaContractConfig,
  dependencies?: ExpandedPrivateGreaterChinaDependencies,
): ExpandedPrivateGreaterChinaConnector {
  return contractConnector('zto_express', config, dependencies);
}

/** YTO Open Platform: order, label, rating, pickup-window and tracking services. */
export function createYtoExpressConnector(
  config: PrivateGreaterChinaContractConfig,
  dependencies?: ExpandedPrivateGreaterChinaDependencies,
): ExpandedPrivateGreaterChinaConnector {
  return contractConnector('yto_express', config, dependencies);
}

/** STO Open Platform: direct parcel submission, waybill and tracking services. */
export function createStoExpressConnector(
  config: PrivateGreaterChinaContractConfig,
  dependencies?: ExpandedPrivateGreaterChinaDependencies,
): ExpandedPrivateGreaterChinaConnector {
  return contractConnector('sto_express', config, dependencies);
}

/** Deppon Open Platform: direct freight/parcel order and tracking services. */
export function createDepponConnector(
  config: PrivateGreaterChinaContractConfig,
  dependencies?: ExpandedPrivateGreaterChinaDependencies,
): ExpandedPrivateGreaterChinaConnector {
  return contractConnector('deppon', config, dependencies);
}

/** JD Logistics Open Platform: contract-enabled logistics and warehouse services. */
export function createJdLogisticsConnector(
  config: PrivateGreaterChinaContractConfig,
  dependencies?: ExpandedPrivateGreaterChinaDependencies,
): ExpandedPrivateGreaterChinaConnector {
  return contractConnector('jd_logistics', config, dependencies);
}

/** Cainiao Express Open Platform: B2C/B2B/O2O shipping, labels, tracking and customs. */
export function createCainiaoExpressConnector(
  config: PrivateGreaterChinaContractConfig,
  dependencies?: ExpandedPrivateGreaterChinaDependencies,
): ExpandedPrivateGreaterChinaConnector {
  return contractConnector('cainiao_express', config, dependencies);
}
