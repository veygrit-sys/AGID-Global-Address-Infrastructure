import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeLithuaniaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  LITHUANIA_POSTAL_CONTEXT_TEST_INSTANT,
  LITHUANIA_POSTAL_CONTEXT_TEST_POINT,
  createLithuaniaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextLithuaniaRuntimeFixture';

test('Lithuania pack treats LT-NNNNN as address-membership evidence, not an official polygon', () => {
  const pack = createLithuaniaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'LT');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeLithuaniaPostalCode('ＬＴ－０００００'), 'LT-00000');
  assert.equal(normalizeLithuaniaPostalCode('lt 00000'), 'LT-00000');
  assert.equal(normalizeLithuaniaPostalCode('LV-00000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Lithuania postcode lookup normalizes the country prefix and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createLithuaniaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('lt 00000', LITHUANIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    LITHUANIA_POSTAL_CONTEXT_TEST_INSTANT,
    LITHUANIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'LT');
  assert.equal(lookup.normalizedPostalCode, 'LT-00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Lithuania coordinate resolution reaches an NTR building only through an explicit link', () => {
  const runtime = new PostalContextPackRuntime(createLithuaniaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...LITHUANIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: LITHUANIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'LT');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: 'LT-00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked Registrų centras NTR building'),
    true,
  );
});

test('Lithuania bbox lookup returns only an explicitly derived membership surface', () => {
  const runtime = new PostalContextPackRuntime(createLithuaniaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [25.25, 54.66, 25.31, 54.71],
    LITHUANIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, 'LT-00000');
  assert.equal(result.matches[0]?.source.sourceId, 'lt-synthetic-derived-address-membership-surface');
});
