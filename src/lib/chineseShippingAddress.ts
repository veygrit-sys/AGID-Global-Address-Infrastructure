import {
  normalizeMainlandChineseAddressPart,
  toSimplified,
  toTraditional,
} from './chineseAddressUtils';

export type ChineseShippingCountryCode = 'CN' | 'TW' | 'HK' | 'MO';
export type ChineseShippingMode =
  | 'domestic-simplified'
  | 'domestic-traditional'
  | 'international-shipping';
export type ChineseShippingScript = 'zh-Hans' | 'zh-Hant';
export type ChineseShippingStatus = 'format-ready' | 'needs-review' | 'insufficient';

export type ChineseShippingWarning =
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'invalid_postcode_format'
  | 'legacy_postcode_format'
  | 'unexpected_postcode'
  | 'official_romanization_unverified'
  | 'too_many_lines'
  | 'line_too_long';

export interface ChineseShippingProfile {
  countryCode: ChineseShippingCountryCode;
  defaultDomesticScript: ChineseShippingScript;
  englishCountryName: string;
  nativeCountryName: string;
  postcode: {
    usage: 'required' | 'recommended' | 'not-used';
    acceptedPattern: RegExp | null;
    currentPattern: RegExp | null;
    description: string;
  };
  maxLines: number;
  maxLineLength: number;
  romanization:
    | 'hanyu-pinyin'
    | 'taiwan-postal'
    | 'hong-kong-gazetted'
    | 'macao-official-portuguese-english';
  evidence: {
    authority: string;
    url: string;
    checkedOn: string;
    scope: string;
  };
}

export interface ChineseShippingComponentLabels {
  postcode: string;
  state: string;
  city: string;
  district: string;
  subdistrict: string;
  road: string;
  houseNumber: string;
  building: string;
  country: string;
}

export interface ChineseShippingAddressResult {
  countryCode: ChineseShippingCountryCode;
  mode: ChineseShippingMode;
  script: ChineseShippingScript | 'en';
  lines: string[];
  formatted: string;
  status: ChineseShippingStatus;
  warnings: ChineseShippingWarning[];
  deliveryPointValidated: false;
  evidence: ChineseShippingProfile['evidence'];
}

type AddressLike = {
  country_code?: string;
  countryCode?: string;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  suburb?: string;
  road?: string;
  street?: string;
  house_number?: string;
  houseNumber?: string;
  building?: string;
  organization?: string;
  poi?: string;
  postcode?: string;
  postal_code?: string;
};

const CHINESE_SHIPPING_PROFILES: Record<ChineseShippingCountryCode, ChineseShippingProfile> = {
  CN: {
    countryCode: 'CN',
    defaultDomesticScript: 'zh-Hans',
    englishCountryName: 'P.R. CHINA',
    nativeCountryName: '中国',
    postcode: {
      usage: 'required',
      acceptedPattern: /^\d{6}$/,
      currentPattern: /^\d{6}$/,
      description: '6 digits',
    },
    maxLines: 7,
    maxLineLength: 40,
    romanization: 'hanyu-pinyin',
    evidence: {
      authority: 'Universal Postal Union addressing unit',
      url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/chnEn.pdf',
      checkedOn: '2026-07-25',
      scope: 'destination-format-postcode-shape-and-pinyin-order-only',
    },
  },
  TW: {
    countryCode: 'TW',
    defaultDomesticScript: 'zh-Hant',
    englishCountryName: 'TAIWAN',
    nativeCountryName: '臺灣',
    postcode: {
      usage: 'recommended',
      acceptedPattern: /^(?:\d{3}|\d{5}|\d{6})$/,
      currentPattern: /^\d{6}$/,
      description: 'current 3+3 digits; legacy 3 or 5 digits accepted with review',
    },
    maxLines: 6,
    maxLineLength: 40,
    romanization: 'taiwan-postal',
    evidence: {
      authority: 'Chunghwa Post',
      url: 'https://www.post.gov.tw/post/internet/U_english2/index.jsp?ID=1639969007848',
      checkedOn: '2026-07-25',
      scope: 'international-envelope-order-postcode-and-postal-english-guidance',
    },
  },
  HK: {
    countryCode: 'HK',
    defaultDomesticScript: 'zh-Hant',
    englishCountryName: 'HONG KONG',
    nativeCountryName: '香港',
    postcode: {
      usage: 'not-used',
      acceptedPattern: null,
      currentPattern: null,
      description: 'no postcode',
    },
    maxLines: 6,
    maxLineLength: 40,
    romanization: 'hong-kong-gazetted',
    evidence: {
      authority: 'Hongkong Post',
      url: 'https://www.hongkongpost.hk/en/about_us/tips/correct_address/',
      checkedOn: '2026-07-25',
      scope: 'local-chinese-and-english-address-order-only',
    },
  },
  MO: {
    countryCode: 'MO',
    defaultDomesticScript: 'zh-Hant',
    englishCountryName: 'MACAO',
    nativeCountryName: '澳門',
    postcode: {
      usage: 'not-used',
      acceptedPattern: null,
      currentPattern: null,
      description: 'no postcode',
    },
    maxLines: 6,
    maxLineLength: 40,
    romanization: 'macao-official-portuguese-english',
    evidence: {
      authority: 'Macao Post and Telecommunications Bureau',
      url: 'https://www.ctt.gov.mo/MacauPost/Contents/AddressFormat.aspx?lang=en-us',
      checkedOn: '2026-07-25',
      scope: 'local-address-order-line-count-and-no-postcode-policy',
    },
  },
};

