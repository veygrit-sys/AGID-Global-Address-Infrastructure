-- Expand Veygrit Ship persistence from UPS/DHL to direct Americas carriers.
-- This migration is idempotent and preserves existing shipment data.

DO $$
DECLARE
  item record;
BEGIN
  -- The original core schema used inline constraint names. Remove only the
  -- carrier/adapter checks that this migration replaces.
  FOR item IN
    SELECT c.conrelid::regclass AS table_name, c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.contype = 'c'
      AND t.relname IN ('veygrit_ship_carrier_connection', 'veygrit_ship_shipment', 'veygrit_ship_rate_quote', 'veygrit_ship_label', 'veygrit_ship_tracking_event')
      AND (pg_get_constraintdef(c.oid) ILIKE '%carrier IN (%' OR pg_get_constraintdef(c.oid) ILIKE '%adapter%')
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', item.table_name, item.conname);
  END LOOP;
END;
$$;

ALTER TABLE veygrit_ship_carrier_connection
  ADD CONSTRAINT veygrit_ship_connection_carrier_official_chk
  CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi'));

ALTER TABLE veygrit_ship_shipment
  ADD CONSTRAINT veygrit_ship_shipment_carrier_official_chk
    CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi')),
  ADD CONSTRAINT veygrit_ship_shipment_adapter_official_chk
    CHECK (adapter IN ('ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1')),
  ADD CONSTRAINT veygrit_ship_shipment_adapter_requires_carrier_chk
    CHECK (adapter IS NULL OR carrier IS NOT NULL),
  ADD CONSTRAINT veygrit_ship_shipment_ups_adapter_chk
    CHECK (carrier <> 'ups' OR adapter IS NULL OR adapter = 'ups'),
  ADD CONSTRAINT veygrit_ship_shipment_dhl_adapter_chk
    CHECK (carrier <> 'dhl' OR adapter IS NULL OR adapter IN ('mydhl-express', 'ecommerce-americas-v4')),
  ADD CONSTRAINT veygrit_ship_shipment_amazon_adapter_chk
    CHECK (carrier <> 'amazon_shipping' OR adapter IS NULL OR adapter = 'amazon-shipping-v2'),
  ADD CONSTRAINT veygrit_ship_shipment_loggi_adapter_chk
    CHECK (carrier <> 'loggi' OR adapter IS NULL OR adapter = 'loggi-v1');

ALTER TABLE veygrit_ship_rate_quote
  ADD CONSTRAINT veygrit_ship_rate_quote_carrier_official_chk
    CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi')),
  ADD CONSTRAINT veygrit_ship_rate_quote_adapter_official_chk
    CHECK (adapter IN ('ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1'));

ALTER TABLE veygrit_ship_label
  ADD CONSTRAINT veygrit_ship_label_carrier_official_chk
  CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi'));

ALTER TABLE veygrit_ship_tracking_event
  ADD CONSTRAINT veygrit_ship_tracking_event_carrier_official_chk
  CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi'));
