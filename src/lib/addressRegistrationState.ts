import { getAddressLanguageTabLabel } from './languageLabels';
import { getEnglishAddressCircle,isEnglishAddressCountry,type EnglishAddressCircle } from './languageTabs';

const REGISTRATION_UI_LANGUAGES = new Set(['en', 'ja', 'de', 'zh-Hant', 'zh-Hans', 'es', 'pt', 'fr', 'ar']);

type RegistrationAddressField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  labelEn?: string;
};

export type RegistrationLanguageFormat = {
  name?: string;
  addressFormat?: string;
  ordering?: string;
  fields?: readonly RegistrationAddressField[];
};

export type RegistrationAddressFormatSource = {
  countryCode?: string;
  name?: string;
  native?: RegistrationLanguageFormat;
  english?: RegistrationLanguageFormat;
  domestic?: Record<string, RegistrationLanguageFormat>;
  international?: Record<string, RegistrationLanguageFormat>;
  fields?: readonly RegistrationAddressField[];
  addressRules?: {
    languages?: readonly { code: string; name: string }[];
    deliveryLanguages?: readonly { code: string; name: string }[];
  };
};

export type RegistrationAddressLanguageTab = {
  code: string;
  label: string;
  kind: 'domestic' | 'international';
  englishCircle?: Extract<EnglishAddressCircle, 'inner' | 'outer'>;
};

const ADDRESS_LANGUAGE_CODE_BY_NAME: Record<string, string> = {
  arabic: 'ar',
  armenian: 'hy',
  azerbaijani: 'az',
  belarusian: 'be',
  bengali: 'bn',
  burmese: 'my',
  chinese: 'zh',
  'chinese simplified': 'zh-Hans',
  'chinese traditional': 'zh-Hant',
  czech: 'cs',
  danish: 'da',
  deutsch: 'de',
  dutch: 'nl',
  english: 'en',
  french: 'fr',
  français: 'fr',
  german: 'de',
  greek: 'el',
  hebrew: 'he',
  hindi: 'hi',
  italian: 'it',
  italiano: 'it',
  japanese: 'ja',
  korean: 'ko',
  lao: 'lo',
  malay: 'ms',
  mongolian: 'mn',
  nepali: 'ne',
  portuguese: 'pt',
  russian: 'ru',
  spanish: 'es',
  swahili: 'sw',
  thai: 'th',
  turkish: 'tr',
  ukrainian: 'uk',
  urdu: 'ur',
  vietnamese: 'vi',
};

export type RegistrationFormData = {
  country: string;
  state?: string;
  [key: string]: unknown;
};

export type RegistrationCountrySelection = {
  code: string;
  name: string;
};

export function normalizeRegistrationUiLanguage(language?: string | null) {
  const value = (language || 'en').trim();
  if (value.startsWith('zh-Hant') || value === 'zh-TW' || value === 'zh-HK' || value === 'zh-MO') {
    return 'zh-Hant';
  }
  if (value.startsWith('zh-Hans') || value === 'zh-CN' || value === 'zh-SG') {
    return 'zh-Hans';
  }

  const base = value.split('-')[0];
  if (REGISTRATION_UI_LANGUAGES.has(value)) return value;
  if (REGISTRATION_UI_LANGUAGES.has(base)) return base;
  return 'en';
}

export function normalizeRegistrationAddressLanguage(language?: string | null) {
  const value = (language || 'local').trim().replace('_', '-');
  if (!value || value === 'local') return 'local';
  if (value === 'en-domestic' || value === 'en_domestic') return 'en_domestic';
  if (
    value === 'en-international' ||
    value === 'en_international' ||
    value === 'international' ||
    value === 'intl_en' ||
    value === 'carrier' ||
    value.startsWith('en-')
  ) return 'en';
  if (value.startsWith('zh-Hans') || value === 'zh-CN' || value === 'zh-SG') return 'zh-Hans';
  if (value.startsWith('zh-Hant') || value === 'zh-TW' || value === 'zh-HK' || value === 'zh-MO') return 'zh-Hant';
  const lower = value.toLowerCase();
  if (/^[a-z]{2,3}-/.test(lower)) return lower.split('-')[0];
  return lower;
}

function inferLanguageCodeFromName(name?: string) {
  if (!name) return null;
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return ADDRESS_LANGUAGE_CODE_BY_NAME[normalized] || null;
}

type DomesticEnglishCircle = Extract<EnglishAddressCircle, 'inner' | 'outer'>;

