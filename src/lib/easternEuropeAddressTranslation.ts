import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { isMajorEuropeanShippingCountry,normalizeMajorEuropeanShippingField } from './majorEuropeanShippingAddress';

export type EasternEuropeAddressTopology =
  | 'latin-address'
  | 'latin-romance'
  | 'latin-south-slavic'
  | 'latin-albanian'
  | 'latin-turkic'
  | 'cyrillic-slavic'
  | 'armenian-script'
  | 'georgian-script';

export type EasternEuropeEnglishAlgorithm =
  | 'romanian-posta-romana-international-shipping'
  | 'bulgarian-balgarski-poshti-address'
  | 'ukrainian-ukrposhta-address'
  | 'moldova-romanian-address'
  | 'belarus-belpost-bilingual-address'
  | 'russian-pochta-rossii-address'
  | 'serbian-posta-srbije-address'
  | 'bosnia-trilingual-address'
  | 'montenegro-posta-crne-gore-address'
  | 'kosovo-albanian-serbian-address'
  | 'albanian-posta-shqiptare-address'
  | 'north-macedonia-makedonska-posta-address'
  | 'armenian-haypost-address'
  | 'azerbaijan-azpost-address'
  | 'georgian-gpost-address';

export type EasternEuropeAddressTranslationRoute = AddressTranslationRoute<EasternEuropeAddressTopology, EasternEuropeEnglishAlgorithm>;

export type EasternEuropeAddressTranslationProfile = AddressTranslationProfile<EasternEuropeAddressTopology, EasternEuropeEnglishAlgorithm>;


const EASTERN_EUROPE_ADDRESS_TRANSLATION_PROFILES: Record<string, EasternEuropeAddressTranslationProfile> = {
  RO: { countryCode: 'RO', nativeLanguages: ['ro'], defaultLanguage: 'ro', defaultTopology: 'latin-romance', englishAlgorithm: 'romanian-posta-romana-international-shipping' },
  BG: { countryCode: 'BG', nativeLanguages: ['bg'], defaultLanguage: 'bg', defaultTopology: 'cyrillic-slavic', englishAlgorithm: 'bulgarian-balgarski-poshti-address' },
  UA: { countryCode: 'UA', nativeLanguages: ['uk'], defaultLanguage: 'uk', defaultTopology: 'cyrillic-slavic', englishAlgorithm: 'ukrainian-ukrposhta-address' },
  MD: { countryCode: 'MD', nativeLanguages: ['ro'], defaultLanguage: 'ro', defaultTopology: 'latin-romance', englishAlgorithm: 'moldova-romanian-address' },
  BY: { countryCode: 'BY', nativeLanguages: ['be', 'ru'], defaultLanguage: 'be', defaultTopology: 'cyrillic-slavic', englishAlgorithm: 'belarus-belpost-bilingual-address' },
  RU: { countryCode: 'RU', nativeLanguages: ['ru'], defaultLanguage: 'ru', defaultTopology: 'cyrillic-slavic', englishAlgorithm: 'russian-pochta-rossii-address' },
  RS: { countryCode: 'RS', nativeLanguages: ['sr'], defaultLanguage: 'sr', defaultTopology: 'cyrillic-slavic', englishAlgorithm: 'serbian-posta-srbije-address' },
  BA: { countryCode: 'BA', nativeLanguages: ['bs', 'hr', 'sr'], defaultLanguage: 'bs', defaultTopology: 'latin-south-slavic', englishAlgorithm: 'bosnia-trilingual-address' },
  ME: { countryCode: 'ME', nativeLanguages: ['cnr'], defaultLanguage: 'cnr', defaultTopology: 'latin-south-slavic', englishAlgorithm: 'montenegro-posta-crne-gore-address' },
  XK: { countryCode: 'XK', nativeLanguages: ['sq', 'sr'], defaultLanguage: 'sq', defaultTopology: 'latin-albanian', englishAlgorithm: 'kosovo-albanian-serbian-address' },
  AL: { countryCode: 'AL', nativeLanguages: ['sq'], defaultLanguage: 'sq', defaultTopology: 'latin-albanian', englishAlgorithm: 'albanian-posta-shqiptare-address' },
  MK: { countryCode: 'MK', nativeLanguages: ['mk'], defaultLanguage: 'mk', defaultTopology: 'cyrillic-slavic', englishAlgorithm: 'north-macedonia-makedonska-posta-address' },
  AM: { countryCode: 'AM', nativeLanguages: ['hy'], defaultLanguage: 'hy', defaultTopology: 'armenian-script', englishAlgorithm: 'armenian-haypost-address' },
  AZ: { countryCode: 'AZ', nativeLanguages: ['az'], defaultLanguage: 'az', defaultTopology: 'latin-turkic', englishAlgorithm: 'azerbaijan-azpost-address' },
  GE: { countryCode: 'GE', nativeLanguages: ['ka'], defaultLanguage: 'ka', defaultTopology: 'georgian-script', englishAlgorithm: 'georgian-gpost-address' },
};

