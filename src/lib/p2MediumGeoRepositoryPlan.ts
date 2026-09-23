import type {
  GeoOssGapEntry,
  GeoOssGapStrategyReport,
} from './geoOpenSourceGapStrategy';

export const P2_MEDIUM_GEO_REPOSITORY_PLAN_VERSION = 'p2-medium-geo-repository-plan-v0.1';

export type P2MediumExecutionStage =
  | 'source-ledger-first'
  | 'core-role-fill'
  | 'manual-fallback-reduction'
  | 'conformance-hardening';

export type P2MediumPlanItem = {
  rank: number;
  wave: number;
  stage: P2MediumExecutionStage;
  countryCode: string;
  countryName: string;
  continent: string;
  regionKind: GeoOssGapEntry['regionKind'];
  operationalClass: string;
  localCoreRoleCount: number;
  redistributableLocalCoreRoleCount: number;
  presentLocalCoreRoles: string[];
  missingCoreRoles: string[];
  canBundleRedistributable: boolean;
  manualFallback: boolean;
  repositorySet: string[];
  firstActions: string[];
  packageFocus: string;
  definitionOfDone: string[];
  riskBoundary: string[];
};

export type P2MediumPlanWave = {
  wave: number;
  rankRange: [number, number];
  itemCount: number;
  objective: string;
  exitCriteria: string[];
};

export type P2MediumGeoRepositoryPlan = {
  version: typeof P2_MEDIUM_GEO_REPOSITORY_PLAN_VERSION;
  generatedAt: string;
  targetCount: number;
  availableCount: number;
  selectedCount: number;
  waveSize: number;
  summary: {
    byContinent: Record<string, number>;
    byRegionKind: Record<string, number>;
    byStage: Record<P2MediumExecutionStage, number>;
  };
  operatingPrinciples: string[];
  releaseGates: string[];
  waves: P2MediumPlanWave[];
  items: P2MediumPlanItem[];
  residualRisks: string[];
};

