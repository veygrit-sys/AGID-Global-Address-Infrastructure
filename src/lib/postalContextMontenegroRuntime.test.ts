import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeMontenegroPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  MONTENEGRO_POSTAL_CONTEXT_TEST_INSTANT,
  MONTENEGRO_POSTAL_CONTEXT_TEST_POINT,
  createMontenegroPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextMontenegroRuntimeFixture';

test('Montenegro pack keeps five-digit assignment, six-digit PAK semantics, and derived geometry separated', () => {
  const pack = createMontenegroPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'ME');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeMontenegroPostalCode('０００００'), '00000');
  assert.equal(normalizeMontenegroPostalCode('00 000'), '00000');
  assert.equal(normalizeMontenegroPostalCode('ME-00000'), null);
  assert.equal(normalizeMontenegroPostalCode('000000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Montenegro postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createMontenegroPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', MONTENEGRO_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    MONTENEGRO_POSTAL_CONTEXT_TEST_INSTANT,
    MONTENEGRO_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'ME');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Montenegro coordinate resolution reaches a building only through the explicit UZN relation', () => {
  const runtime = new PostalContextPackRuntime(createMontenegroPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...MONTENEGRO_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: MONTENEGRO_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'ME');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked UZN cadastral building'),
    true,
  );
});

test('Montenegro bbox lookup returns only the synthetic derived address-membership surface', () => {
  const runtime = new PostalContextPackRuntime(createMontenegroPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [19.248, 42.431, 19.278, 42.452],
    MONTENEGRO_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'me-synthetic-derived-address-membership-surface');
});
