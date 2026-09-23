export type RepositorySplitStrategy =
  | 'single-country-or-territory-pack'
  | 'country-index-plus-child-repositories'
  | 'single-polar-area-pack';

export type RepositoryPlacementUnit = {
  code: string;
  name: string;
  repository: string;
  splitStrategy: RepositorySplitStrategy | string;
  recommendedChildren?: string[];
};

export type RepositoryPhysicalStage =
  | 'single-repo-now'
  | 'parent-repo-now'
  | 'parent-plus-priority-children'
  | 'parent-plus-all-children'
  | 'needs-placement-fix';

export type RepositoryAllocationVerdict = 'accept' | 'watch' | 'revise';

export type RepositoryAllocationFinding = {
  code: string;
  repository: string;
  childCount: number;
  verdict: RepositoryAllocationVerdict;
  physicalStage: RepositoryPhysicalStage;
  reason: string;
  nextAction: string;
};

export type RepositoryAllocationSummary = {
  totalUnits: number;
  singleUnits: number;
  splitUnits: number;
  polarUnits: number;
  childRepoPlanCount: number;
  logicalRepoUpperBound: number;
  acceptedFindings: number;
  watchFindings: number;
  reviseFindings: number;
};

export type OceanRepositoryAuditInput = {
  rootRepository: string;
  oceanRepositoryCount: number;
  seaRepositoryCount: number;
  mountainsIndependentRepository: boolean;
  desertsIndependentRepository: boolean;
};

export type OceanRepositoryAuditResult = {
  verdict: RepositoryAllocationVerdict;
  reason: string;
  nextAction: string;
};

export const REPOSITORY_SPLIT_ALLOCATION_THRESHOLDS = {
  lowChildSplitPlanMax: 8,
  immediateAllChildrenMax: 40,
  seaRepositoryMin: 150,
  seaRepositoryMax: 300,
} as const;

export const SINGLE_REPO_WATCHLIST_CODES = new Set(['AE', 'BE', 'HK', 'NZ']);

export const LOW_CHILD_SPLIT_WATCHLIST_CODES = new Set(['ET', 'NG', 'PE', 'PK', 'ZA']);

export const REPOSITORY_CREATION_POLICY = [
  'Treat the placement file as a logical ownership plan, not a command to create every GitHub repository immediately.',
  'Create every country, territory, and polar parent repository first.',
  'Create child repositories only when data volume, maintainer ownership, or pull-request pressure justifies the split.',
  'Keep heavy geometry, building polygons, search indexes, and private operational samples outside GitHub.',
  'Keep raw personal address, recipient, witness, and private-key material out of every public repository.',
];

function childCountOf(unit: RepositoryPlacementUnit): number {
  return unit.recommendedChildren?.length ?? 0;
}

export function flattenRepositoryPlacementData(data: {
  continents?: Array<{
    id: string;
    regions?: Array<{
      id: string;
      countries?: RepositoryPlacementUnit[];
    }>;
  }>;
}): RepositoryPlacementUnit[] {
  return (data.continents ?? []).flatMap(continent =>
    (continent.regions ?? []).flatMap(region => region.countries ?? []),
  );
}

