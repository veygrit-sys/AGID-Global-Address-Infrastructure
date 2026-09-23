import { randomUUID } from 'node:crypto';

import type { Carrier, CarrierAdapter, LabelInput, SqlClient, SqlPool, TrackingEventInput } from './veygritShipStore';
import { PostgresVeygritShipStore } from './veygritShipStore';

export type ShipJobType = 'tracking_update' | 'carrier_reconciliation' | 'label_outcome_reconciliation' | 'ups_token_refresh';
export type ShipJobStatus = 'queued' | 'running' | 'retry' | 'succeeded' | 'dead_letter' | 'cancelled';

export type ClaimedShipJob = {
  jobRef: string;
  jobType: ShipJobType;
  attemptCount: number;
  maxAttempts: number;
  shipmentRef?: string;
  labelRef?: string;
  connectionRef?: string;
  carrier?: Carrier;
  adapter?: CarrierAdapter;
  trackingNumber?: string;
  labelRequestId?: string;
  labelReconciliationDeadlineAt?: string;
};

type JobRow = {
  job_ref: string;
  job_type: ShipJobType;
  attempt_count: number;
  max_attempts: number;
  shipment_ref: string | null;
  label_ref: string | null;
  connection_ref: string | null;
  carrier: Carrier | null;
  adapter: CarrierAdapter | null;
  carrier_tracking_number: string | null;
  label_request_id: string | null;
  label_reconciliation_deadline_at: Date | string | null;
};

export type TrackingSync = {
  shipmentRef: string;
  status?: 'created' | 'in_transit' | 'delivered' | 'failed';
  nextPollAt?: string;
  nextReconcileAt?: string;
  events: TrackingEventInput[];
};

function ref(value: string, name: string, max = 300): string {
  const normalized = value.normalize('NFKC').trim();
  if (!normalized || normalized.length > max) throw new TypeError(`${name} is invalid.`);
  return normalized;
}

function date(value: string, name: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new TypeError(`${name} is invalid.`);
  return parsed.toISOString();
}

async function transaction<T>(pool: SqlPool, work: (client: SqlClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const output = await work(client);
    await client.query('COMMIT');
    return output;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* keep original error */ }
    throw error;
  } finally {
    client.release();
  }
}

function mapJob(row: JobRow): ClaimedShipJob {
  return {
    jobRef: row.job_ref,
    jobType: row.job_type,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    ...(row.shipment_ref ? { shipmentRef: row.shipment_ref } : {}),
    ...(row.label_ref ? { labelRef: row.label_ref } : {}),
    ...(row.connection_ref ? { connectionRef: row.connection_ref } : {}),
    ...(row.carrier ? { carrier: row.carrier } : {}),
    ...(row.adapter ? { adapter: row.adapter } : {}),
    ...(row.carrier_tracking_number ? { trackingNumber: row.carrier_tracking_number } : {}),
    ...(row.label_request_id ? { labelRequestId: row.label_request_id } : {}),
    ...(row.label_reconciliation_deadline_at
      ? { labelReconciliationDeadlineAt: new Date(row.label_reconciliation_deadline_at).toISOString() }
      : {}),
  };
}

export class VeygritShipWorkerStore {
  private readonly shipping: PostgresVeygritShipStore;

  constructor(private readonly pool: SqlPool) {
    this.shipping = new PostgresVeygritShipStore(pool);
  }

