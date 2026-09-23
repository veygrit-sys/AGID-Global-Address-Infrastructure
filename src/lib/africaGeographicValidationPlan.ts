import {
  AFRICA_COUNTRY_CODES,
  AFRICA_OPEN_GEO_SOURCES,
  getAfricaOpenSourceIds,
  type AfricaCountryCode,
  type AfricaOpenGeoSource,
  type AfricaOpenGeoSourceId,
} from '../data/africaOpenGeoSources';
import type {
  CountryGeographicMetadataReadinessEvidence,
  GeographicMetadataSourceOrigin,
} from './countryGeographicMetadataEvaluationIndex';

export const AFRICA_GEOGRAPHIC_VALIDATION_PLAN_VERSION = 'africa-geographic-validation-plan-v2';

export type AfricaGeographicSourceRole =
  | 'administrative-boundary'
  | 'locality-gazetteer'
  | 'geocoder'
  | 'address-reference'
  | 'postal-reference'
  | 'addressing-standard';

export type AfricaGeographicReuseStatus =
  | 'open-license-evidenced'
  | 'terms-review-required';

export type AfricaGeographicLoadMode =
  | 'background-metadata-index'
  | 'disabled';

export type AfricaGeographicCapabilityState =
  | 'source-gated'
  | 'candidate-only'
  | 'disabled';

export type AfricaGeographicSourcePlan = {
  id: AfricaOpenGeoSourceId;
  label: string;
  role: AfricaGeographicSourceRole;
  coverage: AfricaOpenGeoSource['coverage'];
  url: string;
  license: string | null;
  reuseStatus: AfricaGeographicReuseStatus;
  loadMode: AfricaGeographicLoadMode;
  sourceVersionStatus: 'record-before-use';
  correctionPathStatus: 'record-before-use';
  privacyMode: 'metadata-only';
  reason: string;
};

export type AfricaGeographicCapability = {
  id:
    | 'administrative-hierarchy'
    | 'locality-aliases'
    | 'postal-candidates'
    | 'delivery-claims';
  state: AfricaGeographicCapabilityState;
  sourceIds: AfricaOpenGeoSourceId[];
  requiredGates: string[];
};

export type AfricaGeographicValidationPlan = {
  planVersion: string;
  countryCode: AfricaCountryCode;
  sourcePlans: AfricaGeographicSourcePlan[];
  sourceComposition: AfricaGeographicSourceComposition;
  capabilities: AfricaGeographicCapability[];
  nonClaims: string[];
  nextActions: string[];
};

export type AfricaGeographicSourceCompositionComponent = {
  sourceId: string;
  sourceOrigin: 'existing-open-source' | 'agid-open-source' | GeographicMetadataSourceOrigin;
  role: 'administrative-metadata' | 'locality-metadata' | 'synthetic-evaluation' | 'country-scoped-metadata';
  reuseStatus: 'open-license-evidenced' | 'project-license-evidenced' | 'approved-country-source';
  privacyMode: 'metadata-only';
};

export type AfricaGeographicSourceComposition = {
  state: 'open-and-agid-source-gated' | 'country-source-attached-source-gated';
  components: AfricaGeographicSourceCompositionComponent[];
  requiredGates: string[];
  deliveryClaimsEnabled: false;
  nonClaim: string;
};

export type AfricaGeographicValidationPlanInput = {
  countrySourceReadiness?: readonly CountryGeographicMetadataReadinessEvidence[];
};

const CORE_SOURCE_IDS: AfricaOpenGeoSourceId[] = [
  'geoboundaries',
  'geonames-gazetteer',
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'hot-osm-africa',
  'humdata-africa',
  'upu-addressing',
];

// These two sources have both a concrete metadata role and an explicit open
// license in the registry. Every other source remains disabled until it gains
// its own ingestion profile and provenance gates.
const APPROVED_BACKGROUND_METADATA_SOURCE_IDS = new Set<AfricaOpenGeoSourceId>([
  'geoboundaries',
  'geonames-gazetteer',
]);

const SOURCE_ROLE_ORDER: Record<AfricaGeographicSourceRole, number> = {
  'administrative-boundary': 1,
  'locality-gazetteer': 2,
  geocoder: 3,
  'address-reference': 4,
  'postal-reference': 5,
  'addressing-standard': 6,
};

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return (AFRICA_COUNTRY_CODES as readonly string[]).includes(normalized)
    ? normalized as AfricaCountryCode
    : null;
}

