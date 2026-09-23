import { normalizeLanguageCode } from './languageCodeRules';

type AgidAddressTabLanguageOptions = {
  countryCode: string;
  preferredLanguage?: string;
  countryLanguages?: string[];
  knownLanguageCodes: string[];
};

export const INTERNATIONAL_SHIPPING_ENGLISH_TAB = 'intl_en';
export const LEGACY_CARRIER_ENGLISH_TAB = 'carrier';

export const INNER_CIRCLE_ENGLISH_COUNTRIES = ['us', 'gb', 'ca', 'au', 'nz', 'ie'] as const;

export const OUTER_CIRCLE_ENGLISH_COUNTRIES = [
  'in', 'pk', 'bd', 'lk', 'np', 'bt', 'mv',
  'sg', 'my', 'ph', 'bn', 'mm',
  'hk',
  'ng', 'gh', 'sl', 'lr', 'gm', 'cm',
  'er', 'et', 'ke', 'mu', 'rw', 'sc', 'so', 'ss', 'tz', 'ug',
  'za', 'zw', 'zm', 'bw', 'na', 'mw', 'ls', 'sz',
  'jm', 'tt', 'bb', 'bs', 'bz', 'gy', 'ag', 'lc', 'gd', 'dm', 'vc', 'kn',
  'bm', 'ai', 'ky', 'ms', 'tc', 'vg', 'vi',
  'pg', 'fj', 'sb', 'vu', 'ws', 'to',
  'fm', 'pw', 'mh', 'ki', 'tv', 'nr',
  'nf', 'cx', 'cc', 'ck', 'tk', 'nu', 'pn', 'aq',
  'as', 'gu', 'mp', 'um',
  'fk', 'gs',
  'gg', 'im', 'je', 'gi', 'sba',
  'io', 'sh', 'ac', 'ta',
  'ae', 'qa', 'bh',
] as const;

export const EXPANDING_CIRCLE_ENGLISH_COUNTRIES = [
  'jp', 'kr', 'cn', 'tw', 'mo',
  'th', 'vn', 'id', 'kh', 'la', 'mn',
  'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at',
  'se', 'no', 'dk', 'fi', 'is',
  'bq', 'aw', 'cw', 'sx', 'gl', 'fo', 'ax', 'sj_sva', 'sj_jan', 'es_bal', 'es_can', 'pt_azo', 'pt_mad',
  'ci', 'sn', 'bf', 'ml', 'ne', 'tg', 'bj', 'gn', 'gw', 'cv',
  'pl', 'cz', 'sk', 'hu', 'si', 'hr', 'ro', 'bg', 'gr',
  'tr', 'ru', 'ua', 'md', 'by', 'rs', 'ba', 'me', 'xk', 'al', 'mk',
  'am', 'az', 'ge',
  'br', 'mx', 'ar', 'cl', 'co', 'pe', 'uy',
  'sa', 'kw', 'om', 'jo', 'lb', 'il', 'eg', 'dz', 'ma', 'tn', 'ly', 'sd', 'mr', 'eh',
  'cf', 'td', 'cg', 'cd', 'gq', 'ga', 'st', 'ao',
] as const;

export const ENGLISH_ADDRESS_COUNTRIES = [
  ...INNER_CIRCLE_ENGLISH_COUNTRIES,
  ...OUTER_CIRCLE_ENGLISH_COUNTRIES,
] as const;

export type EnglishAddressCircle = 'inner' | 'outer' | 'expanding';

const ENGLISH_CIRCLE_BY_COUNTRY: Record<string, EnglishAddressCircle> = {
  ...Object.fromEntries(INNER_CIRCLE_ENGLISH_COUNTRIES.map(code => [code, 'inner' as const])),
  ...Object.fromEntries(OUTER_CIRCLE_ENGLISH_COUNTRIES.map(code => [code, 'outer' as const])),
};

export type ExpandingCirclePreparationStage = {
  id: 'native-format' | 'script-conversion' | 'english-exonyms' | 'open-source-validation';
  status: 'ready' | 'partial' | 'planned';
  description: string;
};

