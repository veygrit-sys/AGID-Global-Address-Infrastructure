import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeBelgiumPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  BELGIUM_POSTAL_CONTEXT_TEST_INSTANT,
  BELGIUM_POSTAL_CONTEXT_TEST_POINT,
  createBelgiumPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextBelgiumRuntimeFixture';

test('Belgium pack separates bpost assignment, postal-canton geometry, BeSt-style address identity, and regional building evidence', () => {
  const pack = createBelgiumPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'BE');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeBelgiumPostalCode('００００'), '0000');
  assert.equal(normalizeBelgiumPostalCode('00 00'), '0000');
  assert.equal(normalizeBelgiumPostalCode('B-0000'), null);
  assert.equal(normalizeBelgiumPostalCode('BE-0000'), null);
  assert.equal(normalizeBelgiumPostalCode('00000'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
  assert.notEqual(postalArea?.source.sourceId, 'bpost-belgium-postal-cantons');
});

test('Belgium postcode lookup preserves leading zeroes and exposes postal-canton geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createBelgiumPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', BELGIUM_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    BELGIUM_POSTAL_CONTEXT_TEST_INSTANT,
    BELGIUM_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'BE');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'be-synthetic-bpost-postal-canton');
});

test('Belgium coordinate resolution reaches a building only through the explicit fixture relation', () => {
  const runtime = new PostalContextPackRuntime(createBelgiumPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...BELGIUM_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: BELGIUM_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'BE');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic regional building linked by authoritative identifier'),
    true,
  );
});

test('Belgium bbox lookup returns only the synthetic postal-canton surface', () => {
  const runtime = new PostalContextPackRuntime(createBelgiumPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [4.329, 50.834, 4.376, 50.859],
    BELGIUM_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'be-synthetic-bpost-postal-canton');
});
