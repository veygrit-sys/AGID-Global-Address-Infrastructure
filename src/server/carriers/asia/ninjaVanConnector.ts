import { randomUUID } from 'node:crypto';

export const NINJA_VAN_CONNECTOR_VERSION = 'veygrit-ship-ninja-van-order-v4.2-v0.1' as const;

export type NinjaVanCountryCode = 'SG' | 'MY' | 'TH' | 'ID' | 'VN' | 'PH' | 'MM';
export type NinjaVanOperation = 'shipment' | 'void' | 'rate' | 'label' | 'pickup_point' | 'webhook';
export type NinjaVanExtensionRoute = {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  safeToRetry: boolean;
};
export type NinjaVanConnectorConfig = {
  environment: 'sandbox' | 'production';
  countryCode: NinjaVanCountryCode;
  clientId: string;
  clientSecret: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
  /** Contract-enabled Order/Waybill/PUDO routes. Public access varies by country and account. */
  routes?: Partial<Record<'rate' | 'label' | 'pickup_point' | 'webhook', NinjaVanExtensionRoute>>;
};
export type NinjaVanConnectorDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};
export type NinjaVanSuccess = {
  carrier: 'ninja_van';
  operation: NinjaVanOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};
export type NinjaVanCommonError = {
  carrier: 'ninja_van';
  operation: NinjaVanOperation | 'oauth' | 'logout';
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class NinjaVanConnectorError extends Error {
  constructor(readonly common: NinjaVanCommonError) {
    super(common.message);
    this.name = 'NinjaVanConnectorError';
  }
}

type Token = { value: string; expiresAt: number };
type RequestSpec = {
  operation: NinjaVanOperation;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  safeToRetry: boolean;
};

const SANDBOX_URL = 'https://api-sandbox.ninjavan.co';
const PRODUCTION_URL = 'https://api.ninjavan.co';
const TOKEN_REFRESH_EARLY_MS = 5 * 60 * 1000;

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Ninja Van configuration is missing ${name}.`);
  return value.trim();
}

function parseJson(text: string): unknown {
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return {}; }
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
}

function errorDetails(payload: unknown, fallbackCode: string): { code: string; message: string } {
  if (!payload || typeof payload !== 'object') {
    return { code: fallbackCode, message: 'Ninja Van rejected the request.' };
  }
  const record = payload as Record<string, unknown>;
  return {
    code: typeof record.code === 'string'
      ? record.code
      : typeof record.error === 'string'
        ? record.error
        : fallbackCode,
    message: typeof record.message === 'string'
      ? record.message
      : typeof record.error_description === 'string'
        ? record.error_description
        : 'Ninja Van rejected the request.',
  };
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export class NinjaVanConnector {
  private readonly baseUrl: string;
  private readonly countryCode: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly config: Required<NinjaVanConnectorConfig>;
  private token?: Token;
  private tokenRequest?: Promise<string>;

  constructor(config: NinjaVanConnectorConfig, dependencies: NinjaVanConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      countryCode: config.countryCode,
      clientId: required(config.clientId, 'clientId'),
      clientSecret: required(config.clientSecret, 'clientSecret'),
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
      routes: config.routes ?? {},
    };
    this.baseUrl = config.environment === 'sandbox' ? SANDBOX_URL : PRODUCTION_URL;
    // Ninja Van's sandbox is hosted under SG even when test addresses are localized.
    this.countryCode = config.environment === 'sandbox' ? 'sg' : config.countryCode.toLowerCase();
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  createOrder(payload: Record<string, unknown>): Promise<NinjaVanSuccess> {
    return this.request({
      operation: 'shipment',
      method: 'POST',
      path: `/${this.countryCode}/plugins/4.2/orders`,
      body: payload,
      safeToRetry: false,
    });
  }

  cancelOrder(trackingNumber: string): Promise<NinjaVanSuccess> {
    if (!trackingNumber.trim()) throw new TypeError('Ninja Van trackingNumber is required.');
    return this.request({
      operation: 'void',
      method: 'DELETE',
      path: `/${this.countryCode}/2.2/orders/${encodeURIComponent(trackingNumber.trim())}`,
      safeToRetry: false,
    });
  }

  getRates(payload: Record<string, unknown>): Promise<NinjaVanSuccess> {
    return this.extensionRequest('rate', payload);
  }

  getWaybill(payload: Record<string, unknown>): Promise<NinjaVanSuccess> {
    return this.extensionRequest('label', payload);
  }

  listPickupPoints(payload: Record<string, unknown>): Promise<NinjaVanSuccess> {
    return this.extensionRequest('pickup_point', payload);
  }

  configureWebhook(payload: Record<string, unknown>): Promise<NinjaVanSuccess> {
    return this.extensionRequest('webhook', payload);
  }

  async logout(): Promise<void> {
    const requestId = this.requestId();
    const token = await this.getToken();
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/global/aaa/1.0/logout`, {
        method: 'POST',
        headers: { accept: 'application/json', authorization: `Bearer ${token}`, 'x-request-id': requestId },
      });
      if (!response.ok) {
        const payload = parseJson(await response.text());
        const upstream = errorDetails(payload, `NINJA_VAN_LOGOUT_HTTP_${response.status}`);
        throw new NinjaVanConnectorError({
          carrier: 'ninja_van',
          operation: 'logout',
          requestId,
          status: response.status,
          retryable: response.status === 429 || response.status >= 500,
          outcomeUnknown: false,
          code: upstream.code,
          message: upstream.message,
          retryAfterMs: retryAfter(response),
        });
      }
      this.token = undefined;
    } catch (error) {
      if (error instanceof NinjaVanConnectorError) throw error;
      throw new NinjaVanConnectorError({
        carrier: 'ninja_van',
        operation: 'logout',
        requestId,
        status: 0,
        retryable: true,
        outcomeUnknown: true,
        code: abortError(error) ? 'NINJA_VAN_LOGOUT_TIMEOUT' : 'NINJA_VAN_LOGOUT_NETWORK',
        message: 'Ninja Van logout could not be confirmed.',
      });
    }
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt - TOKEN_REFRESH_EARLY_MS > this.now()) return this.token.value;
    if (!this.tokenRequest) {
      this.tokenRequest = this.loadToken().finally(() => { this.tokenRequest = undefined; });
    }
    return this.tokenRequest;
  }

  private async loadToken(): Promise<string> {
    const requestId = this.requestId();
    let response: Response;
    try {
      response = await this.fetchWithTimeout(`${this.baseUrl}/${this.countryCode}/2.0/oauth/access_token`, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'x-request-id': requestId },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
        }),
      });
    } catch (error) {
      throw new NinjaVanConnectorError({
        carrier: 'ninja_van',
        operation: 'oauth',
        requestId,
        status: 0,
        retryable: true,
        outcomeUnknown: false,
        code: abortError(error) ? 'NINJA_VAN_OAUTH_TIMEOUT' : 'NINJA_VAN_OAUTH_NETWORK',
        message: 'Ninja Van authentication could not be completed.',
      });
    }
    const payload = parseJson(await response.text()) as Record<string, unknown>;
    if (!response.ok) {
      const upstream = errorDetails(payload, 'NINJA_VAN_OAUTH_FAILED');
      throw new NinjaVanConnectorError({
        carrier: 'ninja_van',
        operation: 'oauth',
        requestId,
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
        outcomeUnknown: false,
        code: upstream.code,
        message: upstream.message,
        retryAfterMs: retryAfter(response),
      });
    }
    const value = typeof payload.access_token === 'string' ? payload.access_token : '';
    if (!value) {
      throw new NinjaVanConnectorError({
        carrier: 'ninja_van',
        operation: 'oauth',
        requestId,
        status: response.status,
        retryable: false,
        outcomeUnknown: false,
        code: 'NINJA_VAN_OAUTH_INVALID_RESPONSE',
        message: 'Ninja Van did not return an access token.',
      });
    }
    const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : 3600;
    this.token = { value, expiresAt: this.now() + expiresIn * 1000 };
    return value;
  }

  private extensionRequest(
    operation: 'rate' | 'label' | 'pickup_point' | 'webhook',
    payload: Record<string, unknown>,
  ): Promise<NinjaVanSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`Ninja Van ${operation} route is not enabled for this country contract.`);
    let path = route.path;
    const remaining = { ...payload };
    path = path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, name: string) => {
      const value = remaining[name];
      if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError(`Ninja Van route requires ${name}.`);
      delete remaining[name];
      return encodeURIComponent(String(value));
    });
    if (route.method === 'GET') {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(remaining)) {
        if (value !== undefined && value !== null) query.set(key, String(value));
      }
      if (query.size) path += `${path.includes('?') ? '&' : '?'}${query}`;
    }
    return this.request({
      operation,
      method: route.method,
      path,
      body: route.method === 'GET' ? undefined : remaining,
      safeToRetry: route.safeToRetry,
    });
  }

  private async request(spec: RequestSpec): Promise<NinjaVanSuccess> {
    const requestId = this.requestId();
    const token = await this.getToken();
    let attempt = 0;
    while (true) {
      try {
        const response = await this.fetchWithTimeout(`${this.baseUrl}${spec.path}`, {
          method: spec.method,
          headers: {
            accept: spec.operation === 'label' ? 'application/pdf, application/json' : 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
            'x-request-id': requestId,
          },
          body: spec.body === undefined ? undefined : JSON.stringify(spec.body),
        });
        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.includes('application/pdf')
          ? { contentType, bytes: new Uint8Array(await response.arrayBuffer()) }
          : parseJson(await response.text());
        if (response.ok) {
          return {
            carrier: 'ninja_van',
            operation: spec.operation,
            requestId,
            status: response.status,
            data: payload,
            retryable: false,
            outcomeUnknown: false,
          };
        }
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries
          && (response.status === 429 || response.status >= 500);
        if (canRetry) {
          attempt += 1;
          await this.sleep(retryAfter(response) ?? attempt * 250);
          continue;
        }
        const upstream = errorDetails(payload, `NINJA_VAN_HTTP_${response.status}`);
        throw new NinjaVanConnectorError({
          carrier: 'ninja_van',
          operation: spec.operation,
          requestId,
          status: response.status,
          retryable: response.status === 429 || response.status >= 500,
          outcomeUnknown: false,
          code: upstream.code,
          message: upstream.message,
          retryAfterMs: retryAfter(response),
        });
      } catch (error) {
        if (error instanceof NinjaVanConnectorError) throw error;
        if (spec.safeToRetry && attempt < this.config.maxSafeRetries) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new NinjaVanConnectorError({
          carrier: 'ninja_van',
          operation: spec.operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !spec.safeToRetry,
          code: abortError(error) ? 'NINJA_VAN_TIMEOUT' : 'NINJA_VAN_NETWORK',
          message: spec.safeToRetry
            ? 'Ninja Van could not be reached.'
            : 'Ninja Van could not be reached and the write result is unknown.',
        });
      }
    }
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try { return await this.fetchImpl(url, { ...init, signal: controller.signal }); }
    finally { clearTimeout(timer); }
  }
}
