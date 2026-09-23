-- AddressQL for DuckDB v0.3
-- Local analytics, research, and fixture validation scaffold.
-- Run from the repository root:
--   duckdb < extensions/addressql-duckdb/test/addressql_duckdb_smoke.sql

CREATE OR REPLACE VIEW addressql_country_profiles AS
SELECT *
FROM read_csv_auto(
  'extensions/addressql-duckdb/fixtures/synthetic_country_profiles.csv',
  header = true
);

CREATE OR REPLACE VIEW addressql_postal_areas AS
SELECT *
FROM read_csv_auto(
  'extensions/addressql-duckdb/fixtures/synthetic_postal_areas.csv',
  header = true
);

CREATE OR REPLACE VIEW addressql_synthetic_addresses AS
SELECT *
FROM read_csv_auto(
  'extensions/addressql-duckdb/fixtures/synthetic_addresses.csv',
  header = true
);

CREATE OR REPLACE MACRO addressql_clean_text(input_text) AS (
  regexp_replace(trim(coalesce(input_text, '')), '\s+', ' ', 'g')
);

CREATE OR REPLACE MACRO addressql_postal_normalize(postal_code, country_code) AS (
  CASE
    WHEN upper(addressql_clean_text(country_code)) = 'JP'
      AND regexp_matches(regexp_replace(upper(addressql_clean_text(postal_code)), '[^0-9]', '', 'g'), '^[0-9]{7}$')
      THEN regexp_replace(
        regexp_replace(upper(addressql_clean_text(postal_code)), '[^0-9]', '', 'g'),
        '^([0-9]{3})([0-9]{4})$',
        '\1-\2'
      )
    ELSE upper(addressql_clean_text(postal_code))
  END
);

CREATE OR REPLACE MACRO addressql_country_resolve(country_input) AS TABLE
SELECT struct_pack(
  input := country_input,
  country_code := country_code,
  country_name := country_name,
  confidence := CASE
    WHEN upper(addressql_clean_text(country_input)) = country_code THEN 1.0
    WHEN lower(addressql_clean_text(country_input)) = lower(country_name) THEN 0.98
    WHEN contains(lower(aliases), lower(addressql_clean_text(country_input))) THEN 0.86
    ELSE 0.0
  END,
  source_version := source_version,
  non_claims := 'country resolution is not sovereignty adjudication'
) AS result
FROM addressql_country_profiles
WHERE upper(addressql_clean_text(country_input)) = country_code
   OR lower(addressql_clean_text(country_input)) = lower(country_name)
   OR contains(lower(aliases), lower(addressql_clean_text(country_input)))
ORDER BY CASE
  WHEN upper(addressql_clean_text(country_input)) = country_code THEN 1.0
  WHEN lower(addressql_clean_text(country_input)) = lower(country_name) THEN 0.98
  WHEN contains(lower(aliases), lower(addressql_clean_text(country_input))) THEN 0.86
  ELSE 0.0
END DESC
LIMIT 1;

CREATE OR REPLACE MACRO addressql_country_address_profile(country_input) AS TABLE
SELECT struct_pack(
  country_code := country_code,
  country_name := country_name,
  native_name := native_name,
  languages := languages,
  address_format_coverage := address_format_coverage,
  validation_readiness := validation_readiness,
  native_input_available := native_input_available,
  english_input_available := english_input_available,
  required_components := required_components,
  postal_status := postal_status,
  postal_required_default := postal_required_default,
  postal_equivalent_strategy := postal_equivalent_strategy,
  source_version := source_version,
  non_claims := 'country profiles are schema metadata and not proof of global address completeness'
) AS result
FROM addressql_country_profiles
WHERE upper(addressql_clean_text(country_input)) = country_code
LIMIT 1;

CREATE OR REPLACE MACRO addressql_postal_status(country_input) AS TABLE
SELECT struct_pack(
  country_code := country_code,
  status := postal_status,
  validation_readiness := validation_readiness,
  required_default := postal_required_default,
  pattern := postal_pattern,
  example := postal_example,
  postal_equivalent_strategy := postal_equivalent_strategy,
  source_version := source_version,
  non_claims := CASE
    WHEN postal_status = 'none' THEN 'postal-equivalent regions are operational fallbacks, not official postal codes'
    ELSE 'postal status is source-versioned operational metadata and not proof of residence or carrier SLA'
  END
) AS result
FROM addressql_country_profiles
WHERE upper(addressql_clean_text(country_input)) = country_code
LIMIT 1;

