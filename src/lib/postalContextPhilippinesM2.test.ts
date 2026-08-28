import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PostalContextPackRuntime, normalizePhilippinesPostalCode} from './postalContextPackRuntime';
import {createPhilippinesPostalContextRuntimeTestPack, PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT} from '../testFixtures/postalContextPhilippinesRuntimeFixture';

// Conformance only: no production PH assignments or address/building facts.
test('PH four-digit runtime does not coerce announced seven-character ZIP Code PH into a four-digit assignment', () => {
  for (const candidate of ['ZZ99999', 'zz99999', '1234567', 'PH-9999', 'Locality label', '9999,9998']) {
    assert.equal(normalizePhilippinesPostalCode(candidate), null);
  }
  assert.equal(normalizePhilippinesPostalCode('０００１'), '0001');
});

test('PH runtime rejects invalid namespace without a synthetic fallback assignment', () => {
  const runtime = new PostalContextPackRuntime(createPhilippinesPostalContextRuntimeTestPack());
  const result = runtime.lookupPostalCode('ZZ99999', PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT);
  assert.notEqual(result.status, 'unique');
  assert.deepEqual(result.geometries, []);
});

test('PH synthetic postcode lookup does not infer a building or activate geometry implicitly', () => {
  const runtime = new PostalContextPackRuntime(createPhilippinesPostalContextRuntimeTestPack());
  const result = runtime.lookupPostalCode('9999', PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.deepEqual(result.geometries, []);
  assert.equal(result.countryCode, 'PH');
  assert.ok([...result.postalFeatures, ...result.contexts].every(node => !['building', 'address_point'].includes(node.kind)));
  assert.ok(result.alternatives.every(alt => alt.contexts.every(node => !['building', 'address_point'].includes(node.kind))));
});