  async scheduleDueJobs(): Promise<{ acquired: boolean; tracking: number; carrierReconciliation: number; labelOutcome: number; upsTokenRefresh: number }> {
    return transaction(this.pool, async client => {
      const lock = await client.query<{ acquired: boolean }>(
        `SELECT pg_try_advisory_xact_lock(hashtext('veygrit-ship-worker-scheduler')) AS acquired`,
      );
      if (!lock.rows[0]?.acquired) return { acquired: false, tracking: 0, carrierReconciliation: 0, labelOutcome: 0, upsTokenRefresh: 0 };

      const tracking = await client.query(
        `INSERT INTO veygrit_ship_async_job
          (job_ref, merchant_id, shipment_id, label_id, carrier_connection_id, job_type, dedupe_key, priority, max_attempts)
         SELECT 'job_' || md5(clock_timestamp()::text || random()::text || s.id::text || l.id::text),
           s.merchant_id, s.id, l.id, s.carrier_connection_id, 'tracking_update',
           l.carrier || ':' || l.carrier_tracking_number, 50, 12
         FROM veygrit_ship_shipment s
         JOIN veygrit_ship_label l ON l.shipment_id=s.id AND l.status='active'
         WHERE s.status IN ('created','in_transit') AND s.label_outcome='confirmed'
           AND COALESCE(s.next_tracking_poll_at, now())<=now()
         ON CONFLICT DO NOTHING RETURNING id`,
      );
      const reconciliation = await client.query(
        `INSERT INTO veygrit_ship_async_job
          (job_ref, merchant_id, shipment_id, carrier_connection_id, job_type, dedupe_key, priority, max_attempts)
         SELECT 'job_' || md5(clock_timestamp()::text || random()::text || s.id::text),
           s.merchant_id, s.id, s.carrier_connection_id, 'carrier_reconciliation', s.shipment_ref, 80, 8
         FROM veygrit_ship_shipment s
         WHERE s.status IN ('created','in_transit','void_pending')
           AND COALESCE(s.next_carrier_reconcile_at, now())<=now()
         ON CONFLICT DO NOTHING RETURNING id`,
      );
      const labelOutcome = await client.query(
        `INSERT INTO veygrit_ship_async_job
          (job_ref, merchant_id, shipment_id, carrier_connection_id, job_type, dedupe_key, priority, max_attempts)
         SELECT 'job_' || md5(clock_timestamp()::text || random()::text || s.id::text),
           s.merchant_id, s.id, s.carrier_connection_id, 'label_outcome_reconciliation', s.shipment_ref, 10, 10
         FROM veygrit_ship_shipment s
         WHERE s.label_outcome IN ('unknown','reconciling')
         ON CONFLICT DO NOTHING RETURNING id`,
      );
      const token = await client.query(
        `INSERT INTO veygrit_ship_async_job
          (job_ref, merchant_id, carrier_connection_id, job_type, dedupe_key, priority, max_attempts)
         SELECT 'job_' || md5(clock_timestamp()::text || random()::text || c.id::text),
           c.merchant_id, c.id, 'ups_token_refresh', c.connection_ref, 20, 8
         FROM veygrit_ship_carrier_connection c
         WHERE c.carrier='ups' AND c.status='active'
           AND COALESCE(c.next_token_refresh_at, c.token_expires_at - interval '5 minutes', now())<=now()
         ON CONFLICT DO NOTHING RETURNING id`,
      );
      return {
        acquired: true,
        tracking: tracking.rows.length,
        carrierReconciliation: reconciliation.rows.length,
        labelOutcome: labelOutcome.rows.length,
        upsTokenRefresh: token.rows.length,
      };
    });
  }

  async claimJobs(workerRef: string, limit = 10, leaseSeconds = 60): Promise<ClaimedShipJob[]> {
    const normalizedWorker = ref(workerRef, 'workerRef', 100);
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    const safeLease = Math.max(10, Math.min(900, Math.trunc(leaseSeconds)));
    const result = await this.pool.query<JobRow>(
      `WITH candidates AS (
         SELECT id FROM veygrit_ship_async_job
         WHERE (status IN ('queued','retry') AND run_after<=now())
            OR (status='running' AND lease_expires_at<=now())
         ORDER BY priority, run_after, id LIMIT $1 FOR UPDATE SKIP LOCKED
       ), claimed AS (
         UPDATE veygrit_ship_async_job j
         SET status='running', worker_ref=$2, attempt_count=j.attempt_count+1,
             started_at=COALESCE(j.started_at,now()), lease_expires_at=now()+make_interval(secs=>$3)
         FROM candidates c WHERE j.id=c.id RETURNING j.*
       )
       SELECT c.job_ref, c.job_type, c.attempt_count, c.max_attempts,
         s.shipment_ref, l.label_ref, cc.connection_ref, COALESCE(s.carrier,cc.carrier) AS carrier,
         s.adapter, l.carrier_tracking_number, s.label_request_id, s.label_reconciliation_deadline_at
       FROM claimed c
       LEFT JOIN veygrit_ship_shipment s ON s.id=c.shipment_id
       LEFT JOIN veygrit_ship_label l ON l.id=COALESCE(c.label_id, (
         SELECT latest.id FROM veygrit_ship_label latest
         WHERE latest.shipment_id=c.shipment_id AND latest.status='active'
         ORDER BY latest.created_at DESC, latest.id DESC LIMIT 1
       ))
       LEFT JOIN veygrit_ship_carrier_connection cc ON cc.id=c.carrier_connection_id
       ORDER BY c.priority, c.id`,
      [safeLimit, normalizedWorker, safeLease],
    );
    return result.rows.map(mapJob);
  }

  async completeJob(jobRef: string): Promise<void> {
    const result = await this.pool.query(
      `UPDATE veygrit_ship_async_job SET status='succeeded', completed_at=now(), lease_expires_at=NULL,
         worker_ref=NULL, last_error_code=NULL, last_error_message=NULL, last_error_retryable=NULL
       WHERE job_ref=$1 AND status='running' RETURNING job_ref`,
      [ref(jobRef, 'jobRef', 100)],
    );
    if (!result.rows.length) throw new Error('Running worker job was not found.');
  }

