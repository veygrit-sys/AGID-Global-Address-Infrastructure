import type { CanonicalAddress } from './addressRendering';
import {
  transliterateArmenian,
  transliterateCyrillic,
  transliterateGeorgian,
  transliterateGreek,
} from './transliteration';

export type RemainingEuropeanShippingMode = 'domestic' | 'international-shipping';
export type RemainingEuropeanLayout =
  | 'postcode-locality'
  | 'british-isles'
  | 'hungarian'
  | 'eastern-europe';
export type RemainingEuropeanScript =
  | 'latin'
  | 'cyrillic'
  | 'greek'
  | 'armenian'
  | 'georgian'
  | 'multiscript';

export type RemainingEuropeanShippingWarning =
  | 'delivery_point_not_validated'
  | 'postcode_locality_pair_not_verified'
  | 'unsupported_country_profile'
  | 'unsupported_domestic_language'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'invalid_postcode_format'
  | 'multilingual_locality_alias_applied'
  | 'transliteration_applied'
  | 'transliteration_incomplete'
  | 'neutral_scope_review_required'
  | 'address_line_limit_exceeded'
  | 'line_length_exceeds_profile_limit';

export type RemainingEuropeanShippingEvidence = {
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

export type RemainingEuropeanShippingProfile = {
  countryCode: string;
  nativeLanguages: readonly string[];
  defaultLanguage: string;
  domesticCountryNames: Readonly<Record<string, string>>;
  englishCountryName: string;
  designatedOperator: string;
  layout: RemainingEuropeanLayout;
  script: RemainingEuropeanScript;
  streetOrder: 'road-number' | 'number-road';
  postcodePattern: string;
  postcodeRequired: boolean;
  uppercaseLocality: boolean;
  neutralScope: boolean;
  maxDomesticLines: number;
  maxInternationalLines: number;
  maxLineLength: number;
  evidence: RemainingEuropeanShippingEvidence;
};

export type RemainingEuropeanShippingAddressResult = {
  mode: RemainingEuropeanShippingMode;
  outputLanguage: string;
  profile: RemainingEuropeanShippingProfile | null;
  normalized: CanonicalAddress;
  lines: string[];
  formatted: string;
  changedFields: Array<keyof CanonicalAddress>;
  translatedFields: Array<keyof CanonicalAddress>;
  preservedDeliveryFields: Array<
    'building' | 'road' | 'house_number' | 'subdistrict' | 'district' | 'city' | 'state'
  >;
  appliedRules: string[];
  warnings: RemainingEuropeanShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
  evidence: RemainingEuropeanShippingEvidence | null;
};

const UPU_ADDRESSING_URL =
  'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions' as const;

function evidence(
  authority: string,
  neutralScope = false,
): RemainingEuropeanShippingEvidence {
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
  defaultLanguage: string,
  domesticCountryNames: Readonly<Record<string, string>>,
  englishCountryName: string,
  designatedOperator: string,
  postcodePattern: string,
  options: Partial<Pick<
    RemainingEuropeanShippingProfile,
    | 'layout'
    | 'script'
    | 'streetOrder'
    | 'postcodeRequired'
    | 'uppercaseLocality'
    | 'neutralScope'
    | 'maxDomesticLines'
    | 'maxInternationalLines'
    | 'maxLineLength'
  >> = {},
): RemainingEuropeanShippingProfile {
  const neutralScope = options.neutralScope ?? false;
  return {
    countryCode,
    nativeLanguages,
    defaultLanguage,
    domesticCountryNames,
    englishCountryName,
    designatedOperator,
    layout: options.layout ?? 'postcode-locality',
    script: options.script ?? 'latin',
    streetOrder: options.streetOrder ?? 'road-number',
    postcodePattern,
    postcodeRequired: options.postcodeRequired ?? true,
    uppercaseLocality: options.uppercaseLocality ?? false,
    neutralScope,
    maxDomesticLines: options.maxDomesticLines ?? 6,
    maxInternationalLines: options.maxInternationalLines ?? 7,
    maxLineLength: options.maxLineLength ?? 40,
    evidence: evidence(designatedOperator, neutralScope),
  };
}

const REMAINING_EUROPEAN_SHIPPING_PROFILES = {
  NL: profile('NL', ['nl'], 'nl', { nl: 'Nederland' }, 'Netherlands', 'PostNL', '^\\d{4} [A-Z]{2}$', {
    uppercaseLocality: true,
  }),
  BE: profile('BE', ['nl', 'fr', 'de'], 'nl', {
    nl: 'België', fr: 'Belgique', de: 'Belgien',
  }, 'Belgium', 'bpost', '^\\d{4}$'),
  CH: profile('CH', ['de', 'fr', 'it', 'rm'], 'de', {
    de: 'Schweiz', fr: 'Suisse', it: 'Svizzera', rm: 'Svizra',
  }, 'Switzerland', 'Swiss Post', '^\\d{4}$'),
  LU: profile('LU', ['lb', 'fr', 'de'], 'lb', {
    lb: 'Lëtzebuerg', fr: 'Luxembourg', de: 'Luxemburg',
  }, 'Luxembourg', 'POST Luxembourg', '^L-\\d{4}$'),
  GB: profile('GB', ['en', 'cy', 'gd'], 'en', {
    en: 'United Kingdom', cy: 'Y Deyrnas Unedig', gd: 'An Rìoghachd Aonaichte',
  }, 'United Kingdom', 'Royal Mail', '^[A-Z]{1,2}\\d[A-Z\\d]? \\d[A-Z]{2}$', {
    layout: 'british-isles',
    streetOrder: 'number-road',
    uppercaseLocality: true,
    maxLineLength: 35,
  }),
  IE: profile('IE', ['en', 'ga'], 'en', {
    en: 'Ireland', ga: 'Éire',
  }, 'Ireland', 'An Post', '^(?:[AC-FHKNPRTV-Y]\\d{2}|D6W) [0-9AC-FHKNPRTV-Y]{4}$', {
    layout: 'british-isles',
    streetOrder: 'number-road',
    postcodeRequired: false,
  }),
  SE: profile('SE', ['sv'], 'sv', { sv: 'Sverige' }, 'Sweden', 'PostNord Sweden', '^\\d{3} \\d{2}$', {
    uppercaseLocality: true,
  }),
  NO: profile('NO', ['no'], 'no', { no: 'Norge' }, 'Norway', 'Posten Bring', '^\\d{4}$', {
    uppercaseLocality: true,
  }),
  DK: profile('DK', ['da'], 'da', { da: 'Danmark' }, 'Denmark', 'PostNord Denmark', '^\\d{4}$', {
    uppercaseLocality: true,
  }),
  FI: profile('FI', ['fi', 'sv'], 'fi', {
    fi: 'Suomi', sv: 'Finland',
  }, 'Finland', 'Posti', '^\\d{5}$', {
    uppercaseLocality: true,
  }),
  LV: profile('LV', ['lv'], 'lv', { lv: 'Latvija' }, 'Latvia', 'Latvijas Pasts', '^LV-\\d{4}$'),
  EE: profile('EE', ['et'], 'et', { et: 'Eesti' }, 'Estonia', 'Omniva', '^\\d{5}$'),
  LT: profile('LT', ['lt'], 'lt', { lt: 'Lietuva' }, 'Lithuania', 'Lietuvos paštas', '^LT-\\d{5}$'),
  IS: profile('IS', ['is'], 'is', { is: 'Ísland' }, 'Iceland', 'Íslandspóstur', '^\\d{3}$'),
  AX: profile('AX', ['sv', 'fi'], 'sv', {
    sv: 'Åland', fi: 'Ahvenanmaa',
  }, 'Åland Islands', 'Posten Åland', '^\\d{5}$'),
  GL: profile('GL', ['kl', 'da'], 'kl', {
    kl: 'Kalaallit Nunaat', da: 'Grønland',
  }, 'Greenland', 'Tusass', '^\\d{4}$'),
  FO: profile('FO', ['fo', 'da'], 'fo', {
    fo: 'Føroyar', da: 'Færøerne',
  }, 'Faroe Islands', 'Posta Faroe Islands', '^\\d{3}$'),
  SJ_SVA: profile('SJ_SVA', ['no'], 'no', { no: 'Svalbard' }, 'Svalbard', 'Posten Bring', '^\\d{4}$', {
    neutralScope: true,
  }),
  SJ_JAN: profile('SJ_JAN', ['no'], 'no', { no: 'Jan Mayen' }, 'Jan Mayen', 'Posten Bring', '^\\d{4}$', {
    neutralScope: true,
  }),
  PL: profile('PL', ['pl'], 'pl', { pl: 'Polska' }, 'Poland', 'Poczta Polska', '^\\d{2}-\\d{3}$'),
  CZ: profile('CZ', ['cs'], 'cs', { cs: 'Česko' }, 'Czechia', 'Česká pošta', '^\\d{3} \\d{2}$'),
  SK: profile('SK', ['sk'], 'sk', { sk: 'Slovensko' }, 'Slovakia', 'Slovenská pošta', '^\\d{3} \\d{2}$'),
  HU: profile('HU', ['hu'], 'hu', { hu: 'Magyarország' }, 'Hungary', 'Magyar Posta', '^\\d{4}$', {
    layout: 'hungarian',
  }),
  SI: profile('SI', ['sl'], 'sl', { sl: 'Slovenija' }, 'Slovenia', 'Pošta Slovenije', '^\\d{4}$'),
  HR: profile('HR', ['hr'], 'hr', { hr: 'Hrvatska' }, 'Croatia', 'Hrvatska pošta', '^\\d{5}$'),
  GR: profile('GR', ['el'], 'el', { el: 'Ελλάδα' }, 'Greece', 'ELTA Hellenic Post', '^\\d{3} \\d{2}$', {
    script: 'greek',
  }),
  MT: profile('MT', ['mt', 'en'], 'mt', {
    mt: 'Malta', en: 'Malta',
  }, 'Malta', 'MaltaPost', '^[A-Z]{3} \\d{4}$', {
    streetOrder: 'number-road',
  }),
  AD: profile('AD', ['ca'], 'ca', { ca: 'Andorra' }, 'Andorra', 'Correos and La Poste', '^AD\\d{3}$'),
  CY: profile('CY', ['el', 'tr'], 'el', {
    el: 'Κύπρος', tr: 'Kıbrıs',
  }, 'Cyprus', 'Cyprus Post', '^\\d{4}$', {
    script: 'multiscript',
  }),
  RO: profile('RO', ['ro'], 'ro', { ro: 'România' }, 'Romania', 'Poșta Română', '^\\d{6}$', {
    layout: 'eastern-europe',
  }),
  BG: profile('BG', ['bg'], 'bg', { bg: 'България' }, 'Bulgaria', 'Bulgarian Posts', '^\\d{4}$', {
    layout: 'eastern-europe',
    script: 'cyrillic',
  }),
  UA: profile('UA', ['uk'], 'uk', { uk: 'Україна' }, 'Ukraine', 'Ukrposhta', '^\\d{5}$', {
    layout: 'eastern-europe',
    script: 'cyrillic',
  }),
  MD: profile('MD', ['ro'], 'ro', { ro: 'Republica Moldova' }, 'Moldova', 'Poșta Moldovei', '^MD-\\d{4}$', {
    layout: 'eastern-europe',
  }),
  BY: profile('BY', ['be', 'ru'], 'be', {
    be: 'Беларусь', ru: 'Беларусь',
  }, 'Belarus', 'Belpochta', '^\\d{6}$', {
    layout: 'eastern-europe',
    script: 'cyrillic',
  }),
  RS: profile('RS', ['sr'], 'sr', { sr: 'Србија' }, 'Serbia', 'Pošta Srbije', '^\\d{5}$', {
    layout: 'eastern-europe',
    script: 'multiscript',
  }),
  BA: profile('BA', ['bs', 'hr', 'sr'], 'bs', {
    bs: 'Bosna i Hercegovina', hr: 'Bosna i Hercegovina', sr: 'Босна и Херцеговина',
  }, 'Bosnia and Herzegovina', 'BH Pošta, Hrvatska pošta Mostar, and Pošte Srpske', '^\\d{5}$', {
    layout: 'eastern-europe',
    script: 'multiscript',
  }),
  ME: profile('ME', ['cnr'], 'cnr', { cnr: 'Crna Gora' }, 'Montenegro', 'Pošta Crne Gore', '^\\d{5}$', {
    layout: 'eastern-europe',
    script: 'multiscript',
  }),
  XK: profile('XK', ['sq', 'sr'], 'sq', {
    sq: 'Kosovë', sr: 'Косово',
  }, 'Kosovo', 'Post of Kosovo', '^\\d{5}$', {
    layout: 'eastern-europe',
    script: 'multiscript',
    neutralScope: true,
  }),
  AL: profile('AL', ['sq'], 'sq', { sq: 'Shqipëri' }, 'Albania', 'Posta Shqiptare', '^\\d{4}$', {
    layout: 'eastern-europe',
  }),
  MK: profile('MK', ['mk'], 'mk', { mk: 'Северна Македонија' }, 'North Macedonia', 'Post of North Macedonia', '^\\d{4}$', {
    layout: 'eastern-europe',
    script: 'cyrillic',
  }),
  AM: profile('AM', ['hy'], 'hy', { hy: 'Հայաստան' }, 'Armenia', 'HayPost', '^\\d{4}$', {
    layout: 'eastern-europe',
    script: 'armenian',
  }),
  AZ: profile('AZ', ['az'], 'az', { az: 'Azərbaycan' }, 'Azerbaijan', 'Azerpost', '^AZ \\d{4}$', {
    layout: 'eastern-europe',
  }),
  GE: profile('GE', ['ka'], 'ka', { ka: 'საქართველო' }, 'Georgia', 'Georgian Post', '^\\d{4}$', {
    layout: 'eastern-europe',
    script: 'georgian',
  }),
  TR: profile('TR', ['tr'], 'tr', { tr: 'Türkiye' }, 'Türkiye', 'PTT', '^\\d{5}$', {
    layout: 'eastern-europe',
  }),
} as const satisfies Record<string, RemainingEuropeanShippingProfile>;

export type RemainingEuropeanShippingCountryCode =
  keyof typeof REMAINING_EUROPEAN_SHIPPING_PROFILES;

export const REMAINING_EUROPEAN_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(REMAINING_EUROPEAN_SHIPPING_PROFILES) as RemainingEuropeanShippingCountryCode[],
);

