import {
  ADDRESS_COVERAGE_POLICIES,
  type AddressCoveragePolicyId,
} from './addressCoveragePolicy';
import {
  buildAgidPostalCountryPack,
  buildAllAgidPostalCountryPacks,
  validateAgidPostalCountryPack,
  type AgidPostalCountryPack,
} from './agidPostalCountryPack';
import type {
  AgidPostalCountryPackRecommendation,
  AgidPostalCountryPackWeight,
} from './agidPostalCountryPackStrategy';

export const AGID_POSTAL_FORGE_PROGRAM_VERSION = 'agid-postal-forge-program-v0.1';

export type AgidPostalForgePublicationStage =
  | 'draft'
  | 'review'
  | 'published'
  | 'deprecated';

export type AgidPostalForgeApprovalActor =
  | 'government'
  | 'municipality'
  | 'postal-authority'
  | 'carrier'
  | 'local-operator'
  | 'data-steward';

export type AgidPostalForgeReleaseOverride = {
  countryCode: string;
  requestedStage?: AgidPostalForgePublicationStage;
  approvedActors?: AgidPostalForgeApprovalActor[];
  successorCode?: string;
  note?: string;
};

export type AgidPostalForgeQualityGateResult = {
  id: string;
  label: string;
  passed: boolean;
  severity: 'block' | 'review' | 'warn' | 'info';
  evidence: string[];
};

export type AgidPostalForgeReleaseDecision = {
  requestedStage: AgidPostalForgePublicationStage;
  effectiveStage: AgidPostalForgePublicationStage;
  approvedActors: AgidPostalForgeApprovalActor[];
  canPublish: boolean;
  qualityScore: number;
  blockers: string[];
  warnings: string[];
  gates: AgidPostalForgeQualityGateResult[];
  transition: {
    draft: true;
    review: boolean;
    published: boolean;
    deprecated: boolean;
    successorCode: string | null;
  };
};

export type AgidPostalForgeLazyLoadContract = {
  countryIndexPath: string;
  manifestPath: string;
  countryPackPath: string;
  sourceCatalogPath: string;
  licenseLedgerPath: string;
  testVectorsPath: string;
  suggestedDynamicImport: string;
};

export type AgidPostalForgeCountryRepositoryRecord = {
  countryCode: string;
  countryName: string;
  repositoryName: string;
  packageName: string;
  packWeight: AgidPostalCountryPackWeight;
  recommendedUse: AgidPostalCountryPackRecommendation['recommendedUse'];
  coveragePolicyId: AddressCoveragePolicyId;
  coverageLabel: string;
  publicationStage: AgidPostalForgePublicationStage;
  containsPersonalData: false;
  containsRawThirdPartyData: false;
  lazyLoad: AgidPostalForgeLazyLoadContract;
  requiredFiles: string[];
  updateCadence: 'daily-priority' | 'daily-rotating' | 'weekly' | 'manual-review';
  release: AgidPostalForgeReleaseDecision;
};

export type AgidPostalForgeUpdateBatch = {
  batchId: string;
  maxCountriesPerRun: number;
  countries: Array<{
    countryCode: string;
    repositoryName: string;
    packageName: string;
    updateCadence: AgidPostalForgeCountryRepositoryRecord['updateCadence'];
  }>;
};

export type AgidPostalForgeCentralIndex = {
  repositoryName: 'agid-postal-country-index';
  packageName: '@agid/agid-postal-country-index';
  countriesJsonPath: 'countries.json';
  latestPackVersionsPath: 'latest-pack-versions.json';
  sourceLicenseIndexPath: 'source-license-index.json';
  lazyLoadOnly: true;
  containsPersonalData: false;
  totalCountries: number;
  countryCodes: string[];
};

export type AgidPostalForgeProgramPlan = {
  version: typeof AGID_POSTAL_FORGE_PROGRAM_VERSION;
  generatedAt: string;
  centralIndex: AgidPostalForgeCentralIndex;
  countryRepositories: AgidPostalForgeCountryRepositoryRecord[];
  updateBatches: AgidPostalForgeUpdateBatch[];
  qualitySummary: {
    totalCountries: number;
    publishable: number;
    reviewRequired: number;
    blocked: number;
    deprecated: number;
    byCoveragePolicy: Record<AddressCoveragePolicyId, number>;
  };
  maintenanceRules: string[];
};

const STAGE_PRIORITY: Record<AgidPostalForgePublicationStage, number> = {
  draft: 1,
  review: 2,
  published: 3,
  deprecated: 4,
};

const PACK_WEIGHT_PRIORITY: Record<AgidPostalCountryPackWeight, number> = {
  'heavy-pack': 4,
  'standard-pack': 3,
  'light-pack': 2,
  'thin-pack': 1,
};

