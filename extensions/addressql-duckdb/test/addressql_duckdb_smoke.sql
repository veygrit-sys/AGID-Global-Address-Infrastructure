-- AddressQL DuckDB v0.3 smoke test.
-- Run from the repository root:
--   duckdb < extensions/addressql-duckdb/test/addressql_duckdb_smoke.sql

.read extensions/addressql-duckdb/sql/addressql_duckdb_v0_3.sql

SELECT CASE WHEN count(*) >= 5 THEN true ELSE error('has_country_profiles') END AS has_country_profiles
FROM addressql_country_profiles;

SELECT CASE WHEN result.country_code = 'JP' THEN true ELSE error('resolves_japan') END AS resolves_japan
FROM addressql_country_resolve('Japan');

SELECT CASE WHEN result.status = 'none' THEN true ELSE error('hong_kong_no_postal_code') END AS hong_kong_no_postal_code
FROM addressql_postal_status('HK');

SELECT CASE
  WHEN result.validation_readiness = 'postal_equivalent_required' THEN true
  ELSE error('hong_kong_preload_requires_postal_equivalent')
END AS hong_kong_preload_requires_postal_equivalent
FROM addressql_postal_status('HK');

SELECT CASE
  WHEN result.address_format_coverage = 'native_and_english_preloaded'
    AND result.validation_readiness = 'format_only' THEN true
  ELSE error('japan_preload_profile_ready')
END AS japan_preload_profile_ready
FROM addressql_country_address_profile('JP');

SELECT CASE WHEN result.valid = true THEN true ELSE error('validates_synthetic_jp_postal') END AS validates_synthetic_jp_postal
FROM addressql_postal_validate('1000001', 'JP');

SELECT CASE
  WHEN result.version = 'address-validation-result-v0.1'
    AND result.purpose = 'existence'
    AND result.status = 'pass'
    AND contains(result.result_boundaries, 'format_pass_does_not_imply_existence=true')
    AND contains(result.result_boundaries, 'delivery_pass_does_not_imply_identity=true')
    AND contains(result.privacy, 'contains_raw_address=false')
    AND contains(result.field_results, 'postal_validation_does_not_evaluate_identity') THEN true
  ELSE error('duckdb_postal_validate_v0_1_shape')
END AS duckdb_postal_validate_v0_1_shape
FROM addressql_postal_validate('1000001', 'JP');

SELECT CASE
  WHEN contains(CAST(result_json AS VARCHAR), 'address-validation-result-v0.1')
    AND contains(CAST(result_json AS VARCHAR), 'format_pass_does_not_imply_existence')
    AND contains(CAST(result_json AS VARCHAR), 'delivery_pass_does_not_imply_identity')
    AND contains(CAST(result_json AS VARCHAR), 'contains_raw_address')
    AND contains(CAST(result_json AS VARCHAR), 'postal validity is not full address identity') THEN true
  ELSE error('duckdb_postal_validate_json_shape')
END AS duckdb_postal_validate_json_shape
FROM addressql_postal_validate_json('1000001', 'JP');

SELECT CASE
  WHEN result.valid = false
    AND contains(result.warnings, 'postal_equivalent_required') THEN true
  ELSE error('rejects_hk_fake_postal_code')
END AS rejects_hk_fake_postal_code
FROM addressql_postal_validate('00000', 'HK');

SELECT CASE WHEN result.supported = true THEN true ELSE error('supports_hk_postal_equivalent') END AS supports_hk_postal_equivalent
FROM addressql_postal_equivalent('agid-hk-central', 'HK');

SELECT CASE
  WHEN addressql_distance_km(35.6812, 139.7671, 35.6896, 139.6921) > 0 THEN true
  ELSE error('distance_nonzero')
END AS distance_nonzero;

SELECT *
FROM addressql_postal_gap_report
ORDER BY country_code;
