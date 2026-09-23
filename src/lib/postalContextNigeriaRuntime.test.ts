import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeNigeriaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  NIGERIA_POSTAL_CONTEXT_TEST_INSTANT,
  NIGERIA_POSTAL_CONTEXT_TEST_POINT,
  createNigeriaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextNigeriaRuntimeFixture';

test('Nigeria pack separates current numeric syntax, future digital syntax, assignment time, derived surface, address, building and AGID', () => {
  const pack = createNigeriaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'NG');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeNigeriaPostalCode('９９９９９６'), '999996');
  assert.equal(normalizeNigeriaPostalCode('fc 02-a09 db 09'), 'FC02A09DB09');
  assert.equal(normalizeNigeriaPostalCode('P.O. Box 999996'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Nigeria runtime rejects eleven-character assignment evidence before the scheduled nationwide effective date', () => {
  const pack = createNigeriaPostalContextRuntimeTestPack();
  const postalNode = pack.graph.nodes.find(node => node.kind === 'postal_feature');
  assert.ok(postalNode);
  postalNode.postalCode = 'ZZ99ZZZAA99';
  const prelaunch = validatePostalContextRuntimePack(pack, 'NG');
  assert.equal(prelaunch.valid, false);
  assert.ok(prelaunch.errors.some(error => error.startsWith('nigeria-digital-postcode-before-effective-date:')));

  for (const assertion of pack.graph.assertions) {
    if (assertion.fromNodeId === postalNode.id || assertion.toNodeId === postalNode.id) {
      assertion.validTime.from = '2026-09-30T23:00:00.000Z';
    }
  }
  const effective = validatePostalContextRuntimePack(pack, 'NG');
  assert.equal(effective.valid, true, effective.errors.join('\n'));
});

test('Nigeria postcode lookup exposes synthetic derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createNigeriaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('999 996', NIGERIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('999996', NIGERIA_POSTAL_CONTEXT_TEST_INSTANT, NIGERIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'NG');
  assert.equal(lookup.normalizedPostalCode, '999996');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'ng-synthetic-derived-administrative-postal-review-surface');
});

test('Nigeria coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createNigeriaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...NIGERIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: NIGERIA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'NG');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '999996', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label.includes('civic-address-linked')), true);
});

test('Nigeria bbox lookup returns only the synthetic derived administrative review surface', () => {
  const runtime = new PostalContextPackRuntime(createNigeriaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([7.37, 9.05, 7.43, 9.11], NIGERIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '999996');
  assert.equal(result.matches[0]?.source.sourceId, 'ng-synthetic-derived-administrative-postal-review-surface');
});
