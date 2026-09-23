import {
  EUROPE_COUNTRY_AND_TERRITORY_CODES,
  EUROPE_OPEN_GEO_SOURCES,
  getEuropeOpenSourceIds,
  type EuropeCountryOrTerritoryCode,
  type EuropeOpenGeoSource,
  type EuropeOpenGeoSourceId,
} from '../data/europeOpenGeoSources';
import type {
  CountryGeographicMetadataReadinessEvidence,
  GeographicMetadataSourceOrigin,
} from './countryGeographicMetadataEvaluationIndex';

export const EUROPE_GEOGRAPHIC_VALIDATION_PLAN_VERSION = 'europe-geographic-validation-plan-v2';

export type EuropeGeographicSourceRole =
  | 'administrative-boundary'
  | 'locality-gazetteer'
  | 'geocoder'
  | 'address-reference'
  | 'postal-reference'
  | 'addressing-standard';

export type EuropeGeographicReuseStatus =
  | 'open-license-evidenced'
  | 'terms-review-required';

export type EuropeGeographicLoadMode =
  | 'background-metadata-index'
  | 'disabled';

export type EuropeGeographicCapabilityState =
  | 'source-gated'
  | 'candidate-only'
  | 'disabled';

export type EuropeGeographicSourcePlan = {
  id: EuropeOpenGeoSourceId;
  label: string;
  role: EuropeGeographicSourceRole;
  coverage: EuropeOpenGeoSource['coverage'];
  url: string;
  license: string | null;
  reuseStatus: EuropeGeographicReuseStatus;
  loadMode: EuropeGeographicLoadMode;
  sourceVersionStatus: 'record-before-use';
  correctionPathStatus: 'record-before-use';
  privacyMode: 'metadata-only';
  reason: string;
};

export type EuropeGeographicCapability = {
  id:
    | 'administrative-hierarchy'
    | 'locality-aliases'
    | 'cross-script-locality-aliases'
    | 'country-and-territory-scope-aliases'
    | 'postal-candidates'
    | 'delivery-claims';
  state: EuropeGeographicCapabilityState;
  sourceIds: EuropeOpenGeoSourceId[];
  requiredGates: string[];
};

export type EuropeGeographicValidationPlan = {
  planVersion: string;
  countryCode: EuropeCountryOrTerritoryCode;
  geographicScope: 'registry-label-only';
  sourcePlans: EuropeGeographicSourcePlan[];
  sourceComposition: EuropeGeographicSourceComposition;
  capabilities: EuropeGeographicCapability[];
  nonClaims: string[];
  nextActions: string[];
};

export type EuropeGeographicSourceCompositionComponent = {
  sourceId: string;
  sourceOrigin: 'existing-open-source' | 'agid-open-source' | GeographicMetadataSourceOrigin;
  role: 'administrative-metadata' | 'locality-metadata' | 'synthetic-evaluation' | 'country-scoped-metadata';
  reuseStatus: 'open-license-evidenced' | 'project-license-evidenced' | 'approved-country-source';
  privacyMode: 'metadata-only';
};

export type EuropeGeographicSourceComposition = {
  state: 'open-and-agid-source-gated' | 'country-source-attached-source-gated';
  components: EuropeGeographicSourceCompositionComponent[];
  requiredGates: string[];
  deliveryClaimsEnabled: false;
  nonClaim: string;
};

export type EuropeGeographicValidationPlanInput = {
  countrySourceReadiness?: readonly CountryGeographicMetadataReadinessEvidence[];
};

const CORE_SOURCE_IDS: EuropeOpenGeoSourceId[] = [
  'geoboundaries',
  'geonames-gazetteer',
  'geonames-postal',
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'upu-addressing',
];

// Only these sources combine an explicit reusable license with a narrow,
// non-address metadata role in the existing registry. Every national, EU,
// territorial, cadastral, geocoder, and address-register source remains
// disabled until it has its own provenance, rights, version, coverage,
// correction, privacy, and synthetic or aggregate quality evidence.
const APPROVED_BACKGROUND_METADATA_SOURCE_IDS = new Set<EuropeOpenGeoSourceId>([
  'geoboundaries',
  'geonames-gazetteer',
]);

const SOURCE_ROLE_ORDER: Record<EuropeGeographicSourceRole, number> = {
  'administrative-boundary': 1,
  'locality-gazetteer': 2,
  geocoder: 3,
  'address-reference': 4,
  'postal-reference': 5,
  'addressing-standard': 6,
};

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return (EUROPE_COUNTRY_AND_TERRITORY_CODES as readonly string[]).includes(normalized)
    ? normalized as EuropeCountryOrTerritoryCode
    : null;
}

function sourceRole(source: EuropeOpenGeoSource): EuropeGeographicSourceRole | null {
  if (source.kind === 'admin-boundary') return 'administrative-boundary';
  if (source.kind === 'gazetteer') return 'locality-gazetteer';
  if (source.kind === 'geocoding') return 'geocoder';
  if (source.kind === 'address') return 'address-reference';
  if (source.kind === 'postal-code') return 'postal-reference';
  if (source.kind === 'standard') return 'addressing-standard';
  return null;
}

function hasExplicitOpenReuse(source: EuropeOpenGeoSource) {
  return /CC BY(?: 4\.0)?|ODbL|MIT|Apache(?: License)?(?: 2\.0)?|BSD|OGL/i.test(source.license || '');
}

