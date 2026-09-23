export const ADDRESS_SEARCH_FEDERATION_VERSION = 'agid-address-search-federation-v1';

export const ADDRESS_SEARCH_RECORD_KINDS = [
  'address',
  'admin-area',
  'postal-code',
  'agid-cell',
  'natural-feature',
  'poi',
  'legacy-address',
  'carrier-zone',
] as const;

export const ADDRESS_SEARCH_REASON_CODES = [
  'agid-match',
  'postal-code-match',
  'exact-name-match',
  'localized-name-match',
  'administrative-match',
  'old-address-match',
  'alias-match',
  'natural-feature-match',
  'synonym-match',
  'prefix-match',
  'typo-tolerant-match',
  'language-preferred',
  'source-priority',
] as const;

export type AddressSearchRecordKind = typeof ADDRESS_SEARCH_RECORD_KINDS[number];
export type AddressSearchReasonCode = typeof ADDRESS_SEARCH_REASON_CODES[number];

export type AddressSearchLocalizedText = {
  text: string;
  language?: string;
  script?: string;
  preferred?: boolean;
};

export type AddressSearchAlias = AddressSearchLocalizedText & {
  source?: 'local-name' | 'exonym' | 'transliteration' | 'abbreviation' | 'carrier' | 'historical' | 'manual';
};

export type AddressSearchAdminName = AddressSearchLocalizedText & {
  level?: 'country' | 'region' | 'state' | 'province' | 'prefecture' | 'county' | 'city' | 'ward' | 'district' | 'village' | 'neighborhood';
};

export type AddressSearchNaturalFeature = AddressSearchLocalizedText & {
  featureType?: 'river' | 'waterfall' | 'lake' | 'pond' | 'wetland' | 'island' | 'mountain' | 'desert' | 'forest' | 'glacier' | 'cave' | 'valley' | 'heritage' | 'ruins' | 'park' | 'other';
};

export type AddressSearchRecordInput = {
  id: string;
  kind?: AddressSearchRecordKind | string;
  sourceId?: string;
  sourcePriority?: number;
  countryCode?: string;
  languages?: string[];
  names?: AddressSearchLocalizedText[];
  aliases?: AddressSearchAlias[];
  oldNames?: AddressSearchAlias[];
  postalCodes?: string[];
  agids?: string[];
  adminHierarchy?: AddressSearchAdminName[];
  naturalFeatures?: AddressSearchNaturalFeature[];
  addressLines?: AddressSearchLocalizedText[];
  tags?: string[];
  lat?: number;
  lng?: number;
};

export type AddressSearchRecord = Required<Pick<AddressSearchRecordInput, 'id'>> & {
  kind: AddressSearchRecordKind;
  sourceId: string;
  sourcePriority: number;
  countryCode?: string;
  languages: string[];
  names: AddressSearchLocalizedText[];
  aliases: AddressSearchAlias[];
  oldNames: AddressSearchAlias[];
  postalCodes: string[];
  agids: string[];
  adminHierarchy: AddressSearchAdminName[];
  naturalFeatures: AddressSearchNaturalFeature[];
  addressLines: AddressSearchLocalizedText[];
  tags: string[];
  lat?: number;
  lng?: number;
};

export type AddressSearchSynonym =
  | {
    type?: 'regular';
    terms: string[];
  }
  | {
    type: 'one-way';
    input: string;
    synonyms: string[];
  };

export type AddressSearchPosting = {
  recordId: string;
  token: string;
  field: string;
  matchedText: string;
  language?: string;
  reasonCode: AddressSearchReasonCode;
  weight: number;
};

export type AddressSearchIndex = {
  version: typeof ADDRESS_SEARCH_FEDERATION_VERSION;
  records: AddressSearchRecord[];
  recordById: Map<string, AddressSearchRecord>;
  tokenIndex: Map<string, AddressSearchPosting[]>;
  postalIndex: Map<string, AddressSearchPosting[]>;
  agidIndex: Map<string, AddressSearchPosting[]>;
  synonymIndex: Map<string, string[]>;
  vocabulary: string[];
  stats: {
    records: number;
    tokens: number;
    postalCodes: number;
    agids: number;
    synonyms: number;
  };
};

export type AddressSearchOptions = {
  language?: string;
  countryCode?: string;
  limit?: number;
  typoTolerance?: boolean;
  prefixMatch?: boolean;
  explain?: boolean;
};

export type AddressSearchReason = {
  code: AddressSearchReasonCode;
  label: string;
  field: string;
  queryToken: string;
  matchedText: string;
  language?: string;
  weight: number;
};

