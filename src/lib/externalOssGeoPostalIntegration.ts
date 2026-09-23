import { classifyAddressCoveragePolicy, type AddressCoveragePolicy, type AddressCoveragePolicyId } from './addressCoveragePolicy';
import {
  collectOfficialPostalSourceCoverage,
  getPostalSourceRegistry,
  type OfficialPostalSourceCoverageEntry,
  type OfficialPostalSourceCoverageInput,
  type PostalSourceContinent,
  type PostalSourceCoverageStatus,
  type PostalSourceRegistryRecord,
} from './officialPostalSourceCoverage';
import { resolveSourceLicenseStatus } from '../data/sourceLicensePolicy';

export const EXTERNAL_OSS_GEO_POSTAL_INTEGRATION_VERSION = 'external-oss-geo-postal-integration-v1';

export type ExternalOssGeoPostalOperationalClass =
  | 'postal-code-available-reliable-api'
  | 'postal-code-available-weak-api'
  | 'no-postal-code-strong-geo-oss'
  | 'no-postal-code-weak-geo-oss';

export type ExternalOssSourceRole =
  | 'postal'
  | 'address'
  | 'geocoding'
  | 'admin-boundary'
  | 'gazetteer'
  | 'format-standard'
  | 'map-context'
  | 'terrain'
  | 'water'
  | 'natural'
  | 'hazard'
  | 'imagery'
  | 'facility'
  | 'statistics'
  | 'unknown';

export type ExternalOssQueryMode =
  | 'postal-code-first'
  | 'candidate-first'
  | 'coordinate-first'
  | 'manual-first';

export type ExternalOssLoadMode =
  | 'blocking-local'
  | 'on-demand-api'
  | 'background-bulk'
  | 'reference-only'
  | 'disabled-review';

export type ExternalOssGeoPostalCapabilities = {
  postalAutofill: 'strong' | 'candidate' | 'disabled';
  postalValidation: 'strong' | 'format-only' | 'none';
  geoVerification: 'primary' | 'cross-check' | 'manual-support';
  addressCandidateLookup: 'strong' | 'candidate' | 'limited';
  manualFallback: boolean;
  canCacheBulk: boolean;
  canBundleRedistributable: boolean;
};

export type ExternalOssSourcePlan = {
  id: string;
  name: string;
  url: string;
  kind: string;
  role: ExternalOssSourceRole;
  coverage: string;
  usage: string;
  priority: number;
  loadMode: ExternalOssLoadMode;
  licenseLabel: string;
  redistributable: boolean;
  requiresLicenseReview: boolean;
  notes: string[];
};

export type ExternalOssAdapterPolicy = {
  queryMode: ExternalOssQueryMode;
  liveApiDefault: 'enabled' | 'optional' | 'disabled';
  countryPackLoading: 'lazy-by-country';
  externalRequestPrivacy: string[];
  cacheStrategy: {
    postalApiTtlMs: number;
    openReferenceTtlMs: number;
    negativeResultTtlMs: number;
    staleWhileRevalidateMs: number;
  };
};

export type ExternalOssSourceGroups = Record<ExternalOssSourceRole, ExternalOssSourcePlan[]>;

export type ExternalOssGeoPostalIntegrationPlan = {
  version: typeof EXTERNAL_OSS_GEO_POSTAL_INTEGRATION_VERSION;
  countryCode: string;
  countryName: string;
  continent: PostalSourceContinent;
  relativePath: string;
  policy: AddressCoveragePolicy;
  coverageStatus: PostalSourceCoverageStatus;
  operationalClass: ExternalOssGeoPostalOperationalClass;
  capabilities: ExternalOssGeoPostalCapabilities;
  adapterPolicy: ExternalOssAdapterPolicy;
  sources: ExternalOssSourcePlan[];
  sourceGroups: ExternalOssSourceGroups;
  unregisteredSourceIds: string[];
  releaseGates: string[];
  recommendations: string[];
  coverage: OfficialPostalSourceCoverageEntry;
};

export type ExternalOssGeoPostalIntegrationSummary = {
  version: typeof EXTERNAL_OSS_GEO_POSTAL_INTEGRATION_VERSION;
  total: number;
  byOperationalClass: Record<ExternalOssGeoPostalOperationalClass, number>;
  byPolicy: Record<AddressCoveragePolicyId, number>;
  bySourceRole: Record<ExternalOssSourceRole, number>;
  manualRequiredCountryCodes: string[];
  reliablePostalCountryCodes: string[];
  noPostcodeGeoVerifiedCountryCodes: string[];
  licenseReviewCountryCodes: string[];
};

