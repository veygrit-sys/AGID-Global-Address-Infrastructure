import type { CanonicalAddress } from './addressRendering';
import {
  containsAsianDestinationScript,
  transliterateAsianShippingText,
  type AsianShippingScript,
} from './asianShippingTransliteration';
import { normalizeLanguageCode } from './languageCodeRules';
import {
  normalizeEnglishAddressBuildingName,
  normalizeEnglishAddressPart,
} from './addressEnglish';
import {
  resolveJapaneseContextualReading,
  type JapaneseContextualReadingRecord,
  type JapaneseContextualReadingResolution,
} from './japaneseContextualReading';

export type RemainingAsianShippingMode = 'domestic' | 'international-shipping';
export type RemainingAsianAddressOrder = 'big-to-small' | 'small-to-big';
export type RemainingAsianStreetOrder = 'road-number' | 'number-road';
export type RemainingAsianAliasField =
  | 'building'
  | 'poi'
  | 'road'
  | 'subdistrict'
  | 'district'
  | 'city'
  | 'state';
export type RemainingAsianRomanizationMethod =
  | 'not-applicable'
  | 'preserved-latin'
  | 'caller-approved-alias'
  | 'curated-place-alias'
  | 'contextual-authoritative-reading'
  | 'context-required'
  | 'deterministic-script-transliteration';

export type RemainingAsianShippingWarning =
  | 'delivery_point_not_validated'
  | 'postcode_locality_pair_not_verified'
  | 'unsupported_country_profile'
  | 'unsupported_domestic_language'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'invalid_postcode_format'
  | 'postcode_not_universal'
  | 'caller_approved_alias_applied'
  | 'curated_locality_alias_applied'
  | 'contextual_japanese_reading_applied'
  | 'japanese_reading_context_required'
  | 'ambiguous_japanese_reading'
  | 'japanese_reading_context_mismatch'
  | 'japanese_reading_evidence_rejected'
  | 'japanese_reading_insufficient_corroboration'
  | 'script_transliteration_applied'
  | 'machine_transliteration_review_recommended'
  | 'transliteration_incomplete'
  | 'restricted_source_review_required'
  | 'address_line_limit_exceeded'
  | 'line_length_exceeds_profile_limit';

export type RemainingAsianShippingEvidence = {
  authority: string;
  url: 'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions';
  memberCountryUrl: 'https://www.upu.int/en/Universal-Postal-Union/About-UPU/Member-Countries';
  checkedOn: '2026-07-25';
  version: 'UPU addressing reference checked 2026-07-25';
  reuseStatus: 'reference-only-no-postal-dataset-copied';
  correctionPath: 'mailto:postcode@upu.int';
  scope: 'destination-format-postcode-shape-language-and-script-policy-only';
};

export type RemainingAsianShippingProfile = {
  countryCode: string;
  nativeLanguages: readonly string[];
  enhancedDomesticLanguages: readonly string[];
  defaultLanguage: string;
  domesticCountryNames: Readonly<Record<string, string>>;
  englishCountryName: string;
  designatedOperatorReference: string;
  domesticOrder: RemainingAsianAddressOrder;
  domesticStreetOrder: RemainingAsianStreetOrder;
  postcodePattern: string | null;
  postcodeRequired: boolean;
  postcodeUniversal: boolean;
  uppercaseLocality: boolean;
  restrictedSourceScope: boolean;
  maxDomesticLines: number;
  maxInternationalLines: number;
  maxLineLength: number;
  evidence: RemainingAsianShippingEvidence;
};

export type RemainingAsianShippingBuildOptions = {
  domesticLanguage?: string;
  englishAliases?: Partial<Record<RemainingAsianAliasField, string>>;
  japaneseReadingRecords?: readonly JapaneseContextualReadingRecord[];
  japaneseReadingEvidenceAsOf?: string;
  japaneseReadingMaxReviewAgeDays?: number;
  japaneseReadingMinimumIndependentAuthorities?: number;
};

export type RemainingAsianShippingAddressResult = {
  mode: RemainingAsianShippingMode;
  outputLanguage: string;
  profile: RemainingAsianShippingProfile | null;
  normalized: CanonicalAddress;
  lines: string[];
  formatted: string;
  changedFields: Array<keyof CanonicalAddress>;
  translatedFields: Array<keyof CanonicalAddress>;
  romanizationMethods: Partial<
    Record<RemainingAsianAliasField, RemainingAsianRomanizationMethod>
  >;
  appliedScripts: AsianShippingScript[];
  preservedDeliveryFields: Array<
    'building' | 'road' | 'house_number' | 'subdistrict' | 'district' | 'city' | 'state'
  >;
  appliedRules: string[];
  warnings: RemainingAsianShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
  evidence: RemainingAsianShippingEvidence | null;
};

