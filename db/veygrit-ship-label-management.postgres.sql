-- Veygrit -ship restricted-PII label metadata, access audit, and lifecycle (PostgreSQL 14+).
-- PDF/ZPL bytes live only in private Object Storage; signed URLs and bytes never enter PostgreSQL.

ALTER TABLE veygrit_ship_label
  ADD COLUMN IF NOT EXISTS object_store_provider text NOT NULL DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS object_version_ref varchar(500),
  ADD COLUMN IF NOT EXISTS privacy_classification text NOT NULL DEFAULT 'restricted_pii',
  ADD COLUMN IF NOT EXISTS analytics_export_allowed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS print_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reprint_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_downloaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_printed_at timestamptz,
  ADD COLUMN IF NOT EXISTS void_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS void_failure_code varchar(100),
  ADD COLUMN IF NOT EXISTS retention_until timestamptz;

-- Replace the original generated status constraint with the explicit lifecycle.
ALTER TABLE veygrit_ship_label DROP CONSTRAINT IF EXISTS veygrit_ship_label_status_check;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_label_status_chk') THEN
    ALTER TABLE veygrit_ship_label ADD CONSTRAINT veygrit_ship_label_status_chk
      CHECK (status IN ('active','void_pending','voided','void_failed','superseded'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_label_pdf_zpl_chk') THEN
    ALTER TABLE veygrit_ship_label ADD CONSTRAINT veygrit_ship_label_pdf_zpl_chk
      CHECK (format IN ('pdf','zpl')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_label_object_provider_chk') THEN
    ALTER TABLE veygrit_ship_label ADD CONSTRAINT veygrit_ship_label_object_provider_chk
      CHECK (object_store_provider IN ('aws-s3','gcp-cloud-storage','azure-blob','external'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_label_privacy_chk') THEN
    ALTER TABLE veygrit_ship_label ADD CONSTRAINT veygrit_ship_label_privacy_chk CHECK (
      privacy_classification = 'restricted_pii' AND analytics_export_allowed = false
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_label_counts_chk') THEN
    ALTER TABLE veygrit_ship_label ADD CONSTRAINT veygrit_ship_label_counts_chk CHECK (
      download_count >= 0 AND print_count >= 0 AND reprint_count >= 0 AND reprint_count <= print_count
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_label_void_lifecycle_chk') THEN
    ALTER TABLE veygrit_ship_label ADD CONSTRAINT veygrit_ship_label_void_lifecycle_chk CHECK (
      (status = 'voided') = (voided_at IS NOT NULL)
      AND (status NOT IN ('void_pending','voided','void_failed') OR void_requested_at IS NOT NULL)
      AND (status = 'void_failed') = (void_failure_code IS NOT NULL)
    );
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_label_active_shipment_scope_uq
  ON veygrit_ship_label (shipment_id)
  WHERE package_id IS NULL AND status IN ('active','void_pending');
CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_label_active_package_scope_uq
  ON veygrit_ship_label (package_id)
  WHERE package_id IS NOT NULL AND status IN ('active','void_pending');
CREATE INDEX IF NOT EXISTS veygrit_ship_label_void_pending_idx
  ON veygrit_ship_label (void_requested_at, id)
  WHERE status = 'void_pending';
CREATE INDEX IF NOT EXISTS veygrit_ship_label_retention_idx
  ON veygrit_ship_label (retention_until, id)
  WHERE retention_until IS NOT NULL AND status IN ('voided','superseded');

CREATE OR REPLACE FUNCTION veygrit_ship_enforce_label_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status NOT IN ('active','void_pending') THEN
    RETURN NEW;
  END IF;
  IF NEW.package_id IS NULL AND EXISTS (
    SELECT 1 FROM veygrit_ship_label l
    WHERE l.shipment_id=NEW.shipment_id AND l.package_id IS NOT NULL
      AND l.status IN ('active','void_pending') AND (TG_OP='INSERT' OR l.id<>NEW.id)
  ) THEN
    RAISE EXCEPTION 'shipment-scope label cannot coexist with active package-scope labels';
  END IF;
  IF NEW.package_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM veygrit_ship_label l
    WHERE l.shipment_id=NEW.shipment_id AND l.package_id IS NULL
      AND l.status IN ('active','void_pending') AND (TG_OP='INSERT' OR l.id<>NEW.id)
  ) THEN
    RAISE EXCEPTION 'package-scope label cannot coexist with an active shipment-scope label';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'veygrit_ship_label_scope_trg') THEN
    CREATE TRIGGER veygrit_ship_label_scope_trg
      BEFORE INSERT OR UPDATE OF shipment_id,package_id,status ON veygrit_ship_label
      FOR EACH ROW EXECUTE FUNCTION veygrit_ship_enforce_label_scope();
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS veygrit_ship_label_access_event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_ref varchar(100) NOT NULL UNIQUE,
  merchant_id bigint NOT NULL REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  label_id bigint NOT NULL REFERENCES veygrit_ship_label(id) ON DELETE RESTRICT,
  actor_ref varchar(200) NOT NULL,
  action text NOT NULL CHECK (action IN (
    'download_url_issued','print','reprint','void_requested','void_succeeded','void_failed'
  )),
  signed_url_ttl_seconds smallint CHECK (signed_url_ttl_seconds BETWEEN 1 AND 300),
  outcome text NOT NULL CHECK (outcome IN ('success','failure')),
  failure_code varchar(100),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((outcome = 'failure') = (failure_code IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS veygrit_ship_label_access_event_label_time_idx
  ON veygrit_ship_label_access_event (label_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS veygrit_ship_label_access_event_merchant_time_idx
  ON veygrit_ship_label_access_event (merchant_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION veygrit_ship_reject_label_access_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'veygrit_ship_label_access_event is append-only';
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'veygrit_ship_label_access_event_append_only_trg') THEN
    CREATE TRIGGER veygrit_ship_label_access_event_append_only_trg
      BEFORE UPDATE OR DELETE ON veygrit_ship_label_access_event
      FOR EACH ROW EXECUTE FUNCTION veygrit_ship_reject_label_access_event_mutation();
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'veygrit_ship_app') THEN
    GRANT SELECT, INSERT ON veygrit_ship_label_access_event TO veygrit_ship_app;
    GRANT USAGE, SELECT ON veygrit_ship_label_access_event_id_seq TO veygrit_ship_app;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'veygrit_ship_guest') THEN
    REVOKE ALL ON veygrit_ship_label, veygrit_ship_label_access_event FROM veygrit_ship_guest;
    REVOKE ALL ON veygrit_ship_label_id_seq, veygrit_ship_label_access_event_id_seq FROM veygrit_ship_guest;
  END IF;
END;
$$;

COMMENT ON TABLE veygrit_ship_label IS
  'Restricted-PII label metadata only. PDF/ZPL bytes are encrypted in private Object Storage and must not be exported to logs or analytics.';
COMMENT ON COLUMN veygrit_ship_label.artifact_key IS
  'Private Object Storage key. Never log, analyze, expose publicly, or place it in a signed URL audit row.';
COMMENT ON TABLE veygrit_ship_label_access_event IS
  'Redacted access and lifecycle audit. Signed URLs, object keys, tracking numbers, addresses, and label bytes are forbidden.';
