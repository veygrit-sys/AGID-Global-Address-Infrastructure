-- Veygrit -ship core persistence (PostgreSQL 14+).
-- Apply with a migration role. Runtime credentials should not own these objects.

CREATE OR REPLACE FUNCTION veygrit_ship_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS veygrit_ship_merchant (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  merchant_ref varchar(100) NOT NULL UNIQUE,
  display_name varchar(200) NOT NULL,
  legal_name varchar(200),
  business_type text NOT NULL CHECK (business_type IN ('individual', 'sole_proprietor', 'company')),
  country_code char(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  language_tag varchar(35) NOT NULL DEFAULT 'en-US',
  email varchar(320) NOT NULL,
  phone_e164 varchar(20) NOT NULL CHECK (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_merchant_email_active_uq
  ON veygrit_ship_merchant (lower(email)) WHERE status <> 'closed';

CREATE TABLE IF NOT EXISTS veygrit_ship_guest_session (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_ref varchar(100) NOT NULL UNIQUE,
  token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  claimed_by_merchant_id bigint REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'claimed') = (claimed_by_merchant_id IS NOT NULL AND claimed_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS veygrit_ship_guest_session_claimed_merchant_idx
  ON veygrit_ship_guest_session (claimed_by_merchant_id) WHERE claimed_by_merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_guest_session_active_expiry_idx
  ON veygrit_ship_guest_session (expires_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS veygrit_ship_carrier_connection (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  connection_ref varchar(100) NOT NULL UNIQUE,
  merchant_id bigint NOT NULL REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  carrier text NOT NULL CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px')),
  account_alias varchar(100) NOT NULL DEFAULT 'default',
  account_number_last4 char(4),
  credential_secret_ref varchar(500) NOT NULL,
  oauth_scopes text[] NOT NULL DEFAULT '{}',
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'reauthorization_required', 'disabled')),
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, carrier, account_alias)
);

CREATE INDEX IF NOT EXISTS veygrit_ship_carrier_connection_merchant_idx
  ON veygrit_ship_carrier_connection (merchant_id, status, carrier);

CREATE TABLE IF NOT EXISTS veygrit_ship_shipment (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shipment_ref varchar(100) NOT NULL UNIQUE,
  merchant_id bigint REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  guest_session_id bigint REFERENCES veygrit_ship_guest_session(id) ON DELETE RESTRICT,
  carrier_connection_id bigint REFERENCES veygrit_ship_carrier_connection(id) ON DELETE RESTRICT,
  carrier text CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px')),
  adapter text CHECK (adapter IN ('ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1', 'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2', 'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2', 'sf-express-openapi-v2', 'four-px-openapi-v1')),
  carrier_shipment_id varchar(100),
  product_id_code varchar(20) CHECK (product_id_code IS NULL OR product_id_code ~ '^[A-Z0-9_-]{1,20}$'),
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'return')),
  mode text NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'rating', 'rated', 'creating', 'created', 'in_transit', 'delivered', 'void_pending', 'voided', 'failed')),
  origin_country_code char(2) NOT NULL CHECK (origin_country_code ~ '^[A-Z]{2}$'),
  destination_country_code char(2) NOT NULL CHECK (destination_country_code ~ '^[A-Z]{2}$'),
  origin_address_ref varchar(200) NOT NULL,
  destination_address_ref varchar(200) NOT NULL,
  origin_address_snapshot_ref varchar(500),
  destination_address_snapshot_ref varchar(500),
  ship_date date,
  request_fingerprint char(64) CHECK (request_fingerprint IS NULL OR request_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((merchant_id IS NOT NULL)::integer + (guest_session_id IS NOT NULL)::integer = 1),
  CHECK (carrier_connection_id IS NULL OR merchant_id IS NOT NULL),
  CHECK (adapter IS NULL OR carrier IS NOT NULL),
  CHECK (carrier <> 'ups' OR adapter IS NULL OR adapter = 'ups'),
  CHECK (carrier <> 'dhl' OR adapter IS NULL OR adapter IN ('mydhl-express', 'ecommerce-americas-v4')),
  CHECK (carrier <> 'amazon_shipping' OR adapter IS NULL OR adapter = 'amazon-shipping-v2'),
  CHECK (carrier <> 'loggi' OR adapter IS NULL OR adapter = 'loggi-v1'),
  CHECK (carrier <> 'royal_mail' OR adapter IS NULL OR adapter = 'royal-mail-shipping-v2'),
  CHECK (carrier <> 'inpost' OR adapter IS NULL OR adapter = 'inpost-shipping-v2'),
  CHECK (carrier <> 'ninja_van' OR adapter IS NULL OR adapter = 'ninja-van-order-v4.2'),
  CHECK (carrier <> 'delhivery' OR adapter IS NULL OR adapter = 'delhivery-b2c-v1'),
  CHECK (carrier <> 'pargo' OR adapter IS NULL OR adapter = 'pargo-simba-v1'),
  CHECK (carrier <> 'courier_guy' OR adapter IS NULL OR adapter = 'courier-guy-v2'),
  CHECK (carrier <> 'sf_express' OR adapter IS NULL OR adapter = 'sf-express-openapi-v2'),
  CHECK (carrier <> 'four_px' OR adapter IS NULL OR adapter = 'four-px-openapi-v1')
);