const UPU_ADDRESSING_URL =
  'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions' as const;
const UPU_MEMBER_COUNTRIES_URL =
  'https://www.upu.int/en/Universal-Postal-Union/About-UPU/Member-Countries' as const;

function evidence(countryCode: string): RemainingAsianShippingEvidence {
  return {
    authority: `UPU designated-operator reference for ${countryCode}`,
    url: UPU_ADDRESSING_URL,
    memberCountryUrl: UPU_MEMBER_COUNTRIES_URL,
    checkedOn: '2026-07-25',
    version: 'UPU addressing reference checked 2026-07-25',
    reuseStatus: 'reference-only-no-postal-dataset-copied',
    correctionPath: 'mailto:postcode@upu.int',
    scope: 'destination-format-postcode-shape-language-and-script-policy-only',
  };
}

function profile(
  countryCode: string,
  nativeLanguages: readonly string[],
  defaultLanguage: string,
  domesticCountryNames: Readonly<Record<string, string>>,
  englishCountryName: string,
  postcodePattern: string | null,
  options: Partial<Pick<
    RemainingAsianShippingProfile,
    | 'domesticOrder'
    | 'domesticStreetOrder'
    | 'postcodeRequired'
    | 'postcodeUniversal'
    | 'uppercaseLocality'
    | 'restrictedSourceScope'
    | 'maxDomesticLines'
    | 'maxInternationalLines'
    | 'maxLineLength'
  >> = {},
): RemainingAsianShippingProfile {
  return {
    countryCode,
    nativeLanguages,
    enhancedDomesticLanguages: nativeLanguages.filter(language => language !== 'en'),
    defaultLanguage,
    domesticCountryNames,
    englishCountryName,
    designatedOperatorReference: `UPU member-country designated operator (${countryCode})`,
    domesticOrder: options.domesticOrder ?? 'small-to-big',
    domesticStreetOrder: options.domesticStreetOrder ?? 'number-road',
    postcodePattern,
    postcodeRequired: options.postcodeRequired ?? true,
    postcodeUniversal: options.postcodeUniversal ?? Boolean(postcodePattern),
    uppercaseLocality: options.uppercaseLocality ?? false,
    restrictedSourceScope: options.restrictedSourceScope ?? false,
    maxDomesticLines: options.maxDomesticLines ?? 7,
    maxInternationalLines: options.maxInternationalLines ?? 8,
    maxLineLength: options.maxLineLength ?? 45,
    evidence: evidence(countryCode),
  };
}

