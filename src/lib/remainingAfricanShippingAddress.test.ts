import assert from 'node:assert/strict';
import test from 'node:test';
import { AddressRenderer,type CanonicalAddress } from './addressRendering';
import { buildArabicShippingAddress } from './arabicShippingAddress';
import { getAgidAddressTabLanguages } from './languageTabs';
import {
  REMAINING_AFRICAN_SHIPPING_COUNTRY_CODES,
  buildRemainingAfricanShippingAddress,
  getRemainingAfricanShippingProfile,
  isRemainingAfricanShippingCountry,
  prefersRemainingAfricanInternationalRenderer,
  supportsRemainingAfricanDomesticLanguage,
} from './remainingAfricanShippingAddress';
import {
  transliterateEthiopic,
  transliterateTifinagh,
} from './transliteration';

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

test('publishes 32 explicit remaining-Africa profiles with conservative evidence', () => {
  assert.equal(REMAINING_AFRICAN_SHIPPING_COUNTRY_CODES.length, 32);

  for (const countryCode of REMAINING_AFRICAN_SHIPPING_COUNTRY_CODES) {
    const profile = getRemainingAfricanShippingProfile(countryCode);
    assert.ok(profile);
    assert.ok(profile.nativeLanguages.includes(profile.defaultLanguage));
    assert.ok(profile.enhancedDomesticLanguages.every(
      language => profile.nativeLanguages.includes(language),
    ));
    assert.equal(profile.evidence.checkedOn, '2026-07-25');
    assert.equal(profile.evidence.reuseStatus, 'reference-only-no-postal-dataset-copied');
    assert.match(profile.evidence.url, /^https:\/\/www\.upu\.int\//);
    assert.equal(profile.evidence.correctionPath, 'mailto:postcode@upu.int');
  }

  assert.equal(isRemainingAfricanShippingCountry('SWZ'), true);
  assert.equal(getRemainingAfricanShippingProfile('SWZ')?.countryCode, 'SZ');
  assert.equal(isRemainingAfricanShippingCountry('somaliland'), true);
  assert.equal(supportsRemainingAfricanDomesticLanguage('ET', 'am-ET'), true);
  assert.equal(supportsRemainingAfricanDomesticLanguage('ET', 'fr'), false);
  assert.equal(prefersRemainingAfricanInternationalRenderer('MZ'), true);
  assert.equal(getRemainingAfricanShippingProfile('SC')?.postcodePattern, null);
  assert.equal(prefersRemainingAfricanInternationalRenderer('SC'), true);
  assert.equal(prefersRemainingAfricanInternationalRenderer('ZA'), false);
});

test('normalizes representative African postcode shapes without claiming locality validity', () => {
  const cases = [
    ['BW', 'aa123', 'AA 123'],
    ['SZ', 'h100', 'H 100'],
    ['SO', 'bn12345', 'BN 12345'],
    ['MZ', '1100', '1100'],
  ] as const;

  for (const [countryCode, input, expected] of cases) {
    const result = buildRemainingAfricanShippingAddress(synthetic(countryCode, {
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

test('selects approved domestic locality aliases and preserves synthetic delivery keys', () => {
  const amharic = buildRemainingAfricanShippingAddress(synthetic('ET', {
    city: 'Addis Ababa',
    road: 'ሰው ሠራሽ መንገድ',
    house_number: '8',
    postcode: '1000',
  }), 'domestic', { domesticLanguage: 'am' });
  assert.equal(amharic.outputLanguage, 'am');
  assert.equal(amharic.normalized.city, 'አዲስ አበባ');
  assert.match(amharic.formatted, /ሰው ሠራሽ መንገድ 8/);
  assert.ok(amharic.warnings.includes('multilingual_locality_alias_applied'));

  const tigrinya = buildRemainingAfricanShippingAddress(synthetic('ER', {
    city: 'Asmara',
    road: 'ሰው ሠራሽ መንገድ',
    house_number: '8',
    postcode: '1000',
  }), 'domestic', { domesticLanguage: 'ti' });
  assert.equal(tigrinya.normalized.city, 'ኣስመራ');

  const zulu = buildRemainingAfricanShippingAddress(synthetic('ZA', {
    city: 'Synthetic Locality',
    road: 'Umgwaqo Wokwenziwa',
    house_number: '8',
    postcode: '1000',
  }), 'domestic', { domesticLanguage: 'zu' });
  assert.equal(zulu.outputLanguage, 'zu');
  assert.match(zulu.formatted, /^8 Umgwaqo Wokwenziwa/m);
  assert.ok(zulu.preservedDeliveryFields.includes('road'));
});

test('transliterates Ethiopic and Tifinagh scripts deterministically for international labels', () => {
  assert.equal(transliterateEthiopic('አዲስ አበባ'), 'adis ababa');
  assert.equal(transliterateTifinagh('ⵍⵎⵖⵔⵉⴱ'), 'lmghrib');

  const result = buildRemainingAfricanShippingAddress(synthetic('ET', {
    city: 'አዲስ አበባ',
    road: 'ሰው ሠራሽ መንገድ',
    house_number: '8',
    postcode: '1000',
  }), 'international-shipping');

  assert.equal(result.normalized.city, 'Addis Ababa');
  assert.match(result.formatted, /ETHIOPIA$/);
  assert.doesNotMatch(
    result.formatted,
    /[\u0600-\u06ff\u1200-\u137f\u2d30-\u2d7f]/u,
  );
  assert.ok(result.warnings.includes('transliteration_applied'));
  assert.ok(!result.warnings.includes('transliteration_incomplete'));
});

test('keeps Portuguese delivery text while appending an English destination label', () => {
  const result = buildRemainingAfricanShippingAddress(synthetic('MZ', {
    city: 'Cidade Sintética',
    road: 'Avenida Sintética',
    house_number: '8',
    postcode: '1100',
  }), 'international-shipping');

  assert.equal(result.outputLanguage, 'en');
  assert.match(result.formatted, /Avenida Sintética 8/);
  assert.match(result.formatted, /1100 Cidade Sintética/);
  assert.match(result.formatted, /MOZAMBIQUE$/);
  assert.equal(result.formatStatus, 'format-ready');
});

test('keeps politically sensitive destination scopes neutral and review-gated', () => {
  for (const countryCode of ['EH', 'SLND']) {
    const result = buildRemainingAfricanShippingAddress(synthetic(countryCode, {
      city: 'Synthetic Locality',
      road: 'Synthetic Road',
      house_number: '8',
      postcode: '10000',
    }), 'international-shipping');

    assert.ok(result.warnings.includes('neutral_scope_review_required'));
    assert.equal(result.evidence?.scope, 'neutral-destination-label-scope-only');
    assert.equal(result.formatStatus, 'needs-review');
  }
});

test('adds Tifinagh romanization to Morocco international Arabic-engine labels', () => {
  const result = buildArabicShippingAddress(synthetic('MA', {
    city: 'ⵜⴰⵎⴰⵣⵉⵖⵜ',
    road: 'ⴰⴱⵔⵉⴷ',
    house_number: '8',
    postcode: '10000',
  }), 'international-shipping');

  assert.doesNotMatch(result.formatted, /[\u2d30-\u2d7f]/u);
  assert.equal(
    result.romanizationMethods.road,
    'deterministic-tifinagh-transliteration',
  );
  assert.ok(result.warnings.includes('machine_transliteration_review_recommended'));
});

test('connects African domestic and international modes to AddressRenderer', () => {
  const ethiopian = synthetic('ET', {
    city: 'Addis Ababa',
    road: 'ሰው ሠራሽ መንገድ',
    house_number: '8',
    postcode: '1000',
  });
  assert.match(AddressRenderer.render('am', ethiopian), /አዲስ አበባ/);
  assert.match(AddressRenderer.render('intl_en', ethiopian), /ETHIOPIA$/);

  const mozambican = synthetic('MZ', {
    city: 'Cidade Sintética',
    road: 'Avenida Sintética',
    house_number: '8',
    postcode: '1100',
  });
  assert.doesNotMatch(AddressRenderer.render('pt', mozambican), /MOZAMBIQUE$/);
  assert.match(AddressRenderer.render('intl_en', mozambican), /MOZAMBIQUE$/);
});

test('exposes expanded multilingual tabs for Ethiopian and South African delivery', () => {
  const known = [
    'am', 'en', 'om', 'ti', 'so',
    'af', 'zu', 'xh', 'nr', 'st', 'tn', 'ss', 've', 'ts', 'nso',
  ];
  assert.deepEqual(
    getAgidAddressTabLanguages({
      countryCode: 'et',
      knownLanguageCodes: known,
    }),
    ['am', 'en', 'om', 'ti', 'so', 'en_domestic'],
  );
  assert.deepEqual(
    getAgidAddressTabLanguages({
      countryCode: 'za',
      knownLanguageCodes: known,
    }),
    ['en', 'af', 'zu', 'xh', 'nr', 'st', 'tn', 'ss', 've', 'ts', 'nso', 'en_domestic'],
  );
});
