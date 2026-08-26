import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeArgentinaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { ARGENTINA_POSTAL_CONTEXT_TEST_INSTANT, ARGENTINA_POSTAL_CONTEXT_TEST_POINT, createArgentinaPostalContextRuntimeTestPack } from '../testFixtures/postalContextArgentinaRuntimeFixture';

test('Argentina pack keeps CPA assignment, derived validation surface, explicit building, and AGID separate', () => {
  const pack = createArgentinaPostalContextRuntimeTestPack(); const validation = validatePostalContextRuntimePack(pack, 'AR');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeArgentinaPostalCode('ｚ９９９９ｚｚｚ'), 'Z9999ZZZ');
  assert.equal(normalizeArgentinaPostalCode('z 9999 zzz'), 'Z9999ZZZ');
  assert.equal(normalizeArgentinaPostalCode('9999'), null);
  assert.equal(normalizeArgentinaPostalCode('AR-Z9999ZZZ'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'ar-synthetic-derived-street-face-like-validation-surface');
});

test('Argentina CPA lookup gates synthetic derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createArgentinaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('z 9999 zzz', ARGENTINA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('Z9999ZZZ', ARGENTINA_POSTAL_CONTEXT_TEST_INSTANT, ARGENTINA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'AR'); assert.equal(lookup.normalizedPostalCode, 'Z9999ZZZ'); assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Argentina coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createArgentinaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...ARGENTINA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: ARGENTINA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'AR'); assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true); assert.deepEqual(result.postalEvidence, [{ postalCode: 'Z9999ZZZ', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Argentina building'), true);
});

test('Argentina bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createArgentinaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-64.02, -38.52, -63.98, -38.48], ARGENTINA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, 'Z9999ZZZ'); assert.equal(result.matches[0]?.source.sourceId, 'ar-synthetic-derived-street-face-like-validation-surface');
});
