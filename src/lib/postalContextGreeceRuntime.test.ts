import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeGreecePostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  GREECE_POSTAL_CONTEXT_TEST_INSTANT,
  GREECE_POSTAL_CONTEXT_TEST_POINT,
  createGreecePostalContextRuntimeTestPack,
} from '../testFixtures/postalContextGreeceRuntimeFixture';

test('Greece pack canonicalizes five digits to NNN NN without inventing a polygon', () => {
  const pack = createGreecePostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'GR');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeGreecePostalCode('１０５６３'), '105 63');
  assert.equal(normalizeGreecePostalCode('10563'), '105 63');
  assert.equal(normalizeGreecePostalCode('105 63'), '105 63');
  assert.equal(normalizeGreecePostalCode('GR-10563'), null);
  assert.equal(normalizeGreecePostalCode('105-63'), null);
  assert.equal(normalizeGreecePostalCode('1056'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Greece postcode lookup normalizes spacing and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createGreecePostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00000', GREECE_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '000 00',
    GREECE_POSTAL_CONTEXT_TEST_INSTANT,
    GREECE_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'GR');
  assert.equal(lookup.normalizedPostalCode, '000 00');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Greece coordinate resolution reaches a building only through an explicit synthetic link', () => {
  const runtime = new PostalContextPackRuntime(createGreecePostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...GREECE_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: GREECE_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'GR');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '000 00', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked Greek building'),
    true,
  );
});

test('Greece bbox lookup returns only an explicitly derived address-membership surface', () => {
  const runtime = new PostalContextPackRuntime(createGreecePostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [23.71, 37.97, 23.74, 38.00],
    GREECE_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '000 00');
  assert.equal(result.matches[0]?.source.sourceId, 'gr-synthetic-derived-address-membership-surface');
});
