import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseTopographicSourceLedger,
  runLocalGeoTiffWorkflow,
} from '../src/lib/topographicLocalGeoTiffWorkflow';
import {
  GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
  type GeoTiffReadWindow,
} from '../src/lib/topographicGeoTiffAdapter';
import {
  parseTopographicCogValidationReceipt,
  type TopographicCogValidationReceipt,
} from '../src/lib/topographicCogValidation';

export const NYC_3DEP_LOCAL_WINDOW_EXPORT_CLI_VERSION =
  'agid-nyc-3dep-local-window-export-cli-v0.2';
export const MAX_NYC_3DEP_COG_VALIDATION_RECEIPT_BYTES = 1024 * 1024;

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
}

/** Reads only the bounded receipt artifact; the workflow binds it to the DEM. */
export function readNyc3depCogValidationReceipt(receiptPath: string): {
  receipt: TopographicCogValidationReceipt;
  receiptSha256: `sha256:${string}`;
} {
  const resolvedReceiptPath = resolve(receiptPath);
  if (extname(resolvedReceiptPath).toLowerCase() !== '.json') {
    throw new Error('cogValidationReceiptPath must point to a JSON receipt.');
  }
  const stat = statSync(resolvedReceiptPath);
  if (
    !stat.isFile()
    || stat.size <= 0
    || stat.size > MAX_NYC_3DEP_COG_VALIDATION_RECEIPT_BYTES
  ) {
    throw new Error(
      `cogValidationReceiptPath must be a non-empty JSON file no larger than ${MAX_NYC_3DEP_COG_VALIDATION_RECEIPT_BYTES} bytes.`,
    );
  }
  const bytes = Uint8Array.from(readFileSync(resolvedReceiptPath));
  return {
    receipt: parseTopographicCogValidationReceipt(new TextDecoder().decode(bytes)),
    receiptSha256: sha256(bytes),
  };
}

/**
 * A COG receipt is valid for a DEM only when the reviewed source ledger also
 * commits to the exact receipt artifact. This prevents evidence substitution
 * between ledger review and derived export.
 */
export function requireNyc3depLedgerBoundCogReceipt(
  relatedArtifactSha256: readonly `sha256:${string}`[] | undefined,
  receiptSha256: `sha256:${string}`,
) {
  const normalizedReceiptSha256 = receiptSha256.toLowerCase();
  if (!relatedArtifactSha256?.some(
    digest => digest.toLowerCase() === normalizedReceiptSha256,
  )) {
    throw new Error(
      'COG validation receipt must be recorded in the source ledger before it can be attached to a derived export.',
    );
  }
}

export function parseGeoTiffReadWindow(value: string): GeoTiffReadWindow {
  const parts = value.split(',').map(part => Number(part.trim()));
  if (
    parts.length !== 4
    || parts.some(part => !Number.isInteger(part))
    || parts[0] < 0
    || parts[1] < 0
    || parts[2] < 2
    || parts[3] < 2
  ) {
    throw new Error('--window must be four integers: x,y,width,height with width and height at least 2.');
  }
  return {
    x: parts[0],
    y: parts[1],
    width: parts[2],
    height: parts[3],
  };
}

export function readGeoTiffReadWindowArgument(args: readonly string[]) {
  const inlineIndex = args.findIndex(value => value.startsWith('--window='));
  if (inlineIndex >= 0) {
    const firstPart = args[inlineIndex].slice('--window='.length);
    if (firstPart.includes(',')) return firstPart;
    const remainingParts = args.slice(inlineIndex + 1, inlineIndex + 4);
    if (remainingParts.length === 3 && remainingParts.every(part => !part.startsWith('--'))) {
      return [firstPart, ...remainingParts].join(',');
    }
    return firstPart;
  }
  const index = args.indexOf('--window');
  if (index < 0) throw new Error('--window is required.');
  const firstPart = args[index + 1];
  if (!firstPart || firstPart.startsWith('--')) throw new Error('--window is required.');
  if (firstPart.includes(',')) return firstPart;
  const remainingParts = args.slice(index + 2, index + 5);
  if (remainingParts.length === 3 && remainingParts.every(part => !part.startsWith('--'))) {
    return [firstPart, ...remainingParts].join(',');
  }
  return firstPart;
}

function requiredArgument(name: string) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function optionalArgument(name: string) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function hasArgument(name: string) {
  return process.argv.includes(name)
    || process.argv.some(value => value.startsWith(`${name}=`));
}

export function parseGeoTiffImageIndex(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('--image-index must be a non-negative integer.');
  }
  return parsed;
}

function optionalNonNegativeIntegerArgument(name: string) {
  if (!hasArgument(name)) return undefined;
  const value = parseGeoTiffImageIndex(requiredArgument(name));
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  return value;
}

