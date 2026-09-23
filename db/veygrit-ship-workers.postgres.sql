-- Veygrit -ship asynchronous workers and reconciliation queues (PostgreSQL 14+).
-- Apply after db/veygrit-ship-core.postgres.sql.

ALTER TABLE veygrit_ship_shipment
  ADD COLUMN IF NOT EXISTS label_outcome text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS label_request_id varchar(100),
  ADD COLUMN IF NOT EXISTS label_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS label_reconciliation_deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_tracking_poll_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_carrier_reconciled_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_carrier_reconcile_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciliation_error_count integer NOT NULL DEFAULT 0;

ALTER TABLE veygrit_ship_carrier_connection
  ADD COLUMN IF NOT EXISTS next_token_refresh_at timestamptz,
  ADD COLUMN IF NOT EXISTS token_refresh_failure_count integer NOT NULL DEFAULT 0;

ALTER TABLE veygrit_ship_webhook_delivery
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS dead_lettered_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_shipment_label_outcome_chk') THEN
    ALTER TABLE veygrit_ship_shipment ADD CONSTRAINT veygrit_ship_shipment_label_outcome_chk
      CHECK (label_outcome IN ('not_requested', 'pending', 'confirmed', 'unknown', 'reconciling', 'not_found'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_shipment_reconcile_errors_chk') THEN
    ALTER TABLE veygrit_ship_shipment ADD CONSTRAINT veygrit_ship_shipment_reconcile_errors_chk
      CHECK (reconciliation_error_count >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_connection_token_refresh_errors_chk') THEN
    ALTER TABLE veygrit_ship_carrier_connection ADD CONSTRAINT veygrit_ship_connection_token_refresh_errors_chk
      CHECK (token_refresh_failure_count >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_webhook_max_attempts_chk') THEN
    ALTER TABLE veygrit_ship_webhook_delivery ADD CONSTRAINT veygrit_ship_webhook_max_attempts_chk
      CHECK (max_attempts BETWEEN 1 AND 100);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS veygrit_ship_shipment_tracking_due_idx
  ON veygrit_ship_shipment (next_tracking_poll_at, id)
  WHERE status IN ('created', 'in_transit') AND label_outcome = 'confirmed';
CREATE INDEX IF NOT EXISTS veygrit_ship_shipment_reconcile_due_idx
  ON veygrit_ship_shipment (next_carrier_reconcile_at, id)
  WHERE status IN ('created', 'in_transit', 'void_pending');
CREATE INDEX IF NOT EXISTS veygrit_ship_shipment_label_unknown_idx
  ON veygrit_ship_shipment (label_reconciliation_deadline_at, id)
  WHERE label_outcome IN ('unknown', 'reconciling');
CREATE INDEX IF NOT EXISTS veygrit_ship_connection_token_due_idx
  ON veygrit_ship_carrier_connection (next_token_refresh_at, id)
  WHERE carrier = 'ups' AND status = 'active';

DROP INDEX IF EXISTS veygrit_ship_webhook_delivery_pending_idx;
CREATE INDEX veygrit_ship_webhook_delivery_pending_idx
  ON veygrit_ship_webhook_delivery (next_attempt_at, id)
  WHERE status IN ('pending', 'retry', 'delivering');
CREATE INDEX IF NOT EXISTS veygrit_ship_webhook_delivery_dlq_idx
  ON veygrit_ship_webhook_delivery (dead_lettered_at DESC, id)
  WHERE status = 'dead_letter';

CREATE TABLE IF NOT EXISTS veygrit_ship_async_job (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_ref varchar(100) NOT NULL UNIQUE,
  merchant_id bigint REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  shipment_id bigint REFERENCES veygrit_ship_shipment(id) ON DELETE RESTRICT,
  label_id bigint REFERENCES veygrit_ship_label(id) ON DELETE RESTRICT,
  carrier_connection_id bigint REFERENCES veygrit_ship_carrier_connection(id) ON DELETE RESTRICT,
  job_type text NOT NULL CHECK (job_type IN (
    'tracking_update', 'carrier_reconciliation', 'label_outcome_reconciliation', 'ups_token_refresh'
  )),
  dedupe_key varchar(300) NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'running', 'retry', 'succeeded', 'dead_letter', 'cancelled'
  )),
  priority smallint NOT NULL DEFAULT 100 CHECK (priority BETWEEN 1 AND 1000),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 8 CHECK (max_attempts BETWEEN 1 AND 100),
  run_after timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz,
  worker_ref varchar(100),
  last_error_code varchar(100),
  last_error_message varchar(500),
  last_error_retryable boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  dead_lettered_at timestamptz,
  CHECK (shipment_id IS NOT NULL OR carrier_connection_id IS NOT NULL),
  CHECK (job_type <> 'ups_token_refresh' OR carrier_connection_id IS NOT NULL),
  CHECK (job_type = 'ups_token_refresh' OR shipment_id IS NOT NULL),
  CHECK ((status = 'dead_letter') = (dead_lettered_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS veygrit_ship_async_job_shipment_idx
  ON veygrit_ship_async_job (shipment_id, created_at DESC) WHERE shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_async_job_label_idx
  ON veygrit_ship_async_job (label_id, created_at DESC) WHERE label_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_async_job_connection_idx
  ON veygrit_ship_async_job (carrier_connection_id, created_at DESC) WHERE carrier_connection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_async_job_claim_idx
  ON veygrit_ship_async_job (priority, run_after, id)
  WHERE status IN ('queued', 'retry', 'running');
CREATE INDEX IF NOT EXISTS veygrit_ship_async_job_dlq_idx
  ON veygrit_ship_async_job (dead_lettered_at DESC, id) WHERE status = 'dead_letter';
CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_async_job_active_dedupe_uq
  ON veygrit_ship_async_job (job_type, dedupe_key)
  WHERE status IN ('queued', 'running', 'retry');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'veygrit_ship_async_job_updated_at_trg') THEN
    CREATE TRIGGER veygrit_ship_async_job_updated_at_trg
      BEFORE UPDATE ON veygrit_ship_async_job
      FOR EACH ROW EXECUTE FUNCTION veygrit_ship_set_updated_at();
  END IF;
END;
$$;

COMMENT ON TABLE veygrit_ship_async_job IS
  'Durable lease queue. dead_letter rows are retained for operator inspection and explicit replay.';
COMMENT ON COLUMN veygrit_ship_shipment.label_outcome IS
  'Unknown never authorizes blind label recreation; reconciliation must confirm found or not_found.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'veygrit_ship_app') THEN
    GRANT SELECT, INSERT, UPDATE ON veygrit_ship_async_job TO veygrit_ship_app;
    GRANT USAGE, SELECT ON veygrit_ship_async_job_id_seq TO veygrit_ship_app;
  END IF;
END;
$$;
