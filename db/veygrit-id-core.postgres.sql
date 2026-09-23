BEGIN;

CREATE TABLE IF NOT EXISTS veygrit_id_subject (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_ref varchar(100) NOT NULL UNIQUE CHECK (subject_ref ~ '^vey_subject_[A-Za-z0-9_-]{16,}$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS veygrit_id_provider_identity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id bigint NOT NULL REFERENCES veygrit_id_subject(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_subject_hash char(64) NOT NULL CHECK (provider_subject_hash ~ '^[a-f0-9]{64}$'),
  email_hash char(64) CHECK (email_hash IS NULL OR email_hash ~ '^[a-f0-9]{64}$'),
  email_verified boolean NOT NULL DEFAULT false,
  linked_at timestamptz NOT NULL DEFAULT now(),
  last_authenticated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject_hash)
);

CREATE TABLE IF NOT EXISTS veygrit_id_oauth_client (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_ref varchar(100) NOT NULL UNIQUE,
  display_name varchar(200) NOT NULL,
  client_type text NOT NULL CHECK (client_type IN ('public', 'confidential')),
  sector_identifier varchar(255) NOT NULL,
  redirect_uris text[] NOT NULL CHECK (cardinality(redirect_uris) > 0),
  allowed_origins text[] NOT NULL DEFAULT '{}',
  allowed_scopes text[] NOT NULL DEFAULT ARRAY['openid'],
  client_secret_hash char(64) CHECK ((client_type = 'public' AND client_secret_hash IS NULL) OR (client_type = 'confidential' AND client_secret_hash ~ '^[a-f0-9]{64}$')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS veygrit_id_pairwise_subject (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id bigint NOT NULL REFERENCES veygrit_id_subject(id) ON DELETE RESTRICT,
  client_id bigint NOT NULL REFERENCES veygrit_id_oauth_client(id) ON DELETE RESTRICT,
  pairwise_subject_alias varchar(160) NOT NULL UNIQUE CHECK (pairwise_subject_alias ~ '^pairwise_[A-Za-z0-9_-]{16,}$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (subject_id, client_id),
  CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS veygrit_id_session (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_ref varchar(100) NOT NULL UNIQUE CHECK (session_ref ~ '^vey_session_[A-Za-z0-9_-]{16,}$'),
  session_token_hash char(64) NOT NULL UNIQUE CHECK (session_token_hash ~ '^[a-f0-9]{64}$'),
  subject_id bigint NOT NULL REFERENCES veygrit_id_subject(id) ON DELETE RESTRICT,
  authentication_method text NOT NULL CHECK (authentication_method IN ('google', 'apple', 'step_up')),
  auth_time timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CHECK (expires_at > auth_time)
);

CREATE INDEX IF NOT EXISTS veygrit_id_session_active_idx
  ON veygrit_id_session (subject_id, expires_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS veygrit_id_authorization_request (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_ref varchar(100) NOT NULL UNIQUE CHECK (request_ref ~ '^vey_auth_req_[A-Za-z0-9_-]{16,}$'),
  client_id bigint NOT NULL REFERENCES veygrit_id_oauth_client(id) ON DELETE RESTRICT,
  redirect_uri text NOT NULL,
  origin text,
  scope text[] NOT NULL,
  state_hash char(64) NOT NULL CHECK (state_hash ~ '^[a-f0-9]{64}$'),
  nonce_hash char(64) NOT NULL CHECK (nonce_hash ~ '^[a-f0-9]{64}$'),
  nonce_value varchar(255) NOT NULL,
  pkce_challenge varchar(128) NOT NULL,
  pkce_method text NOT NULL CHECK (pkce_method = 'S256'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS veygrit_id_authorization_request_open_idx
  ON veygrit_id_authorization_request (expires_at) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS veygrit_id_authorization_code (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code_ref varchar(100) NOT NULL UNIQUE CHECK (code_ref ~ '^vey_code_ref_[A-Za-z0-9_-]{16,}$'),
  code_hash char(64) NOT NULL UNIQUE CHECK (code_hash ~ '^[a-f0-9]{64}$'),
  request_id bigint NOT NULL REFERENCES veygrit_id_authorization_request(id) ON DELETE RESTRICT,
  pairwise_subject_id bigint NOT NULL REFERENCES veygrit_id_pairwise_subject(id) ON DELETE RESTRICT,
  session_id bigint NOT NULL REFERENCES veygrit_id_session(id) ON DELETE RESTRICT,
  wallet_consent_ref varchar(160),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS veygrit_id_authorization_code_open_idx
  ON veygrit_id_authorization_code (expires_at) WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS veygrit_id_token_family (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  family_ref varchar(100) NOT NULL UNIQUE CHECK (family_ref ~ '^vey_token_family_[A-Za-z0-9_-]{16,}$'),
  pairwise_subject_id bigint NOT NULL REFERENCES veygrit_id_pairwise_subject(id) ON DELETE RESTRICT,
  client_id bigint NOT NULL REFERENCES veygrit_id_oauth_client(id) ON DELETE RESTRICT,
  granted_scopes text[] NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'compromised')),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS veygrit_id_access_token (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_ref varchar(100) NOT NULL UNIQUE CHECK (token_ref ~ '^vey_access_ref_[A-Za-z0-9_-]{16,}$'),
  token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  family_id bigint NOT NULL REFERENCES veygrit_id_token_family(id) ON DELETE RESTRICT,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > issued_at)
);

CREATE INDEX IF NOT EXISTS veygrit_id_access_token_active_idx
  ON veygrit_id_access_token (expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS veygrit_id_refresh_token (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_ref varchar(100) NOT NULL UNIQUE CHECK (token_ref ~ '^vey_refresh_ref_[A-Za-z0-9_-]{16,}$'),
  token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  family_id bigint NOT NULL REFERENCES veygrit_id_token_family(id) ON DELETE RESTRICT,
  rotation_counter integer NOT NULL DEFAULT 0 CHECK (rotation_counter >= 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  replaced_by_ref varchar(100),
  CHECK (expires_at > issued_at)
);

CREATE INDEX IF NOT EXISTS veygrit_id_refresh_token_open_idx
  ON veygrit_id_refresh_token (expires_at) WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS veygrit_id_navigation_handoff (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  handoff_ref varchar(100) NOT NULL UNIQUE CHECK (handoff_ref ~ '^nav_handoff_[A-Za-z0-9_-]{16,}$'),
  handoff_token_hash char(64) NOT NULL UNIQUE CHECK (handoff_token_hash ~ '^[a-f0-9]{64}$'),
  pairwise_subject_id bigint NOT NULL REFERENCES veygrit_id_pairwise_subject(id) ON DELETE RESTRICT,
  source_surface text NOT NULL CHECK (source_surface IN ('address-wallet', 'veygrit-store', 'veygrit-ship')),
  target_surface text NOT NULL CHECK (target_surface IN ('address-wallet', 'veygrit-store', 'veygrit-ship')),
  return_path text NOT NULL CHECK (return_path ~ '^/[^/].*|^/$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (source_surface <> target_surface),
  CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS veygrit_id_signing_key (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key_id varchar(100) NOT NULL UNIQUE,
  algorithm text NOT NULL CHECK (algorithm IN ('EdDSA', 'ES256', 'RS256')),
  public_jwk jsonb NOT NULL,
  private_key_secret_ref text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retiring', 'retired')),
  not_before timestamptz NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS veygrit_id_one_active_signing_key_uq
  ON veygrit_id_signing_key ((status)) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS veygrit_id_audit_event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_ref varchar(100) NOT NULL UNIQUE,
  actor_type text NOT NULL CHECK (actor_type IN ('subject', 'client', 'system', 'admin')),
  actor_ref varchar(160),
  action varchar(120) NOT NULL,
  aggregate_type varchar(80) NOT NULL,
  aggregate_ref varchar(160) NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  request_id varchar(160),
  source_ip_hash char(64) CHECK (source_ip_hash IS NULL OR source_ip_hash ~ '^[a-f0-9]{64}$'),
  details jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS veygrit_id_audit_event_aggregate_idx
  ON veygrit_id_audit_event (aggregate_type, aggregate_ref, occurred_at DESC);

COMMIT;
