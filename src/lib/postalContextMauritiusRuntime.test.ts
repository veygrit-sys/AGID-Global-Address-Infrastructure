import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeMauritiusPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT, MAURITIUS_POSTAL_CONTEXT_TEST_POINT, createMauritiusPostalContextRuntimeTestPack } from '../testFixtures/postalContextMauritiusRuntimeFixture';

test('Mauritius pack preserves main-island, Rodrigues and Agalega shapes without inventing a postcode polygon', () => {
  const pack = createMauritiusPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MU');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
  assert.equal(normalizeMauritiusPostalCode('９９９９９'), '99999');
  assert.equal(normalizeMauritiusPostalCode('99 999'), '99999');
  assert.equal(normalizeMauritiusPostalCode('ｒ９９９９'), 'R9999');
  assert.equal(normalizeMauritiusPostalCode('a 9999'), 'A9999');
  assert.equal(normalizeMauritiusPostalCode('09999'), null);
  assert.equal(normalizeMauritiusPostalCode('B9999'), null);
  assert.equal(normalizeMauritiusPostalCode('R999'), null);
  assert.equal(normalizeMauritiusPostalCode('9999'), null);
  assert.equal(normalizeMauritiusPostalCode('99-999'), null);
});

test('Mauritius postcode lookup remains context-only even when geometry is requested', () => {
  const runtime = new PostalContextPackRuntime(createMauritiusPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 999', MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT, MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'MU');
  assert.equal(lookup.normalizedPostalCode, '99999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(lookup.contexts.some(context => context.label === 'Synthetic Sub-locality'), true);
});

test('Mauritius coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createMauritiusPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...MAURITIUS_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MU');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Mauritius building'), true);
});

test('Mauritius bbox lookup never turns a district, VCA, sub-locality or post office into a postal area', () => {
  const runtime = new PostalContextPackRuntime(createMauritiusPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([57.49, -20.21, 57.51, -20.19], MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
