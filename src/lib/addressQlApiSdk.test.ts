import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_API_SDK_VERSION,
  ADDRESSQL_SDK_ARTIFACTS,
  ADDRESSQL_SDK_FUNCTIONS,
  validateAddressQlApiSdkPlan,
} from './addressQlApiSdk';

import {
  addressMatch,
  countryAddressProfile,
  countryResolve,
  countryValidationReadiness,
  deliveryAvailable,
  normalizeAddress,
  postalNormalize,
  postalStatus,
  postalValidate,
} from '../../sdk/addressql-js-ts/src/index';

test('AddressQL API/SDK v0.4 plan validates language parity', () => {
  assert.equal(ADDRESSQL_API_SDK_VERSION, 'addressql-api-sdk-v0.4');
  assert.deepEqual(validateAddressQlApiSdkPlan(), []);
  assert.equal(ADDRESSQL_SDK_ARTIFACTS.length, 3);
  assert.ok(ADDRESSQL_SDK_FUNCTIONS.length >= 10);
});

test('AddressQL SDK artifacts exist for TypeScript, Python, and Rust', () => {
  for (const artifact of ADDRESSQL_SDK_ARTIFACTS) {
    assert.ok(existsSync(artifact.path), `${artifact.path} missing`);
    assert.equal(artifact.usesHostedApi, false);
  }

  for (const path of [
    'sdk/addressql-js-ts/src/index.ts',
    'sdk/addressql-py/addressql/__init__.py',
    'sdk/addressql-rs/src/lib.rs',
    'sdk/addressql-rs/Cargo.toml',
    'docs/addressql/api-sdk-v0.4.md',
  ]) {
    assert.ok(existsSync(path), `${path} missing`);
  }
});

test('AddressQL TypeScript SDK executes the v0.4 parity surface locally', () => {
  assert.equal(countryResolve('Nihon').countryCode, 'JP');
  assert.equal(postalStatus('HK'), 'none');
  assert.equal(countryValidationReadiness('HK'), 'postal_equivalent_required');
  assert.equal(countryAddressProfile('JP')?.addressFormatCoverage, 'native_and_english_preloaded');
  assert.equal(postalNormalize('1000001', 'JP'), '100-0001');

  const postal = postalValidate('1000001', 'JP');
  const noPostal = postalValidate('00000', 'HK');
  const delivery = deliveryAvailable('HK', '', 'synthetic_carrier');
  const a = normalizeAddress('Synthetic US Fixture Street', 'US');
  const b = normalizeAddress(' Synthetic   US Fixture   Street ', 'US');
  const decision = addressMatch(a, b, 'delivery');

  assert.equal(postal.valid, true);
  assert.match(postal.nonClaims.join(' '), /not full address identity/);
  assert.equal(noPostal.valid, false);
  assert.ok(noPostal.warnings.includes('postal_equivalent_required'));
  assert.match(noPostal.nonClaims.join(' '), /Do not invent an official postal code/);
  assert.equal(delivery.available, false);
  assert.ok(delivery.reasons.includes('approved_delivery_source_required'));
  assert.match(delivery.nonClaims.join(' '), /not proof of residence/);
  assert.equal(decision.match, true);
});

test('AddressQL Python and Rust SDK files preserve non-claims and local-first boundaries', () => {
  const python = readFileSync('sdk/addressql-py/addressql/__init__.py', 'utf8');
  const rust = readFileSync('sdk/addressql-rs/src/lib.rs', 'utf8');
  const rustCargo = readFileSync('sdk/addressql-rs/Cargo.toml', 'utf8');
  const doc = readFileSync('docs/addressql/api-sdk-v0.4.md', 'utf8');

  assert.match(python, /not full address identity/);
  assert.match(python, /not proof of residence or identity/);
  assert.match(rust, /pub use addressql_core/);
  assert.match(rust, /not a carrier SLA/);
  assert.match(rustCargo, /addressql-core = \{ path = "\.\.\/\.\.\/native\/addressql-core" \}/);
  assert.match(doc, /TypeScript SDK/);
  assert.match(doc, /Python SDK/);
  assert.match(doc, /Rust SDK/);
  assert.match(doc, /Installing Cargo alone is not enough/);
});
