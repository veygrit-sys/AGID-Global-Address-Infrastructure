import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const SOURCE_COMPLETENESS_GATE_VERSION = 'source-completeness-gate-v0.1';

export type SourceCompletenessDimensionId =
  | 'official-gazetteer'
  | 'osm'
  | 'geonames'
  | 'wikidata'
  | 'administrative-divisions'
  | 'islands'
  | 'poi'
  | 'natural-features'
  | 'historical-aliases';

export type SourceCompletenessStatus = 'passing' | 'partial' | 'blocked' | 'not-in-scope';

export type SourceEvidenceKind =
  | 'official'
  | 'official-gazetteer'
  | 'osm'
  | 'geonames'
  | 'wikidata'
  | 'admin-boundary'
  | 'open-reference'
  | 'manual-review';

export type SourceCompletenessDimension = {
  id: SourceCompletenessDimensionId;
  labelJa: string;
  labelEn: string;
  requiredForGlobalClaim: boolean;
  acceptedEvidenceKinds: SourceEvidenceKind[];
  minimumRule: string;
  nonClaim: string;
};

export type SourceCompletenessGateInput = {
  repository: string;
  relativePath?: string;
  releaseGates: string[];
  sources: Array<{
    id?: string;
    name?: string;
    url?: string;
    role?: string;
    notes?: string[];
  }>;
  placeRecords: Array<{
    agidPlaceId?: string;
    name?: string;
    featureClass?: string;
    localNames?: Record<string, string>;
    geodataLinks?: Record<string, string>;
    notes?: string[];
  }>;
};

export type SourceCompletenessDimensionResult = {
  dimension: SourceCompletenessDimensionId;
  status: SourceCompletenessStatus;
  evidenceKinds: SourceEvidenceKind[];
  observedRecords: number;
  expectedRecords: number | null;
  reasons: string[];
  nextGate: string;
};

export type SourceCompletenessGateReport = {
  version: typeof SOURCE_COMPLETENESS_GATE_VERSION;
  repository: string;
  relativePath?: string;
  generatedAt: string;
  globalAllPlaceNamesAllowed: boolean;
  completeSliceAllowed: boolean;
  results: SourceCompletenessDimensionResult[];
  summary: Record<SourceCompletenessStatus, number>;
  missingForGlobalClaim: SourceCompletenessDimensionId[];
  nonClaims: string[];
};

export type ScopedLayerClaimCheck = {
  dimension: SourceCompletenessDimensionId;
  passingRepositories: number;
  blockedGlobalClaimRepositories: number;
  globalClaimAllowedRepositories: number;
  scopeLeakRepositories: string[];
  sampleScopedRepositories: string[];
  sampleGlobalClaimAllowedRepositories: string[];
  assertion: 'layer-passing-remains-scoped-unless-all-required-layers-pass' | 'layer-passing-global-claim-leak-detected';
};