CREATE INDEX IF NOT EXISTS veygrit_ship_shipment_merchant_status_idx
  ON veygrit_ship_shipment (merchant_id, status, created_at DESC) WHERE merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_shipment_guest_idx
  ON veygrit_ship_shipment (guest_session_id, created_at DESC) WHERE guest_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_shipment_carrier_connection_idx
  ON veygrit_ship_shipment (carrier_connection_id, created_at DESC) WHERE carrier_connection_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_shipment_carrier_id_uq
  ON veygrit_ship_shipment (carrier, carrier_shipment_id)
  WHERE carrier IS NOT NULL AND carrier_shipment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS veygrit_ship_package (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_ref varchar(100) NOT NULL UNIQUE,
  shipment_id bigint NOT NULL REFERENCES veygrit_ship_shipment(id) ON DELETE RESTRICT,
  sequence_no smallint NOT NULL CHECK (sequence_no > 0),
  packaging_code varchar(30),
  carrier_package_id varchar(100),
  weight_value numeric(12,3) NOT NULL CHECK (weight_value > 0),
  weight_unit text NOT NULL CHECK (weight_unit IN ('lb', 'kg')),
  length_value numeric(12,3) CHECK (length_value > 0),
  width_value numeric(12,3) CHECK (width_value > 0),
  height_value numeric(12,3) CHECK (height_value > 0),
  dimension_unit text CHECK (dimension_unit IN ('in', 'cm')),
  declared_value numeric(19,4) CHECK (declared_value >= 0),
  declared_value_currency char(3) CHECK (declared_value_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, sequence_no),
  CHECK ((length_value IS NULL AND width_value IS NULL AND height_value IS NULL AND dimension_unit IS NULL)
      OR (length_value IS NOT NULL AND width_value IS NOT NULL AND height_value IS NOT NULL AND dimension_unit IS NOT NULL)),
  CHECK ((declared_value IS NULL) = (declared_value_currency IS NULL))
);

CREATE INDEX IF NOT EXISTS veygrit_ship_package_shipment_idx
  ON veygrit_ship_package (shipment_id, sequence_no);

