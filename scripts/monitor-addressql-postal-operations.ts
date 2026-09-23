import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION,
  buildAddressQlPostalOperationsReport,
  parseAddressQlPostalOperationsInput,
  validateAddressQlPostalOperationsReport,
  type AddressQlPostalOperationsPreviousReport,
} from '../src/lib/addressQlPostalOperations';

const MAX_INPUT_BYTES = 16 * 1024 * 1024;

function argumentValue(args: readonly string[], name: string) {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function boundedJson(path: string, label: string) {
  const size = statSync(path).size;
  if (size <= 0 || size > MAX_INPUT_BYTES) {
    throw new Error(`${label} must be between 1 and ${MAX_INPUT_BYTES} bytes`);
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${(error as Error).message}`);
  }
}

function previousReport(value: unknown): AddressQlPostalOperationsPreviousReport {
  if (
    typeof value !== 'object'
    || value === null
    || Array.isArray(value)
  ) {
    throw new Error('previous postal operations report must be an object');
  }
  const record = value as Record<string, unknown>;
  if (
    record.version !== ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION
    || !Array.isArray(record.sources)
  ) {
    throw new Error('previous postal operations report has an unsupported shape');
  }
  return {
    version: ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION,
    sources: record.sources.map((source, index) => {
      if (
        typeof source !== 'object'
        || source === null
        || Array.isArray(source)
      ) {
        throw new Error(`previous sources[${index}] must be an object`);
      }
      const candidate = source as Record<string, unknown>;
      if (
        typeof candidate.sourceId !== 'string'
        || typeof candidate.sourceVersion !== 'string'
        || typeof candidate.correctionUrl !== 'string'
      ) {
        throw new Error(`previous sources[${index}] is incomplete`);
      }
      return {
        sourceId: candidate.sourceId,
        sourceVersion: candidate.sourceVersion,
        correctionUrl: candidate.correctionUrl,
      };
    }),
  };
}

function writeAtomicJson(path: string, value: unknown) {
  const target = resolve(path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  renameSync(temporary, target);
}

export function runAddressQlPostalOperationsMonitor(
  argv = process.argv.slice(2),
  cwd = process.cwd(),
) {
  try {
    const inputArgument = argumentValue(argv, '--input');
    if (!inputArgument) throw new Error('--input is required');
    const previousArgument = argumentValue(argv, '--previous');
    const outputArgument = argumentValue(argv, '--output');
    const now = argumentValue(argv, '--now');
    const inputPath = resolve(cwd, inputArgument);
    const input = parseAddressQlPostalOperationsInput(
      boundedJson(inputPath, 'postal operations input'),
    );
    const previous = previousArgument
      ? previousReport(boundedJson(
        resolve(cwd, previousArgument),
        'previous postal operations report',
      ))
      : undefined;
    const report = buildAddressQlPostalOperationsReport(input, {
      ...(now ? { now } : {}),
      ...(previous ? { previous } : {}),
    });
    const errors = validateAddressQlPostalOperationsReport(report);
    if (errors.length) {
      throw new Error(`postal operations report failed validation: ${errors.join(', ')}`);
    }
    if (outputArgument) {
      writeAtomicJson(resolve(cwd, outputArgument), report);
    }
    console.log(JSON.stringify({
      status: 'ok',
      version: report.version,
      generatedAt: report.generatedAt,
      reportDigest: report.reportDigest,
      output: outputArgument ? resolve(cwd, outputArgument) : null,
      sourceSummary: report.sourceSummary,
      correctionSlaState: report.correctionSla.aggregate.state,
      countryActions: Object.fromEntries(
        report.countries.map(country => [country.countryCode, country.action]),
      ),
    }, null, 2));
    const failOnAction = argv.includes('--fail-on-action');
    return failOnAction && (
      report.sourceSummary.expired > 0
      || report.sourceSummary.invalid > 0
      || report.correctionSla.aggregate.state === 'breached'
      || report.countries.some(country =>
        country.action === 'demotion_required'
        || country.action === 'blocked')
    ) ? 1 : 0;
  } catch (error) {
    console.error(JSON.stringify({
      status: 'failed',
      error: (error as Error).message,
    }, null, 2));
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = runAddressQlPostalOperationsMonitor();
}
