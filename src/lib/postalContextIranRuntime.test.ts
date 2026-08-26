import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeIranPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { IRAN_POSTAL_CONTEXT_TEST_INSTANT, IRAN_POSTAL_CONTEXT_TEST_POINT, createIranPostalContextRuntimeTestPack } from '../testFixtures/postalContextIranRuntimeFixture';

test('Iran pack separates ten-digit place ID, prefix context, GNAF, building, jurisdiction, time, and AGID', () => {
  const pack = createIranPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'IR');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeIranPostalCode('۹۹۹۹۹۹۹۹۹۹'), '9999999999');
  assert.equal(normalizeIranPostalCode('٩٩٩٩٩ ٩٩٩٩٩'), '9999999999');
  assert.equal(normalizeIranPostalCode('99999-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'ir-synthetic-derived-postal-context-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Iran postcode lookup canonicalizes Persian digits and exposes only opt-in synthetic geometry', () => {
  const runtime = new PostalContextPackRuntime(createIranPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('۹۹۹۹۹۹۹۹۹۹', IRAN_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('9999999999', IRAN_POSTAL_CONTEXT_TEST_INSTANT, IRAN_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'IR');
  assert.equal(lookup.normalizedPostalCode, '9999999999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Iran coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createIranPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...IRAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: IRAN_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'IR');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9999999999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Iran building'), true);
});

test('Iran bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createIranPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([52.98, 31.98, 53.02, 32.02], IRAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '9999999999');
  assert.equal(result.matches[0]?.source.sourceId, 'ir-synthetic-derived-postal-context-surface');
});
