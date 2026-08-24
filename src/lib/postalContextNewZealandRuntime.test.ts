import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeNewZealandPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  NEW_ZEALAND_POSTAL_CONTEXT_TEST_INSTANT,
  NEW_ZEALAND_POSTAL_CONTEXT_TEST_POINT,
  createNewZealandPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextNewZealandRuntimeFixture';

test('New Zealand pack models a postcode as delivery-network geometry or a non-area', () => {
  const pack = createNewZealandPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'NZ');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeNewZealandPostalCode('０１２３'), '0123');
  assert.equal(normalizeNewZealandPostalCode('01 23'), '0123');
  assert.equal(normalizeNewZealandPostalCode('01-23'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('New Zealand postcode lookup returns network geometry only on explicit opt-in', () => {
  const runtime = new PostalContextPackRuntime(createNewZealandPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('0000', NEW_ZEALAND_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    NEW_ZEALAND_POSTAL_CONTEXT_TEST_INSTANT,
    NEW_ZEALAND_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'NZ');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('New Zealand coordinate resolution requires source-linked address and building evidence', () => {
  const runtime = new PostalContextPackRuntime(createNewZealandPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...NEW_ZEALAND_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: NEW_ZEALAND_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'NZ');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic Building'),
    true,
  );
});

test('New Zealand bbox lookup returns the synthetic PNF-style delivery area', () => {
  const runtime = new PostalContextPackRuntime(createNewZealandPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [174.77, -41.31, 174.79, -41.29],
    NEW_ZEALAND_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'nz-synthetic-pnf-postcode-area');
});