export const SOURCE_COMPLETENESS_DIMENSIONS: SourceCompletenessDimension[] = [
  {
    id: 'official-gazetteer',
    labelJa: '公式gazetteer',
    labelEn: 'Official gazetteer',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['official-gazetteer', 'official'],
    minimumRule: 'A national, territorial, municipal, postal, statistics, or other official place-name source is linked and versioned.',
    nonClaim: 'An official source link does not prove every place name, alias, or feature has been imported.',
  },
  {
    id: 'osm',
    labelJa: 'OSM',
    labelEn: 'OpenStreetMap',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['osm'],
    minimumRule: 'OSM is listed as a cross-reference source or place records carry OSM links.',
    nonClaim: 'OSM cross-reference is not an unrestricted data import and does not remove ODbL attribution/share-alike review.',
  },
  {
    id: 'geonames',
    labelJa: 'GeoNames',
    labelEn: 'GeoNames',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['geonames'],
    minimumRule: 'GeoNames is listed as a cross-reference source or place records carry GeoNames links.',
    nonClaim: 'GeoNames corroborates public place names, but it is not by itself a legal boundary or delivery authority.',
  },
  {
    id: 'wikidata',
    labelJa: 'Wikidata',
    labelEn: 'Wikidata',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['wikidata'],
    minimumRule: 'Wikidata is listed as an identity/alias source or place records carry Wikidata links.',
    nonClaim: 'Wikidata identity links do not prove current official status, address validity, or delivery availability.',
  },
  {
    id: 'administrative-divisions',
    labelJa: '行政区画',
    labelEn: 'Administrative divisions',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['official-gazetteer', 'official', 'admin-boundary', 'geonames', 'osm'],
    minimumRule: 'Administrative records are present and backed by official or independent public cross-reference evidence.',
    nonClaim: 'Administrative division coverage does not imply street, building, cadastral, or private address coverage.',
  },
  {
    id: 'islands',
    labelJa: '島',
    labelEn: 'Islands',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['official-gazetteer', 'official', 'geonames', 'osm', 'wikidata'],
    minimumRule: 'Island records are present, source-linked, and protected by all-island or no-all-island overclaim gates.',
    nonClaim: 'Island anchors do not prove boundaries, landing rights, route access, habitation, or delivery reachability.',
  },
  {
    id: 'poi',
    labelJa: 'POI',
    labelEn: 'Points of interest',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['official', 'osm', 'wikidata', 'open-reference'],
    minimumRule: 'POI records such as stations, ports, schools, hospitals, hotels, lockers, stores, or delivery depots are declared as a separate scope.',
    nonClaim: 'POI coverage is volatile and does not prove endorsement, opening hours, access rights, or carrier support.',
  },
  {
    id: 'natural-features',
    labelJa: '自然地名',
    labelEn: 'Natural feature names',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['official', 'geonames', 'osm', 'wikidata', 'open-reference'],
    minimumRule: 'Natural features such as rivers, lakes, mountains, deserts, wetlands, glaciers, caves, valleys, reefs, and waterfalls are declared as a separate scope.',
    nonClaim: 'Natural feature coverage does not prove safe access, legal access, current environmental condition, or precise geometry.',
  },
  {
    id: 'historical-aliases',
    labelJa: '旧地名・別名',
    labelEn: 'Historical names and aliases',
    requiredForGlobalClaim: true,
    acceptedEvidenceKinds: ['official', 'wikidata', 'geonames', 'open-reference'],
    minimumRule: 'Aliases, historical names, former names, local-language names, and alternate spellings are represented as source-bound evidence.',
    nonClaim: 'Alias matching does not prove current official status or that an obsolete name is safe for delivery.',
  },
];

const ADMIN_CLASSES = new Set([
  'country',
  'region',
  'province',
  'state',
  'district',
  'canton',
  'chiefdom',
  'municipality',
  'special-region',
]);

const POI_PATTERN = /\b(station|port|airport|hotel|school|hospital|clinic|store|shop|market|locker|pudo|depot|warehouse|post office|office|terminal|marina)\b/i;
const NATURAL_PATTERN = /\b(river|lake|mountain|desert|wetland|glacier|cave|valley|reef|shoal|waterfall|forest|grassland|lagoon|atoll|volcano|cape|bay)\b/i;
const ISLAND_PATTERN = /\b(island|islands|islet|islets|archipelago|atoll|reef|cay|shoal|skerry|motu)\b/i;
const ALIAS_PATTERN = /\b(alias|alternate|alternative|former|historic|historical|old name|also known|aka|exonym|endonym)\b/i;
const SCOPED_LAYER_CLAIM_DIMENSIONS = ['poi', 'natural-features'] as const satisfies readonly SourceCompletenessDimensionId[];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function textOf(value: unknown) {
  return JSON.stringify(value ?? '').toLowerCase();
}

function sourceText(sources: SourceCompletenessGateInput['sources']) {
  return textOf(sources);
}

function sourceDescriptorText(sources: SourceCompletenessGateInput['sources']) {
  return textOf(sources.map(source => ({
    id: source.id,
    name: source.name,
    url: source.url,
    role: source.role,
  })));
}

function recordText(record: SourceCompletenessGateInput['placeRecords'][number]) {
  return textOf(record);
}

