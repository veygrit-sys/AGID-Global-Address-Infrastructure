import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeTunisiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  TUNISIA_POSTAL_CONTEXT_TEST_INSTANT,
  TUNISIA_POSTAL_CONTEXT_TEST_POINT,
  createTunisiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextTunisiaRuntimeFixture';

test('Tunisia pack separates syntax, current assignment, derived admin surface, civic address, building and AGID', () => {
  const pack = createTunisiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'TN');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeTunisiaPostalCode('０９９６'), '0996');
  assert.equal(normalizeTunisiaPostalCode('09 96'), '0996');
  assert.equal(normalizeTunisiaPostalCode('TN-0996'), null);
  assert.equal(normalizeTunisiaPostalCode('B.P. 0996'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Tunisia postcode lookup exposes synthetic derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createTunisiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('09 96', TUNISIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('0996', TUNISIA_POSTAL_CONTEXT_TEST_INSTANT, TUNISIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'TN');
  assert.equal(lookup.normalizedPostalCode, '0996');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'tn-synthetic-derived-administrative-postal-review-surface');
});

test('Tunisia coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createTunisiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...TUNISIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: TUNISIA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'TN');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0996', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label.includes('civic-address-linked')), true);
});

test('Tunisia bbox lookup returns only the synthetic derived administrative review surface', () => {
  const runtime = new PostalContextPackRuntime(createTunisiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([10.16, 36.78, 10.21, 36.83], TUNISIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '0996');
  assert.equal(result.matches[0]?.source.sourceId, 'tn-synthetic-derived-administrative-postal-review-surface');
});
