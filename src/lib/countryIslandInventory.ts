import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { buildP0IslandCoverageAudit } from './p0IslandCoverageAudit';

export const COUNTRY_ISLAND_INVENTORY_VERSION = 'country-island-inventory-v0.1';

export type CountryIslandRecord = {
  countryCode: string;
  countryName: string;
  repositories: string[];
  recordedIslandCount: number;
  islandNames: string[];
  islands: Array<{
    name: string;
    agidPlaceId: string | null;
    repository: string;
    adminPath: string[];
    sourceFile: string;
    validationState: string | null;
  }>;
  claimScope: 'complete-all-islands' | 'complete-main-islands' | 'recorded-anchors-only' | 'needs-authoritative-inventory';
  expectedIslandCount: number | null;
  residualRisk: string;
};

export type CountryIslandInventory = {
  version: string;
  generatedAt: string;
  sourceRoot: string;
  countryCount: number;
  totalRecordedIslandAnchors: number;
  countries: CountryIslandRecord[];
  nonClaims: string[];
};

type RawSeedRecord = {
  sourceFile: string;
  repository: string;
  countryCode: string;
  countryName: string;
  name: string;
  featureClass: string;
  agidPlaceId: string | null;
  adminPath: string[];
  validationState: string | null;
};

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });
}

function arrayFromJson(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { places?: unknown[] }).places)) {
    return (parsed as { places: unknown[] }).places;
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { features?: unknown[] }).features)) {
    return (parsed as { features: unknown[] }).features;
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { records?: unknown[] }).records)) {
    return (parsed as { records: unknown[] }).records;
  }
  return parsed ? [parsed] : [];
}

function repoNameFor(root: string, file: string) {
  const relativePath = relative(root, file);
  return relativePath.split(/[\\/]/)[0] ?? '';
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function inferCountryCode(record: Record<string, unknown>, topLevel: Record<string, unknown>, repository: string) {
  const topLevelCode = cleanText(topLevel.countryCode).toUpperCase();
  if (topLevelCode) return topLevelCode;

  const agidPlaceId = cleanText(record.agidPlaceId);
  const agidMatch = /^agid:place:([A-Z0-9_]{2,8})(?::|$)/i.exec(agidPlaceId);
  if (agidMatch) return agidMatch[1].toUpperCase();

  const repoMatch = /^agid-open-([a-z0-9_]{2,8})(?:-|$)/i.exec(repository);
  return repoMatch ? repoMatch[1].toUpperCase().replace(/-/g, '_') : 'UNKNOWN';
}

function inferCountryName(record: Record<string, unknown>, topLevel: Record<string, unknown>, countryCode: string) {
  const topLevelName = cleanText(topLevel.countryName);
  if (topLevelName) return topLevelName;

  const adminPath = Array.isArray(record.adminPath) ? record.adminPath.map(cleanText).filter(Boolean) : [];
  if (adminPath[0]) return adminPath[0];

  return countryCode;
}

function seedFiles(root: string) {
  if (!existsSync(root)) return [];
  return walkFiles(root).filter(file =>
    /[\\/]data[\\/]place-seed\.json$/.test(file) || /[\\/]gazetteer[\\/]place-seeds\.json$/.test(file),
  );
}

export function readOpenGeoSeedRecords(root = join(process.cwd(), 'data', 'open_geo_repositories')): RawSeedRecord[] {
  const records: RawSeedRecord[] = [];
  for (const file of seedFiles(root)) {
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
      const repository = repoNameFor(root, file);
      for (const item of arrayFromJson(parsed)) {
        const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        const localized = record.localizedNames && typeof record.localizedNames === 'object'
          ? record.localizedNames as Record<string, unknown>
          : {};
        const name = cleanText(record.name) || cleanText(localized.en) || cleanText(record.label);
        const countryCode = inferCountryCode(record, parsed, repository);
        records.push({
          sourceFile: relative(process.cwd(), file),
          repository,
          countryCode,
          countryName: inferCountryName(record, parsed, countryCode),
          name,
          featureClass: cleanText(record.featureClass) || cleanText(record.type),
          agidPlaceId: cleanText(record.agidPlaceId) || null,
          adminPath: Array.isArray(record.adminPath) ? record.adminPath.map(cleanText).filter(Boolean) : [],
          validationState: cleanText(record.validationState) || null,
        });
      }
    } catch {
      // JSON validity is covered by repository-specific tests; inventory skips unreadable seed files.
    }
  }
  return records;
}

