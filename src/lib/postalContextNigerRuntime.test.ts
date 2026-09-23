import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeNigerPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { NIGER_POSTAL_CONTEXT_TEST_INSTANT, NIGER_POSTAL_CONTEXT_TEST_POINT, createNigerPostalContextRuntimeTestPack } from '../testFixtures/postalContextNigerRuntimeFixture';

test('Niger pack models current routing assignments without inventing a postcode polygon', () => {
  const pack = createNigerPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'NE');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
  assert.equal(normalizeNigerPostalCode('８９９９'), '8999');
  assert.equal(normalizeNigerPostalCode('8 999'), '8999');
  assert.equal(normalizeNigerPostalCode('8-999'), null);
  assert.equal(normalizeNigerPostalCode('0999'), null);
  assert.equal(normalizeNigerPostalCode('9000'), null);
  assert.equal(normalizeNigerPostalCode('899'), null);
  assert.equal(normalizeNigerPostalCode('89999'), null);
});

test('Niger postcode lookup remains context-only even when geometry is requested', () => {
  const runtime = new PostalContextPackRuntime(createNigerPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('8 999', NIGER_POSTAL_CONTEXT_TEST_INSTANT, NIGER_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'NE');
  assert.equal(lookup.normalizedPostalCode, '8999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(lookup.contexts.some(context => context.label === 'Synthetic Locality'), true);
});

test('Niger coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createNigerPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...NIGER_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: NIGER_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'NE');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Niger building'), true);
});

test('Niger bbox lookup never turns a locality or office code into an area', () => {
  const runtime = new PostalContextPackRuntime(createNigerPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([2.09, 13.49, 2.11, 13.51], NIGER_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
