import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeGuatemalaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  GUATEMALA_POSTAL_CONTEXT_TEST_INSTANT,
  GUATEMALA_POSTAL_CONTEXT_TEST_POINT,
  createGuatemalaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextGuatemalaRuntimeFixture';

test('Guatemala pack keeps routing-locality semantics, synthetic geometry, civic building relation, and AGID separate', () => {
  const pack = createGuatemalaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'GT');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeGuatemalaPostalCode('９９９９９'), '99999');
  assert.equal(normalizeGuatemalaPostalCode('99 999'), '99999');
  assert.equal(normalizeGuatemalaPostalCode('GT-99999'), null);
  assert.equal(normalizeGuatemalaPostalCode('99-999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'gt-synthetic-routing-locality-validation-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_release_polygon');
});

test('Guatemala postcode lookup normalizes five digits and gates synthetic polygon geometry', () => {
  const runtime = new PostalContextPackRuntime(createGuatemalaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 999', GUATEMALA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '99999',
    GUATEMALA_POSTAL_CONTEXT_TEST_INSTANT,
    GUATEMALA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'GT');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Guatemala coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createGuatemalaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...GUATEMALA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: GUATEMALA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'GT');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Guatemala building'),
    true,
  );
});

test('Guatemala bbox lookup returns only the synthetic routing-locality validation polygon', () => {
  const runtime = new PostalContextPackRuntime(createGuatemalaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-90.27, 15.48, -90.23, 15.52], GUATEMALA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'gt-synthetic-routing-locality-validation-polygon');
});
