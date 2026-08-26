import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeEcuadorPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  ECUADOR_POSTAL_CONTEXT_TEST_INSTANT,
  ECUADOR_POSTAL_CONTEXT_TEST_POINT,
  createEcuadorPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextEcuadorRuntimeFixture';

test('Ecuador pack keeps lookup-observation semantics, synthetic geometry, civic building relation, and AGID separate', () => {
  const pack = createEcuadorPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'EC');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeEcuadorPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeEcuadorPostalCode('99 99 99'), '999999');
  assert.equal(normalizeEcuadorPostalCode('EC-999999'), null);
  assert.equal(normalizeEcuadorPostalCode('999-999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'ec-synthetic-lookup-like-validation-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_release_polygon');
});

test('Ecuador postcode lookup normalizes six digits and gates synthetic polygon geometry', () => {
  const runtime = new PostalContextPackRuntime(createEcuadorPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 99 99', ECUADOR_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '999999',
    ECUADOR_POSTAL_CONTEXT_TEST_INSTANT,
    ECUADOR_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'EC');
  assert.equal(lookup.normalizedPostalCode, '999999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Ecuador coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createEcuadorPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...ECUADOR_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: ECUADOR_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'EC');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '999999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Ecuador building'),
    true,
  );
});

test('Ecuador bbox lookup returns only the synthetic lookup-like validation polygon', () => {
  const runtime = new PostalContextPackRuntime(createEcuadorPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-78.52, -1.52, -78.48, -1.48], ECUADOR_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '999999');
  assert.equal(result.matches[0]?.source.sourceId, 'ec-synthetic-lookup-like-validation-polygon');
});
