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
  normalizeOmanPostalCode,
  normalizeSouthAfricaPostalCode,
  normalizeEgyptPostalCode,
  normalizeMoroccoPostalCode,
  normalizeAlgeriaPostalCode,
  normalizeEthiopiaPostalCode,
  normalizeCaboVerdePostalCode,
  normalizeKenyaPostalCode,
  normalizeZambiaPostalCode,
  normalizeSenegalPostalCode,
  normalizeTanzaniaPostalCode,
  normalizeTunisiaPostalCode,
  normalizeNigeriaPostalCode,
  normalizeSeychellesPostalCode,
  normalizeIndiaPostalCode,
  normalizePakistanPostalCode,
  normalizeBangladeshPostalCode,
  normalizeBhutanPostalCode,
  normalizeBruneiPostalCode,
  normalizeVietnamPostalCode,
  normalizeMalaysiaPostalCode,
  normalizeMyanmarPostalCode,
  normalizeMaldivesPostalCode,
  normalizeMongoliaPostalCode,
  normalizeJordanPostalCode,
  normalizeLaosPostalCode,
  normalizeLebanonPostalCode,
  normalizeAfghanistanPostalCode,
  normalizeIsraelPostalCode,
  normalizeIraqPostalCode,
  normalizeIranPostalCode,
  normalizeUzbekistanPostalCode,
  normalizeKazakhstanPostalCode,
  normalizeChinaPostalCode,
  normalizeCambodiaPostalCode,
  normalizeKyrgyzstanPostalCode,
  normalizeUnitedStatesPostalCode,
  normalizeCanadaPostalCode,
  normalizeMexicoPostalCode,
  normalizeCubaPostalCode,
  normalizeArgentinaPostalCode,
  normalizeUruguayPostalCode,
  normalizeEcuadorPostalCode,
  normalizeElSalvadorPostalCode,
  normalizeGuatemalaPostalCode,
  normalizeCostaRicaPostalCode,
  normalizeChilePostalCode,
  normalizeDominicanRepublicPostalCode,
  normalizeHaitiPostalCode,
  normalizePanamaPostalCode,
  normalizeBarbadosPostalCode,
  normalizeNicaraguaPostalCode,
  normalizeBrazilPostalCode,
  normalizeVenezuelaPostalCode,
  normalizePeruPostalCode,
  normalizeColombiaPostalCode,
  normalizeIndonesiaPostalCode,
  normalizePhilippinesPostalCode,
  normalizeKuwaitPostalCode,
  normalizeBahrainPostalCode,
  classifyMoroccoPostalCode,
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
  assert.equal(normalizeOmanPostalCode('０００'), '000');
  assert.equal(normalizeOmanPostalCode('0 00'), '000');
  assert.equal(normalizeOmanPostalCode('OM-000'), null);
  assert.equal(normalizeOmanPostalCode('00-0'), null);
  assert.equal(normalizeOmanPostalCode('00'), null);
  assert.equal(normalizeOmanPostalCode('0000'), null);
  assert.equal(normalizePostalContextPostalCode('om', '0 00'), '000');
  assert.equal(normalizeSouthAfricaPostalCode('００００'), '0000');
  assert.equal(normalizeSouthAfricaPostalCode('00 00'), '0000');
  assert.equal(normalizeSouthAfricaPostalCode('ZA-0000'), null);
  assert.equal(normalizeSouthAfricaPostalCode('00-00'), null);
  assert.equal(normalizeSouthAfricaPostalCode('000'), null);
  assert.equal(normalizeSouthAfricaPostalCode('00000'), null);
  assert.equal(normalizePostalContextPostalCode('za', '00 00'), '0000');
  assert.equal(normalizeEgyptPostalCode('０００００００'), '0000000');
  assert.equal(normalizeEgyptPostalCode('00 0 00 00'), '0000000');
  assert.equal(normalizeEgyptPostalCode('EG-0000000'), null);
  assert.equal(normalizeEgyptPostalCode('000-0000'), null);
  assert.equal(normalizeEgyptPostalCode('00000'), null);
  assert.equal(normalizeEgyptPostalCode('000000'), null);
  assert.equal(normalizeEgyptPostalCode('00000000'), null);
  assert.equal(normalizePostalContextPostalCode('eg', '00 0 00 00'), '0000000');
  assert.equal(normalizeMoroccoPostalCode('０００００'), '00000');
  assert.equal(normalizeMoroccoPostalCode('00 000'), '00000');
  assert.equal(normalizeMoroccoPostalCode('MA-00000'), null);
  assert.equal(normalizeMoroccoPostalCode('000-00'), null);
  assert.equal(normalizeMoroccoPostalCode('0000'), null);
  assert.equal(normalizeMoroccoPostalCode('000000'), null);
  assert.equal(classifyMoroccoPostalCode('00000'), 'home_delivery_sector');
  assert.equal(classifyMoroccoPostalCode('00001'), 'home_delivery_sector');
  assert.equal(classifyMoroccoPostalCode('00002'), 'agency_or_centre');
  assert.equal(classifyMoroccoPostalCode('00006'), 'agency_or_centre');
  assert.equal(classifyMoroccoPostalCode('00007'), 'home_delivery_sector');
  assert.equal(classifyMoroccoPostalCode('00008'), 'home_delivery_sector');
  assert.equal(classifyMoroccoPostalCode('00009'), 'large_volume_recipient');
  assert.equal(classifyMoroccoPostalCode('MA-00000'), null);
  assert.equal(normalizePostalContextPostalCode('ma', '00 000'), '00000');
  assert.equal(normalizeAlgeriaPostalCode('０９９９９'), '09999');
  assert.equal(normalizeAlgeriaPostalCode('09 999'), '09999');
  assert.equal(normalizeAlgeriaPostalCode('DZ-09999'), null);
  assert.equal(normalizeAlgeriaPostalCode('099-99'), null);
  assert.equal(normalizeAlgeriaPostalCode('0999'), null);
  assert.equal(normalizeAlgeriaPostalCode('099999'), null);
  assert.equal(normalizePostalContextPostalCode('dz', '09 999'), '09999');
  assert.equal(normalizeEthiopiaPostalCode('０９９９'), '0999');
  assert.equal(normalizeEthiopiaPostalCode('09 99'), '0999');
  assert.equal(normalizeEthiopiaPostalCode('ET-0999'), null);
  assert.equal(normalizeEthiopiaPostalCode('09-99'), null);
  assert.equal(normalizeEthiopiaPostalCode('999'), null);
  assert.equal(normalizeEthiopiaPostalCode('09999'), null);
  assert.equal(normalizePostalContextPostalCode('et', '09 99'), '0999');
  assert.equal(normalizeCaboVerdePostalCode('０９９９'), '0999');
  assert.equal(normalizeCaboVerdePostalCode('09 99'), '0999');
  assert.equal(normalizeCaboVerdePostalCode('CV-0999'), null);
  assert.equal(normalizeCaboVerdePostalCode('7937-049'), null);
  assert.equal(normalizeCaboVerdePostalCode('999'), null);
  assert.equal(normalizeCaboVerdePostalCode('09999'), null);
  assert.equal(normalizePostalContextPostalCode('cv', '09 99'), '0999');
  assert.equal(normalizeKenyaPostalCode('０９９９９'), '09999');
  assert.equal(normalizeKenyaPostalCode('09 999'), '09999');
  assert.equal(normalizeKenyaPostalCode('KE-09999'), null);
  assert.equal(normalizeKenyaPostalCode('34567-00100'), null);
  assert.equal(normalizeKenyaPostalCode('0999'), null);
  assert.equal(normalizeKenyaPostalCode('099999'), null);
  assert.equal(normalizePostalContextPostalCode('ke', '09 999'), '09999');
  assert.equal(normalizeZambiaPostalCode('０９９９８'), '09998');
  assert.equal(normalizeZambiaPostalCode('09 998'), '09998');
  assert.equal(normalizeZambiaPostalCode('ZM-09998'), null);
  assert.equal(normalizeZambiaPostalCode('P.O. Box 09998'), null);
  assert.equal(normalizeZambiaPostalCode('0999'), null);
  assert.equal(normalizeZambiaPostalCode('099998'), null);
  assert.equal(normalizePostalContextPostalCode('zm', '09 998'), '09998');
  assert.equal(normalizeSenegalPostalCode('０９９９７'), '09997');
  assert.equal(normalizeSenegalPostalCode('09 997'), '09997');
  assert.equal(normalizeSenegalPostalCode('SN-09997'), null);
  assert.equal(normalizeSenegalPostalCode('BP 09997'), null);
  assert.equal(normalizeSenegalPostalCode('9997'), null);
  assert.equal(normalizeSenegalPostalCode('099997'), null);
  assert.equal(normalizePostalContextPostalCode('sn', '09 997'), '09997');
  assert.equal(normalizeTanzaniaPostalCode('１１１０１'), '11101');
  assert.equal(normalizeTanzaniaPostalCode('11 101'), '11101');
  assert.equal(normalizeTanzaniaPostalCode('TZ-11101'), null);
  assert.equal(normalizeTanzaniaPostalCode('PO Box 11101'), null);
  assert.equal(normalizeTanzaniaPostalCode('1110'), null);
  assert.equal(normalizeTanzaniaPostalCode('111010'), null);
  assert.equal(normalizePostalContextPostalCode('tz', '11 101'), '11101');
  assert.equal(normalizeTunisiaPostalCode('０９９６'), '0996');
  assert.equal(normalizeTunisiaPostalCode('09 96'), '0996');
  assert.equal(normalizeTunisiaPostalCode('TN-0996'), null);
  assert.equal(normalizeTunisiaPostalCode('B.P. 0996'), null);
  assert.equal(normalizeTunisiaPostalCode('996'), null);
  assert.equal(normalizeTunisiaPostalCode('00996'), null);
  assert.equal(normalizePostalContextPostalCode('tn', '09 96'), '0996');
  assert.equal(normalizeNigeriaPostalCode('９９９９９６'), '999996');
  assert.equal(normalizeNigeriaPostalCode('999 996'), '999996');
  assert.equal(normalizeNigeriaPostalCode('fc 02-a09 db 09'), 'FC02A09DB09');
  assert.equal(normalizeNigeriaPostalCode('NG-999996'), null);
  assert.equal(normalizeNigeriaPostalCode('P.O. Box 999996'), null);
  assert.equal(normalizeNigeriaPostalCode('FC02A09DB0'), null);
  assert.equal(normalizeNigeriaPostalCode('FC02A09DB099'), null);
  assert.equal(normalizePostalContextPostalCode('ng', 'fc02 a09-db09'), 'FC02A09DB09');
  assert.equal(normalizeSeychellesPostalCode('0000'), null);
  assert.equal(normalizeSeychellesPostalCode('1234'), null);
  assert.equal(normalizeSeychellesPostalCode('SC-SYN-NATIONAL-ADDRESS-99999'), null);
  assert.equal(normalizeSeychellesPostalCode('P.O. Box 123'), null);
  assert.equal(normalizePostalContextPostalCode('sc', '0000'), null);
  assert.equal(normalizeIndiaPostalCode('１０００００'), '100000');
  assert.equal(normalizeIndiaPostalCode('100 000'), '100000');
  assert.equal(normalizeIndiaPostalCode('IN-100000'), null);
  assert.equal(normalizeIndiaPostalCode('100-000'), null);
  assert.equal(normalizeIndiaPostalCode('000000'), null);
  assert.equal(normalizeIndiaPostalCode('10000'), null);
  assert.equal(normalizeIndiaPostalCode('1000000'), null);
  assert.equal(normalizePostalContextPostalCode('in', '100 000'), '100000');
  assert.equal(normalizePakistanPostalCode('０３００１'), '03001');
  assert.equal(normalizePakistanPostalCode('03 001'), '03001');
  assert.equal(normalizePakistanPostalCode('PK-03001'), null);
  assert.equal(normalizePakistanPostalCode('030-01'), null);
  assert.equal(normalizePakistanPostalCode('0000'), null);
  assert.equal(normalizePakistanPostalCode('000000'), null);
  assert.equal(normalizePostalContextPostalCode('pk', '03 001'), '03001');
  assert.equal(normalizeBangladeshPostalCode('১২০৫'), '1205');
  assert.equal(normalizeBangladeshPostalCode('1 205'), '1205');
  assert.equal(normalizeBangladeshPostalCode('０１２３'), null);
  assert.equal(normalizeBangladeshPostalCode('BD-1205'), null);
  assert.equal(normalizeBangladeshPostalCode('12-05'), null);
  assert.equal(normalizeBangladeshPostalCode('120'), null);
  assert.equal(normalizeBangladeshPostalCode('12050'), null);
  assert.equal(normalizePostalContextPostalCode('bd', '১ ২০৫'), '1205');
  assert.equal(normalizeBhutanPostalCode('９９９９９'), '99999');
  assert.equal(normalizeBhutanPostalCode('99 999'), '99999');
  assert.equal(normalizeBhutanPostalCode('BT-99999'), null);
  assert.equal(normalizeBhutanPostalCode('999-99'), null);
  assert.equal(normalizeBhutanPostalCode('9999'), null);
  assert.equal(normalizeBhutanPostalCode('999999'), null);
  assert.equal(normalizePostalContextPostalCode('bt', '９９ ９９９'), '99999');
  assert.equal(normalizeBruneiPostalCode('ｂｚ９９９９'), 'BZ9999');
  assert.equal(normalizeBruneiPostalCode('BZ 9999'), 'BZ9999');
  assert.equal(normalizeBruneiPostalCode('AA9999'), null);
  assert.equal(normalizeBruneiPostalCode('BN-BZ9999'), null);
  assert.equal(normalizeBruneiPostalCode('BZ-9999'), null);
  assert.equal(normalizeBruneiPostalCode('BZ999'), null);
  assert.equal(normalizeBruneiPostalCode('BZ99999'), null);
  assert.equal(normalizePostalContextPostalCode('bn', 'ｂｚ ９９９９'), 'BZ9999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.VN.postalCodeFormat, 'NNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.VN.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeVietnamPostalCode('９９ ９９９'), '99999');
  assert.equal(normalizeVietnamPostalCode('00000'), '00000');
  assert.equal(normalizeVietnamPostalCode('VN-99999'), null);
  assert.equal(normalizeVietnamPostalCode('99-999'), null);
  assert.equal(normalizeVietnamPostalCode('9999'), null);
  assert.equal(normalizeVietnamPostalCode('999999'), null);
  assert.equal(normalizePostalContextPostalCode('vn', '９９ ９９９'), '99999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MY.postalCodeFormat, 'NNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MY.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeMalaysiaPostalCode('０１ ０００'), '01000');
  assert.equal(normalizeMalaysiaPostalCode('00000'), '00000');
  assert.equal(normalizeMalaysiaPostalCode('MY-01000'), null);
  assert.equal(normalizeMalaysiaPostalCode('01-000'), null);
  assert.equal(normalizeMalaysiaPostalCode('1000'), null);
  assert.equal(normalizeMalaysiaPostalCode('010000'), null);
  assert.equal(normalizePostalContextPostalCode('my', '０１ ０００'), '01000');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MM.postalCodeFormat, 'NNNNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MM.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeMyanmarPostalCode('၀၁ ၂၃ ၄၅၆'), '0123456');
  assert.equal(normalizeMyanmarPostalCode('０１ ２３ ４５６'), '0123456');
  assert.equal(normalizeMyanmarPostalCode('0000000'), '0000000');
  assert.equal(normalizeMyanmarPostalCode('MM-0123456'), null);
  assert.equal(normalizeMyanmarPostalCode('012-3456'), null);
  assert.equal(normalizeMyanmarPostalCode('123456'), null);
  assert.equal(normalizeMyanmarPostalCode('01234567'), null);
  assert.equal(normalizePostalContextPostalCode('mm', '၀၁ ၂၃ ၄၅၆'), '0123456');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MV.postalCodeFormat, 'NNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MV.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeMaldivesPostalCode('٠١ ٢٣٤'), '01234');
  assert.equal(normalizeMaldivesPostalCode('۰۱ ۲۳۴'), '01234');
  assert.equal(normalizeMaldivesPostalCode('０１ ２３４'), '01234');
  assert.equal(normalizeMaldivesPostalCode('00000'), '00000');
  assert.equal(normalizeMaldivesPostalCode('MV-01234'), null);
  assert.equal(normalizeMaldivesPostalCode('01-234'), null);
  assert.equal(normalizeMaldivesPostalCode('1234'), null);
  assert.equal(normalizeMaldivesPostalCode('012345'), null);
  assert.equal(normalizePostalContextPostalCode('mv', '٠١ ٢٣٤'), '01234');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MN.postalCodeFormat, 'NNNNN or NNNNN-NNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MN.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeMongoliaPostalCode('９９ ９９９'), '99999');
  assert.equal(normalizeMongoliaPostalCode('９９９９９－９９９９'), '99999-9999');
  assert.equal(normalizeMongoliaPostalCode('999999999'), '99999-9999');
  assert.equal(normalizeMongoliaPostalCode('00000-0000'), '00000-0000');
  assert.equal(normalizeMongoliaPostalCode('MN-99999'), null);
  assert.equal(normalizeMongoliaPostalCode('9999'), null);
  assert.equal(normalizeMongoliaPostalCode('999999'), null);
  assert.equal(normalizeMongoliaPostalCode('9999-99999'), null);
  assert.equal(normalizePostalContextPostalCode('mn', '９９９９９９９９９'), '99999-9999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.JO.postalCodeFormat, 'NNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.JO.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.equal(normalizeJordanPostalCode('٩٩ ٩٩٩'), '99999');
  assert.equal(normalizeJordanPostalCode('۹۹ ۹۹۹'), '99999');
  assert.equal(normalizeJordanPostalCode('９９ ９９９'), '99999');
  assert.equal(normalizeJordanPostalCode('JO-99999'), null);
  assert.equal(normalizeJordanPostalCode('99-999'), null);
  assert.equal(normalizePostalContextPostalCode('jo', '٩٩ ٩٩٩'), '99999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LA.postalCodeFormat, 'NNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LA.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeLaosPostalCode('໐໑ ໒໓໔'), '01234');
  assert.equal(normalizeLaosPostalCode('๐๑ ๒๓๔'), '01234');
  assert.equal(normalizeLaosPostalCode('０１ ２３４'), '01234');
  assert.equal(normalizeLaosPostalCode('LA-01234'), null);
  assert.equal(normalizeLaosPostalCode('01-234'), null);
  assert.equal(normalizeLaosPostalCode('0123'), null);
  assert.equal(normalizePostalContextPostalCode('la', '໐໑ ໒໓໔'), '01234');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LB.postalCodeFormat, 'NNNN or NN NNN NNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LB.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeLebanonPostalCode('٠١٢٣'), '0123');
  assert.equal(normalizeLebanonPostalCode('۰۱ ۲۳۴ ۵۶۷'), '01 234 567');
  assert.equal(normalizeLebanonPostalCode('９９９９'), '9999');
  assert.equal(normalizeLebanonPostalCode('99 999 999'), '99 999 999');
  assert.equal(normalizeLebanonPostalCode('LB-9999'), null);
  assert.equal(normalizeLebanonPostalCode('99-999-999'), null);
  assert.equal(normalizeLebanonPostalCode('99999'), null);
  assert.equal(normalizePostalContextPostalCode('lb', '۰۱ ۲۳۴ ۵۶۷'), '01 234 567');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.AF.postalCodeFormat, 'NNNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.AF.fullCodeGeometrySemantics, 'postal-area-first');
  assert.equal(normalizeAfghanistanPostalCode('۹۹۹۹۹۹'), '999999');
  assert.equal(normalizeAfghanistanPostalCode('٩٩ ٩٩ ٩٩'), '999999');
  assert.equal(normalizeAfghanistanPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeAfghanistanPostalCode('AF-999999'), null);
  assert.equal(normalizeAfghanistanPostalCode('999-999'), null);
  assert.equal(normalizeAfghanistanPostalCode('9999'), null);
  assert.equal(normalizePostalContextPostalCode('af', '۹۹۹۹۹۹'), '999999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IL.postalCodeFormat, 'NNNNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IL.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeIsraelPostalCode('۹۹۹۹۹۹۹'), '9999999');
  assert.equal(normalizeIsraelPostalCode('٩٩ ٩٩٩ ٩٩'), '9999999');
  assert.equal(normalizeIsraelPostalCode('９９９９９９９'), '9999999');
  assert.equal(normalizeIsraelPostalCode('IL-9999999'), null);
  assert.equal(normalizeIsraelPostalCode('999-9999'), null);
  assert.equal(normalizeIsraelPostalCode('99999'), null);
  assert.equal(normalizePostalContextPostalCode('il', '۹۹۹۹۹۹۹'), '9999999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IQ.postalCodeFormat, 'NNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IQ.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeIraqPostalCode('۹۹۹۹۹'), '99999');
  assert.equal(normalizeIraqPostalCode('٩٩ ٩٩٩'), '99999');
  assert.equal(normalizeIraqPostalCode('９９９９９'), '99999');
  assert.equal(normalizeIraqPostalCode('IQ-99999'), null);
  assert.equal(normalizeIraqPostalCode('999-99'), null);
  assert.equal(normalizeIraqPostalCode('9999'), null);
  assert.equal(normalizeIraqPostalCode('999999'), null);
  assert.equal(normalizeIraqPostalCode('99999AR1'), null);
  assert.equal(normalizePostalContextPostalCode('iq', '۹۹۹۹۹'), '99999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IR.postalCodeFormat, 'NNNNNNNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IR.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeIranPostalCode('۹۹۹۹۹۹۹۹۹۹'), '9999999999');
  assert.equal(normalizeIranPostalCode('٩٩٩٩٩ ٩٩٩٩٩'), '9999999999');
  assert.equal(normalizeIranPostalCode('９９９９９９９９９９'), '9999999999');
  assert.equal(normalizeIranPostalCode('IR-9999999999'), null);
  assert.equal(normalizeIranPostalCode('99999-99999'), null);
  assert.equal(normalizeIranPostalCode('999999999'), null);
  assert.equal(normalizeIranPostalCode('99999999999'), null);
  assert.equal(normalizePostalContextPostalCode('ir', '۹۹۹۹۹۹۹۹۹۹'), '9999999999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.UZ.postalCodeFormat, 'NNNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.UZ.fullCodeGeometrySemantics, 'delivery-network-first');
  assert.equal(normalizeUzbekistanPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeUzbekistanPostalCode('999 999'), '999999');
  assert.equal(normalizeUzbekistanPostalCode('UZ-999999'), null);
  assert.equal(normalizeUzbekistanPostalCode('999-999'), null);
  assert.equal(normalizeUzbekistanPostalCode('99999'), null);
  assert.equal(normalizeUzbekistanPostalCode('9999999'), null);
  assert.equal(normalizePostalContextPostalCode('uz', '９９９９９９'), '999999');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.KZ.postalCodeFormat, 'LNNLNLN or NNNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.KZ.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(normalizeKazakhstanPostalCode('ｘ９９ｘ９ｘ９'), 'X99X9X9');
  assert.equal(normalizeKazakhstanPostalCode('x99 x9 x9'), 'X99X9X9');
  assert.equal(normalizeKazakhstanPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeKazakhstanPostalCode('KZ-X99X9X9'), null);
  assert.equal(normalizeKazakhstanPostalCode('X99-X9X9'), null);
  assert.equal(normalizeKazakhstanPostalCode('Х99X9X9'), null);
  assert.equal(normalizeKazakhstanPostalCode('X99X9X'), null);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CN.postalCodeFormat, 'NNNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CN.fullCodeGeometrySemantics, 'delivery-network-first');
  assert.equal(normalizeChinaPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeChinaPostalCode('99 99 99'), '999999');
  assert.equal(normalizeChinaPostalCode('CN-999999'), null);
  assert.equal(normalizeChinaPostalCode('999-999'), null);
  assert.equal(normalizeChinaPostalCode('99999'), null);
  assert.equal(normalizePostalContextPostalCode('cn', '00 00 01'), '000001');
  assert.equal(normalizeCambodiaPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeCambodiaPostalCode('99 99 99'), '999999');
  assert.equal(normalizeCambodiaPostalCode('KH-999999'), null);
  assert.equal(normalizeCambodiaPostalCode('999-999'), null);
  assert.equal(normalizeCambodiaPostalCode('99999'), null);
  assert.equal(normalizePostalContextPostalCode('kh', '00 00 01'), '000001');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.KG.postalCodeFormat, 'NNNNNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.KG.fullCodeGeometrySemantics, 'delivery-network-first');
  assert.equal(normalizeKyrgyzstanPostalCode('７９９９９９'), '799999');
  assert.equal(normalizeKyrgyzstanPostalCode('79 99 99'), '799999');
  assert.equal(normalizeKyrgyzstanPostalCode('KG-799999'), null);
  assert.equal(normalizeKyrgyzstanPostalCode('799-999'), null);
  assert.equal(normalizeKyrgyzstanPostalCode('ОС Передвижное'), null);
  assert.equal(normalizeKyrgyzstanPostalCode('79999'), null);
  assert.equal(normalizePostalContextPostalCode('kg', '00 00 01'), '000001');
  assert.equal(normalizePostalContextPostalCode('kz', 'ｘ９９ｘ９ｘ９'), 'X99X9X9');


  assert.equal(normalizeIndonesiaPostalCode('１００００'), '10000');
  assert.equal(normalizeIndonesiaPostalCode('10 000'), '10000');
  assert.equal(normalizeIndonesiaPostalCode('ID-10000'), null);
  assert.equal(normalizeIndonesiaPostalCode('100-00'), null);
  assert.equal(normalizeIndonesiaPostalCode('00000'), null);
  assert.equal(normalizeIndonesiaPostalCode('1000'), null);
  assert.equal(normalizeIndonesiaPostalCode('100000'), null);
  assert.equal(normalizePostalContextPostalCode('id', '10 000'), '10000');
  assert.equal(normalizePhilippinesPostalCode('１０００'), '1000');
  assert.equal(normalizePhilippinesPostalCode('1 000'), '1000');
  assert.equal(normalizePhilippinesPostalCode('0000'), '0000');
  assert.equal(normalizePhilippinesPostalCode('PH-1000'), null);
  assert.equal(normalizePhilippinesPostalCode('10-00'), null);
  assert.equal(normalizePhilippinesPostalCode('100'), null);
  assert.equal(normalizePhilippinesPostalCode('10000'), null);
  assert.equal(normalizePostalContextPostalCode('ph', '１ ０００'), '1000');
  assert.equal(normalizeKuwaitPostalCode('０００００'), '00000');
  assert.equal(normalizeKuwaitPostalCode('00 000'), '00000');
  assert.equal(normalizeKuwaitPostalCode('KW-00000'), null);
  assert.equal(normalizeKuwaitPostalCode('000-00'), null);
  assert.equal(normalizeKuwaitPostalCode('0000'), null);
  assert.equal(normalizeKuwaitPostalCode('000000'), null);
  assert.equal(normalizePostalContextPostalCode('kw', '00 000'), '00000');
  assert.equal(normalizeBahrainPostalCode('１００'), '100');
  assert.equal(normalizeBahrainPostalCode('1 212'), '1212');
  assert.equal(normalizeBahrainPostalCode('099'), null);
  assert.equal(normalizeBahrainPostalCode('1300'), null);
  assert.equal(normalizeBahrainPostalCode('BH-317'), null);
  assert.equal(normalizeBahrainPostalCode('31-7'), null);
  assert.equal(normalizeBahrainPostalCode('12'), null);
  assert.equal(normalizePostalContextPostalCode('bh', '1 212'), '1212');
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
  assert.equal(normalizeUnitedStatesPostalCode('００００１'), '00001');
  assert.equal(normalizeUnitedStatesPostalCode('00001 0001'), '00001-0001');
  assert.equal(normalizeUnitedStatesPostalCode('000010001'), '00001-0001');
  assert.equal(normalizeUnitedStatesPostalCode('00001-0001'), '00001-0001');
  assert.equal(normalizeUnitedStatesPostalCode('US-00001'), null);
  assert.equal(normalizeUnitedStatesPostalCode('00001 000'), null);
  assert.equal(normalizePostalContextPostalCode('us', '000010001'), '00001-0001');
  assert.equal(normalizeCanadaPostalCode('ｈ９ｈ９ｈ９'), 'H9H 9H9');
  assert.equal(normalizeCanadaPostalCode('h9h 9h9'), 'H9H 9H9');
  assert.equal(normalizeCanadaPostalCode('H9H-9H9'), null);
  assert.equal(normalizeCanadaPostalCode('CA-H9H 9H9'), null);
  assert.equal(normalizeCanadaPostalCode('D9D 9D9'), null);
  assert.equal(normalizeCanadaPostalCode('H9H 9H'), null);
  assert.equal(normalizePostalContextPostalCode('ca', 'h9h9h9'), 'H9H 9H9');
  assert.equal(normalizeMexicoPostalCode('９９９９９'), '99999');
  assert.equal(normalizeMexicoPostalCode('99 999'), '99999');
  assert.equal(normalizeMexicoPostalCode('99-999'), null);
  assert.equal(normalizeMexicoPostalCode('MX-99999'), null);
  assert.equal(normalizeMexicoPostalCode('9999'), null);
  assert.equal(normalizePostalContextPostalCode('mx', '99 999'), '99999');
  assert.equal(normalizeCubaPostalCode('９９９９９'), '99999');
  assert.equal(normalizeCubaPostalCode('99 999'), '99999');
  assert.equal(normalizeCubaPostalCode('CU-99999'), null);
  assert.equal(normalizeCubaPostalCode('99-999'), null);
  assert.equal(normalizePostalContextPostalCode('cu', '99 999'), '99999');
  assert.equal(normalizeArgentinaPostalCode('ｚ９９９９ｚｚｚ'), 'Z9999ZZZ');
  assert.equal(normalizeArgentinaPostalCode('z 9999 zzz'), 'Z9999ZZZ');
  assert.equal(normalizeArgentinaPostalCode('Z9999-ZZZ'), null);
  assert.equal(normalizeArgentinaPostalCode('9999'), null);
  assert.equal(normalizeArgentinaPostalCode('AR-Z9999ZZZ'), null);
  assert.equal(normalizeArgentinaPostalCode('I9999ZZZ'), null);
  assert.equal(normalizeArgentinaPostalCode('O9999ZZZ'), null);
  assert.equal(normalizePostalContextPostalCode('ar', 'z 9999 zzz'), 'Z9999ZZZ');
  assert.equal(normalizeUruguayPostalCode('９９９９９'), '99999');
  assert.equal(normalizeUruguayPostalCode('99 999'), '99999');
  assert.equal(normalizeUruguayPostalCode('999-99'), null);
  assert.equal(normalizeUruguayPostalCode('UY-99999'), null);
  assert.equal(normalizeUruguayPostalCode('9999'), null);
  assert.equal(normalizePostalContextPostalCode('uy', '99 999'), '99999');
  assert.equal(normalizeEcuadorPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeEcuadorPostalCode('99 99 99'), '999999');
  assert.equal(normalizeEcuadorPostalCode('999-999'), null);
  assert.equal(normalizeEcuadorPostalCode('EC-999999'), null);
  assert.equal(normalizeEcuadorPostalCode('99999'), null);
  assert.equal(normalizePostalContextPostalCode('ec', '99 99 99'), '999999');
  assert.equal(normalizeElSalvadorPostalCode('９９９９'), '9999');
  assert.equal(normalizeElSalvadorPostalCode('99 99'), '9999');
  assert.equal(normalizeElSalvadorPostalCode('99-99'), null);
  assert.equal(normalizeElSalvadorPostalCode('SV-9999'), null);
  assert.equal(normalizeElSalvadorPostalCode('999'), null);
  assert.equal(normalizePostalContextPostalCode('sv', '99 99'), '9999');
  assert.equal(normalizeGuatemalaPostalCode('９９９９９'), '99999');
  assert.equal(normalizeGuatemalaPostalCode('99 999'), '99999');
  assert.equal(normalizeGuatemalaPostalCode('99-999'), null);
  assert.equal(normalizeGuatemalaPostalCode('GT-99999'), null);
  assert.equal(normalizeGuatemalaPostalCode('9999'), null);
  assert.equal(normalizePostalContextPostalCode('gt', '99 999'), '99999');
  assert.equal(normalizeCostaRicaPostalCode('１０１０２'), '10102');
  assert.equal(normalizeCostaRicaPostalCode('10 102'), '10102');
  assert.equal(normalizeCostaRicaPostalCode('99 999'), null);
  assert.equal(normalizeCostaRicaPostalCode('CR-10102'), null);
  assert.equal(normalizeCostaRicaPostalCode('1010'), null);
  assert.equal(normalizePostalContextPostalCode('cr', '10 102'), '10102');
  assert.equal(normalizeChilePostalCode('９９９９９９９'), '9999999');
  assert.equal(normalizeChilePostalCode('999 9999'), '9999999');
  assert.equal(normalizeChilePostalCode('999-9999'), null);
  assert.equal(normalizeChilePostalCode('CL-9999999'), null);
  assert.equal(normalizeChilePostalCode('999999'), null);
  assert.equal(normalizePostalContextPostalCode('cl', '999 9999'), '9999999');
  assert.equal(normalizeDominicanRepublicPostalCode('９９９９９'), '99999');
  assert.equal(normalizeDominicanRepublicPostalCode('99 999'), '99999');
  assert.equal(normalizeDominicanRepublicPostalCode('999-99'), null);
  assert.equal(normalizeDominicanRepublicPostalCode('DO-99999'), null);
  assert.equal(normalizeDominicanRepublicPostalCode('9999'), null);
  assert.equal(normalizePostalContextPostalCode('do', '99 999'), '99999');
  assert.equal(normalizeHaitiPostalCode('ＨＴ９９９９'), 'HT9999');
  assert.equal(normalizeHaitiPostalCode('ht 9999'), 'HT9999');
  assert.equal(normalizeHaitiPostalCode('HT-9999'), null);
  assert.equal(normalizeHaitiPostalCode('9999'), null);
  assert.equal(normalizeHaitiPostalCode('HT999'), null);
  assert.equal(normalizePostalContextPostalCode('ht', 'ｈｔ ９９９９'), 'HT9999');
  assert.equal(normalizePanamaPostalCode('ｚ９ｚｚｚ－ｚｚｚｚｚ'), 'Z9ZZZ-ZZZZZ');
  assert.equal(normalizePanamaPostalCode('z9zzzzzzzz'), 'Z9ZZZ-ZZZZZ');
  assert.equal(normalizePanamaPostalCode('zzzzzzzz'), 'ZZZ-ZZZZZ');
  assert.equal(normalizePanamaPostalCode('Z9ZZZ-ZZZZ'), null);
  assert.equal(normalizePanamaPostalCode('Z9ZZZ/ZZZZZ'), null);
  assert.equal(normalizePostalContextPostalCode('pa', ' z9zzz-zzzzz '), 'Z9ZZZ-ZZZZZ');
  assert.equal(normalizeBarbadosPostalCode('ｂｂ９９９９９'), 'BB99999');
  assert.equal(normalizeBarbadosPostalCode('bb 99999 - z9z9z'), 'BB99999-Z9Z9Z');
  assert.equal(normalizeBarbadosPostalCode('bb99999z9z9z'), 'BB99999-Z9Z9Z');
  assert.equal(normalizeBarbadosPostalCode('99999'), null);
  assert.equal(normalizeBarbadosPostalCode('BB99999-Z9Z9'), null);
  assert.equal(normalizeBarbadosPostalCode('BB99999/Z9Z9Z'), null);
  assert.equal(normalizePostalContextPostalCode('bb', ' bb99999z9z9z '), 'BB99999-Z9Z9Z');
  assert.equal(normalizeNicaraguaPostalCode('９９９９９'), '99999');
  assert.equal(normalizeNicaraguaPostalCode('99 999'), '99999');
  assert.equal(normalizeNicaraguaPostalCode('99-999'), null);
  assert.equal(normalizeNicaraguaPostalCode('NI-99999'), null);
  assert.equal(normalizeNicaraguaPostalCode('9999'), null);
  assert.equal(normalizePostalContextPostalCode('ni', '99 999'), '99999');
  assert.equal(normalizeBrazilPostalCode('９９９９９－９９９'), '99999-999');
  assert.equal(normalizeBrazilPostalCode('99999999'), '99999-999');
  assert.equal(normalizeBrazilPostalCode('99999 999'), '99999-999');
  assert.equal(normalizeBrazilPostalCode('BR-99999-999'), null);
  assert.equal(normalizeBrazilPostalCode('99-999-999'), null);
  assert.equal(normalizeBrazilPostalCode('9999999'), null);
  assert.equal(normalizePostalContextPostalCode('br', '99999999'), '99999-999');
  assert.equal(normalizeVenezuelaPostalCode('９９９９'), '9999');
  assert.equal(normalizeVenezuelaPostalCode('99 99'), '9999');
  assert.equal(normalizeVenezuelaPostalCode('99-99'), null);
  assert.equal(normalizeVenezuelaPostalCode('VE-9999'), null);
  assert.equal(normalizeVenezuelaPostalCode('999'), null);
  assert.equal(normalizePostalContextPostalCode('ve', '99 99'), '9999');
  assert.equal(normalizePeruPostalCode('９９９９９'), '99999');
  assert.equal(normalizePeruPostalCode('99 999'), '99999');
  assert.equal(normalizePeruPostalCode('99-999'), null);
  assert.equal(normalizePeruPostalCode('PE-99999'), null);
  assert.equal(normalizePeruPostalCode('9999'), null);
  assert.equal(normalizePostalContextPostalCode('pe', '99 999'), '99999');
  assert.equal(normalizeColombiaPostalCode('９９９９９９'), '999999');
  assert.equal(normalizeColombiaPostalCode('999 999'), '999999');
  assert.equal(normalizeColombiaPostalCode('99-9999'), null);
  assert.equal(normalizeColombiaPostalCode('CO-999999'), null);
  assert.equal(normalizeColombiaPostalCode('99999'), null);
  assert.equal(normalizePostalContextPostalCode('co', '999 999'), '999999');
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
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.US.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.US.postalCodeFormat, 'NNNNN or NNNNN-NNNN');
  assert.equal(isPostalContextCountryCode('MX'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MX.fullCodeGeometrySemantics, 'postal-area-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MX.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('CU'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CU.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CU.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('GT'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.GT.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.GT.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('CR'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CR.fullCodeGeometrySemantics, 'postal-area-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CR.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('CL'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CL.fullCodeGeometrySemantics, 'address-range-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CL.postalCodeFormat, 'NNNNNNN');
  assert.equal(isPostalContextCountryCode('DO'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.DO.fullCodeGeometrySemantics, 'postal-area-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.DO.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('HT'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.HT.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.HT.postalCodeFormat, 'HTNNNN');
  assert.equal(isPostalContextCountryCode('PA'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.PA.fullCodeGeometrySemantics, 'delivery-point-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.PA.postalCodeFormat, 'XXXXX-XXXXX or 8-character grid');
  assert.equal(isPostalContextCountryCode('BB'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.BB.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.BB.postalCodeFormat, 'BBNNNNN or BBNNNNN-AAAAA');
  assert.equal(isPostalContextCountryCode('NI'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.NI.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.NI.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('BR'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.BR.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.BR.postalCodeFormat, 'NNNNN-NNN');
  assert.equal(isPostalContextCountryCode('VE'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.VE.fullCodeGeometrySemantics, 'delivery-network-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.VE.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('PE'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.PE.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.PE.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('CO'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CO.fullCodeGeometrySemantics, 'postal-area-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.CO.postalCodeFormat, 'NNNNNN');
  assert.equal(isPostalContextCountryCode('EC'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.EC.fullCodeGeometrySemantics, 'postal-area-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.EC.postalCodeFormat, 'NNNNNN');
  assert.equal(isPostalContextCountryCode('NL'), true);
  assert.equal(isPostalContextCountryCode('GB'), true);
  assert.equal(isPostalContextCountryCode('US'), true);
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
  assert.equal(isPostalContextCountryCode('OM'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.OM.fullCodeGeometrySemantics,
    'routing-locality-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.OM.postalCodeFormat, 'NNN');
  assert.equal(isPostalContextCountryCode('ZA'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.ZA.fullCodeGeometrySemantics,
    'area-or-non-area',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.ZA.postalCodeFormat, 'NNNN');
  assert.equal(isPostalContextCountryCode('EG'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.EG.fullCodeGeometrySemantics, 'postal-area-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.EG.postalCodeFormat, 'NNNNNNN');
  assert.equal(isPostalContextCountryCode('MA'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MA.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MA.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('SC'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.SC.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.match(POSTAL_CONTEXT_COUNTRY_POLICIES.SC.postalCodeFormat, /No currently assigned postcode.*0000 placeholder invalid.*pending authoritative release/i);
  assert.equal(isPostalContextCountryCode('SO'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.SO.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.match(POSTAL_CONTEXT_COUNTRY_POLICIES.SO.postalCodeFormat, /AA NNNNN.*optional.*non-universal.*authoritative evidence/i);
  assert.equal(isPostalContextCountryCode('TZ'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.TZ.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.match(POSTAL_CONTEXT_COUNTRY_POLICIES.TZ.postalCodeFormat, /NNNNN.*ward\/shehia.*post office.*landmark.*temporary event.*category.*assignment evidence/i);
  assert.equal(isPostalContextCountryCode('IN'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IN.fullCodeGeometrySemantics, 'delivery-network-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.IN.postalCodeFormat, 'NNNNNN');
  assert.equal(isPostalContextCountryCode('NA'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.NA.fullCodeGeometrySemantics, 'delivery-network-first');
  assert.match(POSTAL_CONTEXT_COUNTRY_POLICIES.NA.postalCodeFormat, /NNNNN.*third digit 0.*P\.O\. Box.*Private Bag.*separate/i);
  assert.equal(isPostalContextCountryCode('NE'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.NE.fullCodeGeometrySemantics, 'delivery-network-first');
  assert.match(POSTAL_CONTEXT_COUNTRY_POLICIES.NE.postalCodeFormat, /NNNN.*first digit 1-8.*official directory.*assignment evidence.*P\.O\. Box.*separate/i);
  assert.equal(isPostalContextCountryCode('MG'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MG.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.match(POSTAL_CONTEXT_COUNTRY_POLICIES.MG.postalCodeFormat, /NNN.*dated UPU.*province.*department.*current Paositra Malagasy.*assignment evidence.*B\.P\..*current administration.*separate/i);
  assert.equal(isPostalContextCountryCode('MU'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.MU.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.match(POSTAL_CONTEXT_COUNTRY_POLICIES.MU.postalCodeFormat, /NNNNN.*main island.*RNNNN.*Rodrigues.*ANNNN.*Agalega.*assignment evidence.*geometry.*administration.*separate/i);
  assert.equal(isPostalContextCountryCode('ID'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.ID.fullCodeGeometrySemantics, 'routing-locality-first');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.ID.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('LA'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LA.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.LA.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('KW'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.KW.fullCodeGeometrySemantics, 'area-or-non-area');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.KW.postalCodeFormat, 'NNNNN');
  assert.equal(isPostalContextCountryCode('GE'), true);
  assert.equal(
    POSTAL_CONTEXT_COUNTRY_POLICIES.GE.fullCodeGeometrySemantics,
    'delivery-network-first',
  );
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.GE.postalCodeFormat, 'NNNN');
});
