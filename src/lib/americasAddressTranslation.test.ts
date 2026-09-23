import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseAmericasAddressTranslationRoute,
getAmericasAddressTranslationProfile,
translateAmericasAddressField,
} from './americasAddressTranslation';

test('classifies Americas address markets by delivery-language algorithm and topology', () => {
  assert.deepEqual(getAmericasAddressTranslationProfile('MX'), {
    countryCode: 'MX',
    nativeLanguages: ['es'],
    defaultLanguage: 'es',
    defaultTopology: 'latin-spanish',
    englishAlgorithm: 'americas-spanish-international-shipping',
  });
  assert.equal(getAmericasAddressTranslationProfile('BR')?.defaultTopology, 'latin-portuguese');
  assert.equal(getAmericasAddressTranslationProfile('HT')?.nativeLanguages.join(','), 'fr,ht');
  assert.equal(getAmericasAddressTranslationProfile('BQ')?.nativeLanguages.join(','), 'nl,pap,en');
  assert.equal(getAmericasAddressTranslationProfile('BO')?.nativeLanguages.join(','), 'es,qu,ay');
});

test('allows Americas native-to-English and domestic multilingual routes only', () => {
  assert.equal(
    chooseAmericasAddressTranslationRoute({
      countryCode: 'MX',
      sourceLanguage: 'es-MX',
      targetLanguage: 'en',
    })?.algorithm,
    'americas-spanish-international-shipping'
  );
  assert.equal(
    chooseAmericasAddressTranslationRoute({
      countryCode: 'PY',
      sourceLanguage: 'es',
      targetLanguage: 'gn',
    })?.mode,
    'english-pivot'
  );
  assert.equal(
    chooseAmericasAddressTranslationRoute({
      countryCode: 'HT',
      sourceLanguage: 'fr',
      targetLanguage: 'ht',
    })?.mode,
    'english-pivot'
  );
  assert.equal(
    chooseAmericasAddressTranslationRoute({
      countryCode: 'MX',
      sourceLanguage: 'es',
      targetLanguage: 'de',
    }),
    null
  );
});

test('translates representative Americas native address fields to English', async () => {
  assert.equal((await translateAmericasAddressField({
    countryCode: 'MX',
    fieldKey: 'city',
    text: 'Ciudad de México',
    sourceLanguage: 'es-MX',
    targetLanguage: 'en',
  }))?.text, 'Ciudad de México');
  assert.equal((await translateAmericasAddressField({
    countryCode: 'BR',
    fieldKey: 'street',
    text: 'Rua Augusta',
    sourceLanguage: 'pt-BR',
    targetLanguage: 'en',
  }))?.text, 'Street Augusta');
  assert.equal((await translateAmericasAddressField({
    countryCode: 'HT',
    fieldKey: 'country',
    text: 'Haïti',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Haiti');
  assert.equal((await translateAmericasAddressField({
    countryCode: 'CA',
    fieldKey: 'city',
    text: 'Montréal',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Montréal');
  assert.equal((await translateAmericasAddressField({
    countryCode: 'AW',
    fieldKey: 'street',
    text: 'Kaya Grandi',
    sourceLanguage: 'pap',
    targetLanguage: 'en',
  }))?.text, 'Street Grandi');
  assert.equal((await translateAmericasAddressField({
    countryCode: 'PY',
    fieldKey: 'city',
    text: 'Asunción',
    sourceLanguage: 'es',
    targetLanguage: 'en',
  }))?.text, 'Asunción');
});

test('uses English pivot for Americas multilingual native address tabs', async () => {
  const calls: string[] = [];
  const translated = await translateAmericasAddressField({
    countryCode: 'BO',
    fieldKey: 'city',
    text: 'La Paz',
    sourceLanguage: 'es',
    targetLanguage: 'qu',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(translated?.text, 'qu:La Paz');
  assert.deepEqual(calls, ['en->qu:La Paz']);
});
