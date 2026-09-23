import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeMyanmarPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { MYANMAR_POSTAL_CONTEXT_TEST_INSTANT, MYANMAR_POSTAL_CONTEXT_TEST_POINT, createMyanmarPostalContextRuntimeTestPack } from '../testFixtures/postalContextMyanmarRuntimeFixture';

test('Myanmar pack keeps current assignment, administrative PCode join, civic address, and building relation separated', () => {
  const pack = createMyanmarPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MM');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeMyanmarPostalCode('၉၉ ၉၉ ၉၉၉'), '9999999');
  assert.equal(normalizeMyanmarPostalCode('MM-9999999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'mm-synthetic-administrative-join-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Myanmar postcode lookup canonicalizes Myanmar digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createMyanmarPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('၉၉ ၉၉ ၉၉၉', MYANMAR_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('9999999', MYANMAR_POSTAL_CONTEXT_TEST_INSTANT, MYANMAR_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'MM'); assert.equal(lookup.normalizedPostalCode, '9999999'); assert.deepEqual(lookup.geometries, []); assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Myanmar coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createMyanmarPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...MYANMAR_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MYANMAR_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'MM'); assert.equal(result.resolvedLevel, 'building'); assert.equal(result.addressPointEvidence.matched, true); assert.deepEqual(result.postalEvidence, [{ postalCode: '9999999', relation: 'inside' }]); assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Myanmar building'), true);
});

test('Myanmar bbox lookup returns only the synthetic administrative join surface', () => {
  const runtime = new PostalContextPackRuntime(createMyanmarPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([96.08, 19.73, 96.12, 19.77], MYANMAR_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, '9999999'); assert.equal(result.matches[0]?.source.sourceId, 'mm-synthetic-administrative-join-surface');
});
