import {
  AMERICAS_COUNTRY_CODES,
  AMERICAS_OPEN_GEO_SOURCES,
  getAmericasOpenSourceIds,
  type AmericasCountryCode,
  type AmericasOpenGeoSource,
  type AmericasOpenGeoSourceId,
} from '../data/americasOpenGeoSources';
import type {
  CountryGeographicMetadataReadinessEvidence,
  GeographicMetadataSourceOrigin,
} from './countryGeographicMetadataEvaluationIndex';

export const AMERICAS_GEOGRAPHIC_VALIDATION_PLAN_VERSION = 'americas-geographic-validation-plan-v2';

export type AmericasGeographicSourceRole =
  | 'administrative-boundary'
  | 'locality-gazetteer'
  | 'geocoder'
  | 'address-reference'
  | 'postal-reference'
  | 'addressing-standard';

export type AmericasGeographicReuseStatus =
  | 'open-license-evidenced'
  | 'terms-review-required';

export type AmericasGeographicLoadMode =
  | 'background-metadata-index'
  | 'disabled';

export type AmericasGeographicCapabilityState =
  | 'source-gated'
  | 'candidate-only'
  | 'disabled';

export type AmericasGeographicSourcePlan = {
  id: AmericasOpenGeoSourceId;
  label: string;
  role: AmericasGeographicSourceRole;
  coverage: AmericasOpenGeoSource['coverage'];
  url: string;
  license: string | null;
  reuseStatus: AmericasGeographicReuseStatus;
  loadMode: AmericasGeographicLoadMode;
  sourceVersionStatus: 'record-before-use';
  correctionPathStatus: 'record-before-use';
  privacyMode: 'metadata-only';
  reason: string;
};

export type AmericasGeographicCapability = {
  id:
    | 'administrative-hierarchy'
    | 'locality-aliases'
    | 'multilingual-locality-aliases'
    | 'island-and-territory-scope-aliases'
    | 'postal-candidates'
    | 'delivery-claims';
  state: AmericasGeographicCapabilityState;
  sourceIds: AmericasOpenGeoSourceId[];
  requiredGates: string[];
};

export type AmericasGeographicValidationPlan = {
  planVersion: string;
  countryCode: AmericasCountryCode;
  geographicScope: 'registry-label-only';
  sourcePlans: AmericasGeographicSourcePlan[];
  sourceComposition: AmericasGeographicSourceComposition;
  capabilities: AmericasGeographicCapability[];
  nonClaims: string[];
  nextActions: string[];
};

export type AmericasGeographicSourceCompositionComponent = {
  sourceId: string;
  sourceOrigin: 'existing-open-source' | 'agid-open-source' | GeographicMetadataSourceOrigin;
  role: 'administrative-metadata' | 'locality-metadata' | 'synthetic-evaluation' | 'country-scoped-metadata';
  reuseStatus: 'open-license-evidenced' | 'project-license-evidenced' | 'approved-country-source';
  privacyMode: 'metadata-only';
};

export type AmericasGeographicSourceComposition = {
  state: 'open-and-agid-source-gated' | 'country-source-attached-source-gated';
  components: AmericasGeographicSourceCompositionComponent[];
  requiredGates: string[];
  deliveryClaimsEnabled: false;
  nonClaim: string;
};

export type AmericasGeographicValidationPlanInput = {
  countrySourceReadiness?: readonly CountryGeographicMetadataReadinessEvidence[];
};

const CORE_SOURCE_IDS: AmericasOpenGeoSourceId[] = [
  'geoboundaries',
  'geonames-gazetteer',
  'geonames-postal',
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'upu-addressing',
  'zippopotam',
];

// Explicit, reusable global metadata is deliberately narrower than the large
// regional source inventory. Country, territory, island, address, postal, and
// geocoder sources must independently prove their terms and privacy boundary.
const APPROVED_BACKGROUND_METADATA_SOURCE_IDS = new Set<AmericasOpenGeoSourceId>([
  'geoboundaries',
  'geonames-gazetteer',
]);

const SOURCE_ROLE_ORDER: Record<AmericasGeographicSourceRole, number> = {
  'administrative-boundary': 1,
  'locality-gazetteer': 2,
  geocoder: 3,
  'address-reference': 4,
  'postal-reference': 5,
  'addressing-standard': 6,
};

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return (AMERICAS_COUNTRY_CODES as readonly string[]).includes(normalized)
    ? normalized as AmericasCountryCode
    : null;
}

function sourceRole(source: AmericasOpenGeoSource): AmericasGeographicSourceRole | null {
  if (source.kind === 'admin-boundary') return 'administrative-boundary';
  if (source.kind === 'gazetteer') return 'locality-gazetteer';
  if (source.kind === 'geocoding') return 'geocoder';
  if (source.kind === 'address') return 'address-reference';
  if (source.kind === 'postal-code') return 'postal-reference';
  if (source.kind === 'standard') return 'addressing-standard';
  return null;
}

