import { normalizeEnglishAddressBuildingName, normalizeEnglishAddressPart } from './addressEnglish';
import type { CanonicalAddress } from './addressRendering';
import {
  containsAsianDestinationScript,
  transliterateAsianShippingText,
  type AsianShippingScript,
} from './asianShippingTransliteration';
import { getEnglishShippingProfile } from './englishShippingAddress';
import { getFrenchShippingProfile } from './frenchShippingAddress';
import { normalizeLanguageCode } from './languageCodeRules';

export type RemainingOceaniaShippingMode = 'domestic' | 'international-shipping';
export type RemainingOceaniaPostcodePolicy = 'required' | 'optional' | 'not-used';
export type RemainingOceaniaPostcodePlacement =
  | 'before-locality'
  | 'after-locality'
  | 'separate';
export type RemainingOceaniaAliasField =
  | 'building'
  | 'poi'
  | 'road'
  | 'subdistrict'
  | 'district'
  | 'city'
  | 'state';
export type RemainingOceaniaEnglishMethod =
  | 'not-applicable'
  | 'preserved-english-or-proper-name'
  | 'caller-approved-alias'
  | 'curated-place-alias'
  | 'postal-lexicon-normalization'
  | 'deterministic-script-transliteration';

export type RemainingOceaniaShippingWarning =
  | 'delivery_point_not_validated'
  | 'postcode_locality_pair_not_verified'
  | 'unsupported_country_profile'
  | 'unsupported_domestic_language'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'invalid_postcode_format'
  | 'postcode_not_used_by_reference'
  | 'caller_approved_alias_applied'
  | 'curated_locality_alias_applied'
  | 'postal_lexicon_normalization_applied'
  | 'script_transliteration_applied'
  | 'local_proper_name_preserved'
  | 'transliteration_incomplete'
  | 'special_territory_scope'
  | 'address_line_limit_exceeded'
  | 'line_length_exceeds_profile_limit';

export type RemainingOceaniaShippingEvidence = {
  authority: string;
  url: string;
  checkedOn: '2026-07-25';
  version: string;
  reuseStatus: 'reference-only-no-postal-dataset-copied';
  correctionPath: string;
  scope: 'address-presentation-postcode-shape-and-language-policy-only';
};

export type RemainingOceaniaShippingProfile = {
  countryCode: string;
  nativeLanguages: readonly string[];
  enhancedDomesticLanguages: readonly string[];
  defaultLanguage: string;
  domesticCountryNames: Readonly<Record<string, string>>;
  englishCountryName: string;
  postcodePolicy: RemainingOceaniaPostcodePolicy;
  postcodePattern: string | null;
  postcodePlacement: RemainingOceaniaPostcodePlacement;
  parentPostalNetwork: 'independent' | 'australia-post' | 'france-la-poste' | 'usps';
  delegatedInternationalRenderer: 'none' | 'french';
  specialTerritoryScope: boolean;
  maxDomesticLines: number;
  maxInternationalLines: number;
  maxLineLength: number;
  evidence: RemainingOceaniaShippingEvidence;
};

export type RemainingOceaniaShippingBuildOptions = {
  domesticLanguage?: string;
  sourceLanguage?: string;
  englishAliases?: Partial<Record<RemainingOceaniaAliasField, string>>;
};

export type RemainingOceaniaShippingAddressResult = {
  mode: RemainingOceaniaShippingMode;
  outputLanguage: string;
  profile: RemainingOceaniaShippingProfile | null;
  normalized: CanonicalAddress;
  lines: string[];
  formatted: string;
  changedFields: Array<keyof CanonicalAddress>;
  translatedFields: Array<keyof CanonicalAddress>;
  englishMethods: Partial<
    Record<RemainingOceaniaAliasField, RemainingOceaniaEnglishMethod>
  >;
  appliedScripts: AsianShippingScript[];
  preservedDeliveryFields: Array<
    'building' | 'road' | 'house_number' | 'subdistrict' | 'district' | 'city' | 'state'
  >;
  appliedRules: string[];
  warnings: RemainingOceaniaShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
  evidence: RemainingOceaniaShippingEvidence | null;
};

