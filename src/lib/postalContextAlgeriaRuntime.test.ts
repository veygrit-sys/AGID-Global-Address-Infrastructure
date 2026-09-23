import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeAlgeriaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { ALGERIA_POSTAL_CONTEXT_TEST_INSTANT, ALGERIA_POSTAL_CONTEXT_TEST_POINT, createAlgeriaPostalContextRuntimeTestPack } from '../testFixtures/postalContextAlgeriaRuntimeFixture';

test('Algeria pack keeps postal object assignment, explicit building, and derived review geometry separated', () => {
  const pack = createAlgeriaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'DZ');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeAlgeriaPostalCode('０９９９９'), '09999');
  assert.equal(normalizeAlgeriaPostalCode('09 999'), '09999');
  assert.equal(normalizeAlgeriaPostalCode('DZ-09999'), null);
  assert.equal(normalizeAlgeriaPostalCode('099-99'), null);
  assert.equal(normalizeAlgeriaPostalCode('0999'), null);
  assert.equal(normalizeAlgeriaPostalCode('099999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Algeria postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createAlgeriaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('09 999', ALGERIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('09999', ALGERIA_POSTAL_CONTEXT_TEST_INSTANT, ALGERIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'DZ');
  assert.equal(lookup.normalizedPostalCode, '09999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'dz-synthetic-derived-postal-review-surface');
});

test('Algeria coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createAlgeriaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...ALGERIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: ALGERIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'DZ');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '09999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Algerian building'), true);
});

test('Algeria bbox lookup returns only the synthetic derived review surface', () => {
  const runtime = new PostalContextPackRuntime(createAlgeriaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([1.99, 27.99, 2.02, 28.02], ALGERIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '09999');
  assert.equal(result.matches[0]?.source.sourceId, 'dz-synthetic-derived-postal-review-surface');
});