export type AddressSearchResult = {
  record: AddressSearchRecord;
  score: number;
  confidence: number;
  reasons: AddressSearchReason[];
  matchedFields: string[];
  explanation: string[];
};

const DEFAULT_SOURCE_ID = 'local-address-search-federation';
const DEFAULT_LIMIT = 10;

const REASON_LABELS: Record<AddressSearchReasonCode, string> = {
  'agid-match': 'AGID matched',
  'postal-code-match': 'Postal code matched',
  'exact-name-match': 'Canonical name matched',
  'localized-name-match': 'Localized name matched',
  'administrative-match': 'Administrative area matched',
  'old-address-match': 'Old or historical address matched',
  'alias-match': 'Place alias matched',
  'natural-feature-match': 'Natural feature name matched',
  'synonym-match': 'Synonym matched',
  'prefix-match': 'Prefix matched',
  'typo-tolerant-match': 'Typo-tolerant match',
  'language-preferred': 'Preferred language boosted',
  'source-priority': 'Trusted source boosted',
};

const REASON_WEIGHTS: Record<AddressSearchReasonCode, number> = {
  'agid-match': 130,
  'postal-code-match': 122,
  'exact-name-match': 105,
  'localized-name-match': 92,
  'administrative-match': 82,
  'old-address-match': 74,
  'alias-match': 70,
  'natural-feature-match': 68,
  'synonym-match': 54,
  'prefix-match': 44,
  'typo-tolerant-match': 30,
  'language-preferred': 8,
  'source-priority': 6,
};

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCode(value: unknown) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

function normalizeLanguage(value: unknown) {
  const text = normalizeText(value).replace(/_/g, '-');
  return text || undefined;
}

function normalizeCountry(value: unknown) {
  const text = normalizeText(value).replace(/[^a-z]/g, '').toUpperCase();
  return text || undefined;
}

function normalizeKind(value: unknown): AddressSearchRecordKind {
  const text = normalizeText(value).replace(/_/g, '-');
  if ((ADDRESS_SEARCH_RECORD_KINDS as readonly string[]).includes(text)) {
    return text as AddressSearchRecordKind;
  }
  if (text === 'admin') return 'admin-area';
  if (text === 'postal') return 'postal-code';
  if (text === 'agid') return 'agid-cell';
  if (text === 'natural') return 'natural-feature';
  return 'address';
}

function hasCjk(text: string) {
  return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(text);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function tokenize(value: unknown) {
  const text = normalizeText(value);
  if (!text) return [];

  const tokens = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  const result = [...tokens];

  if (hasCjk(text)) {
    const compact = text.replace(/[^\p{L}\p{N}]/gu, '');
    if (compact.length > 1) result.push(compact);
    for (let i = 0; i < compact.length - 1; i += 1) {
      result.push(compact.slice(i, i + 2));
    }
  }

  return unique(result.filter(token => token.length > 0));
}

function isCodeLike(token: string) {
  return /^[a-z0-9-]{4,}$/.test(token) && /\d/.test(token);
}

function distanceWithin(left: string, right: string, maxDistance: number) {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;

  const previous = new Array(right.length + 1);
  const current = new Array(right.length + 1);
  for (let j = 0; j <= right.length; j += 1) previous[j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= right.length; j += 1) {
      const substitution = previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1);
      const insertion = current[j - 1] + 1;
      const deletion = previous[j] + 1;
      let value = Math.min(substitution, insertion, deletion);

      if (
        i > 1
        && j > 1
        && left[i - 1] === right[j - 2]
        && left[i - 2] === right[j - 1]
      ) {
        value = Math.min(value, previous[j - 2] + 1);
      }

      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }

  return previous[right.length];
}

function addPosting(index: Map<string, AddressSearchPosting[]>, token: string, posting: AddressSearchPosting) {
  if (!token) return;
  const list = index.get(token) ?? [];
  list.push(posting);
  index.set(token, list);
}

function makePosting(
  record: AddressSearchRecord,
  token: string,
  field: string,
  matchedText: string,
  reasonCode: AddressSearchReasonCode,
  language?: string
): AddressSearchPosting {
  return {
    recordId: record.id,
    token,
    field,
    matchedText,
    ...(language ? { language } : {}),
    reasonCode,
    weight: REASON_WEIGHTS[reasonCode],
  };
}

function normalizeLocalizedList(values: AddressSearchLocalizedText[] | undefined) {
  return (values ?? [])
    .map(item => ({
      text: String(item.text ?? '').normalize('NFKC').trim(),
      ...(normalizeLanguage(item.language) ? { language: normalizeLanguage(item.language) } : {}),
      ...(item.script ? { script: String(item.script).trim() } : {}),
      ...(item.preferred !== undefined ? { preferred: Boolean(item.preferred) } : {}),
    }))
    .filter(item => item.text.length > 0);
}

