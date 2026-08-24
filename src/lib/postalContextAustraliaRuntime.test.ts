import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeAustraliaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  AUSTRALIA_POSTAL_CONTEXT_TEST_INSTANT,
  AUSTRALIA_POSTAL_CONTEXT_TEST_POINT,
  createAustraliaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextAustraliaRuntimeFixture';

test('Australia pack treats a four-digit postcode as delivery-network evidence, not a universal official polygon', () => {
  const pack = createAustraliaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'AU');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeAustraliaPostalCode('００００'), '0000');
  assert.equal(normalizeAustraliaPostalCode('00 00'), '0000');
  assert.equal(normalizeAustraliaPostalCode('00-00'), null);
  assert.equal(normalizeAustraliaPostalCode('AU 0000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Australia postcode lookup normalizes spacing and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createAustraliaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', AUSTRALIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    AUSTRALIA_POSTAL_CONTEXT_TEST_INSTANT,
    AUSTRALIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'AU');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Australia coordinate resolution reaches a building only through an explicit fixture link', () => {
  const runtime = new PostalContextPackRuntime(createAustraliaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...AUSTRALIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: AUSTRALIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'AU');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Geoscape building'),
    true,
  );
});

test('Australia bbox lookup returns an explicitly derived delivery surface', () => {
  const runtime = new PostalContextPackRuntime(createAustraliaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [151.19, -33.89, 151.23, -33.84],
    AUSTRALIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'au-synthetic-derived-delivery-surface');
});
