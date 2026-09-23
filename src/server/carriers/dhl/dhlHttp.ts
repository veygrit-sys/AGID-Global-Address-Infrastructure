import { randomUUID } from 'node:crypto';

export type DhlAdapterId = 'mydhl-express' | 'ecommerce-americas-v4';
export type DhlOperation = 'oauth' | 'products' | 'shipment' | 'manifest_create' | 'manifest_get' | 'return_label' | 'void' | 'tracking';
export type DhlRetrySafety = 'safe-read' | 'unsafe-write';
export type DhlErrorCategory = 'authentication' | 'validation' | 'rate_limited' | 'not_found' | 'timeout' | 'network' | 'upstream' | 'unsupported';

export type DhlCommonError = {
  ok: false;
  carrier: 'dhl';
  adapter: DhlAdapterId;
  operation: DhlOperation;
  requestId: string;
  status: number;
  error: {
    category: DhlErrorCategory;
    code: string;
    message: string;
    retryable: boolean;
    automaticRetryCount: number;
    outcomeUnknown: boolean;
    retryAfterMs?: number;
    invalidParams?: Array<{ name?: string; path?: string; reason: string }>;
  };
};

export type DhlSuccess<T = unknown> = {
  ok: true;
  carrier: 'dhl';
  adapter: DhlAdapterId;
  operation: Exclude<DhlOperation, 'oauth'>;
  requestId: string;
  status: number;
  automaticRetryCount: number;
  data: T;
};

export class DhlAdapterError extends Error {
  readonly common: DhlCommonError;
  constructor(common: DhlCommonError) {
    super(common.error.message);
    this.name = 'DhlAdapterError';
    this.common = common;
  }
}

export class DhlConfigurationError extends Error {
  readonly missingKeys: string[];
  constructor(message: string, missingKeys: string[] = []) {
    super(message);
    this.name = 'DhlConfigurationError';
    this.missingKeys = missingKeys;
  }
}

export type DhlHttpDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  random?: () => number;
  requestId?: () => string;
};

export type DhlHttpConfig = {
  adapter: DhlAdapterId;
  baseUrl: string;
  authHeader: () => Promise<string>;
  invalidateAuth?: () => void;
  timeoutMs?: number;
  maxSafeRetries?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  userAgent?: string;
};

type RequestInput = {
  operation: Exclude<DhlOperation, 'oauth'>;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  retrySafety: DhlRetrySafety;
};

export function normalizeDhlBaseUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new DhlConfigurationError('DHL base URL must use HTTP or HTTPS.');
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

export function dhlJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('DHL payload must be a JSON object.');
  return value as Record<string, unknown>;
}

export function parseDhlInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function parseRetryAfter(value: string | null, now: number, max: number): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(max, Math.ceil(seconds * 1000));
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.min(max, Math.max(0, date - now)) : undefined;
}

function category(status: number): DhlErrorCategory {
  if (status === 401 || status === 403) return 'authentication';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 400 && status < 500) return 'validation';
  return 'upstream';
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) : '';
}

function safeMessage(value: DhlErrorCategory): string {
  if (value === 'authentication') return 'DHL authentication failed.';
  if (value === 'not_found') return 'The requested DHL resource was not found.';
  if (value === 'rate_limited') return 'DHL rate limit was reached.';
  if (value === 'validation') return 'DHL rejected the request.';
  if (value === 'timeout') return 'DHL did not respond before the timeout.';
  if (value === 'network') return 'DHL could not be reached.';
  if (value === 'unsupported') return 'This DHL operation is not supported by the selected adapter.';
  return 'DHL is temporarily unavailable.';
}

function codeFromType(type: unknown): string {
  const value = text(type);
  return value.split('/').pop() || '';
}

async function responseJson(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return {};
  try { return JSON.parse(raw) as unknown; } catch { return {}; }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function parseErrorPayload(payload: unknown, status: number): {
  code: string;
  message: string;
  invalidParams?: Array<{ name?: string; path?: string; reason: string }>;
} {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const code = codeFromType(record.type) || text(record.status) || text(record.code) || `DHL_${status}`;
  const message = text(record.title) || text(record.message) || text(record.detail) || safeMessage(category(status));
  const invalidParams = Array.isArray(record.invalidParams) ? record.invalidParams.flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const item = value as Record<string, unknown>;
    const reason = text(item.reason);
    if (!reason) return [];
    return [{ ...(text(item.name) ? { name: text(item.name) } : {}), ...(text(item.path) ? { path: text(item.path) } : {}), reason }];
  }).slice(0, 20) : undefined;
  return { code, message, ...(invalidParams?.length ? { invalidParams } : {}) };
}

