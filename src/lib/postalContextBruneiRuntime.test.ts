import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeBruneiPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { BRUNEI_POSTAL_CONTEXT_TEST_INSTANT, BRUNEI_POSTAL_CONTEXT_TEST_POINT, createBruneiPostalContextRuntimeTestPack } from '../testFixtures/postalContextBruneiRuntimeFixture';

test('Brunei pack keeps routing assignment, Survey building relation, and derived geometry separated', () => {
  const pack = createBruneiPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'BN');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeBruneiPostalCode('ｂｚ９９９９'), 'BZ9999');
  assert.equal(normalizeBruneiPostalCode('BZ 9999'), 'BZ9999');
  assert.equal(normalizeBruneiPostalCode('AA9999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Brunei postcode lookup canonicalizes spacing and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createBruneiPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('ｂｚ ９９９９', BRUNEI_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('BZ9999', BRUNEI_POSTAL_CONTEXT_TEST_INSTANT, BRUNEI_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'BN');
  assert.equal(lookup.normalizedPostalCode, 'BZ9999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Brunei coordinate resolution reaches a building only through explicit house-number relation', () => {
  const runtime = new PostalContextPackRuntime(createBruneiPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...BRUNEI_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: BRUNEI_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'BN');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: 'BZ9999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Brunei building'), true);
});

test('Brunei bbox lookup returns only the synthetic derived delivery surface', () => {
  const runtime = new PostalContextPackRuntime(createBruneiPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([114.92, 4.88, 114.96, 4.92], BRUNEI_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, 'BZ9999');
  assert.equal(result.matches[0]?.source.sourceId, 'bn-synthetic-derived-delivery-surface');
});
