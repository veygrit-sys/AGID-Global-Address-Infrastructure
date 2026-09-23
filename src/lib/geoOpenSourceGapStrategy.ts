import type {
  ExternalOssGeoPostalIntegrationPlan,
  ExternalOssSourcePlan,
  ExternalOssSourceRole,
} from './externalOssGeoPostalIntegration';

export const GEO_OSS_GAP_STRATEGY_VERSION = 'geo-open-source-gap-strategy-v1';

export type GeoOssGapPriority = 'P0-critical' | 'P1-high' | 'P2-medium' | 'watch';

export type GeoOssRegionKind =
  | 'country-or-main-region'
  | 'territory'
  | 'disputed-region'
  | 'special-region';

export type GeoOssGapEntry = {
  countryCode: string;
  countryName: string;
  continent: string;
  relativePath: string;
  regionKind: GeoOssRegionKind;
  priority: GeoOssGapPriority;
  operationalClass: string;
  manualFallback: boolean;
  canBundleRedistributable: boolean;
  localCoreRoleCount: number;
  redistributableLocalCoreRoleCount: number;
  missingCoreRoles: ExternalOssSourceRole[];
  presentLocalCoreRoles: ExternalOssSourceRole[];
  reasons: string[];
  proposedOpenSourcePackages: string[];
  firstActions: string[];
};

export type GeoOssGapStrategyReport = {
  version: typeof GEO_OSS_GAP_STRATEGY_VERSION;
  generatedAt: string;
  totalPlans: number;
  gapCount: number;
  byPriority: Record<GeoOssGapPriority, number>;
  byContinent: Record<string, number>;
  entries: GeoOssGapEntry[];
  openSourceBuildStrategy: string[];
};

const CORE_GEO_ROLES: ExternalOssSourceRole[] = [
  'address',
  'geocoding',
  'admin-boundary',
  'gazetteer',
];

const LOCAL_COVERAGE = new Set([
  'country',
  'territory',
  'polar',
  'antarctic',
  'arctic',
  'greenland',
]);

function regionKind(relativePath: string): GeoOssRegionKind {
  if (/disputed/i.test(relativePath)) return 'disputed-region';
  if (/territor|overseas|subantarctic|antarctic/i.test(relativePath)) return 'territory';
  if (/special|enclave|condomini/i.test(relativePath)) return 'special-region';
  return 'country-or-main-region';
}

function isLocalSource(source: ExternalOssSourcePlan) {
  return LOCAL_COVERAGE.has(source.coverage);
}

function localCoreRoles(sources: ExternalOssSourcePlan[]) {
  return CORE_GEO_ROLES.filter(role => sources.some(source => source.role === role && isLocalSource(source)));
}

function redistributableLocalCoreRoles(sources: ExternalOssSourcePlan[]) {
  return CORE_GEO_ROLES.filter(role => sources.some(source => (
    source.role === role &&
    isLocalSource(source) &&
    source.redistributable &&
    !source.requiresLicenseReview
  )));
}

function priorityFor(plan: ExternalOssGeoPostalIntegrationPlan, localCount: number): GeoOssGapPriority {
  if (plan.operationalClass === 'no-postal-code-weak-geo-oss') return 'P0-critical';
  if (plan.capabilities.manualFallback && localCount === 0) return 'P0-critical';
  if (plan.capabilities.manualFallback && localCount <= 1) return 'P1-high';
  if (plan.capabilities.manualFallback || localCount <= 2 || !plan.capabilities.canBundleRedistributable) {
    return 'P2-medium';
  }
  return 'watch';
}

function packageSlug(countryCode: string, suffix: string) {
  return `agid-open-${countryCode.toLowerCase()}-${suffix}`;
}

function proposedPackages(countryCode: string, missing: ExternalOssSourceRole[], plan: ExternalOssGeoPostalIntegrationPlan) {
  const packages: string[] = [];
  if (missing.includes('admin-boundary')) packages.push(packageSlug(countryCode, 'boundaries'));
  if (missing.includes('gazetteer')) packages.push(packageSlug(countryCode, 'gazetteer'));
  if (missing.includes('geocoding')) packages.push(packageSlug(countryCode, 'geocoder-fixtures'));
  if (missing.includes('address')) packages.push(packageSlug(countryCode, 'address-candidates'));
  if (plan.operationalClass.includes('no-postal-code')) packages.push(packageSlug(countryCode, 'no-postcode-grid'));
  if (!plan.capabilities.canBundleRedistributable) packages.push(packageSlug(countryCode, 'license-ledger'));
  return [...new Set(packages)];
}

function reasonsFor(
  plan: ExternalOssGeoPostalIntegrationPlan,
  missing: ExternalOssSourceRole[],
  redistributableLocalCount: number,
) {
  const reasons: string[] = [];
  if (plan.operationalClass === 'no-postal-code-weak-geo-oss') {
    reasons.push('No normal postcode and weak local geodata coverage.');
  }
  if (plan.capabilities.manualFallback) {
    reasons.push('Manual fallback is still required by the current AGID source policy.');
  }
  if (missing.length) {
    reasons.push(`Missing local core geo roles: ${missing.join(', ')}.`);
  }
  if (redistributableLocalCount === 0) {
    reasons.push('No redistributable local core geo source is available in the current catalog.');
  }
  if (!plan.capabilities.canBundleRedistributable) {
    reasons.push('At least one source has mixed/restricted licensing, so redistribution needs review.');
  }
  return reasons;
}

