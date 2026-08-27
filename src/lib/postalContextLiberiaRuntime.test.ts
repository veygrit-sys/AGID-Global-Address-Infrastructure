import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeLiberiaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { LIBERIA_POSTAL_CONTEXT_TEST_INSTANT, LIBERIA_POSTAL_CONTEXT_TEST_POINT, createLiberiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextLiberiaRuntimeFixture';

test('Liberia pack accepts only four digits and invents no canonical postcode polygon', () => {
  const pack = createLiberiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'LR');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
  assert.equal(normalizeLiberiaPostalCode('９９９９'), '9999');
  assert.equal(normalizeLiberiaPostalCode('99 99'), '9999');
  assert.equal(normalizeLiberiaPostalCode('LR-9999'), null);
  assert.equal(normalizeLiberiaPostalCode('P.O. Box 9999'), null);
  assert.equal(normalizeLiberiaPostalCode('99-99'), null);
  assert.equal(normalizeLiberiaPostalCode('999'), null);
  assert.equal(normalizeLiberiaPostalCode('99999'), null);
});

test('Liberia postcode lookup remains context-only even when geometry is requested', () => {
  const runtime = new PostalContextPackRuntime(createLiberiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 99', LIBERIA_POSTAL_CONTEXT_TEST_INSTANT, LIBERIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'LR');
  assert.equal(lookup.normalizedPostalCode, '9999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(lookup.contexts.some(context => context.label === 'Synthetic Locality'), true);
});

test('Liberia coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createLiberiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...LIBERIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: LIBERIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'LR');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Liberia building'), true);
});

test('Liberia bbox lookup never turns an office, census area, parcel, model or AGID cell into a postal area', () => {
  const runtime = new PostalContextPackRuntime(createLiberiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-10.81, 6.29, -10.79, 6.31], LIBERIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
