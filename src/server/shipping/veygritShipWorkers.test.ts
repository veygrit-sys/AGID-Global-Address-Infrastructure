import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import type { LabelInput, SqlClient, SqlPool, SqlResult } from './veygritShipStore';
import { VeygritShipWorkerStore } from './veygritShipWorkerStore';
import {
  ConnectorCarrierWorkerGateway,
  ShipWorkerError,
  VeygritShipAsyncWorker,
  VeygritShipWorkerRuntime,
  VeygritShipWebhookWorker,
  type CarrierWorkerGateway,
  type WebhookClaim,
} from './veygritShipWorkers';

test('worker migration adds durable leases, DLQs, reconciliation state, and due indexes', async () => {
  const sql = await readFile(new URL('../../../db/veygrit-ship-workers.postgres.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS veygrit_ship_async_job/i);
  assert.match(sql, /label_outcome/i);
  assert.match(sql, /next_tracking_poll_at/i);
  assert.match(sql, /next_carrier_reconcile_at/i);
  assert.match(sql, /next_token_refresh_at/i);
  assert.match(sql, /WHERE status = 'dead_letter'/i);
  assert.match(sql, /veygrit_ship_async_job_active_dedupe_uq/i);
  assert.match(sql, /CHECK \(max_attempts BETWEEN 1 AND 100\)/i);
});

class ClaimPool implements SqlPool, SqlClient {
  calls: Array<{ sql: string; values: readonly unknown[] }> = [];
  async query<Row>(sql: string, values: readonly unknown[] = []): Promise<SqlResult<Row>> {
    this.calls.push({ sql, values });
    if (sql.includes('WITH candidates')) return { rows: [{
      job_ref: 'job-1', job_type: 'tracking_update', attempt_count: 1, max_attempts: 8,
      shipment_ref: 'ship-1', label_ref: 'label-1', connection_ref: 'conn-1', carrier: 'ups', adapter: 'ups',
      carrier_tracking_number: '1Z999AA10123456784', label_request_id: null, label_reconciliation_deadline_at: null,
    }] as Row[] };
    return { rows: [] };
  }
  async connect(): Promise<SqlClient> { return this; }
  release(): void {}
}

test('general job claim atomically leases rows with SKIP LOCKED and reclaims expired workers', async () => {
  const pool = new ClaimPool();
  const jobs = await new VeygritShipWorkerStore(pool).claimJobs('worker-1', 500, 9999);
  assert.equal(jobs[0].trackingNumber, '1Z999AA10123456784');
  assert.match(pool.calls[0].sql, /FOR UPDATE SKIP LOCKED/i);
  assert.match(pool.calls[0].sql, /status='running' AND lease_expires_at<=now\(\)/i);
  assert.deepEqual(pool.calls[0].values, [100, 'worker-1', 900]);
});

class FakeJobStore {
  jobs: any[] = [];
  completed: string[] = [];
  failed: any[] = [];
  tracking: any[] = [];
  carrier: any[] = [];
  labels: LabelInput[] = [];
  tokens: any[] = [];
  reconciling: string[] = [];

  async claimJobs() { return this.jobs.splice(0); }
  async completeJob(jobRef: string) { this.completed.push(jobRef); }
  async failJob(input: any) { this.failed.push(input); return input.retryable ? 'retry' as const : 'dead_letter' as const; }
  async recordTrackingSync(input: any) { this.tracking.push(input); }
  async recordCarrierReconciliation(input: any) { this.carrier.push(input); }
  async markLabelReconciling(shipmentRef: string) { this.reconciling.push(shipmentRef); }
  async recordLabelFound(label: LabelInput) { this.labels.push(label); }
  async recordLabelNotFound() {}
  async recordUpsTokenRefresh(connectionRef: string, expiresAt: string) { this.tokens.push({ connectionRef, expiresAt }); }
}

function label(): LabelInput {
  return {
    labelRef: 'label-1', shipmentRef: 'ship-label', carrier: 'ups', carrierTrackingNumber: '1Z999AA10123456784',
    format: 'pdf', artifactKey: 'labels/label-1.pdf', artifactSha256: 'a'.repeat(64),
  };
}

test('async worker processes tracking, carrier reconciliation, unknown-label lookup, and UPS refresh', async () => {
  const store = new FakeJobStore();
  store.jobs = [
    { jobRef: 'j1', jobType: 'tracking_update', shipmentRef: 'ship-track', trackingNumber: '1Z999AA10123456784', carrier: 'ups', attemptCount: 1, maxAttempts: 8 },
    { jobRef: 'j2', jobType: 'carrier_reconciliation', shipmentRef: 'ship-state', carrier: 'dhl', attemptCount: 1, maxAttempts: 8 },
    { jobRef: 'j3', jobType: 'label_outcome_reconciliation', shipmentRef: 'ship-label', labelRequestId: 'request-1', carrier: 'ups', attemptCount: 1, maxAttempts: 8 },
    { jobRef: 'j4', jobType: 'ups_token_refresh', connectionRef: 'conn-ups', carrier: 'ups', attemptCount: 1, maxAttempts: 8 },
  ];
  const gateway: CarrierWorkerGateway = {
    async fetchTracking() { return { status: 'in_transit', events: [], nextPollAt: '2030-01-01T00:15:00Z' }; },
    async reconcileCarrierState() { return { status: 'in_transit', nextReconcileAt: '2030-01-01T06:00:00Z' }; },
    async reconcileLabelOutcome() { return { outcome: 'found', label: label() }; },
    async refreshUpsToken() { return { expiresAt: '2030-01-01T01:00:00Z' }; },
  };
  const result = await new VeygritShipAsyncWorker(store as any, gateway, { workerRef: 'worker-1', concurrency: 4 }).runOnce();
  assert.deepEqual(result, { claimed: 4, succeeded: 4, retried: 0, deadLettered: 0 });
  assert.deepEqual(store.completed.sort(), ['j1', 'j2', 'j3', 'j4']);
  assert.equal(store.tracking[0].status, 'in_transit');
  assert.equal(store.carrier[0].status, 'in_transit');
  assert.deepEqual(store.reconciling, ['ship-label']);
  assert.equal(store.labels[0].labelRef, 'label-1');
  assert.deepEqual(store.tokens, [{ connectionRef: 'conn-ups', expiresAt: '2030-01-01T01:00:00Z' }]);
});

test('connector gateway calls live UPS tracking and proactive OAuth refresh through the connection resolver', async () => {
  const calls: string[] = [];
  const connector = {
    async track(value: string) { calls.push(`track:${value}`); return { ok: true, carrier: 'ups', operation: 'tracking', requestId: 'r1', status: 200, automaticRetryCount: 0, data: {} }; },
    async refreshOAuthToken() { calls.push('refresh'); return { expiresAt: '2030-01-01T01:00:00Z' }; },
  };
  const gateway = new ConnectorCarrierWorkerGateway({
    resolveUpsConnector(connectionRef) { calls.push(`resolve:${connectionRef}`); return connector as any; },
    normalizeUpsTracking() { return { status: 'in_transit', events: [] }; },
    async fetchDhlTracking() { throw new Error('unused'); },
    async reconcileLabelOutcome() { return { outcome: 'pending' }; },
  });
  const job = { jobRef: 'j1', jobType: 'tracking_update' as const, attemptCount: 1, maxAttempts: 8,
    connectionRef: 'conn-ups', carrier: 'ups' as const, trackingNumber: '1Z999AA10123456784' };
  assert.equal((await gateway.fetchTracking(job)).status, 'in_transit');
  assert.deepEqual(await gateway.refreshUpsToken({ ...job, jobType: 'ups_token_refresh' }), { expiresAt: '2030-01-01T01:00:00Z' });
  assert.deepEqual(calls, ['resolve:conn-ups', 'track:1Z999AA10123456784', 'resolve:conn-ups', 'refresh']);
});

test('unknown label is never recreated and becomes DLQ when reconciliation deadline expires', async () => {
  const store = new FakeJobStore();
  store.jobs = [{ jobRef: 'j-label', jobType: 'label_outcome_reconciliation', shipmentRef: 'ship-1',
    labelRequestId: 'request-1', labelReconciliationDeadlineAt: '2029-12-31T23:59:00Z', carrier: 'ups', attemptCount: 4, maxAttempts: 10 }];
  const gateway: CarrierWorkerGateway = {
    async fetchTracking() { throw new Error('unused'); },
    async reconcileCarrierState() { throw new Error('unused'); },
    async reconcileLabelOutcome() { return { outcome: 'pending' }; },
    async refreshUpsToken() { throw new Error('unused'); },
  };
  const result = await new VeygritShipAsyncWorker(store as any, gateway, { workerRef: 'worker-1', now: () => Date.parse('2030-01-01T00:00:00Z') }).runOnce();
  assert.deepEqual(result, { claimed: 1, succeeded: 0, retried: 0, deadLettered: 1 });
  assert.equal(store.labels.length, 0);
  assert.equal(store.failed[0].errorCode, 'LABEL_RECONCILIATION_DEADLINE_EXCEEDED');
  assert.equal(store.failed[0].retryable, false);
});

class FakeWebhookStore {
  rows: Record<string, unknown>[] = [];
  outcomes: any[] = [];
  async claimWebhookDeliveries() { return this.rows.splice(0); }
  async finishWebhookDelivery(input: any) { this.outcomes.push(input); return input.outcome; }
}

function webhookRow(body: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    delivery_ref: 'delivery-1', endpoint_ref: 'endpoint-1', event_type: 'shipment.updated', event_ref: 'event-1',
    payload_ref: 'payload-1', payload_sha256: createHash('sha256').update(body).digest('hex'),
    attempt_count: 1, max_attempts: 3, ...overrides,
  };
}

test('webhook worker verifies payload, signs delivery, and records actual HTTP status', async () => {
  const body = JSON.stringify({ id: 'event-1' });
  const store = new FakeWebhookStore();
  store.rows = [webhookRow(body)];
  let signature = '';
  const resolver = { async resolve(_claim: WebhookClaim) { return { url: 'https://merchant.example/webhooks', body, signingSecret: 'secret' }; } };
  const worker = new VeygritShipWebhookWorker(store, resolver, {
    now: () => 1_900_000_000_000,
    fetch: async (_url, init) => {
      signature = new Headers(init?.headers).get('veygrit-signature') ?? '';
      return new Response('', { status: 202 });
    },
  });
  assert.deepEqual(await worker.runOnce(), { claimed: 1, succeeded: 1, retried: 0, deadLettered: 0 });
  const timestamp = '1900000000';
  const expected = createHmac('sha256', 'secret').update(`${timestamp}.${body}`).digest('hex');
  assert.equal(signature, `t=${timestamp},v1=${expected}`);
  assert.equal(store.outcomes[0].responseStatus, 202);
});

test('webhook 429 is retried with Retry-After while permanent 400 goes to DLQ', async () => {
  const body = '{}';
  const store = new FakeWebhookStore();
  store.rows = [webhookRow(body, { delivery_ref: 'retry-1' }), webhookRow(body, { delivery_ref: 'dead-1' })];
  let calls = 0;
  const worker = new VeygritShipWebhookWorker(store, { async resolve() { return { url: 'https://merchant.example/hook', body, signingSecret: 'secret' }; } }, {
    now: () => Date.parse('2030-01-01T00:00:00Z'),
    fetch: async () => ++calls === 1
      ? new Response('', { status: 429, headers: { 'retry-after': '2' } })
      : new Response('', { status: 400 }),
  });
  assert.deepEqual(await worker.runOnce(), { claimed: 2, succeeded: 0, retried: 1, deadLettered: 1 });
  assert.equal(store.outcomes[0].outcome, 'retry');
  assert.equal(store.outcomes[0].nextAttemptAt, '2030-01-01T00:00:02.000Z');
  assert.equal(store.outcomes[1].outcome, 'dead_letter');
  assert.equal(store.outcomes[1].errorCode, 'WEBHOOK_HTTP_400');
});

test('private webhook endpoints and payload hash mismatches are sent directly to DLQ', async () => {
  const store = new FakeWebhookStore();
  store.rows = [webhookRow('{}', { payload_sha256: '0'.repeat(64) }), webhookRow('{}', { delivery_ref: 'private-1' })];
  let resolveCount = 0;
  const worker = new VeygritShipWebhookWorker(store, { async resolve() {
    resolveCount += 1;
    return resolveCount === 1
      ? { url: 'https://merchant.example/hook', body: '{}', signingSecret: 'secret' }
      : { url: 'https://127.0.0.1/hook', body: '{}', signingSecret: 'secret' };
  } });
  assert.deepEqual(await worker.runOnce(), { claimed: 2, succeeded: 0, retried: 0, deadLettered: 2 });
  assert.equal(store.outcomes[0].errorCode, 'WEBHOOK_PAYLOAD_HASH_MISMATCH');
  assert.equal(store.outcomes[1].errorCode, 'WEBHOOK_ENDPOINT_DENIED');
});

test('retryable carrier error preserves normalized code for delayed retry', async () => {
  const store = new FakeJobStore();
  store.jobs = [{ jobRef: 'j-track', jobType: 'tracking_update', shipmentRef: 'ship-1', trackingNumber: '1Z999AA10123456784', attemptCount: 2, maxAttempts: 8 }];
  const gateway: CarrierWorkerGateway = {
    async fetchTracking() { throw new ShipWorkerError('UPS_RATE_LIMITED', 'rate limited', true, 10_000); },
    async reconcileCarrierState() { throw new Error('unused'); }, async reconcileLabelOutcome() { throw new Error('unused'); },
    async refreshUpsToken() { throw new Error('unused'); },
  };
  const result = await new VeygritShipAsyncWorker(store as any, gateway, { workerRef: 'worker-1', now: () => 0 }).runOnce();
  assert.deepEqual(result, { claimed: 1, succeeded: 0, retried: 1, deadLettered: 0 });
  assert.equal(store.failed[0].errorCode, 'UPS_RATE_LIMITED');
  assert.equal(store.failed[0].nextRunAt, '1970-01-01T00:00:10.000Z');
});

test('runtime schedules periodic work before running carrier and webhook batches', async () => {
  const order: string[] = [];
  const runtime = new VeygritShipWorkerRuntime(
    { async scheduleDueJobs() { order.push('schedule'); return { acquired: true, tracking: 1, carrierReconciliation: 0, labelOutcome: 0, upsTokenRefresh: 0 }; } },
    { async runOnce() { order.push('carrier'); return { claimed: 1, succeeded: 1, retried: 0, deadLettered: 0 }; } },
    { async runOnce() { order.push('webhook'); return { claimed: 0, succeeded: 0, retried: 0, deadLettered: 0 }; } },
  );
  const result = await runtime.runCycle();
  assert.equal(result.scheduled.tracking, 1);
  assert.equal(order[0], 'schedule');
  assert.deepEqual(new Set(order.slice(1)), new Set(['carrier', 'webhook']));
});
