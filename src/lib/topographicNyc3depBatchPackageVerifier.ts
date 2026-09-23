import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, isAbsolute, relative, resolve } from 'node:path';

import {
  NYC_3DEP_BATCH_EXPORT_MANIFEST_FILE,
  NYC_3DEP_BATCH_EXPORT_MANIFEST_SCHEMA,
  NYC_3DEP_BATCH_PLAN_FILE,
  NYC_3DEP_BATCH_RECEIPT_FILE,
} from './topographicNyc3depBatchWriter';
import {
  verifyNyc3depTileBatchReceipt,
  type Nyc3depTileBatchReceipt,
} from './topographicNyc3depTileBatch';
import {
  verifyNyc3depParent3dTileset,
  type Nyc3depParent3dTilesChild,
  type Nyc3depParent3dTilesBundle,
} from './topographicNyc3depParent3dTiles';
import {
  verifyNyc3depSourceTilingPlan,
  type Nyc3depSourceTilingPlan,
} from './topographicNyc3depTiling';
import {
  verifyLocalGeoTiffMeshLodBundle,
  type LocalGeoTiffMeshLodBundle,
  type LocalGeoTiffMeshLodManifest,
} from './topographicLocalGeoTiffWorkflow';
import type { SerializedTopographicExport } from './topographicExportSerializers';
import {
  verifyTopographic3dTilesBundle,
  type Topographic3dTilesBundle,
  type Topographic3dTilesEvidence,
  type Topographic3dTilesTileset,
} from './topographic3dTiles';

export const MAX_NYC_3DEP_BATCH_PACKAGE_JSON_BYTES = 4 * 1024 * 1024;
export const MAX_NYC_3DEP_BATCH_PACKAGE_ARTIFACT_BYTES = 1024 * 1024 * 1024;
export const MAX_NYC_3DEP_BATCH_PACKAGE_3D_CONTENT_BYTES = 64 * 1024 * 1024;

type Sha256 = `sha256:${string}`;

export type Nyc3depLocalTileBatchPackageVerification = {
  outputDirectory: string;
  planSha256: Sha256;
  receiptSha256: Sha256;
  tileCount: number;
  parent: {
    status: 'ready';
    tilesetSha256: Sha256;
    evidenceSha256: Sha256;
  } | {
    status: 'blocked';
    blockedTileIds: string[];
  };
};

const SHA256 = /^sha256:[a-f0-9]{64}$/i;
const SAFE_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SAFE_TILE_ID = /^r\d{4}-c\d{4}$/;

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as Sha256;
}

function asObject(value: unknown, field: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, field: string) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  return value;
}

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value;
}

function requireDigest(value: unknown, field: string) {
  const digest = requireString(value, field);
  if (!SHA256.test(digest)) throw new Error(`${field} must be a SHA-256 digest.`);
  return digest as Sha256;
}

function requireByteLength(value: unknown, field: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new Error(`${field} must be a positive safe integer.`);
  }
  return value as number;
}

function requireSafeFileName(value: unknown, field: string) {
  const fileName = requireString(value, field);
  if (basename(fileName) !== fileName || !SAFE_FILE_NAME.test(fileName)) {
    throw new Error(`${field} must be a safe file name.`);
  }
  return fileName;
}

function resolveWithin(root: string, relativePath: string, field: string) {
  const candidate = resolve(root, relativePath);
  const pathRelativeToRoot = relative(root, candidate);
  if (
    pathRelativeToRoot === ''
    || pathRelativeToRoot.startsWith('..')
    || isAbsolute(pathRelativeToRoot)
  ) {
    throw new Error(`${field} escapes the batch output directory.`);
  }
  return candidate;
}

function readBoundFile(path: string, maximumBytes: number, field: string) {
  const stat = statSync(path);
  if (!stat.isFile() || stat.size <= 0 || stat.size > maximumBytes) {
    throw new Error(`${field} must be a non-empty regular file within the configured byte limit.`);
  }
  const bytes = Uint8Array.from(readFileSync(path));
  return {
    bytes,
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
  };
}