CREATE OR REPLACE MACRO addressql_postal_validate(postal_code, country_input) AS TABLE
WITH profile AS (
  SELECT *
  FROM addressql_country_profiles
  WHERE upper(addressql_clean_text(country_input)) = country_code
  LIMIT 1
),
normalized AS (
  SELECT addressql_postal_normalize(postal_code, country_input) AS normalized_postal_code
),
area AS (
  SELECT pa.*
  FROM addressql_postal_areas pa, normalized
  WHERE pa.country_code = upper(addressql_clean_text(country_input))
    AND pa.postal_code = normalized.normalized_postal_code
  LIMIT 1
)
SELECT struct_pack(
  version := 'address-validation-result-v0.1',
  purpose := CASE
    WHEN profile.postal_status = 'none' THEN 'format'
    WHEN area.postal_code IS NOT NULL THEN 'existence'
    ELSE 'format'
  END,
  status := CASE
    WHEN profile.postal_status != 'none' AND area.postal_code IS NOT NULL THEN 'pass'
    ELSE 'fail'
  END,
  confidence := CASE
    WHEN profile.postal_status != 'none' AND area.postal_code IS NOT NULL THEN 0.95
    WHEN profile.postal_status = 'none' THEN 0.90
    ELSE 0.75
  END,
  source_refs := 'duckdb-fixture:' || coalesce(area.source_version, profile.source_version),
  country_code := profile.country_code,
  postal_code := normalized.normalized_postal_code,
  valid := CASE
    WHEN profile.postal_status = 'none' THEN false
    WHEN area.postal_code IS NOT NULL THEN true
    ELSE false
  END,
  region_ref := area.region_ref,
  region_name := area.region_name,
  source_version := coalesce(area.source_version, profile.source_version),
  field_results := CASE
    WHEN profile.postal_status = 'none' THEN 'country:pass:country_profile_found|postal_code:not_applicable:country_has_no_postal_code_system|recipient_authorization:not_applicable:postal_validation_does_not_evaluate_identity'
    WHEN area.postal_code IS NOT NULL THEN 'country:pass:country_profile_found|postal_code:pass:format_and_existence_pass|recipient_authorization:not_applicable:postal_validation_does_not_evaluate_identity'
    ELSE 'country:pass:country_profile_found|postal_code:unknown:postal_area_not_found_or_not_required|recipient_authorization:not_applicable:postal_validation_does_not_evaluate_identity'
  END,
  result_boundaries := 'format_pass_does_not_imply_existence=true|existence_pass_does_not_imply_delivery=true|delivery_pass_does_not_imply_identity=true|identity_pass_does_not_disclose_full_address=true',
  privacy := 'contains_raw_address=false|log_safe=true|disclosure_scope=field_status',
  warnings := CASE
    WHEN profile.postal_status = 'none' THEN 'country_has_no_postal_code_system|postal_equivalent_required'
    WHEN area.postal_code IS NULL THEN 'postal_area_not_found_or_not_required'
    ELSE ''
  END,
  non_claims := CASE
    WHEN profile.postal_status = 'none' THEN 'do not invent an official postal code for a no-postal-code country|Postal validation does not guarantee latency, availability, or a runtime service-level objective.'
    ELSE 'postal validity is not full address identity|Postal validation does not guarantee latency, availability, or a runtime service-level objective.'
  END
) AS result
FROM profile, normalized
LEFT JOIN area ON true;

CREATE OR REPLACE MACRO addressql_postal_validate_json(postal_code, country_input) AS TABLE
SELECT to_json(struct_pack(
  version := result.version,
  purpose := result.purpose,
  status := result.status,
  confidence := result.confidence,
  source_refs := [result.source_refs],
  field_results := result.field_results,
  result_boundaries := struct_pack(
    format_pass_does_not_imply_existence := true,
    existence_pass_does_not_imply_delivery := true,
    delivery_pass_does_not_imply_identity := true,
    identity_pass_does_not_disclose_full_address := true
  ),
  privacy := struct_pack(
    contains_raw_address := false,
    log_safe := true,
    disclosure_scope := 'field_status'
  ),
  non_claims := [result.non_claims],
  valid := result.valid,
  warnings := result.warnings
)) AS result_json
FROM addressql_postal_validate(postal_code, country_input);

CREATE OR REPLACE MACRO addressql_postal_lookup(postal_code, country_input) AS TABLE
WITH normalized AS (
  SELECT addressql_postal_normalize(postal_code, country_input) AS normalized_postal_code
)
SELECT struct_pack(
  country_code := country_code,
  postal_code := postal_code,
  region_ref := region_ref,
  region_name := region_name,
  centroid_lat := centroid_lat,
  centroid_lon := centroid_lon,
  source_version := source_version,
  non_claims := 'postal lookup returns candidate regions, not household addresses'
) AS result
FROM addressql_postal_areas, normalized
WHERE addressql_postal_areas.country_code = upper(addressql_clean_text(country_input))
  AND addressql_postal_areas.postal_code = normalized.normalized_postal_code;

CREATE OR REPLACE MACRO addressql_postal_equivalent(region_ref_input, country_input) AS TABLE
SELECT struct_pack(
  country_code := country_code,
  region_ref := region_ref_input,
  strategy := postal_equivalent_strategy,
  supported := postal_status IN ('none', 'weak', 'partial'),
  source_version := source_version,
  non_claims := 'postal-equivalent regions are operational fallbacks, not official postal codes'
) AS result
FROM addressql_country_profiles
WHERE country_code = upper(addressql_clean_text(country_input))
LIMIT 1;