export const EXTERNAL_OSS_SOURCE_ROLES: ExternalOssSourceRole[] = [
  'postal',
  'address',
  'geocoding',
  'admin-boundary',
  'gazetteer',
  'format-standard',
  'map-context',
  'terrain',
  'water',
  'natural',
  'hazard',
  'imagery',
  'facility',
  'statistics',
  'unknown',
];

const POLICY_CLASS: Record<AddressCoveragePolicyId, ExternalOssGeoPostalOperationalClass> = {
  'postal-reliable-api': 'postal-code-available-reliable-api',
  'postal-weak-api': 'postal-code-available-weak-api',
  'no-postal-strong-geo': 'no-postal-code-strong-geo-oss',
  'no-postal-weak-geo': 'no-postal-code-weak-geo-oss',
};

const DEFAULT_CACHE_STRATEGY = {
  postalApiTtlMs: 24 * 60 * 60 * 1000,
  openReferenceTtlMs: 30 * 24 * 60 * 60 * 1000,
  negativeResultTtlMs: 60 * 60 * 1000,
  staleWhileRevalidateMs: 7 * 24 * 60 * 60 * 1000,
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function emptySourceGroups(): ExternalOssSourceGroups {
  return Object.fromEntries(EXTERNAL_OSS_SOURCE_ROLES.map(role => [role, []])) as ExternalOssSourceGroups;
}

function sourceRole(kind: string, sourceId: string): ExternalOssSourceRole {
  if (kind === 'postal-code') return 'postal';
  if (kind === 'address') return 'address';
  if (kind === 'geocoding') return 'geocoding';
  if (kind === 'admin-boundary') return 'admin-boundary';
  if (kind === 'gazetteer') return 'gazetteer';
  if (kind === 'standard') return 'format-standard';
  if (kind === 'map-tile' || kind === 'data-catalog') return 'map-context';
  if (kind === 'elevation' || kind === 'topography' || kind === 'bathymetry') return 'terrain';
  if (kind === 'marine' || kind === 'hydrology' || kind === 'coastline' || kind === 'oceanography') return 'water';
  if (kind === 'land-cover' || kind === 'protected-area' || kind === 'biodiversity' || kind === 'environment' || kind === 'cryosphere') return 'natural';
  if (kind === 'hazard') return 'hazard';
  if (kind === 'imagery' || kind === 'stac-catalog') return 'imagery';
  if (kind === 'facility') return 'facility';
  if (kind === 'statistics') return 'statistics';
  if (/overture|building|venue|poi|facility/i.test(sourceId)) return 'facility';
  return 'unknown';
}

function loadModeForSource(
  source: PostalSourceRegistryRecord,
  role: ExternalOssSourceRole,
  policy: AddressCoveragePolicy,
): ExternalOssLoadMode {
  if (role === 'format-standard') return 'blocking-local';
  if (/terms|review|varies|non-commercial|licensed/i.test(source.license ?? '')) return 'disabled-review';
  if (role === 'postal' && policy.id === 'postal-reliable-api') return 'on-demand-api';
  if (role === 'postal') return 'reference-only';
  if (role === 'address' || role === 'geocoding') return 'on-demand-api';
  if (role === 'admin-boundary' || role === 'terrain' || role === 'water' || role === 'natural' || role === 'imagery') {
    return 'background-bulk';
  }
  return 'reference-only';
}

function sourcePriority(role: ExternalOssSourceRole, source: PostalSourceRegistryRecord, policy: AddressCoveragePolicy) {
  const roleRank: Record<ExternalOssSourceRole, number> = {
    postal: policy.id === 'postal-reliable-api' ? 10 : 30,
    address: 20,
    geocoding: 25,
    'admin-boundary': 35,
    gazetteer: 40,
    'format-standard': 45,
    facility: 50,
    terrain: 60,
    water: 65,
    natural: 70,
    hazard: 75,
    imagery: 80,
    statistics: 85,
    'map-context': 90,
    unknown: 100,
  };
  const usageBonus = source.usage === 'primary' ? -5 : source.usage === 'validation' ? 0 : source.usage === 'fallback' ? 5 : 10;
  return roleRank[role] + usageBonus;
}

function capabilitiesForPolicy(
  policy: AddressCoveragePolicy,
  sources: ExternalOssSourcePlan[],
): ExternalOssGeoPostalCapabilities {
  const canCacheBulk = sources.some(source => source.loadMode === 'background-bulk');
  const canBundleRedistributable = sources.length > 0 && sources.every(source => source.redistributable);
  switch (policy.id) {
    case 'postal-reliable-api':
      return {
        postalAutofill: 'strong',
        postalValidation: 'strong',
        geoVerification: 'cross-check',
        addressCandidateLookup: 'strong',
        manualFallback: false,
        canCacheBulk,
        canBundleRedistributable,
      };
    case 'postal-weak-api':
      return {
        postalAutofill: 'candidate',
        postalValidation: 'format-only',
        geoVerification: 'cross-check',
        addressCandidateLookup: 'candidate',
        manualFallback: true,
        canCacheBulk,
        canBundleRedistributable,
      };
    case 'no-postal-strong-geo':
      return {
        postalAutofill: 'disabled',
        postalValidation: 'none',
        geoVerification: 'primary',
        addressCandidateLookup: 'strong',
        manualFallback: false,
        canCacheBulk,
        canBundleRedistributable,
      };
    case 'no-postal-weak-geo':
      return {
        postalAutofill: 'disabled',
        postalValidation: 'none',
        geoVerification: 'manual-support',
        addressCandidateLookup: 'limited',
        manualFallback: true,
        canCacheBulk,
        canBundleRedistributable,
      };
  }
}

function queryModeForPolicy(policy: AddressCoveragePolicy): ExternalOssQueryMode {
  if (policy.id === 'postal-reliable-api') return 'postal-code-first';
  if (policy.id === 'postal-weak-api') return 'candidate-first';
  if (policy.id === 'no-postal-strong-geo') return 'coordinate-first';
  return 'manual-first';
}

function liveApiDefault(policy: AddressCoveragePolicy): ExternalOssAdapterPolicy['liveApiDefault'] {
  if (policy.id === 'postal-reliable-api') return 'enabled';
  if (policy.id === 'no-postal-weak-geo') return 'disabled';
  return 'optional';
}

function adapterPolicyFor(policy: AddressCoveragePolicy): ExternalOssAdapterPolicy {
  return {
    queryMode: queryModeForPolicy(policy),
    liveApiDefault: liveApiDefault(policy),
    countryPackLoading: 'lazy-by-country',
    externalRequestPrivacy: [
      'Do not send recipient name, phone, room/unit, access code, or delivery notes to public OSS APIs.',
      'Prefer postcode, coarse admin hierarchy, AGID cell, or coordinate bbox before full free-text address queries.',
      'Use server-side connectors with timeout, rate-limit, attribution, and source-specific user-agent policy for public APIs.',
      'Store external responses as normalized evidence with source id, confidence, and timestamp; do not store raw private payloads.',
      'When a source is ODbL or mixed-license, keep attribution and derived database boundaries explicit.',
    ],
    cacheStrategy: { ...DEFAULT_CACHE_STRATEGY },
  };
}

function releaseGatesForPlan(
  policy: AddressCoveragePolicy,
  sources: ExternalOssSourcePlan[],
): string[] {
  return unique([
    'public-source-license-ledger-required',
    'source-attribution-required',
    'no-raw-recipient-to-public-api',
    'country-pack-lazy-load-required',
    'live-api-timeout-rate-limit-and-cache-policy-required',
    sources.some(source => source.requiresLicenseReview) ? 'license-review-before-redistribution' : null,
    policy.id === 'postal-weak-api' ? 'manual-source-of-truth-required-for-weak-postal' : null,
    policy.id === 'no-postal-weak-geo' ? 'manual-confirmation-required-for-weak-geo' : null,
    policy.id === 'postal-reliable-api' ? 'postal-autofill-must-show-source-confidence' : null,
    policy.id === 'no-postal-strong-geo' ? 'geo-verified-must-show-admin-and-coordinate-evidence' : null,
  ].filter(Boolean) as string[]);
}

function recommendationsForPlan(
  policy: AddressCoveragePolicy,
  coverage: OfficialPostalSourceCoverageEntry,
  sources: ExternalOssSourcePlan[],
) {
  const recommendations = [
    coverage.recommendation,
    'Keep external OSS data as evidence and candidates; AGID remains the stable internal identifier.',
  ];
  if (policy.id === 'postal-reliable-api') {
    recommendations.push('Allow postal-code autofill, but display the source name and confidence beside the completed fields.');
  }
  if (policy.id === 'postal-weak-api') {
    recommendations.push('Use postal format checks and locality candidates, but keep manual input as source of truth.');
  }
  if (policy.id === 'no-postal-strong-geo') {
    recommendations.push('Use AGID/coordinates/admin hierarchy and strong open geodata for Geo Verified display.');
  }
  if (policy.id === 'no-postal-weak-geo') {
    recommendations.push('Use AGID and coordinates as the primary identifier and require manual confirmation.');
  }
  if (sources.some(source => source.requiresLicenseReview)) {
    recommendations.push('Keep mixed-license sources out of redistributable country packs until license review passes.');
  }
  if (coverage.countrySpecificOfficialSourceMissing) {
    recommendations.push('Add a country-specific official source before claiming national postal proof.');
  }
  return unique(recommendations);
}

function buildSourcePlan(
  sourceId: string,
  source: PostalSourceRegistryRecord,
  policy: AddressCoveragePolicy,
): ExternalOssSourcePlan {
  const role = sourceRole(source.kind, source.id);
  const licenseStatus = resolveSourceLicenseStatus(source);
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    kind: source.kind,
    role,
    coverage: source.coverage,
    usage: source.usage,
    priority: sourcePriority(role, source, policy),
    loadMode: loadModeForSource(source, role, policy),
    licenseLabel: licenseStatus.label,
    redistributable: licenseStatus.redistributable,
    requiresLicenseReview: licenseStatus.requiresReview,
    notes: [source.notes ?? '', licenseStatus.reason].filter(Boolean),
  };
}

