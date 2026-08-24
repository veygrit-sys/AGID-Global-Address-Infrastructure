import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeSlovakiaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  SLOVAKIA_POSTAL_CONTEXT_TEST_INSTANT,
  SLOVAKIA_POSTAL_CONTEXT_TEST_POINT,
  createSlovakiaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextSlovakiaRuntimeFixture';

test('Slovakia pack treats PSČ as routing assignment and its test surface as derived', () => {
  const pack = createSlovakiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'SK');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSlovakiaPostalCode('０００００'), '000 00');
  assert.equal(normalizeSlovakiaPostalCode('00000'), '000 00');
  assert.equal(normalizeSlovakiaPostalCode('000 00'), '000 00');
  assert.equal(normalizeSlovakiaPostalCode('000-00'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Slovakia PSČ lookup canonicalizes spacing and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createSlovakiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00000', SLOVAKIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '000 00',
    SLOVAKIA_POSTAL_CONTEXT_TEST_INSTANT,
    SLOVAKIA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'SK');
  assert.equal(lookup.normalizedPostalCode, '000 00');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Slovakia coordinate resolution reaches a building only through the explicit Register adries link', () => {
  const runtime = new PostalContextPackRuntime(createSlovakiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...SLOVAKIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: SLOVAKIA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'SK');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '000 00', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Register adries building'),
    true,
  );
});

test('Slovakia bbox lookup returns only an explicitly derived address-membership surface', () => {
  const runtime = new PostalContextPackRuntime(createSlovakiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [17.09, 48.139, 17.125, 48.158],
    SLOVAKIA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '000 00');
  assert.equal(result.matches[0]?.source.sourceId, 'sk-synthetic-derived-address-membership-surface');
});