const DEFAULT_REQUIRED_REPOSITORY_FILES = [
  'manifest.json',
  'agid-postal-country-pack.json',
  'source-catalog.json',
  'license-ledger.json',
  'quality-evidence-index.json',
  'route-evidence-index.json',
  'planning-cell-index.json',
  'test-vectors.json',
  'README.md',
];

function normalizeCountryCode(value: string) {
  return value.trim().toUpperCase();
}

function normalizeOverrides(overrides: AgidPostalForgeReleaseOverride[] = []) {
  return new Map(overrides.map(override => [
    normalizeCountryCode(override.countryCode),
    {
      ...override,
      countryCode: normalizeCountryCode(override.countryCode),
      approvedActors: [...(override.approvedActors || [])],
    },
  ]));
}

function roundScore(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function averageQuality(pack: AgidPostalCountryPack) {
  if (!pack.qualityEvidenceIndex.length) return 0;
  const total = pack.qualityEvidenceIndex.reduce((sum, evidence) => (
    sum
    + evidence.addressQuality
    + evidence.boundaryQuality
    + evidence.routeQuality
    + evidence.populationQuality
  ), 0);
  return roundScore(total / (pack.qualityEvidenceIndex.length * 4));
}

function gate(
  id: string,
  label: string,
  passed: boolean,
  severity: AgidPostalForgeQualityGateResult['severity'],
  evidence: string[],
): AgidPostalForgeQualityGateResult {
  return { id, label, passed, severity, evidence };
}

function hasOfficialApproval(actors: AgidPostalForgeApprovalActor[]) {
  return actors.some(actor => (
    actor === 'government'
    || actor === 'municipality'
    || actor === 'postal-authority'
  ));
}

function hasOperationalApproval(actors: AgidPostalForgeApprovalActor[]) {
  return actors.some(actor => (
    actor === 'carrier'
    || actor === 'postal-authority'
    || actor === 'local-operator'
  ));
}

export function evaluateAgidPostalForgeCountryPackRelease(input: {
  pack: AgidPostalCountryPack;
  override?: AgidPostalForgeReleaseOverride | null;
}): AgidPostalForgeReleaseDecision {
  const pack = input.pack;
  const override = input.override || null;
  const requestedStage = override?.requestedStage || 'draft';
  const approvedActors = [...(override?.approvedActors || [])];
  const successorCode = override?.successorCode?.trim() || null;
  const validation = validateAgidPostalCountryPack(pack);
  const qualityScore = averageQuality(pack);
  const gates = [
    gate(
      'schema-and-country-pack-validation',
      'Country pack schema and internal references are valid',
      validation.valid,
      'block',
      validation.valid ? ['validateAgidPostalCountryPack passed'] : validation.errors,
    ),
    gate(
      'no-personal-or-raw-third-party-data',
      'Country pack contains no personal address data and no raw third-party dataset',
      pack.manifest.containsPersonalData === false && pack.manifest.containsRawThirdPartyData === false,
      'block',
      [
        `containsPersonalData=${pack.manifest.containsPersonalData}`,
        `containsRawThirdPartyData=${pack.manifest.containsRawThirdPartyData}`,
      ],
    ),
    gate(
      'source-and-license-ledger-present',
      'Source catalog and license ledger are present before export',
      pack.sourceCatalog.length > 0 && pack.licenseLedger.length > 0,
      'block',
      [`sources=${pack.sourceCatalog.length}`, `licenseEntries=${pack.licenseLedger.length}`],
    ),
    gate(
      'quality-route-and-planning-evidence-present',
      'Planning cells, route evidence, and quality evidence exist for review',
      pack.planningCellIndex.length > 0 && pack.routeEvidenceIndex.length > 0 && pack.qualityEvidenceIndex.length > 0,
      'review',
      [
        `planningCells=${pack.planningCellIndex.length}`,
        `routeEvidence=${pack.routeEvidenceIndex.length}`,
        `qualityEvidence=${pack.qualityEvidenceIndex.length}`,
        `qualityScore=${qualityScore}`,
      ],
    ),
    gate(
      'official-status-guard',
      'Draft packs do not claim official national postal-code status',
      pack.manifest.officialStatus !== 'official',
      'block',
      [`officialStatus=${pack.manifest.officialStatus}`],
    ),
    gate(
      'published-release-approval',
      'Published release requires official and operational approval',
      requestedStage !== 'published' || (
        pack.manifest.officialStatus !== 'draft'
        && hasOfficialApproval(approvedActors)
        && hasOperationalApproval(approvedActors)
      ),
      'block',
      [
        `requestedStage=${requestedStage}`,
        `officialStatus=${pack.manifest.officialStatus}`,
        `approvedActors=${approvedActors.join(',') || 'none'}`,
      ],
    ),
    gate(
      'deprecated-release-successor',
      'Deprecated codes require a successor mapping',
      requestedStage !== 'deprecated' || Boolean(successorCode),
      'block',
      [`successorCode=${successorCode || 'missing'}`],
    ),
  ];
  const blockers = gates
    .filter(item => !item.passed && item.severity === 'block')
    .map(item => item.id);
  const warnings = [
    ...validation.warnings,
    ...gates
      .filter(item => !item.passed && item.severity !== 'block')
      .map(item => item.id),
  ];

  let effectiveStage = requestedStage;
  if (blockers.includes('published-release-approval')) effectiveStage = 'review';
  if (blockers.includes('deprecated-release-successor')) effectiveStage = 'review';
  if (blockers.some(blocker => blocker !== 'published-release-approval' && blocker !== 'deprecated-release-successor')) {
    effectiveStage = 'draft';
  }
  if (requestedStage === 'review' && !validation.valid) effectiveStage = 'draft';
  if (requestedStage === 'draft') effectiveStage = 'draft';

  return {
    requestedStage,
    effectiveStage,
    approvedActors,
    canPublish: effectiveStage === 'published' && blockers.length === 0,
    qualityScore,
    blockers,
    warnings,
    gates,
    transition: {
      draft: true,
      review: STAGE_PRIORITY[effectiveStage] >= STAGE_PRIORITY.review,
      published: effectiveStage === 'published',
      deprecated: effectiveStage === 'deprecated',
      successorCode,
    },
  };
}

function coveragePolicyForPack(pack: AgidPostalCountryPack): AddressCoveragePolicyId {
  if (pack.recommendation.tier === 'mature-reliable-postal-code') return 'postal-reliable-api';
  if (pack.recommendation.tier === 'weak-coarse-postal-code') return 'postal-weak-api';
  if (pack.recommendation.tier === 'rapid-growth-address-pressure') return 'postal-weak-api';
  if (pack.recommendation.tier === 'fragile-address-infrastructure') return 'no-postal-weak-geo';
  return pack.routeEvidenceIndex.length > 0 && pack.qualityEvidenceIndex.length > 0
    ? 'no-postal-strong-geo'
    : 'no-postal-weak-geo';
}

function lazyLoadContractFor(repositoryName: string, countryCode: string): AgidPostalForgeLazyLoadContract {
  const country = countryCode.toLowerCase();
  return {
    countryIndexPath: 'data/postal_country_packs/index.json',
    manifestPath: `data/postal_country_packs/${country}/manifest.json`,
    countryPackPath: `data/postal_country_packs/${country}/agid-postal-country-pack.json`,
    sourceCatalogPath: `data/postal_country_packs/${country}/source-catalog.json`,
    licenseLedgerPath: `data/postal_country_packs/${country}/license-ledger.json`,
    testVectorsPath: `data/postal_country_packs/${country}/test-vectors.json`,
    suggestedDynamicImport: `import('@agid/${repositoryName}')`,
  };
}

function updateCadenceFor(
  pack: AgidPostalCountryPack,
  coveragePolicyId: AddressCoveragePolicyId,
  release: AgidPostalForgeReleaseDecision,
): AgidPostalForgeCountryRepositoryRecord['updateCadence'] {
  if (release.effectiveStage === 'deprecated') return 'manual-review';
  if (release.blockers.length > 0) return 'manual-review';
  if (pack.recommendation.packWeight === 'heavy-pack') return 'daily-priority';
  if (coveragePolicyId === 'postal-weak-api' || coveragePolicyId === 'no-postal-strong-geo') return 'daily-rotating';
  if (pack.recommendation.packWeight === 'thin-pack') return 'weekly';
  return 'daily-rotating';
}

function buildRepositoryRecord(
  pack: AgidPostalCountryPack,
  override: AgidPostalForgeReleaseOverride | null,
): AgidPostalForgeCountryRepositoryRecord {
  const release = evaluateAgidPostalForgeCountryPackRelease({ pack, override });
  const coveragePolicyId = coveragePolicyForPack(pack);
  const policy = ADDRESS_COVERAGE_POLICIES[coveragePolicyId];
  return {
    countryCode: pack.manifest.countryCode,
    countryName: pack.manifest.countryName,
    repositoryName: pack.manifest.repositoryName,
    packageName: pack.manifest.packageName,
    packWeight: pack.recommendation.packWeight,
    recommendedUse: pack.recommendation.recommendedUse,
    coveragePolicyId,
    coverageLabel: policy.label,
    publicationStage: release.effectiveStage,
    containsPersonalData: false,
    containsRawThirdPartyData: false,
    lazyLoad: lazyLoadContractFor(pack.manifest.repositoryName, pack.manifest.countryCode),
    requiredFiles: [...DEFAULT_REQUIRED_REPOSITORY_FILES],
    updateCadence: updateCadenceFor(pack, coveragePolicyId, release),
    release,
  };
}

function createUpdateBatches(
  records: AgidPostalForgeCountryRepositoryRecord[],
  maxCountriesPerRun: number,
): AgidPostalForgeUpdateBatch[] {
  const queue = records
    .filter(record => record.updateCadence !== 'manual-review')
    .sort((left, right) => {
      const cadenceScore = Number(right.updateCadence === 'daily-priority') - Number(left.updateCadence === 'daily-priority');
      if (cadenceScore !== 0) return cadenceScore;
      const weightScore = PACK_WEIGHT_PRIORITY[right.packWeight] - PACK_WEIGHT_PRIORITY[left.packWeight];
      if (weightScore !== 0) return weightScore;
      return left.countryCode.localeCompare(right.countryCode);
    });
  const batches: AgidPostalForgeUpdateBatch[] = [];
  for (let index = 0; index < queue.length; index += maxCountriesPerRun) {
    const countries = queue.slice(index, index + maxCountriesPerRun).map(record => ({
      countryCode: record.countryCode,
      repositoryName: record.repositoryName,
      packageName: record.packageName,
      updateCadence: record.updateCadence,
    }));
    batches.push({
      batchId: `postal-forge-daily-batch-${String(batches.length + 1).padStart(2, '0')}`,
      maxCountriesPerRun,
      countries,
    });
  }
  return batches;
}

function createQualitySummary(records: AgidPostalForgeCountryRepositoryRecord[]): AgidPostalForgeProgramPlan['qualitySummary'] {
  const byCoveragePolicy = Object.fromEntries(
    Object.keys(ADDRESS_COVERAGE_POLICIES).map(id => [id, 0]),
  ) as Record<AddressCoveragePolicyId, number>;
  for (const record of records) byCoveragePolicy[record.coveragePolicyId] += 1;
  return {
    totalCountries: records.length,
    publishable: records.filter(record => record.release.canPublish).length,
    reviewRequired: records.filter(record => record.publicationStage === 'review').length,
    blocked: records.filter(record => record.release.blockers.length > 0).length,
    deprecated: records.filter(record => record.publicationStage === 'deprecated').length,
    byCoveragePolicy,
  };
}

export function buildAgidPostalForgeProgramPlan(input: {
  countryCodes?: string[];
  packs?: AgidPostalCountryPack[];
  generatedAt?: string;
  releaseOverrides?: AgidPostalForgeReleaseOverride[];
  maxCountriesPerRun?: number;
} = {}): AgidPostalForgeProgramPlan {
  const generatedAt = input.generatedAt || '2026-06-24T00:00:00.000Z';
  const overrides = normalizeOverrides(input.releaseOverrides);
  const packs = input.packs
    ? [...input.packs]
    : input.countryCodes?.length
      ? input.countryCodes.map(countryCode => buildAgidPostalCountryPack({
        countryCode,
        generatedAt,
      }))
      : buildAllAgidPostalCountryPacks({ generatedAt });
  const records = packs
    .map(pack => buildRepositoryRecord(pack, overrides.get(pack.manifest.countryCode) || null))
    .sort((left, right) => left.countryCode.localeCompare(right.countryCode));
  const maxCountriesPerRun = Math.max(1, Math.floor(input.maxCountriesPerRun || 8));

  return {
    version: AGID_POSTAL_FORGE_PROGRAM_VERSION,
    generatedAt,
    centralIndex: {
      repositoryName: 'agid-postal-country-index',
      packageName: '@agid/agid-postal-country-index',
      countriesJsonPath: 'countries.json',
      latestPackVersionsPath: 'latest-pack-versions.json',
      sourceLicenseIndexPath: 'source-license-index.json',
      lazyLoadOnly: true,
      containsPersonalData: false,
      totalCountries: records.length,
      countryCodes: records.map(record => record.countryCode),
    },
    countryRepositories: records,
    updateBatches: createUpdateBatches(records, maxCountriesPerRun),
    qualitySummary: createQualitySummary(records),
    maintenanceRules: [
      'Keep the app and Postal Forge engine in the central repository; country data lives in country-pack repositories.',
      'Load only the selected country pack at runtime; the central index contains metadata and repository pointers only.',
      'Run schema, source, license, no-raw-address, and sample-code tests before review or publication.',
      'Publish as draft or supplementary until official authority and carrier/operator approval are recorded.',
      'Use deprecated plus successorCode for split, merge, rename, or reshaping changes instead of deleting codes.',
      'Rotate country updates in small daily batches; avoid global all-at-once refresh jobs.',
    ],
  };
}
