CREATE TABLE IF NOT EXISTS address_resolution (
  resolution_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('resolved', 'partial', 'unresolved', 'conflict', 'blocked', 'rejected')),
  decision TEXT NOT NULL CHECK (decision IN ('accept', 'review', 'reject')),
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  language_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  audit_fingerprint TEXT NOT NULL,
  warning_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE)
);

CREATE TABLE IF NOT EXISTS address_commitment (
  commitment_id TEXT PRIMARY KEY,
  resolution_id TEXT NOT NULL REFERENCES address_resolution(resolution_id) ON DELETE CASCADE,
  commitment_kind TEXT NOT NULL CHECK (commitment_kind IN ('address-reference', 'agid', 'aoid', 'credential', 'other')),
  commitment_hash TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (commitment_hash, scope, commitment_kind)
);

CREATE TABLE IF NOT EXISTS resolution_evidence (
  evidence_id TEXT PRIMARY KEY,
  resolution_id TEXT NOT NULL REFERENCES address_resolution(resolution_id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence NUMERIC(5,4) CHECK (confidence >= 0 AND confidence <= 1),
  evidence_hash TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS resolution_step (
  step_id TEXT PRIMARY KEY,
  resolution_id TEXT NOT NULL REFERENCES address_resolution(resolution_id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'review')),
  input_commitment TEXT,
  output_commitment TEXT,
  completed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS address_nullifier (
  nullifier_hash TEXT PRIMARY KEY,
  resolution_id TEXT NOT NULL REFERENCES address_resolution(resolution_id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  usage TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS address_resolution_event (
  event_id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  aggregate_kind TEXT NOT NULL CHECK (aggregate_kind IN ('address-reference', 'agid', 'aoid', 'credential', 'pid', 'delivery', 'resolution')),
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL CHECK (event_version >= 1),
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  occurred_at TIMESTAMPTZ NOT NULL,
  resolution_id TEXT REFERENCES address_resolution(resolution_id) ON DELETE SET NULL,
  actor_commitment TEXT,
  causation_id TEXT,
  correlation_id TEXT,
  payload_hash TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  previous_event_hash TEXT,
  event_hash TEXT NOT NULL,
  raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE),
  UNIQUE (stream_id, sequence)
);

CREATE TABLE IF NOT EXISTS address_temporal_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  aggregate_kind TEXT NOT NULL CHECK (aggregate_kind IN ('address-reference', 'agid', 'aoid', 'credential', 'pid', 'delivery', 'resolution')),
  aggregate_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('resolved', 'partial', 'unresolved', 'conflict', 'blocked', 'rejected')),
  decision TEXT NOT NULL CHECK (decision IN ('accept', 'review', 'reject')),
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  state_hash TEXT NOT NULL,
  last_event_id TEXT NOT NULL REFERENCES address_resolution_event(event_id) ON DELETE RESTRICT,
  last_event_hash TEXT NOT NULL,
  resolution_id TEXT REFERENCES address_resolution(resolution_id) ON DELETE SET NULL,
  raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE INDEX IF NOT EXISTS address_resolution_created_at_idx ON address_resolution(created_at);
CREATE INDEX IF NOT EXISTS address_resolution_decision_idx ON address_resolution(decision, status);
CREATE INDEX IF NOT EXISTS address_commitment_scope_idx ON address_commitment(scope, commitment_kind);
CREATE INDEX IF NOT EXISTS resolution_evidence_source_idx ON resolution_evidence(source_kind, source_id);
CREATE INDEX IF NOT EXISTS address_nullifier_scope_idx ON address_nullifier(scope, usage, used_at);
CREATE INDEX IF NOT EXISTS address_resolution_event_stream_idx ON address_resolution_event(stream_id, sequence);
CREATE INDEX IF NOT EXISTS address_resolution_event_hash_idx ON address_resolution_event(event_hash);
CREATE INDEX IF NOT EXISTS address_temporal_snapshot_stream_idx ON address_temporal_snapshot(stream_id, valid_from, valid_to);
