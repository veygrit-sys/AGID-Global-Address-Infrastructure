import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeBhutanPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { BHUTAN_POSTAL_CONTEXT_TEST_INSTANT, BHUTAN_POSTAL_CONTEXT_TEST_POINT, createBhutanPostalContextRuntimeTestPack } from '../testFixtures/postalContextBhutanRuntimeFixture';

test('Bhutan pack keeps routing assignment, building relation, and derived geometry separated', () => {
  const pack = createBhutanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'BT');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeBhutanPostalCode('９９９９９'), '99999');
  assert.equal(normalizeBhutanPostalCode('99 999'), '99999');
  assert.equal(normalizeBhutanPostalCode('BT-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Bhutan postcode lookup normalizes full-width digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createBhutanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('９９ ９９９', BHUTAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', BHUTAN_POSTAL_CONTEXT_TEST_INSTANT, BHUTAN_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'BT');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Bhutan coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createBhutanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...BHUTAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: BHUTAN_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'BT');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Bhutan building'), true);
});

test('Bhutan bbox lookup returns only the synthetic derived delivery surface', () => {
  const runtime = new PostalContextPackRuntime(createBhutanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([89.62, 27.46, 89.66, 27.49], BHUTAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'bt-synthetic-derived-delivery-surface');
});
