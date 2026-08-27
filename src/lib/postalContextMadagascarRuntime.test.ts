import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeMadagascarPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { MADAGASCAR_POSTAL_CONTEXT_TEST_INSTANT, MADAGASCAR_POSTAL_CONTEXT_TEST_POINT, createMadagascarPostalContextRuntimeTestPack } from '../testFixtures/postalContextMadagascarRuntimeFixture';

test('Madagascar pack models dated routing syntax without inventing a current assignment or postcode polygon', () => {
  const pack = createMadagascarPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'MG');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
  assert.equal(normalizeMadagascarPostalCode('６９９'), '699');
  assert.equal(normalizeMadagascarPostalCode('6 99'), '699');
  assert.equal(normalizeMadagascarPostalCode('6-99'), null);
  assert.equal(normalizeMadagascarPostalCode('099'), null);
  assert.equal(normalizeMadagascarPostalCode('700'), null);
  assert.equal(normalizeMadagascarPostalCode('69'), null);
  assert.equal(normalizeMadagascarPostalCode('6999'), null);
});

test('Madagascar postcode lookup remains context-only even when geometry is requested', () => {
  const runtime = new PostalContextPackRuntime(createMadagascarPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('6 99', MADAGASCAR_POSTAL_CONTEXT_TEST_INSTANT, MADAGASCAR_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'MG');
  assert.equal(lookup.normalizedPostalCode, '699');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(lookup.contexts.some(context => context.label === 'Synthetic Postal Town'), true);
});

test('Madagascar coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createMadagascarPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...MADAGASCAR_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MADAGASCAR_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'MG');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Madagascar building'), true);
});

test('Madagascar bbox lookup never turns a postal town, historical department or office into an area', () => {
  const runtime = new PostalContextPackRuntime(createMadagascarPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([47.49, -18.91, 47.51, -18.89], MADAGASCAR_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
