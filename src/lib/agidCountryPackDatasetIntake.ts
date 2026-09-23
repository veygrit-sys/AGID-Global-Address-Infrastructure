import {
  buildAgidPostalCountryPack,
  listAgidPostalCountryPackTargetCountries,
  validateAgidPostalCountryPack,
} from './agidPostalCountryPack';
import {
  getOfficialPostalSourcesForCountry,
  isStrongPostalTrustTier,
  type OfficialPostalSourceProfile,
} from './officialPostalSourceCatalog';
import {
  recommendAgidPostalCountryPack,
  type AgidPostalCountryPackTier,
} from './agidPostalCountryPackStrategy';

export const AGID_COUNTRY_PACK_DATASET_INTAKE_SCHEMA_ID = 'agid-country-pack-dataset-intake-v0.1';

export type AgidCountryPackDatasetPriority = 'P0' | 'P1' | 'P2';

export type AgidCountryPackDatasetClass =
  | 'strong-postcode'
  | 'no-postcode'
  | 'weak-postcode'
  | 'fragile'
  | 'rapid-growth'
  | 'island'
  | 'polar'
  | 'source-catalog-only';

export type AgidCountryPackDatasetStage =
  | 'source-catalog-only'
  | 'synthetic-planning-fixture'
  | 'normalized-official-municipality-needed'
  | 'open-geodata-ready'
  | 'pilot-dataset-ready';

export type AgidCountryPackDatasetSourceReadiness =
  | 'official-or-open-source-linked'
  | 'global-fallback-only'
  | 'license-review-required';

export type AgidCountryPackDatasetIntakeRecord = {
  countryCode: string;
  countryName: string;
  priority: AgidCountryPackDatasetPriority;
  datasetClass: AgidCountryPackDatasetClass;
  stage: AgidCountryPackDatasetStage;
  packRepositoryName: string | null;
  packGenerated: boolean;
  packValid: boolean;
  sourceReadiness: AgidCountryPackDatasetSourceReadiness;
  preferredSourceIds: string[];
  sourceUrls: string[];
  containsPersonalData: false;
  containsRawThirdPartyData: false;
  minimumPublicDataset: string[];
  nextActions: string[];
  blockers: string[];
};

export type AgidCountryPackDatasetIntakePlan = {
  schemaId: typeof AGID_COUNTRY_PACK_DATASET_INTAKE_SCHEMA_ID;
  generatedAt: string;
  containsPersonalData: false;
  containsRawThirdPartyData: false;
  summary: {
    totalCountries: number;
    p0Countries: number;
    generatedPackCountries: number;
    validPackCountries: number;
    sourceCatalogOnlyCountries: number;
    normalizedOfficialMunicipalityNeeded: number;
    byClass: Record<AgidCountryPackDatasetClass, number>;
    byStage: Record<AgidCountryPackDatasetStage, number>;
  };
  records: AgidCountryPackDatasetIntakeRecord[];
};

export type AgidCountryPackDatasetIntakeValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const PRIORITY_DATASET_COUNTRIES: Array<{ countryCode: string; countryName: string; datasetClass: AgidCountryPackDatasetClass }> = [
  { countryCode: 'JP', countryName: 'Japan', datasetClass: 'strong-postcode' },
  { countryCode: 'US', countryName: 'United States', datasetClass: 'strong-postcode' },
  { countryCode: 'DE', countryName: 'Germany', datasetClass: 'strong-postcode' },
  { countryCode: 'FR', countryName: 'France', datasetClass: 'strong-postcode' },
  { countryCode: 'GB', countryName: 'United Kingdom', datasetClass: 'strong-postcode' },
  { countryCode: 'NL', countryName: 'Netherlands', datasetClass: 'strong-postcode' },
  { countryCode: 'AU', countryName: 'Australia', datasetClass: 'strong-postcode' },
  { countryCode: 'NZ', countryName: 'New Zealand', datasetClass: 'strong-postcode' },
  { countryCode: 'HK', countryName: 'Hong Kong', datasetClass: 'no-postcode' },
  { countryCode: 'AE', countryName: 'United Arab Emirates', datasetClass: 'no-postcode' },
  { countryCode: 'QA', countryName: 'Qatar', datasetClass: 'no-postcode' },
  { countryCode: 'KE', countryName: 'Kenya', datasetClass: 'weak-postcode' },
  { countryCode: 'GH', countryName: 'Ghana', datasetClass: 'weak-postcode' },
  { countryCode: 'TZ', countryName: 'Tanzania', datasetClass: 'weak-postcode' },
  { countryCode: 'FJ', countryName: 'Fiji', datasetClass: 'island' },
  { countryCode: 'VU', countryName: 'Vanuatu', datasetClass: 'island' },
  { countryCode: 'AQ', countryName: 'Antarctica', datasetClass: 'polar' },
];

