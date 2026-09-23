import MiniSearch from 'minisearch';
import { normalizeEnglishAddressPart } from './addressEnglish';
import { getIndianEnglishAddressAliases } from './indiaAddressEnglish';
import { getSouthAfricanEnglishAddressAliases } from './southAfricaAddressEnglish';

const ABBREVIATIONS: Record<string, string> = {
  st: 'street',
  rd: 'road',
  ave: 'avenue',
  av: 'avenida',
  blvd: 'boulevard',
  dr: 'drive',
  ln: 'lane',
  apt: 'apartment',
  ste: 'suite',
  cl: 'calle',
  cra: 'carrera',
  pza: 'plaza',
  col: 'colonia',
  no: 'numero',
  nro: 'numero',
  stn: 'station',
  sta: 'station',
  intl: 'international',
  hwy: 'highway',
  expy: 'expressway',
};

const DIRECT_ALIASES: Record<string, string[]> = {
  '東京都': ['Tokyo'],
  '東京': ['Tokyo'],
  '大阪': ['Osaka'],
  '京都': ['Kyoto'],
  '서울': ['Seoul'],
  '서울특별시': ['Seoul'],
  '北京': ['Beijing'],
  '北京市': ['Beijing'],
  '上海': ['Shanghai'],
  'Москва': ['Moscow'],
  'กรุงเทพมหานคร': ['Bangkok'],
  'Ciudad de México': ['Mexico City'],
  'Ciudad De Mexico': ['Mexico City'],
  CDMX: ['Mexico City'],
  'Estado de México': ['State of Mexico'],
  Bogotá: ['Bogota'],
  'São Paulo': ['Sao Paulo'],
  Panamá: ['Panama'],
  'República Dominicana': ['Dominican Republic'],
  'La Habana': ['Havana'],
  Perú: ['Peru'],
  Asunción: ['Asuncion'],
  ...Object.fromEntries(
    Object.entries(getIndianEnglishAddressAliases()).map(([local, english]) => [local, [english]]),
  ),
  ...Object.fromEntries(
    Object.entries(getSouthAfricanEnglishAddressAliases()).map(([local, english]) => [local, [english]]),
  ),
};

const COMMON_PLACE_NAMES = [
  'Tokyo',
  'Kyoto',
  'Osaka',
  'Seoul',
  'Beijing',
  'Guangzhou',
  'Shenzhen',
  'Shanghai',
  'Taipei',
  'Kaohsiung',
  'Hong Kong',
  'Macau',
  'Busan',
  'Daegu',
  'Daejeon',
  'Incheon',
  'Bangkok',
  'Singapore',
  'New York',
  'New York City',
  'Los Angeles',
  'London',
  'Paris',
  'Mexico City',
  'Bogota',
  'Sao Paulo',
  'San Jose',
  'Panama',
  'Havana',
  'Dominican Republic',
  'Buenos Aires',
  'Santiago',
  'Lima',
  'Quito',
  'Asuncion',
  'Montevideo',
  'Caracas',
  'Rio de Janeiro',
  'Cairo',
  'Alexandria',
  'Casablanca',
  'Rabat',
  'Mumbai',
  'Bengaluru',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Ahmedabad',
  'Amritsar',
  'Kochi',
  'Kozhikode',
  'Varanasi',
  'Lucknow',
  'Johannesburg',
  'Cape Town',
  'Durban',
  'Pretoria',
  'Port Elizabeth',
  'Grahamstown',
  'Polokwane',
  'Mbombela',
];

const COMMON_FEATURE_TERMS = [
  'address',
  'airport',
  'archipelago',
  'atoll',
  'avenue',
  'bay',
  'beach',
  'building',
  'bus',
  'city',
  'district',
  'ferry',
  'harbour',
  'highway',
  'international',
  'island',
  'isle',
  'islet',
  'market',
  'mountain',
  'museum',
  'neighbourhood',
  'park',
  'port',
  'postcode',
  'railway',
  'road',
  'sea',
  'station',
  'street',
  'suburb',
  'terminal',
  'town',
  'village',
  'water',
];