export function classifySourceEvidenceKinds(
  sources: SourceCompletenessGateInput['sources'],
  placeRecords: SourceCompletenessGateInput['placeRecords'] = [],
): SourceEvidenceKind[] {
  const text = sourceText(sources);
  const descriptorText = sourceDescriptorText(sources);
  const kinds: SourceEvidenceKind[] = [];
  if (/\b(openstreetmap|osm)\b/i.test(text) || placeRecords.some(record => Boolean(record.geodataLinks?.osm))) kinds.push('osm');
  if (/\bgeonames\b/i.test(text) || placeRecords.some(record => Boolean(record.geodataLinks?.geonames))) kinds.push('geonames');
  if (/\bwikidata\b/i.test(text) || placeRecords.some(record => Boolean(record.geodataLinks?.wikidata))) kinds.push('wikidata');
  if (/\b(admin-boundary|boundary|geoBoundaries|administrative)\b/i.test(text)) kinds.push('admin-boundary');
  if (
    /\b(government|official|ministry|municipal|municipality|statistics|national|parliament|prefecture|gov\.|gouv|nso|postal authority)\b/i.test(descriptorText)
    || placeRecords.some(record => Boolean(record.geodataLinks?.official))
  ) kinds.push('official');
  if (/\b(gazetteer|place-name|toponym|municipalit|district listing|commune|administrative division listing)\b/i.test(descriptorText) && kinds.includes('official')) {
    kinds.push('official-gazetteer');
  }
  if (/\b(wikipedia|commonwealth|dfat|tourism|reference|openfactbook|factfile)\b/i.test(descriptorText)) kinds.push('open-reference');
  return unique(kinds);
}

function sourceEvidenceKinds(input: SourceCompletenessGateInput): SourceEvidenceKind[] {
  return classifySourceEvidenceKinds(input.sources, input.placeRecords);
}

export function buildScopedLayerClaimChecks(
  reports: Array<Pick<SourceCompletenessGateReport, 'repository' | 'globalAllPlaceNamesAllowed' | 'missingForGlobalClaim' | 'results'>>,
): ScopedLayerClaimCheck[] {
  return SCOPED_LAYER_CLAIM_DIMENSIONS.map(dimension => {
    const layerPassingReports = reports.filter(report => report.results.some(row => row.dimension === dimension && row.status === 'passing'));
    const globalClaimAllowedReports = layerPassingReports.filter(report => report.globalAllPlaceNamesAllowed);
    const scopedOnlyReports = layerPassingReports.filter(report => !report.globalAllPlaceNamesAllowed);
    const scopeLeakReports = globalClaimAllowedReports.filter(report => report.missingForGlobalClaim.length > 0);

    return {
      dimension,
      passingRepositories: layerPassingReports.length,
      blockedGlobalClaimRepositories: scopedOnlyReports.length,
      globalClaimAllowedRepositories: globalClaimAllowedReports.length,
      scopeLeakRepositories: scopeLeakReports.map(report => report.repository),
      sampleScopedRepositories: scopedOnlyReports.slice(0, 10).map(report => report.repository),
      sampleGlobalClaimAllowedRepositories: globalClaimAllowedReports.slice(0, 10).map(report => report.repository),
      assertion: scopeLeakReports.length === 0
        ? 'layer-passing-remains-scoped-unless-all-required-layers-pass'
        : 'layer-passing-global-claim-leak-detected',
    };
  });
}

export function sourceCompletenessSummaryInvariantFailures(summary: {
  claimBoundary: {
    layerPassingScopeInvariant: boolean;
    scopedLayerClaimChecks: ScopedLayerClaimCheck[];
  };
}) {
  const failures: string[] = [];
  if (!summary.claimBoundary.layerPassingScopeInvariant) {
    const leaks = summary.claimBoundary.scopedLayerClaimChecks.flatMap(check => {
      return check.scopeLeakRepositories.map(repository => `${check.dimension}:${repository}`);
    });
    failures.push(
      leaks.length
        ? `Scoped layer claim invariant failed for ${leaks.join(', ')}.`
        : 'Scoped layer claim invariant failed.',
    );
  }

  return failures;
}

function expectedIslandCount(input: SourceCompletenessGateInput) {
  const gateText = input.releaseGates.join(' ');
  const numbered = gateText.match(/complete-(\d+)-island-coverage-required/i);
  if (numbered) return Number(numbered[1]);
  if (/complete-main-island-coverage-required/i.test(gateText)) {
    const observed = input.placeRecords.filter(record => isIslandRecord(record)).length;
    return observed || null;
  }
  if (/complete-island-coverage-required/i.test(gateText)) {
    const observed = input.placeRecords.filter(record => isIslandRecord(record)).length;
    return observed || null;
  }
  return null;
}