CREATE TABLE IF NOT EXISTS veygrit_ship_rate_quote (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quote_ref varchar(100) NOT NULL UNIQUE,
  shipment_id bigint NOT NULL REFERENCES veygrit_ship_shipment(id) ON DELETE RESTRICT,
  carrier_connection_id bigint REFERENCES veygrit_ship_carrier_connection(id) ON DELETE RESTRICT,
  carrier text NOT NULL CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px')),
  adapter text CHECK (adapter IN ('ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1', 'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2', 'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2', 'sf-express-openapi-v2', 'four-px-openapi-v1')),
  product_id_code varchar(20) NOT NULL CHECK (product_id_code ~ '^[A-Z0-9_-]{1,20}$'),
  amount numeric(19,4) NOT NULL CHECK (amount >= 0),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  delivery_days smallint CHECK (delivery_days >= 0),
  estimated_delivery_at timestamptz,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'selected', 'expired', 'rejected')),
  carrier_response_ref varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS veygrit_ship_rate_quote_shipment_expiry_idx
  ON veygrit_ship_rate_quote (shipment_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS veygrit_ship_rate_quote_open_expiry_idx
  ON veygrit_ship_rate_quote (expires_at) WHERE status = 'offered';
CREATE INDEX IF NOT EXISTS veygrit_ship_rate_quote_carrier_connection_idx
  ON veygrit_ship_rate_quote (carrier_connection_id) WHERE carrier_connection_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_rate_quote_selected_uq
  ON veygrit_ship_rate_quote (shipment_id) WHERE status = 'selected';

CREATE TABLE IF NOT EXISTS veygrit_ship_label (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label_ref varchar(100) NOT NULL UNIQUE,
  shipment_id bigint NOT NULL REFERENCES veygrit_ship_shipment(id) ON DELETE RESTRICT,
  package_id bigint REFERENCES veygrit_ship_package(id) ON DELETE RESTRICT,
  carrier text NOT NULL CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px')),
  carrier_tracking_number varchar(100) NOT NULL,
  format text NOT NULL CHECK (format IN ('pdf', 'png', 'zpl', 'gif', 'epl')),
  artifact_key varchar(500) NOT NULL,
  artifact_sha256 char(64) NOT NULL CHECK (artifact_sha256 ~ '^[a-f0-9]{64}$'),
  artifact_size_bytes bigint CHECK (artifact_size_bytes >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided', 'superseded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  CHECK ((status = 'voided') = (voided_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS veygrit_ship_label_shipment_idx
  ON veygrit_ship_label (shipment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS veygrit_ship_label_package_idx
  ON veygrit_ship_label (package_id) WHERE package_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_label_tracking_uq
  ON veygrit_ship_label (carrier, carrier_tracking_number) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS veygrit_ship_tracking_event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_ref varchar(100) NOT NULL UNIQUE,
  shipment_id bigint NOT NULL REFERENCES veygrit_ship_shipment(id) ON DELETE RESTRICT,
  label_id bigint REFERENCES veygrit_ship_label(id) ON DELETE RESTRICT,
  carrier text NOT NULL CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px')),
  carrier_event_id varchar(200),
  event_fingerprint char(64) NOT NULL CHECK (event_fingerprint ~ '^[a-f0-9]{64}$'),
  status_code varchar(50) NOT NULL,
  status_category text NOT NULL CHECK (status_category IN ('pre_transit', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'return_to_sender', 'unknown')),
  summary varchar(500),
  location_city varchar(200),
  location_region varchar(100),
  location_postal_code varchar(20),
  location_country_code char(2) CHECK (location_country_code IS NULL OR location_country_code ~ '^[A-Z]{2}$'),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  carrier_payload_ref varchar(500),
  carrier_payload_sha256 char(64) CHECK (carrier_payload_sha256 IS NULL OR carrier_payload_sha256 ~ '^[a-f0-9]{64}$'),
  UNIQUE (shipment_id, event_fingerprint)
);

CREATE INDEX IF NOT EXISTS veygrit_ship_tracking_event_shipment_time_idx
  ON veygrit_ship_tracking_event (shipment_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS veygrit_ship_tracking_event_label_idx
  ON veygrit_ship_tracking_event (label_id, occurred_at DESC) WHERE label_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_tracking_event_carrier_event_uq
  ON veygrit_ship_tracking_event (carrier, carrier_event_id)
  WHERE carrier_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS veygrit_ship_webhook_delivery (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  delivery_ref varchar(100) NOT NULL UNIQUE,
  merchant_id bigint NOT NULL REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  shipment_id bigint REFERENCES veygrit_ship_shipment(id) ON DELETE RESTRICT,
  endpoint_ref varchar(200) NOT NULL,
  event_type varchar(100) NOT NULL,
  event_ref varchar(100) NOT NULL,
  payload_ref varchar(500) NOT NULL,
  payload_sha256 char(64) NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivering', 'succeeded', 'retry', 'dead_letter')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz,
  response_status smallint CHECK (response_status BETWEEN 100 AND 599),
  last_error_code varchar(100),
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, endpoint_ref, event_ref)
);

CREATE INDEX IF NOT EXISTS veygrit_ship_webhook_delivery_shipment_idx
  ON veygrit_ship_webhook_delivery (shipment_id, created_at DESC) WHERE shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_webhook_delivery_pending_idx
  ON veygrit_ship_webhook_delivery (next_attempt_at, id)
  WHERE status IN ('pending', 'retry', 'delivering');

CREATE TABLE IF NOT EXISTS veygrit_ship_idempotency_record (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idempotency_ref varchar(100) NOT NULL UNIQUE,
  merchant_id bigint REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  guest_session_id bigint REFERENCES veygrit_ship_guest_session(id) ON DELETE RESTRICT,
  operation varchar(150) NOT NULL,
  idempotency_key_hash char(64) NOT NULL CHECK (idempotency_key_hash ~ '^[a-f0-9]{64}$'),
  request_hash char(64) NOT NULL CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'in_progress' CHECK (state IN ('in_progress', 'completed', 'failed')),
  response_status smallint CHECK (response_status BETWEEN 100 AND 599),
  response_body_ref varchar(500),
  response_body_sha256 char(64) CHECK (response_body_sha256 IS NULL OR response_body_sha256 ~ '^[a-f0-9]{64}$'),
  lease_expires_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((merchant_id IS NOT NULL)::integer + (guest_session_id IS NOT NULL)::integer = 1),
  CHECK ((state = 'completed') = (completed_at IS NOT NULL)),
  CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_idempotency_merchant_key_uq
  ON veygrit_ship_idempotency_record (merchant_id, operation, idempotency_key_hash)
  WHERE merchant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS veygrit_ship_idempotency_guest_key_uq
  ON veygrit_ship_idempotency_record (guest_session_id, operation, idempotency_key_hash)
  WHERE guest_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_idempotency_expiry_idx
  ON veygrit_ship_idempotency_record (expires_at);
CREATE INDEX IF NOT EXISTS veygrit_ship_idempotency_in_progress_lease_idx
  ON veygrit_ship_idempotency_record (lease_expires_at) WHERE state = 'in_progress';

CREATE TABLE IF NOT EXISTS veygrit_ship_audit_event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_ref varchar(100) NOT NULL UNIQUE,
  merchant_id bigint REFERENCES veygrit_ship_merchant(id) ON DELETE RESTRICT,
  guest_session_id bigint REFERENCES veygrit_ship_guest_session(id) ON DELETE RESTRICT,
  actor_type text NOT NULL CHECK (actor_type IN ('merchant_user', 'guest', 'api_key', 'system', 'carrier', 'support')),
  actor_ref varchar(200),
  action varchar(150) NOT NULL,
  aggregate_type varchar(100) NOT NULL,
  aggregate_ref varchar(200) NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  request_id varchar(100),
  source_ip_hash char(64) CHECK (source_ip_hash IS NULL OR source_ip_hash ~ '^[a-f0-9]{64}$'),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(details) = 'object' AND octet_length(details::text) <= 16384),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((merchant_id IS NOT NULL)::integer + (guest_session_id IS NOT NULL)::integer <= 1)
);

CREATE INDEX IF NOT EXISTS veygrit_ship_audit_event_merchant_time_idx
  ON veygrit_ship_audit_event (merchant_id, occurred_at DESC) WHERE merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_audit_event_guest_time_idx
  ON veygrit_ship_audit_event (guest_session_id, occurred_at DESC) WHERE guest_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS veygrit_ship_audit_event_aggregate_time_idx
  ON veygrit_ship_audit_event (aggregate_type, aggregate_ref, occurred_at DESC);

CREATE OR REPLACE FUNCTION veygrit_ship_reject_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'veygrit_ship_audit_event is append-only';
END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'veygrit_ship_merchant', 'veygrit_ship_guest_session', 'veygrit_ship_carrier_connection',
    'veygrit_ship_shipment', 'veygrit_ship_package', 'veygrit_ship_rate_quote',
    'veygrit_ship_webhook_delivery', 'veygrit_ship_idempotency_record'
  ]
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = table_name || '_updated_at_trg') THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION veygrit_ship_set_updated_at()',
        table_name || '_updated_at_trg', table_name
      );
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'veygrit_ship_audit_event_append_only_trg') THEN
    CREATE TRIGGER veygrit_ship_audit_event_append_only_trg
      BEFORE UPDATE OR DELETE ON veygrit_ship_audit_event
      FOR EACH ROW EXECUTE FUNCTION veygrit_ship_reject_audit_mutation();
  END IF;
