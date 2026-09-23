import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizePakistanPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT,
  PAKISTAN_POSTAL_CONTEXT_TEST_POINT,
  createPakistanPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextPakistanRuntimeFixture';

test('Pakistan pack keeps office assignment, building relation, and derived geometry separated', () => {
  const pack = createPakistanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'PK');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizePakistanPostalCode('０３００１'), '03001');
  assert.equal(normalizePakistanPostalCode('03 001'), '03001');
  assert.equal(normalizePakistanPostalCode('PK-03001'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Pakistan postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createPakistanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('00000', PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT, PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT, true);

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'PK');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Pakistan coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createPakistanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...PAKISTAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'PK');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Pakistan building'), true);
});

test('Pakistan bbox lookup returns only the synthetic derived postal surface', () => {
  const runtime = new PostalContextPackRuntime(createPakistanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([73.03, 33.67, 73.07, 33.70], PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT);

  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'pk-synthetic-derived-postal-surface');
});
