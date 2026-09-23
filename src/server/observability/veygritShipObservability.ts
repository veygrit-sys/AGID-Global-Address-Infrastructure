import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { Express, NextFunction, Request, Response } from 'express';

export type ShipCarrier =
  | 'ups' | 'dhl' | 'amazon_shipping' | 'loggi' | 'royal_mail' | 'inpost'
  | 'ninja_van' | 'delhivery' | 'pargo' | 'courier_guy' | 'sf_express' | 'four_px'
  | 'chilexpress' | 'coordinadora' | 'oca' | 'ninety_nine_minutos'
  | 'redpack' | 'estafeta' | 'jadlog' | 'total_express' | 'roadie'
  | 'gls' | 'dpd' | 'hermes_de' | 'paack' | 'mondial_relay' | 'packeta' | 'dsv' | 'geodis'
  | 'lalamove' | 'aramex_anz' | 'nz_couriers' | 'jt_express' | 'yamato'
  | 'collivery' | 'ram_couriers' | 'lilwa_delivery'
  | 'fez_delivery' | 'haulstow' | 'kwik_delivery' | 'gigl' | 'dodo_tanzania'
  | 'aramex_mena' | 'smsa_express' | 'naqel_express' | 'emirates_post' | 'bosta' | 'mylerz'
  | 'blue_dart' | 'dtdc' | 'gdex' | 'jne'
  | 'ghn' | 'ghtk' | 'grab_express' | 'gosend' | 'flash_express'
  | 'pathao_courier' | 'ecourier_bd' | 'leopards_courier' | 'domex_lk' | 'nepal_can_move'
  | 'yodel' | 'fan_courier' | 'acs_courier' | 'dachser' | 'sameday'
  | 'zto_express' | 'yto_express' | 'sto_express' | 'deppon'
  | 'jd_logistics' | 'cainiao_express'
  | 'dhl_parcel_de' | 'colissimo' | 'poste_italiane'
  | 'correos' | 'postnl' | 'bpost'
  | 'postnord' | 'swiss_post' | 'austrian_post' | 'ppl_cz'
  | 'omniva' | 'an_post' | 'ctt_portugal'
  | 'andreani' | 'servientrega' | 'blue_express';
export type ShipOperation = 'address_validation' | 'rate' | 'label' | 'return_label' | 'void' | 'tracking' | 'product' | 'manifest';
export type ShipOutcome = 'success' | 'failure';

const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,99}$/;
const REQUEST_ID_HEADERS = ['x-request-id', 'x-agid-request-id'] as const;
const HISTOGRAM_BUCKETS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 30] as const;
const DENIED_LOG_KEY = /(address|authorization|body|credential|email|label|name|phone|secret|token|url)/i;
const SECRET_VALUE = /(bearer\s+\S+|sk_live_|-----BEGIN .*PRIVATE KEY-----|AKIA[0-9A-Z]{16})/i;
const KEY_SEPARATOR = '\u001f';

export function resolveVeygritShipRequestId(headers: Request['headers']): string {
  for (const header of REQUEST_ID_HEADERS) {
    const value = headers[header];
    const candidate = Array.isArray(value) ? value[0] : value;
    if (typeof candidate === 'string' && SAFE_REQUEST_ID.test(candidate)) return candidate;
  }
  return randomUUID();
}

function safeLogValue(key: string, value: unknown): unknown {
  if (DENIED_LOG_KEY.test(key)) return '[REDACTED]';
  if (typeof value === 'string') return SECRET_VALUE.test(value) ? '[REDACTED]' : value.slice(0, 256);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  return undefined;
}

export type StructuredLogEvent = {
  level: 'info' | 'warn' | 'error';
  event: string;
  requestId?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  carrier?: ShipCarrier;
  operation?: ShipOperation;
  outcome?: ShipOutcome;
  errorCode?: string;
};

export class VeygritShipStructuredLogger {
  constructor(private readonly sink: (line: string) => void = line => process.stdout.write(`${line}\n`)) {}

  write(input: StructuredLogEvent): void {
    const record: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      service: 'veygrit-ship',
    };
    for (const [key, value] of Object.entries(input)) {
      const safe = safeLogValue(key, value);
      if (safe !== undefined) record[key] = safe;
    }
    this.sink(JSON.stringify(record));
  }
}

type HistogramState = { count: number; sum: number; buckets: number[] };

function labels(values: Record<string, string>): string {
  return `{${Object.entries(values).map(([key, value]) => `${key}="${value}"`).join(',')}}`;
}

function histogram(): HistogramState {
  return { count: 0, sum: 0, buckets: HISTOGRAM_BUCKETS.map(() => 0) };
}

export class VeygritShipMetrics {
  private readonly carrierRequests = new Map<string, number>();
  private readonly rateDurations = new Map<ShipCarrier, HistogramState>();
  private readonly labelCreations = new Map<string, number>();
  private readonly webhookDelays = new Map<ShipCarrier, HistogramState>();
  private readonly httpRequests = new Map<string, number>();

  recordCarrierOperation(carrier: ShipCarrier, operation: ShipOperation, outcome: ShipOutcome, durationMs: number): void {
    const key = [carrier, operation, outcome].join(KEY_SEPARATOR);
    this.carrierRequests.set(key, (this.carrierRequests.get(key) ?? 0) + 1);
    if (operation === 'rate') this.observe(this.rateDurations, carrier, durationMs / 1000);
    if (operation === 'label' || operation === 'return_label') {
      const labelKey = [carrier, operation, outcome].join(KEY_SEPARATOR);
      this.labelCreations.set(labelKey, (this.labelCreations.get(labelKey) ?? 0) + 1);
    }
  }

