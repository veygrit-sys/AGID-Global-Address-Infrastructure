import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
ADDRESS_TRANSLATION_FEEDBACK_STORAGE_KEY,
appendAddressTranslationFeedbackSample,
appendRegistrationCorrectionSample,
buildAddressTranslationFeedbackSample,
buildAgidRegistrationAutofillCandidate,
buildPostcodeAutofillLanguageDrafts,
buildPostcodeRegistrationAssistanceCandidate,
buildRegistrationAssistanceComparison,
buildRegistrationCorrectionSample,
getPostcodeAutofillMode,
getPostcodeAutofillModeForCoverage,
isPostcodeReadyForAutofill,
listRegistrationCorrectionSamples,
lookupPostcodeAutofillCandidates,
lookupPostcodeAutofill,
mergePostcodeAutofill,
REGISTRATION_CORRECTION_STORAGE_KEY,
translateRegistrationFormFields,
} from './addressRegistrationAutomation';
import { buildRegistrationAddressLanguageTabs } from './addressRegistrationState';

test('complete postcode input can autofill local and address-language draft fields', async () => {
  const jpFormat = {
    countryCode: 'JP',
    native: { name: 'Japanese' },
    english: { name: 'International English' },
    addressRules: {
      languages: [{ code: 'ja', name: 'Japanese' }],
    },
    international: {
      fr: { name: 'French' },
    },
    postalCode: {
      regex: '^\\d{7}$',
      format: 'NNNNNNN',
    },
  };
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    calls.push(String(url));
    return Response.json({
      results: [{
        zipcode: '1000001',
        address1: '東京都',
        address2: '千代田区',
        address3: '千代田',
      }],
    });
  };
  const formData = {
    country: 'JP',
    recipient: '山田太郎',
    organization: '',
    street: '',
    city: '',
    state: '',
    postcode: '1000001',
    suburb: '',
    phone: '0312345678',
  };

  assert.equal(isPostcodeReadyForAutofill(jpFormat, formData.postcode), true);

  const patch = await lookupPostcodeAutofill('JP', formData.postcode, fetcher as typeof fetch);
  assert.deepEqual(calls, ['/api/jp-postcode?zipcode=1000001']);
  assert.deepEqual(patch, {
    postcode: '1000001',
    state: '東京都',
    city: '千代田区',
    suburb: '千代田',
  });

  const merged = mergePostcodeAutofill(formData, patch!);
  assert.equal(merged.state, '東京都');
  assert.equal(merged.city, '千代田区');
  assert.equal(merged.suburb, '千代田');
  assert.equal(merged.postcode, '1000001');

  const languageTabs = buildRegistrationAddressLanguageTabs(jpFormat, 'JP').map(tab => tab.code);
  assert.deepEqual(languageTabs, ['ja', 'en']);

  const drafts = await buildPostcodeAutofillLanguageDrafts({
    formData,
    patch: patch!,
    countryCode: 'JP',
    languageTabs,
    translator: async ({ text, target }) => `${target}:${text}`,
  });

  assert.equal(drafts.local.state, '東京都');
  assert.equal(drafts.ja.state, '東京都');
  assert.equal(drafts.en.state, 'Tokyo');
  assert.equal(drafts.en.city, 'Chiyoda-ku');
  assert.equal(drafts.en.suburb, 'Chiyoda');
  assert.equal(drafts.en.postcode, '1000001');
  assert.equal(drafts.fr, undefined);
});

test('AGID and postal-code assistance produce reviewable registration hints', async () => {
  const agidCandidate = buildAgidRegistrationAutofillCandidate({
    agid: 'JP01R1A0ZTR4',
    decoded: { lat: 35.6812, lon: 139.7671, prefix: 'JP' },
    supportedCountryCodes: ['JP', 'US'],
  });

  assert.ok(agidCandidate);
  assert.equal(agidCandidate.source, 'agid');
  assert.equal(agidCandidate.patch.country, 'JP');
  assert.equal(agidCandidate.requiresUserReview, true);
  assert.ok(agidCandidate.evidence.some(line => line.includes('AGID prefix')));

  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    calls.push(String(url));
    return Response.json({
      'post code': '90210',
      places: [{
        'place name': 'Beverly Hills',
        state: 'California',
      }],
    });
  };

  const patch = await lookupPostcodeAutofill('US', '90210', fetcher as typeof fetch);
  assert.deepEqual(calls, ['/api/zippopotam/US/90210']);
  assert.deepEqual(patch, {
    postcode: '90210',
    city: 'Beverly Hills',
    state: 'California',
  });

  const postalCandidate = buildPostcodeRegistrationAssistanceCandidate({
    countryCode: 'US',
    postcode: '90210',
    patch,
  });

  assert.ok(postalCandidate);
  assert.equal(postalCandidate.source, 'postcode');
  assert.equal(postalCandidate.patch.city, 'Beverly Hills');
  assert.ok(postalCandidate.confidence > 0.8);
});

test('postal-code lookup policy auto-fills reliable countries and exposes candidates for weak APIs', async () => {
  assert.equal(getPostcodeAutofillMode('JP'), 'auto');
  assert.equal(getPostcodeAutofillMode('GB'), 'auto');
  assert.equal(getPostcodeAutofillMode('MX'), 'candidates');
  assert.equal(getPostcodeAutofillModeForCoverage({ id: 'postal-reliable-api' }), 'auto');
  assert.equal(getPostcodeAutofillModeForCoverage({ id: 'postal-weak-api' }), 'candidates');
  assert.equal(getPostcodeAutofillModeForCoverage({ id: 'no-postal-strong-geo' }), 'manual');
  assert.equal(getPostcodeAutofillModeForCoverage({ id: 'no-postal-weak-geo' }), 'manual');

  const fetcher = async () => Response.json({
    'post code': '01000',
    places: [
      { 'place name': 'San Angel', state: 'Ciudad de México' },
      { 'place name': 'Álvaro Obregón', state: 'Ciudad de México' },
    ],
  });

  const candidates = await lookupPostcodeAutofillCandidates('MX', '01000', fetcher as typeof fetch);
  assert.equal(candidates.length, 2);
  assert.deepEqual(candidates[0], {
    postcode: '01000',
    city: 'San Angel',
    state: 'Ciudad de México',
  });
  assert.deepEqual(candidates[1], {
    postcode: '01000',
    city: 'Álvaro Obregón',
    state: 'Ciudad de México',
  });
});

