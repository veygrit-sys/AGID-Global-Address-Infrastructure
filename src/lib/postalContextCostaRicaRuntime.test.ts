import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeCostaRicaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  COSTA_RICA_POSTAL_CONTEXT_TEST_INSTANT,
  COSTA_RICA_POSTAL_CONTEXT_TEST_POINT,
  createCostaRicaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextCostaRicaRuntimeFixture';

test('Costa Rica pack keeps district derivation, civic building relation, and AGID evidence separate', () => {
  const pack = createCostaRicaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CR');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeCostaRicaPostalCode('７９９９９'), '79999');
  assert.equal(normalizeCostaRicaPostalCode('79 999'), '79999');
  assert.equal(normalizeCostaRicaPostalCode('99 999'), null);
  assert.equal(normalizeCostaRicaPostalCode('CR-79999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'cr-synthetic-district-postcode-validation-polygon');
  assert.notEqual(postalArea?.source.geometryAuthority, 'official_postal_operator_release_polygon');
});

test('Costa Rica postcode lookup normalizes five digits and gates synthetic polygon geometry', () => {
  const runtime = new PostalContextPackRuntime(createCostaRicaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('79 999', COSTA_RICA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '79999',
    COSTA_RICA_POSTAL_CONTEXT_TEST_INSTANT,
    COSTA_RICA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CR');
  assert.equal(lookup.normalizedPostalCode, '79999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Costa Rica coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createCostaRicaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...COSTA_RICA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: COSTA_RICA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CR');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '79999', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Costa Rica building'),
    true,
  );
});

test('Costa Rica bbox lookup returns only the synthetic district-postcode validation polygon', () => {
  const runtime = new PostalContextPackRuntime(createCostaRicaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-84.02, 9.73, -83.98, 9.77], COSTA_RICA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '79999');
  assert.equal(result.matches[0]?.source.sourceId, 'cr-synthetic-district-postcode-validation-polygon');
});