function normalizeAliasList(values: AddressSearchAlias[] | undefined) {
  return normalizeLocalizedList(values).map((item, index) => ({
    ...item,
    source: values?.[index]?.source,
  }));
}

function normalizeAdminList(values: AddressSearchAdminName[] | undefined) {
  return normalizeLocalizedList(values).map((item, index) => ({
    ...item,
    level: values?.[index]?.level,
  }));
}

function normalizeNaturalFeatureList(values: AddressSearchNaturalFeature[] | undefined) {
  return normalizeLocalizedList(values).map((item, index) => ({
    ...item,
    featureType: values?.[index]?.featureType,
  }));
}

function normalizeRecord(input: AddressSearchRecordInput): AddressSearchRecord {
  const names = normalizeLocalizedList(input.names);
  return {
    id: String(input.id).trim(),
    kind: normalizeKind(input.kind),
    sourceId: String(input.sourceId ?? DEFAULT_SOURCE_ID).trim() || DEFAULT_SOURCE_ID,
    sourcePriority: typeof input.sourcePriority === 'number' && Number.isFinite(input.sourcePriority)
      ? Math.max(0, Math.min(1, input.sourcePriority))
      : 0.5,
    ...(normalizeCountry(input.countryCode) ? { countryCode: normalizeCountry(input.countryCode) } : {}),
    languages: unique((input.languages ?? []).map(normalizeLanguage).filter((lang): lang is string => Boolean(lang))),
    names,
    aliases: normalizeAliasList(input.aliases),
    oldNames: normalizeAliasList(input.oldNames),
    postalCodes: unique((input.postalCodes ?? []).map(String).map(value => value.trim()).filter(Boolean)),
    agids: unique((input.agids ?? []).map(String).map(value => value.trim()).filter(Boolean)),
    adminHierarchy: normalizeAdminList(input.adminHierarchy),
    naturalFeatures: normalizeNaturalFeatureList(input.naturalFeatures),
    addressLines: normalizeLocalizedList(input.addressLines),
    tags: unique((input.tags ?? []).map(value => normalizeText(value)).filter(Boolean)),
    ...(typeof input.lat === 'number' && Number.isFinite(input.lat) ? { lat: input.lat } : {}),
    ...(typeof input.lng === 'number' && Number.isFinite(input.lng) ? { lng: input.lng } : {}),
  };
}

function indexTextField(
  tokenIndex: Map<string, AddressSearchPosting[]>,
  record: AddressSearchRecord,
  field: string,
  text: string,
  reasonCode: AddressSearchReasonCode,
  language?: string
) {
  for (const token of tokenize(text)) {
    addPosting(tokenIndex, token, makePosting(record, token, field, text, reasonCode, language));
  }
}

function buildSynonymIndex(synonyms: AddressSearchSynonym[] | undefined) {
  const synonymIndex = new Map<string, string[]>();

  function add(input: string, output: string) {
    const key = normalizeText(input);
    const value = normalizeText(output);
    if (!key || !value || key === value) return;
    synonymIndex.set(key, unique([...(synonymIndex.get(key) ?? []), value]));
  }

  for (const synonym of synonyms ?? []) {
    if (synonym.type === 'one-way') {
      for (const output of synonym.synonyms) add(synonym.input, output);
      continue;
    }

    const terms = unique(synonym.terms.map(normalizeText).filter(Boolean));
    for (const term of terms) {
      for (const other of terms) add(term, other);
    }
  }

  return synonymIndex;
}