const DEFAULT_NATIVE_LANGUAGES_BY_COUNTRY: Record<string, string[]> = {
  mm: ['my'],
  th: ['th'],
  vn: ['vi'],
  kh: ['km'],
  la: ['lo'],
  my: ['ms'],
  sg: ['en', 'ms', 'zh-Hans', 'ta'],
  id: ['id'],
  ph: ['tl'],
  bn: ['ms'],
  tl: ['tet', 'pt-PT'],
  jp: ['ja'],
  kr: ['ko'],
  kp: ['ko'],
  cn: ['zh-Hans'],
  tw: ['zh-Hant'],
  hk: ['zh-Hant'],
  mo: ['zh-Hant', 'pt'],
  mn: ['mn'],
  in: ['en', 'hi', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'pa', 'or', 'mr', 'as', 'ur'],
  pk: ['ur'],
  bd: ['bn'],
  np: ['ne'],
  lk: ['si', 'ta'],
  bt: ['dz'],
  mv: ['dv'],
  af: ['ps', 'fa-AF'],
  tr: ['tr'],
  ir: ['fa'],
  iq: ['ar'],
  sy: ['ar'],
  lb: ['ar'],
  jo: ['ar'],
  il: ['he', 'ar'],
  ps: ['ar'],
  sa: ['ar'],
  ae: ['ar'],
  qa: ['ar'],
  bh: ['ar'],
  kw: ['ar'],
  om: ['ar'],
  ye: ['ar'],
  kz: ['kk', 'ru'],
  uz: ['uz', 'ru'],
  tm: ['tk', 'ru'],
  kg: ['ky', 'ru'],
  tj: ['tg', 'ru'],
  nz: ['en', 'mi'],
  fj: ['en', 'fj', 'hi'],
  pg: ['en', 'tpi', 'ho'],
  ws: ['sm'],
  to: ['to'],
  vu: ['bi', 'fr', 'en'],
  sb: ['en', 'pis'],
  fm: ['en', 'chk', 'pon', 'kos', 'yap'],
  pw: ['en', 'pau'],
  mh: ['mh', 'en'],
  ki: ['gil', 'en'],
  tv: ['tvl', 'en'],
  nr: ['na', 'en'],
  nf: ['en'],
  cx: ['en'],
  cc: ['en'],
  ck: ['en', 'rar'],
  tk: ['tkl'],
  nu: ['niu'],
  pn: ['en'],
  aq: ['en'],
  as: ['en', 'sm'],
  gu: ['en', 'ch'],
  mp: ['en', 'ch'],
  um: ['en'],
  gb: ['en', 'cy', 'gd'],
  ie: ['en', 'ga'],
  fr: ['fr'],
  de: ['de'],
  nl: ['nl'],
  be: ['nl', 'fr', 'de'],
  ch: ['de', 'fr', 'it', 'rm'],
  at: ['de'],
  li: ['de'],
  gp: ['fr'],
  mq: ['fr'],
  gf: ['fr'],
  re: ['fr'],
  yt: ['fr'],
  pf: ['fr', 'ty'],
  nc: ['fr'],
  wf: ['fr', 'wls', 'fud'],
  mf: ['fr'],
  bl: ['fr'],
  pm: ['fr'],
  tf: ['fr'],
  cp: ['fr'],
  se: ['sv'],
  no: ['no'],
  dk: ['da'],
  fi: ['fi', 'sv'],
  lv: ['lv'],
  ee: ['et'],
  lt: ['lt'],
  is: ['is'],
  ax: ['sv', 'fi'],
  it: ['it'],
  es: ['es', 'ca', 'gl', 'eu'],
  pt: ['pt'],
  gr: ['el'],
  mt: ['mt', 'en'],
  sm: ['it'],
  mc: ['fr'],
  va: ['it'],
  ad: ['ca'],
  cy: ['el', 'tr'],
  lu: ['lb', 'fr', 'de'],
  pl: ['pl'],
  cz: ['cs'],
  sk: ['sk'],
  hu: ['hu'],
  si: ['sl'],
  hr: ['hr'],
  ro: ['ro'],
  bg: ['bg'],
  ua: ['uk'],
  md: ['ro'],
  by: ['be', 'ru'],
  ru: ['ru'],
  rs: ['sr'],
  ba: ['bs', 'hr', 'sr'],
  me: ['cnr'],
  xk: ['sq', 'sr'],
  al: ['sq'],
  mk: ['mk'],
  bq: ['nl', 'pap', 'en'],
  aw: ['nl', 'pap', 'en'],
  cw: ['nl', 'pap', 'en'],
  sx: ['nl', 'en'],
  gl: ['kl', 'da'],
  fo: ['fo', 'da'],
  sj_sva: ['no'],
  sj_jan: ['no'],
  es_bal: ['es', 'ca'],
  es_can: ['es'],
  pt_azo: ['pt'],
  pt_mad: ['pt'],
  am: ['hy'],
  az: ['az'],
  ge: ['ka'],
  mx: ['es'],
  gt: ['es'],
  hn: ['es'],
  sv: ['es'],
  ni: ['es'],
  cr: ['es'],
  pa: ['es'],
  cu: ['es'],
  do: ['es'],
  pr: ['es', 'en'],
  br: ['pt'],
  ar: ['es'],
  cl: ['es'],
  co: ['es'],
  pe: ['es', 'qu', 'ay'],
  ec: ['es', 'qu'],
  bo: ['es', 'qu', 'ay'],
  py: ['es', 'gn'],
  uy: ['es'],
  ve: ['es'],
  ht: ['fr', 'ht'],
  sr: ['nl'],
  gy: ['en'],
  bz: ['en', 'es'],
  eg: ['ar'],
  dz: ['ar', 'kab', 'fr'],
  ma: ['ar', 'zgh', 'fr'],
  tn: ['ar', 'fr'],
  ly: ['ar'],
  sd: ['ar', 'en'],
  mr: ['ar'],
  eh: ['ar', 'es', 'fr'],
  ci: ['fr'],
  sn: ['fr'],
  bf: ['fr'],
  ml: ['fr'],
  ne: ['fr'],
  tg: ['fr'],
  bj: ['fr'],
  cm: ['fr', 'en'],
  gn: ['fr'],
  gw: ['pt'],
  cv: ['pt'],
  cf: ['fr', 'sg'],
  td: ['fr', 'ar'],
  cg: ['fr'],
  cd: ['fr'],
  gq: ['es', 'fr', 'pt'],
  ga: ['fr'],
  st: ['pt'],
  za: ['en', 'af', 'zu', 'xh', 'nr', 'st', 'tn', 'ss', 've', 'ts', 'nso'],
  na: ['en', 'af', 'kj'],
  bw: ['en', 'tn'],
  zw: ['en', 'sn', 'nd'],
  bi: ['rn', 'fr'],
  km: ['fr', 'ar', 'zdj'],
  dj: ['fr', 'ar'],
  er: ['ti', 'en', 'ar'],
  et: ['am', 'en', 'om', 'ti', 'so'],
  ke: ['en', 'sw'],
  mg: ['mg', 'fr'],
  mw: ['en', 'ny'],
  mu: ['en', 'fr', 'mfe'],
  mz: ['pt'],
  rw: ['rw', 'en', 'fr', 'sw'],
  sc: ['en', 'fr', 'crs'],
  so: ['so', 'ar', 'en'],
  ss: ['en'],
  tz: ['sw', 'en'],
  ug: ['en', 'sw'],
  zm: ['en', 'bem', 'ny'],
  ls: ['en', 'st'],
  sz: ['en', 'ss'],
  ao: ['pt'],
  slnd: ['so', 'en', 'ar'],
};

