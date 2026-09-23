import { randomUUID } from 'node:crypto';

/**
 * Direct official adapters for the Americas expansion wave.
 *
 * Credentials are constructor inputs so the server can resolve them from a
 * secret provider. They must never be accepted by a browser route or persisted
 * in Veygrit Ship tables.
 */
export const EXPANDED_AMERICAS_CONNECTOR_VERSION = 'veygrit-ship-expanded-americas-v1' as const;

export type ExpandedAmericasCarrierId =
  | 'chilexpress'
  | 'coordinadora'
  | 'oca'
  | 'ninety_nine_minutos'
  | 'redpack'
  | 'estafeta'
  | 'jadlog'
  | 'total_express'
  | 'roadie'
  | 'andreani'
  | 'servientrega'
  | 'blue_express';

export type ExpandedAmericasOperation =
  | 'address_validation'
  | 'rate'
  | 'shipment'
  | 'label'
  | 'return'
  | 'void'
  | 'tracking'
  | 'pickup'
  | 'pickup_point'
  | 'webhook';

type HttpMethod = 'GET' | 'POST' | 'DELETE';
type BodyEncoding = 'json' | 'form';
export type ExpandedAmericasRoute = {
  method: HttpMethod;
  path: string;
  accept?: string;
  bodyEncoding?: BodyEncoding;
  queryPayload?: boolean;
  safeToRetry: boolean;
  /** Select an official route variant (for example OCA PDF versus ZPL). */
  variantField?: string;
  variants?: Readonly<Record<string, string>>;
};
type Route = ExpandedAmericasRoute;

type ApiKeyAuth = { type: 'api_key'; headerName: string; value: string };
type BearerAuth = { type: 'bearer'; token: string };
type BasicAuth = { type: 'basic'; username: string; password: string };
type FormAuth = {
  type: 'form_fields';
  username: string;
  password: string;
  usernameField: string;
  passwordField: string;
};
type OAuthAuth = {
  type: 'oauth2_client_credentials';
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  requestStyle: 'basic_form' | 'json_body' | 'form_body';
};
type HeaderTokenExchangeAuth = {
  type: 'header_token_exchange';
  tokenUrl: string;
  username: string;
  password: string;
  headerName: string;
  responseField: string;
  defaultExpiresInSeconds: number;
};
type OfficialAuth = ApiKeyAuth | BearerAuth | BasicAuth | FormAuth | OAuthAuth | HeaderTokenExchangeAuth;

export type ExpandedAmericasConnectorConfig = {
  carrier: ExpandedAmericasCarrierId;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  auth: OfficialAuth;
  routes: Partial<Record<ExpandedAmericasOperation, Route>>;
  timeoutMs?: number;
  maxSafeRetries?: number;
};

export type ExpandedAmericasDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  requestId?: () => string;
};

export type ExpandedAmericasSuccess = {
  carrier: ExpandedAmericasCarrierId;
  operation: ExpandedAmericasOperation;
  requestId: string;
  status: number;
  data: unknown;
  retryable: false;
  outcomeUnknown: false;
};

export type ExpandedAmericasCommonError = {
  carrier: ExpandedAmericasCarrierId;
  operation: ExpandedAmericasOperation | 'oauth';
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  code: string;
  message: string;
  retryAfterMs?: number;
};

export class ExpandedAmericasConnectorError extends Error {
  constructor(readonly common: ExpandedAmericasCommonError) {
    super(common.message);
    this.name = 'ExpandedAmericasConnectorError';
  }
}

type TokenCache = { value: string; expiresAt: number };

function required(value: string, name: string): string {
  if (!value?.trim()) throw new Error(`Official carrier configuration is missing ${name}.`);
  return value.trim();
}

