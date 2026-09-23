import { randomUUID } from 'node:crypto';

/**
 * Direct carrier-owned Middle East and North Africa integrations.
 * Contract credentials and payload fields are injected server-side only.
 */
export const EXPANDED_MENA_CONNECTOR_VERSION = 'veygrit-ship-expanded-mena-v1' as const;

export type ExpandedMenaCarrierId =
  | 'aramex_mena'
  | 'smsa_express'
  | 'naqel_express'
  | 'emirates_post'
  | 'bosta'
  | 'mylerz';

export type ExpandedMenaOperation =
  | 'address_validation'
  | 'rate'
  | 'shipment'
  | 'shipment_update'
  | 'return'
  | 'void'
  | 'label'
  | 'tracking'
  | 'pickup'
  | 'webhook'
  | 'document';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Auth =
  | { type: 'none' }
  | { type: 'api_key'; headerName: string; value: string; prefix?: string }
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string };

export type ExpandedMenaRoute = {
  method: HttpMethod;
  path: string;
  safeToRetry: boolean;
  bodyEncoding?: 'json' | 'soap';
  queryPayload?: boolean;
  headers?: Readonly<Record<string, string>>;
  soapAction?: string;
  soapNamespace?: string;
  soapRoot?: string;
};

export type ExpandedMenaConnectorConfig = {
  carrier: ExpandedMenaCarrierId;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  auth: Auth;
  routes: Partial<Record<ExpandedMenaOperation, ExpandedMenaRoute>>;
  /** Contract credentials inserted by the secret-resolving server, never by a browser. */
  credentialPayload?: Readonly<Record<string, unknown>>;
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type ExpandedMenaDependencies = {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type ExpandedMenaSuccess = {
  carrier: ExpandedMenaCarrierId;
  operation: ExpandedMenaOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export class ExpandedMenaConnectorError extends Error {
  constructor(readonly common: {
    carrier: ExpandedMenaCarrierId;
    operation: ExpandedMenaOperation;
    requestId: string;
    status: number;
    retryable: boolean;
    outcomeUnknown: boolean;
    code: string;
    message: string;
    retryAfterMs?: number;
  }) {
    super(common.message);
    this.name = 'ExpandedMenaConnectorError';
  }
}

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Official MENA carrier configuration is missing ${name}.`);
  return value.trim();
}

function httpsUrl(value: string, name: string): string {
  const url = new URL(required(value, name));
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS.`);
  return url.toString().replace(/\/+$/, '');
}

function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function xmlNode(name: string, value: unknown): string {
  if (Array.isArray(value)) return value.map(item => xmlNode(name, item)).join('');
  if (value && typeof value === 'object') {
    return `<${name}>${Object.entries(value as Record<string, unknown>).map(([key, child]) => xmlNode(key, child)).join('')}</${name}>`;
  }
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function soapEnvelope(root: string, payload: Record<string, unknown>, namespace?: string): string {
  const attributes = namespace ? ` xmlns="${xmlEscape(namespace)}"` : '';
  const children = Object.entries(payload).map(([key, value]) => xmlNode(key, value)).join('');
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${root}${attributes}>${children}</${root}></soap:Body></soap:Envelope>`;
}

function interpolate(path: string, source: Record<string, unknown>): { path: string; payload: Record<string, unknown> } {
  const payload = { ...source };
  return {
    path: path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key: string) => {
      const value = payload[key];
      if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError(`Official MENA carrier route requires ${key}.`);
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

export class ExpandedMenaConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly timeoutMs: number;
  private readonly maxSafeRetries: number;

  constructor(
    readonly config: ExpandedMenaConnectorConfig,
    dependencies: ExpandedMenaDependencies = {},
  ) {
    this.baseUrl = httpsUrl(config.baseUrl, `${config.carrier} baseUrl`);
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maxSafeRetries = config.maxSafeRetries ?? 2;
  }

  execute(operation: ExpandedMenaOperation, payload: Record<string, unknown>): Promise<ExpandedMenaSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`${this.config.carrier} does not have an official ${operation} route configured.`);
    return this.request(operation, route, payload);
  }

  private authHeaders(): Record<string, string> {
    const auth = this.config.auth;
    switch (auth.type) {
      case 'none': return {};
      case 'api_key': return { [required(auth.headerName, 'API key header')]: `${auth.prefix ?? ''}${required(auth.value, 'API key')}` };
      case 'bearer': return { authorization: `Bearer ${required(auth.token, 'bearer token')}` };
      case 'basic': return { authorization: `Basic ${Buffer.from(`${required(auth.username, 'username')}:${required(auth.password, 'password')}`, 'utf8').toString('base64')}` };
    }
  }

  private async request(
    operation: ExpandedMenaOperation,
    route: ExpandedMenaRoute,
    source: Record<string, unknown>,
  ): Promise<ExpandedMenaSuccess> {
    const requestId = this.requestId();
    const resolved = interpolate(route.path, source);
    const payload = { ...this.config.credentialPayload, ...resolved.payload };
    let path = resolved.path;
    let body = '';
    if (route.queryPayload) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) if (value !== undefined && value !== null) query.set(key, String(value));
      path += `${path.includes('?') ? '&' : '?'}${query}`;
    } else if (route.method !== 'GET') {
      if (route.bodyEncoding === 'soap') {
        body = soapEnvelope(required(route.soapRoot ?? '', 'SOAP root'), payload, route.soapNamespace);
      } else {
        body = JSON.stringify(payload);
      }
    }
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let attempt = 0;
    while (true) {
      try {
        const headers: Record<string, string> = {
          accept: 'application/json, application/pdf, text/xml',
          'x-veygrit-request-id': requestId,
          ...route.headers,
          ...this.authHeaders(),
        };
        if (body) headers['content-type'] = route.bodyEncoding === 'soap' ? 'text/xml; charset=utf-8' : 'application/json';
        if (route.soapAction) headers.soapaction = route.soapAction;
        const response = await this.fetchWithTimeout(url, { method: route.method, headers, body: body || undefined });
        const data = parse(await response.text(), response.headers.get('content-type'));
        if (response.ok) {
          return { carrier: this.config.carrier, operation, requestId, status: response.status, data, retryable: false, outcomeUnknown: false };
        }
        const retryable = response.status === 429 || response.status >= 500;
        if (route.safeToRetry && retryable && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(retryAfter(response) ?? attempt * 250);
          continue;
        }
        throw new ExpandedMenaConnectorError({
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
        if (error instanceof ExpandedMenaConnectorError) throw error;
        if (route.safeToRetry && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        const aborted = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
        throw new ExpandedMenaConnectorError({
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

type Runtime = Pick<ExpandedMenaConnectorConfig, 'timeoutMs' | 'maxSafeRetries'>;
type ContractConfig = Runtime & {
  environment: 'sandbox' | 'production';
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  auth: Auth;
  routes: Partial<Record<ExpandedMenaOperation, ExpandedMenaRoute>>;
  credentialPayload?: Readonly<Record<string, unknown>>;
};

function contractConnector(
  carrier: ExpandedMenaCarrierId,
  config: ContractConfig,
  dependencies?: ExpandedMenaDependencies,
): ExpandedMenaConnector {
  return new ExpandedMenaConnector({
    ...config,
    carrier,
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : config.productionBaseUrl,
  }, dependencies);
}

/** Aramex WCF/SOAP hosts and operation actions are issued with the account. */
export function createAramexMenaConnector(
  config: ContractConfig,
  dependencies?: ExpandedMenaDependencies,
): ExpandedMenaConnector {
  return contractConnector('aramex_mena', config, dependencies);
}

export function createSmsaExpressConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    passKey: string;
    sandboxBaseUrl?: string;
  },
  dependencies?: ExpandedMenaDependencies,
): ExpandedMenaConnector {
  const baseUrl = config.environment === 'production'
    ? 'https://track.smsaexpress.com/SECOM'
    : httpsUrl(config.sandboxBaseUrl ?? '', 'SMSA sandboxBaseUrl');
  const service = '/SMSAwebService.asmx';
  const route = (root: string, safeToRetry: boolean): ExpandedMenaRoute => ({
    method: 'POST',
    path: service,
    bodyEncoding: 'soap',
    soapRoot: root,
    soapNamespace: 'http://track.smsaexpress.com/secom/',
    soapAction: `http://track.smsaexpress.com/secom/${root}`,
    safeToRetry,
  });
  return new ExpandedMenaConnector({
    ...config,
    carrier: 'smsa_express',
    baseUrl,
    auth: { type: 'none' },
    credentialPayload: { passKey: config.passKey },
    routes: {
      rate: route('getShipCharges', true),
      shipment: route('addShipPDF', false),
      void: route('cancelShipment', false),
      label: route('getPDF', true),
      tracking: route('getTracking', true),
    },
  }, dependencies);
}

