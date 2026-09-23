import { randomUUID } from 'node:crypto';

/**
 * Direct carrier-owned integrations for additional private European carriers.
 *
 * Credentials and contract-only routes are server-side configuration resolved
 * from Secret Manager. They must never be accepted from browser payloads.
 */
export const EXPANDED_PRIVATE_EUROPE_CONNECTOR_VERSION = 'veygrit-ship-expanded-private-europe-v1' as const;

export type ExpandedPrivateEuropeCarrierId =
  | 'yodel'
  | 'fan_courier'
  | 'acs_courier'
  | 'dachser'
  | 'sameday'
  | 'dhl_parcel_de'
  | 'colissimo'
  | 'poste_italiane'
  | 'correos'
  | 'postnl'
  | 'bpost'
  | 'postnord'
  | 'swiss_post'
  | 'austrian_post'
  | 'ppl_cz'
  | 'omniva'
  | 'an_post'
  | 'ctt_portugal';

export type ExpandedPrivateEuropeOperation =
  | 'address_validation'
  | 'rate'
  | 'shipment'
  | 'shipment_update'
  | 'label'
  | 'return'
  | 'void'
  | 'tracking'
  | 'pickup'
  | 'manifest'
  | 'pickup_point'
  | 'webhook'
  | 'document'
  | 'warehouse';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ExpandedPrivateEuropeAuth =
  | { type: 'none' }
  | { type: 'api_key'; headerName: string; value: string; prefix?: string }
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'header_set'; values: Readonly<Record<string, string>> };

export type ExpandedPrivateEuropeRoute = {
  method: HttpMethod;
  path: string;
  safeToRetry: boolean;
  bodyEncoding?: 'json' | 'form';
  queryPayload?: boolean;
  headers?: Readonly<Record<string, string>>;
  fixedPayload?: Readonly<Record<string, unknown>>;
  payloadEnvelope?: 'acs_input_parameters';
};

export type ExpandedPrivateEuropeConnectorConfig = {
  carrier: ExpandedPrivateEuropeCarrierId;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  auth: ExpandedPrivateEuropeAuth;
  routes: Partial<Record<ExpandedPrivateEuropeOperation, ExpandedPrivateEuropeRoute>>;
  /** Contract fields added only after a server-side secret lookup. */
  credentialPayload?: Readonly<Record<string, unknown>>;
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type ExpandedPrivateEuropeDependencies = {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type ExpandedPrivateEuropeSuccess = {
  carrier: ExpandedPrivateEuropeCarrierId;
  operation: ExpandedPrivateEuropeOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export class ExpandedPrivateEuropeConnectorError extends Error {
  constructor(readonly common: {
    carrier: ExpandedPrivateEuropeCarrierId;
    operation: ExpandedPrivateEuropeOperation;
    requestId: string;
    status: number;
    retryable: boolean;
    outcomeUnknown: boolean;
    code: string;
    message: string;
    retryAfterMs?: number;
  }) {
    super(common.message);
    this.name = 'ExpandedPrivateEuropeConnectorError';
  }
}

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Official private Europe carrier configuration is missing ${name}.`);
  return value.trim();
}

function httpsUrl(value: string, name: string): string {
  const url = new URL(required(value, name));
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS.`);
  return url.toString().replace(/\/+$/, '');
}

function interpolate(path: string, source: Record<string, unknown>): { path: string; payload: Record<string, unknown> } {
  const payload = { ...source };
  return {
    path: path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key: string) => {
      const value = payload[key];
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError(`Official private Europe carrier route requires ${key}.`);
      }
      delete payload[key];
      return encodeURIComponent(String(value));
    }),
    payload,
  };
}

function parse(text: string, contentType: string | null): unknown {
  if (!text) return {};
  if (contentType?.includes('json')) {
    try { return JSON.parse(text) as unknown; } catch { return {}; }
  }
  try { return JSON.parse(text) as unknown; } catch { return { raw: text }; }
}

