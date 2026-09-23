import { randomUUID } from 'node:crypto';

/**
 * Direct, carrier-owned African integrations. No multi-carrier aggregator is
 * used. Contract-only RAM routes stay explicit because RAM issues them per
 * approved customer.
 */
export const EXPANDED_AFRICA_CONNECTOR_VERSION = 'veygrit-ship-expanded-africa-v1' as const;

export type ExpandedAfricaCarrierId =
  | 'collivery'
  | 'ram_couriers'
  | 'lilwa_delivery'
  | 'fez_delivery'
  | 'haulstow'
  | 'kwik_delivery'
  | 'gigl'
  | 'dodo_tanzania';
export type ExpandedAfricaOperation =
  | 'rate'
  | 'shipment'
  | 'shipment_update'
  | 'void'
  | 'label'
  | 'tracking'
  | 'document'
  | 'eta'
  | 'pickup_point'
  | 'webhook';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type BodyEncoding = 'json' | 'soap';

export type ExpandedAfricaRoute = {
  method: HttpMethod;
  path: string;
  safeToRetry: boolean;
  bodyEncoding?: BodyEncoding;
  queryPayload?: boolean;
  headers?: Readonly<Record<string, string>>;
  soapAction?: string;
  soapNamespace?: string;
};

type QueryTokenAuth = { type: 'query_token'; queryName: string; value: string };
type ApiKeyAuth = { type: 'api_key'; headerName: string; value: string };
type BearerAuth = { type: 'bearer'; token: string };
type BasicAuth = { type: 'basic'; username: string; password: string };
export type ExpandedAfricaAuth = QueryTokenAuth | ApiKeyAuth | BearerAuth | BasicAuth;