const MAINLAND_ENGLISH_ALIASES: Record<string, string> = {
  北京市: 'Beijing',
  上海市: 'Shanghai',
  天津市: 'Tianjin',
  重庆市: 'Chongqing',
  广州市: 'Guangzhou',
  深圳市: 'Shenzhen',
  成都市: 'Chengdu',
  杭州市: 'Hangzhou',
  南京市: 'Nanjing',
  武汉市: 'Wuhan',
  西安市: "Xi'an",
  乌鲁木齐市: 'Urumqi',
  呼和浩特市: 'Hohhot',
  朝阳区: 'Chaoyang District',
  浦东新区: 'Pudong New Area',
  新疆维吾尔自治区: 'Xinjiang Uyghur Autonomous Region',
  广西壮族自治区: 'Guangxi Zhuang Autonomous Region',
  内蒙古自治区: 'Inner Mongolia Autonomous Region',
  宁夏回族自治区: 'Ningxia Hui Autonomous Region',
  西藏自治区: 'Tibet Autonomous Region',
};

const TAIWAN_ENGLISH_ALIASES: Record<string, string> = {
  臺北市: 'Taipei City',
  台北市: 'Taipei City',
  新北市: 'New Taipei City',
  桃園市: 'Taoyuan City',
  台中市: 'Taichung City',
  臺中市: 'Taichung City',
  台南市: 'Tainan City',
  臺南市: 'Tainan City',
  高雄市: 'Kaohsiung City',
  基隆市: 'Keelung City',
  新竹市: 'Hsinchu City',
  嘉義市: 'Chiayi City',
  信義區: 'Xinyi District',
  中正區: 'Zhongzheng District',
  大安區: 'Da-an District',
  市府路: 'Shifu Rd.',
  金山南路: 'Jinshan S. Rd.',
};

const HONG_KONG_ENGLISH_ALIASES: Record<string, string> = {
  香港: 'Hong Kong',
  香港島: 'Hong Kong',
  九龍: 'Kowloon',
  新界: 'New Territories',
  中西區: 'Central and Western District',
  灣仔區: 'Wan Chai District',
  東區: 'Eastern District',
  南區: 'Southern District',
  油尖旺區: 'Yau Tsim Mong District',
  深水埗區: 'Sham Shui Po District',
  九龍城區: 'Kowloon City District',
  黃大仙區: 'Wong Tai Sin District',
  觀塘區: 'Kwun Tong District',
  葵青區: 'Kwai Tsing District',
  荃灣區: 'Tsuen Wan District',
  屯門區: 'Tuen Mun District',
  元朗區: 'Yuen Long District',
  北區: 'North District',
  大埔區: 'Tai Po District',
  沙田區: 'Sha Tin District',
  西貢區: 'Sai Kung District',
  離島區: 'Islands District',
  中環: 'Central',
  尖沙咀: 'Tsim Sha Tsui',
  旺角: 'Mong Kok',
  銅鑼灣: 'Causeway Bay',
  灣仔: 'Wan Chai',
  彌敦道: 'Nathan Road',
  皇后大道中: "Queen's Road Central",
  德輔道中: "Des Voeux Road Central",
  告士打道: 'Gloucester Road',
};

