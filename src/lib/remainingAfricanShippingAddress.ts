import type { CanonicalAddress } from './addressRendering';
import {
  transliterateArabic,
  transliterateEthiopic,
  transliterateTifinagh,
} from './transliteration';

export type RemainingAfricanShippingMode = 'domestic' | 'international-shipping';
export type RemainingAfricanLayout =
  | 'postcode-locality'
  | 'locality-postcode'
  | 'po-box-oriented'
  | 'southern-africa';
export type RemainingAfricanScript =
  | 'latin'
  | 'arabic'
  | 'ethiopic'
  | 'tifinagh'
  | 'multiscript';

export type RemainingAfricanShippingWarning =
  | 'delivery_point_not_validated'
  | 'postcode_locality_pair_not_verified'
  | 'unsupported_country_profile'
  | 'unsupported_domestic_language'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'invalid_postcode_format'
  | 'postcode_not_universal'
  | 'multilingual_locality_alias_applied'
  | 'transliteration_applied'
  | 'transliteration_incomplete'
  | 'neutral_scope_review_required'
  | 'address_line_limit_exceeded'
  | 'line_length_exceeds_profile_limit';

export type RemainingAfricanShippingEvidence = {
  authority: string;
  url: 'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions';
  checkedOn: '2026-07-25';
  version: 'UPU PAS live reference checked 2026-07-25';
  reuseStatus: 'reference-only-no-postal-dataset-copied';
  correctionPath: 'mailto:postcode@upu.int';
  scope:
    | 'destination-format-postcode-shape-language-and-script-policy-only'
    | 'neutral-destination-label-scope-only';
};

export type RemainingAfricanShippingProfile = {
  countryCode: string;
  nativeLanguages: readonly string[];
  enhancedDomesticLanguages: readonly string[];
  defaultLanguage: string;
  domesticCountryNames: Readonly<Record<string, string>>;
  englishCountryName: string;
  designatedOperator: string;
  layout: RemainingAfricanLayout;
  script: RemainingAfricanScript;
  streetOrder: 'road-number' | 'number-road';
  postcodePattern: string | null;
  postcodeRequired: boolean;
  postcodeUniversal: boolean;
  uppercaseLocality: boolean;
  neutralScope: boolean;
  preferInternationalRenderer: boolean;
  maxDomesticLines: number;
  maxInternationalLines: number;
  maxLineLength: number;
  evidence: RemainingAfricanShippingEvidence;
};

export type RemainingAfricanShippingAddressResult = {
  mode: RemainingAfricanShippingMode;
  outputLanguage: string;
  profile: RemainingAfricanShippingProfile | null;
  normalized: CanonicalAddress;
  lines: string[];
  formatted: string;
  changedFields: Array<keyof CanonicalAddress>;
  translatedFields: Array<keyof CanonicalAddress>;
  preservedDeliveryFields: Array<
    'building' | 'road' | 'house_number' | 'subdistrict' | 'district' | 'city' | 'state'
  >;
  appliedRules: string[];
  warnings: RemainingAfricanShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
  evidence: RemainingAfricanShippingEvidence | null;
};

const UPU_ADDRESSING_URL =
  'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions' as const;

function evidence(
  authority: string,
  neutralScope = false,
): RemainingAfricanShippingEvidence {
  return {
    authority,
    url: UPU_ADDRESSING_URL,
    checkedOn: '2026-07-25',
    version: 'UPU PAS live reference checked 2026-07-25',
    reuseStatus: 'reference-only-no-postal-dataset-copied',
    correctionPath: 'mailto:postcode@upu.int',
    scope: neutralScope
      ? 'neutral-destination-label-scope-only'
      : 'destination-format-postcode-shape-language-and-script-policy-only',
  };
}

