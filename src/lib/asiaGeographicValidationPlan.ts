import {
  ASIA_COUNTRY_CODES,
  ASIA_OPEN_GEO_SOURCES,
  getAsiaOpenSourceIds,
  type AsiaCountryCode,
  type AsiaOpenGeoSource,
  type AsiaOpenGeoSourceId,
} from '../data/asiaOpenGeoSources';
import type {
  CountryGeographicMetadataReadinessEvidence,
  GeographicMetadataSourceOrigin,
} from './countryGeographicMetadataEvaluationIndex';

export const ASIA_GEOGRAPHIC_VALIDATION_PLAN_VERSION = 'asia-geographic-validation-plan-v2';

export type AsiaGeographicSourceRole =
  | 'administrative-boundary'
  | 'locality-gazetteer'
  | 'geocoder'
  | 'address-reference'
  | 'postal-reference'
  | 'addressing-standard';

export type AsiaGeographicReuseStatus =
  | 'open-license-evidenced'
  | 'terms-review-required';

export type AsiaGeographicLoadMode =
  | 'background-metadata-index'
  | 'disabled';

export type AsiaGeographicCapabilityState =
  | 'source-gated'
  | 'candidate-only'
  | 'disabled';

export type AsiaGeographicSourcePlan = {
  id: AsiaOpenGeoSourceId;
  label: string;
  role: AsiaGeographicSourceRole;
  coverage: AsiaOpenGeoSource['coverage'];
  url: string;
  license: string | null;
  reuseStatus: AsiaGeographicReuseStatus;
  loadMode: AsiaGeographicLoadMode;
  sourceVersionStatus: 'record-before-use';
  correctionPathStatus: 'record-before-use';
  privacyMode: 'metadata-only';
  reason: string;
};

export type AsiaGeographicCapability = {
  id:
    | 'administrative-hierarchy'
    | 'locality-aliases'
    | 'script-aware-locality-aliases'
    | 'postal-candidates'
    | 'delivery-claims';
  state: AsiaGeographicCapabilityState;
  sourceIds: AsiaOpenGeoSourceId[];
  requiredGates: string[];
};

export type AsiaGeographicValidationPlan = {
  planVersion: string;
  countryCode: AsiaCountryCode;
  geographicScope: 'registry-label-only';
  sourcePlans: AsiaGeographicSourcePlan[];
  sourceComposition: AsiaGeographicSourceComposition;
  capabilities: AsiaGeographicCapability[];
  nonClaims: string[];
  nextActions: string[];
};

export type AsiaGeographicSourceCompositionComponent = {
  sourceId: string;
  sourceOrigin: 'existing-open-source' | 'agid-open-source' | GeographicMetadataSourceOrigin;
  role: 'administrative-metadata' | 'locality-metadata' | 'synthetic-evaluation' | 'country-scoped-metadata';
  reuseStatus: 'open-license-evidenced' | 'project-license-evidenced' | 'approved-country-source';
  privacyMode: 'metadata-only';
};

export type AsiaGeographicSourceComposition = {
  state: 'open-and-agid-source-gated' | 'country-source-attached-source-gated';
  components: AsiaGeographicSourceCompositionComponent[];
  requiredGates: string[];
  deliveryClaimsEnabled: false;
  nonClaim: string;
};

export type AsiaGeographicValidationPlanInput = {
  countrySourceReadiness?: readonly CountryGeographicMetadataReadinessEvidence[];
};

const CORE_SOURCE_IDS: AsiaOpenGeoSourceId[] = [
  'geoboundaries',
  'geonames-gazetteer',
  'geonames-postal',
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'upu-addressing',
];

// Only the two global sources below have both a narrow metadata use and an
// explicit reusable license in the existing registry. Country-specific sources
// remain disabled until their own ingestion profile proves terms, provenance,
// version, coverage, correction route, and synthetic or aggregate quality.
const APPROVED_BACKGROUND_METADATA_SOURCE_IDS = new Set<AsiaOpenGeoSourceId>([
  'geoboundaries',
  'geonames-gazetteer',
]);

const SOURCE_ROLE_ORDER: Record<AsiaGeographicSourceRole, number> = {
  'administrative-boundary': 1,
  'locality-gazetteer': 2,
  geocoder: 3,
  'address-reference': 4,
  'postal-reference': 5,
  'addressing-standard': 6,
};

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return (ASIA_COUNTRY_CODES as readonly string[]).includes(normalized)
    ? normalized as AsiaCountryCode
    : null;
}

function sourceRole(source: AsiaOpenGeoSource): AsiaGeographicSourceRole | null {
  if (source.kind === 'admin-boundary') return 'administrative-boundary';
  if (source.kind === 'gazetteer') return 'locality-gazetteer';
  if (source.kind === 'geocoding') return 'geocoder';
  if (source.kind === 'address') return 'address-reference';
  if (source.kind === 'postal-code') return 'postal-reference';
  if (source.kind === 'standard') return 'addressing-standard';
  return null;
}

function hasExplicitOpenReuse(source: AsiaOpenGeoSource) {
  return /CC BY(?: 4\.0)?|ODbL|MIT|Apache(?: License)?(?: 2\.0)?|BSD/i.test(source.license || '');
}