  async failJob(input: {
    jobRef: string;
    errorCode: string;
    errorMessage: string;
    retryable: boolean;
    nextRunAt: string;
  }): Promise<'retry' | 'dead_letter'> {
    const result = await this.pool.query<{ status: 'retry' | 'dead_letter' }>(
      `WITH failed AS (
         UPDATE veygrit_ship_async_job
         SET status=CASE WHEN NOT $4 OR attempt_count>=max_attempts THEN 'dead_letter' ELSE 'retry' END,
           run_after=$5, lease_expires_at=NULL, worker_ref=NULL, last_error_code=$2,
           last_error_message=$3, last_error_retryable=$4,
           dead_lettered_at=CASE WHEN NOT $4 OR attempt_count>=max_attempts THEN now() ELSE NULL END
         WHERE job_ref=$1 AND status='running'
         RETURNING status, shipment_id, carrier_connection_id, job_type
       ), shipment_failure AS (
         UPDATE veygrit_ship_shipment s SET reconciliation_error_count=s.reconciliation_error_count+1
         FROM failed f WHERE s.id=f.shipment_id RETURNING s.id
       ), connection_failure AS (
         UPDATE veygrit_ship_carrier_connection c
         SET token_refresh_failure_count=c.token_refresh_failure_count+1,
             status=CASE WHEN f.status='dead_letter' THEN 'reauthorization_required' ELSE c.status END
         FROM failed f WHERE c.id=f.carrier_connection_id AND f.job_type='ups_token_refresh' RETURNING c.id
       ), audit_dlq AS (
         INSERT INTO veygrit_ship_audit_event
           (event_ref, merchant_id, actor_type, action, aggregate_type, aggregate_ref, outcome, details)
         SELECT 'audit_' || md5(clock_timestamp()::text || random()::text || $1), j.merchant_id,
           'system', 'worker.job.dead_lettered', 'async_job', j.job_ref, 'failure',
           jsonb_build_object('jobType',j.job_type,'errorCode',$2,'attemptCount',j.attempt_count)
         FROM failed f JOIN veygrit_ship_async_job j ON j.job_ref=$1
         WHERE f.status='dead_letter' RETURNING id
       )
       SELECT status FROM failed`,
      [ref(input.jobRef, 'jobRef', 100), ref(input.errorCode, 'errorCode', 100),
        ref(input.errorMessage, 'errorMessage', 500), input.retryable, date(input.nextRunAt, 'nextRunAt')],
    );
    if (!result.rows[0]) throw new Error('Running worker job was not found.');
    return result.rows[0].status;
  }

  async replayDeadLetter(jobRef: string, runAfter = new Date().toISOString()): Promise<void> {
    const result = await this.pool.query(
      `UPDATE veygrit_ship_async_job SET status='queued', attempt_count=0, run_after=$2,
         dead_lettered_at=NULL, completed_at=NULL, last_error_code=NULL, last_error_message=NULL,
         last_error_retryable=NULL, worker_ref=NULL, lease_expires_at=NULL
       WHERE job_ref=$1 AND status='dead_letter' RETURNING job_ref`,
      [ref(jobRef, 'jobRef', 100), date(runAfter, 'runAfter')],
    );
    if (!result.rows.length) throw new Error('Dead-letter job was not found.');
  }

  async listDeadLetters(limit = 100): Promise<Record<string, unknown>[]> {
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    const result = await this.pool.query(
      `SELECT j.job_ref, j.job_type, j.attempt_count, j.max_attempts, j.last_error_code,
         j.last_error_message, j.last_error_retryable, j.dead_lettered_at,
         s.shipment_ref, c.connection_ref
       FROM veygrit_ship_async_job j
       LEFT JOIN veygrit_ship_shipment s ON s.id=j.shipment_id
       LEFT JOIN veygrit_ship_carrier_connection c ON c.id=j.carrier_connection_id
       WHERE j.status='dead_letter' ORDER BY j.dead_lettered_at DESC, j.id DESC LIMIT $1`,
      [safeLimit],
    );
    return result.rows;
  }

