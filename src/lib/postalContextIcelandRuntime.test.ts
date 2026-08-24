import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeIcelandPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  ICELAND_POSTAL_CONTEXT_TEST_INSTANT,
  ICELAND_POSTAL_CONTEXT_TEST_POINT,
  createIcelandPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextIcelandRuntimeFixture';

test('Iceland pack models a three-digit postcode as official-area evidence', () => {
  const pack = createIcelandPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'IS');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeIcelandPostalCode('００１'), '001');
  assert.equal(normalizeIcelandPostalCode('0 01'), '001');
  assert.equal(normalizeIcelandPostalCode('0-01'), null);
  assert.equal(postalArea?.quality.status, 'verified');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Iceland postcode lookup returns IS 50V-style geometry only on explicit opt-in', () => {
  const runtime = new PostalContextPackRuntime(createIcelandPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('000', ICELAND_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '000',
    ICELAND_POSTAL_CONTEXT_TEST_INSTANT,
    ICELAND_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'IS');
  assert.equal(lookup.normalizedPostalCode, '000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Iceland coordinate resolution requires a source-linked address and building path', () => {
  const runtime = new PostalContextPackRuntime(createIcelandPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...ICELAND_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: ICELAND_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'IS');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic Building'),
    true,
  );
});

test('Iceland bbox lookup returns the synthetic postcode polygon', () => {
  const runtime = new PostalContextPackRuntime(createIcelandPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [-21.96, 64.14, -21.92, 64.16],
    ICELAND_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '000');
  assert.equal(result.matches[0]?.source.sourceId, 'is-synthetic-is50v-postcode-area');
});
