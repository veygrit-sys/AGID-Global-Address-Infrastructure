import type { CanonicalAddress } from './addressRendering';
import { transliterateArabic,transliterateTifinagh } from './transliteration';

export type ArabicShippingCountryCode =
  | 'DZ'
  | 'BH'
  | 'KM'
  | 'DJ'
  | 'EG'
  | 'IQ'
  | 'JO'
  | 'KW'
  | 'LB'
  | 'LY'
  | 'MR'
  | 'MA'
  | 'OM'
  | 'PS'
  | 'QA'
  | 'SA'
  | 'SD'
  | 'SO'
  | 'SY'
  | 'TD'
  | 'TN'
  | 'AE'
  | 'YE';

export type ArabicShippingMode = 'domestic-arabic' | 'international-shipping';
export type ArabicAddressFamily =
  | 'gulf-national'
  | 'gulf-po-box'
  | 'levant'
  | 'north-africa'
  | 'nile'
  | 'horn-of-africa'
  | 'sahel';
export type ArabicPostcodePolicy = 'required' | 'optional' | 'not-used';
export type ArabicPostcodePosition =
  | 'left-of-locality'
  | 'right-of-locality'
  | 'separate-before-locality'
  | 'separate-after-locality'
  | 'not-used';

export type ArabicShippingWarning =
  | 'delivery_point_not_validated'
  | 'postcode_locality_pair_not_verified'
  | 'unsupported_country_profile'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'invalid_postcode_format'
  | 'postcode_not_used_by_destination'
  | 'po_box_recommended'
  | 'qatar_anwani_components_incomplete'
  | 'saudi_national_address_components_incomplete'
  | 'postal_source_version_conflict'
  | 'machine_transliteration_review_recommended'
  | 'transliteration_incomplete'
  | 'address_line_limit_exceeded'
  | 'line_length_exceeds_profile_limit';

export type ArabicShippingEvidence = {
  authority: string;
  url: string;
  checkedOn: '2026-07-25';
  sourceUpdatedOn: string;
  scope: 'destination-format-postcode-shape-and-script-policy-only';
};

export type ArabicShippingProfile = {
  countryCode: ArabicShippingCountryCode;
  nativeCountryName: string;
  englishCountryName: string;
  family: ArabicAddressFamily;
  postcodePolicy: ArabicPostcodePolicy;
  postcodePattern: string | null;
  postcodePosition: ArabicPostcodePosition;
  poBoxMode: 'supported' | 'primary' | 'not-evidenced';
  maxDomesticLines: number;
  maxInternationalLines: number;
  maxLineLength: number;
  evidenceConflict?: string;
  evidence: ArabicShippingEvidence;
};

export type ArabicShippingExtendedAddress = CanonicalAddress & {
  po_box?: string;
  unit?: string;
  floor?: string;
  block?: string;
  zone?: string;
  additional_number?: string;
  short_address?: string;
};

type ArabicAliasField =
  | 'building'
  | 'poi'
  | 'road'
  | 'subdistrict'
  | 'district'
  | 'city'
  | 'state';

export type ArabicShippingBuildOptions = {
  englishAliases?: Partial<Record<ArabicAliasField, string>>;
};

