import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_DUCKDB_ADAPTER_VERSION,
  ADDRESSQL_DUCKDB_ARTIFACTS,
  ADDRESSQL_DUCKDB_FUNCTIONS,
  ADDRESSQL_DUCKDB_VIEWS,
  buildAddressQlDuckDbUseCaseCoverage,
  validateAddressQlDuckDbAdapterPlan,
} from './addressQlDuckDbAdapter';

test('AddressQL DuckDB v0.3 plan validates analytics and local verification scope', () => {
  assert.equal(ADDRESSQL_DUCKDB_ADAPTER_VERSION, 'addressql-duckdb-v0.3');
  assert.deepEqual(validateAddressQlDuckDbAdapterPlan(), []);

  const coverage = buildAddressQlDuckDbUseCaseCoverage();
  assert.ok(coverage.analytics >= 4);
  assert.ok(coverage.local_validation >= 4);
  assert.ok(coverage.research >= 3);
  assert.ok(coverage.fixture_audit >= 3);
});

test('AddressQL DuckDB artifacts exist', () => {
  for (const artifact of ADDRESSQL_DUCKDB_ARTIFACTS) {
    assert.ok(existsSync(artifact.path), `${artifact.path} is missing`);
  }
});

test('AddressQL DuckDB SQL file exposes macros, fixture views, and reports', () => {
  const sql = readFileSync('extensions/addressql-duckdb/sql/addressql_duckdb_v0_3.sql', 'utf8');

  assert.match(sql, /CREATE OR REPLACE VIEW addressql_country_profiles/);
  assert.match(sql, /read_csv_auto/);
  assert.match(sql, /CREATE OR REPLACE MACRO addressql_country_resolve/);
  assert.match(sql, /CREATE OR REPLACE MACRO addressql_postal_validate/);
  assert.match(sql, /CREATE OR REPLACE MACRO addressql_postal_validate_json/);
  assert.match(sql, /to_json\(struct_pack/);
  assert.match(sql, /CREATE OR REPLACE MACRO addressql_postal_equivalent/);
  assert.match(sql, /CREATE OR REPLACE MACRO addressql_distance_km/);
  assert.match(sql, /CREATE OR REPLACE MACRO addressql_delivery_available/);
  assert.match(sql, /CREATE OR REPLACE VIEW addressql_postal_gap_report/);
  assert.match(sql, /address_format_coverage := address_format_coverage/);
  assert.match(sql, /validation_readiness := validation_readiness/);
  assert.match(sql, /native_input_available := native_input_available/);
  assert.match(sql, /required_components := required_components/);
  assert.match(sql, /FROM addressql_postal_areas pa, normalized/);
  assert.match(sql, /pa\.postal_code = normalized\.normalized_postal_code/);
  assert.match(sql, /version := 'address-validation-result-v0\.1'/);
  assert.match(sql, /purpose := CASE/);
  assert.match(sql, /status := CASE/);
  assert.match(sql, /source_refs := 'duckdb-fixture:'/);
  assert.match(sql, /field_results := CASE/);
  assert.match(sql, /result_boundaries := 'format_pass_does_not_imply_existence=true/);
  assert.match(sql, /delivery_pass_does_not_imply_identity=true/);
  assert.match(sql, /privacy := 'contains_raw_address=false\|log_safe=true\|disclosure_scope=field_status'/);
  assert.match(sql, /privacy := struct_pack\(/);
  assert.match(sql, /source_refs := \[result\.source_refs\]/);
  assert.match(sql, /non_claims := \[result\.non_claims\]/);
  assert.match(sql, /postal_validation_does_not_evaluate_identity/);
  assert.match(sql, /do not invent an official postal code/);
  assert.match(sql, /not proof of residence or carrier SLA/);

  for (const fn of ADDRESSQL_DUCKDB_FUNCTIONS) {
    assert.match(sql, new RegExp(`MACRO ${fn.duckDbName}\\b`), `${fn.duckDbName} missing`);
  }
  for (const view of ADDRESSQL_DUCKDB_VIEWS) {
    assert.match(sql, new RegExp(`VIEW ${view.name}\\b`), `${view.name} missing`);
  }
});

test('AddressQL DuckDB fixtures cover strong, weak, and no-postal-code countries', () => {
  const countries = readFileSync('extensions/addressql-duckdb/fixtures/synthetic_country_profiles.csv', 'utf8');
  const postalAreas = readFileSync('extensions/addressql-duckdb/fixtures/synthetic_postal_areas.csv', 'utf8');
  const addresses = readFileSync('extensions/addressql-duckdb/fixtures/synthetic_addresses.csv', 'utf8');

  for (const country of ['JP', 'US', 'HK', 'AE', 'GH']) {
    assert.match(countries, new RegExp(`^${country},`, 'm'), `missing ${country} country profile`);
    assert.match(addresses, new RegExp(`,${country},`), `missing ${country} synthetic address`);
  }
  assert.match(countries, /HK,Hong Kong.*none,false/);
  assert.match(countries, /AE,United Arab Emirates.*none,false/);
  assert.match(countries, /GH,Ghana.*weak,false/);
  assert.match(countries, /native_and_english_preloaded/);
  assert.match(countries, /format_only/);
  assert.match(countries, /postal_equivalent_required/);
  assert.match(countries, /metadata_gated/);
  assert.match(countries, /postcode\|state\|city/);
  assert.match(postalAreas, /100-0001/);
  assert.match(postalAreas, /GA-184-3321/);
});

test('AddressQL DuckDB docs and smoke test keep local-first non-claims visible', () => {
  const readme = readFileSync('extensions/addressql-duckdb/README.md', 'utf8');
  const smoke = readFileSync('extensions/addressql-duckdb/test/addressql_duckdb_smoke.sql', 'utf8');
  const stack = readFileSync('docs/addressql/technical-stack.md', 'utf8');
  const packageJson = readFileSync('package.json', 'utf8');
  const cliRunner = readFileSync('scripts/verify-addressql-duckdb-cli.ts', 'utf8');
  const workflow = readFileSync('.github/workflows/addressql-duckdb-cli.yml', 'utf8');

  assert.match(readme, /analysis\/local-validation scaffold/);
  assert.match(readme, /no network calls/);
  assert.match(readme, /not the primary production\s+transaction adapter/);
  assert.match(readme, /Global Country Preload v0\.7-compatible/);
  assert.match(readme, /verify:addressql-duckdb:cli/);
  assert.match(smoke, /\.read extensions\/addressql-duckdb\/sql\/addressql_duckdb_v0_3\.sql/);
  assert.match(smoke, /validation_readiness/);
  assert.match(smoke, /address_format_coverage/);
  assert.match(smoke, /rejects_hk_fake_postal_code/);
  assert.match(smoke, /duckdb_postal_validate_v0_1_shape/);
  assert.match(smoke, /duckdb_postal_validate_json_shape/);
  assert.match(smoke, /addressql_postal_validate_json/);
  assert.match(smoke, /address-validation-result-v0\.1/);
  assert.match(smoke, /delivery_pass_does_not_imply_identity=true/);
  assert.match(smoke, /error\('validates_synthetic_jp_postal'\)/);
  assert.match(smoke, /error\('rejects_hk_fake_postal_code'\)/);
  assert.match(smoke, /addressql_postal_gap_report/);
  assert.match(stack, /addressql-duckdb/);
  assert.match(stack, /DuckDB Plan/);
  assert.match(stack, /verify:addressql-duckdb:cli/);
  assert.match(packageJson, /"verify:addressql-duckdb:cli": "tsx scripts\/verify-addressql-duckdb-cli\.ts"/);
  assert.match(packageJson, /"verify:addressql-duckdb:cli:require": "tsx scripts\/verify-addressql-duckdb-cli\.ts --require-cli"/);
  assert.match(cliRunner, /ADDRESSQL_DUCKDB_CLI/);
  assert.match(cliRunner, /--require-cli/);
  assert.match(cliRunner, /addressql_duckdb_smoke\.sql/);
  assert.match(workflow, /AddressQL DuckDB CLI Smoke/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /duckdb_cli-linux-amd64\.zip/);
  assert.match(workflow, /verify:addressql-duckdb:cli -- --require-cli/);
  assert.match(workflow, /verify:addressql-duckdb/);
});
