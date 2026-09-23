import assert from 'node:assert/strict';
import test from 'node:test';
import { AddressRenderer,type CanonicalAddress } from './addressRendering';
import {
  transliterateAsianShippingText,
  transliterateHangul,
  transliterateHebrew,
  transliterateIndic,
} from './asianShippingTransliteration';
import { getAgidAddressTabLanguages } from './languageTabs';
import {
  REMAINING_ASIAN_SHIPPING_COUNTRY_CODES,
  buildRemainingAsianShippingAddress,
  getRemainingAsianShippingProfile,
  isRemainingAsianShippingCountry,
  supportsRemainingAsianDomesticLanguage,
} from './remainingAsianShippingAddress';

function synthetic(
  countryCode: string,
  overrides: Partial<CanonicalAddress> = {},
): CanonicalAddress {
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

test('publishes 31 remaining-Asia profiles with language and evidence boundaries', () => {
  assert.equal(REMAINING_ASIAN_SHIPPING_COUNTRY_CODES.length, 31);

  for (const countryCode of REMAINING_ASIAN_SHIPPING_COUNTRY_CODES) {
    const profile = getRemainingAsianShippingProfile(countryCode);
    assert.ok(profile);
    assert.ok(profile.nativeLanguages.includes(profile.defaultLanguage));
    assert.equal(profile.evidence.checkedOn, '2026-07-25');
    assert.equal(profile.evidence.reuseStatus, 'reference-only-no-postal-dataset-copied');
    assert.match(profile.evidence.url, /^https:\/\/www\.upu\.int\//);
    assert.equal(profile.evidence.correctionPath, 'mailto:postcode@upu.int');
  }

  assert.equal(isRemainingAsianShippingCountry('JP'), true);
  assert.equal(isRemainingAsianShippingCountry('CN'), false);
  assert.equal(supportsRemainingAsianDomesticLanguage('SG', 'zh-SG'), true);
  assert.equal(supportsRemainingAsianDomesticLanguage('IN', 'ta-IN'), true);
  assert.equal(supportsRemainingAsianDomesticLanguage('JP', 'fr'), false);
});

test('normalizes Asian postcode shapes without asserting postcode-locality validity', () => {
  const cases = [
    ['JP', '1000001', '100-0001'],
    ['KP', '123456', '123-456'],
    ['BN', 'bb3510', 'BB 3510'],
    ['IN', '560001', '560001'],
  ] as const;

  for (const [countryCode, input, expected] of cases) {
    const result = buildRemainingAsianShippingAddress(synthetic(countryCode, {
      city: 'Synthetic Locality',
      road: 'Synthetic Road',
      house_number: '8',
      postcode: input,
    }), 'domestic');
    assert.equal(result.normalized.postcode, expected, countryCode);
    assert.ok(result.warnings.includes('postcode_locality_pair_not_verified'));
    assert.equal(result.deliveryPointValidated, false);
  }
});

test('renders Japanese domestic addresses big-to-small and omits the country line', () => {
  const result = buildRemainingAsianShippingAddress(synthetic('JP', {
    state: '東京都',
    city: '合成市',
    subdistrict: '試験町',
    road: '一丁目',
    house_number: '8',
    postcode: '1000001',
  }), 'domestic', { domesticLanguage: 'ja' });

  assert.deepEqual(result.lines, [
    '〒100-0001',
    '東京都 合成市',
    '試験町',
    '一丁目 8',
  ]);
  assert.doesNotMatch(result.formatted, /JAPAN/);
});

test('keeps the Japanese postal mark out of Korean domestic labels', () => {
  for (const countryCode of ['KR', 'KP']) {
    const result = buildRemainingAsianShippingAddress(synthetic(countryCode, {
      city: '합성시',
      road: '가나다로',
      house_number: '8',
      postcode: countryCode === 'KR' ? '12345' : '123456',
    }), 'domestic', { domesticLanguage: 'ko' });

    assert.equal(result.lines[0], countryCode === 'KR' ? '12345' : '123-456');
    assert.doesNotMatch(result.formatted, /〒/);
  }
});

test('transliterates Hangul, Hebrew, Indic, Thai, and native digits deterministically', () => {
  assert.equal(transliterateHangul('서울'), 'seoul');
  assert.equal(transliterateHebrew('תל אביב'), 'tl byb');
  assert.doesNotMatch(transliterateIndic('कृत्रिम मार्ग'), /[\u0900-\u097f]/u);

  const thai = transliterateAsianShippingText('ถนนสังเคราะห์ ๑๒');
  assert.doesNotMatch(thai.text, /[\u0e00-\u0e7f]/u);
  assert.match(thai.text, /12$/);
  assert.ok(thai.appliedScripts.includes('thai'));
  assert.equal(thai.incomplete, false);
});

test('builds script-free Korean international labels from synthetic delivery text', () => {
  const result = buildRemainingAsianShippingAddress(synthetic('KR', {
    city: '서울',
    road: '가나다로',
    house_number: '8',
    postcode: '12345',
  }), 'international-shipping');

  assert.equal(result.normalized.city, 'Seoul');
  assert.equal(result.normalized.road, 'ganadaro');
  assert.match(result.formatted, /REPUBLIC OF KOREA$/);
  assert.doesNotMatch(result.formatted, /[\uac00-\ud7af]/u);
  assert.ok(result.warnings.includes('script_transliteration_applied'));
  assert.ok(result.warnings.includes('machine_transliteration_review_recommended'));
  assert.equal(result.formatStatus, 'format-ready');
});

test('requires a caller-approved alias when Japanese delivery kanji cannot be romanized safely', () => {
  const input = synthetic('JP', {
    city: '東京',
    road: '合成通り',
    house_number: '8',
    postcode: '1000001',
  });
  const unresolved = buildRemainingAsianShippingAddress(
    input,
    'international-shipping',
  );
  assert.ok(unresolved.warnings.includes('transliteration_incomplete'));
  assert.equal(unresolved.formatStatus, 'needs-review');

  const approved = buildRemainingAsianShippingAddress(
    input,
    'international-shipping',
    { englishAliases: { road: 'Synthetic-dori' } },
  );
  assert.equal(approved.normalized.city, 'Tokyo');
  assert.equal(approved.normalized.road, 'Synthetic-dori');
  assert.ok(approved.warnings.includes('caller_approved_alias_applied'));
  assert.ok(!approved.warnings.includes('transliteration_incomplete'));
  assert.equal(approved.formatStatus, 'format-ready');
});

test('romanizes representative South Asian and Hebrew labels without translating routing keys', () => {
  const indian = buildRemainingAsianShippingAddress(synthetic('IN', {
    city: 'नई दिल्ली',
    road: 'कृत्रिम मार्ग',
    house_number: '8',
    postcode: '110001',
  }), 'international-shipping');
  assert.equal(indian.normalized.city, 'New Delhi');
  assert.doesNotMatch(indian.formatted, /[\u0900-\u097f]/u);
  assert.match(indian.formatted, /INDIA$/);

  const israeli = buildRemainingAsianShippingAddress(synthetic('IL', {
    city: 'ירושלים',
    road: 'רחוב בדיקה',
    house_number: '8',
    postcode: '9100001',
  }), 'international-shipping');
  assert.equal(israeli.normalized.city, 'Jerusalem');
  assert.doesNotMatch(israeli.formatted, /[\u0590-\u05ff]/u);
  assert.match(israeli.formatted, /ISRAEL$/);
});

test('uses Pinyin for Singapore Chinese international fields', () => {
  const result = buildRemainingAsianShippingAddress(synthetic('SG', {
    city: '新加坡',
    road: '合成路',
    house_number: '8',
    postcode: '123456',
  }), 'international-shipping');

  assert.doesNotMatch(result.formatted, /[\u3400-\u9fff]/u);
  assert.match(result.normalized.road, /He Cheng Lu/i);
  assert.match(result.formatted, /SINGAPORE$/);
});

test('keeps constrained-source destinations explicitly review-gated', () => {
  for (const countryCode of ['KP', 'AF', 'IR']) {
    const result = buildRemainingAsianShippingAddress(synthetic(countryCode, {
      city: 'Synthetic Locality',
      road: 'Synthetic Road',
      house_number: '8',
      postcode: countryCode === 'IR' ? '1234567890' : '1234',
    }), 'international-shipping');
    assert.ok(result.warnings.includes('restricted_source_review_required'));
    assert.equal(result.formatStatus, 'needs-review');
  }
});

test('connects Asian domestic and international modes to AddressRenderer', () => {
  const korean = synthetic('KR', {
    city: '서울',
    road: '가나다로',
    house_number: '8',
    postcode: '12345',
  });
  assert.match(AddressRenderer.render('ko', korean), /서울/);
  assert.match(AddressRenderer.render('intl_en', korean), /REPUBLIC OF KOREA$/);

  const turkish = synthetic('TR', {
    city: 'İstanbul',
    road: 'Sentetik Sokak',
    house_number: '8',
    postcode: '34000',
  });
  assert.doesNotMatch(AddressRenderer.render('tr', turkish), /TÜRKIYE$/);
  assert.match(AddressRenderer.render('intl_en', turkish), /TÜRKIYE$/);
});

test('exposes multilingual domestic tabs for India, Singapore, and Sri Lanka', () => {
  const known = [
    'en', 'hi', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'pa', 'or', 'mr', 'as', 'ur',
    'ms', 'zh-Hans', 'si',
  ];
  assert.deepEqual(
    getAgidAddressTabLanguages({
      countryCode: 'in',
      knownLanguageCodes: known,
    }),
    ['en', 'hi', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'pa', 'or', 'mr', 'as', 'ur', 'en_domestic'],
  );
  assert.deepEqual(
    getAgidAddressTabLanguages({
      countryCode: 'sg',
      knownLanguageCodes: known,
    }),
    ['en', 'ms', 'zh-Hans', 'ta', 'en_domestic'],
  );
  assert.deepEqual(
    getAgidAddressTabLanguages({
      countryCode: 'lk',
      knownLanguageCodes: known,
    }),
    ['si', 'ta', 'en', 'en_domestic'],
  );
});
