import { randomUUID } from 'node:crypto';

/**
 * Direct carrier-owned integrations for additional private Asian carriers.
 *
 * These carriers issue endpoint paths and credentials after a business
 * contract. Veygrit therefore requires the issued values explicitly and never
 * guesses production routes or accepts credential material from a browser.
 */
export const EXPANDED_PRIVATE_ASIA_CONNECTOR_VERSION = 'veygrit-ship-expanded-private-asia-v1' as const;

export type ExpandedPrivateAsiaCarrierId =
  | 'blue_dart'
  | 'dtdc'
  | 'gdex'
  | 'jne'
  | 'ghn'
  | 'ghtk'
  | 'grab_express'
  | 'gosend'
  | 'flash_express'
  | 'pathao_courier'
  | 'ecourier_bd'
  | 'leopards_courier'
  | 'domex_lk'
  | 'nepal_can_move';

export type ExpandedPrivateAsiaOperation =
  | 'address_validation'
  | 'rate'
  | 'shipment'
  | 'shipment_update'
  | 'label'
  | 'return'
  | 'void'
  | 'tracking'
  | 'pickup'
  | 'webhook'
  | 'document';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ExpandedPrivateAsiaAuth =
  | { type: 'none' }
  | { type: 'api_key'; headerName: string; value: string; prefix?: string }
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'header_set'; values: Readonly<Record<string, string>> };

export type ExpandedPrivateAsiaRoute = {
  method: HttpMethod;
  path: string;
  safeToRetry: boolean;
  bodyEncoding?: 'json' | 'form';
  queryPayload?: boolean;
  headers?: Readonly<Record<string, string>>;
};

export type ExpandedPrivateAsiaConnectorConfig = {
  carrier: ExpandedPrivateAsiaCarrierId;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  auth: ExpandedPrivateAsiaAuth;
  routes: Partial<Record<ExpandedPrivateAsiaOperation, ExpandedPrivateAsiaRoute>>;
  /** Contract fields added only after a server-side secret lookup. */
  credentialPayload?: Readonly<Record<string, unknown>>;
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type ExpandedPrivateAsiaDependencies = {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type ExpandedPrivateAsiaSuccess = {
  carrier: ExpandedPrivateAsiaCarrierId;
  operation: ExpandedPrivateAsiaOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export class ExpandedPrivateAsiaConnectorError extends Error {
  constructor(readonly common: {
    carrier: ExpandedPrivateAsiaCarrierId;
    operation: ExpandedPrivateAsiaOperation;
    requestId: string;
    status: number;
    retryable: boolean;
    outcomeUnknown: boolean;
    code: string;
    message: string;
    retryAfterMs?: number;
  }) {
    super(common.message);
    this.name = 'ExpandedPrivateAsiaConnectorError';
  }
}

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Official private Asia carrier configuration is missing ${name}.`);
  return value.trim();
}

function httpsUrl(value: string, name: string): string {
  const url = new URL(required(value, name));
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS.`);
  return url.toString().replace(/\/+$/, '');
}

function interpolate(path: string, source: Record<string, unknown>): { path: string; payload: Record<string, unknown> } {
  const payload = { ...source };
  return {
    path: path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key: string) => {
      const value = payload[key];
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError(`Official private Asia carrier route requires ${key}.`);
      }
      delete payload[key];
      return encodeURIComponent(String(value));
    }),
    payload,
  };
}

function parse(text: string, contentType: string | null): unknown {
  if (!text) return {};
  if (contentType?.includes('json')) {
    try { return JSON.parse(text) as unknown; } catch { return {}; }
  }
  try { return JSON.parse(text) as unknown; } catch { return { raw: text }; }
}

async function responseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (
    contentType?.includes('application/pdf')
    || contentType?.includes('application/zpl')
    || contentType?.includes('application/octet-stream')
  ) {
    return new Uint8Array(await response.arrayBuffer());
  }
  return parse(await response.text(), contentType);
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

export class ExpandedPrivateAsiaConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly timeoutMs: number;
  private readonly maxSafeRetries: number;

  constructor(
    readonly config: ExpandedPrivateAsiaConnectorConfig,
    dependencies: ExpandedPrivateAsiaDependencies = {},
  ) {
    this.baseUrl = httpsUrl(config.baseUrl, `${config.carrier} baseUrl`);
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maxSafeRetries = config.maxSafeRetries ?? 2;
  }

  execute(operation: ExpandedPrivateAsiaOperation, payload: Record<string, unknown>): Promise<ExpandedPrivateAsiaSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`${this.config.carrier} does not have an official ${operation} route configured.`);
    return this.request(operation, route, payload);
  }

  private authHeaders(): Record<string, string> {
    const auth = this.config.auth;
    switch (auth.type) {
      case 'none': return {};
      case 'api_key':
        return { [required(auth.headerName, 'API key header')]: `${auth.prefix ?? ''}${required(auth.value, 'API key')}` };
      case 'bearer': return { authorization: `Bearer ${required(auth.token, 'bearer token')}` };
      case 'basic':
        return { authorization: `Basic ${Buffer.from(`${required(auth.username, 'username')}:${required(auth.password, 'password')}`, 'utf8').toString('base64')}` };
      case 'header_set':
        return Object.fromEntries(Object.entries(auth.values).map(([name, value]) => [
          required(name, 'authentication header name'),
          required(value, `${name} authentication header value`),
        ]));
    }
  }

  private async request(
    operation: ExpandedPrivateAsiaOperation,
    route: ExpandedPrivateAsiaRoute,
    source: Record<string, unknown>,
  ): Promise<ExpandedPrivateAsiaSuccess> {
    const requestId = this.requestId();
    const resolved = interpolate(route.path, source);
    const payload = { ...this.config.credentialPayload, ...resolved.payload };
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
          accept: 'application/json, application/pdf, application/xml, text/xml',
          'x-veygrit-request-id': requestId,
          ...route.headers,
          ...this.authHeaders(),
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
        throw new ExpandedPrivateAsiaConnectorError({
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
        if (error instanceof ExpandedPrivateAsiaConnectorError) throw error;
        if (route.safeToRetry && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        const aborted = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
        throw new ExpandedPrivateAsiaConnectorError({
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
    try { return await this.fetchImpl(url, { ...init, signal: controller.signal }); }
    finally { clearTimeout(timer); }
  }
}

export type PrivateAsiaContractConfig = Pick<ExpandedPrivateAsiaConnectorConfig, 'environment' | 'auth' | 'routes' | 'credentialPayload' | 'timeoutMs' | 'maxSafeRetries'> & {
  sandboxBaseUrl: string;
  productionBaseUrl: string;
};

export type GhnConnectorConfig = Pick<ExpandedPrivateAsiaConnectorConfig, 'timeoutMs' | 'maxSafeRetries'> & {
  environment: 'sandbox' | 'production';
  token: string;
  shopId: string;
};

export type GhtkConnectorConfig = Pick<ExpandedPrivateAsiaConnectorConfig, 'timeoutMs' | 'maxSafeRetries'> & {
  environment: 'sandbox' | 'production';
  token: string;
  partnerCode: string;
  /** GHTK provides non-production endpoints during merchant onboarding. */
  sandboxBaseUrl?: string;
  productionBaseUrl?: string;
};

export type ECourierBdConnectorConfig = Pick<ExpandedPrivateAsiaConnectorConfig, 'timeoutMs' | 'maxSafeRetries'> & {
  environment: 'sandbox' | 'production';
  apiKey: string;
  apiSecret: string;
  userId: string;
};

function contractConnector(
  carrier: ExpandedPrivateAsiaCarrierId,
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return new ExpandedPrivateAsiaConnector({
    ...config,
    carrier,
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : config.productionBaseUrl,
  }, dependencies);
}

/** Blue Dart ShopTrack/PackTrack/ShipDart paths are provisioned to contract customers. */
export function createBlueDartConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('blue_dart', config, dependencies);
}

/** DTDC enterprise API endpoints are issued during ERP/WMS/e-commerce onboarding. */
export function createDtdcConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('dtdc', config, dependencies);
}

/** myGDEX uses testing/live subscriptions and a user token from its official portal. */
export function createGdexConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('gdex', config, dependencies);
}

/** JNE exposes its contract API specification through the official API Dashboard. */
export function createJneConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('jne', config, dependencies);
}

/**
 * GHN Public API v2 uses carrier-owned fixed test and production gateways.
 * Label rendering remains a two-request token/download workflow and is kept
 * outside this single-request adapter until the object-storage handoff owns it.
 */