const UPU_ADDRESSING_URL =
  'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions';
const UPU_POSTCODE_CONTACT = 'mailto:postcode@upu.int';

function evidence(countryCode: string): RemainingOceaniaShippingEvidence {
  const frenchProfile = getFrenchShippingProfile(countryCode);
  if (frenchProfile) {
    return {
      authority: frenchProfile.evidenceAuthority,
      url: frenchProfile.evidenceUrl,
      checkedOn: '2026-07-25',
      version: `French postal presentation reference reviewed ${frenchProfile.evidenceCheckedOn}`,
      reuseStatus: 'reference-only-no-postal-dataset-copied',
      correctionPath: UPU_POSTCODE_CONTACT,
      scope: 'address-presentation-postcode-shape-and-language-policy-only',
    };
  }

  const englishProfile = getEnglishShippingProfile(countryCode);
  return {
    authority: englishProfile.authority || 'UPU Postal Addressing Systems',
    url: englishProfile.evidenceUrl || UPU_ADDRESSING_URL,
    checkedOn: '2026-07-25',
    version: englishProfile.evidenceVersion || 'UPU addressing reference reviewed 2026-07-25',
    reuseStatus: 'reference-only-no-postal-dataset-copied',
    correctionPath: UPU_POSTCODE_CONTACT,
    scope: 'address-presentation-postcode-shape-and-language-policy-only',
  };
}

function profile(
  countryCode: string,
  nativeLanguages: readonly string[],
  defaultLanguage: string,
  domesticCountryNames: Readonly<Record<string, string>>,
  englishCountryName: string,
  postcodePolicy: RemainingOceaniaPostcodePolicy,
  postcodePattern: string | null,
  options: Partial<Pick<
    RemainingOceaniaShippingProfile,
    | 'postcodePlacement'
    | 'parentPostalNetwork'
    | 'delegatedInternationalRenderer'
    | 'specialTerritoryScope'
    | 'maxDomesticLines'
    | 'maxInternationalLines'
    | 'maxLineLength'
  >> = {},
): RemainingOceaniaShippingProfile {
  return {
    countryCode,
    nativeLanguages,
    enhancedDomesticLanguages: nativeLanguages.filter(language => language !== 'en'),
    defaultLanguage,
    domesticCountryNames,
    englishCountryName,
    postcodePolicy,
    postcodePattern,
    postcodePlacement: options.postcodePlacement ?? 'after-locality',
    parentPostalNetwork: options.parentPostalNetwork ?? 'independent',
    delegatedInternationalRenderer: options.delegatedInternationalRenderer ?? 'none',
    specialTerritoryScope: options.specialTerritoryScope ?? false,
    maxDomesticLines: options.maxDomesticLines ?? 7,
    maxInternationalLines: options.maxInternationalLines ?? 8,
    maxLineLength: options.maxLineLength ?? 40,
    evidence: evidence(countryCode),
  };
}

