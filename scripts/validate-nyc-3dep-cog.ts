import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  TOPOGRAPHIC_COG_VALIDATOR_MINIMUM_VERSION,
  compareGdalVersions,
  createTopographicCogValidationReceipt,
  type TopographicCogValidationReceipt,
} from '../src/lib/topographicCogValidation';
import { MAX_GEOTIFF_BYTE_LENGTH } from '../src/lib/topographicGeoTiffAdapter';

export const NYC_3DEP_COG_VALIDATION_CLI_VERSION =
  'agid-nyc-3dep-cog-validation-cli-v0.1';

export type GdalCommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

export type GdalCommandRunner = (
  executable: string,
  args: readonly string[],
) => GdalCommandResult;

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
}

function defaultGdalCommandRunner(
  executable: string,
  args: readonly string[],
): GdalCommandResult {
  const result = spawnSync(executable, [...args], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    ...(result.error ? { error: result.error } : {}),
  };
}

export function parseGdalVersion(output: string) {
  const match = output.match(/\bGDAL\s+(\d+\.\d+\.\d+)\b/i);
  if (!match) throw new Error('GDAL --version output did not contain major.minor.patch.');
  return match[1];
}

function countDiagnostics(report: string, kind: 'warning' | 'error') {
  return [...report.matchAll(new RegExp(`^\\s*${kind}\\b`, 'gim'))].length;
}

function verifyAssetPath(assetPath: string) {
  const resolvedAssetPath = resolve(assetPath);
  if (!['.tif', '.tiff'].includes(extname(resolvedAssetPath).toLowerCase())) {
    throw new Error('assetPath must point to a .tif or .tiff GeoTIFF file.');
  }
  const stat = statSync(resolvedAssetPath);
  if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_GEOTIFF_BYTE_LENGTH) {
    throw new Error(`assetPath must be a non-empty GeoTIFF no larger than ${MAX_GEOTIFF_BYTE_LENGTH} bytes.`);
  }
  const bytes = Uint8Array.from(readFileSync(resolvedAssetPath));
  return {
    resolvedAssetPath,
    bytes,
    contentSha256: sha256(bytes),
  };
}

/**
 * Runs only the locally installed GDAL validator against caller-provided local
 * bytes. The validator report is kept separate and linked by digest.
 */
export function runNyc3depCogValidation(input: {
  assetPath: string;
  rawReportFileName: string;
  validatedAt: string;
  gdalExecutable?: string;
  runner?: GdalCommandRunner;
}) {
  const asset = verifyAssetPath(input.assetPath);
  const runner = input.runner ?? defaultGdalCommandRunner;
  const gdalExecutable = input.gdalExecutable ?? 'gdal';
  const versionResult = runner(gdalExecutable, ['--version']);
  if (versionResult.error || versionResult.status !== 0) {
    const detail = (
      versionResult.error?.message ?? versionResult.stderr.trim()
    ) || 'unknown error';
    throw new Error(`GDAL --version failed: ${detail}`);
  }
  const gdalVersion = parseGdalVersion(`${versionResult.stdout}\n${versionResult.stderr}`);
  if (compareGdalVersions(gdalVersion, TOPOGRAPHIC_COG_VALIDATOR_MINIMUM_VERSION) < 0) {
    throw new Error(
      `GDAL ${TOPOGRAPHIC_COG_VALIDATOR_MINIMUM_VERSION} or newer is required for gdal driver cog validate; found ${gdalVersion}.`,
    );
  }

  const validationResult = runner(gdalExecutable, [
    'driver',
    'cog',
    'validate',
    '--full-check=yes',
    asset.resolvedAssetPath,
  ]);
  const rawReport = `${validationResult.stdout}${validationResult.stderr}`;
  const rawReportBytes = new TextEncoder().encode(rawReport);
  if (rawReportBytes.byteLength === 0) {
    throw new Error('GDAL COG validator did not emit a report; no validation receipt was created.');
  }
  const exitCode = validationResult.status ?? 1;
  const warningCount = countDiagnostics(rawReport, 'warning');
  const errorCount = countDiagnostics(rawReport, 'error') + (validationResult.error ? 1 : 0);
  const receipt = createTopographicCogValidationReceipt({
    schemaVersion: 'agid-topographic-cog-validation-receipt-v0.1',
    validatedAt: input.validatedAt,
    validator: {
      command: 'gdal driver cog validate',
      gdalVersion,
      fullCheck: 'yes',
    },
    input: {
      contentSha256: asset.contentSha256,
      byteLength: asset.bytes.byteLength,
    },
    rawReport: {
      fileName: basename(input.rawReportFileName),
      sha256: sha256(rawReportBytes),
      byteLength: rawReportBytes.byteLength,
    },
    result: {
      status: exitCode === 0 && warningCount === 0 && errorCount === 0
        ? 'passed'
        : 'blocked',
      exitCode,
      warningCount,
      errorCount,
    },
  });
  return { receipt, rawReport };
}

function requiredArgument(name: string) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
  return value;
}

function optionalArgument(name: string) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

export function validateNyc3depCogFiles(input: {
  assetPath: string;
  rawReportPath: string;
  outputPath: string;
  validatedAt: string;
  gdalExecutable?: string;
  runner?: GdalCommandRunner;
}) {
  const assetPath = resolve(input.assetPath);
  const rawReportPath = resolve(input.rawReportPath);
  const outputPath = resolve(input.outputPath);
  if (assetPath === rawReportPath || assetPath === outputPath) {
    throw new Error('Validation output paths must not overwrite the retained source asset.');
  }
  const { receipt, rawReport } = runNyc3depCogValidation({
    assetPath,
    rawReportFileName: basename(rawReportPath),
    validatedAt: input.validatedAt,
    gdalExecutable: input.gdalExecutable,
    runner: input.runner,
  });
  mkdirSync(dirname(rawReportPath), { recursive: true });
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(rawReportPath, rawReport);
  writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
  if (receipt.result.status !== 'passed') {
    throw new Error('GDAL COG validation blocked the receipt.');
  }
  return receipt;
}

function main() {
  const receipt = validateNyc3depCogFiles({
    assetPath: requiredArgument('--asset'),
    rawReportPath: requiredArgument('--raw-report'),
    outputPath: requiredArgument('--output'),
    validatedAt: requiredArgument('--validated-at'),
    gdalExecutable: optionalArgument('--gdal'),
  });
  console.log(JSON.stringify({
    cliVersion: NYC_3DEP_COG_VALIDATION_CLI_VERSION,
    status: receipt.result.status,
    validator: receipt.validator,
    input: receipt.input,
    rawReport: receipt.rawReport,
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
