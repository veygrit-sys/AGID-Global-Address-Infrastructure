import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeCzechiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  CZECHIA_POSTAL_CONTEXT_TEST_INSTANT,
  CZECHIA_POSTAL_CONTEXT_TEST_POINT,
  createCzechiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextCzechiaRuntimeFixture';

test('Czechia pack treats PSČ as routing assignment and its test surface as derived', () => {
  const pack = createCzechiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CZ');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeCzechiaPostalCode('００１２３'), '001 23');
  assert.equal(normalizeCzechiaPostalCode('00123'), '001 23');
  assert.equal(normalizeCzechiaPostalCode('001 23'), '001 23');
  assert.equal(normalizeCzechiaPostalCode('001-23'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Czechia PSČ lookup canonicalizes spacing and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createCzechiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00000', CZECHIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '000 00',
    CZECHIA_POSTAL_CONTEXT_TEST_INSTANT,
    CZECHIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CZ');
  assert.equal(lookup.normalizedPostalCode, '000 00');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Czechia coordinate resolution reaches a building only through the explicit RÚIAN fixture link', () => {
  const runtime = new PostalContextPackRuntime(createCzechiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...CZECHIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: CZECHIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CZ');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '000 00', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked RÚIAN building'),
    true,
  );
});

test('Czechia bbox lookup returns explicitly derived PSČ geometry', () => {
  const runtime = new PostalContextPackRuntime(createCzechiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [14.42, 50.065, 14.455, 50.086],
    CZECHIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '000 00');
  assert.equal(result.matches[0]?.source.sourceId, 'cz-synthetic-derived-psc-area');
});
