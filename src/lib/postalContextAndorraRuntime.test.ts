import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeAndorraPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  ANDORRA_POSTAL_CONTEXT_TEST_INSTANT,
  ANDORRA_POSTAL_CONTEXT_TEST_POINT,
  createAndorraPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextAndorraRuntimeFixture';

test('Andorra pack treats ADNNN as routing evidence, not an automatic parish polygon', () => {
  const pack = createAndorraPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'AD');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeAndorraPostalCode('ＡＤ５００'), 'AD500');
  assert.equal(normalizeAndorraPostalCode('AD 500'), 'AD500');
  assert.equal(normalizeAndorraPostalCode('500'), 'AD500');
  assert.equal(normalizeAndorraPostalCode('AD-500'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Andorra postcode lookup preserves the AD prefix and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createAndorraPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('000', ANDORRA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    'AD000',
    ANDORRA_POSTAL_CONTEXT_TEST_INSTANT,
    ANDORRA_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'AD');
  assert.equal(lookup.normalizedPostalCode, 'AD000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Andorra coordinate resolution reaches a building only through an explicit authority link', () => {
  const runtime = new PostalContextPackRuntime(createAndorraPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...ANDORRA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: ANDORRA_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'AD');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: 'AD000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked IDE Andorra topographic building'),
    true,
  );
});

test('Andorra bbox lookup returns only an explicitly derived membership surface', () => {
  const runtime = new PostalContextPackRuntime(createAndorraPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [1.49, 42.48, 1.55, 42.54],
    ANDORRA_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, 'AD000');
  assert.equal(result.matches[0]?.source.sourceId, 'ad-synthetic-derived-address-membership-surface');
});
