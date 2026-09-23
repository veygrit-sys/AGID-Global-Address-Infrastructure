export type LanguageOption = {
  code: string;
  name: string;
  country: string;
  flag: string;
};

export const APP_LANGUAGE_STORAGE_KEY = 'agid_app_language';
export const ADDRESS_LANGUAGE_STORAGE_KEY = 'agid_address_language';

const CURRENT_APP_LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'ja', name: '日本語', country: 'Japan', flag: '🇯🇵' },
  { code: 'en', name: 'English', country: 'Global', flag: '🌐' },
  { code: 'en-GB', name: 'English (UK)', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'zh-Hans', name: '简体中文', country: 'China', flag: '🇨🇳' },
  { code: 'zh-Hant', name: '繁體中文', country: 'Taiwan / Hong Kong / Macau', flag: '🇹🇼' },
  { code: 'ko', name: '한국어', country: 'Korea', flag: '🇰🇷' },
  { code: 'fr', name: 'Français', country: 'France', flag: '🇫🇷' },
  { code: 'es', name: 'Español', country: 'Spain / Americas', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', country: 'Germany', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', country: 'Italy', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Português (Brasil)', country: 'Brazil', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', country: 'Portugal', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', country: 'Russia', flag: '🇷🇺' },
  { code: 'vi', name: 'Tiếng Việt', country: 'Vietnam', flag: '🇻🇳' },
  { code: 'ar', name: 'العربية', country: 'Arab world', flag: '🌐' },
  { code: 'th', name: 'ไทย', country: 'Thailand', flag: '🇹🇭' },
  { code: 'hi', name: 'हिन्दी', country: 'India', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', country: 'Bangladesh / India', flag: '🇧🇩' },
  { code: 'id', name: 'Bahasa Indonesia', country: 'Indonesia', flag: '🇮🇩' },
  { code: 'tr', name: 'Türkçe', country: 'Türkiye', flag: '🇹🇷' },
];

const APP_LANGUAGE_FALLBACK_OPTIONS: LanguageOption[] = [
  { code: 'fil', name: 'Filipino', country: 'Philippines', flag: '🇵🇭' },
  { code: 'mn-Cyrl', name: 'Монгол', country: 'Mongolia', flag: '🇲🇳' },
  { code: 'fo', name: 'Føroyskt', country: 'Faroe Islands', flag: '🇫🇴' },
  { code: 'pl', name: 'Polski', country: 'Poland', flag: '🇵🇱' },
];

const APP_LANGUAGE_OVERRIDES: LanguageOption[] = [
  { code: 'zh-Hant', name: '繁體中文', country: 'Taiwan / Hong Kong / Macau', flag: '🇹🇼' },
  { code: 'fr-CA', name: 'Français (Canada)', country: 'Canada', flag: '🇨🇦' },
  { code: 'fr-BE', name: 'Français (Belgique)', country: 'Belgium', flag: '🇧🇪' },
  { code: 'fr-CH', name: 'Français (Suisse)', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'fr-LU', name: 'Français (Luxembourg)', country: 'Luxembourg', flag: '🇱🇺' },
  { code: 'fr-MC', name: 'Français (Monaco)', country: 'Monaco', flag: '🇲🇨' },
  { code: 'fr-SN', name: 'Français (Sénégal)', country: 'Senegal', flag: '🇸🇳' },
  { code: 'fr-CD', name: 'Français (RD Congo)', country: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { code: 'fr-CI', name: "Français (Côte d'Ivoire)", country: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'de-LI', name: 'Deutsch (Liechtenstein)', country: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'de-LU', name: 'Deutsch (Luxemburg)', country: 'Luxembourg', flag: '🇱🇺' },
  { code: 'de-BE', name: 'Deutsch (Belgien)', country: 'Belgium', flag: '🇧🇪' },
  { code: 'it-CH', name: 'Italiano (Svizzera)', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'it-SM', name: 'Italiano (San Marino)', country: 'San Marino', flag: '🇸🇲' },
  { code: 'it-VA', name: 'Italiano (Città del Vaticano)', country: 'Vatican City', flag: '🇻🇦' },
];

const CURRENT_APP_UI_LANGUAGE_CODES = [
  'ja',
  'en',
  'en-GB',
  'zh-Hans',
  'zh-Hant',
  'ko',
  'fr',
  'es',
  'de',
  'it',
  'pt-BR',
  'pt-PT',
  'ru',
  'vi',
  'ar',
  'th',
  'hi',
  'bn',
  'id',
  'tr',
] as const;

const ASIA_PRIMARY_APP_LANGUAGE_CODES = [
  'ja',
  'zh-Hans',
  'zh-Hant',
  'ko',
  'ko-KP',
  'mn-Cyrl',
  'my',
  'th',
  'vi',
  'km',
  'lo',
  'ms',
  'en',
  'id',
  'fil',
  'tet',
  'hi',
  'ur',
  'bn',
  'ne',
  'si',
  'dz',
  'dv',
  'ps',
  'fa-AF',
  'tr',
  'fa',
  'ar',
  'he',
  'kk',
  'uz',
  'tk',
  'ky',
  'tg',
  'ru',
  'hy',
  'az',
  'ka',
] as const;

const EUROPE_PRIMARY_APP_LANGUAGE_CODES = [
  'en',
  'en-GB',
  'fr',
  'de',
  'nl',
  'sv',
  'fi',
  'da',
  'no',
  'nb',
  'nn',
  'lv',
  'et',
  'lt',
  'is',
  'it',
  'es',
  'pt-PT',
  'el',
  'mt',
  'ca',
  'ro',
  'bg',
  'uk',
  'be',
  'ru',
  'hr',
  'sr',
  'bs',
  'cnr',
  'sq',
  'mk',
  'pl',
  'cs',
  'sk',
  'hu',
  'sl',
  'lb',
  'rm',
  'ga',
  'kl',
  'fo',
  'tr',
  'hy',
  'az',
  'ka',
] as const;

const REGIONAL_FRENCH_APP_LANGUAGE_CODES = [
  'fr-CA',
  'fr-BE',
  'fr-CH',
  'fr-LU',
  'fr-MC',
  'fr-SN',
  'fr-CD',
  'fr-CI',
] as const;

const REGIONAL_ENGLISH_APP_LANGUAGE_CODES = [
  'en-AU',
  'en-CA',
  'en-NZ',
  'en-IE',
  'en-ZA',
  'en-IN',
  'en-SG',
  'en-PH',
  'en-JM',
  'en-BS',
  'en-BB',
  'en-GY',
  'en-TT',
  'en-NG',
  'en-GH',
  'en-KE',
  'en-BZ',
  'en-PK',
  'en-BD',
  'en-LK',
  'en-NP',
  'en-MV',
  'en-AG',
  'en-KN',
  'en-LC',
  'en-VC',
  'en-GD',
  'en-MY',
] as const;

const REGIONAL_GERMAN_APP_LANGUAGE_CODES = [
  'de-AT',
  'de-CH',
  'de-LI',
  'de-LU',
  'de-BE',
] as const;

const REGIONAL_ITALIAN_APP_LANGUAGE_CODES = [
  'it-CH',
  'it-SM',
  'it-VA',
] as const;

const TRADITIONAL_CHINESE_APP_LANGUAGE_CODES = [
  'zh-Hant-TW',
  'zh-Hant-HK',
  'zh-Hant-MO',
] as const;

const REGIONAL_SPANISH_APP_LANGUAGE_CODES = [
  'es-MX',
  'es-AR',
  'es-CL',
  'es-CO',
  'es-PE',
  'es-VE',
  'es-EC',
  'es-BO',
  'es-PY',
  'es-UY',
  'es-PA',
  'es-CR',
  'es-NI',
  'es-HN',
  'es-SV',
  'es-GT',
  'es-DO',
  'es-PR',
  'es-CU',
  'es-GQ',
] as const;

const REGIONAL_ARABIC_APP_LANGUAGE_CODES = [
  'ar-SA',
  'ar-EG',
  'ar-AE',
  'ar-KW',
  'ar-QA',
  'ar-OM',
  'ar-BH',
  'ar-JO',
  'ar-LB',
  'ar-SY',
  'ar-IQ',
  'ar-YE',
  'ar-MA',
  'ar-DZ',
  'ar-TN',
  'ar-LY',
  'ar-SD',
  'ar-PS',
  'ar-MR',
  'ar-SO',
  'ar-DJ',
  'ar-KM',
] as const;

const REGIONAL_PORTUGUESE_APP_LANGUAGE_CODES = [
  'pt-AO',
  'pt-MZ',
  'pt-CV',
  'pt-GW',
  'pt-ST',
] as const;

const APP_LANGUAGE_OPTIONS_BY_CODE = new Map(
  [...CURRENT_APP_LANGUAGE_OPTIONS, ...APP_LANGUAGE_FALLBACK_OPTIONS, ...APP_LANGUAGE_OVERRIDES].map(language => [language.code, language])
);

export const APP_LANGUAGES: LanguageOption[] = Array.from(new Set([
  ...CURRENT_APP_UI_LANGUAGE_CODES,
  ...ASIA_PRIMARY_APP_LANGUAGE_CODES,
  ...EUROPE_PRIMARY_APP_LANGUAGE_CODES,
  ...REGIONAL_FRENCH_APP_LANGUAGE_CODES,
  ...REGIONAL_ENGLISH_APP_LANGUAGE_CODES,
  ...REGIONAL_GERMAN_APP_LANGUAGE_CODES,
  ...REGIONAL_ITALIAN_APP_LANGUAGE_CODES,
  ...TRADITIONAL_CHINESE_APP_LANGUAGE_CODES,
  ...REGIONAL_SPANISH_APP_LANGUAGE_CODES,
  ...REGIONAL_ARABIC_APP_LANGUAGE_CODES,
  ...REGIONAL_PORTUGUESE_APP_LANGUAGE_CODES,
]))
  .map(code => APP_LANGUAGE_OPTIONS_BY_CODE.get(code) || {
    code,
    name: code,
    country: 'Global',
    flag: '🌐',
  });

const APP_LANGUAGE_CODES = new Set(APP_LANGUAGES.map(language => language.code));
const APP_LANGUAGE_ALIASES: Record<string, string[]> = {
  'en-AU': ['en'],
  'en-CA': ['en'],
  'en-NZ': ['en'],
  'en-US': ['en'],
  'es-MX': ['es'],
  mfe: ['en'],
  pt: ['pt-PT'],
  sw: ['en'],
  tl: ['fil'],
  zh: ['zh-Hans'],
  yue: ['zh-Hant'],
};

export function normalizeAppLanguage(language?: string | null) {
  const value = language?.trim();
  if (!value) return 'en';

  const parts = value.split('-');
  const candidates = [
    value,
    parts.length >= 2 ? parts.slice(0, 2).join('-') : '',
    parts[0] || '',
    ...(APP_LANGUAGE_ALIASES[value] || []),
    ...(APP_LANGUAGE_ALIASES[parts[0] || ''] || []),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (APP_LANGUAGE_CODES.has(candidate)) return candidate;
  }

  return 'en';
}

const INDIAN_LANGUAGES = ['hi', 'as', 'bn', 'brx', 'doi', 'kok', 'ks', 'mai', 'mni', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'sa', 'sat', 'sd', 'ur'];
const SOUTH_AFRICAN_LANGUAGES = ['af', 'zu', 'xh'];
const AFRICAN_PRIMARY_LANGUAGES = [
  'aa', 'ak', 'am', 'bm', 'bem', 'bci', 'crs', 'din', 'dyu', 'ee', 'fan', 'ff', 'fon',
  'ha', 'ig', 'kea', 'ki', 'kj', 'kpe', 'kri', 'lg', 'ln', 'lua', 'mfe', 'mg', 'mos',
  'nd', 'nr', 'nso', 'ny', 'om', 'rw', 'rn', 'sg', 'sn', 'so', 'ss', 'st', 'suk',
  'sus', 'sw', 'swb', 'tem', 'ti', 'tig', 'tn', 'ts', 'tw', 'umb', 've', 'vmw', 'wo',
  'yo',
];
const GERMANIC_REGIONAL_LANGUAGES = ['de', 'de-AT', 'de-CH', 'nds', 'hsb', 'dsb'];
const SPAIN_REGIONAL_LANGUAGES = ['ca', 'gl', 'eu'];
const ITALY_REGIONAL_LANGUAGES = ['sc', 'fur', 'co'];
const EUROPEAN_REGIONAL_LANGUAGES = ['cy', 'gd', 'gv', 'lb', 'rm', 'br', 'oc', 'wa', 'fy', 'ga', 'is', 'se', 'vls', 'li', 'la'];
const HISPANOSPHERE_SPANISH = ['es', 'es-MX', 'es-AR', 'es-CO', 'es-PE', 'es-VE', 'es-CL', 'es-EC', 'es-BO', 'es-PY', 'es-UY', 'es-PA', 'es-CR', 'es-NI', 'es-HN', 'es-SV', 'es-GT', 'es-DO', 'es-PR', 'es-CU', 'es-GQ'];
const LUSOSPHERE_PORTUGUESE = ['pt', 'pt-PT', 'pt-BR', 'pt-AO', 'pt-MZ', 'pt-CV', 'pt-GW', 'pt-ST'];
const GLOBAL_ARABIC = [
  'ar', 'ar-SA', 'ar-EG', 'ar-AE', 'ar-KW', 'ar-QA', 'ar-OM', 'ar-BH', 'ar-JO', 'ar-LB',
  'ar-SY', 'ar-IQ', 'ar-YE', 'ar-MA', 'ar-DZ', 'ar-TN', 'ar-LY', 'ar-SD', 'ar-PS',
  'ar-MR', 'ar-SO', 'ar-DJ', 'ar-KM',
];
const MENA_OTHER_LANGUAGES = ['fa', 'fa-AF', 'he', 'ps', 'ku', 'az'];

export function getLanguageGroupKey(code: string) {
  if (INDIAN_LANGUAGES.includes(code)) return 'in-regional';
  if (SOUTH_AFRICAN_LANGUAGES.includes(code)) return 'za-regional';
  if (AFRICAN_PRIMARY_LANGUAGES.includes(code)) return 'africa-native';
  if (GERMANIC_REGIONAL_LANGUAGES.includes(code)) return 'de-regional';
  if (EUROPEAN_REGIONAL_LANGUAGES.includes(code)) return 'eu-regional';
  if (SPAIN_REGIONAL_LANGUAGES.includes(code)) return 'es-regional';
  if (ITALY_REGIONAL_LANGUAGES.includes(code)) return 'it-regional';
  if (HISPANOSPHERE_SPANISH.includes(code)) return 'hispanosphere';
  if (LUSOSPHERE_PORTUGUESE.includes(code)) return 'lusosphere';
  if (GLOBAL_ARABIC.includes(code)) return 'arabic-global';
  if (MENA_OTHER_LANGUAGES.includes(code)) return 'mena-other';
  if (code.startsWith('zh-Hans')) return 'zh-Hans';
  if (code.startsWith('zh-Hant')) return 'zh-Hant';
  return code.split('-')[0];
}

export function groupLanguageOptions(languageOptions: readonly LanguageOption[]) {
  const groups: Record<string, LanguageOption[]> = {};
  for (const language of languageOptions) {
    const groupKey = getLanguageGroupKey(language.code);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(language);
  }
  return groups;
}
