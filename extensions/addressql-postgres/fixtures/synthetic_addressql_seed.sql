\set ON_ERROR_STOP on

INSERT INTO addressql.country_profiles (
  country_code,
  country_name,
  native_name,
  aliases,
  languages,
  address_format_coverage,
  validation_readiness,
  postal_status,
  postal_required_default,
  postal_pattern,
  postal_example,
  postal_equivalent_strategy,
  native_input_available,
  english_input_available,
  required_components,
  source_version
) VALUES
  ('JP', 'Japan', '日本', ARRAY['Nippon', 'Nihon', '日本国'], ARRAY['ja', 'en'], 'native_and_english_preloaded', 'format_only', 'official', true, '^[0-9]{3}-?[0-9]{4}$', '100-0001', 'official_postal_code', true, true, ARRAY['postcode', 'state', 'city'], 'synthetic-addressql-v0.1'),
  ('US', 'United States', 'United States', ARRAY['USA', 'United States of America'], ARRAY['en', 'es'], 'native_and_english_preloaded', 'format_only', 'official', true, '^[0-9]{5}(-[0-9]{4})?$', '94105', 'official_postal_code', true, true, ARRAY['postcode', 'state', 'city'], 'synthetic-addressql-v0.1'),
  ('HK', 'Hong Kong', '香港', ARRAY['Hong Kong SAR', '香港特別行政区'], ARRAY['zh-Hant', 'en'], 'native_and_english_preloaded', 'postal_equivalent_required', 'none', false, NULL, NULL, 'agid_region_postal_equivalent', true, true, ARRAY['district', 'street', 'building'], 'synthetic-addressql-v0.1'),
  ('AE', 'United Arab Emirates', 'الإمارات العربية المتحدة', ARRAY['UAE'], ARRAY['ar', 'en'], 'native_and_english_preloaded', 'postal_equivalent_required', 'none', false, NULL, NULL, 'agid_region_postal_equivalent', true, true, ARRAY['emirate', 'area', 'street'], 'synthetic-addressql-v0.1'),
  ('GH', 'Ghana', 'Ghana', ARRAY[]::text[], ARRAY['en'], 'native_and_english_preloaded', 'metadata_gated', 'weak', false, NULL, NULL, 'digital_address_or_agid_region', true, true, ARRAY['region', 'locality'], 'synthetic-addressql-v0.1')
ON CONFLICT (country_code) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  native_name = EXCLUDED.native_name,
  aliases = EXCLUDED.aliases,
  languages = EXCLUDED.languages,
  address_format_coverage = EXCLUDED.address_format_coverage,
  validation_readiness = EXCLUDED.validation_readiness,
  postal_status = EXCLUDED.postal_status,
  postal_required_default = EXCLUDED.postal_required_default,
  postal_pattern = EXCLUDED.postal_pattern,
  postal_example = EXCLUDED.postal_example,
  postal_equivalent_strategy = EXCLUDED.postal_equivalent_strategy,
  native_input_available = EXCLUDED.native_input_available,
  english_input_available = EXCLUDED.english_input_available,
  required_components = EXCLUDED.required_components,
  source_version = EXCLUDED.source_version;

INSERT INTO addressql.postal_areas (
  country_code,
  postal_code,
  region_ref,
  region_name,
  boundary_wkt,
  centroid_lat,
  centroid_lon,
  source_version
) VALUES
  ('JP', '100-0001', 'agid-jp-tokyo-chiyoda-chiyoda', 'Chiyoda, Tokyo synthetic postal area', 'POLYGON((139.74 35.67,139.78 35.67,139.78 35.70,139.74 35.70,139.74 35.67))', 35.6852, 139.7528, 'synthetic-addressql-v0.1'),
  ('US', '94105', 'agid-us-ca-san-francisco-soma', 'San Francisco SoMa synthetic postal area', 'POLYGON((-122.41 37.78,-122.38 37.78,-122.38 37.80,-122.41 37.80,-122.41 37.78))', 37.7890, -122.3940, 'synthetic-addressql-v0.1')
ON CONFLICT (country_code, postal_code, source_version) DO UPDATE SET
  region_ref = EXCLUDED.region_ref,
  region_name = EXCLUDED.region_name,
  boundary_wkt = EXCLUDED.boundary_wkt,
  centroid_lat = EXCLUDED.centroid_lat,
  centroid_lon = EXCLUDED.centroid_lon;

INSERT INTO addressql.delivery_regions (
  region_ref,
  country_code,
  carrier,
  service_level,
  boundary_wkt,
  source_version
) VALUES
  ('agid-hk-central-postal-equivalent', 'HK', 'synthetic_carrier', 'standard', 'POLYGON((114.14 22.27,114.17 22.27,114.17 22.30,114.14 22.30,114.14 22.27))', 'synthetic-addressql-v0.1'),
  ('agid-ae-dubai-postal-equivalent', 'AE', 'synthetic_carrier', 'standard', 'POLYGON((55.25 25.18,55.31 25.18,55.31 25.23,55.25 25.23,55.25 25.18))', 'synthetic-addressql-v0.1')
ON CONFLICT (region_ref) DO UPDATE SET
  country_code = EXCLUDED.country_code,
  carrier = EXCLUDED.carrier,
  service_level = EXCLUDED.service_level,
  boundary_wkt = EXCLUDED.boundary_wkt,
  source_version = EXCLUDED.source_version;

INSERT INTO addressql.synthetic_addresses (
  fixture_id,
  country_code,
  input_text,
  normalized,
  postal_code,
  region_ref,
  point_wkt,
  expected_valid,
  source_version
) VALUES
  ('jp-synthetic-1', 'JP', 'Synthetic JP fixture address', '{"country":"JP","line1":"Synthetic JP fixture address","lat":35.6852,"lon":139.7528,"point_wkt":"POINT(139.7528 35.6852)"}'::jsonb, '100-0001', 'agid-jp-tokyo-chiyoda-chiyoda', 'POINT(139.7528 35.6852)', true, 'synthetic-addressql-v0.1'),
  ('us-synthetic-1', 'US', 'Synthetic US fixture address', '{"country":"US","line1":"Synthetic US fixture address","lat":37.7936,"lon":-122.3958,"point_wkt":"POINT(-122.3958 37.7936)"}'::jsonb, '94105', 'agid-us-ca-san-francisco-soma', 'POINT(-122.3958 37.7936)', true, 'synthetic-addressql-v0.1'),
  ('hk-synthetic-1', 'HK', 'Synthetic HK district reference', '{"country":"HK","line1":"Synthetic HK district reference","lat":22.2819,"lon":114.1589,"point_wkt":"POINT(114.1589 22.2819)"}'::jsonb, NULL, 'agid-hk-central-postal-equivalent', 'POINT(114.1589 22.2819)', true, 'synthetic-addressql-v0.1')
ON CONFLICT (fixture_id) DO UPDATE SET
  country_code = EXCLUDED.country_code,
  input_text = EXCLUDED.input_text,
  normalized = EXCLUDED.normalized,
  postal_code = EXCLUDED.postal_code,
  region_ref = EXCLUDED.region_ref,
  point_wkt = EXCLUDED.point_wkt,
  expected_valid = EXCLUDED.expected_valid,
  source_version = EXCLUDED.source_version;
