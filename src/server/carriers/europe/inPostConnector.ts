import { randomUUID } from 'node:crypto';

export const INPOST_CONNECTOR_VERSION = 'veygrit-ship-inpost-shipping-v2-v0.1' as const;

export type InPostOperation = 'shipment' | 'tracking' | 'label' | 'pickup_point' | 'return';
export type InPostConnectorConfig = {
  environment: 'sandbox' | 'production';
  organizationId: string;
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  /** Contract/version-specific Returns API create route. */
  returnPath?: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
};
export type InPostConnectorDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};
export type InPostSuccess = {
  carrier: 'inpost';
  operation: InPostOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};
export type InPostCommonError = {
  carrier: 'inpost';
  operation: InPostOperation | 'oauth';
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class InPostConnectorError extends Error {
  constructor(readonly common: InPostCommonError) {
    super(common.message);
    this.name = 'InPostConnectorError';
  }
}

type Token = { value: string; expiresAt: number };
type RequestSpec = { operation: InPostOperation; method: 'GET' | 'POST'; path: string; body?: unknown; safeToRetry: boolean; accept?: string };
const STAGE_URL = 'https://stage-api.inpost-group.com';
const PRODUCTION_URL = 'https://api.inpost-group.com';

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`InPost configuration is missing ${name}.`);
  return value.trim();
}

function json(text: string): unknown {
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return {}; }
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
}

