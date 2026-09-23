import { createHash } from 'node:crypto';

import type { SerializedTopographicExport } from './topographicExportSerializers';
import type { LocalGeoTiffWorkflowResult } from './topographicLocalGeoTiffWorkflow';
import {
  verifyNyc3depSourceTilingPlan,
  type Nyc3depSourceTile,
  type Nyc3depSourceTilingPlan,
} from './topographicNyc3depTiling';

export const NYC_3DEP_TILE_BATCH_RECEIPT_SCHEMA =
  'agid-nyc-3dep-source-tile-batch-receipt-v0.1';
export const NYC_3DEP_TILE_BATCH_METHOD =
  'shared-source-edge-exact-float64-v1';

type Sha256 = `sha256:${string}`;

export type Nyc3depTileWorkflowArtifact = {
  tileId: string;
  result: Pick<
    LocalGeoTiffWorkflowResult,
    'decoded' | 'evidence' | 'output' | 'plan' | 'threeDTiles'
  >;
};

export type Nyc3depTileBatchReceipt = {
  schemaVersion: typeof NYC_3DEP_TILE_BATCH_RECEIPT_SCHEMA;
  method: typeof NYC_3DEP_TILE_BATCH_METHOD;
  generatedAt: string;
  planSha256: Sha256;
  source: {
    sourceId: 'usgs-3dep';
    snapshotSha256: Sha256;
    imageIndex: number;
    sourceImageWidth: number;
    sourceImageHeight: number;
  };
  tiles: Array<{
    tileId: string;
    row: number;
    column: number;
    output: {
      fileName: string;
      byteLength: number;
      sha256: Sha256;
    };
    evidence: {
      fileName: string;
      byteLength: number;
      sha256: Sha256;
    };
    threeDTiles: {
      status: 'ready';
      tilesetFileName: string;
      tilesetSha256: Sha256;
      evidenceFileName: string;
      evidenceSha256: Sha256;
    } | {
      status: 'blocked';
      issueCodes: string[];
    };
  }>;
  sharedEdges: Array<{
    orientation: 'east-west' | 'north-south';
    firstTileId: string;
    secondTileId: string;
    sampleCount: number;
    valueSha256: Sha256;
  }>;
  privacy: {
    containsRawElevation: false;
    containsCoordinates: false;
    containsAddressData: false;
  };
  nonClaims: string[];
  receiptSha256: Sha256;
};

function sha256(value: string | Uint8Array) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as Sha256;
}

function outputBytes(output: SerializedTopographicExport) {
  return typeof output.data === 'string'
    ? new TextEncoder().encode(output.data)
    : Uint8Array.from(output.data);
}

function assertIsoTimestamp(value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error('NYC tile batch generatedAt must be an ISO timestamp.');
  }
}

function sameWindow(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
) {
  return first.x === second.x
    && first.y === second.y
    && first.width === second.width
    && first.height === second.height;
}

function plannedTileIndex(plan: Nyc3depSourceTilingPlan) {
  return new Map(plan.tiles.map(tile => [tile.id, tile]));
}

function edgeValues(input: {
  artifact: Nyc3depTileWorkflowArtifact;
  side: 'north' | 'east' | 'south' | 'west';
}) {
  const { grid } = input.artifact.result.decoded;
  const values = grid.elevationsMeters;
  if (values.length !== grid.width * grid.height) {
    throw new Error(`NYC tile ${input.artifact.tileId} grid sample count is invalid.`);
  }
  const edge: number[] = [];
  const edgeLength = input.side === 'east' || input.side === 'west'
    ? grid.height
    : grid.width;
  for (let index = 0; index < edgeLength; index += 1) {
    const offset = input.side === 'north'
      ? index
      : input.side === 'south'
        ? (grid.height - 1) * grid.width + index
        : input.side === 'west'
          ? index * grid.width
          : index * grid.width + grid.width - 1;
    const value = values[offset];
    if (!Number.isFinite(value)) {
      throw new Error(`NYC tile ${input.artifact.tileId} contains a non-finite shared edge sample.`);
    }
    edge.push(value);
  }
  return edge;
}

function assertEqualEdge(
  first: readonly number[],
  second: readonly number[],
  firstTileId: string,
  secondTileId: string,
) {
  if (first.length !== second.length) {
    throw new Error(`NYC tile seam ${firstTileId}/${secondTileId} has mismatched edge dimensions.`);
  }
  for (let index = 0; index < first.length; index += 1) {
    if (!Object.is(first[index], second[index])) {
      throw new Error(`NYC tile seam ${firstTileId}/${secondTileId} differs at shared sample ${index}.`);
    }
  }
  const bytes = new Uint8Array(first.length * Float64Array.BYTES_PER_ELEMENT);
  const view = new DataView(bytes.buffer);
  first.forEach((value, index) => view.setFloat64(index * Float64Array.BYTES_PER_ELEMENT, value, true));
  return sha256(bytes);
}

