import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeMonacoPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  MONACO_POSTAL_CONTEXT_TEST_INSTANT,
  MONACO_POSTAL_CONTEXT_TEST_POINT,
  createMonacoPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextMonacoRuntimeFixture';

test('Monaco pack treats 980xx as a routing designator, not an official polygon', () => {
  const pack = createMonacoPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MC');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeMonacoPostalCode('９８０００'), '98000');
  assert.equal(normalizeMonacoPostalCode('98 000'), '98000');
  assert.equal(normalizeMonacoPostalCode('98099'), '98099');
  assert.equal(normalizeMonacoPostalCode('98100'), null);
  assert.equal(normalizeMonacoPostalCode('MC 98000'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Monaco postcode lookup normalizes spacing and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createMonacoPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('98 000', MONACO_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '98000',
    MONACO_POSTAL_CONTEXT_TEST_INSTANT,
    MONACO_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'MC');
  assert.equal(lookup.normalizedPostalCode, '98000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Monaco coordinate resolution reaches a building only through an explicit fixture link', () => {
  const runtime = new PostalContextPackRuntime(createMonacoPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...MONACO_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: MONACO_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MC');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '98000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic explicitly linked DPUM building'),
    true,
  );
});

test('Monaco bbox lookup returns explicitly derived routing geometry', () => {
  const runtime = new PostalContextPackRuntime(createMonacoPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [7.410, 43.725, 7.440, 43.750],
    MONACO_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '98000');
  assert.equal(result.matches[0]?.source.sourceId, 'mc-synthetic-derived-routing-surface');
});