function httpsUrl(value: string, name: string): string {
  const url = new URL(required(value, name));
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS.`);
  return url.toString().replace(/\/+$/, '');
}

function parsePayload(text: string, contentType: string | null): unknown {
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
  return parsePayload(await response.text(), contentType);
}

function codeFrom(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const value = record.code ?? record.codigo ?? record.errorCode ?? record.statusCode;
  return typeof value === 'string' && value ? value : fallback;
}

function messageFrom(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const value = record.message ?? record.mensaje ?? record.error ?? record.description ?? record.descripcion;
  return typeof value === 'string' && value ? value : fallback;
}

function retryAfter(response: Response): number | undefined {
  const raw = response.headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function formBody(payload: Record<string, unknown>): string {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    form.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  return form.toString();
}

function interpolatePath(path: string, payload: Record<string, unknown>): { path: string; payload: Record<string, unknown> } {
  const body = { ...payload };
  const resolved = path.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, name: string) => {
    const value = body[name];
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new TypeError(`Official carrier route requires ${name}.`);
    }
    delete body[name];
    return encodeURIComponent(String(value));
  });
  return { path: resolved, payload: body };
}

export class ExpandedAmericasConnector {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly requestId: () => string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxSafeRetries: number;
  private token?: TokenCache;
  private tokenRequest?: Promise<string>;

  constructor(
    readonly config: ExpandedAmericasConnectorConfig,
    dependencies: ExpandedAmericasDependencies = {},
  ) {
    this.baseUrl = httpsUrl(config.baseUrl, `${config.carrier} baseUrl`);
    if (config.auth.type === 'oauth2_client_credentials') {
      httpsUrl(config.auth.tokenUrl, `${config.carrier} tokenUrl`);
    }
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maxSafeRetries = config.maxSafeRetries ?? 2;
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.requestId = dependencies.requestId ?? randomUUID;
  }

  execute(operation: ExpandedAmericasOperation, payload: Record<string, unknown>): Promise<ExpandedAmericasSuccess> {
    const route = this.config.routes[operation];
    if (!route) throw new Error(`${this.config.carrier} does not have an official ${operation} route configured.`);
    return this.request(operation, route, payload);
  }

  private async authorizationHeaders(): Promise<Record<string, string>> {
    const auth = this.config.auth;
    switch (auth.type) {
      case 'api_key': return { [required(auth.headerName, 'api key header')]: required(auth.value, 'api key') };
      case 'bearer': return { authorization: `Bearer ${required(auth.token, 'access token')}` };
      case 'basic': return { authorization: `Basic ${Buffer.from(`${required(auth.username, 'username')}:${required(auth.password, 'password')}`, 'utf8').toString('base64')}` };
      case 'form_fields': return {};
      case 'oauth2_client_credentials': return { authorization: `Bearer ${await this.getAccessToken(auth)}` };
      case 'header_token_exchange':
        return { [required(auth.headerName, 'token header name')]: await this.getAccessToken(auth) };
    }
  }

  private async getAccessToken(auth: OAuthAuth | HeaderTokenExchangeAuth): Promise<string> {
    if (this.token && this.token.expiresAt - 60_000 > this.now()) return this.token.value;
    if (!this.tokenRequest) this.tokenRequest = this.loadAccessToken(auth).finally(() => { this.tokenRequest = undefined; });
    return this.tokenRequest;
  }

  private async loadAccessToken(auth: OAuthAuth | HeaderTokenExchangeAuth): Promise<string> {
    const requestId = this.requestId();
    const headers: Record<string, string> = { accept: 'application/json' };
    let body: string | undefined;
    let method: 'GET' | 'POST';
    if (auth.type === 'header_token_exchange') {
      method = 'GET';
      headers.authorization = `Basic ${Buffer.from(`${required(auth.username, 'username')}:${required(auth.password, 'password')}`, 'utf8').toString('base64')}`;
    } else {
      method = 'POST';
      const clientId = required(auth.clientId, 'OAuth clientId');
      const clientSecret = required(auth.clientSecret, 'OAuth clientSecret');
      if (auth.requestStyle === 'json_body') {
        headers['content-type'] = 'application/json';
        body = JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' });
      } else {
        headers['content-type'] = 'application/x-www-form-urlencoded';
        const values: Record<string, string> = { grant_type: 'client_credentials' };
        if (auth.requestStyle === 'form_body') {
          values.client_id = clientId;
          values.client_secret = clientSecret;
        } else {
          headers.authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')}`;
        }
        body = new URLSearchParams(values).toString();
      }
    }
    let response: Response;
    try {
      response = await this.fetchWithTimeout(httpsUrl(auth.tokenUrl, 'tokenUrl'), { method, headers, body });
    } catch (error) {
      throw new ExpandedAmericasConnectorError({
        carrier: this.config.carrier,
        operation: 'oauth',
        requestId,
        status: 0,
        retryable: true,
        outcomeUnknown: false,
        code: isAbortError(error) ? 'CARRIER_OAUTH_TIMEOUT' : 'CARRIER_OAUTH_NETWORK',
        message: `${this.config.carrier} authentication could not be completed.`,
      });
    }
    const data = parsePayload(await response.text(), response.headers.get('content-type')) as Record<string, unknown>;
    if (!response.ok) {
      throw new ExpandedAmericasConnectorError({
        carrier: this.config.carrier,
        operation: 'oauth',
        requestId,
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
        outcomeUnknown: false,
        code: codeFrom(data, 'CARRIER_OAUTH_FAILED'),
        message: messageFrom(data, `${this.config.carrier} authentication failed.`),
        retryAfterMs: retryAfter(response),
      });
    }
    const configuredToken = auth.type === 'header_token_exchange' ? data[auth.responseField] : data.access_token;
    const value = typeof configuredToken === 'string'
      ? configuredToken
      : typeof data.token === 'string'
        ? data.token
        : typeof data.idToken === 'string'
          ? data.idToken
          : '';
    if (!value) {
      throw new ExpandedAmericasConnectorError({
        carrier: this.config.carrier,
        operation: 'oauth',
        requestId,
        status: response.status,
        retryable: false,
        outcomeUnknown: false,
        code: 'CARRIER_OAUTH_INVALID_RESPONSE',
        message: `${this.config.carrier} did not return an access token.`,
      });
    }
    const defaultExpiresIn = auth.type === 'header_token_exchange' ? auth.defaultExpiresInSeconds : 3_600;
    const expiresIn = typeof data.expires_in === 'number' && Number.isFinite(data.expires_in) ? data.expires_in : defaultExpiresIn;
    this.token = { value, expiresAt: this.now() + expiresIn * 1000 };
    return value;
  }

  private async request(
    operation: ExpandedAmericasOperation,
    route: Route,
    sourcePayload: Record<string, unknown>,
  ): Promise<ExpandedAmericasSuccess> {
    const requestId = this.requestId();
    const routePayload = { ...sourcePayload };
    let selectedPath = route.path;
    if (route.variantField) {
      const variant = routePayload[route.variantField];
      if (typeof variant === 'string' && route.variants?.[variant]) selectedPath = route.variants[variant];
      delete routePayload[route.variantField];
    }
    const resolved = interpolatePath(selectedPath, routePayload);
    const payload = { ...resolved.payload };
    if (this.config.auth.type === 'form_fields') {
      payload[this.config.auth.usernameField] = required(this.config.auth.username, 'username');
      payload[this.config.auth.passwordField] = required(this.config.auth.password, 'password');
    }
    let path = resolved.path;
    let body: string | undefined;
    if (route.queryPayload) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) query.set(key, String(value));
      }
      path += `${path.includes('?') ? '&' : '?'}${query.toString()}`;
    } else if (route.method !== 'GET') {
      body = route.bodyEncoding === 'form' ? formBody(payload) : JSON.stringify(payload);
    }
    const url = path.startsWith('https://') ? httpsUrl(path, 'carrier route') : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let attempt = 0;
    while (true) {
      try {
        const headers: Record<string, string> = {
          accept: route.accept ?? 'application/json, application/xml, text/xml, application/pdf, application/zpl',
          'x-veygrit-request-id': requestId,
          ...await this.authorizationHeaders(),
        };
        if (body !== undefined) headers['content-type'] = route.bodyEncoding === 'form' ? 'application/x-www-form-urlencoded' : 'application/json';
        const response = await this.fetchWithTimeout(url, { method: route.method, headers, body });
        const data = await responseData(response);
        if (response.ok) {
          return { carrier: this.config.carrier, operation, requestId, status: response.status, data, retryable: false, outcomeUnknown: false };
        }
        const retryable = response.status === 429 || response.status >= 500;
        if (route.safeToRetry && retryable && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(retryAfter(response) ?? 250 * attempt);
          continue;
        }
        throw new ExpandedAmericasConnectorError({
          carrier: this.config.carrier,
          operation,
          requestId,
          status: response.status,
          retryable,
          outcomeUnknown: false,
          code: codeFrom(data, `CARRIER_HTTP_${response.status}`),
          message: messageFrom(data, `${this.config.carrier} rejected the request.`),
          retryAfterMs: retryAfter(response),
        });
      } catch (error) {
        if (error instanceof ExpandedAmericasConnectorError) throw error;
        if (route.safeToRetry && attempt < this.maxSafeRetries) {
          attempt += 1;
          await this.sleep(250 * attempt);
          continue;
        }
        throw new ExpandedAmericasConnectorError({
          carrier: this.config.carrier,
          operation,
          requestId,
          status: 0,
          retryable: true,
          outcomeUnknown: !route.safeToRetry,
          code: isAbortError(error) ? 'CARRIER_TIMEOUT' : 'CARRIER_NETWORK',
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

type Runtime = Pick<ExpandedAmericasConnectorConfig, 'timeoutMs' | 'maxSafeRetries'>;
export type ExpandedAmericasContractRoutes = Partial<Record<ExpandedAmericasOperation, Route>>;
type ContractRoutes = ExpandedAmericasContractRoutes;

function contractBase(
  environment: 'sandbox' | 'production',
  sandboxBaseUrl: string,
  productionBaseUrl: string,
): string {
  return environment === 'sandbox'
    ? httpsUrl(sandboxBaseUrl, 'sandboxBaseUrl')
    : httpsUrl(productionBaseUrl, 'productionBaseUrl');
}

export function createChilexpressConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    subscriptionKey: string;
    /** Exact product paths shown in the merchant's Chilexpress subscription. */
    routes: ContractRoutes;
  },
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  const baseUrl = config.environment === 'sandbox' ? 'https://testservices.wschilexpress.com' : 'https://services.wschilexpress.com';
  return new ExpandedAmericasConnector({
    ...config,
    carrier: 'chilexpress',
    baseUrl,
    auth: { type: 'api_key', headerName: 'Ocp-Apim-Subscription-Key', value: config.subscriptionKey },
    routes: {
      rate: { method: 'POST', path: '/rating/api/v1.0/rates/courier', safeToRetry: true },
      ...config.routes,
    },
  }, dependencies);
}

export function createCoordinadoraConnector(
  config: Runtime & { environment: 'sandbox' | 'production'; clientId: string; clientSecret: string },
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  const sandbox = config.environment === 'sandbox';
  return new ExpandedAmericasConnector({
    ...config,
    carrier: 'coordinadora',
    baseUrl: sandbox ? 'https://clientes-integraciones-services-test.coordinadora.com' : 'https://clientes-integraciones-services.coordinadora.com',
    auth: {
      type: 'oauth2_client_credentials',
      tokenUrl: sandbox ? 'https://api-test.coordinadora.tech/oauth/token' : 'https://api.coordinadora.tech/oauth/token',
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      requestStyle: 'basic_form',
    },
    routes: {
      shipment: { method: 'POST', path: '/clientes/guia', safeToRetry: false },
      label: { method: 'POST', path: '/clientes/guia', safeToRetry: false },
      tracking: { method: 'POST', path: '/clientes/tracking', safeToRetry: true },
    },
  }, dependencies);
}

export function createOcaConnector(
  config: Runtime & { environment: 'sandbox' | 'production'; username: string; password: string },
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  const baseUrl = config.environment === 'sandbox'
    ? 'https://integraciones.ocadev.com.ar/epak_tracking_test/Oep_TrackEPak.asmx'
    : 'https://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx';
  return new ExpandedAmericasConnector({
    ...config,
    carrier: 'oca',
    baseUrl,
    auth: { type: 'form_fields', username: config.username, password: config.password, usernameField: 'usr', passwordField: 'psw' },
    routes: {
      rate: { method: 'POST', path: '/Tarifar_Envio_Corporativo', bodyEncoding: 'form', safeToRetry: true },
      shipment: { method: 'POST', path: '/IngresoORMultiplesRetiros', bodyEncoding: 'form', safeToRetry: false },
      return: { method: 'POST', path: '/IngresoORMultiplesRetiros', bodyEncoding: 'form', safeToRetry: false },
      label: {
        method: 'POST',
        path: '/GetPdfDeEtiquetasPorOrdenOrNumeroEnvioParaEtiquetadora',
        bodyEncoding: 'form',
        safeToRetry: true,
        variantField: 'labelFormat',
        variants: {
          pdf_a4: '/GetPdfDeEtiquetasPorOrdenOrNumeroEnvio',
          pdf_10x15: '/GetPdfDeEtiquetasPorOrdenOrNumeroEnvioParaEtiquetadora',
          zpl: '/ObtenerEtiquetasZPL',
        },
      },
      void: { method: 'POST', path: '/AnularOrdenGenerada', bodyEncoding: 'form', safeToRetry: false },
      tracking: { method: 'POST', path: '/GetEnvioEstadoActual', bodyEncoding: 'form', safeToRetry: true },
    },
  }, dependencies);
}

export function createNinetyNineMinutosConnector(
  config: Runtime & { environment: 'sandbox' | 'production'; clientId: string; clientSecret: string },
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  const baseUrl = config.environment === 'sandbox' ? 'https://sandbox.99minutos.com' : 'https://delivery.99minutos.com';
  return new ExpandedAmericasConnector({
    ...config,
    carrier: 'ninety_nine_minutos',
    baseUrl,
    auth: {
      type: 'oauth2_client_credentials',
      tokenUrl: `${baseUrl}/api/v3/oauth/token`,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      requestStyle: 'json_body',
    },
    routes: {
      address_validation: { method: 'POST', path: '/api/v3/locations', safeToRetry: true },
      rate: { method: 'POST', path: '/api/v3/shipping/rates', safeToRetry: true },
      shipment: { method: 'POST', path: '/api/v3/orders', safeToRetry: false },
      label: { method: 'POST', path: '/api/v3/documents/guides', safeToRetry: true },
      void: { method: 'DELETE', path: '/api/v3/shipments/{shipmentId}', safeToRetry: false },
      tracking: { method: 'GET', path: '/api/v3/shipments/tracking', queryPayload: true, safeToRetry: true },
    },
  }, dependencies);
}

type OnboardingConfig = Runtime & {
  environment: 'sandbox' | 'production';
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  accessToken: string;
  routes: ContractRoutes;
};

function onboardingBearerConnector(
  carrier: 'redpack' | 'jadlog' | 'total_express' | 'roadie' | 'servientrega' | 'blue_express',
  config: OnboardingConfig,
  defaults: ContractRoutes,
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  return new ExpandedAmericasConnector({
    ...config,
    carrier,
    baseUrl: contractBase(config.environment, config.sandboxBaseUrl, config.productionBaseUrl),
    auth: { type: 'bearer', token: config.accessToken },
    routes: { ...defaults, ...config.routes },
  }, dependencies);
}

export function createRedpackConnector(config: OnboardingConfig, dependencies?: ExpandedAmericasDependencies): ExpandedAmericasConnector {
  return onboardingBearerConnector('redpack', config, {}, dependencies);
}

export function createJadlogConnector(
  config: Omit<OnboardingConfig, 'productionBaseUrl'> & { productionBaseUrl?: string },
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  return onboardingBearerConnector('jadlog', {
    ...config,
    productionBaseUrl: config.productionBaseUrl ?? 'https://www.jadlog.com.br',
  }, {
    rate: { method: 'POST', path: '/embarcador/api/frete/valor', safeToRetry: true },
    shipment: { method: 'POST', path: '/embarcador/api/pedido/incluir', safeToRetry: false },
    void: { method: 'POST', path: '/embarcador/api/pedido/cancelar', safeToRetry: false },
    tracking: { method: 'POST', path: '/embarcador/api/tracking/consultar', safeToRetry: true },
  }, dependencies);
}

export function createTotalExpressConnector(config: OnboardingConfig, dependencies?: ExpandedAmericasDependencies): ExpandedAmericasConnector {
  return onboardingBearerConnector('total_express', config, {}, dependencies);
}

export function createRoadieConnector(config: OnboardingConfig, dependencies?: ExpandedAmericasDependencies): ExpandedAmericasConnector {
  return onboardingBearerConnector('roadie', config, {
    rate: { method: 'POST', path: '/v1/estimates', safeToRetry: true },
    shipment: { method: 'POST', path: '/v1/shipments', safeToRetry: false },
    label: { method: 'GET', path: '/v1/shipments/{shipmentId}/label', queryPayload: true, safeToRetry: true },
    tracking: { method: 'GET', path: '/v1/shipments/{shipmentId}', safeToRetry: true },
    void: { method: 'DELETE', path: '/v1/shipments/{shipmentId}', safeToRetry: false },
  }, dependencies);
}

export function createEstafetaConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    clientId: string;
    clientSecret: string;
    sandboxBaseUrl: string;
    productionBaseUrl: string;
    sandboxTokenUrl?: string;
    productionTokenUrl: string;
    /** Contract/version-specific official REST label and tracking paths. */
    routes: ContractRoutes;
  },
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  return new ExpandedAmericasConnector({
    ...config,
    carrier: 'estafeta',
    baseUrl: contractBase(config.environment, config.sandboxBaseUrl, config.productionBaseUrl),
    auth: {
      type: 'oauth2_client_credentials',
      tokenUrl: config.environment === 'sandbox'
        ? config.sandboxTokenUrl ?? 'https://apiqa.estafeta.com:8443/auth/oauth/v2/token'
        : config.productionTokenUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      requestStyle: 'basic_form',
    },
    routes: config.routes,
  }, dependencies);
}

