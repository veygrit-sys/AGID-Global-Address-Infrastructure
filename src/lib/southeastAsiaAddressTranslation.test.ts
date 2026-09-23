import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseSoutheastAsiaAddressTranslationRoute,
getSoutheastAsiaAddressTranslationProfile,
translateSoutheastAsiaAddressField,
} from './southeastAsiaAddressTranslation';

test('classifies Southeast Asian countries by domestic address language algorithm and topology', () => {
  assert.equal(getSoutheastAsiaAddressTranslationProfile('MM')?.englishAlgorithm, 'burmese-mlcts-shipping');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('TH')?.englishAlgorithm, 'thai-rtgs');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('VN')?.englishAlgorithm, 'vietnamese-quoc-ngu');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('KH')?.englishAlgorithm, 'khmer-ungegn');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('LA')?.englishAlgorithm, 'lao-bgn-pcgn');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('MY')?.englishAlgorithm, 'malay-standard');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('SG')?.englishAlgorithm, 'singapore-multilingual');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('ID')?.englishAlgorithm, 'indonesian-standard');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('PH')?.englishAlgorithm, 'filipino-standard');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('BN')?.englishAlgorithm, 'brunei-malay');
  assert.equal(getSoutheastAsiaAddressTranslationProfile('TL')?.englishAlgorithm, 'tetum-portuguese');
});

test('allows only domestic native-language pairs and native-to-English routes for Southeast Asia', () => {
  assert.deepEqual(
    chooseSoutheastAsiaAddressTranslationRoute({
      countryCode: 'TH',
      sourceLanguage: 'th',
      targetLanguage: 'en',
    }),
    {
      mode: 'english',
      sourceTopology: 'thai-lao-abugida',
      targetTopology: 'latin-address',
      pivotLanguage: 'en',
      algorithm: 'thai-rtgs',
    },
  );

  assert.equal(
    chooseSoutheastAsiaAddressTranslationRoute({
      countryCode: 'SG',
      sourceLanguage: 'ms',
      targetLanguage: 'zh-Hans',
    })?.mode,
    'english-pivot',
  );

  assert.equal(
    chooseSoutheastAsiaAddressTranslationRoute({
      countryCode: 'TL',
      sourceLanguage: 'tet',
      targetLanguage: 'pt',
    })?.mode,
    'direct-native',
  );

  assert.equal(
    chooseSoutheastAsiaAddressTranslationRoute({
      countryCode: 'ID',
      sourceLanguage: 'id',
      targetLanguage: 'fr',
    }),
    null,
  );
});

test('translates representative Southeast Asian native address fields to English', async () => {
  const cases = [
    ['MM', 'my', 'city', 'ရန်ကုန်', 'Yangon', 'burmese-mlcts-shipping'],
    ['TH', 'th', 'city', 'กรุงเทพมหานคร', 'Bangkok', 'thai-rtgs'],
    ['VN', 'vi', 'city', 'Thành phố Hồ Chí Minh', 'Ho Chi Minh City', 'vietnamese-quoc-ngu'],
    ['KH', 'km', 'city', 'ភ្នំពេញ', 'Phnom Penh', 'khmer-ungegn'],
    ['LA', 'lo', 'city', 'ວຽງຈັນ', 'Vientiane', 'lao-bgn-pcgn'],
  ] as const;

  for (const [countryCode, sourceLanguage, fieldKey, text, expected, algorithm] of cases) {
    const translated = await translateSoutheastAsiaAddressField({
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

test('normalizes Latin-script Southeast Asian address words for English shipping display', async () => {
  const vietnam = await translateSoutheastAsiaAddressField({
    countryCode: 'VN',
    fieldKey: 'street',
    text: 'Đường Nguyễn Huệ',
    sourceLanguage: 'vi',
    targetLanguage: 'en',
  });
  assert.equal(vietnam?.text, 'Street Nguyen Hue');

  const indonesia = await translateSoutheastAsiaAddressField({
    countryCode: 'ID',
    fieldKey: 'street',
    text: 'Jalan Sudirman',
    sourceLanguage: 'id',
    targetLanguage: 'en',
  });
  assert.equal(indonesia?.text, 'Street Sudirman');
});

test('uses English pivot for Singapore domestic languages with different topology', async () => {
  const calls: string[] = [];
  const translated = await translateSoutheastAsiaAddressField({
    countryCode: 'SG',
    fieldKey: 'country',
    text: 'Singapura',
    sourceLanguage: 'ms',
    targetLanguage: 'zh-Hans',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return '新加坡';
    },
  });

  assert.equal(translated?.text, '新加坡');
  assert.equal(translated?.route.mode, 'english-pivot');
  assert.deepEqual(calls, ['en->zh-Hans:Singapore']);
});

test('uses established Singapore English place names instead of Mandarin Pinyin', async () => {
  const chinatown = await translateSoutheastAsiaAddressField({
    countryCode: 'SG',
    fieldKey: 'district',
    text: '牛車水',
    sourceLanguage: 'zh-Hans',
    targetLanguage: 'en',
  });
  const bukitTimah = await translateSoutheastAsiaAddressField({
    countryCode: 'SG',
    fieldKey: 'district',
    text: '武吉知馬',
    sourceLanguage: 'zh-Hans',
    targetLanguage: 'en',
  });
  const unknown = await translateSoutheastAsiaAddressField({
    countryCode: 'SG',
    fieldKey: 'district',
    text: '合成區',
    sourceLanguage: 'zh-Hans',
    targetLanguage: 'en',
  });

  assert.equal(chinatown?.text, 'Chinatown');
  assert.equal(bukitTimah?.text, 'Bukit Timah');
  assert.equal(unknown, null);
});

test('uses direct native translation for same-topology Timor-Leste address languages', async () => {
  const calls: string[] = [];
  const translated = await translateSoutheastAsiaAddressField({
    countryCode: 'TL',
    fieldKey: 'city',
    text: 'Dili',
    sourceLanguage: 'tet',
    targetLanguage: 'pt',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return 'Dili';
    },
  });

  assert.equal(translated?.text, 'Dili');
  assert.equal(translated?.route.mode, 'direct-native');
  assert.deepEqual(calls, ['tet->pt:Dili']);
});
