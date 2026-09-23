import { createHash } from 'node:crypto';

import {
  TOPOGRAPHIC_3D_TILES_ASSET_VERSION,
  verifyTopographic3dTilesBundle,
  type Topographic3dTilesBundle,
} from './topographic3dTiles';
import type { LocalGeoTiffMeshLodBundle } from './topographicLocalGeoTiffWorkflow';
import {
  requireNyc3depTileBatchReadyFor3dTilesHierarchy,
  type Nyc3depTileBatchReceipt,
} from './topographicNyc3depTileBatch';

export const NYC_3DEP_PARENT_3D_TILES_EVIDENCE_SCHEMA =
  'agid-nyc-3dep-parent-3d-tiles-evidence-v0.1';
export const NYC_3DEP_PARENT_3D_TILES_METHOD =
  'ogc-3d-tiles-external-tileset-parent-v1';

type Sha256 = `sha256:${string}`;
type Region = [number, number, number, number, number, number];

type ParentTile = {
  boundingVolume: { region: Region };
  geometricError: number;
  refine?: 'REPLACE';
  children?: Array<{
    boundingVolume: { region: Region };
    geometricError: number;
    content: { uri: string };
  }>;
};

export type Nyc3depParent3dTileset = {
  asset: {
    version: typeof TOPOGRAPHIC_3D_TILES_ASSET_VERSION;
    tilesetVersion: Sha256;
  };
  geometricError: number;
  root: ParentTile;
};

export type Nyc3depParent3dTilesChild = {
  tileId: string;
  uri: string;
  bundle: Topographic3dTilesBundle;
  lodBundle: LocalGeoTiffMeshLodBundle;
};

export type Nyc3depParent3dTilesBundle = {
  tileset: {
    fileName: 'tileset.json';
    mediaType: 'application/json';
    data: string;
    byteLength: number;
    sha256: Sha256;
    tileset: Nyc3depParent3dTileset;
  };
  evidence: {
    fileName: 'tileset.evidence.json';
    mediaType: 'application/json';
    data: string;
    byteLength: number;
    sha256: Sha256;
    manifest: {
      schemaVersion: typeof NYC_3DEP_PARENT_3D_TILES_EVIDENCE_SCHEMA;
      method: typeof NYC_3DEP_PARENT_3D_TILES_METHOD;
      generatedAt: string;
      batchReceiptSha256: Sha256;
      root: {
        boundingRegion: Region;
        geometricErrorMeters: number;
        refine: 'REPLACE';
      };
      children: Array<{
        tileId: string;
        uri: string;
        boundingRegion: Region;
        geometricErrorMeters: number;
        tilesetSha256: Sha256;
        evidenceSha256: Sha256;
      }>;
      privacy: {
        containsRawElevation: false;
        containsAddressData: false;
      };
      nonClaims: string[];
    };
  };
};

const SAFE_RELATIVE_URI = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function sha256(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as Sha256;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function assertIsoTimestamp(value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error('NYC parent 3D Tiles generatedAt must be an ISO timestamp.');
  }
}

function assertRegion(region: readonly number[]): asserts region is Region {
  if (region.length !== 6 || region.some(value => !Number.isFinite(value))) {
    throw new Error('NYC child 3D Tiles region must contain six finite values.');
  }
  if (
    region[0] >= region[2]
    || region[1] >= region[3]
    || region[4] > region[5]
  ) {
    throw new Error('NYC child 3D Tiles region is invalid or crosses the antimeridian.');
  }
}

function unionRegions(regions: readonly Region[]): Region {
  if (regions.length === 0) {
    throw new Error('NYC parent 3D Tiles hierarchy requires at least one child region.');
  }
  return [
    Math.min(...regions.map(region => region[0])),
    Math.min(...regions.map(region => region[1])),
    Math.max(...regions.map(region => region[2])),
    Math.max(...regions.map(region => region[3])),
    Math.min(...regions.map(region => region[4])),
    Math.max(...regions.map(region => region[5])),
  ];
}

function assertChildUri(uri: string, expectedFileName: string) {
  if (!SAFE_RELATIVE_URI.test(uri) || !uri.endsWith(`/${expectedFileName}`)) {
    throw new Error('NYC child tileset URI must be a safe relative path ending in tileset.json.');
  }
}

function receiptTileById(receipt: Nyc3depTileBatchReceipt) {
  return new Map(receipt.tiles.map(tile => [tile.tileId, tile]));
}

function parentEvidencePayload(
  manifest: Nyc3depParent3dTilesBundle['evidence']['manifest'],
) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * Creates a parent tileset whose children are independently validated external
 * tilesets. The parent deliberately has no terrain content of its own, so it
 * cannot hide a child source, placement, or LOD gate behind a merged mesh.
 */