const ISLAND_PREFIX_PATTERN =
  /^(island|isle|islet|archipelago|atoll|cay|cayo|caye|isla|ilha|ile|isola|insel|eiland|ostrov|insula)\s+(?:(of|de|del|da|do|dos|das|di|d|du|des|la|le|el|the)\s+)?(.+)$/i;
const ISLAND_SUFFIX_PATTERN =
  /^(.+?)\s+(island|islands|isle|isles|islet|islets|archipelago|atoll|cay|cays|key|keys|holm|skerry|ait|eyot)$/i;
const ISLAND_JA_SUFFIX_PATTERN = /^(.+?)(島|諸島|群島|列島|環礁)$/;
const ISLAND_DESCRIPTOR_PATTERN =
  /\b(island|islands|isle|isles|islet|islets|archipelago|atoll|cay|cays|key|keys|cayo|caye|isla|ilha|ile|isola|insel|eiland|ostrov|insula|holm|skerry|ait|eyot)\b/i;

const TYPO_ALIASES: Record<string, string> = {
  tokio: 'Tokyo',
  toukyou: 'Tokyo',
  'tokyo to': 'Tokyo',
  kyouto: 'Kyoto',
  oosaka: 'Osaka',
  peking: 'Beijing',
  canton: 'Guangzhou',
  guangchou: 'Guangzhou',
  'shenzhen shi': 'Shenzhen',
  'shanghai shi': 'Shanghai',
  taibei: 'Taipei',
  gaoxiong: 'Kaohsiung',
  'taipei city': 'Taipei',
  'kaohsiung city': 'Kaohsiung',
  tsimshatsui: 'Tsim Sha Tsui',
  'tsim sha tsui': 'Tsim Sha Tsui',
  mongkok: 'Mong Kok',
  macao: 'Macau',
  pusan: 'Busan',
  taegu: 'Daegu',
  daejon: 'Daejeon',
  inchon: 'Incheon',
  'al qahirah': 'Cairo',
  iskandariya: 'Alexandria',
  casa: 'Casablanca',
  'rabat sale': 'Rabat',
  mexcio: 'Mexico',
  'mexcio city': 'Mexico City',
  bogtoa: 'Bogota',
  'sao paolo': 'Sao Paulo',
  'sna jose': 'San Jose',
  panamae: 'Panama',
  banaras: 'Varanasi',
  calicut: 'Kozhikode',
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  madras: 'Chennai',
  egoli: 'Johannesburg',
  ikapa: 'Cape Town',
  ethekwini: 'Durban',
  tshwane: 'Pretoria',
  gqeberha: 'Port Elizabeth',
  pietersburg: 'Polokwane',
};

const SCRIPT_COUNTRY_GUESSES = [
  'JP',
  'CN',
  'TW',
  'HK',
  'MO',
  'KR',
  'KP',
  'RU',
  'UA',
  'TH',
  'IN',
  'PK',
  'BD',
  'NP',
  'LK',
  'BT',
  'MV',
  'AF',
  'EG',
  'IL',
  'TR',
  'IR',
  'MN',
  'MX',
  'CO',
  'BR',
  'AR',
  'CL',
  'PE',
  'EC',
  'PY',
  'UY',
  'VE',
];

