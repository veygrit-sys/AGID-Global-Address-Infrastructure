import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostalContextPackRuntime, normalizeSenegalPostalCode, validatePostalContextRuntimePack } from './postalContextPackRuntime';
import { SENEGAL_POSTAL_CONTEXT_TEST_INSTANT, SENEGAL_POSTAL_CONTEXT_TEST_POINT, createSenegalPostalContextRuntimeTestPack } from '../testFixtures/postalContextSenegalRuntimeFixture';

test('Senegal pack separates five-digit observations, BP, derived surfaces, civic addresses, NICAD and buildings', () => {
  const pack = createSenegalPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'SN');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeSenegalPostalCode('０９９９７'), '09997');
  assert.equal(normalizeSenegalPostalCode('09 997'), '09997');
  assert.equal(normalizeSenegalPostalCode('SN-09997'), null);
  assert.equal(normalizeSenegalPostalCode('BP 09997'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Senegal postcode lookup preserves leading zeroes and exposes derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createSenegalPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('09 997', SENEGAL_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('09997', SENEGAL_POSTAL_CONTEXT_TEST_INSTANT, SENEGAL_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'SN');
  assert.equal(lookup.normalizedPostalCode, '09997');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'sn-synthetic-derived-postal-review-surface');
});

test('Senegal coordinate resolution reaches a building only through an explicit civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createSenegalPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({ ...SENEGAL_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: SENEGAL_POSTAL_CONTEXT_TEST_INSTANT });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'SN');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '09997', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label === 'Synthetic explicitly rights-cleared civic-address-linked Senegal building'), true);
});

test('Senegal bbox lookup returns only the synthetic derived review surface', () => {
  const runtime = new PostalContextPackRuntime(createSenegalPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([-17.48, 14.70, -17.45, 14.73], SENEGAL_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '09997');
  assert.equal(result.matches[0]?.source.sourceId, 'sn-synthetic-derived-postal-review-surface');
});
