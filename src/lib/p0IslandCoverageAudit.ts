import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import { buildP0GazetteerRepositoryPlan } from './p0GazetteerRepositoryRotation';

export const P0_ISLAND_COVERAGE_AUDIT_VERSION = 'p0-island-coverage-audit-v0.1';

export type P0IslandCoverageMode =
  | 'complete-all-islands'
  | 'complete-main-islands'
  | 'administrative-coverage-island-expansion-needed'
  | 'subdivision-coverage-island-expansion-needed'
  | 'customary-coverage-island-expansion-needed';

export type P0IslandCoverageTarget = {
  countryCode: string;
  countryName: string;
  continent: GeoOssGapEntry['continent'];
  repository: string;
  rotationRank: number;
  mode: P0IslandCoverageMode;
  expectedIslandSeeds?: number;
  requiredGate?: string;
  overclaimGuard?: string;
  nextSmallestImprovement: string;
};

export type P0IslandCoverageAuditRow = P0IslandCoverageTarget & {
  currentIslandSeeds: number;
  currentCapitalSeeds: number;
  matchingGatePresent: boolean;
  overclaimGuardPresent: boolean;
  status: 'passing' | 'partial' | 'deferred';
  residualRisk: string;
};

const TARGETS: P0IslandCoverageTarget[] = [
  {
    countryCode: 'PN',
    countryName: 'Pitcairn Islands',
    continent: 'oceania',
    repository: 'agid-open-pn-gazetteer',
    rotationRank: 23,
    mode: 'complete-all-islands',
    expectedIslandSeeds: 4,
    requiredGate: 'complete-island-coverage-required',
    overclaimGuard: 'no-admin-division-overclaim',
    nextSmallestImprovement: 'Add route/access policy fixtures without changing the four-island completeness claim.',
  },
  {
    countryCode: 'FO',
    countryName: 'Faroe Islands',
    continent: 'europe',
    repository: 'agid-open-fo-gazetteer',
    rotationRank: 6,
    mode: 'complete-main-islands',
    expectedIslandSeeds: 18,
    requiredGate: 'complete-main-island-coverage-required',
    overclaimGuard: 'smaller-islets-not-overclaimed',
    nextSmallestImprovement: 'Add a separate islet/skerry backlog instead of upgrading the current pack to all-island coverage.',
  },
  {
    countryCode: 'KI',
    countryName: 'Kiribati',
    continent: 'oceania',
    repository: 'agid-open-ki-gazetteer',
    rotationRank: 21,
    mode: 'complete-all-islands',
    expectedIslandSeeds: 33,
    requiredGate: 'complete-33-island-coverage-required',
    overclaimGuard: 'all-33-islands-source-linked',
    nextSmallestImprovement: 'Add council and settlement anchors while keeping the no-delivery/no-boundary island non-claim.',
  },
  {
    countryCode: 'MH',
    countryName: 'Marshall Islands',
    continent: 'oceania',
    repository: 'agid-open-mh-gazetteer',
    rotationRank: 14,
    mode: 'administrative-coverage-island-expansion-needed',
    nextSmallestImprovement: 'Add an authoritative all-islet inventory manifest and disputed/claimed-feature policy before any Marshall Islands all-island claim.',
  },
  {
    countryCode: 'FM',
    countryName: 'Federated States of Micronesia',
    continent: 'oceania',
    repository: 'agid-open-fm-gazetteer',
    rotationRank: 4,
    mode: 'administrative-coverage-island-expansion-needed',
    nextSmallestImprovement: 'Add major island anchors under Chuuk, Kosrae, Pohnpei, and Yap without claiming complete minor-islet coverage.',
  },
  {
    countryCode: 'WF',
    countryName: 'Wallis and Futuna',
    continent: 'oceania',
    repository: 'agid-open-wf-gazetteer',
    rotationRank: 7,
    mode: 'customary-coverage-island-expansion-needed',
    nextSmallestImprovement: 'Add Wallis, Futuna, and Alofi as explicit island anchors under the customary kingdoms.',
  },
  {
    countryCode: 'NC',
    countryName: 'New Caledonia',
    continent: 'oceania',
    repository: 'agid-open-nc-gazetteer',
    rotationRank: 6,
    mode: 'subdivision-coverage-island-expansion-needed',
    nextSmallestImprovement: 'Add Grande Terre, Loyalty Islands, Isle of Pines, and Belep public island anchors with no route/access claim.',
  },
  {
    countryCode: 'PF',
    countryName: 'French Polynesia',
    continent: 'oceania',
    repository: 'agid-open-pf-gazetteer',
    rotationRank: 13,
    mode: 'subdivision-coverage-island-expansion-needed',
    nextSmallestImprovement: 'Add archipelago and high-confidence island anchors before attempting all-island coverage.',
  },
];

function gapForTarget(target: P0IslandCoverageTarget): GeoOssGapEntry {
  return {
    countryCode: target.countryCode,
    countryName: target.countryName,
    continent: target.continent,
    relativePath: `${target.countryCode}.json`,
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['P0 island coverage audit target.'],
    proposedOpenSourcePackages: [target.repository],
    firstActions: [target.nextSmallestImprovement],
  };
}

function rowFromTarget(target: P0IslandCoverageTarget): P0IslandCoverageAuditRow {
  const hasExactIslandGate = typeof target.expectedIslandSeeds === 'number';
  const plan = buildP0GazetteerRepositoryPlan(gapForTarget(target), target.rotationRank, new Date('2026-07-01T00:00:00Z'));
  const currentIslandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island').length;
  const currentCapitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital').length;
  const matchingGatePresent = target.requiredGate ? plan.releaseGates.includes(target.requiredGate) : false;
  const overclaimGuardPresent = target.overclaimGuard ? plan.releaseGates.includes(target.overclaimGuard) : true;
  const exactPassing = hasExactIslandGate
    && currentIslandSeeds === target.expectedIslandSeeds
    && matchingGatePresent
    && overclaimGuardPresent;

  return {
    ...target,
    currentIslandSeeds,
    currentCapitalSeeds,
    matchingGatePresent,
    overclaimGuardPresent,
    status: exactPassing ? 'passing' : hasExactIslandGate ? 'partial' : 'deferred',
    residualRisk: exactPassing
      ? 'Island names are source-linked public anchors, but geometry, routing, access, delivery, and private-coordinate layers remain out of scope.'
      : 'Island-level public anchors are not yet complete enough for an all-island claim.',
  };
}

export function buildP0IslandCoverageAudit() {
  const rows = TARGETS.map(rowFromTarget);
  return {
    version: P0_ISLAND_COVERAGE_AUDIT_VERSION,
    generatedAt: '2026-07-01T15:45:16.047Z',
    rows,
    summary: {
      targetCount: rows.length,
      passing: rows.filter(row => row.status === 'passing').length,
      partial: rows.filter(row => row.status === 'partial').length,
      deferred: rows.filter(row => row.status === 'deferred').length,
      completeAllIsland: rows.filter(row => row.mode === 'complete-all-islands' && row.status === 'passing').length,
      completeMainIsland: rows.filter(row => row.mode === 'complete-main-islands' && row.status === 'passing').length,
    },
  };
}

export function selectNextP0IslandExpansionTarget() {
  return buildP0IslandCoverageAudit().rows.find(row => row.status !== 'passing');
}
