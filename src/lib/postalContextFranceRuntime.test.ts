import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeFrancePostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  FRANCE_POSTAL_CONTEXT_TEST_INSTANT,
  FRANCE_POSTAL_CONTEXT_TEST_POINT,
  createFrancePostalContextRuntimeTestPack,
} from '../testFixtures/postalContextFranceRuntimeFixture';

test('France pack keeps La Poste assignment separate from derived geometry', () => {
  const pack = createFrancePostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'FR');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeFrancePostalCode('７５００１'), '75001');
  assert.equal(normalizeFrancePostalCode('75 001'), '75001');
  assert.equal(normalizeFrancePostalCode('750-01'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'none');
});

test('France postcode lookup exposes a derived surface only on explicit opt-in', () => {
  const runtime = new PostalContextPackRuntime(createFrancePostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('00000', FRANCE_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '00000',
    FRANCE_POSTAL_CONTEXT_TEST_INSTANT,
    FRANCE_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'FR');
  assert.equal(lookup.normalizedPostalCode, '00000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('France coordinate resolution requires BAN-like address evidence for building detail', () => {
  const runtime = new PostalContextPackRuntime(createFrancePostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...FRANCE_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: FRANCE_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'FR');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '00000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Bâtiment Synthétique'),
    true,
  );
});

test('France bbox lookup returns derived geometry without calling it a La Poste boundary', () => {
  const runtime = new PostalContextPackRuntime(createFrancePostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [2.34, 48.84, 2.36, 48.86],
    FRANCE_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '00000');
  assert.equal(result.matches[0]?.source.sourceId, 'fr-synthetic-derived-postcode-area');
});
