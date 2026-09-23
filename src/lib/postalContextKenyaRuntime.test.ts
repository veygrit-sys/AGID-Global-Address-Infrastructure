import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeKenyaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { KENYA_POSTAL_CONTEXT_TEST_INSTANT, KENYA_POSTAL_CONTEXT_TEST_POINT, createKenyaPostalContextRuntimeTestPack } from '../testFixtures/postalContextKenyaRuntimeFixture';

test('Kenya pack separates five-digit delivery-office codes, derived surfaces, NASK addresses and explicit buildings', () => {
  const pack = createKenyaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'KE');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeKenyaPostalCode('０９９９９'), '09999');
  assert.equal(normalizeKenyaPostalCode('09 999'), '09999');
  assert.equal(normalizeKenyaPostalCode('KE-09999'), null);
  assert.equal(normalizeKenyaPostalCode('34567-00100'), null);
  assert.equal(normalizeKenyaPostalCode('9999'), null);
  assert.equal(normalizeKenyaPostalCode('099999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Kenya postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createKenyaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('09 999', KENYA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('09999', KENYA_POSTAL_CONTEXT_TEST_INSTANT, KENYA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'KE');
  assert.equal(lookup.normalizedPostalCode, '09999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'ke-synthetic-derived-postal-review-surface');
});

test('Kenya coordinate resolution reaches a building only through an explicit NASK address relation', () => {
  const runtime = new PostalContextPackRuntime(createKenyaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...KENYA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: KENYA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'KE');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '09999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly rights-cleared NASK-address-linked Kenyan building'), true);
});

test('Kenya bbox lookup returns only the synthetic derived review surface', () => {
  const runtime = new PostalContextPackRuntime(createKenyaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([36.98, -1.02, 37.02, -0.98], KENYA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '09999');
  assert.equal(result.matches[0]?.source.sourceId, 'ke-synthetic-derived-postal-review-surface');
});