import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  normalizeGeorgiaPostalCode,
  normalizeSerbiaPostalCode,
  normalizeCroatiaPostalCode,
  normalizeCyprusPostalCode,
  normalizeAustriaPostalCode,
  normalizeAlbaniaPostalCode,
  normalizeAndorraPostalCode,
  normalizeArmeniaPostalCode,
  normalizeAzerbaijanPostalCode,
  normalizeAustraliaPostalCode,
  normalizeLatviaPostalCode,
  normalizeLithuaniaPostalCode,
  normalizeLiechtensteinPostalCode,
  normalizeUkrainePostalCode,
  POSTAL_CONTEXT_COUNTRY_POLICIES,
  isPostalContextCountryCode,
  normalizeIcelandPostalCode,
  normalizeEstoniaPostalCode,
  normalizeSwitzerlandPostalCode,
  normalizeGermanyPostalCode,
  normalizeCzechiaPostalCode,
  normalizeSlovakiaPostalCode,
  normalizeSloveniaPostalCode,
  normalizeNorwayPostalCode,
  normalizeHungaryPostalCode,
  normalizeFinlandPostalCode,
  normalizeBulgariaPostalCode,
  normalizeBelarusPostalCode,
  normalizeBelgiumPostalCode,
  normalizeMontenegroPostalCode,
  normalizeRomaniaPostalCode,
  normalizeTaiwanPostalCode,
  normalizeKoreaPostalCode,
  normalizeSaudiArabiaPostalCode,
  normalizeMaltaPostalCode,
  normalizeMonacoPostalCode,
  normalizeDenmarkPostalCode,
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
  assert.equal(normalizeSlovakiaPostalCode('０００００'), '000 00');
  assert.equal(normalizeSlovakiaPostalCode('00000'), '000 00');
  assert.equal(normalizeSlovakiaPostalCode('000 00'), '000 00');
  assert.equal(normalizeSlovakiaPostalCode('000-00'), null);
  assert.equal(normalizePostalContextPostalCode('sk', '00000'), '000 00');
  assert.equal(normalizeSloveniaPostalCode('００００'), '0000');
  assert.equal(normalizeSloveniaPostalCode('ＳＩ－００００'), '0000');
  assert.equal(normalizeSloveniaPostalCode('SI-0000'), '0000');
  assert.equal(normalizeSloveniaPostalCode('SI0000'), null);
  assert.equal(normalizeSloveniaPostalCode('00-00'), null);
  assert.equal(normalizePostalContextPostalCode('si', 'SI-0000'), '0000');
  assert.equal(normalizeNorwayPostalCode('００００'), '0000');
  assert.equal(normalizeNorwayPostalCode('00 00'), '0000');
  assert.equal(normalizeNorwayPostalCode('NO-0000'), null);
  assert.equal(normalizeNorwayPostalCode('00000'), null);
  assert.equal(normalizePostalContextPostalCode('no', '00 00'), '0000');
  assert.equal(normalizeHungaryPostalCode('００００'), '0000');
  assert.equal(normalizeHungaryPostalCode('00 00'), '0000');
  assert.equal(normalizeHungaryPostalCode('HU-0000'), null);
  assert.equal(normalizeHungaryPostalCode('00000'), null);
  assert.equal(normalizePostalContextPostalCode('hu', '00 00'), '0000');
  assert.equal(normalizeFinlandPostalCode('０００００'), '00000');
  assert.equal(normalizeFinlandPostalCode('00 000'), '00000');
  assert.equal(normalizeFinlandPostalCode('FI-00000'), null);
  assert.equal(normalizeFinlandPostalCode('0000'), null);
  assert.equal(normalizePostalContextPostalCode('fi', '00 000'), '00000');
  assert.equal(normalizeBulgariaPostalCode('００００'), '0000');
  assert.equal(normalizeBulgariaPostalCode('00 00'), '0000');
  assert.equal(normalizeBulgariaPostalCode('BG-0000'), null);
  assert.equal(normalizeBulgariaPostalCode('00000'), null);
  assert.equal(normalizePostalContextPostalCode('bg', '00 00'), '0000');
  assert.equal(normalizeBelarusPostalCode('００００００'), '000000');
  assert.equal(normalizeBelarusPostalCode('000 000'), '000000');
  assert.equal(normalizeBelarusPostalCode('BY-000000'), null);
  assert.equal(normalizeBelarusPostalCode('00000'), null);
  assert.equal(normalizePostalContextPostalCode('by', '000 000'), '000000');
  assert.equal(normalizeBelgiumPostalCode('００００'), '0000');
  assert.equal(normalizeBelgiumPostalCode('00 00'), '0000');
  assert.equal(normalizeBelgiumPostalCode('B-0000'), null);
  assert.equal(normalizeBelgiumPostalCode('BE-0000'), null);
  assert.equal(normalizeBelgiumPostalCode('00000'), null);
  assert.equal(normalizePostalContextPostalCode('be', '00 00'), '0000');
  assert.equal(normalizeMontenegroPostalCode('８１ ０００'), '81000');
  assert.equal(normalizeMontenegroPostalCode('81 000'), '81000');
  assert.equal(normalizeMontenegroPostalCode('ME-81000'), null);
  assert.equal(normalizeMontenegroPostalCode('8100'), null);
  assert.equal(normalizeMontenegroPostalCode('810000'), null);
  assert.equal(normalizePostalContextPostalCode('me', '81 000'), '81000');
  assert.equal(normalizeRomaniaPostalCode('００００００'), '000000');
  assert.equal(normalizeRomaniaPostalCode('000 000'), '000000');
  assert.equal(normalizeRomaniaPostalCode('RO-000000'), null);
  assert.equal(normalizeRomaniaPostalCode('00000'), null);
  assert.equal(normalizeRomaniaPostalCode('0000000'), null);

  assert.equal(normalizeTaiwanPostalCode('００００００'), '000000');
  assert.equal(normalizeTaiwanPostalCode('000 000'), '000000');
  assert.equal(normalizeTaiwanPostalCode('TW-000000'), null);
  assert.equal(normalizeTaiwanPostalCode('000-000'), null);
  assert.equal(normalizeTaiwanPostalCode('00000'), null);
  assert.equal(normalizeTaiwanPostalCode('0000000'), null);
  assert.equal(normalizeKoreaPostalCode('０００００'), '00000');
  assert.equal(normalizeKoreaPostalCode('00 000'), '00000');
  assert.equal(normalizeKoreaPostalCode('KR-00000'), null);
  assert.equal(normalizeKoreaPostalCode('000-00'), null);
  assert.equal(normalizeKoreaPostalCode('0000'), null);
  assert.equal(normalizeKoreaPostalCode('000000'), null);
  assert.equal(normalizePostalContextPostalCode('kr', '00 000'), '00000');
  assert.equal(normalizeSaudiArabiaPostalCode('０００００'), '00000');
  assert.equal(normalizeSaudiArabiaPostalCode('00 000'), '00000');
  assert.equal(normalizeSaudiArabiaPostalCode('SA-00000'), null);
  assert.equal(normalizeSaudiArabiaPostalCode('000-00'), null);
  assert.equal(normalizeSaudiArabiaPostalCode('0000'), null);
  assert.equal(normalizeSaudiArabiaPostalCode('000000'), null);
  assert.equal(normalizePostalContextPostalCode('sa', '00 000'), '00000');
  assert.equal(normalizePostalContextPostalCode('ro', '000 000'), '000000');
  assert.equal(normalizeDenmarkPostalCode('\uFF10\uFF10\uFF11\uFF12'), '0012');
  assert.equal(normalizeDenmarkPostalCode('00 12'), '0012');
  assert.equal(normalizeDenmarkPostalCode('0012'), '0012');
  assert.equal(normalizeDenmarkPostalCode('00-12'), null);
  assert.equal(normalizePostalContextPostalCode('dk', '00 12'), '0012');
  assert.equal(normalizeMaltaPostalCode('ｖｌｔ１１１７'), 'VLT 1117');
  assert.equal(normalizeMaltaPostalCode('vlt1117'), 'VLT 1117');
  assert.equal(normalizeMaltaPostalCode('VLT 1117'), 'VLT 1117');
  assert.equal(normalizeMaltaPostalCode('VLT-1117'), null);
  assert.equal(normalizePostalContextPostalCode('mt', 'vlt1117'), 'VLT 1117');
  assert.equal(normalizeMonacoPostalCode('９８０００'), '98000');
  assert.equal(normalizeMonacoPostalCode('98 000'), '98000');
  assert.equal(normalizeMonacoPostalCode('98099'), '98099');
  assert.equal(normalizeMonacoPostalCode('98100'), null);
  assert.equal(normalizeMonacoPostalCode('MC 98000'), null);
  assert.equal(normalizePostalContextPostalCode('mc', '98 000'), '98000');
  assert.equal(normalizeAustraliaPostalCode('００００'), '0000');
  assert.equal(normalizeAustraliaPostalCode('00 00'), '0000');
  assert.equal(normalizeAustraliaPostalCode('00-00'), null);
  assert.equal(normalizeAustraliaPostalCode('AU 0000'), null);
  assert.equal(normalizePostalContextPostalCode('au', '00 00'), '0000');
  assert.equal(normalizeLatviaPostalCode('ＬＶ－００００'), 'LV-0000');
  assert.equal(normalizeLatviaPostalCode('lv0000'), 'LV-0000');
  assert.equal(normalizeLatviaPostalCode('00 00'), 'LV-0000');
  assert.equal(normalizeLatviaPostalCode('LT-0000'), null);
  assert.equal(normalizeLatviaPostalCode('LV-000'), null);
  assert.equal(normalizePostalContextPostalCode('lv', 'lv 0000'), 'LV-0000');
  assert.equal(normalizeLithuaniaPostalCode('ＬＴ－０００００'), 'LT-00000');
  assert.equal(normalizeLithuaniaPostalCode('lt00000'), 'LT-00000');
  assert.equal(normalizeLithuaniaPostalCode('00 000'), 'LT-00000');
  assert.equal(normalizeLithuaniaPostalCode('LV-00000'), null);
  assert.equal(normalizeLithuaniaPostalCode('LT-0000'), null);
  assert.equal(normalizePostalContextPostalCode('lt', 'lt 00000'), 'LT-00000');
  assert.equal(normalizeLiechtensteinPostalCode('９４００'), '9400');
  assert.equal(normalizeLiechtensteinPostalCode('94 00'), '9400');
  assert.equal(normalizeLiechtensteinPostalCode('94-00'), null);
  assert.equal(normalizeLiechtensteinPostalCode('8000'), null);
  assert.equal(normalizePostalContextPostalCode('li', '94 00'), '9400');
  assert.equal(normalizePostalContextPostalCode('US', '00001'), null);
  assert.equal(normalizeAzerbaijanPostalCode('ＡＺ１０１０'), 'AZ1010');
  assert.equal(normalizeAzerbaijanPostalCode('az 1010'), 'AZ1010');
  assert.equal(normalizeAzerbaijanPostalCode('1010'), 'AZ1010');
  assert.equal(normalizeAzerbaijanPostalCode('AZ-1010'), null);
  assert.equal(normalizeAzerbaijanPostalCode('AZ101'), null);
  assert.equal(normalizePostalContextPostalCode('az', '1010'), 'AZ1010');
  assert.equal(normalizeAlbaniaPostalCode('１００１'), '1001');
  assert.equal(normalizeAlbaniaPostalCode('10 01'), '1001');
  assert.equal(normalizeAlbaniaPostalCode('10-01'), null);
  assert.equal(normalizeAlbaniaPostalCode('AL1001'), null);
  assert.equal(normalizePostalContextPostalCode('al', '00 01'), '0001');
  assert.equal(normalizeArmeniaPostalCode('０００２'), '0002');
  assert.equal(normalizeArmeniaPostalCode('00 02'), '0002');
  assert.equal(normalizeArmeniaPostalCode('00-02'), null);
  assert.equal(normalizeArmeniaPostalCode('AM0002'), null);
  assert.equal(normalizePostalContextPostalCode('am', '00 02'), '0002');
  assert.equal(normalizeAndorraPostalCode('ＡＤ５００'), 'AD500');
  assert.equal(normalizeAndorraPostalCode('ad 500'), 'AD500');
  assert.equal(normalizeAndorraPostalCode('500'), 'AD500');
  assert.equal(normalizeAndorraPostalCode('AD-500'), null);
  assert.equal(normalizeAndorraPostalCode('ES500'), null);
  assert.equal(normalizePostalContextPostalCode('ad', '000'), 'AD000');
  assert.equal(normalizeUkrainePostalCode('０１００１'), '01001');
  assert.equal(normalizeUkrainePostalCode('01 001'), '01001');
  assert.equal(normalizeUkrainePostalCode('01-001'), null);
  assert.equal(normalizeUkrainePostalCode('UA01001'), null);
  assert.equal(normalizePostalContextPostalCode('ua', '00 001'), '00001');
  assert.equal(normalizeAustriaPostalCode('０１０１'), '0101');
  assert.equal(normalizeAustriaPostalCode('01 01'), '0101');
  assert.equal(normalizeAustriaPostalCode('01-01'), null);
  assert.equal(normalizeAustriaPostalCode('AT0101'), null);
  assert.equal(normalizePostalContextPostalCode('at', '00 01'), '0001');
  assert.equal(normalizeCyprusPostalCode('２００８'), '2008');
  assert.equal(normalizeCyprusPostalCode('20 08'), '2008');
  assert.equal(normalizeCyprusPostalCode('CY-2008'), '2008');
  assert.equal(normalizeCyprusPostalCode('CY2008'), null);
  assert.equal(normalizeCyprusPostalCode('99010'), null);
  assert.equal(normalizePostalContextPostalCode('cy', 'CY-0001'), '0001');
  assert.equal(normalizeCroatiaPostalCode('１００００'), '10000');
  assert.equal(normalizeCroatiaPostalCode('10 000'), '10000');
  assert.equal(normalizeCroatiaPostalCode('HR-10000'), '10000');
  assert.equal(normalizeCroatiaPostalCode('HR10000'), null);
  assert.equal(normalizeCroatiaPostalCode('100-00'), null);
  assert.equal(normalizePostalContextPostalCode('hr', 'HR-00001'), '00001');
  assert.equal(normalizeSerbiaPostalCode('０００００'), '00000');
  assert.equal(normalizeSerbiaPostalCode('00 000'), '00000');
  assert.equal(normalizeSerbiaPostalCode('RS-00000'), null);
  assert.equal(normalizeSerbiaPostalCode('000000'), null);
  assert.equal(normalizePostalContextPostalCode('rs', '00 000'), '00000');

  assert.equal(normalizeGeorgiaPostalCode('０００２'), '0002');
  assert.equal(normalizeGeorgiaPostalCode('00 02'), '0002');
  assert.equal(normalizeGeorgiaPostalCode('00-02'), null);
  assert.equal(normalizeGeorgiaPostalCode('GE0002'), null);
  assert.equal(normalizeGeorgiaPostalCode('00020'), null);
  assert.equal(normalizePostalContextPostalCode('ge', '00 02'), '0002');
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
  assert.equal(isPostalContextCountryCode('SK'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.SK.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.SK.postalCodeFormat, 'NNN NN');
  assert.equal(isPostalContextCountryCode('SI'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.SI.fullCodeGeometrySemantics,
    'area-or-non-area',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.SI.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('DK'), true);
  assert.equal(isPostalContextCountryCode('NO'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.NO.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.NO.postalCodeFormat, 'NNNN');
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.DK.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.DK.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('MT'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.MT.fullCodeGeometrySemantics,
    'address-range-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MT.postalCodeFormat, 'AAA NNNN');
  assert.equal(isPostalContextCountryCode('MC'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.MC.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MC.postalCodeFormat, '980NN');
  assert.equal(isPostalContextCountryCode('AU'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.AU.fullCodeGeometrySemantics,
    'delivery-network-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.AU.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('HU'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.HU.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.HU.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('FI'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.FI.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.FI.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('BG'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.BG.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.BG.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('BY'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.BY.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.BY.postalCodeFormat, 'NNNNNN');
  assert.equal(isPostalContextCountryCode('BE'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.BE.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.BE.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('ME'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.ME.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.ME.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('LV'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.LV.fullCodeGeometrySemantics,
    'address-range-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LV.postalCodeFormat, 'LV-NNNN');
  assert.equal(isPostalContextCountryCode('LT'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.LT.fullCodeGeometrySemantics,
    'address-range-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LT.postalCodeFormat, 'LT-NNNNN');
  assert.equal(isPostalContextCountryCode('LI'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.LI.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LI.postalCodeFormat, '94NN');
  assert.equal(isPostalContextCountryCode('AZ'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.AZ.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.AZ.postalCodeFormat, 'AZNNNN');
  assert.equal(isPostalContextCountryCode('AL'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.AL.fullCodeGeometrySemantics,
    'delivery-network-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.AL.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('AM'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.AM.fullCodeGeometrySemantics,
    'delivery-network-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.AM.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('AD'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.AD.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.AD.postalCodeFormat, 'ADNNN');
  assert.equal(isPostalContextCountryCode('UA'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.UA.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.UA.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('AT'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.AT.fullCodeGeometrySemantics,
    'area-or-non-area',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.AT.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('CY'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.CY.fullCodeGeometrySemantics,
    'address-range-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CY.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('GR'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.GR.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.GR.postalCodeFormat, 'NNN NN');
  assert.equal(isPostalContextCountryCode('RS'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.RS.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.RS.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('KR'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.KR.fullCodeGeometrySemantics,
    'postal-area-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.KR.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('SA'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.SA.fullCodeGeometrySemantics,
    'address-range-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.SA.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('GE'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.GE.fullCodeGeometrySemantics,
    'delivery-network-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.GE.postalCodeFormat, 'NNNN');
});