const EASTERN_EUROPE_TOPOLOGY_BY_LANGUAGE: Record<string, EasternEuropeAddressTopology> = {
  en: 'latin-address',
  ro: 'latin-romance',
  bs: 'latin-south-slavic',
  hr: 'latin-south-slavic',
  cnr: 'latin-south-slavic',
  sq: 'latin-albanian',
  az: 'latin-turkic',
  bg: 'cyrillic-slavic',
  uk: 'cyrillic-slavic',
  be: 'cyrillic-slavic',
  ru: 'cyrillic-slavic',
  sr: 'cyrillic-slavic',
  mk: 'cyrillic-slavic',
  hy: 'armenian-script',
  ka: 'georgian-script',
};

const COMMON_EASTERN_EUROPE_ADDRESS_TERMS: Record<string, string> = {
  Nume: 'Name',
  Ime: 'Name',
  Emri: 'Name',
  Ad: 'Name',
  Име: 'Name',
  Имя: 'Name',
  'Імʼя': 'Name',
  Імя: 'Name',
  'Ім’я': 'Name',
  Անուն: 'Name',
  სახელი: 'Name',
  Strada: 'Street',
  Stradă: 'Street',
  Ulica: 'Street',
  Rruga: 'Street',
  Küçə: 'Street',
  Kuce: 'Street',
  Улица: 'Street',
  Вулиця: 'Street',
  Вуліца: 'Street',
  Փողոց: 'Street',
  ქუჩა: 'Street',
  Număr: 'Number',
  Numar: 'Number',
  Broj: 'Number',
  Numri: 'Number',
  Номер: 'Number',
  Број: 'Number',
  Dom: 'House Number',
  Дом: 'House Number',
  Cod: 'Code',
  'Cod postal': 'Postal Code',
  'Cod poștal': 'Postal Code',
  'Poštanski broj': 'Postal Code',
  'Postanski broj': 'Postal Code',
  'Kodi postar': 'Postal Code',
  'Poçt indeksi': 'Postal Code',
  'Пощенски код': 'Postal Code',
  'Поштовий індекс': 'Postal Code',
  Индекс: 'Postal Code',
  'Паштовы індэкс': 'Postal Code',
  'Поштенски број': 'Postal Code',
  'Փոստային ինդեքս': 'Postal Code',
  'საფოსტო ინდექსი': 'Postal Code',
  Oraș: 'City',
  Oras: 'City',
  Grad: 'City',
  Qytet: 'City',
  Qyteti: 'City',
  Şəhər: 'City',
  Seher: 'City',
  Град: 'City',
  Місто: 'City',
  Город: 'City',
  Қала: 'City',
  Քաղաք: 'City',
  ქალაქი: 'City',
  Județ: 'County',
  Judet: 'County',
  Област: 'Region',
  Область: 'Region',
  Raion: 'District',
  Район: 'District',
  Općina: 'Municipality',
  Opcina: 'Municipality',
  Komuna: 'Municipality',
  Општина: 'Municipality',
  Համայնք: 'Municipality',
  მუნიციპალიტეტი: 'Municipality',
};

