import { createHash, randomUUID } from 'node:crypto';

/**
 * Direct carrier-owned integrations for the European expansion wave.
 *
 * Several European carriers issue country- and contract-specific routes.
 * Those routes are therefore explicit configuration, not guessed global URLs.
 * Credentials are server-only constructor inputs resolved from Secret Manager.
 */
export const EXPANDED_EUROPE_CONNECTOR_VERSION = 'veygrit-ship-expanded-europe-v1' as const;

export type ExpandedEuropeCarrierId =
  | 'gls'
  | 'dpd'
  | 'hermes_de'
  | 'paack'
  | 'mondial_relay'
  | 'packeta'
  | 'dsv'
  | 'geodis';

export type ExpandedEuropeOperation =
  | 'rate'
  | 'shipment'
  | 'label'
  | 'return'
  | 'void'
  | 'tracking'
  | 'pickup'
  | 'pickup_point'
  | 'webhook'
  | 'document'
  | 'warehouse';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type BodyEncoding = 'json' | 'form' | 'soap';

export type ExpandedEuropeRoute = {
  method: HttpMethod;
  path: string;
  bodyEncoding?: BodyEncoding;
  queryPayload?: boolean;
  safeToRetry: boolean;
  headers?: Readonly<Record<string, string>>;
  /** SOAP method for Packeta contract operations. */
  soapMethod?: string;
  /** Ordered Mondial Relay fields used to calculate the carrier SECURITY value. */
  signatureFields?: readonly string[];
};

type ApiKeyAuth = { type: 'api_key'; headerName: string; value: string };
type BearerAuth = { type: 'bearer'; token: string };
type BasicAuth = { type: 'basic'; username: string; password: string };
type OAuthAuth = {
  type: 'oauth2_client_credentials';
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  audience?: string;
  requestStyle?: 'basic_form' | 'form_body' | 'json_body';
};
type MondialRelayAuth = { type: 'mondial_relay_md5'; enseigne: string; privateKey: string };
type PacketaAuth = { type: 'packeta_soap'; apiPassword: string };

export type ExpandedEuropeAuth =
  | ApiKeyAuth
  | BearerAuth
  | BasicAuth
  | OAuthAuth
  | MondialRelayAuth
  | PacketaAuth;