function profile(
  countryCode: string,
  nativeLanguages: readonly string[],
  enhancedDomesticLanguages: readonly string[],
  defaultLanguage: string,
  domesticCountryNames: Readonly<Record<string, string>>,
  englishCountryName: string,
  designatedOperator: string,
  postcodePattern: string | null,
  options: Partial<Pick<
    RemainingAfricanShippingProfile,
    | 'layout'
    | 'script'
    | 'streetOrder'
    | 'postcodeRequired'
    | 'postcodeUniversal'
    | 'uppercaseLocality'
    | 'neutralScope'
    | 'preferInternationalRenderer'
    | 'maxDomesticLines'
    | 'maxInternationalLines'
    | 'maxLineLength'
  >> = {},
): RemainingAfricanShippingProfile {
  const neutralScope = options.neutralScope ?? false;
  return {
    countryCode,
    nativeLanguages,
    enhancedDomesticLanguages,
    defaultLanguage,
    domesticCountryNames,
    englishCountryName,
    designatedOperator,
    layout: options.layout ?? 'postcode-locality',
    script: options.script ?? 'latin',
    streetOrder: options.streetOrder ?? 'road-number',
    postcodePattern,
    postcodeRequired: options.postcodeRequired ?? false,
    postcodeUniversal: options.postcodeUniversal ?? Boolean(postcodePattern),
    uppercaseLocality: options.uppercaseLocality ?? false,
    neutralScope,
    preferInternationalRenderer: options.preferInternationalRenderer ?? false,
    maxDomesticLines: options.maxDomesticLines ?? 7,
    maxInternationalLines: options.maxInternationalLines ?? 8,
    maxLineLength: options.maxLineLength ?? 45,
    evidence: evidence(designatedOperator, neutralScope),
  };
}

