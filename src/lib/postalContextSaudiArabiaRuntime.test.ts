import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeSaudiArabiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  SAUDI_ARABIA_POSTAL_CONTEXT_TEST_INSTANT,
  SAUDI_ARABIA_POSTAL_CONTEXT_TEST_POINT,
  createSaudiArabiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextSaudiArabiaRuntimeFixture';

test('Saudi Arabia pack keeps five-digit assignments, SPL National Address, explicit buildings, and derived geometry separated', () => {
  const pack = createSaudiArabiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'SA');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSaudiArabiaPostalCode('０００００'), '00000');
  assert.equal(normalizeSaudiArabiaPostalCode('00 000'), '00000');
  assert.equal(normalizeSaudiArabiaPostalCode('SA-00000'), null);
  assert.equal(normalizeSaudiArabiaPostalCode('000-00'), null);
  assert.equal(normalizeSaudiArabiaPostalCode('0000'), null);
  assert.equal(normalizeSaudiArabiaPostalCode('000000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Saudi Arabia postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createSaudiArabiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', SAUDI_ARABIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    SAUDI_ARABIA_POSTAL_CONTEXT_TEST_INSTANT,
    SAUDI_ARABIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'SA');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Saudi Arabia coordinate resolution reaches a building only through the explicit SPL-address-to-building relation', () => {
  const runtime = new PostalContextPackRuntime(createSaudiArabiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...SAUDI_ARABIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: SAUDI_ARABIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'SA');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked Saudi building'),
    true,
  );
});

test('Saudi Arabia bbox lookup returns only the synthetic derived National Address membership surface', () => {
  const runtime = new PostalContextPackRuntime(createSaudiArabiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [46.660, 24.703, 46.691, 24.725],
    SAUDI_ARABIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'sa-synthetic-derived-national-address-membership-surface');
});