export type ArabicShippingComponentLabels = {
  organization: string;
  buildingNumber: string;
  street: string;
  unit: string;
  floor: string;
  block: string;
  zone: string;
  additionalNumber: string;
  poBox: string;
  district: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

export type ArabicRomanizationMethod =
  | 'not-applicable'
  | 'preserved-latin'
  | 'caller-approved-alias'
  | 'curated-place-alias'
  | 'deterministic-tifinagh-transliteration'
  | 'lexicon-assisted-transliteration';

export type ArabicShippingAddressResult = {
  mode: ArabicShippingMode;
  outputLanguage: 'ar' | 'en';
  profile: ArabicShippingProfile | null;
  componentLabels: ArabicShippingComponentLabels;
  normalized: ArabicShippingExtendedAddress;
  lines: string[];
  formatted: string;
  changedFields: string[];
  romanizationMethods: Partial<Record<ArabicAliasField, ArabicRomanizationMethod>>;
  appliedRules: string[];
  warnings: ArabicShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
  evidence: ArabicShippingEvidence | null;
};

const UPU_GENERAL_POSTCODE_EVIDENCE =
  'https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf';
const SAUDI_NATIONAL_ADDRESS_EVIDENCE =
  'https://splonline.com.sa/en/national-address-1/';
const QATAR_POSTAL_STANDARDS_EVIDENCE =
  'https://www.qatarpost.qa/Home/PostalStandards';
const PALESTINIAN_POSTCODE_EVIDENCE =
  'https://www.palpost.ps/home/reports/1254?culture=ar-SA';

const upuCountryEvidence = (code: string) =>
  `https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/${code}En.pdf`;

const evidence = (
  authority: string,
  url: string,
  sourceUpdatedOn: string,
): ArabicShippingEvidence => ({
  authority,
  url,
  checkedOn: '2026-07-25',
  sourceUpdatedOn,
  scope: 'destination-format-postcode-shape-and-script-policy-only',
});

const profile = (
  countryCode: ArabicShippingCountryCode,
  nativeCountryName: string,
  englishCountryName: string,
  family: ArabicAddressFamily,
  postcodePolicy: ArabicPostcodePolicy,
  postcodePattern: string | null,
  postcodePosition: ArabicPostcodePosition,
  options: {
    poBoxMode?: ArabicShippingProfile['poBoxMode'];
    maxDomesticLines?: number;
    maxInternationalLines?: number;
    maxLineLength?: number;
    evidenceConflict?: string;
    evidence: ArabicShippingEvidence;
  },
): ArabicShippingProfile => ({
  countryCode,
  nativeCountryName,
  englishCountryName,
  family,
  postcodePolicy,
  postcodePattern,
  postcodePosition,
  poBoxMode: options.poBoxMode ?? 'supported',
  maxDomesticLines: options.maxDomesticLines ?? 6,
  maxInternationalLines: options.maxInternationalLines ?? 7,
  maxLineLength: options.maxLineLength ?? 40,
  ...(options.evidenceConflict ? { evidenceConflict: options.evidenceConflict } : {}),
  evidence: options.evidence,
});

const ARABIC_SHIPPING_PROFILES: Record<ArabicShippingCountryCode, ArabicShippingProfile> = {
  DZ: profile('DZ', 'الجزائر', 'Algeria', 'north-africa', 'required', '^\\d{5}$', 'left-of-locality', {
    evidence: evidence('UPU and Algérie Poste', upuCountryEvidence('dza'), '2002-07'),
  }),
  BH: profile('BH', 'البحرين', 'Bahrain', 'gulf-national', 'required', '^\\d{3,4}$', 'right-of-locality', {
    evidence: evidence('UPU and Bahrain Post', upuCountryEvidence('bhr'), '2024-01'),
  }),
  KM: profile('KM', 'جزر القمر', 'Comoros', 'horn-of-africa', 'not-used', null, 'not-used', {
    poBoxMode: 'primary',
    evidence: evidence('UPU and Comoros designated operator', upuCountryEvidence('com'), '2002-07'),
  }),
  DJ: profile('DJ', 'جيبوتي', 'Djibouti', 'horn-of-africa', 'required', '^\\d{5}$', 'left-of-locality', {
    poBoxMode: 'primary',
    evidence: evidence('UPU and La Poste de Djibouti', upuCountryEvidence('dji'), '2020-05'),
  }),
  EG: profile('EG', 'مصر', 'Egypt', 'nile', 'required', '^\\d{7}$', 'separate-after-locality', {
    evidence: evidence('UPU and Egypt Post', upuCountryEvidence('egy'), '2023-07'),
  }),
  IQ: profile('IQ', 'العراق', 'Iraq', 'levant', 'required', '^\\d{5}$', 'separate-after-locality', {
    evidence: evidence('UPU and Iraqi Post', upuCountryEvidence('irq'), '2005-03'),
  }),
  JO: profile('JO', 'الأردن', 'Jordan', 'levant', 'required', '^\\d{5}$', 'right-of-locality', {
    evidence: evidence('UPU and Jordan Post', upuCountryEvidence('jor'), '2004-09'),
  }),
  KW: profile('KW', 'الكويت', 'Kuwait', 'gulf-national', 'required', '^\\d{5}$', 'left-of-locality', {
    evidence: evidence('UPU and Kuwait postal sector', upuCountryEvidence('kwt'), '2002-07'),
  }),
  LB: profile('LB', 'لبنان', 'Lebanon', 'levant', 'optional', null, 'not-used', {
    poBoxMode: 'not-evidenced',
    evidence: evidence('UPU and LibanPost', upuCountryEvidence('lbn'), '2019'),
  }),
  LY: profile('LY', 'ليبيا', 'Libya', 'north-africa', 'not-used', null, 'not-used', {
    poBoxMode: 'not-evidenced',
    evidence: evidence('UPU designated-operator country profile', upuCountryEvidence('lby'), '2012-02'),
  }),
  MR: profile('MR', 'موريتانيا', 'Mauritania', 'north-africa', 'not-used', null, 'not-used', {
    poBoxMode: 'not-evidenced',
    evidence: evidence('UPU Universal POST*CODE Database', UPU_GENERAL_POSTCODE_EVIDENCE, '2025-09'),
  }),
  MA: profile('MA', 'المغرب', 'Morocco', 'north-africa', 'required', '^\\d{5}$', 'left-of-locality', {
    maxLineLength: 38,
    evidence: evidence('UPU and Barid Al-Maghrib', upuCountryEvidence('mar'), '2020'),
  }),
  OM: profile('OM', 'عُمان', 'Oman', 'gulf-po-box', 'required', '^\\d{3}$', 'separate-before-locality', {
    poBoxMode: 'primary',
    evidence: evidence('UPU and Oman Post', upuCountryEvidence('omn'), '2026-01'),
  }),
  PS: profile('PS', 'فلسطين', 'Palestine', 'levant', 'required', '^P\\d{3}(?:\\d{4})?$', 'left-of-locality', {
    evidence: evidence('Palestinian Post', PALESTINIAN_POSTCODE_EVIDENCE, '2023-01-03'),
  }),
  QA: profile('QA', 'قطر', 'Qatar', 'gulf-po-box', 'not-used', null, 'not-used', {
    poBoxMode: 'primary',
    evidence: evidence('Qatar Post', QATAR_POSTAL_STANDARDS_EVIDENCE, 'current-page'),
  }),
  SA: profile('SA', 'المملكة العربية السعودية', 'Saudi Arabia', 'gulf-national', 'required', '^\\d{5}$', 'separate-before-locality', {
    evidence: evidence('SPL Saudi Post', SAUDI_NATIONAL_ADDRESS_EVIDENCE, 'current-page'),
  }),
  SD: profile('SD', 'السودان', 'Sudan', 'nile', 'required', '^\\d{5}$', 'separate-before-locality', {
    evidence: evidence('UPU and Sudan designated operator', upuCountryEvidence('sdn'), '2003-07'),
  }),
  SO: profile('SO', 'الصومال', 'Somalia', 'horn-of-africa', 'optional', '^[A-Z]{2}\\d{5}$', 'right-of-locality', {
    evidenceConflict:
      'The 2004 country sheet documents regional codes while the September 2025 UPU general list says postcodes are not required.',
    evidence: evidence('UPU Somalia country profile', upuCountryEvidence('som'), '2004-09'),
  }),
  SY: profile('SY', 'سوريا', 'Syria', 'levant', 'not-used', null, 'not-used', {
    poBoxMode: 'not-evidenced',
    evidence: evidence('UPU Universal POST*CODE Database', UPU_GENERAL_POSTCODE_EVIDENCE, '2025-09'),
  }),
  TN: profile('TN', 'تونس', 'Tunisia', 'north-africa', 'required', '^\\d{4}$', 'left-of-locality', {
    evidence: evidence('UPU and La Poste Tunisienne', upuCountryEvidence('tun'), '2014-04'),
  }),
  TD: profile('TD', 'تشاد', 'Chad', 'sahel', 'not-used', null, 'not-used', {
    poBoxMode: 'primary',
    evidence: evidence('UPU and Chad designated operator', upuCountryEvidence('tcd'), '2004-09'),
  }),
  AE: profile('AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', 'gulf-po-box', 'not-used', null, 'not-used', {
    poBoxMode: 'primary',
    evidence: evidence('UPU and Emirates Post', upuCountryEvidence('are'), '2014-09'),
  }),
  YE: profile('YE', 'اليمن', 'Yemen', 'levant', 'not-used', null, 'not-used', {
    poBoxMode: 'not-evidenced',
    evidence: evidence('UPU Universal POST*CODE Database', UPU_GENERAL_POSTCODE_EVIDENCE, '2025-09'),
  }),
};

export const ARABIC_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(ARABIC_SHIPPING_PROFILES) as ArabicShippingCountryCode[],
);

