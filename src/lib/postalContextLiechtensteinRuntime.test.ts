import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeLiechtensteinPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT,
  LIECHTENSTEIN_POSTAL_CONTEXT_TEST_POINT,
  createLiechtensteinPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextLiechtensteinRuntimeFixture';

test('Liechtenstein pack models a four-digit domicile code with LI-classified PLZO evidence', () => {
  const pack = createLiechtensteinPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'LI');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeLiechtensteinPostalCode('９４００'), '9400');
  assert.equal(normalizeLiechtensteinPostalCode('94 00'), '9400');
  assert.equal(normalizeLiechtensteinPostalCode('94-00'), null);
  assert.equal(normalizeLiechtensteinPostalCode('8000'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Liechtenstein postcode lookup exposes PLZO geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createLiechtensteinPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('94 00', LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '9400',
    LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT,
    LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'LI');
  assert.equal(lookup.normalizedPostalCode, '9400');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Liechtenstein coordinate resolution reaches a building only through an explicit identifier link', () => {
  const runtime = new PostalContextPackRuntime(createLiechtensteinPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...LIECHTENSTEIN_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'LI');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9400', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked LLV GWR building'),
    true,
  );
});

test('Liechtenstein bbox lookup returns only the LI-classified PLZO perimeter', () => {
  const runtime = new PostalContextPackRuntime(createLiechtensteinPostalContextRuntimeTestPack());
  assert.equal(runtime.countryCode, 'LI');
  const result = runtime.intersectsPostalBbox(
    [9.5109, 47.131, 9.5309, 47.151],
    LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '9400');
  assert.equal(result.matches[0]?.source.sourceId, 'li-synthetic-swisstopo-plzo');
});
