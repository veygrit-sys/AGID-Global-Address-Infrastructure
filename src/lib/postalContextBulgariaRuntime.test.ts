import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeBulgariaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  BULGARIA_POSTAL_CONTEXT_TEST_INSTANT,
  BULGARIA_POSTAL_CONTEXT_TEST_POINT,
  createBulgariaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextBulgariaRuntimeFixture';

test('Bulgaria pack separates routing assignment, derived geometry, address identity, and cadastral building evidence', () => {
  const pack = createBulgariaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'BG');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeBulgariaPostalCode('００００'), '0000');
  assert.equal(normalizeBulgariaPostalCode('00 00'), '0000');
  assert.equal(normalizeBulgariaPostalCode('BG-0000'), null);
  assert.equal(normalizeBulgariaPostalCode('00000'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
  assert.notEqual(postalArea?.source.sourceId, 'bulgarian-posts-official-polygon');
});

test('Bulgaria postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createBulgariaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', BULGARIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    BULGARIA_POSTAL_CONTEXT_TEST_INSTANT,
    BULGARIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'BG');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'bg-synthetic-derived-postcode-membership-surface');
});

test('Bulgaria coordinate resolution reaches a building only through the explicit fixture relation', () => {
  const runtime = new PostalContextPackRuntime(createBulgariaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...BULGARIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: BULGARIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'BG');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic AGCC building linked by cadastral identifier'),
    true,
  );
});

test('Bulgaria bbox lookup returns only the synthetic noncanonical derived surface', () => {
  const runtime = new PostalContextPackRuntime(createBulgariaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [23.303, 42.685, 23.341, 42.711],
    BULGARIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'bg-synthetic-derived-postcode-membership-surface');
});