export function createAndreaniGlobAllPackConnector(
  config: Runtime & {
    environment: 'sandbox' | 'production';
    username: string;
    password: string;
    labelFormat?: 'pdf' | 'zpl';
  },
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  const sandbox = config.environment === 'sandbox';
  const serviceBaseUrl = sandbox
    ? 'https://apisqa.andreanigloballpack.com'
    : 'https://apis.andreanigloballpack.com';
  const loginUrl = sandbox
    ? 'https://apisqa.andreani.com/login'
    : 'https://apis.andreani.com/login';
  return new ExpandedAmericasConnector({
    ...config,
    carrier: 'andreani',
    baseUrl: serviceBaseUrl,
    auth: {
      type: 'header_token_exchange',
      tokenUrl: loginUrl,
      username: config.username,
      password: config.password,
      headerName: 'x-authorization-token',
      responseField: 'token',
      defaultExpiresInSeconds: 86_400,
    },
    routes: {
      rate: {
        method: 'GET',
        path: `${serviceBaseUrl}/cotizador-globallpack/api/v1/Cotizador`,
        queryPayload: true,
        safeToRetry: true,
      },
      shipment: {
        method: 'POST',
        path: `${serviceBaseUrl}/altapreenvio-globallpack/api/v1/ordenes-de-envio`,
        safeToRetry: false,
      },
      label: {
        method: 'GET',
        path: `${serviceBaseUrl}/obtener-etiquetas/api/v1/Etiqueta/{numeroEnvio}`,
        accept: config.labelFormat === 'zpl' ? 'application/zpl' : 'application/pdf',
        safeToRetry: true,
      },
      tracking: {
        method: 'GET',
        path: `${serviceBaseUrl}/trazabilidad-globallpack/api/v1/Envios/{numeroEnvio}/trazas`,
        queryPayload: true,
        safeToRetry: true,
      },
    },
  }, dependencies);
}

