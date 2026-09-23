import {
  OCEANIA_COUNTRY_AND_TERRITORY_CODES,
  OCEANIA_OPEN_GEO_SOURCES,
  getOceaniaOpenSourceIds,
  type OceaniaCountryOrTerritoryCode,
  type OceaniaOpenGeoSource,
  type OceaniaOpenGeoSourceId,
} from '../data/oceaniaOpenGeoSources';
import type {
  CountryGeographicMetadataReadinessEvidence,
  GeographicMetadataSourceOrigin,
} from './countryGeographicMetadataEvaluationIndex';

export const OCEANIA_GEOGRAPHIC_VALIDATION_PLAN_VERSION = 'oceania-geographic-validation-plan-v2';

export type OceaniaGeographicSourceRole =
  | 'administrative-boundary'
  | 'locality-gazetteer'
  | 'geocoder'
  | 'address-reference'
  | 'postal-reference'
  | 'addressing-standard';

export type OceaniaGeographicReuseStatus =
  | 'open-license-evidenced'
  | 'terms-review-required';

export type OceaniaGeographicLoadMode =
  | 'background-metadata-index'
  | 'disabled';

export type OceaniaGeographicCapabilityState =
  | 'source-gated'
  | 'candidate-only'
  | 'disabled';

export type OceaniaGeographicSourcePlan = {
  id: OceaniaOpenGeoSourceId;
  label: string;
  role: OceaniaGeographicSourceRole;
  coverage: OceaniaOpenGeoSource['coverage'];
  url: string;
  license: string | null;
  reuseStatus: OceaniaGeographicReuseStatus;
  loadMode: OceaniaGeographicLoadMode;
  sourceVersionStatus: 'record-before-use';
  correctionPathStatus: 'record-before-use';
  privacyMode: 'metadata-only';
  reason: string;
};

export type OceaniaGeographicCapability = {
  id:
    | 'administrative-hierarchy'
    | 'locality-aliases'
    | 'island-and-territory-aliases'
    | 'postal-candidates'
    | 'delivery-claims';
  state: OceaniaGeographicCapabilityState;
  sourceIds: OceaniaOpenGeoSourceId[];
  requiredGates: string[];
};

export type OceaniaGeographicValidationPlan = {
  planVersion: string;
  countryCode: OceaniaCountryOrTerritoryCode;
  geographicScope: 'registry-label-only';
  sourcePlans: OceaniaGeographicSourcePlan[];
  sourceComposition: OceaniaGeographicSourceComposition;
  capabilities: OceaniaGeographicCapability[];
  nonClaims: string[];
  nextActions: string[];
};

export type OceaniaGeographicSourceCompositionComponent = {
  sourceId: string;
  sourceOrigin: 'existing-open-source' | 'agid-open-source' | GeographicMetadataSourceOrigin;
  role: 'administrative-metadata' | 'locality-metadata' | 'synthetic-evaluation' | 'country-scoped-metadata';
  reuseStatus: 'open-license-evidenced' | 'project-license-evidenced' | 'approved-country-source';
  privacyMode: 'metadata-only';
};

export type OceaniaGeographicSourceComposition = {
  state: 'open-and-agid-source-gated' | 'country-source-attached-source-gated';
  components: OceaniaGeographicSourceCompositionComponent[];
  requiredGates: string[];
  deliveryClaimsEnabled: false;
  nonClaim: string;
};

export type OceaniaGeographicValidationPlanInput = {
  countrySourceReadiness?: readonly CountryGeographicMetadataReadinessEvidence[];
};

const CORE_SOURCE_IDS: OceaniaOpenGeoSourceId[] = [
  'geoboundaries',
  'geonames-gazetteer',
  'geonames-postal',
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'upu-addressing',
  'zippopotam',
];

// Only these two sources have both a narrow metadata role and an explicit
// reusable license in the existing registry. All national, territorial,
// island, marine, imagery, facility, and address-reference sources need their
// own provenance and privacy gates before any ingestion can occur.
const APPROVED_BACKGROUND_METADATA_SOURCE_IDS = new Set<OceaniaOpenGeoSourceId>([
  'geoboundaries',
  'geonames-gazetteer',
]);

