import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { isFrenchShippingCountry,normalizeFrenchShippingField } from './frenchShippingAddress';
import { isSpanishShippingCountry,normalizeSpanishShippingField } from './spanishShippingAddress';
import { isMajorEuropeanShippingCountry,normalizeMajorEuropeanShippingField } from './majorEuropeanShippingAddress';

export type SouthernEuropeAddressTopology =
  | 'latin-address'
  | 'latin-romance'
  | 'latin-basque'
  | 'latin-maltese'
  | 'greek-script'
  | 'latin-turkic';

export type SouthernEuropeEnglishAlgorithm =
  | 'italian-poste-italiane-international-shipping'
  | 'spain-multilingual-address'
  | 'spain-balearic-catalan-spanish-address'
  | 'spain-canary-spanish-address'
  | 'portugal-ctt-international-shipping'
  | 'portugal-azores-address'
  | 'portugal-madeira-address'
  | 'greek-elta-romanization'
  | 'malta-maltese-english-address'
  | 'san-marino-italian-address'
  | 'monaco-french-address'
  | 'vatican-italian-address'
  | 'andorra-catalan-address'
  | 'cyprus-greek-turkish-bilingual-address';

export type SouthernEuropeAddressTranslationRoute = AddressTranslationRoute<SouthernEuropeAddressTopology, SouthernEuropeEnglishAlgorithm>;

export type SouthernEuropeAddressTranslationProfile = AddressTranslationProfile<SouthernEuropeAddressTopology, SouthernEuropeEnglishAlgorithm>;


