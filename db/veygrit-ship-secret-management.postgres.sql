-- Veygrit -ship backend-only carrier credential metadata and rotation ledger (PostgreSQL 14+).
-- Secret values are held by an external Secret Manager and never enter PostgreSQL.

ALTER TABLE veygrit_ship_carrier_connection
  ADD COLUMN IF NOT EXISTS credential_provider text NOT NULL DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS credential_display_last4 char(4),
  ADD COLUMN IF NOT EXISTS credential_version_ref varchar(500),
  ADD COLUMN IF NOT EXISTS credential_rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS credential_next_rotation_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_credential_provider_chk') THEN
    ALTER TABLE veygrit_ship_carrier_connection ADD CONSTRAINT veygrit_ship_credential_provider_chk
      CHECK (credential_provider IN ('aws-secrets-manager','gcp-secret-manager','azure-key-vault','external'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_credential_last4_chk') THEN
    ALTER TABLE veygrit_ship_carrier_connection ADD CONSTRAINT veygrit_ship_credential_last4_chk
      CHECK (credential_display_last4 IS NULL OR credential_display_last4 ~ '^[A-Za-z0-9_-]{4}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veygrit_ship_credential_rotation_dates_chk') THEN
    ALTER TABLE veygrit_ship_carrier_connection ADD CONSTRAINT veygrit_ship_credential_rotation_dates_chk
      CHECK (credential_next_rotation_at IS NULL OR credential_rotated_at IS NULL OR credential_next_rotation_at > credential_rotated_at);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS veygrit_ship_credential_rotation (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rotation_ref varchar(100) NOT NULL UNIQUE,
  merchant_id bigint NOT NULL REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  carrier_connection_id bigint NOT NULL REFERENCES veygrit_ship_carrier_connection(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('aws-secrets-manager','gcp-secret-manager','azure-key-vault','external')),
  operation text NOT NULL CHECK (operation IN ('credential.store','credential.rotate')),
  previous_secret_ref varchar(500),
  next_secret_ref varchar(500),
  previous_version_ref varchar(500),
  next_version_ref varchar(500),
  requested_by_actor_ref varchar(200) NOT NULL,
  mfa_method text NOT NULL CHECK (mfa_method IN ('totp','webauthn','passkey','security_key','other_mfa')),
  mfa_session_ref_hash char(64) NOT NULL CHECK (mfa_session_ref_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL CHECK (status IN ('succeeded','failed')),
  failure_code varchar(100),
  requested_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'failed') = (failure_code IS NOT NULL)),
  CHECK (completed_at >= requested_at),
  UNIQUE (carrier_connection_id, next_version_ref)
);

CREATE INDEX IF NOT EXISTS veygrit_ship_credential_rotation_connection_time_idx
  ON veygrit_ship_credential_rotation (carrier_connection_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS veygrit_ship_credential_rotation_merchant_time_idx
  ON veygrit_ship_credential_rotation (merchant_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS veygrit_ship_credential_rotation_due_idx
  ON veygrit_ship_carrier_connection (credential_next_rotation_at, id)
  WHERE status = 'active' AND credential_next_rotation_at IS NOT NULL;

COMMENT ON TABLE veygrit_ship_credential_rotation IS
  'Append-only credential operation ledger containing Secret Manager references and MFA evidence hashes only; never secret values.';
COMMENT ON COLUMN veygrit_ship_carrier_connection.credential_display_last4 IS
  'Only the final four safe identifier characters displayed to administrators; never enough to reconstruct a credential.';
COMMENT ON COLUMN veygrit_ship_carrier_connection.credential_version_ref IS
  'Opaque provider version reference. Secret values remain in AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, or another server-side vault.';

CREATE OR REPLACE FUNCTION veygrit_ship_reject_credential_rotation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'veygrit_ship_credential_rotation is append-only';
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'veygrit_ship_credential_rotation_append_only_trg') THEN
    CREATE TRIGGER veygrit_ship_credential_rotation_append_only_trg
      BEFORE UPDATE OR DELETE ON veygrit_ship_credential_rotation
      FOR EACH ROW EXECUTE FUNCTION veygrit_ship_reject_credential_rotation_mutation();
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'veygrit_ship_app') THEN
    GRANT SELECT, INSERT ON veygrit_ship_credential_rotation TO veygrit_ship_app;
    GRANT USAGE, SELECT ON veygrit_ship_credential_rotation_id_seq TO veygrit_ship_app;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'veygrit_ship_guest') THEN
    REVOKE ALL ON veygrit_ship_credential_rotation FROM veygrit_ship_guest;
    REVOKE ALL ON veygrit_ship_credential_rotation_id_seq FROM veygrit_ship_guest;
  END IF;
END;
$$;
