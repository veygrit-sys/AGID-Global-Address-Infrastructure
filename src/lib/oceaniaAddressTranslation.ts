import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { isFrenchShippingCountry,normalizeFrenchShippingField } from './frenchShippingAddress';

export type OceaniaAddressTopology =
  | 'english-address'
  | 'latin-polynesian'
  | 'latin-melanesian'
  | 'latin-micronesian'
  | 'latin-french'
  | 'indic-address'
  | 'latin-address';

export type OceaniaEnglishAlgorithm =
  | 'australia-domestic-international'
  | 'new-zealand-maori-english-address'
  | 'fiji-english-fijian-hindi-address'
  | 'papua-new-guinea-tok-pisin-address'
  | 'samoa-samoan-english-address'
  | 'tonga-tongan-english-address'
  | 'vanuatu-bislama-english-french-address'
  | 'solomon-islands-pijin-english-address'
  | 'micronesia-english-local-address'
  | 'pacific-islands-english-local-address'
  | 'french-pacific-international-address';

export type OceaniaAddressTranslationRoute = AddressTranslationRoute<OceaniaAddressTopology, OceaniaEnglishAlgorithm>;

export type OceaniaAddressTranslationProfile = AddressTranslationProfile<OceaniaAddressTopology, OceaniaEnglishAlgorithm>;


const AUSTRALIAN_TERRITORY_CODES = ['NF', 'CX', 'CC', 'AQ'];
const MICRONESIAN_CODES = ['FM', 'PW', 'MH', 'KI', 'TV', 'NR'];

