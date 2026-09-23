import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeVenezuelaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT, VENEZUELA_POSTAL_CONTEXT_TEST_POINT, createVenezuelaPostalContextRuntimeTestPack } from '../testFixtures/postalContextVenezuelaRuntimeFixture';
test('Venezuelan pack keeps delivery-network object, derived review geometry, explicit building relation, and AGID separate', () => {
  const pack = createVenezuelaPostalContextRuntimeTestPack(); const validation = validatePostalContextRuntimePack(pack, 'VE'); const polygon = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; ')); assert.equal(normalizeVenezuelaPostalCode('９９９９'), '9999');
  assert.equal(normalizeVenezuelaPostalCode('99 99'), '9999'); assert.equal(normalizeVenezuelaPostalCode('99-99'), null); assert.equal(normalizeVenezuelaPostalCode('VE-9999'), null);
  assert.equal(polygon?.quality.status, 'derived'); assert.equal(polygon?.source.sourceId, 've-synthetic-derived-postal-service-area-review-polygon'); assert.notEqual(polygon?.source.geometryAuthority, 'official_postal_operator_geometry');
});
test('Venezuelan postcode lookup normalizes four digits and gates synthetic derived-review geometry', () => {
  const runtime = new PostalContextPackRuntime(createVenezuelaPostalContextRuntimeTestPack()); const lookup = runtime.lookupPostalCode('99 99', VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('9999', VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT, VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'VE'); assert.equal(lookup.normalizedPostalCode, '9999'); assert.deepEqual(lookup.geometries, []); assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});
test('Venezuelan coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createVenezuelaPostalContextRuntimeTestPack()); const result = runtime.resolvePublicCoordinate({ ...VENEZUELA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'VE'); assert.equal(result.resolvedLevel, 'building'); assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9999', relation: 'inside' }]); assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Venezuelan building'), true);
});
test('Venezuelan bbox lookup returns only the synthetic derived postal-service review surface', () => {
  const runtime = new PostalContextPackRuntime(createVenezuelaPostalContextRuntimeTestPack()); const result = runtime.intersectsPostalBbox([-66.93, 10.46, -66.87, 10.50], VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, '9999'); assert.equal(result.matches[0]?.source.sourceId, 've-synthetic-derived-postal-service-area-review-polygon');
});
