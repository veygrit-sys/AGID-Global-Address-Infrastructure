import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeNetherlandsPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
  NETHERLANDS_POSTAL_CONTEXT_TEST_POINT,
  createNetherlandsPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextNetherlandsRuntimeFixture';

test('Netherlands pack keeps PC6 assignment separate from its derived area', () => {
  const pack = createNetherlandsPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'NL');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeNetherlandsPostalCode('００００ａａ'), '0000 AA');
  assert.equal(normalizeNetherlandsPostalCode('0000-AA'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'none');
});

test('Netherlands PC6 lookup exposes derived geometry only on explicit opt-in', () => {
  const runtime = new PostalContextPackRuntime(createNetherlandsPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode(
    '0000aa',
    NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
  );
  const withGeometry = runtime.lookupPostalCode(
    '0000 AA',
    NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
    NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'NL');
  assert.equal(lookup.normalizedPostalCode, '0000 AA');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Netherlands coordinate resolution uses BAG-like address evidence for building detail', () => {
  const runtime = new PostalContextPackRuntime(createNetherlandsPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...NETHERLANDS_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'NL');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000 AA', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic BAG Building'),
    true,
  );
});

test('Netherlands bbox lookup returns the derived PC6 surface without calling it official', () => {
  const runtime = new PostalContextPackRuntime(createNetherlandsPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [4.89, 52.36, 4.91, 52.38],
    NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000 AA');
});
