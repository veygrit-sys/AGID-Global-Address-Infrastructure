import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeDenmarkPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  DENMARK_POSTAL_CONTEXT_TEST_INSTANT,
  DENMARK_POSTAL_CONTEXT_TEST_POINT,
  createDenmarkPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextDenmarkRuntimeFixture';

test('Denmark pack models a four-digit code with separately pinned DAGI area evidence', () => {
  const pack = createDenmarkPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'DK');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeDenmarkPostalCode('００１２'), '0012');
  assert.equal(normalizeDenmarkPostalCode('00 12'), '0012');
  assert.equal(normalizeDenmarkPostalCode('0012'), '0012');
  assert.equal(normalizeDenmarkPostalCode('00-12'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Denmark postcode lookup exposes DAGI-style geometry only on explicit opt-in', () => {
  const runtime = new PostalContextPackRuntime(createDenmarkPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('0000', DENMARK_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    DENMARK_POSTAL_CONTEXT_TEST_INSTANT,
    DENMARK_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'DK');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Denmark coordinate resolution reaches a building only through the explicit DAR fixture link', () => {
  const runtime = new PostalContextPackRuntime(createDenmarkPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...DENMARK_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: DENMARK_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'DK');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked GeoDanmark building'),
    true,
  );
});

test('Denmark bbox lookup returns the pinned DAGI-style postcode area', () => {
  const runtime = new PostalContextPackRuntime(createDenmarkPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [12.55, 55.665, 12.585, 55.687],
    DENMARK_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'dk-synthetic-dagi-postcode-area');
});