async function responseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (
    contentType.includes('application/pdf')
    || contentType.includes('application/zpl')
    || contentType.includes('application/octet-stream')
  ) {
    return new Uint8Array(await response.arrayBuffer());
  }
  return parse(await response.text(), contentType);
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1_000) : undefined;
}

function errorValue(payload: unknown, keys: string[], fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value) return value;
  }
  return fallback;
}

function formBody(payload: Readonly<Record<string, unknown>>): string {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    form.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  return form.toString();
}

function requestPayload(
  route: ExpandedPrivateEuropeRoute,
  credentials: Readonly<Record<string, unknown>>,
  source: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  if (route.payloadEnvelope === 'acs_input_parameters') {
    return {
      ...route.fixedPayload,
      ACSInputParameters: { ...credentials, ...source },
    };
  }
  return { ...route.fixedPayload, ...credentials, ...source };
}

function acsExecutionError(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  if (record.ACSExecution_HasError !== true) return undefined;
  return typeof record.ACSExecutionErrorMessage === 'string' && record.ACSExecutionErrorMessage
    ? record.ACSExecutionErrorMessage
    : 'ACS rejected the request.';
}

export class ExpandedPrivateEuropeConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly timeoutMs: number;
  private readonly maxSafeRetries: number;

  constructor(
    readonly config: ExpandedPrivateEuropeConnectorConfig,
    dependencies: ExpandedPrivateEuropeDependencies = {},
  ) {
    this.baseUrl = httpsUrl(config.baseUrl, `${config.carrier} baseUrl`);
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maxSafeRetries = config.maxSafeRetries ?? 2;
  }

  execute(operation: ExpandedPrivateEuropeOperation, payload: Record<string, unknown>): Promise<ExpandedPrivateEuropeSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`${this.config.carrier} does not have an official ${operation} route configured.`);
    return this.request(operation, route, payload);
  }

  private authHeaders(): Record<string, string> {
    const auth = this.config.auth;
    switch (auth.type) {
      case 'none': return {};
      case 'api_key':
        return { [required(auth.headerName, 'API key header')]: `${auth.prefix ?? ''}${required(auth.value, 'API key')}` };
      case 'bearer': return { authorization: `Bearer ${required(auth.token, 'bearer token')}` };
      case 'basic':
        return { authorization: `Basic ${Buffer.from(`${required(auth.username, 'username')}:${required(auth.password, 'password')}`, 'utf8').toString('base64')}` };
      case 'header_set':
        return Object.fromEntries(Object.entries(auth.values).map(([name, value]) => [
          required(name, 'authentication header name'),
          required(value, `${name} authentication header value`),
        ]));
    }
  }

  private async request(
    operation: ExpandedPrivateEuropeOperation,
    route: ExpandedPrivateEuropeRoute,
    source: Record<string, unknown>,
  ): Promise<ExpandedPrivateEuropeSuccess> {
    const requestId = this.requestId();
    const resolved = interpolate(route.path, source);
    const payload = requestPayload(route, this.config.credentialPayload ?? {}, resolved.payload);
    let path = resolved.path;
    let body = '';
    if (route.queryPayload) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) query.set(key, String(value));
      }
      path += `${path.includes('?') ? '&' : '?'}${query}`;
    } else if (route.method !== 'GET') {
      body = route.bodyEncoding === 'form' ? formBody(payload) : JSON.stringify(payload);
    }
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let attempt = 0;
    while (true) {
      try {
        const headers: Record<string, string> = {
          accept: 'application/json, application/pdf, application/zpl, application/xml, text/xml',
          'x-veygrit-request-id': requestId,
          ...route.headers,
          ...this.authHeaders(),
        };
        if (body) {
          headers['content-type'] = route.bodyEncoding === 'form'
            ? 'application/x-www-form-urlencoded'
            : 'application/json';
        }
        const response = await this.fetchWithTimeout(url, {
          method: route.method,
          headers,
          body: body || undefined,
        });
        const data = await responseData(response);
        if (response.ok) {
          const acsMessage = this.config.carrier === 'acs_courier' ? acsExecutionError(data) : undefined;
          if (acsMessage) {
            throw new ExpandedPrivateEuropeConnectorError({
              carrier: this.config.carrier,
              operation,
              requestId,
              status: 422,
              retryable: false,
              outcomeUnknown: false,
              code: 'ACS_EXECUTION_ERROR',
              message: acsMessage,
            });
          }
          return {
            carrier: this.config.carrier,
            operation,
            requestId,
            status: response.status,
            data,
            retryable: false,
            outcomeUnknown: false,
          };
        }
        const retryable = response.status === 429 || response.status >= 500;
        if (route.safeToRetry && retryable && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(retryAfter(response) ?? attempt * 250);
          continue;
        }
        throw new ExpandedPrivateEuropeConnectorError({
          carrier: this.config.carrier,
          operation,
          requestId,
          status: response.status,
          retryable,
          outcomeUnknown: false,
          code: errorValue(data, ['code', 'errorCode', 'statusCode'], `CARRIER_HTTP_${response.status}`),
          message: errorValue(data, ['message', 'error', 'description', 'ACSExecutionErrorMessage'], `${this.config.carrier} rejected the request.`),
          retryAfterMs: retryAfter(response),
        });
      } catch (error) {
        if (error instanceof ExpandedPrivateEuropeConnectorError) throw error;
        if (route.safeToRetry && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(attempt * 250);
          continue;
        }
        const aborted = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
        throw new ExpandedPrivateEuropeConnectorError({
          carrier: this.config.carrier,
          operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !route.safeToRetry,
          code: aborted ? 'CARRIER_TIMEOUT' : 'CARRIER_NETWORK',
          message: `${this.config.carrier} could not be reached.`,
        });
      }
    }
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try { return await this.fetchImpl(url, { ...init, signal: controller.signal }); }
    finally { clearTimeout(timer); }
  }
}

