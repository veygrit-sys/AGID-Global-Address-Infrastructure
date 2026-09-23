import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseTopographicSourceLedger,
  runLocalGeoTiffWorkflow,
} from '../src/lib/topographicLocalGeoTiffWorkflow';
import { topographicSourceBindsDigest } from '../src/lib/topographicExport';
import {
  GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
} from '../src/lib/topographicGeoTiffAdapter';
import {
  verifyNyc3depSourceTilingPlan,
  type Nyc3depSourceTilingPlan,
} from '../src/lib/topographicNyc3depTiling';
import {
  MAX_NYC_3DEP_TILE_PLAN_ASSET_BYTES,
} from './plan-nyc-3dep-local-tiles';
import {
  requireNyc3depLedgerBoundCogReceipt,
  readNyc3depCogValidationReceipt,
} from './export-nyc-3dep-local-window';
import {
  writeNyc3depLocalTileBatch,
} from '../src/lib/topographicNyc3depBatchWriter';

export const NYC_3DEP_LOCAL_TILE_BATCH_EXPORT_CLI_VERSION =
  'agid-nyc-3dep-local-tile-batch-export-cli-v0.1';
export const MAX_NYC_3DEP_TILE_BATCH_PLAN_BYTES = 1024 * 1024;

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
}

function asArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function requireTimestamp(value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error('generatedAt must be an ISO timestamp.');
  }
  return value;
}

function parseTilePlan(bytes: Uint8Array): Nyc3depSourceTilingPlan {
  try {
    return verifyNyc3depSourceTilingPlan(
      JSON.parse(new TextDecoder().decode(bytes)) as Nyc3depSourceTilingPlan,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`NYC tile batch requires a valid digest-bound source tile plan: ${message}`);
  }
}

export function readNyc3depSourceTilePlan(planPath: string) {
  const resolvedPlanPath = resolve(planPath);
  if (extname(resolvedPlanPath).toLowerCase() !== '.json') {
    throw new Error('planPath must reference a JSON tile plan.');
  }
  const planStat = statSync(resolvedPlanPath);
  if (!planStat.isFile() || planStat.size <= 0 || planStat.size > MAX_NYC_3DEP_TILE_BATCH_PLAN_BYTES) {
    throw new Error(`planPath must be a non-empty JSON file no larger than ${MAX_NYC_3DEP_TILE_BATCH_PLAN_BYTES} bytes.`);
  }
  return parseTilePlan(Uint8Array.from(readFileSync(resolvedPlanPath)));
}

