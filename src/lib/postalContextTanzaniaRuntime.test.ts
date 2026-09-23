import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PostalContextPackRuntime,
  normalizeTanzaniaPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  TANZANIA_POSTAL_CONTEXT_TEST_INSTANT,
  TANZANIA_POSTAL_CONTEXT_TEST_POINT,
  createTanzaniaPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextTanzaniaRuntimeFixture';

test('Tanzania pack separates syntax, typed category, assignment, derived ward surface, civic address, building and AGID', () => {
  const pack = createTanzaniaPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'TZ');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeTanzaniaPostalCode('１９９９９'), '19999');
  assert.equal(normalizeTanzaniaPostalCode('19 999'), '19999');
  assert.equal(normalizeTanzaniaPostalCode('TZ-19999'), null);
  assert.equal(normalizeTanzaniaPostalCode('P.O. Box 19999'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Tanzania postcode lookup exposes synthetic derived geometry only on opt-in', () => {
  const runtime = new PostalContextPackRuntime(createTanzaniaPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('19 999', TANZANIA_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode('19999', TANZANIA_POSTAL_CONTEXT_TEST_INSTANT, TANZANIA_POSTAL_CONTEXT_TEST_INSTANT, true);
  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'TZ');
  assert.equal(lookup.normalizedPostalCode, '19999');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
  assert.equal(withGeometry.geometries[0]?.source.sourceId, 'tz-synthetic-derived-administrative-postal-review-surface');
});

test('Tanzania coordinate resolution reaches a building only through an explicit LGA or NaPA civic-address relation', () => {
  const runtime = new PostalContextPackRuntime(createTanzaniaPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...TANZANIA_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: TANZANIA_POSTAL_CONTEXT_TEST_INSTANT,
  });
  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'TZ');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '19999', relation: 'inside' }]);
  assert.equal(result.selected?.components.some(component => component.label.includes('LGA/NaPA-address-linked')), true);
});

test('Tanzania bbox lookup returns only the synthetic derived administrative review surface', () => {
  const runtime = new PostalContextPackRuntime(createTanzaniaPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox([39.19, -6.81, 39.23, -6.77], TANZANIA_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status, 'unique');
  assert.equal(result.matches[0]?.node.postalCode, '19999');
  assert.equal(result.matches[0]?.source.sourceId, 'tz-synthetic-derived-administrative-postal-review-surface');
});
