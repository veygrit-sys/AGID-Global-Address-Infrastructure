import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import type { UpsConnector, UpsSuccess } from '../carriers/ups/upsConnector';
import type { LabelInput, TrackingEventInput } from './veygritShipStore';
import type { ClaimedShipJob, VeygritShipWorkerStore } from './veygritShipWorkerStore';

export type TrackingWorkerResult = {
  status?: 'created' | 'in_transit' | 'delivered' | 'failed';
  events: TrackingEventInput[];
  nextPollAt?: string;
  nextReconcileAt?: string;
};

export type CarrierReconciliationResult = {
  status?: 'created' | 'in_transit' | 'delivered' | 'voided' | 'failed';
  nextReconcileAt?: string;
};

export type LabelOutcomeResult =
  | { outcome: 'found'; label: LabelInput }
  | { outcome: 'not_found' }
  | { outcome: 'pending' };

export interface CarrierWorkerGateway {
  fetchTracking(job: ClaimedShipJob): Promise<TrackingWorkerResult>;
  reconcileCarrierState(job: ClaimedShipJob): Promise<CarrierReconciliationResult>;
  reconcileLabelOutcome(job: ClaimedShipJob): Promise<LabelOutcomeResult>;
  refreshUpsToken(job: ClaimedShipJob): Promise<{ expiresAt: string }>;
}

export class ConnectorCarrierWorkerGateway implements CarrierWorkerGateway {
  constructor(private readonly dependencies: {
    resolveUpsConnector: (connectionRef: string) => Promise<UpsConnector> | UpsConnector;
    normalizeUpsTracking: (response: UpsSuccess, job: ClaimedShipJob) => Promise<TrackingWorkerResult> | TrackingWorkerResult;
    fetchDhlTracking: (job: ClaimedShipJob) => Promise<TrackingWorkerResult>;
    reconcileLabelOutcome: (job: ClaimedShipJob) => Promise<LabelOutcomeResult>;
    reconcileCarrierState?: (job: ClaimedShipJob) => Promise<CarrierReconciliationResult>;
  }) {}

  async fetchTracking(job: ClaimedShipJob): Promise<TrackingWorkerResult> {
    if (job.carrier === 'ups') {
      const connector = await this.dependencies.resolveUpsConnector(jobRequirement(job.connectionRef, 'connectionRef'));
      const response = await connector.track(jobRequirement(job.trackingNumber, 'trackingNumber'));
      return this.dependencies.normalizeUpsTracking(response, job);
    }
    if (job.carrier === 'dhl') return this.dependencies.fetchDhlTracking(job);
    throw new ShipWorkerError('WORKER_CARRIER_UNSUPPORTED', 'Tracking job has no supported carrier.', false);
  }

  async reconcileCarrierState(job: ClaimedShipJob): Promise<CarrierReconciliationResult> {
    if (this.dependencies.reconcileCarrierState) return this.dependencies.reconcileCarrierState(job);
    if (!job.trackingNumber) {
      throw new ShipWorkerError('CARRIER_RECONCILIATION_REFERENCE_MISSING', 'Carrier reconciliation needs a tracking reference.', false);
    }
    const tracking = await this.fetchTracking(job);
    return { status: tracking.status, nextReconcileAt: tracking.nextReconcileAt };
  }

  reconcileLabelOutcome(job: ClaimedShipJob): Promise<LabelOutcomeResult> {
    return this.dependencies.reconcileLabelOutcome(job);
  }

  async refreshUpsToken(job: ClaimedShipJob): Promise<{ expiresAt: string }> {
    if (job.carrier !== 'ups') throw new ShipWorkerError('WORKER_JOB_INVALID', 'Token refresh job is not for UPS.', false);
    const connector = await this.dependencies.resolveUpsConnector(jobRequirement(job.connectionRef, 'connectionRef'));
    return connector.refreshOAuthToken();
  }
}

export class ShipWorkerError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
    readonly retryAfterMs?: number,
    readonly responseStatus?: number,
  ) {
    super(message);
    this.name = 'ShipWorkerError';
  }
}

function jobRequirement(value: string | undefined, name: string): string {
  if (!value) throw new ShipWorkerError('WORKER_JOB_INVALID', `${name} is missing from worker job.`, false);
  return value;
}

function normalizedError(error: unknown): ShipWorkerError {
  if (error instanceof ShipWorkerError) return error;
  if (error && typeof error === 'object') {
    const common = (error as { common?: { error?: { code?: unknown; retryable?: unknown; retryAfterMs?: unknown; message?: unknown } } }).common;
    if (common?.error) {
      return new ShipWorkerError(
        typeof common.error.code === 'string' ? common.error.code : 'CARRIER_ERROR',
        typeof common.error.message === 'string' ? common.error.message : 'Carrier worker request failed.',
        common.error.retryable === true,
        typeof common.error.retryAfterMs === 'number' ? common.error.retryAfterMs : undefined,
      );
    }
  }
  return new ShipWorkerError('WORKER_UNEXPECTED_ERROR', error instanceof Error ? error.message : 'Worker operation failed.', true);
}

