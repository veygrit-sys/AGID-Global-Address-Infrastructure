import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { isFrenchShippingCountry,normalizeFrenchShippingField } from './frenchShippingAddress';

export type WestAfricaAddressTopology =
  | 'english-address'
  | 'latin-french'
  | 'latin-portuguese'
  | 'latin-address';

export type WestAfricaEnglishAlgorithm =
  | 'west-africa-english-domestic-international'
  | 'west-africa-francophone-international-shipping'
  | 'lusophone-west-africa-international-shipping'
  | 'cameroon-french-english-bilingual-address';

export type WestAfricaAddressTranslationRoute = AddressTranslationRoute<WestAfricaAddressTopology, WestAfricaEnglishAlgorithm>;

export type WestAfricaAddressTranslationProfile = AddressTranslationProfile<WestAfricaAddressTopology, WestAfricaEnglishAlgorithm>;


const WEST_AFRICA_ADDRESS_TRANSLATION_PROFILES: Record<string, WestAfricaAddressTranslationProfile> = {
  NG: { countryCode: 'NG', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'west-africa-english-domestic-international' },
  GH: { countryCode: 'GH', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'west-africa-english-domestic-international' },
  CI: { countryCode: 'CI', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'west-africa-francophone-international-shipping' },
  SN: { countryCode: 'SN', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'west-africa-francophone-international-shipping' },
  BF: { countryCode: 'BF', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'west-africa-francophone-international-shipping' },
  ML: { countryCode: 'ML', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'west-africa-francophone-international-shipping' },
  NE: { countryCode: 'NE', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'west-africa-francophone-international-shipping' },
  TG: { countryCode: 'TG', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'west-africa-francophone-international-shipping' },
  BJ: { countryCode: 'BJ', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'west-africa-francophone-international-shipping' },
  LR: { countryCode: 'LR', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'west-africa-english-domestic-international' },
  SL: { countryCode: 'SL', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'west-africa-english-domestic-international' },
  GM: { countryCode: 'GM', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'west-africa-english-domestic-international' },
  CM: { countryCode: 'CM', nativeLanguages: ['fr', 'en'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'cameroon-french-english-bilingual-address' },
  GN: { countryCode: 'GN', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'west-africa-francophone-international-shipping' },
  GW: { countryCode: 'GW', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-portuguese', englishAlgorithm: 'lusophone-west-africa-international-shipping' },
  CV: { countryCode: 'CV', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-portuguese', englishAlgorithm: 'lusophone-west-africa-international-shipping' },
};

const WEST_AFRICA_TOPOLOGY_BY_LANGUAGE: Record<string, WestAfricaAddressTopology> = {
  en: 'english-address',
  fr: 'latin-french',
  pt: 'latin-portuguese',
};

const COMMON_WEST_AFRICA_ADDRESS_TERMS: Record<string, string> = {
  Name: 'Name',
  Recipient: 'Recipient',
  Street: 'Street',
  City: 'City',
  State: 'State',
  Region: 'Region',
  District: 'District',
  County: 'County',
  Province: 'Province',
  Nom: 'Name',
  Destinataire: 'Recipient',
  Rue: 'Street',
  Avenue: 'Avenue',
  Ville: 'City',
  Commune: 'Municipality',
  Departement: 'Department',
  Département: 'Department',
  Région: 'Region',
  Cercle: 'Circle',
  Prefecture: 'Prefecture',
  Préfecture: 'Prefecture',
  Quartier: 'Quarter',
  Village: 'Village',
  Numero: 'Number',
  Numéro: 'Number',
  'Code postal': 'Postal Code',
  'Boîte postale': 'PO Box',
  'Boite postale': 'PO Box',
  Nome: 'Name',
  Destinatário: 'Recipient',
  Destinatario: 'Recipient',
  Rua: 'Street',
  Cidade: 'City',
  Municipio: 'Municipality',
  Município: 'Municipality',
  Regiao: 'Region',
  Região: 'Region',
  Concelho: 'Municipality',
  Sector: 'Sector',
  Setor: 'Sector',
  Localidade: 'Locality',
  Ilha: 'Island',
  Freguesia: 'Parish',
  Número: 'Number',
  'Código Postal': 'Postal Code',
  'Codigo Postal': 'Postal Code',
};

const WEST_AFRICA_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  NG: {
    Nigeria: 'Nigeria',
    Abuja: 'Abuja',
    Lagos: 'Lagos',
    Kano: 'Kano',
    Ibadan: 'Ibadan',
  },
  GH: {
    Ghana: 'Ghana',
    Accra: 'Accra',
    Kumasi: 'Kumasi',
    Tamale: 'Tamale',
  },
  CI: {
    'Côte d’Ivoire': 'Ivory Coast',
    "Côte d'Ivoire": 'Ivory Coast',
    "Cote d'Ivoire": 'Ivory Coast',
    'Cote dIvoire': 'Ivory Coast',
    "République de Côte d'Ivoire": 'Ivory Coast',
    Abidjan: 'Abidjan',
    Yamoussoukro: 'Yamoussoukro',
  },
  SN: {
    Sénégal: 'Senegal',
    Senegal: 'Senegal',
    Dakar: 'Dakar',
    'Saint-Louis': 'Saint-Louis',
  },
  BF: {
    'Burkina Faso': 'Burkina Faso',
    Ouagadougou: 'Ouagadougou',
    'Bobo-Dioulasso': 'Bobo-Dioulasso',
  },
  ML: {
    Mali: 'Mali',
    Bamako: 'Bamako',
    Kidal: 'Kidal',
    Tombouctou: 'Timbuktu',
    Timbuktu: 'Timbuktu',
  },
  NE: {
    Niger: 'Niger',
    Niamey: 'Niamey',
    Zinder: 'Zinder',
  },
  TG: {
    Togo: 'Togo',
    Lomé: 'Lome',
    Lome: 'Lome',
  },
  BJ: {
    Bénin: 'Benin',
    Benin: 'Benin',
    Cotonou: 'Cotonou',
    'Porto-Novo': 'Porto-Novo',
  },
  LR: {
    Liberia: 'Liberia',
    Monrovia: 'Monrovia',
  },
  SL: {
    'Sierra Leone': 'Sierra Leone',
    Freetown: 'Freetown',
  },
  GM: {
    Gambie: 'Gambia',
    Gambia: 'Gambia',
    Banjul: 'Banjul',
  },
  CM: {
    Cameroun: 'Cameroon',
    Cameroon: 'Cameroon',
    Yaoundé: 'Yaounde',
    Yaounde: 'Yaounde',
    Douala: 'Douala',
  },
  GN: {
    Guinée: 'Guinea',
    Guinee: 'Guinea',
    Guinea: 'Guinea',
    Conakry: 'Conakry',
  },
  GW: {
    'Guiné-Bissau': 'Guinea-Bissau',
    'Guine-Bissau': 'Guinea-Bissau',
    'Guiné Bissau': 'Guinea-Bissau',
    'Guinea-Bissau': 'Guinea-Bissau',
    Bissau: 'Bissau',
  },
  CV: {
    'Cabo Verde': 'Cape Verde',
    'Cape Verde': 'Cape Verde',
    Praia: 'Praia',
    Mindelo: 'Mindelo',
  },
};


function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode);
}

export function getWestAfricaAddressTranslationProfile(countryCode: string) {
  return WEST_AFRICA_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeWestAfricaAddressLanguage(
  language: string | undefined | null,
  profile: WestAfricaAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: WestAfricaAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: WestAfricaAddressTranslationProfile) {
  return WEST_AFRICA_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseWestAfricaAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): WestAfricaAddressTranslationRoute | null {
  const profile = getWestAfricaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeWestAfricaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeWestAfricaAddressLanguage(options.targetLanguage, profile);
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

function normalizeWestAfricaEnglish(
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
  const aliases = WEST_AFRICA_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_WEST_AFRICA_ADDRESS_TERMS[text]) return COMMON_WEST_AFRICA_ADDRESS_TERMS[text];

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  return normalizeEnglishAddressPart(text, code);
}

export async function translateWestAfricaAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: WestAfricaAddressTranslationRoute } | null> {
  const profile = getWestAfricaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseWestAfricaAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeWestAfricaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeWestAfricaAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeWestAfricaEnglish(
      value,
      profile.countryCode,
      options.fieldKey,
      sourceLanguage,
    ),
    translator: options.translator,
  });
}