function unique(values: string[]) {
  const seen = new Set<string>();
  return values
    .map(value => value.trim())
    .filter(Boolean)
    .filter(value => {
      const key = value.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function deaccent(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeSearchText(value: string) {
  return deaccent(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=_`~()[\]"'¿?¡]/g, ' ')
    .replace(/[-–—]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ABBREVIATIONS[word] || word)
    .join(' ')
    .trim();
}

function levenshtein(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let col = 1; col <= b.length; col += 1) rows[0][col] = col;

  for (let row = 1; row <= a.length; row += 1) {
    for (let col = 1; col <= b.length; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      rows[row][col] = Math.min(
        rows[row - 1][col] + 1,
        rows[row][col - 1] + 1,
        rows[row - 1][col - 1] + cost,
      );
    }
  }

  return rows[a.length][b.length];
}

function typoCandidates(normalizedQuery: string) {
  const explicit = TYPO_ALIASES[normalizedQuery];
  if (explicit) return [explicit];

  return COMMON_PLACE_NAMES.filter(placeName => {
    const normalizedPlace = normalizeSearchText(placeName);
    const maxDistance = normalizedPlace.length <= 6 ? 1 : 2;
    return levenshtein(normalizedQuery, normalizedPlace) <= maxDistance;
  });
}

function searchRepairTerms() {
  return unique([
    ...COMMON_FEATURE_TERMS,
    ...COMMON_PLACE_NAMES.flatMap(placeName => normalizeSearchText(placeName).split(/\s+/)),
  ]).filter(term => term.length >= 3);
}

function bestTokenRepair(token: string) {
  const expanded = ABBREVIATIONS[token];
  if (expanded) return expanded;
  if (token.length < 4) return token;

  let best = token;
  let bestScore = 0;

  for (const term of searchRepairTerms()) {
    const distance = levenshtein(token, term);
    const score = 1 - distance / Math.max(token.length, term.length);
    const tolerance = token.length <= 5 ? 1 : 2;
    if (distance <= tolerance && score > bestScore) {
      best = term;
      bestScore = score;
    }
  }

  return best;
}

function repairedSearchCandidates(normalizedQuery: string) {
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const repaired = tokens.map(bestTokenRepair).join(' ');
  return repaired === normalizedQuery ? [] : [repaired];
}

function islandDescriptorCandidates(trimmed: string, normalizedQuery: string) {
  const candidates: string[] = [];
  const pushIslandBase = (rawBase: string, descriptor = 'island') => {
    const base = rawBase
      .replace(/^(of|de|del|da|do|dos|das|di|d|du|des|la|le|el|the)\s+/i, '')
      .trim();
    if (!base || base === normalizedQuery) return;
    candidates.push(base);
    candidates.push(`${base} ${descriptor}`);
  };

  const normalizedPrefix = normalizedQuery.match(ISLAND_PREFIX_PATTERN);
  if (normalizedPrefix?.[3]) {
    const descriptor = normalizedPrefix[1].toLowerCase() === 'archipelago' ? 'archipelago' : 'island';
    pushIslandBase(normalizedPrefix[3], descriptor);
  }

  const normalizedSuffix = normalizedQuery.match(ISLAND_SUFFIX_PATTERN);
  if (normalizedSuffix?.[1]) {
    const suffix = normalizedSuffix[2].toLowerCase();
    const descriptor = suffix === 'archipelago' || suffix === 'islands' || suffix === 'isles' ? 'archipelago' : 'island';
    pushIslandBase(normalizedSuffix[1], descriptor);
  }

  const japaneseSuffix = trimmed.normalize('NFKC').match(ISLAND_JA_SUFFIX_PATTERN);
  if (japaneseSuffix?.[1]) {
    const descriptor = japaneseSuffix[2] === '環礁' ? 'atoll' : japaneseSuffix[2].includes('諸') || japaneseSuffix[2].includes('群') || japaneseSuffix[2].includes('列') ? 'archipelago' : 'island';
    pushIslandBase(japaneseSuffix[1], descriptor);
  }

  if (ISLAND_DESCRIPTOR_PATTERN.test(normalizedQuery)) {
    const stripped = normalizedQuery
      .replace(ISLAND_PREFIX_PATTERN, '$3')
      .replace(ISLAND_SUFFIX_PATTERN, '$1')
      .replace(/\b(of|de|del|da|do|dos|das|di|d|du|des|la|le|el|the)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped && stripped !== normalizedQuery) pushIslandBase(stripped);
  }

  return unique(candidates);
}

export function expandSearchQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normalized = normalizeSearchText(trimmed);
  const repairedCandidates = repairedSearchCandidates(normalized);
  const islandCandidates = islandDescriptorCandidates(trimmed, normalized);
  const candidates = [
    trimmed,
    ...(DIRECT_ALIASES[trimmed] ?? []),
    normalizeEnglishAddressPart(trimmed),
    ...SCRIPT_COUNTRY_GUESSES.map(countryCode => normalizeEnglishAddressPart(trimmed, countryCode)),
    deaccent(trimmed),
    normalized,
    ...islandCandidates,
    ...typoCandidates(normalized),
    ...repairedCandidates,
    ...repairedCandidates.flatMap(typoCandidates),
  ];

  return unique(candidates);
}

function tokenizeSearchText(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function characterNgrams(value: string, size = 3) {
  const normalized = normalizeSearchText(value).replace(/\s+/g, '');
  if (!normalized) return [];
  if (normalized.length <= size) return [normalized];

  const grams: string[] = [];
  for (let index = 0; index <= normalized.length - size; index += 1) {
    grams.push(normalized.slice(index, index + size));
  }
  return grams;
}

function diceCoefficient(a: string, b: string) {
  const aGrams = characterNgrams(a);
  const bGrams = characterNgrams(b);
  if (aGrams.length === 0 || bGrams.length === 0) return 0;

  const remaining = new Map<string, number>();
  for (const gram of aGrams) {
    remaining.set(gram, (remaining.get(gram) || 0) + 1);
  }

  let overlap = 0;
  for (const gram of bGrams) {
    const count = remaining.get(gram) || 0;
    if (count > 0) {
      overlap += 1;
      remaining.set(gram, count - 1);
    }
  }

  return (2 * overlap) / (aGrams.length + bGrams.length);
}

function tokenSimilarity(a: string, b: string) {
  if (a === b) return 1;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function bestTokenMatchScore(queryToken: string, documentTokens: string[]) {
  let best = 0;
  for (const token of documentTokens) {
    best = Math.max(best, tokenSimilarity(queryToken, token));
  }
  return best;
}

function documentTextForCandidate(candidate: { label: string; aliases?: string[]; category?: string; type?: string }) {
  return [candidate.label, ...(candidate.aliases || []), candidate.category, candidate.type]
    .filter(Boolean)
    .join(' ');
}

function bm25Score(
  queryTokens: string[],
  documentTokens: string[],
  documentFrequencies: Map<string, number>,
  totalDocuments: number,
  averageLength: number,
) {
  if (queryTokens.length === 0 || documentTokens.length === 0) return 0;

  const k1 = 1.2;
  const b = 0.75;
  const termFrequency = new Map<string, number>();
  for (const token of documentTokens) {
    termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
  }

  let score = 0;
  for (const token of unique(queryTokens)) {
    const tf = termFrequency.get(token) || 0;
    if (tf === 0) continue;

    const df = documentFrequencies.get(token) || 0;
    const idf = Math.log(1 + (totalDocuments - df + 0.5) / (df + 0.5));
    const lengthPenalty = 1 - b + b * (documentTokens.length / Math.max(1, averageLength));
    score += idf * ((tf * (k1 + 1)) / (tf + k1 * lengthPenalty));
  }

  return score;
}

function legacyScoreSearchCandidate(label: string, queryCandidates: string[]) {
  const normalizedLabel = normalizeSearchText(label);
  let bestScore = 0;

  for (const candidate of queryCandidates) {
    const normalizedCandidate = normalizeSearchText(candidate);
    if (!normalizedCandidate) continue;

    if (normalizedLabel === normalizedCandidate) bestScore = Math.max(bestScore, 1);
    else if (normalizedLabel.startsWith(normalizedCandidate)) bestScore = Math.max(bestScore, 0.9);
    else if (normalizedLabel.includes(normalizedCandidate)) bestScore = Math.max(bestScore, 0.75);
    else {
      const distance = levenshtein(normalizedLabel.slice(0, normalizedCandidate.length), normalizedCandidate);
      const tolerance = normalizedCandidate.length <= 6 ? 1 : 2;
      if (distance <= tolerance) bestScore = Math.max(bestScore, 0.6);
    }
  }

  return bestScore;
}

export type SearchRankInput = {
  id?: string;
  label: string;
  aliases?: string[];
  category?: string;
  type?: string;
  [key: string]: unknown;
};

export type RankedSearchCandidate<T extends SearchRankInput> = {
  item: T;
  score: number;
  reasons: string[];
  matchedQuery: string;
};

export type SearchRankingOptions = {
  openSource?: boolean;
};

type OpenSourceSearchScore = {
  score: number;
  terms: string[];
  queryTerms: string[];
};

type MiniSearchCandidateDocument = {
  searchId: string;
  label: string;
  aliases: string;
  category: string;
  type: string;
};

function scoreCandidatesWithOpenSourceSearch<T extends SearchRankInput>(
  query: string,
  candidates: T[],
) {
  const scores = new Map<number, OpenSourceSearchScore>();
  if (!query.trim() || candidates.length === 0) return scores;

  const documents: MiniSearchCandidateDocument[] = candidates.map((candidate, index) => ({
    searchId: String(index),
    label: candidate.label,
    aliases: (candidate.aliases || []).join(' '),
    category: candidate.category || '',
    type: candidate.type || '',
  }));

  const search = new MiniSearch<MiniSearchCandidateDocument>({
    idField: 'searchId',
    fields: ['label', 'aliases', 'category', 'type'],
    storeFields: ['searchId'],
    processTerm: term => normalizeSearchText(term) || null,
    searchOptions: {
      boost: {
        label: 2.2,
        aliases: 2.8,
        category: 0.4,
        type: 0.4,
      },
      prefix: true,
      fuzzy: term => term.length >= 4 ? 0.2 : false,
    },
  });

  search.addAll(documents);
  const results = search.search(query);
  const maxScore = Math.max(0, ...results.map(result => result.score));
  if (maxScore <= 0) return scores;

  for (const result of results) {
    const index = Number.parseInt(String(result.searchId ?? result.id), 10);
    if (!Number.isInteger(index)) continue;

    scores.set(index, {
      score: Math.min(1, result.score / maxScore),
      terms: result.terms || [],
      queryTerms: result.queryTerms || [],
    });
  }

  return scores;
}

export function rankSearchCandidates<T extends SearchRankInput>(
  query: string,
  candidates: T[],
  options: SearchRankingOptions = {},
): RankedSearchCandidate<T>[] {
  const useOpenSourceSearch = options.openSource !== false;
  const queryCandidates = expandSearchQuery(query);
  const queryTokenSets = queryCandidates
    .map(tokenizeSearchText)
    .filter(tokens => tokens.length > 0);
  const queryTokens = unique(queryTokenSets.flat());

  const documents = candidates.map(candidate => {
    const text = documentTextForCandidate(candidate);
    const normalized = normalizeSearchText(text);
    const tokens = tokenizeSearchText(text);
    return { candidate, normalized, tokens };
  });

  const documentFrequencies = new Map<string, number>();
  for (const document of documents) {
    for (const token of unique(document.tokens)) {
      documentFrequencies.set(token, (documentFrequencies.get(token) || 0) + 1);
    }
  }

  const averageLength = documents.reduce((sum, document) => sum + document.tokens.length, 0) / Math.max(1, documents.length);
  const rawBm25Scores = documents.map(document => (
    bm25Score(queryTokens, document.tokens, documentFrequencies, documents.length, averageLength)
  ));
  const maxBm25 = Math.max(0, ...rawBm25Scores);
  const openSourceScores = useOpenSourceSearch
    ? scoreCandidatesWithOpenSourceSearch(query, candidates)
    : new Map<number, OpenSourceSearchScore>();

  return documents
    .map((document, index) => {
      const reasons = new Set<string>();
      let coverage = 0;

      for (const tokenSet of queryTokenSets) {
        let matchedWeight = 0;
        const tokenReasons = new Set<string>();

        for (const token of tokenSet) {
          if (document.tokens.includes(token)) {
            matchedWeight += 1;
            tokenReasons.add('exact-token');
          } else if (bestTokenMatchScore(token, document.tokens) >= 0.72) {
            matchedWeight += 0.82;
            tokenReasons.add('fuzzy-token');
          }
        }

        const tokenCoverage = tokenSet.length ? matchedWeight / tokenSet.length : 0;
        for (const reason of tokenReasons) {
          reasons.add(reason);
        }
        if (tokenCoverage > coverage) {
          coverage = tokenCoverage;
        }
      }

      const bm25 = maxBm25 > 0 ? rawBm25Scores[index] / maxBm25 : 0;
      const openSourceScore = openSourceScores.get(index);
      const ossScore = openSourceScore?.score ?? 0;
      if (ossScore > 0.05) {
        reasons.add('oss-minisearch');
      }

      let bestNgram = 0;
      let matchedQuery = query;
      let phraseScore = 0;

      for (const candidate of queryCandidates) {
        const normalizedCandidate = normalizeSearchText(candidate);
        if (!normalizedCandidate) continue;

        if (document.normalized.includes(normalizedCandidate)) {
          phraseScore = Math.max(phraseScore, 1);
          matchedQuery = candidate;
          reasons.add('phrase');
        }

        const ngram = diceCoefficient(document.normalized, normalizedCandidate);
        if (ngram > bestNgram) {
          bestNgram = ngram;
          matchedQuery = candidate;
        }
      }

      const score = Math.min(1, (0.4 * bm25) + (0.35 * coverage) + (0.2 * bestNgram) + (0.05 * phraseScore) + (0.22 * ossScore));
      return {
        item: document.candidate,
        score,
        reasons: Array.from(reasons),
        matchedQuery,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function scoreSearchCandidate(
  label: string,
  queryCandidates: string[],
  options: SearchRankingOptions = {},
) {
  const legacyScore = legacyScoreSearchCandidate(label, queryCandidates);
  const rankedScores = queryCandidates.map(candidate => rankSearchCandidates(candidate, [{ label }], options)[0]?.score ?? 0);
  return Math.max(legacyScore, ...rankedScores);
}

export type SearchCapabilityCase<T extends SearchRankInput = SearchRankInput> = {
  query: string;
  expectedId: string;
  candidates: T[];
};

export function evaluateSearchCapability<T extends SearchRankInput>(cases: SearchCapabilityCase<T>[]) {
  const details = cases.map(testCase => {
    const ranked = rankSearchCandidates(testCase.query, testCase.candidates);
    const rankIndex = ranked.findIndex(candidate => candidate.item.id === testCase.expectedId);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    return {
      query: testCase.query,
      expectedId: testCase.expectedId,
      topId: ranked[0]?.item.id ?? null,
      topScore: ranked[0]?.score ?? 0,
      rank,
      passed: rank === 1,
    };
  });

  const passed = details.filter(detail => detail.passed).length;
  const reciprocalRankSum = details.reduce((sum, detail) => sum + (detail.rank ? 1 / detail.rank : 0), 0);

  return {
    total: cases.length,
    passed,
    recallAt1: cases.length ? passed / cases.length : 0,
    meanReciprocalRank: cases.length ? reciprocalRankSum / cases.length : 0,
    details,
  };
}
