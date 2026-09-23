import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PostalContextPackRuntime,
  normalizeCyprusPostalCode,
  validatePostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  CYPRUS_POSTAL_CONTEXT_TEST_INSTANT,
  CYPRUS_POSTAL_CONTEXT_TEST_POINT,
  createCyprusPostalContextRuntimeTestPack,
} from '../testFixtures/postalContextCyprusRuntimeFixture';

test('Cyprus pack treats four digits and CY- display as assignment syntax, not a polygon', () => {
  const pack = createCyprusPostalContextRuntimeTestPack();
  const validation = validatePostalContextRuntimePack(pack, 'CY');
  const postalArea = pack.geometry.features.find(feature => feature.role === 'postal_area');

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(normalizeCyprusPostalCode('２００８'), '2008');
  assert.equal(normalizeCyprusPostalCode('20 08'), '2008');
  assert.equal(normalizeCyprusPostalCode('CY-2008'), '2008');
  assert.equal(normalizeCyprusPostalCode('CY2008'), null);
  assert.equal(normalizeCyprusPostalCode('99010'), null);
  assert.equal(postalArea?.quality.status, 'derived');
  assert.equal(postalArea?.source.assignmentAuthority, 'synthetic_fixture_assignment');
  assert.equal(postalArea?.source.geometryAuthority, 'synthetic_fixture_geometry');
});

test('Cyprus postcode lookup normalizes international prefix and gates derived geometry', () => {
  const runtime = new PostalContextPackRuntime(createCyprusPostalContextRuntimeTestPack());
  const lookup = runtime.lookupPostalCode('CY-0000', CYPRUS_POSTAL_CONTEXT_TEST_INSTANT);
  const withGeometry = runtime.lookupPostalCode(
    '0000',
    CYPRUS_POSTAL_CONTEXT_TEST_INSTANT,
    CYPRUS_POSTAL_CONTEXT_TEST_INSTANT,
    true,
  );

  assert.equal(lookup.status, 'unique');
  assert.equal(lookup.countryCode, 'CY');
  assert.equal(lookup.normalizedPostalCode, '0000');
  assert.deepEqual(lookup.geometries, []);
  assert.equal(withGeometry.geometries.length, 1);
  assert.equal(withGeometry.geometries[0]?.geometry.type, 'Polygon');
});

test('Cyprus coordinate resolution reaches a building only through an explicit DLS link', () => {
  const runtime = new PostalContextPackRuntime(createCyprusPostalContextRuntimeTestPack());
  const result = runtime.resolvePublicCoordinate({
    ...CYPRUS_POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: CYPRUS_POSTAL_CONTEXT_TEST_INSTANT,
  });

  assert.equal(result.status, 'unique');
  assert.equal(result.countryCode, 'CY');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.addressPointEvidence.matched, true);
  assert.deepEqual(result.postalEvidence, [{ postalCode: '0000', relation: 'inside' }]);
  assert.equal(
    result.selected?.components.some(component =>
      component.label === 'Synthetic explicitly linked DLS INSPIRE building'),
    true,
  );
});

test('Cyprus bbox lookup returns only an explicitly derived street-membership surface', () => {
  const runtime = new PostalContextPackRuntime(createCyprusPostalContextRuntimeTestPack());
  const result = runtime.intersectsPostalBbox(
    [33.37, 35.17, 33.40, 35.20],
    CYPRUS_POSTAL_CONTEXT_TEST_INSTANT,
  );

  assert.equal(result.status, 'unique');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.node.postalCode, '0000');
  assert.equal(result.matches[0]?.source.sourceId, 'cy-synthetic-derived-street-membership-surface');
});