export class VeygritShipAsyncWorker {
  constructor(
    private readonly store: VeygritShipWorkerStore,
    private readonly gateway: CarrierWorkerGateway,
    private readonly options: {
      workerRef: string;
      batchSize?: number;
      leaseSeconds?: number;
      concurrency?: number;
      now?: () => number;
      random?: () => number;
    },
  ) {}

  async runOnce(): Promise<{ claimed: number; succeeded: number; retried: number; deadLettered: number }> {
    const jobs = await this.store.claimJobs(this.options.workerRef, this.options.batchSize ?? 10, this.options.leaseSeconds ?? 60);
    const concurrency = Math.max(1, Math.min(20, Math.trunc(this.options.concurrency ?? 4)));
    let cursor = 0;
    const counters = { claimed: jobs.length, succeeded: 0, retried: 0, deadLettered: 0 };
    const worker = async () => {
      while (cursor < jobs.length) {
        const job = jobs[cursor++];
        try {
          await this.process(job);
          await this.store.completeJob(job.jobRef);
          counters.succeeded += 1;
        } catch (rawError) {
          const error = normalizedError(rawError);
          const result = await this.store.failJob({
            jobRef: job.jobRef,
            errorCode: error.code,
            errorMessage: error.message,
            retryable: error.retryable,
            nextRunAt: new Date(this.now() + this.retryDelay(job.attemptCount, error.retryAfterMs)).toISOString(),
          });
          if (result === 'retry') counters.retried += 1;
          else counters.deadLettered += 1;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, jobs.length)) }, worker));
    return counters;
  }

  private async process(job: ClaimedShipJob): Promise<void> {
    if (job.jobType === 'tracking_update') {
      jobRequirement(job.shipmentRef, 'shipmentRef');
      jobRequirement(job.trackingNumber, 'trackingNumber');
      const result = await this.gateway.fetchTracking(job);
      await this.store.recordTrackingSync({
        shipmentRef: job.shipmentRef!, ...result,
        ...(result.status === 'delivered' ? {} : { nextPollAt: result.nextPollAt ?? new Date(this.now() + 15 * 60_000).toISOString() }),
        nextReconcileAt: result.nextReconcileAt ?? new Date(this.now() + 6 * 60 * 60_000).toISOString(),
      });
      return;
    }
    if (job.jobType === 'carrier_reconciliation') {
      jobRequirement(job.shipmentRef, 'shipmentRef');
      const result = await this.gateway.reconcileCarrierState(job);
      await this.store.recordCarrierReconciliation({
        shipmentRef: job.shipmentRef!, ...result,
        ...(result.status === 'delivered' || result.status === 'voided'
          ? {}
          : { nextReconcileAt: result.nextReconcileAt ?? new Date(this.now() + 6 * 60 * 60_000).toISOString() }),
      });
      return;
    }
    if (job.jobType === 'label_outcome_reconciliation') {
      jobRequirement(job.shipmentRef, 'shipmentRef');
      jobRequirement(job.labelRequestId, 'labelRequestId');
      await this.store.markLabelReconciling(job.shipmentRef!);
      const result = await this.gateway.reconcileLabelOutcome(job);
      if (result.outcome === 'found') {
        if (result.label.shipmentRef !== job.shipmentRef) {
          throw new ShipWorkerError('LABEL_RECONCILIATION_MISMATCH', 'Reconciled label belongs to another shipment.', false);
        }
        await this.store.recordLabelFound(result.label);
        return;
      }
      if (result.outcome === 'not_found') {
        await this.store.recordLabelNotFound(job.shipmentRef!);
        return;
      }
      const deadline = job.labelReconciliationDeadlineAt ? Date.parse(job.labelReconciliationDeadlineAt) : Number.POSITIVE_INFINITY;
      if (deadline <= this.now()) {
        throw new ShipWorkerError(
          'LABEL_RECONCILIATION_DEADLINE_EXCEEDED',
          'Carrier could not determine the label outcome before the reconciliation deadline. Manual review is required.',
          false,
        );
      }
      throw new ShipWorkerError('LABEL_OUTCOME_PENDING', 'Carrier has not exposed the label result yet.', true, 30_000);
    }
    if (job.jobType === 'ups_token_refresh') {
      jobRequirement(job.connectionRef, 'connectionRef');
      if (job.carrier !== 'ups') throw new ShipWorkerError('WORKER_JOB_INVALID', 'UPS token job has a non-UPS connection.', false);
      const refreshed = await this.gateway.refreshUpsToken(job);
      await this.store.recordUpsTokenRefresh(job.connectionRef!, refreshed.expiresAt);
      return;
    }
    const neverJob: never = job.jobType;
    throw new ShipWorkerError('WORKER_JOB_UNSUPPORTED', `Unsupported job type: ${neverJob}`, false);
  }

  private now(): number { return (this.options.now ?? Date.now)(); }

  private retryDelay(attempt: number, retryAfterMs?: number): number {
    if (retryAfterMs !== undefined) return Math.max(1_000, Math.min(6 * 60 * 60_000, retryAfterMs));
    const base = Math.min(6 * 60 * 60_000, 5_000 * (2 ** Math.max(0, attempt - 1)));
    return Math.ceil(base * (0.8 + (this.options.random ?? Math.random)() * 0.4));
  }
}

