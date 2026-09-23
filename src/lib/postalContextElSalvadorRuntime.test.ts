import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeElSalvadorPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  EL_SALVADOR_POSTAL_CONTEXT_TEST_INSTANT,
  EL_SALVADOR_POSTAL_CONTEXT_TEST_POINT,
  createElSalvadorPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextElSalvadorRuntimeFixture';

test('El Salvador pack keeps routing-locality semantics, synthetic geometry, civic building relation, and AGID separate', () => {
  const pack = createElSalvadorPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'SV');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeElSalvadorPostalCode('９９９９'), '9999');
  assert.equal(normalizeElSalvadorPostalCode('99 99'), '9999');
  assert.equal(normalizeElSalvadorPostalCode('SV-9999'), null);
  assert.equal(normalizeElSalvadorPostalCode('99-99'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'sv-synthetic-routing-locality-validation-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_release_polygon');
});

test('El Salvador postcode lookup normalizes four digits and gates synthetic polygon geometry', () => {
  const runtime = new PostalContextPackRuntime(createElSalvadorPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 99', EL_SALVADOR_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '9999',
    EL_SALVADOR_POSTAL_CONTEXT_TEST_INSTANT,
    EL_SALVADOR_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'SV');
  assert.equal(lookup.normalizedPostalCode, '9999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('El Salvador coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createElSalvadorPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...EL_SALVADOR_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: EL_SALVADOR_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'SV');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked El Salvador building'),
    true,
  );
});

test('El Salvador bbox lookup returns only the synthetic routing-locality validation polygon', () => {
  const runtime = new PostalContextPackRuntime(createElSalvadorPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-89.22, 13.68, -89.18, 13.72], EL_SALVADOR_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '9999');
  assert.equal(result.matches[0]?.source.sourceId, 'sv-synthetic-routing-locality-validation-polygon');
});
