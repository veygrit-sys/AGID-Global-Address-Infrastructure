import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeMexicoPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { MEXICO_POSTAL_CONTEXT_TEST_INSTANT, MEXICO_POSTAL_CONTEXT_TEST_POINT, createMexicoPostalContextRuntimeTestPack } from '../testFixtures/postalContextMexicoRuntimeFixture';

test('Mexican pack keeps official-source eligibility, synthetic geometry, explicit building relation, and AGID separate', () => {
  const pack = createMexicoPostalContextRuntimeTestPack(); const validation = validatePostalContextRuntimePack(pack, 'MX'); const polygon = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; ')); assert.equal(normalizeMexicoPostalCode('９９９９９'), '99999');
  assert.equal(normalizeMexicoPostalCode('99 999'), '99999'); assert.equal(normalizeMexicoPostalCode('99-999'), null); assert.equal(normalizeMexicoPostalCode('MX-99999'), null);
  assert.equal(polygon?.quality.status, 'derived'); assert.equal(polygon?.source.sourceId, 'mx-synthetic-official-release-like-validation-polygon'); assert.notEqual(polygon?.source.geometryAuthority, 'official_sepomex_postal_boundary_release');
});

test('Mexican postcode lookup normalizes five digits and gates synthetic validation geometry', () => {
  const runtime = new PostalContextPackRuntime(createMexicoPostalContextRuntimeTestPack()); const lookup = runtime.lookupPostalCode('99 999', MEXICO_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', MEXICO_POSTAL_CONTEXT_TEST_INSTANT, MEXICO_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'MX'); assert.equal(lookup.normalizedPostalCode, '99999'); assert.deepEqual(lookup.geometries, []); assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Mexican coordinate resolution reaches a building only through an explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createMexicoPostalContextRuntimeTestPack()); const result = runtime.resolvePublicCoordinate({ ...MEXICO_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MEXICO_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'MX'); assert.equal(result.resolvedLevel, 'building'); assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]); assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Mexican building'), true);
});

test('Mexican bbox lookup returns only the synthetic official-release-like validation surface', () => {
  const runtime = new PostalContextPackRuntime(createMexicoPostalContextRuntimeTestPack()); const result = runtime.intersectsPostalBbox([-99.15, 19.42, -99.11, 19.45], MEXICO_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, '99999'); assert.equal(result.matches[0]?.source.sourceId, 'mx-synthetic-official-release-like-validation-polygon');
});
