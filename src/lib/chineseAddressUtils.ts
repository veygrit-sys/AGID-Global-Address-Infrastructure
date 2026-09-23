import * as OpenCCT2CN from 'opencc-js/t2cn';
import { ConverterFactory } from 'opencc-js/core';
import HKVariants from 'opencc-js/dict/HKVariants';
import STCharacters from 'opencc-js/dict/STCharacters';
import TWVariants from 'opencc-js/dict/TWVariants';
import { pinyin } from 'pinyin-pro';
import {
  listChineseRegionalPlaceNameRecords,
  resolveChineseRegionalPlaceName,
} from './chineseRegionalPlaceName';

/**
 * Chinese Address Specialized Utilities
 * Implements the architecture requested for CN Mainland, HK, MO, and TW.
 */

// Keep the heavy full OpenCC dictionary out of the app shell. Address UI needs
// reliable script compatibility for place names, not full-document conversion.
const t2s = OpenCCT2CN.Converter({ from: 'tw', to: 'cn' });
// Address components are proper names, identifiers, and delivery descriptors.
// Character conversion plus regional glyph variants avoids pulling OpenCC's
// 1 MB general prose phrase dictionary into the shipping UI.
const s2tw = ConverterFactory([STCharacters], [TWVariants]);
const s2hk = ConverterFactory([STCharacters], [HKVariants]);

// Shipping English Dictionary (as requested)

const MAINLAND_CHINA_ENGLISH_PLACE_NAMES: Record<string, string> = {
  北京市: 'Beijing',
  上海市: 'Shanghai',
  天津市: 'Tianjin',
  重庆市: 'Chongqing',
  新疆维吾尔自治区: 'Xinjiang Uyghur Autonomous Region',
  内蒙古自治区: 'Inner Mongolia Autonomous Region',
  广西壮族自治区: 'Guangxi Zhuang Autonomous Region',
  西藏自治区: 'Tibet Autonomous Region',
  宁夏回族自治区: 'Ningxia Hui Autonomous Region',
  新疆: 'Xinjiang',
  内蒙古: 'Inner Mongolia',
  广西: 'Guangxi',
  西藏: 'Tibet',
  宁夏: 'Ningxia',
  广东省: 'Guangdong',
  浙江省: 'Zhejiang',
  江苏省: 'Jiangsu',
  四川省: 'Sichuan',
  山东省: 'Shandong',
  福建省: 'Fujian',
  海南省: 'Hainan',
  云南省: 'Yunnan',
  贵州省: 'Guizhou',
  湖南省: 'Hunan',
  湖北省: 'Hubei',
  河南省: 'Henan',
  河北省: 'Hebei',
  山西省: 'Shanxi',
  陕西省: 'Shaanxi',
  甘肃省: 'Gansu',
  青海省: 'Qinghai',
  辽宁省: 'Liaoning',
  吉林省: 'Jilin',
  黑龙江省: 'Heilongjiang',
  安徽省: 'Anhui',
  江西省: 'Jiangxi',
  朝阳区: 'Chaoyang District',
  天山区: 'Tianshan District',
  赛罕区: 'Saihan District',
  浦东新区: 'Pudong New Area',
  乌鲁木齐市: 'Urumqi',
  呼和浩特市: 'Hohhot',
  深圳市: 'Shenzhen',
  广州市: 'Guangzhou',
  杭州市: 'Hangzhou',
  南京市: 'Nanjing',
  成都市: 'Chengdu',
  西安市: "Xi'an",
  世纪大道: 'Century Avenue',
  解放南路: 'Jiefang South Road',
};

const MAINLAND_CHINA_SUFFIX_TRANSLATIONS: Array<[string, string]> = [
  ['自治州', 'Autonomous Prefecture'],
  ['自治区', 'Autonomous Region'],
  ['自治县', 'Autonomous County'],
  ['特别行政区', 'Special Administrative Region'],
  ['新区', 'New Area'],
  ['地区', 'Prefecture'],
  ['省', 'Province'],
  ['市', ''],
  ['区', 'District'],
  ['县', 'County'],
  ['旗', 'Banner'],
  ['镇', 'Town'],
  ['乡', 'Township'],
  ['村', 'Village'],
  ['大道', 'Avenue'],
  ['大厦', 'Building'],
  ['大廈', 'Building'],
  ['大楼', 'Building'],
  ['大樓', 'Building'],
  ['中心', 'Center'],
  ['广场', 'Square'],
  ['廣場', 'Square'],
  ['南路', 'South Road'],
  ['北路', 'North Road'],
  ['东路', 'East Road'],
  ['西路', 'West Road'],
  ['中路', 'Middle Road'],
  ['路', 'Road'],
  ['街道', 'Subdistrict'],
  ['街', 'Street'],
  ['巷', 'Lane'],
  ['号', 'No.'],
];

