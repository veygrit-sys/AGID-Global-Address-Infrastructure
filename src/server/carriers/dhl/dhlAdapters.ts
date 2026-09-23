import { randomUUID } from 'node:crypto';

import {
  DhlAdapterError,
  DhlConfigurationError,
  DhlHttpClient,
  dhlJsonObject,
  normalizeDhlBaseUrl,
  parseDhlInteger,
  unsupportedDhlOperation,
  type DhlHttpDependencies,
  type DhlSuccess,
} from './dhlHttp';

export type DhlLabelFormat = 'ZPL' | 'PNG' | 'PDF';
export type DhlReturnLabelFormat = DhlLabelFormat | 'QR';

type CommonAdapterConfig = {
  baseUrl: string;
  timeoutMs?: number;
  maxSafeRetries?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
};

export type MyDhlExpressConfig = CommonAdapterConfig & {
  username: string;
  password: string;
  accountNumber: string;
};

export type DhlEcommerceConfig = CommonAdapterConfig & {
  clientId: string;
  clientSecret: string;
  pickupAccount: string;
  distributionCenter: string;
  tokenExpirySkewMs?: number;
};

function nonEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function assertCode(value: string, pattern: RegExp, kind: string): string {
  const normalized = value.trim().toUpperCase();
  if (!pattern.test(normalized)) throw new TypeError(`${kind} must be stored and supplied as a carrier product code.`);
  return normalized;
}

function identifier(value: string, name: string, maxLength = 50): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || !/^[A-Za-z0-9._:-]+$/.test(normalized)) throw new TypeError(`Invalid DHL ${name}.`);
  return normalized;
}

export class MyDhlExpressAdapter {
  readonly id = 'mydhl-express' as const;
  readonly accountNumber: string;
  private readonly http: DhlHttpClient;

  constructor(config: MyDhlExpressConfig, dependencies: DhlHttpDependencies = {}) {
    this.accountNumber = config.accountNumber;
    const auth = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;
    this.http = new DhlHttpClient({
      adapter: this.id,
      baseUrl: config.baseUrl,
      authHeader: async () => auth,
      timeoutMs: config.timeoutMs,
      maxSafeRetries: config.maxSafeRetries,
      retryBaseDelayMs: config.retryBaseDelayMs,
      retryMaxDelayMs: config.retryMaxDelayMs,
    }, dependencies);
  }

  createShipment(payload: unknown, productIdCode: string): Promise<DhlSuccess> {
    const productCode = assertCode(productIdCode, /^[A-Z0-9]{1,4}$/, 'MyDHL productCode');
    return this.http.request({
      operation: 'shipment', method: 'POST', path: '/shipments', retrySafety: 'unsafe-write',
      body: { ...dhlJsonObject(payload), productCode },
    });
  }

  createReturnShipment(payload: unknown, productIdCode: string): Promise<DhlSuccess> {
    const productCode = assertCode(productIdCode, /^[A-Z0-9]{1,4}$/, 'MyDHL return productCode');
    return this.http.request({
      operation: 'return_label', method: 'POST', path: '/shipments', retrySafety: 'unsafe-write',
      body: { ...dhlJsonObject(payload), productCode },
    });
  }

  track(shipmentTrackingNumber: string): Promise<DhlSuccess> {
    const tracking = identifier(shipmentTrackingNumber, 'Express tracking number', 35);
    return this.http.request({
      operation: 'tracking', method: 'GET', path: `/shipments/${encodeURIComponent(tracking)}/tracking`, retrySafety: 'safe-read',
    });
  }

  voidShipment(): never {
    return unsupportedDhlOperation(
      this.id,
      'void',
      'DHL_EXPRESS_VOID_NOT_AVAILABLE',
      'MyDHL Express REST 3.3.1 does not publish a shipment-void endpoint. Reconcile the shipment operationally with DHL Express.',
    );
  }
}

type EcomToken = { accessToken: string; expiresAt: number };

