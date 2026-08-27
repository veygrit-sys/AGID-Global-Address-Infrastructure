import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeEthiopiaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT, ETHIOPIA_POSTAL_CONTEXT_TEST_POINT, createEthiopiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextEthiopiaRuntimeFixture';

test('Ethiopia pack separates four-digit postal objects, derived surfaces, eDAS addresses, and explicit buildings', () => {
  const pack = createEthiopiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'ET');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeEthiopiaPostalCode('０９９９'), '0999');
  assert.equal(normalizeEthiopiaPostalCode('09 99'), '0999');
  assert.equal(normalizeEthiopiaPostalCode('ET-0999'), null);
  assert.equal(normalizeEthiopiaPostalCode('09-99'), null);
  assert.equal(normalizeEthiopiaPostalCode('999'), null);
  assert.equal(normalizeEthiopiaPostalCode('09999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Ethiopia postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createEthiopiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('09 99', ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('0999', ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT, ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'ET');
  assert.equal(lookup.normalizedPostalCode, '0999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'et-synthetic-derived-postal-review-surface');
});

test('Ethiopia coordinate resolution reaches a building only through an explicit eDAS address relation', () => {
  const runtime = new PostalContextPackRuntime(createEthiopiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...ETHIOPIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'ET');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly eDAS-address-linked Ethiopian building'), true);
});

test('Ethiopia bbox lookup returns only the synthetic derived review surface', () => {
  const runtime = new PostalContextPackRuntime(createEthiopiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([37.99, 8.99, 38.02, 9.02], ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '0999');
  assert.equal(result.matches[0]?.source.sourceId, 'et-synthetic-derived-postal-review-surface');
});
