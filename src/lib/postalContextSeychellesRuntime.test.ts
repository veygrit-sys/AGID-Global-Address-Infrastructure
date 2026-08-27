import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeSeychellesPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { SEYCHELLES_POSTAL_CONTEXT_TEST_INSTANT, SEYCHELLES_POSTAL_CONTEXT_TEST_POINT, createSeychellesPostalContextRuntimeTestPack } from '../testFixtures/postalContextSeychellesRuntimeFixture';

test('Seychelles pack has no current postcode feature or postal polygon and keeps NAS, building and AGID separate', () => {
  const pack = createSeychellesPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'SC');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSeychellesPostalCode('0000'), null);
  assert.equal(normalizeSeychellesPostalCode('1234'), null);
  assert.equal(normalizeSeychellesPostalCode('SC-SYN-NATIONAL-ADDRESS-99999'), null);
  assert.equal(pack.graph.nodes.some(node => node.kind === 'postal_feature'), false);
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
});

test('Seychelles postcode lookup rejects 0000 instead of promoting a placeholder', () => {
  const runtime = new PostalContextPackRuntime(createSeychellesPostalContextRuntimeTestPack());
  const result = runtime.lookupPostalCode('0000', SEYCHELLES_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'invalid');
  assert.equal(result.countryCode, 'SC');
  assert.deepEqual(result.postalFeatures, []);
  assert.deepEqual(result.geometries, []);
  assert.deepEqual(result.errors, ['invalid-postal-code']);
});

test('Seychelles coordinate resolution reaches a building only through an explicit National Address relation', () => {
  const runtime = new PostalContextPackRuntime(createSeychellesPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...SEYCHELLES_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: SEYCHELLES_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'SC');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly rights-cleared National Address-linked Seychelles building'), true);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic Seychelles AGID fallback cover'), true);
});

test('Seychelles bbox postcode lookup returns no match because no postal surface exists', () => {
  const runtime = new PostalContextPackRuntime(createSeychellesPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([55.42, -4.63, 55.44, -4.61], SEYCHELLES_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