const SOURCE_ROLE_ORDER: Record<OceaniaGeographicSourceRole, number> = {
  'administrative-boundary': 1,
  'locality-gazetteer': 2,
  geocoder: 3,
  'address-reference': 4,
  'postal-reference': 5,
  'addressing-standard': 6,
};

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return (OCEANIA_COUNTRY_AND_TERRITORY_CODES as readonly string[]).includes(normalized)
    ? normalized as OceaniaCountryOrTerritoryCode
    : null;
}

function sourceRole(source: OceaniaOpenGeoSource): OceaniaGeographicSourceRole | null {
  if (source.kind === 'admin-boundary') return 'administrative-boundary';
  if (source.kind === 'gazetteer') return 'locality-gazetteer';
  if (source.kind === 'geocoding') return 'geocoder';
  if (source.kind === 'address') return 'address-reference';
  if (source.kind === 'postal-code') return 'postal-reference';
  if (source.kind === 'standard') return 'addressing-standard';
  return null;
}

function hasExplicitOpenReuse(source: OceaniaOpenGeoSource) {
  return /CC BY(?: 4\.0)?|ODbL|MIT|Apache(?: License)?(?: 2\.0)?|BSD/i.test(source.license || '');
}

function loadModeFor(
  sourceId: OceaniaOpenGeoSourceId,
  role: OceaniaGeographicSourceRole,
  reuseStatus: OceaniaGeographicReuseStatus,
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
  source: OceaniaOpenGeoSource,
  role: OceaniaGeographicSourceRole,
  loadMode: OceaniaGeographicLoadMode,
) {
  if (role === 'administrative-boundary' || role === 'locality-gazetteer') {
    return loadMode === 'background-metadata-index'
      ? 'Openly licensed metadata may be indexed only as administrative keys and island or locality aliases after source version, declared coverage, correction path, and synthetic or aggregate quality evidence are recorded; geometry and precise points are excluded.'
      : 'Administrative or locality metadata remains disabled until it has an explicit ingestion profile plus reuse terms, source version, declared coverage, correction path, and synthetic or aggregate quality evidence.';
  }
  if (role === 'geocoder' || role === 'address-reference') {
    return 'Network geocoding and address-reference data are disabled in this metadata-only plan; any future use requires a separate client-controlled ephemeral privacy contract and must not retain raw addresses or precise points.';
  }
  if (role === 'postal-reference') {
    return 'Postal material remains candidate-only until country- or territory-specific reuse, version, coverage, correction, quality, and independent review gates are satisfied.';
  }
  return `${source.name} is retained as addressing-system metadata and does not itself authorize postal lookup, island routing, or delivery claims.`;
}

function sourcePlan(sourceId: OceaniaOpenGeoSourceId): OceaniaGeographicSourcePlan | null {
  const source = OCEANIA_OPEN_GEO_SOURCES[sourceId];
  const role = sourceRole(source);
  if (!role) return null;

  const reuseStatus: OceaniaGeographicReuseStatus = hasExplicitOpenReuse(source)
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
    reason: reasonFor(source, role, loadMode),
  };
}

function unique<T>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function capability(
  id: OceaniaGeographicCapability['id'],
  state: OceaniaGeographicCapabilityState,
  sourceIds: OceaniaOpenGeoSourceId[],
  requiredGates: string[],
): OceaniaGeographicCapability {
  return { id, state, sourceIds: unique(sourceIds).sort(), requiredGates };
}

function sourceComposition(
  countryCode: OceaniaCountryOrTerritoryCode,
  input: OceaniaGeographicValidationPlanInput,
): OceaniaGeographicSourceComposition {
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
  const components: OceaniaGeographicSourceCompositionComponent[] = [
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
      'island-and-territory-scope-policy',
      'synthetic-or-aggregate-quality-holdout',
      'separate-postal-and-delivery-evidence',
    ],
    deliveryClaimsEnabled: false,
    nonClaim: 'This composition combines only source metadata and AGID synthetic evaluation fixtures. It does not download or retain source records, establish a postal lookup, validate an address, or claim delivery reachability.',
  };
}

