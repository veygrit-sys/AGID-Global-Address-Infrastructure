export type JsonObject = Record<string, unknown>;
export type RequestOptions = { idempotencyKey?: string; signal?: AbortSignal };
export type ClientOptions = { apiKey: string; baseUrl?: string; timeoutMs?: number; maxRetries?: number; fetch?: typeof fetch };

export class VeygritShipError extends Error {
  constructor(message: string, readonly status: number, readonly code: string, readonly requestId?: string, readonly details?: unknown) {
    super(message); this.name = 'VeygritShipError';
  }
}

const isRetryable = (status: number) => status === 408 || status === 429 || status >= 500;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const newKey = () => globalThis.crypto?.randomUUID?.() ?? `vgr-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class VeygritShip {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClientOptions) {
    if (!options.apiKey) throw new TypeError('apiKey is required');
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://api.veygrit.com').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetchImpl = options.fetch ?? fetch;
  }

  private async request<T>(method: string, path: string, body?: JsonObject, options: RequestOptions = {}): Promise<T> {
    const key = method === 'GET' ? undefined : options.idempotencyKey ?? newKey();
    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const abortFromCaller = () => controller.abort();
      options.signal?.addEventListener('abort', abortFromCaller, { once: true });
      const signal = controller.signal;
      try {
        const response = await this.fetchImpl(`${this.baseUrl}${path}`, { method, signal, headers: { accept: 'application/json', authorization: `Bearer ${this.apiKey}`, 'x-request-id': newKey(), ...(key ? { 'idempotency-key': key } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
        const payload = await response.json().catch(() => null) as JsonObject | null;
        if (response.ok) return payload as T;
        if (attempt < this.maxRetries && isRetryable(response.status)) { const seconds = Number(response.headers.get('retry-after')); await wait(Number.isFinite(seconds) ? seconds * 1000 : Math.min(250 * 2 ** attempt, 2_000)); continue; }
        throw new VeygritShipError(String(payload?.message ?? 'Veygrit -ship API request failed'), response.status, String(payload?.error ?? 'api_request_failed'), response.headers.get('x-request-id') ?? undefined, payload);
      } catch (error) {
        if (error instanceof VeygritShipError) throw error;
        if (attempt < this.maxRetries && !options.signal?.aborted) { await wait(Math.min(250 * 2 ** attempt, 2_000)); continue; }
        throw new VeygritShipError(error instanceof Error ? error.message : 'Network request failed', 0, options.signal?.aborted ? 'request_aborted' : 'network_error');
      } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abortFromCaller); }
    }
  }

  rates = { create: (input: JsonObject, options?: RequestOptions) => this.request<JsonObject>('POST', '/v1/delivery/rates', input, options) };
  shipments = { create: (input: JsonObject, options?: RequestOptions) => this.request<JsonObject>('POST', '/v1/shipments', input, options), retrieve: (ref: string) => this.request<JsonObject>('GET', `/v1/shipments/${encodeURIComponent(ref)}`), void: (ref: string, options?: RequestOptions) => this.request<JsonObject>('POST', `/v1/shipments/${encodeURIComponent(ref)}/void`, {}, options), tracking: (ref: string) => this.request<JsonObject>('GET', `/v1/shipments/${encodeURIComponent(ref)}/tracking`) };
  origins = { list: () => this.request<JsonObject>('GET', '/v1/shipping-origins'), create: (input: JsonObject, options?: RequestOptions) => this.request<JsonObject>('POST', '/v1/shipping-origins', input, options) };
  returns = { create: (input: JsonObject, options?: RequestOptions) => this.request<JsonObject>('POST', '/v1/returns', input, options) };
  pickups = { create: (input: JsonObject, options?: RequestOptions) => this.request<JsonObject>('POST', '/v1/pickups', input, options) };
  webhooks = { list: () => this.request<JsonObject>('GET', '/v1/webhooks'), create: (input: JsonObject, options?: RequestOptions) => this.request<JsonObject>('POST', '/v1/webhooks', input, options), update: (ref: string, input: JsonObject, options?: RequestOptions) => this.request<JsonObject>('PATCH', `/v1/webhooks/${encodeURIComponent(ref)}`, input, options), redeliver: (ref: string, options?: RequestOptions) => this.request<JsonObject>('POST', `/v1/webhook-deliveries/${encodeURIComponent(ref)}/redeliver`, {}, options) };
  team = { invite: (input: JsonObject, options?: RequestOptions) => this.request<JsonObject>('POST', '/v1/team/invitations', input, options) };
  usage = { retrieve: () => this.request<JsonObject>('GET', '/v1/billing/usage') };
}

export default VeygritShip;