export function auditRepositoryPlacementUnit(unit: RepositoryPlacementUnit): RepositoryAllocationFinding {
  const childCount = childCountOf(unit);

  if (unit.splitStrategy === 'single-polar-area-pack') {
    return childCount === 0
      ? {
          code: unit.code,
          repository: unit.repository,
          childCount,
          verdict: 'accept',
          physicalStage: 'single-repo-now',
          reason: 'Polar areas should start as one bounded area pack unless station-level maintainers and data volume appear.',
          nextAction: 'Keep stations, claims, and natural-feature references as records or external packs before creating child repositories.',
        }
      : {
          code: unit.code,
          repository: unit.repository,
          childCount,
          verdict: 'revise',
          physicalStage: 'needs-placement-fix',
          reason: 'A single polar pack should not already contain child repository plans.',
          nextAction: 'Move child entries into internal packs or change the split strategy explicitly.',
        };
  }

  if (unit.splitStrategy === 'single-country-or-territory-pack') {
    if (childCount > 0) {
      return {
        code: unit.code,
        repository: unit.repository,
        childCount,
        verdict: 'revise',
        physicalStage: 'needs-placement-fix',
        reason: 'A single country or territory pack cannot also carry child repository plans.',
        nextAction: 'Either remove child repositories or promote the unit to a split country-index strategy.',
      };
    }

    const isWatchlisted = SINGLE_REPO_WATCHLIST_CODES.has(unit.code);
    return {
      code: unit.code,
      repository: unit.repository,
      childCount,
      verdict: isWatchlisted ? 'watch' : 'accept',
      physicalStage: 'single-repo-now',
      reason: isWatchlisted
        ? 'Single-repo placement is acceptable now, but density, language complexity, or overseas coverage should be watched.'
        : 'A single pack is the right default for small, lower-volume, or early-stage country and territory datasets.',
      nextAction: isWatchlisted
        ? 'Keep one public repository now; add internal folders and split only after measurable data or contributor pressure.'
        : 'Create or maintain the single repository with safe rules, metadata, and synthetic conformance fixtures.',
    };
  }

  if (unit.splitStrategy === 'country-index-plus-child-repositories') {
    if (childCount === 0) {
      return {
        code: unit.code,
        repository: unit.repository,
        childCount,
        verdict: 'revise',
        physicalStage: 'needs-placement-fix',
        reason: 'A split country index needs at least one child repository plan.',
        nextAction: 'Add child units or downgrade the country to a single pack.',
      };
    }

    if (childCount <= REPOSITORY_SPLIT_ALLOCATION_THRESHOLDS.lowChildSplitPlanMax) {
      return {
        code: unit.code,
        repository: unit.repository,
        childCount,
        verdict: LOW_CHILD_SPLIT_WATCHLIST_CODES.has(unit.code) ? 'watch' : 'accept',
        physicalStage: 'parent-repo-now',
        reason: 'The split is useful as a future ownership plan, but too small to justify many physical child repositories immediately.',
        nextAction: 'Create the parent repository first; expand child scope or activate children only when real data and maintainers are ready.',
      };
    }

    if (childCount > REPOSITORY_SPLIT_ALLOCATION_THRESHOLDS.immediateAllChildrenMax) {
      return {
        code: unit.code,
        repository: unit.repository,
        childCount,
        verdict: 'accept',
        physicalStage: 'parent-plus-priority-children',
        reason: 'The country is large enough to require child ownership, but creating every child repository at once would be operationally heavy.',
        nextAction: 'Create the parent repository and the highest-volume children first; keep the rest as planned logical units.',
      };
    }

    return {
      code: unit.code,
      repository: unit.repository,
      childCount,
      verdict: 'accept',
      physicalStage: 'parent-plus-all-children',
      reason: 'The child count is moderate enough for immediate physical repository creation if maintainers exist.',
      nextAction: 'Create parent and child repositories with the common quality gates and no-raw-address policy.',
    };
  }

  return {
    code: unit.code,
    repository: unit.repository,
    childCount,
    verdict: 'revise',
    physicalStage: 'needs-placement-fix',
    reason: `Unknown repository split strategy: ${unit.splitStrategy}`,
    nextAction: 'Use one of the supported split strategies before publication.',
  };
}

export function auditRepositorySplitAllocation(units: RepositoryPlacementUnit[]) {
  const findings = units.map(auditRepositoryPlacementUnit);
  const splitUnits = units.filter(unit => unit.splitStrategy === 'country-index-plus-child-repositories').length;
  const singleUnits = units.filter(unit => unit.splitStrategy === 'single-country-or-territory-pack').length;
  const polarUnits = units.filter(unit => unit.splitStrategy === 'single-polar-area-pack').length;
  const childRepoPlanCount = units.reduce((sum, unit) => sum + childCountOf(unit), 0);

  const summary: RepositoryAllocationSummary = {
    totalUnits: units.length,
    singleUnits,
    splitUnits,
    polarUnits,
    childRepoPlanCount,
    logicalRepoUpperBound: units.length + childRepoPlanCount,
    acceptedFindings: findings.filter(finding => finding.verdict === 'accept').length,
    watchFindings: findings.filter(finding => finding.verdict === 'watch').length,
    reviseFindings: findings.filter(finding => finding.verdict === 'revise').length,
  };

  return { summary, findings };
}

export function auditOceanRepositoryAllocation(input: OceanRepositoryAuditInput): OceanRepositoryAuditResult {
  const seaCountOk =
    input.seaRepositoryCount >= REPOSITORY_SPLIT_ALLOCATION_THRESHOLDS.seaRepositoryMin &&
    input.seaRepositoryCount <= REPOSITORY_SPLIT_ALLOCATION_THRESHOLDS.seaRepositoryMax;

  if (!seaCountOk) {
    return {
      verdict: 'watch',
      reason: 'The sea-area logical repository count is outside the target 150 to 300 range.',
      nextAction: 'Merge very small sea areas or add missing major seas before physical GitHub creation.',
    };
  }

  if (input.mountainsIndependentRepository || input.desertsIndependentRepository) {
    return {
      verdict: 'revise',
      reason: 'Mountains and deserts should not become independent repository families by default.',
      nextAction: 'Store them as natural-feature packs inside country, region, or polar/ocean-adjacent repositories.',
    };
  }

  return {
    verdict: 'accept',
    reason: 'Ocean placement is sized correctly: root index, five ocean repositories, and sea-area logical repositories.',
    nextAction: 'Create ocean parent repositories first; activate sea-area repositories only as data packs mature.',
  };
}
