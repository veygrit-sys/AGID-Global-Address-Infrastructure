import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeMongoliaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT, MONGOLIA_POSTAL_CONTEXT_TEST_POINT, createMongoliaPostalContextRuntimeTestPack } from '../testFixtures/postalContextMongoliaRuntimeFixture';

test('Mongolia pack separates five-digit zone geometry, nine-digit building code, government grid, and AGID', () => {
  const pack = createMongoliaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MN');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  const unifiedCode = pack.graph.nodes.find(node => node.postalCode === '99999-9999');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeMongoliaPostalCode('９９９９９－９９９９'), '99999-9999');
  assert.equal(normalizeMongoliaPostalCode('MN-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'mn-synthetic-derived-postal-zone-surface');
  assert.equal(unifiedCode?.geometryType, 'none');
});

test('Mongolia lookup exposes five-digit derived geometry only on opt-in and keeps nine-digit code non-spatial', () => {
  const runtime = new PostalContextPackRuntime(createMongoliaPostalContextRuntimeTestPack());
  const zone = runtime.lookupPostalCode('９９ ９９９', MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT);
  const zoneGeometry = runtime.lookupPostalCode('99999', MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT, MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  const buildingCode = runtime.lookupPostalCode('999999999', MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT, MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(zone.status, 'unique');
  assert.equal(zone.countryCode, 'MN');
  assert.equal(zone.normalizedPostalCode, '99999');
  assert.deepEqual(zone.geometries, []);
  assert.equal(zoneGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(buildingCode.status, 'unique');
  assert.equal(buildingCode.normalizedPostalCode, '99999-9999');
  assert.deepEqual(buildingCode.geometries, []);
});

test('Mongolia coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createMongoliaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...MONGOLIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MN');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Mongolia building'), true);
});

test('Mongolia bbox lookup returns only the synthetic derived five-digit zone surface', () => {
  const runtime = new PostalContextPackRuntime(createMongoliaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([106.87, 47.87, 106.93, 47.93], MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'mn-synthetic-derived-postal-zone-surface');
});