const P0_COUNTRY_CODES = new Set(PRIORITY_DATASET_COUNTRIES.map(country => country.countryCode));

const TIER_TO_DATASET_CLASS: Record<AgidPostalCountryPackTier, AgidCountryPackDatasetClass> = {
  'mature-reliable-postal-code': 'strong-postcode',
  'no-or-not-required-postal-code': 'no-postcode',
  'weak-coarse-postal-code': 'weak-postcode',
  'fragile-address-infrastructure': 'fragile',
  'rapid-growth-address-pressure': 'rapid-growth',
};

function createEmptyClassCounts(): Record<AgidCountryPackDatasetClass, number> {
  return {
    'strong-postcode': 0,
    'no-postcode': 0,
    'weak-postcode': 0,
    fragile: 0,
    'rapid-growth': 0,
    island: 0,
    polar: 0,
    'source-catalog-only': 0,
  };
}

function createEmptyStageCounts(): Record<AgidCountryPackDatasetStage, number> {
  return {
    'source-catalog-only': 0,
    'synthetic-planning-fixture': 0,
    'normalized-official-municipality-needed': 0,
    'open-geodata-ready': 0,
    'pilot-dataset-ready': 0,
  };
}

function sourceReadinessFor(sources: OfficialPostalSourceProfile[]): AgidCountryPackDatasetSourceReadiness {
  const countrySpecific = sources.filter(source => !source.countryCodes.includes('*'));
  if (!countrySpecific.length) return 'global-fallback-only';
  if (countrySpecific.some(source => source.requiresCredential || source.availability === 'licensed-bulk-data')) {
    return 'license-review-required';
  }
  return countrySpecific.some(source => isStrongPostalTrustTier(source.trustTier))
    ? 'official-or-open-source-linked'
    : 'global-fallback-only';
}

function stageFor(input: {
  packGenerated: boolean;
  packValid: boolean;
  datasetClass: AgidCountryPackDatasetClass;
  sourceReadiness: AgidCountryPackDatasetSourceReadiness;
}): AgidCountryPackDatasetStage {
  if (!input.packGenerated) return 'source-catalog-only';
  if (!input.packValid) return 'normalized-official-municipality-needed';
  if (input.sourceReadiness === 'official-or-open-source-linked' && input.datasetClass !== 'fragile') {
    return 'open-geodata-ready';
  }
  return 'synthetic-planning-fixture';
}

function minimumPublicDatasetFor(datasetClass: AgidCountryPackDatasetClass): string[] {
  const shared = [
    'manifest',
    'source-catalog',
    'license-ledger',
    'locality-index',
    'quality-evidence-index',
    'test-vectors',
    'no-raw-address-policy',
  ];
  if (datasetClass === 'strong-postcode') {
    return [...shared, 'official-postal-source-links', 'address-format-rules'];
  }
  if (datasetClass === 'no-postcode') {
    return [...shared, 'agid-planning-cells', 'postal-equivalent-candidates', 'route-evidence-slots'];
  }
  if (datasetClass === 'island') {
    return [...shared, 'island-landform-index', 'port-ferry-air-route-evidence', 'postal-equivalent-candidates'];
  }
  if (datasetClass === 'fragile') {
    return [...shared, 'coarse-safe-regions', 'humanitarian-redaction-policy'];
  }
  return [...shared, 'admin-boundary-index', 'route-evidence-slots'];
}

