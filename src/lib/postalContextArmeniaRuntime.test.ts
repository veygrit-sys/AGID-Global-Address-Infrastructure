import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeArmeniaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  ARMENIA_POSTAL_CONTEXT_TEST_INSTANT,
  ARMENIA_POSTAL_CONTEXT_TEST_POINT,
  createArmeniaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextArmeniaRuntimeFixture';

test('Armenia pack treats four digits as postal-network evidence, not a universal official polygon', () => {
  const pack = createArmeniaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'AM');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeArmeniaPostalCode('０００２'), '0002');
  assert.equal(normalizeArmeniaPostalCode('00 02'), '0002');
  assert.equal(normalizeArmeniaPostalCode('00-02'), null);
  assert.equal(normalizeArmeniaPostalCode('AM0002'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Armenia postcode lookup preserves leading zeroes and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createArmeniaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', ARMENIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    ARMENIA_POSTAL_CONTEXT_TEST_INSTANT,
    ARMENIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'AM');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Armenia coordinate resolution reaches a building only through an explicit registry link', () => {
  const runtime = new PostalContextPackRuntime(createArmeniaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...ARMENIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: ARMENIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'AM');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked Cadastre Committee building'),
    true,
  );
});

test('Armenia bbox lookup returns only an explicitly derived membership surface', () => {
  const runtime = new PostalContextPackRuntime(createArmeniaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [44.47, 40.15, 44.53, 40.21],
    ARMENIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'am-synthetic-derived-address-membership-surface');
});
