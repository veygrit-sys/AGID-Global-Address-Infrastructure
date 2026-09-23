import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeAustriaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  AUSTRIA_POSTAL_CONTEXT_TEST_INSTANT,
  AUSTRIA_POSTAL_CONTEXT_TEST_POINT,
  createAustriaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextAustriaRuntimeFixture';

test('Austria pack treats four digits as assignment evidence, not an automatic polygon', () => {
  const pack = createAustriaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'AT');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeAustriaPostalCode('０１０１'), '0101');
  assert.equal(normalizeAustriaPostalCode('01 01'), '0101');
  assert.equal(normalizeAustriaPostalCode('01-01'), null);
  assert.equal(normalizeAustriaPostalCode('AT0101'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Austria postcode lookup preserves leading zeroes and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createAustriaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', AUSTRIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    AUSTRIA_POSTAL_CONTEXT_TEST_INSTANT,
    AUSTRIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'AT');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Austria coordinate resolution reaches a building only through an explicit identifier link', () => {
  const runtime = new PostalContextPackRuntime(createAustriaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...AUSTRIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: AUSTRIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'AT');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked BEV address-register building'),
    true,
  );
});

test('Austria bbox lookup returns only an explicitly derived membership surface', () => {
  const runtime = new PostalContextPackRuntime(createAustriaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [16.36, 48.19, 16.39, 48.22],
    AUSTRIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'at-synthetic-derived-address-membership-surface');
});