function nextActionsFor(input: {
  stage: AgidCountryPackDatasetStage;
  datasetClass: AgidCountryPackDatasetClass;
  packGenerated: boolean;
  sourceReadiness: AgidCountryPackDatasetSourceReadiness;
}) {
  const actions = [];
  if (!input.packGenerated) {
    actions.push('add Postal Zone Designer country preset before generating a country pack');
  }
  if (input.stage === 'synthetic-planning-fixture') {
    actions.push('ingest normalized official municipality dataset when redistribution terms are reviewed');
    actions.push('attach open geodata source references without bundling raw third-party records');
  }
  if (input.sourceReadiness === 'license-review-required') {
    actions.push('resolve credential or redistribution terms before bundling derived data');
  }
  if (input.datasetClass === 'no-postcode') {
    actions.push('prepare postal-equivalent AGID region candidates and route evidence slots');
  }
  if (input.datasetClass === 'strong-postcode') {
    actions.push('keep country pack supplemental; do not replace official postcode authority');
  }
  if (input.datasetClass === 'fragile') {
    actions.push('keep precision coarse and publish only humanitarian-safe regions');
  }
  if (input.stage === 'open-geodata-ready') {
    actions.push('run sample municipality import and compare against source catalog freshness');
  }
  return Array.from(new Set(actions));
}

function blockersFor(input: {
  packGenerated: boolean;
  packValid: boolean;
  sourceReadiness: AgidCountryPackDatasetSourceReadiness;
  datasetClass: AgidCountryPackDatasetClass;
}) {
  const blockers = [];
  if (!input.packGenerated) blockers.push('country-pack-generator-preset-missing');
  if (!input.packValid) blockers.push('country-pack-validation-failed');
  if (input.sourceReadiness === 'global-fallback-only') blockers.push('country-specific-source-needed');
  if (input.sourceReadiness === 'license-review-required') blockers.push('license-or-credential-review-needed');
  if (input.datasetClass === 'fragile') blockers.push('privacy-and-safety-review-required');
  return blockers;
}

function priorityCountryLookup() {
  return new Map(PRIORITY_DATASET_COUNTRIES.map(country => [country.countryCode, country]));
}

export function buildAgidCountryPackDatasetIntakePlan(input: {
  generatedAt?: string;
  includeAllGeneratedTargets?: boolean;
} = {}): AgidCountryPackDatasetIntakePlan {
  const generatedAt = input.generatedAt || '2026-06-29T00:00:00.000Z';
  const targetCountries = listAgidPostalCountryPackTargetCountries();
  const targetByCode = new Map(targetCountries.map(country => [country.countryCode, country]));
  const priorityByCode = priorityCountryLookup();
  const countryCodes = new Set<string>(PRIORITY_DATASET_COUNTRIES.map(country => country.countryCode));
  if (input.includeAllGeneratedTargets !== false) {
    for (const target of targetCountries) countryCodes.add(target.countryCode);
  }

  const records = [...countryCodes].sort().map((countryCode): AgidCountryPackDatasetIntakeRecord => {
    const target = targetByCode.get(countryCode) || null;
    const recommendation = recommendAgidPostalCountryPack(countryCode);
    const priorityCountry = priorityByCode.get(countryCode) || null;
    const datasetClass = priorityCountry?.datasetClass
      || (recommendation ? TIER_TO_DATASET_CLASS[recommendation.tier] : 'source-catalog-only');
    const countryName = target?.countryName
      || recommendation?.countryName
      || priorityCountry?.countryName
      || countryCode;
    const sources = getOfficialPostalSourcesForCountry(countryCode);
    const sourceReadiness = sourceReadinessFor(sources);

    let packGenerated = false;
    let packValid = false;
    let packRepositoryName: string | null = null;
    if (target) {
      const pack = buildAgidPostalCountryPack({ countryCode });
      const validation = validateAgidPostalCountryPack(pack);
      packGenerated = true;
      packValid = validation.valid;
      packRepositoryName = pack.manifest.repositoryName;
    }

    const stage = stageFor({ packGenerated, packValid, datasetClass, sourceReadiness });
    const recordCore = {
      countryCode,
      countryName,
      priority: P0_COUNTRY_CODES.has(countryCode) ? 'P0' as const : target ? 'P1' as const : 'P2' as const,
      datasetClass,
      stage,
      packRepositoryName,
      packGenerated,
      packValid,
      sourceReadiness,
      preferredSourceIds: sources
        .filter(source => !source.countryCodes.includes('*'))
        .filter(source => isStrongPostalTrustTier(source.trustTier))
        .map(source => source.id),
      sourceUrls: sources
        .filter(source => !source.countryCodes.includes('*'))
        .map(source => source.url),
      containsPersonalData: false as const,
      containsRawThirdPartyData: false as const,
      minimumPublicDataset: minimumPublicDatasetFor(datasetClass),
    };
    return {
      ...recordCore,
      nextActions: nextActionsFor(recordCore),
      blockers: blockersFor(recordCore),
    };
  });

  const byClass = createEmptyClassCounts();
  const byStage = createEmptyStageCounts();
  for (const record of records) {
    byClass[record.datasetClass] += 1;
    byStage[record.stage] += 1;
  }

  return {
    schemaId: AGID_COUNTRY_PACK_DATASET_INTAKE_SCHEMA_ID,
    generatedAt,
    containsPersonalData: false,
    containsRawThirdPartyData: false,
    summary: {
      totalCountries: records.length,
      p0Countries: records.filter(record => record.priority === 'P0').length,
      generatedPackCountries: records.filter(record => record.packGenerated).length,
      validPackCountries: records.filter(record => record.packValid).length,
      sourceCatalogOnlyCountries: records.filter(record => record.stage === 'source-catalog-only').length,
      normalizedOfficialMunicipalityNeeded: records.filter(record => (
        record.nextActions.includes('ingest normalized official municipality dataset when redistribution terms are reviewed')
      )).length,
      byClass,
      byStage,
    },
    records,
  };
}

