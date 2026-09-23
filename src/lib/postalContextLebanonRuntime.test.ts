import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeLebanonPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { LEBANON_POSTAL_CONTEXT_TEST_INSTANT, LEBANON_POSTAL_CONTEXT_TEST_POINT, createLebanonPostalContextRuntimeTestPack } from '../testFixtures/postalContextLebanonRuntimeFixture';

test('Lebanon pack separates postal assignment, NAC, administrative P-code, derived surface, building, and AGID', () => {
  const pack = createLebanonPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'LB');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeLebanonPostalCode('٩٩٩٩'), '9999');
  assert.equal(normalizeLebanonPostalCode('٩٩ ٩٩٩ ٩٩٩'), '99 999 999');
  assert.equal(normalizeLebanonPostalCode('LB-9999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'lb-synthetic-postal-administrative-join-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Lebanon postcode lookup canonicalizes Arabic digits and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createLebanonPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('٩٩٩٩', LEBANON_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('9999', LEBANON_POSTAL_CONTEXT_TEST_INSTANT, LEBANON_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'LB');
  assert.equal(lookup.normalizedPostalCode, '9999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Lebanon coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createLebanonPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...LEBANON_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: LEBANON_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'LB');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Lebanon building'), true);
});

test('Lebanon bbox lookup returns only the synthetic postal-administrative join surface', () => {
  const runtime = new PostalContextPackRuntime(createLebanonPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([35.68, 33.58, 35.72, 33.62], LEBANON_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '9999');
  assert.equal(result.matches[0]?.source.sourceId, 'lb-synthetic-postal-administrative-join-surface');
});
