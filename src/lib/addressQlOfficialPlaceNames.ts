import { createHash } from 'node:crypto';

export const ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION =
  'addressql-official-place-name-catalog-v1';
export const ADDRESSQL_PLACE_NAME_HOLDOUT_VERSION =
  'addressql-place-name-holdout-v1';
export const ADDRESSQL_PLACE_NAME_REPORT_VERSION =
  'addressql-place-name-holdout-report-v1';

export type AddressQlPlaceHierarchyLevel =
  | 'country'
  | 'admin1'
  | 'admin2'
  | 'admin3'
  | 'locality';

export type AddressQlPlaceNameKind =
  | 'official-native'
  | 'official-alias'
  | 'official-romanization'
  | 'standardized-transliteration'
  | 'generated-transliteration'
  | 'compatibility-search-alias';

export type AddressQlPlaceNameUsage =
  | 'domestic'
  | 'international'
  | 'both'
  | 'search-only';

export type AddressQlPlaceNameSource = {
  sourceId: string;
  authority: string;
  countryCodes: string[];
  sourceVersion: string;
  releaseUrl: string;
  termsUrl: string;
  correctionUrl: string;
  checkedAt: string;
  validUntil: string;
  reuseStatus:
    | 'approved-open-data'
    | 'official-reference-only'
    | 'synthetic-conformance';
  datasetDigest: string;
  attestationVerified: boolean;
  holdoutVerified: boolean;
};

export type AddressQlVersionedPlaceName = {
  value: string;
  languageTag: string;
  kind: AddressQlPlaceNameKind;
  usage: AddressQlPlaceNameUsage;
  sourceId: string;
};

export type AddressQlOfficialPlaceRecord = {
  placeId: string;
  countryCode: string;
  hierarchyLevel: AddressQlPlaceHierarchyLevel;
  parentPlaceIds: string[];
  names: AddressQlVersionedPlaceName[];
};

export type AddressQlOfficialPlaceNameCatalog = {
  version: typeof ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION;
  catalogId: string;
  catalogVersion: string;
  generatedAt: string;
  sources: AddressQlPlaceNameSource[];
  places: AddressQlOfficialPlaceRecord[];
};

export type AddressQlPlaceNameSourceState =
  | 'active'
  | 'review-required'
  | 'conformance-only'
  | 'expired'
  | 'invalid';

export type AddressQlPlaceNameCandidate = {
  placeId: string;
  countryCode: string;
  hierarchyLevel: AddressQlPlaceHierarchyLevel;
  parentPlaceIds: string[];
  displayName: string;
  displayLanguage: string;
  displayNameKind: AddressQlPlaceNameKind;
  matchedNameKinds: AddressQlPlaceNameKind[];
  sourceIds: string[];
  sourceVersions: string[];
  sourceState: AddressQlPlaceNameSourceState;
  score: number;
  reasonCodes: string[];
  officialAliasPreferred: boolean;
  generatedTransliterationUsed: boolean;
  translationUsed: false;
  automaticUseAllowed: false;
};

export type AddressQlPlaceNameRankingResult = {
  version: typeof ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION;
  catalogId: string;
  catalogVersion: string;
  catalogDigest: string;
  countryCode: string;
  targetLanguage: string;
  purpose: 'domestic' | 'international-shipping';
  status: 'ranked' | 'ambiguous' | 'unmatched' | 'rejected-evidence';
  candidates: AddressQlPlaceNameCandidate[];
  requiresReview: boolean;
  translationUsed: false;
  automaticUseAllowed: false;
  issues: string[];
  nonClaims: string[];
};

export type AddressQlPlaceNameCatalogReceipt = {
  version: typeof ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION;
  catalogId: string;
  catalogVersion: string;
  catalogDigest: string;
  sourceVersions: Array<{
    sourceId: string;
    sourceVersion: string;
    datasetDigest: string;
  }>;
  placeNameDigests: Array<{
    placeId: string;
    namesDigest: string;
  }>;
};

export type AddressQlPlaceNameCatalogChangeReport = {
  previousCatalogVersion: string;
  currentCatalogVersion: string;
  sourceVersionChanges: string[];
  addedPlaceIds: string[];
  removedPlaceIds: string[];
  changedPlaceNameIds: string[];
  requiresReview: boolean;
};