export function validateAgidCountryPackDatasetIntakePlan(
  plan: AgidCountryPackDatasetIntakePlan,
): AgidCountryPackDatasetIntakeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const codes = new Set<string>();

  if (plan.schemaId !== AGID_COUNTRY_PACK_DATASET_INTAKE_SCHEMA_ID) errors.push('schema-id-mismatch');
  if (plan.containsPersonalData !== false) errors.push('plan-personal-data-not-false');
  if (plan.containsRawThirdPartyData !== false) errors.push('plan-raw-third-party-data-not-false');
  if (plan.summary.totalCountries !== plan.records.length) errors.push('summary-total-mismatch');

  for (const record of plan.records) {
    if (codes.has(record.countryCode)) errors.push(`duplicate-country:${record.countryCode}`);
    codes.add(record.countryCode);
    if (record.containsPersonalData !== false) errors.push(`record-personal-data-not-false:${record.countryCode}`);
    if (record.containsRawThirdPartyData !== false) errors.push(`record-raw-third-party-data-not-false:${record.countryCode}`);
    if (!record.minimumPublicDataset.includes('source-catalog')) errors.push(`minimum-source-catalog-missing:${record.countryCode}`);
    if (!record.minimumPublicDataset.includes('no-raw-address-policy')) errors.push(`minimum-no-raw-policy-missing:${record.countryCode}`);
    if (record.packGenerated && !record.packRepositoryName) errors.push(`generated-pack-repository-missing:${record.countryCode}`);
    if (record.sourceReadiness === 'global-fallback-only' && record.priority === 'P0') warnings.push(`p0-country-needs-source-review:${record.countryCode}`);
  }

  const p0Records = plan.records.filter(record => record.priority === 'P0');
  for (const requiredClass of ['strong-postcode', 'no-postcode', 'weak-postcode', 'island'] satisfies AgidCountryPackDatasetClass[]) {
    if (!p0Records.some(record => record.datasetClass === requiredClass)) {
      errors.push(`p0-class-missing:${requiredClass}`);
    }
  }

  const stageCounts = createEmptyStageCounts();
  const classCounts = createEmptyClassCounts();
  for (const record of plan.records) {
    stageCounts[record.stage] += 1;
    classCounts[record.datasetClass] += 1;
  }
  if (JSON.stringify(stageCounts) !== JSON.stringify(plan.summary.byStage)) errors.push('stage-counts-mismatch');
  if (JSON.stringify(classCounts) !== JSON.stringify(plan.summary.byClass)) errors.push('class-counts-mismatch');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
