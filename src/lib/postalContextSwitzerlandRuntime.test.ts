import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeSwitzerlandPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  SWITZERLAND_POSTAL_CONTEXT_TEST_INSTANT,
  SWITZERLAND_POSTAL_CONTEXT_TEST_POINT,
  createSwitzerlandPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextSwitzerlandRuntimeFixture';

test('Switzerland pack models a four-digit code with pinned PLZO perimeter evidence', () => {
  const pack = createSwitzerlandPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CH');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSwitzerlandPostalCode('００１２'), '0012');
  assert.equal(normalizeSwitzerlandPostalCode('00 12'), '0012');
  assert.equal(normalizeSwitzerlandPostalCode('00-12'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Switzerland postcode lookup exposes PLZO-style geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createSwitzerlandPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('0000', SWITZERLAND_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    SWITZERLAND_POSTAL_CONTEXT_TEST_INSTANT,
    SWITZERLAND_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CH');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Switzerland coordinate resolution reaches a building only through an EGID-linked path', () => {
  const runtime = new PostalContextPackRuntime(createSwitzerlandPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...SWITZERLAND_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: SWITZERLAND_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CH');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic EGID Building'),
    true,
  );
});

test('Switzerland bbox lookup returns the pinned PLZO perimeter', () => {
  const runtime = new PostalContextPackRuntime(createSwitzerlandPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [7.43, 46.94, 7.46, 46.96],
    SWITZERLAND_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'ch-synthetic-swisstopo-plzo');
});
