import { decodeAGID, encodeAGID, getCellPolygon, type AGIDResult } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import {
  buildAgidResolverConformanceSuite,
  filterAgidResolverConformanceSuite,
  runAgidResolverConformanceSuite,
  validateAgidResolverConformanceSuite,
} from './agidResolverConformance';
import type { AddressFormat } from '../data/address_formats';
import type { AgidSecurePosOpenResult } from './agidSecurePos';
import { isAgidSecureToken, summarizeAgidSecureToken } from './agidSecureShare';
import { isValidAGIDFormat, normalizeAGIDInput } from './agidSecurity';
import {
  buildAddressTestVectorSuite,
  validateAddressTestVectorSuite,
} from './addressTestVectorSuite';

export const AGID_CLI_VERSION = 'agid-cli-v0.1';
export const AGID_CLI_SCHEMA_VERSION = 'agid-cli-output-v0.1';

export type AgidCliRunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

type ParsedArgs = {
  command: string;
  positionals: string[];
  flags: Record<string, string | boolean>;
};

type AgidCliOutputFormat = 'human' | 'json' | 'geojson';

type AgidCliRunOptions = {
  stdin?: string;
  readFile?: (path: string) => string;
  addressFormatResolver?: (countryCode: string) => AddressFormat | null | Promise<AddressFormat | null>;
};

const HELP_TEXT = `AGID CLI ${AGID_CLI_VERSION}

Usage:
  agid encode --lat <lat> --lon <lon> [--json]
  agid decode <AGID> [--json]
  agid validate <AGID> [--json]
  agid resolve <AGID|AGID-S|lat,lon|address text> [--country <code>] [--language <tab>] [--json]
  agid polygon <AGID> [--geojson|--json]
  agid batch <encode|decode|validate> --file <path> --input-format <jsonl|csv> [--json]
  agid conformance [--suite all|resolver|address] [--case <caseId>] [--json]

Commands:
  encode      Encode latitude/longitude into a public AGID.
  decode      Decode a public AGID into its cell center, face, and bounds.
  validate    Validate AGID format and packed cell range.
  resolve     Local-only resolver summary without raw address disclosure.
  polygon     Output the AGID cell polygon.
  batch       Read JSONL/CSV and process many encode/decode/validate jobs.
  conformance Run Resolver Conformance and Address Test Vector checks.
  version     Print CLI version.
  help        Print this help.

Privacy:
  CLI output is no-raw-address by default. Resolve summaries omit address bodies,
  AOID bodies, proof witnesses, proof codes, and private recipient material.

Examples:
  agid encode --lat 35.681236 --lon 139.767125
  agid decode JP01R1A0ZTR4 --json
  agid resolve "35.681236,139.767125" --country JP --json
  agid batch encode --file sample.jsonl --input-format jsonl --json
  agid conformance --suite resolver --case resolver-local-agid-to-cell-v1 --json
`;

function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let command = '';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) continue;

    if (arg === '--') {
      positionals.push(...argv.slice(index + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const [rawKey, inlineValue] = arg.slice(2).split(/=(.*)/s).filter(part => part !== undefined);
      const key = rawKey.trim();
      if (!key) continue;
      if (inlineValue !== undefined) {
        flags[key] = inlineValue;
      } else if (argv[index + 1] && !argv[index + 1].startsWith('-')) {
        flags[key] = argv[index + 1];
        index += 1;
      } else {
        flags[key] = true;
      }
      continue;
    }

    if (arg.startsWith('-') && arg.length > 1) {
      for (const short of arg.slice(1)) {
        if (short === 'j') flags.json = true;
        if (short === 'h') flags.help = true;
        if (short === 'p') flags.pretty = true;
      }
      continue;
    }

    if (!command) command = arg;
    else positionals.push(arg);
  }

  return {
    command: command || (flags.help ? 'help' : ''),
    positionals,
    flags,
  };
}

function getFlag(flags: Record<string, string | boolean>, ...names: string[]) {
  for (const name of names) {
    const value = flags[name];
    if (value !== undefined) return value;
  }
  return undefined;
}

function getFlagString(flags: Record<string, string | boolean>, ...names: string[]) {
  const value = getFlag(flags, ...names);
  return typeof value === 'string' ? value : undefined;
}

