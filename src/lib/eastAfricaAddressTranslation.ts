import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { isFrenchShippingCountry,normalizeFrenchShippingField } from './frenchShippingAddress';

export type EastAfricaAddressTopology =
  | 'english-address'
  | 'latin-french'
  | 'latin-portuguese'
  | 'latin-swahili'
  | 'latin-somali'
  | 'latin-bantu'
  | 'latin-creole'
  | 'ethiopic-abugida'
  | 'arabic-abjad'
  | 'latin-address';

export type EastAfricaEnglishAlgorithm =
  | 'comoros-french-arabic-address'
  | 'djibouti-french-arabic-address'
  | 'eritrea-tigrinya-english-address'
  | 'ethiopia-amharic-english-address'
  | 'east-africa-english-swahili-address'
  | 'east-africa-swahili-english-address'
  | 'madagascar-french-international-shipping'
  | 'malawi-english-chichewa-address'
  | 'mauritius-english-french-address'
  | 'mozambique-portuguese-international-shipping'
  | 'rwanda-english-french-swahili-address'
  | 'seychelles-english-french-creole-address'
  | 'somalia-somali-arabic-english-address'
  | 'south-sudan-english-address'
  | 'zambia-english-bemba-address';

export type EastAfricaAddressTranslationRoute = AddressTranslationRoute<EastAfricaAddressTopology, EastAfricaEnglishAlgorithm>;

export type EastAfricaAddressTranslationProfile = AddressTranslationProfile<EastAfricaAddressTopology, EastAfricaEnglishAlgorithm>;