export function buildAddressSearchIndex(
  recordsInput: AddressSearchRecordInput[],
  synonyms?: AddressSearchSynonym[]
): AddressSearchIndex {
  const records = recordsInput.map(normalizeRecord).filter(record => record.id.length > 0);
  const recordById = new Map(records.map(record => [record.id, record]));
  const tokenIndex = new Map<string, AddressSearchPosting[]>();
  const postalIndex = new Map<string, AddressSearchPosting[]>();
  const agidIndex = new Map<string, AddressSearchPosting[]>();
  const synonymIndex = buildSynonymIndex(synonyms);
  let postalCodes = 0;
  let agids = 0;

  for (const record of records) {
    for (const name of record.names) {
      indexTextField(
        tokenIndex,
        record,
        'names',
        name.text,
        name.preferred ? 'exact-name-match' : 'localized-name-match',
        name.language
      );
    }
    for (const alias of record.aliases) {
      indexTextField(tokenIndex, record, 'aliases', alias.text, 'alias-match', alias.language);
    }
    for (const oldName of record.oldNames) {
      indexTextField(tokenIndex, record, 'oldNames', oldName.text, 'old-address-match', oldName.language);
    }
    for (const admin of record.adminHierarchy) {
      indexTextField(tokenIndex, record, 'adminHierarchy', admin.text, 'administrative-match', admin.language);
    }
    for (const feature of record.naturalFeatures) {
      indexTextField(tokenIndex, record, 'naturalFeatures', feature.text, 'natural-feature-match', feature.language);
    }
    for (const line of record.addressLines) {
      indexTextField(tokenIndex, record, 'addressLines', line.text, 'localized-name-match', line.language);
    }
    for (const tag of record.tags) {
      indexTextField(tokenIndex, record, 'tags', tag, 'alias-match');
    }
    for (const postalCode of record.postalCodes) {
      const token = normalizeCode(postalCode);
      postalCodes += 1;
      addPosting(postalIndex, token, makePosting(record, token, 'postalCodes', postalCode, 'postal-code-match'));
      addPosting(tokenIndex, token, makePosting(record, token, 'postalCodes', postalCode, 'postal-code-match'));
    }
    for (const agid of record.agids) {
      const token = normalizeCode(agid);
      agids += 1;
      addPosting(agidIndex, token, makePosting(record, token, 'agids', agid, 'agid-match'));
      addPosting(tokenIndex, token, makePosting(record, token, 'agids', agid, 'agid-match'));
    }
  }

  const vocabulary = Array.from(tokenIndex.keys()).sort();
  return {
    version: ADDRESS_SEARCH_FEDERATION_VERSION,
    records,
    recordById,
    tokenIndex,
    postalIndex,
    agidIndex,
    synonymIndex,
    vocabulary,
    stats: {
      records: records.length,
      tokens: vocabulary.length,
      postalCodes,
      agids,
      synonyms: synonymIndex.size,
    },
  };
}

function addCandidate(
  candidates: Map<string, AddressSearchReason[]>,
  posting: AddressSearchPosting,
  queryToken: string,
  overrideReason?: AddressSearchReasonCode,
  weightMultiplier = 1
) {
  const code = overrideReason ?? posting.reasonCode;
  const list = candidates.get(posting.recordId) ?? [];
  const reason: AddressSearchReason = {
    code,
    label: REASON_LABELS[code],
    field: posting.field,
    queryToken,
    matchedText: posting.matchedText,
    ...(posting.language ? { language: posting.language } : {}),
    weight: Math.round((overrideReason ? REASON_WEIGHTS[overrideReason] : posting.weight) * weightMultiplier),
  };
  const key = `${reason.code}|${reason.field}|${reason.queryToken}|${reason.matchedText}|${reason.language ?? ''}`;
  if (!list.some(item => `${item.code}|${item.field}|${item.queryToken}|${item.matchedText}|${item.language ?? ''}` === key)) {
    list.push(reason);
  }
  candidates.set(posting.recordId, list);
}

function searchExactIndex(
  candidates: Map<string, AddressSearchReason[]>,
  index: Map<string, AddressSearchPosting[]>,
  token: string,
  queryToken: string
) {
  for (const posting of index.get(token) ?? []) {
    addCandidate(candidates, posting, queryToken);
  }
}

function findTypoTokens(index: AddressSearchIndex, token: string) {
  if (token.length < 4 || isCodeLike(token) || hasCjk(token)) return [];
  const maxDistance = token.length >= 6 ? 2 : 1;
  const matches: string[] = [];
  for (const candidate of index.vocabulary) {
    if (candidate === token || isCodeLike(candidate) || hasCjk(candidate)) continue;
    if (Math.abs(candidate.length - token.length) > maxDistance) continue;
    if (distanceWithin(token, candidate, maxDistance) <= maxDistance) {
      matches.push(candidate);
    }
  }
  return matches;
}

function findPrefixTokens(index: AddressSearchIndex, token: string) {
  if (token.length < 2 || isCodeLike(token)) return [];
  return index.vocabulary.filter(candidate => candidate !== token && candidate.startsWith(token));
}

function languageBoost(record: AddressSearchRecord, language: string | undefined) {
  if (!language) return 0;
  const normalized = normalizeLanguage(language);
  if (!normalized) return 0;
  if (record.languages.includes(normalized)) return REASON_WEIGHTS['language-preferred'];
  if (record.names.some(name => normalizeLanguage(name.language) === normalized && name.preferred)) {
    return REASON_WEIGHTS['language-preferred'];
  }
  return 0;
}

