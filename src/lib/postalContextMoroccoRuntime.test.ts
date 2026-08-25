import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeMoroccoPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  MOROCCO_POSTAL_CONTEXT_TEST_INSTANT,
  MOROCCO_POSTAL_CONTEXT_TEST_POINT,
  createMoroccoPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextMoroccoRuntimeFixture';

test('Morocco pack keeps typed assignment, explicit building, and derived sector geometry separated', () => {
  const pack = createMoroccoPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MA');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeMoroccoPostalCode('０００００'), '00000');
  assert.equal(normalizeMoroccoPostalCode('00 000'), '00000');
  assert.equal(normalizeMoroccoPostalCode('MA-00000'), null);
  assert.equal(normalizeMoroccoPostalCode('000-00'), null);
  assert.equal(normalizeMoroccoPostalCode('0000'), null);
  assert.equal(normalizeMoroccoPostalCode('000000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Morocco validation rejects postal-area geometry for agency, P.O. box, and recipient code types', () => {
  const pack = createMoroccoPostalContextRuntimeTestPack();
  const postalNode = pack.graph.nodes.find(node => node.postalCode === '00000');
  assert.ok(postalNode);

  postalNode.postalCode = '00002';
  const agencyValidation = validatePostalContextRuntimePack(pack, 'MA');
  assert.equal(agencyValidation.valid, false);
  assert.equal(agencyValidation.errors.some(error => error.includes('morocco-non-area-postcode-has-postal-area')), true);

  postalNode.postalCode = '00009';
  const recipientValidation = validatePostalContextRuntimePack(pack, 'MA');
  assert.equal(recipientValidation.valid, false);
  assert.equal(recipientValidation.errors.some(error => error.includes('morocco-non-area-postcode-has-postal-area')), true);
});

test('Morocco postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createMoroccoPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 000', MOROCCO_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000', MOROCCO_POSTAL_CONTEXT_TEST_INSTANT, MOROCCO_POSTAL_CONTEXT_TEST_INSTANT, true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'MA');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Morocco coordinate resolution reaches a building only through explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createMoroccoPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...MOROCCO_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: MOROCCO_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MA');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component =>
    component.label === 'Synthetic explicitly linked Morocco building'), true);
});

test('Morocco bbox lookup returns only the synthetic derived home-delivery-sector surface', () => {
  const runtime = new PostalContextPackRuntime(createMoroccoPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [-6.86, 34.00, -6.82, 34.04], MOROCCO_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'ma-synthetic-derived-home-delivery-sector-surface');
});
