import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fromArrayBuffer } from 'geotiff';

import type { TopographicSourceRecord } from '../src/lib/topographicExport';
import {
  bindCoastlineClassificationLegendReceipt,
  createCoastlineClassificationLegendReceipt,
  MAX_COASTLINE_LEGEND_BYTE_LENGTH,
  TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
  type CoastlineClassificationLegendReceipt,
  type CoastlineClassificationSemanticEvidence,
} from '../src/lib/topographicCoastlineClassificationSemantics';
import { MAX_GEOTIFF_BYTE_LENGTH } from '../src/lib/topographicGeoTiffAdapter';

export const COASTLINE_CLASSIFICATION_LEGEND_RECEIPT_CLI_VERSION =
  'agid-coastline-classification-legend-receipt-cli-v0.1';
export const MAX_TOPOGRAPHIC_SOURCE_RECORD_BYTES = 1_048_576;

export type CreateCoastlineClassificationLegendReceiptFilesInput = {
  sourceRecordPath: string;
  classificationGeoTiffPath: string;
  legendPath: string;
  legendUrl: string;
  legendVersion: string;
  legendPublishedAt: string;
  bandIndex: number;
  validatedAt: string;
  receiptOutputPath: string;
  boundSourceOutputPath?: string;
};

export type CoastlineClassificationLegendReceiptFilesResult = {
  receipt: CoastlineClassificationLegendReceipt;
  receiptSha256: `sha256:${string}`;
  receiptOutputPath: string;
  boundSourceOutputPath: string | null;
};

function asArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function readBoundedRegularFile(
  path: string,
  field: string,
  maximumBytes: number,
) {
  const resolvedPath = resolve(path);
  const stat = statSync(resolvedPath);
  if (!stat.isFile() || stat.size <= 0 || stat.size > maximumBytes) {
    throw new Error(
      `${field} must point to a non-empty regular file no larger than ${maximumBytes} bytes.`,
    );
  }
  return { path: resolvedPath, bytes: Uint8Array.from(readFileSync(resolvedPath)) };
}

function readSourceRecord(path: string) {
  const input = readBoundedRegularFile(
    path,
    'sourceRecordPath',
    MAX_TOPOGRAPHIC_SOURCE_RECORD_BYTES,
  );
  if (extname(input.path).toLowerCase() !== '.json') {
    throw new Error('sourceRecordPath must point to a JSON source record.');
  }
  try {
    const value = JSON.parse(new TextDecoder().decode(input.bytes)) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('sourceRecordPath must contain a JSON object.');
    }
    return { path: input.path, sourceRecord: value as TopographicSourceRecord };
  } catch (error) {
    if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
      throw error;
    }
    throw new Error('sourceRecordPath must contain valid JSON.');
  }
}

