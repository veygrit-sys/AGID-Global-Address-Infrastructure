import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeMaltaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  MALTA_POSTAL_CONTEXT_TEST_INSTANT,
  MALTA_POSTAL_CONTEXT_TEST_POINT,
  createMaltaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextMaltaRuntimeFixture';

test('Malta pack treats the seven-character postcode as an address-range assignment', () => {
  const pack = createMaltaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MT');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeMaltaPostalCode('ｖｌｔ１１１７'), 'VLT 1117');
  assert.equal(normalizeMaltaPostalCode('vlt1117'), 'VLT 1117');
  assert.equal(normalizeMaltaPostalCode('VLT 1117'), 'VLT 1117');
  assert.equal(normalizeMaltaPostalCode('VLT-1117'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Malta postcode lookup canonicalizes spacing and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createMaltaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('zzz0000', MALTA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    'ZZZ 0000',
    MALTA_POSTAL_CONTEXT_TEST_INSTANT,
    MALTA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'MT');
  assert.equal(lookup.normalizedPostalCode, 'ZZZ 0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Malta coordinate resolution reaches a building only through an explicit fixture link', () => {
  const runtime = new PostalContextPackRuntime(createMaltaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...MALTA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: MALTA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MT');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: 'ZZZ 0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked Planning Authority building'),
    true,
  );
});

test('Malta bbox lookup returns explicitly derived postcode geometry', () => {
  const runtime = new PostalContextPackRuntime(createMaltaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [14.500, 35.890, 14.530, 35.910],
    MALTA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, 'ZZZ 0000');
  assert.equal(result.matches[0]?.source.sourceId, 'mt-synthetic-derived-postcode-area');
});
