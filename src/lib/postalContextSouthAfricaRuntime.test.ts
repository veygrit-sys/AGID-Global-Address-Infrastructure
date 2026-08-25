import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeSouthAfricaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT,
  SOUTH_AFRICA_POSTAL_CONTEXT_TEST_POINT,
  createSouthAfricaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextSouthAfricaRuntimeFixture';

test('South Africa pack preserves four digits and non-area postal-delivery office semantics', () => {
  const pack = createSouthAfricaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'ZA');
  const postalFeature = pack.geometry.features.find(feature => feature.role === 'postal_area');
  const postalNode = pack.graph.nodes.find(node => node.kind === 'postal_feature');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSouthAfricaPostalCode('００００'), '0000');
  assert.equal(normalizeSouthAfricaPostalCode('00 00'), '0000');
  assert.equal(normalizeSouthAfricaPostalCode('ZA-0000'), null);
  assert.equal(normalizeSouthAfricaPostalCode('00-00'), null);
  assert.equal(normalizeSouthAfricaPostalCode('000'), null);
  assert.equal(normalizeSouthAfricaPostalCode('00000'), null);
  assert.equal(postalNode?.featureKind, 'po_box');
  assert.equal(postalNode?.geometryType, 'point');
  assert.equal(postalFeature?.geometry.type, 'Point');
});

test('South Africa postcode lookup returns typed point geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createSouthAfricaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00 00', SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT,
    SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'ZA');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Point');
});

test('South Africa coordinate resolution reaches building through explicit address relation only', () => {
  const runtime = new PostalContextPackRuntime(createSouthAfricaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...SOUTH_AFRICA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'ZA');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component =>
    component.label === 'Synthetic explicitly linked South Africa building'), true);
});

test('South Africa bbox lookup returns an office point and never invents a catchment', () => {
  const runtime = new PostalContextPackRuntime(createSouthAfricaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [28.18, -25.75, 28.20, -25.73],
    SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.geometry.type, 'Point');
  assert.equal(result.matches[0]?.source.sourceId, 'za-synthetic-post-office-point');
});
