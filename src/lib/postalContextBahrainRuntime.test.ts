import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeBahrainPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT,
  BAHRAIN_POSTAL_CONTEXT_TEST_POINT,
  createBahrainPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextBahrainRuntimeFixture';

test('Bahrain pack keeps postcode-block relation, explicit building, and derived geometry separated', () => {
  const pack = createBahrainPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'BH');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeBahrainPostalCode('１００'), '100');
  assert.equal(normalizeBahrainPostalCode('1 212'), '1212');
  assert.equal(normalizeBahrainPostalCode('099'), null);
  assert.equal(normalizeBahrainPostalCode('1300'), null);
  assert.equal(normalizeBahrainPostalCode('BH-317'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Bahrain postcode lookup preserves 3 or 4 digits and exposes derived block geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createBahrainPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('1 00', BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '100', BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT, BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT, true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'BH');
  assert.equal(lookup.normalizedPostalCode, '100');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Bahrain coordinate resolution reaches a building only through explicit iGA civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createBahrainPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...BAHRAIN_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'BH');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '100', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component =>
    component.label === 'Synthetic explicitly linked Bahrain building'), true);
});

test('Bahrain bbox lookup returns only the synthetic derived block postal surface', () => {
  const runtime = new PostalContextPackRuntime(createBahrainPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [50.57, 26.21, 50.60, 26.24], BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '100');
  assert.equal(result.matches[0]?.source.sourceId, 'bh-synthetic-derived-block-postal-surface');
});
