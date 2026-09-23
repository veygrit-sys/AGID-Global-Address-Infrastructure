import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export type CoreDataPlacement = {
  generatedAt?: string;
  version?: string;
  continents: Array<{
    id: string;
    order?: number;
    regions: Array<{
      id: string;
      countries: Array<{
        code: string;
        name: string;
        repository: string;
        splitStrategy: string;
        recommendedChildren?: string[];
      }>;
    }>;
  }>;
};

export type CoreDataUnitKind = 'country-or-territory-pack' | 'country-index' | 'child-pack';

export type CoreDataUnit = {
  id: string;
  repository: string;
  kind: CoreDataUnitKind;
  continent: string;
  region: string;
  countryCode: string;
  countryName: string;
  splitStrategy: string;
  parentRepository?: string;
};

export type CoreDataLedgerStatus = 'planned' | 'started' | 'completed' | 'verified' | 'published' | 'blocked';

export type CoreDataLedgerEntry = {
  generatedAt: string;
  status: CoreDataLedgerStatus;
  unitId: string;
  repository: string;
  continent: string;
  region: string;
  countryCode: string;
  remainingAfter?: number;
  note?: string;
};

export type CoreDataProductionReport = {
  generatedAt: string;
  placementVersion?: string;
  totalUnits: number;
  completedUnits: number;
  remainingUnits: number;
  selectedUnit: CoreDataUnit | null;
  selectedWasAlreadyInProgress: boolean;
  remainingByContinent: Record<string, number>;
  completedByContinent: Record<string, number>;
  ledgerPath: string;
  dryRun: boolean;
  nextAction: string;
};

const COMPLETED_STATUSES = new Set<CoreDataLedgerStatus>(['completed', 'verified', 'published']);
const IN_PROGRESS_STATUSES = new Set<CoreDataLedgerStatus>(['planned', 'started', 'blocked']);

function argValue(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasArg(name: string) {
  return process.argv.includes(name);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function safeText(value: unknown) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\b(?:recipient|phone|email|witness|privateKey|secret|rawAddress)\b/gi, 'redacted-field')
    .slice(0, 220);
}

export function flattenCoreDataUnits(placement: CoreDataPlacement): CoreDataUnit[] {
  const continents = [...placement.continents].sort((left, right) => (left.order ?? 999) - (right.order ?? 999));
  const units: CoreDataUnit[] = [];

  for (const continent of continents) {
    for (const region of continent.regions) {
      for (const country of region.countries) {
        const isSplit = country.splitStrategy.includes('child-repositories') || (country.recommendedChildren ?? []).length > 0;
        units.push({
          id: country.repository,
          repository: country.repository,
          kind: isSplit ? 'country-index' : 'country-or-territory-pack',
          continent: continent.id,
          region: region.id,
          countryCode: country.code,
          countryName: country.name,
          splitStrategy: country.splitStrategy,
        });

        for (const childRepository of country.recommendedChildren ?? []) {
          units.push({
            id: childRepository,
            repository: childRepository,
            kind: 'child-pack',
            continent: continent.id,
            region: region.id,
            countryCode: country.code,
            countryName: country.name,
            splitStrategy: country.splitStrategy,
            parentRepository: country.repository,
          });
        }
      }
    }
  }

  return units;
}

export function parseCoreDataLedger(text: string): CoreDataLedgerEntry[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as CoreDataLedgerEntry);
}

