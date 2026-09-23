import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeNicaraguaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  NICARAGUA_POSTAL_CONTEXT_TEST_INSTANT,
  NICARAGUA_POSTAL_CONTEXT_TEST_POINT,
  createNicaraguaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextNicaraguaRuntimeFixture';

test('Nicaraguan pack keeps typed postal object, derived review geometry, explicit building relation, and AGID separate', () => {
  const pack = createNicaraguaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'NI');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeNicaraguaPostalCode('９９９９９'), '99999');
  assert.equal(normalizeNicaraguaPostalCode('99 999'), '99999');
  assert.equal(normalizeNicaraguaPostalCode('99-999'), null);
  assert.equal(normalizeNicaraguaPostalCode('NI-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'ni-synthetic-derived-postal-area-review-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_geometry');
});

test('Nicaraguan postcode lookup normalizes five digits and gates synthetic derived review geometry', () => {
  const runtime = new PostalContextPackRuntime(createNicaraguaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 999', NICARAGUA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '99999',
    NICARAGUA_POSTAL_CONTEXT_TEST_INSTANT,
    NICARAGUA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'NI');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Nicaraguan coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createNicaraguaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...NICARAGUA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: NICARAGUA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'NI');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Nicaraguan building'),
    true,
  );
});

test('Nicaraguan bbox lookup returns only the synthetic derived postal-area review surface', () => {
  const runtime = new PostalContextPackRuntime(createNicaraguaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [-86.26, 12.09, -86.21, 12.14],
    NICARAGUA_POSTAL_CONTEXT_TEST_INSTANT,
  );
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'ni-synthetic-derived-postal-area-review-polygon');
});
