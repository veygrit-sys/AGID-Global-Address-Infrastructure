import {
  AGID_POSTAL_CODE_ENGINE_VERSION,
  AGID_POSTAL_CREATION_AI_NAME,
  AGID_POSTAL_CREATION_AI_VERSION,
  AGID_POSTAL_CREATION_SYSTEM_NAME,
  AGID_POSTAL_TARGET_COUNTRIES,
  AGID_POSTAL_TEMPLATES,
  buildAgidPostalCountryProfiles,
  buildAgidPostalGenerationPolicy,
  classifyAgidPostalCountry,
  learnAgidPostalCountryDesign,
  type AgidPostalCountryClass,
  type AgidPostalCountryProfile,
  type AgidPostalGenerationPolicy,
  type AgidPostalGenerationMode,
  type AgidPostalLearningMode,
  type AgidPostalLearningUse,
  type AgidPostalTemplateId,
} from './agidPostalCodeEngine';

export const AGID_POSTAL_FORGE_OSS_DATASET_PACK_VERSION =
  'agid-postal-forge-oss-dataset-pack-v0.1';

export type AgidPostalForgeRedistributionStatus =
  | 'agid-metadata-redistributable'
  | 'source-metadata-only'
  | 'license-review-required'
  | 'not-bundled';

export type AgidPostalForgeDatasetFile = {
  path: string;
  role:
    | 'manifest'
    | 'generated-pack'
    | 'source-catalog'
    | 'quality-gates'
    | 'sample-profile-overrides'
    | 'documentation';
  mediaType: 'application/json' | 'text/markdown';
  licenseOrTerms: 'Apache-2.0' | 'CC0' | 'DATA-LICENSES' | 'source-specific';
  containsThirdPartyData: boolean;
  containsPersonalData: false;
};

export type AgidPostalForgeSourceRecord = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  provider: string;
  coverageRegion: string;
  licenseOrTerms: string;
  redistributionStatus: AgidPostalForgeRedistributionStatus;
  allowedUse: string[];
  transformedFields: string[];
  freshness: string;
  confidenceNotes: string[];
};

export type AgidPostalForgeTemplateRecord = {
  templateId: AgidPostalTemplateId;
  label: string;
  basedOn: string;
  format: string;
  hierarchyDepth: number;
  defaultLength: number;
  bestFor: string[];
  ossUse: 'design-prior' | 'primary-template-candidate' | 'supplemental-template-candidate';
  cautions: string[];
};

export type AgidPostalForgeCountryReadinessRecord = {
  countryCode: string;
  countryName: string;
  region: string;
  class: AgidPostalCountryClass;
  generationMode: AgidPostalGenerationMode;
  allowed: boolean;
  recommendedUse:
    | 'existing-postal-only'
    | 'supplemental-agid-postal-draft'
    | 'primary-agid-postal-draft';
  generationPolicy: AgidPostalGenerationPolicy;
  learningMode: AgidPostalLearningMode;
  allowedLearningUse: AgidPostalLearningUse;
  generationBlockedByMaturePostalSystem: boolean;
  terrain: string;
  populationBand: string;
  areaBand: string;
  countryScale: string;
  densityPerKm2: number | null;
  recommendedTemplateId: AgidPostalTemplateId;
  observedFactors: string[];
  sources: string[];
  basis: string[];
  governanceStatus: 'not-official' | 'pilot-required' | 'official-source-required';
  publicationStatus: 'simulation-only' | 'draft-only' | 'supplementary-only';
  privacyDefaults: string[];
};

export type AgidPostalForgeQualityGate = {
  id: string;
  label: string;
  gateType:
    | 'license'
    | 'governance'
    | 'privacy'
    | 'data-trust'
    | 'collision'
    | 'readability'
    | 'migration'
    | 'territory-boundary';
  requiredFor: Array<'simulation' | 'draft' | 'pilot' | 'supplementary' | 'official'>;
  rule: string;
  failureAction: 'block' | 'draft-only' | 'review-required';
};

