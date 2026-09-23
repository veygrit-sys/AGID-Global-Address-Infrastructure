import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeFinlandPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  FINLAND_POSTAL_CONTEXT_TEST_INSTANT,
  FINLAND_POSTAL_CONTEXT_TEST_POINT,
  createFinlandPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextFinlandRuntimeFixture';

test('Finland pack keeps Posti assignment, Paavo statistical geometry, and building evidence separated', () => {
  const pack = createFinlandPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'FI');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeFinlandPostalCode('０００００'), '00000');
  assert.equal(normalizeFinlandPostalCode('00 000'), '00000');
  assert.equal(normalizeFinlandPostalCode('FI-00000'), null);
  assert.equal(normalizeFinlandPostalCode('0000'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
  assert.notEqual(postalArea?.source.sourceId, 'posti-finland-official-polygon');
});

test('Finland postcode lookup preserves leading zeroes and exposes statistical geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createFinlandPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', FINLAND_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    FINLAND_POSTAL_CONTEXT_TEST_INSTANT,
    FINLAND_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'FI');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Finland coordinate resolution reaches a building only through an explicit permanent identifier relation', () => {
  const runtime = new PostalContextPackRuntime(createFinlandPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...FINLAND_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: FINLAND_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'FI');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic Ryhti building linked by permanent building identifier'),
    true,
  );
});

test('Finland bbox lookup returns only the synthetic Paavo-style statistical area', () => {
  const runtime = new PostalContextPackRuntime(createFinlandPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [24.921, 60.158, 24.956, 60.181],
    FINLAND_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'fi-synthetic-paavo-statistical-postcode-area');
});