export type WebhookClaim = {
  delivery_ref: string;
  endpoint_ref: string;
  event_type: string;
  event_ref: string;
  payload_ref: string;
  payload_sha256: string;
  attempt_count: number;
  max_attempts: number;
};

export interface WebhookDeliveryStore {
  claimWebhookDeliveries(limit: number, leaseSeconds?: number): Promise<Record<string, unknown>[]>;
  finishWebhookDelivery(input: {
    deliveryRef: string;
    outcome: 'succeeded' | 'retry' | 'dead_letter';
    nextAttemptAt?: string;
    responseStatus?: number;
    errorCode?: string;
  }): Promise<'succeeded' | 'retry' | 'dead_letter'>;
}

export interface WebhookResourceResolver {
  resolve(input: WebhookClaim): Promise<{ url: string; body: string; signingSecret: string; headers?: Record<string, string> }>;
}

function webhookClaim(row: Record<string, unknown>): WebhookClaim {
  const requiredString = (key: keyof WebhookClaim) => {
    const value = row[key];
    if (typeof value !== 'string' || !value) throw new ShipWorkerError('WEBHOOK_ROW_INVALID', `${key} is missing.`, false);
    return value;
  };
  return {
    delivery_ref: requiredString('delivery_ref'), endpoint_ref: requiredString('endpoint_ref'),
    event_type: requiredString('event_type'), event_ref: requiredString('event_ref'),
    payload_ref: requiredString('payload_ref'), payload_sha256: requiredString('payload_sha256'),
    attempt_count: Number(row.attempt_count), max_attempts: Number(row.max_attempts),
  };
}

function safeWebhookUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch {
    throw new ShipWorkerError('WEBHOOK_ENDPOINT_DENIED', 'Webhook endpoint is not a valid URL.', false);
  }
  const host = url.hostname.toLowerCase();
  const privateHost = host === 'localhost' || host === '::1' || host === '[::1]' || host.endsWith('.local')
    || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)
    || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || privateHost) {
    throw new ShipWorkerError('WEBHOOK_ENDPOINT_DENIED', 'Webhook endpoint is not an allowed public HTTPS URL.', false);
  }
  return url;
}

function retryAfter(response: Response, now: number): number | undefined {
  const raw = response.headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(6 * 60 * 60_000, seconds * 1000);
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? Math.max(0, Math.min(6 * 60 * 60_000, timestamp - now)) : undefined;
}

export class VeygritShipWebhookWorker {
  constructor(
    private readonly store: WebhookDeliveryStore,
    private readonly resolver: WebhookResourceResolver,
    private readonly options: {
      fetch?: typeof fetch;
      now?: () => number;
      random?: () => number;
      timeoutMs?: number;
      batchSize?: number;
      leaseSeconds?: number;
      allowEndpoint?: (url: URL) => boolean | Promise<boolean>;
    } = {},
  ) {}

  async runOnce(): Promise<{ claimed: number; succeeded: number; retried: number; deadLettered: number }> {
    const rows = await this.store.claimWebhookDeliveries(this.options.batchSize ?? 20, this.options.leaseSeconds ?? 60);
    const counters = { claimed: rows.length, succeeded: 0, retried: 0, deadLettered: 0 };
    for (const row of rows) {
      let claim: WebhookClaim;
      try {
        claim = webhookClaim(row);
        const responseStatus = await this.deliver(claim);
        await this.store.finishWebhookDelivery({ deliveryRef: claim.delivery_ref, outcome: 'succeeded', responseStatus });
        counters.succeeded += 1;
      } catch (rawError) {
        const error = normalizedError(rawError);
        const attemptCount = Number(row.attempt_count);
        const maxAttempts = Number(row.max_attempts);
        const deadLetter = !error.retryable || !Number.isFinite(attemptCount) || attemptCount >= maxAttempts;
        const storedOutcome = await this.store.finishWebhookDelivery({
          deliveryRef: typeof row.delivery_ref === 'string' ? row.delivery_ref : 'invalid-delivery-ref',
          outcome: deadLetter ? 'dead_letter' : 'retry',
          ...(deadLetter ? {} : { nextAttemptAt: new Date(this.now() + this.retryDelay(attemptCount, error.retryAfterMs)).toISOString() }),
          errorCode: error.code,
          responseStatus: error.responseStatus,
        });
        if (storedOutcome === 'dead_letter') counters.deadLettered += 1;
        else counters.retried += 1;
      }
    }
    return counters;
  }

