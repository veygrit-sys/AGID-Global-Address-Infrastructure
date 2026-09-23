import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeAfghanistanPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { AFGHANISTAN_POSTAL_CONTEXT_TEST_INSTANT, AFGHANISTAN_POSTAL_CONTEXT_TEST_POINT, createAfghanistanPostalContextRuntimeTestPack } from '../testFixtures/postalContextAfghanistanRuntimeFixture';

test('Afghanistan pack separates six-digit assignment, official-map evidence, administrative P-code, building, and AGID', () => {
  const pack = createAfghanistanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'AF');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeAfghanistanPostalCode('۹۹۹۹۹۹'), '999999');
  assert.equal(normalizeAfghanistanPostalCode('٩٩ ٩٩ ٩٩'), '999999');
  assert.equal(normalizeAfghanistanPostalCode('9999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'af-synthetic-postal-delivery-zone-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Afghanistan postcode lookup canonicalizes Persian digits and exposes synthetic geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createAfghanistanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('۹۹۹۹۹۹', AFGHANISTAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('999999', AFGHANISTAN_POSTAL_CONTEXT_TEST_INSTANT, AFGHANISTAN_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'AF');
  assert.equal(lookup.normalizedPostalCode, '999999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Afghanistan coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createAfghanistanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...AFGHANISTAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: AFGHANISTAN_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'AF');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '999999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Afghanistan building'), true);
});

test('Afghanistan bbox lookup returns only the synthetic postal delivery-zone surface', () => {
  const runtime = new PostalContextPackRuntime(createAfghanistanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([65.98, 33.98, 66.02, 34.02], AFGHANISTAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '999999');
  assert.equal(result.matches[0]?.source.sourceId, 'af-synthetic-postal-delivery-zone-surface');
});
