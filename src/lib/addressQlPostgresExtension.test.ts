import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_POSTGRES_EXTENSION_ARTIFACTS,
  ADDRESSQL_POSTGRES_EXTENSION_VERSION,
  ADDRESSQL_POSTGRES_FUNCTIONS,
  buildAddressQlPostgresCoverageByGroup,
  validateAddressQlPostgresExtensionPlan,
} from './addressQlPostgresExtension';

test('AddressQL PostgreSQL extension plan validates v0.1 coverage', () => {
  assert.equal(ADDRESSQL_POSTGRES_EXTENSION_VERSION, 'addressql-postgres-v0.1');
  assert.deepEqual(validateAddressQlPostgresExtensionPlan(), []);

  const coverage = buildAddressQlPostgresCoverageByGroup();
  assert.equal(coverage.structure, 3);
  assert.equal(coverage.country, 3);
  assert.equal(coverage.postal, 9);
  assert.equal(coverage.spatial_postgis, 2);
  assert.equal(coverage.delivery, 1);
});

test('AddressQL PostgreSQL extension artifacts exist', () => {
  for (const artifact of ADDRESSQL_POSTGRES_EXTENSION_ARTIFACTS) {
    assert.ok(existsSync(artifact.path), `${artifact.path} is missing`);
  }
});

test('AddressQL PostgreSQL SQL file exposes JSONB functions and optional PostGIS boundary', () => {
  const sql = readFileSync('extensions/addressql-postgres/sql/addressql--0.1.0.sql', 'utf8');
  const control = readFileSync('extensions/addressql-postgres/addressql.control', 'utf8');

  assert.match(control, /default_version = '0\.1\.0'/);
  assert.match(sql, /CREATE SCHEMA IF NOT EXISTS addressql/);
  assert.match(sql, /RETURNS jsonb/);
  assert.match(sql, /addressql\.postgis_available/);
  assert.match(sql, /address_format_coverage text NOT NULL DEFAULT 'seed_profile_required'/);
  assert.match(sql, /validation_readiness text NOT NULL DEFAULT 'manual_review_required'/);
  assert.match(sql, /native_input_available boolean NOT NULL DEFAULT false/);
  assert.match(sql, /required_components text\[\] NOT NULL DEFAULT ARRAY\[\]::text\[\]/);
  assert.match(sql, /'postal_equivalent_required'/);
  assert.match(sql, /Do not invent an official postal code/);
  assert.match(sql, /FUNCTION addressql\.postal_format_validate/);
  assert.match(sql, /FUNCTION addressql\.postal_exists/);
  assert.match(sql, /'format_and_existence'/);
  assert.match(sql, /'version', 'address-validation-result-v0\.1'/);
  assert.match(sql, /'result_boundaries', jsonb_build_object/);
  assert.match(sql, /'format_pass_does_not_imply_existence', true/);
  assert.match(sql, /'delivery_pass_does_not_imply_identity', true/);
  assert.match(sql, /'privacy', jsonb_build_object/);
  assert.match(sql, /'contains_raw_address', false/);
  assert.match(sql, /postal_validation_does_not_evaluate_identity/);
  assert.match(sql, /'postal_code_not_found_in_fixture'/);
  assert.match(sql, /postgis_not_available/);
  assert.match(sql, /EXECUTE 'SELECT ST_Contains/);
  assert.match(sql, /EXECUTE 'SELECT ST_DistanceSphere/);

  for (const fn of ADDRESSQL_POSTGRES_FUNCTIONS.filter(item => item.returns === 'jsonb')) {
    const sqlFunctionName = fn.sqlName.replace('addressql.', '');
    assert.match(sql, new RegExp(`FUNCTION addressql\\.${sqlFunctionName}\\(`), `${fn.sqlName} missing from SQL`);
  }
});

test('AddressQL PostgreSQL fixtures and smoke tests cover countries, postal fallback, and spatial shape', () => {
  const fixture = readFileSync('extensions/addressql-postgres/fixtures/synthetic_addressql_seed.sql', 'utf8');
  const smoke = readFileSync('extensions/addressql-postgres/test/addressql_smoke.sql', 'utf8');
  const readme = readFileSync('extensions/addressql-postgres/README.md', 'utf8');

  assert.match(fixture, /'JP'/);
  assert.match(fixture, /'US'/);
  assert.match(fixture, /'HK'/);
  assert.match(fixture, /'AE'/);
  assert.match(fixture, /native_and_english_preloaded/);
  assert.match(fixture, /format_only/);
  assert.match(fixture, /postal_equivalent_required/);
  assert.match(fixture, /metadata_gated/);
  assert.match(fixture, /postal_equivalent/);
  assert.match(fixture, /POLYGON/);
  assert.match(fixture, /POINT/);

  assert.match(smoke, /CREATE EXTENSION IF NOT EXISTS addressql/);
  assert.match(smoke, /addressql\.postal_validate/);
  assert.match(smoke, /addressql\.postal_format_validate/);
  assert.match(smoke, /addressql\.postal_exists/);
  assert.match(smoke, /addressql\.postal_equivalent/);
  assert.match(smoke, /format\/existence split/);
  assert.match(smoke, /AddressValidationResult v0\.1 shape/);
  assert.match(smoke, /format_pass_does_not_imply_existence/);
  assert.match(smoke, /delivery_pass_does_not_imply_identity/);
  assert.match(smoke, /validation_readiness/);
  assert.match(smoke, /address_format_coverage/);
  assert.match(smoke, /postal_validate no-postal fallback/);
  assert.match(smoke, /addressql\.address_within/);
  assert.match(smoke, /addressql\.address_distance/);

  assert.match(readme, /JSONB/);
  assert.match(readme, /PostGIS is optional/);
  assert.match(readme, /Global Country Preload v0\.7/);
  assert.match(readme, /synthetic fixtures only/);
});