export type ExpandedEuropeConnectorConfig = {
  carrier: ExpandedEuropeCarrierId;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  auth: ExpandedEuropeAuth;
  routes: Partial<Record<ExpandedEuropeOperation, ExpandedEuropeRoute>>;
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type ExpandedEuropeDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type ExpandedEuropeSuccess = {
  carrier: ExpandedEuropeCarrierId;
  operation: ExpandedEuropeOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export type ExpandedEuropeCommonError = {
  carrier: ExpandedEuropeCarrierId;
  operation: ExpandedEuropeOperation | 'oauth';
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class ExpandedEuropeConnectorError extends Error {
  constructor(readonly common: ExpandedEuropeCommonError) {
    super(common.message);
    this.name = 'ExpandedEuropeConnectorError';
  }
}

type TokenCache = { value: string; expiresAt: number };
type Runtime = Pick<ExpandedEuropeConnectorConfig, 'timeoutMs' | 'maxSafeRetries'>;
export type ExpandedEuropeContractRoutes = Partial<Record<ExpandedEuropeOperation, ExpandedEuropeRoute>>;

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Official carrier configuration is missing ${name}.`);
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

function xmlElement(name: string, value: unknown): string {
  if (Array.isArray(value)) return value.map(item => xmlElement(name, item)).join('');
  if (value && typeof value === 'object') {
    return `<${name}>${Object.entries(value as Record<string, unknown>).map(([key, nested]) => xmlElement(key, nested)).join('')}</${name}>`;
  }
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function soapBody(method: string, payload: Record<string, unknown>, apiPassword: string): string {
  const parameters = { apiPassword, ...payload };
  return `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:svc="http://www.zasilkovna.cz/api/soap.wsdl2"><soapenv:Header/><soapenv:Body><svc:${method}>${Object.entries(parameters).map(([key, value]) => xmlElement(key, value)).join('')}</svc:${method}></soapenv:Body></soapenv:Envelope>`;
}

function parsePayload(text: string, contentType: string | null): unknown {
  if (!text) return {};
  if (contentType?.includes('json')) {
    try { return JSON.parse(text) as unknown; } catch { return {}; }
  }
  try { return JSON.parse(text) as unknown; } catch { return { raw: text }; }
}

function formBody(payload: Record<string, unknown>): string {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    form.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  return form.toString();
}

function interpolatePath(path: string, payload: Record<string, unknown>): { path: string; payload: Record<string, unknown> } {
  const body = { ...payload };
  const resolved = path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, name: string) => {
    const value = body[name];
    if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError(`Official carrier route requires ${name}.`);
    delete body[name];
    return encodeURIComponent(String(value));
  });
  return { path: resolved, payload: body };
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1_000) : undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function codeFrom(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const value = record.code ?? record.errorCode ?? record.statusCode;
  return typeof value === 'string' && value ? value : fallback;
}

function messageFrom(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const value = record.message ?? record.error ?? record.description;
  return typeof value === 'string' && value ? value : fallback;
}

export class ExpandedEuropeConnector {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxSafeRetries: number;
  private token?: TokenCache;
  private tokenRequest?: Promise<string>;

  constructor(
    readonly config: ExpandedEuropeConnectorConfig,
    dependencies: ExpandedEuropeDependencies = {},
  ) {
    this.baseUrl = httpsUrl(config.baseUrl, `${config.carrier} baseUrl`);
    if (config.auth.type === 'oauth2_client_credentials') httpsUrl(config.auth.tokenUrl, `${config.carrier} tokenUrl`);
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maxSafeRetries = config.maxSafeRetries ?? 2;
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  execute(operation: ExpandedEuropeOperation, payload: Record<string, unknown>): Promise<ExpandedEuropeSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`${this.config.carrier} does not have an official ${operation} route configured.`);
    return this.request(operation, route, payload);
  }

  private async authorizationHeaders(): Promise<Record<string, string>> {
    const auth = this.config.auth;
    switch (auth.type) {
      case 'api_key': return { [required(auth.headerName, 'API key header')]: required(auth.value, 'API key') };
      case 'bearer': return { authorization: `Bearer ${required(auth.token, 'access token')}` };
      case 'basic': return { authorization: `Basic ${Buffer.from(`${required(auth.username, 'username')}:${required(auth.password, 'password')}`, 'utf8').toString('base64')}` };
      case 'oauth2_client_credentials': return { authorization: `Bearer ${await this.getAccessToken(auth)}` };
      case 'mondial_relay_md5':
      case 'packeta_soap':
        return {};
    }
  }

  private async getAccessToken(auth: OAuthAuth): Promise<string> {
    if (this.token && this.token.expiresAt - 60_000 > this.now()) return this.token.value;
    if (!this.tokenRequest) this.tokenRequest = this.loadAccessToken(auth).finally(() => { this.tokenRequest = undefined; });
    return this.tokenRequest;
  }

  private async loadAccessToken(auth: OAuthAuth): Promise<string> {
    const requestId = this.requestId();
    const clientId = required(auth.clientId, 'OAuth clientId');
    const clientSecret = required(auth.clientSecret, 'OAuth clientSecret');
    const style = auth.requestStyle ?? 'basic_form';
    const headers: Record<string, string> = { accept: 'application/json' };
    const values: Record<string, string> = { grant_type: 'client_credentials' };
    if (auth.scope) values.scope = auth.scope;
    if (auth.audience) values.audience = auth.audience;
    let body: string;
    if (style === 'json_body') {
      headers['content-type'] = 'application/json';
      body = JSON.stringify({ ...values, client_id: clientId, client_secret: clientSecret });
    } else {
      headers['content-type'] = 'application/x-www-form-urlencoded';
      if (style === 'form_body') {
        values.client_id = clientId;
        values.client_secret = clientSecret;
      } else {
        headers.authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')}`;
      }
      body = new URLSearchParams(values).toString();
    }
    try {
      const response = await this.fetchWithTimeout(httpsUrl(auth.tokenUrl, 'OAuth tokenUrl'), { method: 'POST', headers, body });
      const data = parsePayload(await response.text(), response.headers.get('content-type')) as Record<string, unknown>;
      if (!response.ok) throw this.httpError('oauth', requestId, response, data, false);
      const value = typeof data.access_token === 'string' ? data.access_token : '';
      if (!value) throw new ExpandedEuropeConnectorError({
        carrier: this.config.carrier, operation: 'oauth', requestId, status: response.status,
        retryable: false, outcomeUnknown: false, code: 'CARRIER_OAUTH_INVALID_RESPONSE',
        message: `${this.config.carrier} did not return an access token.`,
      });
      const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3_600;
      this.token = { value, expiresAt: this.now() + expiresIn * 1_000 };
      return value;
    } catch (error) {
      if (error instanceof ExpandedEuropeConnectorError) throw error;
      throw new ExpandedEuropeConnectorError({
        carrier: this.config.carrier, operation: 'oauth', requestId, status: 0,
        retryable: true, outcomeUnknown: false,
        code: isAbortError(error) ? 'CARRIER_OAUTH_TIMEOUT' : 'CARRIER_OAUTH_NETWORK',
        message: `${this.config.carrier} authentication could not be completed.`,
      });
    }
  }

  private signedPayload(route: ExpandedEuropeRoute, source: Record<string, unknown>): Record<string, unknown> {
    if (this.config.auth.type !== 'mondial_relay_md5') return source;
    if (!route.signatureFields?.length) throw new Error('Mondial Relay route must declare the official SECURITY field order.');
    const payload = { Enseigne: required(this.config.auth.enseigne, 'Mondial Relay Enseigne'), ...source };
    const material = route.signatureFields.map(field => String(payload[field] ?? '')).join('') + required(this.config.auth.privateKey, 'Mondial Relay private key');
    return { ...payload, Security: createHash('md5').update(material, 'utf8').digest('hex').toUpperCase() };
  }

  private async request(operation: ExpandedEuropeOperation, route: ExpandedEuropeRoute, source: Record<string, unknown>): Promise<ExpandedEuropeSuccess> {
    const requestId = this.requestId();
    const resolved = interpolatePath(route.path, source);
    const payload = this.signedPayload(route, resolved.payload);
    let path = resolved.path;
    let body: string | undefined;
    if (route.queryPayload) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) if (value !== undefined && value !== null) query.set(key, String(value));
      path += `${path.includes('?') ? '&' : '?'}${query.toString()}`;
    } else if (route.method !== 'GET') {
      if (route.bodyEncoding === 'form') body = formBody(payload);
      else if (route.bodyEncoding === 'soap') {
        if (this.config.auth.type !== 'packeta_soap' || !route.soapMethod) throw new Error('Packeta SOAP route requires soapMethod and packeta_soap auth.');
        body = soapBody(route.soapMethod, payload, required(this.config.auth.apiPassword, 'Packeta API password'));
      } else body = JSON.stringify(payload);
    }
    const url = path.startsWith('https://') ? httpsUrl(path, 'carrier route') : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let attempt = 0;
    while (true) {
      try {
        const headers: Record<string, string> = {
          accept: 'application/json, application/xml, text/xml, application/pdf, application/zpl',
          'x-veygrit-request-id': requestId,
          ...route.headers,
          ...await this.authorizationHeaders(),
        };
        if (route.bodyEncoding === 'soap' && route.soapMethod) {
          headers.soapaction = `http://www.zasilkovna.cz/api/soap/${route.soapMethod}`;
        }
        if (body !== undefined) {
          headers['content-type'] = route.bodyEncoding === 'form'
            ? 'application/x-www-form-urlencoded'
            : route.bodyEncoding === 'soap' ? 'text/xml; charset=utf-8' : 'application/json';
        }
        const response = await this.fetchWithTimeout(url, { method: route.method, headers, body });
        const data = parsePayload(await response.text(), response.headers.get('content-type'));
        if (response.ok) return { carrier: this.config.carrier, operation, requestId, status: response.status, data, retryable: false, outcomeUnknown: false };
        const retryable = response.status === 429 || response.status >= 500;
        if (route.safeToRetry && retryable && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(retryAfter(response) ?? attempt * 250);
          continue;
        }
        throw this.httpError(operation, requestId, response, data, false);
      } catch (error) {
        if (error instanceof ExpandedEuropeConnectorError) throw error;
        if (route.safeToRetry && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new ExpandedEuropeConnectorError({
          carrier: this.config.carrier, operation, requestId, status: 0,
          retryable: true, outcomeUnknown: !route.safeToRetry,
          code: isAbortError(error) ? 'CARRIER_TIMEOUT' : 'CARRIER_NETWORK',
          message: `${this.config.carrier} could not be reached.`,
        });
      }
    }
  }

  private httpError(operation: ExpandedEuropeOperation | 'oauth', requestId: string, response: Response, data: unknown, outcomeUnknown: boolean): ExpandedEuropeConnectorError {
    return new ExpandedEuropeConnectorError({
      carrier: this.config.carrier, operation, requestId, status: response.status,
      retryable: response.status === 429 || response.status >= 500, outcomeUnknown,
      code: codeFrom(data, `CARRIER_HTTP_${response.status}`),
      message: messageFrom(data, `${this.config.carrier} rejected the request.`),
      retryAfterMs: retryAfter(response),
    });
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try { return await this.fetchImpl(url, { ...init, signal: controller.signal }); }
    finally { clearTimeout(timer); }
  }
}

