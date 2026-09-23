import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart } from './addressEnglish';
import { chooseCommonAddressTranslationRoute,translateAddressFieldByRoute,type AddressFieldTranslator,type AddressTranslationRoute } from './addressTranslationRouteCore';
import { isAddressBuildingField,normalizeAddressTranslationCountryCode,normalizeAddressTranslationLanguage,type AddressTranslationProfile } from './addressTranslationRegion';
import { normalizeChineseRegionalAddressPart } from './chineseAddressUtils';

export type SoutheastAsiaAddressTopology =
  | 'burmese-abugida'
  | 'thai-lao-abugida'
  | 'khmer-abugida'
  | 'latin-native'
  | 'sinitic-hanzi'
  | 'indic-abugida'
  | 'latin-address';

export type SoutheastAsiaEnglishAlgorithm =
  | 'burmese-mlcts-shipping'
  | 'thai-rtgs'
  | 'vietnamese-quoc-ngu'
  | 'khmer-ungegn'
  | 'lao-bgn-pcgn'
  | 'malay-standard'
  | 'singapore-multilingual'
  | 'indonesian-standard'
  | 'filipino-standard'
  | 'brunei-malay'
  | 'tetum-portuguese';

export type SoutheastAsiaAddressTranslationRoute = AddressTranslationRoute<SoutheastAsiaAddressTopology, SoutheastAsiaEnglishAlgorithm>;

export type SoutheastAsiaAddressTranslationProfile = AddressTranslationProfile<SoutheastAsiaAddressTopology, SoutheastAsiaEnglishAlgorithm>;


const SOUTHEAST_ASIA_ADDRESS_TRANSLATION_PROFILES: Record<string, SoutheastAsiaAddressTranslationProfile> = {
  MM: { countryCode: 'MM', nativeLanguages: ['my'], defaultLanguage: 'my', defaultTopology: 'burmese-abugida', englishAlgorithm: 'burmese-mlcts-shipping' },
  TH: { countryCode: 'TH', nativeLanguages: ['th'], defaultLanguage: 'th', defaultTopology: 'thai-lao-abugida', englishAlgorithm: 'thai-rtgs' },
  VN: { countryCode: 'VN', nativeLanguages: ['vi'], defaultLanguage: 'vi', defaultTopology: 'latin-native', englishAlgorithm: 'vietnamese-quoc-ngu' },
  KH: { countryCode: 'KH', nativeLanguages: ['km'], defaultLanguage: 'km', defaultTopology: 'khmer-abugida', englishAlgorithm: 'khmer-ungegn' },
  LA: { countryCode: 'LA', nativeLanguages: ['lo'], defaultLanguage: 'lo', defaultTopology: 'thai-lao-abugida', englishAlgorithm: 'lao-bgn-pcgn' },
  MY: { countryCode: 'MY', nativeLanguages: ['ms'], defaultLanguage: 'ms', defaultTopology: 'latin-native', englishAlgorithm: 'malay-standard' },
  SG: { countryCode: 'SG', nativeLanguages: ['ms', 'zh-Hans', 'ta'], defaultLanguage: 'en', defaultTopology: 'latin-address', englishAlgorithm: 'singapore-multilingual' },
  ID: { countryCode: 'ID', nativeLanguages: ['id'], defaultLanguage: 'id', defaultTopology: 'latin-native', englishAlgorithm: 'indonesian-standard' },
  PH: { countryCode: 'PH', nativeLanguages: ['tl'], defaultLanguage: 'tl', defaultTopology: 'latin-native', englishAlgorithm: 'filipino-standard' },
  BN: { countryCode: 'BN', nativeLanguages: ['ms'], defaultLanguage: 'ms', defaultTopology: 'latin-native', englishAlgorithm: 'brunei-malay' },
  TL: { countryCode: 'TL', nativeLanguages: ['tet', 'pt'], defaultLanguage: 'tet', defaultTopology: 'latin-native', englishAlgorithm: 'tetum-portuguese' },
};

const SOUTHEAST_ASIA_TOPOLOGY_BY_LANGUAGE: Record<string, SoutheastAsiaAddressTopology> = {
  my: 'burmese-abugida',
  th: 'thai-lao-abugida',
  lo: 'thai-lao-abugida',
  km: 'khmer-abugida',
  vi: 'latin-native',
  ms: 'latin-native',
  id: 'latin-native',
  tl: 'latin-native',
  tet: 'latin-native',
  pt: 'latin-native',
  'zh-Hans': 'sinitic-hanzi',
  ta: 'indic-abugida',
  en: 'latin-address',
};

