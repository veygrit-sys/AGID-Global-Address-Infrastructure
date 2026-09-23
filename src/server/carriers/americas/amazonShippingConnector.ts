import { createHash, createHmac, randomUUID } from 'node:crypto';

/** Official Amazon Shipping V2 connector for North America. Server-only. */
export const AMAZON_SHIPPING_CONNECTOR_VERSION = 'veygrit-ship-amazon-shipping-v2-v0.1' as const;

export type AmazonShippingEnvironment = 'sandbox' | 'production';
export type AmazonShippingOperation = 'rate' | 'shipment' | 'void' | 'tracking';

export type AmazonShippingConnectorConfig = {
  environment: AmazonShippingEnvironment;
  /** LWA/SP-API credentials. Resolve these from a server-side secret provider only. */
  lwaClientId: string;
  lwaClientSecret: string;
  lwaRefreshToken: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsSessionToken?: string;
  shippingBusinessId?: 'AmazonShipping_US';
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type AmazonShippingConnectorDependencies = {
  fetch?: typeof fetch;
  now?: () => Date;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type AmazonShippingSuccess = {
  carrier: 'amazon_shipping';
  operation: AmazonShippingOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export type AmazonShippingCommonError = {
  carrier: 'amazon_shipping';
  operation: AmazonShippingOperation | 'oauth';
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class AmazonShippingConnectorError extends Error {
  constructor(readonly common: AmazonShippingCommonError) {
    super(common.message);
    this.name = 'AmazonShippingConnectorError';
  }
}

type AccessToken = { value: string; expiresAt: number };
type RequestKind = { operation: AmazonShippingOperation; method: 'GET' | 'POST' | 'PUT'; path: string; query?: Record<string, string>; body?: unknown; safeToRetry: boolean };

const SANDBOX_BASE_URL = 'https://sandbox.sellingpartnerapi-na.amazon.com';
const PRODUCTION_BASE_URL = 'https://sellingpartnerapi-na.amazon.com';
const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';

function required(value: string, key: string): string {
  if (!value?.trim()) throw new Error(`Amazon Shipping configuration is missing ${key}.`);
  return value.trim();
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmac(key: string | Buffer, value: string, encoding?: 'hex'): Buffer | string {
  const digest = createHmac('sha256', key).update(value, 'utf8').digest();
  return encoding === 'hex' ? digest.toString('hex') : digest;
}

function encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalQuery(query: Record<string, string> = {}): string {
  return Object.entries(query).filter(([, value]) => value !== undefined && value !== '').sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${encode(key)}=${encode(value)}`).join('&');
}

function parseJson(text: string): unknown {
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return {}; }
}

function retryAfter(response: Response): number | undefined {
  const raw = response.headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
}

function upstreamCode(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const errors = (payload as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || !errors[0] || typeof errors[0] !== 'object') return fallback;
  const code = (errors[0] as { code?: unknown }).code;
  return typeof code === 'string' && code ? code : fallback;
}

function upstreamMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const errors = (payload as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || !errors[0] || typeof errors[0] !== 'object') return fallback;
  const message = (errors[0] as { message?: unknown }).message;
  return typeof message === 'string' && message ? message : fallback;
}

function dateParts(date: Date): { short: string; long: string } {
  const iso = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return { short: iso.slice(0, 8), long: iso };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export class AmazonShippingConnector {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly baseUrl: string;
  private readonly config: Required<Omit<AmazonShippingConnectorConfig, 'awsSessionToken' | 'shippingBusinessId'>> & Pick<AmazonShippingConnectorConfig, 'awsSessionToken' | 'shippingBusinessId'>;
  private token?: AccessToken;
  private tokenRequest?: Promise<string>;

  constructor(config: AmazonShippingConnectorConfig, dependencies: AmazonShippingConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      lwaClientId: required(config.lwaClientId, 'lwaClientId'),
      lwaClientSecret: required(config.lwaClientSecret, 'lwaClientSecret'),
      lwaRefreshToken: required(config.lwaRefreshToken, 'lwaRefreshToken'),
      awsAccessKeyId: required(config.awsAccessKeyId, 'awsAccessKeyId'),
      awsSecretAccessKey: required(config.awsSecretAccessKey, 'awsSecretAccessKey'),
      awsSessionToken: config.awsSessionToken?.trim() || undefined,
      shippingBusinessId: config.shippingBusinessId ?? 'AmazonShipping_US',
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
    };
    this.baseUrl = config.environment === 'sandbox' ? SANDBOX_BASE_URL : PRODUCTION_BASE_URL;
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? (() => new Date());
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  async getRates(payload: Record<string, unknown>): Promise<AmazonShippingSuccess> {
    return this.request({ operation: 'rate', method: 'POST', path: '/shipping/v2/shipments/rates', body: payload, safeToRetry: true });
  }

  async purchaseShipment(payload: Record<string, unknown>): Promise<AmazonShippingSuccess> {
    return this.request({ operation: 'shipment', method: 'POST', path: '/shipping/v2/shipments', body: payload, safeToRetry: false });
  }

  async cancelShipment(shipmentId: string): Promise<AmazonShippingSuccess> {
    if (!shipmentId.trim()) throw new TypeError('Amazon shipmentId is required.');
    return this.request({ operation: 'void', method: 'PUT', path: `/shipping/v2/shipments/${encode(shipmentId.trim())}/cancel`, safeToRetry: false });
  }

  async getTracking(trackingId: string, carrierId: string): Promise<AmazonShippingSuccess> {
    if (!trackingId.trim() || !carrierId.trim()) throw new TypeError('Amazon trackingId and carrierId are required.');
    return this.request({ operation: 'tracking', method: 'GET', path: '/shipping/v2/tracking', query: { trackingId: trackingId.trim(), carrierId: carrierId.trim() }, safeToRetry: true });
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && this.token.expiresAt - 60_000 > this.now().getTime()) return this.token.value;
    if (!this.tokenRequest) this.tokenRequest = this.loadAccessToken().finally(() => { this.tokenRequest = undefined; });
    return this.tokenRequest;
  }

  private async loadAccessToken(): Promise<string> {
    const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: this.config.lwaRefreshToken, client_id: this.config.lwaClientId, client_secret: this.config.lwaClientSecret }).toString();
    const requestId = this.requestId();
    let response: Response;
    try {
      response = await this.fetchWithTimeout(LWA_TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body });
    } catch (error) {
      throw new AmazonShippingConnectorError({ carrier: 'amazon_shipping', operation: 'oauth', requestId, status: 0, retryable: true, outcomeUnknown: false, code: isAbortError(error) ? 'AMAZON_OAUTH_TIMEOUT' : 'AMAZON_OAUTH_NETWORK', message: 'Amazon Shipping authentication could not be completed.' });
    }
    const payload = parseJson(await response.text()) as Record<string, unknown>;
    if (!response.ok) throw new AmazonShippingConnectorError({ carrier: 'amazon_shipping', operation: 'oauth', requestId, status: response.status, retryable: response.status === 429 || response.status >= 500, outcomeUnknown: false, code: upstreamCode(payload, 'AMAZON_OAUTH_FAILED'), message: upstreamMessage(payload, 'Amazon Shipping authentication failed.'), retryAfterMs: retryAfter(response) });
    const accessToken = typeof payload.access_token === 'string' ? payload.access_token : '';
    if (!accessToken) throw new AmazonShippingConnectorError({ carrier: 'amazon_shipping', operation: 'oauth', requestId, status: response.status, retryable: false, outcomeUnknown: false, code: 'AMAZON_OAUTH_INVALID_RESPONSE', message: 'Amazon Shipping did not return an access token.' });
    const expiresIn = typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in) ? payload.expires_in : 3_600;
    this.token = { value: accessToken, expiresAt: this.now().getTime() + expiresIn * 1000 };
    return accessToken;
  }

  private signedHeaders(method: RequestKind['method'], path: string, query: Record<string, string>, body: string, accessToken: string): Record<string, string> {
    const url = new URL(this.baseUrl);
    const { short, long } = dateParts(this.now());
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      host: url.host,
      'x-amz-access-token': accessToken,
      'x-amz-date': long,
      'x-amzn-shipping-business-id': this.config.shippingBusinessId ?? 'AmazonShipping_US',
    };
    if (this.config.awsSessionToken) headers['x-amz-security-token'] = this.config.awsSessionToken;
    const sorted = Object.entries(headers).sort(([left], [right]) => left.localeCompare(right));
    const canonicalHeaders = sorted.map(([key, value]) => `${key}:${value.trim().replace(/\s+/g, ' ')}\n`).join('');
    const signedHeaderNames = sorted.map(([key]) => key).join(';');
    const canonicalRequest = [method, path, canonicalQuery(query), canonicalHeaders, signedHeaderNames, sha256(body)].join('\n');
    const scope = `${short}/us-east-1/execute-api/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', long, scope, sha256(canonicalRequest)].join('\n');
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${this.config.awsSecretAccessKey}`, short) as Buffer, 'us-east-1') as Buffer, 'execute-api') as Buffer, 'aws4_request') as Buffer;
    const signature = hmac(signingKey, stringToSign, 'hex') as string;
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${this.config.awsAccessKeyId}/${scope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`;
    return headers;
  }

  private async request(request: RequestKind): Promise<AmazonShippingSuccess> {
    const requestId = this.requestId();
    const body = request.body === undefined ? '' : JSON.stringify(request.body);
    const query = request.query ?? {};
    const url = `${this.baseUrl}${request.path}${Object.keys(query).length ? `?${canonicalQuery(query)}` : ''}`;
    let attempt = 0;
    while (true) {
      const accessToken = await this.getAccessToken();
      try {
        const response = await this.fetchWithTimeout(url, { method: request.method, headers: this.signedHeaders(request.method, request.path, query, body, accessToken), body: body || undefined });
        const payload = parseJson(await response.text());
        if (response.ok) return { carrier: 'amazon_shipping', operation: request.operation, requestId, status: response.status, data: payload, retryable: false, outcomeUnknown: false };
        const shouldRetry = request.safeToRetry && attempt < this.config.maxSafeRetries && (response.status === 429 || response.status >= 500);
        if (shouldRetry) { attempt += 1; await this.sleep(retryAfter(response) ?? 250 * attempt); continue; }
        throw new AmazonShippingConnectorError({ carrier: 'amazon_shipping', operation: request.operation, requestId, status: response.status, retryable: response.status === 429 || response.status >= 500, outcomeUnknown: false, code: upstreamCode(payload, `AMAZON_HTTP_${response.status}`), message: upstreamMessage(payload, 'Amazon Shipping rejected the request.'), retryAfterMs: retryAfter(response) });
      } catch (error) {
        if (error instanceof AmazonShippingConnectorError) throw error;
        const shouldRetry = request.safeToRetry && attempt < this.config.maxSafeRetries;
        if (shouldRetry) { attempt += 1; await this.sleep(250 * attempt); continue; }
        throw new AmazonShippingConnectorError({ carrier: 'amazon_shipping', operation: request.operation, requestId, status: 0, retryable: true, outcomeUnknown: !request.safeToRetry, code: isAbortError(error) ? 'AMAZON_TIMEOUT' : 'AMAZON_NETWORK', message: 'Amazon Shipping could not be reached.' });
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
