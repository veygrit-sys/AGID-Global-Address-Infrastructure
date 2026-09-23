import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeKuwaitPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  KUWAIT_POSTAL_CONTEXT_TEST_INSTANT,
  KUWAIT_POSTAL_CONTEXT_TEST_POINT,
  createKuwaitPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextKuwaitRuntimeFixture';

test('Kuwait pack keeps five-digit block assignment, explicit building, and derived geometry separated', () => {
  const pack = createKuwaitPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'KW');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeKuwaitPostalCode('０００００'), '00000');
  assert.equal(normalizeKuwaitPostalCode('00 000'), '00000');
  assert.equal(normalizeKuwaitPostalCode('KW-00000'), null);
  assert.equal(normalizeKuwaitPostalCode('000-00'), null);
  assert.equal(normalizeKuwaitPostalCode('0000'), null);
  assert.equal(normalizeKuwaitPostalCode('000000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Kuwait postcode lookup preserves five digits and exposes derived block geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createKuwaitPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', KUWAIT_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000', KUWAIT_POSTAL_CONTEXT_TEST_INSTANT, KUWAIT_POSTAL_CONTEXT_TEST_INSTANT, true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'KW');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Kuwait coordinate resolution reaches a building only through explicit PACI civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createKuwaitPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...KUWAIT_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: KUWAIT_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'KW');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component =>
    component.label === 'Synthetic explicitly linked Kuwait building'), true);
});

test('Kuwait bbox lookup returns only the synthetic derived block postal surface', () => {
  const runtime = new PostalContextPackRuntime(createKuwaitPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [47.96, 29.36, 47.99, 29.39], KUWAIT_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'kw-synthetic-derived-block-postal-surface');
});