const REMAINING_OCEANIA_SHIPPING_PROFILES = {
  FJ: profile('FJ', ['en', 'fj', 'hi'], 'en', {
    en: 'Fiji', fj: 'Viti', hi: 'फ़िजी',
  }, 'Fiji', 'not-used', null),
  PG: profile('PG', ['en', 'tpi', 'ho'], 'en', {
    en: 'Papua New Guinea', tpi: 'Papua Niugini', ho: 'Papua Niu Gini',
  }, 'Papua New Guinea', 'required', '^\\d{3}$'),
  WS: profile('WS', ['sm', 'en'], 'sm', {
    sm: 'Samoa', en: 'Samoa',
  }, 'Samoa', 'not-used', null),
  TO: profile('TO', ['to', 'en'], 'to', {
    to: 'Tonga', en: 'Tonga',
  }, 'Tonga', 'not-used', null),
  VU: profile('VU', ['bi', 'en', 'fr'], 'bi', {
    bi: 'Vanuatu', en: 'Vanuatu', fr: 'Vanuatu',
  }, 'Vanuatu', 'not-used', null),
  SB: profile('SB', ['en', 'pis'], 'en', {
    en: 'Solomon Islands', pis: 'Solomon Islands',
  }, 'Solomon Islands', 'not-used', null),
  FM: profile('FM', ['en', 'chk', 'pon', 'kos', 'yap'], 'en', {
    en: 'Federated States of Micronesia',
  }, 'Federated States of Micronesia', 'required', '^9694[1-4](?:-\\d{4})?$', {
    parentPostalNetwork: 'usps',
  }),
  PW: profile('PW', ['en', 'pau'], 'en', {
    en: 'Palau', pau: 'Belau',
  }, 'Palau', 'required', '^969(?:39|40)(?:-\\d{4})?$', {
    parentPostalNetwork: 'usps',
  }),
  MH: profile('MH', ['mh', 'en'], 'mh', {
    mh: 'Aolepān Aorōkin M̧ajeļ', en: 'Marshall Islands',
  }, 'Marshall Islands', 'required', '^96960(?:-\\d{4})?$', {
    parentPostalNetwork: 'usps',
  }),
  KI: profile('KI', ['gil', 'en'], 'gil', {
    gil: 'Kiribati', en: 'Kiribati',
  }, 'Kiribati', 'not-used', null),
  TV: profile('TV', ['tvl', 'en'], 'tvl', {
    tvl: 'Tuvalu', en: 'Tuvalu',
  }, 'Tuvalu', 'not-used', null),
  NR: profile('NR', ['na', 'en'], 'na', {
    na: 'Naoero', en: 'Nauru',
  }, 'Nauru', 'not-used', null),
  CK: profile('CK', ['en', 'rar'], 'en', {
    en: 'Cook Islands', rar: 'Cook Islands',
  }, 'Cook Islands', 'not-used', null),
  TK: profile('TK', ['tkl', 'en'], 'tkl', {
    tkl: 'Tokelau', en: 'Tokelau',
  }, 'Tokelau', 'not-used', null, {
    specialTerritoryScope: true,
  }),
  NU: profile('NU', ['niu', 'en'], 'niu', {
    niu: 'Niue', en: 'Niue',
  }, 'Niue', 'not-used', null),
  PN: profile('PN', ['en'], 'en', {
    en: 'Pitcairn Islands',
  }, 'Pitcairn Islands', 'required', '^PCRN 1ZZ$', {
    specialTerritoryScope: true,
  }),
  NF: profile('NF', ['en'], 'en', {
    en: 'Norfolk Island',
  }, 'Norfolk Island', 'required', '^2899$', {
    parentPostalNetwork: 'australia-post',
    specialTerritoryScope: true,
  }),
  CX: profile('CX', ['en'], 'en', {
    en: 'Christmas Island',
  }, 'Christmas Island', 'required', '^6798$', {
    parentPostalNetwork: 'australia-post',
    specialTerritoryScope: true,
  }),
  CC: profile('CC', ['en', 'ms'], 'en', {
    en: 'Cocos (Keeling) Islands', ms: 'Kepulauan Cocos (Keeling)',
  }, 'Cocos (Keeling) Islands', 'required', '^6799$', {
    parentPostalNetwork: 'australia-post',
    specialTerritoryScope: true,
  }),
  PF: profile('PF', ['fr', 'ty'], 'fr', {
    fr: 'Polynésie française', ty: 'Polynésie française',
  }, 'French Polynesia', 'required', '^987\\d{2}$', {
    postcodePlacement: 'before-locality',
    parentPostalNetwork: 'france-la-poste',
    delegatedInternationalRenderer: 'french',
    specialTerritoryScope: true,
  }),
  NC: profile('NC', ['fr'], 'fr', {
    fr: 'Nouvelle-Calédonie',
  }, 'New Caledonia', 'required', '^988\\d{2}$', {
    postcodePlacement: 'before-locality',
    parentPostalNetwork: 'france-la-poste',
    delegatedInternationalRenderer: 'french',
    specialTerritoryScope: true,
  }),
  WF: profile('WF', ['fr', 'wls', 'fud'], 'fr', {
    fr: 'Wallis-et-Futuna', wls: 'Wallis mo Futuna', fud: 'Wallis mo Futuna',
  }, 'Wallis and Futuna', 'required', '^986\\d{2}$', {
    postcodePlacement: 'before-locality',
    parentPostalNetwork: 'france-la-poste',
    delegatedInternationalRenderer: 'french',
    specialTerritoryScope: true,
  }),
} as const satisfies Record<string, RemainingOceaniaShippingProfile>;

