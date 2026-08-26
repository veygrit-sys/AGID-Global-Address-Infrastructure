import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeMalaysiaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { MALAYSIA_POSTAL_CONTEXT_TEST_INSTANT, MALAYSIA_POSTAL_CONTEXT_TEST_POINT, createMalaysiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextMalaysiaRuntimeFixture';

test('Malaysia pack keeps current assignment, administrative join, digital address, and building relation separated', () => {
  const pack = createMalaysiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MY');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeMalaysiaPostalCode('９９ ９９９'), '99999');
  assert.equal(normalizeMalaysiaPostalCode('MY-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'my-synthetic-administrative-join-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Malaysia postcode lookup canonicalizes spacing and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createMalaysiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('９９ ９９９', MALAYSIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', MALAYSIA_POSTAL_CONTEXT_TEST_INSTANT, MALAYSIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'MY');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Malaysia coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createMalaysiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...MALAYSIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MALAYSIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MY');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Malaysia building'), true);
});

test('Malaysia bbox lookup returns only the synthetic administrative join surface', () => {
  const runtime = new PostalContextPackRuntime(createMalaysiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([100.98, 2.98, 101.02, 3.02], MALAYSIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'my-synthetic-administrative-join-surface');
});
