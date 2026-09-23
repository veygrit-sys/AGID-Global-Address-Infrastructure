import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseEastAfricaAddressTranslationRoute,
getEastAfricaAddressTranslationProfile,
translateEastAfricaAddressField,
} from './eastAfricaAddressTranslation';

test('classifies East Africa address markets by domestic language algorithm and topology', () => {
  assert.deepEqual(getEastAfricaAddressTranslationProfile('ET'), {
    countryCode: 'ET',
    nativeLanguages: ['am', 'en'],
    defaultLanguage: 'am',
    defaultTopology: 'ethiopic-abugida',
    englishAlgorithm: 'ethiopia-amharic-english-address',
  });
  assert.equal(getEastAfricaAddressTranslationProfile('KE')?.nativeLanguages.join(','), 'en,sw');
  assert.equal(getEastAfricaAddressTranslationProfile('KM')?.nativeLanguages.join(','), 'fr,ar');
  assert.equal(getEastAfricaAddressTranslationProfile('DJ')?.nativeLanguages.join(','), 'fr,ar');
  assert.equal(getEastAfricaAddressTranslationProfile('SO')?.nativeLanguages.join(','), 'so,ar,en');
  assert.equal(getEastAfricaAddressTranslationProfile('RW')?.nativeLanguages.join(','), 'en,fr,sw');
  assert.equal(getEastAfricaAddressTranslationProfile('SC')?.nativeLanguages.join(','), 'en,fr,crs');
});

test('allows East Africa native-to-English and domestic multilingual routes only', () => {
  assert.equal(
    chooseEastAfricaAddressTranslationRoute({
      countryCode: 'TZ',
      sourceLanguage: 'sw',
      targetLanguage: 'en',
    })?.algorithm,
    'east-africa-swahili-english-address'
  );
  assert.equal(
    chooseEastAfricaAddressTranslationRoute({
      countryCode: 'RW',
      sourceLanguage: 'fr',
      targetLanguage: 'sw',
    })?.mode,
    'english-pivot'
  );
  assert.equal(
    chooseEastAfricaAddressTranslationRoute({
      countryCode: 'SO',
      sourceLanguage: 'so',
      targetLanguage: 'ar',
    })?.mode,
    'english-pivot'
  );
  assert.equal(
    chooseEastAfricaAddressTranslationRoute({
      countryCode: 'MZ',
      sourceLanguage: 'pt',
      targetLanguage: 'de',
    }),
    null
  );
});

test('translates representative East Africa native address fields to English', async () => {
  assert.equal((await translateEastAfricaAddressField({
    countryCode: 'ET',
    fieldKey: 'city',
    text: 'አዲስ አበባ',
    sourceLanguage: 'am',
    targetLanguage: 'en',
  }))?.text, 'Addis Ababa');
  assert.equal((await translateEastAfricaAddressField({
    countryCode: 'KE',
    fieldKey: 'street',
    text: 'Barabara',
    sourceLanguage: 'sw',
    targetLanguage: 'en',
  }))?.text, 'Street');
  assert.equal((await translateEastAfricaAddressField({
    countryCode: 'KM',
    fieldKey: 'country',
    text: 'جزر القمر',
    sourceLanguage: 'ar',
    targetLanguage: 'en',
  }))?.text, 'Comoros');
  assert.equal((await translateEastAfricaAddressField({
    countryCode: 'MG',
    fieldKey: 'street',
    text: 'Rue des Baobabs',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Rue des Baobabs');
  assert.equal((await translateEastAfricaAddressField({
    countryCode: 'SO',
    fieldKey: 'city',
    text: 'Muqdisho',
    sourceLanguage: 'so',
    targetLanguage: 'en',
  }))?.text, 'Mogadishu');
  assert.equal((await translateEastAfricaAddressField({
    countryCode: 'MZ',
    fieldKey: 'country',
    text: 'Moçambique',
    sourceLanguage: 'pt',
    targetLanguage: 'en',
  }))?.text, 'Mozambique');
});

test('uses English pivot for East Africa native address tabs with different topology', async () => {
  const calls: string[] = [];
  const translated = await translateEastAfricaAddressField({
    countryCode: 'RW',
    fieldKey: 'street',
    text: 'Umuhanda',
    sourceLanguage: 'sw',
    targetLanguage: 'fr',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(translated?.text, 'fr:Street');
  assert.deepEqual(calls, ['en->fr:Street']);
});
