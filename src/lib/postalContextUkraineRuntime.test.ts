import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeUkrainePostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  UKRAINE_POSTAL_CONTEXT_TEST_INSTANT,
  UKRAINE_POSTAL_CONTEXT_TEST_POINT,
  createUkrainePostalContextRuntimeTestPack,
} from '../testFixtures/postalContextUkraineRuntimeFixture';

test('Ukraine pack treats five digits as routing evidence, not an automatic polygon', () => {
  const pack = createUkrainePostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'UA');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeUkrainePostalCode('０１００１'), '01001');
  assert.equal(normalizeUkrainePostalCode('01 001'), '01001');
  assert.equal(normalizeUkrainePostalCode('01-001'), null);
  assert.equal(normalizeUkrainePostalCode('UA01001'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Ukraine postcode lookup preserves leading zeroes and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createUkrainePostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', UKRAINE_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    UKRAINE_POSTAL_CONTEXT_TEST_INSTANT,
    UKRAINE_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'UA');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Ukraine coordinate resolution reaches a building only through an explicit identifier link', () => {
  const runtime = new PostalContextPackRuntime(createUkrainePostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...UKRAINE_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: UKRAINE_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'UA');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked Ukraine building-register object'),
    true,
  );
});

test('Ukraine bbox lookup returns only an explicitly derived membership surface', () => {
  const runtime = new PostalContextPackRuntime(createUkrainePostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [30.49, 50.42, 30.56, 50.48],
    UKRAINE_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'ua-synthetic-derived-address-membership-surface');
});
