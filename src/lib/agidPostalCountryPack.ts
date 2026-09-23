import { encodeAGID } from './agid';
import {
  buildPostalZoneMunicipalityOptionsFromOfficialDataset,
  summarizeOfficialMunicipalityDataset,
  validateOfficialMunicipalityDataset,
  type OfficialMunicipalityDataset,
  type OfficialMunicipalityDatasetSummary,
} from './officialMunicipalityDataset';
import {
  buildPostalZoneDesignerWorkspace,
  listPostalZoneDesignerCountries,
  type PostalZoneDesignerCountryPreset,
  type PostalZoneDesignerMunicipalityOption,
  type PostalZoneDesignerWorkspace,
} from './postalZoneDesigner';
import {
  AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION,
  recommendAgidPostalCountryPack,
  type AgidPostalCountryPackDataLayer,
  type AgidPostalCountryPackRecommendation,
} from './agidPostalCountryPackStrategy';
import { AGID_POSTAL_CODE_ENGINE_VERSION } from './agidPostalCodeEngine';

export const AGID_POSTAL_COUNTRY_PACK_SCHEMA_ID = 'agid-postal-country-pack-v0.1';
export const AGID_POSTAL_COUNTRY_PACK_VERSION = 'agid-postal-country-pack-v0.1';

export type AgidPostalCountryPackSource = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  provider: string;
  licenseOrTerms: string;
  redistributionStatus:
    | 'agid-metadata-redistributable'
    | 'source-metadata-only'
    | 'license-review-required'
    | 'not-bundled';
  role: string;
  transformedFields: string[];
  confidenceNotes: string[];
};

export type AgidPostalCountryPackLicenseEntry = {
  subject: string;
  licenseOrTerms: string;
  redistribution: 'allowed' | 'metadata-only' | 'review-required' | 'not-bundled';
  notes: string;
};

export type AgidPostalCountryPackLocality = {
  localityId: string;
  stableId: string;
  name: string;
  kind: 'municipality' | 'town' | 'block';
  parentId: string | null;
  codePart: string;
  aliases: Array<{
    label: string;
    language: string;
    status: 'preferred' | 'english' | 'romanized' | 'synthetic' | 'historic';
  }>;
};

export type AgidPostalCountryPackAdminBoundary = {
  boundaryId: string;
  localityId: string;
  label: string;
  boundaryClass: 'country' | 'municipality' | 'town' | 'block';
  geometryRef: string;
  sourceId: string;
  precision: 'coarse' | 'planning' | 'official-required';
};

export type AgidPostalCountryPackLandform = {
  landformId: string;
  label: string;
  kind:
    | 'island'
    | 'coastal-corridor'
    | 'harbor'
    | 'market-area'
    | 'mountain'
    | 'desert-corridor'
    | 'delta'
    | 'valley'
    | 'mixed';
  relatedLocalityIds: string[];
  sourceId: string;
};

export type AgidPostalCountryPackSettlementCluster = {
  clusterId: string;
  label: string;
  localityId: string;
  agidCellSeed: string;
  deliveryHints: string[];
  publicPrecision: 'coarse' | 'municipality' | 'town' | 'block';
};

export type AgidPostalCountryPackVplSeed = {
  vplId: string;
  label: string;
  nonAdministrative: true;
  localityId: string;
  codeSeed: string;
  reasons: string[];
  status: 'draft' | 'pilot' | 'active' | 'retired';
};

export type AgidPostalCountryPackPostalPrior = {
  templateId: string;
  visibleFormat: string;
  recommendedUse: AgidPostalCountryPackRecommendation['recommendedUse'];
  rationale: string[];
};

export type AgidPostalCountryPackPlanningCell = {
  cellId: string;
  agid: string;
  localityId: string;
  vplId: string | null;
  centroid: {
    lat: number;
    lng: number;
  };
  codeSeed: string;
  routeBucket: string;
  areaClass: 'urban-core' | 'peri-urban' | 'rural' | 'remote' | 'island' | 'corridor';
  publicPrecision: 'coarse' | 'municipality' | 'town' | 'block';
  sourceId: string;
  noRawAddress: true;
};

export type AgidPostalCountryPackRouteEvidence = {
  routeId: string;
  label: string;
  fromLocalityId: string;
  toLocalityId: string;
  mode: 'road' | 'ferry' | 'port' | 'air' | 'corridor' | 'mixed';
  evidenceRef: string;
  sourceId: string;
  status: 'source-required';
  riskFlags: string[];
};

export type AgidPostalCountryPackQualityEvidence = {
  evidenceId: string;
  subjectId: string;
  subjectType: 'country' | 'municipality' | 'town' | 'planning-cell';
  addressQuality: number;
  boundaryQuality: number;
  routeQuality: number;
  populationQuality: number;
  confidenceBand: 'low' | 'medium' | 'high';
  verificationRequired: true;
  notes: string[];
};

export type AgidPostalCountryPackTestVector = {
  id: string;
  input: {
    countryCode: string;
    municipalityId: string;
    townId: string;
    chomeId: string | null;
  };
  expected: {
    candidateCodePrefix: string | null;
    sameMunicipalityOnly: true;
    containsPersonalData: false;
    replacementBlocked?: boolean;
    blockedReason?: 'mature-postal-country-new-code-replacement-blocked';
    officialPostalPattern?: string;
  };
};

export type AgidPostalCountryPackManifest = {
  schemaId: typeof AGID_POSTAL_COUNTRY_PACK_SCHEMA_ID;
  version: typeof AGID_POSTAL_COUNTRY_PACK_VERSION;
  strategyVersion: typeof AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION;
  engineVersion: typeof AGID_POSTAL_CODE_ENGINE_VERSION;
  generatedAt: string;
  countryCode: string;
  countryName: string;
  repositoryName: string;
  packageName: string;
  requiredLayers: AgidPostalCountryPackDataLayer[];
  containsPersonalData: false;
  containsRawThirdPartyData: false;
  officialStatus: 'simulation' | 'draft' | 'pilot' | 'supplementary' | 'official';
  counts: {
    sources: number;
    localities: number;
    boundaries: number;
    landforms: number;
    settlementClusters: number;
    vplSeeds: number;
    planningCells: number;
    routeEvidence: number;
    qualityEvidence: number;
    officialMunicipalityRecords: number;
    testVectors: number;
  };
};