function getFlagNumber(flags: Record<string, string | boolean>, ...names: string[]) {
  const raw = getFlagString(flags, ...names);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

function outputFormat(flags: Record<string, string | boolean>): AgidCliOutputFormat {
  const format = getFlagString(flags, 'format')?.toLowerCase();
  if (format === 'geojson') return 'geojson';
  if (format === 'json') return 'json';
  if (flags.geojson) return 'geojson';
  if (flags.json) return 'json';
  return 'human';
}

function json(value: unknown, pretty = false) {
  return `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`;
}

function withCliSchema<T extends Record<string, unknown>>(command: string, value: T) {
  return {
    schemaVersion: AGID_CLI_SCHEMA_VERSION,
    cliVersion: AGID_CLI_VERSION,
    command,
    ...value,
  };
}

function ok(stdout: string): AgidCliRunResult {
  return { exitCode: 0, stdout, stderr: '' };
}

function fail(message: string, exitCode = 1): AgidCliRunResult {
  return { exitCode, stdout: '', stderr: `${message}\n` };
}

function coordinateFromFlags(flags: Record<string, string | boolean>) {
  const lat = getFlagNumber(flags, 'lat', 'latitude');
  const lon = getFlagNumber(flags, 'lon', 'lng', 'longitude');
  if (lat === undefined && lon === undefined) return null;
  if (lat === undefined || lon === undefined || Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new Error('Both --lat and --lon must be finite numbers.');
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Coordinates are out of range.');
  }
  return { lat, lon };
}

function coordinateFromText(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function agidSummary(result: AGIDResult) {
  return {
    id: result.id,
    prefix: result.prefix,
    regionCode: result.regionCode,
    regionName: result.regionName,
    type: result.isSea ? 'water' : 'land',
    gridSizeMetersApprox: result.gridSize,
    center: {
      lat: result.lat,
      lon: result.lon,
    },
    cell: {
      face: result.face,
      qx: result.qx,
      qy: result.qy,
    },
    bounds: result.bounds,
  };
}

function decodeSummary(input: string) {
  const normalized = normalizeAGIDInput(input);
  if (!normalized || !isValidAGIDFormat(normalized)) return null;
  const decoded = decodeAGID(normalized);
  if (!decoded) return null;
  const region = encodeAGID(decoded.lat, decoded.lon);
  return {
    id: normalized,
    prefix: decoded.prefix,
    regionCode: region.regionCode,
    regionName: region.regionName,
    type: region.isSea ? 'water' : 'land',
    center: {
      lat: decoded.lat,
      lon: decoded.lon,
    },
    cell: {
      face: decoded.face,
      qx: decoded.qx,
      qy: decoded.qy,
    },
    bounds: decoded.bounds,
    polygon: getCellPolygon(decoded.face, decoded.qx, decoded.qy),
  };
}

function geoJsonFeature(summary: ReturnType<typeof decodeSummary> | ReturnType<typeof agidSummary>) {
  if (!summary) return null;
  const polygon = 'polygon' in summary && summary.polygon
    ? summary.polygon
    : getCellPolygon(summary.cell.face, summary.cell.qx, summary.cell.qy);
  return {
    schemaVersion: AGID_CLI_SCHEMA_VERSION,
    cliVersion: AGID_CLI_VERSION,
    type: 'Feature',
    properties: {
      agid: summary.id,
      prefix: summary.prefix,
      regionCode: summary.regionCode,
      regionName: summary.regionName,
      type: summary.type,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [polygon],
    },
  };
}

function encodeHuman(summary: ReturnType<typeof agidSummary>) {
  return [
    `AGID: ${summary.id}`,
    `Region: ${summary.regionName} (${summary.regionCode})`,
    `Type: ${summary.type}`,
    `Center: ${summary.center.lat.toFixed(6)}, ${summary.center.lon.toFixed(6)}`,
    `Cell: face=${summary.cell.face} qx=${summary.cell.qx} qy=${summary.cell.qy}`,
    `Bounds: ${summary.bounds.minLat.toFixed(6)},${summary.bounds.minLon.toFixed(6)} -> ${summary.bounds.maxLat.toFixed(6)},${summary.bounds.maxLon.toFixed(6)}`,
    '',
  ].join('\n');
}

function decodeHuman(summary: NonNullable<ReturnType<typeof decodeSummary>>) {
  return [
    `AGID: ${summary.id}`,
    `Valid: yes`,
    `Region: ${summary.regionName} (${summary.regionCode})`,
    `Type: ${summary.type}`,
    `Center: ${summary.center.lat.toFixed(6)}, ${summary.center.lon.toFixed(6)}`,
    `Cell: face=${summary.cell.face} qx=${summary.cell.qx} qy=${summary.cell.qy}`,
    `Bounds: ${summary.bounds.minLat.toFixed(6)},${summary.bounds.minLon.toFixed(6)} -> ${summary.bounds.maxLat.toFixed(6)},${summary.bounds.maxLon.toFixed(6)}`,
    '',
  ].join('\n');
}

function validationSummary(input: string) {
  const normalized = normalizeAGIDInput(input);
  const formatValid = Boolean(normalized && isValidAGIDFormat(normalized));
  const decoded = formatValid && normalized ? decodeAGID(normalized) : null;
  return {
    schemaVersion: AGID_CLI_SCHEMA_VERSION,
    cliVersion: AGID_CLI_VERSION,
    command: 'validate',
    input,
    normalized,
    valid: Boolean(decoded),
    formatValid,
    decodable: Boolean(decoded),
    kind: isAgidSecureToken(input) ? 'agid-s' : 'agid',
    secureSummary: isAgidSecureToken(input) ? summarizeAgidSecureToken(input) : null,
  };
}

function secureOpenSummary(modelVersion: string, opened: AgidSecurePosOpenResult) {
  if ('error' in opened) {
    return {
      modelVersion,
      opened: false as const,
      error: opened.error,
    };
  }
  return {
    modelVersion,
    opened: true as const,
  };
}

function resolveSafeSummary(result: Awaited<ReturnType<typeof resolveAgidLocal>>) {
  const secureOpened = result.secure?.opened;
  return {
    schemaVersion: AGID_CLI_SCHEMA_VERSION,
    cliVersion: AGID_CLI_VERSION,
    command: 'resolve',
    resolverVersion: result.resolverVersion,
    mode: result.mode,
    status: result.status,
    inputKind: result.inputKind,
    agid: result.agid ? agidSummary(result.agid) : result.agidId ? { id: result.agidId } : undefined,
    coordinates: result.coordinates,
    secure: result.secure && secureOpened
      ? secureOpenSummary(result.secure.modelVersion, secureOpened)
      : undefined,
    addressFormat: result.addressFormat ? {
      countryCode: result.addressFormat.countryCode,
      name: result.addressFormat.name,
      postalCodeFormat: result.addressFormat.postalCode?.format,
    } : undefined,
    intelligence: result.intelligence ? {
      engineVersion: result.intelligence.engineVersion,
      decision: result.intelligence.decision,
      confidence: result.intelligence.confidence,
      delivery: result.intelligence.delivery,
      rendering: result.intelligence.rendering,
      actions: result.intelligence.actions,
      audit: result.intelligence.audit,
    } : undefined,
    actions: result.actions,
    warnings: result.warnings,
    audit: result.audit,
  };
}

function resolveHuman(summary: ReturnType<typeof resolveSafeSummary>) {
  const lines = [
    `Status: ${summary.status}`,
    `Input: ${summary.inputKind}`,
    `Mode: ${summary.mode}`,
  ];
  if (summary.agid?.id) lines.push(`AGID: ${summary.agid.id}`);
  if (summary.coordinates) {
    lines.push(`Coordinates: ${summary.coordinates.lat.toFixed(6)}, ${summary.coordinates.lon.toFixed(6)}`);
  }
  if (summary.intelligence) {
    lines.push(`Decision: ${summary.intelligence.decision}`);
    lines.push(`Delivery: ${summary.intelligence.delivery.decision}`);
    lines.push(`Confidence: ${summary.intelligence.confidence}`);
  }
  if (summary.actions.length) lines.push(`Actions: ${summary.actions.join(', ')}`);
  if (summary.warnings.length) lines.push(`Warnings: ${summary.warnings.join(', ')}`);
  return `${lines.join('\n')}\n`;
}

function cliAddressFormatLookup(options: AgidCliRunOptions) {
  return options.addressFormatResolver
    ? {
        addressFormatResolver: (countryCode: string) => Promise.resolve(options.addressFormatResolver?.(countryCode) ?? null),
      }
    : {
        addressFormat: null,
      };
}

function getInput(parsed: ParsedArgs, stdin?: string) {
  return getFlagString(parsed.flags, 'input', 'query')
    || parsed.positionals.join(' ').trim()
    || (parsed.flags.stdin ? (stdin || '').trim() : '');
}

function inferInputFormat(parsed: ParsedArgs): 'jsonl' | 'csv' {
  const explicit = getFlagString(parsed.flags, 'input-format', 'inputFormat', 'format-in')?.toLowerCase();
  if (explicit === 'csv' || explicit === 'jsonl') return explicit;
  const file = getFlagString(parsed.flags, 'file', 'f')?.toLowerCase();
  if (file?.endsWith('.csv')) return 'csv';
  return 'jsonl';
}

function readBatchInput(parsed: ParsedArgs, options: AgidCliRunOptions) {
  const file = getFlagString(parsed.flags, 'file', 'f');
  if (file) {
    if (!options.readFile) throw new Error('Batch --file requires a file reader in this runtime.');
    return options.readFile(file);
  }
  if (parsed.flags.stdin) return options.stdin || '';
  if (options.stdin) return options.stdin;
  throw new Error('batch requires --file <path> or --stdin.');
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map(header => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function parseJsonl(text: string) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        const parsed = JSON.parse(line);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('record must be an object');
        }
        return parsed as Record<string, unknown>;
      } catch (error) {
        throw new Error(`Invalid JSONL at line ${index + 1}: ${error instanceof Error ? error.message : 'parse failed'}`);
      }
    });
}

