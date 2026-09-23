import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeUnitedStatesPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { UNITED_STATES_POSTAL_CONTEXT_TEST_INSTANT, UNITED_STATES_POSTAL_CONTEXT_TEST_POINT, createUnitedStatesPostalContextRuntimeTestPack } from '../testFixtures/postalContextUnitedStatesRuntimeFixture';

test('United States pack keeps USPS assignment, derived ZCTA-like surface, explicit building, and AGID separate', () => {
  const pack = createUnitedStatesPostalContextRuntimeTestPack(); const validation = validatePostalContextRuntimePack(pack, 'US');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.equal(normalizeUnitedStatesPostalCode('９９９９９'), '99999');
  assert.equal(normalizeUnitedStatesPostalCode('999999999'), '99999-9999');
  assert.equal(normalizeUnitedStatesPostalCode('99999 9999'), '99999-9999');
  assert.equal(normalizeUnitedStatesPostalCode('US-99999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.sourceId, 'us-synthetic-derived-zcta-like-validation-surface');
});

test('United States ZIP lookup canonicalizes ZIP+4 and exposes only opt-in synthetic geometry', () => {
  const runtime = new PostalContextPackRuntime(createUnitedStatesPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('99 999', UNITED_STATES_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('99999', UNITED_STATES_POSTAL_CONTEXT_TEST_INSTANT, UNITED_STATES_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique'); assert.equal(lookup.countryCode, 'US'); assert.equal(lookup.normalizedPostalCode, '99999'); assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('United States coordinate resolution reaches a building only through explicit synthetic civic relation', () => {
  const runtime = new PostalContextPackRuntime(createUnitedStatesPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...UNITED_STATES_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: UNITED_STATES_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique'); assert.equal(result.countryCode, 'US'); assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true); assert.deepEqual(result.postalEvidence, [{ postalCode: '99999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly address-linked United States building'), true);
});

test('United States bbox lookup returns only the synthetic derived validation surface', () => {
  const runtime = new PostalContextPackRuntime(createUnitedStatesPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-98.52, 38.48, -98.48, 38.52], UNITED_STATES_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique'); assert.equal(result.matches[0]?.node.postalCode, '99999'); assert.equal(result.matches[0]?.source.sourceId, 'us-synthetic-derived-zcta-like-validation-surface');
});
