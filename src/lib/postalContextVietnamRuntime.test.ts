import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeVietnamPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { VIETNAM_POSTAL_CONTEXT_TEST_INSTANT, VIETNAM_POSTAL_CONTEXT_TEST_POINT, createVietnamPostalContextRuntimeTestPack } from '../testFixtures/postalContextVietnamRuntimeFixture';

test('Vietnam pack keeps current assignment, administrative join, digital address, and building relation separated', () => {
  const pack = createVietnamPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'VN');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeVietnamPostalCode('９９ ９９９'), '99999');
  assert.equal(normalizeVietnamPostalCode('VN-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'vn-synthetic-administrative-join-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Vietnam postcode lookup canonicalizes spacing and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createVietnamPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('９９ ９９９', VIETNAM_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', VIETNAM_POSTAL_CONTEXT_TEST_INSTANT, VIETNAM_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'VN');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Vietnam coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createVietnamPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...VIETNAM_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: VIETNAM_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'VN');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Vietnam building'), true);
});

test('Vietnam bbox lookup returns only the synthetic administrative join surface', () => {
  const runtime = new PostalContextPackRuntime(createVietnamPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([107.98, 15.98, 108.02, 16.02], VIETNAM_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'vn-synthetic-administrative-join-surface');
});