export function normalizeAgidLanguageCode(code: string | undefined | null): string {
  return normalizeLanguageCode(code, { emptyFallback: 'local' });
}

const englishBase = normalizeAgidLanguageCode;

const isEnglish = (code: string) => englishBase(code) === 'en';

const EUROPEAN_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'ch',
  'be',
  'lu',
  'fi',
  'ax',
  'gl',
  'fo',
  'es',
  'cy',
  'by',
  'ba',
  'xk',
  'gb',
  'ie',
  'mt',
]);

const CENTRAL_ASIA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'kz',
  'uz',
  'tm',
  'kg',
  'tj',
]);

const EAST_ASIA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'hk',
  'mo',
]);

const SOUTH_ASIA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'af',
  'in',
  'lk',
]);

const SOUTHEAST_ASIA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'ph',
  'sg',
  'tl',
]);

const WEST_ASIA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'il',
]);

const AMERICAS_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'pe',
  'ec',
  'bo',
  'py',
  'ht',
  'bq',
  'aw',
  'cw',
]);

const NORTH_AFRICA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'dz',
  'ma',
  'eh',
]);

const CENTRAL_AFRICA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'cm',
  'cf',
  'td',
  'gq',
  'bi',
]);

const SOUTHERN_AFRICA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'ao',
  'bw',
  'km',
  'ls',
  'mw',
  'mu',
  'mz',
  'na',
  'sc',
  'sz',
  'za',
  'zm',
  'zw',
]);