export type PrivateEuropeContractConfig = Pick<
  ExpandedPrivateEuropeConnectorConfig,
  'environment' | 'auth' | 'routes' | 'credentialPayload' | 'timeoutMs' | 'maxSafeRetries'
> & {
  sandboxBaseUrl: string;
  productionBaseUrl: string;
};

function contractConnector(
  carrier: ExpandedPrivateEuropeCarrierId,
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  const sandboxBaseUrl = httpsUrl(config.sandboxBaseUrl, `${carrier} sandboxBaseUrl`);
  const productionBaseUrl = httpsUrl(config.productionBaseUrl, `${carrier} productionBaseUrl`);
  return new ExpandedPrivateEuropeConnector({
    ...config,
    carrier,
    baseUrl: config.environment === 'sandbox' ? sandboxBaseUrl : productionBaseUrl,
  }, dependencies);
}

/** Yodel grants Shipping Orders, Returns and Tracking routes per application plan. */
export function createYodelConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('yodel', config, dependencies);
}

export type FanCourierConfig = Pick<
  ExpandedPrivateEuropeConnectorConfig,
  'environment' | 'credentialPayload' | 'timeoutMs' | 'maxSafeRetries'
> & {
  /** FAN sandbox/test host issued to the merchant; production must not be used for tests. */
  sandboxBaseUrl: string;
  token: string;
  routes?: Partial<Record<ExpandedPrivateEuropeOperation, ExpandedPrivateEuropeRoute>>;
};

/** FAN Courier SelfAWB v2; the caller supplies a cached 24-hour bearer token. */
export function createFanCourierConnector(
  config: FanCourierConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return new ExpandedPrivateEuropeConnector({
    ...config,
    carrier: 'fan_courier',
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : 'https://api.fancourier.ro',
    auth: { type: 'bearer', token: config.token },
    routes: {
      rate: { method: 'GET', path: '/reports/awb/internal-tariff', queryPayload: true, safeToRetry: true },
      shipment: { method: 'POST', path: '/intern-awb', safeToRetry: false },
      label: { method: 'GET', path: '/awb/label', queryPayload: true, safeToRetry: true },
      void: { method: 'DELETE', path: '/awb', queryPayload: true, safeToRetry: false },
      tracking: { method: 'GET', path: '/reports/awb/tracking', queryPayload: true, safeToRetry: true },
      pickup: { method: 'POST', path: '/order', safeToRetry: false },
      pickup_point: { method: 'GET', path: '/reports/pickup-points', queryPayload: true, safeToRetry: true },
      ...config.routes,
    },
  }, dependencies);
}

