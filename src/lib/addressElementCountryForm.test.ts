import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AddressFormat } from '../data/address_formats';
import {
  buildAddressElementFormFields,
  buildAddressElementLanguageTabs,
  describeAddressElementCountryForm,
  getAddressElementPostalCodePolicy,
  mapAddressFormatFieldKey,
  pickAddressElementLanguage,
} from './addressElementCountryForm';

const japanFormat: AddressFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    name: 'Japanese',
    addressFormat: '〒{postalCode} {prefecture}{city}{street}',
    ordering: 'big-to-small',
    fields: [
      { key: 'postalCode', label: '郵便番号', required: true },
      { key: 'prefecture', label: '都道府県', required: true },
      { key: 'city', label: '市区町村', required: true },
      { key: 'street', label: '町名・番地', required: true },
      { key: 'building', label: '建物名' },
    ],
  },
  english: {
    name: 'English',
    addressFormat: '{street}, {city}, {prefecture} {postalCode}, Japan',
    ordering: 'small-to-big',
    fields: [
      { key: 'street', label: 'Street', required: true },
      { key: 'city', label: 'City', required: true },
      { key: 'prefecture', label: 'Prefecture', required: true },
      { key: 'postalCode', label: 'Postal code', required: true },
    ],
  },
  postalCode: {
    format: 'NNN-NNNN',
    regex: '^\\d{3}-\\d{4}$',
    api: 'japan-post',
    source: 'test-fixture',
  },
};

const hongKongNoPostcodeFormat: AddressFormat = {
  countryCode: 'HK',
  name: 'Hong Kong',
  native: {
    name: 'Chinese (Traditional)',
    addressFormat: '{district}{street}{building}{floor}{room}',
    ordering: 'big-to-small',
    fields: [
      { key: 'district', label: 'District', required: true },
      { key: 'street', label: 'Street', required: true },
      { key: 'building', label: 'Building' },
    ],
  },
  english: {
    name: 'English',
    addressFormat: '{room}, {floor}, {building}, {street}, {district}, Hong Kong',
    ordering: 'small-to-big',
    fields: [
      { key: 'room', label: 'Room' },
      { key: 'building', label: 'Building' },
      { key: 'street', label: 'Street', required: true },
      { key: 'district', label: 'District', required: true },
    ],
  },
  postalCode: {
    format: null,
    regex: null,
    api: null,
    source: 'Hongkong Post / LandsD / CSDI (No postal codes used)',
  },
  addressRules: {
    languages: [{ code: 'zh-Hant', name: 'Chinese (Traditional)' }],
    nativeOrder: ['district', 'street', 'building'],
    englishOrder: ['room', 'floor', 'building', 'street', 'district'],
    regionalHierarchy: ['district'],
    postalCode: null,
  },
};

const vaticanFixedPostcodeFormat: AddressFormat = {
  countryCode: 'VA',
  name: 'Vatican City',
  native: {
    name: 'Italian',
    addressFormat: '{street} {houseNumber}, 00120 Citta del Vaticano',
    ordering: 'small-to-big',
    fields: [
      { key: 'street', label: 'Via', required: true },
      { key: 'houseNumber', label: 'Numero civico', required: true },
    ],
  },
  english: {
    name: 'English',
    addressFormat: '{street} {houseNumber}, 00120 Vatican City',
    ordering: 'small-to-big',
    fields: [
      { key: 'street', label: 'Street', required: true },
      { key: 'houseNumber', label: 'Number', required: true },
    ],
  },
  postalCode: {
    format: '00120',
    regex: '^00120$',
    api: null,
    source: 'Vatican City postcode metadata',
  },
  addressRules: {
    languages: [{ code: 'it', name: 'Italian' }],
    nativeOrder: ['street', 'houseNumber', 'postalCode'],
    englishOrder: ['street', 'houseNumber', 'postalCode'],
    regionalHierarchy: ['city'],
    postalCode: { label: '00120 Vatican City postcode', required: true, usage: 'required' },
  },
};

test('country form helper maps national address field names into Address Element keys', () => {
  assert.equal(mapAddressFormatFieldKey('postalCode'), 'postcode');
  assert.equal(mapAddressFormatFieldKey('prefecture'), 'state');
  assert.equal(mapAddressFormatFieldKey('street'), 'street');
  assert.equal(mapAddressFormatFieldKey('unknownField'), null);
});

test('country form helper builds language tabs and country-specific fields', () => {
  const tabs = buildAddressElementLanguageTabs(japanFormat, 'JP');
  const fields = buildAddressElementFormFields(japanFormat, 'ja');
  const keys = fields.map(field => field.key);

  assert.ok(tabs.some(tab => tab.language === 'ja'));
  assert.ok(tabs.some(tab => tab.language === 'en'));
  assert.equal(pickAddressElementLanguage('local', tabs), 'ja');
  assert.ok(keys.includes('recipient'));
  assert.ok(keys.includes('countryCode'));
  assert.ok(keys.includes('postcode'));
  assert.ok(keys.includes('state'));
  assert.ok(keys.includes('phone'));
  assert.equal(fields.find(field => field.key === 'state')?.label, '都道府県');
});

test('country form summary exposes safe format metadata without raw address values', () => {
  const summary = describeAddressElementCountryForm(japanFormat, 'en');

  assert.equal(summary.countryName, 'Japan');
  assert.equal(summary.formatName, 'English');
  assert.equal(summary.postalCodeFormat, 'NNN-NNNN');
  assert.ok(summary.requiredFields.includes('Postal code'));
});

test('country form removes postal-code input when country metadata says postal codes are not used', () => {
  const policy = getAddressElementPostalCodePolicy(hongKongNoPostcodeFormat);
  const fields = buildAddressElementFormFields(hongKongNoPostcodeFormat, 'en');
  const summary = describeAddressElementCountryForm(hongKongNoPostcodeFormat, 'en');

  assert.equal(policy.available, false);
  assert.equal(summary.postalCodeFormat, 'not used');
  assert.ok(!fields.some(field => field.key === 'postcode'));
});

test('country form exposes fixed postal-code metadata for one-code territories', () => {
  const policy = getAddressElementPostalCodePolicy(vaticanFixedPostcodeFormat);
  const fields = buildAddressElementFormFields(vaticanFixedPostcodeFormat, 'en');
  const postcode = fields.find(field => field.key === 'postcode');

  assert.equal(policy.fixedValue, '00120');
  assert.equal(policy.characterSlots, 5);
  assert.equal(postcode?.fixed, true);
  assert.equal(postcode?.fixedValue, '00120');
  assert.equal(postcode?.maxLength, 5);
});
