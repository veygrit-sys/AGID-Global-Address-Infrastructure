import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseCentralAfricaAddressTranslationRoute,
getCentralAfricaAddressTranslationProfile,
translateCentralAfricaAddressField,
} from './centralAfricaAddressTranslation';

test('classifies Central Africa address markets by delivery-language algorithm and topology', () => {
  assert.deepEqual(getCentralAfricaAddressTranslationProfile('CF'), {
    countryCode: 'CF',
    nativeLanguages: ['fr', 'sg'],
    defaultLanguage: 'fr',
    defaultTopology: 'latin-french',
    englishAlgorithm: 'central-africa-french-sango-bilingual-address',
  });
  assert.equal(getCentralAfricaAddressTranslationProfile('TD')?.englishAlgorithm, 'chad-french-arabic-bilingual-address');
  assert.equal(getCentralAfricaAddressTranslationProfile('GQ')?.nativeLanguages.join(','), 'es,fr,pt');
  assert.equal(getCentralAfricaAddressTranslationProfile('AO')?.defaultTopology, 'latin-portuguese');
});

test('allows Central Africa native-to-English and domestic multilingual routes only', () => {
  assert.equal(
    chooseCentralAfricaAddressTranslationRoute({
      countryCode: 'TD',
      sourceLanguage: 'fr',
      targetLanguage: 'ar',
    })?.mode,
    'english-pivot'
  );
  assert.equal(
    chooseCentralAfricaAddressTranslationRoute({
      countryCode: 'GQ',
      sourceLanguage: 'es',
      targetLanguage: 'pt',
    })?.mode,
    'direct-native'
  );
  assert.equal(
    chooseCentralAfricaAddressTranslationRoute({
      countryCode: 'AO',
      sourceLanguage: 'pt',
      targetLanguage: 'en',
    })?.algorithm,
    'central-africa-lusophone-international-shipping'
  );
  assert.equal(
    chooseCentralAfricaAddressTranslationRoute({
      countryCode: 'GA',
      sourceLanguage: 'fr',
      targetLanguage: 'de',
    }),
    null
  );
});

test('translates representative Central Africa native address fields to English', async () => {
  assert.equal((await translateCentralAfricaAddressField({
    countryCode: 'CF',
    fieldKey: 'country',
    text: 'République centrafricaine',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Central African Republic');
  assert.equal((await translateCentralAfricaAddressField({
    countryCode: 'TD',
    fieldKey: 'city',
    text: 'N’Djamena',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'N’Djamena');
  assert.equal((await translateCentralAfricaAddressField({
    countryCode: 'CG',
    fieldKey: 'street',
    text: 'Avenue',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Avenue');
  assert.equal((await translateCentralAfricaAddressField({
    countryCode: 'GQ',
    fieldKey: 'city',
    text: 'Malabo',
    sourceLanguage: 'es',
    targetLanguage: 'en',
  }))?.text, 'Malabo');
  assert.equal((await translateCentralAfricaAddressField({
    countryCode: 'ST',
    fieldKey: 'country',
    text: 'São Tomé e Príncipe',
    sourceLanguage: 'pt',
    targetLanguage: 'en',
  }))?.text, 'Sao Tome and Principe');
});

test('uses English pivot for Chad French and Arabic address tabs', async () => {
  const calls: string[] = [];
  const translated = await translateCentralAfricaAddressField({
    countryCode: 'TD',
    fieldKey: 'city',
    text: 'N’Djamena',
    sourceLanguage: 'fr',
    targetLanguage: 'ar',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(translated?.text, 'ar:N’Djamena');
  assert.deepEqual(calls, ['en->ar:N’Djamena']);
});