test('registration correction samples store address corrections as local RL references without recipient or phone', () => {
  const before = {
    country: 'JP',
    recipient: '山田太郎',
    street: '丸の内',
    city: '千代田区',
    postcode: '1000001',
    phone: '0312345678',
  };
  const after = {
    country: 'JP',
    recipient: '山田花子',
    street: '丸の内1-1',
    city: '千代田区',
    postcode: '1000001',
    phone: '0399999999',
  };

  const sample = buildRegistrationCorrectionSample({
    before,
    after,
    assistanceSourceIds: ['postcode:JP:1000001'],
    agid: 'JP01R1A0ZTR4',
    addressLanguage: 'ja',
    now: new Date('2026-06-12T00:00:00.000Z'),
  });

  assert.ok(sample);
  assert.equal(sample.storageScope, 'closed-device-local-rl-reference');
  assert.deepEqual(sample.learningPolicy, {
    mode: 'closed',
    storage: 'device-local',
    externalTransmission: 'blocked',
    export: 'manual-only',
  });
  assert.equal(sample.agidTail, 'A0ZTR4');
  assert.deepEqual(sample.assistanceSourceIds, ['postcode:JP:1000001']);
  assert.deepEqual(sample.changedFields, [{
    field: 'street',
    before: '丸の内',
    after: '丸の内1-1',
  }]);
  assert.deepEqual(sample.excludedFields.sort(), ['phone', 'recipient']);

  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) || null,
    setItem: (key: string, value: string) => memory.set(key, value),
  };

  appendRegistrationCorrectionSample(sample, storage);
  const stored = JSON.parse(memory.get(REGISTRATION_CORRECTION_STORAGE_KEY) || '[]');
  assert.equal(stored.length, 1);
  assert.equal(stored[0].id, sample.id);

  const history = listRegistrationCorrectionSamples(storage);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, sample.id);
  assert.equal(history[0].changedFields[0].field, 'street');
});

test('registration assistance comparison ranks postal-code and AGID hints with local-only feedback consent', () => {
  const agidCandidate = buildAgidRegistrationAutofillCandidate({
    agid: 'JP01R1A0ZTR4',
    decoded: { lat: 35.6812, lon: 139.7671, prefix: 'JP' },
    supportedCountryCodes: ['JP'],
  });
  const postalCandidate = buildPostcodeRegistrationAssistanceCandidate({
    countryCode: 'JP',
    postcode: '1000001',
    patch: {
      postcode: '1000001',
      state: '東京都',
      city: '千代田区',
      suburb: '千代田',
    },
  });

  const comparison = buildRegistrationAssistanceComparison({
    postcodeCandidate: postalCandidate,
    agidCandidate,
    appliedSourceIds: [postalCandidate!.id],
    feedbackConsent: true,
    qualityDecision: 'partial',
    qualityReasons: ['missing-required:street'],
  });

  assert.equal(comparison.recommendedSource, 'postcode');
  assert.equal(comparison.candidates.length, 2);
  assert.equal(comparison.candidates[0].source, 'postcode');
  assert.equal(comparison.candidates[0].applied, true);
  assert.ok(comparison.qualityReasons.includes('both-postcode-and-agid-available'));
  assert.ok(comparison.qualityReasons.includes('feedback-consent-local-only-enabled'));
  assert.equal(comparison.feedbackConsent.storageScope, 'closed-device-local-rl-reference');
  assert.equal(comparison.feedbackConsent.externalTransmission, 'blocked');
  assert.equal(comparison.feedbackConsent.canSaveCorrectionHistory, true);
});

test('address translation feedback is a closed local learning sample and excludes private recipient fields', () => {
  const source = {
    country: 'JP',
    recipient: '山田太郎',
    street: '丸の内',
    city: '千代田区',
    state: '東京都',
    postcode: '1000001',
    phone: '0312345678',
  };
  const translated = {
    ...source,
    recipient: 'Taro Yamada',
    street: 'Marunouchi',
    city: 'Chiyoda City',
    state: 'Tokyo',
    phone: '+81312345678',
  };
  const corrected = {
    ...translated,
    street: '1 Marunouchi',
  };

  const sample = buildAddressTranslationFeedbackSample({
    source,
    translated,
    corrected,
    feedback: 'corrected',
    countryCode: 'JP',
    sourceLanguage: 'ja',
    targetLanguage: 'en',
    agid: 'JP01R1A0ZTR4',
    now: new Date('2026-06-12T00:00:00.000Z'),
  });

  assert.ok(sample);
  assert.equal(sample.storageScope, 'closed-device-local-rl-reference');
  assert.equal(sample.learningPolicy.externalTransmission, 'blocked');
  assert.equal(sample.feedback, 'corrected');
  assert.deepEqual(sample.fields, [{
    field: 'street',
    source: '丸の内',
    translated: 'Marunouchi',
    corrected: '1 Marunouchi',
  }]);
  assert.deepEqual(sample.excludedFields.sort(), ['phone', 'recipient']);

  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) || null,
    setItem: (key: string, value: string) => memory.set(key, value),
  };

  appendAddressTranslationFeedbackSample(sample, storage);
  const stored = JSON.parse(memory.get(ADDRESS_TRANSLATION_FEEDBACK_STORAGE_KEY) || '[]');
  assert.equal(stored.length, 1);
  assert.equal(stored[0].learningPolicy.mode, 'closed');
});