function readWindowFromProcessArguments() {
  const splitFlags = [
    '--window-x',
    '--window-y',
    '--window-width',
    '--window-height',
  ];
  if (splitFlags.some(hasArgument)) {
    if (!splitFlags.every(hasArgument)) {
      throw new Error('window split flags require --window-x, --window-y, --window-width, and --window-height together.');
    }
    return [
      requiredArgument('--window-x'),
      requiredArgument('--window-y'),
      requiredArgument('--window-width'),
      requiredArgument('--window-height'),
    ].join(',');
  }
  return readGeoTiffReadWindowArgument(process.argv);
}

export async function exportNyc3depLocalWindow(input: {
  assetPath: string;
  ledgerPath: string;
  outputDirectory: string;
  window: GeoTiffReadWindow;
  generatedAt: string;
  imageIndex?: number;
  deriveNoDataMask?: boolean;
  cogValidationReceiptPath?: string;
}) {
  const assetPath = resolve(input.assetPath);
  const ledgerPath = resolve(input.ledgerPath);
  const outputDirectory = resolve(input.outputDirectory);
  if (assetPath.startsWith(`${outputDirectory}\\`) || assetPath === outputDirectory) {
    throw new Error('outputDirectory must be separate from the retained raw GeoTIFF.');
  }
  const sourceRecords = parseTopographicSourceLedger(
    readFileSync(ledgerPath, 'utf8'),
    { now: input.generatedAt },
  ).records;
  if (sourceRecords.length !== 1 || sourceRecords[0].sourceId !== 'usgs-3dep') {
    throw new Error('NYC 3DEP window export requires exactly one approved usgs-3dep ledger record.');
  }
  const asset = readFileSync(assetPath);
  const cogValidation = input.cogValidationReceiptPath
    ? readNyc3depCogValidationReceipt(input.cogValidationReceiptPath)
    : undefined;
  if (cogValidation) {
    requireNyc3depLedgerBoundCogReceipt(
      sourceRecords[0].snapshotEvidence?.relatedArtifactSha256,
      cogValidation.receiptSha256,
    );
  }
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer: asset.buffer.slice(
      asset.byteOffset,
      asset.byteOffset + asset.byteLength,
    ) as ArrayBuffer,
    sourceRecord: sourceRecords[0],
    gridId: `nyc-3dep-${sourceRecords[0].version}-image-${input.imageIndex ?? 0}-window-${input.window.x}-${input.window.y}-${input.window.width}-${input.window.height}`,
    title: 'USGS 3DEP NYC case-study local window',
    generatedAt: input.generatedAt,
    countryCode: 'US',
    format: 'gltf',
    layerIds: ['terrain-mesh', 'contour-lines'],
    contourIntervalMeters: 10,
    meshLodStrides: [1],
    // LOD 0 retains every selected source cell; the explicit positive cap is
    // required so the existing LOD audit remains machine-checkable.
    meshMaxVerticalErrorMeters: 0.01,
    imageIndex: input.imageIndex,
    window: input.window,
    ...(cogValidation ? { cogValidation } : {}),
    ...(input.deriveNoDataMask
      ? {
          qualityMask: {
            encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
            sourceDerivedNoDataMask: true,
          },
        }
      : {}),
  });

  mkdirSync(outputDirectory, { recursive: true });
  const outputPath = resolve(outputDirectory, result.output.fileName);
  const evidencePath = resolve(outputDirectory, 'evidence.json');
  writeFileSync(outputPath, result.output.data);
  writeFileSync(evidencePath, result.evidence.data);
  return {
    result,
    outputPath,
    evidencePath,
  };
}

async function main() {
  const generatedAt = requiredArgument('--generated-at');
  const exported = await exportNyc3depLocalWindow({
    assetPath: requiredArgument('--asset'),
    ledgerPath: requiredArgument('--ledger'),
    outputDirectory: requiredArgument('--output-dir'),
    window: parseGeoTiffReadWindow(readWindowFromProcessArguments()),
    generatedAt,
    imageIndex: optionalNonNegativeIntegerArgument('--image-index'),
    deriveNoDataMask: hasArgument('--derive-nodata-mask'),
    cogValidationReceiptPath: optionalArgument('--cog-validation-receipt'),
  });
  console.log(JSON.stringify({
    cliVersion: NYC_3DEP_LOCAL_WINDOW_EXPORT_CLI_VERSION,
    status: exported.result.plan.status,
    sourceHorizontalCrs: exported.result.decoded.metadata.sourceHorizontalCrs,
    horizontalCrs: exported.result.decoded.metadata.horizontalCrs,
    imageLayout: exported.result.decoded.metadata.imageLayout,
    readWindow: exported.result.decoded.metadata.readWindow,
    outputFile: basename(exported.outputPath),
    outputBytes: exported.result.output.byteLength,
    evidenceFile: basename(exported.evidencePath),
    evidenceBytes: exported.result.evidence.byteLength,
    cogValidation: exported.result.evidence.manifest.input.cogValidation,
    noDataResolution: exported.result.decoded.metadata.noDataResolution,
    warnings: exported.result.decoded.warnings,
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
