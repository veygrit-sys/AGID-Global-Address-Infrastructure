import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeIndonesiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  INDONESIA_POSTAL_CONTEXT_TEST_INSTANT,
  INDONESIA_POSTAL_CONTEXT_TEST_POINT,
  createIndonesiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextIndonesiaRuntimeFixture';

test('Indonesia pack keeps current assignment, explicit building, and derived locality geometry separated', () => {
  const pack = createIndonesiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'ID');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeIndonesiaPostalCode('１００００'), '10000');
  assert.equal(normalizeIndonesiaPostalCode('10 000'), '10000');
  assert.equal(normalizeIndonesiaPostalCode('ID-10000'), null);
  assert.equal(normalizeIndonesiaPostalCode('100-00'), null);
  assert.equal(normalizeIndonesiaPostalCode('00000'), null);
  assert.equal(normalizeIndonesiaPostalCode('1000'), null);
  assert.equal(normalizeIndonesiaPostalCode('100000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Indonesia postcode lookup canonicalizes five digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createIndonesiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('10 000', INDONESIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '10000', INDONESIA_POSTAL_CONTEXT_TEST_INSTANT, INDONESIA_POSTAL_CONTEXT_TEST_INSTANT, true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'ID');
  assert.equal(lookup.normalizedPostalCode, '10000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Indonesia coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createIndonesiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...INDONESIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: INDONESIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'ID');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '10000', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component =>
    component.label === 'Synthetic explicitly linked Indonesia building'), true);
});

test('Indonesia bbox lookup returns only the synthetic derived locality postal surface', () => {
  const runtime = new PostalContextPackRuntime(createIndonesiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [106.81, -6.19, 106.84, -6.16], INDONESIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '10000');
  assert.equal(result.matches[0]?.source.sourceId, 'id-synthetic-derived-locality-postal-surface');
});
