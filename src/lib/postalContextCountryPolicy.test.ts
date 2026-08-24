import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  POSTAL_CONTEXT_COUNTRY_POLICIES,
  isPostalContextCountryCode,
  normalizeIcelandPostalCode,
  normalizeEstoniaPostalCode,
  normalizeSwitzerlandPostalCode,
  normalizeGermanyPostalCode,
  normalizeCzechiaPostalCode,
  normalizeItalyPostalCode,
  normalizeFrancePostalCode,
  normalizeJapanPostalCode,
  normalizeNetherlandsPostalCode,
  normalizeNewZealandPostalCode,
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
  assert.equal(normalizeNewZealandPostalCode('\uFF10\uFF11\uFF12\uFF13'), '0123');
  assert.equal(normalizeNewZealandPostalCode('01 23'), '0123');
  assert.equal(normalizeNewZealandPostalCode('0123'), '0123');
  assert.equal(normalizeNewZealandPostalCode('01-23'), null);
  assert.equal(normalizePostalContextPostalCode('nz', '01 23'), '0123');
  assert.equal(normalizeIcelandPostalCode('\uFF10\uFF10\uFF11'), '001');
  assert.equal(normalizeIcelandPostalCode('0 01'), '001');
  assert.equal(normalizeIcelandPostalCode('001'), '001');
  assert.equal(normalizeIcelandPostalCode('0-01'), null);
  assert.equal(normalizePostalContextPostalCode('is', '0 01'), '001');
  assert.equal(normalizeItalyPostalCode('\uFF10\uFF10\uFF11\uFF12\uFF13'), '00123');
  assert.equal(normalizeItalyPostalCode('00 123'), '00123');
  assert.equal(normalizeItalyPostalCode('00123'), '00123');
  assert.equal(normalizeItalyPostalCode('00-123'), null);
  assert.equal(normalizePostalContextPostalCode('it', '00 123'), '00123');
  assert.equal(normalizeEstoniaPostalCode('\uFF10\uFF10\uFF11\uFF12\uFF13'), '00123');
  assert.equal(normalizeEstoniaPostalCode('00 123'), '00123');
  assert.equal(normalizeEstoniaPostalCode('00123'), '00123');
  assert.equal(normalizeEstoniaPostalCode('00-123'), null);
  assert.equal(normalizePostalContextPostalCode('ee', '00 123'), '00123');
  assert.equal(normalizeSwitzerlandPostalCode('\uFF10\uFF10\uFF11\uFF12'), '0012');
  assert.equal(normalizeSwitzerlandPostalCode('00 12'), '0012');
  assert.equal(normalizeSwitzerlandPostalCode('0012'), '0012');
  assert.equal(normalizeSwitzerlandPostalCode('00-12'), null);
  assert.equal(normalizePostalContextPostalCode('ch', '00 12'), '0012');
  assert.equal(normalizeGermanyPostalCode('\uFF10\uFF10\uFF11\uFF12\uFF13'), '00123');
  assert.equal(normalizeGermanyPostalCode('00 123'), '00123');
  assert.equal(normalizeGermanyPostalCode('00123'), '00123');
  assert.equal(normalizeGermanyPostalCode('00-123'), null);
  assert.equal(normalizePostalContextPostalCode('de', '00 123'), '00123');
  assert.equal(normalizeCzechiaPostalCode('\uFF10\uFF10\uFF11\uFF12\uFF13'), '001 23');
  assert.equal(normalizeCzechiaPostalCode('00123'), '001 23');
  assert.equal(normalizeCzechiaPostalCode('001 23'), '001 23');
  assert.equal(normalizeCzechiaPostalCode('001-23'), null);
  assert.equal(normalizePostalContextPostalCode('cz', '00123'), '001 23');
  assert.equal(normalizePostalContextPostalCode('US', '00001'), null);
});

test('declares country-specific full-code geometry semantics', () => {
  assert.equal(isPostalContextCountryCode('JP'), true);
  assert.equal(isPostalContextCountryCode('SG'), true);
  assert.equal(isPostalContextCountryCode('NL'), true);
  assert.equal(isPostalContextCountryCode('GB'), true);
  assert.equal(isPostalContextCountryCode('US'), false);
  assert.equal(isPostalContextCountryCode('FR'), true);
  assert.equal(isPostalContextCountryCode('NZ'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.SG.fullCodeGeometrySemantics,
    'delivery-point-first',
  );
  assert.equal(isPostalContextCountryCode('IS'), true);
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
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.FR.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.FR.postalCodeFormat, 'NNNNN');
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.NZ.fullCodeGeometrySemantics,
    'delivery-network-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.NZ.postalCodeFormat, 'NNNN');
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.IS.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IS.postalCodeFormat, 'NNN');
  assert.equal(isPostalContextCountryCode('IT'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.IT.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IT.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('EE'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.EE.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.EE.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('CH'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.CH.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CH.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('DE'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.DE.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.DE.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('CZ'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.CZ.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CZ.postalCodeFormat, 'NNN NN');
});
