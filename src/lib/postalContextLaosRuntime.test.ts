import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeLaosPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { LAOS_POSTAL_CONTEXT_TEST_INSTANT, LAOS_POSTAL_CONTEXT_TEST_POINT, createLaosPostalContextRuntimeTestPack } from '../testFixtures/postalContextLaosRuntimeFixture';

test('Laos pack separates five-digit delivery assignment, derived surface, civic address, building, and AGID', () => {
  const pack = createLaosPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'LA');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeLaosPostalCode('໙໙ ໙໙໙'), '99999');
  assert.equal(normalizeLaosPostalCode('LA-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'la-synthetic-delivery-administrative-join-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Laos postcode lookup canonicalizes Lao and Thai digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createLaosPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('๙๙ ๙๙๙', LAOS_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', LAOS_POSTAL_CONTEXT_TEST_INSTANT, LAOS_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'LA');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Laos coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createLaosPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...LAOS_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: LAOS_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'LA');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Laos building'), true);
});

test('Laos bbox lookup returns only the synthetic delivery-administrative join surface', () => {
  const runtime = new PostalContextPackRuntime(createLaosPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([102.98, 17.98, 103.02, 18.02], LAOS_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'la-synthetic-delivery-administrative-join-surface');
});
