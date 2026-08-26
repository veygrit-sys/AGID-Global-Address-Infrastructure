import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeKyrgyzstanPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { KYRGYZSTAN_POSTAL_CONTEXT_TEST_INSTANT, KYRGYZSTAN_POSTAL_CONTEXT_TEST_POINT, createKyrgyzstanPostalContextRuntimeTestPack } from '../testFixtures/postalContextKyrgyzstanRuntimeFixture';

test('Kyrgyzstan pack keeps operator assignment, derived surface, explicit building, and AGID separate', () => {
  const pack = createKyrgyzstanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'KG');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeKyrgyzstanPostalCode('７９９９９９'), '799999');
  assert.equal(normalizeKyrgyzstanPostalCode('79 99 99'), '799999');
  assert.equal(normalizeKyrgyzstanPostalCode('KG-799999'), null);
  assert.equal(normalizeKyrgyzstanPostalCode('ОС Передвижное'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'kg-synthetic-derived-postal-context-surface');
});

test('Kyrgyzstan postcode lookup canonicalizes six digits and exposes only opt-in synthetic geometry', () => {
  const runtime = new PostalContextPackRuntime(createKyrgyzstanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('79 99 99', KYRGYZSTAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('799999', KYRGYZSTAN_POSTAL_CONTEXT_TEST_INSTANT, KYRGYZSTAN_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'KG'); assert.equal(lookup.normalizedPostalCode, '799999'); assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Kyrgyzstan coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createKyrgyzstanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...KYRGYZSTAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: KYRGYZSTAN_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'KG'); assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true); assert.deepEqual(result.postalEvidence, [{ postalCode: '799999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Kyrgyzstan building'), true);
});

test('Kyrgyzstan bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createKyrgyzstanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([74.98, 41.48, 75.02, 41.52], KYRGYZSTAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, '799999'); assert.equal(result.matches[0]?.source.sourceId, 'kg-synthetic-derived-postal-context-surface');
});
