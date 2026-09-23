import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeUruguayPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  URUGUAY_POSTAL_CONTEXT_TEST_INSTANT,
  URUGUAY_POSTAL_CONTEXT_TEST_POINT,
  createUruguayPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextUruguayRuntimeFixture';

test('Uruguay pack keeps official-release semantics, synthetic geometry, civic building relation, and AGID separate', () => {
  const pack = createUruguayPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'UY');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeUruguayPostalCode('９９９９９'), '99999');
  assert.equal(normalizeUruguayPostalCode('99 999'), '99999');
  assert.equal(normalizeUruguayPostalCode('UY-99999'), null);
  assert.equal(normalizeUruguayPostalCode('999-99'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'uy-synthetic-official-release-like-validation-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_release_polygon');
});

test('Uruguay postcode lookup normalizes five digits and gates synthetic polygon geometry', () => {
  const runtime = new PostalContextPackRuntime(createUruguayPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 999', URUGUAY_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '99999',
    URUGUAY_POSTAL_CONTEXT_TEST_INSTANT,
    URUGUAY_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'UY');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Uruguay coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createUruguayPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...URUGUAY_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: URUGUAY_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'UY');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Uruguay building'),
    true,
  );
});

test('Uruguay bbox lookup returns only the synthetic release-like validation polygon', () => {
  const runtime = new PostalContextPackRuntime(createUruguayPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-56.02, -32.52, -55.98, -32.48], URUGUAY_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'uy-synthetic-official-release-like-validation-polygon');
});
