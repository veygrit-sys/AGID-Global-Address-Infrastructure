import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseEastAsiaAddressTranslationRoute,
getEastAsiaAddressTranslationProfile,
translateEastAsiaAddressField,
} from './eastAsiaAddressTranslation';

test('classifies East Asian countries by address translation algorithm and topology', () => {
  assert.equal(getEastAsiaAddressTranslationProfile('JP')?.englishAlgorithm, 'hepburn');
  assert.equal(getEastAsiaAddressTranslationProfile('CN')?.englishAlgorithm, 'hanyu-pinyin');
  assert.equal(getEastAsiaAddressTranslationProfile('TW')?.englishAlgorithm, 'taiwan-customary');
  assert.equal(getEastAsiaAddressTranslationProfile('HK')?.englishAlgorithm, 'hong-kong-cantonese');
  assert.equal(getEastAsiaAddressTranslationProfile('MO')?.englishAlgorithm, 'macao-portuguese-cantonese');
  assert.equal(getEastAsiaAddressTranslationProfile('KR')?.englishAlgorithm, 'revised-romanization');
  assert.equal(getEastAsiaAddressTranslationProfile('MN')?.englishAlgorithm, 'mongolian-latin');
});

test('allows only native language pairs and native-to-English routes for East Asia', () => {
  assert.deepEqual(
    chooseEastAsiaAddressTranslationRoute({
      countryCode: 'JP',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
    }),
    {
      mode: 'english',
      sourceTopology: 'cjk-kana-kanji',
      targetTopology: 'latin-address',
      pivotLanguage: 'en',
      algorithm: 'hepburn',
    },
  );

  assert.equal(
    chooseEastAsiaAddressTranslationRoute({
      countryCode: 'JP',
      sourceLanguage: 'ja',
      targetLanguage: 'ko',
    })?.mode,
    'english-pivot',
  );

  assert.equal(
    chooseEastAsiaAddressTranslationRoute({
      countryCode: 'CN',
      sourceLanguage: 'zh-Hans',
      targetLanguage: 'zh-Hant',
    })?.mode,
    'script-conversion',
  );

  assert.equal(
    chooseEastAsiaAddressTranslationRoute({
      countryCode: 'JP',
      sourceLanguage: 'ja',
      targetLanguage: 'fr',
    }),
    null,
  );
});

test('translates East Asian address fields with country-specific English algorithms', async () => {
  const japanese = await translateEastAsiaAddressField({
    countryCode: 'JP',
    fieldKey: 'state',
    text: '東京都',
    sourceLanguage: 'ja',
    targetLanguage: 'en',
  });

  assert.equal(japanese?.text, 'Tokyo');
  assert.equal(japanese?.route.algorithm, 'hepburn');

  const korean = await translateEastAsiaAddressField({
    countryCode: 'KR',
    fieldKey: 'street',
    text: '세종대로',
    sourceLanguage: 'ko',
    targetLanguage: 'en',
  });

  assert.equal(korean?.text, 'Sejong-daero');
  assert.equal(korean?.route.algorithm, 'revised-romanization');

  const mongolian = await translateEastAsiaAddressField({
    countryCode: 'MN',
    fieldKey: 'state',
    text: 'Улаанбаатар хот Сүхбаатар дүүрэг',
    sourceLanguage: 'mn',
    targetLanguage: 'en',
  });

  assert.equal(mongolian?.text, 'Ulaanbaatar Sukhbaatar District');
  assert.equal(mongolian?.route.algorithm, 'mongolian-latin');
});

test('uses local East Asian alias policy before generic Chinese pinyin', async () => {
  const taiwan = await translateEastAsiaAddressField({
    countryCode: 'TW',
    fieldKey: 'city',
    text: '高雄市',
    sourceLanguage: 'zh-Hant',
    targetLanguage: 'en',
  });
  assert.equal(taiwan?.text, 'Kaohsiung City');

  const hongKong = await translateEastAsiaAddressField({
    countryCode: 'HK',
    fieldKey: 'district',
    text: '尖沙咀',
    sourceLanguage: 'zh-Hant',
    targetLanguage: 'en',
  });
  assert.equal(hongKong?.text, 'Tsim Sha Tsui');

  const macao = await translateEastAsiaAddressField({
    countryCode: 'MO',
    fieldKey: 'island',
    text: '氹仔',
    sourceLanguage: 'zh-Hant',
    targetLanguage: 'en',
  });
  assert.equal(macao?.text, 'Taipa');
});

test('distinguishes Cantonese place readings from Mainland Hanyu Pinyin', async () => {
  const hongKong = await translateEastAsiaAddressField({
    countryCode: 'HK',
    fieldKey: 'district',
    text: '沙田',
    sourceLanguage: 'zh-Hant',
    targetLanguage: 'en',
  });
  const mainland = await translateEastAsiaAddressField({
    countryCode: 'CN',
    fieldKey: 'district',
    text: '沙田',
    sourceLanguage: 'zh-Hans',
    targetLanguage: 'en',
  });
  const unknownHongKong = await translateEastAsiaAddressField({
    countryCode: 'HK',
    fieldKey: 'district',
    text: '合成區',
    sourceLanguage: 'zh-Hant',
    targetLanguage: 'en',
  });

  assert.equal(hongKong?.text, 'Sha Tin');
  assert.equal(mainland?.text, 'Shatian');
  assert.equal(unknownHongKong, null);
});

test('converts Chinese script variants without machine translation', async () => {
  const traditional = await translateEastAsiaAddressField({
    countryCode: 'CN',
    fieldKey: 'city',
    text: '广州市',
    sourceLanguage: 'zh-Hans',
    targetLanguage: 'zh-Hant',
    translator: async () => {
      throw new Error('Chinese script conversion should not call machine translation');
    },
  });

  assert.equal(traditional?.text, '廣州市');
  assert.equal(traditional?.route.mode, 'script-conversion');
});

test('uses English pivot only for East Asian native-language pairs with different topology', async () => {
  const calls: string[] = [];
  const translated = await translateEastAsiaAddressField({
    countryCode: 'JP',
    fieldKey: 'state',
    text: '東京都',
    sourceLanguage: 'ja',
    targetLanguage: 'ko',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return '도쿄도';
    },
  });

  assert.equal(translated?.text, '도쿄도');
  assert.deepEqual(calls, ['en->ko:Tokyo']);
  assert.equal(translated?.route.mode, 'english-pivot');
});