export type AddressQlPlaceNameHoldoutClass =
  | 'english-label'
  | 'same-script-different-reading'
  | 'official-alias-priority'
  | 'safe-deferral';

export type AddressQlPlaceNameHoldoutVector = {
  vectorId: string;
  countryCode: string;
  query: string;
  targetLanguage: string;
  purpose: 'domestic' | 'international-shipping';
  hierarchyLevel?: AddressQlPlaceHierarchyLevel;
  parentPlaceIds?: string[];
  caseClass: AddressQlPlaceNameHoldoutClass;
  expected:
    | {
      status: 'ranked';
      placeId: string;
      displayName: string;
      displayNameKind: AddressQlPlaceNameKind;
    }
    | { status: 'deferred' };
};

export type AddressQlPlaceNameHoldoutPack = {
  version: typeof ADDRESSQL_PLACE_NAME_HOLDOUT_VERSION;
  fixtureId: string;
  fixtureVersion: string;
  curatorId: string;
  evaluatorId: string;
  vectors: AddressQlPlaceNameHoldoutVector[];
};

export type AddressQlPlaceNameHoldoutSlice = {
  key: string;
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
};

export type AddressQlPlaceNameHoldoutReport = {
  version: typeof ADDRESSQL_PLACE_NAME_REPORT_VERSION;
  catalogId: string;
  catalogVersion: string;
  catalogDigest: string;
  fixtureId: string;
  fixtureVersion: string;
  holdoutDigest: string;
  total: number;
  correct: number;
  incorrect: number;
  top1Accuracy: number;
  expectedRanked: number;
  expectedDeferrals: number;
  safeDeferrals: number;
  safeDeferralRate: number;
  officialAliasPriorityCases: number;
  officialAliasPriorityPassed: number;
  sameScriptDifferentReadingCases: number;
  sameScriptDifferentReadingPassed: number;
  unsafeAutomaticSelections: 0;
  byCountry: AddressQlPlaceNameHoldoutSlice[];
  byHierarchy: AddressQlPlaceNameHoldoutSlice[];
  privacy: {
    containsVectorText: false;
    containsRawAddress: false;
    containsRecipientData: false;
    aggregateOnly: true;
  };
  nonClaims: string[];
};

const COUNTRY_CODE = /^[A-Z]{2}$/;
const TECHNICAL_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._:+/-]{0,127}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const ISO_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const PLACEHOLDER_VERSIONS = new Set([
  'current',
  'latest',
  'none',
  'unknown',
  'unversioned',
]);
const HIERARCHY_LEVELS: readonly AddressQlPlaceHierarchyLevel[] = [
  'country',
  'admin1',
  'admin2',
  'admin3',
  'locality',
];
const NAME_KINDS: readonly AddressQlPlaceNameKind[] = [
  'official-native',
  'official-alias',
  'official-romanization',
  'standardized-transliteration',
  'generated-transliteration',
  'compatibility-search-alias',
];
const NAME_USAGES: readonly AddressQlPlaceNameUsage[] = [
  'domestic',
  'international',
  'both',
  'search-only',
];
const REUSE_STATUSES: readonly AddressQlPlaceNameSource['reuseStatus'][] = [
  'approved-open-data',
  'official-reference-only',
  'synthetic-conformance',
];
const FORBIDDEN_KEY =
  /(?:raw_?address|recipient|latitude|longitude|coordinates?|geometry|private_?key|proof_?secret|credentials?|query_?logs?)/i;

const DISPLAY_KIND_SCORE: Record<AddressQlPlaceNameKind, number> = {
  'official-alias': 600,
  'official-romanization': 575,
  'official-native': 550,
  'standardized-transliteration': 350,
  'compatibility-search-alias': 200,
  'generated-transliteration': 100,
};

const MATCH_KIND_SCORE: Record<AddressQlPlaceNameKind, number> = {
  'official-native': 90,
  'official-alias': 85,
  'official-romanization': 80,
  'standardized-transliteration': 60,
  'compatibility-search-alias': 40,
  'generated-transliteration': 20,
};