export type AcsCourierConfig = Pick<
  ExpandedPrivateEuropeConnectorConfig,
  'environment' | 'credentialPayload' | 'timeoutMs' | 'maxSafeRetries'
> & {
  sandboxBaseUrl: string;
  apiKey: string;
  routes?: Partial<Record<ExpandedPrivateEuropeOperation, ExpandedPrivateEuropeRoute>>;
};

function acsRoute(alias: string, safeToRetry: boolean): ExpandedPrivateEuropeRoute {
  return {
    method: 'POST',
    path: '/ACSAutoRest',
    safeToRetry,
    fixedPayload: { ACSAlias: alias },
    payloadEnvelope: 'acs_input_parameters',
  };
}

/** ACS Courier REST Web Services for Greece and Cyprus. */
export function createAcsCourierConnector(
  config: AcsCourierConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return new ExpandedPrivateEuropeConnector({
    ...config,
    carrier: 'acs_courier',
    baseUrl: config.environment === 'sandbox'
      ? config.sandboxBaseUrl
      : 'https://webservices.acscourier.net/ACSRestServices/api',
    auth: { type: 'api_key', headerName: 'AcsApiKey', value: config.apiKey },
    routes: {
      address_validation: acsRoute('ACS_Address_Validation', true),
      rate: acsRoute('ACS_Price_Calculation', true),
      shipment: acsRoute('ACS_Create_Voucher', false),
      label: acsRoute('ACS_Print_Voucher', true),
      void: acsRoute('ACS_Delete_Voucher', false),
      tracking: acsRoute('ACS_TrackingDetails', true),
      pickup: acsRoute('ACS_Issue_Pickup_List', false),
      ...config.routes,
    },
  }, dependencies);
}

export type DachserConfig = Pick<
  ExpandedPrivateEuropeConnectorConfig,
  'environment' | 'timeoutMs' | 'maxSafeRetries'
> & {
  sandboxBaseUrl: string;
  apiKey: string;
  apiKeyHeader?: string;
  routes?: Partial<Record<ExpandedPrivateEuropeOperation, ExpandedPrivateEuropeRoute>>;
};

/** DACHSER Business Integration shipment status v2 plus contract routes. */
export function createDachserConnector(
  config: DachserConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return new ExpandedPrivateEuropeConnector({
    ...config,
    carrier: 'dachser',
    baseUrl: config.environment === 'sandbox' ? config.sandboxBaseUrl : 'https://api-gateway.dachser.com',
    auth: { type: 'api_key', headerName: config.apiKeyHeader ?? 'X-API-Key', value: config.apiKey },
    routes: {
      tracking: { method: 'GET', path: '/rest/v2/shipmentstatus', queryPayload: true, safeToRetry: true },
      ...config.routes,
    },
  }, dependencies);
}

/** Sameday endpoints are enabled and versioned per customer contract. */
export function createSamedayConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('sameday', config, dependencies);
}

export type DhlParcelGermanyConfig = Pick<
  ExpandedPrivateEuropeConnectorConfig,
  'environment' | 'credentialPayload' | 'timeoutMs' | 'maxSafeRetries'
> & {
  /** Cached server-side token obtained through the official DHL account auth API. */
  accessToken: string;
  routes?: Partial<Record<ExpandedPrivateEuropeOperation, ExpandedPrivateEuropeRoute>>;
};

/**
 * DHL Parcel DE Shipping REST v2 for German business customers.
 *
 * Token acquisition/refresh remains a server worker responsibility. This
 * connector never receives the API key, secret, username or password from a
 * shipment request.
 */
