import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeIsraelPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { ISRAEL_POSTAL_CONTEXT_TEST_INSTANT, ISRAEL_POSTAL_CONTEXT_TEST_POINT, createIsraelPostalContextRuntimeTestPack } from '../testFixtures/postalContextIsraelRuntimeFixture';

test('Israel pack separates seven-digit assignment, non-area semantics, government context, building, territorial scope, and AGID', () => {
  const pack = createIsraelPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'IL');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeIsraelPostalCode('۹۹۹۹۹۹۹'), '9999999');
  assert.equal(normalizeIsraelPostalCode('٩٩ ٩٩٩ ٩٩'), '9999999');
  assert.equal(normalizeIsraelPostalCode('99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'il-synthetic-derived-postal-context-surface');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Israel postcode lookup canonicalizes Arabic digits and exposes only opt-in synthetic geometry', () => {
  const runtime = new PostalContextPackRuntime(createIsraelPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('۹۹۹۹۹۹۹', ISRAEL_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('9999999', ISRAEL_POSTAL_CONTEXT_TEST_INSTANT, ISRAEL_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'IL');
  assert.equal(lookup.normalizedPostalCode, '9999999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Israel coordinate resolution reaches a building only through explicit civic relation', () => {
  const runtime = new PostalContextPackRuntime(createIsraelPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...ISRAEL_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: ISRAEL_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'IL');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '9999999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked Israel building'), true);
});

test('Israel bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createIsraelPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([34.78, 31.48, 34.82, 31.52], ISRAEL_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '9999999');
  assert.equal(result.matches[0]?.source.sourceId, 'il-synthetic-derived-postal-context-surface');
});
