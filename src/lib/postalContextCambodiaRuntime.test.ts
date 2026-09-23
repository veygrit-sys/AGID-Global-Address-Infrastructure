import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeCambodiaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { CAMBODIA_POSTAL_CONTEXT_TEST_INSTANT, CAMBODIA_POSTAL_CONTEXT_TEST_POINT, createCambodiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextCambodiaRuntimeFixture';

test('Cambodia pack keeps Prakas assignment, derived boundary, explicit building, and AGID separate', () => {
  const pack = createCambodiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'KH');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeCambodiaPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeCambodiaPostalCode('99 99 99'), '999999');
  assert.equal(normalizeCambodiaPostalCode('KH-999999'), null);
  assert.equal(normalizeCambodiaPostalCode('999-999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'kh-synthetic-derived-postal-context-surface');
});

test('Cambodia postcode lookup canonicalizes six digits and exposes only opt-in synthetic geometry', () => {
  const runtime = new PostalContextPackRuntime(createCambodiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 99 99', CAMBODIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('999999', CAMBODIA_POSTAL_CONTEXT_TEST_INSTANT, CAMBODIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'KH'); assert.equal(lookup.normalizedPostalCode, '999999'); assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Cambodia coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createCambodiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...CAMBODIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: CAMBODIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'KH'); assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true); assert.deepEqual(result.postalEvidence, [{ postalCode: '999999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Cambodia building'), true);
});

test('Cambodia bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createCambodiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([104.88, 12.48, 104.92, 12.52], CAMBODIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, '999999'); assert.equal(result.matches[0]?.source.sourceId, 'kh-synthetic-derived-postal-context-surface');
});
