import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeBrazilPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { BRAZIL_POSTAL_CONTEXT_TEST_INSTANT, BRAZIL_POSTAL_CONTEXT_TEST_POINT, createBrazilPostalContextRuntimeTestPack } from '../testFixtures/postalContextBrazilRuntimeFixture';

test('Brazilian pack keeps typed CEP, derived review geometry, explicit building relation, and AGID separate', () => {
  const pack = createBrazilPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'BR');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeBrazilPostalCode('９９９９９－９９９'), '99999-999');
  assert.equal(normalizeBrazilPostalCode('99999999'), '99999-999');
  assert.equal(normalizeBrazilPostalCode('99999 999'), '99999-999');
  assert.equal(normalizeBrazilPostalCode('BR-99999-999'), null);
  assert.equal(normalizeBrazilPostalCode('99-999-999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'br-synthetic-derived-postal-area-review-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_geometry');
});

test('Brazilian postcode lookup canonicalizes eight digits and gates synthetic derived-review geometry', () => {
  const runtime = new PostalContextPackRuntime(createBrazilPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99999999', BRAZIL_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999-999', BRAZIL_POSTAL_CONTEXT_TEST_INSTANT, BRAZIL_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'BR');
  assert.equal(lookup.normalizedPostalCode, '99999-999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Brazilian coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createBrazilPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...BRAZIL_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: BRAZIL_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'BR');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999-999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Brazilian building'), true);
});

test('Brazilian bbox lookup returns only the synthetic derived postal-area review surface', () => {
  const runtime = new PostalContextPackRuntime(createBrazilPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-46.66, -23.58, -46.60, -23.52], BRAZIL_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999-999');
  assert.equal(result.matches[0]?.source.sourceId, 'br-synthetic-derived-postal-area-review-polygon');
});