export type AgidPostalForgeDatasetPackManifest = {
  packId: 'agid-postal-forge-oss-dataset-pack';
  version: typeof AGID_POSTAL_FORGE_OSS_DATASET_PACK_VERSION;
  engineVersion: typeof AGID_POSTAL_CODE_ENGINE_VERSION;
  systemName: typeof AGID_POSTAL_CREATION_SYSTEM_NAME;
  aiName: typeof AGID_POSTAL_CREATION_AI_NAME;
  aiVersion: typeof AGID_POSTAL_CREATION_AI_VERSION;
  generatedAt: string;
  licenseOrTerms: 'Apache-2.0 for AGID metadata; source-specific for referenced datasets';
  redistributionPolicy: string;
  files: AgidPostalForgeDatasetFile[];
  counts: {
    countries: number;
    classA: number;
    classB: number;
    classC: number;
    templates: number;
    sourceRecords: number;
    qualityGates: number;
  };
};

export type AgidPostalForgeOssDatasetPack = {
  manifest: AgidPostalForgeDatasetPackManifest;
  sources: AgidPostalForgeSourceRecord[];
  templates: AgidPostalForgeTemplateRecord[];
  countries: AgidPostalForgeCountryReadinessRecord[];
  qualityGates: AgidPostalForgeQualityGate[];
  privacyRules: string[];
  consumerRules: string[];
};

export type AgidPostalForgeDatasetPackValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const AGID_POSTAL_FORGE_OSS_DATASET_FILES: AgidPostalForgeDatasetFile[] = [
  {
    path: 'data/postal_forge_oss/manifest.json',
    role: 'manifest',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsThirdPartyData: false,
    containsPersonalData: false,
  },
  {
    path: 'data/postal_forge_oss/agid-postal-forge-oss-dataset-pack.json',
    role: 'generated-pack',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsThirdPartyData: false,
    containsPersonalData: false,
  },
  {
    path: 'data/postal_forge_oss/source-catalog.json',
    role: 'source-catalog',
    mediaType: 'application/json',
    licenseOrTerms: 'DATA-LICENSES',
    containsThirdPartyData: false,
    containsPersonalData: false,
  },
  {
    path: 'data/postal_forge_oss/quality-gates.json',
    role: 'quality-gates',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsThirdPartyData: false,
    containsPersonalData: false,
  },
  {
    path: 'data/postal_forge_oss/country-profile-overrides.sample.json',
    role: 'sample-profile-overrides',
    mediaType: 'application/json',
    licenseOrTerms: 'CC0',
    containsThirdPartyData: false,
    containsPersonalData: false,
  },
  {
    path: 'data/postal_forge_oss/README.md',
    role: 'documentation',
    mediaType: 'text/markdown',
    licenseOrTerms: 'Apache-2.0',
    containsThirdPartyData: false,
    containsPersonalData: false,
  },
];

