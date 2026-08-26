import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeCanadaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  CANADA_POSTAL_CONTEXT_TEST_INSTANT,
  CANADA_POSTAL_CONTEXT_TEST_POINT,
  createCanadaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextCanadaRuntimeFixture';

test('Canada pack keeps LDU semantics, synthetic geometry, civic building relation, and AGID separate', () => {
  const pack = createCanadaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CA');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeCanadaPostalCode('ｈ９ｈ９ｈ９'), 'H9H 9H9');
  assert.equal(normalizeCanadaPostalCode('h9h 9h9'), 'H9H 9H9');
  assert.equal(normalizeCanadaPostalCode('CA-H9H 9H9'), null);
  assert.equal(normalizeCanadaPostalCode('H9H-9H9'), null);
  assert.equal(normalizeCanadaPostalCode('D9D 9D9'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'ca-synthetic-delivery-unit-validation-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_release_polygon');
});

test('Canada postcode lookup canonicalizes FSA and LDU and gates synthetic polygon geometry', () => {
  const runtime = new PostalContextPackRuntime(createCanadaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('h9h9h9', CANADA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    'H9H 9H9',
    CANADA_POSTAL_CONTEXT_TEST_INSTANT,
    CANADA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CA');
  assert.equal(lookup.normalizedPostalCode, 'H9H 9H9');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Canada coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createCanadaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...CANADA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: CANADA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CA');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: 'H9H 9H9', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Canada building'),
    true,
  );
});

test('Canada bbox lookup returns only the synthetic delivery-unit validation polygon', () => {
  const runtime = new PostalContextPackRuntime(createCanadaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-106.02, 55.98, -105.98, 56.02], CANADA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, 'H9H 9H9');
  assert.equal(result.matches[0]?.source.sourceId, 'ca-synthetic-delivery-unit-validation-polygon');
});
