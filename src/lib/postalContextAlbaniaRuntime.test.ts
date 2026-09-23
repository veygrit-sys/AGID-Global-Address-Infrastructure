import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeAlbaniaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  ALBANIA_POSTAL_CONTEXT_TEST_INSTANT,
  ALBANIA_POSTAL_CONTEXT_TEST_POINT,
  createAlbaniaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextAlbaniaRuntimeFixture';

test('Albania pack treats four digits as delivery-network evidence, not a universal official polygon', () => {
  const pack = createAlbaniaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'AL');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeAlbaniaPostalCode('１００１'), '1001');
  assert.equal(normalizeAlbaniaPostalCode('10 01'), '1001');
  assert.equal(normalizeAlbaniaPostalCode('10-01'), null);
  assert.equal(normalizeAlbaniaPostalCode('AL1001'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Albania postcode lookup preserves leading zeroes and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createAlbaniaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', ALBANIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    ALBANIA_POSTAL_CONTEXT_TEST_INSTANT,
    ALBANIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'AL');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Albania coordinate resolution reaches a building only through an explicit registry link', () => {
  const runtime = new PostalContextPackRuntime(createAlbaniaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...ALBANIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: ALBANIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'AL');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked ASHK cadastral building'),
    true,
  );
});

test('Albania bbox lookup returns only an explicitly derived membership surface', () => {
  const runtime = new PostalContextPackRuntime(createAlbaniaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [19.79, 41.30, 19.85, 41.35],
    ALBANIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'al-synthetic-derived-address-membership-surface');
});
