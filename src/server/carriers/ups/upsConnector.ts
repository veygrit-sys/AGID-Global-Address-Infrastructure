import { randomUUID } from 'node:crypto';

export const UPS_CONNECTOR_VERSION = 'veygrit-ship-ups-v0.1' as const;

export type UpsOperation =
  | 'oauth'
  | 'address_validation'
  | 'rating'
  | 'shipment'
  | 'void'
  | 'tracking';

export type UpsErrorCategory =
  | 'configuration'
  | 'authentication'
  | 'validation'
  | 'rate_limited'
  | 'not_found'
  | 'timeout'
  | 'network'
  | 'upstream';

export type UpsCommonError = {
  ok: false;
  carrier: 'ups';
  operation: UpsOperation;
  requestId: string;
  status: number;
  error: {
    category: UpsErrorCategory;
    code: string;
    message: string;
    retryable: boolean;
    automaticRetryCount: number;
    outcomeUnknown: boolean;
    retryAfterMs?: number;
    upstreamErrors?: Array<{ code: string; message: string }>;
  };
};

export type UpsSuccess<T = unknown> = {
  ok: true;
  carrier: 'ups';
  operation: Exclude<UpsOperation, 'oauth'>;
  requestId: string;
  status: number;
  automaticRetryCount: number;
  data: T;
};

export type UpsConnectorConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  accountNumber?: string;
  transactionSource?: string;
  apiVersion?: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  tokenExpirySkewMs?: number;
};

export type UpsConnectorDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  random?: () => number;
  requestId?: () => string;
};

type UpsRequest = {
  operation: Exclude<UpsOperation, 'oauth'>;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  retrySafety: 'safe-read' | 'unsafe-write';
};

type TokenCacheEntry = {
  accessToken: string;
  expiresAt: number;
};

type TokenResult = TokenCacheEntry & {
  tokenType: string;
};

const SANDBOX_BASE_URL = 'https://wwwcie.ups.com';
const PRODUCTION_BASE_URL = 'https://onlinetools.ups.com';

function nonEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('UPS base URL must use HTTP or HTTPS.');
  }
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function parseInteger(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function parseRetryAfter(value: string | null, now: number, maxDelayMs: number): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(maxDelayMs, Math.ceil(seconds * 1000));
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return undefined;
  return Math.min(maxDelayMs, Math.max(0, date - now));
}

function errorCategory(status: number): UpsErrorCategory {
  if (status === 401 || status === 403) return 'authentication';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 400 && status < 500) return 'validation';
  return 'upstream';
}

function fallbackCode(status: number): string {
  if (status === 401 || status === 403) return 'UPS_AUTHENTICATION_FAILED';
  if (status === 404) return 'UPS_NOT_FOUND';
  if (status === 429) return 'UPS_RATE_LIMITED';
  if (status >= 400 && status < 500) return 'UPS_REQUEST_REJECTED';
  return 'UPS_UPSTREAM_UNAVAILABLE';
}

function safeMessage(category: UpsErrorCategory): string {
  if (category === 'authentication') return 'UPS authentication failed.';
  if (category === 'not_found') return 'The requested UPS resource was not found.';
  if (category === 'rate_limited') return 'UPS rate limit was reached.';
  if (category === 'validation') return 'UPS rejected the request.';
  if (category === 'timeout') return 'UPS did not respond before the timeout.';
  if (category === 'network') return 'UPS could not be reached.';
  if (category === 'configuration') return 'UPS connector configuration is incomplete.';
  return 'UPS is temporarily unavailable.';
}

function extractUpstreamErrors(payload: unknown): Array<{ code: string; message: string }> {
  if (!payload || typeof payload !== 'object') return [];
  const response = (payload as Record<string, unknown>).response;
  if (!response || typeof response !== 'object') return [];
  const errors = (response as Record<string, unknown>).errors;
  if (!Array.isArray(errors)) return [];
  return errors.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const code = nonEmpty(record.code);
    const message = nonEmpty(record.message);
    return code || message ? [{ code: code || 'UPS_ERROR', message: message || 'UPS rejected the request.' }] : [];
  }).slice(0, 10);
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function validatePayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('UPS request payload must be a JSON object.');
  }
  return payload as Record<string, unknown>;
}

export class UpsConnectorError extends Error {
  readonly common: UpsCommonError;

