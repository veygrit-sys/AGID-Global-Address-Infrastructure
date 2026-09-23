import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeSomaliaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { SOMALIA_POSTAL_CONTEXT_TEST_INSTANT, SOMALIA_POSTAL_CONTEXT_TEST_POINT, createSomaliaPostalContextRuntimeTestPack } from '../testFixtures/postalContextSomaliaRuntimeFixture';

test('Somalia pack accepts only the observed AA plus five-digit shape without claiming assignments or polygons', () => {
  const pack = createSomaliaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'SO');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSomaliaPostalCode('bn03010'), 'BN 03010');
  assert.equal(normalizeSomaliaPostalCode('BN 03010'), 'BN 03010');
  assert.equal(normalizeSomaliaPostalCode('BN 010'), null);
  assert.equal(normalizeSomaliaPostalCode('03010'), null);
  assert.equal(normalizeSomaliaPostalCode('P.O. Box 67'), null);
  assert.equal(pack.graph.nodes.some(node => node.kind === 'postal_feature'), false);
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
});

test('Somalia structure-valid but unassigned synthetic postcode returns no match and no invented geometry', () => {
  const runtime = new PostalContextPackRuntime(createSomaliaPostalContextRuntimeTestPack());
  const result = runtime.lookupPostalCode('bn99999', SOMALIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.equal(result.countryCode, 'SO');
  assert.equal(result.normalizedPostalCode, 'BN 99999');
  assert.deepEqual(result.postalFeatures, []);
  assert.deepEqual(result.geometries, []);
});

test('Somalia coordinate resolution reaches building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createSomaliaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...SOMALIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: SOMALIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'SO');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly rights-cleared civic-address-linked Somalia building'), true);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic Somalia AGID conflict-sensitive fallback cover'), true);
});

test('Somalia bbox postcode lookup returns no match because no authoritative postal surface exists', () => {
  const runtime = new PostalContextPackRuntime(createSomaliaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([45.30, 2.03, 45.33, 2.06], SOMALIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