const MACAO_ENGLISH_ALIASES: Record<string, string> = {
  澳門: 'Macao',
  澳门: 'Macao',
  澳門半島: 'Macao',
  澳门半岛: 'Macao',
  氹仔: 'Taipa',
  路氹城: 'Cotai',
  路環: 'Coloane',
  花地瑪堂區: 'Nossa Senhora de Fatima',
  聖安多尼堂區: 'Santo Antonio',
  大堂區: 'Se',
  望德堂區: 'Sao Lazaro',
  風順堂區: 'Sao Lourenco',
  嘉模堂區: 'Nossa Senhora do Carmo',
  聖方濟各堂區: 'Sao Francisco Xavier',
  新馬路: 'Avenida de Almeida Ribeiro',
  新马路: 'Avenida de Almeida Ribeiro',
  亞美打利庇盧大馬路: 'Avenida de Almeida Ribeiro',
  宋玉生廣場: "Alameda de Dr. Carlos d'Assumpcao",
};

const LABELS: Record<ChineseShippingScript | 'en', ChineseShippingComponentLabels> = {
  'zh-Hans': {
    postcode: '邮政编码',
    state: '省／自治区／直辖市',
    city: '市／县',
    district: '区／县',
    subdistrict: '街道／乡镇',
    road: '道路／街巷',
    houseNumber: '门牌号',
    building: '楼栋／楼层／房间',
    country: '国家或地区',
  },
  'zh-Hant': {
    postcode: '郵遞區號',
    state: '省／縣市／地域',
    city: '城市／鄉鎮市區',
    district: '區／縣',
    subdistrict: '街道／鄉鎮',
    road: '道路／街巷',
    houseNumber: '門牌號碼',
    building: '大廈／樓層／單位',
    country: '國家或地區',
  },
  en: {
    postcode: 'Postal code',
    state: 'Province / region',
    city: 'City / locality',
    district: 'District / county',
    subdistrict: 'Subdistrict / neighbourhood',
    road: 'Street / road',
    houseNumber: 'Premise number',
    building: 'Building / floor / unit',
    country: 'Destination country or area',
  },
};

const HAN_PATTERN = /[\u3400-\u9fff\uf900-\ufaff]/u;
const NUMBER_SUFFIX_PATTERN = /(?:号|號)$/u;

function baseCountryCode(value: string) {
  return String(value || '').trim().toUpperCase().split('-')[0];
}