type ContractConnectorConfig = Runtime & {
  environment: 'sandbox' | 'production';
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  auth: ExpandedEuropeAuth;
  routes: ExpandedEuropeContractRoutes;
};

function contractConnector(carrier: ExpandedEuropeCarrierId, config: ContractConnectorConfig, dependencies?: ExpandedEuropeDependencies): ExpandedEuropeConnector {
  return new ExpandedEuropeConnector({
    ...config,
    carrier,
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : config.productionBaseUrl,
  }, dependencies);
}

/** GLS API products are issued by the merchant's GLS country company. */
export function createGlsConnector(config: ContractConnectorConfig, dependencies?: ExpandedEuropeDependencies): ExpandedEuropeConnector {
  return contractConnector('gls', config, dependencies);
}

/** DPD routes and credentials are country/contract specific. */
export function createDpdConnector(config: ContractConnectorConfig, dependencies?: ExpandedEuropeDependencies): ExpandedEuropeConnector {
  return contractConnector('dpd', config, dependencies);
}

/** Hermes Germany HSI/order integration, including return and ParcelShop routes. */
export function createHermesGermanyConnector(config: ContractConnectorConfig, dependencies?: ExpandedEuropeDependencies): ExpandedEuropeConnector {
  return contractConnector('hermes_de', config, dependencies);
}

