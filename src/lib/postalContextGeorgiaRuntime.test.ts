import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeGeorgiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  GEORGIA_POSTAL_CONTEXT_TEST_INSTANT,
  GEORGIA_POSTAL_CONTEXT_TEST_POINT,
  createGeorgiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextGeorgiaRuntimeFixture';

test('Georgia pack treats four digits as operator assignment, not a universal official polygon', () => {
  const pack = createGeorgiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'GE');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeGeorgiaPostalCode('０００２'), '0002');
  assert.equal(normalizeGeorgiaPostalCode('00 02'), '0002');
  assert.equal(normalizeGeorgiaPostalCode('00-02'), null);
  assert.equal(normalizeGeorgiaPostalCode('GE0002'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Georgia postcode lookup preserves leading zeroes and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createGeorgiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', GEORGIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    GEORGIA_POSTAL_CONTEXT_TEST_INSTANT,
    GEORGIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'GE');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Georgia coordinate resolution reaches a building only through an explicit registry link', () => {
  const runtime = new PostalContextPackRuntime(createGeorgiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...GEORGIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: GEORGIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'GE');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked NSDI registered building'),
    true,
  );
});

test('Georgia bbox lookup returns only an explicitly derived membership surface', () => {
  const runtime = new PostalContextPackRuntime(createGeorgiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [44.81, 41.70, 44.84, 41.73],
    GEORGIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'ge-synthetic-derived-address-membership-surface');
});
