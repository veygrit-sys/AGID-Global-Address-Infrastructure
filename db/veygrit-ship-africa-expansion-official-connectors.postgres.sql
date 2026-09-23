-- Add direct official Collivery, RAM Couriers and Lilwa Delivery adapters.
-- Re-runnable after the Asia-Pacific expansion migration.

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
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_collivery_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_ram_couriers_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_lilwa_delivery_adapter_chk;

ALTER TABLE veygrit_ship_carrier_connection
  ADD CONSTRAINT veygrit_ship_connection_carrier_africa_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
    'nz_couriers', 'jt_express', 'yamato', 'collivery', 'ram_couriers',
    'lilwa_delivery'
  ));

ALTER TABLE veygrit_ship_shipment
  ADD CONSTRAINT veygrit_ship_shipment_carrier_africa_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
      'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
      'nz_couriers', 'jt_express', 'yamato', 'collivery', 'ram_couriers',
      'lilwa_delivery'
    )),
  ADD CONSTRAINT veygrit_ship_shipment_adapter_africa_expansion_chk
    CHECK (adapter IN (
      'ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1',
      'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2',
      'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2',
      'sf-express-openapi-v2', 'four-px-openapi-v1', 'chilexpress-rest-v1',
      'coordinadora-clientes-v1', 'oca-epak-v1', '99minutos-v3',
      'redpack-official-v1', 'estafeta-label-rest-v1', 'jadlog-embarcador-v2.3',
      'total-express-official-v1', 'ups-roadie-v1', 'gls-europe-official-v1',
      'dpd-europe-official-v1', 'hermes-germany-hsi-v1', 'paack-public-v3',
      'mondial-relay-webservice-v5', 'packeta-soap-v1', 'dsv-generic-v2',
      'geodis-official-v1', 'lalamove-v3', 'aramex-anz-myfastway-v1',
      'nz-couriers-integration-v1', 'jt-open-platform-v1', 'yamato-b2-cloud-v1',
      'collivery-v3', 'ram-official-v1', 'lilwa-delivery-v2'
    )),
  ADD CONSTRAINT veygrit_ship_shipment_collivery_adapter_chk
    CHECK (carrier <> 'collivery' OR adapter IS NULL OR adapter = 'collivery-v3'),
  ADD CONSTRAINT veygrit_ship_shipment_ram_couriers_adapter_chk
    CHECK (carrier <> 'ram_couriers' OR adapter IS NULL OR adapter = 'ram-official-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_lilwa_delivery_adapter_chk
    CHECK (carrier <> 'lilwa_delivery' OR adapter IS NULL OR adapter = 'lilwa-delivery-v2');

ALTER TABLE veygrit_ship_rate_quote
  ADD CONSTRAINT veygrit_ship_rate_quote_carrier_africa_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
      'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
      'nz_couriers', 'jt_express', 'yamato', 'collivery', 'ram_couriers',
      'lilwa_delivery'
    )),
  ADD CONSTRAINT veygrit_ship_rate_quote_adapter_africa_expansion_chk
    CHECK (adapter IN (
      'ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2', 'loggi-v1',
      'royal-mail-shipping-v2', 'inpost-shipping-v2', 'ninja-van-order-v4.2',
      'delhivery-b2c-v1', 'pargo-simba-v1', 'courier-guy-v2',
      'sf-express-openapi-v2', 'four-px-openapi-v1', 'chilexpress-rest-v1',
      'coordinadora-clientes-v1', 'oca-epak-v1', '99minutos-v3',
      'redpack-official-v1', 'estafeta-label-rest-v1', 'jadlog-embarcador-v2.3',
      'total-express-official-v1', 'ups-roadie-v1', 'gls-europe-official-v1',
      'dpd-europe-official-v1', 'hermes-germany-hsi-v1', 'paack-public-v3',
      'mondial-relay-webservice-v5', 'packeta-soap-v1', 'dsv-generic-v2',
      'geodis-official-v1', 'lalamove-v3', 'aramex-anz-myfastway-v1',
      'nz-couriers-integration-v1', 'jt-open-platform-v1', 'yamato-b2-cloud-v1',
      'collivery-v3', 'ram-official-v1', 'lilwa-delivery-v2'
    ));

ALTER TABLE veygrit_ship_label
  ADD CONSTRAINT veygrit_ship_label_carrier_africa_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
      'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
      'nz_couriers', 'jt_express', 'yamato', 'collivery', 'ram_couriers',
      'lilwa_delivery'
    ));

ALTER TABLE veygrit_ship_tracking_event
  ADD CONSTRAINT veygrit_ship_tracking_carrier_africa_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
      'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
      'nz_couriers', 'jt_express', 'yamato', 'collivery', 'ram_couriers',
      'lilwa_delivery'
    ));
