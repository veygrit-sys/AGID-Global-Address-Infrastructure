import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  POSTAL_CONTEXT_COUNTRY_POLICIES,
  isPostalContextCountryCode,
  normalizeJapanPostalCode,
  normalizePostalContextPostalCode,
  normalizeSingaporePostalCode,
} from './postalContextCountryPolicy';

test('normalizes Japan and Singapore postal codes without cross-country guessing', () => {
  assert.equal(normalizeJapanPostalCode('０００－０００１'), '000-0001');
  assert.equal(normalizeSingaporePostalCode('０００００１'), '000001');
  assert.equal(normalizeSingaporePostalCode('000 001'), '000001');
  assert.equal(normalizeSingaporePostalCode('000-001'), null);
  assert.equal(normalizePostalContextPostalCode('SG', '000001'), '000001');
  assert.equal(normalizePostalContextPostalCode('US', '00001'), null);
});

test('declares Singapore full codes as delivery-point-first rather than polygon-first', () => {
  assert.equal(isPostalContextCountryCode('JP'), true);
  assert.equal(isPostalContextCountryCode('SG'), true);
  assert.equal(isPostalContextCountryCode('US'), false);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.SG.fullCodeGeometrySemantics,
    'delivery-point-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.SG.postalCodeFormat, 'NNNNNN');
});