function assertArtifactMatchesPlan(input: {
  plan: Nyc3depSourceTilingPlan;
  tile: Nyc3depSourceTile;
  artifact: Nyc3depTileWorkflowArtifact;
}) {
  const { plan, tile, artifact } = input;
  const { result } = artifact;
  const { metadata, grid } = result.decoded;
  if (result.plan.status !== 'ready') {
    throw new Error(`NYC tile ${tile.id} has a blocked export plan.`);
  }
  if (
    result.evidence.manifest.source.sourceId !== 'usgs-3dep'
    || result.evidence.manifest.source.snapshotSha256 !== plan.source.sourceSnapshotSha256
    || metadata.contentSha256 !== plan.source.sourceSnapshotSha256
  ) {
    throw new Error(`NYC tile ${tile.id} is not bound to the planned USGS 3DEP snapshot.`);
  }
  if (
    metadata.imageLayout.imageIndex !== plan.source.imageIndex
    || metadata.sourceImageWidth !== plan.source.width
    || metadata.sourceImageHeight !== plan.source.height
    || !sameWindow(metadata.readWindow, tile.window)
    || grid.width !== tile.window.width
    || grid.height !== tile.window.height
  ) {
    throw new Error(`NYC tile ${tile.id} does not match its planned source window.`);
  }
  const evidence = result.evidence.manifest;
  if (
    evidence.input.contentSha256 !== plan.source.sourceSnapshotSha256
    || evidence.input.sourceImageWidth !== plan.source.width
    || evidence.input.sourceImageHeight !== plan.source.height
    || evidence.input.imageLayout.imageIndex !== plan.source.imageIndex
    || !sameWindow(evidence.input.readWindow, tile.window)
  ) {
    throw new Error(`NYC tile ${tile.id} evidence is not bound to its planned source window.`);
  }
  if (
    !result.threeDTiles
    || !evidence.output.threeDTiles
    || result.threeDTiles.status !== evidence.output.threeDTiles.status
  ) {
    throw new Error(`NYC tile ${tile.id} is missing matching 3D Tiles status evidence.`);
  }
}

function receiptPayload(receipt: Omit<Nyc3depTileBatchReceipt, 'receiptSha256'>) {
  return JSON.stringify(receipt);
}

/**
 * Binds individually derived local GeoTIFF windows to one immutable NYC plan.
 * Edge elevations exist only while this function compares them; the returned
 * receipt carries digests and artifact evidence, never raw elevation values.
 */
