import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeSloveniaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  SLOVENIA_POSTAL_CONTEXT_TEST_INSTANT,
  SLOVENIA_POSTAL_CONTEXT_TEST_POINT,
  createSloveniaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextSloveniaRuntimeFixture';

test('Slovenia pack keeps operator assignment and its test postal district evidence separated', () => {
  const pack = createSloveniaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'SI');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSloveniaPostalCode('００００'), '0000');
  assert.equal(normalizeSloveniaPostalCode('SI-0000'), '0000');
  assert.equal(normalizeSloveniaPostalCode('SI0000'), null);
  assert.equal(normalizeSloveniaPostalCode('00-00'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Slovenia postcode lookup canonicalizes SI- input and exposes geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createSloveniaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('SI-0000', SLOVENIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    SLOVENIA_POSTAL_CONTEXT_TEST_INSTANT,
    SLOVENIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'SI');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Slovenia coordinate resolution reaches a building only through the explicit GURS relation', () => {
  const runtime = new PostalContextPackRuntime(createSloveniaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...SLOVENIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: SLOVENIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'SI');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked GURS cadastral building'),
    true,
  );
});

test('Slovenia bbox lookup returns only the explicitly qualified synthetic postal district', () => {
  const runtime = new PostalContextPackRuntime(createSloveniaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [14.493, 46.048, 14.519, 46.066],
    SLOVENIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'si-synthetic-crosswalk-qualified-postal-district');
});