const COUNTRY_CODE_ALIASES: Readonly<Record<string, RemainingEuropeanShippingCountryCode>> = {
  SJ: 'SJ_SVA',
  SVALBARD: 'SJ_SVA',
  JAN_MAYEN: 'SJ_JAN',
};

const DOMESTIC_LOCALITY_ALIASES: Readonly<
  Record<string, Readonly<Record<string, Readonly<Record<string, string>>>>>
> = {
  BE: {
    nl: { Brussels: 'Brussel', Bruxelles: 'Brussel', Brüssel: 'Brussel' },
    fr: { Brussels: 'Bruxelles', Brussel: 'Bruxelles', Brüssel: 'Bruxelles' },
    de: { Brussels: 'Brüssel', Brussel: 'Brüssel', Bruxelles: 'Brüssel' },
  },
  CH: {
    de: { Geneva: 'Genf', Genève: 'Genf', Ginevra: 'Genf', Lausanne: 'Lausanne' },
    fr: { Geneva: 'Genève', Genf: 'Genève', Ginevra: 'Genève', Zurich: 'Zurich', Zürich: 'Zurich' },
    it: { Geneva: 'Ginevra', Genève: 'Ginevra', Genf: 'Ginevra', Zurich: 'Zurigo', Zürich: 'Zurigo' },
    rm: { Geneva: 'Genevra', Genève: 'Genevra', Genf: 'Genevra', Zurich: 'Turitg', Zürich: 'Turitg' },
  },
  LU: {
    lb: { Luxembourg: 'Lëtzebuerg', Luxemburg: 'Lëtzebuerg' },
    fr: { Lëtzebuerg: 'Luxembourg', Luxemburg: 'Luxembourg' },
    de: { Lëtzebuerg: 'Luxemburg', Luxembourg: 'Luxemburg' },
  },
  FI: {
    fi: { Helsingfors: 'Helsinki', Åbo: 'Turku' },
    sv: { Helsinki: 'Helsingfors', Turku: 'Åbo' },
  },
  AX: {
    sv: { Maarianhamina: 'Mariehamn' },
    fi: { Mariehamn: 'Maarianhamina' },
  },
  CY: {
    el: { Nicosia: 'Λευκωσία', Lefkoşa: 'Λευκωσία' },
    tr: { Nicosia: 'Lefkoşa', Λευκωσία: 'Lefkoşa' },
  },
  BY: {
    be: { Minsk: 'Мінск', Минск: 'Мінск' },
    ru: { Minsk: 'Минск', Мінск: 'Минск' },
  },
  XK: {
    sq: { Pristina: 'Prishtinë', Prishtina: 'Prishtinë', Приштина: 'Prishtinë' },
    sr: { Pristina: 'Приштина', Prishtina: 'Приштина', Prishtinë: 'Приштина' },
  },
  GB: {
    cy: { Cardiff: 'Caerdydd' },
    gd: { Edinburgh: 'Dùn Èideann' },
  },
  IE: {
    ga: { Dublin: 'Baile Átha Cliath' },
  },
};