const REMAINING_ASIAN_SHIPPING_PROFILES = {
  JP: profile('JP', ['ja'], 'ja', { ja: '日本' }, 'Japan', '^\\d{3}-\\d{4}$', {
    domesticOrder: 'big-to-small',
    domesticStreetOrder: 'road-number',
    maxLineLength: 40,
  }),
  KR: profile('KR', ['ko'], 'ko', { ko: '대한민국' }, 'Republic of Korea', '^\\d{5}$', {
    domesticOrder: 'big-to-small',
    domesticStreetOrder: 'road-number',
  }),
  KP: profile('KP', ['ko'], 'ko', { ko: '조선민주주의인민공화국' }, "Democratic People's Republic of Korea", '^\\d{3}-\\d{3}$', {
    domesticOrder: 'big-to-small',
    domesticStreetOrder: 'road-number',
    postcodeRequired: false,
    postcodeUniversal: false,
    restrictedSourceScope: true,
  }),
  MN: profile('MN', ['mn'], 'mn', { mn: 'Монгол Улс' }, 'Mongolia', '^\\d{5}$', {
    postcodeRequired: false,
  }),
  BN: profile('BN', ['ms'], 'ms', { ms: 'Brunei Darussalam' }, 'Brunei Darussalam', '^[A-Z]{2} \\d{4}$'),
  KH: profile('KH', ['km'], 'km', { km: 'កម្ពុជា' }, 'Cambodia', '^\\d{5,6}$', {
    postcodeRequired: false,
  }),
  ID: profile('ID', ['id'], 'id', { id: 'Indonesia' }, 'Indonesia', '^\\d{5}$'),
  LA: profile('LA', ['lo'], 'lo', { lo: 'ລາວ' }, "Lao People's Democratic Republic", '^\\d{5}$', {
    postcodeRequired: false,
  }),
  MY: profile('MY', ['ms'], 'ms', { ms: 'Malaysia' }, 'Malaysia', '^\\d{5}$'),
  MM: profile('MM', ['my'], 'my', { my: 'မြန်မာ' }, 'Myanmar', '^\\d{5}$', {
    postcodeRequired: false,
  }),
  PH: profile('PH', ['tl', 'en'], 'tl', { tl: 'Pilipinas', en: 'Philippines' }, 'Philippines', '^\\d{4}$', {
    postcodeRequired: false,
  }),
  SG: profile('SG', ['en', 'ms', 'zh-Hans', 'ta'], 'en', {
    en: 'Singapore', ms: 'Singapura', 'zh-Hans': '新加坡', ta: 'சிங்கப்பூர்',
  }, 'Singapore', '^\\d{6}$', {
    uppercaseLocality: true,
  }),
  TH: profile('TH', ['th'], 'th', { th: 'ประเทศไทย' }, 'Thailand', '^\\d{5}$'),
  TL: profile('TL', ['tet', 'pt'], 'tet', { tet: 'Timor-Leste', pt: 'Timor-Leste' }, 'Timor-Leste', '^\\d{5}$', {
    postcodeRequired: false,
    postcodeUniversal: false,
  }),
  VN: profile('VN', ['vi'], 'vi', { vi: 'Việt Nam' }, 'Viet Nam', '^\\d{5,6}$'),
  AF: profile('AF', ['ps', 'fa', 'en'], 'ps', {
    ps: 'افغانستان', fa: 'افغانستان', en: 'Afghanistan',
  }, 'Afghanistan', '^\\d{4}$', {
    restrictedSourceScope: true,
  }),
  BD: profile('BD', ['bn', 'en'], 'bn', { bn: 'বাংলাদেশ', en: 'Bangladesh' }, 'Bangladesh', '^\\d{4}$'),
  BT: profile('BT', ['dz', 'en'], 'dz', { dz: 'འབྲུག', en: 'Bhutan' }, 'Bhutan', '^\\d{5}$'),
  IN: profile('IN', ['en', 'hi', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'pa', 'or', 'mr', 'as', 'ur'], 'en', {
    en: 'India',
    hi: 'भारत',
    bn: 'ভারত',
    ta: 'இந்தியா',
    te: 'భారతదేశం',
    kn: 'ಭಾರತ',
    ml: 'ഇന്ത്യ',
    gu: 'ભારત',
    pa: 'ਭਾਰਤ',
    or: 'ଭାରତ',
    mr: 'भारत',
    as: 'ভাৰত',
    ur: 'بھارت',
  }, 'India', '^\\d{6}$'),
  MV: profile('MV', ['dv', 'en'], 'dv', {
    dv: 'ދިވެހިރާއްޖެ', en: 'Maldives',
  }, 'Maldives', '^\\d{5}$'),
  NP: profile('NP', ['ne', 'en'], 'ne', { ne: 'नेपाल', en: 'Nepal' }, 'Nepal', '^\\d{5}$'),
  PK: profile('PK', ['ur', 'en'], 'ur', { ur: 'پاکستان', en: 'Pakistan' }, 'Pakistan', '^\\d{5}$'),
  LK: profile('LK', ['si', 'ta', 'en'], 'si', {
    si: 'ශ්‍රී ලංකාව', ta: 'இலங்கை', en: 'Sri Lanka',
  }, 'Sri Lanka', '^\\d{5}$'),
  KZ: profile('KZ', ['kk', 'ru'], 'kk', { kk: 'Қазақстан', ru: 'Казахстан' }, 'Kazakhstan', '^\\d{6}$'),
  KG: profile('KG', ['ky', 'ru'], 'ky', { ky: 'Кыргызстан', ru: 'Киргизия' }, 'Kyrgyzstan', '^\\d{6}$'),
  TJ: profile('TJ', ['tg', 'ru'], 'tg', { tg: 'Тоҷикистон', ru: 'Таджикистан' }, 'Tajikistan', '^\\d{6}$'),
  TM: profile('TM', ['tk', 'ru'], 'tk', { tk: 'Türkmenistan', ru: 'Туркменистан' }, 'Turkmenistan', '^\\d{6}$'),
  UZ: profile('UZ', ['uz', 'ru'], 'uz', { uz: "O'zbekiston", ru: 'Узбекистан' }, 'Uzbekistan', '^\\d{6}$'),
  IR: profile('IR', ['fa'], 'fa', { fa: 'ایران' }, 'Iran', '^\\d{10}$', {
    restrictedSourceScope: true,
  }),
  IL: profile('IL', ['he', 'ar', 'en'], 'he', {
    he: 'ישראל', ar: 'إسرائيل', en: 'Israel',
  }, 'Israel', '^\\d{7}$'),
  TR: profile('TR', ['tr'], 'tr', { tr: 'Türkiye' }, 'Türkiye', '^\\d{5}$'),
} as const satisfies Record<string, RemainingAsianShippingProfile>;