export async function exportNyc3depLocalTileBatch(input: {
  assetPath: string;
  ledgerPath: string;
  planPath: string;
  outputDirectory: string;
  generatedAt: string;
  imageIndex?: number;
  deriveNoDataMask?: boolean;
  cogValidationReceiptPath?: string;
}) {
  requireTimestamp(input.generatedAt);
  const assetPath = resolve(input.assetPath);
  const ledgerPath = resolve(input.ledgerPath);
  const planPath = resolve(input.planPath);
  const outputDirectory = resolve(input.outputDirectory);
  if ([assetPath, ledgerPath, planPath].some(path => path === outputDirectory)) {
    throw new Error('outputDirectory must be separate from retained source inputs.');
  }
  if (!['.tif', '.tiff'].includes(extname(assetPath).toLowerCase())) {
    throw new Error('assetPath must reference a local GeoTIFF.');
  }
  const assetStat = statSync(assetPath);
  if (!assetStat.isFile() || assetStat.size <= 0 || assetStat.size > MAX_NYC_3DEP_TILE_PLAN_ASSET_BYTES) {
    throw new Error(`assetPath must be a non-empty local GeoTIFF no larger than ${MAX_NYC_3DEP_TILE_PLAN_ASSET_BYTES} bytes.`);
  }
  const plan = readNyc3depSourceTilePlan(planPath);
  if (input.imageIndex !== undefined && input.imageIndex !== plan.source.imageIndex) {
    throw new Error('--image-index must match the selected image index in the tile plan.');
  }
  const sourceRecords = parseTopographicSourceLedger(
    readFileSync(ledgerPath, 'utf8'),
    { now: input.generatedAt },
  ).records;
  if (sourceRecords.length !== 1 || sourceRecords[0].sourceId !== 'usgs-3dep') {
    throw new Error('NYC 3DEP tile batch requires exactly one approved usgs-3dep ledger record.');
  }
  const asset = Uint8Array.from(readFileSync(assetPath));
  const sourceSnapshotSha256 = sha256(asset);
  if (
    sourceSnapshotSha256 !== plan.source.sourceSnapshotSha256
    || !topographicSourceBindsDigest(sourceRecords[0], sourceSnapshotSha256)
  ) {
    throw new Error('NYC 3DEP tile batch plan and ledger must bind the retained GeoTIFF digest.');
  }
  const cogValidation = input.cogValidationReceiptPath
    ? readNyc3depCogValidationReceipt(input.cogValidationReceiptPath)
    : undefined;
  if (cogValidation) {
    requireNyc3depLedgerBoundCogReceipt(
      sourceRecords[0].snapshotEvidence?.relatedArtifactSha256,
      cogValidation.receiptSha256,
    );
  }
  const arrayBuffer = asArrayBuffer(asset);
  const artifacts = [];
  for (const tile of plan.tiles) {
    const result = await runLocalGeoTiffWorkflow({
      arrayBuffer,
      sourceRecord: sourceRecords[0],
      gridId: `nyc-3dep-${sourceRecords[0].version}-image-${plan.source.imageIndex}-tile-${tile.id}`,
      title: 'USGS 3DEP NYC case-study local tile',
      generatedAt: input.generatedAt,
      countryCode: 'US',
      format: 'gltf',
      layerIds: ['terrain-mesh', 'contour-lines'],
      contourIntervalMeters: 10,
      meshLodStrides: [1],
      meshMaxVerticalErrorMeters: 0.01,
      imageIndex: plan.source.imageIndex,
      window: tile.window,
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
    artifacts.push({ tileId: tile.id, result });
  }
  return writeNyc3depLocalTileBatch({
    outputDirectory,
    generatedAt: input.generatedAt,
    plan,
    artifacts,
  });
}

function requiredArgument(flag: string) {
  const inline = process.argv.find(value => value.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${flag} is required.`);
  return value;
}

function optionalArgument(flag: string) {
  const inline = process.argv.find(value => value.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function optionalNonNegativeIntegerArgument(flag: string) {
  const inline = process.argv.find(value => value.startsWith(`${flag}=`));
  const value = inline
    ? inline.slice(flag.length + 1)
    : process.argv.includes(flag)
      ? process.argv[process.argv.indexOf(flag) + 1]
      : undefined;
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) throw new Error(`${flag} must be a non-negative integer.`);
  return Number(value);
}

function hasArgument(flag: string) {
  return process.argv.includes(flag)
    || process.argv.some(value => value.startsWith(`${flag}=`));
}

async function main() {
  const exported = await exportNyc3depLocalTileBatch({
    assetPath: requiredArgument('--asset'),
    ledgerPath: requiredArgument('--ledger'),
    planPath: requiredArgument('--plan'),
    outputDirectory: requiredArgument('--output-dir'),
    generatedAt: requiredArgument('--generated-at'),
    imageIndex: optionalNonNegativeIntegerArgument('--image-index'),
    deriveNoDataMask: hasArgument('--derive-nodata-mask'),
    cogValidationReceiptPath: optionalArgument('--cog-validation-receipt'),
  });
  console.log(JSON.stringify({
    cliVersion: NYC_3DEP_LOCAL_TILE_BATCH_EXPORT_CLI_VERSION,
    outputDirectory: basename(exported.outputDirectory),
    receiptFile: basename(exported.receiptPath),
    manifestFile: basename(exported.manifestPath),
    tileCount: exported.tileDirectories.length,
    parent: exported.parent.status === 'ready'
      ? {
          status: 'ready',
          tilesetFile: basename(exported.parent.tilesetPath),
          tilesetSha256: exported.parent.tilesetSha256,
        }
      : exported.parent,
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