function sortSources(sources: ExternalOssSourcePlan[]) {
  return [...sources].sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

function groupSources(sources: ExternalOssSourcePlan[]) {
  const groups = emptySourceGroups();
  for (const source of sources) {
    groups[source.role].push(source);
  }
  for (const role of EXTERNAL_OSS_SOURCE_ROLES) {
    groups[role] = sortSources(groups[role]);
  }
  return groups;
}

export function buildExternalOssGeoPostalIntegrationPlan(
  input: OfficialPostalSourceCoverageInput,
): ExternalOssGeoPostalIntegrationPlan {
  const [coverage] = collectOfficialPostalSourceCoverage([input]);
  const policy = classifyAddressCoveragePolicy(input.format);
  const registry = getPostalSourceRegistry();
  const unregisteredSourceIds = coverage.sourceIds.filter(sourceId => !registry[sourceId]);
  const sources = sortSources(
    coverage.sourceIds
      .map(sourceId => registry[sourceId] ? buildSourcePlan(sourceId, registry[sourceId], policy) : null)
      .filter((source): source is ExternalOssSourcePlan => Boolean(source)),
  );
  const capabilities = capabilitiesForPolicy(policy, sources);

  return {
    version: EXTERNAL_OSS_GEO_POSTAL_INTEGRATION_VERSION,
    countryCode: coverage.countryCode,
    countryName: coverage.countryName,
    continent: coverage.continent,
    relativePath: coverage.relativePath,
    policy,
    coverageStatus: coverage.status,
    operationalClass: POLICY_CLASS[policy.id],
    capabilities,
    adapterPolicy: adapterPolicyFor(policy),
    sources,
    sourceGroups: groupSources(sources),
    unregisteredSourceIds,
    releaseGates: releaseGatesForPlan(policy, sources),
    recommendations: recommendationsForPlan(policy, coverage, sources),
    coverage,
  };
}

export function buildExternalOssGeoPostalIntegrationPlans(
  inputs: OfficialPostalSourceCoverageInput[],
): ExternalOssGeoPostalIntegrationPlan[] {
  return inputs.map(buildExternalOssGeoPostalIntegrationPlan);
}

export function summarizeExternalOssGeoPostalIntegrationPlans(
  plans: ExternalOssGeoPostalIntegrationPlan[],
): ExternalOssGeoPostalIntegrationSummary {
  const byOperationalClass = Object.fromEntries(
    Object.values(POLICY_CLASS).map(id => [id, 0]),
  ) as Record<ExternalOssGeoPostalOperationalClass, number>;
  const byPolicy = {
    'postal-reliable-api': 0,
    'postal-weak-api': 0,
    'no-postal-strong-geo': 0,
    'no-postal-weak-geo': 0,
  } satisfies Record<AddressCoveragePolicyId, number>;
  const bySourceRole = Object.fromEntries(EXTERNAL_OSS_SOURCE_ROLES.map(role => [role, 0])) as Record<ExternalOssSourceRole, number>;

  for (const plan of plans) {
    byOperationalClass[plan.operationalClass] += 1;
    byPolicy[plan.policy.id] += 1;
    for (const source of plan.sources) {
      bySourceRole[source.role] += 1;
    }
  }

  return {
    version: EXTERNAL_OSS_GEO_POSTAL_INTEGRATION_VERSION,
    total: plans.length,
    byOperationalClass,
    byPolicy,
    bySourceRole,
    manualRequiredCountryCodes: unique(plans
      .filter(plan => plan.capabilities.manualFallback)
      .map(plan => plan.countryCode)).sort(),
    reliablePostalCountryCodes: unique(plans
      .filter(plan => plan.operationalClass === 'postal-code-available-reliable-api')
      .map(plan => plan.countryCode)).sort(),
    noPostcodeGeoVerifiedCountryCodes: unique(plans
      .filter(plan => plan.operationalClass === 'no-postal-code-strong-geo-oss')
      .map(plan => plan.countryCode)).sort(),
    licenseReviewCountryCodes: unique(plans
      .filter(plan => plan.sources.some(source => source.requiresLicenseReview))
      .map(plan => plan.countryCode)).sort(),
  };
}
