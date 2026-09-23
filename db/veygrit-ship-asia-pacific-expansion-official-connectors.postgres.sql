-- Add five direct Asia-Pacific carrier adapters.
-- Re-runnable after the Europe expansion migration.

DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT c.conrelid::regclass AS table_name, c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.contype = 'c'
      AND t.relname IN (
        'veygrit_ship_carrier_connection',
        'veygrit_ship_shipment',
        'veygrit_ship_rate_quote',
        'veygrit_ship_label',
        'veygrit_ship_tracking_event'
      )
      AND (
        pg_get_constraintdef(c.oid) ILIKE '%carrier IN (%'
        OR pg_get_constraintdef(c.oid) ILIKE '%adapter IN (%'
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', item.table_name, item.conname);
  END LOOP;
END;
$$;

ALTER TABLE veygrit_ship_shipment
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_lalamove_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_aramex_anz_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_nz_couriers_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_jt_express_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_yamato_adapter_chk;

ALTER TABLE veygrit_ship_carrier_connection
  ADD CONSTRAINT veygrit_ship_connection_carrier_asia_pacific_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
    'nz_couriers', 'jt_express', 'yamato'
  ));

ALTER TABLE veygrit_ship_shipment
  ADD CONSTRAINT veygrit_ship_shipment_carrier_asia_pacific_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
      'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
      'nz_couriers', 'jt_express', 'yamato'
    )),
  ADD CONSTRAINT veygrit_ship_shipment_adapter_asia_pacific_expansion_chk
    CHECK (adapter IN (
      'ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1',
      'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2',
      'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2', 'sf-express-openapi-v2',
      'four-px-openapi-v1', 'chilexpress-rest-v1', 'coordinadora-clientes-v1',
      'oca-epak-v1', '99minutos-v3', 'redpack-official-v1',
      'estafeta-label-rest-v1', 'jadlog-embarcador-v2.3',
      'total-express-official-v1', 'ups-roadie-v1', 'gls-europe-official-v1',
      'dpd-europe-official-v1', 'hermes-germany-hsi-v1', 'paack-public-v3',
      'mondial-relay-webservice-v5', 'packeta-soap-v1', 'dsv-generic-v2',
      'geodis-official-v1', 'lalamove-v3', 'aramex-anz-myfastway-v1',
      'nz-couriers-integration-v1', 'jt-open-platform-v1', 'yamato-b2-cloud-v1'
    )),
  ADD CONSTRAINT veygrit_ship_shipment_lalamove_adapter_chk
    CHECK (carrier <> 'lalamove' OR adapter IS NULL OR adapter = 'lalamove-v3'),
  ADD CONSTRAINT veygrit_ship_shipment_aramex_anz_adapter_chk
    CHECK (carrier <> 'aramex_anz' OR adapter IS NULL OR adapter = 'aramex-anz-myfastway-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_nz_couriers_adapter_chk
    CHECK (carrier <> 'nz_couriers' OR adapter IS NULL OR adapter = 'nz-couriers-integration-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_jt_express_adapter_chk
    CHECK (carrier <> 'jt_express' OR adapter IS NULL OR adapter = 'jt-open-platform-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_yamato_adapter_chk
    CHECK (carrier <> 'yamato' OR adapter IS NULL OR adapter = 'yamato-b2-cloud-v1');

ALTER TABLE veygrit_ship_rate_quote
  ADD CONSTRAINT veygrit_ship_rate_quote_carrier_asia_pacific_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
      'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
      'nz_couriers', 'jt_express', 'yamato'
    )),
  ADD CONSTRAINT veygrit_ship_rate_quote_adapter_asia_pacific_expansion_chk
    CHECK (adapter IN (
      'ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1',
      'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2',
      'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2', 'sf-express-openapi-v2',
      'four-px-openapi-v1', 'chilexpress-rest-v1', 'coordinadora-clientes-v1',
      'oca-epak-v1', '99minutos-v3', 'redpack-official-v1',
      'estafeta-label-rest-v1', 'jadlog-embarcador-v2.3',
      'total-express-official-v1', 'ups-roadie-v1', 'gls-europe-official-v1',
      'dpd-europe-official-v1', 'hermes-germany-hsi-v1', 'paack-public-v3',
      'mondial-relay-webservice-v5', 'packeta-soap-v1', 'dsv-generic-v2',
      'geodis-official-v1', 'lalamove-v3', 'aramex-anz-myfastway-v1',
      'nz-couriers-integration-v1', 'jt-open-platform-v1', 'yamato-b2-cloud-v1'
    ));

ALTER TABLE veygrit_ship_label
  ADD CONSTRAINT veygrit_ship_label_carrier_asia_pacific_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
    'nz_couriers', 'jt_express', 'yamato'
  ));

ALTER TABLE veygrit_ship_tracking_event
  ADD CONSTRAINT veygrit_ship_tracking_event_carrier_asia_pacific_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
    'nz_couriers', 'jt_express', 'yamato'
  ));