export type RemainingOceaniaShippingCountryCode =
  keyof typeof REMAINING_OCEANIA_SHIPPING_PROFILES;

export const REMAINING_OCEANIA_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(REMAINING_OCEANIA_SHIPPING_PROFILES) as RemainingOceaniaShippingCountryCode[],
);

const INTERNATIONAL_PLACE_ALIASES: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  FJ: { Viti: 'Fiji', Suva: 'Suva', Nadi: 'Nadi', Lautoka: 'Lautoka' },
  PG: { 'Papua Niugini': 'Papua New Guinea', Mosbi: 'Port Moresby' },
  WS: { Apia: 'Apia', Upolu: 'Upolu', 'Savaiʻi': "Savai'i", Savaii: "Savai'i" },
  TO: { Nukualofa: "Nuku'alofa", "Nuku'alofa": "Nuku'alofa", Tongatapu: 'Tongatapu' },
  VU: { 'Port Vila': 'Port Vila', Luganville: 'Luganville', Efate: 'Efate' },
  SB: { Honiara: 'Honiara', Guadalcanal: 'Guadalcanal' },
  FM: { Chuuk: 'Chuuk', Yap: 'Yap', Pohnpei: 'Pohnpei', Kosrae: 'Kosrae' },
  PW: { Belau: 'Palau', Koror: 'Koror', Ngerulmud: 'Ngerulmud' },
  MH: { Majuro: 'Majuro', Ebeye: 'Ebeye' },
  KI: { Tarawa: 'Tarawa' },
  TV: { Funafuti: 'Funafuti' },
  NR: { Naoero: 'Nauru', Yaren: 'Yaren' },
  CK: { Rarotonga: 'Rarotonga' },
  TK: { Atafu: 'Atafu', Nukunonu: 'Nukunonu', Fakaofo: 'Fakaofo' },
  NU: { Alofi: 'Alofi' },
  PN: { Adamstown: 'Adamstown' },
  PF: { Papeete: 'Papeete' },
  NC: { Nouméa: 'Noumea', Noumea: 'Noumea' },
  WF: { 'Mata-Utu': 'Mata-Utu' },
};

type PostalLexiconEntry = {
  countries: readonly string[];
  fields: readonly RemainingOceaniaAliasField[];
  local: string;
  english: string;
};

const ROAD_FIELDS = ['road'] as const;
const AREA_FIELDS = ['subdistrict', 'district', 'city', 'state'] as const;
const BUILDING_FIELDS = ['building', 'poi'] as const;