const REMAINING_AFRICAN_SHIPPING_PROFILES = {
  DZ: profile('DZ', ['ar', 'fr', 'kab'], ['kab'], 'ar', {
    ar: 'الجزائر', fr: 'Algérie', kab: 'ⴷⵣⴰⵢⴻⵔ',
  }, 'Algeria', 'Algérie Poste', '^\\d{5}$', {
    script: 'multiscript',
    postcodeRequired: true,
  }),
  MA: profile('MA', ['ar', 'zgh', 'fr'], ['zgh'], 'ar', {
    ar: 'المغرب', zgh: 'ⵍⵎⵖⵔⵉⴱ', fr: 'Maroc',
  }, 'Morocco', 'Poste Maroc', '^\\d{5}$', {
    script: 'multiscript',
    postcodeRequired: true,
  }),
  AO: profile('AO', ['pt'], ['pt'], 'pt', {
    pt: 'Angola',
  }, 'Angola', 'Correios de Angola', '^\\d{4}$', {
    postcodeUniversal: false,
    preferInternationalRenderer: true,
  }),
  BI: profile('BI', ['rn', 'fr'], ['rn'], 'rn', {
    rn: 'Uburundi', fr: 'Burundi',
  }, 'Burundi', 'Régie Nationale des Postes du Burundi', null, {
    postcodeUniversal: false,
    layout: 'po-box-oriented',
  }),
  BW: profile('BW', ['en', 'tn'], ['tn'], 'en', {
    en: 'Botswana', tn: 'Botswana',
  }, 'Botswana', 'BotswanaPost', '^[A-Z]{2} \\d{3}$', {
    layout: 'southern-africa',
    streetOrder: 'number-road',
    postcodeUniversal: false,
  }),
  CV: profile('CV', ['pt'], ['pt'], 'pt', {
    pt: 'Cabo Verde',
  }, 'Cabo Verde', 'Correios de Cabo Verde', '^\\d{4}$', {
    postcodeUniversal: false,
    preferInternationalRenderer: true,
  }),
  CF: profile('CF', ['fr', 'sg'], ['sg'], 'fr', {
    fr: 'République centrafricaine', sg: 'Ködörösêse tî Bêafrîka',
  }, 'Central African Republic', 'Office national de la poste', null, {
    postcodeUniversal: false,
    layout: 'po-box-oriented',
  }),
  KM: profile('KM', ['fr', 'ar', 'zdj'], ['zdj'], 'fr', {
    fr: 'Comores', ar: 'جزر القمر', zdj: 'Komori',
  }, 'Comoros', 'SNPSF Comoros', null, {
    script: 'multiscript',
    postcodeUniversal: false,
    layout: 'po-box-oriented',
  }),
  ER: profile('ER', ['ti', 'en', 'ar'], ['ti', 'ar'], 'ti', {
    ti: 'ኤርትራ', en: 'Eritrea', ar: 'إريتريا',
  }, 'Eritrea', 'Eritrean Postal Service', '^\\d{4}$', {
    script: 'multiscript',
    postcodeUniversal: false,
    layout: 'po-box-oriented',
    preferInternationalRenderer: true,
  }),
  SZ: profile('SZ', ['en', 'ss'], ['ss'], 'en', {
    en: 'Eswatini', ss: 'eSwatini',
  }, 'Eswatini', 'Eswatini Posts and Telecommunications', '^[A-Z] \\d{3}$', {
    layout: 'southern-africa',
    streetOrder: 'number-road',
    postcodeUniversal: false,
  }),
  ET: profile('ET', ['am', 'en', 'om', 'ti', 'so'], ['am', 'om', 'ti', 'so'], 'am', {
    am: 'ኢትዮጵያ', en: 'Ethiopia', om: 'Itoophiyaa', ti: 'ኢትዮጵያ', so: 'Itoobiya',
  }, 'Ethiopia', 'Ethiopost', '^\\d{4}$', {
    script: 'multiscript',
    postcodeUniversal: false,
    layout: 'po-box-oriented',
    preferInternationalRenderer: true,
  }),
  GQ: profile('GQ', ['es', 'fr', 'pt'], ['fr', 'pt'], 'es', {
    es: 'Guinea Ecuatorial', fr: 'Guinée équatoriale', pt: 'Guiné Equatorial',
  }, 'Equatorial Guinea', 'UPU designated operator for Equatorial Guinea', null, {
    postcodeUniversal: false,
    layout: 'po-box-oriented',
    preferInternationalRenderer: true,
  }),
  GW: profile('GW', ['pt'], ['pt'], 'pt', {
    pt: 'Guiné-Bissau',
  }, 'Guinea-Bissau', 'Correios da Guiné-Bissau', '^\\d{4}$', {
    postcodeUniversal: false,
    preferInternationalRenderer: true,
  }),
  KE: profile('KE', ['en', 'sw'], ['sw'], 'en', {
    en: 'Kenya', sw: 'Kenya',
  }, 'Kenya', 'Postal Corporation of Kenya', '^\\d{5}$', {
    postcodeRequired: true,
    layout: 'po-box-oriented',
    uppercaseLocality: true,
  }),
  LS: profile('LS', ['en', 'st'], ['st'], 'en', {
    en: 'Lesotho', st: 'Lesotho',
  }, 'Lesotho', 'Lesotho Post', '^\\d{3}$', {
    layout: 'southern-africa',
    streetOrder: 'number-road',
    postcodeUniversal: false,
  }),
  MG: profile('MG', ['mg', 'fr'], ['mg'], 'mg', {
    mg: 'Madagasikara', fr: 'Madagascar',
  }, 'Madagascar', 'Paositra Malagasy', '^\\d{3}$', {
    postcodeRequired: true,
    layout: 'po-box-oriented',
  }),
  MW: profile('MW', ['en', 'ny'], ['ny'], 'en', {
    en: 'Malawi', ny: 'Malawi',
  }, 'Malawi', 'Malawi Posts Corporation', '^\\d{6}$', {
    layout: 'southern-africa',
    streetOrder: 'number-road',
    postcodeUniversal: false,
  }),
  MU: profile('MU', ['en', 'fr', 'mfe'], ['mfe'], 'en', {
    en: 'Mauritius', fr: 'Maurice', mfe: 'Moris',
  }, 'Mauritius', 'Mauritius Post', '^\\d{5}$', {
    postcodeRequired: true,
    streetOrder: 'number-road',
  }),
  MZ: profile('MZ', ['pt'], ['pt'], 'pt', {
    pt: 'Moçambique',
  }, 'Mozambique', 'Correios de Moçambique', '^\\d{4}$', {
    postcodeRequired: true,
    preferInternationalRenderer: true,
  }),
  NA: profile('NA', ['en', 'af', 'kj'], ['af', 'kj'], 'en', {
    en: 'Namibia', af: 'Namibië', kj: 'Namibia',
  }, 'Namibia', 'NamPost', '^\\d{5}$', {
    layout: 'southern-africa',
    streetOrder: 'number-road',
    postcodeUniversal: false,
  }),
  RW: profile('RW', ['rw', 'en', 'fr', 'sw'], ['rw', 'sw'], 'rw', {
    rw: 'Rwanda', en: 'Rwanda', fr: 'Rwanda', sw: 'Rwanda',
  }, 'Rwanda', 'National Postal Corporation of Rwanda', '^\\d{4}$', {
    postcodeUniversal: false,
    layout: 'po-box-oriented',
  }),
  ST: profile('ST', ['pt'], ['pt'], 'pt', {
    pt: 'São Tomé e Príncipe',
  }, 'São Tomé and Príncipe', 'Correios de São Tomé e Príncipe', null, {
    postcodeUniversal: false,
    preferInternationalRenderer: true,
    layout: 'po-box-oriented',
  }),
  SC: profile('SC', ['en', 'fr', 'crs'], ['crs'], 'en', {
    en: 'Seychelles', fr: 'Seychelles', crs: 'Sesel',
  }, 'Seychelles', 'Seychelles Postal Services', null, {
    postcodeUniversal: false,
    preferInternationalRenderer: true,
    layout: 'po-box-oriented',
  }),
  SO: profile('SO', ['so', 'ar', 'en'], ['so'], 'so', {
    so: 'Soomaaliya', ar: 'الصومال', en: 'Somalia',
  }, 'Somalia', 'Somali Postal Service', '^[A-Z]{2} \\d{3,5}$', {
    script: 'multiscript',
    postcodeUniversal: false,
    layout: 'po-box-oriented',
  }),
  ZA: profile('ZA', ['en', 'af', 'zu', 'xh', 'nr', 'st', 'tn', 'ss', 've', 'ts', 'nso'], [
    'af', 'zu', 'xh', 'nr', 'st', 'tn', 'ss', 've', 'ts', 'nso',
  ], 'en', {
    en: 'South Africa',
    af: 'Suid-Afrika',
    zu: 'iNingizimu Afrika',
    xh: 'uMzantsi Afrika',
    nr: 'Sewula Afrika',
    st: 'Afrika Borwa',
    tn: 'Aforika Borwa',
    ss: 'Ningizimu Afrika',
    ve: 'Afurika Tshipembe',
    ts: 'Afrika-Dzonga',
    nso: 'Afrika Borwa',
  }, 'South Africa', 'South African Post Office', '^\\d{4}$', {
    postcodeRequired: true,
    layout: 'southern-africa',
    streetOrder: 'number-road',
    uppercaseLocality: true,
  }),
  TZ: profile('TZ', ['sw', 'en'], ['sw'], 'sw', {
    sw: 'Tanzania', en: 'Tanzania',
  }, 'Tanzania', 'Tanzania Posts Corporation', '^\\d{5}$', {
    postcodeRequired: true,
    layout: 'po-box-oriented',
    uppercaseLocality: true,
  }),
  UG: profile('UG', ['en', 'sw'], ['sw'], 'en', {
    en: 'Uganda', sw: 'Uganda',
  }, 'Uganda', 'Posta Uganda', '^\\d{5}$', {
    postcodeUniversal: false,
    layout: 'po-box-oriented',
  }),
  ZM: profile('ZM', ['en', 'bem', 'ny'], ['bem', 'ny'], 'en', {
    en: 'Zambia', bem: 'Zambia', ny: 'Zambia',
  }, 'Zambia', 'ZamPost', '^\\d{5}$', {
    postcodeUniversal: false,
    layout: 'southern-africa',
    streetOrder: 'number-road',
  }),
  ZW: profile('ZW', ['en', 'sn', 'nd'], ['sn', 'nd'], 'en', {
    en: 'Zimbabwe', sn: 'Zimbabwe', nd: 'Zimbabwe',
  }, 'Zimbabwe', 'ZimPost', '^\\d{4}$', {
    postcodeUniversal: false,
    layout: 'southern-africa',
    streetOrder: 'number-road',
  }),
  SD: profile('SD', ['ar', 'en'], ['en'], 'ar', {
    ar: 'السودان', en: 'Sudan',
  }, 'Sudan', 'Sudapost', '^\\d{5}$', {
    script: 'multiscript',
    postcodeUniversal: false,
    layout: 'po-box-oriented',
  }),
  EH: profile('EH', ['ar', 'es', 'fr'], ['ar', 'es', 'fr'], 'ar', {
    ar: 'الصحراء الغربية', es: 'Sáhara Occidental', fr: 'Sahara occidental',
  }, 'Western Sahara', 'UPU PAS destination reference', '^\\d{5}$', {
    script: 'multiscript',
    postcodeUniversal: false,
    neutralScope: true,
    preferInternationalRenderer: true,
  }),
  SLND: profile('SLND', ['so', 'en', 'ar'], ['so', 'en', 'ar'], 'so', {
    so: 'Somaliland', en: 'Somaliland', ar: 'صوماليلاند',
  }, 'Somaliland', 'Neutral destination-label reference', '^\\d{5}$', {
    script: 'multiscript',
    postcodeUniversal: false,
    neutralScope: true,
    preferInternationalRenderer: true,
  }),
} as const satisfies Record<string, RemainingAfricanShippingProfile>;

