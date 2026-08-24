import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeItalyPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  ITALY_POSTAL_CONTEXT_TEST_INSTANT,
  ITALY_POSTAL_CONTEXT_TEST_POINT,
  createItalyPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextItalyRuntimeFixture';

test('Italy pack treats a five-digit CAP as routing assignment, not an official polygon', () => {
  const pack = createItalyPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'IT');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeItalyPostalCode('００１２３'), '00123');
  assert.equal(normalizeItalyPostalCode('00 123'), '00123');
  assert.equal(normalizeItalyPostalCode('00-123'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Italy CAP lookup exposes derived geometry only on explicit opt-in', () => {
  const runtime = new PostalContextPackRuntime(createItalyPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00000', ITALY_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    ITALY_POSTAL_CONTEXT_TEST_INSTANT,
    ITALY_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'IT');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Italy coordinate resolution requires source-linked civic and building evidence', () => {
  const runtime = new PostalContextPackRuntime(createItalyPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...ITALY_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: ITALY_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'IT');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Edificio Sintetico'),
    true,
  );
});

test('Italy bbox lookup returns explicitly derived CAP geometry', () => {
  const runtime = new PostalContextPackRuntime(createItalyPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [12.48, 41.89, 12.51, 41.92],
    ITALY_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'it-synthetic-derived-cap-area');
});