function explainReasons(reasons: AddressSearchReason[]) {
  return reasons
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map(reason => `${reason.label}: ${reason.matchedText}`);
}

export function searchAddressFederation(
  index: AddressSearchIndex,
  query: string,
  options: AddressSearchOptions = {}
): AddressSearchResult[] {
  const limit = typeof options.limit === 'number' && Number.isFinite(options.limit)
    ? Math.max(1, Math.floor(options.limit))
    : DEFAULT_LIMIT;
  const queryText = normalizeText(query);
  const queryCode = normalizeCode(query);
  const queryTokens = tokenize(queryText);
  const candidates = new Map<string, AddressSearchReason[]>();

  if (!queryText && !queryCode) return [];

  if (queryCode) {
    searchExactIndex(candidates, index.postalIndex, queryCode, query);
    searchExactIndex(candidates, index.agidIndex, queryCode, query);
  }

  for (const synonym of index.synonymIndex.get(queryText) ?? []) {
    for (const synonymToken of tokenize(synonym)) {
      for (const posting of index.tokenIndex.get(synonymToken) ?? []) {
        addCandidate(candidates, posting, queryText, 'synonym-match', 1);
      }
    }
  }

  for (const token of queryTokens) {
    searchExactIndex(candidates, index.tokenIndex, token, token);

    const tokenCode = normalizeCode(token);
    if (tokenCode) {
      searchExactIndex(candidates, index.postalIndex, tokenCode, token);
      searchExactIndex(candidates, index.agidIndex, tokenCode, token);
    }

    for (const synonym of index.synonymIndex.get(token) ?? []) {
      for (const synonymToken of tokenize(synonym)) {
        for (const posting of index.tokenIndex.get(synonymToken) ?? []) {
          addCandidate(candidates, posting, token, 'synonym-match', 1);
        }
      }
    }

    if (options.prefixMatch !== false) {
      for (const prefixToken of findPrefixTokens(index, token).slice(0, 50)) {
        for (const posting of index.tokenIndex.get(prefixToken) ?? []) {
          addCandidate(candidates, posting, token, 'prefix-match', 0.85);
        }
      }
    }

    if (options.typoTolerance !== false) {
      for (const typoToken of findTypoTokens(index, token).slice(0, 50)) {
        for (const posting of index.tokenIndex.get(typoToken) ?? []) {
          addCandidate(candidates, posting, token, 'typo-tolerant-match', 1);
        }
      }
    }
  }

  const results: AddressSearchResult[] = [];
  for (const [recordId, reasons] of candidates) {
    const record = index.recordById.get(recordId);
    if (!record) continue;
    if (options.countryCode && record.countryCode && record.countryCode !== normalizeCountry(options.countryCode)) continue;

    const reasonScore = reasons.reduce((sum, reason) => sum + reason.weight, 0);
    const sourceBoost = Math.round(record.sourcePriority * REASON_WEIGHTS['source-priority']);
    const langBoost = languageBoost(record, options.language);
    const exactPhraseBoost = record.names.some(name => normalizeText(name.text) === queryText) ? 12 : 0;
    const score = reasonScore + sourceBoost + langBoost + exactPhraseBoost;
    const boostedReasons = [...reasons];

    if (langBoost > 0) {
      boostedReasons.push({
        code: 'language-preferred',
        label: REASON_LABELS['language-preferred'],
        field: 'language',
        queryToken: normalizeLanguage(options.language) ?? '',
        matchedText: normalizeLanguage(options.language) ?? '',
        weight: langBoost,
      });
    }
    if (sourceBoost > 0) {
      boostedReasons.push({
        code: 'source-priority',
        label: REASON_LABELS['source-priority'],
        field: 'sourceId',
        queryToken: record.sourceId,
        matchedText: record.sourceId,
        weight: sourceBoost,
      });
    }

    results.push({
      record,
      score,
      confidence: Math.max(0.01, Math.min(0.99, score / 180)),
      reasons: boostedReasons.sort((a, b) => b.weight - a.weight),
      matchedFields: unique(boostedReasons.map(reason => reason.field)),
      explanation: options.explain === false ? [] : explainReasons(boostedReasons),
    });
  }

  return results
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
    .slice(0, limit);
}

export function explainAddressSearchResult(result: AddressSearchResult) {
  return {
    id: result.record.id,
    kind: result.record.kind,
    score: result.score,
    confidence: result.confidence,
    reasons: result.reasons.map(reason => ({
      code: reason.code,
      label: reason.label,
      field: reason.field,
      queryToken: reason.queryToken,
      matchedText: reason.matchedText,
    })),
  };
}