export type ChineseAddressZone = 'mainland' | 'taiwan' | 'hong-kong' | 'macao';

export type ChineseAddressAlias = {
  native: string;
  values: string[];
  kind: 'english' | 'historical' | 'pinyin' | 'portuguese' | 'cantonese';
};

export type ChineseAddressProfile = {
  zone: ChineseAddressZone;
  scripts: {
    simplified: Record<string, string>;
    traditional: Record<string, string>;
  };
  aliases: ChineseAddressAlias[];
};

const CHINESE_REGION_ALIASES: Record<ChineseAddressZone, Record<string, ChineseAddressAlias>> = {
  mainland: {
    北京市: { native: '北京市', values: ['Beijing', 'Peking'], kind: 'historical' },
    广州市: { native: '广州市', values: ['Guangzhou', 'Canton'], kind: 'historical' },
    上海市: { native: '上海市', values: ['Shanghai'], kind: 'english' },
    深圳市: { native: '深圳市', values: ['Shenzhen'], kind: 'english' },
    新疆维吾尔自治区: { native: '新疆维吾尔自治区', values: ['Xinjiang Uyghur Autonomous Region'], kind: 'english' },
  },
  taiwan: {
    台北市: { native: '台北市', values: ['Taipei', 'Taibei'], kind: 'pinyin' },
    臺北市: { native: '臺北市', values: ['Taipei', 'Taibei'], kind: 'pinyin' },
    新北市: { native: '新北市', values: ['New Taipei', 'Xinbei'], kind: 'pinyin' },
    台中市: { native: '台中市', values: ['Taichung', 'Taizhong'], kind: 'pinyin' },
    臺中市: { native: '臺中市', values: ['Taichung', 'Taizhong'], kind: 'pinyin' },
    台南市: { native: '台南市', values: ['Tainan'], kind: 'pinyin' },
    臺南市: { native: '臺南市', values: ['Tainan'], kind: 'pinyin' },
    高雄市: { native: '高雄市', values: ['Kaohsiung', 'Gaoxiong'], kind: 'pinyin' },
    信義區: { native: '信義區', values: ['Xinyi District'], kind: 'english' },
    市府路: { native: '市府路', values: ['Shifu Rd.'], kind: 'english' },
  },
  'hong-kong': {
    香港: { native: '香港', values: ['Hong Kong', 'Heung Gong'], kind: 'cantonese' },
    九龍: { native: '九龍', values: ['Kowloon'], kind: 'cantonese' },
    香港島: { native: '香港島', values: ['Hong Kong Island'], kind: 'cantonese' },
    中環: { native: '中環', values: ['Central'], kind: 'historical' },
    尖沙咀: { native: '尖沙咀', values: ['Tsim Sha Tsui'], kind: 'cantonese' },
    旺角: { native: '旺角', values: ['Mong Kok'], kind: 'cantonese' },
    銅鑼灣: { native: '銅鑼灣', values: ['Causeway Bay'], kind: 'historical' },
    彌敦道: { native: '彌敦道', values: ['Nathan Road'], kind: 'historical' },
  },
  macao: {
    澳門: { native: '澳門', values: ['Macau', 'Macao'], kind: 'portuguese' },
    澳门: { native: '澳门', values: ['Macau', 'Macao'], kind: 'portuguese' },
    氹仔: { native: '氹仔', values: ['Taipa'], kind: 'portuguese' },
    路環: { native: '路環', values: ['Coloane'], kind: 'portuguese' },
    新馬路: { native: '新馬路', values: ['Avenida de Almeida Ribeiro'], kind: 'portuguese' },
    新马路: { native: '新马路', values: ['Avenida de Almeida Ribeiro'], kind: 'portuguese' },
    大馬路: { native: '大馬路', values: ['Avenida'], kind: 'portuguese' },
    大马路: { native: '大马路', values: ['Avenida'], kind: 'portuguese' },
  },
};

function zoneFromCountryCode(countryCode: string): ChineseAddressZone {
  const code = countryCode.toUpperCase();
  if (code === 'TW') return 'taiwan';
  if (code === 'HK') return 'hong-kong';
  if (code === 'MO') return 'macao';
  return 'mainland';
}