export function summarizeCoreDataProgress(units: CoreDataUnit[], entries: CoreDataLedgerEntry[]) {
  const latestByUnit = new Map<string, CoreDataLedgerEntry>();
  for (const entry of entries) latestByUnit.set(entry.unitId, entry);

  const completed = new Set<string>();
  const inProgress = new Set<string>();
  for (const [unitId, entry] of latestByUnit) {
    if (COMPLETED_STATUSES.has(entry.status)) completed.add(unitId);
    if (!completed.has(unitId) && IN_PROGRESS_STATUSES.has(entry.status)) inProgress.add(unitId);
  }

  const remainingUnits = units.filter(unit => !completed.has(unit.id));
  const selectedUnit = remainingUnits.find(unit => inProgress.has(unit.id)) ?? remainingUnits[0] ?? null;
  const selectedWasAlreadyInProgress = selectedUnit ? inProgress.has(selectedUnit.id) : false;

  const remainingByContinent: Record<string, number> = {};
  const completedByContinent: Record<string, number> = {};
  for (const unit of units) {
    if (completed.has(unit.id)) {
      completedByContinent[unit.continent] = (completedByContinent[unit.continent] ?? 0) + 1;
    } else {
      remainingByContinent[unit.continent] = (remainingByContinent[unit.continent] ?? 0) + 1;
    }
  }

  return {
    totalUnits: units.length,
    completedUnits: completed.size,
    remainingUnits: remainingUnits.length,
    selectedUnit,
    selectedWasAlreadyInProgress,
    remainingByContinent,
    completedByContinent,
  };
}

export function createCoreDataProductionReport(input: {
  placement: CoreDataPlacement;
  entries: CoreDataLedgerEntry[];
  ledgerPath: string;
  dryRun: boolean;
}): CoreDataProductionReport {
  const units = flattenCoreDataUnits(input.placement);
  const summary = summarizeCoreDataProgress(units, input.entries);
  const selected = summary.selectedUnit;

  return {
    generatedAt: new Date().toISOString(),
    placementVersion: input.placement.version,
    ...summary,
    ledgerPath: input.ledgerPath,
    dryRun: input.dryRun,
    nextAction: selected
      ? `Produce ${selected.repository} (${selected.countryCode}, ${selected.kind}) without raw personal addresses; remaining ${summary.remainingUnits}.`
      : 'All core data production units are completed; start verification and publication review.',
  };
}

function loadLedger(ledgerPath: string) {
  if (!existsSync(ledgerPath)) return [];
  return parseCoreDataLedger(readFileSync(ledgerPath, 'utf8'));
}

function writeLedgerEntry(ledgerPath: string, entry: CoreDataLedgerEntry) {
  mkdirSync(path.dirname(ledgerPath), { recursive: true });
  appendFileSync(ledgerPath, `${JSON.stringify(entry)}\n`, 'utf8');
}

function runCli() {
  const placementPath = path.resolve(argValue('--placement') ?? 'data/global_entities/agid-repository-placement.json');
  const ledgerPath = path.resolve(argValue('--ledger') ?? path.join('reports', 'agid-core-data-production-ledger.jsonl'));
  const write = hasArg('--write');
  const markComplete = argValue('--mark-complete');
  const note = safeText(argValue('--note'));

  const placement = readJson<CoreDataPlacement>(placementPath);
  const entries = loadLedger(ledgerPath);
  const units = flattenCoreDataUnits(placement);

  if (markComplete) {
    const unit = units.find(candidate => candidate.id === markComplete || candidate.repository === markComplete);
    if (!unit) {
      console.error(`Unknown core data unit: ${markComplete}`);
      process.exit(2);
    }
    const remainingAfter = units.length - new Set([
      ...entries.filter(entry => COMPLETED_STATUSES.has(entry.status)).map(entry => entry.unitId),
      unit.id,
    ]).size;
    if (write) {
      writeLedgerEntry(ledgerPath, {
        generatedAt: new Date().toISOString(),
        status: 'completed',
        unitId: unit.id,
        repository: unit.repository,
        continent: unit.continent,
        region: unit.region,
        countryCode: unit.countryCode,
        remainingAfter,
        note,
      });
    }
  }

  const freshEntries = markComplete && write ? loadLedger(ledgerPath) : entries;
  const report = createCoreDataProductionReport({
    placement,
    entries: freshEntries,
    ledgerPath,
    dryRun: !write,
  });

  if (write && report.selectedUnit) {
    writeLedgerEntry(ledgerPath, {
      generatedAt: report.generatedAt,
      status: report.selectedWasAlreadyInProgress ? 'started' : 'planned',
      unitId: report.selectedUnit.id,
      repository: report.selectedUnit.repository,
      continent: report.selectedUnit.continent,
      region: report.selectedUnit.region,
      countryCode: report.selectedUnit.countryCode,
      remainingAfter: report.remainingUnits,
      note: note || report.nextAction,
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli();
}
