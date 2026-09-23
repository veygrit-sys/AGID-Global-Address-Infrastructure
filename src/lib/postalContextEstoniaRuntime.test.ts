import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeEstoniaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  ESTONIA_POSTAL_CONTEXT_TEST_INSTANT,
  ESTONIA_POSTAL_CONTEXT_TEST_POINT,
  createEstoniaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextEstoniaRuntimeFixture';

test('Estonia pack models a five-digit code with pinned AKS postal-area evidence', () => {
  const pack = createEstoniaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'EE');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeEstoniaPostalCode('００１２３'), '00123');
  assert.equal(normalizeEstoniaPostalCode('00 123'), '00123');
  assert.equal(normalizeEstoniaPostalCode('00-123'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Estonia postcode lookup exposes official-area-style geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createEstoniaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00000', ESTONIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    ESTONIA_POSTAL_CONTEXT_TEST_INSTANT,
    ESTONIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'EE');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Estonia coordinate resolution reaches a building only through an ADS object path', () => {
  const runtime = new PostalContextPackRuntime(createEstoniaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...ESTONIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: ESTONIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'EE');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic ADS Building'),
    true,
  );
});

test('Estonia bbox lookup returns the pinned postal-code area', () => {
  const runtime = new PostalContextPackRuntime(createEstoniaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [24.73, 59.42, 24.78, 59.45],
    ESTONIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'ee-synthetic-aks-postal-area');
});