const SOURCE_STATE_SCORE: Record<AddressQlPlaceNameSourceState, number> = {
  active: 200,
  'review-required': 100,
  'conformance-only': 50,
  expired: 0,
  invalid: 0,
};

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort();
}

function digest(value: unknown) {
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(value), 'utf8')
    .digest('hex')}`;
}

function normalizedName(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('und')
    .replace(/[\s\u00a0]+/g, '')
    .replace(/[.,'"()\-_/]/g, '');
}

function exactTime(value: string) {
  if (!ISO_TIME.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validLanguageTag(value: string) {
  if (
    !value
    || value.length > 35
    || !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(value)
  ) {
    return false;
  }
  try {
    return Boolean(Intl.getCanonicalLocales(value)[0]);
  } catch {
    return false;
  }
}

function languageBase(value: string) {
  return value.split('-', 1)[0].toLowerCase();
}

function containsForbiddenKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, nested]) => FORBIDDEN_KEY.test(key) || containsForbiddenKey(nested),
  );
}

function sourceIssues(
  source: AddressQlPlaceNameSource,
  now: number,
) {
  const issues: string[] = [];
  if (!TECHNICAL_ID.test(source.sourceId)) issues.push('source-id-invalid');
  if (
    typeof source.authority !== 'string'
    || !source.authority.trim()
    || source.authority.length > 240
  ) {
    issues.push('authority-invalid');
  }
  if (
    !Array.isArray(source.countryCodes)
    || !source.countryCodes.length
    || uniqueSorted(source.countryCodes).length !== source.countryCodes.length
    || source.countryCodes.some(code => !COUNTRY_CODE.test(code))
  ) {
    issues.push('source-country-scope-invalid');
  }
  const sourceVersion = typeof source.sourceVersion === 'string'
    ? source.sourceVersion
    : '';
  if (
    !VERSION.test(sourceVersion)
    || PLACEHOLDER_VERSIONS.has(sourceVersion.toLowerCase())
  ) {
    issues.push('source-version-invalid');
  }
  if (!REUSE_STATUSES.includes(source.reuseStatus)) {
    issues.push('reuse-status-invalid');
  }
  if (
    typeof source.attestationVerified !== 'boolean'
    || typeof source.holdoutVerified !== 'boolean'
  ) {
    issues.push('evidence-state-invalid');
  }
  if (!isHttpsUrl(source.releaseUrl)) issues.push('release-url-invalid');
  if (!isHttpsUrl(source.termsUrl)) issues.push('terms-url-invalid');
  if (!isHttpsUrl(source.correctionUrl)) issues.push('correction-url-invalid');
  if (!DIGEST.test(source.datasetDigest)) issues.push('dataset-digest-invalid');
  const checkedAt = exactTime(source.checkedAt);
  const validUntil = exactTime(source.validUntil);
  if (
    checkedAt === null
    || validUntil === null
    || validUntil <= checkedAt
    || checkedAt > now + 5 * 60_000
  ) {
    issues.push('source-time-window-invalid');
  }
  return uniqueSorted(issues);
}

export function addressQlPlaceNameSourceState(
  source: AddressQlPlaceNameSource,
  now: string | number | Date = Date.now(),
): AddressQlPlaceNameSourceState {
  const timestamp = new Date(now).getTime();
  if (!Number.isFinite(timestamp) || sourceIssues(source, timestamp).length) {
    return 'invalid';
  }
  if (Date.parse(source.validUntil) <= timestamp) return 'expired';
  if (source.reuseStatus === 'synthetic-conformance') {
    return 'conformance-only';
  }
  if (
    source.reuseStatus === 'official-reference-only'
    || !source.attestationVerified
    || !source.holdoutVerified
  ) {
    return 'review-required';
  }
  return 'active';
}

export function validateAddressQlOfficialPlaceNameCatalog(
  catalog: AddressQlOfficialPlaceNameCatalog,
  now: string | number | Date = Date.now(),
) {
  const errors: string[] = [];
  const timestamp = new Date(now).getTime();
  if (containsForbiddenKey(catalog)) errors.push('forbidden-sensitive-field');
  if (catalog.version !== ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION) {
    errors.push('catalog-contract-version');
  }
  if (!TECHNICAL_ID.test(catalog.catalogId)) errors.push('catalog-id');
  if (
    !VERSION.test(catalog.catalogVersion)
    || PLACEHOLDER_VERSIONS.has(catalog.catalogVersion.toLowerCase())
  ) {
    errors.push('catalog-version');
  }
  const generatedAt = exactTime(catalog.generatedAt);
  if (
    generatedAt === null
    || generatedAt > timestamp + 5 * 60_000
  ) {
    errors.push('catalog-generated-at');
  }
  if (!Number.isFinite(timestamp)) errors.push('catalog-validation-time');
  if (!catalog.sources.length) errors.push('catalog-sources-empty');
  if (!catalog.places.length) errors.push('catalog-places-empty');

  const sourceIds = new Set<string>();
  for (const source of catalog.sources) {
    if (sourceIds.has(source.sourceId)) {
      errors.push(`source:${source.sourceId}:duplicate`);
    }
    sourceIds.add(source.sourceId);
    for (const issue of sourceIssues(source, timestamp)) {
      errors.push(`source:${source.sourceId}:${issue}`);
    }
  }

  const placeIds = new Set<string>();
  for (const place of catalog.places) {
    if (!TECHNICAL_ID.test(place.placeId)) {
      errors.push(`place:${place.placeId}:id`);
    }
    if (placeIds.has(place.placeId)) {
      errors.push(`place:${place.placeId}:duplicate`);
    }
    placeIds.add(place.placeId);
    if (!COUNTRY_CODE.test(place.countryCode)) {
      errors.push(`place:${place.placeId}:country`);
    }
    if (!HIERARCHY_LEVELS.includes(place.hierarchyLevel)) {
      errors.push(`place:${place.placeId}:hierarchy`);
    }
    if (
      place.parentPlaceIds.length > 8
      || uniqueSorted(place.parentPlaceIds).length
        !== place.parentPlaceIds.length
      || place.parentPlaceIds.some(id => !TECHNICAL_ID.test(id))
    ) {
      errors.push(`place:${place.placeId}:parents`);
    }
    if (!place.names.length || place.names.length > 50) {
      errors.push(`place:${place.placeId}:names-count`);
    }
    if (!place.names.some(name => name.kind === 'official-native')) {
      errors.push(`place:${place.placeId}:official-native-missing`);
    }
    for (const name of place.names) {
      if (
        !name.value.trim()
        || name.value.length > 160
        || !validLanguageTag(name.languageTag)
        || !NAME_KINDS.includes(name.kind)
        || !NAME_USAGES.includes(name.usage)
        || !sourceIds.has(name.sourceId)
      ) {
        errors.push(`place:${place.placeId}:name-invalid`);
      }
      if (
        name.kind === 'compatibility-search-alias'
        && name.usage !== 'search-only'
      ) {
        errors.push(`place:${place.placeId}:compatibility-alias-not-search-only`);
      }
      const source = catalog.sources.find(item => item.sourceId === name.sourceId);
      if (source && !source.countryCodes.includes(place.countryCode)) {
        errors.push(`place:${place.placeId}:source-country-mismatch`);
      }
    }
  }
  return uniqueSorted(errors);
}

export function buildAddressQlPlaceNameCatalogReceipt(
  catalog: AddressQlOfficialPlaceNameCatalog,
): AddressQlPlaceNameCatalogReceipt {
  return {
    version: ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION,
    catalogId: catalog.catalogId,
    catalogVersion: catalog.catalogVersion,
    catalogDigest: digest(catalog),
    sourceVersions: catalog.sources
      .map(source => ({
        sourceId: source.sourceId,
        sourceVersion: source.sourceVersion,
        datasetDigest: source.datasetDigest,
      }))
      .sort((left, right) => left.sourceId.localeCompare(right.sourceId)),
    placeNameDigests: catalog.places
      .map(place => ({
        placeId: place.placeId,
        namesDigest: digest(place.names),
      }))
      .sort((left, right) => left.placeId.localeCompare(right.placeId)),
  };
}

export function compareAddressQlPlaceNameCatalogReceipts(
  previous: AddressQlPlaceNameCatalogReceipt,
  current: AddressQlPlaceNameCatalogReceipt,
): AddressQlPlaceNameCatalogChangeReport {
  if (
    previous.version !== ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION
    || current.version !== ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION
    || previous.catalogId !== current.catalogId
  ) {
    throw new Error('place-name catalog receipts are incompatible');
  }
  const previousSources = new Map(
    previous.sourceVersions.map(source => [source.sourceId, source]),
  );
  const currentSources = new Map(
    current.sourceVersions.map(source => [source.sourceId, source]),
  );
  const previousPlaces = new Map(
    previous.placeNameDigests.map(place => [place.placeId, place.namesDigest]),
  );
  const currentPlaces = new Map(
    current.placeNameDigests.map(place => [place.placeId, place.namesDigest]),
  );
  const sourceVersionChanges = uniqueSorted([
    ...previousSources.keys(),
    ...currentSources.keys(),
  ]).filter(sourceId => {
    const left = previousSources.get(sourceId);
    const right = currentSources.get(sourceId);
    return !left
      || !right
      || left.sourceVersion !== right.sourceVersion
      || left.datasetDigest !== right.datasetDigest;
  });
  const addedPlaceIds = [...currentPlaces.keys()]
    .filter(placeId => !previousPlaces.has(placeId))
    .sort();
  const removedPlaceIds = [...previousPlaces.keys()]
    .filter(placeId => !currentPlaces.has(placeId))
    .sort();
  const changedPlaceNameIds = [...currentPlaces.keys()]
    .filter(placeId =>
      previousPlaces.has(placeId)
      && previousPlaces.get(placeId) !== currentPlaces.get(placeId))
    .sort();
  return {
    previousCatalogVersion: previous.catalogVersion,
    currentCatalogVersion: current.catalogVersion,
    sourceVersionChanges,
    addedPlaceIds,
    removedPlaceIds,
    changedPlaceNameIds,
    requiresReview: Boolean(
      sourceVersionChanges.length
      || addedPlaceIds.length
      || removedPlaceIds.length
      || changedPlaceNameIds.length,
    ),
  };
}

function chooseDisplayName(
  place: AddressQlOfficialPlaceRecord,
  targetLanguage: string,
  purpose: 'domestic' | 'international-shipping',
  sourceStates: ReadonlyMap<string, AddressQlPlaceNameSourceState>,
) {
  const targetBase = languageBase(targetLanguage);
  const names = place.names
    .filter(name => {
      const sourceState = sourceStates.get(name.sourceId);
      if (sourceState === 'expired' || sourceState === 'invalid') return false;
      if (name.usage === 'search-only') return false;
      if (languageBase(name.languageTag) !== targetBase) return false;
      return name.usage === 'both'
        || (purpose === 'domestic' && name.usage === 'domestic')
        || (
          purpose === 'international-shipping'
          && name.usage === 'international'
        );
    })
    .sort((left, right) =>
      DISPLAY_KIND_SCORE[right.kind] - DISPLAY_KIND_SCORE[left.kind]
      || left.value.localeCompare(right.value));
  if (names.length) return names[0];

  return place.names
    .filter(name => {
      const sourceState = sourceStates.get(name.sourceId);
      return name.kind === 'official-native'
        && name.usage !== 'search-only'
        && sourceState !== 'expired'
        && sourceState !== 'invalid';
    })
    .sort((left, right) => left.value.localeCompare(right.value))[0] ?? null;
}

function weakestSourceState(states: readonly AddressQlPlaceNameSourceState[]) {
  const order: AddressQlPlaceNameSourceState[] = [
    'invalid',
    'expired',
    'conformance-only',
    'review-required',
    'active',
  ];
  return order.find(state => states.includes(state)) ?? 'invalid';
}

export function rankAddressQlOfficialPlaceNameCandidates(input: {
  catalog: AddressQlOfficialPlaceNameCatalog;
  countryCode: string;
  query: string;
  targetLanguage: string;
  purpose: 'domestic' | 'international-shipping';
  hierarchyLevel?: AddressQlPlaceHierarchyLevel;
  parentPlaceIds?: readonly string[];
  maxCandidates?: number;
  now?: string | number | Date;
}): AddressQlPlaceNameRankingResult {
  const now = input.now ?? Date.now();
  const catalogErrors = validateAddressQlOfficialPlaceNameCatalog(
    input.catalog,
    now,
  );
  const catalogReceipt = buildAddressQlPlaceNameCatalogReceipt(input.catalog);
  const countryCode = input.countryCode.toUpperCase();
  const query = normalizedName(input.query);
  const parentPlaceIds = uniqueSorted(input.parentPlaceIds ?? []);
  const maxCandidates = input.maxCandidates ?? 5;
  const inputIssues: string[] = [];
  if (!COUNTRY_CODE.test(countryCode)) inputIssues.push('country-code-invalid');
  if (!query || input.query.length > 160) inputIssues.push('query-invalid');
  if (!validLanguageTag(input.targetLanguage)) {
    inputIssues.push('target-language-invalid');
  }
  if (
    input.hierarchyLevel
    && !HIERARCHY_LEVELS.includes(input.hierarchyLevel)
  ) {
    inputIssues.push('hierarchy-level-invalid');
  }
  if (
    !Number.isInteger(maxCandidates)
    || maxCandidates < 1
    || maxCandidates > 20
  ) {
    inputIssues.push('max-candidates-invalid');
  }
  if (
    parentPlaceIds.length > 8
    || parentPlaceIds.some(id => !TECHNICAL_ID.test(id))
  ) {
    inputIssues.push('parent-context-invalid');
  }
  const issues = uniqueSorted([...catalogErrors, ...inputIssues]);
  const common = {
    version: ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION as
      typeof ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION,
    catalogId: input.catalog.catalogId,
    catalogVersion: input.catalog.catalogVersion,
    catalogDigest: catalogReceipt.catalogDigest,
    countryCode,
    targetLanguage: input.targetLanguage,
    purpose: input.purpose,
    translationUsed: false as const,
    automaticUseAllowed: false as const,
    nonClaims: [
      'Candidate ranking does not validate a full address or prove delivery.',
      'Official aliases outrank generated transliteration; no machine translation is performed.',
      'Ambiguous same-script names require administrative hierarchy context.',
    ],
  };
  if (issues.length) {
    return {
      ...common,
      status: 'rejected-evidence',
      candidates: [],
      requiresReview: true,
      issues,
    };
  }

  const sourceMap = new Map(
    input.catalog.sources.map(source => [source.sourceId, source]),
  );
  const sourceStates = new Map(
    input.catalog.sources.map(source => [
      source.sourceId,
      addressQlPlaceNameSourceState(source, now),
    ]),
  );
  const candidates = input.catalog.places
    .filter(place => place.countryCode === countryCode)
    .filter(place =>
      !input.hierarchyLevel || place.hierarchyLevel === input.hierarchyLevel)
    .filter(place =>
      parentPlaceIds.every(parentId => place.parentPlaceIds.includes(parentId)))
    .flatMap(place => {
      const matchingNames = place.names.filter(name => {
        const state = sourceStates.get(name.sourceId);
        return normalizedName(name.value) === query
          && state !== 'expired'
          && state !== 'invalid';
      });
      if (!matchingNames.length) return [];
      const displayName = chooseDisplayName(
        place,
        input.targetLanguage,
        input.purpose,
        sourceStates,
      );
      if (!displayName) return [];
      const participatingNames = [...matchingNames, displayName];
      const sourceIds = uniqueSorted(
        participatingNames.map(name => name.sourceId),
      );
      const states = sourceIds.map(sourceId => sourceStates.get(sourceId)!);
      const sourceState = weakestSourceState(states);
      const sourceVersions = uniqueSorted(
        sourceIds.map(sourceId => sourceMap.get(sourceId)!.sourceVersion),
      );
      const officialAliasPreferred = [
        'official-alias',
        'official-romanization',
        'official-native',
      ].includes(displayName.kind);
      const generatedTransliterationUsed =
        displayName.kind === 'generated-transliteration';
      const reasonCodes = uniqueSorted([
        `display:${displayName.kind}`,
        `source:${sourceState}`,
        ...(input.hierarchyLevel ? ['hierarchy:matched'] : []),
        ...(parentPlaceIds.length ? ['parents:matched'] : []),
        ...(officialAliasPreferred
          ? ['official-name-preferred']
          : ['official-name-unavailable']),
      ]);
      const score = DISPLAY_KIND_SCORE[displayName.kind]
        + Math.max(...matchingNames.map(name => MATCH_KIND_SCORE[name.kind]))
        + SOURCE_STATE_SCORE[sourceState]
        + (input.hierarchyLevel ? 100 : 0)
        + parentPlaceIds.length * 50;
      return [{
        placeId: place.placeId,
        countryCode: place.countryCode,
        hierarchyLevel: place.hierarchyLevel,
        parentPlaceIds: [...place.parentPlaceIds],
        displayName: displayName.value,
        displayLanguage: displayName.languageTag,
        displayNameKind: displayName.kind,
        matchedNameKinds: uniqueSorted(
          matchingNames.map(name => name.kind),
        ) as AddressQlPlaceNameKind[],
        sourceIds,
        sourceVersions,
        sourceState,
        score,
        reasonCodes,
        officialAliasPreferred,
        generatedTransliterationUsed,
        translationUsed: false as const,
        automaticUseAllowed: false as const,
      }];
    })
    .sort((left, right) =>
      right.score - left.score
      || left.placeId.localeCompare(right.placeId))
    .slice(0, maxCandidates);

  if (!candidates.length) {
    return {
      ...common,
      status: 'unmatched',
      candidates: [],
      requiresReview: true,
      issues: [],
    };
  }
  const contextProvided = Boolean(input.hierarchyLevel || parentPlaceIds.length);
  const ambiguous = (
    candidates.length > 1
    && (
      !contextProvided
      || candidates[0].score === candidates[1].score
    )
  );
  return {
    ...common,
    status: ambiguous ? 'ambiguous' : 'ranked',
    candidates,
    requiresReview: ambiguous
      || candidates[0].sourceState !== 'active'
      || candidates[0].generatedTransliterationUsed,
    issues: ambiguous ? ['administrative-context-required'] : [],
  };
}

function buildSlices(
  cases: ReadonlyArray<{ key: string; correct: boolean }>,
): AddressQlPlaceNameHoldoutSlice[] {
  const counts = new Map<string, { total: number; correct: number }>();
  for (const item of cases) {
    const count = counts.get(item.key) ?? { total: 0, correct: 0 };
    count.total += 1;
    if (item.correct) count.correct += 1;
    counts.set(item.key, count);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => ({
      key,
      total: count.total,
      correct: count.correct,
      incorrect: count.total - count.correct,
      accuracy: count.total ? count.correct / count.total : 1,
    }));
}

export function evaluateAddressQlPlaceNameHoldout(input: {
  catalog: AddressQlOfficialPlaceNameCatalog;
  pack: AddressQlPlaceNameHoldoutPack;
  now?: string | number | Date;
}): AddressQlPlaceNameHoldoutReport {
  if (
    input.pack.version !== ADDRESSQL_PLACE_NAME_HOLDOUT_VERSION
    || !TECHNICAL_ID.test(input.pack.fixtureId)
    || !VERSION.test(input.pack.fixtureVersion)
    || !TECHNICAL_ID.test(input.pack.curatorId)
    || !TECHNICAL_ID.test(input.pack.evaluatorId)
    || input.pack.curatorId === input.pack.evaluatorId
  ) {
    throw new Error('place-name holdout pack metadata is invalid');
  }
  if (
    !input.pack.vectors.length
    || input.pack.vectors.length > 100_000
    || containsForbiddenKey(input.pack.vectors)
  ) {
    throw new Error('place-name holdout vectors are invalid');
  }
  const vectorIds = new Set<string>();
  const fingerprints = new Set<string>();
  const countryCases: Array<{ key: string; correct: boolean }> = [];
  const hierarchyCases: Array<{ key: string; correct: boolean }> = [];
  let correct = 0;
  let expectedRanked = 0;
  let rankedCorrect = 0;
  let expectedDeferrals = 0;
  let safeDeferrals = 0;
  let officialAliasPriorityCases = 0;
  let officialAliasPriorityPassed = 0;
  let sameScriptDifferentReadingCases = 0;
  let sameScriptDifferentReadingPassed = 0;

  for (const vector of input.pack.vectors) {
    if (!TECHNICAL_ID.test(vector.vectorId) || vectorIds.has(vector.vectorId)) {
      throw new Error('place-name holdout vector IDs must be unique');
    }
    vectorIds.add(vector.vectorId);
    const fingerprint = digest({
      countryCode: vector.countryCode,
      query: normalizedName(vector.query),
      targetLanguage: vector.targetLanguage,
      purpose: vector.purpose,
      hierarchyLevel: vector.hierarchyLevel ?? null,
      parentPlaceIds: uniqueSorted(vector.parentPlaceIds ?? []),
    });
    if (fingerprints.has(fingerprint)) {
      throw new Error('place-name holdout cases must be unique');
    }
    fingerprints.add(fingerprint);
    const result = rankAddressQlOfficialPlaceNameCandidates({
      catalog: input.catalog,
      countryCode: vector.countryCode,
      query: vector.query,
      targetLanguage: vector.targetLanguage,
      purpose: vector.purpose,
      hierarchyLevel: vector.hierarchyLevel,
      parentPlaceIds: vector.parentPlaceIds,
      now: input.now,
    });
    if (result.status === 'rejected-evidence') {
      throw new Error(`place-name holdout rejected: ${result.issues.join(',')}`);
    }
    let caseCorrect = false;
    if (vector.expected.status === 'ranked') {
      expectedRanked += 1;
      const top = result.status === 'ranked' ? result.candidates[0] : null;
      caseCorrect = Boolean(
        top
        && top.placeId === vector.expected.placeId
        && top.displayName === vector.expected.displayName
        && top.displayNameKind === vector.expected.displayNameKind,
      );
      if (caseCorrect) rankedCorrect += 1;
    } else {
      expectedDeferrals += 1;
      caseCorrect = result.status !== 'ranked';
      if (caseCorrect) safeDeferrals += 1;
    }
    if (caseCorrect) correct += 1;
    if (vector.caseClass === 'official-alias-priority') {
      officialAliasPriorityCases += 1;
      if (
        caseCorrect
        && result.candidates[0]?.officialAliasPreferred
        && !result.candidates[0]?.generatedTransliterationUsed
      ) {
        officialAliasPriorityPassed += 1;
      }
    }
    if (vector.caseClass === 'same-script-different-reading') {
      sameScriptDifferentReadingCases += 1;
      if (caseCorrect) sameScriptDifferentReadingPassed += 1;
    }
    countryCases.push({ key: vector.countryCode, correct: caseCorrect });
    hierarchyCases.push({
      key: vector.hierarchyLevel ?? 'unspecified',
      correct: caseCorrect,
    });
  }

  const receipt = buildAddressQlPlaceNameCatalogReceipt(input.catalog);
  return {
    version: ADDRESSQL_PLACE_NAME_REPORT_VERSION,
    catalogId: input.catalog.catalogId,
    catalogVersion: input.catalog.catalogVersion,
    catalogDigest: receipt.catalogDigest,
    fixtureId: input.pack.fixtureId,
    fixtureVersion: input.pack.fixtureVersion,
    holdoutDigest: digest(input.pack.vectors),
    total: input.pack.vectors.length,
    correct,
    incorrect: input.pack.vectors.length - correct,
    top1Accuracy: expectedRanked ? rankedCorrect / expectedRanked : 1,
    expectedRanked,
    expectedDeferrals,
    safeDeferrals,
    safeDeferralRate: expectedDeferrals
      ? safeDeferrals / expectedDeferrals
      : 1,
    officialAliasPriorityCases,
    officialAliasPriorityPassed,
    sameScriptDifferentReadingCases,
    sameScriptDifferentReadingPassed,
    unsafeAutomaticSelections: 0,
    byCountry: buildSlices(countryCases),
    byHierarchy: buildSlices(hierarchyCases),
    privacy: {
      containsVectorText: false,
      containsRawAddress: false,
      containsRecipientData: false,
      aggregateOnly: true,
    },
    nonClaims: [
      'Synthetic holdout metrics do not prove a real address or delivery point.',
      'The aggregate report excludes place-name queries and per-vector outcomes.',
      'A conformance catalog must not be represented as an approved live source.',
    ],
  };
}