const SOUTHERN_EUROPE_ADDRESS_TRANSLATION_PROFILES: Record<string, SouthernEuropeAddressTranslationProfile> = {
  IT: { countryCode: 'IT', nativeLanguages: ['it'], defaultLanguage: 'it', defaultTopology: 'latin-romance', englishAlgorithm: 'italian-poste-italiane-international-shipping' },
  ES: { countryCode: 'ES', nativeLanguages: ['es', 'ca', 'gl', 'eu'], defaultLanguage: 'es', defaultTopology: 'latin-romance', englishAlgorithm: 'spain-multilingual-address' },
  ES_BAL: { countryCode: 'ES_BAL', nativeLanguages: ['es', 'ca'], defaultLanguage: 'es', defaultTopology: 'latin-romance', englishAlgorithm: 'spain-balearic-catalan-spanish-address' },
  ES_CAN: { countryCode: 'ES_CAN', nativeLanguages: ['es'], defaultLanguage: 'es', defaultTopology: 'latin-romance', englishAlgorithm: 'spain-canary-spanish-address' },
  PT: { countryCode: 'PT', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-romance', englishAlgorithm: 'portugal-ctt-international-shipping' },
  PT_AZO: { countryCode: 'PT_AZO', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-romance', englishAlgorithm: 'portugal-azores-address' },
  PT_MAD: { countryCode: 'PT_MAD', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-romance', englishAlgorithm: 'portugal-madeira-address' },
  GR: { countryCode: 'GR', nativeLanguages: ['el'], defaultLanguage: 'el', defaultTopology: 'greek-script', englishAlgorithm: 'greek-elta-romanization' },
  MT: { countryCode: 'MT', nativeLanguages: ['mt'], defaultLanguage: 'mt', defaultTopology: 'latin-maltese', englishAlgorithm: 'malta-maltese-english-address' },
  SM: { countryCode: 'SM', nativeLanguages: ['it'], defaultLanguage: 'it', defaultTopology: 'latin-romance', englishAlgorithm: 'san-marino-italian-address' },
  MC: { countryCode: 'MC', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-romance', englishAlgorithm: 'monaco-french-address' },
  VA: { countryCode: 'VA', nativeLanguages: ['it'], defaultLanguage: 'it', defaultTopology: 'latin-romance', englishAlgorithm: 'vatican-italian-address' },
  AD: { countryCode: 'AD', nativeLanguages: ['ca'], defaultLanguage: 'ca', defaultTopology: 'latin-romance', englishAlgorithm: 'andorra-catalan-address' },
  CY: { countryCode: 'CY', nativeLanguages: ['el', 'tr'], defaultLanguage: 'el', defaultTopology: 'greek-script', englishAlgorithm: 'cyprus-greek-turkish-bilingual-address' },
};

const SOUTHERN_EUROPE_TOPOLOGY_BY_LANGUAGE: Record<string, SouthernEuropeAddressTopology> = {
  en: 'latin-address',
  it: 'latin-romance',
  es: 'latin-romance',
  ca: 'latin-romance',
  gl: 'latin-romance',
  pt: 'latin-romance',
  fr: 'latin-romance',
  el: 'greek-script',
  mt: 'latin-maltese',
  eu: 'latin-basque',
  tr: 'latin-turkic',
};

const COMMON_SOUTHERN_EUROPE_ADDRESS_TERMS: Record<string, string> = {
  Nome: 'Name',
  Nombre: 'Name',
  Nom: 'Name',
  Isem: 'Name',
  Όνομα: 'Name',
  Via: 'Street',
  Calle: 'Street',
  Carrer: 'Street',
  Rúa: 'Street',
  Rua: 'Street',
  Rue: 'Street',
  Triq: 'Street',
  Οδός: 'Street',
  Odos: 'Street',
  Sokak: 'Street',
  Cadde: 'Avenue',
  Número: 'Number',
  Numero: 'Number',
  Numru: 'Number',
  Αριθμός: 'Number',
  No: 'Number',
  CAP: 'Postal Code',
  'Codice postale': 'Postal Code',
  'Código postal': 'Postal Code',
  'Codigo postal': 'Postal Code',
  'Codi postal': 'Postal Code',
  'Código Postal': 'Postal Code',
  'Κωδικός Ταχυδρομείου': 'Postal Code',
  'Ταχυδρομικός Κώδικας': 'Postal Code',
  'Kodiċi postali': 'Postal Code',
  Città: 'City',
  Ciudad: 'City',
  Cidade: 'City',
  Localidad: 'Locality',
  Localidade: 'Locality',
  Πόλη: 'City',
  Belt: 'City',
  Commune: 'Municipality',
  Comune: 'Municipality',
  Municipio: 'Municipality',
  Município: 'Municipality',
  Provincia: 'Province',
  Distrito: 'District',
  Parròquia: 'Parish',
};

const SOUTHERN_EUROPE_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  IT: {
    Italia: 'Italy',
    Roma: 'Rome',
    Milano: 'Milan',
    Napoli: 'Naples',
    Firenze: 'Florence',
    Venezia: 'Venice',
  },
  ES: {
    España: 'Spain',
    Madrid: 'Madrid',
    Barcelona: 'Barcelona',
    Sevilla: 'Seville',
    Valencia: 'Valencia',
    'País Vasco': 'Basque Country',
    Euskadi: 'Basque Country',
    Galicia: 'Galicia',
    Catalunya: 'Catalonia',
    Cataluña: 'Catalonia',
  },
  ES_BAL: {
    España: 'Spain',
    'Illes Balears': 'Balearic Islands',
    'Islas Baleares': 'Balearic Islands',
    Mallorca: 'Mallorca',
    Palma: 'Palma',
  },
  ES_CAN: {
    España: 'Spain',
    'Islas Canarias': 'Canary Islands',
    Canarias: 'Canary Islands',
    Tenerife: 'Tenerife',
    'Las Palmas': 'Las Palmas',
  },
  PT: {
    Portugal: 'Portugal',
    Lisboa: 'Lisbon',
    Porto: 'Porto',
    Coimbra: 'Coimbra',
  },
  PT_AZO: {
    Portugal: 'Portugal',
    Açores: 'Azores',
    Acores: 'Azores',
    'Ponta Delgada': 'Ponta Delgada',
  },
  PT_MAD: {
    Portugal: 'Portugal',
    Madeira: 'Madeira',
    'Região Autónoma da Madeira': 'Madeira',
    'Regiao Autonoma da Madeira': 'Madeira',
    Funchal: 'Funchal',
  },
  GR: {
    Ελλάδα: 'Greece',
    Αθήνα: 'Athens',
    Θεσσαλονίκη: 'Thessaloniki',
    Κρήτη: 'Crete',
    Πειραιάς: 'Piraeus',
  },
  MT: {
    Malta: 'Malta',
    Valletta: 'Valletta',
    'Il-Belt Valletta': 'Valletta',
    Għawdex: 'Gozo',
    Ghawdex: 'Gozo',
  },
  SM: {
    'San Marino': 'San Marino',
    'Città di San Marino': 'San Marino City',
  },
  MC: {
    Monaco: 'Monaco',
    'Monte-Carlo': 'Monte Carlo',
    'Monte Carlo': 'Monte Carlo',
  },
  VA: {
    'Città del Vaticano': 'Vatican City',
    Vaticano: 'Vatican City',
  },
  AD: {
    Andorra: 'Andorra',
    'Andorra la Vella': 'Andorra la Vella',
    Escaldes: 'Escaldes',
  },
  CY: {
    Κύπρος: 'Cyprus',
    Kıbrıs: 'Cyprus',
    Λευκωσία: 'Nicosia',
    Lefkoşa: 'Nicosia',
    Λεμεσός: 'Limassol',
    Limasol: 'Limassol',
    Κερύνεια: 'Kyrenia',
    Girne: 'Kyrenia',
  },
};


function countryCodeOf(countryCode: string) {
  return (countryCode || '').trim().toUpperCase().replace(/-/g, '_');
}

export function getSouthernEuropeAddressTranslationProfile(countryCode: string) {
  return SOUTHERN_EUROPE_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeSouthernEuropeAddressLanguage(
  language: string | undefined | null,
  profile: SouthernEuropeAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: SouthernEuropeAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: SouthernEuropeAddressTranslationProfile) {
  return SOUTHERN_EUROPE_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseSouthernEuropeAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): SouthernEuropeAddressTranslationRoute | null {
  const profile = getSouthernEuropeAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeSouthernEuropeAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeSouthernEuropeAddressLanguage(options.targetLanguage, profile);
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

function normalizeSouthernEuropeEnglish(
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
  if (isMajorEuropeanShippingCountry(code)) {
    return normalizeMajorEuropeanShippingField({
      countryCode: code,
      fieldKey,
      text,
      mode: 'international-shipping',
    });
  }
  const aliases = SOUTHERN_EUROPE_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_SOUTHERN_EUROPE_ADDRESS_TERMS[text]) return COMMON_SOUTHERN_EUROPE_ADDRESS_TERMS[text];

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  return normalizeEnglishAddressPart(text, code);
}

export async function translateSouthernEuropeAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: SouthernEuropeAddressTranslationRoute } | null> {
  const profile = getSouthernEuropeAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseSouthernEuropeAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeSouthernEuropeAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeSouthernEuropeAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeSouthernEuropeEnglish(
      value,
      profile.countryCode,
      options.fieldKey,
      sourceLanguage,
    ),
    translator: options.translator,
  });
}