export const AGID_POSTAL_FORGE_SOURCE_CATALOG: AgidPostalForgeSourceRecord[] = [
  {
    sourceId: 'agid-postal-forge-user-supplied-upu-2025-not-required-list',
    sourceName: 'UPU 2025 postal-code-not-required country list supplied by project owner',
    sourceUrl: 'https://www.upu.int/',
    provider: 'Universal Postal Union / user-supplied project note',
    coverageRegion: 'selected countries and territories',
    licenseOrTerms: 'metadata-only; verify UPU source terms before redistributing original documents',
    redistributionStatus: 'source-metadata-only',
    allowedUse: ['country classification prior', 'postal-code-requiredness evidence'],
    transformedFields: ['countryCode', 'countryName', 'region', 'basis', 'note'],
    freshness: 'source note dated 2025; verify before public official claims',
    confidenceNotes: [
      'This pack stores AGID-created metadata derived from the supplied list, not the UPU document itself.',
      'Postal-code-not-required is not identical to no postal system.',
    ],
  },
  {
    sourceId: 'iso-19160-addressing-framework',
    sourceName: 'ISO 19160 addressing conceptual framework',
    sourceUrl: 'https://www.iso.org/standard/61710.html',
    provider: 'ISO',
    coverageRegion: 'global standard reference',
    licenseOrTerms: 'standard reference only; ISO text is not bundled',
    redistributionStatus: 'not-bundled',
    allowedUse: ['conceptual model alignment', 'address governance reference'],
    transformedFields: [],
    freshness: 'reference; check edition before citing normative clauses',
    confidenceNotes: ['Use as a conceptual compatibility reference, not as redistributed standard text.'],
  },
  {
    sourceId: 'ogc-dggs-reference',
    sourceName: 'OGC Discrete Global Grid Systems reference',
    sourceUrl: 'https://www.ogc.org/standard/dggs/',
    provider: 'Open Geospatial Consortium',
    coverageRegion: 'global grid reference',
    licenseOrTerms: 'standard reference; do not bundle standard text unless terms allow',
    redistributionStatus: 'not-bundled',
    allowedUse: ['grid hierarchy design reference', 'cell-based locality modeling'],
    transformedFields: [],
    freshness: 'reference; check current standard version before formal release',
    confidenceNotes: ['Useful for AGID postal zone hierarchy; not a postal authority source.'],
  },
  {
    sourceId: 'openstreetmap-open-geography',
    sourceName: 'OpenStreetMap-derived open geography',
    sourceUrl: 'https://www.openstreetmap.org/copyright',
    provider: 'OpenStreetMap contributors',
    coverageRegion: 'global, community coverage varies',
    licenseOrTerms: 'ODbL where OSM-derived data is used',
    redistributionStatus: 'license-review-required',
    allowedUse: ['road evidence', 'settlement evidence', 'map feature evidence'],
    transformedFields: ['sourceId', 'featureClass', 'evidenceQuality'],
    freshness: 'must be versioned by extract date if bundled',
    confidenceNotes: [
      'This pack does not bundle OSM extracts.',
      'Any derived database must preserve ODbL obligations.',
    ],
  },
  {
    sourceId: 'natural-earth-public-domain-basemap',
    sourceName: 'Natural Earth public domain geography',
    sourceUrl: 'https://www.naturalearthdata.com/',
    provider: 'Natural Earth',
    coverageRegion: 'global small-scale reference geography',
    licenseOrTerms: 'public domain per provider statement; verify before bundle',
    redistributionStatus: 'license-review-required',
    allowedUse: ['coarse country boundary sanity checks', 'map preview base layer'],
    transformedFields: ['country boundary reference', 'coarse region label'],
    freshness: 'version required if bundled',
    confidenceNotes: ['Good for coarse references, not parcel or delivery-grade boundaries.'],
  },
  {
    sourceId: 'overture-maps-open-map-foundation',
    sourceName: 'Overture Maps open map datasets',
    sourceUrl: 'https://overturemaps.org/',
    provider: 'Overture Maps Foundation',
    coverageRegion: 'global, theme coverage varies',
    licenseOrTerms: 'source-specific Overture terms; verify theme license before bundling',
    redistributionStatus: 'license-review-required',
    allowedUse: ['places', 'buildings', 'administrative boundaries', 'transportation evidence'],
    transformedFields: ['theme', 'featureId', 'evidenceClass'],
    freshness: 'release version required if bundled',
    confidenceNotes: ['Candidate source for open map evidence; this pack does not include Overture records.'],
  },
  {
    sourceId: 'geonames-postal-or-place-metadata',
    sourceName: 'GeoNames postal or place metadata',
    sourceUrl: 'https://www.geonames.org/',
    provider: 'GeoNames',
    coverageRegion: 'global, varies by country',
    licenseOrTerms: 'CC BY and source-specific terms; verify postal redistribution before bundling',
    redistributionStatus: 'license-review-required',
    allowedUse: ['place-name evidence', 'weak postal supplemental evidence'],
    transformedFields: ['countryCode', 'placeName', 'adminCode', 'postalEvidenceClass'],
    freshness: 'download date required if bundled',
    confidenceNotes: ['Can support weak postal countries, but official postal authority data remains preferred.'],
  },
  {
    sourceId: 'agid-synthetic-test-fixtures',
    sourceName: 'AGID synthetic postal forge fixtures',
    sourceUrl: 'local:AGID',
    provider: 'AGID project',
    coverageRegion: 'synthetic test regions only',
    licenseOrTerms: 'Apache-2.0 or CC0 depending on file',
    redistributionStatus: 'agid-metadata-redistributable',
    allowedUse: ['tests', 'examples', 'CI verification', 'documentation demos'],
    transformedFields: ['syntheticCountryCode', 'templateId', 'qualityGateId'],
    freshness: 'versioned with repository',
    confidenceNotes: ['Contains no personal data and no real address records.'],
  },
];