const ARABIC_INDIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

function clean(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/ـ/g, '')
    .replace(/[٠-٩۰-۹]/g, digit => ARABIC_INDIC_DIGITS[digit] || digit)
    .replace(/\s+/g, ' ')
    .trim();
}

function profileCountryCode(countryCode: string): ArabicShippingCountryCode | '' {
  const code = clean(countryCode).toUpperCase();
  return ARABIC_SHIPPING_COUNTRY_CODES.includes(code as ArabicShippingCountryCode)
    ? code as ArabicShippingCountryCode
    : '';
}

export function isArabicShippingCountry(countryCode: string) {
  return Boolean(profileCountryCode(countryCode));
}

export function getArabicShippingProfile(countryCode: string) {
  const code = profileCountryCode(countryCode);
  return code ? ARABIC_SHIPPING_PROFILES[code] : null;
}

const COMPONENT_LABELS: Record<'ar' | 'en', ArabicShippingComponentLabels> = {
  ar: {
    organization: 'المؤسسة أو المبنى',
    buildingNumber: 'رقم المبنى',
    street: 'اسم أو رقم الشارع',
    unit: 'رقم الشقة أو الوحدة',
    floor: 'الطابق',
    block: 'القطعة أو البلوك',
    zone: 'رقم المنطقة',
    additionalNumber: 'الرقم الإضافي',
    poBox: 'صندوق البريد',
    district: 'الحي أو المنطقة',
    city: 'المدينة أو البلدة',
    state: 'المحافظة أو الإمارة أو الولاية',
    postcode: 'الرمز البريدي',
    country: 'الدولة',
  },
  en: {
    organization: 'Organization or building',
    buildingNumber: 'Building number',
    street: 'Street name or number',
    unit: 'Apartment or unit',
    floor: 'Floor',
    block: 'Block or parcel',
    zone: 'Zone number',
    additionalNumber: 'Additional number',
    poBox: 'PO Box',
    district: 'District or delivery area',
    city: 'City or postal locality',
    state: 'Governorate, emirate, or state',
    postcode: 'Postal code',
    country: 'Country',
  },
};