export function createNyc3depTileBatchReceipt(input: {
  generatedAt: string;
  plan: Nyc3depSourceTilingPlan;
  artifacts: readonly Nyc3depTileWorkflowArtifact[];
}): Nyc3depTileBatchReceipt {
  assertIsoTimestamp(input.generatedAt);
  const plan = verifyNyc3depSourceTilingPlan(input.plan);
  const tilesById = plannedTileIndex(plan);
  if (input.artifacts.length !== plan.tiles.length) {
    throw new Error('NYC tile batch must contain exactly one artifact for every planned tile.');
  }
  const artifactsById = new Map<string, Nyc3depTileWorkflowArtifact>();
  for (const artifact of input.artifacts) {
    const tile = tilesById.get(artifact.tileId);
    if (!tile || artifactsById.has(artifact.tileId)) {
      throw new Error(`NYC tile batch contains an unknown or duplicate tile ${artifact.tileId}.`);
    }
    assertArtifactMatchesPlan({ plan, tile, artifact });
    artifactsById.set(artifact.tileId, artifact);
  }

  const tiles = plan.tiles.map(tile => {
    const artifact = artifactsById.get(tile.id);
    if (!artifact) throw new Error(`NYC tile batch is missing ${tile.id}.`);
    const output = artifact.result.output;
    const evidence = artifact.result.evidence;
    const threeDTiles = evidence.manifest.output.threeDTiles;
    if (!threeDTiles) {
      throw new Error(`NYC tile ${tile.id} is missing attested 3D Tiles evidence.`);
    }
    const outputData = outputBytes(output);
    const evidenceData = new TextEncoder().encode(evidence.data);
    if (outputData.byteLength !== output.byteLength || evidenceData.byteLength !== evidence.byteLength) {
      throw new Error(`NYC tile ${tile.id} artifact byte length is inconsistent.`);
    }
    if (evidence.manifest.output.sha256 !== sha256(outputData)) {
      throw new Error(`NYC tile ${tile.id} output digest does not match its evidence.`);
    }
    return {
      tileId: tile.id,
      row: tile.row,
      column: tile.column,
      output: {
        fileName: output.fileName,
        byteLength: output.byteLength,
        sha256: evidence.manifest.output.sha256,
      },
      evidence: {
        fileName: evidence.fileName,
        byteLength: evidence.byteLength,
        sha256: sha256(evidenceData),
      },
      threeDTiles: threeDTiles.status === 'ready'
        ? {
            status: 'ready' as const,
            tilesetFileName: threeDTiles.tilesetFileName,
            tilesetSha256: threeDTiles.tilesetSha256,
            evidenceFileName: threeDTiles.evidenceFileName,
            evidenceSha256: threeDTiles.evidenceSha256,
          }
        : {
            status: 'blocked' as const,
            issueCodes: [...threeDTiles.issueCodes],
          },
    };
  });

  const sharedEdges: Nyc3depTileBatchReceipt['sharedEdges'] = [];
  for (const tile of plan.tiles) {
    const artifact = artifactsById.get(tile.id);
    if (!artifact) throw new Error(`NYC tile batch is missing ${tile.id}.`);
    const east = plan.tiles.find(candidate => candidate.row === tile.row && candidate.column === tile.column + 1);
    if (east) {
      const other = artifactsById.get(east.id);
      if (!other) throw new Error(`NYC tile batch is missing ${east.id}.`);
      const first = edgeValues({ artifact, side: 'east' });
      const second = edgeValues({ artifact: other, side: 'west' });
      sharedEdges.push({
        orientation: 'east-west',
        firstTileId: tile.id,
        secondTileId: east.id,
        sampleCount: first.length,
        valueSha256: assertEqualEdge(first, second, tile.id, east.id),
      });
    }
    const south = plan.tiles.find(candidate => candidate.row === tile.row + 1 && candidate.column === tile.column);
    if (south) {
      const other = artifactsById.get(south.id);
      if (!other) throw new Error(`NYC tile batch is missing ${south.id}.`);
      const first = edgeValues({ artifact, side: 'south' });
      const second = edgeValues({ artifact: other, side: 'north' });
      sharedEdges.push({
        orientation: 'north-south',
        firstTileId: tile.id,
        secondTileId: south.id,
        sampleCount: first.length,
        valueSha256: assertEqualEdge(first, second, tile.id, south.id),
      });
    }
  }

  const receipt: Omit<Nyc3depTileBatchReceipt, 'receiptSha256'> = {
    schemaVersion: NYC_3DEP_TILE_BATCH_RECEIPT_SCHEMA,
    method: NYC_3DEP_TILE_BATCH_METHOD,
    generatedAt: input.generatedAt,
    planSha256: plan.planSha256,
    source: {
      sourceId: 'usgs-3dep' as const,
      snapshotSha256: plan.source.sourceSnapshotSha256,
      imageIndex: plan.source.imageIndex,
      sourceImageWidth: plan.source.width,
      sourceImageHeight: plan.source.height,
    },
    tiles,
    sharedEdges,
    privacy: {
      containsRawElevation: false as const,
      containsCoordinates: false as const,
      containsAddressData: false as const,
    },
    nonClaims: [
      'The receipt proves only that independently derived source windows shared equal source-edge samples during this local run.',
      'It does not claim a complete NYC model, survey accuracy, building geometry, cadastral authority, entrance, or personal delivery information.',
      'Each retained 3D Tiles artifact remains subject to its source, license, CRS, vertical-datum, and external-renderer validation gates.',
    ],
  };
  return {
    ...receipt,
    receiptSha256: sha256(receiptPayload(receipt)),
  };
}

export function verifyNyc3depTileBatchReceipt(receipt: Nyc3depTileBatchReceipt) {
  assertIsoTimestamp(receipt.generatedAt);
  const { receiptSha256, ...payload } = receipt;
  if (receipt.schemaVersion !== NYC_3DEP_TILE_BATCH_RECEIPT_SCHEMA
    || receipt.method !== NYC_3DEP_TILE_BATCH_METHOD
    || receipt.source.sourceId !== 'usgs-3dep'
    || receipt.privacy.containsRawElevation
    || receipt.privacy.containsCoordinates
    || receipt.privacy.containsAddressData
    || receiptSha256 !== sha256(receiptPayload(payload))) {
    throw new Error('NYC tile batch receipt integrity check failed.');
  }
  return receipt;
}

/** A parent 3D Tiles hierarchy may be built only after every child is ready. */
export function requireNyc3depTileBatchReadyFor3dTilesHierarchy(
  receipt: Nyc3depTileBatchReceipt,
) {
  verifyNyc3depTileBatchReceipt(receipt);
  const blocked = receipt.tiles.filter(tile => tile.threeDTiles.status !== 'ready');
  if (blocked.length > 0) {
    throw new Error(
      `NYC tile batch cannot build a parent 3D Tiles hierarchy while ${blocked.length} child tile artifact(s) are blocked.`,
    );
  }
  return receipt;
}
