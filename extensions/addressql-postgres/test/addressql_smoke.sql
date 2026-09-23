\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS addressql;
\i extensions/addressql-postgres/fixtures/synthetic_addressql_seed.sql

DO $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := addressql.country_resolve('Japan');
  IF v_result->>'country_code' <> 'JP' THEN
    RAISE EXCEPTION 'country_resolve failed: %', v_result;
  END IF;

  v_result := addressql.country_address_profile('HK');
  IF v_result->>'postal_status' <> 'none' THEN
    RAISE EXCEPTION 'country_address_profile failed: %', v_result;
  END IF;
  IF v_result->>'validation_readiness' <> 'postal_equivalent_required' THEN
    RAISE EXCEPTION 'country_address_profile preload readiness failed: %', v_result;
  END IF;

  v_result := addressql.country_address_profile('JP');
  IF v_result->>'address_format_coverage' <> 'native_and_english_preloaded' OR v_result->>'validation_readiness' <> 'format_only' THEN
    RAISE EXCEPTION 'country_address_profile official preload failed: %', v_result;
  END IF;

  v_result := addressql.postal_normalize('1000001', 'JP');
  IF v_result->>'normalized' <> '100-0001' THEN
    RAISE EXCEPTION 'postal_normalize failed: %', v_result;
  END IF;

  v_result := addressql.postal_validate('{"country":"JP"}'::jsonb, '100-0001', 'JP');
  IF (v_result->>'valid')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'postal_validate failed: %', v_result;
  END IF;
  IF (v_result->>'format_valid')::boolean IS NOT TRUE OR (v_result->>'exists')::boolean IS NOT TRUE OR v_result->>'validation_scope' <> 'format_and_existence' THEN
    RAISE EXCEPTION 'postal_validate format/existence split failed: %', v_result;
  END IF;
  IF v_result->>'version' <> 'address-validation-result-v0.1'
     OR v_result->>'purpose' <> 'existence'
     OR v_result->>'status' <> 'pass'
     OR NOT (v_result ? 'source_refs')
     OR NOT (v_result ? 'field_results')
     OR NOT ((v_result->'result_boundaries'->>'format_pass_does_not_imply_existence')::boolean)
     OR NOT ((v_result->'result_boundaries'->>'delivery_pass_does_not_imply_identity')::boolean)
     OR (v_result->'privacy'->>'contains_raw_address')::boolean IS NOT FALSE
     OR NOT (v_result ? 'non_claims') THEN
    RAISE EXCEPTION 'postal_validate AddressValidationResult v0.1 shape failed: %', v_result;
  END IF;

  v_result := addressql.postal_format_validate('9999999', 'JP');
  IF (v_result->>'format_valid')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'postal_format_validate failed: %', v_result;
  END IF;

  v_result := addressql.postal_exists('9999999', 'JP');
  IF (v_result->>'exists')::boolean IS NOT FALSE OR NOT (v_result->'warnings' ? 'postal_code_not_found_in_fixture') THEN
    RAISE EXCEPTION 'postal_exists missing-code failed: %', v_result;
  END IF;

  v_result := addressql.postal_validate('{"country":"JP"}'::jsonb, '9999999', 'JP');
  IF (v_result->>'valid')::boolean IS NOT FALSE OR (v_result->>'format_valid')::boolean IS NOT TRUE OR (v_result->>'exists')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'postal_validate must split format-valid existence-missing code: %', v_result;
  END IF;
  IF v_result->>'status' <> 'fail' OR v_result->>'purpose' <> 'existence' OR NOT (v_result->'warnings' ? 'postal_code_not_found_in_fixture') THEN
    RAISE EXCEPTION 'postal_validate missing-code v0.1 status failed: %', v_result;
  END IF;

  v_result := addressql.postal_validate('{"country":"HK"}'::jsonb, '00000', 'HK');
  IF (v_result->>'valid')::boolean IS NOT FALSE OR NOT (v_result->'warnings' ? 'postal_equivalent_required') THEN
    RAISE EXCEPTION 'postal_validate no-postal fallback failed: %', v_result;
  END IF;

  v_result := addressql.postal_validate('{"country":"HK"}'::jsonb, NULL, 'HK');
  IF (v_result->>'valid')::boolean IS NOT TRUE OR v_result->>'validation_scope' <> 'postal_equivalent_required' THEN
    RAISE EXCEPTION 'postal_validate no-postal empty field should be valid with equivalent scope: %', v_result;
  END IF;

  v_result := addressql.postal_equivalent('{"region_ref":"agid-hk-central-postal-equivalent"}'::jsonb, 'HK');
  IF v_result->>'region_ref' <> 'agid-hk-central-postal-equivalent' THEN
    RAISE EXCEPTION 'postal_equivalent failed: %', v_result;
  END IF;

  v_result := addressql.address_normalize('  Synthetic   US  Fixture  Street  ', 'US');
  IF v_result->>'normalized_text' <> 'Synthetic US Fixture Street' THEN
    RAISE EXCEPTION 'address_normalize failed: %', v_result;
  END IF;

  v_result := addressql.address_match(
    '{"country":"US","normalized_text":"Synthetic US Fixture Street"}'::jsonb,
    '{"country":"US","normalized_text":"Synthetic US Fixture Street"}'::jsonb
  );
  IF (v_result->>'match')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'address_match failed: %', v_result;
  END IF;

  v_result := addressql.delivery_available('{"country":"HK","line1":"Central Hong Kong"}'::jsonb);
  IF (v_result->>'available')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'delivery_available no-postal fallback failed: %', v_result;
  END IF;

  v_result := addressql.address_distance(
    '{"lat":35.6852,"lon":139.7528}'::jsonb,
    '{"lat":37.7936,"lon":-122.3958}'::jsonb
  );
  IF v_result->>'distance' IS NULL THEN
    RAISE EXCEPTION 'address_distance failed: %', v_result;
  END IF;

  v_result := addressql.address_within(
    '{"point_wkt":"POINT(139.7528 35.6852)"}'::jsonb,
    'agid-jp-tokyo-chiyoda-chiyoda'
  );
  IF NOT (v_result ? 'within') THEN
    RAISE EXCEPTION 'address_within shape failed: %', v_result;
  END IF;
END $$;