export async function buildNyc3depParent3dTileset(input: {
  generatedAt: string;
  batchReceipt: Nyc3depTileBatchReceipt;
  children: readonly Nyc3depParent3dTilesChild[];
}): Promise<Nyc3depParent3dTilesBundle> {
  assertIsoTimestamp(input.generatedAt);
  const receipt = requireNyc3depTileBatchReadyFor3dTilesHierarchy(input.batchReceipt);
  if (input.children.length !== receipt.tiles.length) {
    throw new Error('NYC parent 3D Tiles hierarchy requires exactly one child for every ready batch tile.');
  }
  const receiptTiles = receiptTileById(receipt);
  const childrenById = new Map<string, Nyc3depParent3dTilesChild>();
  for (const child of input.children) {
    const receiptTile = receiptTiles.get(child.tileId);
    if (!receiptTile || childrenById.has(child.tileId)) {
      throw new Error(`NYC parent 3D Tiles hierarchy contains an unknown or duplicate child ${child.tileId}.`);
    }
    if (receiptTile.threeDTiles.status !== 'ready') {
      throw new Error(`NYC child ${child.tileId} is not ready for a parent 3D Tiles hierarchy.`);
    }
    assertChildUri(child.uri, child.bundle.tileset.fileName);
    await verifyTopographic3dTilesBundle(child.bundle, child.lodBundle);
    const evidence = child.bundle.evidence.manifest;
    if (
      evidence.source.snapshotSha256 !== receipt.source.snapshotSha256
      || evidence.source.verticalDatum !== 'EPSG:4979'
      || child.bundle.tileset.sha256 !== receiptTile.threeDTiles.tilesetSha256
      || child.bundle.evidence.sha256 !== receiptTile.threeDTiles.evidenceSha256
    ) {
      throw new Error(`NYC child ${child.tileId} does not match the ready batch receipt.`);
    }
    childrenById.set(child.tileId, child);
  }

  const childDescriptors = receipt.tiles.map(receiptTile => {
    const child = childrenById.get(receiptTile.tileId);
    if (!child) throw new Error(`NYC parent 3D Tiles hierarchy is missing ${receiptTile.tileId}.`);
    const region = [...child.bundle.tileset.tileset.root.boundingVolume.region] as Region;
    assertRegion(region);
    const geometricError = child.bundle.tileset.tileset.geometricError;
    if (!Number.isFinite(geometricError) || geometricError < 0) {
      throw new Error(`NYC child ${receiptTile.tileId} has an invalid geometric error.`);
    }
    return {
      tileId: receiptTile.tileId,
      uri: child.uri,
      region,
      geometricError,
      tilesetSha256: child.bundle.tileset.sha256,
      evidenceSha256: child.bundle.evidence.sha256,
    };
  });
  const rootRegion = unionRegions(childDescriptors.map(child => child.region));
  const maximumChildError = Math.max(...childDescriptors.map(child => child.geometricError));
  const rootGeometricError = maximumChildError > 0
    ? maximumChildError * 2
    : 0.000001;
  const tileset: Nyc3depParent3dTileset = {
    asset: {
      version: TOPOGRAPHIC_3D_TILES_ASSET_VERSION,
      tilesetVersion: receipt.receiptSha256,
    },
    geometricError: rootGeometricError,
    root: {
      boundingVolume: { region: rootRegion },
      geometricError: rootGeometricError,
      refine: 'REPLACE',
      children: childDescriptors.map(child => ({
        boundingVolume: { region: child.region },
        geometricError: child.geometricError,
        content: { uri: child.uri },
      })),
    },
  };
  const tilesetData = `${JSON.stringify(tileset, null, 2)}\n`;
  const tilesetSha256 = sha256(tilesetData);
  const manifest: Nyc3depParent3dTilesBundle['evidence']['manifest'] = {
    schemaVersion: NYC_3DEP_PARENT_3D_TILES_EVIDENCE_SCHEMA,
    method: NYC_3DEP_PARENT_3D_TILES_METHOD,
    generatedAt: input.generatedAt,
    batchReceiptSha256: receipt.receiptSha256,
    root: {
      boundingRegion: rootRegion,
      geometricErrorMeters: rootGeometricError,
      refine: 'REPLACE',
    },
    children: childDescriptors.map(child => ({
      tileId: child.tileId,
      uri: child.uri,
      boundingRegion: child.region,
      geometricErrorMeters: child.geometricError,
      tilesetSha256: child.tilesetSha256,
      evidenceSha256: child.evidenceSha256,
    })),
    privacy: {
      containsRawElevation: false,
      containsAddressData: false,
    },
    nonClaims: [
      'The parent tileset references independently validated child tilesets and does not merge or resample their terrain content.',
      'The parent bounding region is an enclosure for 3D Tiles traversal, not a survey, coverage, cadastral, building, or delivery claim.',
      'This internal evidence does not substitute for external 3D Tiles validator or renderer validation.',
    ],
  };
  const evidenceData = parentEvidencePayload(manifest);
  return {
    tileset: {
      fileName: 'tileset.json',
      mediaType: 'application/json',
      data: tilesetData,
      byteLength: byteLength(tilesetData),
      sha256: tilesetSha256,
      tileset,
    },
    evidence: {
      fileName: 'tileset.evidence.json',
      mediaType: 'application/json',
      data: evidenceData,
      byteLength: byteLength(evidenceData),
      sha256: sha256(evidenceData),
      manifest,
    },
  };
}

export async function verifyNyc3depParent3dTileset(input: {
  generatedAt: string;
  batchReceipt: Nyc3depTileBatchReceipt;
  children: readonly Nyc3depParent3dTilesChild[];
  bundle: Nyc3depParent3dTilesBundle;
}) {
  const expected = await buildNyc3depParent3dTileset(input);
  if (
    input.bundle.tileset.data !== expected.tileset.data
    || input.bundle.tileset.byteLength !== expected.tileset.byteLength
    || input.bundle.tileset.sha256 !== expected.tileset.sha256
    || JSON.stringify(input.bundle.tileset.tileset) !== JSON.stringify(expected.tileset.tileset)
    || input.bundle.evidence.data !== expected.evidence.data
    || input.bundle.evidence.byteLength !== expected.evidence.byteLength
    || input.bundle.evidence.sha256 !== expected.evidence.sha256
    || JSON.stringify(input.bundle.evidence.manifest) !== JSON.stringify(expected.evidence.manifest)
  ) {
    throw new Error('NYC parent 3D Tiles hierarchy integrity check failed.');
  }
  return input.bundle;
}
