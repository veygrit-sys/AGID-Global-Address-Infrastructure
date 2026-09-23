import { randomUUID } from 'node:crypto';

export const ROYAL_MAIL_CONNECTOR_VERSION = 'veygrit-ship-royal-mail-shipping-v2-v0.1' as const;

export type RoyalMailOperation = 'shipment' | 'void' | 'tracking' | 'label' | 'manifest';
export type RoyalMailConnectorConfig = {
  environment: 'sandbox' | 'production';
  /** Resolve both values from a server-side secret provider only. */
  clientId: string;
  clientSecret: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
};
export type RoyalMailConnectorDependencies = {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};
export type RoyalMailSuccess = {
  carrier: 'royal_mail';
  operation: RoyalMailOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};
export type RoyalMailCommonError = {
  carrier: 'royal_mail';
  operation: RoyalMailOperation;
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class RoyalMailConnectorError extends Error {
  constructor(readonly common: RoyalMailCommonError) {
    super(common.message);
    this.name = 'RoyalMailConnectorError';
  }
}

type RequestSpec = {
  operation: RoyalMailOperation;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  safeToRetry: boolean;
  tracking?: boolean;
  accept?: string;
};

const SANDBOX_SHIPPING_URL = 'https://pp.api.royalmail.net/shipping/v2';
const PRODUCTION_SHIPPING_URL = 'https://api.royalmail.net/shipping/v2';
const SANDBOX_TRACKING_URL = 'https://pp.api.royalmail.net/mailpieces/v2';
const PRODUCTION_TRACKING_URL = 'https://api.royalmail.net/mailpieces/v2';

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Royal Mail configuration is missing ${name}.`);
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

function upstreamError(payload: unknown, fallbackCode: string): { code: string; message: string } {
  if (!payload || typeof payload !== 'object') return { code: fallbackCode, message: 'Royal Mail rejected the request.' };
  const record = payload as Record<string, unknown>;
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const first = errors[0] && typeof errors[0] === 'object' ? errors[0] as Record<string, unknown> : record;
  return {
    code: typeof first.errorCode === 'string' ? first.errorCode : typeof first.code === 'string' ? first.code : fallbackCode,
    message: typeof first.errorDescription === 'string' ? first.errorDescription : typeof first.message === 'string' ? first.message : 'Royal Mail rejected the request.',
  };
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export class RoyalMailConnector {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly shippingUrl: string;
  private readonly trackingUrl: string;
  private readonly config: Required<RoyalMailConnectorConfig>;

  constructor(config: RoyalMailConnectorConfig, dependencies: RoyalMailConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      clientId: required(config.clientId, 'clientId'),
      clientSecret: required(config.clientSecret, 'clientSecret'),
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
    };
    this.shippingUrl = config.environment === 'sandbox' ? SANDBOX_SHIPPING_URL : PRODUCTION_SHIPPING_URL;
    this.trackingUrl = config.environment === 'sandbox' ? SANDBOX_TRACKING_URL : PRODUCTION_TRACKING_URL;
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  createShipment(payload: Record<string, unknown>): Promise<RoyalMailSuccess> {
    return this.request({ operation: 'shipment', method: 'POST', path: '/shipments', body: payload, safeToRetry: false });
  }

  cancelShipment(shipmentNumber: string): Promise<RoyalMailSuccess> {
    if (!shipmentNumber.trim()) throw new TypeError('Royal Mail shipmentNumber is required.');
    return this.request({ operation: 'void', method: 'DELETE', path: `/${encodeURIComponent(shipmentNumber.trim())}`, safeToRetry: false });
  }

  getLabel(shipmentNumber: string, payload: Record<string, unknown> = {}): Promise<RoyalMailSuccess> {
    if (!shipmentNumber.trim()) throw new TypeError('Royal Mail shipmentNumber is required.');
    return this.request({ operation: 'label', method: 'PUT', path: `/${encodeURIComponent(shipmentNumber.trim())}/label`, body: payload, safeToRetry: false, accept: 'application/pdf' });
  }

  createManifest(payload: Record<string, unknown>): Promise<RoyalMailSuccess> {
    return this.request({ operation: 'manifest', method: 'POST', path: '/manifest', body: payload, safeToRetry: false });
  }

  track(mailPieceId: string): Promise<RoyalMailSuccess> {
    if (!mailPieceId.trim()) throw new TypeError('Royal Mail mailPieceId is required.');
    return this.request({ operation: 'tracking', method: 'GET', path: `/${encodeURIComponent(mailPieceId.trim())}/events`, safeToRetry: true, tracking: true });
  }

  private async request(spec: RequestSpec): Promise<RoyalMailSuccess> {
    const requestId = this.requestId();
    const baseUrl = spec.tracking ? this.trackingUrl : this.shippingUrl;
    let attempt = 0;
    while (true) {
      try {
        const response = await this.fetchWithTimeout(`${baseUrl}${spec.path}`, {
          method: spec.method,
          headers: {
            accept: spec.accept ?? 'application/json',
            'content-type': 'application/json',
            'x-ibm-client-id': this.config.clientId,
            'x-ibm-client-secret': this.config.clientSecret,
            'x-request-id': requestId,
          },
          body: spec.body === undefined ? undefined : JSON.stringify(spec.body),
        });
        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.includes('json') ? json(await response.text()) : { contentType, body: new Uint8Array(await response.arrayBuffer()) };
        if (response.ok) return { carrier: 'royal_mail', operation: spec.operation, requestId, status: response.status, data: payload, retryable: false, outcomeUnknown: false };
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries && (response.status === 429 || response.status >= 500);
        if (canRetry) { attempt += 1; await this.sleep(retryAfter(response) ?? attempt * 250); continue; }
        const upstream = upstreamError(payload, `ROYAL_MAIL_HTTP_${response.status}`);
        throw new RoyalMailConnectorError({ carrier: 'royal_mail', operation: spec.operation, requestId, status: response.status, retryable: response.status === 429 || response.status >= 500, outcomeUnknown: false, code: upstream.code, message: upstream.message, retryAfterMs: retryAfter(response) });
      } catch (error) {
        if (error instanceof RoyalMailConnectorError) throw error;
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries;
        if (canRetry) { attempt += 1; await this.sleep(attempt * 250); continue; }
        throw new RoyalMailConnectorError({ carrier: 'royal_mail', operation: spec.operation, requestId, status: 0, retryable: true, outcomeUnknown: !spec.safeToRetry, code: abortError(error) ? 'ROYAL_MAIL_TIMEOUT' : 'ROYAL_MAIL_NETWORK', message: 'Royal Mail could not be reached.' });
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