function dedupeKey(record: RawSeedRecord) {
  return record.agidPlaceId ?? `${record.countryCode}:${record.name.toLowerCase()}`;
}

export function buildCountryIslandInventory(root = join(process.cwd(), 'data', 'open_geo_repositories')): CountryIslandInventory {
  const p0Rows = new Map(buildP0IslandCoverageAudit().rows.map(row => [row.countryCode, row]));
  const islandRecords = readOpenGeoSeedRecords(root)
    .filter(record => record.featureClass.toLowerCase() === 'island' && record.name);
  const byCountry = new Map<string, RawSeedRecord[]>();

  for (const record of islandRecords) {
    const existing = byCountry.get(record.countryCode) ?? [];
    if (!existing.some(item => dedupeKey(item) === dedupeKey(record))) {
      existing.push(record);
      byCountry.set(record.countryCode, existing);
    }
  }

  const countries = Array.from(byCountry.entries()).map(([countryCode, records]) => {
    const sortedRecords = records.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    const p0 = p0Rows.get(countryCode);
    const claimScope = p0?.status === 'passing' && p0.mode === 'complete-all-islands'
      ? 'complete-all-islands'
      : p0?.status === 'passing' && p0.mode === 'complete-main-islands'
        ? 'complete-main-islands'
        : p0
          ? 'needs-authoritative-inventory'
          : 'recorded-anchors-only';
    return {
      countryCode,
      countryName: sortedRecords[0]?.countryName ?? countryCode,
      repositories: Array.from(new Set(sortedRecords.map(record => record.repository))).sort(),
      recordedIslandCount: sortedRecords.length,
      islandNames: sortedRecords.map(record => record.name),
      islands: sortedRecords.map(record => ({
        name: record.name,
        agidPlaceId: record.agidPlaceId,
        repository: record.repository,
        adminPath: record.adminPath,
        sourceFile: record.sourceFile,
        validationState: record.validationState,
      })),
      claimScope,
      expectedIslandCount: p0?.expectedIslandSeeds ?? null,
      residualRisk: claimScope === 'complete-all-islands'
        ? 'Executable P0 gate claims all-island coverage for the scoped public island list, but routing, access, private coordinates, and live boundary geometry remain out of scope.'
        : claimScope === 'complete-main-islands'
          ? 'Executable P0 gate claims main-island coverage only; minor islets, skerries, reefs, and route/access layers remain out of scope.'
          : 'Recorded AGID island anchors only. This is not an official total island count and must be reconciled against authoritative national or marine gazetteers before any completeness claim.',
    } satisfies CountryIslandRecord;
  }).sort((left, right) =>
    right.recordedIslandCount - left.recordedIslandCount || left.countryCode.localeCompare(right.countryCode, 'en'),
  );

  return {
    version: COUNTRY_ISLAND_INVENTORY_VERSION,
    generatedAt: new Date().toISOString(),
    sourceRoot: relative(process.cwd(), root).replace(/\\/g, '/'),
    countryCount: countries.length,
    totalRecordedIslandAnchors: countries.reduce((sum, country) => sum + country.recordedIslandCount, 0),
    countries,
    nonClaims: [
      'recordedIslandCount is the number of explicit AGID featureClass=island anchors currently stored locally, not an official total island count.',
      'Island names are public gazetteer anchors only; no private address, resident, delivery, access, legal boundary, or precise private-coordinate claim is implied.',
      'A complete-all-island claim requires an authoritative per-country island inventory, expected count, source links, fixtures, and an overclaim guard.',
    ],
  };
}
