import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeSingaporePostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  SINGAPORE_POSTAL_CONTEXT_TEST_INSTANT,
  SINGAPORE_POSTAL_CONTEXT_TEST_POINT,
  createSingaporePostalContextRuntimeTestPack,
} from '../testFixtures/postalContextSingaporeRuntimeFixture';

test('Singapore pack uses a six-digit delivery-point code without inventing a polygon', () => {
  const pack = createSingaporePostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'SG');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
  assert.equal(normalizeSingaporePostalCode('０００００１'), '000001');
  assert.equal(normalizeSingaporePostalCode('000-001'), null);
});

test('Singapore postcode lookup resolves source-linked building context without postal geometry', () => {
  const runtime = new PostalContextPackRuntime(createSingaporePostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode(
    '000 001',
    SINGAPORE_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'SG');
  assert.equal(lookup.normalizedPostalCode, '000001');
  assert.equal(lookup.postalFeatures[0]?.postalCode, '000001');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(
    lookup.contexts.some(context => context.label === 'Synthetic Meridian District'),
    true,
  );
});

test('Singapore coordinate resolution reaches a building only through an address point', () => {
  const runtime = new PostalContextPackRuntime(createSingaporePostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...SINGAPORE_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: SINGAPORE_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'SG');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.equal(result.postalEvidence.length, 0);
  assert.equal(
    result.selected?.components.some(component => component.label === 'Synthetic Meridian Centre'),
    true,
  );
});

test('Singapore bbox lookup does not turn delivery points into postal areas', () => {
  const runtime = new PostalContextPackRuntime(createSingaporePostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [103.74, 1.29, 103.76, 1.31],
    SINGAPORE_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
