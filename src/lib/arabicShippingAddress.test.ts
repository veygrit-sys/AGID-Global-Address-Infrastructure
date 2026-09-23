import assert from 'node:assert/strict';
import test from 'node:test';
import { AddressRenderer,type CanonicalAddress } from './addressRendering';
import {
  ARABIC_SHIPPING_COUNTRY_CODES,
  buildArabicShippingAddress,
  getArabicShippingComponentLabels,
  getArabicShippingProfile,
  isArabicShippingCountry,
  romanizeArabicShippingText,
  type ArabicShippingExtendedAddress,
} from './arabicShippingAddress';
import { translateWestAsiaAddressField } from './westAsiaAddressTranslation';
import { transliterateArabic } from './transliteration';

function synthetic(
  countryCode: string,
  overrides: Partial<ArabicShippingExtendedAddress> = {},
): ArabicShippingExtendedAddress {
  return {
    country_code: countryCode,
    country: '',
    state: '',
    city: '',
    district: '',
    subdistrict: '',
    suburb: '',
    road: '',
    house_number: '',
    building: '',
    postcode: '',
    poi: '',
    ...overrides,
  };
}

test('publishes evidence-scoped profiles for 23 Arabic and co-official shipping destinations', () => {
  assert.deepEqual(ARABIC_SHIPPING_COUNTRY_CODES, [
    'DZ', 'BH', 'KM', 'DJ', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MR', 'MA',
    'OM', 'PS', 'QA', 'SA', 'SD', 'SO', 'SY', 'TN', 'TD', 'AE', 'YE',
  ]);
  for (const countryCode of ARABIC_SHIPPING_COUNTRY_CODES) {
    const profile = getArabicShippingProfile(countryCode);
    assert.ok(profile);
    assert.match(profile.evidence.url, /^https:\/\//);
    assert.equal(profile.evidence.checkedOn, '2026-07-25');
    assert.equal(profile.evidence.scope, 'destination-format-postcode-shape-and-script-policy-only');
  }
  assert.equal(isArabicShippingCountry('sa'), true);
  assert.equal(isArabicShippingCountry('IR'), false);
  assert.equal(getArabicShippingComponentLabels('domestic-arabic').poBox, 'صندوق البريد');
  assert.equal(getArabicShippingComponentLabels('international-shipping').zone, 'Zone number');
});

test('normalizes both Arabic digit sets and strips unsafe bidi controls', () => {
  assert.equal(transliterateArabic('\u202Eشارع ١۲٣\u202C'), 'shar\' 123');
  assert.equal(
    romanizeArabicShippingText('الرياض').text,
    'Riyadh',
  );
  assert.equal(
    romanizeArabicShippingText('شارع الاختبار').text,
    'Street al-Akhtbar',
  );
});

test('renders a complete Saudi national address in Arabic without translating routing keys', () => {
  const result = buildArabicShippingAddress(synthetic('SA', {
    road: 'طريق فهد',
    house_number: '٢٩٢٩',
    district: 'حي الربيع',
    city: 'الرياض',
    postcode: '١٣٣٣٧',
    additional_number: '٨١١٨',
  }), 'domestic-arabic');

  assert.deepEqual(result.lines, [
    '2929 طريق فهد، الرقم الإضافي 8118',
    'حي الربيع',
    '13337',
    'الرياض',
  ]);
  assert.equal(result.normalized.postcode, '13337');
  assert.equal(result.formatStatus, 'format-ready');
  assert.ok(!result.warnings.includes('saudi_national_address_components_incomplete'));
  assert.equal(result.deliveryPointValidated, false);
});

test('uses approved English aliases before deterministic Arabic transliteration', () => {
  const result = buildArabicShippingAddress(synthetic('SA', {
    road: 'طريق الملك فهد',
    house_number: '2929',
    district: 'حي الربيع',
    city: 'الرياض',
    postcode: '13337',
    additional_number: '8118',
  }), 'international-shipping', {
    englishAliases: {
      road: 'King Fahd Road',
      district: 'Al Rabie District',
    },
  });

  assert.deepEqual(result.lines, [
    '2929 King Fahd Road, ADDITIONAL NO. 8118',
    'Al Rabie District',
    '13337',
    'Riyadh',
    'SAUDI ARABIA',
  ]);
  assert.equal(result.romanizationMethods.road, 'caller-approved-alias');
  assert.equal(result.romanizationMethods.city, 'curated-place-alias');
  assert.doesNotMatch(result.formatted, /\p{Script=Arabic}/u);
  assert.ok(!result.warnings.includes('transliteration_incomplete'));
});

test('supports Qatar PO Box and complete Anwani home-delivery branches without fake postcodes', () => {
  const poBox = buildArabicShippingAddress(synthetic('QA', {
    po_box: 'صندوق بريد ٦٥٩٩',
    city: 'الدوحة',
  }), 'international-shipping');
  assert.deepEqual(poBox.lines, ['PO BOX 6599', 'Doha', 'QATAR']);
  assert.ok(!poBox.warnings.includes('missing_postcode'));
  assert.ok(!poBox.warnings.includes('po_box_recommended'));

  const anwanni = buildArabicShippingAddress(synthetic('QA', {
    house_number: '25',
    road: '865',
    zone: '16',
    city: 'الدوحة',
  }), 'international-shipping');
  assert.deepEqual(anwanni.lines, [
    'BUILDING 25, STREET 865',
    'ZONE 16',
    'Doha',
    'QATAR',
  ]);
  assert.ok(!anwanni.warnings.includes('qatar_anwani_components_incomplete'));
  assert.ok(!anwanni.warnings.includes('po_box_recommended'));
});

test('keeps UAE PO Box dependence explicit and rejects invented postcode use', () => {
  const result = buildArabicShippingAddress(synthetic('AE', {
    road: 'شارع الاختبار',
    house_number: '8',
    city: 'دبي',
    postcode: '00000',
  }), 'international-shipping');

  assert.ok(result.warnings.includes('po_box_recommended'));
  assert.ok(result.warnings.includes('postcode_not_used_by_destination'));
  assert.equal(result.formatStatus, 'needs-review');
});

test('uses current official postcode shapes for Egypt, Palestine, Bahrain, and Oman', () => {
  const egypt = buildArabicShippingAddress(synthetic('EG', {
    road: 'شارع الاختبار',
    house_number: '3',
    city: 'القاهرة',
    postcode: '٣٧٥٩٩١٤',
  }), 'domestic-arabic');
  assert.equal(egypt.normalized.postcode, '3759914');
  assert.ok(!egypt.warnings.includes('invalid_postcode_format'));

  const palestine = buildArabicShippingAddress(synthetic('PS', {
    road: 'شارع الاختبار',
    house_number: '4',
    city: 'رام الله',
    postcode: '600',
  }), 'domestic-arabic');
  assert.equal(palestine.normalized.postcode, 'P600');
  assert.ok(!palestine.warnings.includes('invalid_postcode_format'));

  const bahrain = buildArabicShippingAddress(synthetic('BH', {
    road: 'طريق 2035',
    house_number: '916',
    city: 'الرفاع',
    postcode: '926',
  }), 'international-shipping');
  assert.ok(!bahrain.warnings.includes('invalid_postcode_format'));

  const oman = buildArabicShippingAddress(synthetic('OM', {
    po_box: '15',
    city: 'صحار',
    postcode: '133',
  }), 'international-shipping');
  assert.ok(!oman.warnings.includes('invalid_postcode_format'));
});

test('supports Arabic co-official Horn of Africa and Sahel modes with source conflicts visible', () => {
  const djibouti = buildArabicShippingAddress(synthetic('DJ', {
    po_box: '1663',
    city: 'جيبوتي',
    postcode: '77101',
  }), 'international-shipping');
  assert.deepEqual(djibouti.lines, ['PO BOX 1663', '77101 Djibouti', 'DJIBOUTI']);
  assert.equal(djibouti.formatStatus, 'format-ready');

  const comoros = buildArabicShippingAddress(synthetic('KM', {
    po_box: '350',
    city: 'موروني',
  }), 'domestic-arabic');
  assert.ok(!comoros.warnings.includes('missing_postcode'));
  assert.ok(!comoros.warnings.includes('po_box_recommended'));

  const somalia = buildArabicShippingAddress(synthetic('SO', {
    po_box: '1001',
    city: 'كيسمايو',
    postcode: 'JH09010',
  }), 'international-shipping');
  assert.ok(somalia.warnings.includes('postal_source_version_conflict'));
  assert.equal(somalia.formatStatus, 'needs-review');

  const chad = buildArabicShippingAddress(synthetic('TD', {
    po_box: '4148',
    city: 'إنجامينا',
  }), 'international-shipping');
  assert.deepEqual(chad.lines, ["PO BOX 4148", "N'Djamena", 'CHAD']);
});

test('renders Morocco in official postcode-before-locality order and enforces line limits', () => {
  const result = buildArabicShippingAddress(synthetic('MA', {
    building: 'مؤسسة اختبارية',
    road: 'شارع الحسن الثاني',
    house_number: '20',
    district: 'حي أكدال',
    city: 'الرباط',
    postcode: '10000',
  }), 'international-shipping', {
    englishAliases: {
      building: 'Synthetic Foundation',
      road: 'Hassan II Avenue',
      district: 'Agdal District',
    },
  });

  assert.deepEqual(result.lines, [
    'Synthetic Foundation',
    '20 Hassan II Avenue',
    'Agdal District',
    '10000 Rabat',
    'MOROCCO',
  ]);
  assert.equal(result.formatStatus, 'format-ready');
});

test('marks lexical fallback for review while guaranteeing Latin-only international output', () => {
  const result = buildArabicShippingAddress(synthetic('JO', {
    road: 'شارع الاختبار',
    house_number: '27',
    city: 'عمّان',
    postcode: '11937',
  }), 'international-shipping');

  assert.ok(result.warnings.includes('machine_transliteration_review_recommended'));
  assert.doesNotMatch(result.formatted, /\p{Script=Arabic}/u);
  assert.ok(!result.warnings.includes('transliteration_incomplete'));
});

test('connects Arabic domestic and international modes to the shared renderer', () => {
  const input = synthetic('SA', {
    road: 'طريق فهد',
    house_number: '2929',
    district: 'حي الربيع',
    city: 'الرياض',
    postcode: '13337',
    additional_number: '8118',
  }) as CanonicalAddress;

  assert.match(AddressRenderer.render('ar', input), /الرياض/);
  const international = AddressRenderer.render('intl_en', input);
  assert.match(international, /Riyadh/);
  assert.match(international, /SAUDI ARABIA/);
  assert.doesNotMatch(international, /\p{Script=Arabic}/u);
});

test('upgrades the existing West Asia field route with offline Arabic romanization', async () => {
  const translated = await translateWestAsiaAddressField({
    countryCode: 'JO',
    fieldKey: 'city',
    text: 'عمّان',
    sourceLanguage: 'ar',
    targetLanguage: 'en',
  });
  assert.equal(translated?.text, 'Amman');
  assert.equal(translated?.route.mode, 'english');
});
