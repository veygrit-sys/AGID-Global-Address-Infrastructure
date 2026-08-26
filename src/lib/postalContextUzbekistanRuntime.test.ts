import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeUzbekistanPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { UZBEKISTAN_POSTAL_CONTEXT_TEST_INSTANT, UZBEKISTAN_POSTAL_CONTEXT_TEST_POINT, createUzbekistanPostalContextRuntimeTestPack } from '../testFixtures/postalContextUzbekistanRuntimeFixture';

test('Uzbekistan pack separates delivery index, office context, buildings, jurisdiction, time, and AGID', () => {
  const pack = createUzbekistanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'UZ');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeUzbekistanPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeUzbekistanPostalCode('999 999'), '999999');
  assert.equal(normalizeUzbekistanPostalCode('999-999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'uz-synthetic-derived-postal-context-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Uzbekistan postcode lookup canonicalizes six digits and exposes only opt-in synthetic geometry', () => {
  const runtime = new PostalContextPackRuntime(createUzbekistanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('999 999', UZBEKISTAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('999999', UZBEKISTAN_POSTAL_CONTEXT_TEST_INSTANT, UZBEKISTAN_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'UZ');
  assert.equal(lookup.normalizedPostalCode, '999999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Uzbekistan coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createUzbekistanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...UZBEKISTAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: UZBEKISTAN_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'UZ');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '999999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Uzbekistan building'), true);
});

test('Uzbekistan bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createUzbekistanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([63.98, 40.98, 64.02, 41.02], UZBEKISTAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '999999');
  assert.equal(result.matches[0]?.source.sourceId, 'uz-synthetic-derived-postal-context-surface');
});