function loadModeFor(
  sourceId: AsiaOpenGeoSourceId,
  role: AsiaGeographicSourceRole,
  reuseStatus: AsiaGeographicReuseStatus,
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
  source: AsiaOpenGeoSource,
  role: AsiaGeographicSourceRole,
  loadMode: AsiaGeographicLoadMode,
) {
  if (role === 'administrative-boundary' || role === 'locality-gazetteer') {
    return loadMode === 'background-metadata-index'
      ? 'Openly licensed geographic metadata may be indexed only as administrative keys and locality aliases after source version, declared coverage, correction path, and synthetic or aggregate quality evidence are recorded; geometry and precise points are excluded.'
      : 'Administrative or locality metadata remains disabled until it has an explicit ingestion profile plus reuse terms, source version, declared coverage, correction path, and synthetic or aggregate quality evidence.';
  }
  if (role === 'geocoder' || role === 'address-reference') {
    return 'Network geocoding and address-reference data are disabled in this metadata-only plan; any future use requires a separate client-controlled ephemeral privacy contract and must not retain raw addresses or precise points.';
  }
  if (role === 'postal-reference') {
    return 'Postal material remains candidate-only until country-specific reuse, version, coverage, correction, quality, and independent review gates are satisfied.';
  }
  return `${source.name} is retained as addressing-system metadata and does not itself authorize postal lookup or delivery claims.`;
}

function sourcePlan(sourceId: AsiaOpenGeoSourceId): AsiaGeographicSourcePlan | null {
  const source = ASIA_OPEN_GEO_SOURCES[sourceId];
  const role = sourceRole(source);
  if (!role) return null;

  const reuseStatus: AsiaGeographicReuseStatus = hasExplicitOpenReuse(source)
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
  id: AsiaGeographicCapability['id'],
  state: AsiaGeographicCapabilityState,
  sourceIds: AsiaOpenGeoSourceId[],
  requiredGates: string[],
): AsiaGeographicCapability {
  return { id, state, sourceIds: unique(sourceIds).sort(), requiredGates };
}

function sourceComposition(
  countryCode: AsiaCountryCode,
  input: AsiaGeographicValidationPlanInput,
): AsiaGeographicSourceComposition {
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
  const components: AsiaGeographicSourceCompositionComponent[] = [
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
      'script-ambiguity-and-reversible-normalization-policy',
      'synthetic-or-aggregate-quality-holdout',
      'separate-postal-and-delivery-evidence',
    ],
    deliveryClaimsEnabled: false,
    nonClaim: 'This composition combines only source metadata and AGID synthetic evaluation fixtures. It does not download or retain source records, establish a postal lookup, validate an address, or claim delivery reachability.',
  };
}

export function isAsiaGeographicValidationCountry(countryCode: string) {
  return normalizeCountryCode(countryCode) !== null;
}

export function buildAsiaGeographicValidationPlan(
  countryCode: string,
  input: AsiaGeographicValidationPlanInput = {},
): AsiaGeographicValidationPlan | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;

  const sourcePlans = unique([
    ...CORE_SOURCE_IDS,
    ...getAsiaOpenSourceIds(code),
  ])
    .map(sourcePlan)
    .filter((plan): plan is AsiaGeographicSourcePlan => plan !== null)
    .sort((left, right) => (
      SOURCE_ROLE_ORDER[left.role] - SOURCE_ROLE_ORDER[right.role]
      || left.id.localeCompare(right.id)
    ));

  const openMetadataSourceIds = (role: AsiaGeographicSourceRole) => sourcePlans
    .filter(source => source.role === role && source.loadMode === 'background-metadata-index')
    .map(source => source.id);
  const postalSourceIds = sourcePlans
    .filter(source => source.role === 'postal-reference' || source.role === 'addressing-standard')
    .map(source => source.id);
  const localitySourceIds = openMetadataSourceIds('locality-gazetteer');

  return {
    planVersion: ASIA_GEOGRAPHIC_VALIDATION_PLAN_VERSION,
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
        'script-aware-locality-aliases',
        localitySourceIds.length ? 'source-gated' : 'disabled',
        localitySourceIds,
        ['source-license', 'source-version', 'declared-coverage', 'script-ambiguity-policy', 'reversible-normalization', 'synthetic-or-aggregate-quality'],
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
      'Country codes are registry labels only and do not express a sovereignty, territorial, or boundary determination.',
      'Administrative and locality sources do not establish postal existence, deliverability, identity, or a transliteration equivalence.',
      'Postal operator metadata does not authorize postal lookup or delivery claims until all recorded country-specific gates pass.',
    ],
    nextActions: [
      'record-asia-source-license-version-coverage-and-correction-evidence',
      'index-approved-administrative-keys-and-locality-aliases-without-geometry-or-precise-points',
      'define-country-script-ambiguity-and-reversible-normalization-policies',
      'run-synthetic-or-aggregate-asia-hierarchy-alias-and-script-holdouts',
      'keep-delivery-claims-disabled',
    ],
  };
}

export function buildAllAsiaGeographicValidationPlans(
  input: AsiaGeographicValidationPlanInput = {},
) {
  return ASIA_COUNTRY_CODES
    .map(countryCode => buildAsiaGeographicValidationPlan(countryCode, input))
    .filter((plan): plan is AsiaGeographicValidationPlan => plan !== null);
}