function loadModeFor(
  sourceId: EuropeOpenGeoSourceId,
  role: EuropeGeographicSourceRole,
  reuseStatus: EuropeGeographicReuseStatus,
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
  source: EuropeOpenGeoSource,
  role: EuropeGeographicSourceRole,
  loadMode: EuropeGeographicLoadMode,
) {
  if (role === 'administrative-boundary' || role === 'locality-gazetteer') {
    return loadMode === 'background-metadata-index'
      ? 'Openly licensed metadata may be indexed only as administrative keys and locality aliases after source version, declared coverage, correction path, and synthetic or aggregate quality evidence are recorded; geometry and precise points are excluded.'
      : 'Administrative or locality metadata remains disabled until it has an explicit ingestion profile plus reuse terms, source version, declared coverage, correction path, and synthetic or aggregate quality evidence.';
  }
  if (role === 'geocoder' || role === 'address-reference') {
    return 'Network geocoding and address-reference data are disabled in this metadata-only plan; any future use requires a separate client-controlled ephemeral privacy contract and must not retain raw addresses or precise points.';
  }
  if (role === 'postal-reference') {
    return 'Postal material remains candidate-only until country- or territory-specific reuse, version, coverage, correction, quality, and independent review gates are satisfied.';
  }
  return `${source.name} is retained as addressing-system metadata and does not itself authorize postal lookup, territorial classification, or delivery claims.`;
}

function sourcePlan(sourceId: EuropeOpenGeoSourceId): EuropeGeographicSourcePlan | null {
  const source = EUROPE_OPEN_GEO_SOURCES[sourceId];
  const role = sourceRole(source);
  if (!role) return null;

  const reuseStatus: EuropeGeographicReuseStatus = hasExplicitOpenReuse(source)
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
  id: EuropeGeographicCapability['id'],
  state: EuropeGeographicCapabilityState,
  sourceIds: EuropeOpenGeoSourceId[],
  requiredGates: string[],
): EuropeGeographicCapability {
  return { id, state, sourceIds: unique(sourceIds).sort(), requiredGates };
}

function sourceComposition(
  countryCode: EuropeCountryOrTerritoryCode,
  input: EuropeGeographicValidationPlanInput,
): EuropeGeographicSourceComposition {
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
  const components: EuropeGeographicSourceCompositionComponent[] = [
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
      'cross-script-and-reversible-normalization-policy',
      'neutral-country-and-territory-scope-policy',
      'synthetic-or-aggregate-quality-holdout',
      'separate-postal-and-delivery-evidence',
    ],
    deliveryClaimsEnabled: false,
    nonClaim: 'This composition combines only source metadata and AGID synthetic evaluation fixtures. It does not download or retain source records, establish a postal lookup, validate an address, or claim delivery reachability.',
  };
}

export function isEuropeGeographicValidationCountry(countryCode: string) {
  return normalizeCountryCode(countryCode) !== null;
}

export function buildEuropeGeographicValidationPlan(
  countryCode: string,
  input: EuropeGeographicValidationPlanInput = {},
): EuropeGeographicValidationPlan | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;

  const sourcePlans = unique([
    ...CORE_SOURCE_IDS,
    ...getEuropeOpenSourceIds(code),
  ])
    .map(sourcePlan)
    .filter((plan): plan is EuropeGeographicSourcePlan => plan !== null)
    .sort((left, right) => (
      SOURCE_ROLE_ORDER[left.role] - SOURCE_ROLE_ORDER[right.role]
      || left.id.localeCompare(right.id)
    ));

  const openMetadataSourceIds = (role: EuropeGeographicSourceRole) => sourcePlans
    .filter(source => source.role === role && source.loadMode === 'background-metadata-index')
    .map(source => source.id);
  const postalSourceIds = sourcePlans
    .filter(source => source.role === 'postal-reference' || source.role === 'addressing-standard')
    .map(source => source.id);
  const localitySourceIds = openMetadataSourceIds('locality-gazetteer');

  return {
    planVersion: EUROPE_GEOGRAPHIC_VALIDATION_PLAN_VERSION,
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
        'cross-script-locality-aliases',
        localitySourceIds.length ? 'source-gated' : 'disabled',
        localitySourceIds,
        ['source-license', 'source-version', 'declared-coverage', 'script-ambiguity-policy', 'reversible-normalization', 'synthetic-or-aggregate-quality'],
      ),
      capability(
        'country-and-territory-scope-aliases',
        localitySourceIds.length ? 'source-gated' : 'disabled',
        localitySourceIds,
        ['source-license', 'source-version', 'declared-coverage', 'neutral-scope-policy', 'correction-path', 'synthetic-or-aggregate-quality'],
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
        ['delivery-point-evidence-is-out-of-scope'],
      ),
    ],
    nonClaims: [
      'This plan does not download, retain, or transmit raw addresses, recipient data, building locations, precise coordinates, credentials, or query logs.',
      'Country and territory codes are registry labels only and do not express a sovereignty, territorial, boundary, parent-authority, or recognition determination.',
      'Administrative and locality sources do not establish postal existence, deliverability, identity, jurisdiction, or a transliteration equivalence.',
      'Postal operator, cadastral, and address-register metadata do not authorize postal lookup or delivery claims until all recorded country- or territory-specific gates pass.',
    ],
    nextActions: [
      'record-europe-source-license-version-coverage-and-correction-evidence',
      'index-approved-administrative-keys-and-locality-aliases-without-geometry-or-precise-points',
      'define-country-and-territory-script-ambiguity-and-neutral-scope-policies',
      'run-synthetic-or-aggregate-europe-hierarchy-alias-script-and-scope-holdouts',
      'keep-delivery-claims-disabled',
    ],
  };
}

export function buildAllEuropeGeographicValidationPlans(
  input: EuropeGeographicValidationPlanInput = {},
) {
  return EUROPE_COUNTRY_AND_TERRITORY_CODES
    .map(countryCode => buildEuropeGeographicValidationPlan(countryCode, input))
    .filter((plan): plan is EuropeGeographicValidationPlan => plan !== null);
}
