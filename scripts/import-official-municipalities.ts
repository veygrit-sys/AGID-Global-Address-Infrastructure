import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import {
  OFFICIAL_MUNICIPALITY_DATASET_SCHEMA_VERSION,
  validateOfficialMunicipalityDataset,
  type OfficialMunicipalityDataset,
  type OfficialMunicipalityRecord,
} from '../src/lib/officialMunicipalityDataset';

type ImportArgs = {
  countryCode: string;
  inputPath: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  provider: string;
  licenseOrTerms: string;
  retrievedAt: string;
  redistributionStatus: 'allowed' | 'metadata-only' | 'review-required' | 'not-bundled';
  outputRoot: string;
};

function readArg(name: string, fallback = '') {
  const prefix = `--${name}=`;
  const value = process.argv.find(arg => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

function parseArgs(): ImportArgs {
  const countryCode = readArg('country').toUpperCase();
  const inputPath = readArg('input');
  if (!countryCode || !inputPath) {
    throw new Error('Usage: npm run import:official-municipalities -- --country=FJ --input=path/to/municipalities.csv --source-id=fj-official-admin --source-name="Official admin units" --source-url=https://example.gov --provider="Official provider" --license="Open data terms"');
  }
  return {
    countryCode,
    inputPath,
    sourceId: readArg('source-id', `${countryCode.toLowerCase()}-official-municipalities`),
    sourceName: readArg('source-name', `${countryCode} official municipalities`),
    sourceUrl: readArg('source-url', 'source-url-required'),
    provider: readArg('provider', 'official-provider-required'),
    licenseOrTerms: readArg('license', 'license-review-required'),
    retrievedAt: readArg('retrieved-at', '2026-06-20'),
    redistributionStatus: readArg('redistribution', 'review-required') as ImportArgs['redistributionStatus'],
    outputRoot: readArg('output-root', join(process.cwd(), 'data', 'official_municipalities')),
  };
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some(value => value.trim())) rows.push(row);
      field = '';
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function recordsFromCsv(countryCode: string, sourceId: string, text: string): OfficialMunicipalityRecord[] {
  const [header = [], ...rows] = parseCsv(text);
  const lookup = new Map(header.map((name, index) => [name.trim(), index]));
  const get = (row: string[], name: string) => {
    const index = lookup.get(name);
    return index === undefined ? '' : (row[index] || '').trim();
  };
  return rows.map((row, index) => ({
    countryCode,
    officialId: get(row, 'officialId') || get(row, 'id') || `${countryCode}-${index + 1}`,
    name: get(row, 'name'),
    kind: (get(row, 'kind') || 'municipality') as OfficialMunicipalityRecord['kind'],
    parentOfficialId: get(row, 'parentOfficialId') || get(row, 'parentId') || null,
    codePart: get(row, 'codePart') || undefined,
    language: get(row, 'language') || undefined,
    sourceId: get(row, 'sourceId') || sourceId,
    geometryRef: get(row, 'geometryRef') || undefined,
    centroid: get(row, 'lat') && get(row, 'lng')
      ? { lat: Number(get(row, 'lat')), lng: Number(get(row, 'lng')) }
      : undefined,
  })).filter(record => record.name);
}

async function readRecords(args: ImportArgs): Promise<OfficialMunicipalityRecord[]> {
  const text = await readFile(args.inputPath, 'utf8');
  if (extname(args.inputPath).toLowerCase() === '.csv') {
    return recordsFromCsv(args.countryCode, args.sourceId, text);
  }
  const parsed = JSON.parse(text);
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  if (!Array.isArray(records)) throw new Error('JSON input must be an array or an object with records[]');
  return records.map((record, index) => ({
    countryCode: args.countryCode,
    officialId: String(record.officialId || record.id || `${args.countryCode}-${index + 1}`),
    name: String(record.name || ''),
    kind: (record.kind || 'municipality') as OfficialMunicipalityRecord['kind'],
    parentOfficialId: record.parentOfficialId || record.parentId || null,
    codePart: record.codePart,
    language: record.language,
    aliases: record.aliases,
    sourceId: record.sourceId || args.sourceId,
    geometryRef: record.geometryRef,
    centroid: record.centroid,
  })).filter(record => record.name);
}

async function main() {
  const args = parseArgs();
  const records = await readRecords(args);
  const dataset: OfficialMunicipalityDataset = {
    schemaVersion: OFFICIAL_MUNICIPALITY_DATASET_SCHEMA_VERSION,
    countryCode: args.countryCode,
    generatedAt: new Date().toISOString(),
    sourceCatalog: [{
      sourceId: args.sourceId,
      sourceName: args.sourceName,
      sourceUrl: args.sourceUrl,
      provider: args.provider,
      licenseOrTerms: args.licenseOrTerms,
      retrievedAt: args.retrievedAt,
      redistributionStatus: args.redistributionStatus,
      notes: ['normalized by AGID official municipality importer'],
    }],
    records,
  };
  const validation = validateOfficialMunicipalityDataset(dataset, args.countryCode);
  if (!validation.valid) {
    throw new Error(`Imported official municipality dataset is invalid: ${validation.errors.join(', ')}`);
  }
  await mkdir(args.outputRoot, { recursive: true });
  const outPath = join(args.outputRoot, `${args.countryCode.toLowerCase()}.json`);
  await writeFile(outPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
  console.log(`Official municipality dataset exported to ${outPath}`);
  console.log(`records=${records.length}`);
  console.log(`warnings=${validation.warnings.length}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