  constructor(common: UpsCommonError) {
    super(common.error.message);
    this.name = 'UpsConnectorError';
    this.common = common;
  }
}

export class UpsConfigurationError extends Error {
  readonly missingKeys: string[];

  constructor(message: string, missingKeys: string[] = []) {
    super(message);
    this.name = 'UpsConfigurationError';
    this.missingKeys = missingKeys;
  }
}

export class UpsOAuthTokenProvider {
  private readonly config: Required<Pick<UpsConnectorConfig,
    'baseUrl' | 'clientId' | 'clientSecret' | 'timeoutMs' | 'maxSafeRetries' | 'retryBaseDelayMs' | 'retryMaxDelayMs' | 'tokenExpirySkewMs'>>
    & Pick<UpsConnectorConfig, 'accountNumber'>;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly random: () => number;
  private cache?: TokenCacheEntry;
  private inFlight?: Promise<TokenResult>;

  constructor(config: UpsConnectorConfig, dependencies: UpsConnectorDependencies = {}) {
    this.config = {
      baseUrl: normalizeBaseUrl(config.baseUrl),
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      accountNumber: config.accountNumber,
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 3,
      retryBaseDelayMs: config.retryBaseDelayMs ?? 250,
      retryMaxDelayMs: config.retryMaxDelayMs ?? 30_000,
      tokenExpirySkewMs: config.tokenExpirySkewMs ?? 60_000,
    };
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.random = dependencies.random ?? Math.random;
  }

  invalidate(): void {
    this.cache = undefined;
  }

  async getToken(forceRefresh = false): Promise<string> {
    if (forceRefresh) this.invalidate();
    if (this.cache && this.cache.expiresAt - this.config.tokenExpirySkewMs > this.now()) {
      return this.cache.accessToken;
    }
    return (await this.loadToken()).accessToken;
  }

  async refreshToken(): Promise<{ expiresAt: string }> {
    this.invalidate();
    const result = await this.loadToken();
    return { expiresAt: new Date(result.expiresAt).toISOString() };
  }

  private async loadToken(): Promise<TokenResult> {
    if (!this.inFlight) {
      this.inFlight = this.fetchToken().finally(() => {
        this.inFlight = undefined;
      });
    }
    return this.inFlight;
  }

  private retryDelay(attempt: number, retryAfterMs?: number): number {
    if (retryAfterMs !== undefined) return retryAfterMs;
    const base = Math.min(this.config.retryMaxDelayMs, this.config.retryBaseDelayMs * (2 ** attempt));
    return Math.min(this.config.retryMaxDelayMs, Math.ceil(base * (0.8 + this.random() * 0.4)));
  }