function collectChineseAliases(zone: ChineseAddressZone, values: string[]) {
  const aliases = CHINESE_REGION_ALIASES[zone];
  const collected = new Map<string, ChineseAddressAlias>();

  for (const value of values.filter(Boolean)) {
    const candidates = [value, toSimplified(value), toTraditional(value, zone === 'hong-kong' || zone === 'macao' ? 'HK' : 'TW')];
    for (const candidate of candidates) {
      const alias = aliases[candidate];
      if (alias) collected.set(alias.native, alias);
    }
  }

  return Array.from(collected.values());
}

export function buildChineseAddressProfile(countryCode: string, details: Record<string, any>): ChineseAddressProfile {
  const zone = zoneFromCountryCode(countryCode);
  const fields = ['country', 'state', 'city', 'district', 'subdistrict', 'road', 'building', 'poi'];
  const simplified: Record<string, string> = {};
  const traditional: Record<string, string> = {};

  for (const field of fields) {
    const value = String(details[field] ?? '').trim();
    if (!value) continue;
    simplified[field] = toSimplified(value);
    traditional[field] = toTraditional(value, zone === 'macao' || zone === 'hong-kong' ? 'HK' : 'TW');
  }

  return {
    zone,
    scripts: {
      simplified,
      traditional,
    },
    aliases: collectChineseAliases(zone, fields.map(field => String(details[field] ?? '').trim())),
  };
}

function titleCasePinyinPhrase(text: string) {
  const syllables = pinyin(text, { toneType: 'none' })
    .split(/\s+/)
    .filter(Boolean)
    .map(syllable => syllable.toLowerCase());

  if (syllables.length === 0) return '';
  const compact = syllables.join('');
  return compact.charAt(0).toUpperCase() + compact.slice(1);
}

function normalizeChineseFallbackSegment(segment: string) {
  if (!segment) return '';

  for (const [suffix, translation] of MAINLAND_CHINA_SUFFIX_TRANSLATIONS) {
    if (segment.endsWith(suffix) && segment.length > suffix.length) {
      const base = normalizeChineseFallbackSegment(segment.slice(0, -suffix.length));
      return [base, translation].filter(Boolean).join(' ');
    }
  }

  return titleCasePinyinPhrase(segment);
}

export function normalizeMainlandChineseAddressPart(text: string): string {
  if (!text) return '';

  const simplified = toSimplified(text).normalize('NFKC');
  const keys = Object.keys(MAINLAND_CHINA_ENGLISH_PLACE_NAMES).sort((a, b) => b.length - a.length);
  const parts: string[] = [];
  let index = 0;

  while (index < simplified.length) {
    const match = keys.find(key => simplified.startsWith(key, index));
    if (match) {
      parts.push(MAINLAND_CHINA_ENGLISH_PLACE_NAMES[match]);
      index += match.length;
      continue;
    }

    const char = simplified[index];
    if (/[\s,，、]/.test(char)) {
      index += 1;
      continue;
    }

    if (/[\dA-Za-z\-]/.test(char)) {
      let end = index + 1;
      while (end < simplified.length && /[\dA-Za-z\-]/.test(simplified[end])) end += 1;
      parts.push(simplified.slice(index, end));
      index = end;
      continue;
    }

    let end = index + 1;
    while (
      end < simplified.length &&
      !keys.some(key => simplified.startsWith(key, end)) &&
      !/[\s,，、\dA-Za-z\-]/.test(simplified[end])
    ) {
      end += 1;
    }

    parts.push(normalizeChineseFallbackSegment(simplified.slice(index, end)));
    index = end;
  }

  return parts
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+No\.\s*/g, ' No. ')
    .trim();
}

const CHINESE_REGIONAL_COUNTRY_CODES = new Set(['CN', 'TW', 'HK', 'MO', 'SG']);
const HAN_TEXT_PATTERN = /[\u3400-\u9fff]/;

/**
 * Resolves regional official or established names before any phonetic fallback.
 * HK, MO, and SG deliberately fail closed for unknown Han text because Mandarin
 * Pinyin is not a safe substitute for their delivery names.
 */
