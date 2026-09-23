import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeBelarusPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  BELARUS_POSTAL_CONTEXT_TEST_INSTANT,
  BELARUS_POSTAL_CONTEXT_TEST_POINT,
  createBelarusPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextBelarusRuntimeFixture';

test('Belarus pack separates operator assignment, official-derived-style zone, address identity, and capital-structure evidence', () => {
  const pack = createBelarusPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'BY');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeBelarusPostalCode('００００００'), '000000');
  assert.equal(normalizeBelarusPostalCode('000 000'), '000000');
  assert.equal(normalizeBelarusPostalCode('BY-000000'), null);
  assert.equal(normalizeBelarusPostalCode('00000'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
  assert.notEqual(postalArea?.source.sourceId, 'nca-belarus-production-postal-zone');
});

test('Belarus postcode lookup preserves leading zeroes and exposes zone geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createBelarusPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('000 000', BELARUS_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '000000',
    BELARUS_POSTAL_CONTEXT_TEST_INSTANT,
    BELARUS_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'BY');
  assert.equal(lookup.normalizedPostalCode, '000000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'by-synthetic-nca-official-derived-postal-zone');
});

test('Belarus coordinate resolution reaches a capital structure only through the explicit fixture relation', () => {
  const runtime = new PostalContextPackRuntime(createBelarusPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...BELARUS_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: BELARUS_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'BY');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '000000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic capital structure linked by authoritative real-estate identifier'),
    true,
  );
});

test('Belarus bbox lookup returns only the synthetic official-derived-style zone', () => {
  const runtime = new PostalContextPackRuntime(createBelarusPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [27.539, 53.889, 27.579, 53.913],
    BELARUS_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '000000');
  assert.equal(result.matches[0]?.source.sourceId, 'by-synthetic-nca-official-derived-postal-zone');
});
