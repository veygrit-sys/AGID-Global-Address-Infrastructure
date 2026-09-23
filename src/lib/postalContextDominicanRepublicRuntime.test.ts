import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeDominicanRepublicPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_INSTANT,
  DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_POINT,
  createDominicanRepublicPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextDominicanRepublicRuntimeFixture';

test('Dominican pack keeps assignment, derived review geometry, explicit building relation, and AGID separate', () => {
  const pack = createDominicanRepublicPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'DO');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeDominicanRepublicPostalCode('９９９９９'), '99999');
  assert.equal(normalizeDominicanRepublicPostalCode('99 999'), '99999');
  assert.equal(normalizeDominicanRepublicPostalCode('DO-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'do-synthetic-derived-postal-area-review-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_geometry');
});

test('Dominican postcode lookup normalizes five digits and gates synthetic derived review geometry', () => {
  const runtime = new PostalContextPackRuntime(createDominicanRepublicPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 999', DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '99999',
    DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_INSTANT,
    DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'DO');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Dominican coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createDominicanRepublicPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'DO');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Dominican building'),
    true,
  );
});

test('Dominican bbox lookup returns only the synthetic derived postal-area review surface', () => {
  const runtime = new PostalContextPackRuntime(createDominicanRepublicPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [-69.93, 18.46, -69.89, 18.50],
    DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_INSTANT,
  );
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '99999');
  assert.equal(result.matches[0]?.source.sourceId, 'do-synthetic-derived-postal-area-review-polygon');
});
