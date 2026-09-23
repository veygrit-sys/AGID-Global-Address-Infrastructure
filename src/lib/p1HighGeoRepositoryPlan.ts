import type {
  GeoOssGapEntry,
  GeoOssGapStrategyReport,
} from './geoOpenSourceGapStrategy';

export const P1_HIGH_GEO_REPOSITORY_PLAN_VERSION = 'p1-high-geo-repository-plan-v0.1';

export type P1HighRecoveryTrack =
  | 'address-only-recovery'
  | 'gazetteer-only-recovery'
  | 'boundary-only-recovery'
  | 'geocoding-only-recovery';

export type P1HighPlanItem = {
  rank: number;
  wave: number;
  recoveryTrack: P1HighRecoveryTrack;
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

export type P1HighPlanWave = {
  wave: number;
  rankRange: [number, number];
  itemCount: number;
  objective: string;
  exitCriteria: string[];
};

export type P1HighGeoRepositoryPlan = {
  version: typeof P1_HIGH_GEO_REPOSITORY_PLAN_VERSION;
  generatedAt: string;
  targetCount: number;
  availableCount: number;
  selectedCount: number;
  waveSize: number;
  summary: {
    byContinent: Record<string, number>;
    byRegionKind: Record<string, number>;
    byRecoveryTrack: Record<P1HighRecoveryTrack, number>;
  };
  operatingPrinciples: string[];
  releaseGates: string[];
  waves: P1HighPlanWave[];
  items: P1HighPlanItem[];
  residualRisks: string[];
};

function emptyTrackCounts(): Record<P1HighRecoveryTrack, number> {
  return {
    'address-only-recovery': 0,
    'gazetteer-only-recovery': 0,
    'boundary-only-recovery': 0,
    'geocoding-only-recovery': 0,
  };
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export function recoveryTrackForP1Entry(entry: GeoOssGapEntry): P1HighRecoveryTrack {
  if (entry.presentLocalCoreRoles.includes('address')) return 'address-only-recovery';
  if (entry.presentLocalCoreRoles.includes('gazetteer')) return 'gazetteer-only-recovery';
  if (entry.presentLocalCoreRoles.includes('admin-boundary')) return 'boundary-only-recovery';
  return 'geocoding-only-recovery';
}

function packageFocusFor(entry: GeoOssGapEntry, track: P1HighRecoveryTrack) {
  if (track === 'address-only-recovery') {
    return 'Existing local address evidence must be anchored to boundary, gazetteer, and geocoding fixtures before automation can replace manual fallback.';
  }
  if (track === 'gazetteer-only-recovery') {
    return 'Existing local place-name evidence must be connected to address-candidate, boundary, and geocoding fixtures.';
  }
  if (track === 'boundary-only-recovery') {
    return 'Existing local boundary evidence must be connected to gazetteer names, address candidates, and geocoding conformance vectors.';
  }
  return 'Existing local geocoding evidence must be surrounded with boundary, gazetteer, and address-candidate fixtures.';
}

function definitionOfDoneFor(entry: GeoOssGapEntry) {
  return [
    'README states that this is a P1 high recovery package, not a complete national address dataset.',
    'sources.json separates the one present local core role from all missing-role candidate sources.',
    'license-ledger marks all nonredistributable, mixed, ODbL, or restricted inputs as metadata-link-only.',
    `All three missing roles are represented by synthetic fixtures or explicitly blocked: ${entry.missingCoreRoles.join(', ')}.`,
    'fixtures cover candidate lookup, source confidence, manual fallback trigger, and non-claim behavior.',
    'quality-gates.json prevents publication when a package claims delivery availability, postal validity, legal boundary authority, or complete address coverage.',
  ];
}

function riskBoundaryFor(entry: GeoOssGapEntry) {
  const risks = [
    'Do not bundle upstream source data until redistribution is explicitly approved.',
    'Do not claim full local coverage from a single present core role.',
    'Do not infer postal validity, delivery availability, or legal boundary authority from source-linked metadata.',
    'Manual fallback remains the default until all missing core roles have passing conformance vectors.',
  ];
  if (entry.regionKind !== 'country-or-main-region') {
    risks.push('Use neutral technical identifiers for territory or special-region records.');
  }
  return risks;
}

function wavesFor(selectedCount: number, waveSize: number): P1HighPlanWave[] {
  const waveCount = Math.ceil(selectedCount / waveSize);
  return Array.from({ length: waveCount }, (_, index) => {
    const wave = index + 1;
    const start = (index * waveSize) + 1;
    const end = Math.min(selectedCount, wave * waveSize);
    return {
      wave,
      rankRange: [start, end],
      itemCount: end - start + 1,
      objective: wave === 1
        ? 'Stabilize the highest-risk P1 entries with source ledgers, non-claims, and missing-role maps.'
        : wave === 2
        ? 'Build synthetic fixtures for the missing three core roles and reduce manual fallback triggers.'
        : 'Prepare publication-ready packages with conformance vectors, quality gates, and migration paths to P2/watch.',
      exitCriteria: [
        'Every entry has a repository-set decision and a license ledger path.',
        'The one present local core role is explicit and not overstated.',
        'The three missing core roles have fixtures or a documented blocker.',
        'Manual fallback remains visible until conformance passes.',
      ],
    };
  });
}

export function buildP1HighGeoRepositoryPlan(
  report: GeoOssGapStrategyReport,
  now = new Date(),
  options: { targetCount?: number; waveSize?: number } = {},
): P1HighGeoRepositoryPlan {
  const p1Entries = report.entries.filter(entry => entry.priority === 'P1-high');
  const targetCount = options.targetCount ?? p1Entries.length;
  const waveSize = options.waveSize ?? 11;
  const selected = p1Entries.slice(0, targetCount);
  const byContinent: Record<string, number> = {};
  const byRegionKind: Record<string, number> = {};
  const byRecoveryTrack = emptyTrackCounts();

  const items = selected.map((entry, index): P1HighPlanItem => {
    const rank = index + 1;
    const recoveryTrack = recoveryTrackForP1Entry(entry);
    increment(byContinent, entry.continent);
    increment(byRegionKind, entry.regionKind);
    byRecoveryTrack[recoveryTrack] += 1;
    return {
      rank,
      wave: Math.ceil(rank / waveSize),
      recoveryTrack,
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
      packageFocus: packageFocusFor(entry, recoveryTrack),
      definitionOfDone: definitionOfDoneFor(entry),
      riskBoundary: riskBoundaryFor(entry),
    };
  });

  return {
    version: P1_HIGH_GEO_REPOSITORY_PLAN_VERSION,
    generatedAt: now.toISOString(),
    targetCount,
    availableCount: p1Entries.length,
    selectedCount: items.length,
    waveSize,
    summary: {
      byContinent,
      byRegionKind,
      byRecoveryTrack,
    },
    operatingPrinciples: [
      'P1 entries have only one local core geo role; do not publish them as complete address-validation packs.',
      'Recover the missing three roles before moving an entry down to P2/watch.',
      'Keep nonredistributable sources in license ledgers and publish synthetic fixtures first.',
      'Prefer one compact recovery repository set per country or region until coverage, volume, or governance requires splitting.',
      'Use conformance results, not optimism, to decide when manual fallback can be reduced.',
    ],
    releaseGates: [
      'no-raw-personal-addresses',
      'no-recipient-records',
      'source-license-ledger-required',
      'one-present-core-role-must-be-named',
      'three-missing-core-roles-must-be-fixtured-or-blocked',
      'manual-fallback-visible',
      'redistribution-review-before-import',
      'no-delivery-postal-or-legal-overclaim',
      'promotion-to-p2-requires-conformance-pass',
    ],
    waves: wavesFor(items.length, waveSize),
    items,
    residualRisks: [
      'All current P1 entries are nonredistributable under the current source catalog, so publication must stay metadata-link-only until license review.',
      'A single present local core role can make the pack look stronger than it is; README and quality gates must keep the risk visible.',
      'Official source changes can move entries between P1, P2, and P0; regenerate before opening repositories.',
    ],
  };
}
