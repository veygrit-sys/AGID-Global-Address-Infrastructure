import { createHmac, randomUUID } from 'node:crypto';

/**
 * Direct carrier-owned integrations for the Asia-Pacific expansion wave.
 *
 * Carrier URLs that are issued only after contract approval remain explicit
 * configuration. Credentials are server-only inputs resolved from a secret
 * provider and must never be accepted by a browser route.
 */
export const EXPANDED_ASIA_PACIFIC_CONNECTOR_VERSION = 'veygrit-ship-expanded-asia-pacific-v1' as const;

export type ExpandedAsiaPacificCarrierId =
  | 'lalamove'
  | 'aramex_anz'
  | 'nz_couriers'
  | 'jt_express'
  | 'yamato';

export type ExpandedAsiaPacificOperation =
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
  | 'notification';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type BodyEncoding = 'json' | 'form';

export type ExpandedAsiaPacificRoute = {
  method: HttpMethod;
  path: string;
  bodyEncoding?: BodyEncoding;
  queryPayload?: boolean;
  safeToRetry: boolean;
  headers?: Readonly<Record<string, string>>;
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
type LalamoveAuth = {
  type: 'lalamove_hmac';
  apiKey: string;
  apiSecret: string;
  market: string;
};

export type ExpandedAsiaPacificAuth = ApiKeyAuth | BearerAuth | BasicAuth | OAuthAuth | LalamoveAuth;

export type ExpandedAsiaPacificConnectorConfig = {
  carrier: ExpandedAsiaPacificCarrierId;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  auth: ExpandedAsiaPacificAuth;
  routes: Partial<Record<ExpandedAsiaPacificOperation, ExpandedAsiaPacificRoute>>;
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type ExpandedAsiaPacificDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type ExpandedAsiaPacificSuccess = {
  carrier: ExpandedAsiaPacificCarrierId;
  operation: ExpandedAsiaPacificOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export type ExpandedAsiaPacificCommonError = {
  carrier: ExpandedAsiaPacificCarrierId;
  operation: ExpandedAsiaPacificOperation | 'oauth';
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class ExpandedAsiaPacificConnectorError extends Error {
  constructor(readonly common: ExpandedAsiaPacificCommonError) {
    super(common.message);
    this.name = 'ExpandedAsiaPacificConnectorError';
  }
}

type TokenCache = { value: string; expiresAt: number };
type Runtime = Pick<ExpandedAsiaPacificConnectorConfig, 'timeoutMs' | 'maxSafeRetries'>;
export type ExpandedAsiaPacificContractRoutes = Partial<Record<ExpandedAsiaPacificOperation, ExpandedAsiaPacificRoute>>;

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Official carrier configuration is missing ${name}.`);
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

function formBody(payload: Record<string, unknown>): string {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    form.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  return form.toString();
}

function interpolatePath(path: string, source: Record<string, unknown>): { path: string; payload: Record<string, unknown> } {
  const payload = { ...source };
  const resolved = path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, name: string) => {
    const value = payload[name];
    if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError(`Official carrier route requires ${name}.`);
    delete payload[name];
    return encodeURIComponent(String(value));
  });
  return { path: resolved, payload };
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

export function createLalamoveSignature(
  timestamp: string,
  method: HttpMethod,
  path: string,
  body: string,
  apiSecret: string,
): string {
  return createHmac('sha256', required(apiSecret, 'Lalamove API secret'))
    .update(`${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`, 'utf8')
    .digest('hex');
}

export class ExpandedAsiaPacificConnector {
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
    readonly config: ExpandedAsiaPacificConnectorConfig,
    dependencies: ExpandedAsiaPacificDependencies = {},
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

  execute(operation: ExpandedAsiaPacificOperation, payload: Record<string, unknown>): Promise<ExpandedAsiaPacificSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`${this.config.carrier} does not have an official ${operation} route configured.`);
    return this.request(operation, route, payload);
  }

  private async authorizationHeaders(
    route: ExpandedAsiaPacificRoute,
    path: string,
    body: string,
    requestId: string,
  ): Promise<Record<string, string>> {
    const auth = this.config.auth;
    switch (auth.type) {
      case 'api_key': return { [required(auth.headerName, 'API key header')]: required(auth.value, 'API key') };
      case 'bearer': return { authorization: `Bearer ${required(auth.token, 'access token')}` };
      case 'basic': return { authorization: `Basic ${Buffer.from(`${required(auth.username, 'username')}:${required(auth.password, 'password')}`, 'utf8').toString('base64')}` };
      case 'oauth2_client_credentials': return { authorization: `Bearer ${await this.getAccessToken(auth)}` };
      case 'lalamove_hmac': {
        const timestamp = String(this.now());
        const signature = createLalamoveSignature(timestamp, route.method, path, body, auth.apiSecret);
        return {
          authorization: `hmac ${required(auth.apiKey, 'Lalamove API key')}:${timestamp}:${signature}`,
          market: required(auth.market, 'Lalamove market'),
          'request-id': requestId,
        };
      }
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
      if (!value) throw new ExpandedAsiaPacificConnectorError({
        carrier: this.config.carrier, operation: 'oauth', requestId, status: response.status,
        retryable: false, outcomeUnknown: false, code: 'CARRIER_OAUTH_INVALID_RESPONSE',
        message: `${this.config.carrier} did not return an access token.`,
      });
      const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3_600;
      this.token = { value, expiresAt: this.now() + expiresIn * 1_000 };
      return value;
    } catch (error) {
      if (error instanceof ExpandedAsiaPacificConnectorError) throw error;
      throw new ExpandedAsiaPacificConnectorError({
        carrier: this.config.carrier, operation: 'oauth', requestId, status: 0,
        retryable: true, outcomeUnknown: false,
        code: isAbortError(error) ? 'CARRIER_OAUTH_TIMEOUT' : 'CARRIER_OAUTH_NETWORK',
        message: `${this.config.carrier} authentication could not be completed.`,
      });
    }
  }

  private async request(
    operation: ExpandedAsiaPacificOperation,
    route: ExpandedAsiaPacificRoute,
    source: Record<string, unknown>,
  ): Promise<ExpandedAsiaPacificSuccess> {
    const requestId = this.requestId();
    const resolved = interpolatePath(route.path, source);
    let path = resolved.path;
    let body = '';
    if (route.queryPayload) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(resolved.payload)) if (value !== undefined && value !== null) query.set(key, String(value));
      path += `${path.includes('?') ? '&' : '?'}${query.toString()}`;
    } else if (route.method !== 'GET') {
      body = route.bodyEncoding === 'form' ? formBody(resolved.payload) : JSON.stringify(resolved.payload);
    }
    const url = path.startsWith('https://') ? httpsUrl(path, 'carrier route') : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let attempt = 0;
    while (true) {
      try {
        const headers: Record<string, string> = {
          accept: 'application/json, application/pdf, application/zpl',
          'x-veygrit-request-id': requestId,
          ...route.headers,
          ...await this.authorizationHeaders(route, path, body, requestId),
        };
        if (body) headers['content-type'] = route.bodyEncoding === 'form' ? 'application/x-www-form-urlencoded' : 'application/json';
        const response = await this.fetchWithTimeout(url, { method: route.method, headers, body: body || undefined });
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
        if (error instanceof ExpandedAsiaPacificConnectorError) throw error;
        if (route.safeToRetry && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new ExpandedAsiaPacificConnectorError({
          carrier: this.config.carrier, operation, requestId, status: 0,
          retryable: true, outcomeUnknown: !route.safeToRetry,
          code: isAbortError(error) ? 'CARRIER_TIMEOUT' : 'CARRIER_NETWORK',
          message: `${this.config.carrier} could not be reached.`,
        });
      }
    }
  }

  private httpError(
    operation: ExpandedAsiaPacificOperation | 'oauth',
    requestId: string,
    response: Response,
    data: unknown,
    outcomeUnknown: boolean,
  ): ExpandedAsiaPacificConnectorError {
    return new ExpandedAsiaPacificConnectorError({
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
  auth: ExpandedAsiaPacificAuth;
  routes: ExpandedAsiaPacificContractRoutes;
};

function contractConnector(
  carrier: ExpandedAsiaPacificCarrierId,
  config: ContractConnectorConfig,
  dependencies?: ExpandedAsiaPacificDependencies,
): ExpandedAsiaPacificConnector {
  return new ExpandedAsiaPacificConnector({
    ...config,
    carrier,
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : config.productionBaseUrl,
  }, dependencies);
}

export function createLalamoveConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    apiKey: string;
    apiSecret: string;
    market: string;
  },
  dependencies?: ExpandedAsiaPacificDependencies,
): ExpandedAsiaPacificConnector {
  return new ExpandedAsiaPacificConnector({
    ...config,
    carrier: 'lalamove',
    baseUrl: config.environment === 'sandbox' ? 'https://rest.sandbox.lalamove.com' : 'https://rest.lalamove.com',
    auth: { type: 'lalamove_hmac', apiKey: config.apiKey, apiSecret: config.apiSecret, market: config.market },
    routes: {
      rate: { method: 'POST', path: '/v3/quotations', safeToRetry: true },
      shipment: { method: 'POST', path: '/v3/orders', safeToRetry: false },
      tracking: { method: 'GET', path: '/v3/orders/{orderId}', safeToRetry: true },
      document: { method: 'GET', path: '/v3/orders/{orderId}', safeToRetry: true },
      webhook: { method: 'PATCH', path: '/v3/webhook', safeToRetry: false },
    },
  }, dependencies);
}

/** MyFastway/Aramex AU/NZ contract URLs and routes are supplied after approval. */
export function createAramexAnzConnector(
  config: ContractConnectorConfig,
  dependencies?: ExpandedAsiaPacificDependencies,
): ExpandedAsiaPacificConnector {
  return contractConnector('aramex_anz', config, dependencies);
}

export function createNzCouriersConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    sandboxBaseUrl: string;
    productionBaseUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    carrierName: string;
    customerId: string;
    routes?: ExpandedAsiaPacificContractRoutes;
  },
  dependencies?: ExpandedAsiaPacificDependencies,
): ExpandedAsiaPacificConnector {
  const carrierName = encodeURIComponent(required(config.carrierName, 'NZ Couriers carrierName'));
  const customerId = encodeURIComponent(required(config.customerId, 'NZ Couriers customerId'));
  const prefix = `/v1/carriers/${carrierName}/customers/${customerId}`;
  return new ExpandedAsiaPacificConnector({
    ...config,
    carrier: 'nz_couriers',
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : config.productionBaseUrl,
    auth: {
      type: 'oauth2_client_credentials',
      tokenUrl: config.tokenUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    },
    routes: {
      rate: { method: 'POST', path: `${prefix}/rates`, safeToRetry: true },
      shipment: { method: 'POST', path: `${prefix}/consignments`, safeToRetry: false },
      label: { method: 'GET', path: `${prefix}/consignments/{consignmentId}/labels`, safeToRetry: true },
      void: { method: 'POST', path: `${prefix}/consignments/{consignmentId}/cancellationrequests`, safeToRetry: false },
      pickup: { method: 'POST', path: `${prefix}/pickup-location-pickup-requests`, safeToRetry: false },
      pickup_point: { method: 'GET', path: '/v1/service-locations', queryPayload: true, safeToRetry: true },
      ...config.routes,
    },
  }, dependencies);
}

/** J&T Open Platform routes and credentials are activated separately per country. */
export function createJtExpressConnector(
  config: ContractConnectorConfig,
  dependencies?: ExpandedAsiaPacificDependencies,
): ExpandedAsiaPacificConnector {
  return contractConnector('jt_express', config, dependencies);
}

/** Yamato B2 Cloud/API routes are supplied after corporate review and approval. */
export function createYamatoConnector(
  config: ContractConnectorConfig,
  dependencies?: ExpandedAsiaPacificDependencies,
): ExpandedAsiaPacificConnector {
  return contractConnector('yamato', config, dependencies);
}
