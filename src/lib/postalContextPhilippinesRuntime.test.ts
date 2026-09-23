import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizePhilippinesPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT, PHILIPPINES_POSTAL_CONTEXT_TEST_POINT, createPhilippinesPostalContextRuntimeTestPack } from '../testFixtures/postalContextPhilippinesRuntimeFixture';

test('Philippines pack keeps ZIP assignment, building relation, and derived geometry separated', () => {
  const pack = createPhilippinesPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'PH');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizePhilippinesPostalCode('１０００'), '1000');
  assert.equal(normalizePhilippinesPostalCode('1 000'), '1000');
  assert.equal(normalizePhilippinesPostalCode('PH-1000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Philippines ZIP lookup normalizes full-width digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createPhilippinesPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('９ ９９９', PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('9999', PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT, PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'PH');
  assert.equal(lookup.normalizedPostalCode, '9999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Philippines coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createPhilippinesPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...PHILIPPINES_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'PH');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Philippines building'), true);
});

test('Philippines bbox lookup returns only the synthetic derived delivery surface', () => {
  const runtime = new PostalContextPackRuntime(createPhilippinesPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([120.96, 14.58, 121.01, 14.62], PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '9999');
  assert.equal(result.matches[0]?.source.sourceId, 'ph-synthetic-derived-delivery-surface');
});