function batchRecords(text: string, format: 'jsonl' | 'csv') {
  return format === 'csv' ? parseCsv(text) : parseJsonl(text);
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function batchInputRef(record: Record<string, unknown>, index: number) {
  return firstString(record, ['id', 'ref', 'rowId', 'name']) || `row-${index + 1}`;
}

function batchOne(operation: string, record: Record<string, unknown>, index: number) {
  const inputRef = batchInputRef(record, index);

  try {
    if (operation === 'encode') {
      const lat = firstNumber(record, ['lat', 'latitude']);
      const lon = firstNumber(record, ['lon', 'lng', 'longitude']);
      if (lat === undefined || lon === undefined || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('encode record requires valid lat/lon');
      }
      return {
        schemaVersion: AGID_CLI_SCHEMA_VERSION,
        cliVersion: AGID_CLI_VERSION,
        command: 'batch',
        operation,
        index,
        inputRef,
        ok: true,
        result: agidSummary(encodeAGID(lat, lon)),
      };
    }

    if (operation === 'decode') {
      const agid = firstString(record, ['agid', 'id', 'query']);
      const result = agid ? decodeSummary(agid) : null;
      if (!result) throw new Error('decode record requires a valid AGID');
      return {
        schemaVersion: AGID_CLI_SCHEMA_VERSION,
        cliVersion: AGID_CLI_VERSION,
        command: 'batch',
        operation,
        index,
        inputRef,
        ok: true,
        result: withCliSchema('decode', result),
      };
    }

    if (operation === 'validate') {
      const agid = firstString(record, ['agid', 'id', 'query']);
      if (!agid) throw new Error('validate record requires agid/id/query');
      return {
        schemaVersion: AGID_CLI_SCHEMA_VERSION,
        cliVersion: AGID_CLI_VERSION,
        command: 'batch',
        operation,
        index,
        inputRef,
        ok: true,
        result: validationSummary(agid),
      };
    }

    throw new Error(`Unsupported batch operation: ${operation}`);
  } catch (error) {
    return {
      schemaVersion: AGID_CLI_SCHEMA_VERSION,
      cliVersion: AGID_CLI_VERSION,
      command: 'batch',
      operation,
      index,
      inputRef,
      ok: false,
      error: error instanceof Error ? error.message : 'batch record failed',
    };
  }
}

async function handleBatch(parsed: ParsedArgs, options: AgidCliRunOptions): Promise<AgidCliRunResult> {
  const operation = (getFlagString(parsed.flags, 'operation', 'op') || parsed.positionals[0] || '').toLowerCase();
  if (!['encode', 'decode', 'validate'].includes(operation)) {
    return fail('batch requires operation: encode, decode, or validate.');
  }

  let text: string;
  try {
    text = readBatchInput(parsed, options);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Could not read batch input.');
  }

  let records: Record<string, unknown>[];
  const inputFormat = inferInputFormat(parsed);
  try {
    records = batchRecords(text, inputFormat);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Could not parse batch input.');
  }

  const results = records.map((record, index) => batchOne(operation, record, index));
  const failed = results.filter(result => !result.ok).length;
  const summary = {
    schemaVersion: AGID_CLI_SCHEMA_VERSION,
    cliVersion: AGID_CLI_VERSION,
    command: 'batch',
    operation,
    inputFormat,
    total: results.length,
    ok: results.length - failed,
    failed,
    results,
  };

  if (parsed.flags.jsonl) return ok(results.map(result => JSON.stringify(result)).join('\n') + '\n');
  if (outputFormat(parsed.flags) === 'json') return ok(json(summary, Boolean(parsed.flags.pretty)));
  return ok([
    `Batch: ${operation}`,
    `Input format: ${inputFormat}`,
    `Total: ${summary.total}`,
    `OK: ${summary.ok}`,
    `Failed: ${summary.failed}`,
    '',
  ].join('\n'));
}

async function handleConformance(parsed: ParsedArgs): Promise<AgidCliRunResult> {
  const suite = (getFlagString(parsed.flags, 'suite') || parsed.positionals[0] || 'all').toLowerCase();
  if (!['all', 'resolver', 'address'].includes(suite)) {
    return fail('conformance --suite must be all, resolver, or address.');
  }
  const caseFilter = getFlagString(parsed.flags, 'case', 'case-id', 'caseId');
  if (caseFilter && suite === 'address') {
    return fail('conformance --case applies to resolver cases. Use --suite resolver or --suite all.');
  }

  const baseResolverSuite = suite !== 'address' ? buildAgidResolverConformanceSuite() : null;
  const resolverSuite = baseResolverSuite && caseFilter
    ? filterAgidResolverConformanceSuite(baseResolverSuite, testCase => testCase.caseId === caseFilter)
    : baseResolverSuite;
  if (caseFilter && resolverSuite && resolverSuite.cases.length === 0) {
    return fail(`Conformance case not found: ${caseFilter}`);
  }
  const resolverValidation = resolverSuite ? validateAgidResolverConformanceSuite(resolverSuite) : null;
  const resolverRun = resolverSuite ? await runAgidResolverConformanceSuite(resolverSuite) : null;
  const addressSuite = suite !== 'resolver' ? buildAddressTestVectorSuite() : null;
  const addressValidation = addressSuite ? validateAddressTestVectorSuite(addressSuite) : null;
  const passed = Boolean(
    (!resolverValidation || resolverValidation.valid)
      && (!resolverRun || resolverRun.passed)
      && (!addressValidation || addressValidation.valid),
  );
  const summary = {
    schemaVersion: AGID_CLI_SCHEMA_VERSION,
    cliVersion: AGID_CLI_VERSION,
    command: 'conformance',
    suite,
    caseFilter: caseFilter || null,
    passed,
    resolver: resolverSuite && resolverValidation && resolverRun ? {
      version: resolverSuite.manifest.version,
      cases: resolverSuite.cases.length,
      caseIds: resolverSuite.cases.map(testCase => testCase.caseId),
      valid: resolverValidation.valid,
      validationErrors: resolverValidation.errors,
      validationWarnings: resolverValidation.warnings,
      passed: resolverRun.passed,
      failedCases: resolverRun.results.filter(result => !result.passed).map(result => ({
        caseId: result.caseId,
        errors: result.errors,
      })),
    } : undefined,
    addressTestVectors: addressSuite && addressValidation ? {
      version: addressSuite.manifest.version,
      vectors: addressSuite.vectors.length,
      countries: addressSuite.manifest.counts.countries,
      valid: addressValidation.valid,
      errors: addressValidation.errors,
      warnings: addressValidation.warnings,
    } : undefined,
  };

  if (outputFormat(parsed.flags) === 'json') return ok(json(summary, Boolean(parsed.flags.pretty)));
  return ok([
    `Conformance: ${passed ? 'passed' : 'failed'}`,
    resolverSuite ? `Resolver cases: ${resolverSuite.cases.length}` : '',
    addressSuite ? `Address vectors: ${addressSuite.vectors.length}` : '',
    '',
  ].filter(Boolean).join('\n'));
}

async function handleEncode(parsed: ParsedArgs): Promise<AgidCliRunResult> {
  let coordinate;
  try {
    coordinate = coordinateFromFlags(parsed.flags);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Invalid coordinates.');
  }
  if (!coordinate) return fail('encode requires --lat and --lon.');

  const result = agidSummary(encodeAGID(coordinate.lat, coordinate.lon));
  const format = outputFormat(parsed.flags);
  if (format === 'json') return ok(json(withCliSchema('encode', result), Boolean(parsed.flags.pretty)));
  if (format === 'geojson') return ok(json(geoJsonFeature(result), Boolean(parsed.flags.pretty)));
  return ok(encodeHuman(result));
}

async function handleDecode(parsed: ParsedArgs, stdin?: string): Promise<AgidCliRunResult> {
  const input = getInput(parsed, stdin);
  if (!input) return fail('decode requires an AGID input.');
  const summary = decodeSummary(input);
  if (!summary) return fail('Invalid or undecodable AGID.');
  const format = outputFormat(parsed.flags);
  if (format === 'json') return ok(json(withCliSchema('decode', summary), Boolean(parsed.flags.pretty)));
  if (format === 'geojson') return ok(json(geoJsonFeature(summary), Boolean(parsed.flags.pretty)));
  return ok(decodeHuman(summary));
}

async function handleValidate(parsed: ParsedArgs, stdin?: string): Promise<AgidCliRunResult> {
  const input = getInput(parsed, stdin);
  if (!input) return fail('validate requires an AGID or AGID-S input.');
  const summary = validationSummary(input);
  if (outputFormat(parsed.flags) === 'json') return ok(json(summary, Boolean(parsed.flags.pretty)));
  return ok(`${summary.valid ? 'valid' : 'invalid'} ${summary.normalized || input}\n`);
}

async function handleResolve(
  parsed: ParsedArgs,
  stdin: string | undefined,
  options: AgidCliRunOptions,
): Promise<AgidCliRunResult> {
  let coordinate;
  try {
    coordinate = coordinateFromFlags(parsed.flags);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Invalid coordinates.');
  }

  const input = getInput(parsed, stdin);
  const textCoordinate = input ? coordinateFromText(input) : null;
  const countryCode = getFlagString(parsed.flags, 'country', 'country-code', 'countryCode');
  const selectedLanguageTab = getFlagString(parsed.flags, 'language', 'language-tab', 'tab');
  const addressFormatLookup = cliAddressFormatLookup(options);
  const result = await resolveAgidLocal(
    coordinate || textCoordinate
      ? {
          coordinates: coordinate || textCoordinate || undefined,
          countryCode,
          selectedLanguageTab,
          ...addressFormatLookup,
        }
      : {
          query: input,
          countryCode,
          selectedLanguageTab,
          ...addressFormatLookup,
        },
  );
  const summary = resolveSafeSummary(result);
  if (outputFormat(parsed.flags) === 'json') return ok(json(summary, Boolean(parsed.flags.pretty)));
  return ok(resolveHuman(summary));
}

async function handlePolygon(parsed: ParsedArgs, stdin?: string): Promise<AgidCliRunResult> {
  let coordinate;
  try {
    coordinate = coordinateFromFlags(parsed.flags);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Invalid coordinates.');
  }

  const input = getInput(parsed, stdin);
  const summary = coordinate
    ? agidSummary(encodeAGID(coordinate.lat, coordinate.lon))
    : decodeSummary(input);
  if (!summary) return fail('polygon requires a valid AGID or --lat/--lon.');

  const feature = geoJsonFeature(summary);
  const format = outputFormat(parsed.flags);
  if (format === 'geojson' || format === 'json') return ok(json(feature, Boolean(parsed.flags.pretty)));
  return ok([
    `AGID: ${summary.id}`,
    'Polygon:',
    ...feature!.geometry.coordinates[0].map(([lon, lat]) => `  ${lat.toFixed(6)}, ${lon.toFixed(6)}`),
    '',
  ].join('\n'));
}

export async function runAgidCli(argv: readonly string[], options: AgidCliRunOptions = {}): Promise<AgidCliRunResult> {
  const parsed = parseArgs(argv);
  const command = parsed.command.toLowerCase();

  if (!command || command === 'help' || parsed.flags.help) return ok(HELP_TEXT);
  if (command === 'version' || command === '--version') return ok(`${AGID_CLI_VERSION}\n`);

  switch (command) {
    case 'encode':
      return handleEncode(parsed);
    case 'decode':
      return handleDecode(parsed, options.stdin);
    case 'validate':
      return handleValidate(parsed, options.stdin);
    case 'resolve':
      return handleResolve(parsed, options.stdin, options);
    case 'polygon':
      return handlePolygon(parsed, options.stdin);
    case 'batch':
      return handleBatch(parsed, options);
    case 'conformance':
      return handleConformance(parsed);
    default:
      return fail(`Unknown command: ${parsed.command}\n\n${HELP_TEXT}`, 2);
  }
}