export function createGhnConnector(
  config: GhnConnectorConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return new ExpandedPrivateAsiaConnector({
    carrier: 'ghn',
    environment: config.environment,
    baseUrl: config.environment === 'sandbox'
      ? 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2'
      : 'https://online-gateway.ghn.vn/shiip/public-api/v2',
    auth: {
      type: 'header_set',
      values: {
        Token: required(config.token, 'GHN token'),
        ShopId: required(config.shopId, 'GHN shop ID'),
      },
    },
    routes: {
      rate: { method: 'POST', path: '/shipping-order/fee', safeToRetry: true },
      shipment: { method: 'POST', path: '/shipping-order/create', safeToRetry: false },
      tracking: { method: 'POST', path: '/shipping-order/detail', safeToRetry: true },
      return: { method: 'POST', path: '/switch-status/return', safeToRetry: false },
      void: { method: 'POST', path: '/switch-status/cancel', safeToRetry: false },
    },
    timeoutMs: config.timeoutMs,
    maxSafeRetries: config.maxSafeRetries,
  }, dependencies);
}

/**
 * GHTK OpenAPI v1.5. Production routes are public; the sandbox hostname must
 * be the HTTPS value issued during merchant onboarding instead of a guess.
 */
export function createGhtkConnector(
  config: GhtkConnectorConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  const baseUrl = config.environment === 'sandbox'
    ? required(config.sandboxBaseUrl ?? '', 'GHTK sandbox base URL')
    : (config.productionBaseUrl ?? 'https://services.giaohangtietkiem.vn');
  return new ExpandedPrivateAsiaConnector({
    carrier: 'ghtk',
    environment: config.environment,
    baseUrl,
    auth: {
      type: 'header_set',
      values: {
        Token: required(config.token, 'GHTK token'),
        'X-Client-Source': required(config.partnerCode, 'GHTK partner code'),
      },
    },
    routes: {
      rate: {
        method: 'GET',
        path: '/services/shipment/fee',
        safeToRetry: true,
        queryPayload: true,
      },
      shipment: {
        method: 'POST',
        path: '/services/shipment/order/?ver=1.5',
        safeToRetry: false,
      },
      label: {
        method: 'GET',
        path: '/services/label/{trackingOrder}',
        safeToRetry: true,
        queryPayload: true,
      },
      void: {
        method: 'GET',
        path: '/services/shipment/cancel/{trackingOrder}',
        safeToRetry: false,
      },
      tracking: {
        method: 'GET',
        path: '/services/shipment/v2/{trackingOrder}',
        safeToRetry: true,
      },
    },
    timeoutMs: config.timeoutMs,
    maxSafeRetries: config.maxSafeRetries,
  }, dependencies);
}

/** GrabExpress routes and OAuth material are issued after Grab merchant approval. */
export function createGrabExpressConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('grab_express', config, dependencies);
}

/** GoSend provides staging credentials after NDA and integration onboarding. */
export function createGoSendConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('gosend', config, dependencies);
}

/** Flash Express routes remain contract-issued and country specific. */
export function createFlashExpressConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('flash_express', config, dependencies);
}

/**
 * eCourier Merchant API v5.4 publishes fixed staging/live URLs and uses
 * three server-resolved authentication headers on every request.
 */
export function createECourierBdConnector(
  config: ECourierBdConnectorConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return new ExpandedPrivateAsiaConnector({
    carrier: 'ecourier_bd',
    environment: config.environment,
    baseUrl: config.environment === 'sandbox'
      ? 'https://staging.ecourier.com.bd/api'
      : 'https://backoffice.ecourier.com.bd/api',
    auth: {
      type: 'header_set',
      values: {
        'API-KEY': required(config.apiKey, 'eCourier API key'),
        'API-SECRET': required(config.apiSecret, 'eCourier API secret'),
        'USER-ID': required(config.userId, 'eCourier user ID'),
      },
    },
    routes: {
      shipment: { method: 'POST', path: '/order-place', safeToRetry: false },
      tracking: { method: 'POST', path: '/track', safeToRetry: true },
      label: { method: 'POST', path: '/label-print', safeToRetry: true },
      void: { method: 'POST', path: '/cancel-order', safeToRetry: false },
    },
    timeoutMs: config.timeoutMs,
    maxSafeRetries: config.maxSafeRetries,
  }, dependencies);
}

/** Pathao exposes its courier developer API after merchant onboarding. */
export function createPathaoCourierConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('pathao_courier', config, dependencies);
}

/** Leopards merchant routes and API key/password are issued to account holders. */
export function createLeopardsCourierConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('leopards_courier', config, dependencies);
}

/** Domex exposes its integration documentation through registered client access. */
export function createDomexLkConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('domex_lk', config, dependencies);
}

/** Nepal Can Move issues environment-specific tokens to connected merchants. */
export function createNepalCanMoveConnector(
  config: PrivateAsiaContractConfig,
  dependencies?: ExpandedPrivateAsiaDependencies,
): ExpandedPrivateAsiaConnector {
  return contractConnector('nepal_can_move', config, dependencies);
}
