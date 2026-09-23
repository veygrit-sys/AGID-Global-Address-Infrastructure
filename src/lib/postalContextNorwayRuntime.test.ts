import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeNorwayPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  NORWAY_POSTAL_CONTEXT_TEST_INSTANT,
  NORWAY_POSTAL_CONTEXT_TEST_POINT,
  createNorwayPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextNorwayRuntimeFixture';

test('Norway pack keeps four-digit assignment, official-area semantics, and building evidence separated', () => {
  const pack = createNorwayPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'NO');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeNorwayPostalCode('００００'), '0000');
  assert.equal(normalizeNorwayPostalCode('00 00'), '0000');
  assert.equal(normalizeNorwayPostalCode('NO-0000'), null);
  assert.equal(normalizeNorwayPostalCode('00000'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Norway postcode lookup preserves leading zeroes and exposes area geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createNorwayPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', NORWAY_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    NORWAY_POSTAL_CONTEXT_TEST_INSTANT,
    NORWAY_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'NO');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Norway coordinate resolution reaches an FKB building only through the building-number relation', () => {
  const runtime = new PostalContextPackRuntime(createNorwayPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...NORWAY_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: NORWAY_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'NO');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic FKB building linked by Matrikkelen building number'),
    true,
  );
});

test('Norway bbox lookup returns only the synthetic Kartverket-style postcode area', () => {
  const runtime = new PostalContextPackRuntime(createNorwayPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [10.735, 59.902, 10.769, 59.926],
    NORWAY_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'no-synthetic-kartverket-postcode-area');
});
