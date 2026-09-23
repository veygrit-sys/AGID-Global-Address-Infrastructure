import { createHash, randomUUID } from 'node:crypto';

export const FOUR_PX_CONNECTOR_VERSION = 'veygrit-ship-four-px-openapi-v1-v0.1' as const;

export type FourPxOperation = 'rate' | 'shipment' | 'void' | 'tracking' | 'label';
export type FourPxConnectorConfig = {
  environment: 'sandbox' | 'production';
  appKey: string;
  appSecret: string;
  /** Required for software-provider OAuth apps; direct merchant apps may omit it. */
  accessToken?: string;
  language?: 'cn' | 'en';
  apiVersion?: string;
  sandboxBaseUrl?: string;
  productionBaseUrl?: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
};
export type FourPxConnectorDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};
export type FourPxSuccess = {
  carrier: 'four_px';
  operation: FourPxOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};
export type FourPxCommonError = {
  carrier: 'four_px';
  operation: FourPxOperation;
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class FourPxConnectorError extends Error {
  constructor(readonly common: FourPxCommonError) {
    super(common.message);
    this.name = 'FourPxConnectorError';
  }
}

type FourPxMethod =
  | 'com.css.price_calculator'
  | 'ds.xms.order.create'
  | 'ds.xms.order.cancel'
  | 'ds.xms.label.get'
  | 'tr.order.tracking.get';

type RequestSpec = {
  operation: FourPxOperation;
  method: FourPxMethod;
  payload: Record<string, unknown>;
  safeToRetry: boolean;
};

const SANDBOX_URL = 'https://open-test.4px.com/router/api/service';
const PRODUCTION_URL = 'https://open.4px.com/router/api/service';

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`4PX configuration is missing ${name}.`);
  return value.trim();
}

function httpsUrl(value: string, name: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error(`4PX ${name} must use HTTPS.`);
  return url.toString();
}

export function createFourPxSignature(
  parameters: Readonly<Record<string, string>>,
  compactBody: string,
  appSecret: string,
): string {
  const canonical = Object.entries(parameters)
    .filter(([key]) => key !== 'access_token' && key !== 'language' && key !== 'sign')
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => `${key}${value}`)
    .join('');
  return createHash('md5').update(`${canonical}${compactBody}${appSecret}`, 'utf8').digest('hex');
}

function parseJson(text: string): unknown {
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return {}; }
}

function envelope(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function errorDetails(payload: Record<string, unknown>): { code: string; message: string } {
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  const first = errors[0] && typeof errors[0] === 'object' ? errors[0] as Record<string, unknown> : {};
  return {
    code: typeof first.code === 'string' || typeof first.code === 'number'
      ? String(first.code)
      : 'FOUR_PX_REJECTED',
    message: typeof first.msg === 'string' && first.msg
      ? first.msg
      : typeof first.message === 'string' && first.message
        ? first.message
        : typeof payload.msg === 'string' && payload.msg
          ? payload.msg
          : '4PX rejected the request.',
  };
}

export class FourPxConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly config: Required<Omit<FourPxConnectorConfig, 'accessToken' | 'sandboxBaseUrl' | 'productionBaseUrl'>>
    & Pick<FourPxConnectorConfig, 'accessToken' | 'sandboxBaseUrl' | 'productionBaseUrl'>;

  constructor(config: FourPxConnectorConfig, dependencies: FourPxConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      appKey: required(config.appKey, 'appKey'),
      appSecret: required(config.appSecret, 'appSecret'),
      accessToken: config.accessToken?.trim() || undefined,
      language: config.language ?? 'en',
      apiVersion: config.apiVersion?.trim() || '1.0',
      sandboxBaseUrl: config.sandboxBaseUrl,
      productionBaseUrl: config.productionBaseUrl,
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
    };
    const configuredUrl = config.environment === 'sandbox'
      ? config.sandboxBaseUrl ?? SANDBOX_URL
      : config.productionBaseUrl ?? PRODUCTION_URL;
    this.baseUrl = httpsUrl(configuredUrl, config.environment === 'sandbox' ? 'sandboxBaseUrl' : 'productionBaseUrl');
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  getRates(payload: Record<string, unknown>): Promise<FourPxSuccess> {
    return this.request({ operation: 'rate', method: 'com.css.price_calculator', payload, safeToRetry: true });
  }

  createOrder(payload: Record<string, unknown>): Promise<FourPxSuccess> {
    return this.request({ operation: 'shipment', method: 'ds.xms.order.create', payload, safeToRetry: false });
  }

  cancelOrder(payload: Record<string, unknown>): Promise<FourPxSuccess> {
    return this.request({ operation: 'void', method: 'ds.xms.order.cancel', payload, safeToRetry: false });
  }

  getLabel(payload: Record<string, unknown>): Promise<FourPxSuccess> {
    return this.request({ operation: 'label', method: 'ds.xms.label.get', payload, safeToRetry: true });
  }

  track(payload: Record<string, unknown>): Promise<FourPxSuccess> {
    return this.request({ operation: 'tracking', method: 'tr.order.tracking.get', payload, safeToRetry: true });
  }

  private async request(spec: RequestSpec): Promise<FourPxSuccess> {
    const requestId = this.requestId();
    let attempt = 0;
    while (true) {
      const compactBody = JSON.stringify(spec.payload);
      const parameters: Record<string, string> = {
        method: spec.method,
        app_key: this.config.appKey,
        v: this.config.apiVersion,
        timestamp: String(this.now()),
        format: 'json',
      };
      const sign = createFourPxSignature(parameters, compactBody, this.config.appSecret);
      const query = new URLSearchParams({
        ...parameters,
        sign,
        language: this.config.language,
        ...(this.config.accessToken ? { access_token: this.config.accessToken } : {}),
      });
      const url = new URL(this.baseUrl);
      url.search = query.toString();
      try {
        const response = await this.fetchWithTimeout(url.toString(), {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-request-id': requestId,
          },
          body: compactBody,
        });
        const payload = envelope(parseJson(await response.text()));
        const result = payload.result === undefined ? '' : String(payload.result);
        if (response.ok && (result === '1' || result === '2')) {
          return {
            carrier: 'four_px',
            operation: spec.operation,
            requestId,
            status: response.status,
            data: payload.data ?? payload,
            retryable: false,
            outcomeUnknown: false,
          };
        }
        const retryableStatus = response.status === 429 || response.status >= 500;
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries && retryableStatus;
        if (canRetry) {
          attempt += 1;
          await this.sleep(retryAfter(response) ?? attempt * 250);
          continue;
        }
        const upstream = errorDetails(payload);
        throw new FourPxConnectorError({
          carrier: 'four_px',
          operation: spec.operation,
          requestId,
          status: response.status,
          retryable: retryableStatus,
          outcomeUnknown: false,
          code: upstream.code,
          message: upstream.message,
          retryAfterMs: retryAfter(response),
        });
      } catch (error) {
        if (error instanceof FourPxConnectorError) throw error;
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries;
        if (canRetry) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new FourPxConnectorError({
          carrier: 'four_px',
          operation: spec.operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !spec.safeToRetry,
          code: abortError(error) ? 'FOUR_PX_TIMEOUT' : 'FOUR_PX_NETWORK',
          message: spec.safeToRetry
            ? '4PX could not be reached.'
            : '4PX could not be reached and the write result is unknown.',
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
