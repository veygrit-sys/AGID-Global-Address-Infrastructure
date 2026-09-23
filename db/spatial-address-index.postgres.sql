-- Spatial Address Index for local-first AGID/AOID address resolution.
-- This schema works without PostGIS. Production Postgres deployments may add
-- generated geometry columns and GiST indexes when PostGIS is available.

CREATE TABLE IF NOT EXISTS address_index_record (
  id TEXT PRIMARY KEY,
  display_label TEXT,
  country_code TEXT,
  postcode_norm TEXT,
  agid_prefix2 TEXT,
  agid_prefix4 TEXT,
  agid_full TEXT,
  address_reference_commitment TEXT,
  agid_commitment TEXT,
  aoid_commitment TEXT,
  source TEXT,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  min_lat DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  min_lon DOUBLE PRECISION,
  max_lon DOUBLE PRECISION,
  public_metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE TABLE IF NOT EXISTS address_index_spatial_bucket (
  bucket_key TEXT NOT NULL,
  record_id TEXT NOT NULL REFERENCES address_index_record(id) ON DELETE CASCADE,
  PRIMARY KEY (bucket_key, record_id)
);

CREATE TABLE IF NOT EXISTS address_index_term (
  normalized_term TEXT NOT NULL,
  record_id TEXT NOT NULL REFERENCES address_index_record(id) ON DELETE CASCADE,
  term_kind TEXT NOT NULL DEFAULT 'public',
  term_hash TEXT,
  PRIMARY KEY (normalized_term, record_id, term_kind)
);

CREATE INDEX IF NOT EXISTS idx_address_index_record_country
  ON address_index_record(country_code);

CREATE INDEX IF NOT EXISTS idx_address_index_record_postcode
  ON address_index_record(country_code, postcode_norm);

CREATE INDEX IF NOT EXISTS idx_address_index_record_agid_prefix4
  ON address_index_record(agid_prefix4);

CREATE INDEX IF NOT EXISTS idx_address_index_record_point
  ON address_index_record(lat, lon);

CREATE INDEX IF NOT EXISTS idx_address_index_record_bounds
  ON address_index_record(min_lat, max_lat, min_lon, max_lon);

CREATE INDEX IF NOT EXISTS idx_address_index_spatial_bucket_record
  ON address_index_spatial_bucket(record_id);

CREATE INDEX IF NOT EXISTS idx_address_index_term_record
  ON address_index_term(record_id);

CREATE INDEX IF NOT EXISTS idx_address_index_public_metadata
  ON address_index_record USING gin (public_metadata_json);