export function isOceaniaGeographicValidationCountry(countryCode: string) {
  return normalizeCountryCode(countryCode) !== null;
}

export function buildOceaniaGeographicValidationPlan(
  countryCode: string,
  input: OceaniaGeographicValidationPlanInput = {},
): OceaniaGeographicValidationPlan | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;

  const sourcePlans = unique([
    ...CORE_SOURCE_IDS,
    ...getOceaniaOpenSourceIds(code),
  ])
    .map(sourcePlan)
    .filter((plan): plan is OceaniaGeographicSourcePlan => plan !== null)
    .sort((left, right) => (
      SOURCE_ROLE_ORDER[left.role] - SOURCE_ROLE_ORDER[right.role]
      || left.id.localeCompare(right.id)
    ));

  const openMetadataSourceIds = (role: OceaniaGeographicSourceRole) => sourcePlans
    .filter(source => source.role === role && source.loadMode === 'background-metadata-index')
    .map(source => source.id);
  const postalSourceIds = sourcePlans
    .filter(source => source.role === 'postal-reference' || source.role === 'addressing-standard')
    .map(source => source.id);
  const localitySourceIds = openMetadataSourceIds('locality-gazetteer');

  return {
    planVersion: OCEANIA_GEOGRAPHIC_VALIDATION_PLAN_VERSION,
    countryCode: code,
    geographicScope: 'registry-label-only',
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
        localitySourceIds.length ? 'source-gated' : 'disabled',
        localitySourceIds,
        ['source-license', 'source-version', 'declared-coverage', 'correction-path', 'synthetic-or-aggregate-quality'],
      ),
      capability(
        'island-and-territory-aliases',
        localitySourceIds.length ? 'source-gated' : 'disabled',
        localitySourceIds,
        ['source-license', 'source-version', 'declared-coverage', 'island-scope-policy', 'correction-path', 'synthetic-or-aggregate-quality'],
      ),
      capability(
        'postal-candidates',
        postalSourceIds.length ? 'candidate-only' : 'disabled',
        postalSourceIds,
        ['country-or-territory-specific-reuse', 'source-version', 'declared-coverage', 'correction-path', 'independent-quality-attestation'],
      ),
      capability(
        'delivery-claims',
        'disabled',
        [],
        ['delivery-point-and-route-evidence-is-out-of-scope'],
      ),
    ],
    nonClaims: [
      'This plan does not download, retain, or transmit raw addresses, recipient data, building locations, precise coordinates, credentials, or query logs.',
      'Country and territory codes are registry labels only and do not express a sovereignty, territorial, boundary, maritime, or routing determination.',
      'Island, marine, terrain, imagery, facility, and locality sources do not establish an address, postal existence, transport route, or deliverability.',
      'Postal operator metadata does not authorize postal lookup or delivery claims until all recorded country- or territory-specific gates pass.',
    ],
    nextActions: [
      'record-oceania-source-license-version-coverage-and-correction-evidence',
      'index-approved-administrative-keys-and-island-locality-aliases-without-geometry-or-precise-points',
      'define-country-and-territory-island-scope-policies',
      'run-synthetic-or-aggregate-oceania-hierarchy-alias-and-island-holdouts',
      'keep-delivery-and-routing-claims-disabled',
    ],
  };
}

export function buildAllOceaniaGeographicValidationPlans(
  input: OceaniaGeographicValidationPlanInput = {},
) {
  return OCEANIA_COUNTRY_AND_TERRITORY_CODES
    .map(countryCode => buildOceaniaGeographicValidationPlan(countryCode, input))
    .filter((plan): plan is OceaniaGeographicValidationPlan => plan !== null);
}
