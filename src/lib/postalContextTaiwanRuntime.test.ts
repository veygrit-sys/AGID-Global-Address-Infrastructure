import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeTaiwanPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  TAIWAN_POSTAL_CONTEXT_TEST_INSTANT,
  TAIWAN_POSTAL_CONTEXT_TEST_POINT,
  createTaiwanPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextTaiwanRuntimeFixture';

test('Taiwan pack keeps 3+3 assignment, MOI doorplate point, NLSC building, and derived geometry separated', () => {
  const pack = createTaiwanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'TW');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeTaiwanPostalCode('００００００'), '000000');
  assert.equal(normalizeTaiwanPostalCode('000 000'), '000000');
  assert.equal(normalizeTaiwanPostalCode('TW-000000'), null);
  assert.equal(normalizeTaiwanPostalCode('000-000'), null);
  assert.equal(normalizeTaiwanPostalCode('00000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Taiwan postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createTaiwanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('000 000', TAIWAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '000000',
    TAIWAN_POSTAL_CONTEXT_TEST_INSTANT,
    TAIWAN_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'TW');
  assert.equal(lookup.normalizedPostalCode, '000000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Taiwan coordinate resolution reaches a building only through the explicit doorplate-to-NLSC relation', () => {
  const runtime = new PostalContextPackRuntime(createTaiwanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...TAIWAN_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: TAIWAN_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'TW');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '000000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked NLSC building'),
    true,
  );
});

test('Taiwan bbox lookup returns only the synthetic derived doorplate-membership surface', () => {
  const runtime = new PostalContextPackRuntime(createTaiwanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [121.516, 25.037, 121.547, 25.059],
    TAIWAN_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '000000');
  assert.equal(result.matches[0]?.source.sourceId, 'tw-synthetic-derived-doorplate-membership-surface');
});