export function getArabicShippingComponentLabels(mode: ArabicShippingMode) {
  return COMPONENT_LABELS[mode === 'domestic-arabic' ? 'ar' : 'en'];
}

const CURATED_ARABIC_PLACE_ALIASES: Record<string, string> = {
  'الجزائر': 'Algiers',
  'وهران': 'Oran',
  'قسنطينة': 'Constantine',
  'البحرين': 'Bahrain',
  'المنامة': 'Manama',
  'المحرق': 'Muharraq',
  'الرفاع': 'Riffa',
  'جزر القمر': 'Comoros',
  'موروني': 'Moroni',
  'جيبوتي': 'Djibouti',
  'مصر': 'Egypt',
  'القاهرة': 'Cairo',
  'الجيزة': 'Giza',
  'الإسكندرية': 'Alexandria',
  'العراق': 'Iraq',
  'بغداد': 'Baghdad',
  'البصرة': 'Basra',
  'أربيل': 'Erbil',
  'الموصل': 'Mosul',
  'الأردن': 'Jordan',
  'عمّان': 'Amman',
  'عمان': 'Amman',
  'الزرقاء': 'Zarqa',
  'إربد': 'Irbid',
  'العقبة': 'Aqaba',
  'الكويت': 'Kuwait',
  'مدينة الكويت': 'Kuwait City',
  'حولي': 'Hawally',
  'الفروانية': 'Farwaniya',
  'لبنان': 'Lebanon',
  'بيروت': 'Beirut',
  'طرابلس': 'Tripoli',
  'صيدا': 'Sidon',
  'زحلة': 'Zahle',
  'ليبيا': 'Libya',
  'بنغازي': 'Benghazi',
  'مصراتة': 'Misrata',
  'موريتانيا': 'Mauritania',
  'نواكشوط': 'Nouakchott',
  'نواذيبو': 'Nouadhibou',
  'المغرب': 'Morocco',
  'الرباط': 'Rabat',
  'الدار البيضاء': 'Casablanca',
  'فاس': 'Fez',
  'مراكش': 'Marrakesh',
  'طنجة': 'Tangier',
  'عُمان': 'Oman',
  'مسقط': 'Muscat',
  'صلالة': 'Salalah',
  'صحار': 'Sohar',
  'فلسطين': 'Palestine',
  'رام الله': 'Ramallah',
  'غزة': 'Gaza',
  'الخليل': 'Hebron',
  'بيت لحم': 'Bethlehem',
  'نابلس': 'Nablus',
  'القدس': 'Al Quds',
  'قطر': 'Qatar',
  'الدوحة': 'Doha',
  'الريان': 'Al Rayyan',
  'المملكة العربية السعودية': 'Saudi Arabia',
  'السعودية': 'Saudi Arabia',
  'الرياض': 'Riyadh',
  'جدة': 'Jeddah',
  'مكة المكرمة': 'Makkah',
  'المدينة المنورة': 'Madinah',
  'الدمام': 'Dammam',
  'السودان': 'Sudan',
  'الخرطوم': 'Khartoum',
  'أم درمان': 'Omdurman',
  'بورتسودان': 'Port Sudan',
  'الصومال': 'Somalia',
  'مقديشو': 'Mogadishu',
  'كيسمايو': 'Kismayo',
  'سوريا': 'Syria',
  'دمشق': 'Damascus',
  'حلب': 'Aleppo',
  'حمص': 'Homs',
  'اللاذقية': 'Latakia',
  'تونس': 'Tunis',
  'صفاقس': 'Sfax',
  'سوسة': 'Sousse',
  'تشاد': 'Chad',
  'إنجامينا': "N'Djamena",
  'الإمارات العربية المتحدة': 'United Arab Emirates',
  'الإمارات': 'United Arab Emirates',
  'دبي': 'Dubai',
  'أبو ظبي': 'Abu Dhabi',
  'أبوظبي': 'Abu Dhabi',
  'الشارقة': 'Sharjah',
  'عجمان': 'Ajman',
  'اليمن': 'Yemen',
  'صنعاء': 'Sanaa',
  'عدن': 'Aden',
  'تعز': 'Taiz',
};