function labelForAddressLanguage(code: string, fallback?: string, englishCircle?: DomesticEnglishCircle) {
  const englishMode = code === 'en' ? 'international' : code === 'en_domestic' ? 'domestic' : 'plain';
  return getAddressLanguageTabLabel(code, fallback, { englishMode, englishCircle });
}

function findFormatByLanguage(
  formats: Record<string, RegistrationLanguageFormat> | undefined,
  language: string,
) {
  if (!formats) return undefined;
  const target = normalizeRegistrationAddressLanguage(language);
  const direct = formats[language] || formats[target];
  if (direct) return direct;

  return Object.entries(formats).find(([code]) => normalizeRegistrationAddressLanguage(code) === target)?.[1];
}

export function buildRegistrationAddressLanguageTabs(
  format?: RegistrationAddressFormatSource | null,
  countryCode = format?.countryCode || '',
): RegistrationAddressLanguageTab[] {
  const tabs: RegistrationAddressLanguageTab[] = [];
  const seen = new Set<string>();
  const normalizedCountryCode = (countryCode || format?.countryCode || '').toLowerCase();
  const englishCircle = isEnglishAddressCountry(normalizedCountryCode)
    ? getEnglishAddressCircle(normalizedCountryCode)
    : undefined;
  const domesticEnglishCircle =
    englishCircle === 'inner' || englishCircle === 'outer' ? englishCircle : undefined;
  const hasDomesticEnglish =
    isEnglishAddressCountry(normalizedCountryCode) ||
    Boolean(findFormatByLanguage(format?.domestic, 'en')) ||
    inferLanguageCodeFromName(format?.native?.name) === 'en';

  const addTab = (rawCode: string | null | undefined, fallbackLabel?: string, kind: RegistrationAddressLanguageTab['kind'] = 'domestic') => {
    if (!rawCode) return;
    const normalized = normalizeRegistrationAddressLanguage(rawCode);
    if (!normalized || normalized === 'local') return;
    const code = normalized === 'en' && kind === 'domestic' && hasDomesticEnglish ? 'en_domestic' : normalized;
    if (seen.has(code)) return;
    seen.add(code);
    const tabEnglishCircle = code === 'en_domestic' ? domesticEnglishCircle : undefined;
    tabs.push({
      code,
      label: labelForAddressLanguage(code, fallbackLabel, tabEnglishCircle),
      kind,
      ...(tabEnglishCircle ? { englishCircle: tabEnglishCircle } : {}),
    });
  };

  for (const language of format?.addressRules?.languages || []) {
    addTab(language.code, language.name);
  }

  const nativeCode = inferLanguageCodeFromName(format?.native?.name);
  addTab(nativeCode, format?.native?.name);

  for (const [code, languageFormat] of Object.entries(format?.domestic || {})) {
    addTab(code, languageFormat.name);
  }

  if (hasDomesticEnglish && !seen.has('en_domestic')) {
    addTab('en', 'English', 'domestic');
  }

  if (!tabs.length && format?.native) {
    addTab('local', format.native.name || 'Local address');
    if (!tabs.length) {
      tabs.push({ code: 'local', label: format.native.name || 'Local address', kind: 'domestic' });
    }
  }

  if (!seen.has('en')) {
    seen.add('en');
    tabs.push({ code: 'en', label: labelForAddressLanguage('en'), kind: 'international' });
  }

  return tabs;
}

export function selectRegistrationAddressFormat(
  format: RegistrationAddressFormatSource | null | undefined,
  language: string,
) {
  if (!format) return undefined;
  const normalized = normalizeRegistrationAddressLanguage(language);

  if (normalized === 'en_domestic') {
    return findFormatByLanguage(format.domestic, 'en') || format.native || format.english;
  }

  if (normalized === 'en') {
    return format.english || findFormatByLanguage(format.international, 'en') || format.native;
  }

  if (normalized === 'local') {
    return format.native || format.english;
  }

  const nativeCode = inferLanguageCodeFromName(format.native?.name);
  if (nativeCode && normalizeRegistrationAddressLanguage(nativeCode) === normalized) {
    return format.native || findFormatByLanguage(format.domestic, normalized);
  }

  return (
    findFormatByLanguage(format.domestic, normalized) ||
    format.native ||
    format.english
  );
}

export function selectRegistrationCountry<T extends RegistrationFormData>(
  formData: T,
  selection: RegistrationCountrySelection,
  options: { storeRegionName?: boolean } = {},
): T {
  const isMainland = selection.name.includes('(Mainland)');
  const shouldStoreRegionName = options.storeRegionName ?? !isMainland;

  return {
    ...formData,
    country: selection.code,
    state: shouldStoreRegionName ? selection.name : '',
  };
}
