import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeJordanPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { JORDAN_POSTAL_CONTEXT_TEST_INSTANT, JORDAN_POSTAL_CONTEXT_TEST_POINT, createJordanPostalContextRuntimeTestPack } from '../testFixtures/postalContextJordanRuntimeFixture';

test('Jordan pack separates five-digit routing assignment, derived surface, civic address, building, and AGID', () => {
  const pack = createJordanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'JO');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeJordanPostalCode('٩٩ ٩٩٩'), '99999');
  assert.equal(normalizeJordanPostalCode('JO-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'jo-synthetic-routing-administrative-join-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Jordan postcode lookup canonicalizes Arabic digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createJordanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('۹۹ ۹۹۹', JORDAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', JORDAN_POSTAL_CONTEXT_TEST_INSTANT, JORDAN_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'JO');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Jordan coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createJordanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...JORDAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: JORDAN_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'JO');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Jordan building'), true);
});

test('Jordan bbox lookup returns only the synthetic routing-administrative join surface', () => {
  const runtime = new PostalContextPackRuntime(createJordanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([35.91, 31.93, 35.95, 31.97], JORDAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'jo-synthetic-routing-administrative-join-surface');
});
