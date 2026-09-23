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
  clock_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_address_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_address_stored = 0),
  raw_agid_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_agid_stored = 0),
  raw_aoid_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_aoid_stored = 0),
  raw_recipient_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_recipient_stored = 0),
  raw_phone_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_phone_stored = 0),
  raw_proof_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_proof_stored = 0),
  PRIMARY KEY (entity_id, entity_kind, domain)
);

CREATE TABLE IF NOT EXISTS address_offline_crdt_field (
  entity_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  domain TEXT NOT NULL,
  field_name TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  clock_json TEXT NOT NULL,
  public_value_json TEXT,
  value_commitment TEXT,
  tombstone INTEGER NOT NULL DEFAULT 0 CHECK (tombstone IN (0, 1)),
  updated_at TEXT NOT NULL,
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
  add_tags_json TEXT NOT NULL DEFAULT '[]',
  remove_tags_json TEXT NOT NULL DEFAULT '[]',
  clock_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
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
  detected_at TEXT NOT NULL,
  resolution TEXT NOT NULL DEFAULT 'audit-required',
  raw_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_material_stored = 0)
);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_state_updated
  ON address_offline_crdt_state(updated_at);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_field_operation
  ON address_offline_crdt_field(operation_id);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_set_name
  ON address_offline_crdt_set_member(set_name, member_commitment);

CREATE INDEX IF NOT EXISTS idx_address_offline_crdt_conflict_entity
  ON address_offline_crdt_conflict(entity_id, entity_kind, domain, detected_at);
