import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeRomaniaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  ROMANIA_POSTAL_CONTEXT_TEST_INSTANT,
  ROMANIA_POSTAL_CONTEXT_TEST_POINT,
  createRomaniaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextRomaniaRuntimeFixture';

test('Romania pack keeps six-digit assignments, RENNS CUA, ANCPI buildings, and derived geometry separated', () => {
  const pack = createRomaniaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'RO');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeRomaniaPostalCode('００００００'), '000000');
  assert.equal(normalizeRomaniaPostalCode('000 000'), '000000');
  assert.equal(normalizeRomaniaPostalCode('RO-000000'), null);
  assert.equal(normalizeRomaniaPostalCode('00000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Romania postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createRomaniaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('000 000', ROMANIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '000000',
    ROMANIA_POSTAL_CONTEXT_TEST_INSTANT,
    ROMANIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'RO');
  assert.equal(lookup.normalizedPostalCode, '000000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Romania coordinate resolution reaches a building only through the explicit RENNS-to-ANCPI relation', () => {
  const runtime = new PostalContextPackRuntime(createRomaniaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...ROMANIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: ROMANIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'RO');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '000000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked ANCPI construction'),
    true,
  );
});

test('Romania bbox lookup returns only the synthetic derived CUA membership surface', () => {
  const runtime = new PostalContextPackRuntime(createRomaniaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [26.087, 44.416, 26.118, 44.438],
    ROMANIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '000000');
  assert.equal(result.matches[0]?.source.sourceId, 'ro-synthetic-derived-cua-membership-surface');
});
