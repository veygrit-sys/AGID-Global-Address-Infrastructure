import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeSerbiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  SERBIA_POSTAL_CONTEXT_TEST_INSTANT,
  SERBIA_POSTAL_CONTEXT_TEST_POINT,
  createSerbiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextSerbiaRuntimeFixture';

test('Serbia pack keeps five-digit assignment, six-digit PAK semantics, and derived geometry separated', () => {
  const pack = createSerbiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'RS');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSerbiaPostalCode('０００００'), '00000');
  assert.equal(normalizeSerbiaPostalCode('00 000'), '00000');
  assert.equal(normalizeSerbiaPostalCode('RS-00000'), null);
  assert.equal(normalizeSerbiaPostalCode('000000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Serbia postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createSerbiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', SERBIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    SERBIA_POSTAL_CONTEXT_TEST_INSTANT,
    SERBIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'RS');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Serbia coordinate resolution reaches a building only through the explicit RGZ relation', () => {
  const runtime = new PostalContextPackRuntime(createSerbiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...SERBIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: SERBIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'RS');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked RGZ cadastral building'),
    true,
  );
});

test('Serbia bbox lookup returns only the synthetic derived address-membership surface', () => {
  const runtime = new PostalContextPackRuntime(createSerbiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [20.448, 44.807, 20.478, 44.828],
    SERBIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'rs-synthetic-derived-address-membership-surface');
});
