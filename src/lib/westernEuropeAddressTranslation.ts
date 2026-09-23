import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { isFrenchShippingCountry,normalizeFrenchShippingField } from './frenchShippingAddress';
import { isMajorEuropeanShippingCountry,normalizeMajorEuropeanShippingField } from './majorEuropeanShippingAddress';

export type WesternEuropeAddressTopology =
  | 'latin-address'
  | 'latin-germanic'
  | 'latin-romance'
  | 'latin-celtic';

export type WesternEuropeEnglishAlgorithm =
  | 'french-laposte-international-shipping'
  | 'french-overseas-address'
  | 'german-dach-international-shipping'
  | 'dutch-postnl-international-shipping'
  | 'belgium-trilingual-address'
  | 'swiss-quadrilingual-address'
  | 'luxembourg-trilingual-address'
  | 'austrian-german-address'
  | 'liechtenstein-german-address'
  | 'uk-english-celtic-address'
  | 'ireland-english-irish-address';

export type WesternEuropeAddressTranslationRoute = AddressTranslationRoute<WesternEuropeAddressTopology, WesternEuropeEnglishAlgorithm>;

export type WesternEuropeAddressTranslationProfile = AddressTranslationProfile<WesternEuropeAddressTopology, WesternEuropeEnglishAlgorithm>;


const FRENCH_OVERSEAS_CODES = ['GP', 'MQ', 'GF', 'RE', 'YT', 'PF', 'NC', 'WF', 'MF', 'BL', 'PM', 'TF', 'CP'];