const INTERNATIONAL_LOCALITY_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  BE: { Brussel: 'Brussels', Bruxelles: 'Brussels', Brüssel: 'Brussels' },
  CH: { Genf: 'Geneva', Genève: 'Geneva', Ginevra: 'Geneva', Genevra: 'Geneva' },
  LU: { Lëtzebuerg: 'Luxembourg', Luxemburg: 'Luxembourg' },
  FI: { Helsingfors: 'Helsinki', Åbo: 'Turku' },
  AX: { Maarianhamina: 'Mariehamn' },
  GR: { Αθήνα: 'Athens', Θεσσαλονίκη: 'Thessaloniki' },
  CY: { Λευκωσία: 'Nicosia', Lefkoşa: 'Nicosia' },
  RO: { București: 'Bucharest', Bucuresti: 'Bucharest' },
  BG: { София: 'Sofia', Пловдив: 'Plovdiv', Варна: 'Varna' },
  UA: { Київ: 'Kyiv', Львів: 'Lviv', Харків: 'Kharkiv', Одеса: 'Odesa' },
  MD: { Chișinău: 'Chisinau', Кишинёв: 'Chisinau' },
  BY: { Мінск: 'Minsk', Минск: 'Minsk' },
  RS: { Београд: 'Belgrade', Beograd: 'Belgrade' },
  ME: { Подгорица: 'Podgorica' },
  XK: { Prishtinë: 'Pristina', Prishtina: 'Pristina', Приштина: 'Pristina' },
  AL: { Tiranë: 'Tirana', Durrës: 'Durres' },
  MK: { Скопје: 'Skopje', Битола: 'Bitola' },
  AM: { Երևան: 'Yerevan', Երեւան: 'Yerevan', Գյումրի: 'Gyumri' },
  AZ: { Bakı: 'Baku', Gəncə: 'Ganja' },
  GE: { თბილისი: 'Tbilisi', ბათუმი: 'Batumi', ქუთაისი: 'Kutaisi' },
  GB: { Caerdydd: 'Cardiff', 'Dùn Èideann': 'Edinburgh' },
  IE: { 'Baile Átha Cliath': 'Dublin' },
};