export const AGID_POSTAL_FORGE_QUALITY_GATES: AgidPostalForgeQualityGate[] = [
  {
    id: 'license-boundary',
    label: 'License boundary',
    gateType: 'license',
    requiredFor: ['simulation', 'draft', 'pilot', 'supplementary', 'official'],
    rule: 'Do not bundle or redistribute third-party postal, map, boundary, or population datasets unless the source license explicitly permits it.',
    failureAction: 'block',
  },
  {
    id: 'governance-not-official-by-default',
    label: 'Governance and official status',
    gateType: 'governance',
    requiredFor: ['pilot', 'supplementary', 'official'],
    rule: 'AGID Postal Forge outputs are simulation/draft unless a government, municipality, postal authority, or carrier pilot authority is explicitly recorded.',
    failureAction: 'draft-only',
  },
  {
    id: 'minimum-anonymity',
    label: 'Minimum anonymity',
    gateType: 'privacy',
    requiredFor: ['draft', 'pilot', 'supplementary', 'official'],
    rule: 'A public postal zone cannot identify a single household, sensitive facility, or high-risk refuge location.',
    failureAction: 'review-required',
  },
  {
    id: 'data-trust-threshold',
    label: 'Data trust threshold',
    gateType: 'data-trust',
    requiredFor: ['pilot', 'supplementary', 'official'],
    rule: 'Address, road, admin, population, and boundary evidence must pass the configured trust threshold before public pilot use.',
    failureAction: 'draft-only',
  },
  {
    id: 'existing-postal-non-replacement',
    label: 'Existing postal non-replacement',
    gateType: 'collision',
    requiredFor: ['draft', 'pilot', 'supplementary', 'official'],
    rule: 'Class A mature postal countries cannot be replaced by AGID-generated postal codes; Class B countries only allow supplemental codes.',
    failureAction: 'block',
  },
  {
    id: 'country-boundary-and-municipality-boundary',
    label: 'Country and municipality boundary',
    gateType: 'territory-boundary',
    requiredFor: ['simulation', 'draft', 'pilot', 'supplementary', 'official'],
    rule: 'Generated postal zones must stay inside one country, and user-selected locality codes must not cross municipalities.',
    failureAction: 'block',
  },
  {
    id: 'readability-and-error-distance',
    label: 'Readability and error distance',
    gateType: 'readability',
    requiredFor: ['draft', 'pilot', 'supplementary', 'official'],
    rule: 'Public code sets should avoid visually confusable adjacent codes and keep human entry practical.',
    failureAction: 'review-required',
  },
  {
    id: 'lineage-and-migration-safety',
    label: 'Lineage and migration safety',
    gateType: 'migration',
    requiredFor: ['pilot', 'supplementary', 'official'],
    rule: 'Split, merge, rename, and reshaping events must keep old-to-new mappings and preserve stable locality IDs when names change.',
    failureAction: 'review-required',
  },
];

export const AGID_POSTAL_FORGE_PRIVACY_RULES = [
  'The pack contains metadata, templates, quality gates, and synthetic fixtures only.',
  'The pack must not contain personal addresses, recipient names, phone numbers, private AOID bodies, AGID-S payloads, proof codes, or precise high-risk coordinates.',
  'Country classification is a design prior, not proof of deliverability or official postal authority approval.',
  'High-risk and humanitarian contexts default to coarse, revocable, non-public codes.',
];

export const AGID_POSTAL_FORGE_CONSUMER_RULES = [
  'Use Class A countries as non-replacement baselines only.',
  'Use Class B countries for supplemental AGID postal drafts only.',
  'Use Class C countries for primary AGID postal draft design, not automatic official issuance.',
  'Run license review before bundling any third-party geography, postal, population, road, or boundary dataset.',
  'Keep AGID as an internal stable key so visible postal formats can be reshaped later.',
];

function recommendedUseFor(
  classification: ReturnType<typeof classifyAgidPostalCountry>,
): AgidPostalForgeCountryReadinessRecord['recommendedUse'] {
  if (classification.class === 'A') return 'existing-postal-only';
  if (classification.class === 'B') return 'supplemental-agid-postal-draft';
  return 'primary-agid-postal-draft';
}