export type RemainingAsianShippingCountryCode =
  keyof typeof REMAINING_ASIAN_SHIPPING_PROFILES;

export const REMAINING_ASIAN_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(REMAINING_ASIAN_SHIPPING_PROFILES) as RemainingAsianShippingCountryCode[],
);

const INTERNATIONAL_LOCALITY_ALIASES: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  JP: {
    '東京': 'Tokyo',
    '大阪': 'Osaka',
    '京都': 'Kyoto',
    '横浜': 'Yokohama',
  },
  KR: {
    '서울': 'Seoul',
    '부산': 'Busan',
    '인천': 'Incheon',
    '대구': 'Daegu',
  },
  KP: { '평양': 'Pyongyang' },
  MN: { 'Улаанбаатар': 'Ulaanbaatar' },
  KH: { 'ភ្នំពេញ': 'Phnom Penh' },
  LA: { 'ວຽງຈັນ': 'Vientiane' },
  MM: {
    'ရန်ကုန်': 'Yangon',
    'နေပြည်တော်': 'Nay Pyi Taw',
  },
  TH: { 'กรุงเทพมหานคร': 'Bangkok' },
  BD: { 'ঢাকা': 'Dhaka' },
  BT: { 'ཐིམ་ཕུ་': 'Thimphu' },
  IN: {
    'नई दिल्ली': 'New Delhi',
    'मुंबई': 'Mumbai',
    'बेंगलुरु': 'Bengaluru',
    'কলকাতা': 'Kolkata',
    'சென்னை': 'Chennai',
  },
  NP: { 'काठमाडौं': 'Kathmandu' },
  PK: {
    'اسلام آباد': 'Islamabad',
    'کراچی': 'Karachi',
    'لاہور': 'Lahore',
  },
  LK: { 'කොළඹ': 'Colombo', 'கொழும்பு': 'Colombo' },
  KZ: { 'Астана': 'Astana', 'Алматы': 'Almaty' },
  KG: { 'Бишкек': 'Bishkek' },
  TJ: { 'Душанбе': 'Dushanbe' },
  TM: { 'Ашхабад': 'Ashgabat', 'Aşgabat': 'Ashgabat' },
  UZ: { 'Тошкент': 'Tashkent', 'Toshkent': 'Tashkent' },
  IR: { 'تهران': 'Tehran' },
  IL: {
    'ירושלים': 'Jerusalem',
    'תל אביב-יפו': 'Tel Aviv-Yafo',
    'القدس': 'Jerusalem',
  },
  TR: { 'İstanbul': 'Istanbul' },
};