const WESTERN_EUROPE_ADDRESS_TRANSLATION_PROFILES: Record<string, WesternEuropeAddressTranslationProfile> = {
  FR: { countryCode: 'FR', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-romance', englishAlgorithm: 'french-laposte-international-shipping' },
  DE: { countryCode: 'DE', nativeLanguages: ['de'], defaultLanguage: 'de', defaultTopology: 'latin-germanic', englishAlgorithm: 'german-dach-international-shipping' },
  NL: { countryCode: 'NL', nativeLanguages: ['nl'], defaultLanguage: 'nl', defaultTopology: 'latin-germanic', englishAlgorithm: 'dutch-postnl-international-shipping' },
  BE: { countryCode: 'BE', nativeLanguages: ['nl', 'fr', 'de'], defaultLanguage: 'nl', defaultTopology: 'latin-germanic', englishAlgorithm: 'belgium-trilingual-address' },
  CH: { countryCode: 'CH', nativeLanguages: ['de', 'fr', 'it', 'rm'], defaultLanguage: 'de', defaultTopology: 'latin-germanic', englishAlgorithm: 'swiss-quadrilingual-address' },
  LU: { countryCode: 'LU', nativeLanguages: ['lb', 'fr', 'de'], defaultLanguage: 'lb', defaultTopology: 'latin-germanic', englishAlgorithm: 'luxembourg-trilingual-address' },
  AT: { countryCode: 'AT', nativeLanguages: ['de'], defaultLanguage: 'de', defaultTopology: 'latin-germanic', englishAlgorithm: 'austrian-german-address' },
  LI: { countryCode: 'LI', nativeLanguages: ['de'], defaultLanguage: 'de', defaultTopology: 'latin-germanic', englishAlgorithm: 'liechtenstein-german-address' },
  GB: { countryCode: 'GB', nativeLanguages: ['en', 'cy', 'gd'], defaultLanguage: 'en', defaultTopology: 'latin-address', englishAlgorithm: 'uk-english-celtic-address' },
  IE: { countryCode: 'IE', nativeLanguages: ['en', 'ga'], defaultLanguage: 'en', defaultTopology: 'latin-address', englishAlgorithm: 'ireland-english-irish-address' },
  ...Object.fromEntries(FRENCH_OVERSEAS_CODES.map(code => [
    code,
    { countryCode: code, nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-romance', englishAlgorithm: 'french-overseas-address' as const },
  ])),
};

const WESTERN_EUROPE_TOPOLOGY_BY_LANGUAGE: Record<string, WesternEuropeAddressTopology> = {
  en: 'latin-address',
  de: 'latin-germanic',
  nl: 'latin-germanic',
  lb: 'latin-germanic',
  fr: 'latin-romance',
  it: 'latin-romance',
  rm: 'latin-romance',
  cy: 'latin-celtic',
  gd: 'latin-celtic',
  ga: 'latin-celtic',
};

const COMMON_WESTERN_EUROPE_ADDRESS_TERMS: Record<string, string> = {
  Nom: 'Name',
  Name: 'Name',
  Naam: 'Name',
  Rue: 'Street',
  Straße: 'Street',
  Strasse: 'Street',
  Straat: 'Street',
  Strooss: 'Street',
  Via: 'Street',
  Numéro: 'Number',
  Numero: 'Number',
  Nummer: 'Number',
  Hausnummer: 'House Number',
  Huisnummer: 'House Number',
  Postleitzahl: 'Postal Code',
  Postcode: 'Postal Code',
  'Code postal': 'Postal Code',
  'Code Postal': 'Postal Code',
  Ville: 'City',
  Plaats: 'City',
  Ort: 'City',
  Localité: 'Locality',
  Localite: 'Locality',
  Commune: 'Municipality',
  Gemeinde: 'Municipality',
  Kanton: 'Canton',
  Canton: 'Canton',
};

const WESTERN_EUROPE_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  FR: {
    France: 'France',
    Paris: 'Paris',
    Lyon: 'Lyon',
    Marseille: 'Marseille',
    Bordeaux: 'Bordeaux',
    Guadeloupe: 'Guadeloupe',
    Martinique: 'Martinique',
    Guyane: 'French Guiana',
    Réunion: 'Reunion',
    Mayotte: 'Mayotte',
  },
  DE: {
    Deutschland: 'Germany',
    Berlin: 'Berlin',
    München: 'Munich',
    Muenchen: 'Munich',
    Hamburg: 'Hamburg',
    Köln: 'Cologne',
    Koeln: 'Cologne',
  },
  NL: {
    Nederland: 'Netherlands',
    Amsterdam: 'Amsterdam',
    Rotterdam: 'Rotterdam',
    'Den Haag': 'The Hague',
    's-Gravenhage': 'The Hague',
  },
  BE: {
    België: 'Belgium',
    Belgique: 'Belgium',
    Belgien: 'Belgium',
    Brussel: 'Brussels',
    Bruxelles: 'Brussels',
    Brüssel: 'Brussels',
    Antwerpen: 'Antwerp',
    Anvers: 'Antwerp',
    Gent: 'Ghent',
    Gand: 'Ghent',
  },
  CH: {
    Schweiz: 'Switzerland',
    Suisse: 'Switzerland',
    Svizzera: 'Switzerland',
    Svizra: 'Switzerland',
    Zürich: 'Zurich',
    Zuerich: 'Zurich',
    Genève: 'Geneva',
    Geneve: 'Geneva',
    Genf: 'Geneva',
    Bern: 'Bern',
    Berne: 'Bern',
    Basel: 'Basel',
    Lugano: 'Lugano',
  },
  LU: {
    Lëtzebuerg: 'Luxembourg',
    Letzebuerg: 'Luxembourg',
    Luxembourg: 'Luxembourg',
    Luxemburg: 'Luxembourg',
    'Stad Lëtzebuerg': 'Luxembourg City',
  },
  AT: {
    Österreich: 'Austria',
    Oesterreich: 'Austria',
    Wien: 'Vienna',
    Vienna: 'Vienna',
    Salzburg: 'Salzburg',
    Graz: 'Graz',
    Innsbruck: 'Innsbruck',
  },
  LI: {
    Liechtenstein: 'Liechtenstein',
    Vaduz: 'Vaduz',
  },
  GB: {
    'United Kingdom': 'United Kingdom',
    London: 'London',
    Cymru: 'Wales',
    Caerdydd: 'Cardiff',
    Alba: 'Scotland',
    'Dùn Èideann': 'Edinburgh',
    'Dun Eideann': 'Edinburgh',
  },
  IE: {
    Éire: 'Ireland',
    Eire: 'Ireland',
    Ireland: 'Ireland',
    'Baile Átha Cliath': 'Dublin',
    'Baile Atha Cliath': 'Dublin',
    Dublin: 'Dublin',
    Corcaigh: 'Cork',
    Cork: 'Cork',
  },
};

for (const code of FRENCH_OVERSEAS_CODES) {
  WESTERN_EUROPE_ENGLISH_ALIASES[code] = WESTERN_EUROPE_ENGLISH_ALIASES.FR;
}


function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode, { UK: 'GB' });
}

export function getWesternEuropeAddressTranslationProfile(countryCode: string) {
  return WESTERN_EUROPE_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeWesternEuropeAddressLanguage(
  language: string | undefined | null,
  profile: WesternEuropeAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: WesternEuropeAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: WesternEuropeAddressTranslationProfile) {
  return WESTERN_EUROPE_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseWesternEuropeAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): WesternEuropeAddressTranslationRoute | null {
  const profile = getWesternEuropeAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeWesternEuropeAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeWesternEuropeAddressLanguage(options.targetLanguage, profile);
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

function normalizeWesternEuropeEnglish(
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
  if (isMajorEuropeanShippingCountry(code)) {
    return normalizeMajorEuropeanShippingField({
      countryCode: code,
      fieldKey,
      text,
      mode: 'international-shipping',
    });
  }
  const aliases = WESTERN_EUROPE_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_WESTERN_EUROPE_ADDRESS_TERMS[text]) return COMMON_WESTERN_EUROPE_ADDRESS_TERMS[text];

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  return normalizeEnglishAddressPart(text, code);
}

export async function translateWesternEuropeAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: WesternEuropeAddressTranslationRoute } | null> {
  const profile = getWesternEuropeAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseWesternEuropeAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeWesternEuropeAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeWesternEuropeAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeWesternEuropeEnglish(
      value,
      profile.countryCode,
      options.fieldKey,
      sourceLanguage,
    ),
    translator: options.translator,
  });
}
