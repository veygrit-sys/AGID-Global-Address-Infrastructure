import { randomUUID } from 'node:crypto';

/** Official Loggi REST connector for Brazilian domestic shipping. Server-only. */
export const LOGGI_CONNECTOR_VERSION = 'veygrit-ship-loggi-v1-v0.1' as const;

export type LoggiEnvironment = 'sandbox' | 'production';
export type LoggiOperation = 'rate' | 'shipment' | 'shipment_update' | 'void' | 'tracking' | 'label' | 'pickup_point';

export type LoggiConnectorConfig = {
  environment: LoggiEnvironment;
  companyId: string;
  /** Resolve these credentials from a server-side secret provider only. */
  clientId: string;
  clientSecret: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
  /** Production access can use a contract-specific endpoint if Loggi supplies one. */
  productionBaseUrl?: string;
};

export type LoggiConnectorDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type LoggiSuccess = {
  carrier: 'loggi';
  operation: LoggiOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export type LoggiCommonError = {
  carrier: 'loggi';
  operation: LoggiOperation | 'oauth';
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class LoggiConnectorError extends Error {
  constructor(readonly common: LoggiCommonError) {
    super(common.message);
    this.name = 'LoggiConnectorError';
  }
}

type TokenCache = { value: string; expiresAt: number };
type RequestSpec = { operation: LoggiOperation; method: 'GET' | 'POST' | 'PATCH'; path: string; body?: unknown; safeToRetry: boolean };

const SANDBOX_BASE_URL = 'https://stg.api.loggi.com';
const DEFAULT_PRODUCTION_BASE_URL = 'https://api.loggi.com';

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Loggi connector configuration is missing ${name}.`);
  return value.trim();
}

function parseJson(value: string): unknown {
  if (!value) return {};
  try { return JSON.parse(value) as unknown; } catch { return {}; }
}

function errorCode(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const code = record.code ?? (Array.isArray(record.errors) && record.errors[0] && typeof record.errors[0] === 'object' ? (record.errors[0] as Record<string, unknown>).code : undefined);
  return typeof code === 'string' && code ? code : fallback;
}

function errorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? (Array.isArray(record.errors) && record.errors[0] && typeof record.errors[0] === 'object' ? (record.errors[0] as Record<string, unknown>).message : undefined);
  return typeof message === 'string' && message ? message : fallback;
}

function retryAfter(response: Response): number | undefined {
  const value = Number(response.headers.get('retry-after'));
  return Number.isFinite(value) && value >= 0 ? Math.ceil(value * 1000) : undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export class LoggiConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly config: Required<Omit<LoggiConnectorConfig, 'productionBaseUrl'>>;
  private token?: TokenCache;
  private tokenRequest?: Promise<string>;

  constructor(config: LoggiConnectorConfig, dependencies: LoggiConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      companyId: required(config.companyId, 'companyId'),
      clientId: required(config.clientId, 'clientId'),
      clientSecret: required(config.clientSecret, 'clientSecret'),
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
    };
    this.baseUrl = (config.environment === 'sandbox' ? SANDBOX_BASE_URL : config.productionBaseUrl ?? DEFAULT_PRODUCTION_BASE_URL).replace(/\/+$/, '');
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  async getRates(payload: Record<string, unknown>): Promise<LoggiSuccess> {
    return this.request({ operation: 'rate', method: 'POST', path: `/v1/companies/${encodeURIComponent(this.config.companyId)}/quotations`, body: payload, safeToRetry: true });
  }

  async createShipment(payload: Record<string, unknown>): Promise<LoggiSuccess> {
    return this.request({ operation: 'shipment', method: 'POST', path: `/v1/companies/${encodeURIComponent(this.config.companyId)}/async-shipments`, body: payload, safeToRetry: false });
  }

  async updateShipment(payload: Record<string, unknown> & { trackingCode?: string; loggiKey?: string }): Promise<LoggiSuccess> {
    const query = new URLSearchParams();
    if (payload.trackingCode?.trim()) query.set('tracking_code', payload.trackingCode.trim());
    if (payload.loggiKey?.trim()) query.set('loggi_key', payload.loggiKey.trim());
    if (!query.size) throw new TypeError('Loggi update requires trackingCode or loggiKey.');
    const { trackingCode: _trackingCode, loggiKey: _loggiKey, ...body } = payload;
    return this.request({
      operation: 'shipment_update',
      method: 'PATCH',
      path: `/v1/companies/${encodeURIComponent(this.config.companyId)}/packages?${query.toString()}`,
      body,
      safeToRetry: false,
    });
  }

  async createLabels(payload: { loggiKeys: string[]; format?: 'LABEL_FORMAT_PDF'; layout?: 'LABEL_LAYOUT_A4' | 'LABEL_LAYOUT_A6'; responseType?: 'LABEL_RESPONSE_TYPE_URL' }): Promise<LoggiSuccess> {
    if (!Array.isArray(payload.loggiKeys) || payload.loggiKeys.length === 0) throw new TypeError('Loggi labels require at least one loggi key.');
    return this.request({ operation: 'label', method: 'POST', path: `/v1/companies/${encodeURIComponent(this.config.companyId)}/labels`, body: { format: 'LABEL_FORMAT_PDF', layout: 'LABEL_LAYOUT_A6', responseType: 'LABEL_RESPONSE_TYPE_URL', ...payload }, safeToRetry: false });
  }

  async cancelShipment(identifier: { trackingCode?: string; loggiKey?: string }): Promise<LoggiSuccess> {
    const query = new URLSearchParams();
    if (identifier.trackingCode?.trim()) query.set('tracking_code', identifier.trackingCode.trim());
    if (identifier.loggiKey?.trim()) query.set('loggi_key', identifier.loggiKey.trim());
    if (!query.size) throw new TypeError('Loggi cancellation requires trackingCode or loggiKey.');
    return this.request({ operation: 'void', method: 'POST', path: `/v1/companies/${encodeURIComponent(this.config.companyId)}/packages/cancel?${query.toString()}`, safeToRetry: false });
  }

  async track(trackingCode: string): Promise<LoggiSuccess> {
    if (!trackingCode.trim()) throw new TypeError('Loggi trackingCode is required.');
    const code = encodeURIComponent(trackingCode.trim());
    return this.request({ operation: 'tracking', method: 'GET', path: `/v1/companies/${encodeURIComponent(this.config.companyId)}/packages/${code}/tracking`, safeToRetry: true });
  }

  async listDropoffLocations(payload: Record<string, unknown>): Promise<LoggiSuccess> {
    return this.request({
      operation: 'pickup_point',
      method: 'POST',
      path: '/dropoff/locations',
      body: payload,
      safeToRetry: true,
    });
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt - 60_000 > this.now()) return this.token.value;
    if (!this.tokenRequest) this.tokenRequest = this.loadToken().finally(() => { this.tokenRequest = undefined; });
    return this.tokenRequest;
  }

  private async loadToken(): Promise<string> {
    const requestId = this.requestId();
    let response: Response;
    try {
      response = await this.fetchWithTimeout(`${this.baseUrl}/v2/oauth2/token`, { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: this.config.clientId, client_secret: this.config.clientSecret }) });
    } catch (error) {
      throw new LoggiConnectorError({ carrier: 'loggi', operation: 'oauth', requestId, status: 0, retryable: true, outcomeUnknown: false, code: isAbortError(error) ? 'LOGGI_OAUTH_TIMEOUT' : 'LOGGI_OAUTH_NETWORK', message: 'Loggi authentication could not be completed.' });
    }
    const payload = parseJson(await response.text()) as Record<string, unknown>;
    if (!response.ok) throw new LoggiConnectorError({ carrier: 'loggi', operation: 'oauth', requestId, status: response.status, retryable: response.status === 429 || response.status >= 500, outcomeUnknown: false, code: errorCode(payload, 'LOGGI_OAUTH_FAILED'), message: errorMessage(payload, 'Loggi authentication failed.'), retryAfterMs: retryAfter(response) });
    const value = typeof payload.access_token === 'string' ? payload.access_token : typeof payload.token === 'string' ? payload.token : typeof payload.idToken === 'string' ? payload.idToken : '';
    if (!value) throw new LoggiConnectorError({ carrier: 'loggi', operation: 'oauth', requestId, status: response.status, retryable: false, outcomeUnknown: false, code: 'LOGGI_OAUTH_INVALID_RESPONSE', message: 'Loggi did not return an access token.' });
    const expiresIn = typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in) ? payload.expires_in : 3_600;
    this.token = { value, expiresAt: this.now() + expiresIn * 1000 };
    return value;
  }

  private async request(request: RequestSpec): Promise<LoggiSuccess> {
    const requestId = this.requestId();
    let attempt = 0;
    while (true) {
      const token = await this.getToken();
      try {
        const response = await this.fetchWithTimeout(`${this.baseUrl}${request.path}`, { method: request.method, headers: { accept: 'application/json', 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: request.body === undefined ? undefined : JSON.stringify(request.body) });
        const payload = parseJson(await response.text());
        if (response.ok) return { carrier: 'loggi', operation: request.operation, requestId, status: response.status, data: payload, retryable: false, outcomeUnknown: false };
        const canRetry = request.safeToRetry && attempt < this.config.maxSafeRetries && (response.status === 429 || response.status >= 500);
        if (canRetry) { attempt += 1; await this.sleep(retryAfter(response) ?? 250 * attempt); continue; }
        throw new LoggiConnectorError({ carrier: 'loggi', operation: request.operation, requestId, status: response.status, retryable: response.status === 429 || response.status >= 500, outcomeUnknown: false, code: errorCode(payload, `LOGGI_HTTP_${response.status}`), message: errorMessage(payload, 'Loggi rejected the request.'), retryAfterMs: retryAfter(response) });
      } catch (error) {
        if (error instanceof LoggiConnectorError) throw error;
        const canRetry = request.safeToRetry && attempt < this.config.maxSafeRetries;
        if (canRetry) { attempt += 1; await this.sleep(250 * attempt); continue; }
        throw new LoggiConnectorError({ carrier: 'loggi', operation: request.operation, requestId, status: 0, retryable: true, outcomeUnknown: !request.safeToRetry, code: isAbortError(error) ? 'LOGGI_TIMEOUT' : 'LOGGI_NETWORK', message: 'Loggi could not be reached.' });
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