function sourceRole(source: AfricaOpenGeoSource): AfricaGeographicSourceRole | null {
  if (source.kind === 'admin-boundary') return 'administrative-boundary';
  if (source.kind === 'gazetteer') return 'locality-gazetteer';
  if (source.kind === 'geocoding') return 'geocoder';
  if (source.kind === 'address') return 'address-reference';
  if (source.kind === 'postal-code') return 'postal-reference';
  if (source.kind === 'standard') return 'addressing-standard';
  return null;
}

function hasExplicitOpenReuse(source: AfricaOpenGeoSource) {
  return /CC BY(?: 4\.0)?|ODbL/i.test(source.license || '');
}

function loadModeFor(
  sourceId: AfricaOpenGeoSourceId,
  role: AfricaGeographicSourceRole,
  reuseStatus: AfricaGeographicReuseStatus,
) {
  if (
    APPROVED_BACKGROUND_METADATA_SOURCE_IDS.has(sourceId)
    && reuseStatus === 'open-license-evidenced'
    && (role === 'administrative-boundary' || role === 'locality-gazetteer')
  ) {
    return 'background-metadata-index' as const;
  }
  return 'disabled' as const;
}

function reasonFor(
  source: AfricaOpenGeoSource,
  role: AfricaGeographicSourceRole,
  reuseStatus: AfricaGeographicReuseStatus,
  loadMode: AfricaGeographicLoadMode,
) {
  if (role === 'administrative-boundary' || role === 'locality-gazetteer') {
    return loadMode === 'background-metadata-index'
      ? 'Openly licensed geographic metadata may be indexed only after source version, declared coverage, correction path, and synthetic or aggregate quality evidence are recorded.'
      : 'Administrative or locality metadata remains disabled until it has an explicit ingestion profile plus reuse terms, source version, coverage, and correction path evidence.';
  }
  if (role === 'geocoder' || role === 'address-reference') {
    return 'Network geocoding and address-reference data are disabled in this metadata-only plan; any future use requires a separate client-controlled ephemeral privacy contract.';
  }
  if (role === 'postal-reference') {
    return 'Postal material remains candidate-only until country-specific reuse, version, coverage, correction, quality, and independent review gates are satisfied.';
  }
  return `${source.name} is retained as addressing-system metadata and does not itself authorize postal lookup or delivery claims.`;
}

function sourcePlan(sourceId: AfricaOpenGeoSourceId): AfricaGeographicSourcePlan | null {
  const source = AFRICA_OPEN_GEO_SOURCES[sourceId];
  const role = sourceRole(source);
  if (!role) return null;

  const reuseStatus: AfricaGeographicReuseStatus = hasExplicitOpenReuse(source)
    ? 'open-license-evidenced'
    : 'terms-review-required';
  const loadMode = loadModeFor(source.id, role, reuseStatus);
  return {
    id: source.id,
    label: source.name,
    role,
    coverage: source.coverage,
    url: source.url,
    license: source.license || null,
    reuseStatus,
    loadMode,
    sourceVersionStatus: 'record-before-use',
    correctionPathStatus: 'record-before-use',
    privacyMode: 'metadata-only',
    reason: reasonFor(source, role, reuseStatus, loadMode),
  };
}

function unique<T>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function capability(
  id: AfricaGeographicCapability['id'],
  state: AfricaGeographicCapabilityState,
  sourceIds: AfricaOpenGeoSourceId[],
  requiredGates: string[],
): AfricaGeographicCapability {
  return { id, state, sourceIds: unique(sourceIds).sort(), requiredGates };
}

function sourceComposition(
  countryCode: AfricaCountryCode,
  input: AfricaGeographicValidationPlanInput,
): AfricaGeographicSourceComposition {
  const countrySources = (input.countrySourceReadiness || [])
    .filter(source => source.countryCode === countryCode)
    .filter(source => source.approvedAdministrativeKeyCount > 0)
    .filter(source => source.syntheticAdministrativeEvaluationEligible === true)
    .filter(source => source.deliveryClaimsEnabled === false)
    .filter(source => ['official-publication', 'maintained-open-source', 'open-source-composite'].includes(source.sourceOrigin))
    .map(source => ({
      sourceId: source.sourceId,
      sourceOrigin: source.sourceOrigin,
      role: 'country-scoped-metadata' as const,
      reuseStatus: 'approved-country-source' as const,
      privacyMode: 'metadata-only' as const,
    }))
    .filter((source, index, sources) => sources.findIndex(candidate => candidate.sourceId === source.sourceId) === index)
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const components: AfricaGeographicSourceCompositionComponent[] = [
    {
      sourceId: 'geoboundaries',
      sourceOrigin: 'existing-open-source',
      role: 'administrative-metadata',
      reuseStatus: 'open-license-evidenced',
      privacyMode: 'metadata-only',
    },
    {
      sourceId: 'geonames-gazetteer',
      sourceOrigin: 'existing-open-source',
      role: 'locality-metadata',
      reuseStatus: 'open-license-evidenced',
      privacyMode: 'metadata-only',
    },
    {
      sourceId: `agid-synthetic-administrative-evaluation-${countryCode.toLowerCase()}-v1`,
      sourceOrigin: 'agid-open-source',
      role: 'synthetic-evaluation',
      reuseStatus: 'project-license-evidenced',
      privacyMode: 'metadata-only',
    },
    ...countrySources,
  ];

  return {
    state: countrySources.length
      ? 'country-source-attached-source-gated'
      : 'open-and-agid-source-gated',
    components,
    requiredGates: [
      'source-license-and-attribution',
      'source-version-and-freshness',
      'country-or-territory-coverage',
      'source-correction-path',
      'synthetic-or-aggregate-quality-holdout',
      'separate-postal-and-delivery-evidence',
    ],
    deliveryClaimsEnabled: false,
    nonClaim: 'This composition combines only source metadata and AGID synthetic evaluation fixtures. It does not download or retain source records, establish a postal lookup, validate an address, or claim delivery reachability.',
  };
}

