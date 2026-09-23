import assert from 'node:assert/strict';
import test from 'node:test';
import { AddressRenderer,type CanonicalAddress } from './addressRendering';
import {
  REMAINING_EUROPEAN_SHIPPING_COUNTRY_CODES,
  buildRemainingEuropeanShippingAddress,
  getRemainingEuropeanShippingProfile,
  isRemainingEuropeanShippingCountry,
  supportsRemainingEuropeanDomesticLanguage,
} from './remainingEuropeanShippingAddress';
import {
  transliterateArmenian,
  transliterateCyrillic,
  transliterateGeorgian,
  transliterateGreek,
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

test('publishes 44 explicit remaining-Europe profiles with language and evidence gates', () => {
  assert.equal(REMAINING_EUROPEAN_SHIPPING_COUNTRY_CODES.length, 44);
  for (const countryCode of REMAINING_EUROPEAN_SHIPPING_COUNTRY_CODES) {
    const profile = getRemainingEuropeanShippingProfile(countryCode);
    assert.ok(profile);
    assert.ok(profile.nativeLanguages.length > 0);
    assert.ok(profile.nativeLanguages.includes(profile.defaultLanguage));
    assert.equal(profile.evidence.checkedOn, '2026-07-25');
    assert.equal(profile.evidence.reuseStatus, 'reference-only-no-postal-dataset-copied');
    assert.match(profile.evidence.url, /^https:\/\/www\.upu\.int\//);
    assert.equal(profile.evidence.correctionPath, 'mailto:postcode@upu.int');
  }
  assert.equal(isRemainingEuropeanShippingCountry('SJ'), true);
  assert.equal(getRemainingEuropeanShippingProfile('SJ')?.countryCode, 'SJ_SVA');
  assert.equal(supportsRemainingEuropeanDomesticLanguage('FI', 'sv-FI'), true);
  assert.equal(supportsRemainingEuropeanDomesticLanguage('FI', 'de'), false);
  assert.equal(supportsRemainingEuropeanDomesticLanguage('GB', 'cy'), true);
  assert.equal(supportsRemainingEuropeanDomesticLanguage('GB', 'en'), false);
});

test('normalizes representative postcode families without claiming locality validity', () => {
  const cases = [
    ['NL', '1234ab', '1234 AB'],
    ['SE', '12345', '123 45'],
    ['PL', '12345', '12-345'],
    ['CZ', '12345', '123 45'],
    ['LV', '1050', 'LV-1050'],
    ['LT', '01100', 'LT-01100'],
    ['LU', '1234', 'L-1234'],
    ['MD', '2001', 'MD-2001'],
    ['AZ', '1000', 'AZ 1000'],
    ['AD', '500', 'AD500'],
    ['MT', 'abc1234', 'ABC 1234'],
  ] as const;

  for (const [countryCode, input, expected] of cases) {
    const result = buildRemainingEuropeanShippingAddress(synthetic(countryCode, {
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

test('selects approved domestic locality variants in multilingual postal markets', () => {
  const belgian = buildRemainingEuropeanShippingAddress(synthetic('BE', {
    city: 'Bruxelles',
    road: 'Synthetische straat',
    house_number: '8',
    postcode: '1000',
  }), 'domestic', { domesticLanguage: 'nl' });
  assert.equal(belgian.outputLanguage, 'nl');
  assert.equal(belgian.normalized.city, 'Brussel');
  assert.ok(belgian.warnings.includes('multilingual_locality_alias_applied'));

  const swiss = buildRemainingEuropeanShippingAddress(synthetic('CH', {
    city: 'Zürich',
    road: 'Via sintetica',
    house_number: '8',
    postcode: '8000',
  }), 'domestic', { domesticLanguage: 'rm' });
  assert.equal(swiss.outputLanguage, 'rm');
  assert.equal(swiss.normalized.city, 'Turitg');

  const finnish = buildRemainingEuropeanShippingAddress(synthetic('FI', {
    city: 'Helsinki',
    road: 'Syntetisk väg',
    house_number: '8',
    postcode: '00100',
  }), 'domestic', { domesticLanguage: 'sv' });
  assert.equal(finnish.normalized.city, 'Helsingfors');
  assert.match(finnish.formatted, /00100 HELSINGFORS/);

  const cypriot = buildRemainingEuropeanShippingAddress(synthetic('CY', {
    city: 'Λευκωσία',
    road: 'Sentetik Sokak',
    house_number: '8',
    postcode: '1000',
  }), 'domestic', { domesticLanguage: 'tr' });
  assert.equal(cypriot.normalized.city, 'Lefkoşa');
  assert.doesNotMatch(cypriot.formatted, /Λευκωσία/);
});

test('keeps unsupported domestic language requests visible instead of fabricating translations', () => {
  const result = buildRemainingEuropeanShippingAddress(synthetic('FI', {
    city: 'Helsinki',
    road: 'Synteettinen tie',
    house_number: '8',
    postcode: '00100',
  }), 'domestic', { domesticLanguage: 'de' });

  assert.equal(result.outputLanguage, 'fi');
  assert.ok(result.warnings.includes('unsupported_domestic_language'));
  assert.equal(result.formatStatus, 'needs-review');
});

test('transliterates Greek, extended Cyrillic, Armenian, and Georgian deterministically', () => {
  assert.equal(transliterateGreek('Αθήνα'), 'Athina');
  assert.equal(transliterateCyrillic('Љубљана Ѓорче'), 'Ljubljana Gjorche');
  assert.equal(transliterateArmenian('Հայաստան'), 'Hayastan');
  assert.equal(transliterateGeorgian('თბილისი'), 'tbilisi');
});

test('international labels remove destination scripts and apply conservative English exonyms', () => {
  const inputs = [
    synthetic('GR', {
      city: 'Αθήνα',
      road: 'Συνθετική Οδός',
      house_number: '8',
      postcode: '10558',
    }),
    synthetic('BG', {
      city: 'София',
      road: 'Синтетична улица',
      house_number: '8',
      postcode: '1000',
    }),
    synthetic('AM', {
      city: 'Երևան',
      road: 'Փորձնական փողոց',
      house_number: '8',
      postcode: '0010',
    }),
    synthetic('GE', {
      city: 'თბილისი',
      road: 'სინთეზური ქუჩა',
      house_number: '8',
      postcode: '0100',
    }),
  ];
  const expectedCities = ['Athens', 'Sofia', 'Yerevan', 'Tbilisi'];

  inputs.forEach((input, index) => {
    const result = buildRemainingEuropeanShippingAddress(
      input,
      'international-shipping',
    );
    assert.equal(result.normalized.city, expectedCities[index]);
    assert.doesNotMatch(
      result.formatted,
      /[\u0370-\u03ff\u0400-\u052f\u0530-\u058f\u10a0-\u10ff\u1c90-\u1cbf]/u,
    );
    assert.ok(result.warnings.includes('transliteration_applied'));
    assert.ok(!result.warnings.includes('transliteration_incomplete'));
  });
});

test('uses Hungarian destination line order and preserves delivery keys', () => {
  const result = buildRemainingEuropeanShippingAddress(synthetic('HU', {
    city: 'Mintaváros',
    road: 'Minta utca',
    house_number: '8',
    building: 'Minta Szervezet',
    postcode: '1000',
  }), 'international-shipping');

  assert.deepEqual(result.lines, [
    'Minta Szervezet',
    'Mintaváros',
    'Minta utca 8',
    '1000',
    'HUNGARY',
  ]);
  assert.ok(result.appliedRules.includes('preserve-destination-delivery-keys'));
});

test('keeps neutral territorial scope explicit for Kosovo, Svalbard, and Jan Mayen', () => {
  for (const countryCode of ['XK', 'SJ_SVA', 'SJ_JAN']) {
    const result = buildRemainingEuropeanShippingAddress(synthetic(countryCode, {
      city: 'Synthetic Locality',
      road: 'Synthetic Road',
      house_number: '8',
      postcode: countryCode === 'XK' ? '10000' : '9170',
    }), 'international-shipping');
    assert.ok(result.warnings.includes('neutral_scope_review_required'));
    assert.equal(result.evidence?.scope, 'neutral-destination-label-scope-only');
    assert.equal(result.formatStatus, 'needs-review');
  }
});

test('connects multilingual domestic and international modes to AddressRenderer', () => {
  const welsh = synthetic('GB', {
    city: 'Cardiff',
    road: 'Ffordd Synthetig',
    house_number: '8',
    postcode: 'CF101AA',
  });
  assert.equal(
    AddressRenderer.render('cy', welsh),
    '8 Ffordd Synthetig\nCaerdydd\nCF10 1AA',
  );

  const irish = synthetic('IE', {
    city: 'Dublin',
    road: 'Bóthar Sintéiseach',
    house_number: '8',
    postcode: 'D02X285',
  });
  assert.equal(
    AddressRenderer.render('ga', irish),
    '8 Bóthar Sintéiseach\nBaile Átha Cliath\nD02 X285',
  );

  const greek = synthetic('GR', {
    city: 'Αθήνα',
    road: 'Συνθετική Οδός',
    house_number: '8',
    postcode: '10558',
  });
  assert.equal(
    AddressRenderer.render('intl_en', greek),
    'Synthetiki Odos 8\n105 58 Athens\nGREECE',
  );
});
