-- Offline Sync CRDT store for AGID/AOID address workflows.
-- Store public values or domain-separated commitments only.

CREATE TABLE IF NOT EXISTS address_offline_crdt_state (
  entity_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL CHECK (entity_kind IN (
    'address-reference',
    'aoid',
    'credential',
    'shipping-label',
    'pos-usage',
    'settings'
  )),
  domain TEXT NOT NULL,
  clock_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_address_stored BOOLEAN NOT NULL DEFAULT false CHECK (raw_address_stored = false),
  raw_agid_stored BOOLEAN NOT NULL DEFAULT false CHECK (raw_agid_stored = false),
  raw_aoid_stored BOOLEAN NOT NULL DEFAULT false CHECK (raw_aoid_stored = false),
  raw_recipient_stored BOOLEAN NOT NULL DEFAULT false CHECK (raw_recipient_stored = false),
  raw_phone_stored BOOLEAN NOT NULL DEFAULT false CHECK (raw_phone_stored = false),
  raw_proof_stored BOOLEAN NOT NULL DEFAULT false CHECK (raw_proof_stored = false),
  PRIMARY KEY (entity_id, entity_kind, domain)
);

CREATE TABLE IF NOT EXISTS address_offline_crdt_field (
  entity_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  domain TEXT NOT NULL,
  field_name TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  clock_json JSONB NOT NULL,
  public_value_json JSONB,
  value_commitment TEXT,
  tombstone BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (entity_id, entity_kind, domain, field_name),
  FOREIGN KEY (entity_id, entity_kind, domain)
    REFERENCES address_offline_crdt_state(entity_id, entity_kind, domain)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS address_offline_crdt_set_member (
  entity_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  domain TEXT NOT NULL,
  set_name TEXT NOT NULL,
  member_id TEXT NOT NULL,
  member_commitment TEXT NOT NULL,
  add_tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  remove_tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  clock_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (entity_id, entity_kind, domain, set_name, member_id),
  FOREIGN KEY (entity_id, entity_kind, domain)
    REFERENCES address_offline_crdt_state(entity_id, entity_kind, domain)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS address_offline_crdt_conflict (
  conflict_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  domain TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  field_name TEXT,
  set_name TEXT,
  member_id TEXT,
  left_operation_id TEXT,
  right_operation_id TEXT,
  winning_operation_id TEXT,
  detected_at TIMESTAMPTZ NOT NULL,
  resolution TEXT NOT NULL DEFAULT 'audit-required',
  raw_material_stored BOOLEAN NOT NULL DEFAULT false CHECK (raw_material_stored = false)
);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_state_updated
  ON address_offline_crdt_state(updated_at);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_state_clock
  ON address_offline_crdt_state USING gin (clock_json);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_field_operation
  ON address_offline_crdt_field(operation_id);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_field_clock
  ON address_offline_crdt_field USING gin (clock_json);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_set_name
  ON address_offline_crdt_set_member(set_name, member_commitment);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_conflict_entity
  ON address_offline_crdt_conflict(entity_id, entity_kind, domain, detected_at);
