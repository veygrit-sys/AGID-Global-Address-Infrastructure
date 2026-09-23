import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
buildRegistrationAddressLanguageTabs,
normalizeRegistrationAddressLanguage,
normalizeRegistrationUiLanguage,
selectRegistrationAddressFormat,
selectRegistrationCountry,
} from './addressRegistrationState';

test('normalizes app UI language separately from address display language', () => {
  assert.equal(normalizeRegistrationUiLanguage('ja'), 'ja');
  assert.equal(normalizeRegistrationUiLanguage('zh-Hant-TW'), 'zh-Hant');
  assert.equal(normalizeRegistrationUiLanguage('zh-Hans-CN'), 'zh-Hans');
  assert.equal(normalizeRegistrationUiLanguage('sw'), 'en');

  assert.equal(normalizeRegistrationAddressLanguage('local'), 'local');
  assert.equal(normalizeRegistrationAddressLanguage('en-CA'), 'en');
  assert.equal(normalizeRegistrationAddressLanguage('en_domestic'), 'en_domestic');
  assert.equal(normalizeRegistrationAddressLanguage('en_international'), 'en');
  assert.equal(normalizeRegistrationAddressLanguage('zh-Hant-HK'), 'zh-Hant');
  assert.equal(normalizeRegistrationAddressLanguage('sw'), 'sw');
});

