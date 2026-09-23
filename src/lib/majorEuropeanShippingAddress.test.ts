import assert from 'node:assert/strict';
import test from 'node:test';
import { AddressRenderer,type CanonicalAddress } from './addressRendering';
import {
  MAJOR_EUROPEAN_SHIPPING_COUNTRY_CODES,
  buildMajorEuropeanShippingAddress,
  getMajorEuropeanShippingComponentLabels,
  getMajorEuropeanShippingProfile,
  isMajorEuropeanShippingCountry,
  normalizeMajorEuropeanShippingField,
} from './majorEuropeanShippingAddress';

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

test('publishes explicit, current evidence profiles for the named major European language spheres', () => {
  assert.deepEqual(MAJOR_EUROPEAN_SHIPPING_COUNTRY_CODES, [
    'IT',
    'SM',
    'VA',
    'DE',
    'AT',
    'CH',
    'LI',
    'PT',
    'RU',
  ]);
  for (const countryCode of MAJOR_EUROPEAN_SHIPPING_COUNTRY_CODES) {
    const profile = getMajorEuropeanShippingProfile(countryCode);
    assert.ok(profile);
    assert.match(profile.evidence.url, /^https:\/\//);
    assert.equal(profile.evidence.checkedOn, '2026-07-25');
  }
  assert.equal(isMajorEuropeanShippingCountry('PT-AZO'), true);
  assert.equal(getMajorEuropeanShippingProfile('PT_MAD')?.countryCode, 'PT');
});

test('normalizes country-specific postcode shapes without asserting postcode-locality validity', () => {
  assert.equal(normalizeMajorEuropeanShippingField({
    countryCode: 'PT',
    fieldKey: 'postcode',
    text: '1000123',
    mode: 'domestic',
  }), '1000-123');
  assert.equal(normalizeMajorEuropeanShippingField({
    countryCode: 'DE',
    fieldKey: 'postcode',
    text: ' 10115 ',
    mode: 'domestic',
  }), '10115');

  const result = buildMajorEuropeanShippingAddress(synthetic('PT', {
    road: 'Rua Sintética',
    house_number: '8',
    city: 'Lisboa',
    postcode: '1000123',
  }), 'domestic');
  assert.equal(result.normalized.postcode, '1000-123');
  assert.ok(result.warnings.includes('postcode_locality_pair_not_verified'));
  assert.equal(result.deliveryPointValidated, false);
});

test('renders Italian domestic and international labels in Poste Italiane line order', () => {
  const input = synthetic('IT', {
    country: 'Italia',
    state: 'RM',
    city: 'Roma',
    subdistrict: 'Frazione Sintetica',
    road: 'Via Sintetica',
    house_number: '8',
    building: 'Organizzazione Sintetica',
    postcode: '00100',
  });
  const domestic = buildMajorEuropeanShippingAddress(input, 'domestic');
  const international = buildMajorEuropeanShippingAddress(input, 'international-shipping');

  assert.deepEqual(domestic.lines, [
    'Organizzazione Sintetica',
    'Frazione Sintetica',
    'Via Sintetica 8',
    '00100 Roma RM',
  ]);
  assert.deepEqual(international.lines, [...domestic.lines, 'ITALY']);
  assert.equal(international.normalized.city, 'Roma');
  assert.equal(international.normalized.road, 'Via Sintetica');
  assert.equal(international.formatStatus, 'format-ready');
});

test('preserves German destination names and places Ortsteil before street', () => {
  const result = buildMajorEuropeanShippingAddress(synthetic('DE', {
    country: 'Deutschland',
    city: 'München',
    subdistrict: 'Altstadt-Lehel',
    road: 'Beispielstraße',
    house_number: '64',
    building: 'Beispielwerk',
    postcode: '80331',
  }), 'international-shipping');

  assert.deepEqual(result.lines, [
    'Beispielwerk',
    'Altstadt-Lehel',
    'Beispielstraße 64',
    '80331 München',
    'GERMANY',
  ]);
  assert.ok(result.appliedRules.includes('preserve-destination-country-delivery-keys'));
});

test('uses CTT locality and seven-digit postcode structure for Portugal', () => {
  const result = buildMajorEuropeanShippingAddress(synthetic('PT', {
    country: 'Portugal',
    city: 'Lisboa',
    subdistrict: 'Localidade Sintética',
    road: 'Rua Sintética',
    house_number: '13',
    building: 'Organização Sintética',
    postcode: '1000123',
  }), 'international-shipping');

  assert.deepEqual(result.lines, [
    'Organização Sintética',
    'Rua Sintética 13',
    'Localidade Sintética',
    '1000-123 Lisboa',
    'PORTUGAL',
  ]);
  assert.equal(result.formatStatus, 'format-ready');
});

test('keeps Russian domestic Cyrillic and emits deterministic Latin international output', () => {
  const input = synthetic('RU', {
    country: 'Российская Федерация',
    state: 'Московская область',
    city: 'Москва',
    district: 'Тверской район',
    road: 'Тверская улица',
    house_number: '7',
    building: 'Синтетика',
    postcode: '101000',
  });
  const domestic = buildMajorEuropeanShippingAddress(input, 'domestic');
  const international = buildMajorEuropeanShippingAddress(input, 'international-shipping');

  assert.ok(domestic.formatted.includes('Тверская улица, д. 7'));
  assert.ok(domestic.formatted.includes('Российская Федерация'));
  assert.deepEqual(international.lines, [
    'Sintetika',
    'Tverskaya ulitsa, d. 7',
    'Moskva',
    'Tverskoy rayon, Moskovskaya oblast',
    '101000',
    'RUSSIAN FEDERATION',
  ]);
  assert.doesNotMatch(international.formatted, /[\u0400-\u052f]/u);
  assert.ok(international.warnings.includes('transliteration_applied'));
  assert.ok(!international.warnings.includes('transliteration_incomplete'));
  assert.equal(international.formatStatus, 'format-ready');
});

test('returns localized component labels for domestic forms and English labels internationally', () => {
  assert.equal(
    getMajorEuropeanShippingComponentLabels('IT', 'domestic').postcode,
    'CAP',
  );
  assert.equal(
    getMajorEuropeanShippingComponentLabels('DE', 'domestic').streetLine,
    'Straße und Hausnummer',
  );
  assert.equal(
    getMajorEuropeanShippingComponentLabels('PT', 'domestic').postcode,
    'Código postal',
  );
  assert.equal(
    getMajorEuropeanShippingComponentLabels('RU', 'domestic').country,
    'Страна',
  );
  assert.equal(
    getMajorEuropeanShippingComponentLabels('RU', 'international-shipping').country,
    'Country',
  );
});

test('keeps missing and malformed routing fields explicit', () => {
  const incomplete = buildMajorEuropeanShippingAddress(synthetic('DE'), 'domestic');
  assert.ok(incomplete.warnings.includes('missing_delivery_line'));
  assert.ok(incomplete.warnings.includes('missing_locality'));
  assert.ok(incomplete.warnings.includes('missing_postcode'));
  assert.equal(incomplete.formatStatus, 'needs-review');

  const malformed = buildMajorEuropeanShippingAddress(synthetic('IT', {
    road: 'Via Sintetica',
    house_number: '2',
    city: 'Roma',
    postcode: '100',
  }), 'domestic');
  assert.ok(malformed.warnings.includes('invalid_postcode_format'));
});

test('connects native and international modes to the shared address renderer', () => {
  const german = synthetic('DE', {
    country: 'Deutschland',
    city: 'Bonn',
    road: 'Hermannstraße',
    house_number: '64',
    postcode: '53225',
  });
  assert.equal(
    AddressRenderer.render('de', german),
    'Hermannstraße 64\n53225 Bonn',
  );
  assert.equal(
    AddressRenderer.render('intl_en', german),
    'Hermannstraße 64\n53225 Bonn\nGERMANY',
  );

  const russian = synthetic('RU', {
    city: 'Москва',
    road: 'Тверская улица',
    house_number: '7',
    postcode: '101000',
  });
  assert.doesNotMatch(
    AddressRenderer.render('intl_en', russian),
    /[\u0400-\u052f]/u,
  );
});
