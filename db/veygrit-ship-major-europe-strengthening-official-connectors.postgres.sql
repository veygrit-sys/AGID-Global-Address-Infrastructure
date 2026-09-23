-- Strengthen six major European markets with direct official carrier adapters.
-- Re-runnable after the private Greater China expansion migration.

DO $$
DECLARE
  carrier_values text := $list$
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis', 'lalamove', 'aramex_anz',
    'nz_couriers', 'jt_express', 'yamato', 'collivery', 'ram_couriers',
    'lilwa_delivery', 'aramex_mena', 'smsa_express', 'naqel_express',
    'emirates_post', 'bosta', 'mylerz', 'blue_dart', 'dtdc', 'gdex', 'jne',
    'yodel', 'fan_courier', 'acs_courier', 'dachser', 'sameday',
    'zto_express', 'yto_express', 'sto_express', 'deppon', 'jd_logistics',
    'cainiao_express', 'dhl_parcel_de', 'colissimo', 'poste_italiane',
    'correos', 'postnl', 'bpost'
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
    'ram-official-v1', 'lilwa-delivery-v2', 'aramex-mena-official-v1',
    'smsa-ecommerce-soap-v1', 'naqel-xml-shipping-v9',
    'emirates-post-emx-v1', 'bosta-v2', 'mylerz-official-v1',
    'blue-dart-business-integration-v1', 'dtdc-enterprise-v1',
    'mygdex-openapi-v1', 'jne-contract-api-v1', 'yodel-shipping-orders-v1',
    'fan-courier-api-v2', 'acs-rest-web-services-v1',
    'dachser-business-integration-v2', 'sameday-client-api-v2',
    'zto-open-platform-v1', 'yto-open-platform-v1', 'sto-open-platform-v1',
    'deppon-open-platform-v1', 'jd-logistics-open-platform-v1',
    'cainiao-express-open-platform-v1', 'dhl-parcel-de-shipping-v2',
    'colissimo-sls-v3', 'poste-delivery-business-v1',
    'correos-oauth-api-v1', 'postnl-shipment-v4', 'bpost-shipping-manager-v3'
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
        c.conname LIKE '%_carrier_private_greater_china_expansion_chk'
        OR c.conname LIKE '%_adapter_private_greater_china_expansion_chk'
        OR c.conname LIKE '%_carrier_major_europe_strengthening_chk'
        OR c.conname LIKE '%_adapter_major_europe_strengthening_chk'
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', item.table_name, item.conname);
  END LOOP;

  EXECUTE format(
    'ALTER TABLE veygrit_ship_carrier_connection ADD CONSTRAINT veygrit_ship_connection_carrier_major_europe_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_shipment ADD CONSTRAINT veygrit_ship_shipment_carrier_major_europe_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_shipment ADD CONSTRAINT veygrit_ship_shipment_adapter_major_europe_strengthening_chk CHECK (adapter IN (%s))',
    adapter_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_rate_quote ADD CONSTRAINT veygrit_ship_rate_quote_carrier_major_europe_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_rate_quote ADD CONSTRAINT veygrit_ship_rate_quote_adapter_major_europe_strengthening_chk CHECK (adapter IN (%s))',
    adapter_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_label ADD CONSTRAINT veygrit_ship_label_carrier_major_europe_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
  EXECUTE format(
    'ALTER TABLE veygrit_ship_tracking_event ADD CONSTRAINT veygrit_ship_tracking_carrier_major_europe_strengthening_chk CHECK (carrier IN (%s))',
    carrier_values
  );
END;
$$;

ALTER TABLE veygrit_ship_shipment
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_dhl_parcel_de_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_colissimo_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_poste_italiane_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_correos_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_postnl_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_bpost_adapter_chk,
  ADD CONSTRAINT veygrit_ship_shipment_dhl_parcel_de_adapter_chk
    CHECK (
      carrier <> 'dhl_parcel_de'
      OR adapter IS NULL
      OR adapter = 'dhl-parcel-de-shipping-v2'
    ),
  ADD CONSTRAINT veygrit_ship_shipment_colissimo_adapter_chk
    CHECK (carrier <> 'colissimo' OR adapter IS NULL OR adapter = 'colissimo-sls-v3'),
  ADD CONSTRAINT veygrit_ship_shipment_poste_italiane_adapter_chk
    CHECK (
      carrier <> 'poste_italiane'
      OR adapter IS NULL
      OR adapter = 'poste-delivery-business-v1'
    ),
  ADD CONSTRAINT veygrit_ship_shipment_correos_adapter_chk
    CHECK (carrier <> 'correos' OR adapter IS NULL OR adapter = 'correos-oauth-api-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_postnl_adapter_chk
    CHECK (carrier <> 'postnl' OR adapter IS NULL OR adapter = 'postnl-shipment-v4'),
  ADD CONSTRAINT veygrit_ship_shipment_bpost_adapter_chk
    CHECK (carrier <> 'bpost' OR adapter IS NULL OR adapter = 'bpost-shipping-manager-v3');
