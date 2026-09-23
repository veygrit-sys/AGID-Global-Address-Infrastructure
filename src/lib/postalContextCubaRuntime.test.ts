import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeCubaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  CUBA_POSTAL_CONTEXT_TEST_INSTANT,
  CUBA_POSTAL_CONTEXT_TEST_POINT,
  createCubaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextCubaRuntimeFixture';

test('Cuba pack keeps routing-locality semantics, synthetic geometry, civic building relation, and AGID separate', () => {
  const pack = createCubaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CU');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeCubaPostalCode('９９９９９'), '99999');
  assert.equal(normalizeCubaPostalCode('99 999'), '99999');
  assert.equal(normalizeCubaPostalCode('CU-99999'), null);
  assert.equal(normalizeCubaPostalCode('99-999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'cu-synthetic-routing-locality-validation-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_release_polygon');
});

test('Cuba postcode lookup normalizes five digits and gates synthetic polygon geometry', () => {
  const runtime = new PostalContextPackRuntime(createCubaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 999', CUBA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '99999',
    CUBA_POSTAL_CONTEXT_TEST_INSTANT,
    CUBA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CU');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Cuba coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createCubaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...CUBA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: CUBA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CU');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Cuba building'),
    true,
  );
});

test('Cuba bbox lookup returns only the synthetic routing-locality validation polygon', () => {
  const runtime = new PostalContextPackRuntime(createCubaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-79.52, 21.48, -79.48, 21.52], CUBA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'cu-synthetic-routing-locality-validation-polygon');
});
