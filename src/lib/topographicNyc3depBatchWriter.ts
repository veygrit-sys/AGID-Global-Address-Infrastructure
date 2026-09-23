import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import {
  verifyLocalGeoTiffMeshLodBundle,
  type LocalGeoTiffWorkflowResult,
} from './topographicLocalGeoTiffWorkflow';
import {
  buildNyc3depParent3dTileset,
  type Nyc3depParent3dTilesChild,
} from './topographicNyc3depParent3dTiles';
import {
  createNyc3depTileBatchReceipt,
  type Nyc3depTileWorkflowArtifact,
} from './topographicNyc3depTileBatch';
import {
  verifyNyc3depSourceTilingPlan,
  type Nyc3depSourceTilingPlan,
} from './topographicNyc3depTiling';

export const NYC_3DEP_BATCH_EXPORT_MANIFEST_SCHEMA =
  'agid-nyc-3dep-local-batch-export-v0.2';
export const NYC_3DEP_BATCH_EXPORT_MANIFEST_FILE = 'batch.export.json';
export const NYC_3DEP_BATCH_RECEIPT_FILE = 'batch.receipt.json';
export const NYC_3DEP_BATCH_PLAN_FILE = 'tile.plan.json';

type Sha256 = `sha256:${string}`;

export type Nyc3depTileBatchWritableArtifact = Nyc3depTileWorkflowArtifact & {
  result: LocalGeoTiffWorkflowResult;
};

export type Nyc3depLocalBatchExport = {
  outputDirectory: string;
  receiptPath: string;
  manifestPath: string;
  parent: {
    status: 'ready';
    tilesetPath: string;
    evidencePath: string;
    tilesetSha256: Sha256;
    evidenceSha256: Sha256;
  } | {
    status: 'blocked';
    blockedTileIds: string[];
  };
  tileDirectories: Array<{
    tileId: string;
    directory: string;
  }>;
};

const SAFE_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SAFE_TILE_ID = /^r\d{4}-c\d{4}$/;

