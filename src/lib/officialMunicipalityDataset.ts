import type { PostalZoneDesignerMunicipalityOption } from './postalZoneDesigner';

export const OFFICIAL_MUNICIPALITY_DATASET_SCHEMA_VERSION = 'agid-official-municipality-dataset-v0.1';

export type OfficialMunicipalitySource = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  provider: string;
  licenseOrTerms: string;
  retrievedAt: string;
  sourceVersion?: string;
  redistributionStatus: 'allowed' | 'metadata-only' | 'review-required' | 'not-bundled';
  notes: string[];
};

export type OfficialMunicipalityLocalityKind = 'municipality' | 'town' | 'block';

export type OfficialMunicipalityRecord = {
  countryCode: string;
  officialId: string;
  name: string;
  kind: OfficialMunicipalityLocalityKind;
  parentOfficialId?: string | null;
  codePart?: string;
  language?: string;
  aliases?: Array<{
    label: string;
    language: string;
    status: 'preferred' | 'english' | 'romanized' | 'historic' | 'official';
  }>;
  sourceId: string;
  geometryRef?: string;
  centroid?: {
    lat: number;
    lng: number;
  };
};

export type OfficialMunicipalityDataset = {
  schemaVersion: typeof OFFICIAL_MUNICIPALITY_DATASET_SCHEMA_VERSION;
  countryCode: string;
  generatedAt: string;
  sourceCatalog: OfficialMunicipalitySource[];
  records: OfficialMunicipalityRecord[];
};

export type OfficialMunicipalityDatasetValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type OfficialMunicipalityDatasetSummary = {
  mode: 'official-dataset' | 'synthetic-fixture';
  countryCode: string;
  sourceCount: number;
  recordCount: number;
  municipalityCount: number;
  townCount: number;
  blockCount: number;
  sourceIds: string[];
  coverageNote: string;
};

function normalizeCountryCode(countryCode: string) {
  return countryCode.trim().toUpperCase();
}

function normalizeCodePart(value: string | undefined, index: number) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized) return normalized.slice(0, 4);
  return (index + 1).toString(36).toUpperCase().padStart(2, '0');
}