function errorDetails(payload: unknown, fallbackCode: string): { code: string; message: string } {
  if (!payload || typeof payload !== 'object') return { code: fallbackCode, message: 'InPost rejected the request.' };
  const record = payload as Record<string, unknown>;
  return {
    code: typeof record.code === 'string' ? record.code : typeof record.error === 'string' ? record.error : fallbackCode,
    message: typeof record.message === 'string' ? record.message : typeof record.error_description === 'string' ? record.error_description : 'InPost rejected the request.',
  };
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export class InPostConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly config: Required<InPostConnectorConfig>;
  private token?: Token;
  private tokenRequest?: Promise<string>;

  constructor(config: InPostConnectorConfig, dependencies: InPostConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      organizationId: required(config.organizationId, 'organizationId'),
      clientId: required(config.clientId, 'clientId'),
      clientSecret: required(config.clientSecret, 'clientSecret'),
      scopes: config.scopes ?? [
        'openid',
        'api:shipments:read',
        'api:shipments:write',
        'api:tracking:read',
        'api:points:read',
        'api:returns:read',
        'api:returns:write',
      ],
      returnPath: config.returnPath ?? '',
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
    };
    this.baseUrl = config.environment === 'sandbox' ? STAGE_URL : PRODUCTION_URL;
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  createShipment(payload: Record<string, unknown>): Promise<InPostSuccess> {
    return this.request({ operation: 'shipment', method: 'POST', path: `/shipping/v2/organizations/${encodeURIComponent(this.config.organizationId)}/shipments`, body: payload, safeToRetry: false });
  }

  getShipment(trackingNumber: string): Promise<InPostSuccess> {
    if (!trackingNumber.trim()) throw new TypeError('InPost trackingNumber is required.');
    return this.request({ operation: 'tracking', method: 'GET', path: `/shipping/v2/organizations/${encodeURIComponent(this.config.organizationId)}/shipments/${encodeURIComponent(trackingNumber.trim())}`, safeToRetry: true });
  }

  getLabel(trackingNumber: string, accept = 'application/pdf+json;format=A6'): Promise<InPostSuccess> {
    if (!trackingNumber.trim()) throw new TypeError('InPost trackingNumber is required.');
    return this.request({ operation: 'label', method: 'GET', path: `/shipping/v2/organizations/${encodeURIComponent(this.config.organizationId)}/shipments/${encodeURIComponent(trackingNumber.trim())}/label`, safeToRetry: true, accept });
  }

  listPickupPoints(query: Record<string, string | number | boolean | undefined>): Promise<InPostSuccess> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) search.set(key, String(value));
    }
    const suffix = search.toString();
    return this.request({
      operation: 'pickup_point',
      method: 'GET',
      path: `/location/v1/points${suffix ? `?${suffix}` : ''}`,
      safeToRetry: true,
    });
  }

  createReturn(payload: Record<string, unknown>): Promise<InPostSuccess> {
    if (!this.config.returnPath) {
      throw new Error('InPost Returns API route must be configured from the approved merchant contract.');
    }
    const path = this.config.returnPath.startsWith('/') ? this.config.returnPath : `/${this.config.returnPath}`;
    return this.request({ operation: 'return', method: 'POST', path, body: payload, safeToRetry: false });
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt - 30_000 > this.now()) return this.token.value;
    if (!this.tokenRequest) this.tokenRequest = this.loadToken().finally(() => { this.tokenRequest = undefined; });
    return this.tokenRequest;
  }

  private async loadToken(): Promise<string> {
    const requestId = this.requestId();
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: this.config.scopes.join(' '),
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    }).toString();
    let response: Response;
    try {
      response = await this.fetchWithTimeout(`${this.baseUrl}/oauth2/token`, { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' }, body });
    } catch (error) {
      throw new InPostConnectorError({ carrier: 'inpost', operation: 'oauth', requestId, status: 0, retryable: true, outcomeUnknown: false, code: abortError(error) ? 'INPOST_OAUTH_TIMEOUT' : 'INPOST_OAUTH_NETWORK', message: 'InPost authentication could not be completed.' });
    }
    const payload = json(await response.text()) as Record<string, unknown>;
    if (!response.ok) {
      const upstream = errorDetails(payload, 'INPOST_OAUTH_FAILED');
      throw new InPostConnectorError({ carrier: 'inpost', operation: 'oauth', requestId, status: response.status, retryable: response.status === 429 || response.status >= 500, outcomeUnknown: false, code: upstream.code, message: upstream.message, retryAfterMs: retryAfter(response) });
    }
    const value = typeof payload.access_token === 'string' ? payload.access_token : '';
    if (!value) throw new InPostConnectorError({ carrier: 'inpost', operation: 'oauth', requestId, status: response.status, retryable: false, outcomeUnknown: false, code: 'INPOST_OAUTH_INVALID_RESPONSE', message: 'InPost did not return an access token.' });
    const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : 599;
    this.token = { value, expiresAt: this.now() + expiresIn * 1000 };
    return value;
  }

  private async request(spec: RequestSpec): Promise<InPostSuccess> {
    const requestId = this.requestId();
    let attempt = 0;
    while (true) {
      const token = await this.getToken();
      try {
        const response = await this.fetchWithTimeout(`${this.baseUrl}${spec.path}`, {
          method: spec.method,
          headers: { accept: spec.accept ?? 'application/json', 'content-type': 'application/json', authorization: `Bearer ${token}`, 'x-request-id': requestId },
          body: spec.body === undefined ? undefined : JSON.stringify(spec.body),
        });
        const payload = json(await response.text());
        if (response.ok) return { carrier: 'inpost', operation: spec.operation, requestId, status: response.status, data: payload, retryable: false, outcomeUnknown: false };
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries && (response.status === 429 || response.status >= 500);
        if (canRetry) { attempt += 1; await this.sleep(retryAfter(response) ?? attempt * 250); continue; }
        const upstream = errorDetails(payload, `INPOST_HTTP_${response.status}`);
        throw new InPostConnectorError({ carrier: 'inpost', operation: spec.operation, requestId, status: response.status, retryable: response.status === 429 || response.status >= 500, outcomeUnknown: false, code: upstream.code, message: upstream.message, retryAfterMs: retryAfter(response) });
      } catch (error) {
        if (error instanceof InPostConnectorError) throw error;
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries;
        if (canRetry) { attempt += 1; await this.sleep(attempt * 250); continue; }
        throw new InPostConnectorError({ carrier: 'inpost', operation: spec.operation, requestId, status: 0, retryable: true, outcomeUnknown: !spec.safeToRetry, code: abortError(error) ? 'INPOST_TIMEOUT' : 'INPOST_NETWORK', message: 'InPost could not be reached.' });
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
