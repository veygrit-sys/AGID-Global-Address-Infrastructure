import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeChilePostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  CHILE_POSTAL_CONTEXT_TEST_INSTANT,
  CHILE_POSTAL_CONTEXT_TEST_POINT,
  createChilePostalContextRuntimeTestPack,
} from '../testFixtures/postalContextChileRuntimeFixture';

test('Chile pack keeps block-face assignment, derived review geometry, explicit building relation, and AGID separate', () => {
  const pack = createChilePostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CL');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeChilePostalCode('９９９９９９９'), '9999999');
  assert.equal(normalizeChilePostalCode('999 9999'), '9999999');
  assert.equal(normalizeChilePostalCode('CL-9999999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'cl-synthetic-derived-block-face-review-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_geometry');
});

test('Chile postcode lookup normalizes seven digits and gates synthetic derived review geometry', () => {
  const runtime = new PostalContextPackRuntime(createChilePostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('999 9999', CHILE_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '9999999',
    CHILE_POSTAL_CONTEXT_TEST_INSTANT,
    CHILE_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CL');
  assert.equal(lookup.normalizedPostalCode, '9999999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Chile coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createChilePostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...CHILE_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: CHILE_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CL');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9999999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Chile building'),
    true,
  );
});

test('Chile bbox lookup returns only the synthetic derived block-face review surface', () => {
  const runtime = new PostalContextPackRuntime(createChilePostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-70.67, -33.47, -70.63, -33.43], CHILE_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '9999999');
  assert.equal(result.matches[0]?.source.sourceId, 'cl-synthetic-derived-block-face-review-polygon');
});