function readBoundJson(path: string, field: string) {
  const file = readBoundFile(path, MAX_NYC_3DEP_BATCH_PACKAGE_JSON_BYTES, field);
  try {
    return {
      ...file,
      value: JSON.parse(new TextDecoder().decode(file.bytes)) as unknown,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${field} must contain valid JSON: ${message}`);
  }
}

function verifyBoundArtifact(input: {
  root: string;
  relativeDirectory: string;
  fileName: unknown;
  sha256: unknown;
  byteLength: unknown;
  field: string;
}) {
  const fileName = requireSafeFileName(input.fileName, `${input.field}.fileName`);
  const expectedSha256 = requireDigest(input.sha256, `${input.field}.sha256`);
  const expectedByteLength = requireByteLength(input.byteLength, `${input.field}.byteLength`);
  const path = resolveWithin(
    input.root,
    `${input.relativeDirectory}/${fileName}`,
    input.field,
  );
  const actual = readBoundFile(path, MAX_NYC_3DEP_BATCH_PACKAGE_ARTIFACT_BYTES, input.field);
  if (actual.byteLength !== expectedByteLength || actual.sha256 !== expectedSha256) {
    throw new Error(`${input.field} does not match its recorded byte length or SHA-256.`);
  }
  return { path, sha256: actual.sha256 };
}

function requireNonNegativeInteger(value: unknown, field: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${field} must be a non-negative safe integer.`);
  }
  return value as number;
}

function requirePositiveInteger(value: unknown, field: string) {
  const integer = requireNonNegativeInteger(value, field);
  if (integer === 0) throw new Error(`${field} must be a positive safe integer.`);
  return integer;
}