export function createNaqelExpressConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    credentialPayload: Readonly<Record<string, unknown>>;
    apiVersion?: '9.0' | '9.1';
  },
  dependencies?: ExpandedMenaDependencies,
): ExpandedMenaConnector {
  const version = config.apiVersion ?? '9.1';
  const segment = config.environment === 'sandbox' ? 'NaqelAPIDemo/5.0' : `NaqelAPI/${version}`;
  const action = (root: string, safeToRetry: boolean): ExpandedMenaRoute => ({
    method: 'POST',
    path: `/${segment}/XMLShippingService.asmx`,
    bodyEncoding: 'soap',
    soapRoot: root,
    soapNamespace: 'http://tempuri.org/',
    soapAction: `http://tempuri.org/${root}`,
    safeToRetry,
  });
  return new ExpandedMenaConnector({
    ...config,
    carrier: 'naqel_express',
    baseUrl: 'https://infotrack.naqelexpress.com/NaqelAPIServices',
    auth: { type: 'none' },
    routes: {
      address_validation: action('ValidateShipment', true),
      shipment: action('CreateWaybill', false),
      return: action('CreateRTOWaybill', false),
      void: action('CancelWaybill', false),
      tracking: action('TraceByWaybillNo', true),
      pickup: action('CreateBooking', false),
    },
  }, dependencies);
}