function clean(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function countryCodeOf(countryCode: string): RemainingEuropeanShippingCountryCode | '' {
  const normalized = clean(countryCode).toUpperCase().replace(/-/g, '_');
  const alias = COUNTRY_CODE_ALIASES[normalized];
  if (alias) return alias;
  return REMAINING_EUROPEAN_SHIPPING_COUNTRY_CODES.includes(
    normalized as RemainingEuropeanShippingCountryCode,
  )
    ? normalized as RemainingEuropeanShippingCountryCode
    : '';
}

function languageOf(language: string | undefined, shippingProfile: RemainingEuropeanShippingProfile) {
  const requested = clean(language).toLowerCase().split(/[-_]/)[0];
  return shippingProfile.nativeLanguages.includes(requested)
    ? requested
    : shippingProfile.defaultLanguage;
}

export function isRemainingEuropeanShippingCountry(countryCode: string) {
  return Boolean(countryCodeOf(countryCode));
}

export function getRemainingEuropeanShippingProfile(countryCode: string) {
  const code = countryCodeOf(countryCode);
  return code ? REMAINING_EUROPEAN_SHIPPING_PROFILES[code] : null;
}

export function supportsRemainingEuropeanDomesticLanguage(
  countryCode: string,
  language: string,
) {
  const shippingProfile = getRemainingEuropeanShippingProfile(countryCode);
  if (!shippingProfile) return false;
  const normalized = clean(language).toLowerCase().split(/[-_]/)[0];
  if ((shippingProfile.countryCode === 'GB' || shippingProfile.countryCode === 'IE') && normalized === 'en') {
    return false;
  }
  return shippingProfile.nativeLanguages.includes(normalized);
}

function normalizePostcode(
  value: unknown,
  shippingProfile: RemainingEuropeanShippingProfile,
) {
  const source = clean(value).toUpperCase();
  if (!source) return '';
  const compact = source.replace(/[^A-Z0-9]/g, '');
  const code = shippingProfile.countryCode;

  if (code === 'NL' && /^\d{4}[A-Z]{2}$/.test(compact)) {
    return `${compact.slice(0, 4)} ${compact.slice(4)}`;
  }
  if ((code === 'SE' || code === 'GR') && /^\d{5}$/.test(compact)) {
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  if (code === 'PL' && /^\d{5}$/.test(compact)) {
    return `${compact.slice(0, 2)}-${compact.slice(2)}`;
  }
  if ((code === 'CZ' || code === 'SK') && /^\d{5}$/.test(compact)) {
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  if (code === 'LV' && /^(?:LV)?\d{4}$/.test(compact)) {
    return `LV-${compact.slice(-4)}`;
  }
  if (code === 'LT' && /^(?:LT)?\d{5}$/.test(compact)) {
    return `LT-${compact.slice(-5)}`;
  }
  if (code === 'LU' && /^(?:L)?\d{4}$/.test(compact)) {
    return `L-${compact.slice(-4)}`;
  }
  if (code === 'MD' && /^(?:MD)?\d{4}$/.test(compact)) {
    return `MD-${compact.slice(-4)}`;
  }
  if (code === 'AZ' && /^(?:AZ)?\d{4}$/.test(compact)) {
    return `AZ ${compact.slice(-4)}`;
  }
  if (code === 'AD' && /^(?:AD)?\d{3}$/.test(compact)) {
    return `AD${compact.slice(-3)}`;
  }
  if (code === 'MT' && /^[A-Z]{3}\d{4}$/.test(compact)) {
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  if (code === 'GB' && compact.length >= 5) {
    return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
  }
  if (code === 'IE' && compact.length === 7) {
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  return compact;
}

function containsNonLatinDestinationScript(value: string) {
  return /[\u0370-\u03ff\u0400-\u052f\u0530-\u058f\u10a0-\u10ff\u1c90-\u1cbf]/u.test(value);
}

function romanizeNonLatin(value: string) {
  return transliterateGeorgian(
    transliterateArmenian(
      transliterateGreek(
        transliterateCyrillic(value),
      ),
    ),
  )
    .replace(/[’`]/g, "'")
    .replace(/'(?=\s|$|[.,])/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function domesticAlias(
  countryCode: string,
  language: string,
  value: string,
) {
  return DOMESTIC_LOCALITY_ALIASES[countryCode]?.[language]?.[value] ?? value;
}

function internationalAlias(countryCode: string, value: string) {
  return INTERNATIONAL_LOCALITY_ALIASES[countryCode]?.[value] ?? value;
}

function normalizeField(input: {
  shippingProfile: RemainingEuropeanShippingProfile;
  fieldKey: keyof CanonicalAddress;
  value: unknown;
  mode: RemainingEuropeanShippingMode;
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
    return romanizeNonLatin(internationalAlias(shippingProfile.countryCode, value));
  }
  if (
    mode === 'international-shipping'
    && fieldKey !== 'house_number'
    && fieldKey !== 'plus_code'
  ) {
    return romanizeNonLatin(value);
  }
  return value;
}

function normalizeCanonical(
  data: CanonicalAddress,
  shippingProfile: RemainingEuropeanShippingProfile,
  mode: RemainingEuropeanShippingMode,
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
  shippingProfile: RemainingEuropeanShippingProfile,
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
  shippingProfile: RemainingEuropeanShippingProfile,
) {
  const city = shippingProfile.uppercaseLocality ? clean(data.city).toUpperCase() : clean(data.city);
  return [data.postcode, city].filter(Boolean).join(' ');
}

function renderLines(
  data: CanonicalAddress,
  shippingProfile: RemainingEuropeanShippingProfile,
) {
  const organization = data.building || data.poi;
  const street = data.po_box || streetLine(data, shippingProfile);
  const area = data.subdistrict || data.suburb || data.district;
  const unit = secondaryUnitLine(data);
  const postcodeLocality = postcodeLocalityLine(data, shippingProfile);

  if (shippingProfile.layout === 'hungarian') {
    return uniqueLines([
      organization,
      data.city,
      street,
      unit,
      area,
      data.postcode,
      data.state,
    ]);
  }
  if (shippingProfile.layout === 'british-isles') {
    return uniqueLines([
      organization,
      street,
      unit,
      area,
      data.city,
      data.state,
      data.postcode,
    ]);
  }
  if (shippingProfile.layout === 'eastern-europe') {
    return uniqueLines([
      organization,
      street,
      unit,
      area,
      data.state,
      postcodeLocality,
    ]);
  }
  return uniqueLines([
    organization,
    street,
    unit,
    area,
    data.state,
    postcodeLocality,
  ]);
}

function unsupportedResult(
  data: CanonicalAddress,
  mode: RemainingEuropeanShippingMode,
): RemainingEuropeanShippingAddressResult {
  const lines = uniqueLines([
    data.building || data.poi,
    [data.road, data.house_number].filter(Boolean).join(' '),
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
    appliedRules: ['conservative-remaining-european-address-fallback'],
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

export function buildRemainingEuropeanShippingAddress(
  data: CanonicalAddress,
  mode: RemainingEuropeanShippingMode,
  options: { domesticLanguage?: string } = {},
): RemainingEuropeanShippingAddressResult {
  const shippingProfile = getRemainingEuropeanShippingProfile(data.country_code);
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
  const warnings: RemainingEuropeanShippingWarning[] = [
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
    && !new RegExp(shippingProfile.postcodePattern).test(normalized.postcode)
  ) {
    warnings.push('invalid_postcode_format');
  }
  if (
    mode === 'domestic'
    && translatedFields.some(field => field === 'city' || field === 'district' || field === 'state')
  ) {
    warnings.push('multilingual_locality_alias_applied');
  }
  if (
    mode === 'international-shipping'
    && Object.values(data).some(value => containsNonLatinDestinationScript(clean(value)))
  ) {
    warnings.push('transliteration_applied');
  }
  if (mode === 'international-shipping' && lines.some(containsNonLatinDestinationScript)) {
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

  const informationalWarnings = new Set<RemainingEuropeanShippingWarning>([
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
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
      `${shippingProfile.countryCode.toLowerCase()}-remaining-europe-postal-presentation-v1`,
      `${shippingProfile.layout}-line-order`,
      `domestic-language-${language}`,
      'preserve-destination-delivery-keys',
      'translate-only-approved-country-and-locality-aliases',
      'deterministic-non-latin-to-latin-international-transliteration',
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
