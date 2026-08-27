import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime, normalizeCaboVerdePostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { CABO_VERDE_POSTAL_CONTEXT_TEST_INSTANT, CABO_VERDE_POSTAL_CONTEXT_TEST_POINT, createCaboVerdePostalContextRuntimeTestPack } from '../testFixtures/postalContextCaboVerdeRuntimeFixture';

test('Cabo Verde pack separates four-digit postcodes, CIP addresses, derived surfaces, and explicit buildings', () => {
  const pack = createCaboVerdePostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CV');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeCaboVerdePostalCode('０９９９'), '0999');
  assert.equal(normalizeCaboVerdePostalCode('09 99'), '0999');
  assert.equal(normalizeCaboVerdePostalCode('CV-0999'), null);
  assert.equal(normalizeCaboVerdePostalCode('7937-049'), null);
  assert.equal(normalizeCaboVerdePostalCode('999'), null);
  assert.equal(normalizeCaboVerdePostalCode('09999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Cabo Verde postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createCaboVerdePostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('09 99', CABO_VERDE_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('0999', CABO_VERDE_POSTAL_CONTEXT_TEST_INSTANT, CABO_VERDE_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CV');
  assert.equal(lookup.normalizedPostalCode, '0999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'cv-synthetic-derived-postal-review-surface');
});

test('Cabo Verde coordinate resolution reaches a building only through an explicit CIP address relation', () => {
  const runtime = new PostalContextPackRuntime(createCaboVerdePostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...CABO_VERDE_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: CABO_VERDE_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CV');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly rights-cleared CIP-address-linked Cabo Verde building'), true);
});

test('Cabo Verde bbox lookup returns only the synthetic derived review surface', () => {
  const runtime = new PostalContextPackRuntime(createCaboVerdePostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-24.02, 14.98, -23.98, 15.02], CABO_VERDE_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '0999');
  assert.equal(result.matches[0]?.source.sourceId, 'cv-synthetic-derived-postal-review-surface');
});