function publicationStatusFor(
  classification: ReturnType<typeof classifyAgidPostalCountry>,
): AgidPostalForgeCountryReadinessRecord['publicationStatus'] {
  if (classification.class === 'A') return 'simulation-only';
  if (classification.class === 'B') return 'supplementary-only';
  return 'draft-only';
}

function regionFor(profile: AgidPostalCountryProfile) {
  return AGID_POSTAL_TARGET_COUNTRIES.find(country => country.code === profile.countryCode)?.region
    || 'unknown';
}

function basisFor(profile: AgidPostalCountryProfile, sources: string[]) {
  return [
    ...new Set([
      ...sources,
      ...(profile.evidenceSources || []),
    ]),
  ].filter(Boolean);
}

function createCountryRecord(profile: AgidPostalCountryProfile): AgidPostalForgeCountryReadinessRecord {
  const classification = classifyAgidPostalCountry(profile);
  const learning = learnAgidPostalCountryDesign(profile, classification);
  const generationPolicy = buildAgidPostalGenerationPolicy({
    profile,
    classification,
    templateId: learning.recommendedTemplateId,
  });
  return {
    countryCode: classification.countryCode,
    countryName: classification.countryName || profile.countryName || classification.countryCode,
    region: regionFor(profile),
    class: classification.class,
    generationMode: classification.generationMode,
    allowed: classification.allowed,
    recommendedUse: recommendedUseFor(classification),
    generationPolicy,
    learningMode: learning.learningMode,
    allowedLearningUse: learning.allowedUse,
    generationBlockedByMaturePostalSystem: learning.generationBlockedByMaturePostalSystem,
    terrain: learning.terrain,
    populationBand: learning.populationBand,
    areaBand: learning.areaBand,
    countryScale: learning.countryScale,
    densityPerKm2: learning.densityPerKm2,
    recommendedTemplateId: learning.recommendedTemplateId,
    observedFactors: [...learning.observedFactors],
    sources: [...classification.sources],
    basis: basisFor(profile, classification.sources),
    governanceStatus: 'not-official',
    publicationStatus: publicationStatusFor(classification),
    privacyDefaults: classification.class === 'A'
      ? ['non-replacement', 'internal-baseline-only']
      : classification.class === 'B'
        ? ['supplemental-only', 'review-before-publication', 'no-household-level-public-code']
        : ['draft-only', 'coarse-by-default', 'no-official-claim-without-authority'],
  };
}

function templateUseFor(templateId: AgidPostalTemplateId): AgidPostalForgeTemplateRecord['ossUse'] {
  if (templateId === 'agid-native') return 'primary-template-candidate';
  if (templateId === 'ghana-like') return 'supplemental-template-candidate';
  return 'design-prior';
}

function templateCautions(templateId: AgidPostalTemplateId) {
  const cautions = [
    'learn-as-design-prior-not-direct-copy',
    'do-not-claim-foreign-postal-authority-compatibility',
  ];
  if (templateId === 'uk-like') cautions.push('requires-readable-font-and-validation-for-alphanumeric-entry');
  if (templateId === 'ghana-like') cautions.push('avoid-public-precision-for-high-risk-or-surveillance-sensitive-areas');
  if (templateId === 'agid-native') cautions.push('hide-full-agid-and-keep-visible-code-revocable');
  return cautions;
}

function createTemplateRecords(): AgidPostalForgeTemplateRecord[] {
  return (Object.keys(AGID_POSTAL_TEMPLATES) as AgidPostalTemplateId[])
    .map((templateId) => {
      const template = AGID_POSTAL_TEMPLATES[templateId];
      return {
        templateId,
        label: template.label,
        basedOn: template.basedOn,
        format: template.format,
        hierarchyDepth: template.hierarchyDepth,
        defaultLength: template.defaultLength,
        bestFor: [...template.bestFor],
        ossUse: templateUseFor(templateId),
        cautions: templateCautions(templateId),
      };
    })
    .sort((left, right) => left.templateId.localeCompare(right.templateId));
}