export type RemainingAfricanShippingCountryCode =
  keyof typeof REMAINING_AFRICAN_SHIPPING_PROFILES;

export const REMAINING_AFRICAN_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(REMAINING_AFRICAN_SHIPPING_PROFILES) as RemainingAfricanShippingCountryCode[],
);

const COUNTRY_CODE_ALIASES: Readonly<Record<string, RemainingAfricanShippingCountryCode>> = {
  SWZ: 'SZ',
  SOMALILAND: 'SLND',
};

const DOMESTIC_LOCALITY_ALIASES: Readonly<
  Record<string, Readonly<Record<string, Readonly<Record<string, string>>>>>
> = {
  ET: {
    am: { 'Addis Ababa': 'አዲስ አበባ' },
    ti: { 'Addis Ababa': 'ኣዲስ ኣበባ' },
    om: { 'Addis Ababa': 'Finfinnee' },
  },
  ER: {
    ti: { Asmara: 'ኣስመራ' },
    ar: { Asmara: 'أسمرة' },
  },
  MA: {
    zgh: { Morocco: 'ⵍⵎⵖⵔⵉⴱ' },
  },
};

const INTERNATIONAL_LOCALITY_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  ET: {
    'አዲስ አበባ': 'Addis Ababa',
    'ኣዲስ ኣበባ': 'Addis Ababa',
    Finfinnee: 'Addis Ababa',
    ድሬዳዋ: 'Dire Dawa',
  },
  ER: {
    'ኣስመራ': 'Asmara',
    أسمرة: 'Asmara',
    ምጽዋ: 'Massawa',
  },
  EH: {
    العيون: 'Laayoune',
    'El Aaiún': 'Laayoune',
  },
  SLND: {
    هرجيسا: 'Hargeisa',
  },
};