test('switching a country-supported address language tab translates fields without changing postcode and private fields', async () => {
  const formData = {
    country: 'CA',
    recipient: 'Aoi',
    organization: 'Central Library',
    street: 'Sainte-Catherine Street',
    city: 'Montreal',
    state: 'Quebec',
    postcode: 'H3B 1A1',
    phone: '+15145550123',
  };
  const translatedTexts: string[] = [];

  const french = await translateRegistrationFormFields({
    formData,
    targetLanguage: 'fr',
    countryCode: 'CA',
    sourceLanguage: 'en_domestic',
    translator: async ({ text, target, source }) => {
      translatedTexts.push(`${source}->${target}:${text}`);
      return `FR:${text}`;
    },
  });

  assert.equal(french.country, 'CA');
  assert.equal(french.postcode, 'H3B 1A1');
  assert.equal(french.phone, '+15145550123');
  assert.equal(french.organization, 'FR:Central Library');
  assert.equal(french.street, 'FR:Sainte-Catherine Street');
  assert.equal(french.city, 'FR:Montreal');
  assert.ok(translatedTexts.includes('en_domestic->fr:Quebec'));

  const english = await translateRegistrationFormFields({
    formData: {
      country: 'JP',
      recipient: '山田太郎',
      organization: '東京駅',
      street: '丸の内',
      city: '千代田区',
      state: '東京都',
      postcode: '1000001',
      phone: '0312345678',
    },
    targetLanguage: 'en',
    countryCode: 'JP',
    sourceLanguage: 'ja',
    translator: async () => {
      throw new Error('English address tab should use local normalization before machine translation');
    },
  });

  assert.equal(english.organization, 'Tokyo Station');
  assert.equal(english.street, 'Marunouchi');
  assert.equal(english.city, 'Chiyoda-ku');
  assert.equal(english.state, 'Tokyo');
  assert.equal(english.postcode, '1000001');
});

