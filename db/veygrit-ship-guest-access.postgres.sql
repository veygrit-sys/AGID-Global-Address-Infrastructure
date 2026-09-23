-- Veygrit -ship guest access capabilities and atomic usage limits (PostgreSQL 14+).
-- Apply after core and worker migrations.

ALTER TABLE veygrit_ship_guest_session
  ADD COLUMN IF NOT EXISTS capabilities text[] NOT NULL DEFAULT ARRAY[
    'rate_simulation', 'sandbox_shipment', 'shipment_draft', 'address_input', 'test_api'
  ]::text[],
  ADD COLUMN IF NOT EXISTS issuer_fingerprint_hash char(64),
  ADD COLUMN IF NOT EXISTS revoked_reason varchar(200);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_guest_capabilities_chk') THEN
    ALTER TABLE veygrit_ship_guest_session ADD CONSTRAINT veygrit_ship_guest_capabilities_chk CHECK (
      capabilities <@ ARRAY['rate_simulation','sandbox_shipment','shipment_draft','address_input','test_api']::text[]
      AND capabilities @> ARRAY['rate_simulation','sandbox_shipment','shipment_draft','address_input','test_api']::text[]
      AND cardinality(capabilities) = 5
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_guest_issuer_hash_chk') THEN
    ALTER TABLE veygrit_ship_guest_session ADD CONSTRAINT veygrit_ship_guest_issuer_hash_chk
      CHECK (issuer_fingerprint_hash IS NULL OR issuer_fingerprint_hash ~ '^[a-f0-9]{64}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_guest_test_only_chk') THEN
    ALTER TABLE veygrit_ship_shipment ADD CONSTRAINT veygrit_ship_guest_test_only_chk
      CHECK (guest_session_id IS NULL OR (mode = 'test' AND carrier_connection_id IS NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_live_requires_account_chk') THEN
    ALTER TABLE veygrit_ship_shipment ADD CONSTRAINT veygrit_ship_live_requires_account_chk
      CHECK (mode <> 'live' OR (
        merchant_id IS NOT NULL AND guest_session_id IS NULL AND carrier_connection_id IS NOT NULL
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_carrier_secret_ref_chk') THEN
    ALTER TABLE veygrit_ship_carrier_connection ADD CONSTRAINT veygrit_ship_carrier_secret_ref_chk CHECK (
      credential_secret_ref ~ '^(secretref_[A-Za-z0-9_-]{8,}|arn:(aws|aws-us-gov|aws-cn):secretsmanager:[^[:space:]]+|vault://[^[:space:]]+|https://[A-Za-z0-9.-]+\.vault\.azure\.net/secrets/[^[:space:]]+|projects/[A-Za-z0-9._-]+/secrets/[A-Za-z0-9._-]+/versions/[A-Za-z0-9._-]+)$'
    ) NOT VALID;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS veygrit_ship_guest_session_issuer_recent_idx
  ON veygrit_ship_guest_session (issuer_fingerprint_hash, created_at DESC)
  WHERE issuer_fingerprint_hash IS NOT NULL AND status = 'active';

CREATE TABLE IF NOT EXISTS veygrit_ship_guest_capability_usage (
  guest_session_id bigint NOT NULL REFERENCES veygrit_ship_guest_session(id) ON DELETE RESTRICT,
  capability text NOT NULL CHECK (capability IN (
    'rate_simulation', 'sandbox_shipment', 'shipment_draft', 'address_input', 'test_api'
  )),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guest_session_id, capability)
);

CREATE INDEX IF NOT EXISTS veygrit_ship_guest_capability_usage_window_idx
  ON veygrit_ship_guest_capability_usage (window_started_at);

COMMENT ON COLUMN veygrit_ship_guest_session.capabilities IS
  'Closed allowlist for login-free sandbox access. Live shipping and account-management capabilities are forbidden.';
COMMENT ON COLUMN veygrit_ship_guest_session.issuer_fingerprint_hash IS
  'HMAC-SHA256 pseudonym used only for anonymous session issuance throttling; never store the raw IP.';
COMMENT ON TABLE veygrit_ship_guest_session IS
  'Anonymous sandbox session metadata only. UPS/DHL credentials, OAuth tokens, billing data, production API keys, team data, and Webhook configuration are forbidden.';
COMMENT ON CONSTRAINT veygrit_ship_carrier_secret_ref_chk ON veygrit_ship_carrier_connection IS
  'Only an opaque external Secrets Manager reference is stored; never a raw UPS/DHL client secret or token.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'veygrit_ship_app') THEN
    GRANT SELECT, INSERT, UPDATE ON veygrit_ship_guest_capability_usage TO veygrit_ship_app;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'veygrit_ship_guest') THEN
    GRANT USAGE ON SCHEMA public TO veygrit_ship_guest;
    GRANT SELECT, INSERT, UPDATE ON
      veygrit_ship_guest_session, veygrit_ship_guest_capability_usage
      TO veygrit_ship_guest;
    GRANT INSERT ON veygrit_ship_audit_event TO veygrit_ship_guest;
    GRANT USAGE, SELECT ON
      veygrit_ship_guest_session_id_seq, veygrit_ship_audit_event_id_seq
      TO veygrit_ship_guest;
    REVOKE ALL ON
      veygrit_ship_merchant, veygrit_ship_carrier_connection, veygrit_ship_shipment,
      veygrit_ship_package, veygrit_ship_rate_quote, veygrit_ship_label,
      veygrit_ship_tracking_event, veygrit_ship_webhook_delivery,
      veygrit_ship_idempotency_record
      FROM veygrit_ship_guest;
  END IF;
END;
$$;