  async markLabelOutcomeUnknown(input: { shipmentRef: string; carrierRequestId: string; deadlineAt: string }): Promise<string> {
    return transaction(this.pool, async client => {
      const shipment = await client.query<{ id: string; merchant_id: string | null; carrier_connection_id: string | null }>(
        `UPDATE veygrit_ship_shipment SET label_outcome='unknown', label_request_id=$2,
           label_requested_at=COALESCE(label_requested_at,now()), label_reconciliation_deadline_at=$3
         WHERE shipment_ref=$1 AND label_outcome<>'confirmed'
         RETURNING id, merchant_id, carrier_connection_id`,
        [ref(input.shipmentRef, 'shipmentRef', 100), ref(input.carrierRequestId, 'carrierRequestId', 100), date(input.deadlineAt, 'deadlineAt')],
      );
      if (!shipment.rows[0]) throw new Error('Shipment was not found or already has a confirmed label.');
      const jobRef = `job_${randomUUID().replace(/-/g, '')}`;
      const inserted = await client.query<{ job_ref: string }>(
        `INSERT INTO veygrit_ship_async_job
          (job_ref, merchant_id, shipment_id, carrier_connection_id, job_type, dedupe_key, priority, max_attempts)
         VALUES ($1,$2,$3,$4,'label_outcome_reconciliation',$5,10,10)
         ON CONFLICT DO NOTHING RETURNING job_ref`,
        [jobRef, shipment.rows[0].merchant_id, shipment.rows[0].id, shipment.rows[0].carrier_connection_id, input.shipmentRef],
      );
      if (inserted.rows[0]) return inserted.rows[0].job_ref;
      const existing = await client.query<{ job_ref: string }>(
        `SELECT job_ref FROM veygrit_ship_async_job
         WHERE job_type='label_outcome_reconciliation' AND dedupe_key=$1
           AND status IN ('queued','running','retry')`,
        [input.shipmentRef],
      );
      if (!existing.rows[0]) throw new Error('Label reconciliation job conflict could not be resolved.');
      return existing.rows[0].job_ref;
    });
  }

  async markLabelReconciling(shipmentRef: string): Promise<void> {
    await this.pool.query(
      `UPDATE veygrit_ship_shipment SET label_outcome='reconciling'
       WHERE shipment_ref=$1 AND label_outcome IN ('unknown','reconciling')`,
      [ref(shipmentRef, 'shipmentRef', 100)],
    );
  }

  async recordTrackingSync(input: TrackingSync): Promise<void> {
    for (const event of input.events) await this.shipping.appendTrackingEvent(event);
    await this.pool.query(
      `UPDATE veygrit_ship_shipment SET status=COALESCE($2,status), next_tracking_poll_at=$3,
         next_carrier_reconcile_at=COALESCE($4,next_carrier_reconcile_at),
         last_carrier_reconciled_at=now(), reconciliation_error_count=0
       WHERE shipment_ref=$1`,
      [ref(input.shipmentRef, 'shipmentRef', 100), input.status ?? null,
        input.status === 'delivered' ? null : input.nextPollAt ? date(input.nextPollAt, 'nextPollAt') : null,
        input.nextReconcileAt ? date(input.nextReconcileAt, 'nextReconcileAt') : null],
    );
  }

  async recordCarrierReconciliation(input: {
    shipmentRef: string;
    status?: 'created' | 'in_transit' | 'delivered' | 'voided' | 'failed';
    nextReconcileAt?: string;
  }): Promise<void> {
    await this.pool.query(
      `UPDATE veygrit_ship_shipment SET status=COALESCE($2,status), last_carrier_reconciled_at=now(),
         next_carrier_reconcile_at=$3, reconciliation_error_count=0 WHERE shipment_ref=$1`,
      [ref(input.shipmentRef, 'shipmentRef', 100), input.status ?? null,
        input.status === 'delivered' || input.status === 'voided' ? null
          : input.nextReconcileAt ? date(input.nextReconcileAt, 'nextReconcileAt') : null],
    );
  }

  async recordLabelFound(label: LabelInput): Promise<void> {
    await this.shipping.saveLabel(label);
    await this.pool.query(
      `UPDATE veygrit_ship_shipment SET label_outcome='confirmed', label_reconciliation_deadline_at=NULL,
         reconciliation_error_count=0 WHERE shipment_ref=$1`,
      [ref(label.shipmentRef, 'shipmentRef', 100)],
    );
  }

  async recordLabelNotFound(shipmentRef: string): Promise<void> {
    await this.pool.query(
      `UPDATE veygrit_ship_shipment SET label_outcome='not_found', status='failed',
         label_reconciliation_deadline_at=NULL WHERE shipment_ref=$1 AND label_outcome<>'confirmed'`,
      [ref(shipmentRef, 'shipmentRef', 100)],
    );
  }

  async recordUpsTokenRefresh(connectionRef: string, expiresAt: string): Promise<void> {
    const result = await this.pool.query(
      `UPDATE veygrit_ship_carrier_connection SET token_expires_at=$2,
         next_token_refresh_at=$2::timestamptz - interval '5 minutes', token_refresh_failure_count=0,
         last_verified_at=now(), status='active'
       WHERE connection_ref=$1 AND carrier='ups' RETURNING connection_ref`,
      [ref(connectionRef, 'connectionRef', 100), date(expiresAt, 'expiresAt')],
    );
    if (!result.rows.length) throw new Error('Active UPS carrier connection was not found.');
  }
}
