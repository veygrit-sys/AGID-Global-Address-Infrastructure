import { expandSearchQuery, normalizeSearchText } from './searchQuery';

export type PlaceSearchScript =
  | 'latin'
  | 'han'
  | 'kana'
  | 'hangul'
  | 'cyrillic'
  | 'arabic'
  | 'hebrew'
  | 'devanagari'
  | 'bengali'
  | 'gurmukhi'
  | 'gujarati'
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'malayalam'
  | 'thai'
  | 'lao'
  | 'khmer'
  | 'myanmar'
  | 'greek'
  | 'armenian'
  | 'georgian'
  | 'ethiopic';

export type PlaceSearchLanguageProfile = {
  rawQuery: string;
  normalizedQuery: string;
  scripts: PlaceSearchScript[];
  languageHints: string[];
  acceptLanguage: string;
  queryVariants: string[];
  independentFrom: readonly ['app-language', 'address-language'];
};

type ScriptRule = {
  script: PlaceSearchScript;
  pattern: RegExp;
  languages: string[];
};

export const PLACE_SEARCH_LANGUAGE_POLICY = {
  source: 'query-script-and-search-aliases',
  independentFrom: ['app-language', 'address-language'] as const,
  maxProviderLanguages: 18,
  maxQueryVariants: 8,
};

const SCRIPT_RULES: ScriptRule[] = [
  { script: 'kana', pattern: /[\u3040-\u30ff]/u, languages: ['ja'] },
  { script: 'han', pattern: /[\u3400-\u9fff\uf900-\ufaff]/u, languages: ['ja', 'zh', 'zh-Hans', 'zh-Hant', 'ko'] },
  { script: 'hangul', pattern: /[\uac00-\ud7af\u1100-\u11ff]/u, languages: ['ko'] },
  { script: 'cyrillic', pattern: /[\u0400-\u052f]/u, languages: ['ru', 'uk', 'be', 'bg', 'sr', 'mk', 'kk', 'ky', 'mn'] },
  { script: 'arabic', pattern: /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u, languages: ['ar', 'fa', 'ur', 'ps', 'ku'] },
  { script: 'hebrew', pattern: /[\u0590-\u05ff]/u, languages: ['he'] },
  { script: 'devanagari', pattern: /[\u0900-\u097f]/u, languages: ['hi', 'ne', 'mr', 'sa'] },
  { script: 'bengali', pattern: /[\u0980-\u09ff]/u, languages: ['bn', 'as'] },
  { script: 'gurmukhi', pattern: /[\u0a00-\u0a7f]/u, languages: ['pa'] },
  { script: 'gujarati', pattern: /[\u0a80-\u0aff]/u, languages: ['gu'] },
  { script: 'tamil', pattern: /[\u0b80-\u0bff]/u, languages: ['ta'] },
  { script: 'telugu', pattern: /[\u0c00-\u0c7f]/u, languages: ['te'] },
  { script: 'kannada', pattern: /[\u0c80-\u0cff]/u, languages: ['kn'] },
  { script: 'malayalam', pattern: /[\u0d00-\u0d7f]/u, languages: ['ml'] },
  { script: 'thai', pattern: /[\u0e00-\u0e7f]/u, languages: ['th'] },
  { script: 'lao', pattern: /[\u0e80-\u0eff]/u, languages: ['lo'] },
  { script: 'khmer', pattern: /[\u1780-\u17ff]/u, languages: ['km'] },
  { script: 'myanmar', pattern: /[\u1000-\u109f]/u, languages: ['my'] },
  { script: 'greek', pattern: /[\u0370-\u03ff]/u, languages: ['el'] },
  { script: 'armenian', pattern: /[\u0530-\u058f]/u, languages: ['hy'] },
  { script: 'georgian', pattern: /[\u10a0-\u10ff\u1c90-\u1cbf]/u, languages: ['ka'] },
  { script: 'ethiopic', pattern: /[\u1200-\u137f]/u, languages: ['am', 'ti'] },
  { script: 'latin', pattern: /[A-Za-z\u00c0-\u024f\u1e00-\u1eff]/u, languages: ['en', 'es', 'fr', 'pt', 'de', 'it', 'nl', 'tr', 'vi', 'id', 'ms', 'sw', 'pl', 'cs', 'ro'] },
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

function asciiFoldVariants(query: string) {
  const folded = deaccent(query);
  const normalized = normalizeSearchText(query);
  const compact = query.normalize('NFKC').replace(/[.,/#!$%^&*;:{}=_`~()[\]"'¿?¡-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return unique([folded, normalized, compact]);
}

export function detectPlaceSearchScripts(query: string): PlaceSearchScript[] {
  return SCRIPT_RULES
    .filter(rule => rule.pattern.test(query))
    .map(rule => rule.script);
}

export function buildPlaceSearchLanguageHints(query: string): string[] {
  const scripts = detectPlaceSearchScripts(query);
  const scriptLanguages = SCRIPT_RULES
    .filter(rule => scripts.includes(rule.script))
    .flatMap(rule => rule.languages);

  const fallbackLanguages = scripts.length === 0
    ? ['en', 'local']
    : ['en', 'local'];

  return unique([...scriptLanguages, ...fallbackLanguages])
    .slice(0, PLACE_SEARCH_LANGUAGE_POLICY.maxProviderLanguages);
}

export function buildPlaceSearchQueryVariants(query: string): string[] {
  return unique([
    query.trim(),
    ...expandSearchQuery(query),
    ...asciiFoldVariants(query),
  ]).slice(0, PLACE_SEARCH_LANGUAGE_POLICY.maxQueryVariants);
}

export function buildPlaceSearchLanguageProfile(query: string): PlaceSearchLanguageProfile {
  const rawQuery = query.trim();
  const languageHints = buildPlaceSearchLanguageHints(rawQuery);
  return {
    rawQuery,
    normalizedQuery: normalizeSearchText(rawQuery),
    scripts: detectPlaceSearchScripts(rawQuery),
    languageHints,
    acceptLanguage: languageHints.join(','),
    queryVariants: buildPlaceSearchQueryVariants(rawQuery),
    independentFrom: PLACE_SEARCH_LANGUAGE_POLICY.independentFrom,
  };
}
