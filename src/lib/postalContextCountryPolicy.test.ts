import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  POSTAL_CONTEXT_COUNTRY_POLICIES,
  isPostalContextCountryCode,
  normalizeFrancePostalCode,
  normalizeJapanPostalCode,
  normalizeNetherlandsPostalCode,
  normalizePostalContextPostalCode,
  normalizeSingaporePostalCode,
  normalizeUnitedKingdomPostalCode,
} from './postalContextCountryPolicy';

test('normalizes supported country postal codes without cross-country guessing', () => {
  assert.equal(
    normalizeJapanPostalCode('\uFF10\uFF10\uFF10\uFF0D\uFF10\uFF10\uFF10\uFF11'),
    '000-0001',
  );
  assert.equal(
    normalizeSingaporePostalCode('\uFF10\uFF10\uFF10\uFF10\uFF10\uFF11'),
    '000001',
  );
  assert.equal(normalizeSingaporePostalCode('000 001'), '000001');
  assert.equal(normalizeSingaporePostalCode('000-001'), null);
  assert.equal(normalizePostalContextPostalCode('SG', '000001'), '000001');
  assert.equal(
    normalizeNetherlandsPostalCode('\uFF11\uFF12\uFF13\uFF14\uFF41\uFF42'),
    '1234 AB',
  );
  assert.equal(normalizeNetherlandsPostalCode('1234ab'), '1234 AB');
  assert.equal(normalizeNetherlandsPostalCode('1234-AB'), null);
  assert.equal(normalizePostalContextPostalCode('NL', '1234AB'), '1234 AB');
  assert.equal(normalizeUnitedKingdomPostalCode('sw1a1aa'), 'SW1A 1AA');
  assert.equal(normalizeUnitedKingdomPostalCode('GIR0AA'), 'GIR 0AA');
  assert.equal(normalizeUnitedKingdomPostalCode('SW1A-1AA'), null);
  assert.equal(normalizePostalContextPostalCode('GB', 'sw1a 1aa'), 'SW1A 1AA');
  assert.equal(normalizePostalContextPostalCode('gb', 'w1a0ax'), 'W1A 0AX');
  assert.equal(normalizeFrancePostalCode('\uFF17\uFF15\uFF10\uFF10\uFF11'), '75001');
  assert.equal(normalizeFrancePostalCode('75 001'), '75001');
  assert.equal(normalizeFrancePostalCode('75001'), '75001');
  assert.equal(normalizeFrancePostalCode('75-001'), null);
  assert.equal(normalizePostalContextPostalCode('fr', '75 001'), '75001');
  assert.equal(normalizePostalContextPostalCode('US', '00001'), null);
});

test('declares country-specific full-code geometry semantics', () => {
  assert.equal(isPostalContextCountryCode('JP'), true);
  assert.equal(isPostalContextCountryCode('SG'), true);
  assert.equal(isPostalContextCountryCode('NL'), true);
  assert.equal(isPostalContextCountryCode('GB'), true);
  assert.equal(isPostalContextCountryCode('US'), false);
  assert.equal(isPostalContextCountryCode('FR'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.SG.fullCodeGeometrySemantics,
    'delivery-point-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.SG.postalCodeFormat, 'NNNNNN');
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.NL.fullCodeGeometrySemantics,
    'address-range-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.NL.postalCodeFormat, 'NNNN AA');
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.GB.fullCodeGeometrySemantics,
    'delivery-unit-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.GB.postalCodeFormat, 'OUTWARD INWARD');
});
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.FR.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.FR.postalCodeFormat, 'NNNNN');