function clean(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function countryCodeOf(countryCode: string): RemainingAfricanShippingCountryCode | '' {
  const normalized = clean(countryCode).toUpperCase().replace(/-/g, '_');
  const alias = COUNTRY_CODE_ALIASES[normalized];
  if (alias) return alias;
  return REMAINING_AFRICAN_SHIPPING_COUNTRY_CODES.includes(
    normalized as RemainingAfricanShippingCountryCode,
  )
    ? normalized as RemainingAfricanShippingCountryCode
    : '';
}

function languageOf(language: string | undefined, shippingProfile: RemainingAfricanShippingProfile) {
  const requested = clean(language).toLowerCase().split(/[-_]/)[0];
  return shippingProfile.nativeLanguages.includes(requested)
    ? requested
    : shippingProfile.defaultLanguage;
}

export function isRemainingAfricanShippingCountry(countryCode: string) {
  return Boolean(countryCodeOf(countryCode));
}

export function getRemainingAfricanShippingProfile(countryCode: string) {
  const code = countryCodeOf(countryCode);
  return code ? REMAINING_AFRICAN_SHIPPING_PROFILES[code] : null;
}

export function supportsRemainingAfricanDomesticLanguage(
  countryCode: string,
  language: string,
) {
  const shippingProfile = getRemainingAfricanShippingProfile(countryCode);
  if (!shippingProfile) return false;
  const normalized = clean(language).toLowerCase().split(/[-_]/)[0];
  return shippingProfile.enhancedDomesticLanguages.includes(normalized);
}

export function prefersRemainingAfricanInternationalRenderer(countryCode: string) {
  return getRemainingAfricanShippingProfile(countryCode)?.preferInternationalRenderer ?? false;
}

function normalizePostcode(
  value: unknown,
  shippingProfile: RemainingAfricanShippingProfile,
) {
  const source = clean(value).toUpperCase();
  if (!source) return '';
  const compact = source.replace(/[^A-Z0-9]/g, '');
  if (
    (shippingProfile.countryCode === 'BW' || shippingProfile.countryCode === 'SO')
    && /^[A-Z]{2}\d{3,5}$/.test(compact)
  ) {
    return `${compact.slice(0, 2)} ${compact.slice(2)}`;
  }
  if (shippingProfile.countryCode === 'SZ' && /^[A-Z]\d{3}$/.test(compact)) {
    return `${compact.slice(0, 1)} ${compact.slice(1)}`;
  }
  return compact;
}

function containsAfricanDestinationScript(value: string) {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u1200-\u137f\u2d30-\u2d7f]/u.test(value);
}

