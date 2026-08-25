import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeIndiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  INDIA_POSTAL_CONTEXT_TEST_INSTANT,
  INDIA_POSTAL_CONTEXT_TEST_POINT,
  createIndiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextIndiaRuntimeFixture';

test('India pack keeps office assignment, explicit building, and derived PIN geometry separated', () => {
  const pack = createIndiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'IN');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeIndiaPostalCode('１０００００'), '100000');
  assert.equal(normalizeIndiaPostalCode('100 000'), '100000');
  assert.equal(normalizeIndiaPostalCode('IN-100000'), null);
  assert.equal(normalizeIndiaPostalCode('100-000'), null);
  assert.equal(normalizeIndiaPostalCode('000000'), null);
  assert.equal(normalizeIndiaPostalCode('10000'), null);
  assert.equal(normalizeIndiaPostalCode('1000000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('India PIN lookup canonicalizes six digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createIndiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('100 000', INDIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '100000', INDIA_POSTAL_CONTEXT_TEST_INSTANT, INDIA_POSTAL_CONTEXT_TEST_INSTANT, true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'IN');
  assert.equal(lookup.normalizedPostalCode, '100000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('India coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createIndiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...INDIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: INDIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'IN');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '100000', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component =>
    component.label === 'Synthetic explicitly linked India building'), true);
});

test('India bbox lookup returns only the synthetic derived PIN membership surface', () => {
  const runtime = new PostalContextPackRuntime(createIndiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [77.19, 28.60, 77.23, 28.63], INDIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '100000');
  assert.equal(result.matches[0]?.source.sourceId, 'in-synthetic-derived-pin-membership-surface');
});