const ARABIC_DELIVERY_LEXICON: Record<string, string> = {
  'صندوق البريد': 'PO Box',
  'صندوق بريد': 'PO Box',
  'الرمز البريدي': 'Postal Code',
  'رقم المبنى': 'Building',
  'الرقم الإضافي': 'Additional No.',
  'رقم الشارع': 'Street',
  'رقم المنطقة': 'Zone',
  'شارع': 'Street',
  'الشارع': 'Street',
  'طريق': 'Road',
  'الطريق': 'Road',
  'جادة': 'Avenue',
  'زقاق': 'Alley',
  'حي': 'District',
  'الحي': 'District',
  'منطقة': 'Area',
  'المنطقة': 'Area',
  'محافظة': 'Governorate',
  'المحافظة': 'Governorate',
  'ولاية': 'State',
  'إمارة': 'Emirate',
  'مبنى': 'Building',
  'المبنى': 'Building',
  'عمارة': 'Building',
  'برج': 'Tower',
  'شقة': 'Apartment',
  'طابق': 'Floor',
  'الدور': 'Floor',
  'بلوك': 'Block',
  'قطعة': 'Block',
  'قرية': 'Village',
  'مدينة': 'City',
  'مركز': 'Center',
  'بوابة': 'Gate',
  'مدخل': 'Entrance',
};

function containsArabic(value: string) {
  return /\p{Script=Arabic}/u.test(value);
}

function containsTifinagh(value: string) {
  return /[\u2d30-\u2d7f]/u.test(value);
}

function escapedRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyDeliveryLexicon(value: string) {
  return Object.entries(ARABIC_DELIVERY_LEXICON)
    .sort(([left], [right]) => right.length - left.length)
    .reduce(
      (text, [arabic, english]) =>
        text.replace(new RegExp(escapedRegExp(arabic), 'gu'), english),
      value,
    );
}