function sha256(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as Sha256;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function writeNewFile(path: string, data: string | Uint8Array) {
  const fileName = basename(path);
  if (!SAFE_FILE_NAME.test(fileName)) {
    throw new Error(`Refusing an unsafe batch artifact file name: ${fileName}`);
  }
  writeFileSync(path, data, { flag: 'wx' });
}

function writeJson(path: string, value: unknown) {
  const data = `${JSON.stringify(value, null, 2)}\n`;
  writeNewFile(path, data);
  return {
    byteLength: byteLength(data),
    sha256: sha256(data),
  };
}

function requireOutputDirectory(path: string) {
  try {
    mkdirSync(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`NYC batch outputDirectory must be a new empty directory: ${message}`);
  }
}

function childDirectory(outputDirectory: string, tileId: string) {
  if (!SAFE_TILE_ID.test(tileId)) {
    throw new Error(`NYC batch contains an unsafe tile identifier: ${tileId}`);
  }
  const childrenDirectory = resolve(outputDirectory, 'children');
  const directory = resolve(childrenDirectory, tileId);
  if (!directory.startsWith(`${childrenDirectory}\\`)) {
    throw new Error('NYC batch child directory escapes the output root.');
  }
  return directory;
}

function batchManifest(input: {
  generatedAt: string;
  plan: Nyc3depSourceTilingPlan;
  planFileName: string;
  planSha256: Sha256;
  planByteLength: number;
  receiptFileName: string;
  receiptSha256: Sha256;
  receiptByteLength: number;
  tileDirectories: Nyc3depLocalBatchExport['tileDirectories'];
  parent: Nyc3depLocalBatchExport['parent'];
}) {
  return {
    schemaVersion: NYC_3DEP_BATCH_EXPORT_MANIFEST_SCHEMA,
    generatedAt: input.generatedAt,
    plan: {
      fileName: input.planFileName,
      sha256: input.planSha256,
      byteLength: input.planByteLength,
      planSha256: input.plan.planSha256,
    },
    source: {
      snapshotSha256: input.plan.source.sourceSnapshotSha256,
      imageIndex: input.plan.source.imageIndex,
      sourceImageWidth: input.plan.source.width,
      sourceImageHeight: input.plan.source.height,
    },
    receipt: {
      fileName: input.receiptFileName,
      sha256: input.receiptSha256,
      byteLength: input.receiptByteLength,
    },
    tiles: input.tileDirectories.map(tile => ({
      tileId: tile.tileId,
      directory: `children/${tile.tileId}`,
    })),
    parent: input.parent.status === 'ready'
      ? {
          status: 'ready' as const,
          tilesetFileName: 'tileset.json',
          tilesetSha256: input.parent.tilesetSha256,
          evidenceFileName: 'tileset.evidence.json',
          evidenceSha256: input.parent.evidenceSha256,
        }
      : {
          status: 'blocked' as const,
          blockedTileIds: [...input.parent.blockedTileIds],
        },
    privacy: {
      containsRawElevation: false,
      containsAddressData: false,
    },
    nonClaims: [
      'The completion manifest indexes derived local artifacts and does not contain raw elevation samples or personal delivery data.',
      'A blocked parent means no parent 3D Tiles hierarchy was written.',
      'The presence of this local package is not external validator, renderer, coverage, survey, building, cadastral, or delivery evidence.',
    ],
  };
}

/**
 * Persists a complete local batch only after all planned windows have been
 * validated in memory. The final manifest is a completion marker and is the
 * only file written after the batch receipt and any eligible parent tileset.
 */
export async function writeNyc3depLocalTileBatch(input: {
  outputDirectory: string;
  generatedAt: string;
  plan: Nyc3depSourceTilingPlan;
  artifacts: readonly Nyc3depTileBatchWritableArtifact[];
}): Promise<Nyc3depLocalBatchExport> {
  const plan = verifyNyc3depSourceTilingPlan(input.plan);
  const outputDirectory = resolve(input.outputDirectory);
  const receipt = createNyc3depTileBatchReceipt({
    generatedAt: input.generatedAt,
    plan,
    artifacts: input.artifacts,
  });
  const artifactById = new Map(input.artifacts.map(artifact => [artifact.tileId, artifact]));
  const tileDirectories = plan.tiles.map(tile => ({
    tileId: tile.id,
    directory: childDirectory(outputDirectory, tile.id),
  }));
  const readyChildren: Nyc3depParent3dTilesChild[] = [];
  for (const tile of plan.tiles) {
    const artifact = artifactById.get(tile.id);
    if (!artifact) throw new Error(`NYC local batch is missing planned tile ${tile.id}.`);
    if (!artifact.result.meshLodBundle) {
      throw new Error(`NYC local batch tile ${tile.id} is missing its mesh LOD bundle.`);
    }
    await verifyLocalGeoTiffMeshLodBundle(artifact.result.meshLodBundle);
    if (artifact.result.threeDTiles?.status === 'ready') {
      readyChildren.push({
        tileId: tile.id,
        uri: `children/${tile.id}/tileset.json`,
        bundle: artifact.result.threeDTiles.bundle,
        lodBundle: artifact.result.meshLodBundle,
      });
    }
  }
  const blockedTileIds = receipt.tiles
    .filter(tile => tile.threeDTiles.status !== 'ready')
    .map(tile => tile.tileId);
  const parentBundle = blockedTileIds.length === 0
    ? await buildNyc3depParent3dTileset({
        generatedAt: input.generatedAt,
        batchReceipt: receipt,
        children: readyChildren,
      })
    : null;

  requireOutputDirectory(outputDirectory);
  mkdirSync(resolve(outputDirectory, 'children'));
  const planPath = resolve(outputDirectory, NYC_3DEP_BATCH_PLAN_FILE);
  const planDigest = writeJson(planPath, plan);
  for (const tile of plan.tiles) {
    const artifact = artifactById.get(tile.id);
    const directory = childDirectory(outputDirectory, tile.id);
    if (!artifact) throw new Error(`NYC local batch is missing planned tile ${tile.id}.`);
    mkdirSync(directory);
    writeNewFile(resolve(directory, artifact.result.output.fileName), artifact.result.output.data);
    writeNewFile(resolve(directory, artifact.result.evidence.fileName), artifact.result.evidence.data);
    const lodBundle = artifact.result.meshLodBundle;
    if (!lodBundle) throw new Error(`NYC local batch tile ${tile.id} is missing its mesh LOD bundle.`);
    for (const lod of lodBundle.artifacts) {
      writeNewFile(resolve(directory, lod.output.fileName), lod.output.data);
    }
    writeNewFile(resolve(directory, lodBundle.manifest.fileName), lodBundle.manifest.data);
    if (artifact.result.threeDTiles?.status === 'ready') {
      const bundle = artifact.result.threeDTiles.bundle;
      writeNewFile(resolve(directory, bundle.tileset.fileName), bundle.tileset.data);
      writeNewFile(resolve(directory, bundle.evidence.fileName), bundle.evidence.data);
    }
  }
  const receiptPath = resolve(outputDirectory, NYC_3DEP_BATCH_RECEIPT_FILE);
  const receiptDigest = writeJson(receiptPath, receipt);
  const parentTilesetPath = resolve(outputDirectory, 'tileset.json');
  const parentEvidencePath = resolve(outputDirectory, 'tileset.evidence.json');
  const parent: Nyc3depLocalBatchExport['parent'] = parentBundle
    ? {
        status: 'ready',
        tilesetPath: parentTilesetPath,
        evidencePath: parentEvidencePath,
        tilesetSha256: parentBundle.tileset.sha256,
        evidenceSha256: parentBundle.evidence.sha256,
      }
    : {
        status: 'blocked',
        blockedTileIds,
  };
  if (parentBundle) {
    writeNewFile(parentTilesetPath, parentBundle.tileset.data);
    writeNewFile(parentEvidencePath, parentBundle.evidence.data);
  }
  const manifestPath = resolve(outputDirectory, NYC_3DEP_BATCH_EXPORT_MANIFEST_FILE);
  writeJson(manifestPath, batchManifest({
    generatedAt: input.generatedAt,
    plan,
    planFileName: NYC_3DEP_BATCH_PLAN_FILE,
    planSha256: planDigest.sha256,
    planByteLength: planDigest.byteLength,
    receiptFileName: NYC_3DEP_BATCH_RECEIPT_FILE,
    receiptSha256: receiptDigest.sha256,
    receiptByteLength: receiptDigest.byteLength,
    tileDirectories,
    parent,
  }));
  return {
    outputDirectory,
    receiptPath,
    manifestPath,
    parent,
    tileDirectories,
  };
}
