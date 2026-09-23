import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { isFrenchShippingCountry,normalizeFrenchShippingField } from './frenchShippingAddress';

export type CentralAfricaAddressTopology =
  | 'english-address'
  | 'latin-french'
  | 'latin-portuguese'
  | 'latin-spanish'
  | 'latin-sango'
  | 'arabic-abjad'
  | 'latin-address';

export type CentralAfricaEnglishAlgorithm =
  | 'central-africa-french-sango-bilingual-address'
  | 'chad-french-arabic-bilingual-address'
  | 'central-africa-francophone-international-shipping'
  | 'central-africa-lusophone-international-shipping'
  | 'equatorial-guinea-multilingual-international-shipping'
  | 'cameroon-french-english-bilingual-address';

export type CentralAfricaAddressTranslationRoute = AddressTranslationRoute<CentralAfricaAddressTopology, CentralAfricaEnglishAlgorithm>;

export type CentralAfricaAddressTranslationProfile = AddressTranslationProfile<CentralAfricaAddressTopology, CentralAfricaEnglishAlgorithm>;


const CENTRAL_AFRICA_ADDRESS_TRANSLATION_PROFILES: Record<string, CentralAfricaAddressTranslationProfile> = {
  CM: { countryCode: 'CM', nativeLanguages: ['fr', 'en'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'cameroon-french-english-bilingual-address' },
  CF: { countryCode: 'CF', nativeLanguages: ['fr', 'sg'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'central-africa-french-sango-bilingual-address' },
  TD: { countryCode: 'TD', nativeLanguages: ['fr', 'ar'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'chad-french-arabic-bilingual-address' },
  CG: { countryCode: 'CG', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'central-africa-francophone-international-shipping' },
  CD: { countryCode: 'CD', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'central-africa-francophone-international-shipping' },
  GQ: { countryCode: 'GQ', nativeLanguages: ['es', 'fr', 'pt'], defaultLanguage: 'es', defaultTopology: 'latin-spanish', englishAlgorithm: 'equatorial-guinea-multilingual-international-shipping' },
  GA: { countryCode: 'GA', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'central-africa-francophone-international-shipping' },
  ST: { countryCode: 'ST', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-portuguese', englishAlgorithm: 'central-africa-lusophone-international-shipping' },
  AO: { countryCode: 'AO', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-portuguese', englishAlgorithm: 'central-africa-lusophone-international-shipping' },
};

const CENTRAL_AFRICA_TOPOLOGY_BY_LANGUAGE: Record<string, CentralAfricaAddressTopology> = {
  en: 'english-address',
  fr: 'latin-french',
  pt: 'latin-portuguese',
  es: 'latin-spanish',
  sg: 'latin-sango',
  ar: 'arabic-abjad',
};

const COMMON_CENTRAL_AFRICA_ADDRESS_TERMS: Record<string, string> = {
  Name: 'Name',
  Recipient: 'Recipient',
  Street: 'Street',
  City: 'City',
  State: 'State',
  Region: 'Region',
  Province: 'Province',
  District: 'District',
  Nom: 'Name',
  Destinataire: 'Recipient',
  Rue: 'Street',
  Avenue: 'Avenue',
  Ville: 'City',
  Commune: 'Municipality',
  Département: 'Department',
  Departement: 'Department',
  Région: 'Region',
  Prefecture: 'Prefecture',
  Préfecture: 'Prefecture',
  Arrondissement: 'District',
  Quartier: 'Quarter',
  Village: 'Village',
  Numéro: 'Number',
  Numero: 'Number',
  'Code postal': 'Postal Code',
  'Boîte postale': 'PO Box',
  'Boite postale': 'PO Box',
  Nombre: 'Name',
  Calle: 'Street',
  Avenida: 'Avenue',
  Ciudad: 'City',
  Provincia: 'Province',
  Municipio: 'Municipality',
  Distrito: 'District',
  Barrio: 'Neighborhood',
  Número: 'Number',
  'Código Postal': 'Postal Code',
  Nome: 'Name',
  Destinatário: 'Recipient',
  Destinatario: 'Recipient',
  Rua: 'Street',
  Cidade: 'City',
  Província: 'Province',
  Município: 'Municipality',
  Bairro: 'Neighborhood',
  Localidade: 'Locality',
  الاسم: 'Name',
  اسم: 'Name',
  الشارع: 'Street',
  شارع: 'Street',
  المدينة: 'City',
  مدينة: 'City',
  المنطقة: 'Area',
  منطقة: 'Area',
};

const CENTRAL_AFRICA_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  CM: {
    Cameroun: 'Cameroon',
    Cameroon: 'Cameroon',
    Yaoundé: 'Yaounde',
    Yaounde: 'Yaounde',
    Douala: 'Douala',
  },
  CF: {
    'République centrafricaine': 'Central African Republic',
    Centrafrique: 'Central African Republic',
    'Ködörösêse tî Bêafrîka': 'Central African Republic',
    Bangui: 'Bangui',
  },
  TD: {
    Tchad: 'Chad',
    تشاد: 'Chad',
    'N’Djamena': 'NDjamena',
    "N'Djamena": 'NDjamena',
    Ndjamena: 'NDjamena',
    Moundou: 'Moundou',
  },
  CG: {
    Congo: 'Republic of the Congo',
    'République du Congo': 'Republic of the Congo',
    Brazzaville: 'Brazzaville',
    'Pointe-Noire': 'Pointe-Noire',
  },
  CD: {
    'République démocratique du Congo': 'Democratic Republic of the Congo',
    'RDC': 'Democratic Republic of the Congo',
    Kinshasa: 'Kinshasa',
    Lubumbashi: 'Lubumbashi',
    Goma: 'Goma',
  },
  GQ: {
    'Guinea Ecuatorial': 'Equatorial Guinea',
    'Guinée équatoriale': 'Equatorial Guinea',
    'Guiné Equatorial': 'Equatorial Guinea',
    Malabo: 'Malabo',
    Bata: 'Bata',
  },
  GA: {
    Gabon: 'Gabon',
    Libreville: 'Libreville',
    'Port-Gentil': 'Port-Gentil',
  },
  ST: {
    'São Tomé e Príncipe': 'Sao Tome and Principe',
    'Sao Tome e Principe': 'Sao Tome and Principe',
    'São Tomé': 'Sao Tome',
    'Sao Tome': 'Sao Tome',
  },
  AO: {
    Angola: 'Angola',
    Luanda: 'Luanda',
    Benguela: 'Benguela',
    Huambo: 'Huambo',
  },
};


function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode);
}

export function getCentralAfricaAddressTranslationProfile(countryCode: string) {
  return CENTRAL_AFRICA_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeCentralAfricaAddressLanguage(
  language: string | undefined | null,
  profile: CentralAfricaAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: CentralAfricaAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: CentralAfricaAddressTranslationProfile) {
  return CENTRAL_AFRICA_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

function isLatinRomanceDomesticPair(sourceLanguage: string, targetLanguage: string) {
  const latinRomanceLanguages = new Set(['es', 'fr', 'pt']);
  return latinRomanceLanguages.has(sourceLanguage) && latinRomanceLanguages.has(targetLanguage);
}

export function chooseCentralAfricaAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): CentralAfricaAddressTranslationRoute | null {
  const profile = getCentralAfricaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeCentralAfricaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeCentralAfricaAddressLanguage(options.targetLanguage, profile);
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
    directNative: isLatinRomanceDomesticPair(sourceLanguage, targetLanguage),
  });
}

function shouldUseBuildingEnglish(fieldKey: string) {
  return isAddressBuildingField(fieldKey);
}

function normalizeCentralAfricaEnglish(
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
  const aliases = CENTRAL_AFRICA_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_CENTRAL_AFRICA_ADDRESS_TERMS[text]) return COMMON_CENTRAL_AFRICA_ADDRESS_TERMS[text];

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  return normalizeEnglishAddressPart(text, code);
}

export async function translateCentralAfricaAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: CentralAfricaAddressTranslationRoute } | null> {
  const profile = getCentralAfricaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseCentralAfricaAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeCentralAfricaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeCentralAfricaAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeCentralAfricaEnglish(
      value,
      profile.countryCode,
      options.fieldKey,
      sourceLanguage,
    ),
    translator: options.translator,
  });
}