function hasOverclaimGuard(input: SourceCompletenessGateInput, dimension: SourceCompletenessDimensionId) {
  const text = input.releaseGates.join(' ');
  if (dimension === 'islands') {
    return /no-all-islands-overclaim|smaller-islets-not-overclaimed|all-\d+-islands-source-linked|complete-\d+-island-coverage-required|complete-island-coverage-required/i.test(text);
  }
  if (dimension === 'administrative-divisions') {
    return /admin|division|district|municipalit|boundary|conformance-covers/i.test(text);
  }
  return /no-.*overclaim|source-license-ledger-required|geodata-link-required|synthetic-fixtures-only/i.test(text);
}

function evidenceIntersection(kinds: SourceEvidenceKind[], accepted: SourceEvidenceKind[]) {
  return kinds.filter(kind => accepted.includes(kind));
}

function isIslandRecord(record: SourceCompletenessGateInput['placeRecords'][number]) {
  return /^island$/i.test(record.featureClass ?? '') || ISLAND_PATTERN.test(record.name ?? '');
}

function isPoiRecord(record: SourceCompletenessGateInput['placeRecords'][number]) {
  return /^poi$/i.test(record.featureClass ?? '');
}

function isNaturalRecord(record: SourceCompletenessGateInput['placeRecords'][number]) {
  return /^natural/i.test(record.featureClass ?? '') || NATURAL_PATTERN.test(record.name ?? '') || NATURAL_PATTERN.test(recordText(record));
}

function isAliasRecord(record: SourceCompletenessGateInput['placeRecords'][number]) {
  const localNames = record.localNames ?? {};
  return Object.keys(localNames).some(key => /alternate|alias|former|historic|old/i.test(key))
    || Object.values(localNames).length > 1
    || ALIAS_PATTERN.test(recordText(record));
}

function observedRecordsFor(input: SourceCompletenessGateInput, dimension: SourceCompletenessDimensionId) {
  switch (dimension) {
    case 'official-gazetteer':
    case 'osm':
    case 'geonames':
    case 'wikidata':
      return input.placeRecords.filter(record => {
        if (dimension === 'osm') return Boolean(record.geodataLinks?.osm);
        if (dimension === 'geonames') return Boolean(record.geodataLinks?.geonames);
        if (dimension === 'wikidata') return Boolean(record.geodataLinks?.wikidata);
        return Boolean(record.geodataLinks?.official);
      }).length;
    case 'administrative-divisions':
      return input.placeRecords.filter(record => ADMIN_CLASSES.has(String(record.featureClass ?? ''))).length;
    case 'islands':
      return input.placeRecords.filter(isIslandRecord).length;
    case 'poi':
      return input.placeRecords.filter(isPoiRecord).length;
    case 'natural-features':
      return input.placeRecords.filter(isNaturalRecord).length;
    case 'historical-aliases':
      return input.placeRecords.filter(isAliasRecord).length;
  }
}

function evaluateDimension(
  input: SourceCompletenessGateInput,
  dimension: SourceCompletenessDimension,
  allKinds: SourceEvidenceKind[],
): SourceCompletenessDimensionResult {
  const observedRecords = observedRecordsFor(input, dimension.id);
  const evidenceKinds = evidenceIntersection(allKinds, dimension.acceptedEvidenceKinds);
  const expectedRecords = dimension.id === 'islands' ? expectedIslandCount(input) : null;
  const reasons: string[] = [];
  const hasEvidence = evidenceKinds.length > 0;

  if (!hasEvidence) reasons.push(`Missing accepted evidence source for ${dimension.labelEn}.`);
  if (observedRecords === 0 && !['osm', 'geonames', 'wikidata', 'official-gazetteer'].includes(dimension.id)) {
    reasons.push(`No ${dimension.labelEn} records are present in place seeds.`);
  }
  if (expectedRecords !== null && observedRecords < expectedRecords) {
    reasons.push(`Expected ${expectedRecords} island records but found ${observedRecords}.`);
  }
  if (!hasOverclaimGuard(input, dimension.id) && ['islands', 'administrative-divisions', 'poi', 'natural-features', 'historical-aliases'].includes(dimension.id)) {
    reasons.push(`Missing overclaim guard for ${dimension.labelEn}.`);
  }

  let status: SourceCompletenessStatus = 'passing';
  if (!hasEvidence && observedRecords === 0) status = 'blocked';
  else if (!hasEvidence || reasons.length > 0) status = 'partial';
  if (dimension.id === 'islands' && expectedRecords === null && observedRecords === 0) status = 'blocked';
  if (dimension.id === 'poi' && observedRecords === 0) status = 'blocked';
  if (dimension.id === 'natural-features' && observedRecords === 0) status = 'blocked';
  if (dimension.id === 'historical-aliases' && observedRecords === 0) status = 'blocked';

  return {
    dimension: dimension.id,
    status,
    evidenceKinds,
    observedRecords,
    expectedRecords,
    reasons,
    nextGate: status === 'passing'
      ? 'Keep source version, license, conformance, and non-claim gates current.'
      : dimension.minimumRule,
  };
}

