import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_COUNTRY_POSTAL_VERSION,
  ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS,
  ADDRESSQL_POSTAL_STATUS_POLICIES,
  getAddressQlCountryFunctions,
  getAddressQlPostalFunctions,
  validateAddressQlCountryPostalModel,
} from './addressQlCountryPostal';

test('AddressQL country/postal model validates function groups and workflows', () => {
  assert.equal(ADDRESSQL_COUNTRY_POSTAL_VERSION, 'addressql-country-postal-v0.1');
  assert.deepEqual(validateAddressQlCountryPostalModel(), []);
  assert.equal(getAddressQlCountryFunctions().length, 6);
  assert.equal(getAddressQlPostalFunctions().length, 10);
});

test('AddressQL country/postal workflows support country forms and no-postal fallback', () => {
  const countrySelector = ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS.find(workflow => workflow.id === 'country_selector');
  const nativeEnglish = ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS.find(workflow => workflow.id === 'country_native_english_form');
  const noPostal = ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS.find(workflow => workflow.id === 'no_postal_code_fallback');

  assert.ok(countrySelector?.orderedFunctions.includes('COUNTRY_RESOLVE'));
  assert.ok(countrySelector?.orderedFunctions.includes('COUNTRY_SOURCE_POLICY'));
  assert.ok(nativeEnglish?.orderedFunctions.includes('COUNTRY_LANGUAGES'));
  assert.ok(nativeEnglish?.orderedFunctions.includes('ADDRESS_SCHEMA'));
  assert.ok(noPostal?.orderedFunctions.includes('POSTAL_EQUIVALENT'));
  assert.match(noPostal?.failureBehavior ?? '', /Do not invent an official postal code/);
});

test('AddressQL postal status policies distinguish official, weak, carrier-specific, and fallback systems', () => {
  const statuses = new Set(ADDRESSQL_POSTAL_STATUS_POLICIES.map(policy => policy.status));
  const weak = ADDRESSQL_POSTAL_STATUS_POLICIES.find(policy => policy.status === 'weak_or_partial_postal_code');
  const carrier = ADDRESSQL_POSTAL_STATUS_POLICIES.find(policy => policy.status === 'carrier_specific_postal_code');

  assert.ok(statuses.has('official_postal_code'));
  assert.ok(statuses.has('no_postal_code'));
  assert.ok(statuses.has('weak_or_partial_postal_code'));
  assert.ok(statuses.has('carrier_specific_postal_code'));
  assert.ok(statuses.has('postal_equivalent_required'));
  assert.ok(weak?.fallbackFunctions.includes('ADDRESS_WITHIN'));
  assert.ok(carrier?.queryPlan.includes('DELIVERY_AREA'));
});

test('AddressQL country/postal docs explain function usage and postal-equivalent non-claims', () => {
  const readme = readFileSync('docs/addressql/README.md', 'utf8');
  const functions = readFileSync('docs/addressql/country-postal-functions.md', 'utf8');
  const registry = readFileSync('docs/addressql/function-registry-v0.1.md', 'utf8');

  assert.match(readme, /country-postal-functions\.md/);
  assert.match(functions, /COUNTRY_RESOLVE/);
  assert.match(functions, /POSTAL_EQUIVALENT/);
  assert.match(functions, /Do not invent an official postal code/);
  assert.match(functions, /native language and English/);
  assert.match(registry, /COUNTRY_POSTAL_STATUS/);
  assert.match(registry, /POSTAL_FORMAT/);
  assert.match(registry, /POSTAL_REQUIRED/);
});