async function inspectClassificationGeoTiff(
  path: string,
  bandIndex: number,
) {
  const input = readBoundedRegularFile(
    path,
    'classificationGeoTiffPath',
    MAX_GEOTIFF_BYTE_LENGTH,
  );
  const extension = extname(input.path).toLowerCase();
  if (extension !== '.tif' && extension !== '.tiff') {
    throw new Error('classificationGeoTiffPath must point to a .tif or .tiff GeoTIFF file.');
  }
  if (!Number.isInteger(bandIndex) || bandIndex < 0) {
    throw new Error('bandIndex must be a non-negative integer.');
  }
  let geoTiff;
  try {
    geoTiff = await fromArrayBuffer(asArrayBuffer(input.bytes));
  } catch (error) {
    throw new Error(
      `classificationGeoTiffPath must contain a parseable GeoTIFF: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (await geoTiff.getImageCount() < 1) {
    throw new Error('classificationGeoTiffPath GeoTIFF has no images.');
  }
  const image = await geoTiff.getImage(0);
  if (bandIndex >= image.getSamplesPerPixel()) {
    throw new Error('bandIndex is outside IFD 0 sample count.');
  }
  return input;
}

function assertNewOutputPath(
  outputPath: string,
  inputPaths: readonly string[],
  field: string,
) {
  const resolvedOutputPath = resolve(outputPath);
  if (inputPaths.includes(resolvedOutputPath)) {
    throw new Error(`${field} must not overwrite an input artifact.`);
  }
  const stat = (() => {
    try {
      return statSync(resolvedOutputPath);
    } catch {
      return null;
    }
  })();
  if (stat) throw new Error(`${field} must not overwrite an existing artifact.`);
  return resolvedOutputPath;
}

function semanticsFromInput(input: {
  legendUrl: string;
  legendVersion: string;
  legendPublishedAt: string;
  legendSha256: `sha256:${string}`;
  bandIndex: number;
}): CoastlineClassificationSemanticEvidence {
  return {
    schemaVersion: TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
    bandIndex: input.bandIndex,
    legend: {
      url: input.legendUrl,
      version: input.legendVersion,
      publishedAt: input.legendPublishedAt,
      sha256: input.legendSha256,
    },
    classes: [
      { value: 0, meaning: 'ocean' },
      { value: 1, meaning: 'breakline' },
      { value: 2, meaning: 'land' },
    ],
  };
}

async function sha256(bytes: Uint8Array) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    Uint8Array.from(bytes).buffer,
  );
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

/**
 * Creates a hash-bound receipt from retained local files and optionally writes
 * a separate source-record candidate. Neither input artifact is copied.
 */
export async function createCoastlineClassificationLegendReceiptFiles(
  input: CreateCoastlineClassificationLegendReceiptFilesInput,
): Promise<CoastlineClassificationLegendReceiptFilesResult> {
  const source = readSourceRecord(input.sourceRecordPath);
  const classification = await inspectClassificationGeoTiff(
    input.classificationGeoTiffPath,
    input.bandIndex,
  );
  const legend = readBoundedRegularFile(
    input.legendPath,
    'legendPath',
    MAX_COASTLINE_LEGEND_BYTE_LENGTH,
  );
  const receiptOutputPath = assertNewOutputPath(
    input.receiptOutputPath,
    [source.path, classification.path, legend.path],
    'receiptOutputPath',
  );
  const boundSourceOutputPath = input.boundSourceOutputPath === undefined
    ? null
    : assertNewOutputPath(
      input.boundSourceOutputPath,
      [source.path, classification.path, legend.path, receiptOutputPath],
      'boundSourceOutputPath',
    );
  const classificationSemantics = semanticsFromInput({
    legendUrl: input.legendUrl,
    legendVersion: input.legendVersion,
    legendPublishedAt: input.legendPublishedAt,
    legendSha256: await sha256(legend.bytes),
    bandIndex: input.bandIndex,
  });
  const { receipt, receiptSha256 } = await createCoastlineClassificationLegendReceipt({
    sourceRecord: source.sourceRecord,
    classificationGeoTiff: asArrayBuffer(classification.bytes),
    legendBytes: legend.bytes,
    classificationSemantics,
    validatedAt: input.validatedAt,
  });
  const boundSourceRecord = boundSourceOutputPath
    ? await bindCoastlineClassificationLegendReceipt({
      sourceRecord: source.sourceRecord,
      receipt,
      expectedReceiptSha256: receiptSha256,
    })
    : null;
  mkdirSync(dirname(receiptOutputPath), { recursive: true });
  writeFileSync(
    receiptOutputPath,
    `${JSON.stringify({ receipt, receiptSha256 }, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
  if (boundSourceOutputPath && boundSourceRecord) {
    mkdirSync(dirname(boundSourceOutputPath), { recursive: true });
    writeFileSync(
      boundSourceOutputPath,
      `${JSON.stringify(boundSourceRecord, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx' },
    );
  }
  return {
    receipt,
    receiptSha256,
    receiptOutputPath,
    boundSourceOutputPath,
  };
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

async function main() {
  const bandIndex = Number(requiredArgument('--band-index'));
  const result = await createCoastlineClassificationLegendReceiptFiles({
    sourceRecordPath: requiredArgument('--source-record'),
    classificationGeoTiffPath: requiredArgument('--classification-geotiff'),
    legendPath: requiredArgument('--legend'),
    legendUrl: requiredArgument('--legend-url'),
    legendVersion: requiredArgument('--legend-version'),
    legendPublishedAt: requiredArgument('--legend-published-at'),
    bandIndex,
    validatedAt: requiredArgument('--validated-at'),
    receiptOutputPath: requiredArgument('--output'),
    boundSourceOutputPath: optionalArgument('--bound-source-output'),
  });
  console.log(JSON.stringify({
    cliVersion: COASTLINE_CLASSIFICATION_LEGEND_RECEIPT_CLI_VERSION,
    receiptOutputPath: result.receiptOutputPath,
    boundSourceOutputPath: result.boundSourceOutputPath,
    receiptSha256: result.receiptSha256,
    classificationGeoTiffSha256: result.receipt.source.classificationGeoTiffSha256,
    legendSha256: result.receipt.legend.contentSha256,
    note: 'The retained GeoTIFF and legend bytes are hashed locally and are not copied, uploaded, or embedded in output artifacts.',
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
