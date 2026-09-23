import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeChinaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { CHINA_POSTAL_CONTEXT_TEST_INSTANT, CHINA_POSTAL_CONTEXT_TEST_POINT, createChinaPostalContextRuntimeTestPack } from '../testFixtures/postalContextChinaRuntimeFixture';

test('China pack keeps six-digit routing, derived geometry, explicit buildings, and AGID separate', () => {
  const pack = createChinaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CN');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeChinaPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeChinaPostalCode('99 99 99'), '999999');
  assert.equal(normalizeChinaPostalCode('CN-999999'), null);
  assert.equal(normalizeChinaPostalCode('999-999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'cn-synthetic-derived-postal-context-surface');
});

test('China postcode lookup canonicalizes six digits and exposes only opt-in synthetic geometry', () => {
  const runtime = new PostalContextPackRuntime(createChinaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 99 99', CHINA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('999999', CHINA_POSTAL_CONTEXT_TEST_INSTANT, CHINA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'CN'); assert.equal(lookup.normalizedPostalCode, '999999'); assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('China coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createChinaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...CHINA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: CHINA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'CN'); assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true); assert.deepEqual(result.postalEvidence, [{ postalCode: '999999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked China building'), true);
});

test('China bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createChinaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([103.98, 34.98, 104.02, 35.02], CHINA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, '999999'); assert.equal(result.matches[0]?.source.sourceId, 'cn-synthetic-derived-postal-context-surface');
});