const POSTAL_LEXICON: readonly PostalLexiconEntry[] = [
  { countries: ['FJ'], fields: ROAD_FIELDS, local: 'Gaunisala', english: 'Road' },
  { countries: ['FJ'], fields: ROAD_FIELDS, local: 'Sala', english: 'Road' },
  { countries: ['FJ'], fields: AREA_FIELDS, local: 'Koro', english: 'Village' },
  { countries: ['FJ'], fields: AREA_FIELDS, local: 'Yasana', english: 'Province' },
  { countries: ['FJ'], fields: AREA_FIELDS, local: 'Tikina', english: 'District' },
  { countries: ['FJ'], fields: BUILDING_FIELDS, local: 'Vale', english: 'House' },
  { countries: ['WS'], fields: ROAD_FIELDS, local: 'Auala', english: 'Street' },
  { countries: ['WS'], fields: ROAD_FIELDS, local: 'Ala', english: 'Road' },
  { countries: ['WS'], fields: AREA_FIELDS, local: "Nu'u", english: 'Village' },
  { countries: ['WS'], fields: AREA_FIELDS, local: 'Nuʻu', english: 'Village' },
  { countries: ['WS'], fields: AREA_FIELDS, local: 'Itumalo', english: 'District' },
  { countries: ['WS'], fields: AREA_FIELDS, local: 'Taulaga', english: 'Town' },
  { countries: ['WS'], fields: BUILDING_FIELDS, local: 'Fale', english: 'House' },
  { countries: ['TO'], fields: ROAD_FIELDS, local: 'Hala', english: 'Road' },
  { countries: ['TO'], fields: AREA_FIELDS, local: 'Kolo', english: 'Town' },
  { countries: ['TO'], fields: AREA_FIELDS, local: 'Motu', english: 'Island' },
  { countries: ['TO'], fields: AREA_FIELDS, local: 'Fonua', english: 'Land' },
  { countries: ['VU'], fields: ROAD_FIELDS, local: 'Rod', english: 'Road' },
  { countries: ['VU'], fields: ROAD_FIELDS, local: 'Rot', english: 'Road' },
  { countries: ['VU'], fields: AREA_FIELDS, local: 'Ples', english: 'Place' },
  { countries: ['VU'], fields: AREA_FIELDS, local: 'Aelan', english: 'Island' },
  { countries: ['VU'], fields: AREA_FIELDS, local: 'Provins', english: 'Province' },
  { countries: ['VU'], fields: BUILDING_FIELDS, local: 'Namba blong House', english: 'House Number' },
  { countries: ['PG'], fields: ROAD_FIELDS, local: 'Rot', english: 'Road' },
  { countries: ['PG'], fields: AREA_FIELDS, local: 'Ples', english: 'Place' },
  { countries: ['PG'], fields: AREA_FIELDS, local: 'Taun', english: 'Town' },
  { countries: ['PG'], fields: AREA_FIELDS, local: 'Provins', english: 'Province' },
  { countries: ['PG'], fields: BUILDING_FIELDS, local: 'Haus', english: 'House' },
  { countries: ['SB'], fields: ROAD_FIELDS, local: 'Rod', english: 'Road' },
  { countries: ['SB'], fields: AREA_FIELDS, local: 'Taon', english: 'Town' },
  { countries: ['SB'], fields: AREA_FIELDS, local: 'Vilej', english: 'Village' },
  { countries: ['SB'], fields: AREA_FIELDS, local: 'Provins', english: 'Province' },
  { countries: ['PW'], fields: ROAD_FIELDS, local: 'Rael', english: 'Road' },
  { countries: ['PW'], fields: AREA_FIELDS, local: 'Beluu', english: 'Village' },
  { countries: ['PW'], fields: ROAD_FIELDS, local: 'Kumer', english: 'Street' },
  { countries: ['CK'], fields: ROAD_FIELDS, local: 'Ara', english: 'Road' },
  { countries: ['TK'], fields: ROAD_FIELDS, local: 'Ala', english: 'Road' },
  { countries: ['TK'], fields: AREA_FIELDS, local: 'Nuku', english: 'Village' },
  { countries: ['TK'], fields: AREA_FIELDS, local: 'Motu', english: 'Island' },
  { countries: ['NU'], fields: ROAD_FIELDS, local: 'Puhala', english: 'Road' },
  { countries: ['NU'], fields: AREA_FIELDS, local: 'Maaga', english: 'Village' },
  { countries: ['TV'], fields: ROAD_FIELDS, local: 'Ala', english: 'Road' },
  { countries: ['PF', 'NC', 'WF'], fields: ROAD_FIELDS, local: 'Rue', english: 'Street' },
  { countries: ['PF', 'NC', 'WF'], fields: ROAD_FIELDS, local: 'Route', english: 'Road' },
  { countries: ['PF', 'NC', 'WF'], fields: ROAD_FIELDS, local: 'Chemin', english: 'Road' },
];