function emptyStageCounts(): Record<P2MediumExecutionStage, number> {
  return {
    'source-ledger-first': 0,
    'core-role-fill': 0,
    'manual-fallback-reduction': 0,
    'conformance-hardening': 0,
  };
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export function stageForP2Entry(entry: GeoOssGapEntry): P2MediumExecutionStage {
  if (entry.localCoreRoleCount <= 2 || entry.missingCoreRoles.length >= 2) return 'core-role-fill';
  if (entry.manualFallback) return 'manual-fallback-reduction';
  if (!entry.canBundleRedistributable) return 'source-ledger-first';
  return 'conformance-hardening';
}

function packageFocusFor(entry: GeoOssGapEntry, stage: P2MediumExecutionStage) {
  if (stage === 'source-ledger-first') {
    return 'License and provenance ledger before data import; keep linked evidence metadata-only until redistribution is cleared.';
  }
  if (stage === 'core-role-fill') {
    return `Fill missing local core roles: ${entry.missingCoreRoles.join(', ') || 'none'} with synthetic fixtures first.`;
  }
  if (stage === 'manual-fallback-reduction') {
    return 'Reduce manual fallback by adding candidate lookup, source confidence, and geocoder conformance vectors.';
  }
  return 'Harden conformance tests, update cadence, attribution, and package publication readiness.';
}

function definitionOfDoneFor(entry: GeoOssGapEntry) {
  return [
    'README explains scope, data boundary, source policy, and non-claims.',
    'sources.json records URL, license, attribution, update cadence, redistribution status, and role.',
    'No raw personal address, recipient, witness, private-key, or proof-secret material is present.',
    'fixtures include parse, normalize, candidate lookup, source confidence, and manual fallback behavior.',
    `Every missing role is either filled or explicitly blocked: ${entry.missingCoreRoles.join(', ') || 'none'}.`,
    'quality-gates.json blocks publication until license and conformance checks pass.',
  ];
}

function riskBoundaryFor(entry: GeoOssGapEntry) {
  const risks = [
    'Do not present P2 packs as complete national address datasets.',
    'Do not bundle upstream sources unless redistribution is approved.',
    'Do not infer delivery availability, postal validity, or legal boundary decisions from public place metadata.',
  ];
  if (entry.regionKind !== 'country-or-main-region') {
    risks.push('Use neutral technical identifiers for territory, disputed, or special-region records.');
  }
  if (entry.manualFallback) {
    risks.push('Keep manual-review behavior visible until automated candidate quality is tested.');
  }
  return risks;
}

function wavesFor(selectedCount: number, waveSize: number): P2MediumPlanWave[] {
  const waveCount = Math.ceil(selectedCount / waveSize);
  return Array.from({ length: waveCount }, (_, index) => {
    const wave = index + 1;
    const start = (index * waveSize) + 1;
    const end = Math.min(selectedCount, wave * waveSize);
    return {
      wave,
      rankRange: [start, end],
      itemCount: end - start + 1,
      objective: wave <= 2
        ? 'Convert P2 candidates into source-ledger-ready packages without importing restricted data.'
        : wave <= 5
        ? 'Fill missing core geo roles with synthetic fixtures and public place metadata.'
        : 'Reduce manual fallback and harden conformance/quality gates for publication.',
      exitCriteria: [
        'All selected entries have an owner, repository-set decision, and source ledger path.',
        'All fixtures are synthetic or metadata-link-only.',
        'License and attribution status are explicit for every source.',
        'No package claims complete address, delivery, postal, legal, or boundary authority without verified data.',
      ],
    };
  });
}

export function buildP2MediumGeoRepositoryPlan(
  report: GeoOssGapStrategyReport,
  now = new Date(),
  options: { targetCount?: number; waveSize?: number } = {},
): P2MediumGeoRepositoryPlan {
  const targetCount = options.targetCount ?? 200;
  const waveSize = options.waveSize ?? 25;
  const p2Entries = report.entries.filter(entry => entry.priority === 'P2-medium');
  const selected = p2Entries.slice(0, targetCount);
  const byContinent: Record<string, number> = {};
  const byRegionKind: Record<string, number> = {};
  const byStage = emptyStageCounts();

  const items = selected.map((entry, index): P2MediumPlanItem => {
    const rank = index + 1;
    const stage = stageForP2Entry(entry);
    increment(byContinent, entry.continent);
    increment(byRegionKind, entry.regionKind);
    byStage[stage] += 1;
    return {
      rank,
      wave: Math.ceil(rank / waveSize),
      stage,
      countryCode: entry.countryCode,
      countryName: entry.countryName,
      continent: entry.continent,
      regionKind: entry.regionKind,
      operationalClass: entry.operationalClass,
      localCoreRoleCount: entry.localCoreRoleCount,
      redistributableLocalCoreRoleCount: entry.redistributableLocalCoreRoleCount,
      presentLocalCoreRoles: entry.presentLocalCoreRoles,
      missingCoreRoles: entry.missingCoreRoles,
      canBundleRedistributable: entry.canBundleRedistributable,
      manualFallback: entry.manualFallback,
      repositorySet: entry.proposedOpenSourcePackages,
      firstActions: entry.firstActions,
      packageFocus: packageFocusFor(entry, stage),
      definitionOfDone: definitionOfDoneFor(entry),
      riskBoundary: riskBoundaryFor(entry),
    };
  });

  return {
    version: P2_MEDIUM_GEO_REPOSITORY_PLAN_VERSION,
    generatedAt: now.toISOString(),
    targetCount,
    availableCount: p2Entries.length,
    selectedCount: items.length,
    waveSize,
    summary: {
      byContinent,
      byRegionKind,
      byStage,
    },
    operatingPrinciples: [
      'Do not create empty repositories; create P2 packages only when README, source ledger, fixtures, and quality gates exist.',
      'Prefer one compact country/region package until a concrete data-volume or maintenance reason justifies splitting.',
      'Use source-linked metadata and synthetic fixtures before importing external datasets.',
      'Separate restricted, ODbL, mixed-license, and official-but-nonredistributable sources into evidence ledgers.',
      'Keep all publication claims bounded: source-linked seed, partial coverage, or conformance fixture, not complete national address truth.',
    ],
    releaseGates: [
      'no-raw-personal-addresses',
      'no-recipient-records',
      'no-private-coordinates',
      'source-license-ledger-required',
      'redistribution-review-before-import',
      'synthetic-fixtures-first',
      'manual-fallback-visible-when-needed',
      'no-delivery-postal-or-legal-overclaim',
      'conformance-vectors-required',
    ],
    waves: wavesFor(items.length, waveSize),
    items,
    residualRisks: [
      'P2 entries still may contain partial local coverage or redistribution risk; they should not be marketed as complete country packs.',
      'Some entries may become P1/P0 if source licenses change, local services disappear, or manual fallback remains high.',
      'The plan is generated from the current AGID source catalog; official source changes require regeneration and review.',
    ],
  };
}