const EASTERN_EUROPE_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  RO: {
    România: 'Romania',
    Romania: 'Romania',
    București: 'Bucharest',
    Bucuresti: 'Bucharest',
    Cluj: 'Cluj-Napoca',
  },
  BG: {
    България: 'Bulgaria',
    София: 'Sofia',
    Пловдив: 'Plovdiv',
    Варна: 'Varna',
  },
  UA: {
    Україна: 'Ukraine',
    Київ: 'Kyiv',
    Львів: 'Lviv',
    Харків: 'Kharkiv',
    Одеса: 'Odesa',
  },
  MD: {
    Молдова: 'Moldova',
    Moldova: 'Moldova',
    Chișinău: 'Chisinau',
    Chisinau: 'Chisinau',
    Кишинёв: 'Chisinau',
  },
  BY: {
    Беларусь: 'Belarus',
    Білорусь: 'Belarus',
    Мінск: 'Minsk',
    Минск: 'Minsk',
  },
  RU: {
    Россия: 'Russia',
    Москва: 'Moscow',
    'Санкт-Петербург': 'Saint Petersburg',
    Новосибирск: 'Novosibirsk',
  },
  RS: {
    Србија: 'Serbia',
    Београд: 'Belgrade',
    Beograd: 'Belgrade',
    'Novi Sad': 'Novi Sad',
  },
  BA: {
    'Bosna i Hercegovina': 'Bosnia and Herzegovina',
    Sarajevo: 'Sarajevo',
    'Banja Luka': 'Banja Luka',
    Mostar: 'Mostar',
  },
  ME: {
    'Crna Gora': 'Montenegro',
    'Црна Гора': 'Montenegro',
    Podgorica: 'Podgorica',
    Подгорица: 'Podgorica',
  },
  XK: {
    Kosova: 'Kosovo',
    Kosovo: 'Kosovo',
    Kosovë: 'Kosovo',
    Prishtina: 'Pristina',
    Prishtinë: 'Pristina',
    Приштина: 'Pristina',
  },
  AL: {
    Shqipëri: 'Albania',
    Shqiperi: 'Albania',
    Tiranë: 'Tirana',
    Tirane: 'Tirana',
    Durrës: 'Durres',
    Durres: 'Durres',
  },
  MK: {
    'Северна Македонија': 'North Macedonia',
    Македонија: 'North Macedonia',
    Скопје: 'Skopje',
    Битола: 'Bitola',
  },
  AM: {
    Հայաստան: 'Armenia',
    Երևան: 'Yerevan',
    Երեւան: 'Yerevan',
    Գյումրի: 'Gyumri',
    'Կոտայքի մարզ': 'Kotayk Region',
  },
  AZ: {
    Azərbaycan: 'Azerbaijan',
    Bakı: 'Baku',
    Baki: 'Baku',
    Gəncə: 'Ganja',
    Gence: 'Ganja',
  },
  GE: {
    საქართველო: 'Georgia',
    თბილისი: 'Tbilisi',
    ბათუმი: 'Batumi',
    ქუთაისი: 'Kutaisi',
    'აჭარის ავტონომიური რესპუბლიკა': 'Adjara Autonomous Republic',
  },
};


function countryCodeOf(countryCode: string) {
  return (countryCode || '').trim().toUpperCase().replace(/-/g, '_');
}

export function getEasternEuropeAddressTranslationProfile(countryCode: string) {
  return EASTERN_EUROPE_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeEasternEuropeAddressLanguage(
  language: string | undefined | null,
  profile: EasternEuropeAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: EasternEuropeAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: EasternEuropeAddressTranslationProfile) {
  return EASTERN_EUROPE_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseEasternEuropeAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): EasternEuropeAddressTranslationRoute | null {
  const profile = getEasternEuropeAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeEasternEuropeAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeEasternEuropeAddressLanguage(options.targetLanguage, profile);
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

function normalizeEasternEuropeEnglish(text: string, countryCode: string, fieldKey: string) {
  const code = countryCodeOf(countryCode);
  if (isMajorEuropeanShippingCountry(code)) {
    return normalizeMajorEuropeanShippingField({
      countryCode: code,
      fieldKey,
      text,
      mode: 'international-shipping',
    });
  }
  const aliases = EASTERN_EUROPE_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_EASTERN_EUROPE_ADDRESS_TERMS[text]) return COMMON_EASTERN_EUROPE_ADDRESS_TERMS[text];

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  return normalizeEnglishAddressPart(text, code);
}

export async function translateEasternEuropeAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: EasternEuropeAddressTranslationRoute } | null> {
  const profile = getEasternEuropeAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseEasternEuropeAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeEasternEuropeAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeEasternEuropeAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeEasternEuropeEnglish(value, profile.countryCode, options.fieldKey),
    translator: options.translator,
  });
}
