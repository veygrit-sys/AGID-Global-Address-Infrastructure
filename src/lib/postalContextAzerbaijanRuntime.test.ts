import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeAzerbaijanPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT,
  AZERBAIJAN_POSTAL_CONTEXT_TEST_POINT,
  createAzerbaijanPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextAzerbaijanRuntimeFixture';

test('Azerbaijan pack treats AZNNNN as routing/address evidence, not a universal official polygon', () => {
  const pack = createAzerbaijanPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'AZ');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeAzerbaijanPostalCode('ＡＺ１０１０'), 'AZ1010');
  assert.equal(normalizeAzerbaijanPostalCode('az 1010'), 'AZ1010');
  assert.equal(normalizeAzerbaijanPostalCode('1010'), 'AZ1010');
  assert.equal(normalizeAzerbaijanPostalCode('AZ-1010'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Azerbaijan postcode lookup canonicalizes the country prefix and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createAzerbaijanPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('az 0000', AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT,
    AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'AZ');
  assert.equal(lookup.normalizedPostalCode, 'AZ0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Azerbaijan coordinate resolution reaches a building only through an explicit registry link', () => {
  const runtime = new PostalContextPackRuntime(createAzerbaijanPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...AZERBAIJAN_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'AZ');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: 'AZ0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked URIS cadastral building'),
    true,
  );
});

test('Azerbaijan bbox lookup returns only an explicitly derived membership surface', () => {
  const runtime = new PostalContextPackRuntime(createAzerbaijanPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [49.84, 40.38, 49.89, 40.43],
    AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, 'AZ0000');
  assert.equal(result.matches[0]?.source.sourceId, 'az-synthetic-derived-address-membership-surface');
});