export function buildAgidPostalForgeOssDatasetPack(input: {
  profiles?: AgidPostalCountryProfile[];
  generatedAt?: string;
} = {}): AgidPostalForgeOssDatasetPack {
  const generatedAt = input.generatedAt || '2026-06-20T00:00:00.000Z';
  const profiles = buildAgidPostalCountryProfiles(input.profiles || []);
  const countries = profiles.map(createCountryRecord)
    .sort((left, right) => left.countryCode.localeCompare(right.countryCode));
  const templates = createTemplateRecords();
  const counts = {
    countries: countries.length,
    classA: countries.filter(country => country.class === 'A').length,
    classB: countries.filter(country => country.class === 'B').length,
    classC: countries.filter(country => country.class === 'C').length,
    templates: templates.length,
    sourceRecords: AGID_POSTAL_FORGE_SOURCE_CATALOG.length,
    qualityGates: AGID_POSTAL_FORGE_QUALITY_GATES.length,
  };

  return {
    manifest: {
      packId: 'agid-postal-forge-oss-dataset-pack',
      version: AGID_POSTAL_FORGE_OSS_DATASET_PACK_VERSION,
      engineVersion: AGID_POSTAL_CODE_ENGINE_VERSION,
      systemName: AGID_POSTAL_CREATION_SYSTEM_NAME,
      aiName: AGID_POSTAL_CREATION_AI_NAME,
      aiVersion: AGID_POSTAL_CREATION_AI_VERSION,
      generatedAt,
      licenseOrTerms: 'Apache-2.0 for AGID metadata; source-specific for referenced datasets',
      redistributionPolicy: 'This pack redistributes AGID-created metadata and source references only. It does not bundle third-party postal, boundary, road, population, OSM, Overture, GeoNames, ISO, OGC, or UPU source data.',
      files: AGID_POSTAL_FORGE_OSS_DATASET_FILES.map(file => ({ ...file })),
      counts,
    },
    sources: AGID_POSTAL_FORGE_SOURCE_CATALOG.map(source => ({
      ...source,
      allowedUse: [...source.allowedUse],
      transformedFields: [...source.transformedFields],
      confidenceNotes: [...source.confidenceNotes],
    })),
    templates,
    countries,
    qualityGates: AGID_POSTAL_FORGE_QUALITY_GATES.map(gate => ({
      ...gate,
      requiredFor: [...gate.requiredFor],
    })),
    privacyRules: [...AGID_POSTAL_FORGE_PRIVACY_RULES],
    consumerRules: [...AGID_POSTAL_FORGE_CONSUMER_RULES],
  };
}

