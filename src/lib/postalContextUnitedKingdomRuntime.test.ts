import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeUnitedKingdomPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  UNITED_KINGDOM_POSTAL_CONTEXT_TEST_INSTANT,
  UNITED_KINGDOM_POSTAL_CONTEXT_TEST_POINT,
  createUnitedKingdomPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextUnitedKingdomRuntimeFixture';

test('United Kingdom pack keeps Royal Mail assignment separate from derived geometry', () => {
  const pack = createUnitedKingdomPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'GB');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeUnitedKingdomPostalCode('ｓｗ１ａ１ａａ'), 'SW1A 1AA');
  assert.equal(normalizeUnitedKingdomPostalCode('GIR0AA'), 'GIR 0AA');
  assert.equal(normalizeUnitedKingdomPostalCode('SW1A-1AA'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'none');
});

test('United Kingdom postcode lookup gates a derived surface behind explicit opt-in', () => {
  const runtime = new PostalContextPackRuntime(createUnitedKingdomPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode(
    'zz00zz',
    UNITED_KINGDOM_POSTAL_CONTEXT_TEST_INSTANT,
  );
  const withGeometry = runtime.lookupPostalCode(
    'ZZ0 0ZZ',
    UNITED_KINGDOM_POSTAL_CONTEXT_TEST_INSTANT,
    UNITED_KINGDOM_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'GB');
  assert.equal(lookup.normalizedPostalCode, 'ZZ0 0ZZ');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('United Kingdom coordinate resolution requires address-point evidence for building detail', () => {
  const runtime = new PostalContextPackRuntime(createUnitedKingdomPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...UNITED_KINGDOM_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: UNITED_KINGDOM_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'GB');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: 'ZZ0 0ZZ', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic Addressable Building'),
    true,
  );
});

test('United Kingdom bbox lookup returns derived geometry without calling it official', () => {
  const runtime = new PostalContextPackRuntime(createUnitedKingdomPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [-0.13, 51.49, -0.11, 51.51],
    UNITED_KINGDOM_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, 'ZZ0 0ZZ');
  assert.equal(result.matches[0]?.source.sourceId, 'gb-synthetic-derived-postcode-area');
});
