-- Add direct Pargo and The Courier Guy carrier persistence.
-- Re-runnable after the core, Americas, Europe, and Asia carrier migrations.

DO $$
DECLARE
  item record;
BEGIN
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
  ADD CONSTRAINT veygrit_ship_connection_carrier_africa_chk
  CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy'));

ALTER TABLE veygrit_ship_shipment
  ADD CONSTRAINT veygrit_ship_shipment_carrier_africa_chk
    CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy')),
  ADD CONSTRAINT veygrit_ship_shipment_adapter_africa_chk
    CHECK (adapter IN ('ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1', 'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2', 'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2')),
  ADD CONSTRAINT veygrit_ship_shipment_adapter_requires_carrier_chk
    CHECK (adapter IS NULL OR carrier IS NOT NULL),
  ADD CONSTRAINT veygrit_ship_shipment_ups_adapter_chk
    CHECK (carrier <> 'ups' OR adapter IS NULL OR adapter = 'ups'),
  ADD CONSTRAINT veygrit_ship_shipment_dhl_adapter_chk
    CHECK (carrier <> 'dhl' OR adapter IS NULL OR adapter IN ('mydhl-express', 'ecommerce-americas-v4')),
  ADD CONSTRAINT veygrit_ship_shipment_amazon_adapter_chk
    CHECK (carrier <> 'amazon_shipping' OR adapter IS NULL OR adapter = 'amazon-shipping-v2'),
  ADD CONSTRAINT veygrit_ship_shipment_loggi_adapter_chk
    CHECK (carrier <> 'loggi' OR adapter IS NULL OR adapter = 'loggi-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_royal_mail_adapter_chk
    CHECK (carrier <> 'royal_mail' OR adapter IS NULL OR adapter = 'royal-mail-shipping-v2'),
  ADD CONSTRAINT veygrit_ship_shipment_inpost_adapter_chk
    CHECK (carrier <> 'inpost' OR adapter IS NULL OR adapter = 'inpost-shipping-v2'),
  ADD CONSTRAINT veygrit_ship_shipment_ninja_van_adapter_chk
    CHECK (carrier <> 'ninja_van' OR adapter IS NULL OR adapter = 'ninja-van-order-v4.2'),
  ADD CONSTRAINT veygrit_ship_shipment_delhivery_adapter_chk
    CHECK (carrier <> 'delhivery' OR adapter IS NULL OR adapter = 'delhivery-b2c-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_pargo_adapter_chk
    CHECK (carrier <> 'pargo' OR adapter IS NULL OR adapter = 'pargo-simba-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_courier_guy_adapter_chk
    CHECK (carrier <> 'courier_guy' OR adapter IS NULL OR adapter = 'courier-guy-v2');

ALTER TABLE veygrit_ship_rate_quote
  ADD CONSTRAINT veygrit_ship_rate_quote_carrier_africa_chk
    CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy')),
  ADD CONSTRAINT veygrit_ship_rate_quote_adapter_africa_chk
    CHECK (adapter IN ('ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1', 'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2', 'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2'));

ALTER TABLE veygrit_ship_label
  ADD CONSTRAINT veygrit_ship_label_carrier_africa_chk
  CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy'));

ALTER TABLE veygrit_ship_tracking_event
  ADD CONSTRAINT veygrit_ship_tracking_event_carrier_africa_chk
  CHECK (carrier IN ('ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van', 'delhivery', 'pargo', 'courier_guy'));