export function normalizeChineseRegionalAddressPart(text: string, countryCode: string): string {
  const value = String(text ?? '').normalize('NFKC').trim();
  if (!value) return '';

  const code = countryCode.toUpperCase();
  if (!CHINESE_REGIONAL_COUNTRY_CODES.has(code)) return '';
  if (!HAN_TEXT_PATTERN.test(value)) return value;

  const exact = resolveChineseRegionalPlaceName({ countryCode: code, nativeName: value });
  if (exact.status === 'resolved') return exact.englishName;
  if (exact.status === 'ambiguous' || exact.status === 'rejected-evidence') return '';

  const aliases = listChineseRegionalPlaceNameRecords(code)
    .flatMap(item => item.nativeNames.map(nativeName => ({
      nativeName: nativeName.normalize('NFKC'),
      englishName: item.englishName,
    })))
    .sort((left, right) => right.nativeName.length - left.nativeName.length);
  const parts: string[] = [];
  let index = 0;

  while (index < value.length) {
    const match = aliases.find(alias => value.startsWith(alias.nativeName, index));
    if (match) {
      parts.push(match.englishName);
      index += match.nativeName.length;
      continue;
    }

    const current = value[index];
    if (/[\s,，、]/.test(current)) {
      index += 1;
      continue;
    }

    if (/[\dA-Za-z.'\-]/.test(current)) {
      let end = index + 1;
      while (end < value.length && /[\dA-Za-z.'\-]/.test(value[end])) end += 1;
      parts.push(value.slice(index, end));
      index = end;
      continue;
    }

    let end = index + 1;
    while (
      end < value.length &&
      !aliases.some(alias => value.startsWith(alias.nativeName, end)) &&
      !/[\s,，、\dA-Za-z.'\-]/.test(value[end])
    ) {
      end += 1;
    }
    const unresolved = value.slice(index, end);
    if (HAN_TEXT_PATTERN.test(unresolved)) {
      if (code !== 'CN' && code !== 'TW') return '';
      const fallback = normalizeMainlandChineseAddressPart(unresolved);
      if (!fallback) return '';
      parts.push(fallback);
    }
    index = end;
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Layer 1: Input Absorption & Canonicalization
 * Handles Simplified/Traditional/Dialect variations.
 */
export function toSimplified(text: string): string {
  if (!text) return "";
  // Basic manual overrides for common variations mentioned in request
  const customMap: Record<string, string> = {
    '臺': '台',
    '廣': '广',
    '澳門': '澳门',
    '深圳灣': '深圳湾'
  };
  let result = text;
  Object.entries(customMap).forEach(([k, v]) => {
    result = result.replace(new RegExp(k, 'g'), v);
  });
  return t2s(result);
}

export function toTraditional(text: string, region: 'TW' | 'HK' | 'MO' = 'TW'): string {
  if (!text) return "";
  return region === 'HK' || region === 'MO' ? s2hk(text) : s2tw(text);
}

/**
 * Detects if a string contains Simplified, Traditional, or mixed Chinese characters.
 */
export function detectChineseScript(text: string): 'simplified' | 'traditional' | 'mixed' | 'none' {
  if (!text || !/[\u4e00-\u9faf]/.test(text)) return 'none';

  const simplified = toSimplified(text);
  const traditional = toTraditional(text);

  if (text === simplified && text !== traditional) return 'simplified';
  if (text === traditional && text !== simplified) return 'traditional';
  if (text !== simplified && text !== traditional) return 'mixed';
  return 'none';
}

/**
 * Layer 2: Administrative Division Canonicalization
 * Ensures standard names for provinces/cities.
 */
export function canonicalizeCN(details: any): any {
  const result = { ...details };
  // Ensure Simplified Chinese for Mainland
  const fields = ['state', 'city', 'district', 'subdistrict', 'road', 'building', 'amenity', 'shop'];
  fields.forEach(f => {
    if (result[f]) result[f] = toSimplified(result[f]);
  });

  // Clean common suffixes if they are redundant (Heuristic)
  if (result.city && result.city.endsWith('市') && result.city.length > 2) {
    // Keep it for domestic, but we might mark it for international
  }

  return result;
}

/**
 * Layer 3: Domestic Rendering
 * Simplified Chinese, Big-to-Small, No Translation.
 */
export function renderDomesticCN(details: any): string {
  const c = canonicalizeCN(details);
  const parts = [
    c.postcode ? c.postcode : "",
    c.state,
    c.city,
    c.district,
    c.subdistrict,
    c.road,
    c.house_number ? `${c.house_number}号` : "",
    c.building,
    c.amenity || c.shop
  ].filter(Boolean);

  return parts.join("");
}

/**
 * Layer 4: International Rendering
 * Pinyin + Shipping English Dictionary.
 */
export function renderInternationalCN(details: any): string {
  const c = canonicalizeCN(details);

  const translateField = (text: string) => {
    if (!text) return "";
    return normalizeChineseRegionalAddressPart(text, 'CN');
  };

  const parts = [
    translateField(c.building),
    translateField(c.road),
    c.house_number ? `No. ${c.house_number}` : "",
    translateField(c.subdistrict),
    translateField(c.district),
    translateField(c.city),
    translateField(c.state),
    c.postcode,
    "CHINA"
  ].filter(Boolean);

  return parts.join(", ");
}

function renderTaiwanEnglish(details: any): string {
  const state = normalizeChineseRegionalAddressPart(details.state, 'TW');
  const city = normalizeChineseRegionalAddressPart(details.city, 'TW');
  const road = normalizeChineseRegionalAddressPart(details.road, 'TW');
  const building = normalizeChineseRegionalAddressPart(details.building, 'TW');
  const parts = [
    building,
    details.house_number && road ? `No. ${details.house_number}, ${road}` : road,
    city,
    state,
    details.postcode,
    'TAIWAN',
  ].filter(Boolean);
  return parts.join(', ');
}

function renderHongKongEnglish(details: any): string {
  const road = normalizeChineseRegionalAddressPart(details.road, 'HK');
  const subdistrict = normalizeChineseRegionalAddressPart(details.subdistrict, 'HK');
  const city = normalizeChineseRegionalAddressPart(details.city || details.district, 'HK');
  const building = normalizeChineseRegionalAddressPart(details.building, 'HK');
  const parts = [
    building,
    details.house_number && road ? `${details.house_number} ${road}` : (details.house_number || road),
    subdistrict,
    city,
    'HONG KONG',
  ].filter(Boolean);
  return parts.join(', ');
}

function renderMacaoPortuguese(details: any) {
  const road = normalizeChineseRegionalAddressPart(details.road, 'MO');
  const subdistrict = normalizeChineseRegionalAddressPart(details.subdistrict || details.city, 'MO');
  const building = normalizeChineseRegionalAddressPart(details.building, 'MO');
  const locality = subdistrict && !/^maca[ou]$/i.test(subdistrict) ? subdistrict : '';
  const parts = [
    building,
    details.house_number && road ? `No. ${details.house_number}, ${road}` : road,
    locality,
    'MACAU',
  ].filter(Boolean);
  return parts.join(', ');
}

export function renderChineseLocaleAddress(locale: string, details: any): string {
  const countryCode = details.country_code || details.countryCode || 'CN';
  const zone = zoneFromCountryCode(countryCode);
  const normalizedLocale = locale.toLowerCase();

  if (zone === 'mainland') {
    return normalizedLocale.startsWith('zh-cn')
      ? renderDomesticCN(details)
      : renderInternationalCN(details);
  }

  if (zone === 'taiwan') {
    return normalizedLocale.startsWith('zh')
      ? renderTW(details, 'zh-Hant-TW')
      : renderTaiwanEnglish(details);
  }

  if (zone === 'hong-kong') {
    return normalizedLocale.startsWith('zh')
      ? renderHK(details, 'zh-Hant-HK')
      : renderHongKongEnglish(details);
  }

  if (normalizedLocale.startsWith('zh')) {
    return renderMO(details, 'zh-Hant-MO');
  }
  return renderMacaoPortuguese(details);
}

/**
 * Traditional Chinese Regions specialized logic
 */
export function renderTW(details: any, lang: string): string {
  const isDomestic = lang.startsWith('zh-Hant') || lang === 'local';
  if (isDomestic) {
    const parts = [
      details.postcode,
      details.state, // City/County
      details.city,  // District
      details.subdistrict,
      details.road,
      details.house_number ? `${details.house_number}號` : "",
      details.building
    ].filter(Boolean);
    return parts.join("");
  } else {
    return renderTaiwanEnglish(details);
  }
}

export function renderHK(details: any, lang: string): string {
  const isEnglish = lang === 'en' || lang === 'international';
  if (isEnglish) {
    return renderHongKongEnglish(details);
  } else {
    // HK Traditional (Can handle local, zh-Hant, or specific zh-Hant-HK)
    const parts = [
      details.city || details.district,
      details.subdistrict,
      details.road,
      details.house_number ? `${details.house_number}號` : "",
      details.building
    ].filter(Boolean);
    return "香港 " + parts.join("");
  }
}

export function renderMO(details: any, lang: string): string {
  const isEnglish = lang === 'en' || lang === 'international';
  const isPortuguese = lang === 'pt-PT' || lang === 'pt';

  if (isPortuguese || isEnglish) {
    return renderMacaoPortuguese(details);
  } else {
    // Macau Chinese
    const parts = [
      details.subdistrict,
      details.road,
      details.house_number ? `${details.house_number}號` : "",
      details.building
    ].filter(Boolean);
    return "澳門 " + parts.join("");
  }
}