export type AgidPostalCountryPack = {
  manifest: AgidPostalCountryPackManifest;
  recommendation: AgidPostalCountryPackRecommendation;
  countryProfile: {
    countryCode: string;
    countryName: string;
    region: string;
    terrain: string;
    classHint: string;
    planningCentroid: {
      lat: number;
      lng: number;
    };
    sourceNote: string;
  };
  sourceCatalog: AgidPostalCountryPackSource[];
  licenseLedger: AgidPostalCountryPackLicenseEntry[];
  officialMunicipalitySummary: OfficialMunicipalityDatasetSummary;
  adminBoundaryIndex: AgidPostalCountryPackAdminBoundary[];
  localityIndex: AgidPostalCountryPackLocality[];
  landformIndex: AgidPostalCountryPackLandform[];
  settlementClusterIndex: AgidPostalCountryPackSettlementCluster[];
  vplSeedRegions: AgidPostalCountryPackVplSeed[];
  planningCellIndex: AgidPostalCountryPackPlanningCell[];
  routeEvidenceIndex: AgidPostalCountryPackRouteEvidence[];
  qualityEvidenceIndex: AgidPostalCountryPackQualityEvidence[];
  postalSystemPriors: AgidPostalCountryPackPostalPrior[];
  governanceNotes: string[];
  privacyThreatModel: string[];
  testVectors: AgidPostalCountryPackTestVector[];
};

export type AgidPostalCountryPackValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type AgidPostalCountryPackTargetCountry = {
  countryCode: string;
  countryName: string;
  region: string;
  terrain: string;
  classHint: string;
  repositoryName: string;
  packageName: string;
  recommendationSource: 'strategy' | 'postal-zone-designer-fallback';
};

const DEFAULT_REQUIRED_LAYERS: AgidPostalCountryPackDataLayer[] = [
  'manifest',
  'source-catalog',
  'country-profile',
  'admin-boundary-index',
  'locality-index',
  'locality-alias-history',
  'landform-index',
  'settlement-cluster-index',
  'planning-cell-index',
  'route-evidence-index',
  'quality-evidence-index',
  'postal-system-priors',
  'governance-notes',
  'license-ledger',
  'privacy-threat-model',
  'test-vectors',
];