export function createPaackConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    sandboxBaseUrl: string;
    productionBaseUrl?: string;
    sandboxTokenUrl: string;
    productionTokenUrl?: string;
    sandboxLabelUrl?: string;
    productionLabelUrl?: string;
    clientId: string;
    clientSecret: string;
    routes?: ExpandedEuropeContractRoutes;
  },
  dependencies?: ExpandedEuropeDependencies,
): ExpandedEuropeConnector {
  const productionBaseUrl = config.productionBaseUrl ?? 'https://api.paack.app';
  return new ExpandedEuropeConnector({
    ...config,
    carrier: 'paack',
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : productionBaseUrl,
    auth: {
      type: 'oauth2_client_credentials',
      tokenUrl: config.environment === 'sandbox' ? config.sandboxTokenUrl : config.productionTokenUrl ?? 'https://paack-hq-production.eu.auth0.com/oauth/token',
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      requestStyle: 'json_body',
    },
    routes: {
      shipment: { method: 'POST', path: '/public/v3/orders', safeToRetry: false },
      label: {
        method: 'POST',
        path: config.environment === 'sandbox'
          ? config.sandboxLabelUrl ?? 'https://api.staging.paack.io/v3/labels'
          : config.productionLabelUrl ?? 'https://api.paack.io/v3/labels',
        safeToRetry: true,
      },
      tracking: { method: 'GET', path: '/public/v3/orders/{externalId}', safeToRetry: true },
      ...config.routes,
    },
  }, dependencies);
}