export function evaluateSourceCompletenessGate(
  input: SourceCompletenessGateInput,
  now = new Date(),
): SourceCompletenessGateReport {
  const allKinds = sourceEvidenceKinds(input);
  const results = SOURCE_COMPLETENESS_DIMENSIONS.map(dimension => evaluateDimension(input, dimension, allKinds));
  const summary = {
    passing: results.filter(result => result.status === 'passing').length,
    partial: results.filter(result => result.status === 'partial').length,
    blocked: results.filter(result => result.status === 'blocked').length,
    'not-in-scope': results.filter(result => result.status === 'not-in-scope').length,
  };
  const missingForGlobalClaim = results
    .filter(result => result.status !== 'passing')
    .map(result => result.dimension);

  return {
    version: SOURCE_COMPLETENESS_GATE_VERSION,
    repository: input.repository,
    relativePath: input.relativePath,
    generatedAt: now.toISOString(),
    globalAllPlaceNamesAllowed: missingForGlobalClaim.length === 0,
    completeSliceAllowed: results.some(result => result.status === 'passing') && !results.some(result => result.status === 'blocked'),
    results,
    summary,
    missingForGlobalClaim,
    nonClaims: SOURCE_COMPLETENESS_DIMENSIONS.map(dimension => dimension.nonClaim),
  };
}

function readJsonIfExists(path: string): unknown {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function arrayFromJson(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray((value as { places?: unknown[] }).places)) return (value as { places: unknown[] }).places;
  if (value && typeof value === 'object' && Array.isArray((value as { sources?: unknown[] }).sources)) return (value as { sources: unknown[] }).sources;
  if (value && typeof value === 'object' && Array.isArray((value as { gates?: unknown[] }).gates)) return (value as { gates: unknown[] }).gates;
  return value ? [value] : [];
}

function normalizePlaceRecord(value: unknown): SourceCompletenessGateInput['placeRecords'][number] {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    agidPlaceId: typeof record.agidPlaceId === 'string' ? record.agidPlaceId : undefined,
    name: typeof record.name === 'string' ? record.name : undefined,
    featureClass: typeof record.featureClass === 'string' ? record.featureClass : undefined,
    localNames: record.localNames && typeof record.localNames === 'object' ? record.localNames as Record<string, string> : undefined,
    geodataLinks: record.geodataLinks && typeof record.geodataLinks === 'object' ? record.geodataLinks as Record<string, string> : undefined,
    notes: Array.isArray(record.notes) ? record.notes.map(String) : undefined,
  };
}

function normalizeSourceRecord(value: unknown): SourceCompletenessGateInput['sources'][number] {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    name: typeof record.name === 'string' ? record.name : undefined,
    url: typeof record.url === 'string' ? record.url : undefined,
    role: typeof record.role === 'string' ? record.role : undefined,
    notes: Array.isArray(record.notes) ? record.notes.map(String) : undefined,
  };
}

