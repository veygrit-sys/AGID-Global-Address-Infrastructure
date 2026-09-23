import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressFormat } from '../data/address_formats';
import { AddressRenderer,createCanonicalAddress,type CanonicalAddress } from './addressRendering';

const japaneseAddress: CanonicalAddress = {
  country_code: 'JP',
  country: '日本',
  state: '東京都',
  city: '千代田区',
  district: '',
  subdistrict: '永田町',
  suburb: '',
  road: '1-1',
  house_number: '1',
  building: '中央合同庁舎',
  postcode: '100-0014',
  poi: '',
};

test('renders international English addresses without leaking native script', () => {
  const rendered = AddressRenderer.render('intl_en', japaneseAddress);

  assert.equal(rendered, 'Chuo Godo Chosha\n1 1-1\nNagatacho, Chiyoda-ku\nTokyo 100-0014\nJAPAN');
  assert.equal(/[\u3040-\u30ff\u3400-\u9fff]/.test(rendered), false);
});

test('country address format keeps English domestic and international tabs distinct', () => {
  const format: AddressFormat = {
    countryCode: 'US',
    name: 'United States',
    native: {
      name: 'English',
      addressFormat: '{{organization}}\n{{houseNumber}} {{street}}\n{{city}}, {{state}} {{postcode}}',
      ordering: 'small-to-big',
      fields: [],
    },
    english: {
      name: 'International English',
      addressFormat: '{{organization}}\n{{houseNumber}} {{street}}\n{{city}}, {{state}} {{postcode}}\nUNITED STATES',
      ordering: 'small-to-big',
      fields: [],
    },
    addressRules: {
      languages: [{ code: 'en', name: 'English' }],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  };
  const canonical = createCanonicalAddress({
    country_code: 'US',
    country: 'United States',
    state: 'CA',
    city: 'Cupertino',
    road: 'Infinite Loop',
    house_number: '1',
    building: 'Apple Park',
    postcode: '95014',
  });

  assert.equal(
    AddressRenderer.render('en_domestic', canonical, format),
    'Apple Park\n1 Infinite Loop\nCupertino, CA 95014',
  );
  assert.equal(
    AddressRenderer.render('en', canonical, format),
    'Apple Park\n1 Infinite Loop\nCupertino, CA 95014\nUNITED STATES',
  );
});

test('country address format renders multilingual domestic tabs before generic fallback', () => {
  const format: AddressFormat = {
    countryCode: 'CH',
    name: 'Switzerland',
    native: {
      name: 'Deutsch',
      addressFormat: '{{organization}}\n{{street}} {{houseNumber}}\n{{postcode}} {{city}}',
      ordering: 'small-to-big',
      fields: [],
    },
    domestic: {
      fr: {
        name: 'Francais',
        addressFormat: '{{organization}}\n{{street}} {{houseNumber}}\n{{postcode}} {{city}}',
        ordering: 'small-to-big',
        fields: [],
      },
    },
    english: {
      name: 'International English',
      addressFormat: '{{houseNumber}} {{street}}\n{{postcode}} {{city}}\nSWITZERLAND',
      ordering: 'small-to-big',
      fields: [],
    },
    addressRules: {
      languages: [
        { code: 'de', name: 'German' },
        { code: 'fr', name: 'French' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  };
  const canonical = createCanonicalAddress({
    country_code: 'CH',
    country: 'Switzerland',
    city: 'Geneve',
    road: 'Rue du Marche',
    house_number: '7',
    postcode: '1204',
  });

  assert.equal(AddressRenderer.render('fr', canonical, format), 'Rue du Marche 7\n1204 Geneve');
  assert.equal(AddressRenderer.render('de', canonical, format), 'Rue du Marche 7\n1204 Geneve');
  assert.equal(AddressRenderer.render('en', canonical, format), '7 Street du Marche\n1204 Geneve\nSWITZERLAND');
});

test('plain English tab for non-English countries uses compatible international order', () => {
  const rendered = AddressRenderer.render('en', {
    ...japaneseAddress,
    subdistrict: '',
    road: '',
    house_number: '',
    building: '',
    postcode: '1006727',
  });

  assert.equal(rendered, 'Chiyoda-ku\nTokyo 1006727\nJAPAN');
  assert.doesNotMatch(rendered, /^,/m);
  assert.equal(/[\u3040-\u30ff\u3400-\u9fff]/.test(rendered), false);
});

test('renders domestic English without adding the destination country line', () => {
  const rendered = AddressRenderer.render('en', {
    ...japaneseAddress,
    country_code: 'US',
    country: 'United States',
    state: 'CA',
    city: 'Cupertino',
    subdistrict: '',
    road: 'Infinite Loop',
    house_number: '1',
    building: '',
    postcode: '95014',
  });

  assert.equal(rendered, '1 Infinite Loop\nCupertino\nCA 95014');
});

test('renders Outer Circle domestic English with the same domestic layout', () => {
  const rendered = AddressRenderer.render('en', {
    ...japaneseAddress,
    country_code: 'AE',
    country: 'United Arab Emirates',
    state: 'Dubai',
    city: 'Dubai',
    subdistrict: 'Downtown Dubai',
    road: 'Sheikh Mohammed bin Rashid Boulevard',
    house_number: '1',
    building: 'Burj Khalifa',
    postcode: '',
  });

  assert.equal(rendered, 'Burj Khalifa\n1 Sheikh Mohammed bin Rashid Boulevard\nDowntown Dubai, Dubai');
});

test('keeps European street and postcode order in English rendering', () => {
  const rendered = AddressRenderer.render('intl_en', {
    ...japaneseAddress,
    country_code: 'DE',
    country: 'Deutschland',
    state: 'Berlin',
    city: 'Berlin',
    subdistrict: '',
    road: 'Hauptstraße',
    house_number: '12',
    building: '',
    postcode: '10115',
  });

  assert.equal(rendered, 'Hauptstraße 12\n10115 Berlin\nGERMANY');
});

test('renders a safer partial AGID area when no street address is available', () => {
  const rendered = AddressRenderer.renderPartialAddress('fr', {
    ...japaneseAddress,
    country_code: 'ML',
    country: 'Mali',
    state: '',
    city: '20.',
    district: '',
    subdistrict: '',
    road: '',
    house_number: '',
    building: '',
    postcode: '',
  });

  assert.equal(rendered, 'Mali');
});

test('keeps Mali native and international English tabs distinct for sparse rural areas', () => {
  const canonical = createCanonicalAddress({
    country_code: 'ml',
    country: 'Mali',
    state: 'Kidal',
    city: 'Kidal',
    district: 'Cercle de Tessalit',
  });

  assert.equal(AddressRenderer.render('fr', canonical), 'Cercle de Tessalit\nKidal');
  assert.equal(AddressRenderer.render('en', canonical), 'Cercle de Tessalit\nKidal\nMALI');
  assert.equal(AddressRenderer.renderInternationalShippingEnglish(canonical), 'CERCLE DE TESSALIT\nKIDAL\nMALI');
});

test('canonical AGID address display uses postal and open-source evidence when available', () => {
  const canonical = createCanonicalAddress({
    country_code: 'fr',
    country: 'France',
    city: '20.',
    address_analysis: {
      canonical: {
        country_code: 'fr',
        country: 'France',
        city: '20.',
      },
    },
    european_postal_data: {
      postcode: '75001',
      city: 'Paris',
      street: 'Rue de Rivoli',
      houseNumber: '99',
    },
  });

  assert.equal(canonical.country_code, 'FR');
  assert.equal(canonical.city, 'Paris');
  assert.equal(canonical.road, 'Rue de Rivoli');
  assert.equal(canonical.house_number, '99');
  assert.equal(canonical.postcode, '75001');
});

test('renders map feature names when no building name is present', () => {
  const canonical = createCanonicalAddress({
    country_code: 'fr',
    country: 'France',
    city: 'Paris',
    map_feature_name: 'Parc des Buttes-Chaumont',
    map_feature_kind: 'park',
  });

  assert.equal(canonical.poi, 'Parc des Buttes-Chaumont');
  assert.equal(AddressRenderer.render('fr', canonical), 'Parc des Buttes-Chaumont\nParis');
});

test('renders natural and heritage feature fields when no building name is present', () => {
  const pond = createCanonicalAddress({
    country_code: 'jp',
    country: 'Japan',
    city: 'Tokyo',
    pond: 'Shinobazu Pond',
  });
  const heritage = createCanonicalAddress({
    country_code: 'in',
    country: 'India',
    city: 'Agra',
    heritage_site: 'Taj Mahal',
  });

  assert.equal(pond.poi, 'Shinobazu Pond');
  assert.equal(AddressRenderer.render('intl_en', heritage), 'Taj Mahal\nAgra\nINDIA');
});

test('canonical address creation tolerates missing details during error recovery', () => {
  const canonical = createCanonicalAddress(undefined);

  assert.deepEqual(canonical, {
    country_code: '',
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
    plus_code: '',
  });
});
