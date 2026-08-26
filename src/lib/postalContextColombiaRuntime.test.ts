import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeColombiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  COLOMBIA_POSTAL_CONTEXT_TEST_INSTANT,
  COLOMBIA_POSTAL_CONTEXT_TEST_POINT,
  createColombiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextColombiaRuntimeFixture';

test('Colombia pack keeps official-release, civic construction relation, and AGID evidence separate', () => {
  const pack = createColombiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CO');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeColombiaPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeColombiaPostalCode('999 999'), '999999');
  assert.equal(normalizeColombiaPostalCode('CO-999999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'co-synthetic-official-release-like-validation-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_release_polygon');
});

test('Colombia postcode lookup normalizes six digits and gates synthetic polygon geometry', () => {
  const runtime = new PostalContextPackRuntime(createColombiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('999 999', COLOMBIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '999999',
    COLOMBIA_POSTAL_CONTEXT_TEST_INSTANT,
    COLOMBIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CO');
  assert.equal(lookup.normalizedPostalCode, '999999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Colombia coordinate resolution reaches a construction only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createColombiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...COLOMBIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: COLOMBIA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CO');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '999999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Colombia construction'),
    true,
  );
});

test('Colombia bbox lookup returns only the synthetic release-like validation polygon', () => {
  const runtime = new PostalContextPackRuntime(createColombiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-74.12, 4.63, -74.08, 4.67], COLOMBIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '999999');
  assert.equal(result.matches[0]?.source.sourceId, 'co-synthetic-official-release-like-validation-polygon');
});
