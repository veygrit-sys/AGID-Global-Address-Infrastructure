import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_RUST_CORE_ADAPTER_CONTRACTS,
  ADDRESSQL_RUST_CORE_FUNCTIONS,
  ADDRESSQL_RUST_CORE_MODULES,
  ADDRESSQL_RUST_CORE_VERSION,
  validateAddressQlRustCorePlan,
} from './addressQlRustCore';

test('AddressQL Rust core v0.2 plan validates PostgreSQL-independent extraction', () => {
  assert.equal(ADDRESSQL_RUST_CORE_VERSION, 'addressql-rust-core-v0.2');
  assert.deepEqual(validateAddressQlRustCorePlan(), []);
  assert.ok(ADDRESSQL_RUST_CORE_FUNCTIONS.length >= 10);
  assert.ok(ADDRESSQL_RUST_CORE_FUNCTIONS.every(fn => fn.pure));
  assert.ok(ADDRESSQL_RUST_CORE_FUNCTIONS.every(fn => fn.postgresIndependent));
});

test('AddressQL Rust core files exist and avoid PostgreSQL-specific dependencies', () => {
  for (const module of ADDRESSQL_RUST_CORE_MODULES) {
    assert.ok(existsSync(module.path), `${module.path} missing`);
  }

  const cargo = readFileSync('native/addressql-core/Cargo.toml', 'utf8');
  const lib = readFileSync('native/addressql-core/src/lib.rs', 'utf8');
  const model = readFileSync('native/addressql-core/src/model.rs', 'utf8');
  const fixtures = readFileSync('native/addressql-core/src/fixtures.rs', 'utf8');

  assert.match(cargo, /name = "addressql-core"/);
  assert.match(cargo, /version = "0\.2\.0"/);
  assert.doesNotMatch(cargo, /pgrx|postgres|postgis|tokio|reqwest/i);
  assert.match(lib, /pub fn country_resolve/);
  assert.match(lib, /pub fn country_profile/);
  assert.match(lib, /pub fn postal_validate/);
  assert.match(lib, /pub fn postal_format_validate/);
  assert.match(lib, /pub fn postal_exists/);
  assert.match(lib, /pub fn address_distance_km/);
  assert.match(lib, /pub fn delivery_available/);
  assert.match(model, /pub struct PostalValidation/);
  assert.match(model, /format_valid: bool/);
  assert.match(model, /exists: Option<bool>/);
  assert.match(model, /validation_scope: &'static str/);
  assert.match(fixtures, /synthetic-addressql-v0\.2/);
});

test('AddressQL Rust core documents adapter contracts for non-PostgreSQL use', () => {
  const targets = new Set(ADDRESSQL_RUST_CORE_ADAPTER_CONTRACTS.map(contract => contract.target));
  const readme = readFileSync('native/addressql-core/README.md', 'utf8');
  const stack = readFileSync('docs/addressql/technical-stack.md', 'utf8');

  assert.ok(targets.has('postgres_pgrx'));
  assert.ok(targets.has('sqlite_extension'));
  assert.ok(targets.has('wasm'));
  assert.ok(targets.has('typescript_sdk'));
  assert.ok(targets.has('python_sdk'));
  assert.ok(targets.has('go_sdk'));

  assert.match(readme, /PostgreSQL adapters/);
  assert.match(readme, /SQLite loadable extensions/);
  assert.match(readme, /WASM builds/);
  assert.match(readme, /No PostgreSQL dependency/);
  assert.match(stack, /addressql-core/);
});

test('AddressQL Rust core keeps non-claim semantics visible', () => {
  const lib = readFileSync('native/addressql-core/src/lib.rs', 'utf8');
  const packageJson = readFileSync('package.json', 'utf8');

  assert.match(lib, /Normalization is not referent resolution/);
  assert.match(lib, /Postal validity is not full address identity/);
  assert.match(lib, /not official postal codes/);
  assert.match(lib, /postal_existence_evidence_required/);
  assert.match(lib, /approved_delivery_source_required/);
  assert.doesNotMatch(lib, /format_and_existence/);
  assert.match(lib, /not proof of residence or identity/);
  assert.match(packageJson, /"verify:addressql-core:cargo": "cargo test --manifest-path native\/addressql-core\/Cargo\.toml"/);
});