function clean(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u3000\s]+/gu, ' ')
    .trim();
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  return lines
    .map(clean)
    .filter(Boolean)
    .filter(line => {
      const key = line.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  return parts.filter(Boolean).filter(part => {
    const key = clean(part).toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toDomesticScript(
  text: string,
  script: ChineseShippingScript,
  countryCode: ChineseShippingCountryCode,
) {
  if (script === 'zh-Hans') return toSimplified(text);
  return toTraditional(text, countryCode === 'HK' || countryCode === 'MO' ? countryCode : 'TW');
}

function aliasesForCountry(countryCode: ChineseShippingCountryCode) {
  if (countryCode === 'TW') return TAIWAN_ENGLISH_ALIASES;
  if (countryCode === 'HK') return HONG_KONG_ENGLISH_ALIASES;
  if (countryCode === 'MO') return MACAO_ENGLISH_ALIASES;
  return MAINLAND_ENGLISH_ALIASES;
}

function replaceKnownAliases(text: string, aliases: Record<string, string>) {
  let result = text;
  let matched = false;
  const keys = Object.keys(aliases).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    for (const candidate of [key, toSimplified(key), toTraditional(key, 'HK'), toTraditional(key, 'TW')]) {
      if (!candidate || !result.includes(candidate)) continue;
      result = result.split(candidate).join(` ${aliases[key]} `);
      matched = true;
      break;
    }
  }

  return { result: result.replace(/\s+/gu, ' ').trim(), matched };
}

function normalizeInternationalField(
  countryCode: ChineseShippingCountryCode,
  text: string,
) {
  const source = clean(text);
  if (!source) return { text: '', usedUnverifiedRomanization: false };
  if (!HAN_PATTERN.test(source)) return { text: source, usedUnverifiedRomanization: false };

  const replaced = replaceKnownAliases(source, aliasesForCountry(countryCode));
  const remaining = replaced.result
    .split(/(\s+)/u)
    .map(part => HAN_PATTERN.test(part) ? normalizeMainlandChineseAddressPart(part) : part)
    .join('')
    .replace(/\s+/gu, ' ')
    .trim();

  return {
    text: remaining,
    usedUnverifiedRomanization:
      (countryCode === 'HK' || countryCode === 'MO') &&
      HAN_PATTERN.test(source) &&
      (!replaced.matched || HAN_PATTERN.test(replaced.result)),
  };
}

function withChineseNumberSuffix(
  value: string,
  script: ChineseShippingScript,
  countryCode: ChineseShippingCountryCode,
) {
  const cleaned = clean(value);
  if (!cleaned) return '';
  const converted = toDomesticScript(cleaned, script, countryCode);
  if (NUMBER_SUFFIX_PATTERN.test(converted) || /(?:室|樓|楼|層|层|座|棟|栋)$/u.test(converted)) {
    return converted;
  }
  return `${converted}${script === 'zh-Hans' ? '号' : '號'}`;
}

function domesticLines(
  countryCode: ChineseShippingCountryCode,
  data: Required<Pick<AddressLike,
    'state' | 'city' | 'district' | 'subdistrict' | 'road' | 'house_number' |
    'building' | 'poi' | 'postcode'>>,
  script: ChineseShippingScript,
) {
  const t = (value: string) => toDomesticScript(clean(value), script, countryCode);
  const roadAndNumber = [
    t(data.road),
    withChineseNumberSuffix(data.house_number, script, countryCode),
  ].filter(Boolean).join('');
  const building = t(data.building || data.poi);

  if (countryCode === 'CN') {
    return uniqueLines([
      [clean(data.postcode), t(data.state), t(data.city), t(data.district)].filter(Boolean).join(''),
      [t(data.subdistrict), roadAndNumber].filter(Boolean).join(''),
      building,
    ]);
  }

  if (countryCode === 'TW') {
    return uniqueLines([
      [clean(data.postcode), t(data.state), t(data.city), t(data.district)].filter(Boolean).join(''),
      [t(data.subdistrict), roadAndNumber].filter(Boolean).join(''),
      building,
    ]);
  }

  if (countryCode === 'HK') {
    const region = t(data.state || data.city);
    const district = t(data.district || data.subdistrict);
    return uniqueLines([
      [t('香港'), region && region !== t('香港') ? region : ''].filter(Boolean).join(' '),
      district,
      roadAndNumber,
      building,
    ]);
  }

  const area = t(data.city || data.state || data.district || data.subdistrict);
  return uniqueLines([
    [t('澳門'), area && area !== t('澳門') ? area : ''].filter(Boolean).join(' '),
    roadAndNumber,
    building,
  ]);
}

function internationalLines(
  countryCode: ChineseShippingCountryCode,
  data: Required<Pick<AddressLike,
    'state' | 'city' | 'district' | 'subdistrict' | 'road' | 'house_number' |
    'building' | 'poi' | 'postcode'>>,
) {
  let usedUnverifiedRomanization = false;
  const t = (value: string) => {
    const normalized = normalizeInternationalField(countryCode, value);
    usedUnverifiedRomanization ||= normalized.usedUnverifiedRomanization;
    return normalized.text;
  };
  const road = t(data.road);
  const houseNumber = clean(data.house_number).replace(NUMBER_SUFFIX_PATTERN, '');
  const streetLine = countryCode === 'HK'
    ? [houseNumber, road].filter(Boolean).join(' ')
    : [houseNumber ? `No. ${houseNumber}` : '', road].filter(Boolean).join(', ');
  const building = t(data.building || data.poi);
  const subdistrict = t(data.subdistrict);
  const district = t(data.district);
  const city = t(data.city);
  const state = t(data.state);
  const postcode = clean(data.postcode);

  let lines: string[];
  if (countryCode === 'CN') {
    const cityLine = city && city.toLocaleLowerCase() !== state.toLocaleLowerCase() ? city : '';
    lines = uniqueLines([
      building,
      streetLine,
      subdistrict,
      district,
      cityLine,
      uniqueParts([postcode, state || city]).join(' '),
      CHINESE_SHIPPING_PROFILES.CN.englishCountryName,
    ]);
  } else if (countryCode === 'TW') {
    lines = uniqueLines([
      building,
      streetLine,
      subdistrict,
      district,
      [city, state, postcode].filter(Boolean).join(', '),
      CHINESE_SHIPPING_PROFILES.TW.englishCountryName,
    ]);
  } else if (countryCode === 'HK') {
    lines = uniqueLines([
      building,
      streetLine,
      subdistrict,
      district,
      city,
      state,
      CHINESE_SHIPPING_PROFILES.HK.englishCountryName,
    ]);
  } else {
    lines = uniqueLines([
      building,
      streetLine,
      subdistrict,
      district,
      city || state,
      CHINESE_SHIPPING_PROFILES.MO.englishCountryName,
    ]);
  }

  return { lines, usedUnverifiedRomanization };
}

function normalizedInput(input: AddressLike) {
  return {
    state: clean(input.state),
    city: clean(input.city),
    district: clean(input.district),
    subdistrict: clean(input.subdistrict || input.suburb),
    road: clean(input.road || input.street),
    house_number: clean(input.house_number || input.houseNumber),
    building: clean(input.building || input.organization),
    poi: clean(input.poi),
    postcode: clean(input.postcode || input.postal_code).replace(/\s+/gu, ''),
  };
}

export const CHINESE_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(CHINESE_SHIPPING_PROFILES) as ChineseShippingCountryCode[],
);

export function isChineseShippingCountry(countryCode: string) {
  return CHINESE_SHIPPING_COUNTRY_CODES.includes(baseCountryCode(countryCode) as ChineseShippingCountryCode);
}

export function getChineseShippingProfile(countryCode: string) {
  return CHINESE_SHIPPING_PROFILES[baseCountryCode(countryCode) as ChineseShippingCountryCode] || null;
}

export function getChineseShippingComponentLabels(
  mode: ChineseShippingMode,
): ChineseShippingComponentLabels {
  if (mode === 'international-shipping') return LABELS.en;
  return LABELS[mode === 'domestic-simplified' ? 'zh-Hans' : 'zh-Hant'];
}

export function normalizeChineseShippingField(options: {
  countryCode: string;
  text: string;
  mode: ChineseShippingMode;
}) {
  const profile = getChineseShippingProfile(options.countryCode);
  const source = clean(options.text);
  if (!profile || !source) return source;
  if (options.mode === 'international-shipping') {
    return normalizeInternationalField(profile.countryCode, source).text;
  }
  return toDomesticScript(
    source,
    options.mode === 'domestic-simplified' ? 'zh-Hans' : 'zh-Hant',
    profile.countryCode,
  );
}

export function buildChineseShippingAddress(
  input: AddressLike,
  mode: ChineseShippingMode,
): ChineseShippingAddressResult {
  const countryCode = baseCountryCode(input.country_code || input.countryCode || '') as ChineseShippingCountryCode;
  const profile = CHINESE_SHIPPING_PROFILES[countryCode];
  if (!profile) {
    throw new Error(`Unsupported Chinese shipping country: ${countryCode || '(empty)'}`);
  }

  const data = normalizedInput(input);
  const warnings = new Set<ChineseShippingWarning>();
  let lines: string[];
  if (mode === 'international-shipping') {
    const international = internationalLines(countryCode, data);
    lines = international.lines;
    if (international.usedUnverifiedRomanization) {
      warnings.add('official_romanization_unverified');
    }
  } else {
    lines = domesticLines(countryCode, data, mode === 'domestic-simplified' ? 'zh-Hans' : 'zh-Hant');
  }

  if (!data.road && !data.building && !data.poi) warnings.add('missing_delivery_line');
  if (!data.city && !data.state && !data.district && !data.subdistrict) warnings.add('missing_locality');

  if (profile.postcode.usage === 'required' && !data.postcode) {
    warnings.add('missing_postcode');
  } else if (profile.postcode.usage === 'not-used' && data.postcode) {
    warnings.add('unexpected_postcode');
  } else if (
    data.postcode &&
    profile.postcode.acceptedPattern &&
    !profile.postcode.acceptedPattern.test(data.postcode)
  ) {
    warnings.add('invalid_postcode_format');
  } else if (
    data.postcode &&
    profile.postcode.currentPattern &&
    !profile.postcode.currentPattern.test(data.postcode)
  ) {
    warnings.add('legacy_postcode_format');
  }

  if (lines.length > profile.maxLines) warnings.add('too_many_lines');
  if (lines.some(line => Array.from(line).length > profile.maxLineLength)) {
    warnings.add('line_too_long');
  }

  const reviewWarnings = new Set<ChineseShippingWarning>([
    'missing_delivery_line',
    'missing_locality',
    'missing_postcode',
    'invalid_postcode_format',
    'legacy_postcode_format',
    'unexpected_postcode',
    'official_romanization_unverified',
    'too_many_lines',
    'line_too_long',
  ]);
  const status: ChineseShippingStatus =
    warnings.has('missing_delivery_line') || warnings.has('missing_locality')
      ? 'insufficient'
      : Array.from(warnings).some(warning => reviewWarnings.has(warning))
        ? 'needs-review'
        : 'format-ready';
  const script: ChineseShippingScript | 'en' =
    mode === 'international-shipping'
      ? 'en'
      : mode === 'domestic-simplified'
        ? 'zh-Hans'
        : 'zh-Hant';

  return {
    countryCode,
    mode,
    script,
    lines,
    formatted: lines.join('\n'),
    status,
    warnings: Array.from(warnings),
    deliveryPointValidated: false,
    evidence: profile.evidence,
  };
}