export class DhlHttpClient {
  private readonly config: Required<Omit<DhlHttpConfig, 'invalidateAuth'>> & Pick<DhlHttpConfig, 'invalidateAuth'>;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly random: () => number;
  private readonly requestId: () => string;

  constructor(config: DhlHttpConfig, dependencies: DhlHttpDependencies = {}) {
    this.config = {
      ...config,
      baseUrl: normalizeDhlBaseUrl(config.baseUrl),
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 3,
      retryBaseDelayMs: config.retryBaseDelayMs ?? 250,
      retryMaxDelayMs: config.retryMaxDelayMs ?? 30_000,
      userAgent: config.userAgent ?? 'Veygrit-ship/0.1',
    };
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.random = dependencies.random ?? Math.random;
    this.requestId = dependencies.requestId ?? (() => randomUUID());
  }

  async request<T = unknown>(input: RequestInput): Promise<DhlSuccess<T>> {
    const requestId = this.requestId();
    let retryCount = 0;
    let authRefreshPerformed = false;
    while (true) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
      try {
        const authorization = await this.config.authHeader();
        const response = await this.fetchImpl(`${this.config.baseUrl}${input.path}`, {
          method: input.method,
          headers: {
            accept: 'application/json',
            authorization,
            'content-type': 'application/json',
            'user-agent': this.config.userAgent,
            'message-reference': requestId,
          },
          ...(input.body ? { body: JSON.stringify(input.body) } : {}),
          signal: controller.signal,
        });
        const payload = await responseJson(response);
        if (response.ok) return { ok: true, carrier: 'dhl', adapter: this.config.adapter, operation: input.operation, requestId, status: response.status, automaticRetryCount: retryCount, data: payload as T };
        if (response.status === 401 && this.config.invalidateAuth && !authRefreshPerformed) {
          this.config.invalidateAuth();
          authRefreshPerformed = true;
          continue;
        }
        const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'), this.now(), this.config.retryMaxDelayMs);
        const retryable = response.status === 429 || response.status >= 500;
        if (input.retrySafety === 'safe-read' && retryable && retryCount < this.config.maxSafeRetries) {
          await this.sleep(this.delay(retryCount, retryAfterMs));
          retryCount += 1;
          continue;
        }
        throw this.httpError(input, requestId, response.status, payload, retryCount, retryAfterMs);
      } catch (error) {
        if (error instanceof DhlAdapterError) throw error;
        const errorCategory: DhlErrorCategory = isAbort(error) ? 'timeout' : 'network';
        if (input.retrySafety === 'safe-read' && retryCount < this.config.maxSafeRetries) {
          await this.sleep(this.delay(retryCount));
          retryCount += 1;
          continue;
        }
        throw new DhlAdapterError({
          ok: false, carrier: 'dhl', adapter: this.config.adapter, operation: input.operation, requestId, status: 503,
          error: {
            category: errorCategory,
            code: errorCategory === 'timeout' ? 'DHL_TIMEOUT' : 'DHL_NETWORK_ERROR',
            message: safeMessage(errorCategory),
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

  private delay(attempt: number, retryAfterMs?: number): number {
    if (retryAfterMs !== undefined) return retryAfterMs;
    const base = Math.min(this.config.retryMaxDelayMs, this.config.retryBaseDelayMs * (2 ** attempt));
    return Math.min(this.config.retryMaxDelayMs, Math.ceil(base * (0.8 + this.random() * 0.4)));
  }

  private httpError(input: RequestInput, requestId: string, status: number, payload: unknown, retryCount: number, retryAfterMs?: number): DhlAdapterError {
    const parsed = parseErrorPayload(payload, status);
    return new DhlAdapterError({
      ok: false, carrier: 'dhl', adapter: this.config.adapter, operation: input.operation, requestId, status,
      error: {
        category: category(status), code: parsed.code, message: parsed.message,
        retryable: status === 429 || status >= 500,
        automaticRetryCount: retryCount,
        outcomeUnknown: input.retrySafety === 'unsafe-write' && status >= 500,
        ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
        ...(parsed.invalidParams ? { invalidParams: parsed.invalidParams } : {}),
      },
    });
  }
}

export function unsupportedDhlOperation(adapter: DhlAdapterId, operation: DhlOperation, code: string, message: string): never {
  throw new DhlAdapterError({
    ok: false, carrier: 'dhl', adapter, operation, requestId: randomUUID(), status: 422,
    error: { category: 'unsupported', code, message, retryable: false, automaticRetryCount: 0, outcomeUnknown: false },
  });
}