export function createMondialRelayConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    baseUrl?: string;
    enseigne: string;
    privateKey: string;
    /** Contract method/version and exact SECURITY field order are mandatory. */
    routes: ExpandedEuropeContractRoutes;
  },
  dependencies?: ExpandedEuropeDependencies,
): ExpandedEuropeConnector {
  return new ExpandedEuropeConnector({
    ...config,
    carrier: 'mondial_relay',
    baseUrl: config.baseUrl ?? 'https://api.mondialrelay.com',
    auth: { type: 'mondial_relay_md5', enseigne: config.enseigne, privateKey: config.privateKey },
    routes: config.routes,
  }, dependencies);
}

export function createPacketaConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    apiPassword: string;
    apiKey: string;
    endpoint?: string;
    routes?: ExpandedEuropeContractRoutes;
  },
  dependencies?: ExpandedEuropeDependencies,
): ExpandedEuropeConnector {
  const endpoint = config.endpoint ?? 'https://www.zasilkovna.cz/api/soap';
  const pickupFeed = `https://pickup-point.api.packeta.com/v5/${encodeURIComponent(required(config.apiKey, 'Packeta API key'))}/branch/json`;
  return new ExpandedEuropeConnector({
    ...config,
    carrier: 'packeta',
    baseUrl: endpoint,
    auth: { type: 'packeta_soap', apiPassword: config.apiPassword },
    routes: {
      shipment: { method: 'POST', path: endpoint, bodyEncoding: 'soap', soapMethod: 'createPacket', safeToRetry: false },
      label: { method: 'POST', path: endpoint, bodyEncoding: 'soap', soapMethod: 'packetsLabelsPdf', safeToRetry: true },
      pickup_point: { method: 'GET', path: pickupFeed, queryPayload: true, safeToRetry: true },
      tracking: { method: 'POST', path: endpoint, bodyEncoding: 'soap', soapMethod: 'packetTracking', safeToRetry: true },
      return: { method: 'POST', path: endpoint, bodyEncoding: 'soap', soapMethod: 'createPacketClaimWithPassword', safeToRetry: false },
      void: { method: 'POST', path: endpoint, bodyEncoding: 'soap', soapMethod: 'cancelPacket', safeToRetry: false },
      ...config.routes,
    },
  }, dependencies);
}

export function createDsvConnector(config: ContractConnectorConfig, dependencies?: ExpandedEuropeDependencies): ExpandedEuropeConnector {
  const prefix = config.environment === 'sandbox' ? '/my-demo' : '/my';
  return contractConnector('dsv', {
    ...config,
    routes: {
      shipment: { method: 'POST', path: `${prefix}/booking/v2/bookings/`, safeToRetry: false },
      label: { method: 'POST', path: `${prefix}/printing/v1/labels/`, safeToRetry: true },
      tracking: { method: 'GET', path: `${prefix}/tracking/v2/shipments/{shipmentId}`, safeToRetry: true },
      document: { method: 'GET', path: `${prefix}/download/v1/shipments/{shipmentId}`, safeToRetry: true },
      ...config.routes,
    },
  }, dependencies);
}

export function createGeodisConnector(config: ContractConnectorConfig, dependencies?: ExpandedEuropeDependencies): ExpandedEuropeConnector {
  return contractConnector('geodis', {
    ...config,
    routes: {
      warehouse: { method: 'POST', path: '/api/order/v1', safeToRetry: false },
      ...config.routes,
    },
  }, dependencies);
}