test('default address language switching uses open-source translation before dictionary aliases', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body || '{}'));
    calls.push(`${String(url)}:${body.q}`);
    return Response.json({ translatedText: `OSS:${body.q}` });
  }) as typeof fetch;

  try {
    const english = await translateRegistrationFormFields({
      formData: {
        country: 'JP',
        organization: '東京駅',
        city: '千代田区',
        state: '東京都',
        postcode: '1000001',
      },
      targetLanguage: 'en',
      countryCode: 'JP',
      sourceLanguage: 'ja',
    });

    assert.equal(english.organization, 'OSS:東京駅');
    assert.equal(english.city, 'OSS:千代田区');
    assert.equal(english.state, 'OSS:東京都');
    assert.equal(english.postcode, '1000001');
    assert.ok(calls.some(call => call.includes('/api/translate:東京駅')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('English domestic and international shipping tabs share address normalization in English-speaking countries', async () => {
  const formData = {
    country: 'NZ',
    recipient: 'Aroha',
    building: 'Te Papa Tongarewa',
    street: 'Cable Street',
    city: 'Wellington',
    state: 'Aotearoa',
    postcode: '6011',
  };
  const translator = async () => {
    throw new Error('English address modes should use the shared local English normalizer');
  };

  const domestic = await translateRegistrationFormFields({
    formData,
    targetLanguage: 'en_domestic',
    countryCode: 'NZ',
    sourceLanguage: 'en',
    translator,
  });
  const international = await translateRegistrationFormFields({
    formData,
    targetLanguage: 'en',
    countryCode: 'NZ',
    sourceLanguage: 'en_domestic',
    translator,
  });

  assert.equal(domestic.state, 'New Zealand');
  assert.equal(international.state, domestic.state);
  assert.equal(domestic.street, international.street);
  assert.equal(domestic.postcode, '6011');
  assert.equal(international.postcode, '6011');
});

test('East Asia address tabs use country-specific native-to-English routes before machine translation', async () => {
  const calls: string[] = [];
  const korean = await translateRegistrationFormFields({
    formData: {
      country: 'JP',
      state: '東京都',
      city: '千代田区',
      street: '丸の内',
      postcode: '1000001',
    },
    targetLanguage: 'ko',
    countryCode: 'JP',
    sourceLanguage: 'ja',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(korean.state, 'ko:Tokyo');
  assert.equal(korean.city, 'ko:Chiyoda-ku');
  assert.equal(korean.street, 'ko:Marunouchi');
  assert.deepEqual(calls, [
    'en->ko:Tokyo',
    'en->ko:Chiyoda-ku',
    'en->ko:Marunouchi',
  ]);
});

test('East Asia address tabs do not translate into non-native third languages', async () => {
  const japanese = await translateRegistrationFormFields({
    formData: {
      country: 'JP',
      state: '東京都',
      city: '千代田区',
      postcode: '1000001',
    },
    targetLanguage: 'fr',
    countryCode: 'JP',
    sourceLanguage: 'ja',
    translator: async () => {
      throw new Error('East Asia route should reject non-native third-language address tabs');
    },
  });

  assert.equal(japanese.state, '東京都');
  assert.equal(japanese.city, '千代田区');
  assert.equal(japanese.postcode, '1000001');
});

test('East Asia address tabs convert Chinese scripts without machine translation', async () => {
  const traditional = await translateRegistrationFormFields({
    formData: {
      country: 'CN',
      city: '广州市',
      postcode: '510000',
    },
    targetLanguage: 'zh-Hant',
    countryCode: 'CN',
    sourceLanguage: 'zh-Hans',
    translator: async () => {
      throw new Error('Chinese script conversion should not call machine translation');
    },
  });

  assert.equal(traditional.city, '廣州市');
  assert.equal(traditional.postcode, '510000');
});

test('Southeast Asia address tabs use domestic native-to-English routes before machine translation', async () => {
  const thai = await translateRegistrationFormFields({
    formData: {
      country: 'TH',
      city: 'กรุงเทพมหานคร',
      street: 'ถนนสุขุมวิท',
      postcode: '10110',
    },
    targetLanguage: 'en',
    countryCode: 'TH',
    sourceLanguage: 'th',
    translator: async () => {
      throw new Error('Thai English address tab should use the Southeast Asia route');
    },
  });

  assert.equal(thai.city, 'Bangkok');
  assert.equal(thai.street, 'Road Sukhumvit');
  assert.equal(thai.postcode, '10110');
});

test('English address tabs fall back to open-source translation for non-dictionary native place names', async () => {
  const calls: string[] = [];
  const myanmar = await translateRegistrationFormFields({
    formData: {
      country: 'MM',
      city: 'မြောက်ဥက္ကလာပ',
      street: 'ဗိုလ်ချုပ်လမ်း',
      postcode: '11031',
    },
    targetLanguage: 'en',
    countryCode: 'MM',
    sourceLanguage: 'my',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      if (text === 'မြောက်ဥက္ကလာပ') return 'North Okkalapa';
      if (text === 'ဗိုလ်ချုပ်လမ်း') return 'Bogyoke Road';
      return null;
    },
  });

  assert.equal(myanmar.city, 'North Okkalapa');
  assert.equal(myanmar.street, 'Bogyoke Road');
  assert.equal(myanmar.postcode, '11031');
  assert.deepEqual(calls, [
    'my->en:မြောက်ဥက္ကလာပ',
    'my->en:ဗိုလ်ချုပ်လမ်း',
  ]);
});

test('Southeast Asia address tabs reject non-domestic third-language targets', async () => {
  const indonesia = await translateRegistrationFormFields({
    formData: {
      country: 'ID',
      city: 'Jakarta',
      street: 'Jalan Sudirman',
      postcode: '12190',
    },
    targetLanguage: 'fr',
    countryCode: 'ID',
    sourceLanguage: 'id',
    translator: async () => {
      throw new Error('Southeast Asia route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(indonesia.city, 'Jakarta');
  assert.equal(indonesia.street, 'Jalan Sudirman');
  assert.equal(indonesia.postcode, '12190');
});

test('Southeast Asia multilingual native tabs use English pivot when scripts differ', async () => {
  const calls: string[] = [];
  const chinese = await translateRegistrationFormFields({
    formData: {
      country: 'SG',
      state: 'Singapura',
      street: 'Jalan Besar',
      postcode: '208787',
    },
    targetLanguage: 'zh-Hans',
    countryCode: 'SG',
    sourceLanguage: 'ms',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(chinese.state, 'zh-Hans:Singapore');
  assert.equal(chinese.street, 'zh-Hans:Street Besar');
  assert.deepEqual(calls, [
    'en->zh-Hans:Singapore',
    'en->zh-Hans:Street Besar',
  ]);
});

test('South Asia address tabs use country-specific native-to-English routes before machine translation', async () => {
  const india = await translateRegistrationFormFields({
    formData: {
      country: 'IN',
      state: 'महाराष्ट्र',
      city: 'मुंबई',
      street: 'अंधेरी पश्चिम',
      postcode: '400053',
    },
    targetLanguage: 'en',
    countryCode: 'IN',
    sourceLanguage: 'hi',
    translator: async () => {
      throw new Error('India English address tab should use the South Asia route');
    },
  });

  assert.equal(india.state, 'Maharashtra');
  assert.equal(india.city, 'Mumbai');
  assert.equal(india.street, 'Andheri West');
  assert.equal(india.postcode, '400053');
});

test('South Asia address tabs reject non-domestic third-language targets', async () => {
  const bangladesh = await translateRegistrationFormFields({
    formData: {
      country: 'BD',
      city: 'ঢাকা',
      postcode: '1205',
    },
    targetLanguage: 'fr',
    countryCode: 'BD',
    sourceLanguage: 'bn',
    translator: async () => {
      throw new Error('South Asia route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(bangladesh.city, 'ঢাকা');
  assert.equal(bangladesh.postcode, '1205');
});

test('South Asia multilingual native tabs use English pivot when scripts differ', async () => {
  const calls: string[] = [];
  const hindi = await translateRegistrationFormFields({
    formData: {
      country: 'IN',
      state: 'اتر پردیش',
      city: 'لکھنؤ',
      street: 'حضرت گنج',
      postcode: '226001',
    },
    targetLanguage: 'hi',
    countryCode: 'IN',
    sourceLanguage: 'ur',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(hindi.state, 'hi:Uttar Pradesh');
  assert.equal(hindi.city, 'hi:Lucknow');
  assert.equal(hindi.street, 'hi:Hazratganj');
  assert.deepEqual(calls, [
    'en->hi:Uttar Pradesh',
    'en->hi:Lucknow',
    'en->hi:Hazratganj',
  ]);
});

test('Central Asia address tabs use country-specific native-to-English routes before machine translation', async () => {
  const kazakhstan = await translateRegistrationFormFields({
    formData: {
      country: 'KZ',
      state: 'Қазақстан',
      city: 'Астана',
      street: 'Көше',
      postcode: '010000',
    },
    targetLanguage: 'en',
    countryCode: 'KZ',
    sourceLanguage: 'kk',
    translator: async () => {
      throw new Error('Kazakhstan English address tab should use the Central Asia route');
    },
  });

  assert.equal(kazakhstan.state, 'Kazakhstan');
  assert.equal(kazakhstan.city, 'Astana');
  assert.equal(kazakhstan.street, 'Street');
  assert.equal(kazakhstan.postcode, '010000');
});

test('Central Asia address tabs reject non-domestic third-language targets', async () => {
  const turkmenistan = await translateRegistrationFormFields({
    formData: {
      country: 'TM',
      city: 'Aşgabat',
      postcode: '744000',
    },
    targetLanguage: 'fr',
    countryCode: 'TM',
    sourceLanguage: 'tk',
    translator: async () => {
      throw new Error('Central Asia route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(turkmenistan.city, 'Aşgabat');
  assert.equal(turkmenistan.postcode, '744000');
});

test('Central Asia multilingual native tabs use English pivot when scripts differ', async () => {
  const calls: string[] = [];
  const russian = await translateRegistrationFormFields({
    formData: {
      country: 'UZ',
      city: 'Toshkent',
      street: "Ko'cha",
      postcode: '100000',
    },
    targetLanguage: 'ru',
    countryCode: 'UZ',
    sourceLanguage: 'uz',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(russian.city, 'ru:Tashkent');
  assert.equal(russian.street, 'ru:Street');
  assert.deepEqual(calls, [
    'en->ru:Tashkent',
    'en->ru:Street',
  ]);
});

test('West Asia address tabs use country-specific native-to-English routes before machine translation', async () => {
  const jordan = await translateRegistrationFormFields({
    formData: {
      country: 'JO',
      city: 'عمان',
      street: 'الشارع',
      postcode: '11118',
    },
    targetLanguage: 'en',
    countryCode: 'JO',
    sourceLanguage: 'ar',
    translator: async () => {
      throw new Error('Jordan English address tab should use the West Asia route');
    },
  });

  assert.equal(jordan.city, 'Amman');
  assert.equal(jordan.street, 'Street');
  assert.equal(jordan.postcode, '11118');
});

test('West Asia address tabs reject non-domestic third-language targets', async () => {
  const iran = await translateRegistrationFormFields({
    formData: {
      country: 'IR',
      city: 'تهران',
      postcode: '11369',
    },
    targetLanguage: 'fr',
    countryCode: 'IR',
    sourceLanguage: 'fa',
    translator: async () => {
      throw new Error('West Asia route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(iran.city, 'تهران');
  assert.equal(iran.postcode, '11369');
});

test('West Asia multilingual native tabs use English pivot when scripts differ', async () => {
  const calls: string[] = [];
  const arabic = await translateRegistrationFormFields({
    formData: {
      country: 'IL',
      city: 'תל אביב',
      street: 'רחוב',
      postcode: '61000',
    },
    targetLanguage: 'ar',
    countryCode: 'IL',
    sourceLanguage: 'he',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(arabic.city, 'ar:Tel Aviv');
  assert.equal(arabic.street, 'ar:Street');
  assert.deepEqual(calls, [
    'en->ar:Tel Aviv',
    'en->ar:Street',
  ]);
});

test('Western Europe address tabs use country-specific native-to-English routes before machine translation', async () => {
  const switzerland = await translateRegistrationFormFields({
    formData: {
      country: 'CH',
      city: 'Zürich',
      street: 'Straße',
      postcode: '8001',
    },
    targetLanguage: 'en',
    countryCode: 'CH',
    sourceLanguage: 'de',
    translator: async () => {
      throw new Error('Switzerland English address tab should use the Western Europe route');
    },
  });

  assert.equal(switzerland.city, 'Zürich');
  assert.equal(switzerland.street, 'Straße');
  assert.equal(switzerland.postcode, '8001');
});

test('Western Europe multilingual native tabs use English pivot when address-language topology differs', async () => {
  const calls: string[] = [];
  const belgium = await translateRegistrationFormFields({
    formData: {
      country: 'BE',
      city: 'Brussel',
      street: 'Straat',
      postcode: '1000',
    },
    targetLanguage: 'fr',
    countryCode: 'BE',
    sourceLanguage: 'nl',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(belgium.city, 'fr:Brussels');
  assert.equal(belgium.street, 'fr:Street');
  assert.deepEqual(calls, [
    'en->fr:Brussels',
    'en->fr:Street',
  ]);
});

test('Western Europe single-language markets reject non-domestic third-language address tabs', async () => {
  const france = await translateRegistrationFormFields({
    formData: {
      country: 'FR',
      city: 'Paris',
      street: 'Rue',
      postcode: '75001',
    },
    targetLanguage: 'de',
    countryCode: 'FR',
    sourceLanguage: 'fr',
    translator: async () => {
      throw new Error('Western Europe route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(france.city, 'Paris');
  assert.equal(france.street, 'Rue');
  assert.equal(france.postcode, '75001');
});

test('Southern Europe address tabs use country-specific native-to-English routes before machine translation', async () => {
  const italy = await translateRegistrationFormFields({
    formData: {
      country: 'IT',
      city: 'Roma',
      street: 'Via',
      postcode: '00118',
    },
    targetLanguage: 'en',
    countryCode: 'IT',
    sourceLanguage: 'it',
    translator: async () => {
      throw new Error('Italy English address tab should use the Southern Europe route');
    },
  });

  assert.equal(italy.city, 'Roma');
  assert.equal(italy.street, 'Via');
  assert.equal(italy.postcode, '00118');
});

test('Southern Europe multilingual native tabs use English pivot when address-language topology differs', async () => {
  const calls: string[] = [];
  const cyprus = await translateRegistrationFormFields({
    formData: {
      country: 'CY',
      city: 'Λευκωσία',
      street: 'Οδός',
      postcode: '1011',
    },
    targetLanguage: 'tr',
    countryCode: 'CY',
    sourceLanguage: 'el',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(cyprus.city, 'tr:Nicosia');
  assert.equal(cyprus.street, 'tr:Street');
  assert.deepEqual(calls, [
    'en->tr:Nicosia',
    'en->tr:Street',
  ]);
});

test('Southern Europe single-language markets reject non-domestic third-language address tabs', async () => {
  const portugal = await translateRegistrationFormFields({
    formData: {
      country: 'PT',
      city: 'Lisboa',
      street: 'Rua',
      postcode: '1000-001',
    },
    targetLanguage: 'es',
    countryCode: 'PT',
    sourceLanguage: 'pt',
    translator: async () => {
      throw new Error('Southern Europe route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(portugal.city, 'Lisboa');
  assert.equal(portugal.street, 'Rua');
  assert.equal(portugal.postcode, '1000-001');
});

test('Central Europe address tabs use country-specific native-to-English routes before machine translation', async () => {
  const poland = await translateRegistrationFormFields({
    formData: {
      country: 'PL',
      city: 'Warszawa',
      street: 'Ulica',
      postcode: '00-001',
    },
    targetLanguage: 'en',
    countryCode: 'PL',
    sourceLanguage: 'pl',
    translator: async () => {
      throw new Error('Poland English address tab should use the Central Europe route');
    },
  });

  assert.equal(poland.city, 'Warsaw');
  assert.equal(poland.street, 'Street');
  assert.equal(poland.postcode, '00-001');
});

test('Central Europe single-language markets reject non-domestic third-language address tabs', async () => {
  const hungary = await translateRegistrationFormFields({
    formData: {
      country: 'HU',
      city: 'Budapest',
      street: 'Utca',
      postcode: '1051',
    },
    targetLanguage: 'de',
    countryCode: 'HU',
    sourceLanguage: 'hu',
    translator: async () => {
      throw new Error('Central Europe route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(hungary.city, 'Budapest');
  assert.equal(hungary.street, 'Utca');
  assert.equal(hungary.postcode, '1051');
});

test('Northern Europe address tabs use country-specific native-to-English routes before machine translation', async () => {
  const denmark = await translateRegistrationFormFields({
    formData: {
      country: 'DK',
      city: 'København',
      street: 'Gade',
      postcode: '1050',
    },
    targetLanguage: 'en',
    countryCode: 'DK',
    sourceLanguage: 'da',
    translator: async () => {
      throw new Error('Denmark English address tab should use the Northern Europe route');
    },
  });

  assert.equal(denmark.city, 'Copenhagen');
  assert.equal(denmark.street, 'Street');
  assert.equal(denmark.postcode, '1050');
});

test('Northern Europe multilingual native tabs use English pivot when address-language topology differs', async () => {
  const calls: string[] = [];
  const finland = await translateRegistrationFormFields({
    formData: {
      country: 'FI',
      city: 'Helsinki',
      street: 'Katu',
      postcode: '00100',
    },
    targetLanguage: 'sv',
    countryCode: 'FI',
    sourceLanguage: 'fi',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(finland.city, 'sv:Helsinki');
  assert.equal(finland.street, 'sv:Street');
  assert.deepEqual(calls, [
    'en->sv:Helsinki',
    'en->sv:Street',
  ]);
});

test('Northern Europe single-language markets reject non-domestic third-language address tabs', async () => {
  const sweden = await translateRegistrationFormFields({
    formData: {
      country: 'SE',
      city: 'Göteborg',
      street: 'Gata',
      postcode: '411 01',
    },
    targetLanguage: 'de',
    countryCode: 'SE',
    sourceLanguage: 'sv',
    translator: async () => {
      throw new Error('Northern Europe route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(sweden.city, 'Göteborg');
  assert.equal(sweden.street, 'Gata');
  assert.equal(sweden.postcode, '411 01');
});

test('Eastern Europe address tabs use country-specific native-to-English routes before machine translation', async () => {
  const ukraine = await translateRegistrationFormFields({
    formData: {
      country: 'UA',
      city: 'Київ',
      street: 'Вулиця',
      postcode: '01001',
    },
    targetLanguage: 'en',
    countryCode: 'UA',
    sourceLanguage: 'uk',
    translator: async () => {
      throw new Error('Ukraine English address tab should use the Eastern Europe route');
    },
  });

  assert.equal(ukraine.city, 'Kyiv');
  assert.equal(ukraine.street, 'Street');
  assert.equal(ukraine.postcode, '01001');
});

test('Eastern Europe multilingual native tabs use English pivot when address-language topology differs', async () => {
  const calls: string[] = [];
  const bosnia = await translateRegistrationFormFields({
    formData: {
      country: 'BA',
      city: 'Sarajevo',
      street: 'Ulica',
      postcode: '71000',
    },
    targetLanguage: 'sr',
    countryCode: 'BA',
    sourceLanguage: 'bs',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(bosnia.city, 'sr:Sarajevo');
  assert.equal(bosnia.street, 'sr:Street');
  assert.deepEqual(calls, [
    'en->sr:Sarajevo',
    'en->sr:Street',
  ]);
});

test('Eastern Europe single-language markets reject non-domestic third-language address tabs', async () => {
  const russia = await translateRegistrationFormFields({
    formData: {
      country: 'RU',
      city: 'Москва',
      street: 'Улица',
      postcode: '101000',
    },
    targetLanguage: 'de',
    countryCode: 'RU',
    sourceLanguage: 'ru',
    translator: async () => {
      throw new Error('Eastern Europe route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(russia.city, 'Москва');
  assert.equal(russia.street, 'Улица');
  assert.equal(russia.postcode, '101000');
});

test('Caucasus address tabs are handled by the Eastern Europe route', async () => {
  const georgia = await translateRegistrationFormFields({
    formData: {
      country: 'GE',
      city: 'თბილისი',
      street: 'ქუჩა',
      postcode: '0105',
    },
    targetLanguage: 'en',
    countryCode: 'GE',
    sourceLanguage: 'ka',
    translator: async () => {
      throw new Error('Georgia English address tab should use the Eastern Europe route');
    },
  });

  assert.equal(georgia.city, 'Tbilisi');
  assert.equal(georgia.street, 'Street');
  assert.equal(georgia.postcode, '0105');
});

test('West Africa address tabs use country-specific native-to-English routes before machine translation', async () => {
  const coteDivoire = await translateRegistrationFormFields({
    formData: {
      country: 'CI',
      state: 'Lagunes',
      city: 'Abidjan',
      street: 'Rue',
      postcode: '00225',
    },
    targetLanguage: 'en',
    countryCode: 'CI',
    sourceLanguage: 'fr',
    translator: async () => {
      throw new Error('Cote d’Ivoire English address tab should use the West Africa route');
    },
  });

  assert.equal(coteDivoire.state, 'Lagunes');
  assert.equal(coteDivoire.city, 'Abidjan');
  assert.equal(coteDivoire.street, 'Rue');
  assert.equal(coteDivoire.postcode, '00225');
});

test('West Africa bilingual address tabs use English pivot when switching between French and English', async () => {
  const calls: string[] = [];
  const cameroonFrench = await translateRegistrationFormFields({
    formData: {
      country: 'CM',
      city: 'Douala',
      street: 'Street',
      postcode: '237',
    },
    targetLanguage: 'fr',
    countryCode: 'CM',
    sourceLanguage: 'en',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(cameroonFrench.city, 'fr:Douala');
  assert.equal(cameroonFrench.street, 'fr:Street');
  assert.deepEqual(calls, [
    'en->fr:Douala',
    'en->fr:Street',
  ]);
});

test('West Africa single-language markets reject non-domestic third-language address tabs', async () => {
  const senegal = await translateRegistrationFormFields({
    formData: {
      country: 'SN',
      city: 'Dakar',
      street: 'Rue',
      postcode: '12500',
    },
    targetLanguage: 'de',
    countryCode: 'SN',
    sourceLanguage: 'fr',
    translator: async () => {
      throw new Error('West Africa route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(senegal.city, 'Dakar');
  assert.equal(senegal.street, 'Rue');
  assert.equal(senegal.postcode, '12500');
});

test('Central Africa address tabs use country-specific native-to-English routes before machine translation', async () => {
  const congo = await translateRegistrationFormFields({
    formData: {
      country: 'CD',
      state: 'Kinshasa',
      city: 'Kinshasa',
      street: 'Commune',
      postcode: '243',
    },
    targetLanguage: 'en',
    countryCode: 'CD',
    sourceLanguage: 'fr',
    translator: async () => {
      throw new Error('DR Congo English address tab should use the Central Africa route');
    },
  });

  assert.equal(congo.state, 'Kinshasa');
  assert.equal(congo.city, 'Kinshasa');
  assert.equal(congo.street, 'Commune');
  assert.equal(congo.postcode, '243');
});

test('Central Africa multilingual native tabs use English pivot when topology differs', async () => {
  const calls: string[] = [];
  const chadArabic = await translateRegistrationFormFields({
    formData: {
      country: 'TD',
      city: 'N’Djamena',
      street: 'Rue',
      postcode: '235',
    },
    targetLanguage: 'ar',
    countryCode: 'TD',
    sourceLanguage: 'fr',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(chadArabic.city, 'ar:N’Djamena');
  assert.equal(chadArabic.street, 'ar:Rue');
  assert.deepEqual(calls, [
    'en->ar:N’Djamena',
    'en->ar:Rue',
  ]);
});

test('Central Africa single-language markets reject non-domestic third-language address tabs', async () => {
  const gabon = await translateRegistrationFormFields({
    formData: {
      country: 'GA',
      city: 'Libreville',
      street: 'Rue',
      postcode: '241',
    },
    targetLanguage: 'de',
    countryCode: 'GA',
    sourceLanguage: 'fr',
    translator: async () => {
      throw new Error('Central Africa route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(gabon.city, 'Libreville');
  assert.equal(gabon.street, 'Rue');
  assert.equal(gabon.postcode, '241');
});

test('Southern Africa address tabs use country-specific native-to-English routes before machine translation', async () => {
  const southAfrica = await translateRegistrationFormFields({
    formData: {
      country: 'ZA',
      state: 'Suid-Afrika',
      city: 'eGoli',
      street: 'Hoofstraat',
      postcode: '2000',
    },
    targetLanguage: 'en',
    countryCode: 'ZA',
    sourceLanguage: 'af',
    translator: async () => {
      throw new Error('South Africa English address tab should use the Southern Africa route');
    },
  });

  assert.equal(southAfrica.state, 'South Africa');
  assert.equal(southAfrica.city, 'Johannesburg');
  assert.equal(southAfrica.street, 'Main Street');
  assert.equal(southAfrica.postcode, '2000');
});

test('Southern Africa multilingual native tabs use English pivot when topology differs', async () => {
  const calls: string[] = [];
  const comorosArabic = await translateRegistrationFormFields({
    formData: {
      country: 'KM',
      city: 'Moroni',
      street: 'Rue',
      postcode: '00000',
    },
    targetLanguage: 'ar',
    countryCode: 'KM',
    sourceLanguage: 'fr',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(comorosArabic.city, 'ar:Moroni');
  assert.equal(comorosArabic.street, 'ar:Rue');
  assert.deepEqual(calls, [
    'en->ar:Moroni',
    'en->ar:Rue',
  ]);
});

test('Southern Africa single-language markets reject non-domestic third-language address tabs', async () => {
  const mozambique = await translateRegistrationFormFields({
    formData: {
      country: 'MZ',
      city: 'Maputo',
      street: 'Rua',
      postcode: '1100',
    },
    targetLanguage: 'de',
    countryCode: 'MZ',
    sourceLanguage: 'pt',
    translator: async () => {
      throw new Error('Southern Africa route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(mozambique.city, 'Maputo');
  assert.equal(mozambique.street, 'Rua');
  assert.equal(mozambique.postcode, '1100');
});

test('East Africa address tabs use country-specific native-to-English routes before machine translation', async () => {
  const ethiopia = await translateRegistrationFormFields({
    formData: {
      country: 'ET',
      city: 'አዲስ አበባ',
      street: 'መንገድ',
      postcode: '1000',
    },
    targetLanguage: 'en',
    countryCode: 'ET',
    sourceLanguage: 'am',
    translator: async () => {
      throw new Error('Ethiopia English address tab should use the East Africa route');
    },
  });

  assert.equal(ethiopia.city, 'Addis Ababa');
  assert.equal(ethiopia.street, 'Street');
  assert.equal(ethiopia.postcode, '1000');
});

test('East Africa multilingual native tabs use English pivot when topology differs', async () => {
  const calls: string[] = [];
  const somaliArabic = await translateRegistrationFormFields({
    formData: {
      country: 'SO',
      city: 'Muqdisho',
      street: 'Waddo',
      postcode: '',
    },
    targetLanguage: 'ar',
    countryCode: 'SO',
    sourceLanguage: 'so',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(somaliArabic.city, 'ar:Mogadishu');
  assert.equal(somaliArabic.street, 'ar:Street');
  assert.deepEqual(calls, [
    'en->ar:Mogadishu',
    'en->ar:Street',
  ]);
});

test('East Africa single-language markets reject non-domestic third-language address tabs', async () => {
  const madagascar = await translateRegistrationFormFields({
    formData: {
      country: 'MG',
      city: 'Antananarivo',
      street: 'Rue',
      postcode: '101',
    },
    targetLanguage: 'de',
    countryCode: 'MG',
    sourceLanguage: 'fr',
    translator: async () => {
      throw new Error('East Africa route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(madagascar.city, 'Antananarivo');
  assert.equal(madagascar.street, 'Rue');
  assert.equal(madagascar.postcode, '101');
});

test('Americas address tabs use regional Spanish-to-English routes before machine translation', async () => {
  const mexico = await translateRegistrationFormFields({
    formData: {
      country: 'MX',
      city: 'Ciudad de México',
      street: 'Calle Mayor',
      postcode: '01000',
    },
    targetLanguage: 'en',
    countryCode: 'MX',
    sourceLanguage: 'es-MX',
    translator: async () => {
      throw new Error('Mexico English address tab should use the Americas route');
    },
  });

  assert.equal(mexico.city, 'Ciudad de México');
  assert.equal(mexico.street, 'Calle Mayor');
  assert.equal(mexico.postcode, '01000');
});

test('Americas multilingual native tabs use English pivot when language topology differs', async () => {
  const calls: string[] = [];
  const paraguayGuarani = await translateRegistrationFormFields({
    formData: {
      country: 'PY',
      city: 'Asunción',
      street: 'Calle',
      postcode: '1209',
    },
    targetLanguage: 'gn',
    countryCode: 'PY',
    sourceLanguage: 'es',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(paraguayGuarani.city, 'gn:Asunción');
  assert.equal(paraguayGuarani.street, 'gn:Calle');
  assert.deepEqual(calls, [
    'en->gn:Asunción',
    'en->gn:Calle',
  ]);
});

test('Americas single-language markets reject non-domestic third-language address tabs', async () => {
  const mexico = await translateRegistrationFormFields({
    formData: {
      country: 'MX',
      city: 'Ciudad de México',
      street: 'Calle Mayor',
      postcode: '01000',
    },
    targetLanguage: 'de',
    countryCode: 'MX',
    sourceLanguage: 'es',
    translator: async () => {
      throw new Error('Americas route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(mexico.city, 'Ciudad de México');
  assert.equal(mexico.street, 'Calle Mayor');
  assert.equal(mexico.postcode, '01000');
});

test('Oceania address tabs use country-specific native-to-English routes before machine translation', async () => {
  const fiji = await translateRegistrationFormFields({
    formData: {
      country: 'FJ',
      state: 'Viti',
      city: 'Suva',
      street: 'Gaunisala',
      postcode: '679',
    },
    targetLanguage: 'en',
    countryCode: 'FJ',
    sourceLanguage: 'fj',
    translator: async () => {
      throw new Error('Fiji English address tab should use the Oceania route');
    },
  });

  assert.equal(fiji.state, 'Fiji');
  assert.equal(fiji.city, 'Suva');
  assert.equal(fiji.street, 'Road');
  assert.equal(fiji.postcode, '679');
});

test('Oceania multilingual native tabs use English pivot when topology differs', async () => {
  const calls: string[] = [];
  const fijiHindi = await translateRegistrationFormFields({
    formData: {
      country: 'FJ',
      state: 'Viti',
      city: 'Suva',
      street: 'Gaunisala',
      postcode: '679',
    },
    targetLanguage: 'hi',
    countryCode: 'FJ',
    sourceLanguage: 'fj',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(fijiHindi.state, 'hi:Fiji');
  assert.equal(fijiHindi.street, 'hi:Road');
  assert.deepEqual(calls, [
    'en->hi:Fiji',
    'en->hi:Suva',
    'en->hi:Road',
  ]);
});

test('Oceania single-language markets reject non-domestic third-language address tabs', async () => {
  const australia = await translateRegistrationFormFields({
    formData: {
      country: 'AU',
      state: 'New South Wales',
      city: 'Sydney',
      street: 'George Street',
      postcode: '2000',
    },
    targetLanguage: 'de',
    countryCode: 'AU',
    sourceLanguage: 'en',
    translator: async () => {
      throw new Error('Oceania route should reject non-domestic third-language address tabs');
    },
  });

  assert.equal(australia.state, 'New South Wales');
  assert.equal(australia.city, 'Sydney');
  assert.equal(australia.street, 'George Street');
  assert.equal(australia.postcode, '2000');
});
