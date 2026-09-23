import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeKazakhstanPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { KAZAKHSTAN_POSTAL_CONTEXT_TEST_INSTANT, KAZAKHSTAN_POSTAL_CONTEXT_TEST_POINT, createKazakhstanPostalContextRuntimeTestPack } from '../testFixtures/postalContextKazakhstanRuntimeFixture';

test('Kazakhstan pack separates current and legacy codes, derived surfaces, buildings, time, and AGID', () => {
  const pack = createKazakhstanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'KZ');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeKazakhstanPostalCode('ｘ９９ｘ９ｘ９'), 'X99X9X9');
  assert.equal(normalizeKazakhstanPostalCode('x99 x9 x9'), 'X99X9X9');
  assert.equal(normalizeKazakhstanPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeKazakhstanPostalCode('KZ-X99X9X9'), null);
  assert.equal(normalizeKazakhstanPostalCode('X99-X9X9'), null);
  assert.equal(normalizeKazakhstanPostalCode('Х99X9X9'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'kz-synthetic-derived-postal-context-surface');
});

test('Kazakhstan postcode lookup canonicalizes the current code and exposes only opt-in synthetic geometry', () => {
  const runtime = new PostalContextPackRuntime(createKazakhstanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('x99 x9 x9', KAZAKHSTAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('X99X9X9', KAZAKHSTAN_POSTAL_CONTEXT_TEST_INSTANT, KAZAKHSTAN_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'KZ'); assert.equal(lookup.normalizedPostalCode, 'X99X9X9'); assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Kazakhstan coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createKazakhstanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...KAZAKHSTAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: KAZAKHSTAN_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'KZ'); assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true); assert.deepEqual(result.postalEvidence, [{ postalCode: 'X99X9X9', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Kazakhstan building'), true);
});

test('Kazakhstan bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createKazakhstanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([66.98, 47.98, 67.02, 48.02], KAZAKHSTAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, 'X99X9X9'); assert.equal(result.matches[0]?.source.sourceId, 'kz-synthetic-derived-postal-context-surface');
});