CREATE OR REPLACE MACRO addressql_address_normalize(address_text, country_input) AS (
  struct_pack(
    country_code := upper(addressql_clean_text(country_input)),
    normalized_text := lower(addressql_clean_text(address_text)),
    source_version := 'synthetic-addressql-duckdb-v0.3',
    non_claims := 'normalization is not referent resolution'
  )
);

CREATE OR REPLACE MACRO addressql_address_match(address_a, address_b) AS (
  struct_pack(
    match := lower(addressql_clean_text(address_a)) = lower(addressql_clean_text(address_b)),
    confidence := CASE
      WHEN lower(addressql_clean_text(address_a)) = lower(addressql_clean_text(address_b)) THEN 0.99
      ELSE 0.20
    END,
    method := 'synthetic-normalized-text-equality',
    non_claims := 'string-equivalence is not PID issuance'
  )
);

CREATE OR REPLACE MACRO addressql_distance_km(lat_a, lon_a, lat_b, lon_b) AS (
  6371.0088 * 2 * asin(
    sqrt(
      pow(sin(radians((lat_b - lat_a) / 2)), 2)
      + cos(radians(lat_a)) * cos(radians(lat_b))
      * pow(sin(radians((lon_b - lon_a) / 2)), 2)
    )
  )
);

CREATE OR REPLACE MACRO addressql_delivery_available(country_input, postal_code) AS TABLE
WITH profile AS (
  SELECT *
  FROM addressql_country_profiles
  WHERE country_code = upper(addressql_clean_text(country_input))
  LIMIT 1
),
normalized AS (
  SELECT addressql_postal_normalize(postal_code, country_input) AS normalized_postal_code
),
area AS (
  SELECT pa.*
  FROM addressql_postal_areas pa, normalized
  WHERE pa.country_code = upper(addressql_clean_text(country_input))
    AND pa.postal_code = normalized.normalized_postal_code
  LIMIT 1
)
SELECT struct_pack(
  country_code := profile.country_code,
  postal_code := normalized.normalized_postal_code,
  available := CASE
    WHEN profile.postal_status = 'none' THEN true
    WHEN area.postal_code IS NOT NULL THEN true
    ELSE false
  END,
  decision_basis := CASE
    WHEN profile.postal_status = 'none' THEN 'postal-equivalent-region'
    WHEN area.postal_code IS NOT NULL THEN 'fixture-postal-area'
    ELSE 'insufficient-fixture-coverage'
  END,
  source_version := coalesce(area.source_version, profile.source_version),
  non_claims := 'deliverability is not proof of residence or carrier SLA'
) AS result
FROM profile, normalized
LEFT JOIN area ON true;

CREATE OR REPLACE VIEW addressql_country_postal_summary AS
SELECT
  country_code,
  country_name,
  address_format_coverage,
  validation_readiness,
  postal_status,
  postal_required_default,
  postal_equivalent_strategy,
  native_input_available,
  english_input_available,
  required_components,
  count(pa.postal_code) AS fixture_postal_area_count,
  cp.source_version
FROM addressql_country_profiles cp
LEFT JOIN addressql_postal_areas pa USING (country_code)
GROUP BY
  country_code,
  country_name,
  address_format_coverage,
  validation_readiness,
  postal_status,
  postal_required_default,
  postal_equivalent_strategy,
  native_input_available,
  english_input_available,
  required_components,
  cp.source_version;

CREATE OR REPLACE VIEW addressql_fixture_validation_report AS
SELECT
  fixture_id,
  country_code,
  postal_code,
  region_ref,
  expected_valid,
  CASE
    WHEN country_code IN (SELECT country_code FROM addressql_country_profiles) THEN true
    ELSE false
  END AS country_known,
  CASE
    WHEN postal_code = '' THEN false
    WHEN postal_code IN (
      SELECT postal_code
      FROM addressql_postal_areas pa
      WHERE pa.country_code = addressql_synthetic_addresses.country_code
    ) THEN true
    ELSE false
  END AS postal_area_known,
  source_version
FROM addressql_synthetic_addresses;

CREATE OR REPLACE VIEW addressql_postal_gap_report AS
SELECT
  country_code,
  country_name,
  address_format_coverage,
  validation_readiness,
  postal_status,
  fixture_postal_area_count,
  CASE
    WHEN postal_status = 'none' THEN 'use postal-equivalent regions'
    WHEN fixture_postal_area_count = 0 THEN 'missing postal fixture coverage'
    WHEN postal_status IN ('weak', 'partial') THEN 'needs redesign/augmentation research'
    ELSE 'fixture coverage present'
  END AS gap_status,
  source_version
FROM addressql_country_postal_summary;
