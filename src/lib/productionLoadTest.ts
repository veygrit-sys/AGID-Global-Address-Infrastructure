export const PRODUCTION_LOAD_TEST_ACK = 'I_UNDERSTAND_THIS_HITS_PRODUCTION';

export type ProductionLoadTestMethod = 'GET' | 'HEAD';

export type ProductionLoadTestEndpoint = {
  name: string;
  method?: ProductionLoadTestMethod;
  path: string;
  expectedStatus?: number;
  weight?: number;
};

export type ProductionLoadTestStopConditions = {
  maxErrorRate: number;
  maxConsecutiveFailures: number;
  maxP95Ms: number;
};

export type ProductionLoadTestInput = {
  baseUrl?: string;
  allowedHosts?: string[];
  ack?: string;
  dryRun?: boolean;
  rps?: number;
  durationSeconds?: number;
  concurrency?: number;
  requestTimeoutMs?: number;
  endpoints?: ProductionLoadTestEndpoint[];
  stopConditions?: Partial<ProductionLoadTestStopConditions>;
};

export type ProductionLoadTestPlan = {
  baseUrl: string;
  host: string;
  dryRun: boolean;
  rps: number;
  durationSeconds: number;
  concurrency: number;
  requestTimeoutMs: number;
  totalRequests: number;
  endpoints: Required<Pick<ProductionLoadTestEndpoint, 'name' | 'method' | 'path' | 'expectedStatus' | 'weight'>>[];
  stopConditions: ProductionLoadTestStopConditions;
  warnings: string[];
};

export type ProductionLoadTestResult = {
  plan: ProductionLoadTestPlan;
  dryRun: boolean;
  startedAt: string;
  completedAt: string;
  totalRequests: number;
  completedRequests: number;
  okRequests: number;
  failedRequests: number;
  errorRate: number;
  statusCounts: Record<string, number>;
  latencyMs: {
    min: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  stopReason?: string;
};

export type ProductionLoadTestFetch = (
  url: string,
  init: { method: ProductionLoadTestMethod; signal: AbortSignal; headers: Record<string, string> },
) => Promise<{ status: number }>;

const DEFAULT_STOP_CONDITIONS: ProductionLoadTestStopConditions = {
  maxErrorRate: 0.02,
  maxConsecutiveFailures: 3,
  maxP95Ms: 1500,
};

const DEFAULT_ENDPOINTS: ProductionLoadTestEndpoint[] = [
  { name: 'health', path: '/api/health', expectedStatus: 200, weight: 3 },
  { name: 'address-resolution-capabilities', path: '/api/address-resolution/capabilities', expectedStatus: 200, weight: 1 },
  { name: 'address-verify-capabilities', path: '/api/address/verify/capabilities', expectedStatus: 200, weight: 1 },
];

const PRIVATE_PATH_MARKERS = [
  'address=',
  'addressText=',
  'rawAddress',
  'recipient=',
  'ownerName=',
  'privateKey',
  'witness',
  'plaintext',
  'AGID-S',
  'agidSecure',
];

function cleanHost(host: string) {
  return host.trim().toLowerCase();
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function parseBaseUrl(value: string | undefined) {
  if (!value) throw new Error('AGID_LOAD_TEST_BASE_URL is required.');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('AGID_LOAD_TEST_BASE_URL must be a valid absolute URL.');
  }
  if (url.protocol !== 'https:') {
    throw new Error('Production load tests require an https:// base URL.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Production load test base URL must not include credentials, query, or hash.');
  }
  return url;
}

function normalizeEndpoint(endpoint: ProductionLoadTestEndpoint) {
  const method = endpoint.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    throw new Error(`Endpoint ${endpoint.name} uses unsafe method ${method}. Production load tests are read-only.`);
  }
  if (!endpoint.name || !/^[A-Za-z0-9._:-]{1,80}$/.test(endpoint.name)) {
    throw new Error('Each endpoint needs a short safe name.');
  }
  if (!endpoint.path.startsWith('/')) {
    throw new Error(`Endpoint ${endpoint.name} must use a root-relative path.`);
  }
  if (endpoint.path.startsWith('//') || endpoint.path.includes('\\')) {
    throw new Error(`Endpoint ${endpoint.name} has an unsafe path.`);
  }
  const lowerPath = endpoint.path.toLowerCase();
  for (const marker of PRIVATE_PATH_MARKERS) {
    if (lowerPath.includes(marker.toLowerCase())) {
      throw new Error(`Endpoint ${endpoint.name} looks like it carries private address material.`);
    }
  }
  return {
    name: endpoint.name,
    method,
    path: endpoint.path,
    expectedStatus: endpoint.expectedStatus ?? 200,
    weight: boundedNumber(endpoint.weight, 1, 1, 20),
  };
}