function romanizeAfrican(value: string) {
  return transliterateTifinagh(
    transliterateEthiopic(
      transliterateArabic(value),
    ),
  )
    .replace(/[’`]/g, "'")
    .replace(/'(?=\s|$|[.,])/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function domesticAlias(countryCode: string, language: string, value: string) {
  return DOMESTIC_LOCALITY_ALIASES[countryCode]?.[language]?.[value] ?? value;
}

function internationalAlias(countryCode: string, value: string) {
  return INTERNATIONAL_LOCALITY_ALIASES[countryCode]?.[value] ?? value;
}

function normalizeField(input: {
  shippingProfile: RemainingAfricanShippingProfile;
  fieldKey: keyof CanonicalAddress;
  value: unknown;
  mode: RemainingAfricanShippingMode;
  language: string;
}) {
  const { shippingProfile, fieldKey, mode, language } = input;
  const value = clean(input.value);
  if (!value) return '';
  if (fieldKey === 'country_code') return shippingProfile.countryCode;
  if (fieldKey === 'postcode') return normalizePostcode(value, shippingProfile);
  if (fieldKey === 'country') {
    return mode === 'international-shipping'
      ? shippingProfile.englishCountryName
      : shippingProfile.domesticCountryNames[language]
        ?? shippingProfile.domesticCountryNames[shippingProfile.defaultLanguage]
        ?? value;
  }
  if (fieldKey === 'city' || fieldKey === 'district' || fieldKey === 'state') {
    if (mode === 'domestic') {
      return domesticAlias(shippingProfile.countryCode, language, value);
    }
    return romanizeAfrican(internationalAlias(shippingProfile.countryCode, value));
  }
  if (
    mode === 'international-shipping'
    && fieldKey !== 'house_number'
    && fieldKey !== 'plus_code'
  ) {
    return romanizeAfrican(value);
  }
  return value;
}

function normalizeCanonical(
  data: CanonicalAddress,
  shippingProfile: RemainingAfricanShippingProfile,
  mode: RemainingAfricanShippingMode,
  language: string,
) {
  const normalized = {} as CanonicalAddress;
  for (const key of Object.keys(data) as Array<keyof CanonicalAddress>) {
    normalized[key] = normalizeField({
      shippingProfile,
      fieldKey: key,
      value: data[key],
      mode,
      language,
    }) as never;
  }
  normalized.country_code = shippingProfile.countryCode;
  normalized.country = mode === 'international-shipping'
    ? shippingProfile.englishCountryName
    : shippingProfile.domesticCountryNames[language]
      ?? shippingProfile.domesticCountryNames[shippingProfile.defaultLanguage]
      ?? clean(data.country);
  normalized.postcode = normalizePostcode(data.postcode, shippingProfile);

  const changedFields = (Object.keys(normalized) as Array<keyof CanonicalAddress>).filter(
    key => clean(data[key]) !== clean(normalized[key]),
  );
  const translatedFields = changedFields.filter(
    key => key !== 'country_code' && key !== 'postcode',
  );
  return { normalized, changedFields, translatedFields };
}

function comparable(value: string) {
  return clean(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function uniqueLines(lines: string[]) {
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
  shippingProfile: RemainingAfricanShippingProfile,
) {
  const road = clean(data.road);
  const number = clean(data.house_number);
  if (!road) return number;
  if (!number) return road;
  return shippingProfile.streetOrder === 'number-road'
    ? `${number} ${road}`
    : `${road} ${number}`;
}

function secondaryUnitLine(data: CanonicalAddress) {
  return [data.block, data.floor, data.unit].map(clean).filter(Boolean).join(' ');
}

function postcodeLocalityLine(
  data: CanonicalAddress,
  shippingProfile: RemainingAfricanShippingProfile,
) {
  const city = shippingProfile.uppercaseLocality ? clean(data.city).toUpperCase() : clean(data.city);
  return shippingProfile.layout === 'locality-postcode' || shippingProfile.layout === 'southern-africa'
    ? [city, data.postcode].filter(Boolean).join(' ')
    : [data.postcode, city].filter(Boolean).join(' ');
}

function renderLines(
  data: CanonicalAddress,
  shippingProfile: RemainingAfricanShippingProfile,
) {
  const organization = data.building || data.poi;
  const street = data.po_box || streetLine(data, shippingProfile);
  const area = data.subdistrict || data.suburb;
  const district = data.district;
  const unit = secondaryUnitLine(data);
  const postcodeLocality = postcodeLocalityLine(data, shippingProfile);

  if (shippingProfile.layout === 'southern-africa') {
    return uniqueLines([
      organization,
      street,
      unit,
      area,
      district,
      data.state,
      postcodeLocality,
    ]);
  }
  if (shippingProfile.layout === 'po-box-oriented') {
    return uniqueLines([
      organization,
      street,
      unit,
      area,
      district,
      data.state,
      postcodeLocality,
    ]);
  }
  return uniqueLines([
    organization,
    street,
    unit,
    area,
    district,
    data.state,
    postcodeLocality,
  ]);
}

function unsupportedResult(
  data: CanonicalAddress,
  mode: RemainingAfricanShippingMode,
): RemainingAfricanShippingAddressResult {
  const lines = uniqueLines([
    data.building || data.poi,
    data.po_box || [data.road, data.house_number].filter(Boolean).join(' '),
    data.subdistrict || data.suburb || data.district,
    [data.postcode, data.city].filter(Boolean).join(' '),
    data.state,
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
    preservedDeliveryFields: [
      'building',
      'road',
      'house_number',
      'subdistrict',
      'district',
      'city',
      'state',
    ],
    appliedRules: ['conservative-remaining-african-address-fallback'],
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

export function buildRemainingAfricanShippingAddress(
  data: CanonicalAddress,
  mode: RemainingAfricanShippingMode,
  options: { domesticLanguage?: string } = {},
): RemainingAfricanShippingAddressResult {
  const shippingProfile = getRemainingAfricanShippingProfile(data.country_code);
  if (!shippingProfile) return unsupportedResult(data, mode);

  const requestedLanguage = clean(options.domesticLanguage).toLowerCase().split(/[-_]/)[0];
  const language = mode === 'international-shipping'
    ? 'en'
    : languageOf(options.domesticLanguage, shippingProfile);
  const { normalized, changedFields, translatedFields } = normalizeCanonical(
    data,
    shippingProfile,
    mode,
    language,
  );
  const domesticLines = renderLines(normalized, shippingProfile);
  const lines = mode === 'international-shipping'
    ? uniqueLines([...domesticLines, shippingProfile.englishCountryName.toUpperCase()])
    : domesticLines;
  const warnings: RemainingAfricanShippingWarning[] = [
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
  ];

  if (
    mode === 'domestic'
    && requestedLanguage
    && !shippingProfile.nativeLanguages.includes(requestedLanguage)
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
  if (
    mode === 'domestic'
    && translatedFields.some(field => field === 'city' || field === 'district' || field === 'state')
  ) {
    warnings.push('multilingual_locality_alias_applied');
  }
  if (
    mode === 'international-shipping'
    && Object.values(data).some(value => containsAfricanDestinationScript(clean(value)))
  ) {
    warnings.push('transliteration_applied');
  }
  if (mode === 'international-shipping' && lines.some(containsAfricanDestinationScript)) {
    warnings.push('transliteration_incomplete');
  }
  if (shippingProfile.neutralScope) warnings.push('neutral_scope_review_required');

  const lineLimit = mode === 'international-shipping'
    ? shippingProfile.maxInternationalLines
    : shippingProfile.maxDomesticLines;
  if (lines.length > lineLimit) warnings.push('address_line_limit_exceeded');
  if (lines.some(line => line.length > shippingProfile.maxLineLength)) {
    warnings.push('line_length_exceeds_profile_limit');
  }

  const informationalWarnings = new Set<RemainingAfricanShippingWarning>([
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
    'postcode_not_universal',
    'multilingual_locality_alias_applied',
    'transliteration_applied',
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
    preservedDeliveryFields: [
      'building',
      'road',
      'house_number',
      'subdistrict',
      'district',
      'city',
      'state',
    ],
    appliedRules: [
      `${shippingProfile.countryCode.toLowerCase()}-remaining-africa-postal-presentation-v1`,
      `${shippingProfile.layout}-line-order`,
      `domestic-language-${language}`,
      'preserve-destination-delivery-keys',
      'translate-only-approved-country-and-locality-aliases',
      'deterministic-african-script-to-latin-international-transliteration',
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