class DhlEcommerceTokenProvider {
  private readonly config: Required<Pick<DhlEcommerceConfig, 'baseUrl' | 'clientId' | 'clientSecret' | 'timeoutMs' | 'maxSafeRetries' | 'retryBaseDelayMs' | 'retryMaxDelayMs' | 'tokenExpirySkewMs'>>;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private cache?: EcomToken;
  private inFlight?: Promise<EcomToken>;

  constructor(config: DhlEcommerceConfig, dependencies: DhlHttpDependencies) {
    this.config = {
      baseUrl: normalizeDhlBaseUrl(config.baseUrl),
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      timeoutMs: config.timeoutMs ?? 10_000,
      maxSafeRetries: config.maxSafeRetries ?? 3,
      retryBaseDelayMs: config.retryBaseDelayMs ?? 250,
      retryMaxDelayMs: config.retryMaxDelayMs ?? 30_000,
      tokenExpirySkewMs: config.tokenExpirySkewMs ?? 900_000,
    };
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  }

  invalidate(): void { this.cache = undefined; }

  async getToken(): Promise<string> {
    if (this.cache && this.cache.expiresAt - this.config.tokenExpirySkewMs > this.now()) return this.cache.accessToken;
    this.inFlight ??= this.fetchToken().finally(() => { this.inFlight = undefined; });
    return (await this.inFlight).accessToken;
  }

  private async fetchToken(): Promise<EcomToken> {
    let retries = 0;
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
      try {
        const body = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        });
        const response = await this.fetchImpl(`${this.config.baseUrl}/auth/v4/accesstoken`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
          signal: controller.signal,
        });
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) as Record<string, unknown> : {};
        if (response.ok) {
          const accessToken = nonEmpty(data.access_token);
          const expiresIn = Number(data.expires_in);
          if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error('invalid-token-response');
          this.cache = { accessToken, expiresAt: this.now() + expiresIn * 1000 };
          return this.cache;
        }
        if ((response.status === 429 || response.status >= 500) && retries < this.config.maxSafeRetries) {
          await this.sleep(Math.min(this.config.retryMaxDelayMs, this.config.retryBaseDelayMs * (2 ** retries)));
          retries += 1;
          continue;
        }
        throw new DhlAdapterError({
          ok: false, carrier: 'dhl', adapter: 'ecommerce-americas-v4', operation: 'oauth', requestId: randomUUID(), status: response.status,
          error: { category: response.status === 429 ? 'rate_limited' : response.status >= 500 ? 'upstream' : 'authentication', code: `DHL_ECOMMERCE_OAUTH_${response.status}`, message: 'DHL eCommerce Americas authentication failed.', retryable: response.status === 429 || response.status >= 500, automaticRetryCount: retries, outcomeUnknown: false },
        });
      } catch (error) {
        if (error instanceof DhlAdapterError) throw error;
        if (retries < this.config.maxSafeRetries) {
          await this.sleep(Math.min(this.config.retryMaxDelayMs, this.config.retryBaseDelayMs * (2 ** retries)));
          retries += 1;
          continue;
        }
        throw new DhlAdapterError({
          ok: false, carrier: 'dhl', adapter: 'ecommerce-americas-v4', operation: 'oauth', requestId: randomUUID(), status: 503,
          error: { category: 'network', code: 'DHL_ECOMMERCE_OAUTH_NETWORK_ERROR', message: 'DHL eCommerce Americas authentication could not be completed.', retryable: true, automaticRetryCount: retries, outcomeUnknown: false },
        });
      } finally { clearTimeout(timer); }
    }
  }
}

export class DhlEcommerceAmericasV4Adapter {
  readonly id = 'ecommerce-americas-v4' as const;
  readonly pickupAccount: string;
  readonly distributionCenter: string;
  private readonly tokenProvider: DhlEcommerceTokenProvider;
  private readonly http: DhlHttpClient;

