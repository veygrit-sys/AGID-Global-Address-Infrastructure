import assert from 'node:assert/strict';
import test from 'node:test';
import { AddressRenderer, type CanonicalAddress } from './addressRendering';
import { getAgidAddressTabLanguages } from './languageTabs';
import {
  REMAINING_OCEANIA_SHIPPING_COUNTRY_CODES,
  buildRemainingOceaniaShippingAddress,
  getRemainingOceaniaShippingProfile,
  isRemainingOceaniaShippingCountry,
  prefersRemainingOceaniaInternationalRenderer,
  supportsRemainingOceaniaDomesticLanguage,
} from './remainingOceaniaShippingAddress';

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

test('publishes 22 remaining-Oceania profiles with evidence and delegation boundaries', () => {
  assert.equal(REMAINING_OCEANIA_SHIPPING_COUNTRY_CODES.length, 22);

  for (const countryCode of REMAINING_OCEANIA_SHIPPING_COUNTRY_CODES) {
    const profile = getRemainingOceaniaShippingProfile(countryCode);
    assert.ok(profile);
    assert.ok(profile.nativeLanguages.includes(profile.defaultLanguage));
    assert.equal(profile.evidence.checkedOn, '2026-07-25');
    assert.equal(profile.evidence.reuseStatus, 'reference-only-no-postal-dataset-copied');
    assert.match(profile.evidence.url, /^https:\/\//);
    assert.equal(profile.evidence.correctionPath, 'mailto:postcode@upu.int');
  }

  assert.equal(isRemainingOceaniaShippingCountry('FJ'), true);
  assert.equal(isRemainingOceaniaShippingCountry('AU'), false);
  assert.equal(prefersRemainingOceaniaInternationalRenderer('FJ'), true);
  assert.equal(prefersRemainingOceaniaInternationalRenderer('PF'), false);
  assert.equal(supportsRemainingOceaniaDomesticLanguage('PF', 'ty-PF'), true);
  assert.equal(supportsRemainingOceaniaDomesticLanguage('PF', 'fr-FR'), false);
});

test('preserves native domestic spelling and omits the international country line', () => {
  const result = buildRemainingOceaniaShippingAddress(synthetic('WS', {
    city: 'Apia',
    district: 'Itumalo Tofotofoga',
    road: 'Auala Faataitai',
    house_number: '8',
  }), 'domestic', { domesticLanguage: 'sm' });

  assert.match(result.formatted, /Auala Faataitai/);
  assert.match(result.formatted, /Itumalo Tofotofoga/);
  assert.doesNotMatch(result.formatted, /\nSAMOA$/);
  assert.equal(result.outputLanguage, 'sm');
});

test('normalizes curated Pacific delivery vocabulary for international English', () => {
  const cases = [
    ['FJ', 'Gaunisala Vakatovolea', 'Vakatovolea Road'],
    ['WS', 'Auala Tofotofoga', 'Tofotofoga Street'],
    ['TO', 'Hala Sivi', 'Sivi Road'],
    ['PG', 'Rot Taim', 'Taim Road'],
    ['SB', 'Rod Tes', 'Tes Road'],
    ['PW', 'Rael Test', 'Test Road'],
    ['CK', 'Ara Tatau', 'Tatau Road'],
    ['NU', 'Puhala Fakataitai', 'Fakataitai Road'],
  ] as const;

  for (const [countryCode, road, expected] of cases) {
    const result = buildRemainingOceaniaShippingAddress(synthetic(countryCode, {
      city: 'Synthetic Locality',
      road,
      house_number: '8',
      postcode: countryCode === 'PG' ? '111' : '',
    }), 'international-shipping', { sourceLanguage: 'local' });
    assert.equal(result.normalized.road, expected, countryCode);
    assert.ok(result.warnings.includes('postal_lexicon_normalization_applied'));
    assert.match(result.formatted, new RegExp(`${result.profile?.englishCountryName.toUpperCase()}$`));
  }
});

test('transliterates Fiji Hindi while preserving routing semantics for review', () => {
  const result = buildRemainingOceaniaShippingAddress(synthetic('FJ', {
    city: 'Suva',
    road: 'कृत्रिम मार्ग',
    house_number: '8',
  }), 'international-shipping', { sourceLanguage: 'hi' });

  assert.doesNotMatch(result.formatted, /[\u0900-\u097f]/u);
  assert.ok(result.warnings.includes('script_transliteration_applied'));
  assert.equal(result.formatStatus, 'format-ready');
  assert.match(result.formatted, /FIJI$/);
});

test('normalizes parent-network and fixed territory postcode shapes', () => {
  const cases = [
    ['PG', '111', '111'],
    ['FM', '969410001', '96941-0001'],
    ['PW', '96939', '96939'],
    ['MH', '96960', '96960'],
    ['NF', '2899', '2899'],
    ['CX', '6798', '6798'],
    ['CC', '6799', '6799'],
    ['PN', 'pcrn1zz', 'PCRN 1ZZ'],
  ] as const;

  for (const [countryCode, input, expected] of cases) {
    const result = buildRemainingOceaniaShippingAddress(synthetic(countryCode, {
      city: 'Synthetic Locality',
      road: 'Synthetic Road',
      house_number: '8',
      postcode: input,
    }), 'international-shipping');
    assert.equal(result.normalized.postcode, expected, countryCode);
    assert.ok(!result.warnings.includes('invalid_postcode_format'), countryCode);
    assert.ok(result.warnings.includes('postcode_locality_pair_not_verified'));
    assert.equal(result.deliveryPointValidated, false);
  }
});

test('does not accept invented postcodes for reference no-postcode destinations', () => {
  for (const countryCode of ['FJ', 'WS', 'TO', 'VU', 'SB', 'KI', 'TV', 'NR', 'CK', 'TK', 'NU']) {
    const result = buildRemainingOceaniaShippingAddress(synthetic(countryCode, {
      city: 'Synthetic Locality',
      road: 'Synthetic Road',
      house_number: '8',
      postcode: 'TEST1',
    }), 'international-shipping');
    assert.ok(result.warnings.includes('postcode_not_used_by_reference'), countryCode);
    assert.equal(result.formatStatus, 'needs-review', countryCode);
  }
});

test('prefers caller-approved aliases and keeps unknown Latin proper names visible', () => {
  const aliased = buildRemainingOceaniaShippingAddress(synthetic('WS', {
    city: 'Apia',
    road: 'Auala Leiloa',
    house_number: '8',
  }), 'international-shipping', {
    sourceLanguage: 'sm',
    englishAliases: { road: 'Approved Test Road' },
  });
  assert.equal(aliased.normalized.road, 'Approved Test Road');
  assert.ok(aliased.warnings.includes('caller_approved_alias_applied'));

  const preserved = buildRemainingOceaniaShippingAddress(synthetic('WS', {
    city: 'Apia',
    road: 'Lotoa',
    house_number: '8',
  }), 'international-shipping', { sourceLanguage: 'sm' });
  assert.equal(preserved.normalized.road, 'Lotoa');
  assert.ok(preserved.warnings.includes('local_proper_name_preserved'));
});

test('keeps French Pacific international labels delegated to the French engine', () => {
  const frenchPolynesia = synthetic('PF', {
    city: 'Papeete',
    road: 'Rue Synthétique',
    house_number: '8',
    postcode: '98714',
  });

  assert.match(AddressRenderer.render('fr', frenchPolynesia), /Rue Synthétique/);
  assert.match(
    AddressRenderer.render('intl_en', frenchPolynesia),
    /FRENCH POLYNESIA$/,
  );
});

test('connects Pacific native and international modes to AddressRenderer', () => {
  const samoan = synthetic('WS', {
    city: 'Apia',
    road: 'Auala Tofotofoga',
    house_number: '8',
  });

  assert.match(AddressRenderer.render('sm', samoan), /Auala Tofotofoga/);
  assert.match(AddressRenderer.render('intl_en', samoan), /Tofotofoga Street/);
  assert.match(AddressRenderer.render('intl_en', samoan), /SAMOA$/);
});

test('exposes expanded Pacific multilingual address tabs', () => {
  const known = [
    'en', 'fr', 'fj', 'hi', 'tpi', 'ho', 'chk', 'pon', 'kos', 'yap',
    'ty', 'wls', 'fud', 'sm', 'ch',
  ];

  assert.deepEqual(
    getAgidAddressTabLanguages({ countryCode: 'pg', knownLanguageCodes: known }),
    ['en', 'tpi', 'ho', 'en_domestic'],
  );
  assert.deepEqual(
    getAgidAddressTabLanguages({ countryCode: 'fm', knownLanguageCodes: known }),
    ['en', 'chk', 'pon', 'kos', 'yap', 'en_domestic'],
  );
  assert.deepEqual(
    getAgidAddressTabLanguages({ countryCode: 'pf', knownLanguageCodes: known }),
    ['fr', 'ty', 'en'],
  );
  assert.deepEqual(
    getAgidAddressTabLanguages({ countryCode: 'wf', knownLanguageCodes: known }),
    ['fr', 'wls', 'fud', 'en'],
  );
  assert.deepEqual(
    getAgidAddressTabLanguages({ countryCode: 'as', knownLanguageCodes: known }),
    ['en', 'sm', 'en_domestic'],
  );
  assert.deepEqual(
    getAgidAddressTabLanguages({ countryCode: 'gu', knownLanguageCodes: known }),
    ['en', 'ch', 'en_domestic'],
  );
});