export function validateAgidPostalForgeOssDatasetPack(
  pack = buildAgidPostalForgeOssDatasetPack(),
): AgidPostalForgeDatasetPackValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const countryCodes = new Set<string>();
  const templateIds = new Set(pack.templates.map(template => template.templateId));
  const sourceIds = new Set<string>();

  if (pack.manifest.version !== AGID_POSTAL_FORGE_OSS_DATASET_PACK_VERSION) errors.push('version-mismatch');
  if (pack.manifest.systemName !== AGID_POSTAL_CREATION_SYSTEM_NAME) errors.push('system-name-mismatch');
  if (pack.manifest.aiName !== AGID_POSTAL_CREATION_AI_NAME) errors.push('ai-name-mismatch');
  if (pack.manifest.counts.countries !== pack.countries.length) errors.push('country-count-mismatch');
  if (pack.manifest.counts.templates !== pack.templates.length) errors.push('template-count-mismatch');
  if (pack.manifest.counts.sourceRecords !== pack.sources.length) errors.push('source-count-mismatch');
  if (pack.manifest.counts.qualityGates !== pack.qualityGates.length) errors.push('quality-gate-count-mismatch');
  if (!pack.manifest.redistributionPolicy.toLowerCase().includes('does not bundle third-party')) {
    errors.push('missing-third-party-non-bundling-policy');
  }

  for (const file of pack.manifest.files) {
    if (file.containsPersonalData !== false) errors.push(`file-personal-data-not-false:${file.path}`);
    if (file.containsThirdPartyData && file.licenseOrTerms !== 'source-specific' && file.licenseOrTerms !== 'DATA-LICENSES') {
      errors.push(`third-party-file-without-source-license:${file.path}`);
    }
  }

  for (const source of pack.sources) {
    if (sourceIds.has(source.sourceId)) errors.push(`duplicate-source:${source.sourceId}`);
    sourceIds.add(source.sourceId);
    if (!source.sourceName || !source.sourceUrl || !source.provider) errors.push(`source-missing-required-field:${source.sourceId}`);
    if (!source.allowedUse.length) errors.push(`source-missing-allowed-use:${source.sourceId}`);
    if (!source.confidenceNotes.length) errors.push(`source-missing-confidence-notes:${source.sourceId}`);
    if (source.redistributionStatus !== 'agid-metadata-redistributable' && /bundles|included records/i.test(source.allowedUse.join(' '))) {
      errors.push(`non-redistributable-source-claims-bundled-use:${source.sourceId}`);
    }
  }

  for (const templateId of Object.keys(AGID_POSTAL_TEMPLATES) as AgidPostalTemplateId[]) {
    if (!templateIds.has(templateId)) errors.push(`missing-template:${templateId}`);
  }

  for (const country of pack.countries) {
    if (countryCodes.has(country.countryCode)) errors.push(`duplicate-country:${country.countryCode}`);
    countryCodes.add(country.countryCode);
    if (country.class === 'A' && country.allowed) errors.push(`class-a-country-allowed:${country.countryCode}`);
    if (country.class === 'A' && country.recommendedUse !== 'existing-postal-only') {
      errors.push(`class-a-country-replacement-risk:${country.countryCode}`);
    }
    if (country.class === 'A' && country.generationPolicy.publicationStage !== 'simulation-only') {
      errors.push(`class-a-country-policy-not-simulation:${country.countryCode}`);
    }
    if (country.class === 'B' && country.recommendedUse !== 'supplemental-agid-postal-draft') {
      errors.push(`class-b-country-not-supplemental:${country.countryCode}`);
    }
    if (country.class === 'B' && country.generationPolicy.publicationStage !== 'supplemental-draft') {
      errors.push(`class-b-country-policy-not-supplemental:${country.countryCode}`);
    }
    if (country.class === 'C' && country.recommendedUse !== 'primary-agid-postal-draft') {
      errors.push(`class-c-country-not-primary-draft:${country.countryCode}`);
    }
    if (country.class === 'C' && country.generationPolicy.publicationStage !== 'primary-draft') {
      errors.push(`class-c-country-policy-not-primary-draft:${country.countryCode}`);
    }
    if (country.generationPolicy.officialReplacementAllowed) {
      errors.push(`country-policy-allows-official-replacement:${country.countryCode}`);
    }
    if (!country.generationPolicy.namespace.startsWith(`AGID-POSTAL:${country.countryCode}:`)) {
      errors.push(`country-policy-namespace-mismatch:${country.countryCode}`);
    }
    if (country.governanceStatus !== 'not-official') errors.push(`country-claims-official:${country.countryCode}`);
    if (!templateIds.has(country.recommendedTemplateId)) errors.push(`country-template-missing:${country.countryCode}`);
    if (!country.privacyDefaults.some(rule => /draft|non-replacement|supplemental|coarse|review/i.test(rule))) {
      errors.push(`country-missing-privacy-default:${country.countryCode}`);
    }
  }

  for (const target of AGID_POSTAL_TARGET_COUNTRIES) {
    if (!countryCodes.has(target.code)) errors.push(`missing-target-country:${target.code}`);
  }

  for (const gate of pack.qualityGates) {
    if (!gate.requiredFor.length) errors.push(`quality-gate-without-stage:${gate.id}`);
    if (!gate.rule) errors.push(`quality-gate-without-rule:${gate.id}`);
  }

  const joinedPrivacy = pack.privacyRules.join(' | ').toLowerCase();
  for (const phrase of ['personal addresses', 'agid-s payload', 'official']) {
    if (!joinedPrivacy.includes(phrase)) errors.push(`missing-privacy-rule:${phrase}`);
  }

  if (!pack.sources.some(source => source.redistributionStatus === 'agid-metadata-redistributable')) {
    warnings.push('no-redistributable-synthetic-source');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