  constructor(config: DhlEcommerceConfig, dependencies: DhlHttpDependencies = {}) {
    this.pickupAccount = config.pickupAccount;
    this.distributionCenter = config.distributionCenter;
    this.tokenProvider = new DhlEcommerceTokenProvider(config, dependencies);
    this.http = new DhlHttpClient({
      adapter: this.id,
      baseUrl: config.baseUrl,
      authHeader: async () => `Bearer ${await this.tokenProvider.getToken()}`,
      invalidateAuth: () => this.tokenProvider.invalidate(),
      timeoutMs: config.timeoutMs,
      maxSafeRetries: config.maxSafeRetries,
      retryBaseDelayMs: config.retryBaseDelayMs,
      retryMaxDelayMs: config.retryMaxDelayMs,
    }, dependencies);
  }

  findProducts(payload: unknown): Promise<DhlSuccess> {
    return this.http.request({ operation: 'products', method: 'POST', path: '/shipping/v4/products', body: dhlJsonObject(payload), retrySafety: 'safe-read' });
  }

  createLabel(payload: unknown, productIdCode: string, format: DhlLabelFormat = 'PDF'): Promise<DhlSuccess> {
    const orderedProductId = assertCode(productIdCode, /^[A-Z]{3}$/, 'DHL eCommerce orderedProductId');
    return this.http.request({
      operation: 'shipment', method: 'POST', path: `/shipping/v4/label?format=${format}`, retrySafety: 'unsafe-write',
      body: { ...dhlJsonObject(payload), pickup: this.pickupAccount, distributionCenter: this.distributionCenter, orderedProductId },
    });
  }

  createManifest(payload: unknown): Promise<DhlSuccess> {
    const manifestPayload = dhlJsonObject(payload);
    const products = manifestPayload.products;
    if (products !== undefined) {
      if (!Array.isArray(products) || products.some(value => typeof value !== 'string' || !/^[A-Z]{3}$/.test(value))) {
        throw new TypeError('Manifest products must contain DHL eCommerce three-letter product codes, not names.');
      }
    }
    return this.http.request({
      operation: 'manifest_create', method: 'POST', path: '/shipping/v4/manifest', retrySafety: 'unsafe-write',
      body: { ...manifestPayload, pickup: this.pickupAccount },
    });
  }

  getManifest(requestId: string): Promise<DhlSuccess> {
    const normalized = identifier(requestId, 'manifest request ID');
    return this.http.request({
      operation: 'manifest_get', method: 'GET', path: `/shipping/v4/manifest/${encodeURIComponent(this.pickupAccount)}/${encodeURIComponent(normalized)}`, retrySafety: 'safe-read',
    });
  }

  createReturnLabel(payload: unknown, productIdCode: string, format: DhlReturnLabelFormat = 'PDF'): Promise<DhlSuccess> {
    const orderedProductId = assertCode(productIdCode, /^[A-Z]{3}$/, 'DHL eCommerce return orderedProductId');
    return this.http.request({
      operation: 'return_label', method: 'POST', path: `/returns/v4/label?format=${format}`, retrySafety: 'unsafe-write',
      body: { ...dhlJsonObject(payload), pickup: this.pickupAccount, orderedProductId },
    });
  }

  voidLabel(packageId: string, dhlPackageId?: string): Promise<DhlSuccess> {
    const query = new URLSearchParams({ packageId: identifier(packageId, 'package ID', 30) });
    if (dhlPackageId) query.set('dhlPackageId', identifier(dhlPackageId, 'DHL package ID', 30));
    return this.http.request({
      operation: 'void', method: 'DELETE', path: `/shipping/v4/label/${encodeURIComponent(this.pickupAccount)}?${query.toString()}`, retrySafety: 'unsafe-write',
    });
  }
}

function commonConfig(env: NodeJS.ProcessEnv): Pick<CommonAdapterConfig, 'timeoutMs' | 'maxSafeRetries' | 'retryBaseDelayMs' | 'retryMaxDelayMs'> {
  return {
    timeoutMs: parseDhlInteger(env.HEXASHIP_DHL_TIMEOUT_MS, 10_000, 1_000, 60_000),
    maxSafeRetries: parseDhlInteger(env.HEXASHIP_DHL_MAX_SAFE_RETRIES, 3, 0, 5),
    retryBaseDelayMs: parseDhlInteger(env.HEXASHIP_DHL_RETRY_BASE_DELAY_MS, 250, 10, 10_000),
    retryMaxDelayMs: parseDhlInteger(env.HEXASHIP_DHL_RETRY_MAX_DELAY_MS, 30_000, 100, 60_000),
  };
}

