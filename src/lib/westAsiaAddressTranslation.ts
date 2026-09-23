import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { romanizeArabicShippingText } from './arabicShippingAddress';

export type WestAsiaAddressTopology =
  | 'latin-turkic'
  | 'persian-arabic'
  | 'arabic-abjad'
  | 'hebrew-abjad'
  | 'latin-address';

export type WestAsiaEnglishAlgorithm =
  | 'turkish-standard-romanization'
  | 'persian-romanization'
  | 'arabic-iraq-romanization'
  | 'arabic-syria-romanization'
  | 'arabic-lebanon-romanization'
  | 'arabic-jordan-romanization'
  | 'hebrew-arabic-bilingual-romanization'
  | 'arabic-palestine-romanization'
  | 'arabic-saudi-romanization'
  | 'gulf-arabic-international-shipping'
  | 'arabic-yemen-romanization';

export type WestAsiaAddressTranslationRoute = AddressTranslationRoute<WestAsiaAddressTopology, WestAsiaEnglishAlgorithm>;

export type WestAsiaAddressTranslationProfile = AddressTranslationProfile<WestAsiaAddressTopology, WestAsiaEnglishAlgorithm>;


const WEST_ASIA_ADDRESS_TRANSLATION_PROFILES: Record<string, WestAsiaAddressTranslationProfile> = {
  TR: { countryCode: 'TR', nativeLanguages: ['tr'], defaultLanguage: 'tr', defaultTopology: 'latin-turkic', englishAlgorithm: 'turkish-standard-romanization' },
  IR: { countryCode: 'IR', nativeLanguages: ['fa'], defaultLanguage: 'fa', defaultTopology: 'persian-arabic', englishAlgorithm: 'persian-romanization' },
  IQ: { countryCode: 'IQ', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'arabic-iraq-romanization' },
  SY: { countryCode: 'SY', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'arabic-syria-romanization' },
  LB: { countryCode: 'LB', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'arabic-lebanon-romanization' },
  JO: { countryCode: 'JO', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'arabic-jordan-romanization' },
  IL: { countryCode: 'IL', nativeLanguages: ['he', 'ar'], defaultLanguage: 'he', defaultTopology: 'hebrew-abjad', englishAlgorithm: 'hebrew-arabic-bilingual-romanization' },
  PS: { countryCode: 'PS', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'arabic-palestine-romanization' },
  SA: { countryCode: 'SA', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'arabic-saudi-romanization' },
  AE: { countryCode: 'AE', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'gulf-arabic-international-shipping' },
  QA: { countryCode: 'QA', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'gulf-arabic-international-shipping' },
  BH: { countryCode: 'BH', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'gulf-arabic-international-shipping' },
  KW: { countryCode: 'KW', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'gulf-arabic-international-shipping' },
  OM: { countryCode: 'OM', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'gulf-arabic-international-shipping' },
  YE: { countryCode: 'YE', nativeLanguages: ['ar'], defaultLanguage: 'ar', defaultTopology: 'arabic-abjad', englishAlgorithm: 'arabic-yemen-romanization' },
};

const WEST_ASIA_TOPOLOGY_BY_LANGUAGE: Record<string, WestAsiaAddressTopology> = {
  tr: 'latin-turkic',
  fa: 'persian-arabic',
  ar: 'arabic-abjad',
  he: 'hebrew-abjad',
  en: 'latin-address',
};

const COMMON_ARABIC_ADDRESS_TERMS: Record<string, string> = {
  الاسم: 'Name',
  اسم: 'Name',
  الشارع: 'Street',
  شارع: 'Street',
  الطريق: 'Road',
  طريق: 'Road',
  المدينة: 'City',
  مدينة: 'City',
  المنطقة: 'Area',
  منطقة: 'Area',
  الحي: 'District',
  حي: 'District',
  المحافظة: 'Governorate',
  محافظة: 'Governorate',
  الإمارة: 'Emirate',
  إمارة: 'Emirate',
  امارة: 'Emirate',
  المبنى: 'Building',
  مبنى: 'Building',
  رقم: 'No.',
  الرمز: 'Postal Code',
  'الرمز البريدي': 'Postal Code',
  'رمز بريدي': 'Postal Code',
};

const COMMON_HEBREW_ADDRESS_TERMS: Record<string, string> = {
  שם: 'Name',
  רחוב: 'Street',
  עיר: 'City',
  אזור: 'Area',
  מחוז: 'District',
  מיקוד: 'Postal Code',
  בניין: 'Building',
};