function titleCaseRomanization(value: string) {
  const connectors = new Set(['al', 'bin', 'bint', 'ibn']);
  return value
    .split(/(\s+|-)/)
    .map((part, index) => {
      if (!/^[a-z']/i.test(part)) return part;
      const lower = part.toLowerCase();
      if (index > 0 && connectors.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('')
    .replace(/\bPo Box\b/gi, 'PO Box')
    .replace(/\bNo\.\b/g, 'No.');
}

export function romanizeArabicShippingText(value: unknown) {
  const cleaned = clean(value);
  if (!cleaned) {
    return { text: '', method: 'not-applicable' as ArabicRomanizationMethod };
  }
  const curated = CURATED_ARABIC_PLACE_ALIASES[cleaned];
  if (curated) {
    return { text: curated, method: 'curated-place-alias' as ArabicRomanizationMethod };
  }
  const hasArabic = containsArabic(cleaned);
  const hasTifinagh = containsTifinagh(cleaned);
  if (!hasArabic && !hasTifinagh) {
    return { text: cleaned, method: 'preserved-latin' as ArabicRomanizationMethod };
  }
  const lexiconAssisted = applyDeliveryLexicon(cleaned);
  return {
    text: titleCaseRomanization(
      transliterateTifinagh(transliterateArabic(lexiconAssisted)),
    )
      .replace(/\s+,/g, ',')
      .replace(/\s+/g, ' ')
      .trim(),
    method: (
      hasArabic
        ? 'lexicon-assisted-transliteration'
        : 'deterministic-tifinagh-transliteration'
    ) as ArabicRomanizationMethod,
  };
}

function romanizeField(
  field: ArabicAliasField,
  value: string,
  options: ArabicShippingBuildOptions,
): { text: string; method: ArabicRomanizationMethod } {
  const cleaned = clean(value);
  if (!cleaned) return { text: '', method: 'not-applicable' };

  const callerAlias = clean(options.englishAliases?.[field]);
  if (callerAlias) return { text: callerAlias, method: 'caller-approved-alias' };

  return romanizeArabicShippingText(cleaned);
}

function normalizePostcode(value: unknown, shippingProfile: ArabicShippingProfile) {
  const source = clean(value).toUpperCase().replace(/\s+/g, '');
  if (!source) return '';
  if (shippingProfile.countryCode === 'PS') {
    return source.startsWith('P') ? source : `P${source}`;
  }
  return source;
}

function normalizePoBox(value: unknown) {
  return clean(value)
    .replace(/^(?:P\.?\s*O\.?\s*BOX|POBOX|صندوق\s+(?:ال)?بريد)\s*[:#-]?\s*/iu, '')
    .trim();
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  return lines
    .map(clean)
    .filter(Boolean)
    .filter(line => {
      const key = line.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeAddress(
  data: ArabicShippingExtendedAddress,
  shippingProfile: ArabicShippingProfile,
  mode: ArabicShippingMode,
  options: ArabicShippingBuildOptions,
) {
  const normalized = { ...data } as ArabicShippingExtendedAddress;
  const romanizationMethods: ArabicShippingAddressResult['romanizationMethods'] = {};
  const aliasFields: ArabicAliasField[] = [
    'building',
    'poi',
    'road',
    'subdistrict',
    'district',
    'city',
    'state',
  ];

  for (const key of Object.keys(normalized) as Array<keyof ArabicShippingExtendedAddress>) {
    if (typeof normalized[key] === 'string') {
      normalized[key] = clean(normalized[key]) as never;
    }
  }
  normalized.country_code = shippingProfile.countryCode;
  normalized.country =
    mode === 'international-shipping'
      ? shippingProfile.englishCountryName
      : shippingProfile.nativeCountryName;
  normalized.postcode = normalizePostcode(data.postcode, shippingProfile);
  normalized.po_box = normalizePoBox(data.po_box);

  if (mode === 'international-shipping') {
    for (const field of aliasFields) {
      const result = romanizeField(field, clean(normalized[field]), options);
      normalized[field] = result.text;
      romanizationMethods[field] = result.method;
    }
  }

  const changedFields = Object.keys(normalized).filter(
    key =>
      clean(data[key as keyof ArabicShippingExtendedAddress]) !==
      clean(normalized[key as keyof ArabicShippingExtendedAddress]),
  );
  return { normalized, changedFields, romanizationMethods };
}

function poBoxLine(data: ArabicShippingExtendedAddress, mode: ArabicShippingMode) {
  if (!data.po_box) return '';
  return mode === 'domestic-arabic'
    ? `صندوق بريد ${data.po_box}`
    : `PO BOX ${data.po_box}`;
}

function streetLine(
  data: ArabicShippingExtendedAddress,
  profile: ArabicShippingProfile,
  mode: ArabicShippingMode,
) {
  const road = clean(data.road);
  const houseNumber = clean(data.house_number);
  const block = clean(data.block);
  const additionalNumber = clean(data.additional_number);

  if (profile.countryCode === 'QA') {
    const parts = [
      houseNumber
        ? mode === 'domestic-arabic' ? `مبنى ${houseNumber}` : `BUILDING ${houseNumber}`
        : '',
      road
        ? mode === 'domestic-arabic' ? `شارع ${road}` : `STREET ${road}`
        : '',
    ];
    return parts.filter(Boolean).join(mode === 'domestic-arabic' ? '، ' : ', ');
  }
  if (profile.countryCode === 'BH') {
    return road;
  }
  if (profile.countryCode === 'KW') {
    const parts = [
      block ? (mode === 'domestic-arabic' ? `قطعة ${block}` : `BLOCK ${block}`) : '',
      road ? (mode === 'domestic-arabic' ? `شارع ${road}` : `STREET ${road}`) : '',
      houseNumber ? (mode === 'domestic-arabic' ? `مبنى ${houseNumber}` : `BUILDING ${houseNumber}`) : '',
    ];
    return parts.filter(Boolean).join(mode === 'domestic-arabic' ? '، ' : ', ');
  }
  if (profile.countryCode === 'SA') {
    const main = [houseNumber, road].filter(Boolean).join(' ');
    const secondary = additionalNumber
      ? mode === 'domestic-arabic'
        ? `الرقم الإضافي ${additionalNumber}`
        : `ADDITIONAL NO. ${additionalNumber}`
      : '';
    return [main, secondary].filter(Boolean).join(mode === 'domestic-arabic' ? '، ' : ', ');
  }
  return [houseNumber, road].filter(Boolean).join(' ');
}

function secondaryLine(
  data: ArabicShippingExtendedAddress,
  profile: ArabicShippingProfile,
  mode: ArabicShippingMode,
) {
  const parts = [
    data.unit
      ? mode === 'domestic-arabic' ? `شقة ${data.unit}` : `UNIT ${data.unit}`
      : '',
    data.floor
      ? mode === 'domestic-arabic' ? `طابق ${data.floor}` : `FLOOR ${data.floor}`
      : '',
  ];
  if (profile.countryCode === 'BH' && data.house_number) {
    parts.unshift(
      mode === 'domestic-arabic'
        ? `مبنى ${data.house_number}`
        : `BUILDING ${data.house_number}`,
    );
  }
  return parts.filter(Boolean).join(mode === 'domestic-arabic' ? '، ' : ', ');
}

function localityLines(data: ArabicShippingExtendedAddress, profile: ArabicShippingProfile) {
  const area = uniqueLines([
    data.subdistrict || data.suburb,
    data.district,
    data.state,
  ]);
  const locality = clean(data.city);
  const postcode = clean(data.postcode);

  if (profile.postcodePosition === 'left-of-locality') {
    return [...area, [postcode, locality].filter(Boolean).join(' ')];
  }
  if (profile.postcodePosition === 'right-of-locality') {
    return [...area, [locality, postcode].filter(Boolean).join(' ')];
  }
  if (profile.postcodePosition === 'separate-before-locality') {
    return [...area, postcode, locality];
  }
  if (profile.postcodePosition === 'separate-after-locality') {
    return [...area, locality, postcode];
  }
  return [...area, locality];
}

function renderLines(
  data: ArabicShippingExtendedAddress,
  profile: ArabicShippingProfile,
  mode: ArabicShippingMode,
) {
  const qatarZone = profile.countryCode === 'QA' && data.zone
    ? mode === 'domestic-arabic' ? `منطقة ${data.zone}` : `ZONE ${data.zone}`
    : '';
  const country = mode === 'international-shipping'
    ? profile.englishCountryName.toUpperCase()
    : '';
  return uniqueLines([
    data.building || data.poi,
    secondaryLine(data, profile, mode),
    poBoxLine(data, mode),
    streetLine(data, profile, mode),
    qatarZone,
    ...localityLines(data, profile),
    country,
  ]);
}

function unsupportedResult(
  data: ArabicShippingExtendedAddress,
  mode: ArabicShippingMode,
): ArabicShippingAddressResult {
  const lines = uniqueLines([
    data.building || data.poi,
    [data.house_number, data.road].filter(Boolean).join(' '),
    data.subdistrict || data.suburb,
    data.district,
    [data.postcode, data.city].filter(Boolean).join(' '),
    data.state,
    mode === 'international-shipping' ? clean(data.country).toUpperCase() : '',
  ]);
  return {
    mode,
    outputLanguage: mode === 'domestic-arabic' ? 'ar' : 'en',
    profile: null,
    componentLabels: getArabicShippingComponentLabels(mode),
    normalized: { ...data },
    lines,
    formatted: lines.join('\n'),
    changedFields: [],
    romanizationMethods: {},
    appliedRules: ['conservative-arabic-address-fallback'],
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

export function buildArabicShippingAddress(
  data: ArabicShippingExtendedAddress,
  mode: ArabicShippingMode,
  options: ArabicShippingBuildOptions = {},
): ArabicShippingAddressResult {
  const shippingProfile = getArabicShippingProfile(data.country_code);
  if (!shippingProfile) return unsupportedResult(data, mode);

  const { normalized, changedFields, romanizationMethods } = normalizeAddress(
    data,
    shippingProfile,
    mode,
    options,
  );
  const lines = renderLines(normalized, shippingProfile, mode);
  const warnings: ArabicShippingWarning[] = [
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
  ];

  const hasStreetDelivery = Boolean(normalized.road && normalized.house_number);
  const hasPoBoxDelivery = Boolean(normalized.po_box);
  if (!hasStreetDelivery && !hasPoBoxDelivery) warnings.push('missing_delivery_line');
  if (!normalized.city && !normalized.district && !normalized.subdistrict) {
    warnings.push('missing_locality');
  }
  if (shippingProfile.postcodePolicy === 'required' && !normalized.postcode) {
    warnings.push('missing_postcode');
  } else if (
    normalized.postcode &&
    shippingProfile.postcodePattern &&
    !new RegExp(shippingProfile.postcodePattern).test(normalized.postcode)
  ) {
    warnings.push('invalid_postcode_format');
  } else if (
    normalized.postcode &&
    shippingProfile.postcodePolicy === 'not-used'
  ) {
    warnings.push('postcode_not_used_by_destination');
  }
  if (
    shippingProfile.poBoxMode === 'primary' &&
    !hasPoBoxDelivery &&
    (shippingProfile.countryCode !== 'QA' || !hasStreetDelivery || !normalized.zone)
  ) {
    warnings.push('po_box_recommended');
  }
  if (
    shippingProfile.countryCode === 'QA' &&
    !hasPoBoxDelivery &&
    !(normalized.house_number && normalized.road && normalized.zone)
  ) {
    warnings.push('qatar_anwani_components_incomplete');
  }
  if (
    shippingProfile.countryCode === 'SA' &&
    !(normalized.house_number && normalized.road && normalized.district && normalized.city)
  ) {
    warnings.push('saudi_national_address_components_incomplete');
  }
  if (shippingProfile.evidenceConflict) {
    warnings.push('postal_source_version_conflict');
  }
  if (
    mode === 'international-shipping' &&
    (
      Object.values(romanizationMethods).includes('lexicon-assisted-transliteration')
      || Object.values(romanizationMethods).includes('deterministic-tifinagh-transliteration')
    )
  ) {
    warnings.push('machine_transliteration_review_recommended');
  }
  if (
    mode === 'international-shipping'
    && lines.some(line => containsArabic(line) || containsTifinagh(line))
  ) {
    warnings.push('transliteration_incomplete');
  }

  const lineLimit =
    mode === 'international-shipping'
      ? shippingProfile.maxInternationalLines
      : shippingProfile.maxDomesticLines;
  if (lines.length > lineLimit) warnings.push('address_line_limit_exceeded');
  if (lines.some(line => line.length > shippingProfile.maxLineLength)) {
    warnings.push('line_length_exceeds_profile_limit');
  }

  const informationalWarnings = new Set<ArabicShippingWarning>([
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
    'machine_transliteration_review_recommended',
  ]);
  const formatStatus = warnings.some(warning => !informationalWarnings.has(warning))
    ? 'needs-review'
    : 'format-ready';

  return {
    mode,
    outputLanguage: mode === 'domestic-arabic' ? 'ar' : 'en',
    profile: shippingProfile,
    componentLabels: getArabicShippingComponentLabels(mode),
    normalized,
    lines,
    formatted: lines.join('\n'),
    changedFields,
    romanizationMethods,
    appliedRules: [
      `${shippingProfile.countryCode.toLowerCase()}-${shippingProfile.family}-postal-presentation-v1`,
      'normalize-arabic-and-eastern-arabic-digits-to-ascii-routing-digits',
      'prefer-caller-approved-then-curated-latin-place-aliases',
      'preserve-arabic-delivery-keys-for-domestic-mail',
      'append-uppercase-english-country-for-international-mail',
      'never-claim-postcode-locality-or-delivery-point-validation-from-formatting',
    ],
    warnings,
    formatStatus,
    deliveryPointValidated: false,
    evidence: shippingProfile.evidence,
  };
}
