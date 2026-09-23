import assert from 'node:assert/strict';
import { test } from 'node:test';

import { translateRegistrationFormFields } from './addressRegistrationAutomation';
import { AddressRenderer,type CanonicalAddress } from './addressRendering';

function escapedRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const multilingualNativeExamples: Array<{
  countryCode: string;
  languages: string[];
  address: CanonicalAddress;
  expectedStreetLine: string;
}> = [
  {
    countryCode: 'CH',
    languages: ['de', 'fr', 'it', 'rm'],
    expectedStreetLine: 'Bundesgasse 3',
    address: {
      country_code: 'CH',
      country: 'Switzerland',
      state: '',
      city: 'Bern',
      district: '',
      subdistrict: '',
      suburb: '',
      road: 'Bundesgasse',
      house_number: '3',
      building: '',
      postcode: '3003',
      poi: '',
    },
  },
  {
    countryCode: 'LU',
    languages: ['lb', 'fr', 'de'],
    expectedStreetLine: 'Rue du Marche-aux-Herbes 4',
    address: {
      country_code: 'LU',
      country: 'Luxembourg',
      state: '',
      city: 'Luxembourg',
      district: '',
      subdistrict: '',
      suburb: '',
      road: 'Rue du Marche-aux-Herbes',
      house_number: '4',
      building: '',
      postcode: '1728',
      poi: '',
    },
  },
  {
    countryCode: 'CY',
    languages: ['el', 'tr'],
    expectedStreetLine: 'Ledras Street 12',
    address: {
      country_code: 'CY',
      country: 'Cyprus',
      state: '',
      city: 'Nicosia',
      district: '',
      subdistrict: '',
      suburb: '',
      road: 'Ledras Street',
      house_number: '12',
      building: '',
      postcode: '1011',
      poi: '',
    },
  },
  {
    countryCode: 'BA',
    languages: ['bs', 'hr', 'sr'],
    expectedStreetLine: 'Obala Kulina bana 1',
    address: {
      country_code: 'BA',
      country: 'Bosnia and Herzegovina',
      state: '',
      city: 'Sarajevo',
      district: '',
      subdistrict: '',
      suburb: '',
      road: 'Obala Kulina bana',
      house_number: '1',
      building: '',
      postcode: '71000',
      poi: '',
    },
  },
];

test('multilingual native address tabs keep compatible street and routing fields', () => {
  for (const example of multilingualNativeExamples) {
    for (const language of example.languages) {
      const rendered = AddressRenderer.render(language, example.address);

      assert.match(
        rendered,
        new RegExp(`(^|, |\\n)${escapedRegExp(example.expectedStreetLine)}(,|\\n|$)`),
        `${example.countryCode}/${language} should keep street before house number`,
      );
      assert.match(rendered, new RegExp(escapedRegExp(example.address.city)), `${example.countryCode}/${language} should keep city`);
      assert.match(rendered, new RegExp(escapedRegExp(example.address.postcode)), `${example.countryCode}/${language} should keep postcode`);
    }
  }
});

test('native-language tab translation preserves shared routing fields between multilingual tabs', async () => {
  const source = {
    country: 'CH',
    postcode: '3003',
    phone: '+41 31 322 11 11',
    state: 'Bern',
    city: 'Bern',
    street: 'Bundesgasse',
    houseNumber: '3',
    organization: 'Bundeshaus',
  };

  for (const targetLanguage of ['fr', 'it', 'rm']) {
    const translated = await translateRegistrationFormFields({
      formData: source,
      targetLanguage,
      countryCode: 'CH',
      sourceLanguage: 'de',
      translator: async ({ text, target, source }) => `${source}->${target}:${text}`,
    });

    assert.equal(translated.country, 'CH');
    assert.equal(translated.postcode, '3003');
    assert.equal(translated.phone, '+41 31 322 11 11');
    assert.equal(translated.houseNumber, '3');
    assert.equal(translated.street, `en->${targetLanguage}:Bundesgasse`);
    assert.equal(translated.city, `en->${targetLanguage}:Bern`);
    assert.equal(translated.organization, `en->${targetLanguage}:Bundeshaus`);
  }
});