  private async fetchToken(): Promise<TokenResult> {
    const requestId = randomUUID().replace(/-/g, '');
    let retryCount = 0;
    while (true) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
      try {
        const headers: Record<string, string> = {
          accept: 'application/json',
          authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded',
        };
        if (this.config.accountNumber) headers['x-merchant-id'] = this.config.accountNumber;
        const response = await this.fetchImpl(`${this.config.baseUrl}/security/v1/oauth/token`, {
          method: 'POST',
          headers,
          body: 'grant_type=client_credentials',
          signal: controller.signal,
        });
        const payload = await readJson(response);
        if (response.ok) {
          const record = payload as Record<string, unknown>;
          const accessToken = nonEmpty(record.access_token);
          const expiresIn = Number(nonEmpty(record.expires_in));
          if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
            throw new UpsConnectorError({
              ok: false,
              carrier: 'ups',
              operation: 'oauth',
              requestId,
              status: 502,
              error: {
                category: 'upstream',
                code: 'UPS_INVALID_TOKEN_RESPONSE',
                message: 'UPS returned an invalid OAuth token response.',
                retryable: false,
                automaticRetryCount: retryCount,
                outcomeUnknown: false,
              },
            });
          }
          const token = {
            accessToken,
            tokenType: nonEmpty(record.token_type) || 'Bearer',
            expiresAt: this.now() + expiresIn * 1000,
          };
          this.cache = { accessToken: token.accessToken, expiresAt: token.expiresAt };
          return token;
        }

        const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'), this.now(), this.config.retryMaxDelayMs);
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && retryCount < this.config.maxSafeRetries) {
          await this.sleep(this.retryDelay(retryCount, retryAfterMs));
          retryCount += 1;
          continue;
        }
        throw this.responseError('oauth', requestId, response.status, payload, retryCount, retryAfterMs);
      } catch (error) {
        if (error instanceof UpsConnectorError) throw error;
        if (retryCount < this.config.maxSafeRetries) {
          await this.sleep(this.retryDelay(retryCount));
          retryCount += 1;
          continue;
        }
        const category: UpsErrorCategory = isAbortError(error) ? 'timeout' : 'network';
        throw new UpsConnectorError({
          ok: false,
          carrier: 'ups',
          operation: 'oauth',
          requestId,
          status: 503,
          error: {
            category,
            code: category === 'timeout' ? 'UPS_OAUTH_TIMEOUT' : 'UPS_OAUTH_NETWORK_ERROR',
            message: safeMessage(category),
            retryable: true,
            automaticRetryCount: retryCount,
            outcomeUnknown: false,
          },
        });
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  private responseError(
    operation: UpsOperation,
    requestId: string,
    status: number,
    payload: unknown,
    retryCount: number,
    retryAfterMs?: number,
  ): UpsConnectorError {
    const upstreamErrors = extractUpstreamErrors(payload);
    const category = errorCategory(status);
    return new UpsConnectorError({
      ok: false,
      carrier: 'ups',
      operation,
      requestId,
      status,
      error: {
        category,
        code: upstreamErrors[0]?.code || fallbackCode(status),
        message: upstreamErrors[0]?.message || safeMessage(category),
        retryable: status === 429 || status >= 500,
        automaticRetryCount: retryCount,
        outcomeUnknown: false,
        ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
        ...(upstreamErrors.length > 0 ? { upstreamErrors } : {}),
      },
    });
  }
}

export class UpsConnector {
  private readonly config: Required<Pick<UpsConnectorConfig,
    'baseUrl' | 'transactionSource' | 'apiVersion' | 'timeoutMs' | 'maxSafeRetries' | 'retryBaseDelayMs' | 'retryMaxDelayMs'>>;
  private readonly fetchImpl: typeof fetch;
  private readonly tokenProvider: UpsOAuthTokenProvider;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly random: () => number;
  private readonly requestId: () => string;

  constructor(config: UpsConnectorConfig, dependencies: UpsConnectorDependencies = {}) {
    this.config = {
      baseUrl: normalizeBaseUrl(config.baseUrl),
      transactionSource: config.transactionSource ?? 'veygrit-ship',
      apiVersion: config.apiVersion ?? 'v2409',
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 3,
      retryBaseDelayMs: config.retryBaseDelayMs ?? 250,
      retryMaxDelayMs: config.retryMaxDelayMs ?? 30_000,
    };
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.random = dependencies.random ?? Math.random;
    this.requestId = dependencies.requestId ?? (() => randomUUID().replace(/-/g, ''));
    this.tokenProvider = new UpsOAuthTokenProvider(config, dependencies);
  }

  refreshOAuthToken(): Promise<{ expiresAt: string }> {
    return this.tokenProvider.refreshToken();
  }

  validateAddress(payload: unknown, options: { requestOption?: 1 | 2 | 3; regionalRequestIndicator?: boolean; maximumCandidateListSize?: number } = {}) {
    const query = new URLSearchParams();
    if (options.regionalRequestIndicator !== undefined) query.set('regionalrequestindicator', String(options.regionalRequestIndicator));
    if (options.maximumCandidateListSize !== undefined) query.set('maximumcandidatelistsize', String(options.maximumCandidateListSize));
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.request({
      operation: 'address_validation',
      method: 'POST',
      path: `/api/addressvalidation/v2/${options.requestOption ?? 3}${suffix}`,
      body: validatePayload(payload),
      retrySafety: 'safe-read',
    });
  }

  getRates(payload: unknown, options: { requestOption?: 'Rate' | 'Shop' | 'Ratetimeintransit' | 'Shoptimeintransit'; additionalInfo?: 'timeintransit' } = {}) {
    const query = options.additionalInfo ? `?additionalinfo=${encodeURIComponent(options.additionalInfo)}` : '';
    return this.request({
      operation: 'rating',
      method: 'POST',
      path: `/api/rating/${this.config.apiVersion}/${options.requestOption ?? 'Shop'}${query}`,
      body: validatePayload(payload),
      retrySafety: 'safe-read',
    });
  }

