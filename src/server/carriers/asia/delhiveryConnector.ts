import { randomUUID } from 'node:crypto';

export const DELHIVERY_CONNECTOR_VERSION = 'veygrit-ship-delhivery-b2c-v1-v0.1' as const;

export type DelhiveryOperation =
  | 'address_validation'
  | 'rate'
  | 'shipment'
  | 'tracking'
  | 'label'
  | 'pickup'
  | 'return'
  | 'ndr'
  | 'webhook'
  | 'document';
export type DelhiveryExtensionRoute = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  queryPayload?: boolean;
  bodyEncoding?: 'json' | 'form';
  safeToRetry: boolean;
};
export type DelhiveryConnectorConfig = {
  environment: 'sandbox' | 'production';
  token: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
  /** Routes disclosed by the authenticated Delhivery developer portal. */
  routes?: Partial<Record<'document' | 'pickup' | 'return' | 'ndr' | 'webhook', DelhiveryExtensionRoute>>;
};
export type DelhiveryConnectorDependencies = {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};
export type DelhiverySuccess = {
  carrier: 'delhivery';
  operation: DelhiveryOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};
export type DelhiveryCommonError = {
  carrier: 'delhivery';
  operation: DelhiveryOperation;
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class DelhiveryConnectorError extends Error {
  constructor(readonly common: DelhiveryCommonError) {
    super(common.message);
    this.name = 'DelhiveryConnectorError';
  }
}

type RequestSpec = {
  operation: DelhiveryOperation;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: BodyInit;
  contentType?: string;
  safeToRetry: boolean;
};

const STAGING_URL = 'https://staging-express.delhivery.com';
const PRODUCTION_URL = 'https://track.delhivery.com';
const STAGING_LABEL_URL = 'https://express-dev-test.delhivery.com';

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Delhivery configuration is missing ${name}.`);
  return value.trim();
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function parseJson(text: string): unknown {
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return {}; }
}

function errorDetails(payload: unknown, fallbackCode: string): { code: string; message: string } {
  if (!payload || typeof payload !== 'object') {
    return { code: fallbackCode, message: 'Delhivery rejected the request.' };
  }
  const record = payload as Record<string, unknown>;
  const nestedError = record.error && typeof record.error === 'object'
    ? record.error as Record<string, unknown>
    : undefined;
  return {
    code: typeof record.code === 'string'
      ? record.code
      : typeof nestedError?.code === 'string'
        ? nestedError.code
        : fallbackCode,
    message: typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : typeof nestedError?.message === 'string'
          ? nestedError.message
          : 'Delhivery rejected the request.',
  };
}

function queryString(values: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(values)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) => params.set(key, String(value)));
  return params.toString();
}

export class DelhiveryConnector {
  private readonly baseUrl: string;
  private readonly labelBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly config: Required<DelhiveryConnectorConfig>;

  constructor(config: DelhiveryConnectorConfig, dependencies: DelhiveryConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      token: required(config.token, 'token'),
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
      routes: config.routes ?? {},
    };
    this.baseUrl = config.environment === 'sandbox' ? STAGING_URL : PRODUCTION_URL;
    this.labelBaseUrl = config.environment === 'sandbox' ? STAGING_LABEL_URL : PRODUCTION_URL;
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  createShipment(payload: Record<string, unknown>): Promise<DelhiverySuccess> {
    const body = new URLSearchParams({
      format: 'json',
      data: JSON.stringify(payload),
    }).toString();
    return this.request({
      operation: 'shipment',
      method: 'POST',
      url: `${this.baseUrl}/api/cmu/create.json`,
      body,
      contentType: 'application/x-www-form-urlencoded',
      safeToRetry: false,
    });
  }

  getRates(query: Record<string, string | number | boolean | undefined>): Promise<DelhiverySuccess> {
    return this.request({
      operation: 'rate',
      method: 'GET',
      url: `${this.baseUrl}/api/kinko/v1/invoice/charges/.json?${queryString(query)}`,
      safeToRetry: true,
    });
  }

  track(waybill: string, referenceId?: string): Promise<DelhiverySuccess> {
    if (!waybill.trim()) throw new TypeError('Delhivery waybill is required.');
    return this.request({
      operation: 'tracking',
      method: 'GET',
      url: `${this.baseUrl}/api/v1/packages/json/?${queryString({
        waybill: waybill.trim(),
        ref_ids: referenceId?.trim() || undefined,
      })}`,
      safeToRetry: true,
    });
  }

  getLabel(waybill: string): Promise<DelhiverySuccess> {
    if (!waybill.trim()) throw new TypeError('Delhivery waybill is required.');
    return this.request({
      operation: 'label',
      method: 'GET',
      url: `${this.labelBaseUrl}/api/p/packing_slip?${queryString({ wbns: waybill.trim(), pdf: 'True' })}`,
      safeToRetry: true,
    });
  }

  checkServiceability(query: Record<string, string | number | boolean | undefined>): Promise<DelhiverySuccess> {
    return this.request({
      operation: 'address_validation',
      method: 'GET',
      url: `${this.baseUrl}/c/api/pin-codes/json/?${queryString(query)}`,
      safeToRetry: true,
    });
  }

  fetchWaybill(payload: Record<string, unknown>): Promise<DelhiverySuccess> {
    return this.extensionRequest('document', payload);
  }

  createPickup(payload: Record<string, unknown>): Promise<DelhiverySuccess> {
    return this.extensionRequest('pickup', payload);
  }

  createReturn(payload: Record<string, unknown>): Promise<DelhiverySuccess> {
    return this.extensionRequest('return', payload);
  }

  updateNdr(payload: Record<string, unknown>): Promise<DelhiverySuccess> {
    return this.extensionRequest('ndr', payload);
  }

  configureWebhook(payload: Record<string, unknown>): Promise<DelhiverySuccess> {
    return this.extensionRequest('webhook', payload);
  }

  private extensionRequest(
    operation: 'document' | 'pickup' | 'return' | 'ndr' | 'webhook',
    source: Record<string, unknown>,
  ): Promise<DelhiverySuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`Delhivery ${operation} route is not enabled for this account contract.`);
    const payload = { ...source };
    let path = route.path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, name: string) => {
      const value = payload[name];
      if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError(`Delhivery route requires ${name}.`);
      delete payload[name];
      return encodeURIComponent(String(value));
    });
    let body: BodyInit | undefined;
    if (route.queryPayload || route.method === 'GET') {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) query.set(key, String(value));
      }
      if (query.size) path += `${path.includes('?') ? '&' : '?'}${query}`;
    } else if (route.bodyEncoding === 'form') {
      body = new URLSearchParams(Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]),
      )).toString();
    } else {
      body = JSON.stringify(payload);
    }
    if (/^http:/i.test(path)) throw new Error('Delhivery contract routes must use HTTPS.');
    const url = path.startsWith('https://') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    return this.request({
      operation,
      method: route.method,
      url,
      body,
      contentType: body === undefined
        ? undefined
        : route.bodyEncoding === 'form' ? 'application/x-www-form-urlencoded' : 'application/json',
      safeToRetry: route.safeToRetry,
    });
  }

  private async request(spec: RequestSpec): Promise<DelhiverySuccess> {
    const requestId = this.requestId();
    let attempt = 0;
    while (true) {
      try {
        const response = await this.fetchWithTimeout(spec.url, {
          method: spec.method,
          headers: {
            accept: spec.operation === 'label' ? 'application/pdf, application/json' : 'application/json',
            authorization: `Token ${this.config.token}`,
            ...(spec.contentType ? { 'content-type': spec.contentType } : {}),
            'x-request-id': requestId,
          },
          body: spec.body,
        });
        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.toLowerCase().includes('application/pdf')
          ? { contentType, bytes: new Uint8Array(await response.arrayBuffer()) }
          : parseJson(await response.text());
        if (response.ok) {
          return {
            carrier: 'delhivery',
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
        const upstream = errorDetails(payload, `DELHIVERY_HTTP_${response.status}`);
        throw new DelhiveryConnectorError({
          carrier: 'delhivery',
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
        if (error instanceof DelhiveryConnectorError) throw error;
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries;
        if (canRetry) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new DelhiveryConnectorError({
          carrier: 'delhivery',
          operation: spec.operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !spec.safeToRetry,
          code: abortError(error) ? 'DELHIVERY_TIMEOUT' : 'DELHIVERY_NETWORK',
          message: spec.safeToRetry
            ? 'Delhivery could not be reached.'
            : 'Delhivery could not be reached and the shipment result is unknown.',
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