const SOUTHEAST_ASIA_ENGLISH_ALIASES: Record<string, Record<string, string>> = {
  MM: {
    မြန်မာ: 'Myanmar',
    ရန်ကုန်: 'Yangon',
    မန္တလေး: 'Mandalay',
    နေပြည်တော်: 'Naypyidaw',
    မြို့နယ်: 'Township',
    ပြည်နယ်: 'State',
    တိုင်းဒေသကြီး: 'Region',
  },
  TH: {
    ประเทศไทย: 'Thailand',
    กรุงเทพมหานคร: 'Bangkok',
    เชียงใหม่: 'Chiang Mai',
    ภูเก็ต: 'Phuket',
    ถนนสุขุมวิท: 'Road Sukhumvit',
    สุขุมวิท: 'Sukhumvit',
    ถนน: 'Road',
    จังหวัด: 'Province',
    เขต: 'District',
    แขวง: 'Subdistrict',
    บ้านเลขที่: 'House No.',
  },
  VN: {
    'Việt Nam': 'Vietnam',
    'Hà Nội': 'Hanoi',
    'Thành phố Hồ Chí Minh': 'Ho Chi Minh City',
    'TP. Hồ Chí Minh': 'Ho Chi Minh City',
    'Đà Nẵng': 'Da Nang',
  },
  KH: {
    កម្ពុជា: 'Cambodia',
    ភ្នំពេញ: 'Phnom Penh',
    សៀមរាប: 'Siem Reap',
    ខេត្ត: 'Province',
    ខណ្ឌ: 'District',
    សង្កាត់: 'Sangkat',
    ផ្លូវ: 'Street',
  },
  LA: {
    ລາວ: 'Laos',
    ວຽງຈັນ: 'Vientiane',
    ຫຼວງພະບາງ: 'Luang Prabang',
    ແຂວງ: 'Province',
    ເມືອງ: 'District',
    ບ້ານ: 'Village',
    ຖະໜົນ: 'Road',
  },
  MY: {
    Malaysia: 'Malaysia',
    Singapura: 'Singapore',
    'Kuala Lumpur': 'Kuala Lumpur',
    Selangor: 'Selangor',
    Johor: 'Johor',
  },
  SG: {
    Singapura: 'Singapore',
    新加坡: 'Singapore',
    சிங்கப்பூர்: 'Singapore',
    Singapore: 'Singapore',
  },
  ID: {
    Indonesia: 'Indonesia',
    Jakarta: 'Jakarta',
    'Jawa Barat': 'West Java',
    'Jawa Timur': 'East Java',
  },
  PH: {
    Pilipinas: 'Philippines',
    Maynila: 'Manila',
    Lungsod: 'City',
  },
  BN: {
    Brunei: 'Brunei',
    'Brunei Darussalam': 'Brunei Darussalam',
    'Bandar Seri Begawan': 'Bandar Seri Begawan',
  },
  TL: {
    'Timor-Leste': 'Timor-Leste',
    'Timor Lorosae': 'Timor-Leste',
    "Timor Lorosa'e": 'Timor-Leste',
    Dili: 'Dili',
  },
};

const LATIN_ADDRESS_TERM_REPLACEMENTS: Record<string, Array<[RegExp, string]>> = {
  VN: [
    [/thành\s+phố/giu, 'City'],
    [/\btp\.\b/giu, 'City'],
    [/đường/giu, 'Street'],
    [/\bduong\b/giu, 'Street'],
    [/phường/giu, 'Ward'],
    [/\bphuong\b/giu, 'Ward'],
    [/quận/giu, 'District'],
    [/\bquan\b/giu, 'District'],
    [/tỉnh/giu, 'Province'],
  ],
  MY: [
    [/\bjalan\b/giu, 'Street'],
    [/\blorong\b/giu, 'Lane'],
    [/\bnegeri\b/giu, 'State'],
    [/\bdaerah\b/giu, 'District'],
    [/\bposkod\b/giu, 'Postcode'],
    [/\bbangunan\b/giu, 'Building'],
  ],
  SG: [
    [/\bjalan\b/giu, 'Street'],
    [/\blorong\b/giu, 'Lane'],
    [/\bblok\b/giu, 'Block'],
    [/\bposkod\b/giu, 'Postcode'],
  ],
  ID: [
    [/\bjalan\b/giu, 'Street'],
    [/\bkode\s+pos\b/giu, 'Postcode'],
    [/\bkota\b/giu, 'City'],
    [/\bkabupaten\b/giu, 'Regency'],
    [/\bkecamatan\b/giu, 'District'],
    [/\bkelurahan\b/giu, 'Urban Village'],
  ],
  PH: [
    [/\bkalye\b/giu, 'Street'],
    [/\blungsod\b/giu, 'City'],
    [/\blalawigan\b/giu, 'Province'],
  ],
  BN: [
    [/\bjalan\b/giu, 'Street'],
    [/\bdaerah\b/giu, 'District'],
    [/\bmukim\b/giu, 'Mukim'],
    [/\bposkod\b/giu, 'Postcode'],
  ],
  TL: [
    [/\brua\b/giu, 'Street'],
    [/\bmunic[ií]pio\b/giu, 'Municipality'],
    [/\bmunis[ií]piu\b/giu, 'Municipality'],
    [/\bc[oó]digo\s+postal\b/giu, 'Postal Code'],
    [/\bk[oó]digu\s+post[aá]l\b/giu, 'Postal Code'],
  ],
};


