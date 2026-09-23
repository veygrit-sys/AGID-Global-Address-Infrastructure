import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeNamibiaPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { NAMIBIA_POSTAL_CONTEXT_TEST_INSTANT, NAMIBIA_POSTAL_CONTEXT_TEST_POINT, createNamibiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextNamibiaRuntimeFixture';

test('Namibia pack models Phase 1 delivery infrastructure without inventing a postcode polygon', () => {
  const pack = createNamibiaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'NA');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(pack.geometry.features.some(feature => feature.role === 'postal_area'), false);
  assert.equal(normalizeNamibiaPostalCode('９９０９９'), '99099');
  assert.equal(normalizeNamibiaPostalCode('99 099'), '99099');
  assert.equal(normalizeNamibiaPostalCode('99-099'), null);
  assert.equal(normalizeNamibiaPostalCode('99199'), null);
  assert.equal(normalizeNamibiaPostalCode('9099'), null);
  assert.equal(normalizeNamibiaPostalCode('990999'), null);
});

test('Namibia postcode lookup remains context-only even when geometry is requested', () => {
  const runtime = new PostalContextPackRuntime(createNamibiaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 099', NAMIBIA_POSTAL_CONTEXT_TEST_INSTANT, NAMIBIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'NA');
  assert.equal(lookup.normalizedPostalCode, '99099');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(lookup.contexts.some(context => context.label === 'Synthetic Constituency'), true);
});

test('Namibia coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createNamibiaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...NAMIBIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: NAMIBIA_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'NA');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, []);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Namibian building'), true);
});

test('Namibia bbox lookup never turns a delivery-office code into an area', () => {
  const runtime = new PostalContextPackRuntime(createNamibiaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([17.09, -22.61, 17.11, -22.59], NAMIBIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.matches, []);
});
