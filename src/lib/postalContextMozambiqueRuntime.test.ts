import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeMozambiquePostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { MOZAMBIQUE_POSTAL_CONTEXT_TEST_INSTANT, MOZAMBIQUE_POSTAL_CONTEXT_TEST_POINT, createMozambiquePostalContextRuntimeTestPack } from '../testFixtures/postalContextMozambiqueRuntimeFixture';

test('Mozambique pack accepts only the current eight-digit CEP and invents no canonical postcode polygon', () => {
  const pack = createMozambiquePostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MZ');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
  assert.equal(normalizeMozambiquePostalCode('９９９９９－９９９'), '99999-999');
  assert.equal(normalizeMozambiquePostalCode('99999999'), '99999-999');
  assert.equal(normalizeMozambiquePostalCode('99999 999'), '99999-999');
  assert.equal(normalizeMozambiquePostalCode('9999'), null);
  assert.equal(normalizeMozambiquePostalCode('9999-99'), null);
  assert.equal(normalizeMozambiquePostalCode('99999-99'), null);
  assert.equal(normalizeMozambiquePostalCode('99999-9999'), null);
  assert.equal(normalizeMozambiquePostalCode('MZ99999999'), null);
});

test('Mozambique postcode lookup remains context-only even when geometry is requested', () => {
  const runtime = new PostalContextPackRuntime(createMozambiquePostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99999 999', MOZAMBIQUE_POSTAL_CONTEXT_TEST_INSTANT, MOZAMBIQUE_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'MZ');
  assert.equal(lookup.normalizedPostalCode, '99999-999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(lookup.contexts.some(context => context.label === 'Synthetic Locality or Bairro'), true);
});

test('Mozambique coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createMozambiquePostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...MOZAMBIQUE_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MOZAMBIQUE_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MZ');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Mozambique building'), true);
});

test('Mozambique bbox lookup never turns administrative, pilot-door or operator-facility evidence into a postal area', () => {
  const runtime = new PostalContextPackRuntime(createMozambiquePostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([32.57, -25.96, 32.59, -25.94], MOZAMBIQUE_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