export function isAfricaGeographicValidationCountry(countryCode: string) {
  return normalizeCountryCode(countryCode) !== null;
}

export function buildAfricaGeographicValidationPlan(
  countryCode: string,
  input: AfricaGeographicValidationPlanInput = {},
): AfricaGeographicValidationPlan | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;

  const sourcePlans = unique([
    ...CORE_SOURCE_IDS,
    ...getAfricaOpenSourceIds(code),
  ])
    .map(sourcePlan)
    .filter((plan): plan is AfricaGeographicSourcePlan => plan !== null)
    .sort((left, right) => (
      SOURCE_ROLE_ORDER[left.role] - SOURCE_ROLE_ORDER[right.role]
      || left.id.localeCompare(right.id)
    ));

  const openMetadataSourceIds = (role: AfricaGeographicSourceRole) => sourcePlans
    .filter(source => source.role === role && source.loadMode === 'background-metadata-index')
    .map(source => source.id);
  const postalSourceIds = sourcePlans
    .filter(source => source.role === 'postal-reference' || source.role === 'addressing-standard')
    .map(source => source.id);

  return {
    planVersion: AFRICA_GEOGRAPHIC_VALIDATION_PLAN_VERSION,
    countryCode: code,
    sourcePlans,
    sourceComposition: sourceComposition(code, input),
    capabilities: [
      capability(
        'administrative-hierarchy',
        openMetadataSourceIds('administrative-boundary').length ? 'source-gated' : 'disabled',
        openMetadataSourceIds('administrative-boundary'),
        ['source-license', 'source-version', 'declared-coverage', 'correction-path', 'synthetic-or-aggregate-quality'],
      ),
      capability(
        'locality-aliases',
        openMetadataSourceIds('locality-gazetteer').length ? 'source-gated' : 'disabled',
        openMetadataSourceIds('locality-gazetteer'),
        ['source-license', 'source-version', 'declared-coverage', 'correction-path', 'synthetic-or-aggregate-quality'],
      ),
      capability(
        'postal-candidates',
        postalSourceIds.length ? 'candidate-only' : 'disabled',
        postalSourceIds,
        ['country-specific-reuse', 'source-version', 'declared-coverage', 'correction-path', 'independent-quality-attestation'],
      ),
      capability(
        'delivery-claims',
        'disabled',
        [],
        ['delivery-point-evidence-is-out-of-scope'],
      ),
    ],
    nonClaims: [
      'This plan does not download, retain, or transmit raw addresses, recipient data, building locations, precise coordinates, credentials, or query logs.',
      'Administrative and locality sources do not establish postal existence, deliverability, or identity.',
      'Postal operator metadata does not authorize postal lookup or delivery claims until all recorded country-specific gates pass.',
    ],
    nextActions: [
      'record-africa-source-license-version-coverage-and-correction-evidence',
      'index-approved-administrative-keys-without-geometry-or-precise-points',
      'run-synthetic-or-aggregate-africa-hierarchy-and-alias-holdouts',
      'keep-delivery-claims-disabled',
    ],
  };
}

export function buildAllAfricaGeographicValidationPlans(
  input: AfricaGeographicValidationPlanInput = {},
) {
  return AFRICA_COUNTRY_CODES
    .map(countryCode => buildAfricaGeographicValidationPlan(countryCode, input))
    .filter((plan): plan is AfricaGeographicValidationPlan => plan !== null);
}
