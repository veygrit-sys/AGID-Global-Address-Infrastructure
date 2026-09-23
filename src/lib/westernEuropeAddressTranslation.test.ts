import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseWesternEuropeAddressTranslationRoute,
getWesternEuropeAddressTranslationProfile,
translateWesternEuropeAddressField,
} from './westernEuropeAddressTranslation';

test('classifies Western Europe address markets by domestic language algorithm and topology', () => {
  assert.equal(getWesternEuropeAddressTranslationProfile('FR')?.englishAlgorithm, 'french-laposte-international-shipping');
  assert.equal(getWesternEuropeAddressTranslationProfile('DE')?.englishAlgorithm, 'german-dach-international-shipping');
  assert.equal(getWesternEuropeAddressTranslationProfile('NL')?.englishAlgorithm, 'dutch-postnl-international-shipping');
  assert.equal(getWesternEuropeAddressTranslationProfile('BE')?.englishAlgorithm, 'belgium-trilingual-address');
  assert.equal(getWesternEuropeAddressTranslationProfile('CH')?.englishAlgorithm, 'swiss-quadrilingual-address');
  assert.equal(getWesternEuropeAddressTranslationProfile('LU')?.englishAlgorithm, 'luxembourg-trilingual-address');
  assert.equal(getWesternEuropeAddressTranslationProfile('AT')?.englishAlgorithm, 'austrian-german-address');
  assert.equal(getWesternEuropeAddressTranslationProfile('LI')?.englishAlgorithm, 'liechtenstein-german-address');
  assert.equal(getWesternEuropeAddressTranslationProfile('GB')?.englishAlgorithm, 'uk-english-celtic-address');
  assert.equal(getWesternEuropeAddressTranslationProfile('IE')?.englishAlgorithm, 'ireland-english-irish-address');
  assert.equal(getWesternEuropeAddressTranslationProfile('GP')?.englishAlgorithm, 'french-overseas-address');
});

test('allows only Western Europe domestic language pairs and native-to-English routes', () => {
  assert.deepEqual(
    chooseWesternEuropeAddressTranslationRoute({
      countryCode: 'CH',
      sourceLanguage: 'de',
      targetLanguage: 'en',
    }),
    {
      mode: 'english',
      sourceTopology: 'latin-germanic',
      targetTopology: 'latin-address',
      pivotLanguage: 'en',
      algorithm: 'swiss-quadrilingual-address',
    },
  );

  assert.equal(
    chooseWesternEuropeAddressTranslationRoute({
      countryCode: 'BE',
      sourceLanguage: 'nl',
      targetLanguage: 'fr',
    })?.mode,
    'english-pivot',
  );

  assert.equal(
    chooseWesternEuropeAddressTranslationRoute({
      countryCode: 'FR',
      sourceLanguage: 'fr',
      targetLanguage: 'de',
    }),
    null,
  );
});

test('translates representative Western Europe native address fields to English', async () => {
  const cases = [
    ['FR', 'fr', 'street', 'Rue', 'Rue', 'french-laposte-international-shipping'],
    ['FR', 'fr', 'city', 'Paris', 'Paris', 'french-laposte-international-shipping'],
    ['DE', 'de', 'street', 'Straße', 'Straße', 'german-dach-international-shipping'],
    ['DE', 'de', 'city', 'München', 'München', 'german-dach-international-shipping'],
    ['NL', 'nl', 'street', 'Straat', 'Street', 'dutch-postnl-international-shipping'],
    ['BE', 'nl', 'city', 'Brussel', 'Brussels', 'belgium-trilingual-address'],
    ['BE', 'fr', 'city', 'Bruxelles', 'Bruxelles', 'belgium-trilingual-address'],
    ['CH', 'de', 'city', 'Zürich', 'Zürich', 'swiss-quadrilingual-address'],
    ['CH', 'fr', 'city', 'Genève', 'Genève', 'swiss-quadrilingual-address'],
    ['LU', 'lb', 'city', 'Lëtzebuerg', 'Luxembourg', 'luxembourg-trilingual-address'],
    ['AT', 'de', 'city', 'Wien', 'Wien', 'austrian-german-address'],
    ['LI', 'de', 'city', 'Vaduz', 'Vaduz', 'liechtenstein-german-address'],
    ['GB', 'cy', 'city', 'Caerdydd', 'Cardiff', 'uk-english-celtic-address'],
    ['IE', 'ga', 'city', 'Baile Átha Cliath', 'Dublin', 'ireland-english-irish-address'],
    ['GP', 'fr', 'state', 'Guadeloupe', 'Guadeloupe', 'french-overseas-address'],
  ] as const;

  for (const [countryCode, sourceLanguage, fieldKey, text, expected, algorithm] of cases) {
    const translated = await translateWesternEuropeAddressField({
      countryCode,
      fieldKey,
      text,
      sourceLanguage,
      targetLanguage: 'en',
    });
    assert.equal(translated?.text, expected);
    assert.equal(translated?.route.algorithm, algorithm);
  }
});

test('uses English pivot for Western Europe multilingual native address tabs when topology differs', async () => {
  const calls: string[] = [];
  const french = await translateWesternEuropeAddressField({
    countryCode: 'CH',
    fieldKey: 'city',
    text: 'Zürich',
    sourceLanguage: 'de',
    targetLanguage: 'fr',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return 'Zurich FR';
    },
  });

  assert.equal(french?.text, 'Zurich FR');
  assert.equal(french?.route.mode, 'english-pivot');
  assert.deepEqual(calls, ['en->fr:Zürich']);
});
