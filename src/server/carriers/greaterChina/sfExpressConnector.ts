import { createHash, randomUUID } from 'node:crypto';

export const SF_EXPRESS_CONNECTOR_VERSION = 'veygrit-ship-sf-express-openapi-v2-v0.1' as const;

export type SfExpressOperation = 'rate' | 'shipment' | 'void' | 'tracking' | 'order_lookup';
export type SfExpressConnectorConfig = {
  environment: 'sandbox' | 'production';
  partnerId: string;
  checkword: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
};
export type SfExpressConnectorDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};
export type SfExpressSuccess = {
  carrier: 'sf_express';
  operation: SfExpressOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};
export type SfExpressCommonError = {
  carrier: 'sf_express';
  operation: SfExpressOperation;
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class SfExpressConnectorError extends Error {
  constructor(readonly common: SfExpressCommonError) {
    super(common.message);
    this.name = 'SfExpressConnectorError';
  }
}

type RequestSpec = {
  operation: SfExpressOperation;
  serviceCode:
    | 'EXP_RECE_CREATE_ORDER'
    | 'EXP_RECE_UPDATE_ORDER'
    | 'EXP_RECE_SEARCH_ORDER_RESP'
    | 'EXP_RECE_QUERY_SFWAYBILL'
    | 'EXP_RECE_SEARCH_ROUTES';
  payload: Record<string, unknown>;
  safeToRetry: boolean;
};

const SANDBOX_URL = 'https://sfapi-sbox.sf-express.com/std/service';
const PRODUCTION_URL = 'https://sfapi.sf-express.com/std/service';

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`SF Express configuration is missing ${name}.`);
  return value.trim();
}

/**
 * SF Express signs the form-encoded UTF-8 representation of
 * msgData + timestamp + checkword, then Base64-encodes the raw MD5 digest.
 */
export function createSfExpressMessageDigest(msgData: string, timestamp: string, checkword: string): string {
  const encoded = new URLSearchParams([['value', `${msgData}${timestamp}${checkword}`]])
    .toString()
    .slice('value='.length);
  return createHash('md5').update(encoded, 'utf8').digest('base64');
}

function parseJson(text: string): unknown {
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return {}; }
}

function parseApiResultData(value: unknown): unknown {
  if (typeof value !== 'string') return value ?? {};
  try { return JSON.parse(value) as unknown; } catch { return value; }
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
}

function abortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function envelope(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export class SfExpressConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly config: Required<SfExpressConnectorConfig>;

  constructor(config: SfExpressConnectorConfig, dependencies: SfExpressConnectorDependencies = {}) {
    this.config = {
      environment: config.environment,
      partnerId: required(config.partnerId, 'partnerId'),
      checkword: required(config.checkword, 'checkword'),
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 2,
    };
    this.baseUrl = config.environment === 'sandbox' ? SANDBOX_URL : PRODUCTION_URL;
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  createOrder(payload: Record<string, unknown>): Promise<SfExpressSuccess> {
    return this.request({
      operation: 'shipment',
      serviceCode: 'EXP_RECE_CREATE_ORDER',
      payload,
      safeToRetry: false,
    });
  }

  cancelOrder(payload: Record<string, unknown>): Promise<SfExpressSuccess> {
    return this.request({
      operation: 'void',
      serviceCode: 'EXP_RECE_UPDATE_ORDER',
      payload,
      safeToRetry: false,
    });
  }

  queryOrder(payload: Record<string, unknown>): Promise<SfExpressSuccess> {
    return this.request({
      operation: 'order_lookup',
      serviceCode: 'EXP_RECE_SEARCH_ORDER_RESP',
      payload,
      safeToRetry: true,
    });
  }

  getFreight(payload: Record<string, unknown>): Promise<SfExpressSuccess> {
    return this.request({
      operation: 'rate',
      serviceCode: 'EXP_RECE_QUERY_SFWAYBILL',
      payload,
      safeToRetry: true,
    });
  }

  track(payload: Record<string, unknown>): Promise<SfExpressSuccess> {
    return this.request({
      operation: 'tracking',
      serviceCode: 'EXP_RECE_SEARCH_ROUTES',
      payload,
      safeToRetry: true,
    });
  }

  private async request(spec: RequestSpec): Promise<SfExpressSuccess> {
    const requestId = this.requestId();
    let attempt = 0;
    while (true) {
      const timestamp = String(this.now());
      const msgData = JSON.stringify(spec.payload);
      const body = new URLSearchParams({
        partnerID: this.config.partnerId,
        requestID: requestId,
        serviceCode: spec.serviceCode,
        timestamp,
        msgDigest: createSfExpressMessageDigest(msgData, timestamp, this.config.checkword),
        msgData,
      });
      try {
        const response = await this.fetchWithTimeout(this.baseUrl, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'x-request-id': requestId,
          },
          body,
        });
        const payload = envelope(parseJson(await response.text()));
        const resultCode = typeof payload.apiResultCode === 'string' ? payload.apiResultCode : '';
        const accepted = response.ok && (!resultCode || resultCode === 'A1000');
        if (accepted) {
          return {
            carrier: 'sf_express',
            operation: spec.operation,
            requestId,
            status: response.status,
            data: parseApiResultData(payload.apiResultData ?? payload),
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
        throw new SfExpressConnectorError({
          carrier: 'sf_express',
          operation: spec.operation,
          requestId,
          status: response.status,
          retryable: retryableStatus,
          outcomeUnknown: false,
          code: resultCode || `SF_EXPRESS_HTTP_${response.status}`,
          message: typeof payload.apiErrorMsg === 'string' && payload.apiErrorMsg
            ? payload.apiErrorMsg
            : 'SF Express rejected the request.',
          retryAfterMs: retryAfter(response),
        });
      } catch (error) {
        if (error instanceof SfExpressConnectorError) throw error;
        const canRetry = spec.safeToRetry && attempt < this.config.maxSafeRetries;
        if (canRetry) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        throw new SfExpressConnectorError({
          carrier: 'sf_express',
          operation: spec.operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !spec.safeToRetry,
          code: abortError(error) ? 'SF_EXPRESS_TIMEOUT' : 'SF_EXPRESS_NETWORK',
          message: spec.safeToRetry
            ? 'SF Express could not be reached.'
            : 'SF Express could not be reached and the write result is unknown.',
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