const WEST_ASIA_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  TR: {
    Türkiye: 'Turkiye',
    İstanbul: 'Istanbul',
    Ankara: 'Ankara',
    İzmir: 'Izmir',
    Sokak: 'Street',
    Cadde: 'Avenue',
    Mahalle: 'Neighborhood',
    'Posta Kodu': 'Postal Code',
  },
  IR: {
    ایران: 'Iran',
    تهران: 'Tehran',
    اصفهان: 'Isfahan',
    شیراز: 'Shiraz',
    تبریز: 'Tabriz',
    خیابان: 'Street',
    کوچه: 'Alley',
    شهر: 'City',
    استان: 'Province',
    'کد پستی': 'Postal Code',
  },
  IQ: {
    العراق: 'Iraq',
    بغداد: 'Baghdad',
    البصرة: 'Basra',
    أربيل: 'Erbil',
  },
  SY: {
    سوريا: 'Syria',
    دمشق: 'Damascus',
    حلب: 'Aleppo',
  },
  LB: {
    لبنان: 'Lebanon',
    بيروت: 'Beirut',
    طرابلس: 'Tripoli',
  },
  JO: {
    الأردن: 'Jordan',
    عمان: 'Amman',
    الزرقاء: 'Zarqa',
    إربد: 'Irbid',
  },
  IL: {
    ישראל: 'Israel',
    ירושלים: 'Jerusalem',
    'תל אביב': 'Tel Aviv',
    חיפה: 'Haifa',
    'تل أبيب': 'Tel Aviv',
    'تل אביב': 'Tel Aviv',
    القدس: 'Jerusalem',
  },
  PS: {
    فلسطين: 'Palestine',
    'رام الله': 'Ramallah',
    غزة: 'Gaza',
    نابلس: 'Nablus',
  },
  SA: {
    'المملكة العربية السعودية': 'Saudi Arabia',
    السعودية: 'Saudi Arabia',
    الرياض: 'Riyadh',
    جدة: 'Jeddah',
    مكة: 'Mecca',
    المدينة: 'Medina',
  },
  AE: {
    الإمارات: 'United Arab Emirates',
    دبي: 'Dubai',
    'أبو ظبي': 'Abu Dhabi',
    الشارقة: 'Sharjah',
  },
  QA: {
    قطر: 'Qatar',
    الدوحة: 'Doha',
  },
  BH: {
    البحرين: 'Bahrain',
    المنامة: 'Manama',
  },
  KW: {
    الكويت: 'Kuwait',
    'مدينة الكويت': 'Kuwait City',
  },
  OM: {
    عمان: 'Oman',
    مسقط: 'Muscat',
  },
  YE: {
    اليمن: 'Yemen',
    صنعاء: 'Sanaa',
    عدن: 'Aden',
  },
};


function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode);
}

export function getWestAsiaAddressTranslationProfile(countryCode: string) {
  return WEST_ASIA_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeWestAsiaAddressLanguage(language: string | undefined | null, profile: WestAsiaAddressTranslationProfile) {
  return normalizeAddressTranslationLanguage(language, profile);
}

function isAllowedLanguage(language: string, profile: WestAsiaAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: WestAsiaAddressTranslationProfile): WestAsiaAddressTopology {
  return WEST_ASIA_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseWestAsiaAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): WestAsiaAddressTranslationRoute | null {
  const profile = getWestAsiaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeWestAsiaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeWestAsiaAddressLanguage(options.targetLanguage, profile);
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

function normalizeWestAsiaEnglish(text: string, countryCode: string, fieldKey: string) {
  const code = countryCodeOf(countryCode);
  const aliases = WEST_ASIA_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];
  if (COMMON_ARABIC_ADDRESS_TERMS[text]) return COMMON_ARABIC_ADDRESS_TERMS[text];
  if (COMMON_HEBREW_ADDRESS_TERMS[text]) return COMMON_HEBREW_ADDRESS_TERMS[text];
  if (/\p{Script=Arabic}/u.test(text)) {
    return romanizeArabicShippingText(text).text;
  }

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  return normalizeEnglishAddressPart(text, code);
}

export async function translateWestAsiaAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: WestAsiaAddressTranslationRoute } | null> {
  const profile = getWestAsiaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseWestAsiaAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeWestAsiaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeWestAsiaAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeWestAsiaEnglish(value, profile.countryCode, options.fieldKey),
    translator: options.translator,
  });
}