const EAST_AFRICA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'bi',
  'km',
  'dj',
  'er',
  'et',
  'ke',
  'mg',
  'mw',
  'mu',
  'mz',
  'rw',
  'sc',
  'so',
  'slnd',
  'tz',
  'ug',
  'zm',
]);

const OCEANIA_MULTILINGUAL_ADDRESS_MARKETS = new Set([
  'vu',
  'pf',
  'wf',
]);

const ENGLISH_PRIMARY_EXTRA_TABS_BY_COUNTRY: Record<string, string[]> = {
  us: ['es'],
  ca: ['fr'],
  ie: ['ga'],
  mu: ['fr'],
  sc: ['fr'],
  ls: ['st'],
  sz: ['ss'],
};

export const isEnglishAddressCountry = (countryCode: string) =>
  (ENGLISH_ADDRESS_COUNTRIES as readonly string[]).includes(countryCode.toLowerCase());

export function getEnglishAddressCircle(countryCode: string): EnglishAddressCircle {
  return ENGLISH_CIRCLE_BY_COUNTRY[countryCode.toLowerCase()] ?? 'expanding';
}

export function getExpandingCircleEnglishPreparation(countryCode: string): ExpandingCirclePreparationStage[] {
  const code = countryCode.toLowerCase();
  const isKnownExpanding = (EXPANDING_CIRCLE_ENGLISH_COUNTRIES as readonly string[]).includes(code);

  return [
    {
      id: 'native-format',
      status: 'ready',
      description: 'Keep the native-language address tab as the source of truth and apply country address-format metadata before English conversion.',
    },
    {
      id: 'script-conversion',
      status: isKnownExpanding ? 'partial' : 'planned',
      description: 'Convert local scripts with script-aware romanization, transliteration, and Latin deaccenting before rendering English.',
    },
    {
      id: 'english-exonyms',
      status: 'partial',
      description: 'Prefer English country, city, district, landmark, and OSM name:en style labels when available.',
    },
    {
      id: 'open-source-validation',
      status: 'planned',
      description: 'Validate converted English output against libaddressinput rules, optional libpostal parsing, and OpenAddresses-style references.',
    },
  ];
}

const normalizedKnownLanguageSet = (knownLanguageCodes: Iterable<string>) =>
  new Set([...knownLanguageCodes].map(normalizeAgidLanguageCode));

const uniqueKnownLanguages = (codes: string[], knownLanguageCodes: Set<string>) => {
  const seen = new Set<string>();
  const unique: string[] = [];
  const normalizedKnown = normalizedKnownLanguageSet(knownLanguageCodes);

  for (const code of codes) {
    const base = normalizeAgidLanguageCode(code);
    if (!normalizedKnown.has(base)) continue;
    if (seen.has(base)) continue;
    seen.add(base);
    unique.push(base);
  }

  return unique;
};

const addIfKnown = (tabs: string[], code: string, normalizedKnown: Set<string>) => {
  const normalized = normalizeAgidLanguageCode(code);
  if (normalizedKnown.has(normalized) && !tabs.includes(normalized)) {
    tabs.push(normalized);
  }
};