function countryCodeOf(countryCode: string) {
  return normalizeAddressTranslationCountryCode(countryCode);
}

export function getSoutheastAsiaAddressTranslationProfile(countryCode: string) {
  return SOUTHEAST_ASIA_ADDRESS_TRANSLATION_PROFILES[countryCodeOf(countryCode)] || null;
}

function normalizeSoutheastAsiaAddressLanguage(
  language: string | undefined | null,
  profile: SoutheastAsiaAddressTranslationProfile,
) {
  return normalizeAddressTranslationLanguage(language, profile, {
    mapLanguage: raw => {
      if (raw === 'zh' || raw === 'zh-CN' || raw === 'zh-SG' || raw.startsWith('zh-Hans')) return 'zh-Hans';
      if (raw === 'fil') return 'tl';
      return null;
    },
  });
}

function isAllowedLanguage(language: string, profile: SoutheastAsiaAddressTranslationProfile) {
  return language === 'en' || profile.nativeLanguages.includes(language);
}

function topologyForLanguage(language: string, profile: SoutheastAsiaAddressTranslationProfile): SoutheastAsiaAddressTopology {
  return SOUTHEAST_ASIA_TOPOLOGY_BY_LANGUAGE[language] || profile.defaultTopology;
}

export function chooseSoutheastAsiaAddressTranslationRoute(options: {
  countryCode: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): SoutheastAsiaAddressTranslationRoute | null {
  const profile = getSoutheastAsiaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const sourceLanguage = normalizeSoutheastAsiaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeSoutheastAsiaAddressLanguage(options.targetLanguage, profile);
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

function normalizeLatinNativeAddress(text: string, countryCode: string) {
  const replacements = LATIN_ADDRESS_TERM_REPLACEMENTS[countryCode] || [];
  let normalized = text;
  for (const [pattern, replacement] of replacements) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalizeEnglishAddressPart(normalized, countryCode);
}

function normalizeSoutheastAsiaEnglish(text: string, countryCode: string, fieldKey: string) {
  const code = countryCodeOf(countryCode);
  const aliases = SOUTHEAST_ASIA_ENGLISH_ALIASES[code] || {};
  if (aliases[text]) return aliases[text];

  if (code === 'SG' && /[\u3400-\u9fff]/.test(text)) {
    return normalizeChineseRegionalAddressPart(text, code);
  }

  if (shouldUseBuildingEnglish(fieldKey)) {
    const building = normalizeEnglishAddressBuildingName(text, code);
    if (building) return building;
  }

  const latin = normalizeLatinNativeAddress(text, code);
  if (latin) return latin;

  return normalizeEnglishAddressPart(text, code);
}

export async function translateSoutheastAsiaAddressField(options: {
  countryCode: string;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  translator?: AddressFieldTranslator;
}): Promise<{ text: string; route: SoutheastAsiaAddressTranslationRoute } | null> {
  const profile = getSoutheastAsiaAddressTranslationProfile(options.countryCode);
  if (!profile) return null;

  const text = String(options.text ?? '').trim();
  if (!text) return null;

  const route = chooseSoutheastAsiaAddressTranslationRoute(options);
  if (!route) return null;

  const sourceLanguage = normalizeSoutheastAsiaAddressLanguage(options.sourceLanguage, profile);
  const targetLanguage = normalizeSoutheastAsiaAddressLanguage(options.targetLanguage, profile);

  return translateAddressFieldByRoute({
    text,
    route,
    fieldKey: options.fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish: value => normalizeSoutheastAsiaEnglish(value, profile.countryCode, options.fieldKey),
    translator: options.translator,
  });
}