export function createDhlParcelGermanyConnector(
  config: DhlParcelGermanyConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return new ExpandedPrivateEuropeConnector({
    ...config,
    carrier: 'dhl_parcel_de',
    baseUrl: config.environment === 'sandbox'
      ? 'https://api-sandbox.dhl.com/parcel/de/shipping/v2'
      : 'https://api-eu.dhl.com/parcel/de/shipping/v2',
    auth: { type: 'bearer', token: config.accessToken },
    routes: {
      address_validation: {
        method: 'POST',
        path: '/orders?validate=true',
        safeToRetry: true,
      },
      shipment: { method: 'POST', path: '/orders', safeToRetry: false },
      label: { method: 'GET', path: '/orders', queryPayload: true, safeToRetry: true },
      return: { method: 'POST', path: '/orders', safeToRetry: false },
      void: { method: 'DELETE', path: '/orders', queryPayload: true, safeToRetry: false },
      manifest: { method: 'POST', path: '/manifests', safeToRetry: false },
      document: { method: 'GET', path: '/manifests', queryPayload: true, safeToRetry: true },
      ...config.routes,
    },
  }, dependencies);
}

/** La Poste Colissimo shipping, label, returns, pickup-point and tracking APIs. */
export function createColissimoConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('colissimo', config, dependencies);
}

/** Poste Italiane business-delivery APIs; routes are enabled per signed contract. */
export function createPosteItalianeConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('poste_italiane', config, dependencies);
}

/** Correos OAuth APIs for preregistration, labels, pickup requests and tracking. */
export function createCorreosConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('correos', config, dependencies);
}

/** PostNL Shipment/Return v4, address, location and tracking services. */
export function createPostNlConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('postnl', config, dependencies);
}

/** bpost Shipping Manager, GeoLocator and Track & Trace web services. */
export function createBpostConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('bpost', config, dependencies);
}

/** PostNord Booking, Returns, Pickup, Service Point and Tracking APIs. */
export function createPostNordConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('postnord', config, dependencies);
}

export type SwissPostConfig = Pick<
  ExpandedPrivateEuropeConnectorConfig,
  'environment' | 'timeoutMs' | 'maxSafeRetries'
> & {
  /** Cached OAuth access token resolved only by the server. */
  accessToken: string;
  /** Swiss Post supplies a non-production host to approved integrations. */
  sandboxBaseUrl?: string;
  routes?: Partial<Record<ExpandedPrivateEuropeOperation, ExpandedPrivateEuropeRoute>>;
};

/**
 * Swiss Post Digital Commerce API.
 *
 * Only the publicly documented address-label route is enabled by default.
 * Address, delivery and access-point products require separate product access.
 */
export function createSwissPostConnector(
  config: SwissPostConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  const baseUrl = config.environment === 'sandbox'
    ? httpsUrl(config.sandboxBaseUrl ?? '', 'swiss_post sandboxBaseUrl')
    : 'https://dcapi.apis.post.ch';
  return new ExpandedPrivateEuropeConnector({
    ...config,
    carrier: 'swiss_post',
    baseUrl,
    auth: { type: 'bearer', token: config.accessToken },
    routes: {
      label: {
        method: 'POST',
        path: '/barcode/v1/generateAddressLabel',
        safeToRetry: false,
      },
      ...config.routes,
    },
  }, dependencies);
}

/** Austrian Post business shipping routes are enabled per merchant contract. */
export function createAustrianPostConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('austrian_post', config, dependencies);
}

/** PPL CZ CPL API routes are enabled per merchant application and environment. */
export function createPplCzConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('ppl_cz', config, dependencies);
}

/** Omniva OMX routes use the carrier-issued tenant URL and Basic credentials. */
export function createOmnivaConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('omniva', config, dependencies);
}

/** An Post eCommerce Hub routes are enabled for the merchant's bearer-token contract. */
export function createAnPostConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('an_post', config, dependencies);
}

/** CTT Expresso routes are enabled from the carrier-issued REST contract. */
export function createCttPortugalConnector(
  config: PrivateEuropeContractConfig,
  dependencies?: ExpandedPrivateEuropeDependencies,
): ExpandedPrivateEuropeConnector {
  return contractConnector('ctt_portugal', config, dependencies);
}