function decodeUtf8(bytes: Uint8Array, field: string) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${field} must be valid UTF-8.`);
  }
}

async function verifyMeshLodArtifacts(input: {
  root: string;
  relativeDirectory: string;
  primaryEvidencePath: string;
  tileId: string;
}): Promise<LocalGeoTiffMeshLodBundle> {
  const evidence = asObject(
    readBoundJson(input.primaryEvidencePath, `tile ${input.tileId} primary evidence`).value,
    `tile ${input.tileId} primary evidence`,
  );
  const output = asObject(evidence.output, `tile ${input.tileId} primary evidence.output`);
  const meshLodBundle = asObject(
    output.meshLodBundle,
    `tile ${input.tileId} primary evidence.output.meshLodBundle`,
  );
  const manifestFileName = requireSafeFileName(
    meshLodBundle.manifestFileName,
    `tile ${input.tileId} LOD manifest fileName`,
  );
  const manifestSha256 = requireDigest(
    meshLodBundle.manifestSha256,
    `tile ${input.tileId} LOD manifest sha256`,
  );
  const manifestPath = resolveWithin(
    input.root,
    `${input.relativeDirectory}/${manifestFileName}`,
    `tile ${input.tileId} LOD manifest`,
  );
  const lodManifestFile = readBoundJson(manifestPath, `tile ${input.tileId} LOD manifest`);
  if (lodManifestFile.sha256 !== manifestSha256) {
    throw new Error(`tile ${input.tileId} LOD manifest does not match its evidence digest.`);
  }
  const lodManifest = asObject(lodManifestFile.value, `tile ${input.tileId} LOD manifest`);
  const levels = asArray(lodManifest.levels, `tile ${input.tileId} LOD manifest.levels`);
  if (levels.length < 1) {
    throw new Error(`tile ${input.tileId} LOD manifest must contain at least one level.`);
  }
  const format = requireString(
    asObject(lodManifest.output, `tile ${input.tileId} LOD manifest.output`).format,
    `tile ${input.tileId} LOD manifest.output.format`,
  ) as SerializedTopographicExport['format'];
  const artifacts: LocalGeoTiffMeshLodBundle['artifacts'] = [];
  for (let index = 0; index < levels.length; index += 1) {
    const level = asObject(levels[index], `tile ${input.tileId} LOD manifest.levels[${index}]`);
    const field = `tile ${input.tileId} LOD artifact ${index}`;
    const fileName = requireSafeFileName(level.fileName, `${field}.fileName`);
    const expectedSha256 = requireDigest(level.sha256, `${field}.sha256`);
    const expectedByteLength = requireByteLength(level.byteLength, `${field}.byteLength`);
    const file = readBoundFile(
      resolveWithin(input.root, `${input.relativeDirectory}/${fileName}`, field),
      MAX_NYC_3DEP_BATCH_PACKAGE_3D_CONTENT_BYTES,
      field,
    );
    if (file.byteLength !== expectedByteLength || file.sha256 !== expectedSha256) {
      throw new Error(`${field} does not match its recorded byte length or SHA-256.`);
    }
    const extensionOffset = fileName.lastIndexOf('.');
    artifacts.push({
      level: requireNonNegativeInteger(level.level, `${field}.level`),
      stride: requirePositiveInteger(level.stride, `${field}.stride`),
      sha256: file.sha256,
      output: {
        format,
        fileName,
        mediaType: requireString(level.mediaType, `${field}.mediaType`),
        extension: extensionOffset > -1 ? fileName.slice(extensionOffset + 1) : '',
        data: decodeUtf8(file.bytes, field),
        byteLength: file.byteLength,
        includedLayers: ['terrain-mesh'],
        warnings: [],
      },
    });
  }
  const bundle: LocalGeoTiffMeshLodBundle = {
    artifacts,
    manifest: {
      fileName: manifestFileName,
      mediaType: 'application/json',
      data: decodeUtf8(lodManifestFile.bytes, `tile ${input.tileId} LOD manifest`),
      byteLength: lodManifestFile.byteLength,
      sha256: lodManifestFile.sha256,
      manifest: lodManifestFile.value as LocalGeoTiffMeshLodManifest,
    },
  };
  await verifyLocalGeoTiffMeshLodBundle(bundle);
  return bundle;
}

async function verifyChild3dTiles(input: {
  root: string;
  relativeDirectory: string;
  tileId: string;
  sourceSnapshotSha256: Sha256;
  lodBundle: LocalGeoTiffMeshLodBundle;
  threeDTiles: Extract<Nyc3depTileBatchReceipt['tiles'][number]['threeDTiles'], { status: 'ready' }>;
}): Promise<Nyc3depParent3dTilesChild> {
  const tilesetFileName = requireSafeFileName(
    input.threeDTiles.tilesetFileName,
    `tile ${input.tileId} 3D Tiles tileset fileName`,
  );
  const evidenceFileName = requireSafeFileName(
    input.threeDTiles.evidenceFileName,
    `tile ${input.tileId} 3D Tiles evidence fileName`,
  );
  if (tilesetFileName !== 'tileset.json' || evidenceFileName !== 'tileset.evidence.json') {
    throw new Error(`tile ${input.tileId} 3D Tiles files must use canonical names.`);
  }
  const tilesetFile = readBoundJson(
    resolveWithin(input.root, `${input.relativeDirectory}/${tilesetFileName}`, `tile ${input.tileId} tileset`),
    `tile ${input.tileId} tileset`,
  );
  const evidenceFile = readBoundJson(
    resolveWithin(input.root, `${input.relativeDirectory}/${evidenceFileName}`, `tile ${input.tileId} 3D Tiles evidence`),
    `tile ${input.tileId} 3D Tiles evidence`,
  );
  if (
    tilesetFile.sha256 !== input.threeDTiles.tilesetSha256
    || evidenceFile.sha256 !== input.threeDTiles.evidenceSha256
  ) {
    throw new Error(`tile ${input.tileId} 3D Tiles files do not match the batch receipt.`);
  }
  const bundle: Topographic3dTilesBundle = {
    contents: input.lodBundle.artifacts,
    tileset: {
      fileName: 'tileset.json',
      mediaType: 'application/json',
      data: decodeUtf8(tilesetFile.bytes, `tile ${input.tileId} tileset`),
      byteLength: tilesetFile.byteLength,
      sha256: tilesetFile.sha256,
      tileset: tilesetFile.value as Topographic3dTilesTileset,
    },
    evidence: {
      fileName: 'tileset.evidence.json',
      mediaType: 'application/json',
      data: decodeUtf8(evidenceFile.bytes, `tile ${input.tileId} 3D Tiles evidence`),
      byteLength: evidenceFile.byteLength,
      sha256: evidenceFile.sha256,
      manifest: evidenceFile.value as Topographic3dTilesEvidence,
    },
  };
  await verifyTopographic3dTilesBundle(bundle, input.lodBundle);
  if (
    bundle.evidence.manifest.source.snapshotSha256 !== input.sourceSnapshotSha256
    || bundle.evidence.manifest.source.lodManifestSha256
      !== input.lodBundle.manifest.sha256
  ) {
    throw new Error(`tile ${input.tileId} 3D Tiles provenance does not match the verified LOD bundle.`);
  }
  return {
    tileId: input.tileId,
    uri: `${input.relativeDirectory}/tileset.json`,
    bundle,
    lodBundle: input.lodBundle,
  };
}

/**
 * Rechecks the retained local package without reading a raw GeoTIFF. It proves
 * hash-bound and reconstructed 3D Tiles consistency of the plan, receipt,
 * child files, and optional parent hierarchy, not source promotion or external
 * renderer conformance.
 */
export async function verifyNyc3depLocalTileBatchPackage(
  inputOutputDirectory: string,
): Promise<Nyc3depLocalTileBatchPackageVerification> {
  const outputDirectory = resolve(inputOutputDirectory);
  const manifestPath = resolveWithin(
    outputDirectory,
    NYC_3DEP_BATCH_EXPORT_MANIFEST_FILE,
    'batch manifest',
  );
  const manifest = asObject(readBoundJson(manifestPath, 'batch manifest').value, 'batch manifest');
  if (manifest.schemaVersion !== NYC_3DEP_BATCH_EXPORT_MANIFEST_SCHEMA) {
    throw new Error('batch manifest schema is unsupported.');
  }
  const planReference = asObject(manifest.plan, 'batch manifest.plan');
  const planFileName = requireSafeFileName(planReference.fileName, 'batch manifest.plan.fileName');
  if (planFileName !== NYC_3DEP_BATCH_PLAN_FILE) {
    throw new Error('batch manifest must reference the canonical tile plan file.');
  }
  const planFile = readBoundJson(resolveWithin(outputDirectory, planFileName, 'tile plan'), 'tile plan');
  if (
    planFile.sha256 !== requireDigest(planReference.sha256, 'batch manifest.plan.sha256')
    || planFile.byteLength !== requireByteLength(planReference.byteLength, 'batch manifest.plan.byteLength')
  ) {
    throw new Error('tile plan does not match its manifest digest binding.');
  }
  const plan = verifyNyc3depSourceTilingPlan(planFile.value as Nyc3depSourceTilingPlan);
  if (plan.planSha256 !== requireDigest(planReference.planSha256, 'batch manifest.plan.planSha256')) {
    throw new Error('tile plan does not match its manifest plan digest.');
  }

  const receiptReference = asObject(manifest.receipt, 'batch manifest.receipt');
  const receiptFileName = requireSafeFileName(receiptReference.fileName, 'batch manifest.receipt.fileName');
  if (receiptFileName !== NYC_3DEP_BATCH_RECEIPT_FILE) {
    throw new Error('batch manifest must reference the canonical batch receipt file.');
  }
  const receiptFile = readBoundJson(resolveWithin(outputDirectory, receiptFileName, 'batch receipt'), 'batch receipt');
  if (
    receiptFile.sha256 !== requireDigest(receiptReference.sha256, 'batch manifest.receipt.sha256')
    || receiptFile.byteLength !== requireByteLength(receiptReference.byteLength, 'batch manifest.receipt.byteLength')
  ) {
    throw new Error('batch receipt does not match its manifest digest binding.');
  }
  const receipt = verifyNyc3depTileBatchReceipt(receiptFile.value as Nyc3depTileBatchReceipt);
  if (
    receipt.planSha256 !== plan.planSha256
    || receipt.source.snapshotSha256 !== plan.source.sourceSnapshotSha256
    || receipt.source.imageIndex !== plan.source.imageIndex
    || receipt.source.sourceImageWidth !== plan.source.width
    || receipt.source.sourceImageHeight !== plan.source.height
  ) {
    throw new Error('batch receipt does not bind the retained tile plan.');
  }

  const manifestTiles = asArray(manifest.tiles, 'batch manifest.tiles');
  if (manifestTiles.length !== plan.tiles.length || receipt.tiles.length !== plan.tiles.length) {
    throw new Error('batch package tile count does not match its source plan.');
  }
  const receiptById = new Map(receipt.tiles.map(tile => [tile.tileId, tile]));
  const readyChildren: Nyc3depParent3dTilesChild[] = [];
  for (let index = 0; index < plan.tiles.length; index += 1) {
    const tile = plan.tiles[index];
    const manifestTile = asObject(manifestTiles[index], `batch manifest.tiles[${index}]`);
    const tileId = requireString(manifestTile.tileId, `batch manifest.tiles[${index}].tileId`);
    if (tileId !== tile.id || !SAFE_TILE_ID.test(tileId)) {
      throw new Error('batch manifest tiles must preserve the verified plan order and identifiers.');
    }
    const relativeDirectory = requireString(manifestTile.directory, `batch manifest.tiles[${index}].directory`);
    if (relativeDirectory !== `children/${tile.id}`) {
      throw new Error('batch manifest child directory does not match its planned tile identifier.');
    }
    const receiptTile = receiptById.get(tile.id);
    if (!receiptTile) throw new Error(`batch receipt is missing planned tile ${tile.id}.`);
    verifyBoundArtifact({
      root: outputDirectory,
      relativeDirectory,
      fileName: receiptTile.output.fileName,
      sha256: receiptTile.output.sha256,
      byteLength: receiptTile.output.byteLength,
      field: `tile ${tile.id} primary output`,
    });
    const primaryEvidence = verifyBoundArtifact({
      root: outputDirectory,
      relativeDirectory,
      fileName: receiptTile.evidence.fileName,
      sha256: receiptTile.evidence.sha256,
      byteLength: receiptTile.evidence.byteLength,
      field: `tile ${tile.id} evidence`,
    });
    const lodBundle = await verifyMeshLodArtifacts({
      root: outputDirectory,
      relativeDirectory,
      primaryEvidencePath: primaryEvidence.path,
      tileId: tile.id,
    });
    if (receiptTile.threeDTiles.status === 'ready') {
      readyChildren.push(await verifyChild3dTiles({
        root: outputDirectory,
        relativeDirectory,
        tileId: tile.id,
        sourceSnapshotSha256: receipt.source.snapshotSha256,
        lodBundle,
        threeDTiles: receiptTile.threeDTiles,
      }));
    }
  }

  const parent = asObject(manifest.parent, 'batch manifest.parent');
  const blockedTileIds = receipt.tiles
    .filter(tile => tile.threeDTiles.status !== 'ready')
    .map(tile => tile.tileId);
  if (blockedTileIds.length === 0) {
    if (parent.status !== 'ready') {
      throw new Error('batch manifest must provide a parent tileset when every child is ready.');
    }
    const tilesetFileName = requireSafeFileName(parent.tilesetFileName, 'batch manifest.parent.tilesetFileName');
    const evidenceFileName = requireSafeFileName(parent.evidenceFileName, 'batch manifest.parent.evidenceFileName');
    if (tilesetFileName !== 'tileset.json' || evidenceFileName !== 'tileset.evidence.json') {
      throw new Error('batch manifest parent must use canonical 3D Tiles file names.');
    }
    const parentTileset = readBoundJson(
      resolveWithin(outputDirectory, tilesetFileName, 'parent tileset'),
      'parent tileset',
    );
    const parentEvidence = readBoundJson(
      resolveWithin(outputDirectory, evidenceFileName, 'parent evidence'),
      'parent evidence',
    );
    if (
      parentTileset.sha256 !== requireDigest(parent.tilesetSha256, 'batch manifest.parent.tilesetSha256')
      || parentEvidence.sha256 !== requireDigest(parent.evidenceSha256, 'batch manifest.parent.evidenceSha256')
    ) {
      throw new Error('batch manifest parent files do not match their recorded SHA-256 digests.');
    }
    const parentBundle: Nyc3depParent3dTilesBundle = {
      tileset: {
        fileName: 'tileset.json',
        mediaType: 'application/json',
        data: decodeUtf8(parentTileset.bytes, 'parent tileset'),
        byteLength: parentTileset.byteLength,
        sha256: parentTileset.sha256,
        tileset: parentTileset.value as Nyc3depParent3dTilesBundle['tileset']['tileset'],
      },
      evidence: {
        fileName: 'tileset.evidence.json',
        mediaType: 'application/json',
        data: decodeUtf8(parentEvidence.bytes, 'parent evidence'),
        byteLength: parentEvidence.byteLength,
        sha256: parentEvidence.sha256,
        manifest: parentEvidence.value as Nyc3depParent3dTilesBundle['evidence']['manifest'],
      },
    };
    await verifyNyc3depParent3dTileset({
      generatedAt: receipt.generatedAt,
      batchReceipt: receipt,
      children: readyChildren,
      bundle: parentBundle,
    });
    return {
      outputDirectory,
      planSha256: plan.planSha256,
      receiptSha256: receiptFile.sha256,
      tileCount: plan.tiles.length,
      parent: {
        status: 'ready',
        tilesetSha256: requireDigest(parent.tilesetSha256, 'batch manifest.parent.tilesetSha256'),
        evidenceSha256: requireDigest(parent.evidenceSha256, 'batch manifest.parent.evidenceSha256'),
      },
    };
  }
  if (parent.status !== 'blocked') {
    throw new Error('batch manifest must mark the parent blocked while any child remains blocked.');
  }
  const manifestBlockedTileIds = asArray(parent.blockedTileIds, 'batch manifest.parent.blockedTileIds')
    .map((value, index) => requireString(value, `batch manifest.parent.blockedTileIds[${index}]`));
  if (JSON.stringify(manifestBlockedTileIds) !== JSON.stringify(blockedTileIds)) {
    throw new Error('batch manifest blocked tile list does not match the batch receipt.');
  }
  return {
    outputDirectory,
    planSha256: plan.planSha256,
    receiptSha256: receiptFile.sha256,
    tileCount: plan.tiles.length,
    parent: {
      status: 'blocked',
      blockedTileIds,
    },
  };
}
