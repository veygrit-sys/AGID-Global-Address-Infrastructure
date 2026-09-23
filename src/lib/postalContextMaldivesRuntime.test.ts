import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeMaldivesPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { MALDIVES_POSTAL_CONTEXT_TEST_INSTANT, MALDIVES_POSTAL_CONTEXT_TEST_POINT, createMaldivesPostalContextRuntimeTestPack } from '../testFixtures/postalContextMaldivesRuntimeFixture';

test('Maldives pack keeps current assignment, island administrative join, digital address, and building relation separated', () => {
  const pack = createMaldivesPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MV');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeMaldivesPostalCode('٩٩ ٩٩٩'), '99999');
  assert.equal(normalizeMaldivesPostalCode('MV-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'mv-synthetic-island-administrative-join-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Maldives postcode lookup canonicalizes spacing and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createMaldivesPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('٩٩ ٩٩٩', MALDIVES_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', MALDIVES_POSTAL_CONTEXT_TEST_INSTANT, MALDIVES_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'MV');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Maldives coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createMaldivesPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...MALDIVES_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MALDIVES_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MV');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Maldives building'), true);
});

test('Maldives bbox lookup returns only the synthetic island administrative join surface', () => {
  const runtime = new PostalContextPackRuntime(createMaldivesPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([73.48, 4.18, 73.52, 4.22], MALDIVES_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'mv-synthetic-island-administrative-join-surface');
});
