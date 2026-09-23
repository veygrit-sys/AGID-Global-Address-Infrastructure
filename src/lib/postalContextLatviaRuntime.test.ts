import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeLatviaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  LATVIA_POSTAL_CONTEXT_TEST_INSTANT,
  LATVIA_POSTAL_CONTEXT_TEST_POINT,
  createLatviaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextLatviaRuntimeFixture';

test('Latvia pack treats LV-NNNN as address-range evidence, not a universal official polygon', () => {
  const pack = createLatviaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'LV');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeLatviaPostalCode('ＬＶ－００００'), 'LV-0000');
  assert.equal(normalizeLatviaPostalCode('lv 0000'), 'LV-0000');
  assert.equal(normalizeLatviaPostalCode('LT-0000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Latvia postcode lookup normalizes the country prefix and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createLatviaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('lv 0000', LATVIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    LATVIA_POSTAL_CONTEXT_TEST_INSTANT,
    LATVIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'LV');
  assert.equal(lookup.normalizedPostalCode, 'LV-0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Latvia coordinate resolution reaches a VZD building only through an explicit link', () => {
  const runtime = new PostalContextPackRuntime(createLatviaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...LATVIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: LATVIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'LV');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: 'LV-0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked VZD cadastral building'),
    true,
  );
});

test('Latvia bbox lookup returns only an explicitly derived address-range surface', () => {
  const runtime = new PostalContextPackRuntime(createLatviaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [24.08, 56.92, 24.13, 56.98],
    LATVIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, 'LV-0000');
  assert.equal(result.matches[0]?.source.sourceId, 'lv-synthetic-derived-address-range-surface');
});