export function buildSourceCompletenessInputFromOpenGeoRepository(
  repoPath: string,
  root = process.cwd(),
): SourceCompletenessGateInput {
  const repository = repoPath.split(/[\\/]/).at(-1) ?? repoPath;
  const sourcesJson = readJsonIfExists(join(repoPath, 'sources.json'));
  const qualityGatesJson = readJsonIfExists(join(repoPath, 'quality-gates.json'));
  const dataSeed = readJsonIfExists(join(repoPath, 'data', 'place-seed.json'));
  const gazetteerSeed = readJsonIfExists(join(repoPath, 'gazetteer', 'place-seeds.json'));
  const sourceValues = arrayFromJson(sourcesJson).map(normalizeSourceRecord);
  const releaseGates = arrayFromJson(qualityGatesJson).map(value => {
    const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return String(record.id ?? record.gate ?? '');
  }).filter(Boolean);
  const placeRecords = [
    ...arrayFromJson(dataSeed),
    ...arrayFromJson(gazetteerSeed),
  ].map(normalizePlaceRecord);

  return {
    repository,
    relativePath: relative(root, repoPath),
    releaseGates,
    sources: sourceValues,
    placeRecords,
  };
}

export function listOpenGeoRepositoryPaths(root = join(process.cwd(), 'data', 'open_geo_repositories')) {
  return readdirSync(root)
    .map(name => join(root, name))
    .filter(path => statSync(path).isDirectory())
    .filter(path => /[\\/]agid-open-/.test(path));
}

export function buildOpenGeoSourceCompletenessSummary(root = process.cwd()) {
  const repoRoot = join(root, 'data', 'open_geo_repositories');
  const reports = listOpenGeoRepositoryPaths(repoRoot)
    .map(repoPath => evaluateSourceCompletenessGate(buildSourceCompletenessInputFromOpenGeoRepository(repoPath, root)));
  const blockedDimensions = SOURCE_COMPLETENESS_DIMENSIONS
    .map(dimension => dimension.id)
    .filter(dimension => reports.some(report => {
      const row = report.results.find(result => result.dimension === dimension);
      return row?.status !== 'passing';
    }));
  const byDimension = Object.fromEntries(SOURCE_COMPLETENESS_DIMENSIONS.map(dimension => {
    const rows = reports.map(report => report.results.find(result => result.dimension === dimension.id)).filter(Boolean) as SourceCompletenessDimensionResult[];
    return [dimension.id, {
      passing: rows.filter(row => row.status === 'passing').length,
      partial: rows.filter(row => row.status === 'partial').length,
      blocked: rows.filter(row => row.status === 'blocked').length,
      samplePassing: reports.filter(report => report.results.some(row => row.dimension === dimension.id && row.status === 'passing')).slice(0, 10).map(report => report.repository),
      sampleBlocked: reports.filter(report => report.results.some(row => row.dimension === dimension.id && row.status === 'blocked')).slice(0, 10).map(report => report.repository),
    }];
  })) as Record<SourceCompletenessDimensionId, {
    passing: number;
    partial: number;
    blocked: number;
    samplePassing: string[];
    sampleBlocked: string[];
  }>;
  const scopedLayerClaimChecks = buildScopedLayerClaimChecks(reports);
  const layerPassingScopeInvariant = scopedLayerClaimChecks.every(check => check.scopeLeakRepositories.length === 0);

  return {
    version: SOURCE_COMPLETENESS_GATE_VERSION,
    generatedAt: new Date().toISOString(),
    repositoryCount: reports.length,
    globalAllPlaceNamesAllowedCount: reports.filter(report => report.globalAllPlaceNamesAllowed).length,
    completeSliceAllowedCount: reports.filter(report => report.completeSliceAllowed).length,
    claimBoundary: {
      verdict: blockedDimensions.length === 0
        ? 'global-all-place-name-claim-requires-final-release-review'
        : 'global-all-place-name-claim-blocked',
      globalAllPlaceNamesAllowed: reports.length > 0 && blockedDimensions.length === 0,
      blockedClaim: 'global-all-place-name-completeness',
      allowedClaim: 'source-layer status for explicitly named repositories, dimensions, and local seed evidence only',
      requiredPassingDimensions: SOURCE_COMPLETENESS_DIMENSIONS.map(dimension => dimension.id),
      blockedDimensions,
      layerPassingScopeInvariant,
      scopedLayerClaimChecks,
      nonClaimCount: SOURCE_COMPLETENESS_DIMENSIONS.length,
      nextGate: blockedDimensions.length === 0
        ? 'Run final source freshness, license, overclaim, and publication review before using global all-place-name completeness language.'
        : `Close these source completeness layers before using global all-place-name completeness language: ${blockedDimensions.join(', ')}.`,
    },
    byDimension,
    reports,
  };
}
