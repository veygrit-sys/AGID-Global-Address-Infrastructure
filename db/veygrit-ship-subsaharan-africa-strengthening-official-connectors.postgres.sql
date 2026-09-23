-- Strengthen Sub-Saharan Africa with direct official and carrier-contract adapters.
-- Re-runnable after the South Asia strengthening migration.

DO $$
DECLARE
  carrier_values text := $list$
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
    'nz_couriers', 'jt_express', 'yamato', 'collivery', 'ram_couriers',
    'lilwa_delivery', 'fez_delivery', 'haulstow', 'kwik_delivery', 'gigl',
    'dodo_tanzania', 'aramex_mena', 'smsa_express', 'naqel_express',
    'emirates_post', 'bosta', 'mylerz', 'blue_dart', 'dtdc', 'gdex', 'jne',
    'yodel', 'fan_courier', 'acs_courier', 'dachser', 'sameday',
    'zto_express', 'yto_express', 'sto_express', 'deppon', 'jd_logistics',
    'cainiao_express', 'dhl_parcel_de', 'colissimo', 'poste_italiane',
    'correos', 'postnl', 'bpost', 'andreani', 'servientrega', 'blue_express',
    'ghn', 'ghtk', 'grab_express', 'gosend', 'flash_express',
    'pathao_courier', 'ecourier_bd', 'leopards_courier', 'domex_lk',
    'nepal_can_move'
  $list$;
  adapter_values text := $list$
    'ups', 'mydhl-express', 'ecommerce-americas-v4', 'amazon-shipping-v2',
    'loggi-v1', 'royal-mail-shipping-v2', 'inpost-shipping-v2',
    'ninja-van-order-v4.2', 'delhivery-b2c-v1', 'pargo-simba-v1',
    'courier-guy-v2', 'sf-express-openapi-v2', 'four-px-openapi-v1',
    'chilexpress-rest-v1', 'coordinadora-clientes-v1', 'oca-epak-v1',
    '99minutos-v3', 'redpack-official-v1', 'estafeta-label-rest-v1',
    'jadlog-embarcador-v2.3', 'total-express-official-v1', 'ups-roadie-v1',
    'gls-europe-official-v1', 'dpd-europe-official-v1',
    'hermes-germany-hsi-v1', 'paack-public-v3', 'mondial-relay-webservice-v5',
    'packeta-soap-v1', 'dsv-generic-v2', 'geodis-official-v1', 'lalamove-v3',
    'aramex-anz-myfastway-v1', 'nz-couriers-integration-v1',
    'jt-open-platform-v1', 'yamato-b2-cloud-v1', 'collivery-v3',
    'ram-official-v1', 'lilwa-delivery-v2', 'fez-business-api-v1',
    'haulstow-partner-shipping-v1', 'kwik-business-contract-v1',
    'gigl-enterprise-contract-v1', 'dodo-tanzania-contract-v1',
    'aramex-mena-official-v1', 'smsa-ecommerce-soap-v1',
    'naqel-xml-shipping-v9', 'emirates-post-emx-v1', 'bosta-v2',
    'mylerz-official-v1', 'blue-dart-business-integration-v1',
    'dtdc-enterprise-v1', 'mygdex-openapi-v1', 'jne-contract-api-v1',
    'yodel-shipping-orders-v1', 'fan-courier-api-v2',
    'acs-rest-web-services-v1', 'dachser-business-integration-v2',
    'sameday-client-api-v2', 'zto-open-platform-v1', 'yto-open-platform-v1',
    'sto-open-platform-v1', 'deppon-open-platform-v1',
    'jd-logistics-open-platform-v1', 'cainiao-express-open-platform-v1',
    'dhl-parcel-de-shipping-v2', 'colissimo-sls-v3',
    'poste-delivery-business-v1', 'correos-oauth-api-v1',
    'postnl-shipment-v4', 'bpost-shipping-manager-v3',
    'andreani-globallpack-v1', 'servientrega-standard-v1',
    'blue-express-contract-v1', 'ghn-public-api-v2', 'ghtk-openapi-v1.5',
    'grabexpress-contract-v1', 'gosend-contract-v1',
    'flash-express-contract-v1', 'pathao-courier-v1',
    'ecourier-merchant-v5.4', 'leopards-merchant-contract-v1',
    'domex-client-contract-v1', 'nepal-can-move-contract-v1'
  $list$;
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
        c.conname LIKE '%_carrier_south_asia_strengthening_chk'
        OR c.conname LIKE '%_adapter_south_asia_strengthening_chk'
        OR c.conname LIKE '%_carrier_subsaharan_africa_strengthening_chk'
        OR c.conname LIKE '%_adapter_subsaharan_africa_strengthening_chk'
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', item.table_name, item.conname);
  END LOOP;

  EXECUTE format(
    'ALTER TABLE veygrit_ship_carrier_connection ADD CONSTRAINT veygrit_ship_connection_carrier_subsaharan_africa_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_shipment ADD CONSTRAINT veygrit_ship_shipment_carrier_subsaharan_africa_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_shipment ADD CONSTRAINT veygrit_ship_shipment_adapter_subsaharan_africa_strengthening_chk CHECK (adapter IN (%s))',
    adapter_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_rate_quote ADD CONSTRAINT veygrit_ship_rate_quote_carrier_subsaharan_africa_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_rate_quote ADD CONSTRAINT veygrit_ship_rate_quote_adapter_subsaharan_africa_strengthening_chk CHECK (adapter IN (%s))',
    adapter_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_label ADD CONSTRAINT veygrit_ship_label_carrier_subsaharan_africa_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_tracking_event ADD CONSTRAINT veygrit_ship_tracking_carrier_subsaharan_africa_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
END;
$$;

ALTER TABLE veygrit_ship_shipment
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_fez_delivery_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_haulstow_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_kwik_delivery_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_gigl_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_dodo_tanzania_adapter_chk,
  ADD CONSTRAINT veygrit_ship_shipment_fez_delivery_adapter_chk
    CHECK (carrier <> 'fez_delivery' OR adapter IS NULL OR adapter = 'fez-business-api-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_haulstow_adapter_chk
    CHECK (carrier <> 'haulstow' OR adapter IS NULL OR adapter = 'haulstow-partner-shipping-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_kwik_delivery_adapter_chk
    CHECK (carrier <> 'kwik_delivery' OR adapter IS NULL OR adapter = 'kwik-business-contract-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_gigl_adapter_chk
    CHECK (carrier <> 'gigl' OR adapter IS NULL OR adapter = 'gigl-enterprise-contract-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_dodo_tanzania_adapter_chk
    CHECK (carrier <> 'dodo_tanzania' OR adapter IS NULL OR adapter = 'dodo-tanzania-contract-v1');
