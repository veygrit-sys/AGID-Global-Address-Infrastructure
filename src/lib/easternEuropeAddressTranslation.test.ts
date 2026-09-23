import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseEasternEuropeAddressTranslationRoute,
getEasternEuropeAddressTranslationProfile,
translateEasternEuropeAddressField,
} from './easternEuropeAddressTranslation';

test('classifies Eastern Europe and Caucasus address markets by algorithm and topology', () => {
  assert.equal(getEasternEuropeAddressTranslationProfile('RO')?.englishAlgorithm, 'romanian-posta-romana-international-shipping');
  assert.equal(getEasternEuropeAddressTranslationProfile('BG')?.englishAlgorithm, 'bulgarian-balgarski-poshti-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('UA')?.englishAlgorithm, 'ukrainian-ukrposhta-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('MD')?.englishAlgorithm, 'moldova-romanian-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('BY')?.englishAlgorithm, 'belarus-belpost-bilingual-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('RU')?.englishAlgorithm, 'russian-pochta-rossii-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('RS')?.englishAlgorithm, 'serbian-posta-srbije-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('BA')?.englishAlgorithm, 'bosnia-trilingual-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('ME')?.englishAlgorithm, 'montenegro-posta-crne-gore-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('XK')?.englishAlgorithm, 'kosovo-albanian-serbian-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('AL')?.englishAlgorithm, 'albanian-posta-shqiptare-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('MK')?.englishAlgorithm, 'north-macedonia-makedonska-posta-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('AM')?.englishAlgorithm, 'armenian-haypost-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('AZ')?.englishAlgorithm, 'azerbaijan-azpost-address');
  assert.equal(getEasternEuropeAddressTranslationProfile('GE')?.englishAlgorithm, 'georgian-gpost-address');
});

test('allows Eastern Europe native-to-English and domestic multilingual routes only', () => {
  assert.deepEqual(
    chooseEasternEuropeAddressTranslationRoute({
      countryCode: 'RU',
      sourceLanguage: 'ru',
      targetLanguage: 'en',
    }),
    {
      mode: 'english',
      sourceTopology: 'cyrillic-slavic',
      targetTopology: 'latin-address',
      pivotLanguage: 'en',
      algorithm: 'russian-pochta-rossii-address',
    },
  );

  assert.deepEqual(
    chooseEasternEuropeAddressTranslationRoute({
      countryCode: 'BA',
      sourceLanguage: 'bs',
      targetLanguage: 'sr',
    }),
    {
      mode: 'english-pivot',
      sourceTopology: 'latin-south-slavic',
      targetTopology: 'cyrillic-slavic',
      pivotLanguage: 'en',
      algorithm: 'bosnia-trilingual-address',
    },
  );

  assert.equal(
    chooseEasternEuropeAddressTranslationRoute({
      countryCode: 'RO',
      sourceLanguage: 'ro',
      targetLanguage: 'fr',
    }),
    null,
  );
});

test('translates representative Eastern Europe and Caucasus native address fields to English', async () => {
  const cases = [
    ['RO', 'ro', 'state', 'România', 'Romania', 'romanian-posta-romana-international-shipping'],
    ['RO', 'ro', 'city', 'București', 'Bucharest', 'romanian-posta-romana-international-shipping'],
    ['BG', 'bg', 'state', 'България', 'Bulgaria', 'bulgarian-balgarski-poshti-address'],
    ['BG', 'bg', 'street', 'Улица', 'Street', 'bulgarian-balgarski-poshti-address'],
    ['UA', 'uk', 'state', 'Україна', 'Ukraine', 'ukrainian-ukrposhta-address'],
    ['UA', 'uk', 'city', 'Київ', 'Kyiv', 'ukrainian-ukrposhta-address'],
    ['MD', 'ro', 'city', 'Chișinău', 'Chisinau', 'moldova-romanian-address'],
    ['BY', 'be', 'state', 'Беларусь', 'Belarus', 'belarus-belpost-bilingual-address'],
    ['RU', 'ru', 'city', 'Москва', 'Moskva', 'russian-pochta-rossii-address'],
    ['RU', 'ru', 'street', 'Улица', 'Ulitsa', 'russian-pochta-rossii-address'],
    ['RS', 'sr', 'state', 'Србија', 'Serbia', 'serbian-posta-srbije-address'],
    ['BA', 'bs', 'state', 'Bosna i Hercegovina', 'Bosnia and Herzegovina', 'bosnia-trilingual-address'],
    ['ME', 'cnr', 'state', 'Crna Gora', 'Montenegro', 'montenegro-posta-crne-gore-address'],
    ['XK', 'sq', 'state', 'Kosova', 'Kosovo', 'kosovo-albanian-serbian-address'],
    ['AL', 'sq', 'street', 'Rruga', 'Street', 'albanian-posta-shqiptare-address'],
    ['MK', 'mk', 'state', 'Северна Македонија', 'North Macedonia', 'north-macedonia-makedonska-posta-address'],
    ['AM', 'hy', 'state', 'Հայաստան', 'Armenia', 'armenian-haypost-address'],
    ['AZ', 'az', 'street', 'Küçə', 'Street', 'azerbaijan-azpost-address'],
    ['GE', 'ka', 'city', 'თბილისი', 'Tbilisi', 'georgian-gpost-address'],
  ] as const;

  for (const [countryCode, sourceLanguage, fieldKey, text, expected, algorithm] of cases) {
    const translated = await translateEasternEuropeAddressField({
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