export function createEmiratesPostConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    sandboxBaseUrl: string;
    productionBaseUrl: string;
    auth: Auth;
    routes?: Partial<Record<ExpandedMenaOperation, ExpandedMenaRoute>>;
  },
  dependencies?: ExpandedMenaDependencies,
): ExpandedMenaConnector {
  return new ExpandedMenaConnector({
    ...config,
    carrier: 'emirates_post',
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : config.productionBaseUrl,
    routes: {
      rate: { method: 'POST', path: '/RateCalculation', safeToRetry: true },
      shipment: { method: 'POST', path: '/CreateBooking', safeToRetry: false },
      label: { method: 'POST', path: '/PrintLabel', safeToRetry: true },
      tracking: { method: 'GET', path: '/Tracking', queryPayload: true, safeToRetry: true },
      void: { method: 'POST', path: '/Cancel', safeToRetry: false },
      ...config.routes,
    },
  }, dependencies);
}

export function createBostaConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    apiKey: string;
    sandboxBaseUrl?: string;
    routes?: Partial<Record<ExpandedMenaOperation, ExpandedMenaRoute>>;
  },
  dependencies?: ExpandedMenaDependencies,
): ExpandedMenaConnector {
  return new ExpandedMenaConnector({
    ...config,
    carrier: 'bosta',
    baseUrl: config.environment === 'production'
      ? 'https://app.bosta.co/api/v2'
      : httpsUrl(config.sandboxBaseUrl ?? '', 'Bosta sandboxBaseUrl'),
    auth: { type: 'api_key', headerName: 'Authorization', value: config.apiKey },
    routes: {
      shipment: { method: 'POST', path: '/deliveries?apiVersion=1', safeToRetry: false },
      shipment_update: { method: 'PUT', path: '/deliveries/{trackingNumber}', safeToRetry: false },
      tracking: { method: 'GET', path: '/deliveries/{trackingNumber}', safeToRetry: true },
      void: { method: 'DELETE', path: '/deliveries/{trackingNumber}', safeToRetry: false },
      pickup: { method: 'POST', path: '/pickups', safeToRetry: false },
      ...config.routes,
    },
  }, dependencies);
}

export type MylerzCountry = 'egypt' | 'tunisia' | 'morocco' | 'algeria' | 'jordan';
const MYLERZ_BASE_URLS: Readonly<Record<MylerzCountry, string>> = Object.freeze({
  egypt: 'https://integration.mylerz.net',
  tunisia: 'https://integration.tunisia.mylerz.net',
  morocco: 'https://integration.morocco.mylerz.net',
  algeria: 'https://integration.algeria.mylerz.net',
  jordan: 'https://integration.jordan.mylerz.net',
});

/** Mylerz route paths and authentication are activated per country account. */
export function createMylerzConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    country: MylerzCountry;
    sandboxBaseUrl?: string;
    auth: Auth;
    routes: Partial<Record<ExpandedMenaOperation, ExpandedMenaRoute>>;
  },
  dependencies?: ExpandedMenaDependencies,
): ExpandedMenaConnector {
  return new ExpandedMenaConnector({
    ...config,
    carrier: 'mylerz',
    baseUrl: config.environment === 'production'
      ? MYLERZ_BASE_URLS[config.country]
      : httpsUrl(config.sandboxBaseUrl ?? '', 'Mylerz sandboxBaseUrl'),
  }, dependencies);
}
