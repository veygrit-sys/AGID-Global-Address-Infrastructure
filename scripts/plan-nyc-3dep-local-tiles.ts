import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fromArrayBuffer } from 'geotiff';

import {
  parseTopographicSourceLedger,
} from '../src/lib/topographicLocalGeoTiffWorkflow';
import { topographicSourceBindsDigest } from '../src/lib/topographicExport';
import {
  planNyc3depSourceTiles,
  type Nyc3depSourceTilingPlan,
} from '../src/lib/topographicNyc3depTiling';

export const NYC_3DEP_TILE_PLAN_CLI_VERSION =
  'agid-nyc-3dep-tile-plan-cli-v0.1';
export const MAX_NYC_3DEP_TILE_PLAN_ASSET_BYTES = 1024 * 1024 * 1024;

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
}

function asArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function requirePositiveInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive safe integer.`);
  }
  return value;
}

function requireNonNegativeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer.`);
  }
  return value;
}

function requireTimestamp(value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error('generatedAt must be an ISO timestamp.');
  }
  return value;
}

/**
 * Inspects only local retained GeoTIFF metadata and writes a content-bound
 * source-window plan. It never exports elevation values or geographic bounds.
 */
export async function createNyc3depLocalTilePlan(input: {
  assetPath: string;
  ledgerPath: string;
  outputPath: string;
  generatedAt: string;
  maximumWindowWidth: number;
  maximumWindowHeight: number;
  maximumTileCount: number;
  imageIndex?: number;
}) {
  requireTimestamp(input.generatedAt);
  const assetPath = resolve(input.assetPath);
  const ledgerPath = resolve(input.ledgerPath);
  const outputPath = resolve(input.outputPath);
  if (assetPath === outputPath || ledgerPath === outputPath) {
    throw new Error('outputPath must be separate from retained source inputs.');
  }
  if (!['.tif', '.tiff'].includes(extname(assetPath).toLowerCase())) {
    throw new Error('assetPath must reference a local GeoTIFF.');
  }
  if (extname(outputPath).toLowerCase() !== '.json') {
    throw new Error('outputPath must end in .json.');
  }
  const assetStat = statSync(assetPath);
  if (
    !assetStat.isFile()
    || assetStat.size <= 0
    || assetStat.size > MAX_NYC_3DEP_TILE_PLAN_ASSET_BYTES
  ) {
    throw new Error(
      `assetPath must be a non-empty local GeoTIFF no larger than ${MAX_NYC_3DEP_TILE_PLAN_ASSET_BYTES} bytes.`,
    );
  }

  const sourceRecords = parseTopographicSourceLedger(
    readFileSync(ledgerPath, 'utf8'),
    { now: input.generatedAt },
  ).records;
  if (sourceRecords.length !== 1 || sourceRecords[0].sourceId !== 'usgs-3dep') {
    throw new Error('NYC 3DEP tile planning requires exactly one approved usgs-3dep ledger record.');
  }
  const asset = Uint8Array.from(readFileSync(assetPath));
  const sourceSnapshotSha256 = sha256(asset);
  const sourceRecord = sourceRecords[0];
  if (!topographicSourceBindsDigest(sourceRecord, sourceSnapshotSha256)) {
    throw new Error('NYC 3DEP ledger does not bind the retained GeoTIFF digest.');
  }

  const geoTiff = await fromArrayBuffer(asArrayBuffer(asset));
  const imageCount = await geoTiff.getImageCount();
  const imageIndex = requireNonNegativeInteger(input.imageIndex ?? 0, 'imageIndex');
  if (imageIndex >= imageCount) {
    throw new Error(`imageIndex ${imageIndex} is outside the GeoTIFF image count.`);
  }
  const image = await geoTiff.getImage(imageIndex);
  const plan = planNyc3depSourceTiles({
    source: {
      sourceSnapshotSha256,
      imageIndex,
      width: image.getWidth(),
      height: image.getHeight(),
      storage: image.isTiled ? 'tiled' : 'striped',
      blockWidth: image.getBlockWidth(),
      blockHeight: image.getBlockHeight(0),
    },
    maximumWindowWidth: requirePositiveInteger(
      input.maximumWindowWidth,
      'maximumWindowWidth',
    ),
    maximumWindowHeight: requirePositiveInteger(
      input.maximumWindowHeight,
      'maximumWindowHeight',
    ),
    maximumTileCount: requirePositiveInteger(
      input.maximumTileCount,
      'maximumTileCount',
    ),
  });
  mkdirSync(dirname(outputPath), { recursive: true });
  const data = `${JSON.stringify(plan, null, 2)}\n`;
  writeFileSync(outputPath, data, { encoding: 'utf8', flag: 'wx' });
  return {
    plan,
    outputPath,
    byteLength: new TextEncoder().encode(data).byteLength,
    contentSha256: sha256(new TextEncoder().encode(data)),
  };
}

function requiredArgument(flag: string) {
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${flag} is required.`);
  return value;
}

function optionalIntegerArgument(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--') || !/^\d+$/.test(value)) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }
  return Number(value);
}

async function main() {
  const result = await createNyc3depLocalTilePlan({
    assetPath: requiredArgument('--asset'),
    ledgerPath: requiredArgument('--ledger'),
    outputPath: requiredArgument('--output'),
    generatedAt: requiredArgument('--generated-at'),
    maximumWindowWidth: Number(requiredArgument('--max-window-width')),
    maximumWindowHeight: Number(requiredArgument('--max-window-height')),
    maximumTileCount: Number(requiredArgument('--max-tiles')),
    imageIndex: optionalIntegerArgument('--image-index'),
  });
  console.log(JSON.stringify({
    cliVersion: NYC_3DEP_TILE_PLAN_CLI_VERSION,
    outputFile: basename(result.outputPath),
    outputBytes: result.byteLength,
    contentSha256: result.contentSha256,
    sourceSnapshotSha256: result.plan.source.sourceSnapshotSha256,
    imageIndex: result.plan.source.imageIndex,
    tileCount: result.plan.tiles.length,
    method: result.plan.method,
    warnings: result.plan.nonClaims,
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