  recordWebhookDelay(carrier: ShipCarrier, delayMs: number): void {
    this.observe(this.webhookDelays, carrier, Math.max(0, delayMs) / 1000);
  }

  recordHttpRequest(method: string, route: string, statusCode: number): void {
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    const key = [method, route, statusClass].join(KEY_SEPARATOR);
    this.httpRequests.set(key, (this.httpRequests.get(key) ?? 0) + 1);
  }

  async observeCarrier<T>(carrier: ShipCarrier, operation: ShipOperation, task: () => Promise<T>): Promise<T> {
    const started = performance.now();
    try {
      const result = await task();
      this.recordCarrierOperation(carrier, operation, 'success', performance.now() - started);
      return result;
    } catch (error) {
      this.recordCarrierOperation(carrier, operation, 'failure', performance.now() - started);
      throw error;
    }
  }

  renderPrometheus(): string {
    const lines = [
      '# HELP veygrit_ship_observability_up Veygrit Ship observability exporter health.',
      '# TYPE veygrit_ship_observability_up gauge',
      'veygrit_ship_observability_up 1',
      '# HELP veygrit_ship_carrier_requests_total Carrier adapter operations by outcome.',
      '# TYPE veygrit_ship_carrier_requests_total counter',
    ];
    for (const [key, value] of [...this.carrierRequests].sort()) {
      const [carrier, operation, outcome] = key.split(KEY_SEPARATOR);
      lines.push(`veygrit_ship_carrier_requests_total${labels({ carrier, operation, outcome })} ${value}`);
    }
    lines.push('# HELP veygrit_ship_rate_duration_seconds End-to-end carrier rating latency.', '# TYPE veygrit_ship_rate_duration_seconds histogram');
    this.renderHistogram(lines, 'veygrit_ship_rate_duration_seconds', this.rateDurations);
    lines.push('# HELP veygrit_ship_label_creation_total Label and return-label creation outcomes.', '# TYPE veygrit_ship_label_creation_total counter');
    for (const [key, value] of [...this.labelCreations].sort()) {
      const [carrier, operation, outcome] = key.split(KEY_SEPARATOR);
      lines.push(`veygrit_ship_label_creation_total${labels({ carrier, operation, outcome })} ${value}`);
    }
    lines.push('# HELP veygrit_ship_webhook_delay_seconds Carrier event time to webhook acceptance.', '# TYPE veygrit_ship_webhook_delay_seconds histogram');
    this.renderHistogram(lines, 'veygrit_ship_webhook_delay_seconds', this.webhookDelays);
    lines.push('# HELP veygrit_ship_http_requests_total HTTP requests by stable route and status class.', '# TYPE veygrit_ship_http_requests_total counter');
    for (const [key, value] of [...this.httpRequests].sort()) {
      const [method, route, statusClass] = key.split(KEY_SEPARATOR);
      lines.push(`veygrit_ship_http_requests_total${labels({ method, route, status_class: statusClass })} ${value}`);
    }
    return `${lines.join('\n')}\n`;
  }

  private observe(map: Map<ShipCarrier, HistogramState>, carrier: ShipCarrier, value: number): void {
    const state = map.get(carrier) ?? histogram();
    state.count += 1;
    state.sum += value;
    HISTOGRAM_BUCKETS.forEach((bucket, index) => { if (value <= bucket) state.buckets[index] += 1; });
    map.set(carrier, state);
  }

  private renderHistogram(lines: string[], name: string, map: Map<ShipCarrier, HistogramState>): void {
    for (const [carrier, state] of [...map].sort(([a], [b]) => a.localeCompare(b))) {
      HISTOGRAM_BUCKETS.forEach((bucket, index) => lines.push(`${name}_bucket${labels({ carrier, le: String(bucket) })} ${state.buckets[index]}`));
      lines.push(`${name}_bucket${labels({ carrier, le: '+Inf' })} ${state.count}`);
      lines.push(`${name}_sum${labels({ carrier })} ${state.sum}`);
      lines.push(`${name}_count${labels({ carrier })} ${state.count}`);
    }
  }
}

function stableRoute(req: Request): string {
  const routePath = typeof req.route?.path === 'string' ? req.route.path : '';
  if (routePath) return `${req.baseUrl}${routePath}`.slice(0, 160);
  return '/unmatched';
}

export function createVeygritShipRequestMiddleware(logger: VeygritShipStructuredLogger, metrics: VeygritShipMetrics) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = resolveVeygritShipRequestId(req.headers);
    const started = performance.now();
    res.locals.veygritShipRequestId = requestId;
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-agid-request-id', requestId);
    res.once('finish', () => {
      const route = stableRoute(req);
      const durationMs = Math.round((performance.now() - started) * 100) / 100;
      metrics.recordHttpRequest(req.method, route, res.statusCode);
      logger.write({
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        event: 'http.request.completed', requestId, method: req.method, route, statusCode: res.statusCode, durationMs,
      });
    });
    next();
  };
}

function equal(actual: string, expected: string): boolean {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function registerVeygritShipMetricsRoute(app: Express, metrics: VeygritShipMetrics, apiKey = process.env.VEYGRIT_CARRIER_INTERNAL_API_KEY ?? ''): void {
  app.get('/api/internal/veygrit-ship/metrics', (req, res) => {
    res.setHeader('cache-control', 'no-store, private');
    const supplied = typeof req.headers['x-veygrit-internal-key'] === 'string' ? req.headers['x-veygrit-internal-key'] : '';
    if (!apiKey) return res.status(503).json({ ok: false, error: 'internal_metrics_not_configured' });
    if (!equal(supplied, apiKey)) return res.status(401).json({ ok: false, error: 'internal_auth_required' });
    res.type('text/plain; version=0.0.4; charset=utf-8');
    return res.status(200).send(metrics.renderPrometheus());
  });
}
