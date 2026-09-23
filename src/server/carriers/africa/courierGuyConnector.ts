import { randomUUID } from 'node:crypto';

export const COURIER_GUY_CONNECTOR_VERSION = 'veygrit-ship-courier-guy-v2-v0.1' as const;

export type CourierGuyOperation =
  | 'rate'
  | 'shipment'
  | 'return'
  | 'void'
  | 'tracking'
  | 'label'
  | 'pickup_point'
  | 'document';
export type CourierGuyConnectorConfig = {
  environment: 'sandbox' | 'production';
  apiKey: string;
  /**
   * The Courier Guy issues sandbox account details during onboarding. Keep a
   * sandbox host explicit instead of sending test payloads to production.
   */
  sandboxBaseUrl?: string;
  /** The Courier Guy Locker/PUDO is a service mode on the same connection. */
  pudoApiKey?: string;
  /** Production Locker/PUDO host is issued during onboarding. */
  pudoProductionBaseUrl?: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
};
export type CourierGuyConnectorDependencies = {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};
export type CourierGuySuccess = {
  carrier: 'courier_guy';
  operation: CourierGuyOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};
export type CourierGuyCommonError = {
  carrier: 'courier_guy';
  operation: CourierGuyOperation;
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class CourierGuyConnectorError extends Error {
  constructor(readonly common: CourierGuyCommonError) {
    super(common.message);
    this.name = 'CourierGuyConnectorError';
  }
}

type RequestSpec = {
  operation: CourierGuyOperation;
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: unknown;
  safeToRetry: boolean;
  baseUrl?: string;
  apiKey?: string;
};

const PRODUCTION_URL = 'https://api.portal.thecourierguy.co.za/v2';
const PUDO_SANDBOX_URL = 'https://api-sandbox.pudo.co.za';

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`The Courier Guy configuration is missing ${name}.`);
  return value.trim();
}