const OCEANIA_ADDRESS_TRANSLATION_PROFILES: Record<string, OceaniaAddressTranslationProfile> = {
  AU: { countryCode: 'AU', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'australia-domestic-international' },
  NZ: { countryCode: 'NZ', nativeLanguages: ['en', 'mi'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'new-zealand-maori-english-address' },
  FJ: { countryCode: 'FJ', nativeLanguages: ['en', 'fj', 'hi'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'fiji-english-fijian-hindi-address' },
  PG: { countryCode: 'PG', nativeLanguages: ['en', 'tpi', 'ho'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'papua-new-guinea-tok-pisin-address' },
  WS: { countryCode: 'WS', nativeLanguages: ['sm', 'en'], defaultLanguage: 'sm', defaultTopology: 'latin-polynesian', englishAlgorithm: 'samoa-samoan-english-address' },
  TO: { countryCode: 'TO', nativeLanguages: ['to', 'en'], defaultLanguage: 'to', defaultTopology: 'latin-polynesian', englishAlgorithm: 'tonga-tongan-english-address' },
  VU: { countryCode: 'VU', nativeLanguages: ['bi', 'en', 'fr'], defaultLanguage: 'bi', defaultTopology: 'latin-melanesian', englishAlgorithm: 'vanuatu-bislama-english-french-address' },
  SB: { countryCode: 'SB', nativeLanguages: ['en', 'pis'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'solomon-islands-pijin-english-address' },
  CK: { countryCode: 'CK', nativeLanguages: ['en', 'rar'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'pacific-islands-english-local-address' },
  TK: { countryCode: 'TK', nativeLanguages: ['tkl', 'en'], defaultLanguage: 'tkl', defaultTopology: 'latin-polynesian', englishAlgorithm: 'pacific-islands-english-local-address' },
  NU: { countryCode: 'NU', nativeLanguages: ['niu', 'en'], defaultLanguage: 'niu', defaultTopology: 'latin-polynesian', englishAlgorithm: 'pacific-islands-english-local-address' },
  PN: { countryCode: 'PN', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'pacific-islands-english-local-address' },
  PF: { countryCode: 'PF', nativeLanguages: ['fr', 'ty'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'french-pacific-international-address' },
  NC: { countryCode: 'NC', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'french-pacific-international-address' },
  WF: { countryCode: 'WF', nativeLanguages: ['fr', 'wls', 'fud'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'french-pacific-international-address' },
  AS: { countryCode: 'AS', nativeLanguages: ['en', 'sm'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'pacific-islands-english-local-address' },
  GU: { countryCode: 'GU', nativeLanguages: ['en', 'ch'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'pacific-islands-english-local-address' },
  MP: { countryCode: 'MP', nativeLanguages: ['en', 'ch'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'pacific-islands-english-local-address' },
  UM: { countryCode: 'UM', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'pacific-islands-english-local-address' },
  ...Object.fromEntries(AUSTRALIAN_TERRITORY_CODES.map(code => [
    code,
    { countryCode: code, nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'australia-domestic-international' as const },
  ])),
  ...Object.fromEntries(MICRONESIAN_CODES.map(code => [
    code,
    {
      countryCode: code,
      nativeLanguages: nativeLanguagesForMicronesia(code),
      defaultLanguage: defaultLanguageForMicronesia(code),
      defaultTopology: defaultTopologyForMicronesia(code),
      englishAlgorithm: 'micronesia-english-local-address' as const,
    },
  ])),
};

const OCEANIA_TOPOLOGY_BY_LANGUAGE: Record<string, OceaniaAddressTopology> = {
  en: 'english-address',
  mi: 'latin-polynesian',
  fj: 'latin-polynesian',
  sm: 'latin-polynesian',
  to: 'latin-polynesian',
  rar: 'latin-polynesian',
  tkl: 'latin-polynesian',
  niu: 'latin-polynesian',
  tpi: 'latin-melanesian',
  bi: 'latin-melanesian',
  pis: 'latin-melanesian',
  ho: 'latin-melanesian',
  pau: 'latin-micronesian',
  mh: 'latin-micronesian',
  gil: 'latin-micronesian',
  tvl: 'latin-micronesian',
  na: 'latin-micronesian',
  chk: 'latin-micronesian',
  pon: 'latin-micronesian',
  kos: 'latin-micronesian',
  yap: 'latin-micronesian',
  ch: 'latin-micronesian',
  ty: 'latin-polynesian',
  wls: 'latin-polynesian',
  fud: 'latin-polynesian',
  fr: 'latin-french',
  hi: 'indic-address',
};

const COMMON_OCEANIA_ADDRESS_TERMS: Record<string, string> = {
  Name: 'Name',
  Recipient: 'Recipient',
  Street: 'Street',
  Road: 'Road',
  Avenue: 'Avenue',
  City: 'City',
  Town: 'Town',
  Village: 'Village',
  Island: 'Island',
  State: 'State',
  Province: 'Province',
  Region: 'Region',
  District: 'District',
  Area: 'Area',
  Locality: 'Locality',
  Suburb: 'Suburb',
  Number: 'Number',
  'House Number': 'House Number',
  'Postal Code': 'Postal Code',
  Postcode: 'Postal Code',
  'PO Box': 'PO Box',
  'Namba blong House': 'House Number',
  Namba: 'Number',
  Blong: 'of',
  House: 'House',
  Rot: 'Road',
  Rod: 'Road',
  Ples: 'Place',
  Aelan: 'Island',
  Provins: 'Province',
  Poskod: 'Postal Code',
  Gaunisala: 'Road',
  Rara: 'Street',
  Vale: 'House',
  Koro: 'Village',
  Yasana: 'Province',
  Tikina: 'District',
  Taulaga: 'Town',
  Auala: 'Street',
  Ala: 'Road',
  Fale: 'House',
  Nuʻu: 'Village',
  "Nu'u": 'Village',
  Nuu: 'Village',
  Itumalo: 'District',
  Motu: 'Island',
  Kolo: 'Town',
  Fonua: 'Land',
  Hala: 'Road',
  Magafaoa: 'Village',
  Beluu: 'Village',
  Kumer: 'Street',
};

const OCEANIA_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  AU: {
    Australia: 'Australia',
    'New South Wales': 'New South Wales',
    Queensland: 'Queensland',
    Victoria: 'Victoria',
    Tasmania: 'Tasmania',
  },
  NZ: {
    Aotearoa: 'New Zealand',
    'Aotearoa New Zealand': 'New Zealand',
    'Te Whanganui-a-Tara': 'Wellington',
    'Tamaki Makaurau': 'Auckland',
    'Tāmaki Makaurau': 'Auckland',
    Ōtautahi: 'Christchurch',
    Otautahi: 'Christchurch',
  },
  FJ: {
    Viti: 'Fiji',
    Fiji: 'Fiji',
    Suva: 'Suva',
    Nadi: 'Nadi',
    Lautoka: 'Lautoka',
  },
  PG: {
    'Papua Niugini': 'Papua New Guinea',
    'Papua New Guinea': 'Papua New Guinea',
    Mosbi: 'Port Moresby',
    'Port Moresby': 'Port Moresby',
    Lae: 'Lae',
  },
  WS: {
    Samoa: 'Samoa',
    Apia: 'Apia',
    Upolu: 'Upolu',
    Savaiʻi: 'Savaiʻi',
    Savaii: 'Savaiʻi',
  },
  TO: {
    Tonga: 'Tonga',
    Nukualofa: "Nuku'alofa",
    "Nuku'alofa": "Nuku'alofa",
    Tongatapu: 'Tongatapu',
  },
  VU: {
    Vanuatu: 'Vanuatu',
    'Port Vila': 'Port Vila',
    Luganville: 'Luganville',
    Efate: 'Efate',
  },
  SB: {
    'Solomon Islands': 'Solomon Islands',
    Honiara: 'Honiara',
    Guadalcanal: 'Guadalcanal',
  },
  FM: {
    Micronesia: 'Micronesia',
    Chuuk: 'Chuuk',
    Yap: 'Yap',
    Pohnpei: 'Pohnpei',
    Kosrae: 'Kosrae',
  },
  PW: {
    Belau: 'Palau',
    Palau: 'Palau',
    Koror: 'Koror',
    Ngerulmud: 'Ngerulmud',
  },
  MH: {
    'Aolepān Aorōkin M̧ajeļ': 'Marshall Islands',
    'Aolepan Aorokin Majel': 'Marshall Islands',
    Majuro: 'Majuro',
    Ebeye: 'Ebeye',
  },
  KI: {
    Kiribati: 'Kiribati',
    Tarawa: 'Tarawa',
  },
  TV: {
    Tuvalu: 'Tuvalu',
    Funafuti: 'Funafuti',
  },
  NR: {
    Naoero: 'Nauru',
    Nauru: 'Nauru',
    Yaren: 'Yaren',
  },
  CK: {
    Rarotonga: 'Rarotonga',
    'Cook Islands': 'Cook Islands',
  },
  TK: {
    Tokelau: 'Tokelau',
    Atafu: 'Atafu',
    Nukunonu: 'Nukunonu',
    Fakaofo: 'Fakaofo',
  },
  NU: {
    Niue: 'Niue',
    Alofi: 'Alofi',
  },
  PF: {
    'Polynésie française': 'French Polynesia',
    Papeete: 'Papeete',
  },
  NC: {
    'Nouvelle-Calédonie': 'New Caledonia',
    Nouméa: 'Noumea',
  },
  WF: {
    'Wallis-et-Futuna': 'Wallis and Futuna',
    'Wallis mo Futuna': 'Wallis and Futuna',
    'Mata-Utu': 'Mata-Utu',
  },
  AS: {
    'American Samoa': 'American Samoa',
    Pago: 'Pago Pago',
    'Pago Pago': 'Pago Pago',
  },
  GU: {
    Guam: 'Guam',
    Guåhan: 'Guam',
    Hagatna: 'Hagatna',
    Hagåtña: 'Hagatna',
  },
  MP: {
    'Northern Mariana Islands': 'Northern Mariana Islands',
    Saipan: 'Saipan',
  },
};

function nativeLanguagesForMicronesia(countryCode: string) {
  const code = countryCodeOf(countryCode);
  if (code === 'FM') return ['en', 'chk', 'pon', 'kos', 'yap'];
  if (code === 'PW') return ['en', 'pau'];
  if (code === 'MH') return ['mh', 'en'];
  if (code === 'KI') return ['gil', 'en'];
  if (code === 'TV') return ['tvl', 'en'];
  if (code === 'NR') return ['na', 'en'];
  return ['en'];
}

function defaultLanguageForMicronesia(countryCode: string) {
  const [first] = nativeLanguagesForMicronesia(countryCode);
  return first || 'en';
}

function defaultTopologyForMicronesia(countryCode: string): OceaniaAddressTopology {
  return defaultLanguageForMicronesia(countryCode) === 'en' ? 'english-address' : 'latin-micronesian';
}

function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode);
}

export function getOceaniaAddressTranslationProfile(countryCode: string) {
  return OCEANIA_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeOceaniaAddressLanguage(
  language: string | undefined | null,
  profile: OceaniaAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: OceaniaAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: OceaniaAddressTranslationProfile) {
  return OCEANIA_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseOceaniaAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): OceaniaAddressTranslationRoute | null {
  const profile = getOceaniaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeOceaniaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeOceaniaAddressLanguage(options.targetLanguage, profile);
  if (!isAllowedLanguage(sourceLanguage, profile) || !isAllowedLanguage(targetLanguage, profile)) return null;

  const sourceTopology = topologyForLanguage(sourceLanguage, profile);
  const targetTopology = topologyForLanguage(targetLanguage, profile);

  return chooseCommonAddressTranslationRoute({
    sourceLanguage,
    targetLanguage,
    sourceTopology,
    targetTopology,
    englishAlgorithm: profile.englishAlgorithm,
    englishTopology: 'latin-address',
  });
}

function shouldUseBuildingEnglish(fieldKey: string) {
  return isAddressBuildingField(fieldKey);
}

function normalizeOceaniaEnglish(
  text: string,
  countryCode: string,
  fieldKey: string,
  sourceLanguage: string,
) {
  const code = countryCodeOf(countryCode);
  if (sourceLanguage === 'fr' && isFrenchShippingCountry(code)) {
    return normalizeFrenchShippingField({
      countryCode: code,
      fieldKey,
      text,
      mode: 'international-shipping',
    });
  }
  const aliases = OCEANIA_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_OCEANIA_ADDRESS_TERMS[text]) return COMMON_OCEANIA_ADDRESS_TERMS[text];

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  return normalizeEnglishAddressPart(text, code);
}

export async function translateOceaniaAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: OceaniaAddressTranslationRoute } | null> {
  const profile = getOceaniaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseOceaniaAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeOceaniaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeOceaniaAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeOceaniaEnglish(
      value,
      profile.countryCode,
      options.fieldKey,
      sourceLanguage,
    ),
    translator: options.translator,
    normalizeEnglishIdentity: true,
  });
}