function stablePackId(...parts: string[]) {
  return parts
    .join(':')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function countryPackRepositoryName(countryCode: string) {
  return `agid-postal-pack-${countryCode.toLowerCase()}`;
}

function isHighRiskCountryPreset(country: PostalZoneDesignerCountryPreset) {
  return /conflict|high-risk|humanitarian|constrained/i.test(country.sourceNote);
}

function fallbackRequiredLayersFor(country: PostalZoneDesignerCountryPreset): AgidPostalCountryPackDataLayer[] {
  const layers = [...DEFAULT_REQUIRED_LAYERS];
  if (country.terrain === 'archipelago') layers.splice(layers.indexOf('postal-system-priors'), 0, 'ports-airports-and-terminals');
  if (country.terrain === 'desert') layers.splice(layers.indexOf('postal-system-priors'), 0, 'road-and-route-corridors');
  if (country.classHint !== 'A' && !layers.includes('vpl-seed-regions')) {
    layers.splice(layers.indexOf('postal-system-priors'), 0, 'vpl-seed-regions');
  }
  return layers;
}

function countryPackRequiredLayers(
  recommendation: AgidPostalCountryPackRecommendation,
): AgidPostalCountryPackDataLayer[] {
  return Array.from(new Set([
    ...recommendation.requiredLayers,
    'planning-cell-index',
    'route-evidence-index',
    'quality-evidence-index',
  ]));
}

function createFallbackRecommendation(
  country: PostalZoneDesignerCountryPreset,
): AgidPostalCountryPackRecommendation {
  const repositoryName = countryPackRepositoryName(country.code);
  const highRisk = isHighRiskCountryPreset(country);
  const maturePostal = country.classHint === 'A';
  const weakPostal = country.classHint === 'B';
  return {
    version: AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION,
    countryCode: country.code,
    countryName: country.name,
    tier: maturePostal
      ? 'mature-reliable-postal-code'
      : weakPostal
        ? 'weak-coarse-postal-code'
        : highRisk
          ? 'fragile-address-infrastructure'
          : 'no-or-not-required-postal-code',
    repositoryMode: 'country-pack-recommended',
    repositoryName,
    packageName: `@agid/${repositoryName}`,
    packWeight: highRisk ? 'thin-pack' : country.terrain === 'archipelago' ? 'light-pack' : 'standard-pack',
    recommendedUse: maturePostal
      ? 'official-postal-reference-pack'
      : weakPostal
        ? 'supplemental-agid-postal-draft'
        : highRisk
          ? 'high-risk-coarse-draft'
          : 'primary-agid-postal-draft',
    requiredLayers: fallbackRequiredLayersFor(country),
    preseededRecords: [
      'country profile: population band, land area band, terrain class, postal maturity class',
      maturePostal
        ? 'official postal format, API/source metadata, and AGID compatibility fixtures without replacing official codes'
        : 'stable locality IDs independent of mutable city-name strings',
      'administrative boundary references and source freshness metadata',
      'landform and route evidence slots appropriate to the country terrain',
      'settlement clusters and VPL seed regions for draft postal-zone design',
      'license ledger for every imported source; third-party raw datasets are not bundled by default',
    ],
    maintenanceRules: [
      'Keep the AGID Postal Forge engine, UI, and core tests in the central repository.',
      'Keep country-specific locality aliases, landforms, source metadata, and VPL seeds in the country pack.',
      'Version every source by provider, license, retrieval date, and transformation script.',
      'Use stable locality IDs; visible names can change without forcing postal code churn.',
      'Run schema, no-raw-address, municipality-separation, and sample code conformance tests before publishing.',
      'Publish generated codes as simulation or draft unless official authority, carrier pilot, privacy, data trust, and transition gates pass.',
    ],
    splitRationale: [
      'Country packs keep the main app small and let operators load only the country they need.',
      'Country experts can maintain local names, landforms, languages, and source notes without touching the core engine.',
      'License risk is isolated because each country pack has its own source catalog and data license ledger.',
    ],
    compatibilityContract: {
      schemaId: AGID_POSTAL_COUNTRY_PACK_SCHEMA_ID,
      enginePackage: '@agid/postal-forge-core',
      countryPackDoesNotContain: [
        'personal-addresses',
        'recipient-names',
        'phone-numbers',
        'private-aoid-bodies',
        'agid-s-payloads',
        'raw-third-party-datasets-without-license',
      ],
    },
  };
}

function findCountryPackTargetCountry(countryCode: string) {
  return listPostalZoneDesignerCountries().find(country => country.code === countryCode) || null;
}

function recommendationForTargetCountry(country: PostalZoneDesignerCountryPreset) {
  return recommendAgidPostalCountryPack(country.code) || createFallbackRecommendation(country);
}

export function listAgidPostalCountryPackTargetCountries(): AgidPostalCountryPackTargetCountry[] {
  return listPostalZoneDesignerCountries().map(country => {
    const strategyRecommendation = recommendAgidPostalCountryPack(country.code);
    const recommendation = strategyRecommendation || createFallbackRecommendation(country);
    return {
      countryCode: country.code,
      countryName: country.name,
      region: country.region,
      terrain: country.terrain,
      classHint: country.classHint,
      repositoryName: recommendation.repositoryName,
      packageName: recommendation.packageName,
      recommendationSource: strategyRecommendation ? 'strategy' : 'postal-zone-designer-fallback',
    };
  });
}

function createAlias(label: string, language = 'en') {
  return {
    label,
    language,
    status: 'preferred' as const,
  };
}

function flattenLocalities(
  countryCode: string,
  municipalities: PostalZoneDesignerMunicipalityOption[],
): AgidPostalCountryPackLocality[] {
  const localities: AgidPostalCountryPackLocality[] = [];
  for (const municipality of municipalities) {
    localities.push({
      localityId: municipality.id,
      stableId: stablePackId(countryCode, 'municipality', municipality.id),
      name: municipality.name,
      kind: 'municipality',
      parentId: null,
      codePart: municipality.codePart,
      aliases: [
        createAlias(municipality.name),
        {
          label: municipality.name.replace('Municipality', 'Postal Area'),
          language: 'en',
          status: 'synthetic',
        },
      ],
    });
    for (const town of municipality.towns) {
      localities.push({
        localityId: town.id,
        stableId: stablePackId(countryCode, 'town', town.id),
        name: town.name,
        kind: 'town',
        parentId: municipality.id,
        codePart: town.codePart,
        aliases: [
          createAlias(town.name),
          {
            label: `${municipality.name} ${town.name}`,
            language: 'en',
            status: 'synthetic',
          },
        ],
      });
      for (const chome of town.chomes) {
        localities.push({
          localityId: chome.id,
          stableId: stablePackId(countryCode, 'block', chome.id),
          name: chome.label,
          kind: 'block',
          parentId: town.id,
          codePart: chome.codePart,
          aliases: [createAlias(chome.label)],
        });
      }
    }
  }
  return localities;
}

function officialDatasetSourceRole(source: OfficialMunicipalityDataset['sourceCatalog'][number]) {
  if (source.sourceId === 'usps-web-tools') {
    return 'credentialed postal authority validation source; metadata only and not bundled';
  }
  if (source.sourceId === 'hud-usps-zip-crosswalk') {
    return 'ZIP-to-geography crosswalk evidence for statistical compatibility checks';
  }
  if (source.sourceId === 'us-census-geocoder') {
    return 'geospatial lookup evidence; raw query and response payloads are not bundled';
  }
  return 'official municipality, locality, boundary, or administrative unit evidence';
}

function officialDatasetTransformedFields(source: OfficialMunicipalityDataset['sourceCatalog'][number]) {
  if (source.sourceId === 'usps-web-tools') {
    return ['sourceId', 'apiRole', 'officialPostalPattern', 'credentialRequirement'];
  }
  if (source.sourceId === 'hud-usps-zip-crosswalk') {
    return ['sourceId', 'crosswalkRole', 'postalGeographyRelation'];
  }
  if (source.sourceId === 'us-census-geocoder') {
    return ['sourceId', 'geographyLookupRole', 'benchmarkRole'];
  }
  return ['officialId', 'name', 'kind', 'parentOfficialId', 'codePart', 'geometryRef'];
}

function officialDatasetConfidenceNotes(source: OfficialMunicipalityDataset['sourceCatalog'][number]) {
  const commonNotes = [...source.notes];
  if (source.sourceId === 'usps-web-tools') {
    return [
      ...commonNotes,
      'USPS is the postal authority path for delivery-point validation; this pack stores source metadata only.',
    ];
  }
  if (source.sourceId === 'hud-usps-zip-crosswalk') {
    return [
      ...commonNotes,
      'Crosswalk evidence helps compare postal and statistical geography, but is not a delivery-point validity claim.',
    ];
  }
  if (source.sourceId === 'us-census-geocoder') {
    return [
      ...commonNotes,
      'Geocoder evidence may support geography compatibility checks, but raw lookup payloads remain outside the pack.',
    ];
  }
  return [
    ...commonNotes,
    'Official municipality records are used as locality planning references, not as a claim of postal-code official status.',
  ];
}

function createSourceCatalog(
  countryCode: string,
  officialMunicipalityDataset: OfficialMunicipalityDataset | null,
): AgidPostalCountryPackSource[] {
  const baseSources: AgidPostalCountryPackSource[] = [
    {
      sourceId: 'agid-synthetic-country-pack-fixtures',
      sourceName: 'AGID-generated country pack fixtures',
      sourceUrl: 'local:AGID',
      provider: 'AGID project',
      licenseOrTerms: 'Apache-2.0 for AGID-created metadata',
      redistributionStatus: 'agid-metadata-redistributable',
      role: 'synthetic locality, VPL seed, and conformance fixtures',
      transformedFields: ['countryCode', 'localityId', 'codePart', 'planningCell', 'routeEvidence', 'qualityEvidence', 'testVector'],
      confidenceNotes: [
        'Contains no personal addresses and no recipient data.',
        'Useful for OSS demos and conformance tests; not official postal authority data.',
      ],
    },
    {
      sourceId: 'official-boundary-required',
      sourceName: `${countryCode} official boundary and locality sources`,
      sourceUrl: 'source-metadata-only:official-authority-required',
      provider: 'government, municipality, postal authority, or carrier pilot authority',
      licenseOrTerms: 'source-specific; not bundled',
      redistributionStatus: 'source-metadata-only',
      role: 'official validation gate before pilot or public release',
      transformedFields: [],
      confidenceNotes: [
        'This pack records the required source slot only.',
        'No official raw boundary, road, population, postal, or address dataset is bundled.',
      ],
    },
    {
      sourceId: 'open-map-evidence-slot',
      sourceName: 'Open map evidence slot',
      sourceUrl: 'source-metadata-only:open-map-provider',
      provider: 'OSM, Overture, Natural Earth, or local open-data provider after license review',
      licenseOrTerms: 'source-specific; license review required',
      redistributionStatus: 'license-review-required',
      role: 'road, landform, port, settlement, and map preview evidence',
      transformedFields: ['featureClass', 'evidenceQuality', 'sourceFreshness'],
      confidenceNotes: [
        'Open map records are not bundled by default.',
        'Any derived database must keep source-specific attribution and redistribution obligations.',
      ],
    },
  ];
  const officialSources: AgidPostalCountryPackSource[] = officialMunicipalityDataset
    ? officialMunicipalityDataset.sourceCatalog.map(source => ({
      sourceId: source.sourceId,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      provider: source.provider,
      licenseOrTerms: source.licenseOrTerms,
      redistributionStatus: source.redistributionStatus === 'allowed'
        ? 'agid-metadata-redistributable'
        : source.redistributionStatus === 'metadata-only'
          ? 'source-metadata-only'
          : source.redistributionStatus === 'review-required'
            ? 'license-review-required'
            : 'not-bundled',
      role: officialDatasetSourceRole(source),
      transformedFields: officialDatasetTransformedFields(source),
      confidenceNotes: officialDatasetConfidenceNotes(source),
    }))
    : [];

  return [...baseSources, ...officialSources];
}

function createLicenseLedger(): AgidPostalCountryPackLicenseEntry[] {
  return [
    {
      subject: 'AGID-created country pack metadata',
      licenseOrTerms: 'Apache-2.0',
      redistribution: 'allowed',
      notes: 'Includes manifest, synthetic locality fixtures, VPL seeds, generated test vectors, and safety rules.',
    },
    {
      subject: 'Official postal, boundary, road, population, and locality datasets',
      licenseOrTerms: 'source-specific',
      redistribution: 'metadata-only',
      notes: 'Do not bundle raw official records unless a separate DATA_LICENSES entry permits redistribution.',
    },
    {
      subject: 'Open map provider extracts',
      licenseOrTerms: 'source-specific',
      redistribution: 'review-required',
      notes: 'OSM, Overture, Natural Earth, GeoNames, and similar data must be reviewed per source before bundling.',
    },
  ];
}

function createAdminBoundaryIndex(localities: AgidPostalCountryPackLocality[]): AgidPostalCountryPackAdminBoundary[] {
  return localities
    .filter(locality => locality.kind !== 'block')
    .map(locality => ({
      boundaryId: stablePackId('boundary', locality.localityId),
      localityId: locality.localityId,
      label: locality.name,
      boundaryClass: locality.kind === 'municipality' ? 'municipality' : 'town',
      geometryRef: `source-required://${locality.localityId}`,
      sourceId: 'official-boundary-required',
      precision: 'official-required',
    }));
}

function createLandformIndex(
  workspace: PostalZoneDesignerWorkspace,
  localityChoices: PostalZoneDesignerMunicipalityOption[],
): AgidPostalCountryPackLandform[] {
  const municipalityIds = localityChoices.map(choice => choice.id);
  if (workspace.country.terrain === 'archipelago') {
    return [
      {
        landformId: stablePackId(workspace.country.code, 'main-island'),
        label: 'Main island delivery area',
        kind: 'island',
        relatedLocalityIds: municipalityIds.slice(0, 1),
        sourceId: 'open-map-evidence-slot',
      },
      {
        landformId: stablePackId(workspace.country.code, 'outer-islands'),
        label: 'Outer island delivery area',
        kind: 'island',
        relatedLocalityIds: municipalityIds.slice(1),
        sourceId: 'open-map-evidence-slot',
      },
      {
        landformId: stablePackId(workspace.country.code, 'harbor-market'),
        label: 'Harbor and market corridor',
        kind: 'harbor',
        relatedLocalityIds: municipalityIds,
        sourceId: 'open-map-evidence-slot',
      },
    ];
  }
  if (workspace.country.terrain === 'desert') {
    return [{
      landformId: stablePackId(workspace.country.code, 'route-corridor'),
      label: 'Road corridor and oasis delivery skeleton',
      kind: 'desert-corridor',
      relatedLocalityIds: municipalityIds,
      sourceId: 'open-map-evidence-slot',
    }];
  }
  return [{
    landformId: stablePackId(workspace.country.code, 'mixed-terrain'),
    label: 'Mixed administrative and settlement terrain',
    kind: 'mixed',
    relatedLocalityIds: municipalityIds,
    sourceId: 'open-map-evidence-slot',
  }];
}

function createSettlementClusters(
  workspace: PostalZoneDesignerWorkspace,
  localityChoices: PostalZoneDesignerMunicipalityOption[],
): AgidPostalCountryPackSettlementCluster[] {
  return localityChoices.flatMap((municipality, municipalityIndex) => (
    municipality.towns.slice(0, 2).map((town, townIndex) => ({
      clusterId: stablePackId(workspace.country.code, 'cluster', municipality.id, town.id),
      label: `${municipality.name} / ${town.name}`,
      localityId: town.id,
      agidCellSeed: `${workspace.country.code}:${municipality.codePart}:${town.codePart}:${municipalityIndex + 1}${townIndex + 1}`,
      deliveryHints: [
        'confirm-official-boundary-before-pilot',
        'keep-visible-code-municipality-scoped',
        workspace.country.terrain === 'archipelago' ? 'check-port-or-ferry-route' : 'check-road-route',
      ],
      publicPrecision: 'town' as const,
    }))
  ));
}

function createVplSeeds(
  workspace: PostalZoneDesignerWorkspace,
  localityChoices: PostalZoneDesignerMunicipalityOption[],
): AgidPostalCountryPackVplSeed[] {
  const codes = workspace.virtualLocalityCodes.codes;
  return localityChoices.slice(0, Math.max(1, Math.min(codes.length, 6))).map((municipality, index) => ({
    vplId: stablePackId(workspace.country.code, 'vpl', String(index + 1)),
    label: `${municipality.name} synthetic postal locality ${index + 1}`,
    nonAdministrative: true,
    localityId: municipality.id,
    codeSeed: codes[index] || `${workspace.country.code}-VPL-${index + 1}`,
    reasons: [
      'reduce-address-ambiguity',
      'support-draft-postal-zone-design',
      workspace.country.terrain === 'archipelago' ? 'separate-island-delivery-context' : 'separate-local-delivery-context',
    ],
    status: 'draft',
  }));
}

function packRecordVolume(workspace: PostalZoneDesignerWorkspace) {
  const populationFactor = Math.ceil(Math.log10(Math.max(10, workspace.country.population)) * 18);
  const terrainFactor = workspace.country.terrain === 'archipelago'
    ? 64
    : workspace.country.terrain === 'desert'
      ? 48
      : workspace.country.terrain === 'mountain'
        ? 42
        : 36;
  const packFactor = workspace.designPlan.classification.class === 'C' ? 72 : 36;
  return Math.max(144, Math.min(384, populationFactor + terrainFactor + packFactor));
}

function coordinateOffset(index: number, axis: 'lat' | 'lng') {
  const ring = Math.floor(index / 16);
  const slot = index % 16;
  const radius = 0.045 + ring * 0.017;
  const angle = ((slot * 22.5) + (axis === 'lat' ? 0 : 11.25)) * Math.PI / 180;
  return Number((Math.sin(angle) * radius).toFixed(6));
}

function areaClassFor(workspace: PostalZoneDesignerWorkspace, index: number): AgidPostalCountryPackPlanningCell['areaClass'] {
  if (workspace.country.terrain === 'archipelago') return index % 5 === 0 ? 'island' : index % 3 === 0 ? 'remote' : 'peri-urban';
  if (workspace.country.terrain === 'desert') return index % 4 === 0 ? 'corridor' : index % 3 === 0 ? 'remote' : 'rural';
  if (workspace.country.terrain === 'mountain') return index % 4 === 0 ? 'remote' : index % 2 === 0 ? 'rural' : 'peri-urban';
  return index % 5 === 0 ? 'urban-core' : index % 3 === 0 ? 'rural' : 'peri-urban';
}

function createPlanningCellIndex(
  workspace: PostalZoneDesignerWorkspace,
  vplSeedRegions: AgidPostalCountryPackVplSeed[],
  localityChoices: PostalZoneDesignerMunicipalityOption[],
): AgidPostalCountryPackPlanningCell[] {
  const townLocalities = localityChoices.flatMap(municipality => municipality.towns);
  const count = packRecordVolume(workspace);
  return Array.from({ length: count }, (_, index) => {
    const municipality = localityChoices[index % localityChoices.length];
    const town = townLocalities[index % townLocalities.length] || municipality.towns[0];
    const vpl = vplSeedRegions[index % Math.max(1, vplSeedRegions.length)] || null;
    const lat = Math.max(-89.9, Math.min(89.9, Number((workspace.country.lat + coordinateOffset(index, 'lat')).toFixed(6))));
    const lng = Number((((workspace.country.lng + coordinateOffset(index, 'lng') + 540) % 360) - 180).toFixed(6));
    return {
      cellId: stablePackId(workspace.country.code, 'planning-cell', String(index + 1).padStart(4, '0')),
      agid: encodeAGID(lat, lng).id,
      localityId: town.id,
      vplId: vpl?.vplId || null,
      centroid: { lat, lng },
      codeSeed: `${workspace.country.code}-${municipality.codePart}-${town.codePart}-${String(index + 1).padStart(3, '0')}`,
      routeBucket: `${workspace.country.code}-route-${String((index % 12) + 1).padStart(2, '0')}`,
      areaClass: areaClassFor(workspace, index),
      publicPrecision: index % 7 === 0 ? 'municipality' : 'town',
      sourceId: 'agid-synthetic-country-pack-fixtures',
      noRawAddress: true,
    };
  });
}

function routeModeFor(workspace: PostalZoneDesignerWorkspace, index: number): AgidPostalCountryPackRouteEvidence['mode'] {
  if (workspace.country.terrain === 'archipelago') return index % 3 === 0 ? 'ferry' : index % 3 === 1 ? 'port' : 'air';
  if (workspace.country.terrain === 'desert') return index % 2 === 0 ? 'corridor' : 'road';
  if (workspace.country.terrain === 'mountain') return index % 3 === 0 ? 'corridor' : 'road';
  return index % 5 === 0 ? 'mixed' : 'road';
}

function createRouteEvidenceIndex(
  workspace: PostalZoneDesignerWorkspace,
  planningCellIndex: AgidPostalCountryPackPlanningCell[],
): AgidPostalCountryPackRouteEvidence[] {
  const count = Math.max(24, Math.min(96, Math.ceil(planningCellIndex.length / 4)));
  return Array.from({ length: count }, (_, index) => {
    const fromCell = planningCellIndex[index % planningCellIndex.length];
    const toCell = planningCellIndex[(index * 7 + 11) % planningCellIndex.length];
    const mode = routeModeFor(workspace, index);
    return {
      routeId: stablePackId(workspace.country.code, 'route-evidence', String(index + 1).padStart(3, '0')),
      label: `${workspace.country.code} ${mode} evidence slot ${index + 1}`,
      fromLocalityId: fromCell.localityId,
      toLocalityId: toCell.localityId,
      mode,
      evidenceRef: `source-required://${workspace.country.code}/route/${String(index + 1).padStart(3, '0')}`,
      sourceId: 'open-map-evidence-slot',
      status: 'source-required',
      riskFlags: [
        mode === 'ferry' || mode === 'port' ? 'weather-or-port-dependency' : 'confirm-road-passability',
        workspace.country.terrain === 'desert' ? 'long-distance-route-review' : 'local-route-review',
      ],
    };
  });
}

function confidenceBand(score: number): AgidPostalCountryPackQualityEvidence['confidenceBand'] {
  if (score >= 0.76) return 'high';
  if (score >= 0.56) return 'medium';
  return 'low';
}

function createQualityEvidenceIndex(
  workspace: PostalZoneDesignerWorkspace,
  planningCellIndex: AgidPostalCountryPackPlanningCell[],
  localityChoices: PostalZoneDesignerMunicipalityOption[],
): AgidPostalCountryPackQualityEvidence[] {
  const municipalityEvidence = localityChoices.map((municipality, index) => {
    const addressQuality = Number(Math.max(0.22, Math.min(0.92, workspace.profile.dataQuality.address - 0.02 + index * 0.006)).toFixed(2));
    const boundaryQuality = Number(Math.max(0.22, Math.min(0.94, workspace.profile.dataQuality.boundary - 0.01 + index * 0.004)).toFixed(2));
    const routeQuality = Number(Math.max(0.2, Math.min(0.9, workspace.profile.dataQuality.road - 0.015 + index * 0.005)).toFixed(2));
    const populationQuality = Number(Math.max(0.2, Math.min(0.9, workspace.profile.dataQuality.population - 0.01 + index * 0.004)).toFixed(2));
    const average = (addressQuality + boundaryQuality + routeQuality + populationQuality) / 4;
    return {
      evidenceId: stablePackId(workspace.country.code, 'quality', municipality.id),
      subjectId: municipality.id,
      subjectType: 'municipality' as const,
      addressQuality,
      boundaryQuality,
      routeQuality,
      populationQuality,
      confidenceBand: confidenceBand(average),
      verificationRequired: true as const,
      notes: [
        'synthetic-planning-quality-slot',
        'replace-with-reviewed-official-or-open-data-before-pilot',
      ],
    };
  });

  const planningEvidence = planningCellIndex
    .filter((_, index) => index % 6 === 0)
    .slice(0, 72)
    .map((cell, index) => {
      const areaPenalty = cell.areaClass === 'remote' ? 0.12 : cell.areaClass === 'corridor' ? 0.08 : 0.03;
      const addressQuality = Number(Math.max(0.18, workspace.profile.dataQuality.address - areaPenalty).toFixed(2));
      const boundaryQuality = Number(Math.max(0.18, workspace.profile.dataQuality.boundary - areaPenalty / 2).toFixed(2));
      const routeQuality = Number(Math.max(0.18, workspace.profile.dataQuality.road - areaPenalty).toFixed(2));
      const populationQuality = Number(Math.max(0.18, workspace.profile.dataQuality.population - areaPenalty / 2).toFixed(2));
      const average = (addressQuality + boundaryQuality + routeQuality + populationQuality) / 4;
      return {
        evidenceId: stablePackId(workspace.country.code, 'quality-cell', String(index + 1).padStart(3, '0')),
        subjectId: cell.cellId,
        subjectType: 'planning-cell' as const,
        addressQuality,
        boundaryQuality,
        routeQuality,
        populationQuality,
        confidenceBand: confidenceBand(average),
        verificationRequired: true as const,
        notes: [
          `area-class:${cell.areaClass}`,
          'no-personal-address-derived-score',
        ],
      };
    });

  return [
    {
      evidenceId: stablePackId(workspace.country.code, 'quality', 'country'),
      subjectId: workspace.country.code,
      subjectType: 'country',
      addressQuality: workspace.profile.dataQuality.address,
      boundaryQuality: workspace.profile.dataQuality.boundary,
      routeQuality: workspace.profile.dataQuality.road,
      populationQuality: workspace.profile.dataQuality.population,
      confidenceBand: confidenceBand(workspace.aiQuality.overallScore),
      verificationRequired: true,
      notes: [
        'country-level-quality-prior',
        'not-a-claim-of-official-postal-completeness',
      ],
    },
    ...municipalityEvidence,
    ...planningEvidence,
  ];
}

function createTestVectors(
  workspace: PostalZoneDesignerWorkspace,
  localityChoices: PostalZoneDesignerMunicipalityOption[],
): AgidPostalCountryPackTestVector[] {
  const generatedVectors: AgidPostalCountryPackTestVector[] = workspace.exampleGeneration.candidates
    .filter(candidate => candidate.code)
    .map((candidate, index) => {
      const municipality = localityChoices[index] || localityChoices[0];
      const town = municipality.towns[index] || municipality.towns[0];
      const chome = town.chomes[index + 1] || town.chomes[0];
      return {
        id: stablePackId(workspace.country.code, 'test-vector', String(index + 1)),
        input: {
          countryCode: workspace.country.code,
          municipalityId: municipality.id,
          townId: town.id,
          chomeId: chome?.id || null,
        },
        expected: {
          candidateCodePrefix: `${workspace.country.code}-`,
          sameMunicipalityOnly: true,
          containsPersonalData: false,
        },
      };
    });

  if (generatedVectors.length > 0 || workspace.designPlan.classification.class !== 'A') {
    return generatedVectors;
  }

  return localityChoices.slice(0, 3).map((municipality, index) => {
    const town = municipality.towns[index] || municipality.towns[0];
    const chome = town.chomes[index + 1] || town.chomes[0];
    return {
      id: stablePackId(workspace.country.code, 'test-vector', 'mature-blocked', String(index + 1)),
      input: {
        countryCode: workspace.country.code,
        municipalityId: municipality.id,
        townId: town.id,
        chomeId: chome?.id || null,
      },
      expected: {
        candidateCodePrefix: null,
        sameMunicipalityOnly: true,
        containsPersonalData: false,
        replacementBlocked: true,
        blockedReason: 'mature-postal-country-new-code-replacement-blocked',
        officialPostalPattern: workspace.country.profileOverrides?.existingPostalPattern,
      },
    };
  });
}

function createPostalPriors(
  recommendation: AgidPostalCountryPackRecommendation,
  workspace: PostalZoneDesignerWorkspace,
): AgidPostalCountryPackPostalPrior[] {
  return workspace.formatOptions.slice(0, 4).map(option => ({
    templateId: option.templateId,
    visibleFormat: option.format,
    recommendedUse: recommendation.recommendedUse,
    rationale: [
      option.description,
      ...option.reasons.slice(0, 2),
    ],
  }));
}

export function buildAgidPostalCountryPack(input: {
  countryCode?: string;
  generatedAt?: string;
  officialMunicipalityDataset?: OfficialMunicipalityDataset | null;
} = {}): AgidPostalCountryPack {
  const countryCode = (input.countryCode || 'FJ').trim().toUpperCase();
  const generatedAt = input.generatedAt || '2026-06-20T00:00:00.000Z';
  const targetCountry = findCountryPackTargetCountry(countryCode);
  if (!targetCountry) {
    const recommendedOnly = recommendAgidPostalCountryPack(countryCode);
    if (recommendedOnly) {
      throw new Error(`AGID Postal Country Pack has no Postal Zone Designer target preset: ${countryCode}`);
    }
    throw new Error(`AGID Postal Country Pack is not supported for unknown country code: ${countryCode}`);
  }
  const recommendation = recommendationForTargetCountry(targetCountry);
  const workspace = buildPostalZoneDesignerWorkspace({ countryCode, now: generatedAt });
  if (workspace.country.code !== countryCode) {
    throw new Error(`AGID Postal Country Pack target mismatch: requested ${countryCode}, got ${workspace.country.code}`);
  }
  const officialMunicipalityDataset = input.officialMunicipalityDataset || null;
  if (officialMunicipalityDataset) {
    const validation = validateOfficialMunicipalityDataset(officialMunicipalityDataset, countryCode);
    if (!validation.valid) {
      throw new Error(`Official municipality dataset for ${countryCode} is invalid: ${validation.errors.join(', ')}`);
    }
  }
  const localityChoices = officialMunicipalityDataset
    ? buildPostalZoneMunicipalityOptionsFromOfficialDataset(officialMunicipalityDataset)
    : workspace.localityChoices;
  const sourceCatalog = createSourceCatalog(countryCode, officialMunicipalityDataset);
  const localityIndex = flattenLocalities(countryCode, localityChoices);
  const adminBoundaryIndex = createAdminBoundaryIndex(localityIndex);
  const landformIndex = createLandformIndex(workspace, localityChoices);
  const settlementClusterIndex = createSettlementClusters(workspace, localityChoices);
  const vplSeedRegions = createVplSeeds(workspace, localityChoices);
  const planningCellIndex = createPlanningCellIndex(workspace, vplSeedRegions, localityChoices);
  const routeEvidenceIndex = createRouteEvidenceIndex(workspace, planningCellIndex);
  const qualityEvidenceIndex = createQualityEvidenceIndex(workspace, planningCellIndex, localityChoices);
  const testVectors = createTestVectors(workspace, localityChoices);

  return {
    manifest: {
      schemaId: AGID_POSTAL_COUNTRY_PACK_SCHEMA_ID,
      version: AGID_POSTAL_COUNTRY_PACK_VERSION,
      strategyVersion: AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION,
      engineVersion: AGID_POSTAL_CODE_ENGINE_VERSION,
      generatedAt,
      countryCode,
      countryName: recommendation.countryName,
      repositoryName: recommendation.repositoryName,
      packageName: recommendation.packageName,
      requiredLayers: countryPackRequiredLayers(recommendation),
      containsPersonalData: false,
      containsRawThirdPartyData: false,
      officialStatus: 'draft',
      counts: {
        sources: sourceCatalog.length,
        localities: localityIndex.length,
        boundaries: adminBoundaryIndex.length,
        landforms: landformIndex.length,
        settlementClusters: settlementClusterIndex.length,
        vplSeeds: vplSeedRegions.length,
        planningCells: planningCellIndex.length,
        routeEvidence: routeEvidenceIndex.length,
        qualityEvidence: qualityEvidenceIndex.length,
        officialMunicipalityRecords: officialMunicipalityDataset?.records.length || 0,
        testVectors: testVectors.length,
      },
    },
    recommendation,
    countryProfile: {
      countryCode,
      countryName: workspace.country.name,
      region: workspace.country.region,
      terrain: workspace.country.terrain,
      classHint: workspace.country.classHint,
      planningCentroid: {
        lat: workspace.country.lat,
        lng: workspace.country.lng,
      },
      sourceNote: workspace.country.sourceNote,
    },
    sourceCatalog,
    licenseLedger: createLicenseLedger(),
    officialMunicipalitySummary: summarizeOfficialMunicipalityDataset(officialMunicipalityDataset, countryCode),
    adminBoundaryIndex,
    localityIndex,
    landformIndex,
    settlementClusterIndex,
    vplSeedRegions,
    planningCellIndex,
    routeEvidenceIndex,
    qualityEvidenceIndex,
    postalSystemPriors: createPostalPriors(recommendation, workspace),
    governanceNotes: [
      'This country pack is not an official postal authority dataset.',
      'Use simulation or draft status until government, municipality, postal authority, or carrier pilot approval is recorded.',
      'Visible postal codes must remain within one municipality and preserve stable locality IDs across renames.',
      'Old-to-new transition mappings are required before split, merge, or reshaping events.',
    ],
    privacyThreatModel: [
      'Do not store personal addresses, recipient names, phone numbers, AOID private bodies, AGID-S payloads, or proof codes in this pack.',
      'Do not publish household-level, sensitive-facility-level, refuge-level, or high-risk precise zones.',
      'Use source metadata and geometry references until redistribution rights are verified.',
      'Use no-raw-address test vectors before publishing pack releases.',
    ],
    testVectors,
  };
}

export function buildAllAgidPostalCountryPacks(input: {
  generatedAt?: string;
} = {}): AgidPostalCountryPack[] {
  return listAgidPostalCountryPackTargetCountries().map(country => (
    buildAgidPostalCountryPack({
      countryCode: country.countryCode,
      generatedAt: input.generatedAt,
    })
  ));
}

export function validateAgidPostalCountryPack(
  pack = buildAgidPostalCountryPack(),
): AgidPostalCountryPackValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const localityIds = new Set<string>();
  const sourceIds = new Set(pack.sourceCatalog.map(source => source.sourceId));

  if (pack.manifest.schemaId !== AGID_POSTAL_COUNTRY_PACK_SCHEMA_ID) errors.push('schema-id-mismatch');
  if (pack.manifest.version !== AGID_POSTAL_COUNTRY_PACK_VERSION) errors.push('version-mismatch');
  if (pack.manifest.countryCode !== pack.countryProfile.countryCode) errors.push('country-code-mismatch');
  if (pack.manifest.containsPersonalData !== false) errors.push('manifest-personal-data-not-false');
  if (pack.manifest.containsRawThirdPartyData !== false) errors.push('manifest-raw-third-party-data-not-false');
  if (pack.manifest.officialStatus === 'official') errors.push('country-pack-claims-official-status');
  if (pack.manifest.counts.localities !== pack.localityIndex.length) errors.push('locality-count-mismatch');
  if (pack.manifest.counts.sources !== pack.sourceCatalog.length) errors.push('source-count-mismatch');
  if (pack.manifest.counts.planningCells !== pack.planningCellIndex.length) errors.push('planning-cell-count-mismatch');
  if (pack.manifest.counts.routeEvidence !== pack.routeEvidenceIndex.length) errors.push('route-evidence-count-mismatch');
  if (pack.manifest.counts.qualityEvidence !== pack.qualityEvidenceIndex.length) errors.push('quality-evidence-count-mismatch');
  if (pack.manifest.counts.officialMunicipalityRecords !== pack.officialMunicipalitySummary.recordCount) {
    errors.push('official-municipality-record-count-mismatch');
  }
  if (pack.manifest.counts.testVectors !== pack.testVectors.length) errors.push('test-vector-count-mismatch');

  for (const source of pack.sourceCatalog) {
    if (!source.sourceId || !source.sourceName || !source.licenseOrTerms) errors.push(`source-missing-required-field:${source.sourceId}`);
    if (source.redistributionStatus !== 'agid-metadata-redistributable' && source.sourceUrl.startsWith('local:')) {
      errors.push(`non-redistributable-local-source:${source.sourceId}`);
    }
  }

  for (const sourceId of pack.officialMunicipalitySummary.sourceIds) {
    if (!sourceIds.has(sourceId)) errors.push(`official-municipality-source-missing:${sourceId}`);
  }

  for (const locality of pack.localityIndex) {
    if (localityIds.has(locality.localityId)) errors.push(`duplicate-locality:${locality.localityId}`);
    localityIds.add(locality.localityId);
    if (!locality.stableId || !locality.codePart) errors.push(`locality-missing-stable-id-or-code:${locality.localityId}`);
    if (locality.parentId && !pack.localityIndex.some(candidate => candidate.localityId === locality.parentId)) {
      errors.push(`locality-parent-missing:${locality.localityId}`);
    }
  }

  for (const boundary of pack.adminBoundaryIndex) {
    if (!localityIds.has(boundary.localityId)) errors.push(`boundary-locality-missing:${boundary.boundaryId}`);
    if (!boundary.geometryRef.startsWith('source-required://')) warnings.push(`boundary-may-bundle-geometry:${boundary.boundaryId}`);
  }

  for (const landform of pack.landformIndex) {
    if (!sourceIds.has(landform.sourceId)) errors.push(`landform-source-missing:${landform.landformId}`);
    for (const localityId of landform.relatedLocalityIds) {
      if (!localityIds.has(localityId)) errors.push(`landform-locality-missing:${landform.landformId}:${localityId}`);
    }
  }

  for (const cluster of pack.settlementClusterIndex) {
    if (!localityIds.has(cluster.localityId)) errors.push(`cluster-locality-missing:${cluster.clusterId}`);
    if (cluster.publicPrecision === 'block') warnings.push(`cluster-public-precision-block-review:${cluster.clusterId}`);
  }

  for (const vpl of pack.vplSeedRegions) {
    if (vpl.nonAdministrative !== true) errors.push(`vpl-not-non-administrative:${vpl.vplId}`);
    if (!localityIds.has(vpl.localityId)) errors.push(`vpl-locality-missing:${vpl.vplId}`);
    if (vpl.status !== 'draft') warnings.push(`vpl-not-draft:${vpl.vplId}`);
  }

  const planningCellIds = new Set<string>();
  for (const cell of pack.planningCellIndex) {
    if (planningCellIds.has(cell.cellId)) errors.push(`duplicate-planning-cell:${cell.cellId}`);
    planningCellIds.add(cell.cellId);
    if (!cell.agid || !cell.codeSeed) errors.push(`planning-cell-missing-id-or-code:${cell.cellId}`);
    if (!localityIds.has(cell.localityId)) errors.push(`planning-cell-locality-missing:${cell.cellId}`);
    if (cell.noRawAddress !== true) errors.push(`planning-cell-raw-address-flag:${cell.cellId}`);
    if (!sourceIds.has(cell.sourceId)) errors.push(`planning-cell-source-missing:${cell.cellId}`);
  }

  for (const route of pack.routeEvidenceIndex) {
    if (!sourceIds.has(route.sourceId)) errors.push(`route-evidence-source-missing:${route.routeId}`);
    if (!localityIds.has(route.fromLocalityId)) errors.push(`route-evidence-from-locality-missing:${route.routeId}`);
    if (!localityIds.has(route.toLocalityId)) errors.push(`route-evidence-to-locality-missing:${route.routeId}`);
    if (route.status !== 'source-required') errors.push(`route-evidence-status-not-source-required:${route.routeId}`);
  }

  for (const evidence of pack.qualityEvidenceIndex) {
    if (evidence.verificationRequired !== true) errors.push(`quality-evidence-verification-not-required:${evidence.evidenceId}`);
    for (const score of [evidence.addressQuality, evidence.boundaryQuality, evidence.routeQuality, evidence.populationQuality]) {
      if (score < 0 || score > 1) errors.push(`quality-evidence-score-out-of-range:${evidence.evidenceId}`);
    }
    if (evidence.subjectType === 'planning-cell' && !planningCellIds.has(evidence.subjectId)) {
      errors.push(`quality-evidence-planning-cell-missing:${evidence.evidenceId}`);
    }
    if ((evidence.subjectType === 'municipality' || evidence.subjectType === 'town') && !localityIds.has(evidence.subjectId)) {
      errors.push(`quality-evidence-locality-missing:${evidence.evidenceId}`);
    }
  }

  for (const vector of pack.testVectors) {
    if (vector.expected.containsPersonalData !== false) errors.push(`test-vector-personal-data:${vector.id}`);
    if (vector.expected.candidateCodePrefix) {
      if (!vector.expected.candidateCodePrefix.startsWith(pack.manifest.countryCode)) {
        errors.push(`test-vector-country-prefix-mismatch:${vector.id}`);
      }
    } else if (
      vector.expected.replacementBlocked !== true
      || vector.expected.blockedReason !== 'mature-postal-country-new-code-replacement-blocked'
    ) {
      errors.push(`test-vector-country-prefix-mismatch:${vector.id}`);
    }
  }

  const privacyText = pack.privacyThreatModel.join(' ').toLowerCase();
  for (const phrase of ['personal addresses', 'phone numbers', 'agid-s payloads']) {
    if (!privacyText.includes(phrase)) errors.push(`privacy-threat-model-missing:${phrase}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