test('builds address language tabs from country address languages plus international English', () => {
  const jpFormat = {
    countryCode: 'JP',
    name: 'Japan',
    native: { name: 'Japanese', addressFormat: '', ordering: 'big-to-small', fields: [] },
    english: { name: 'International English', addressFormat: '', ordering: 'small-to-big', fields: [] },
    addressRules: {
      languages: [{ code: 'ja', name: 'Japanese' }],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  const chFormat = {
    countryCode: 'CH',
    name: 'Switzerland',
    native: { name: 'Deutsch', addressFormat: '', ordering: 'small-to-big', fields: [] },
    english: { name: 'International English', addressFormat: '', ordering: 'small-to-big', fields: [] },
    domestic: {
      fr: { name: 'Français', addressFormat: '', ordering: 'small-to-big', fields: [] },
      it: { name: 'Italiano', addressFormat: '', ordering: 'small-to-big', fields: [] },
      rm: { name: 'Rumantsch', addressFormat: '', ordering: 'small-to-big', fields: [] },
    },
    addressRules: {
      languages: [
        { code: 'de', name: 'German' },
        { code: 'fr', name: 'French' },
        { code: 'it', name: 'Italian' },
        { code: 'rm', name: 'Romansh' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(jpFormat).map(tab => tab.code),
    ['ja', 'en']
  );
  assert.equal(
    buildRegistrationAddressLanguageTabs(jpFormat).find(tab => tab.code === 'ja')?.label,
    '日本語'
  );
  assert.equal(
    buildRegistrationAddressLanguageTabs(jpFormat).find(tab => tab.code === 'en')?.label,
    'English (International Shipping)'
  );
  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(chFormat).map(tab => tab.code),
    ['de', 'fr', 'it', 'rm', 'en']
  );
  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(chFormat).map(tab => tab.label),
    ['Deutsch', 'Français', 'Italiano', 'Rumantsch', 'English (International Shipping)']
  );
});

test('splits domestic and international English for English address countries', () => {
  const usFormat = {
    countryCode: 'US',
    name: 'United States',
    native: {
      name: 'English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'houseNumber', label: 'House No.' }],
    },
    domestic: {
      es: {
        name: 'Español',
        addressFormat: '',
        ordering: 'small-to-big',
        fields: [{ key: 'houseNumber', label: 'No. de Casa' }],
      },
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'houseNumber', label: 'No.' }],
    },
    addressRules: {
      languages: [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  const caFormat = {
    countryCode: 'CA',
    name: 'Canada',
    native: {
      name: 'English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'houseNumber', label: 'Civic No.' }],
    },
    domestic: {
      fr: {
        name: 'Français',
        addressFormat: '',
        ordering: 'small-to-big',
        fields: [{ key: 'houseNumber', label: 'No. civique' }],
      },
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'houseNumber', label: 'No.' }],
    },
    addressRules: {
      languages: [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'French' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(usFormat).map(tab => tab.code),
    ['en_domestic', 'es', 'en']
  );
  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(usFormat).map(tab => tab.label),
    ['English (Inner Circle Domestic)', 'Español', 'English (International Shipping)']
  );
  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(usFormat).map(tab => tab.englishCircle || null),
    ['inner', null, null]
  );
  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(caFormat).map(tab => tab.code),
    ['en_domestic', 'fr', 'en']
  );

  assert.equal(selectRegistrationAddressFormat(usFormat, 'en_domestic')?.fields[0].label, 'House No.');
  assert.equal(selectRegistrationAddressFormat(usFormat, 'en')?.fields[0].label, 'No.');
  assert.equal(selectRegistrationAddressFormat(usFormat, 'es')?.fields[0].label, 'No. de Casa');
  assert.equal(selectRegistrationAddressFormat(caFormat, 'fr')?.fields[0].label, 'No. civique');
});

test('marks Outer Circle English address countries separately from Inner Circle countries', () => {
  const indiaFormat = {
    countryCode: 'IN',
    name: 'India',
    native: {
      name: 'Hindi',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'सड़क' }],
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Street' }],
    },
    addressRules: {
      languages: [
        { code: 'hi', name: 'Hindi' },
        { code: 'en', name: 'English' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  const tabs = buildRegistrationAddressLanguageTabs(indiaFormat);

  assert.deepEqual(tabs.map(tab => tab.code), ['hi', 'en_domestic', 'en']);
  assert.deepEqual(tabs.map(tab => tab.label), [
    'हिन्दी',
    'English (Outer Circle Domestic)',
    'English (International Shipping)',
  ]);
  assert.deepEqual(tabs.map(tab => tab.englishCircle || null), [null, 'outer', null]);
});

test('adds domestic and international English for Outer Circle countries even when native metadata omits English', () => {
  const bruneiFormat = {
    countryCode: 'BN',
    name: 'Brunei',
    native: {
      name: 'Brunei Darussalam',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Street' }],
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Street' }],
    },
    addressRules: {
      languages: [{ code: 'ms', name: 'Malay' }],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  const tabs = buildRegistrationAddressLanguageTabs(bruneiFormat);

  assert.deepEqual(tabs.map(tab => tab.code), ['ms', 'en_domestic', 'en']);
  assert.deepEqual(tabs.map(tab => tab.englishCircle || null), [null, 'outer', null]);
});

test('splits English domestic and international tabs for English-language territories', () => {
  const caymanFormat = {
    countryCode: 'KY',
    name: 'Cayman Islands',
    native: {
      name: 'Cayman Islands',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Street' }],
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Street' }],
    },
    addressRules: {
      languages: [{ code: 'en', name: 'English' }],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  const tabs = buildRegistrationAddressLanguageTabs(caymanFormat);

  assert.deepEqual(tabs.map(tab => tab.code), ['en_domestic', 'en']);
  assert.deepEqual(tabs.map(tab => tab.englishCircle || null), ['outer', null]);
});

test('keeps all address-used languages for multilingual countries', () => {
  const belgiumFormat = {
    countryCode: 'BE',
    name: 'Belgium',
    native: {
      name: 'Dutch',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Straat' }],
    },
    domestic: {
      fr: {
        name: 'French',
        addressFormat: '',
        ordering: 'small-to-big',
        fields: [{ key: 'street', label: 'Rue' }],
      },
      de: {
        name: 'German',
        addressFormat: '',
        ordering: 'small-to-big',
        fields: [{ key: 'street', label: 'Straße' }],
      },
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Street' }],
    },
    addressRules: {
      languages: [
        { code: 'nl', name: 'Dutch' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  const finlandFormat = {
    countryCode: 'FI',
    name: 'Finland',
    native: {
      name: 'Finnish',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Katu' }],
    },
    domestic: {
      sv: {
        name: 'Swedish',
        addressFormat: '',
        ordering: 'small-to-big',
        fields: [{ key: 'street', label: 'Gata' }],
      },
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Street' }],
    },
    addressRules: {
      languages: [
        { code: 'fi', name: 'Finnish' },
        { code: 'sv', name: 'Swedish' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(belgiumFormat).map(tab => tab.code),
    ['nl', 'fr', 'de', 'en']
  );
  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(finlandFormat).map(tab => tab.code),
    ['fi', 'sv', 'en']
  );
  assert.equal(selectRegistrationAddressFormat(belgiumFormat, 'fr')?.fields[0].label, 'Rue');
  assert.equal(selectRegistrationAddressFormat(belgiumFormat, 'de')?.fields[0].label, 'Straße');
  assert.equal(selectRegistrationAddressFormat(finlandFormat, 'sv')?.fields[0].label, 'Gata');
});

test('does not add delivery-only languages to Address Language tabs', () => {
  const format = {
    countryCode: 'XX',
    name: 'Delivery Only Example',
    native: {
      name: 'German',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Straße' }],
    },
    domestic: {
      fr: {
        name: 'French',
        addressFormat: '',
        ordering: 'small-to-big',
        fields: [{ key: 'street', label: 'Rue' }],
      },
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'street', label: 'Street' }],
    },
    addressRules: {
      languages: [{ code: 'de', name: 'German' }],
      deliveryLanguages: [
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  assert.deepEqual(
    buildRegistrationAddressLanguageTabs(format).map(tab => tab.code),
    ['de', 'fr', 'en']
  );
});

test('does not expose non-English international translation packs as Address Language tabs', () => {
  const format = {
    countryCode: 'JP',
    name: 'Japan',
    native: {
      name: 'Japanese',
      addressFormat: '',
      ordering: 'big-to-small',
      fields: [{ key: 'city', label: '市区町村' }],
    },
    english: {
      name: 'International English',
      addressFormat: '',
      ordering: 'small-to-big',
      fields: [{ key: 'city', label: 'City' }],
    },
    international: {
      fr: {
        name: 'French',
        addressFormat: '',
        ordering: 'small-to-big',
        fields: [{ key: 'city', label: 'Ville' }],
      },
      es: {
        name: 'Spanish',
        addressFormat: '',
        ordering: 'small-to-big',
        fields: [{ key: 'city', label: 'Ciudad' }],
      },
    },
    addressRules: {
      languages: [{ code: 'ja', name: 'Japanese' }],
      deliveryLanguages: [
        { code: 'fr', name: 'French' },
        { code: 'es', name: 'Spanish' },
      ],
      nativeOrder: [],
      englishOrder: [],
      regionalHierarchy: [],
      postalCode: null,
    },
  } as const;

  const tabs = buildRegistrationAddressLanguageTabs(format);

  assert.deepEqual(tabs.map(tab => tab.code), ['ja', 'en']);
  assert.deepEqual(tabs.map(tab => tab.kind), ['domestic', 'international']);
  assert.equal(selectRegistrationAddressFormat(format, 'fr')?.fields[0].label, '市区町村');
});

test('country selection changes only country-specific form data', () => {
  const formData = {
    country: 'JP',
    recipient: 'Aoi',
    organization: 'AGID',
    street: '1 Main Street',
    city: 'Tokyo',
    state: 'Tokyo',
    postcode: '1000001',
    suburb: 'Chiyoda',
    phone: '+81',
  };

  const mainland = selectRegistrationCountry(formData, { code: 'US', name: 'United States (Mainland)' });
  assert.equal(mainland.country, 'US');
  assert.equal(mainland.state, '');
  assert.equal(mainland.recipient, formData.recipient);
  assert.equal(mainland.street, formData.street);

  const territory = selectRegistrationCountry(formData, { code: 'PR', name: 'Puerto Rico' });
  assert.equal(territory.country, 'PR');
  assert.equal(territory.state, 'Puerto Rico');
  assert.equal(territory.recipient, formData.recipient);
  assert.equal(territory.street, formData.street);
});
