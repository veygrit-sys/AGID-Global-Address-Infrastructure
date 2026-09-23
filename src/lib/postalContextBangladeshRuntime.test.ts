import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeBangladeshPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { BANGLADESH_POSTAL_CONTEXT_TEST_INSTANT, BANGLADESH_POSTAL_CONTEXT_TEST_POINT, createBangladeshPostalContextRuntimeTestPack } from '../testFixtures/postalContextBangladeshRuntimeFixture';

test('Bangladesh pack keeps office assignment, building relation, and derived geometry separated', () => {
  const pack = createBangladeshPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'BD');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeBangladeshPostalCode('১২০৫'), '1205');
  assert.equal(normalizeBangladeshPostalCode('1 205'), '1205');
  assert.equal(normalizeBangladeshPostalCode('০১২৩'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Bangladesh postcode lookup accepts Bengali digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createBangladeshPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('৯ ৯৯৯', BANGLADESH_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('9999', BANGLADESH_POSTAL_CONTEXT_TEST_INSTANT, BANGLADESH_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'BD');
  assert.equal(lookup.normalizedPostalCode, '9999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Bangladesh coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createBangladeshPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...BANGLADESH_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: BANGLADESH_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'BD');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Bangladesh building'), true);
});

test('Bangladesh bbox lookup returns only the synthetic derived delivery surface', () => {
  const runtime = new PostalContextPackRuntime(createBangladeshPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([90.39, 23.79, 90.43, 23.83], BANGLADESH_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '9999');
  assert.equal(result.matches[0]?.source.sourceId, 'bd-synthetic-derived-delivery-surface');
});
