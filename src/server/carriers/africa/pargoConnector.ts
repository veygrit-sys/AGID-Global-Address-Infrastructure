import { randomUUID } from 'node:crypto';

export const PARGO_CONNECTOR_VERSION = 'veygrit-ship-pargo-simba-v1-v0.1' as const;

export type PargoOperation =
  | 'address_validation'
  | 'rate'
  | 'shipment'
  | 'return'
  | 'void'
  | 'label'
  | 'pickup_point'
  | 'webhook';
export type PargoConnectorConfig = {
  environment: 'sandbox' | 'production';
  username: string;
  password: string;
  /** Pargo provides the production host during commercial onboarding. */
  productionBaseUrl?: string;
  /** Pargo issues the Route Guide path with the approved Simba contract. */
  addressAutocompletePath?: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
};
export type PargoConnectorDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};
export type PargoSuccess = {
  carrier: 'pargo';
  operation: PargoOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};
export type PargoCommonError = {
  carrier: 'pargo';
  operation: PargoOperation | 'oauth';
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class PargoConnectorError extends Error {
  constructor(readonly common: PargoCommonError) {
    super(common.message);
    this.name = 'PargoConnectorError';
  }
}

type Token = { accessToken: string; refreshToken?: string; expiresAt: number };
type RequestSpec = {
  operation: PargoOperation;
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  safeToRetry: boolean;
};

const STAGING_URL = 'https://api.staging.pargo.co.za';
const TOKEN_REFRESH_EARLY_MS = 5 * 60 * 1000;

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Pargo configuration is missing ${name}.`);
  return value.trim();
}

function productionUrl(value: string | undefined): string {
  const normalized = required(value ?? '', 'productionBaseUrl');
  const url = new URL(normalized);
  if (url.protocol !== 'https:') throw new Error('Pargo productionBaseUrl must use HTTPS.');
  return url.toString().replace(/\/$/, '');
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
    return { code: fallbackCode, message: 'Pargo rejected the request.' };
  }
  const record = payload as Record<string, unknown>;
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const first = errors[0] && typeof errors[0] === 'object' ? errors[0] as Record<string, unknown> : undefined;
  return {
    code: typeof first?.code === 'string' || typeof first?.code === 'number'
      ? String(first.code)
      : typeof record.code === 'string'
        ? record.code
        : fallbackCode,
    message: typeof first?.detail === 'string' && first.detail
      ? first.detail
      : typeof first?.title === 'string'
        ? first.title
        : typeof record.message === 'string'
          ? record.message
          : 'Pargo rejected the request.',
  };
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export class PargoConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly config: Required<Omit<PargoConnectorConfig, 'productionBaseUrl' | 'addressAutocompletePath'>>
    & Pick<PargoConnectorConfig, 'productionBaseUrl' | 'addressAutocompletePath'>;
  private token?: Token;
  private tokenRequest?: Promise<string>;

  constructor(config: PargoConnectorConfig, dependencies: PargoConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      username: required(config.username, 'username'),
      password: required(config.password, 'password'),
      productionBaseUrl: config.productionBaseUrl,
      addressAutocompletePath: config.addressAutocompletePath,
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
    };
    this.baseUrl = config.environment === 'sandbox' ? STAGING_URL : productionUrl(config.productionBaseUrl);
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  getQuotation(payload: Record<string, unknown>): Promise<PargoSuccess> {
    return this.request({ operation: 'rate', method: 'POST', path: '/orders/quotation', body: payload, safeToRetry: true });
  }

  createOrder(payload: Record<string, unknown>, operation: 'shipment' | 'return' = 'shipment'): Promise<PargoSuccess> {
    return this.request({ operation, method: 'POST', path: '/orders', body: payload, safeToRetry: false });
  }

  cancelOrder(orderReference: string): Promise<PargoSuccess> {
    if (!orderReference.trim()) throw new TypeError('Pargo orderReference is required.');
    return this.request({
      operation: 'void',
      method: 'POST',
      path: '/orders/update',
      body: { data: [{ orderReference: orderReference.trim(), cancel: 'true' }] },
      safeToRetry: false,
    });
  }

  getLabel(orderReference: string): Promise<PargoSuccess> {
    if (!orderReference.trim()) throw new TypeError('Pargo orderReference is required.');
    return this.request({
      operation: 'label',
      method: 'GET',
      path: `/orders/${encodeURIComponent(orderReference.trim())}/label`,
      safeToRetry: true,
    });
  }

  autocompleteAddress(query: string): Promise<PargoSuccess> {
    if (!query.trim()) throw new TypeError('Pargo address query is required.');
    const path = this.config.addressAutocompletePath;
    if (!path?.startsWith('/')) {
      throw new Error('Pargo addressAutocompletePath must be supplied from the approved Route Guide contract.');
    }
    return this.request({
      operation: 'address_validation',
      method: 'GET',
      path,
      query: { query: query.trim() },
      safeToRetry: true,
    });
  }

  listPickupPoints(query: Record<string, string | number | boolean | undefined> = {}): Promise<PargoSuccess> {
    return this.request({
      operation: 'pickup_point',
      method: 'GET',
      path: '/pickup_points',
      query,
      safeToRetry: true,
    });
  }

  /**
   * Pargo webhooks are inbound events: this validates and normalizes them
   * locally and deliberately does not pretend that an outbound registration
   * request succeeded.
   */
  ingestWebhook(payload: Record<string, unknown>): PargoSuccess {
    const event = typeof payload.event === 'string'
      ? payload.event
      : typeof (payload.data as Record<string, unknown> | undefined)?.event === 'string'
        ? String((payload.data as Record<string, unknown>).event)
        : '';
    if (!event) throw new TypeError('Pargo webhook event is required.');
    return {
      carrier: 'pargo',
      operation: 'webhook',
      requestId: this.requestId(),
      status: 200,
      data: { event, payload },
      retryable: false,
      outcomeUnknown: false,
    };
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt - TOKEN_REFRESH_EARLY_MS > this.now()) return this.token.accessToken;
    if (!this.tokenRequest) {
      this.tokenRequest = this.loadToken().finally(() => { this.tokenRequest = undefined; });
    }
    return this.tokenRequest;
  }

  private async loadToken(): Promise<string> {
    const current = this.token;
    const path = current?.refreshToken ? '/auth/refresh' : '/auth';
    const body = current?.refreshToken
      ? { refresh_token: current.refreshToken }
      : { username: this.config.username, password: this.config.password };
    const requestId = this.requestId();
    let response: Response;
    try {
      response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'x-request-id': requestId },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new PargoConnectorError({
        carrier: 'pargo',
        operation: 'oauth',
        requestId,
        status: 0,
        retryable: true,
        outcomeUnknown: false,
        code: abortError(error) ? 'PARGO_OAUTH_TIMEOUT' : 'PARGO_OAUTH_NETWORK',
        message: 'Pargo authentication could not be completed.',
      });
    }
    const payload = parseJson(await response.text()) as Record<string, unknown>;
    if (!response.ok) {
      const upstream = errorDetails(payload, 'PARGO_OAUTH_FAILED');
      throw new PargoConnectorError({
        carrier: 'pargo',
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
    const accessToken = typeof payload.access_token === 'string' ? payload.access_token : '';
    if (!accessToken) {
      throw new PargoConnectorError({
        carrier: 'pargo',
        operation: 'oauth',
        requestId,
        status: response.status,
        retryable: false,
        outcomeUnknown: false,
        code: 'PARGO_OAUTH_INVALID_RESPONSE',
        message: 'Pargo did not return an access token.',
      });
    }
    const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : 4200;
    this.token = {
      accessToken,
      refreshToken: typeof payload.refresh_token === 'string' ? payload.refresh_token : current?.refreshToken,
      expiresAt: this.now() + expiresIn * 1000,
    };
    return accessToken;
  }

  private async request(spec: RequestSpec): Promise<PargoSuccess> {
    const requestId = this.requestId();
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(spec.query ?? {})) {
      if (value !== undefined) query.set(key, String(value));
    }
    const path = query.size ? `${spec.path}${spec.path.includes('?') ? '&' : '?'}${query}` : spec.path;
    let attempt = 0;
    while (true) {
      const token = await this.getToken();
      try {
        const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
          method: spec.method,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
            'x-request-id': requestId,
          },
          body: spec.body === undefined ? undefined : JSON.stringify(spec.body),
        });
        const payload = parseJson(await response.text());
        if (response.ok) {
          return {
            carrier: 'pargo',
            operation: spec.operation,
            requestId,
            status: response.status,
            data: payload,
            retryable: false,
            outcomeUnknown: false,
          };
        }
        const canRetry = spec.safeToRetry
          && attempt < this.config.maxSafeRetries
          && (response.status === 429 || response.status >= 500);
        if (canRetry) {
          attempt += 1;
          await this.sleep(retryAfter(response) ?? attempt * 250);
          continue;
        }
        const upstream = errorDetails(payload, `PARGO_HTTP_${response.status}`);
        throw new PargoConnectorError({
          carrier: 'pargo',
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
        if (error instanceof PargoConnectorError) throw error;
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries;
        if (canRetry) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new PargoConnectorError({
          carrier: 'pargo',
          operation: spec.operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !spec.safeToRetry,
          code: abortError(error) ? 'PARGO_TIMEOUT' : 'PARGO_NETWORK',
          message: spec.safeToRetry
            ? 'Pargo could not be reached.'
            : 'Pargo could not be reached and the write result is unknown.',
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
