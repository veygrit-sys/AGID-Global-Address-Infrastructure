import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseWestAfricaAddressTranslationRoute,
getWestAfricaAddressTranslationProfile,
translateWestAfricaAddressField,
} from './westAfricaAddressTranslation';

test('classifies West Africa address markets by delivery-language algorithm and topology', () => {
  assert.deepEqual(getWestAfricaAddressTranslationProfile('CI'), {
    countryCode: 'CI',
    nativeLanguages: ['fr'],
    defaultLanguage: 'fr',
    defaultTopology: 'latin-french',
    englishAlgorithm: 'west-africa-francophone-international-shipping',
  });
  assert.equal(getWestAfricaAddressTranslationProfile('GW')?.englishAlgorithm, 'lusophone-west-africa-international-shipping');
  assert.equal(getWestAfricaAddressTranslationProfile('CM')?.defaultLanguage, 'fr');
  assert.equal(getWestAfricaAddressTranslationProfile('NG')?.defaultTopology, 'english-address');
});

test('allows West Africa native-to-English and domestic bilingual routes only', () => {
  assert.equal(
    chooseWestAfricaAddressTranslationRoute({
      countryCode: 'CI',
      sourceLanguage: 'fr',
      targetLanguage: 'en',
    })?.mode,
    'english'
  );
  assert.equal(
    chooseWestAfricaAddressTranslationRoute({
      countryCode: 'GW',
      sourceLanguage: 'pt',
      targetLanguage: 'en',
    })?.algorithm,
    'lusophone-west-africa-international-shipping'
  );
  assert.equal(
    chooseWestAfricaAddressTranslationRoute({
      countryCode: 'CM',
      sourceLanguage: 'en',
      targetLanguage: 'fr',
    })?.mode,
    'english-pivot'
  );
  assert.equal(
    chooseWestAfricaAddressTranslationRoute({
      countryCode: 'SN',
      sourceLanguage: 'fr',
      targetLanguage: 'de',
    }),
    null
  );
});

test('translates representative West Africa native address fields to English', async () => {
  assert.equal((await translateWestAfricaAddressField({
    countryCode: 'CI',
    fieldKey: 'country',
    text: 'Côte d’Ivoire',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Côte d’Ivoire');
  assert.equal((await translateWestAfricaAddressField({
    countryCode: 'SN',
    fieldKey: 'street',
    text: 'Rue',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Rue');
  assert.equal((await translateWestAfricaAddressField({
    countryCode: 'BJ',
    fieldKey: 'city',
    text: 'Porto-Novo',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Porto-Novo');
  assert.equal((await translateWestAfricaAddressField({
    countryCode: 'GW',
    fieldKey: 'street',
    text: 'Rua',
    sourceLanguage: 'pt',
    targetLanguage: 'en',
  }))?.text, 'Street');
  assert.equal((await translateWestAfricaAddressField({
    countryCode: 'CV',
    fieldKey: 'country',
    text: 'Cabo Verde',
    sourceLanguage: 'pt',
    targetLanguage: 'en',
  }))?.text, 'Cape Verde');
});

test('uses English pivot for Cameroon French and English address tabs', async () => {
  const calls: string[] = [];
  const translated = await translateWestAfricaAddressField({
    countryCode: 'CM',
    fieldKey: 'city',
    text: 'Douala',
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(translated?.text, 'fr:Douala');
  assert.deepEqual(calls, ['en->fr:Douala']);
});