function hasExplicitOpenReuse(source: AmericasOpenGeoSource) {
  return /CC BY(?: 4\.0)?|ODbL|MIT|Apache(?: License)?(?: 2\.0)?|BSD|OGL/i.test(source.license || '');
}

function loadModeFor(
  sourceId: AmericasOpenGeoSourceId,
  role: AmericasGeographicSourceRole,
  reuseStatus: AmericasGeographicReuseStatus,
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
  source: AmericasOpenGeoSource,
  role: AmericasGeographicSourceRole,
  loadMode: AmericasGeographicLoadMode,
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

function sourcePlan(sourceId: AmericasOpenGeoSourceId): AmericasGeographicSourcePlan | null {
  const source = AMERICAS_OPEN_GEO_SOURCES[sourceId];
  const role = sourceRole(source);
  if (!role) return null;

  const reuseStatus: AmericasGeographicReuseStatus = hasExplicitOpenReuse(source)
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
  id: AmericasGeographicCapability['id'],
  state: AmericasGeographicCapabilityState,
  sourceIds: AmericasOpenGeoSourceId[],
  requiredGates: string[],
): AmericasGeographicCapability {
  return { id, state, sourceIds: unique(sourceIds).sort(), requiredGates };
}

function sourceComposition(
  countryCode: AmericasCountryCode,
  input: AmericasGeographicValidationPlanInput,
): AmericasGeographicSourceComposition {
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
  const components: AmericasGeographicSourceCompositionComponent[] = [
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
      'language-ambiguity-and-reversible-normalization-policy',
      'neutral-country-and-territory-scope-policy',
      'synthetic-or-aggregate-quality-holdout',
      'separate-postal-and-delivery-evidence',
    ],
    deliveryClaimsEnabled: false,
    nonClaim: 'This composition combines only source metadata and AGID synthetic evaluation fixtures. It does not download or retain source records, establish a postal lookup, validate an address, or claim delivery reachability.',
  };
}

export function isAmericasGeographicValidationCountry(countryCode: string) {
  return normalizeCountryCode(countryCode) !== null;
}

export function buildAmericasGeographicValidationPlan(
  countryCode: string,
  input: AmericasGeographicValidationPlanInput = {},
): AmericasGeographicValidationPlan | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;

  const sourcePlans = unique([
    ...CORE_SOURCE_IDS,
    ...getAmericasOpenSourceIds(code),
  ])
    .map(sourcePlan)
    .filter((plan): plan is AmericasGeographicSourcePlan => plan !== null)
    .sort((left, right) => (
      SOURCE_ROLE_ORDER[left.role] - SOURCE_ROLE_ORDER[right.role]
      || left.id.localeCompare(right.id)
    ));

  const openMetadataSourceIds = (role: AmericasGeographicSourceRole) => sourcePlans
    .filter(source => source.role === role && source.loadMode === 'background-metadata-index')
    .map(source => source.id);
  const postalSourceIds = sourcePlans
    .filter(source => source.role === 'postal-reference' || source.role === 'addressing-standard')
    .map(source => source.id);
  const localitySourceIds = openMetadataSourceIds('locality-gazetteer');

  return {
    planVersion: AMERICAS_GEOGRAPHIC_VALIDATION_PLAN_VERSION,
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
        'multilingual-locality-aliases',
        localitySourceIds.length ? 'source-gated' : 'disabled',
        localitySourceIds,
        ['source-license', 'source-version', 'declared-coverage', 'language-ambiguity-policy', 'reversible-normalization', 'synthetic-or-aggregate-quality'],
      ),
      capability(
        'island-and-territory-scope-aliases',
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
      'Country and territory codes are registry labels only and do not express a sovereignty, territorial, boundary, maritime, parent-authority, or recognition determination.',
      'Administrative, locality, island, language, terrain, and marine sources do not establish postal existence, deliverability, identity, jurisdiction, or a translation equivalence.',
      'Postal operator, cadastral, statistical, and address-register metadata do not authorize postal lookup or delivery claims until all recorded country- or territory-specific gates pass.',
    ],
    nextActions: [
      'record-americas-source-license-version-coverage-and-correction-evidence',
      'index-approved-administrative-keys-and-locality-aliases-without-geometry-or-precise-points',
      'define-country-and-territory-language-ambiguity-and-neutral-scope-policies',
      'run-synthetic-or-aggregate-americas-hierarchy-alias-language-and-scope-holdouts',
      'keep-delivery-claims-disabled',
    ],
  };
}

export function buildAllAmericasGeographicValidationPlans(
  input: AmericasGeographicValidationPlanInput = {},
) {
  return AMERICAS_COUNTRY_CODES
    .map(countryCode => buildAmericasGeographicValidationPlan(countryCode, input))
    .filter((plan): plan is AmericasGeographicValidationPlan => plan !== null);
}
