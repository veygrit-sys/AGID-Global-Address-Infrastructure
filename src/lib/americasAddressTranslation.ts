import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { isFrenchShippingCountry,normalizeFrenchShippingField } from './frenchShippingAddress';
import { isSpanishShippingCountry,normalizeSpanishShippingField } from './spanishShippingAddress';

export type AmericasAddressTopology =
  | 'english-address'
  | 'latin-spanish'
  | 'latin-portuguese'
  | 'latin-french'
  | 'latin-dutch'
  | 'latin-creole'
  | 'indigenous-latin'
  | 'latin-address';

export type AmericasEnglishAlgorithm =
  | 'north-america-bilingual-address'
  | 'americas-spanish-international-shipping'
  | 'brazil-portuguese-international-shipping'
  | 'caribbean-english-domestic-international'
  | 'french-americas-overseas-address'
  | 'dutch-caribbean-papiamentu-address'
  | 'haiti-french-creole-address'
  | 'andes-indigenous-spanish-address'
  | 'paraguay-spanish-guarani-address';

export type AmericasAddressTranslationRoute = AddressTranslationRoute<AmericasAddressTopology, AmericasEnglishAlgorithm>;

export type AmericasAddressTranslationProfile = AddressTranslationProfile<AmericasAddressTopology, AmericasEnglishAlgorithm>;


const SPANISH_AMERICAS_CODES = [
  'MX',
  'GT',
  'HN',
  'SV',
  'NI',
  'CR',
  'PA',
  'CU',
  'DO',
  'AR',
  'CL',
  'CO',
  'UY',
  'VE',
];

const ENGLISH_CARIBBEAN_AND_TERRITORY_CODES = [
  'JM',
  'TT',
  'BB',
  'BS',
  'GY',
  'AG',
  'LC',
  'GD',
  'DM',
  'VC',
  'KN',
  'AI',
  'BM',
  'KY',
  'MS',
  'TC',
  'VG',
  'VI',
  'FK',
  'GS',
  'GU',
  'MP',
  'UM',
];

const FRENCH_AMERICAS_CODES = ['GP', 'MQ', 'GF', 'MF', 'BL', 'PM', 'CP'];