  createShipment(payload: unknown, options: { additionalAddressValidation?: 'city' } = {}) {
    const query = options.additionalAddressValidation ? `?additionaladdressvalidation=${options.additionalAddressValidation}` : '';
    return this.request({
      operation: 'shipment',
      method: 'POST',
      path: `/api/shipments/${this.config.apiVersion}/ship${query}`,
      body: validatePayload(payload),
      retrySafety: 'unsafe-write',
    });
  }

  voidShipment(shipmentIdentificationNumber: string, options: { trackingNumbers?: string[] } = {}) {
    const normalized = shipmentIdentificationNumber.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,35}$/.test(normalized)) throw new TypeError('Invalid UPS shipment identification number.');
    const query = new URLSearchParams();
    if (options.trackingNumbers?.length) query.set('trackingnumber', options.trackingNumbers.join(','));
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.request({
      operation: 'void',
      method: 'DELETE',
      path: `/api/shipments/${this.config.apiVersion}/void/cancel/${encodeURIComponent(normalized)}${suffix}`,
      retrySafety: 'unsafe-write',
    });
  }

  track(inquiryNumber: string, options: { locale?: string; returnSignature?: boolean; returnMilestones?: boolean; returnPOD?: boolean } = {}) {
    const normalized = inquiryNumber.trim().toUpperCase();
    if (!/^[A-Z0-9-]{7,34}$/.test(normalized)) throw new TypeError('Invalid UPS tracking inquiry number.');
    const query = new URLSearchParams();
    query.set('locale', options.locale ?? 'en_US');
    if (options.returnSignature !== undefined) query.set('returnSignature', String(options.returnSignature));
    if (options.returnMilestones !== undefined) query.set('returnMilestones', String(options.returnMilestones));
    if (options.returnPOD !== undefined) query.set('returnPOD', String(options.returnPOD));
    return this.request({
      operation: 'tracking',
      method: 'GET',
      path: `/api/track/v1/details/${encodeURIComponent(normalized)}?${query.toString()}`,
      retrySafety: 'safe-read',
    });
  }

  private retryDelay(attempt: number, retryAfterMs?: number): number {
    if (retryAfterMs !== undefined) return retryAfterMs;
    const base = Math.min(this.config.retryMaxDelayMs, this.config.retryBaseDelayMs * (2 ** attempt));
    return Math.min(this.config.retryMaxDelayMs, Math.ceil(base * (0.8 + this.random() * 0.4)));
  }

  private async request<T = unknown>(input: UpsRequest): Promise<UpsSuccess<T>> {
    const requestId = this.requestId().slice(0, 32);
    let retryCount = 0;
    let authRefreshPerformed = false;

    while (true) {
      const token = await this.tokenProvider.getToken();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
      try {
        const response = await this.fetchImpl(`${this.config.baseUrl}${input.path}`, {
          method: input.method,
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
            transId: requestId,
            transactionSrc: this.config.transactionSource,
          },
          ...(input.body ? { body: JSON.stringify(input.body) } : {}),
          signal: controller.signal,
        });
        const payload = await readJson(response);
        if (response.ok) {
          return {
            ok: true,
            carrier: 'ups',
            operation: input.operation,
            requestId,
            status: response.status,
            automaticRetryCount: retryCount,
            data: payload as T,
          };
        }

        if (response.status === 401 && !authRefreshPerformed) {
          this.tokenProvider.invalidate();
          authRefreshPerformed = true;
          continue;
        }

        const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'), this.now(), this.config.retryMaxDelayMs);
        const retryableStatus = response.status === 429 || response.status >= 500;
        if (input.retrySafety === 'safe-read' && retryableStatus && retryCount < this.config.maxSafeRetries) {
          await this.sleep(this.retryDelay(retryCount, retryAfterMs));
          retryCount += 1;
          continue;
        }
        throw this.responseError(input, requestId, response.status, payload, retryCount, retryAfterMs);
      } catch (error) {
        if (error instanceof UpsConnectorError) throw error;
        const category: UpsErrorCategory = isAbortError(error) ? 'timeout' : 'network';
        if (input.retrySafety === 'safe-read' && retryCount < this.config.maxSafeRetries) {
          await this.sleep(this.retryDelay(retryCount));
          retryCount += 1;
          continue;
        }
        throw new UpsConnectorError({
          ok: false,
          carrier: 'ups',
          operation: input.operation,
          requestId,
          status: 503,
          error: {
            category,
            code: category === 'timeout' ? 'UPS_TIMEOUT' : 'UPS_NETWORK_ERROR',
            message: safeMessage(category),
            retryable: true,
            automaticRetryCount: retryCount,
            outcomeUnknown: input.retrySafety === 'unsafe-write',
          },
        });
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  private responseError(
    input: UpsRequest,
    requestId: string,
    status: number,
    payload: unknown,
    retryCount: number,
    retryAfterMs?: number,
  ): UpsConnectorError {
    const upstreamErrors = extractUpstreamErrors(payload);
    const category = errorCategory(status);
    return new UpsConnectorError({
      ok: false,
      carrier: 'ups',
      operation: input.operation,
      requestId,
      status,
      error: {
        category,
        code: upstreamErrors[0]?.code || fallbackCode(status),
        message: upstreamErrors[0]?.message || safeMessage(category),
        retryable: status === 429 || status >= 500,
        automaticRetryCount: retryCount,
        outcomeUnknown: input.retrySafety === 'unsafe-write' && status >= 500,
        ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
        ...(upstreamErrors.length > 0 ? { upstreamErrors } : {}),
      },
    });
  }
}

export function createUpsConnectorFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  dependencies: UpsConnectorDependencies = {},
): UpsConnector {
  const required = [
    'HEXASHIP_UPS_BASE_URL',
    'HEXASHIP_UPS_CLIENT_ID',
    'HEXASHIP_UPS_CLIENT_SECRET',
    'HEXASHIP_UPS_ACCOUNT_NUMBER',
  ] as const;
  const missingKeys = required.filter(key => !nonEmpty(env[key]));
  if (missingKeys.length > 0) {
    throw new UpsConfigurationError('UPS connector credentials are not configured.', [...missingKeys]);
  }

  const baseUrl = normalizeBaseUrl(nonEmpty(env.HEXASHIP_UPS_BASE_URL));
  const allowedOfficialBase = baseUrl === SANDBOX_BASE_URL || baseUrl === PRODUCTION_BASE_URL;
  if (!allowedOfficialBase && env.HEXASHIP_UPS_ALLOW_CUSTOM_BASE_URL !== 'true') {
    throw new UpsConfigurationError('Custom UPS base URLs are disabled.');
  }
  if (baseUrl === PRODUCTION_BASE_URL && env.HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED !== 'true') {
    throw new UpsConfigurationError('UPS production traffic is disabled.');
  }
  const accountNumber = nonEmpty(env.HEXASHIP_UPS_ACCOUNT_NUMBER).toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(accountNumber)) {
    throw new UpsConfigurationError('UPS account number must contain six letters or digits.');
  }

  return new UpsConnector({
    baseUrl,
    clientId: nonEmpty(env.HEXASHIP_UPS_CLIENT_ID),
    clientSecret: nonEmpty(env.HEXASHIP_UPS_CLIENT_SECRET),
    accountNumber,
    transactionSource: nonEmpty(env.HEXASHIP_UPS_TRANSACTION_SOURCE) || 'veygrit-ship',
    apiVersion: nonEmpty(env.HEXASHIP_UPS_API_VERSION) || 'v2409',
    timeoutMs: parseInteger(env.HEXASHIP_UPS_TIMEOUT_MS, 10_000, 1_000, 60_000),
    maxSafeRetries: parseInteger(env.HEXASHIP_UPS_MAX_SAFE_RETRIES, 3, 0, 5),
    retryBaseDelayMs: parseInteger(env.HEXASHIP_UPS_RETRY_BASE_DELAY_MS, 250, 10, 10_000),
    retryMaxDelayMs: parseInteger(env.HEXASHIP_UPS_RETRY_MAX_DELAY_MS, 30_000, 100, 60_000),
    tokenExpirySkewMs: parseInteger(env.HEXASHIP_UPS_TOKEN_EXPIRY_SKEW_MS, 60_000, 1_000, 300_000),
  }, dependencies);
}
