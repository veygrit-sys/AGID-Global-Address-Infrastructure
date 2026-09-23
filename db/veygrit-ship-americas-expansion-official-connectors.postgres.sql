-- Add nine direct official carrier adapters for the Americas expansion wave.
-- Re-runnable after the regional carrier migrations.

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
  ADD CONSTRAINT veygrit_ship_connection_carrier_americas_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie'
  ));

ALTER TABLE veygrit_ship_shipment
  ADD CONSTRAINT veygrit_ship_shipment_carrier_americas_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie'
    )),
  ADD CONSTRAINT veygrit_ship_shipment_adapter_americas_expansion_chk
    CHECK (adapter IN (
      'ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1',
      'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2',
      'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2', 'sf-express-openapi-v2',
      'four-px-openapi-v1', 'chilexpress-rest-v1', 'coordinadora-clientes-v1',
      'oca-epak-v1', '99minutos-v3', 'redpack-official-v1',
      'estafeta-label-rest-v1', 'jadlog-embarcador-v2.3',
      'total-express-official-v1', 'ups-roadie-v1'
    )),
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
    CHECK (carrier <> 'courier_guy' OR adapter IS NULL OR adapter = 'courier-guy-v2'),
  ADD CONSTRAINT veygrit_ship_shipment_sf_express_adapter_chk
    CHECK (carrier <> 'sf_express' OR adapter IS NULL OR adapter = 'sf-express-openapi-v2'),
  ADD CONSTRAINT veygrit_ship_shipment_four_px_adapter_chk
    CHECK (carrier <> 'four_px' OR adapter IS NULL OR adapter = 'four-px-openapi-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_chilexpress_adapter_chk
    CHECK (carrier <> 'chilexpress' OR adapter IS NULL OR adapter = 'chilexpress-rest-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_coordinadora_adapter_chk
    CHECK (carrier <> 'coordinadora' OR adapter IS NULL OR adapter = 'coordinadora-clientes-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_oca_adapter_chk
    CHECK (carrier <> 'oca' OR adapter IS NULL OR adapter = 'oca-epak-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_99minutos_adapter_chk
    CHECK (carrier <> 'ninety_nine_minutos' OR adapter IS NULL OR adapter = '99minutos-v3'),
  ADD CONSTRAINT veygrit_ship_shipment_redpack_adapter_chk
    CHECK (carrier <> 'redpack' OR adapter IS NULL OR adapter = 'redpack-official-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_estafeta_adapter_chk
    CHECK (carrier <> 'estafeta' OR adapter IS NULL OR adapter = 'estafeta-label-rest-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_jadlog_adapter_chk
    CHECK (carrier <> 'jadlog' OR adapter IS NULL OR adapter = 'jadlog-embarcador-v2.3'),
  ADD CONSTRAINT veygrit_ship_shipment_total_express_adapter_chk
    CHECK (carrier <> 'total_express' OR adapter IS NULL OR adapter = 'total-express-official-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_roadie_adapter_chk
    CHECK (carrier <> 'roadie' OR adapter IS NULL OR adapter = 'ups-roadie-v1');

ALTER TABLE veygrit_ship_rate_quote
  ADD CONSTRAINT veygrit_ship_rate_quote_carrier_americas_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie'
    )),
  ADD CONSTRAINT veygrit_ship_rate_quote_adapter_americas_expansion_chk
    CHECK (adapter IN (
      'ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1',
      'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2',
      'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2', 'sf-express-openapi-v2',
      'four-px-openapi-v1', 'chilexpress-rest-v1', 'coordinadora-clientes-v1',
      'oca-epak-v1', '99minutos-v3', 'redpack-official-v1',
      'estafeta-label-rest-v1', 'jadlog-embarcador-v2.3',
      'total-express-official-v1', 'ups-roadie-v1'
    ));

ALTER TABLE veygrit_ship_label
  ADD CONSTRAINT veygrit_ship_label_carrier_americas_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie'
  ));

ALTER TABLE veygrit_ship_tracking_event
  ADD CONSTRAINT veygrit_ship_tracking_event_carrier_americas_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie'
  ));