const EAST_AFRICA_ADDRESS_TRANSLATION_PROFILES: Record<string, EastAfricaAddressTranslationProfile> = {
  KM: { countryCode: 'KM', nativeLanguages: ['fr', 'ar'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'comoros-french-arabic-address' },
  DJ: { countryCode: 'DJ', nativeLanguages: ['fr', 'ar'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'djibouti-french-arabic-address' },
  ER: { countryCode: 'ER', nativeLanguages: ['ti', 'en'], defaultLanguage: 'ti', defaultTopology: 'ethiopic-abugida', englishAlgorithm: 'eritrea-tigrinya-english-address' },
  ET: { countryCode: 'ET', nativeLanguages: ['am', 'en'], defaultLanguage: 'am', defaultTopology: 'ethiopic-abugida', englishAlgorithm: 'ethiopia-amharic-english-address' },
  KE: { countryCode: 'KE', nativeLanguages: ['en', 'sw'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'east-africa-english-swahili-address' },
  MG: { countryCode: 'MG', nativeLanguages: ['fr'], defaultLanguage: 'fr', defaultTopology: 'latin-french', englishAlgorithm: 'madagascar-french-international-shipping' },
  MW: { countryCode: 'MW', nativeLanguages: ['en', 'ny'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'malawi-english-chichewa-address' },
  MU: { countryCode: 'MU', nativeLanguages: ['en', 'fr'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'mauritius-english-french-address' },
  MZ: { countryCode: 'MZ', nativeLanguages: ['pt'], defaultLanguage: 'pt', defaultTopology: 'latin-portuguese', englishAlgorithm: 'mozambique-portuguese-international-shipping' },
  RW: { countryCode: 'RW', nativeLanguages: ['en', 'fr', 'sw'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'rwanda-english-french-swahili-address' },
  SC: { countryCode: 'SC', nativeLanguages: ['en', 'fr', 'crs'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'seychelles-english-french-creole-address' },
  SO: { countryCode: 'SO', nativeLanguages: ['so', 'ar', 'en'], defaultLanguage: 'so', defaultTopology: 'latin-somali', englishAlgorithm: 'somalia-somali-arabic-english-address' },
  SS: { countryCode: 'SS', nativeLanguages: ['en'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'south-sudan-english-address' },
  TZ: { countryCode: 'TZ', nativeLanguages: ['sw', 'en'], defaultLanguage: 'sw', defaultTopology: 'latin-swahili', englishAlgorithm: 'east-africa-swahili-english-address' },
  UG: { countryCode: 'UG', nativeLanguages: ['en', 'sw'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'east-africa-english-swahili-address' },
  ZM: { countryCode: 'ZM', nativeLanguages: ['en', 'bem'], defaultLanguage: 'en', defaultTopology: 'english-address', englishAlgorithm: 'zambia-english-bemba-address' },
};

const EAST_AFRICA_TOPOLOGY_BY_LANGUAGE: Record<string, EastAfricaAddressTopology> = {
  en: 'english-address',
  fr: 'latin-french',
  pt: 'latin-portuguese',
  sw: 'latin-swahili',
  so: 'latin-somali',
  ny: 'latin-bantu',
  bem: 'latin-bantu',
  crs: 'latin-creole',
  am: 'ethiopic-abugida',
  ti: 'ethiopic-abugida',
  ar: 'arabic-abjad',
};

const COMMON_EAST_AFRICA_ADDRESS_TERMS: Record<string, string> = {
  Name: 'Name',
  Recipient: 'Recipient',
  Street: 'Street',
  Road: 'Road',
  City: 'City',
  Town: 'Town',
  State: 'State',
  Region: 'Region',
  Province: 'Province',
  District: 'District',
  Municipality: 'Municipality',
  Commune: 'Municipality',
  Village: 'Village',
  Ward: 'Ward',
  Sector: 'Sector',
  Number: 'Number',
  'Postal Code': 'Postal Code',
  Postcode: 'Postal Code',
  Nom: 'Name',
  Destinataire: 'Recipient',
  Rue: 'Street',
  Avenue: 'Avenue',
  Ville: 'City',
  Localité: 'Locality',
  Localite: 'Locality',
  Quartier: 'Quarter',
  'Code postal': 'Postal Code',
  Nome: 'Name',
  Destinatário: 'Recipient',
  Destinatario: 'Recipient',
  Rua: 'Street',
  Cidade: 'City',
  Província: 'Province',
  Provincia: 'Province',
  Município: 'Municipality',
  Municipio: 'Municipality',
  Bairro: 'Neighborhood',
  Localidade: 'Locality',
  'Código Postal': 'Postal Code',
  'Codigo Postal': 'Postal Code',
  Jina: 'Name',
  Barabara: 'Street',
  Njia: 'Road',
  Mtaa: 'Neighborhood',
  Jiji: 'City',
  Mkoa: 'Region',
  Wilaya: 'District',
  Kata: 'Ward',
  Kijiji: 'Village',
  'Msimbo wa posta': 'Postal Code',
  Izina: 'Name',
  Umuhanda: 'Street',
  Umujyi: 'City',
  Akarere: 'District',
  Intara: 'Province',
  Umurenge: 'Sector',
  Magac: 'Name',
  Waddo: 'Street',
  Magaalo: 'City',
  Gobol: 'Region',
  Degmo: 'District',
  Xaafad: 'Neighborhood',
  'Koodhka boostada': 'Postal Code',
  Dzina: 'Name',
  Msewu: 'Street',
  Mzinda: 'City',
  Chigawo: 'Region',
  Ishina: 'Name',
  Umusebo: 'Road',
  ስም: 'Name',
  መንገድ: 'Street',
  ከተማ: 'City',
  ክልል: 'Region',
  ወረዳ: 'District',
  ቀበሌ: 'Kebele',
  'ፖስታ ኮድ': 'Postal Code',
  መንገዲ: 'Street',
  ዞባ: 'Region',
  'ንኡስ ዞባ': 'Subregion',
  الاسم: 'Name',
  اسم: 'Name',
  الشارع: 'Street',
  شارع: 'Street',
  المدينة: 'City',
  مدينة: 'City',
  المنطقة: 'Area',
  منطقة: 'Area',
  'الرمز البريدي': 'Postal Code',
};

const EAST_AFRICA_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  KM: {
    Comores: 'Comoros',
    Comoros: 'Comoros',
    'جزر القمر': 'Comoros',
    Moroni: 'Moroni',
    موروني: 'Moroni',
  },
  DJ: {
    Djibouti: 'Djibouti',
    Jabuuti: 'Djibouti',
    جيبوتي: 'Djibouti',
    'Ville de Djibouti': 'Djibouti City',
    'Djibouti City': 'Djibouti City',
  },
  ER: {
    ኤርትራ: 'Eritrea',
    Eritrea: 'Eritrea',
    Asmara: 'Asmara',
    ኣስመራ: 'Asmara',
  },
  ET: {
    ኢትዮጵያ: 'Ethiopia',
    Ethiopia: 'Ethiopia',
    'አዲስ አበባ': 'Addis Ababa',
    'Addis Ababa': 'Addis Ababa',
    Dire: 'Dire',
  },
  KE: {
    Kenya: 'Kenya',
    Nairobi: 'Nairobi',
    Mombasa: 'Mombasa',
    Kisumu: 'Kisumu',
  },
  MG: {
    Madagascar: 'Madagascar',
    Antananarivo: 'Antananarivo',
    Toamasina: 'Toamasina',
  },
  MW: {
    Malawi: 'Malawi',
    Lilongwe: 'Lilongwe',
    Blantyre: 'Blantyre',
  },
  MU: {
    Maurice: 'Mauritius',
    Moris: 'Mauritius',
    Mauritius: 'Mauritius',
    'Port Louis': 'Port Louis',
  },
  MZ: {
    Moçambique: 'Mozambique',
    Mocambique: 'Mozambique',
    Mozambique: 'Mozambique',
    Maputo: 'Maputo',
    Beira: 'Beira',
  },
  RW: {
    Rwanda: 'Rwanda',
    Kigali: 'Kigali',
  },
  SC: {
    Seychelles: 'Seychelles',
    Sesel: 'Seychelles',
    Victoria: 'Victoria',
  },
  SO: {
    Soomaaliya: 'Somalia',
    Somalia: 'Somalia',
    Muqdisho: 'Mogadishu',
    Mogadishu: 'Mogadishu',
    Hargeysa: 'Hargeisa',
    Hargeisa: 'Hargeisa',
  },
  SS: {
    'South Sudan': 'South Sudan',
    Juba: 'Juba',
  },
  TZ: {
    Tanzania: 'Tanzania',
    'Dar es Salaam': 'Dar es Salaam',
    Dodoma: 'Dodoma',
    Arusha: 'Arusha',
  },
  UG: {
    Uganda: 'Uganda',
    Kampala: 'Kampala',
    Entebbe: 'Entebbe',
  },
  ZM: {
    Zambia: 'Zambia',
    Lusaka: 'Lusaka',
    Ndola: 'Ndola',
  },
};


function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode);
}

export function getEastAfricaAddressTranslationProfile(countryCode: string) {
  return EAST_AFRICA_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeEastAfricaAddressLanguage(
  language: string | undefined | null,
  profile: EastAfricaAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: EastAfricaAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: EastAfricaAddressTranslationProfile) {
  return EAST_AFRICA_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseEastAfricaAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): EastAfricaAddressTranslationRoute | null {
  const profile = getEastAfricaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeEastAfricaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeEastAfricaAddressLanguage(options.targetLanguage, profile);
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

function normalizeEastAfricaEnglish(
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
  const aliases = EAST_AFRICA_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_EAST_AFRICA_ADDRESS_TERMS[text]) return COMMON_EAST_AFRICA_ADDRESS_TERMS[text];

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  return normalizeEnglishAddressPart(text, code);
}

export async function translateEastAfricaAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: EastAfricaAddressTranslationRoute } | null> {
  const profile = getEastAfricaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseEastAfricaAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeEastAfricaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeEastAfricaAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeEastAfricaEnglish(
      value,
      profile.countryCode,
      options.fieldKey,
      sourceLanguage,
    ),
    translator: options.translator,
    normalizeEnglishIdentity: true,
  });
}