  private async deliver(claim: WebhookClaim): Promise<number> {
    const resource = await this.resolver.resolve(claim);
    const url = safeWebhookUrl(resource.url);
    if (this.options.allowEndpoint && !await this.options.allowEndpoint(url)) {
      throw new ShipWorkerError('WEBHOOK_ENDPOINT_DENIED', 'Webhook endpoint was rejected by the deployment allowlist.', false);
    }
    if (!resource.signingSecret) throw new ShipWorkerError('WEBHOOK_SECRET_MISSING', 'Webhook signing secret was not resolved.', false);
    const payloadHash = createHash('sha256').update(resource.body).digest('hex');
    const expectedHash = Buffer.from(claim.payload_sha256, 'hex');
    const actualHash = Buffer.from(payloadHash, 'hex');
    if (expectedHash.length !== actualHash.length || !timingSafeEqual(expectedHash, actualHash)) {
      throw new ShipWorkerError('WEBHOOK_PAYLOAD_HASH_MISMATCH', 'Resolved webhook payload failed integrity verification.', false);
    }
    const timestamp = Math.floor(this.now() / 1000).toString();
    const signature = createHmac('sha256', resource.signingSecret).update(`${timestamp}.${resource.body}`).digest('hex');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 10_000);
    try {
      const response = await (this.options.fetch ?? fetch)(url, {
        method: 'POST', body: resource.body, signal: controller.signal,
        headers: {
          ...resource.headers,
          'content-type': 'application/json',
          'user-agent': 'Veygrit-ship-Webhooks/1.0',
          'veygrit-event-id': claim.event_ref,
          'veygrit-event-type': claim.event_type,
          'veygrit-signature': `t=${timestamp},v1=${signature}`,
        },
      });
      if (response.ok) return response.status;
      const retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
      throw new ShipWorkerError(`WEBHOOK_HTTP_${response.status}`, 'Webhook endpoint rejected the delivery.', retryable, retryAfter(response, this.now()), response.status);
    } catch (error) {
      if (error instanceof ShipWorkerError) throw error;
      const timedOut = error instanceof Error && error.name === 'AbortError';
      throw new ShipWorkerError(timedOut ? 'WEBHOOK_TIMEOUT' : 'WEBHOOK_NETWORK_ERROR',
        timedOut ? 'Webhook delivery timed out.' : 'Webhook endpoint could not be reached.', true);
    } finally {
      clearTimeout(timer);
    }
  }

  private now(): number { return (this.options.now ?? Date.now)(); }

  private retryDelay(attempt: number, retryAfterMs?: number): number {
    if (retryAfterMs !== undefined) return Math.max(1_000, retryAfterMs);
    const base = Math.min(6 * 60 * 60_000, 5_000 * (2 ** Math.max(0, attempt - 1)));
    return Math.ceil(base * (0.8 + (this.options.random ?? Math.random)() * 0.4));
  }
}

export interface WorkerSchedulerStore {
  scheduleDueJobs(): Promise<{ acquired: boolean; tracking: number; carrierReconciliation: number; labelOutcome: number; upsTokenRefresh: number }>;
}

export class VeygritShipWorkerRuntime {
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<unknown>;

  constructor(
    private readonly scheduler: WorkerSchedulerStore,
    private readonly carrierWorker: Pick<VeygritShipAsyncWorker, 'runOnce'>,
    private readonly webhookWorker: Pick<VeygritShipWebhookWorker, 'runOnce'>,
    private readonly intervalMs = 15_000,
  ) {
    if (!Number.isFinite(intervalMs) || intervalMs < 1_000) throw new TypeError('Worker interval must be at least one second.');
  }

  async runCycle() {
    const scheduled = await this.scheduler.scheduleDueJobs();
    const [carrier, webhook] = await Promise.all([this.carrierWorker.runOnce(), this.webhookWorker.runOnce()]);
    return { scheduled, carrier, webhook };
  }

  start(): void {
    if (this.timer) return;
    const tick = () => {
      if (this.running) return;
      this.running = this.runCycle().finally(() => { this.running = undefined; });
      void this.running.catch(() => { /* caller observes failures through job/DLQ state and runtime telemetry */ });
    };
    tick();
    this.timer = setInterval(tick, this.intervalMs);
    this.timer.unref?.();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    await this.running;
  }
}