function explicitHttpsUrl(value: string | undefined, name: string): string {
  const normalized = required(value ?? '', name);
  const url = new URL(normalized);
  if (url.protocol !== 'https:') throw new Error(`The Courier Guy ${name} must use HTTPS.`);
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
    return { code: fallbackCode, message: 'The Courier Guy rejected the request.' };
  }
  const record = payload as Record<string, unknown>;
  return {
    code: typeof record.code === 'string'
      ? record.code
      : typeof record.error_code === 'string'
        ? record.error_code
        : fallbackCode,
    message: typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : 'The Courier Guy rejected the request.',
  };
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export class CourierGuyConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly config: Required<Omit<CourierGuyConnectorConfig, 'sandboxBaseUrl' | 'pudoApiKey' | 'pudoProductionBaseUrl'>>
    & Pick<CourierGuyConnectorConfig, 'sandboxBaseUrl' | 'pudoApiKey' | 'pudoProductionBaseUrl'>;

  constructor(config: CourierGuyConnectorConfig, dependencies: CourierGuyConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      apiKey: required(config.apiKey, 'apiKey'),
      sandboxBaseUrl: config.sandboxBaseUrl,
      pudoApiKey: config.pudoApiKey,
      pudoProductionBaseUrl: config.pudoProductionBaseUrl,
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
    };
    this.baseUrl = config.environment === 'sandbox'
      ? explicitHttpsUrl(config.sandboxBaseUrl, 'sandboxBaseUrl')
      : PRODUCTION_URL;
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  getRates(payload: Record<string, unknown>): Promise<CourierGuySuccess> {
    return this.request({ operation: 'rate', method: 'POST', path: '/rates', body: payload, safeToRetry: true });
  }

  createShipment(payload: Record<string, unknown>, operation: 'shipment' | 'return' = 'shipment'): Promise<CourierGuySuccess> {
    return this.request({ operation, method: 'POST', path: '/shipments', body: payload, safeToRetry: false });
  }

  track(trackingReference: string): Promise<CourierGuySuccess> {
    if (!trackingReference.trim()) throw new TypeError('The Courier Guy trackingReference is required.');
    return this.request({
      operation: 'tracking',
      method: 'GET',
      path: `/shipments?tracking_reference=${encodeURIComponent(trackingReference.trim())}`,
      safeToRetry: true,
    });
  }

  getLabel(shipmentId: string): Promise<CourierGuySuccess> {
    if (!shipmentId.trim()) throw new TypeError('The Courier Guy shipmentId is required.');
    return this.request({
      operation: 'label',
      method: 'GET',
      path: `/shipments/label?id=${encodeURIComponent(shipmentId.trim())}`,
      safeToRetry: true,
    });
  }

  getPudoRates(payload: Record<string, unknown>): Promise<CourierGuySuccess> {
    return this.pudoRequest({ operation: 'rate', method: 'POST', path: '/rates', body: payload, safeToRetry: true });
  }

  createPudoShipment(payload: Record<string, unknown>, operation: 'shipment' | 'return' = 'shipment'): Promise<CourierGuySuccess> {
    return this.pudoRequest({ operation, method: 'POST', path: '/shipments', body: payload, safeToRetry: false });
  }

  cancelPudoShipment(shipmentId: string, reason?: string): Promise<CourierGuySuccess> {
    if (!shipmentId.trim()) throw new TypeError('The Courier Guy Locker shipmentId is required.');
    return this.pudoRequest({
      operation: 'void',
      method: 'PUT',
      path: `/shipments/${encodeURIComponent(shipmentId.trim())}`,
      body: { status: 'cancelled', ...(reason ? { metaData: { tracking_info: { message: reason } } } : {}) },
      safeToRetry: false,
    });
  }

  trackPudoShipment(shipmentId: string): Promise<CourierGuySuccess> {
    if (!shipmentId.trim()) throw new TypeError('The Courier Guy Locker shipmentId is required.');
    return this.pudoRequest({
      operation: 'tracking',
      method: 'GET',
      path: `/tracking/shipments?include_parcels=false&id=${encodeURIComponent(shipmentId.trim())}`,
      safeToRetry: true,
    });
  }

  listPudoLockers(): Promise<CourierGuySuccess> {
    return this.pudoRequest({ operation: 'pickup_point', method: 'GET', path: '/lockers-data', safeToRetry: true });
  }

  getPudoLabel(shipmentId: string, kind: 'waybill' | 'sticker' = 'waybill'): Promise<CourierGuySuccess> {
    if (!shipmentId.trim()) throw new TypeError('The Courier Guy Locker shipmentId is required.');
    const apiKey = required(this.config.pudoApiKey ?? '', 'pudoApiKey');
    return this.pudoRequest({
      operation: 'label',
      method: 'GET',
      path: `/generate/${kind}/${encodeURIComponent(shipmentId.trim())}?api_key=${encodeURIComponent(apiKey)}`,
      safeToRetry: true,
    });
  }

  getPudoProofOfDelivery(shipmentId: string): Promise<CourierGuySuccess> {
    if (!shipmentId.trim()) throw new TypeError('The Courier Guy Locker shipmentId is required.');
    return this.pudoRequest({
      operation: 'document',
      method: 'GET',
      path: `/shipments/pod/images?shipment_id=${encodeURIComponent(shipmentId.trim())}`,
      safeToRetry: true,
    });
  }

  private pudoRequest(spec: RequestSpec): Promise<CourierGuySuccess> {
    const apiKey = required(this.config.pudoApiKey ?? '', 'pudoApiKey');
    const baseUrl = this.config.environment === 'sandbox'
      ? PUDO_SANDBOX_URL
      : explicitHttpsUrl(this.config.pudoProductionBaseUrl, 'pudoProductionBaseUrl');
    return this.request({ ...spec, baseUrl, apiKey });
  }

  private async request(spec: RequestSpec): Promise<CourierGuySuccess> {
    const requestId = this.requestId();
    let attempt = 0;
    while (true) {
      try {
        const response = await this.fetchWithTimeout(`${spec.baseUrl ?? this.baseUrl}${spec.path}`, {
          method: spec.method,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${spec.apiKey ?? this.config.apiKey}`,
            'x-request-id': requestId,
          },
          body: spec.body === undefined ? undefined : JSON.stringify(spec.body),
        });
        const payload = parseJson(await response.text());
        if (response.ok) {
          return {
            carrier: 'courier_guy',
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
        const upstream = errorDetails(payload, `COURIER_GUY_HTTP_${response.status}`);
        throw new CourierGuyConnectorError({
          carrier: 'courier_guy',
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
        if (error instanceof CourierGuyConnectorError) throw error;
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries;
        if (canRetry) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new CourierGuyConnectorError({
          carrier: 'courier_guy',
          operation: spec.operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !spec.safeToRetry,
          code: abortError(error) ? 'COURIER_GUY_TIMEOUT' : 'COURIER_GUY_NETWORK',
          message: spec.safeToRetry
            ? 'The Courier Guy could not be reached.'
            : 'The Courier Guy could not be reached and the shipment result is unknown.',
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