export type SouthAmericaContractConfig = Runtime & {
  environment: 'sandbox' | 'production';
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  auth: ApiKeyAuth | BearerAuth | BasicAuth | OAuthAuth;
  routes: ContractRoutes;
};

function southAmericaContractConnector(
  carrier: 'servientrega' | 'blue_express',
  config: SouthAmericaContractConfig,
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  return new ExpandedAmericasConnector({
    ...config,
    carrier,
    baseUrl: contractBase(config.environment, config.sandboxBaseUrl, config.productionBaseUrl),
    auth: config.auth,
    routes: config.routes,
  }, dependencies);
}

/**
 * Servientrega publishes an integration contract but issues customer-specific
 * routes and keys during onboarding. Only those server-resolved HTTPS routes
 * are accepted here; the browser never supplies them.
 */
export function createServientregaConnector(
  config: SouthAmericaContractConfig,
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  return southAmericaContractConnector('servientrega', config, dependencies);
}

/**
 * Blue Express enables direct API integration for contracted merchants. Route
 * versions are supplied by Blue Express and remain server-side configuration.
 */
export function createBlueExpressConnector(
  config: SouthAmericaContractConfig,
  dependencies?: ExpandedAmericasDependencies,
): ExpandedAmericasConnector {
  return southAmericaContractConnector('blue_express', config, dependencies);
}