export type ExpandedAfricaConnectorConfig = {
  carrier: ExpandedAfricaCarrierId;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  auth: ExpandedAfricaAuth;
  routes: Partial<Record<ExpandedAfricaOperation, ExpandedAfricaRoute>>;
  defaultHeaders?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type ExpandedAfricaDependencies = {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type ExpandedAfricaSuccess = {
  carrier: ExpandedAfricaCarrierId;
  operation: ExpandedAfricaOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export type ExpandedAfricaCommonError = {
  carrier: ExpandedAfricaCarrierId;
  operation: ExpandedAfricaOperation;
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class ExpandedAfricaConnectorError extends Error {
  constructor(readonly common: ExpandedAfricaCommonError) {
    super(common.message);
    this.name = 'ExpandedAfricaConnectorError';
  }
}

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Official African carrier configuration is missing ${name}.`);
  return value.trim();
}

function httpsUrl(value: string, name: string): string {
  const url = new URL(required(value, name));
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS.`);
  return url.toString().replace(/\/+$/, '');
}

function parsePayload(text: string, contentType: string | null): unknown {
  if (!text) return {};
  if (contentType?.includes('json')) {
    try { return JSON.parse(text) as unknown; } catch { return {}; }
  }
  try { return JSON.parse(text) as unknown; } catch { return { raw: text }; }
}

function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toXml(name: string, value: unknown): string {
  if (Array.isArray(value)) return value.map(item => toXml(name, item)).join('');
  if (value && typeof value === 'object') {
    const children = Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => toXml(key, nested))
      .join('');
    return `<${name}>${children}</${name}>`;
  }
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function soapBody(payload: Record<string, unknown>, namespace?: string): string {
  const body = Object.entries(payload).map(([key, value]) => {
    const xml = toXml(key, value);
    return namespace ? xml.replace(`<${key}>`, `<${key} xmlns="${xmlEscape(namespace)}">`) : xml;
  }).join('');
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>${body}</soap:Body></soap:Envelope>`;
}

function interpolate(path: string, source: Record<string, unknown>): { path: string; payload: Record<string, unknown> } {
  const payload = { ...source };
  const resolved = path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key: string) => {
    const value = payload[key];
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new TypeError(`Official African carrier route requires ${key}.`);
    }
    delete payload[key];
    return encodeURIComponent(String(value));
  });
  return { path: resolved, payload };
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1_000) : undefined;
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
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

export class ExpandedAfricaConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly timeoutMs: number;
  private readonly maxSafeRetries: number;

  constructor(
    readonly config: ExpandedAfricaConnectorConfig,
    dependencies: ExpandedAfricaDependencies = {},
  ) {
    this.baseUrl = httpsUrl(config.baseUrl, `${config.carrier} baseUrl`);
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maxSafeRetries = config.maxSafeRetries ?? 2;
  }

  execute(operation: ExpandedAfricaOperation, payload: Record<string, unknown>): Promise<ExpandedAfricaSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`${this.config.carrier} does not have an official ${operation} route configured.`);
    return this.request(operation, route, payload);
  }

  private auth(path: string): { path: string; headers: Record<string, string> } {
    const auth = this.config.auth;
    switch (auth.type) {
      case 'query_token': {
        const query = new URLSearchParams({ [required(auth.queryName, 'query token name')]: required(auth.value, 'query token') });
        return { path: `${path}${path.includes('?') ? '&' : '?'}${query}`, headers: {} };
      }
      case 'api_key':
        return { path, headers: { [required(auth.headerName, 'API key header')]: required(auth.value, 'API key') } };
      case 'bearer':
        return { path, headers: { authorization: `Bearer ${required(auth.token, 'bearer token')}` } };
      case 'basic':
        return {
          path,
          headers: {
            authorization: `Basic ${Buffer.from(`${required(auth.username, 'username')}:${required(auth.password, 'password')}`, 'utf8').toString('base64')}`,
          },
        };
    }
  }

  private async request(
    operation: ExpandedAfricaOperation,
    route: ExpandedAfricaRoute,
    source: Record<string, unknown>,
  ): Promise<ExpandedAfricaSuccess> {
    const requestId = this.requestId();
    const resolved = interpolate(route.path, source);
    let path = resolved.path;
    let body = '';
    if (route.queryPayload) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(resolved.payload)) {
        if (value !== undefined && value !== null) query.set(key, String(value));
      }
      path += `${path.includes('?') ? '&' : '?'}${query}`;
    } else if (route.method !== 'GET') {
      body = route.bodyEncoding === 'soap' ? soapBody(resolved.payload, route.soapNamespace) : JSON.stringify(resolved.payload);
    }
    const authenticated = this.auth(path);
    const url = `${this.baseUrl}${authenticated.path.startsWith('/') ? authenticated.path : `/${authenticated.path}`}`;
    let attempt = 0;
    while (true) {
      try {
        const headers: Record<string, string> = {
          accept: 'application/json, application/pdf, application/zpl, text/xml',
          'x-veygrit-request-id': requestId,
          ...this.config.defaultHeaders,
          ...route.headers,
          ...authenticated.headers,
        };
        if (body) headers['content-type'] = route.bodyEncoding === 'soap' ? 'text/xml; charset=utf-8' : 'application/json';
        if (route.soapAction) headers.soapaction = route.soapAction;
        const response = await this.fetchWithTimeout(url, {
          method: route.method,
          headers,
          body: body || undefined,
        });
        const data = parsePayload(await response.text(), response.headers.get('content-type'));
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
        throw new ExpandedAfricaConnectorError({
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
        if (error instanceof ExpandedAfricaConnectorError) throw error;
        if (route.safeToRetry && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new ExpandedAfricaConnectorError({
          carrier: this.config.carrier,
          operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !route.safeToRetry,
          code: abortError(error) ? 'CARRIER_TIMEOUT' : 'CARRIER_NETWORK',
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

type Runtime = Pick<ExpandedAfricaConnectorConfig, 'timeoutMs' | 'maxSafeRetries'>;

export type AfricaCarrierContractConfig = Pick<
  ExpandedAfricaConnectorConfig,
  'environment' | 'auth' | 'routes' | 'defaultHeaders' | 'timeoutMs' | 'maxSafeRetries'
> & {
  /** Both values are issued by the carrier; Veygrit never guesses private routes. */
  sandboxBaseUrl: string;
  productionBaseUrl: string;
};

function contractConnector(
  carrier: ExpandedAfricaCarrierId,
  config: AfricaCarrierContractConfig,
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  const sandboxBaseUrl = httpsUrl(config.sandboxBaseUrl, `${carrier} sandboxBaseUrl`);
  const productionBaseUrl = httpsUrl(config.productionBaseUrl, `${carrier} productionBaseUrl`);
  return new ExpandedAfricaConnector({
    ...config,
    carrier,
    baseUrl: config.environment === 'sandbox' ? sandboxBaseUrl : productionBaseUrl,
  }, dependencies);
}

export function createColliveryConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    apiToken: string;
    sandboxBaseUrl?: string;
    appName?: string;
    appVersion?: string;
    appUrl?: string;
  },
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  const baseUrl = config.environment === 'production'
    ? 'https://api.collivery.co.za/v3'
    : httpsUrl(config.sandboxBaseUrl ?? '', 'Collivery sandboxBaseUrl');
  return new ExpandedAfricaConnector({
    ...config,
    carrier: 'collivery',
    baseUrl,
    auth: { type: 'query_token', queryName: 'api_token', value: config.apiToken },
    defaultHeaders: {
      'X-App-Name': config.appName ?? 'Veygrit Ship',
      'X-App-Version': config.appVersion ?? '0.1.0',
      'X-App-Host': 'Node.js',
      'X-App-Lang': 'TypeScript',
      'X-App-Url': config.appUrl ?? 'https://veygrit.com',
    },
    routes: {
      rate: { method: 'POST', path: '/quote', safeToRetry: true },
      shipment: { method: 'POST', path: '/waybill', safeToRetry: false },
      shipment_update: { method: 'PUT', path: '/waybill/{colliveryId}', safeToRetry: false },
      void: { method: 'PUT', path: '/status_tracking/{colliveryId}', safeToRetry: false },
      label: { method: 'GET', path: '/waybill/{colliveryId}/print_label/{printer}', safeToRetry: true },
      tracking: { method: 'GET', path: '/status_tracking/{colliveryId}', safeToRetry: true },
      document: { method: 'GET', path: '/proofs_of_delivery', queryPayload: true, safeToRetry: true },
    },
  }, dependencies);
}

export type RamOfficialConfig = Runtime & {
  environment: 'sandbox' | 'production';
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  auth: ExpandedAfricaAuth;
  routes: Partial<Record<ExpandedAfricaOperation, ExpandedAfricaRoute>>;
};

/** RAM supplies REST/SOAP routes and account fields after commercial approval. */
export function createRamCourierConnector(
  config: RamOfficialConfig,
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  return new ExpandedAfricaConnector({
    ...config,
    carrier: 'ram_couriers',
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : config.productionBaseUrl,
  }, dependencies);
}

export function createLilwaDeliveryConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    apiKey: string;
    sandboxBaseUrl?: string;
    operatorVerified: boolean;
    contractApproved: boolean;
  },
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  if (config.environment === 'production' && (!config.operatorVerified || !config.contractApproved)) {
    throw new Error('Lilwa production requires verified operator identity and an approved carrier contract.');
  }
  const baseUrl = config.environment === 'production'
    ? 'https://api.lilwadelivery.com/v2'
    : httpsUrl(config.sandboxBaseUrl ?? '', 'Lilwa sandboxBaseUrl');
  return new ExpandedAfricaConnector({
    ...config,
    carrier: 'lilwa_delivery',
    baseUrl,
    auth: { type: 'bearer', token: config.apiKey },
    routes: {
      shipment: { method: 'POST', path: '/deliveries', safeToRetry: false },
      tracking: { method: 'GET', path: '/deliveries/{orderId}/track', safeToRetry: true },
      eta: { method: 'POST', path: '/eta/calculate', safeToRetry: true },
    },
  }, dependencies);
}

/**
 * Fez Business API publishes its sandbox root and order routes. Production
 * stays explicit because the merchant portal supplies the approved live host.
 */
export function createFezDeliveryConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    accessToken: string;
    secretKey: string;
    productionBaseUrl?: string;
  },
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  const baseUrl = config.environment === 'sandbox'
    ? 'https://apisandbox.fezdelivery.co/v1'
    : httpsUrl(config.productionBaseUrl ?? '', 'Fez productionBaseUrl');
  return new ExpandedAfricaConnector({
    ...config,
    carrier: 'fez_delivery',
    baseUrl,
    auth: { type: 'bearer', token: config.accessToken },
    defaultHeaders: { 'secret-key': required(config.secretKey, 'Fez secret key') },
    routes: {
      shipment: { method: 'POST', path: '/order', safeToRetry: false },
      tracking: { method: 'GET', path: '/order/track/{orderNumber}', safeToRetry: true },
    },
  }, dependencies);
}

/** Haulstow's carrier-owned Partner Shipping API for deliveries in Accra. */
export function createHaulstowConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    apiKey: string;
    sandboxBaseUrl?: string;
  },
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  const baseUrl = config.environment === 'production'
    ? 'https://www.haulstow.co'
    : httpsUrl(config.sandboxBaseUrl ?? '', 'Haulstow sandboxBaseUrl');
  return new ExpandedAfricaConnector({
    ...config,
    carrier: 'haulstow',
    baseUrl,
    auth: { type: 'api_key', headerName: 'x-partner-key', value: config.apiKey },
    routes: {
      rate: { method: 'POST', path: '/api/partner/shipping/quote', safeToRetry: true },
      shipment: { method: 'POST', path: '/api/partner/shipping/create-order', safeToRetry: false },
      void: { method: 'POST', path: '/api/partner/shipping/cancel', safeToRetry: false },
      tracking: {
        method: 'GET',
        path: '/api/partner/shipping/status',
        queryPayload: true,
        safeToRetry: true,
      },
    },
  }, dependencies);
}

/** Kwik Nigeria supplies business-specific routes and credentials after onboarding. */
export function createKwikDeliveryConnector(
  config: AfricaCarrierContractConfig,
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  return contractConnector('kwik_delivery', config, dependencies);
}

/** GIG Logistics supplies enterprise API routes after a direct commercial agreement. */
export function createGiglConnector(
  config: AfricaCarrierContractConfig,
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  return contractConnector('gigl', config, dependencies);
}

/** Dodo supplies Tanzania merchant API routes and credentials during onboarding. */
export function createDodoTanzaniaConnector(
  config: AfricaCarrierContractConfig,
  dependencies?: ExpandedAfricaDependencies,
): ExpandedAfricaConnector {
  return contractConnector('dodo_tanzania', config, dependencies);
}
