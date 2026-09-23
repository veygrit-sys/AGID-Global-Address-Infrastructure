CREATE TABLE IF NOT EXISTS agid_registry_issuer (
  issuer_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'revoked')),
  display_name TEXT,
  trust_score NUMERIC(5,4) NOT NULL CHECK (trust_score >= 0 AND trust_score <= 1),
  public_key_commitment TEXT,
  metadata_hash TEXT,
  source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  registered_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE)
);

CREATE TABLE IF NOT EXISTS agid_registry_revocation (
  commitment TEXT PRIMARY KEY,
  commitment_type TEXT NOT NULL CHECK (commitment_type IN ('credential', 'address-reference', 'aoid', 'agid', 'issuer-scoped', 'unknown')),
  reason TEXT,
  issuer_id TEXT REFERENCES agid_registry_issuer(issuer_id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ NOT NULL,
  source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE)
);

CREATE TABLE IF NOT EXISTS agid_registry_freshness_root (
  freshness_root TEXT PRIMARY KEY,
  registry_id TEXT NOT NULL,
  issuer_id TEXT REFERENCES agid_registry_issuer(issuer_id) ON DELETE SET NULL,
  anchored_at TIMESTAMPTZ NOT NULL,
  fresh_until TIMESTAMPTZ NOT NULL,
  source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE)
);

CREATE TABLE IF NOT EXISTS agid_registry_nullifier (
  nullifier_hash TEXT NOT NULL,
  scope TEXT NOT NULL,
  issuer_id TEXT REFERENCES agid_registry_issuer(issuer_id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE),
  PRIMARY KEY (scope, nullifier_hash)
);

CREATE TABLE IF NOT EXISTS agid_registry_audit_event (
  event_id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  subject_commitment TEXT,
  issuer_id TEXT,
  scope TEXT,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  event_hash TEXT NOT NULL,
  raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE)
);

CREATE INDEX IF NOT EXISTS agid_registry_issuer_status_idx
  ON agid_registry_issuer(status, updated_at);

CREATE INDEX IF NOT EXISTS agid_registry_revocation_issuer_idx
  ON agid_registry_revocation(issuer_id, revoked_at);

CREATE INDEX IF NOT EXISTS agid_registry_freshness_registry_idx
  ON agid_registry_freshness_root(registry_id, fresh_until);

CREATE INDEX IF NOT EXISTS agid_registry_nullifier_scope_idx
  ON agid_registry_nullifier(scope, used_at);

CREATE INDEX IF NOT EXISTS agid_registry_audit_recorded_idx
  ON agid_registry_audit_event(recorded_at, operation);
