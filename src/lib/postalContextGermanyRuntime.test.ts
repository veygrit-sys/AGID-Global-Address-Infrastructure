import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeGermanyPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  GERMANY_POSTAL_CONTEXT_TEST_INSTANT,
  GERMANY_POSTAL_CONTEXT_TEST_POINT,
  createGermanyPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextGermanyRuntimeFixture';

test('Germany pack models a five-digit code with separately pinned area evidence', () => {
  const pack = createGermanyPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'DE');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeGermanyPostalCode('００００１'), '00001');
  assert.equal(normalizeGermanyPostalCode('00 001'), '00001');
  assert.equal(normalizeGermanyPostalCode('00-001'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Germany postcode lookup exposes licensed-style geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createGermanyPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00000', GERMANY_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    GERMANY_POSTAL_CONTEXT_TEST_INSTANT,
    GERMANY_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'DE');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Germany coordinate resolution reaches a building only through the explicit fixture link', () => {
  const runtime = new PostalContextPackRuntime(createGermanyPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...GERMANY_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: GERMANY_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'DE');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked building'),
    true,
  );
});

test('Germany bbox lookup returns the pinned delivery postcode area', () => {
  const runtime = new PostalContextPackRuntime(createGermanyPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [13.39, 52.51, 13.42, 52.53],
    GERMANY_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'de-synthetic-licensed-delivery-area');
});
