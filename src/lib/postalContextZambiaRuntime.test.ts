import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeZambiaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT, ZAMBIA_POSTAL_CONTEXT_TEST_POINT, createZambiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextZambiaRuntimeFixture';

test('Zambia pack separates five-digit observations, holder objects, derived surfaces, national addresses and buildings', () => {
  const pack = createZambiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'ZM');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeZambiaPostalCode('０９９９８'), '09998');
  assert.equal(normalizeZambiaPostalCode('09 998'), '09998');
  assert.equal(normalizeZambiaPostalCode('ZM-09998'), null);
  assert.equal(normalizeZambiaPostalCode('P.O. Box 09998'), null);
  assert.equal(normalizeZambiaPostalCode('9998'), null);
  assert.equal(normalizeZambiaPostalCode('099998'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Zambia postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createZambiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('09 998', ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('09998', ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT, ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'ZM');
  assert.equal(lookup.normalizedPostalCode, '09998');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'zm-synthetic-derived-postal-review-surface');
});

test('Zambia coordinate resolution reaches a building only through an explicit national-address relation', () => {
  const runtime = new PostalContextPackRuntime(createZambiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...ZAMBIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'ZM');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '09998', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly rights-cleared national-address-linked Zambian building'), true);
});

test('Zambia bbox lookup returns only the synthetic derived review surface', () => {
  const runtime = new PostalContextPackRuntime(createZambiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([28.28, -15.42, 28.32, -15.38], ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '09998');
  assert.equal(result.matches[0]?.source.sourceId, 'zm-synthetic-derived-postal-review-surface');
});