export function createProductionLoadTestPlan(input: ProductionLoadTestInput): ProductionLoadTestPlan {
  const base = parseBaseUrl(input.baseUrl);
  const allowedHosts = (input.allowedHosts ?? []).map(cleanHost).filter(Boolean);
  if (allowedHosts.length === 0) {
    throw new Error('AGID_LOAD_TEST_ALLOWED_HOSTS must include the production host.');
  }
  if (!allowedHosts.includes(cleanHost(base.hostname))) {
    throw new Error(`Host ${base.hostname} is not in AGID_LOAD_TEST_ALLOWED_HOSTS.`);
  }

  const dryRun = input.dryRun !== false;
  if (!dryRun && input.ack !== PRODUCTION_LOAD_TEST_ACK) {
    throw new Error(`Set AGID_LOAD_TEST_ACK=${PRODUCTION_LOAD_TEST_ACK} before sending production traffic.`);
  }

  const endpoints = (input.endpoints?.length ? input.endpoints : DEFAULT_ENDPOINTS).map(normalizeEndpoint);
  const rps = boundedNumber(input.rps, 2, 0.1, 20);
  const durationSeconds = boundedNumber(input.durationSeconds, 30, 1, 120);
  const concurrency = Math.floor(boundedNumber(input.concurrency, 2, 1, 10));
  const requestTimeoutMs = Math.floor(boundedNumber(input.requestTimeoutMs, 5000, 500, 10_000));
  const totalRequests = Math.max(1, Math.floor(rps * durationSeconds));
  const stopConditions = {
    ...DEFAULT_STOP_CONDITIONS,
    ...input.stopConditions,
  };
  const warnings = [
    'No request bodies are sent.',
    'Only GET/HEAD endpoints are allowed.',
    'Response bodies are not stored in the report.',
  ];

  if (totalRequests > 1000) {
    warnings.push('Request count is high for direct production testing; prefer a canary window first.');
  }

  return {
    baseUrl: base.toString().replace(/\/$/, ''),
    host: base.hostname,
    dryRun,
    rps,
    durationSeconds,
    concurrency,
    requestTimeoutMs,
    totalRequests,
    endpoints,
    stopConditions,
    warnings,
  };
}

function pickEndpoint(plan: ProductionLoadTestPlan, index: number) {
  const totalWeight = plan.endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
  let slot = index % totalWeight;
  for (const endpoint of plan.endpoints) {
    if (slot < endpoint.weight) return endpoint;
    slot -= endpoint.weight;
  }
  return plan.endpoints[0];
}

function percentile(sorted: number[], ratio: number) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio));
  return sorted[index];
}

function summarize(plan: ProductionLoadTestPlan, startedAt: Date, completedAt: Date, samples: { ok: boolean; status: number; latency: number }[], stopReason?: string): ProductionLoadTestResult {
  const latencies = samples.map(sample => sample.latency).sort((a, b) => a - b);
  const sumLatency = latencies.reduce((sum, value) => sum + value, 0);
  const statusCounts: Record<string, number> = {};
  for (const sample of samples) {
    statusCounts[String(sample.status)] = (statusCounts[String(sample.status)] ?? 0) + 1;
  }
  const okRequests = samples.filter(sample => sample.ok).length;
  const failedRequests = samples.length - okRequests;
  return {
    plan,
    dryRun: plan.dryRun,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    totalRequests: plan.totalRequests,
    completedRequests: samples.length,
    okRequests,
    failedRequests,
    errorRate: samples.length === 0 ? 0 : failedRequests / samples.length,
    statusCounts,
    latencyMs: {
      min: latencies[0] ?? 0,
      avg: latencies.length === 0 ? 0 : Math.round(sumLatency / latencies.length),
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
      max: latencies[latencies.length - 1] ?? 0,
    },
    stopReason,
  };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runProductionLoadTest(
  plan: ProductionLoadTestPlan,
  options: {
    fetchImpl?: ProductionLoadTestFetch;
    headers?: Record<string, string>;
  } = {},
): Promise<ProductionLoadTestResult> {
  const startedAt = new Date();
  if (plan.dryRun) {
    return summarize(plan, startedAt, new Date(), [], 'dry-run-no-traffic-sent');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const samples: { ok: boolean; status: number; latency: number }[] = [];
  const inFlight = new Set<Promise<void>>();
  let consecutiveFailures = 0;
  let stopReason: string | undefined;

  async function launch(index: number) {
    const endpoint = pickEndpoint(plan, index);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), plan.requestTimeoutMs);
    const requestStart = Date.now();
    try {
      const response = await fetchImpl(`${plan.baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'X-AGID-Load-Test': 'read-only-canary',
          ...(options.headers ?? {}),
        },
      });
      const latency = Date.now() - requestStart;
      const ok = response.status === endpoint.expectedStatus;
      samples.push({ ok, status: response.status, latency });
      consecutiveFailures = ok ? 0 : consecutiveFailures + 1;
    } catch {
      samples.push({ ok: false, status: 0, latency: Date.now() - requestStart });
      consecutiveFailures += 1;
    } finally {
      clearTimeout(timeout);
    }
  }

  const intervalMs = 1000 / plan.rps;
  for (let index = 0; index < plan.totalRequests; index += 1) {
    if (stopReason) break;
    const scheduledAt = startedAt.getTime() + index * intervalMs;
    const waitMs = scheduledAt - Date.now();
    if (waitMs > 0) await sleep(waitMs);

    while (inFlight.size >= plan.concurrency) {
      await Promise.race(inFlight);
    }

    const promise = launch(index);
    inFlight.add(promise);
    promise.finally(() => inFlight.delete(promise));

    const currentErrorRate = samples.length === 0 ? 0 : samples.filter(sample => !sample.ok).length / samples.length;
    const sortedLatencies = samples.map(sample => sample.latency).sort((a, b) => a - b);
    if (consecutiveFailures >= plan.stopConditions.maxConsecutiveFailures) {
      stopReason = 'max-consecutive-failures';
    } else if (samples.length >= 10 && currentErrorRate > plan.stopConditions.maxErrorRate) {
      stopReason = 'max-error-rate';
    } else if (samples.length >= 10 && percentile(sortedLatencies, 0.95) > plan.stopConditions.maxP95Ms) {
      stopReason = 'max-p95-latency';
    }
  }

  await Promise.allSettled(inFlight);
  return summarize(plan, startedAt, new Date(), samples, stopReason);
}