function firstActionsFor(
  plan: ExternalOssGeoPostalIntegrationPlan,
  missing: ExternalOssSourceRole[],
): string[] {
  const actions = [
    'Create a source ledger with URL, license, attribution, update cadence, and redistribution status.',
    'Use synthetic test fixtures first; never publish raw personal recipient addresses.',
  ];

  if (missing.includes('admin-boundary')) {
    actions.push('Draft boundary fixtures from OSM/geoBoundaries/HOT OSM and mark contested boundaries as neutral technical identifiers.');
  }
  if (missing.includes('gazetteer')) {
    actions.push('Build a multilingual gazetteer seed from OSM place nodes, GeoNames, local official names, and alternate names.');
  }
  if (missing.includes('address')) {
    actions.push('Create address-candidate fixtures from public roads, settlements, facilities, and open building/place references.');
  }
  if (missing.includes('geocoding')) {
    actions.push('Add forward/reverse geocoding conformance vectors using coarse AGID cells and public place references.');
  }
  if (plan.operationalClass.includes('no-postal-code')) {
    actions.push('Define an AGID no-postcode fallback grid with administrative hierarchy, settlement/facility name, and coordinate bbox.');
  }

  return actions;
}

export function buildGeoOpenSourceGapStrategyReport(
  plans: ExternalOssGeoPostalIntegrationPlan[],
  now = new Date(),
): GeoOssGapStrategyReport {
  const entries = plans.map((plan): GeoOssGapEntry => {
    const presentLocalCoreRoles = localCoreRoles(plan.sources);
    const redistributableLocalRoles = redistributableLocalCoreRoles(plan.sources);
    const missingCoreRoles = CORE_GEO_ROLES.filter(role => !presentLocalCoreRoles.includes(role));
    const priority = priorityFor(plan, presentLocalCoreRoles.length);

    return {
      countryCode: plan.countryCode,
      countryName: plan.countryName,
      continent: plan.continent,
      relativePath: plan.relativePath,
      regionKind: regionKind(plan.relativePath),
      priority,
      operationalClass: plan.operationalClass,
      manualFallback: plan.capabilities.manualFallback,
      canBundleRedistributable: plan.capabilities.canBundleRedistributable,
      localCoreRoleCount: presentLocalCoreRoles.length,
      redistributableLocalCoreRoleCount: redistributableLocalRoles.length,
      missingCoreRoles,
      presentLocalCoreRoles,
      reasons: reasonsFor(plan, missingCoreRoles, redistributableLocalRoles.length),
      proposedOpenSourcePackages: proposedPackages(plan.countryCode, missingCoreRoles, plan),
      firstActions: firstActionsFor(plan, missingCoreRoles),
    };
  }).filter(entry => entry.priority !== 'watch')
    .sort((left, right) => {
      const priorityOrder: Record<GeoOssGapPriority, number> = {
        'P0-critical': 0,
        'P1-high': 1,
        'P2-medium': 2,
        watch: 3,
      };
      const priorityDelta = priorityOrder[left.priority] - priorityOrder[right.priority];
      if (priorityDelta) return priorityDelta;
      const regionDelta = left.regionKind.localeCompare(right.regionKind);
      if (regionDelta) return regionDelta;
      return left.countryCode.localeCompare(right.countryCode);
    });

  const priorities: GeoOssGapPriority[] = ['P0-critical', 'P1-high', 'P2-medium', 'watch'];
  const byPriority = Object.fromEntries(priorities.map(priority => [
    priority,
    entries.filter(entry => entry.priority === priority).length,
  ])) as Record<GeoOssGapPriority, number>;
  const byContinent: Record<string, number> = {};
  for (const entry of entries) {
    byContinent[entry.continent] = (byContinent[entry.continent] ?? 0) + 1;
  }

  return {
    version: GEO_OSS_GAP_STRATEGY_VERSION,
    generatedAt: now.toISOString(),
    totalPlans: plans.length,
    gapCount: entries.length,
    byPriority,
    byContinent,
    entries,
    openSourceBuildStrategy: [
      'Prioritize no-postcode and weak-geodata countries before ordinary postal-code countries.',
      'Create country or region micro-repositories only when the seed has a source ledger, fixtures, and license policy.',
      'Use AGID cells, admin hierarchy, settlement names, facility names, and coordinate bboxes as the minimum no-postcode fallback.',
      'Keep ODbL, mixed-license, and restricted official sources in separated evidence ledgers; do not merge them into unrestricted datasets.',
      'Require conformance vectors for each package: parse, normalize, candidate lookup, source confidence, and manual fallback behavior.',
      'Publish synthetic fixtures first, then add redistributable open data after license review.',
    ],
  };
}
