import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizePeruPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { PERU_POSTAL_CONTEXT_TEST_INSTANT, PERU_POSTAL_CONTEXT_TEST_POINT, createPeruPostalContextRuntimeTestPack } from '../testFixtures/postalContextPeruRuntimeFixture';
test('Peruvian pack keeps routing-locality object, derived review geometry, explicit building relation, and AGID separate', () => {
  const pack = createPeruPostalContextRuntimeTestPack(); const validation = validatePostalContextRuntimePack(pack, 'PE'); const polygon = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; ')); assert.equal(normalizePeruPostalCode('９９９９９'), '99999');
  assert.equal(normalizePeruPostalCode('99 999'), '99999'); assert.equal(normalizePeruPostalCode('99-999'), null); assert.equal(normalizePeruPostalCode('PE-99999'), null);
  assert.equal(polygon?.quality.status, 'derived'); assert.equal(polygon?.source.sourceId, 'pe-synthetic-derived-postal-service-area-review-polygon'); assert.notEqual(polygon?.source.geometryAuthority, 'official_postal_operator_geometry');
});
test('Peruvian postcode lookup normalizes five digits and gates synthetic derived-review geometry', () => {
  const runtime = new PostalContextPackRuntime(createPeruPostalContextRuntimeTestPack()); const lookup = runtime.lookupPostalCode('99 999', PERU_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', PERU_POSTAL_CONTEXT_TEST_INSTANT, PERU_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'PE'); assert.equal(lookup.normalizedPostalCode, '99999'); assert.deepEqual(lookup.geometries, []); assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});
test('Peruvian coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createPeruPostalContextRuntimeTestPack()); const result = runtime.resolvePublicCoordinate({ ...PERU_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: PERU_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'PE'); assert.equal(result.resolvedLevel, 'building'); assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]); assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Peruvian building'), true);
});
test('Peruvian bbox lookup returns only the synthetic derived postal-service review surface', () => {
  const runtime = new PostalContextPackRuntime(createPeruPostalContextRuntimeTestPack()); const result = runtime.intersectsPostalBbox([-77.06, -12.06, -77.02, -12.03], PERU_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, '99999'); assert.equal(result.matches[0]?.source.sourceId, 'pe-synthetic-derived-postal-service-area-review-polygon');
});
