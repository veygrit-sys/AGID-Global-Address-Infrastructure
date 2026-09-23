import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeEgyptPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  EGYPT_POSTAL_CONTEXT_TEST_INSTANT,
  EGYPT_POSTAL_CONTEXT_TEST_POINT,
  createEgyptPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextEgyptRuntimeFixture';

test('Egypt pack keeps seven-digit assignment, building group, explicit building, and derived geometry separated', () => {
  const pack = createEgyptPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'EG');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeEgyptPostalCode('０００００００'), '0000000');
  assert.equal(normalizeEgyptPostalCode('00 0 00 00'), '0000000');
  assert.equal(normalizeEgyptPostalCode('EG-0000000'), null);
  assert.equal(normalizeEgyptPostalCode('000-0000'), null);
  assert.equal(normalizeEgyptPostalCode('00000'), null);
  assert.equal(normalizeEgyptPostalCode('000000'), null);
  assert.equal(normalizeEgyptPostalCode('00000000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Egypt postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createEgyptPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 0 00 00', EGYPT_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000000', EGYPT_POSTAL_CONTEXT_TEST_INSTANT, EGYPT_POSTAL_CONTEXT_TEST_INSTANT, true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'EG');
  assert.equal(lookup.normalizedPostalCode, '0000000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Egypt coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createEgyptPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...EGYPT_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: EGYPT_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'EG');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000000', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component =>
    component.label === 'Synthetic explicitly linked Egypt building'), true);
});

test('Egypt bbox lookup returns only the synthetic derived building-group surface', () => {
  const runtime = new PostalContextPackRuntime(createEgyptPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [31.225, 30.035, 31.246, 30.054], EGYPT_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '0000000');
  assert.equal(result.matches[0]?.source.sourceId, 'eg-synthetic-derived-building-group-surface');
});
