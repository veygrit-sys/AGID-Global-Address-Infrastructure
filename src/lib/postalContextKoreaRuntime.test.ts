import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeKoreaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  KOREA_POSTAL_CONTEXT_TEST_INSTANT,
  KOREA_POSTAL_CONTEXT_TEST_POINT,
  createKoreaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextKoreaRuntimeFixture';

test('Korea pack separates National Basic District geometry, Juso address, and explicitly linked building', () => {
  const pack = createKoreaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'KR');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeKoreaPostalCode('０００００'), '00000');
  assert.equal(normalizeKoreaPostalCode('00 000'), '00000');
  assert.equal(normalizeKoreaPostalCode('KR-00000'), null);
  assert.equal(normalizeKoreaPostalCode('000-00'), null);
  assert.equal(normalizeKoreaPostalCode('0000'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Korea postcode lookup preserves leading zeroes and gates official-style geometry on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createKoreaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', KOREA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    KOREA_POSTAL_CONTEXT_TEST_INSTANT,
    KOREA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'KR');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Korea coordinate resolution reaches a building only through the explicit Juso relation', () => {
  const runtime = new PostalContextPackRuntime(createKoreaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...KOREA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: KOREA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'KR');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked Juso building'),
    true,
  );
});

test('Korea bbox lookup returns only the synthetic National Basic District surface', () => {
  const runtime = new PostalContextPackRuntime(createKoreaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [126.965, 37.556, 126.991, 37.578],
    KOREA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'kr-synthetic-national-basic-district');
});