function stableOfficialId(...parts: string[]) {
  return parts
    .join(':')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateOfficialMunicipalityDataset(
  dataset: OfficialMunicipalityDataset,
  expectedCountryCode?: string,
): OfficialMunicipalityDatasetValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const countryCode = normalizeCountryCode(dataset.countryCode || '');
  const recordIds = new Set<string>();
  const sourceIds = new Set(dataset.sourceCatalog.map(source => source.sourceId));

  if (dataset.schemaVersion !== OFFICIAL_MUNICIPALITY_DATASET_SCHEMA_VERSION) errors.push('schema-version-mismatch');
  if (!countryCode) errors.push('country-code-missing');
  if (expectedCountryCode && countryCode !== normalizeCountryCode(expectedCountryCode)) errors.push('country-code-mismatch');
  if (!dataset.generatedAt) warnings.push('generated-at-missing');
  if (dataset.sourceCatalog.length === 0) errors.push('source-catalog-empty');
  if (dataset.records.length === 0) errors.push('records-empty');

  for (const source of dataset.sourceCatalog) {
    if (!source.sourceId || !source.sourceName || !source.sourceUrl) errors.push(`source-missing-required-field:${source.sourceId}`);
    if (!source.licenseOrTerms) errors.push(`source-license-missing:${source.sourceId}`);
    if (source.redistributionStatus !== 'allowed') warnings.push(`source-redistribution-review:${source.sourceId}`);
  }

  for (const record of dataset.records) {
    if (normalizeCountryCode(record.countryCode) !== countryCode) errors.push(`record-country-mismatch:${record.officialId}`);
    if (!record.officialId || !record.name) errors.push(`record-missing-id-or-name:${record.officialId}`);
    if (recordIds.has(record.officialId)) errors.push(`duplicate-record-id:${record.officialId}`);
    recordIds.add(record.officialId);
    if (!sourceIds.has(record.sourceId)) errors.push(`record-source-missing:${record.officialId}`);
    if (record.parentOfficialId && !dataset.records.some(parent => parent.officialId === record.parentOfficialId)) {
      errors.push(`record-parent-missing:${record.officialId}`);
    }
  }

  if (!dataset.records.some(record => record.kind === 'municipality')) {
    errors.push('municipality-records-missing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function summarizeOfficialMunicipalityDataset(
  dataset: OfficialMunicipalityDataset | null,
  countryCode: string,
): OfficialMunicipalityDatasetSummary {
  if (!dataset) {
    return {
      mode: 'synthetic-fixture',
      countryCode: normalizeCountryCode(countryCode),
      sourceCount: 0,
      recordCount: 0,
      municipalityCount: 0,
      townCount: 0,
      blockCount: 0,
      sourceIds: [],
      coverageNote: 'No normalized official municipality dataset was provided; AGID uses safe synthetic planning fixtures only.',
    };
  }

  return {
    mode: 'official-dataset',
    countryCode: normalizeCountryCode(dataset.countryCode),
    sourceCount: dataset.sourceCatalog.length,
    recordCount: dataset.records.length,
    municipalityCount: dataset.records.filter(record => record.kind === 'municipality').length,
    townCount: dataset.records.filter(record => record.kind === 'town').length,
    blockCount: dataset.records.filter(record => record.kind === 'block').length,
    sourceIds: dataset.sourceCatalog.map(source => source.sourceId),
    coverageNote: 'Official municipality records are loaded from a normalized local dataset and remain subject to source license and freshness review.',
  };
}

export function buildPostalZoneMunicipalityOptionsFromOfficialDataset(
  dataset: OfficialMunicipalityDataset,
): PostalZoneDesignerMunicipalityOption[] {
  const validation = validateOfficialMunicipalityDataset(dataset);
  if (!validation.valid) {
    throw new Error(`Official municipality dataset is invalid: ${validation.errors.join(', ')}`);
  }

  const countryCode = normalizeCountryCode(dataset.countryCode);
  const municipalities = dataset.records
    .filter(record => record.kind === 'municipality')
    .sort((left, right) => left.name.localeCompare(right.name));
  const towns = dataset.records.filter(record => record.kind === 'town');
  const blocks = dataset.records.filter(record => record.kind === 'block');

  return municipalities.map((municipality, municipalityIndex) => {
    const childTowns = towns
      .filter(town => town.parentOfficialId === municipality.officialId)
      .sort((left, right) => left.name.localeCompare(right.name));
    const normalizedTowns = (childTowns.length > 0 ? childTowns : [{
      countryCode,
      officialId: stableOfficialId(countryCode, municipality.officialId, 'delivery-area'),
      name: `${municipality.name} delivery area`,
      kind: 'town' as const,
      parentOfficialId: municipality.officialId,
      codePart: '00',
      language: municipality.language,
      sourceId: municipality.sourceId,
    }]).map((town, townIndex) => {
      const childBlocks = blocks
        .filter(block => block.parentOfficialId === town.officialId)
        .sort((left, right) => left.name.localeCompare(right.name));
      const normalizedBlocks = childBlocks.length > 0 ? childBlocks : [{
        countryCode,
        officialId: stableOfficialId(countryCode, town.officialId, 'zone-1'),
        name: 'Planning zone 1',
        kind: 'block' as const,
        parentOfficialId: town.officialId,
        codePart: '01',
        language: town.language,
        sourceId: town.sourceId,
      }];

      return {
        id: `${countryCode}-${town.officialId}`,
        name: town.name,
        codePart: normalizeCodePart(town.codePart, townIndex),
        chomes: normalizedBlocks.map((block, blockIndex) => ({
          id: `${countryCode}-${block.officialId}`,
          label: block.name,
          codePart: normalizeCodePart(block.codePart, blockIndex),
        })),
      };
    });

    return {
      id: `${countryCode}-${municipality.officialId}`,
      name: municipality.name,
      codePart: normalizeCodePart(municipality.codePart, municipalityIndex),
      towns: normalizedTowns,
    };
  });
}