export function getAgidAddressTabLanguages({
  countryCode,
  preferredLanguage,
  countryLanguages = [],
  knownLanguageCodes,
}: AgidAddressTabLanguageOptions): string[] {
  const known = new Set(knownLanguageCodes);
  const normalizedKnown = normalizedKnownLanguageSet(knownLanguageCodes);
  const normalizedCountryCode = countryCode.toLowerCase();
  const isEnglishAddressMarket = isEnglishAddressCountry(normalizedCountryCode);
  const nativeCandidates = uniqueKnownLanguages(countryLanguages, known);
  const defaultNativeCandidates = uniqueKnownLanguages(
    DEFAULT_NATIVE_LANGUAGES_BY_COUNTRY[normalizedCountryCode] || [],
    known
  );
  for (const code of defaultNativeCandidates.reverse()) {
    const existingIndex = nativeCandidates.findIndex(candidate => englishBase(candidate) === englishBase(code));
    if (existingIndex >= 0) nativeCandidates.splice(existingIndex, 1);
    nativeCandidates.unshift(code);
  }

  if (isEnglishAddressMarket && !nativeCandidates.some(isEnglish) && normalizedKnown.has('en')) {
    nativeCandidates.push('en');
  }

  if ((normalizedCountryCode === 'jp') && !nativeCandidates.includes('ja') && normalizedKnown.has('ja')) {
    nativeCandidates.unshift('ja');
  }

  const isEnglishPrimaryCountry = nativeCandidates.length > 0 && isEnglish(nativeCandidates[0]);
  const primaryNative = isEnglishPrimaryCountry
    ? 'en'
    : nativeCandidates[0] || (normalizedKnown.has('en') ? 'en' : normalizeAgidLanguageCode(knownLanguageCodes[0]) || 'en');
  const tabs = [primaryNative];

  if (
    EUROPEAN_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    CENTRAL_ASIA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    EAST_ASIA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    SOUTH_ASIA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    SOUTHEAST_ASIA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    WEST_ASIA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    AMERICAS_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    NORTH_AFRICA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    CENTRAL_AFRICA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    SOUTHERN_AFRICA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    EAST_AFRICA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode) ||
    OCEANIA_MULTILINGUAL_ADDRESS_MARKETS.has(normalizedCountryCode)
  ) {
    for (const code of nativeCandidates) {
      if (!tabs.some(tab => englishBase(tab) === englishBase(code))) {
        tabs.push(code);
      }
    }
  }

  if (
    preferredLanguage &&
    preferredLanguage !== 'local' &&
    normalizedKnown.has(normalizeAgidLanguageCode(preferredLanguage)) &&
    englishBase(preferredLanguage) === englishBase(primaryNative) &&
    !tabs.includes(normalizeAgidLanguageCode(preferredLanguage))
  ) {
    tabs[0] = normalizeAgidLanguageCode(preferredLanguage);
  }

  if (isEnglishPrimaryCountry) {
    for (const code of nativeCandidates) {
      if (!isEnglish(code)) {
        addIfKnown(tabs, code, normalizedKnown);
      }
    }
    for (const code of ENGLISH_PRIMARY_EXTRA_TABS_BY_COUNTRY[normalizedCountryCode] ?? []) {
      addIfKnown(tabs, code, normalizedKnown);
    }
  }

  if (!isEnglish(tabs[0]) && normalizedKnown.has('en') && !tabs.some(isEnglish)) {
    tabs.push('en');
  }

  if ((isEnglish(tabs[0]) || isEnglishAddressMarket) && normalizedKnown.has('en') && !tabs.includes('en_domestic')) {
    tabs.push('en_domestic');
  }

  return tabs;
}

export function getAgidAddressDisplayTabs(languages: string[]) {
  const canonicalTabs = Array.from(new Set(
    languages.map(language =>
      language === LEGACY_CARRIER_ENGLISH_TAB || language === INTERNATIONAL_SHIPPING_ENGLISH_TAB
        ? 'en'
        : language
    )
  ));
  const hasDomesticEnglish = canonicalTabs.includes('en_domestic');
  const hasInternationalEnglish = canonicalTabs.includes('en');

  if (!hasDomesticEnglish) {
    return canonicalTabs;
  }

  const displayTabs: string[] = [];
  const add = (tab: string) => {
    if (!displayTabs.includes(tab)) displayTabs.push(tab);
  };

  for (const tab of canonicalTabs) {
    if (tab === 'en') {
      add('en_domestic');
      continue;
    }
    add(tab);
  }

  if (hasInternationalEnglish) add('en');

  return displayTabs;
}

export function isInternationalShippingEnglishTab(tabCode: string) {
  return tabCode === INTERNATIONAL_SHIPPING_ENGLISH_TAB || tabCode === LEGACY_CARRIER_ENGLISH_TAB;
}