END;
$$;

COMMENT ON COLUMN veygrit_ship_carrier_connection.credential_secret_ref IS
  'Opaque reference to a secrets manager entry. Never store UPS or DHL credentials in this table.';
COMMENT ON COLUMN veygrit_ship_shipment.product_id_code IS
  'Carrier product identifier code. A localized product name must never be used as the identifier.';
COMMENT ON COLUMN veygrit_ship_label.artifact_key IS
  'Object-storage key for encrypted label content; label bytes are not stored in PostgreSQL.';
COMMENT ON TABLE veygrit_ship_audit_event IS
  'Append-only security and operational audit trail; UPDATE and DELETE are rejected by trigger.';

-- Optional least-privilege runtime role. The migration remains portable when the role is absent.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'veygrit_ship_app') THEN
    GRANT USAGE ON SCHEMA public TO veygrit_ship_app;
    GRANT SELECT, INSERT, UPDATE ON
      veygrit_ship_merchant, veygrit_ship_guest_session, veygrit_ship_carrier_connection,
      veygrit_ship_shipment, veygrit_ship_package, veygrit_ship_rate_quote,
      veygrit_ship_label, veygrit_ship_tracking_event, veygrit_ship_webhook_delivery,
      veygrit_ship_idempotency_record
      TO veygrit_ship_app;
    GRANT SELECT, INSERT ON veygrit_ship_audit_event TO veygrit_ship_app;
    GRANT USAGE, SELECT ON
      veygrit_ship_merchant_id_seq, veygrit_ship_guest_session_id_seq,
      veygrit_ship_carrier_connection_id_seq, veygrit_ship_shipment_id_seq,
      veygrit_ship_package_id_seq, veygrit_ship_rate_quote_id_seq,
      veygrit_ship_label_id_seq, veygrit_ship_tracking_event_id_seq,
      veygrit_ship_webhook_delivery_id_seq, veygrit_ship_idempotency_record_id_seq,
      veygrit_ship_audit_event_id_seq
      TO veygrit_ship_app;
  END IF;
END;
$$;
