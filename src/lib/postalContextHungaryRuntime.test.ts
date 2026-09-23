import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeHungaryPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  HUNGARY_POSTAL_CONTEXT_TEST_INSTANT,
  HUNGARY_POSTAL_CONTEXT_TEST_POINT,
  createHungaryPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextHungaryRuntimeFixture';

test('Hungary pack keeps operator assignment, derived surface, KCR address, and building evidence separated', () => {
  const pack = createHungaryPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'HU');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeHungaryPostalCode('００００'), '0000');
  assert.equal(normalizeHungaryPostalCode('00 00'), '0000');
  assert.equal(normalizeHungaryPostalCode('HU-0000'), null);
  assert.equal(normalizeHungaryPostalCode('00000'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
  assert.notEqual(postalArea?.source.sourceId, 'magyar-posta-official-polygon');
});

test('Hungary postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createHungaryPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', HUNGARY_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    HUNGARY_POSTAL_CONTEXT_TEST_INSTANT,
    HUNGARY_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'HU');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Hungary coordinate resolution reaches a building only through an explicit KCR cadastral relation', () => {
  const runtime = new PostalContextPackRuntime(createHungaryPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...HUNGARY_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: HUNGARY_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'HU');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic rights-cleared building linked by KCR cadastral identifier'),
    true,
  );
});

test('Hungary bbox lookup returns only the synthetic derived postcode surface', () => {
  const runtime = new PostalContextPackRuntime(createHungaryPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [19.023, 47.486, 19.057, 47.510],
    HUNGARY_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'hu-synthetic-derived-postcode-surface');
});