const AMERICAS_ADDRESS_TRANSLATION_PROFILES: Record<string, AmericasAddressTranslationProfile> = {
  US: { countryCode: 'US', nativeLanguages: ['en', 'es'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'north-america-bilingual-address' },
  CA: { countryCode: 'CA', nativeLanguages: ['en', 'fr'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'north-america-bilingual-address' },
  PR: { countryCode: 'PR', nativeLanguages: ['es', 'en'], defaultLanguage: 'es', defaultTopology: 'latin-spanish', englishAlgorithm: 'americas-spanish-international-shipping' },
  BZ: { countryCode: 'BZ', nativeLanguages: ['en', 'es'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'caribbean-english-domestic-international' },
  AS: { countryCode: 'AS', nativeLanguages: ['en', 'sm'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'caribbean-english-domestic-international' },

  BR: { countryCode: 'BR', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-portuguese', englishAlgorithm: 'brazil-portuguese-international-shipping' },
  PE: { countryCode: 'PE', nativeLanguages: ['es', 'qu', 'ay'], defaultLanguage: 'es', defaultTopology: 'latin-spanish', englishAlgorithm: 'andes-indigenous-spanish-address' },
  EC: { countryCode: 'EC', nativeLanguages: ['es', 'qu'], defaultLanguage: 'es', defaultTopology: 'latin-spanish', englishAlgorithm: 'andes-indigenous-spanish-address' },
  BO: { countryCode: 'BO', nativeLanguages: ['es', 'qu', 'ay'], defaultLanguage: 'es', defaultTopology: 'latin-spanish', englishAlgorithm: 'andes-indigenous-spanish-address' },
  PY: { countryCode: 'PY', nativeLanguages: ['es', 'gn'], defaultLanguage: 'es', defaultTopology: 'latin-spanish', englishAlgorithm: 'paraguay-spanish-guarani-address' },
  HT: { countryCode: 'HT', nativeLanguages: ['fr', 'ht'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'haiti-french-creole-address' },
  SR: { countryCode: 'SR', nativeLanguages: ['nl', 'en'], defaultLanguage: 'nl', defaultTopology: 'latin-dutch', englishAlgorithm: 'dutch-caribbean-papiamentu-address' },
  BQ: { countryCode: 'BQ', nativeLanguages: ['nl', 'pap', 'en'], defaultLanguage: 'nl', defaultTopology: 'latin-dutch', englishAlgorithm: 'dutch-caribbean-papiamentu-address' },
  AW: { countryCode: 'AW', nativeLanguages: ['nl', 'pap', 'en'], defaultLanguage: 'nl', defaultTopology: 'latin-dutch', englishAlgorithm: 'dutch-caribbean-papiamentu-address' },
  CW: { countryCode: 'CW', nativeLanguages: ['nl', 'pap', 'en'], defaultLanguage: 'nl', defaultTopology: 'latin-dutch', englishAlgorithm: 'dutch-caribbean-papiamentu-address' },
  SX: { countryCode: 'SX', nativeLanguages: ['nl', 'en'], defaultLanguage: 'nl', defaultTopology: 'latin-dutch', englishAlgorithm: 'dutch-caribbean-papiamentu-address' },

  ...Object.fromEntries(SPANISH_AMERICAS_CODES.map(code => [
    code,
    { countryCode: code, nativeLanguages: ['es'], defaultLanguage: 'es', defaultTopology: 'latin-spanish', englishAlgorithm: 'americas-spanish-international-shipping' as const },
  ])),
  ...Object.fromEntries(ENGLISH_CARIBBEAN_AND_TERRITORY_CODES.map(code => [
    code,
    { countryCode: code, nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'caribbean-english-domestic-international' as const },
  ])),
  ...Object.fromEntries(FRENCH_AMERICAS_CODES.map(code => [
    code,
    { countryCode: code, nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'french-americas-overseas-address' as const },
  ])),
};

const AMERICAS_TOPOLOGY_BY_LANGUAGE: Record<string, AmericasAddressTopology> = {
  en: 'english-address',
  es: 'latin-spanish',
  pt: 'latin-portuguese',
  fr: 'latin-french',
  nl: 'latin-dutch',
  ht: 'latin-creole',
  pap: 'latin-creole',
  qu: 'indigenous-latin',
  ay: 'indigenous-latin',
  gn: 'indigenous-latin',
  sm: 'indigenous-latin',
};

const COMMON_AMERICAS_ADDRESS_TERMS: Record<string, string> = {
  Name: 'Name',
  Recipient: 'Recipient',
  Street: 'Street',
  City: 'City',
  State: 'State',
  Province: 'Province',
  Department: 'Department',
  Region: 'Region',
  District: 'District',
  Parish: 'Parish',
  Island: 'Island',
  Municipality: 'Municipality',
  Neighborhood: 'Neighborhood',
  Number: 'Number',
  'Postal Code': 'Postal Code',
  'ZIP Code': 'ZIP Code',
  Nombre: 'Name',
  Calle: 'Street',
  Avenida: 'Avenue',
  Carrera: 'Road',
  Barrio: 'Neighborhood',
  Colonia: 'Neighborhood',
  Municipio: 'Municipality',
  Departamento: 'Department',
  Provincia: 'Province',
  Estado: 'State',
  Ciudad: 'City',
  Localidad: 'Locality',
  'Código Postal': 'Postal Code',
  'Codigo Postal': 'Postal Code',
  Nome: 'Name',
  Rua: 'Street',
  Bairro: 'Neighborhood',
  Cidade: 'City',
  Município: 'Municipality',
  CEP: 'Postal Code',
  Nom: 'Name',
  Rue: 'Street',
  Commune: 'Municipality',
  Departement: 'Department',
  Département: 'Department',
  Quartier: 'Quarter',
  Ville: 'City',
  'Code postal': 'Postal Code',
  Naam: 'Name',
  Straat: 'Street',
  Plaats: 'City',
  Postcode: 'Postal Code',
  Kaya: 'Street',
  KayaNobo: 'New Street',
  Kaye: 'Street',
  Ri: 'Street',
  Vil: 'City',
};

const AMERICAS_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  US: {
    'Estados Unidos': 'United States',
    'Estados Unidos de America': 'United States',
    'Estados Unidos de América': 'United States',
    'Nueva York': 'New York',
    'Los Ángeles': 'Los Angeles',
  },
  CA: {
    Canada: 'Canada',
    Canadá: 'Canada',
    Montréal: 'Montreal',
    Québec: 'Quebec',
  },
  MX: {
    México: 'Mexico',
    'Estados Unidos Mexicanos': 'Mexico',
    'Ciudad de México': 'Mexico City',
    CDMX: 'Mexico City',
    'Estado de México': 'State of Mexico',
  },
  PR: {
    'Puerto Rico': 'Puerto Rico',
    'San Juan': 'San Juan',
  },
  BR: {
    Brasil: 'Brazil',
    Brazil: 'Brazil',
    'São Paulo': 'Sao Paulo',
    'Rio de Janeiro': 'Rio de Janeiro',
    Brasília: 'Brasilia',
  },
  AR: {
    Argentina: 'Argentina',
    'Buenos Aires': 'Buenos Aires',
  },
  CL: {
    Chile: 'Chile',
    Santiago: 'Santiago',
  },
  CO: {
    Colombia: 'Colombia',
    Bogotá: 'Bogota',
    Bogota: 'Bogota',
  },
  PE: {
    Perú: 'Peru',
    Peru: 'Peru',
    Lima: 'Lima',
    Cusco: 'Cusco',
    Qosqo: 'Cusco',
  },
  EC: {
    Ecuador: 'Ecuador',
    Quito: 'Quito',
    Guayaquil: 'Guayaquil',
  },
  BO: {
    Bolivia: 'Bolivia',
    'La Paz': 'La Paz',
    Sucre: 'Sucre',
  },
  PY: {
    Paraguay: 'Paraguay',
    Asunción: 'Asuncion',
    Asuncion: 'Asuncion',
  },
  UY: {
    Uruguay: 'Uruguay',
    Montevideo: 'Montevideo',
  },
  VE: {
    Venezuela: 'Venezuela',
    Caracas: 'Caracas',
  },
  GT: {
    Guatemala: 'Guatemala',
    'Ciudad de Guatemala': 'Guatemala City',
  },
  HN: {
    Honduras: 'Honduras',
    Tegucigalpa: 'Tegucigalpa',
  },
  SV: {
    'El Salvador': 'El Salvador',
    'San Salvador': 'San Salvador',
  },
  NI: {
    Nicaragua: 'Nicaragua',
    Managua: 'Managua',
  },
  CR: {
    'Costa Rica': 'Costa Rica',
    'San José': 'San Jose',
    'San Jose': 'San Jose',
  },
  PA: {
    Panamá: 'Panama',
    Panama: 'Panama',
    'Ciudad de Panamá': 'Panama City',
  },
  CU: {
    Cuba: 'Cuba',
    'La Habana': 'Havana',
    Habana: 'Havana',
  },
  DO: {
    'República Dominicana': 'Dominican Republic',
    'Republica Dominicana': 'Dominican Republic',
    'Santo Domingo': 'Santo Domingo',
  },
  HT: {
    Haïti: 'Haiti',
    Haití: 'Haiti',
    Ayiti: 'Haiti',
    Haiti: 'Haiti',
    'Pòtoprens': 'Port-au-Prince',
    'Port-au-Prince': 'Port-au-Prince',
  },
  SR: {
    Suriname: 'Suriname',
    Paramaribo: 'Paramaribo',
  },
  GY: {
    Guyana: 'Guyana',
    Georgetown: 'Georgetown',
  },
  GF: {
    Guyane: 'French Guiana',
    'Guyane française': 'French Guiana',
    Cayenne: 'Cayenne',
  },
  BQ: {
    'Caribisch Nederland': 'Caribbean Netherlands',
    Bonaire: 'Bonaire',
    'Sint Eustatius': 'Sint Eustatius',
    Saba: 'Saba',
  },
  AW: {
    Aruba: 'Aruba',
    Oranjestad: 'Oranjestad',
  },
  CW: {
    Curaçao: 'Curacao',
    Curacao: 'Curacao',
    Willemstad: 'Willemstad',
  },
  SX: {
    'Sint Maarten': 'Sint Maarten',
    Philipsburg: 'Philipsburg',
  },
};


function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode, { UK: 'GB' });
}

export function getAmericasAddressTranslationProfile(countryCode: string) {
  return AMERICAS_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeAmericasAddressLanguage(
  language: string | undefined | null,
  profile: AmericasAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: AmericasAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: AmericasAddressTranslationProfile) {
  return AMERICAS_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseAmericasAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): AmericasAddressTranslationRoute | null {
  const profile = getAmericasAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeAmericasAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeAmericasAddressLanguage(options.targetLanguage, profile);
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

function replaceCommonAmericasTerms(text: string) {
  let normalized = text;
  for (const [term, english] of Object.entries(COMMON_AMERICAS_ADDRESS_TERMS)) {
    normalized = normalized.replace(new RegExp(`\\b${term}\\b`, 'giu'), english);
  }
  return normalized;
}

function normalizeAmericasEnglish(
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
  if (isSpanishShippingCountry(code)) {
    return normalizeSpanishShippingField({
      countryCode: code,
      fieldKey,
      text,
      mode: 'international-shipping',
    });
  }
  const aliases = AMERICAS_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_AMERICAS_ADDRESS_TERMS[text]) return COMMON_AMERICAS_ADDRESS_TERMS[text];

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  const withAmericasTerms = replaceCommonAmericasTerms(text);
  return normalizeEnglishAddressPart(withAmericasTerms, code);
}

export async function translateAmericasAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: AmericasAddressTranslationRoute } | null> {
  const profile = getAmericasAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseAmericasAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeAmericasAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeAmericasAddressLanguage(options.targetLanguage, profile);
  const translatorSourceLanguage = sourceLanguage === 'en'
    ? (options.sourceLanguage || 'en').trim().replace('-', '_')
    : sourceLanguage;

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeAmericasEnglish(
      value,
      profile.countryCode,
      options.fieldKey,
      sourceLanguage,
    ),
    translator: options.translator,
    translatorSourceLanguage,
  });
}
