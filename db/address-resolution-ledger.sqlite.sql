PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS address_resolution (
  resolution_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence REAL NOT NULL,
  language_tag TEXT,
  created_at TEXT NOT NULL,
  audit_fingerprint TEXT NOT NULL,
  warning_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0)
);

CREATE TABLE IF NOT EXISTS address_commitment (
  commitment_id TEXT PRIMARY KEY,
  resolution_id TEXT NOT NULL,
  commitment_kind TEXT NOT NULL,
  commitment_hash TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(commitment_hash, scope, commitment_kind)
);

CREATE TABLE IF NOT EXISTS resolution_evidence (
  evidence_id TEXT PRIMARY KEY,
  resolution_id TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence REAL,
  evidence_hash TEXT NOT NULL,
  observed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resolution_step (
  step_id TEXT PRIMARY KEY,
  resolution_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL,
  input_commitment TEXT,
  output_commitment TEXT,
  completed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS address_nullifier (
  nullifier_hash TEXT PRIMARY KEY,
  resolution_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  usage TEXT NOT NULL,
  used_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS address_resolution_event (
  event_id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  aggregate_kind TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  resolution_id TEXT,
  actor_commitment TEXT,
  causation_id TEXT,
  correlation_id TEXT,
  payload_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  previous_event_hash TEXT,
  event_hash TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
  UNIQUE(stream_id, sequence)
);

CREATE TABLE IF NOT EXISTS address_temporal_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  aggregate_kind TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  status TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence REAL NOT NULL,
  state_hash TEXT NOT NULL,
  last_event_id TEXT NOT NULL,
  last_event_hash TEXT NOT NULL,
  resolution_id TEXT,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0)
);

CREATE INDEX IF NOT EXISTS address_resolution_created_at_idx ON address_resolution(created_at);
CREATE INDEX IF NOT EXISTS address_resolution_decision_idx ON address_resolution(decision, status);
CREATE INDEX IF NOT EXISTS address_commitment_scope_idx ON address_commitment(scope, commitment_kind);
CREATE INDEX IF NOT EXISTS resolution_evidence_source_idx ON resolution_evidence(source_kind, source_id);
CREATE INDEX IF NOT EXISTS address_nullifier_scope_idx ON address_nullifier(scope, usage, used_at);
CREATE INDEX IF NOT EXISTS address_resolution_event_stream_idx ON address_resolution_event(stream_id, sequence);
CREATE INDEX IF NOT EXISTS address_resolution_event_hash_idx ON address_resolution_event(event_hash);
CREATE INDEX IF NOT EXISTS address_temporal_snapshot_stream_idx ON address_temporal_snapshot(stream_id, valid_from, valid_to);