function clean(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedLanguage(language: string | undefined | null) {
  return normalizeLanguageCode(language, { emptyFallback: '' });
}

function countryCodeOf(countryCode: string): RemainingAsianShippingCountryCode | '' {
  const normalized = clean(countryCode).toUpperCase();
  return REMAINING_ASIAN_SHIPPING_COUNTRY_CODES.includes(
    normalized as RemainingAsianShippingCountryCode,
  )
    ? normalized as RemainingAsianShippingCountryCode
    : '';
}

export function isRemainingAsianShippingCountry(countryCode: string) {
  return Boolean(countryCodeOf(countryCode));
}

export function getRemainingAsianShippingProfile(countryCode: string) {
  const code = countryCodeOf(countryCode);
  return code ? REMAINING_ASIAN_SHIPPING_PROFILES[code] : null;
}

export function supportsRemainingAsianDomesticLanguage(
  countryCode: string,
  language: string,
) {
  const shippingProfile = getRemainingAsianShippingProfile(countryCode);
  if (!shippingProfile) return false;
  const normalized = normalizedLanguage(language);
  return shippingProfile.enhancedDomesticLanguages.some(
    candidate => normalizedLanguage(candidate) === normalized,
  );
}

export function prefersRemainingAsianInternationalRenderer(countryCode: string) {
  return isRemainingAsianShippingCountry(countryCode);
}

function languageOf(
  language: string | undefined,
  shippingProfile: RemainingAsianShippingProfile,
) {
  const requested = normalizedLanguage(language);
  return shippingProfile.nativeLanguages.find(
    candidate => normalizedLanguage(candidate) === requested,
  ) ?? shippingProfile.defaultLanguage;
}

function normalizePostcode(
  value: unknown,
  shippingProfile: RemainingAsianShippingProfile,
) {
  const source = clean(value).toUpperCase();
  if (!source) return '';
  const compact = source.replace(/[^A-Z0-9]/g, '');
  if (shippingProfile.countryCode === 'JP' && /^\d{7}$/.test(compact)) {
    return `${compact.slice(0, 3)}-${compact.slice(3)}`;
  }
  if (shippingProfile.countryCode === 'KP' && /^\d{6}$/.test(compact)) {
    return `${compact.slice(0, 3)}-${compact.slice(3)}`;
  }
  if (shippingProfile.countryCode === 'BN' && /^[A-Z]{2}\d{4}$/.test(compact)) {
    return `${compact.slice(0, 2)} ${compact.slice(2)}`;
  }
  return compact;
}

function internationalAlias(countryCode: string, value: string) {
  return INTERNATIONAL_LOCALITY_ALIASES[countryCode]?.[value] ?? '';
}

function romanizeField(input: {
  shippingProfile: RemainingAsianShippingProfile;
  field: RemainingAsianAliasField;
  value: string;
  address: CanonicalAddress;
  options: RemainingAsianShippingBuildOptions;
}) {
  const { shippingProfile, field, options } = input;
  const value = clean(input.value);
  if (!value) {
    return {
      text: '',
      method: 'not-applicable' as RemainingAsianRomanizationMethod,
      scripts: [] as AsianShippingScript[],
      incomplete: false,
    };
  }
  const callerAlias = clean(options.englishAliases?.[field]);
  if (callerAlias) {
    return {
      text: callerAlias,
      method: 'caller-approved-alias' as RemainingAsianRomanizationMethod,
      scripts: [] as AsianShippingScript[],
      incomplete: containsAsianDestinationScript(callerAlias),
    };
  }
  let japaneseReadingStatus: JapaneseContextualReadingResolution['status'] | undefined;
  if (shippingProfile.countryCode === 'JP') {
    const reading = resolveJapaneseContextualReading({
      field,
      nativeName: value,
      address: input.address,
      records: options.japaneseReadingRecords,
      evidencePolicy: {
        asOf: options.japaneseReadingEvidenceAsOf,
        maxReviewAgeDays: options.japaneseReadingMaxReviewAgeDays,
        minimumIndependentAuthorities:
          options.japaneseReadingMinimumIndependentAuthorities,
      },
    });
    japaneseReadingStatus = reading.status;
    const japaneseReadingEvidenceRejected = reading.rejectedRecordIds.length > 0;
    if (reading.status === 'resolved') {
      return {
        text: reading.romanizedName,
        method: 'contextual-authoritative-reading' as RemainingAsianRomanizationMethod,
        scripts: [] as AsianShippingScript[],
        incomplete: false,
        japaneseReadingStatus,
        japaneseReadingEvidenceRejected,
      };
    }
    if (
      reading.status === 'context-required'
      || reading.status === 'ambiguous'
      || reading.status === 'context-mismatch'
      || reading.status === 'insufficient-corroboration'
    ) {
      return {
        text: value,
        method: 'context-required' as RemainingAsianRomanizationMethod,
        scripts: [] as AsianShippingScript[],
        incomplete: true,
        japaneseReadingStatus,
        japaneseReadingEvidenceRejected,
      };
    }
    const normalizedJapanese = field === 'building' || field === 'poi'
      ? normalizeEnglishAddressBuildingName(value, 'JP')
      : normalizeEnglishAddressPart(value, 'JP');
    if (normalizedJapanese && !containsAsianDestinationScript(normalizedJapanese)) {
      return {
        text: normalizedJapanese,
        method: 'deterministic-script-transliteration' as RemainingAsianRomanizationMethod,
        scripts: containsAsianDestinationScript(value)
          ? ['japanese' as AsianShippingScript]
          : [],
        incomplete: false,
        japaneseReadingStatus,
        japaneseReadingEvidenceRejected,
      };
    }
  }
  if (field === 'city' || field === 'district' || field === 'state') {
    const curated = internationalAlias(shippingProfile.countryCode, value);
    if (curated) {
      return {
        text: curated,
        method: 'curated-place-alias' as RemainingAsianRomanizationMethod,
        scripts: [] as AsianShippingScript[],
        incomplete: false,
        japaneseReadingStatus,
      };
    }
  }
  const transliterated = transliterateAsianShippingText(value, {
    countryCode: shippingProfile.countryCode,
    language: shippingProfile.defaultLanguage,
  });
  return {
    text: transliterated.text,
    method: transliterated.appliedScripts.length
      ? 'deterministic-script-transliteration' as RemainingAsianRomanizationMethod
      : 'preserved-latin' as RemainingAsianRomanizationMethod,
    scripts: transliterated.appliedScripts,
    incomplete: transliterated.incomplete,
    japaneseReadingStatus,
  };
}

function normalizeCanonical(
  data: CanonicalAddress,
  shippingProfile: RemainingAsianShippingProfile,
  mode: RemainingAsianShippingMode,
  language: string,
  options: RemainingAsianShippingBuildOptions,
) {
  const normalized = { ...data };
  const romanizationMethods: RemainingAsianShippingAddressResult['romanizationMethods'] = {};
  const appliedScripts = new Set<AsianShippingScript>();
  const japaneseReadingStatuses = new Set<
    Exclude<JapaneseContextualReadingResolution['status'], 'unmatched'>
  >();
  let japaneseReadingEvidenceRejected = false;
  let transliterationIncomplete = false;

  for (const field of [
    'building',
    'poi',
    'road',
    'subdistrict',
    'district',
    'city',
    'state',
  ] as RemainingAsianAliasField[]) {
    const value = clean(data[field]);
    if (mode === 'domestic') {
      normalized[field] = value;
      continue;
    }
    const result = romanizeField({
      shippingProfile,
      field,
      value,
      address: data,
      options,
    });
    normalized[field] = result.text;
    romanizationMethods[field] = result.method;
    result.scripts.forEach(script => appliedScripts.add(script));
    if (result.japaneseReadingStatus && result.japaneseReadingStatus !== 'unmatched') {
      japaneseReadingStatuses.add(result.japaneseReadingStatus);
    }
    japaneseReadingEvidenceRejected ||= result.japaneseReadingEvidenceRejected ?? false;
    transliterationIncomplete ||= result.incomplete;
  }

  normalized.country_code = shippingProfile.countryCode;
  normalized.country = mode === 'international-shipping'
    ? shippingProfile.englishCountryName
    : shippingProfile.domesticCountryNames[language]
      ?? shippingProfile.domesticCountryNames[shippingProfile.defaultLanguage]
      ?? clean(data.country);
  normalized.postcode = normalizePostcode(data.postcode, shippingProfile);
  normalized.house_number = clean(data.house_number);
  normalized.po_box = clean(data.po_box);
  normalized.unit = clean(data.unit);
  normalized.floor = clean(data.floor);
  normalized.block = clean(data.block);

  const changedFields = (Object.keys(normalized) as Array<keyof CanonicalAddress>).filter(
    key => clean(data[key]) !== clean(normalized[key]),
  );
  const translatedFields = changedFields.filter(
    key => key !== 'country_code' && key !== 'postcode',
  );

  return {
    normalized,
    changedFields,
    translatedFields,
    romanizationMethods,
    appliedScripts: [...appliedScripts],
    transliterationIncomplete,
    japaneseReadingStatuses: [...japaneseReadingStatuses],
    japaneseReadingEvidenceRejected,
  };
}

function comparable(value: string) {
  return clean(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function uniqueLines(lines: Array<string | undefined>) {
  const seen = new Set<string>();
  return lines
    .map(clean)
    .filter(Boolean)
    .filter(line => {
      const key = comparable(line);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function streetLine(
  data: CanonicalAddress,
  order: RemainingAsianStreetOrder,
) {
  const road = clean(data.road);
  const number = clean(data.house_number);
  if (!road) return number;
  if (!number) return road;
  return order === 'road-number' ? `${road} ${number}` : `${number} ${road}`;
}

function unitLine(data: CanonicalAddress) {
  return [data.block, data.floor, data.unit].map(clean).filter(Boolean).join(' ');
}

function renderDomesticLines(
  data: CanonicalAddress,
  shippingProfile: RemainingAsianShippingProfile,
) {
  const organization = data.building || data.poi;
  const street = data.po_box || streetLine(data, shippingProfile.domesticStreetOrder);
  const area = data.subdistrict || data.suburb;
  const city = shippingProfile.uppercaseLocality ? clean(data.city).toUpperCase() : data.city;
  const locality = [city, data.state, data.postcode].map(clean).filter(Boolean).join(' ');

  if (shippingProfile.domesticOrder === 'big-to-small') {
    const postcodeLine = shippingProfile.countryCode === 'JP'
      ? data.postcode && `〒${data.postcode}`
      : data.postcode;
    return uniqueLines([
      postcodeLine,
      [data.state, city, data.district].map(clean).filter(Boolean).join(' '),
      area,
      street,
      unitLine(data),
      organization,
    ]);
  }

  return uniqueLines([
    organization,
    street,
    unitLine(data),
    area,
    data.district,
    locality,
  ]);
}

function renderInternationalLines(
  data: CanonicalAddress,
  shippingProfile: RemainingAsianShippingProfile,
) {
  const organization = data.building || data.poi;
  const street = data.po_box || streetLine(data, 'number-road');
  const area = data.subdistrict || data.suburb;
  if (shippingProfile.countryCode === 'JP') {
    return uniqueLines([
      organization,
      street,
      unitLine(data),
      [area, data.district, data.city].map(clean).filter(Boolean).join(', '),
      [data.state, data.postcode].map(clean).filter(Boolean).join(' '),
      shippingProfile.englishCountryName.toUpperCase(),
    ]);
  }
  const locality = [data.city, data.state, data.postcode]
    .map(clean)
    .filter(Boolean)
    .join(' ');
  return uniqueLines([
    organization,
    street,
    unitLine(data),
    area,
    data.district,
    locality,
    shippingProfile.englishCountryName.toUpperCase(),
  ]);
}

function unsupportedResult(
  data: CanonicalAddress,
  mode: RemainingAsianShippingMode,
): RemainingAsianShippingAddressResult {
  const lines = uniqueLines([
    data.building || data.poi,
    data.po_box || streetLine(data, 'number-road'),
    data.subdistrict || data.suburb || data.district,
    [data.city, data.state, data.postcode].filter(Boolean).join(' '),
    mode === 'international-shipping' ? clean(data.country).toUpperCase() : '',
  ]);
  return {
    mode,
    outputLanguage: mode === 'international-shipping' ? 'en' : 'local',
    profile: null,
    normalized: { ...data },
    lines,
    formatted: lines.join('\n'),
    changedFields: [],
    translatedFields: [],
    romanizationMethods: {},
    appliedScripts: [],
    preservedDeliveryFields: [
      'building', 'road', 'house_number', 'subdistrict', 'district', 'city', 'state',
    ],
    appliedRules: ['conservative-remaining-asian-address-fallback'],
    warnings: [
      'delivery_point_not_validated',
      'postcode_locality_pair_not_verified',
      'unsupported_country_profile',
    ],
    formatStatus: 'needs-review',
    deliveryPointValidated: false,
    evidence: null,
  };
}

export function buildRemainingAsianShippingAddress(
  data: CanonicalAddress,
  mode: RemainingAsianShippingMode,
  options: RemainingAsianShippingBuildOptions = {},
): RemainingAsianShippingAddressResult {
  const shippingProfile = getRemainingAsianShippingProfile(data.country_code);
  if (!shippingProfile) return unsupportedResult(data, mode);

  const requestedLanguage = normalizedLanguage(options.domesticLanguage);
  const language = mode === 'international-shipping'
    ? 'en'
    : languageOf(options.domesticLanguage, shippingProfile);
  const normalizedResult = normalizeCanonical(
    data,
    shippingProfile,
    mode,
    language,
    options,
  );
  const {
    normalized,
    changedFields,
    translatedFields,
    romanizationMethods,
    appliedScripts,
    transliterationIncomplete,
    japaneseReadingStatuses,
    japaneseReadingEvidenceRejected,
  } = normalizedResult;
  const lines = mode === 'international-shipping'
    ? renderInternationalLines(normalized, shippingProfile)
    : renderDomesticLines(normalized, shippingProfile);
  const warnings: RemainingAsianShippingWarning[] = [
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
  ];

  if (
    mode === 'domestic'
    && requestedLanguage
    && !shippingProfile.nativeLanguages.some(
      candidate => normalizedLanguage(candidate) === requestedLanguage,
    )
  ) {
    warnings.push('unsupported_domestic_language');
  }
  if (!normalized.road && !normalized.po_box) warnings.push('missing_delivery_line');
  if (!normalized.city && !normalized.subdistrict && !normalized.district) {
    warnings.push('missing_locality');
  }
  if (!normalized.postcode && shippingProfile.postcodeRequired) {
    warnings.push('missing_postcode');
  } else if (
    normalized.postcode
    && shippingProfile.postcodePattern
    && !new RegExp(shippingProfile.postcodePattern).test(normalized.postcode)
  ) {
    warnings.push('invalid_postcode_format');
  }
  if (!shippingProfile.postcodeUniversal) warnings.push('postcode_not_universal');
  if (Object.values(romanizationMethods).includes('caller-approved-alias')) {
    warnings.push('caller_approved_alias_applied');
  }
  if (Object.values(romanizationMethods).includes('curated-place-alias')) {
    warnings.push('curated_locality_alias_applied');
  }
  if (japaneseReadingStatuses.includes('resolved')) {
    warnings.push('contextual_japanese_reading_applied');
  }
  if (japaneseReadingStatuses.includes('context-required')) {
    warnings.push('japanese_reading_context_required');
  }
  if (japaneseReadingStatuses.includes('ambiguous')) {
    warnings.push('ambiguous_japanese_reading');
  }
  if (japaneseReadingStatuses.includes('context-mismatch')) {
    warnings.push('japanese_reading_context_mismatch');
  }
  if (japaneseReadingEvidenceRejected) {
    warnings.push('japanese_reading_evidence_rejected');
  }
  if (japaneseReadingStatuses.includes('insufficient-corroboration')) {
    warnings.push('japanese_reading_insufficient_corroboration');
  }
  if (mode === 'international-shipping' && appliedScripts.length) {
    warnings.push(
      'script_transliteration_applied',
      'machine_transliteration_review_recommended',
    );
  }
  if (
    mode === 'international-shipping'
    && (
      transliterationIncomplete
      || lines.some(containsAsianDestinationScript)
    )
  ) {
    warnings.push('transliteration_incomplete');
  }
  if (shippingProfile.restrictedSourceScope) {
    warnings.push('restricted_source_review_required');
  }

  const lineLimit = mode === 'international-shipping'
    ? shippingProfile.maxInternationalLines
    : shippingProfile.maxDomesticLines;
  if (lines.length > lineLimit) warnings.push('address_line_limit_exceeded');
  if (lines.some(line => line.length > shippingProfile.maxLineLength)) {
    warnings.push('line_length_exceeds_profile_limit');
  }

  const informationalWarnings = new Set<RemainingAsianShippingWarning>([
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
    'postcode_not_universal',
    'caller_approved_alias_applied',
    'curated_locality_alias_applied',
    'contextual_japanese_reading_applied',
    'script_transliteration_applied',
    'machine_transliteration_review_recommended',
  ]);
  const formatStatus = warnings.some(warning => !informationalWarnings.has(warning))
    ? 'needs-review'
    : 'format-ready';

  return {
    mode,
    outputLanguage: language,
    profile: shippingProfile,
    normalized,
    lines,
    formatted: lines.join('\n'),
    changedFields,
    translatedFields,
    romanizationMethods,
    appliedScripts,
    preservedDeliveryFields: [
      'building', 'road', 'house_number', 'subdistrict', 'district', 'city', 'state',
    ],
    appliedRules: [
      `${shippingProfile.countryCode.toLowerCase()}-remaining-asia-postal-presentation-v1`,
      `${shippingProfile.domesticOrder}-domestic-line-order`,
      `domestic-language-${language}`,
      'preserve-destination-delivery-keys',
      'translate-only-country-and-curated-locality-aliases',
      'prefer-caller-approved-english-delivery-aliases',
      'resolve-japanese-readings-only-with-administrative-and-postcode-context',
      'gate-japanese-reading-rights-version-freshness-and-correction-evidence',
      'support-independent-authority-corroboration-for-japanese-readings',
      'do-not-guess-context-sensitive-japanese-place-readings',
      'deterministic-script-transliteration-with-residual-script-gate',
      'normalize-country-specific-postcode-shape',
      'omit-country-for-domestic-mail',
      'append-english-uppercase-country-for-international-mail',
      'never-claim-postcode-locality-or-delivery-point-validation-from-formatting',
    ],
    warnings,
    formatStatus,
    deliveryPointValidated: false,
    evidence: shippingProfile.evidence,
  };
}