function gateBaseUrl(baseUrl: string, sandbox: string, production: string, env: NodeJS.ProcessEnv): string {
  const normalized = normalizeDhlBaseUrl(baseUrl);
  if (normalized !== sandbox && normalized !== production && env.HEXASHIP_DHL_ALLOW_CUSTOM_BASE_URL !== 'true') throw new DhlConfigurationError('Custom DHL base URLs are disabled.');
  if (normalized === production && env.HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED !== 'true') throw new DhlConfigurationError('DHL production traffic is disabled.');
  return normalized;
}

export function createMyDhlExpressAdapterFromEnv(env: NodeJS.ProcessEnv = process.env, dependencies: DhlHttpDependencies = {}): MyDhlExpressAdapter {
  const keys = ['HEXASHIP_DHL_MYDHL_BASE_URL', 'HEXASHIP_DHL_MYDHL_USERNAME', 'HEXASHIP_DHL_MYDHL_PASSWORD', 'HEXASHIP_DHL_ACCOUNT_NUMBER'] as const;
  const missing = keys.filter(key => !nonEmpty(env[key]));
  if (missing.length) throw new DhlConfigurationError('MyDHL Express is not configured.', [...missing]);
  return new MyDhlExpressAdapter({
    baseUrl: gateBaseUrl(nonEmpty(env.HEXASHIP_DHL_MYDHL_BASE_URL), 'https://express.api.dhl.com/mydhlapi/test', 'https://express.api.dhl.com/mydhlapi', env),
    username: nonEmpty(env.HEXASHIP_DHL_MYDHL_USERNAME), password: nonEmpty(env.HEXASHIP_DHL_MYDHL_PASSWORD), accountNumber: nonEmpty(env.HEXASHIP_DHL_ACCOUNT_NUMBER),
    ...commonConfig(env),
  }, dependencies);
}

export function createDhlEcommerceAdapterFromEnv(env: NodeJS.ProcessEnv = process.env, dependencies: DhlHttpDependencies = {}): DhlEcommerceAmericasV4Adapter {
  const keys = ['HEXASHIP_DHL_ECOMMERCE_BASE_URL', 'HEXASHIP_DHL_ECOMMERCE_CLIENT_ID', 'HEXASHIP_DHL_ECOMMERCE_CLIENT_SECRET', 'HEXASHIP_DHL_ECOMMERCE_PICKUP_ACCOUNT', 'HEXASHIP_DHL_ECOMMERCE_DISTRIBUTION_CENTER'] as const;
  const missing = keys.filter(key => !nonEmpty(env[key]));
  if (missing.length) throw new DhlConfigurationError('DHL eCommerce Americas v4 is not configured.', [...missing]);
  return new DhlEcommerceAmericasV4Adapter({
    baseUrl: gateBaseUrl(nonEmpty(env.HEXASHIP_DHL_ECOMMERCE_BASE_URL), 'https://api-sandbox.dhlecs.com', 'https://api.dhlecs.com', env),
    clientId: nonEmpty(env.HEXASHIP_DHL_ECOMMERCE_CLIENT_ID), clientSecret: nonEmpty(env.HEXASHIP_DHL_ECOMMERCE_CLIENT_SECRET),
    pickupAccount: nonEmpty(env.HEXASHIP_DHL_ECOMMERCE_PICKUP_ACCOUNT), distributionCenter: nonEmpty(env.HEXASHIP_DHL_ECOMMERCE_DISTRIBUTION_CENTER),
    tokenExpirySkewMs: parseDhlInteger(env.HEXASHIP_DHL_ECOMMERCE_TOKEN_EXPIRY_SKEW_MS, 900_000, 60_000, 1_800_000),
    ...commonConfig(env),
  }, dependencies);
}
