import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { normalizeChineseRegionalAddressPart,toSimplified,toTraditional } from './chineseAddressUtils';

export type EastAsiaAddressTopology =
  | 'cjk-kana-kanji'
  | 'sinitic-hanzi'
  | 'hangul-syllabic'
  | 'cyrillic-mongolic'
  | 'latin-address';

export type EastAsiaEnglishAlgorithm =
  | 'hepburn'
  | 'hanyu-pinyin'
  | 'taiwan-customary'
  | 'hong-kong-cantonese'
  | 'macao-portuguese-cantonese'
  | 'revised-romanization'
  | 'mongolian-latin';

export type EastAsiaAddressTranslationRoute = AddressTranslationRoute<EastAsiaAddressTopology, EastAsiaEnglishAlgorithm>;

export type EastAsiaAddressTranslationProfile = AddressTranslationProfile<EastAsiaAddressTopology, EastAsiaEnglishAlgorithm>;


const EAST_ASIA_ADDRESS_TRANSLATION_PROFILES: Record<string, EastAsiaAddressTranslationProfile> = {
  JP: {
    countryCode: 'JP',
    nativeLanguages: ['ja'],
    defaultLanguage: 'ja',
    defaultTopology: 'cjk-kana-kanji',
    englishAlgorithm: 'hepburn',
  },
  CN: {
    countryCode: 'CN',
    nativeLanguages: ['zh-Hans'],
    defaultLanguage: 'zh-Hans',
    defaultTopology: 'sinitic-hanzi',
    englishAlgorithm: 'hanyu-pinyin',
  },
  TW: {
    countryCode: 'TW',
    nativeLanguages: ['zh-Hant'],
    defaultLanguage: 'zh-Hant',
    defaultTopology: 'sinitic-hanzi',
    englishAlgorithm: 'taiwan-customary',
  },
  HK: {
    countryCode: 'HK',
    nativeLanguages: ['zh-Hant'],
    defaultLanguage: 'zh-Hant',
    defaultTopology: 'sinitic-hanzi',
    englishAlgorithm: 'hong-kong-cantonese',
  },
  MO: {
    countryCode: 'MO',
    nativeLanguages: ['zh-Hant', 'pt'],
    defaultLanguage: 'zh-Hant',
    defaultTopology: 'sinitic-hanzi',
    englishAlgorithm: 'macao-portuguese-cantonese',
  },
  KR: {
    countryCode: 'KR',
    nativeLanguages: ['ko'],
    defaultLanguage: 'ko',
    defaultTopology: 'hangul-syllabic',
    englishAlgorithm: 'revised-romanization',
  },
  KP: {
    countryCode: 'KP',
    nativeLanguages: ['ko'],
    defaultLanguage: 'ko',
    defaultTopology: 'hangul-syllabic',
    englishAlgorithm: 'revised-romanization',
  },
  MN: {
    countryCode: 'MN',
    nativeLanguages: ['mn'],
    defaultLanguage: 'mn',
    defaultTopology: 'cyrillic-mongolic',
    englishAlgorithm: 'mongolian-latin',
  },
};

const EAST_ASIA_NATIVE_LANGUAGE_SET = new Set(['ja', 'zh-Hans', 'zh-Hant', 'ko', 'mn']);

const EAST_ASIA_TOPOLOGY_BY_LANGUAGE: Record<string, EastAsiaAddressTopology> = {
  ja: 'cjk-kana-kanji',
  'zh-Hans': 'sinitic-hanzi',
  'zh-Hant': 'sinitic-hanzi',
  ko: 'hangul-syllabic',
  mn: 'cyrillic-mongolic',
  pt: 'latin-address',
  en: 'latin-address',
};

function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode);
}

export function getEastAsiaAddressTranslationProfile(countryCode: string) {
  return EAST_ASIA_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeEastAsiaAddressLanguage(language: string | undefined | null, profile: EastAsiaAddressTranslationProfile) {
  return normalizeAddressTranslationLanguage(language, profile, {
    mapLanguage: raw => {
      if (raw === 'zh' && profile.countryCode === 'CN') return 'zh-Hans';
      if (raw === 'zh' && ['TW', 'HK', 'MO'].includes(profile.countryCode)) return 'zh-Hant';
      if (raw === 'zh-CN' || raw === 'zh-SG' || raw.startsWith('zh-Hans')) return 'zh-Hans';
      if (raw === 'zh-TW' || raw === 'zh-HK' || raw === 'zh-MO' || raw.startsWith('zh-Hant')) return 'zh-Hant';
      return null;
    },
  });
}

function isAllowedTargetLanguage(language: string, profile: EastAsiaAddressTranslationProfile) {
  return (
    language === 'en' ||
    EAST_ASIA_NATIVE_LANGUAGE_SET.has(language) ||
    profile.nativeLanguages.includes(language)
  );
}

function topologyForLanguage(language: string, profile: EastAsiaAddressTranslationProfile): EastAsiaAddressTopology {
  return EAST_ASIA_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

function usesChineseScriptConversion(sourceLanguage: string, targetLanguage: string) {
  return (
    (sourceLanguage === 'zh-Hans' || sourceLanguage === 'zh-Hant') &&
    (targetLanguage === 'zh-Hans' || targetLanguage === 'zh-Hant') &&
    sourceLanguage !== targetLanguage
  );
}

export function chooseEastAsiaAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): EastAsiaAddressTranslationRoute | null {
  const profile = getEastAsiaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeEastAsiaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeEastAsiaAddressLanguage(options.targetLanguage, profile);
  if (!isAllowedTargetLanguage(targetLanguage, profile)) return null;

  const sourceTopology = topologyForLanguage(sourceLanguage, profile);
  const targetTopology = topologyForLanguage(targetLanguage, profile);

  return chooseCommonAddressTranslationRoute({
    sourceLanguage,
    targetLanguage,
    sourceTopology,
    targetTopology,
    englishAlgorithm: profile.englishAlgorithm,
    englishTopology: 'latin-address',
    scriptConversion: usesChineseScriptConversion(sourceLanguage, targetLanguage),
  });
}

function shouldUseBuildingEnglish(fieldKey: string) {
  return isAddressBuildingField(fieldKey);
}

function normalizeEastAsiaEnglish(text: string, countryCode: string, fieldKey: string) {
  const code = countryCodeOf(countryCode);
  if (['CN', 'TW', 'HK', 'MO'].includes(code) && /[\u3400-\u9fff]/.test(text)) {
    return normalizeChineseRegionalAddressPart(text, code);
  }

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  const generic = normalizeEnglishAddressPart(text, code);
  if (generic) return generic;

  return '';
}

function convertChineseScript(text: string, targetLanguage: string, countryCode: string) {
  if (targetLanguage === 'zh-Hans') return toSimplified(text);
  const code = countryCodeOf(countryCode);
  const region = code === 'MO' ? 'MO' : code === 'HK' ? 'HK' : 'TW';
  return toTraditional(text, region);
}

export async function translateEastAsiaAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: EastAsiaAddressTranslationRoute } | null> {
  const profile = getEastAsiaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseEastAsiaAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeEastAsiaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeEastAsiaAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeEastAsiaEnglish(value, profile.countryCode, options.fieldKey),
    translator: options.translator,
    convertScript: value => convertChineseScript(value, targetLanguage, profile.countryCode),
  });
}