function clean(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/[’ʻ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function comparable(value: string) {
  return clean(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function normalizedLanguage(language: string | undefined | null) {
  return normalizeLanguageCode(language, { emptyFallback: '' });
}

function countryCodeOf(countryCode: string): RemainingOceaniaShippingCountryCode | '' {
  const normalized = clean(countryCode).toUpperCase();
  return REMAINING_OCEANIA_SHIPPING_COUNTRY_CODES.includes(
    normalized as RemainingOceaniaShippingCountryCode,
  )
    ? normalized as RemainingOceaniaShippingCountryCode
    : '';
}

export function isRemainingOceaniaShippingCountry(countryCode: string) {
  return Boolean(countryCodeOf(countryCode));
}

export function getRemainingOceaniaShippingProfile(countryCode: string) {
  const code = countryCodeOf(countryCode);
  return code ? REMAINING_OCEANIA_SHIPPING_PROFILES[code] : null;
}

export function supportsRemainingOceaniaDomesticLanguage(
  countryCode: string,
  language: string,
) {
  const shippingProfile = getRemainingOceaniaShippingProfile(countryCode);
  if (!shippingProfile) return false;
  const normalized = normalizedLanguage(language);
  if (
    shippingProfile.delegatedInternationalRenderer === 'french'
    && normalized === 'fr'
  ) {
    return false;
  }
  return shippingProfile.enhancedDomesticLanguages.some(
    candidate => normalizedLanguage(candidate) === normalized,
  );
}

export function prefersRemainingOceaniaInternationalRenderer(countryCode: string) {
  const shippingProfile = getRemainingOceaniaShippingProfile(countryCode);
  return Boolean(
    shippingProfile
    && shippingProfile.delegatedInternationalRenderer === 'none',
  );
}

function languageOf(
  language: string | undefined,
  shippingProfile: RemainingOceaniaShippingProfile,
) {
  const requested = normalizedLanguage(language);
  return shippingProfile.nativeLanguages.find(
    candidate => normalizedLanguage(candidate) === requested,
  ) ?? shippingProfile.defaultLanguage;
}

function normalizePostcode(
  value: unknown,
  shippingProfile: RemainingOceaniaShippingProfile,
) {
  const source = clean(value).toUpperCase();
  if (!source) return '';
  const compact = source.replace(/[\s-]+/g, '');
  if (
    shippingProfile.parentPostalNetwork === 'usps'
    && /^\d{9}$/.test(compact)
  ) {
    return `${compact.slice(0, 5)}-${compact.slice(5)}`;
  }
  if (shippingProfile.countryCode === 'PN' && compact === 'PCRN1ZZ') {
    return 'PCRN 1ZZ';
  }
  return compact;
}

function internationalAlias(countryCode: string, value: string) {
  return INTERNATIONAL_PLACE_ALIASES[countryCode]?.[value] ?? '';
}

function translatePostalLexicon(
  countryCode: string,
  field: RemainingOceaniaAliasField,
  value: string,
) {
  const words = clean(value).split(' ').filter(Boolean);
  for (const entry of POSTAL_LEXICON) {
    if (!entry.countries.includes(countryCode) || !entry.fields.includes(field)) continue;
    const localWords = clean(entry.local).split(' ').filter(Boolean);
    const candidate = words.slice(0, localWords.length).join(' ');
    if (comparable(candidate) !== comparable(entry.local)) continue;
    const remainder = words.slice(localWords.length).join(' ');
    return remainder ? `${remainder} ${entry.english}` : entry.english;
  }
  return value;
}

function englishField(input: {
  shippingProfile: RemainingOceaniaShippingProfile;
  field: RemainingOceaniaAliasField;
  value: string;
  options: RemainingOceaniaShippingBuildOptions;
}) {
  const { shippingProfile, field, options } = input;
  const value = clean(input.value);
  if (!value) {
    return {
      text: '',
      method: 'not-applicable' as RemainingOceaniaEnglishMethod,
      scripts: [] as AsianShippingScript[],
      incomplete: false,
    };
  }

  const callerAlias = clean(options.englishAliases?.[field]);
  if (callerAlias) {
    return {
      text: callerAlias,
      method: 'caller-approved-alias' as RemainingOceaniaEnglishMethod,
      scripts: [] as AsianShippingScript[],
      incomplete: containsAsianDestinationScript(callerAlias),
    };
  }

  if (field === 'city' || field === 'district' || field === 'state') {
    const curated = internationalAlias(shippingProfile.countryCode, value);
    if (curated && comparable(curated) !== comparable(value)) {
      return {
        text: curated,
        method: 'curated-place-alias' as RemainingOceaniaEnglishMethod,
        scripts: [] as AsianShippingScript[],
        incomplete: false,
      };
    }
  }

  const lexical = translatePostalLexicon(shippingProfile.countryCode, field, value);
  if (comparable(lexical) !== comparable(value)) {
    return {
      text: lexical,
      method: 'postal-lexicon-normalization' as RemainingOceaniaEnglishMethod,
      scripts: [] as AsianShippingScript[],
      incomplete: false,
    };
  }

  const transliterated = transliterateAsianShippingText(value, {
    countryCode: shippingProfile.countryCode,
    language: options.sourceLanguage ?? shippingProfile.defaultLanguage,
  });
  const normalized = field === 'building' || field === 'poi'
    ? normalizeEnglishAddressBuildingName(transliterated.text, shippingProfile.countryCode)
    : normalizeEnglishAddressPart(transliterated.text, shippingProfile.countryCode);
  return {
    text: normalized,
    method: transliterated.appliedScripts.length
      ? 'deterministic-script-transliteration' as RemainingOceaniaEnglishMethod
      : 'preserved-english-or-proper-name' as RemainingOceaniaEnglishMethod,
    scripts: transliterated.appliedScripts,
    incomplete: transliterated.incomplete,
  };
}

function normalizeCanonical(
  data: CanonicalAddress,
  shippingProfile: RemainingOceaniaShippingProfile,
  mode: RemainingOceaniaShippingMode,
  language: string,
  options: RemainingOceaniaShippingBuildOptions,
) {
  const normalized = { ...data };
  const englishMethods: RemainingOceaniaShippingAddressResult['englishMethods'] = {};
  const appliedScripts = new Set<AsianShippingScript>();
  let transliterationIncomplete = false;

  for (const field of [
    'building',
    'poi',
    'road',
    'subdistrict',
    'district',
    'city',
    'state',
  ] as RemainingOceaniaAliasField[]) {
    const value = clean(data[field]);
    if (mode === 'domestic') {
      normalized[field] = value;
      continue;
    }
    const result = englishField({ shippingProfile, field, value, options });
    normalized[field] = result.text;
    englishMethods[field] = result.method;
    result.scripts.forEach(script => appliedScripts.add(script));
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
    englishMethods,
    appliedScripts: [...appliedScripts],
    transliterationIncomplete,
  };
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

function streetLine(data: CanonicalAddress) {
  const road = clean(data.road);
  const number = clean(data.house_number);
  return [number, road].filter(Boolean).join(' ');
}

function unitLine(data: CanonicalAddress) {
  return [data.block, data.floor, data.unit].map(clean).filter(Boolean).join(' ');
}

function poBoxLine(data: CanonicalAddress) {
  const value = clean(data.po_box);
  if (!value) return '';
  return /^(?:P\.?\s*O\.?|POST OFFICE)\s+BOX\b/i.test(value)
    ? value
    : `PO BOX ${value}`;
}

function localityLine(
  data: CanonicalAddress,
  shippingProfile: RemainingOceaniaShippingProfile,
) {
  const locality = [data.city, data.state].map(clean).filter(Boolean).join(' ');
  if (shippingProfile.postcodePlacement === 'separate') return locality;
  return shippingProfile.postcodePlacement === 'before-locality'
    ? [data.postcode, locality].map(clean).filter(Boolean).join(' ')
    : [locality, data.postcode].map(clean).filter(Boolean).join(' ');
}

function renderLines(
  data: CanonicalAddress,
  shippingProfile: RemainingOceaniaShippingProfile,
  mode: RemainingOceaniaShippingMode,
) {
  const organization = data.building || data.poi;
  const deliveryLine = poBoxLine(data) || streetLine(data);
  const lines = uniqueLines([
    organization,
    unitLine(data),
    deliveryLine,
    data.subdistrict || data.suburb,
    data.district,
    localityLine(data, shippingProfile),
    shippingProfile.postcodePlacement === 'separate' ? data.postcode : '',
    mode === 'international-shipping'
      ? shippingProfile.englishCountryName.toUpperCase()
      : '',
  ]);
  return lines;
}

function unsupportedResult(
  data: CanonicalAddress,
  mode: RemainingOceaniaShippingMode,
): RemainingOceaniaShippingAddressResult {
  const lines = uniqueLines([
    data.building || data.poi,
    poBoxLine(data) || streetLine(data),
    data.subdistrict || data.suburb || data.district,
    [data.city, data.state, data.postcode].map(clean).filter(Boolean).join(' '),
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
    englishMethods: {},
    appliedScripts: [],
    preservedDeliveryFields: [
      'building', 'road', 'house_number', 'subdistrict', 'district', 'city', 'state',
    ],
    appliedRules: ['conservative-remaining-oceania-address-fallback'],
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

export function buildRemainingOceaniaShippingAddress(
  data: CanonicalAddress,
  mode: RemainingOceaniaShippingMode,
  options: RemainingOceaniaShippingBuildOptions = {},
): RemainingOceaniaShippingAddressResult {
  const shippingProfile = getRemainingOceaniaShippingProfile(data.country_code);
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
    englishMethods,
    appliedScripts,
    transliterationIncomplete,
  } = normalizedResult;
  const lines = renderLines(normalized, shippingProfile, mode);
  const warnings: RemainingOceaniaShippingWarning[] = [
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
  if (
    shippingProfile.postcodePolicy === 'required'
    && !normalized.postcode
  ) {
    warnings.push('missing_postcode');
  } else if (
    normalized.postcode
    && shippingProfile.postcodePattern
    && !new RegExp(shippingProfile.postcodePattern).test(normalized.postcode)
  ) {
    warnings.push('invalid_postcode_format');
  } else if (
    normalized.postcode
    && shippingProfile.postcodePolicy === 'not-used'
  ) {
    warnings.push('postcode_not_used_by_reference');
  }
  if (Object.values(englishMethods).includes('caller-approved-alias')) {
    warnings.push('caller_approved_alias_applied');
  }
  if (Object.values(englishMethods).includes('curated-place-alias')) {
    warnings.push('curated_locality_alias_applied');
  }
  if (Object.values(englishMethods).includes('postal-lexicon-normalization')) {
    warnings.push('postal_lexicon_normalization_applied');
  }
  if (appliedScripts.length) warnings.push('script_transliteration_applied');
  if (
    mode === 'international-shipping'
    && options.sourceLanguage
    && normalizedLanguage(options.sourceLanguage) !== 'en'
    && Object.values(englishMethods).includes('preserved-english-or-proper-name')
  ) {
    warnings.push('local_proper_name_preserved');
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
  if (shippingProfile.specialTerritoryScope) warnings.push('special_territory_scope');

  const lineLimit = mode === 'international-shipping'
    ? shippingProfile.maxInternationalLines
    : shippingProfile.maxDomesticLines;
  if (lines.length > lineLimit) warnings.push('address_line_limit_exceeded');
  if (lines.some(line => line.length > shippingProfile.maxLineLength)) {
    warnings.push('line_length_exceeds_profile_limit');
  }

  const informationalWarnings = new Set<RemainingOceaniaShippingWarning>([
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
    'caller_approved_alias_applied',
    'curated_locality_alias_applied',
    'postal_lexicon_normalization_applied',
    'script_transliteration_applied',
    'local_proper_name_preserved',
    'special_territory_scope',
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
    englishMethods,
    appliedScripts,
    preservedDeliveryFields: [
      'building', 'road', 'house_number', 'subdistrict', 'district', 'city', 'state',
    ],
    appliedRules: [
      `${shippingProfile.countryCode.toLowerCase()}-remaining-oceania-postal-presentation-v1`,
      `postcode-policy:${shippingProfile.postcodePolicy}`,
      `parent-network:${shippingProfile.parentPostalNetwork}`,
      `domestic-language:${language}`,
      'preserve-destination-delivery-keys',
      'translate-only-curated-postal-lexicon-and-place-aliases',
      'prefer-caller-approved-english-delivery-aliases',
      'preserve-unverified-latin-proper-names',
      'residual-non-latin-script-review-gate',
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
