import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeCroatiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  CROATIA_POSTAL_CONTEXT_TEST_INSTANT,
  CROATIA_POSTAL_CONTEXT_TEST_POINT,
  createCroatiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextCroatiaRuntimeFixture';

test('Croatia pack canonicalizes domestic and international five-digit input without inventing a polygon', () => {
  const pack = createCroatiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'HR');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeCroatiaPostalCode('１００００'), '10000');
  assert.equal(normalizeCroatiaPostalCode('10 000'), '10000');
  assert.equal(normalizeCroatiaPostalCode('HR-10000'), '10000');
  assert.equal(normalizeCroatiaPostalCode('HR10000'), null);
  assert.equal(normalizeCroatiaPostalCode('100-00'), null);
  assert.equal(normalizeCroatiaPostalCode('1000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Croatia postcode lookup normalizes HR- input and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createCroatiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('HR-00000', CROATIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    CROATIA_POSTAL_CONTEXT_TEST_INSTANT,
    CROATIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'HR');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Croatia coordinate resolution reaches a building only through an explicit synthetic link', () => {
  const runtime = new PostalContextPackRuntime(createCroatiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...CROATIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: CROATIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'HR');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked Croatian building'),
    true,
  );
});

test('Croatia bbox lookup returns only an explicitly derived address-membership surface', () => {
  const runtime = new PostalContextPackRuntime(createCroatiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [15.97, 45.80, 16.00, 45.83],
    CROATIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'hr-synthetic-derived-address-membership-surface');
});
