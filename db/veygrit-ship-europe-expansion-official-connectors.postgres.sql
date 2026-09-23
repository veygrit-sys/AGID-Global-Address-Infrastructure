-- Add eight direct European carrier adapters and preserve the expanded InPost adapter.
-- Re-runnable after the Americas expansion carrier migration.

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
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_gls_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_dpd_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_hermes_de_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_paack_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_mondial_relay_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_packeta_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_dsv_adapter_chk,
  DROP CONSTRAINT IF EXISTS veygrit_ship_shipment_geodis_adapter_chk;

ALTER TABLE veygrit_ship_carrier_connection
  ADD CONSTRAINT veygrit_ship_connection_carrier_europe_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis'
  ));

ALTER TABLE veygrit_ship_shipment
  ADD CONSTRAINT veygrit_ship_shipment_carrier_europe_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
      'mondial_relay', 'packeta', 'dsv', 'geodis'
    )),
  ADD CONSTRAINT veygrit_ship_shipment_adapter_europe_expansion_chk
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
      'geodis-official-v1'
    )),
  ADD CONSTRAINT veygrit_ship_shipment_gls_adapter_chk
    CHECK (carrier <> 'gls' OR adapter IS NULL OR adapter = 'gls-europe-official-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_dpd_adapter_chk
    CHECK (carrier <> 'dpd' OR adapter IS NULL OR adapter = 'dpd-europe-official-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_hermes_de_adapter_chk
    CHECK (carrier <> 'hermes_de' OR adapter IS NULL OR adapter = 'hermes-germany-hsi-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_paack_adapter_chk
    CHECK (carrier <> 'paack' OR adapter IS NULL OR adapter = 'paack-public-v3'),
  ADD CONSTRAINT veygrit_ship_shipment_mondial_relay_adapter_chk
    CHECK (carrier <> 'mondial_relay' OR adapter IS NULL OR adapter = 'mondial-relay-webservice-v5'),
  ADD CONSTRAINT veygrit_ship_shipment_packeta_adapter_chk
    CHECK (carrier <> 'packeta' OR adapter IS NULL OR adapter = 'packeta-soap-v1'),
  ADD CONSTRAINT veygrit_ship_shipment_dsv_adapter_chk
    CHECK (carrier <> 'dsv' OR adapter IS NULL OR adapter = 'dsv-generic-v2'),
  ADD CONSTRAINT veygrit_ship_shipment_geodis_adapter_chk
    CHECK (carrier <> 'geodis' OR adapter IS NULL OR adapter = 'geodis-official-v1');

ALTER TABLE veygrit_ship_rate_quote
  ADD CONSTRAINT veygrit_ship_rate_quote_carrier_europe_expansion_chk
    CHECK (carrier IN (
      'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
      'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
      'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
      'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
      'mondial_relay', 'packeta', 'dsv', 'geodis'
    )),
  ADD CONSTRAINT veygrit_ship_rate_quote_adapter_europe_expansion_chk
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
      'geodis-official-v1'
    ));

ALTER TABLE veygrit_ship_label
  ADD CONSTRAINT veygrit_ship_label_carrier_europe_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis'
  ));

ALTER TABLE veygrit_ship_tracking_event
  ADD CONSTRAINT veygrit_ship_tracking_event_carrier_europe_expansion_chk
  CHECK (carrier IN (
    'ups', 'dhl', 'amazon_shipping', 'loggi', 'royal_mail', 'inpost', 'ninja_van',
    'delhivery', 'pargo', 'courier_guy', 'sf_express', 'four_px', 'chilexpress',
    'coordinadora', 'oca', 'ninety_nine_minutos', 'redpack', 'estafeta', 'jadlog',
    'total_express', 'roadie', 'gls', 'dpd', 'hermes_de', 'paack',
    'mondial_relay', 'packeta', 'dsv', 'geodis'
  ));
