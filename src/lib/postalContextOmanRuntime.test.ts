import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeOmanPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  OMAN_POSTAL_CONTEXT_TEST_INSTANT,
  OMAN_POSTAL_CONTEXT_TEST_POINT,
  createOmanPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextOmanRuntimeFixture';

test('Oman pack keeps the three-digit post-office code as point geometry rather than a polygon', () => {
  const pack = createOmanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'OM');
  const postalFeature = pack.geometry.features.find(feature => feature.role === 'postal_area');
  const postalNode = pack.graph.nodes.find(node => node.kind === 'postal_feature');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeOmanPostalCode('０００'), '000');
  assert.equal(normalizeOmanPostalCode('0 00'), '000');
  assert.equal(normalizeOmanPostalCode('OM-000'), null);
  assert.equal(normalizeOmanPostalCode('00-0'), null);
  assert.equal(normalizeOmanPostalCode('00'), null);
  assert.equal(normalizeOmanPostalCode('0000'), null);
  assert.equal(postalNode?.featureKind, 'po_box');
  assert.equal(postalNode?.geometryType, 'point');
  assert.equal(postalFeature?.geometry.type, 'Point');
});

test('Oman postcode lookup returns the synthetic office point only on geometry opt-in', () => {
  const runtime = new PostalContextPackRuntime(createOmanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('0 00', OMAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '000',
    OMAN_POSTAL_CONTEXT_TEST_INSTANT,
    OMAN_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'OM');
  assert.equal(lookup.normalizedPostalCode, '000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Point');
});

test('Oman coordinate resolution reaches a building only through the explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createOmanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...OMAN_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: OMAN_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'OM');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked Oman building'),
    true,
  );
});

test('Oman bbox lookup returns a point and never invents a postal surface', () => {
  const runtime = new PostalContextPackRuntime(createOmanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [58.40, 23.58, 58.41, 23.59],
    OMAN_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '000');
  assert.equal(result.matches[0]?.geometry.type, 'Point');
  assert.equal(result.matches[0]?.source.sourceId, 'om-synthetic-post-office-point');
});
