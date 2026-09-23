import type {
  LocalGeoTiffMeshLodBundle,
} from './topographicLocalGeoTiffWorkflow';
import {
  verifyLocalGeoTiffMeshLodBundle,
} from './topographicLocalGeoTiffWorkflow';
import {
  createTopographicEnuFrame,
  enuToEcefPoint,
  geodeticToEcefPoint,
  geodeticToEnuPoint,
} from './topographicGeodesy';
import {
  buildTopographic3dTilesRefinementContract,
  type Topographic3dTilesRefinementContract,
} from './topographic3dTilesRefinement';

export const TOPOGRAPHIC_3D_TILES_WORKFLOW_VERSION =
  'agid-topographic-3d-tiles-v0.4';
export const TOPOGRAPHIC_3D_TILES_EVIDENCE_SCHEMA =
  'agid-topographic-3d-tiles-evidence-v0.4';
export const TOPOGRAPHIC_3D_TILES_ASSET_VERSION = '1.1';
export const TOPOGRAPHIC_3D_TILES_MAX_PLACEMENT_RESIDUAL_METERS = 0.001;

const textEncoder = new TextEncoder();
const DEGREES_TO_RADIANS = Math.PI / 180;
const SUPPORTED_ELLIPSOIDAL_VERTICAL_DATUMS = new Set([
  'EPSG:4979',
  'WGS 84 ELLIPSOIDAL HEIGHT (EPSG:4979)',
]);
const GLTF_Z_UP_TO_Y_UP_MATRIX = [
  1, 0, 0, 0,
  0, 0, -1, 0,
  0, 1, 0, 0,
  0, 0, 0, 1,
];

export type Topographic3dTilesIssue = {
  code:
    | 'lod-bundle-integrity'
    | 'format-not-gltf'
    | 'vertical-datum-not-epsg4979'
    | 'bounds-invalid'
    | 'lod-order-invalid'
    | 'lod-geometric-error-invalid'
    | 'terrain-range-invalid'
    | 'enu-placement-residual-exceeded';
  message: string;
};

type Topographic3dTilesTile = {
  boundingVolume: {
    region: [number, number, number, number, number, number];
  };
  geometricError: number;
  refine?: 'REPLACE';
  transform?: number[];
  content: {
    uri: string;
  };
  children?: Topographic3dTilesTile[];
};

export type Topographic3dTilesTileset = {
  asset: {
    version: typeof TOPOGRAPHIC_3D_TILES_ASSET_VERSION;
    tilesetVersion: string;
  };
  geometricError: number;
  root: Topographic3dTilesTile;
};

export type Topographic3dTilesEvidence = {
  schemaVersion: typeof TOPOGRAPHIC_3D_TILES_EVIDENCE_SCHEMA;
  workflowVersion: typeof TOPOGRAPHIC_3D_TILES_WORKFLOW_VERSION;
  generatedAt: string;
  source: {
    sourceId: string;
    snapshotSha256: `sha256:${string}`;
    horizontalCrs: string;
    verticalDatum: string;
    lodManifestSha256: `sha256:${string}`;
  };
  placement: {
    sourceCrs: 'EPSG:4979';
    targetCrs: 'EPSG:4978';
    method: 'proj4-epsg4979-to4978-plus-ecef-to-enu-v0.2';
    matrixOrder: 'column-major';
    localAxes: ['east', 'north', 'up'];
    origin: {
      longitudeDegrees: number;
      latitudeDegrees: number;
      ellipsoidalHeightMeters: 0;
      ecefMeters: [number, number, number];
    };
    rootTransform: number[];
    boundingRegion: [number, number, number, number, number, number];
    contentCoordinates: {
      meshAxes: 'x-east-y-north-z-up';
      gltfAxes: 'x-east-y-up-z-south';
      gltfRootNodeMatrix: number[];
      runtimeConversion:
        'ogc-3d-tiles-gltf-y-up-to-z-up-x-plus-90-degrees';
    };
    approximationAudit: Topographic3dTilesPlacementAudit;
  };
  refinement: Topographic3dTilesRefinementContract;
  files: Array<{
    role: 'tileset' | 'content';
    level: number | null;
    fileName: string;
    mediaType: string;
    byteLength: number;
    sha256: `sha256:${string}`;
  }>;
  warnings: string[];
  nonClaims: string[];
};

export type Topographic3dTilesBundle = {
  contents: LocalGeoTiffMeshLodBundle['artifacts'];
  tileset: {
    fileName: 'tileset.json';
    mediaType: 'application/json';
    data: string;
    byteLength: number;
    sha256: `sha256:${string}`;
    tileset: Topographic3dTilesTileset;
  };
  evidence: {
    fileName: 'tileset.evidence.json';
    mediaType: 'application/json';
    data: string;
    byteLength: number;
    sha256: `sha256:${string}`;
    manifest: Topographic3dTilesEvidence;
  };
};

export type Topographic3dTilesBuildResult =
  | {
      status: 'ready';
      issues: [];
      bundle: Topographic3dTilesBundle;
    }
  | {
      status: 'blocked';
      issues: Topographic3dTilesIssue[];
      bundle: null;
    };

export type Topographic3dTilesPlacementAudit = {
  method:
    'serializer-ecef-enu-roundtrip-vs-proj4-epsg4978-corner-extrema-v0.2';
  testedPositionCount: number;
  maximumResidualMeters: number;
  maximumAllowedResidualMeters:
    typeof TOPOGRAPHIC_3D_TILES_MAX_PLACEMENT_RESIDUAL_METERS;
  status: 'passed' | 'failed';
};

function byteLength(data: string | Uint8Array) {
  return typeof data === 'string'
    ? textEncoder.encode(data).byteLength
    : data.byteLength;
}

async function sha256(data: string | Uint8Array) {
  const bytes = typeof data === 'string'
    ? textEncoder.encode(data)
    : Uint8Array.from(data);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes.buffer);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

function auditMetadata(
  lodBundle: LocalGeoTiffMeshLodBundle,
): Topographic3dTilesIssue[] {
  const manifest = lodBundle.manifest.manifest;
  const issues: Topographic3dTilesIssue[] = [];
  if (
    manifest.output.format !== 'gltf'
    || lodBundle.artifacts.some(artifact => (
      artifact.output.format !== 'gltf'
      || artifact.output.mediaType !== 'model/gltf+json'
      || !artifact.output.fileName.endsWith('.gltf')
    ))
  ) {
    issues.push({
      code: 'format-not-gltf',
      message: '3D Tiles 1.1 content requires this workflow to emit glTF artifacts.',
    });
  }
  if (
    !SUPPORTED_ELLIPSOIDAL_VERTICAL_DATUMS.has(
      manifest.source.verticalDatum.trim().toUpperCase(),
    )
  ) {
    issues.push({
      code: 'vertical-datum-not-epsg4979',
      message:
        '3D Tiles region placement requires evidenced EPSG:4979 WGS 84 ellipsoidal heights.',
    });
  }
  const { west, south, east, north } = manifest.bounds;
  if (
    ![west, south, east, north].every(Number.isFinite)
    || west < -180
    || east > 180
    || south < -90
    || north > 90
    || west >= east
    || south >= north
  ) {
    issues.push({
      code: 'bounds-invalid',
      message: '3D Tiles v0.1 requires finite non-antimeridian WGS 84 bounds.',
    });
  }
  const levels = manifest.levels;
  if (
    levels.length === 0
    || levels.some((level, index) => (
      level.level !== index
      || (index > 0 && level.stride <= levels[index - 1].stride)
    ))
  ) {
    issues.push({
      code: 'lod-order-invalid',
      message: '3D Tiles hierarchy requires contiguous fine-to-coarse LOD levels.',
    });
  }
  try {
    buildTopographic3dTilesRefinementContract(manifest);
  } catch (error) {
    issues.push({
      code: 'lod-geometric-error-invalid',
      message: error instanceof Error
        ? error.message
        : '3D Tiles LOD geometric-error evidence is invalid.',
    });
  }
  const { minimumElevationMeters, maximumElevationMeters } = manifest.terrain;
  if (
    !Number.isFinite(minimumElevationMeters)
    || !Number.isFinite(maximumElevationMeters)
    || minimumElevationMeters > maximumElevationMeters
  ) {
    issues.push({
      code: 'terrain-range-invalid',
      message: '3D Tiles bounding region requires a finite ordered elevation range.',
    });
  }
  return issues;
}

export function createEnuToEcefTransform(
  longitudeDegrees: number,
  latitudeDegrees: number,
) {
  if (
    !Number.isFinite(longitudeDegrees)
    || longitudeDegrees < -180
    || longitudeDegrees > 180
    || !Number.isFinite(latitudeDegrees)
    || latitudeDegrees < -90
    || latitudeDegrees > 90
  ) {
    throw new Error('ENU origin must be a finite WGS 84 longitude and latitude.');
  }
  const frame = createTopographicEnuFrame(
    longitudeDegrees,
    latitudeDegrees,
  );
  return {
    origin: frame.origin.ecefMeters,
    transform: frame.enuToEcefTransform,
  };
}

export function auditTopographic3dTilesPlacement(
  lodBundle: LocalGeoTiffMeshLodBundle,
): Topographic3dTilesPlacementAudit {
  const manifest = lodBundle.manifest.manifest;
  const { west, south, east, north } = manifest.bounds;
  const frame = createTopographicEnuFrame(west, south);
  const heights = Array.from(new Set([
    manifest.terrain.minimumElevationMeters,
    manifest.terrain.maximumElevationMeters,
  ]));
  let maximumResidualMeters = 0;
  let testedPositionCount = 0;

  for (const longitudeDegrees of [west, east]) {
    for (const latitudeDegrees of [south, north]) {
      for (const ellipsoidalHeightMeters of heights) {
        const localPoint = geodeticToEnuPoint(
          longitudeDegrees,
          latitudeDegrees,
          ellipsoidalHeightMeters,
          frame,
        );
        const roundTripEcef = enuToEcefPoint(localPoint, frame);
        const exactEcef = geodeticToEcefPoint(
          longitudeDegrees,
          latitudeDegrees,
          ellipsoidalHeightMeters,
        );
        maximumResidualMeters = Math.max(
          maximumResidualMeters,
          Math.hypot(
            roundTripEcef[0] - exactEcef[0],
            roundTripEcef[1] - exactEcef[1],
            roundTripEcef[2] - exactEcef[2],
          ),
        );
        testedPositionCount += 1;
      }
    }
  }

  const roundedMaximumResidualMeters =
    Math.round(maximumResidualMeters * 1_000_000_000) / 1_000_000_000;
  return {
    method:
      'serializer-ecef-enu-roundtrip-vs-proj4-epsg4978-corner-extrema-v0.2',
    testedPositionCount,
    maximumResidualMeters: roundedMaximumResidualMeters,
    maximumAllowedResidualMeters:
      TOPOGRAPHIC_3D_TILES_MAX_PLACEMENT_RESIDUAL_METERS,
    status: roundedMaximumResidualMeters
      <= TOPOGRAPHIC_3D_TILES_MAX_PLACEMENT_RESIDUAL_METERS
      ? 'passed'
      : 'failed',
  };
}

function createTileset(
  lodBundle: LocalGeoTiffMeshLodBundle,
  rootTransform: number[],
  refinement: Topographic3dTilesRefinementContract,
): Topographic3dTilesTileset {
  const manifest = lodBundle.manifest.manifest;
  const {
    minimumElevationMeters,
    maximumElevationMeters,
  } = manifest.terrain;
  const region: [number, number, number, number, number, number] = [
    manifest.bounds.west * DEGREES_TO_RADIANS,
    manifest.bounds.south * DEGREES_TO_RADIANS,
    manifest.bounds.east * DEGREES_TO_RADIANS,
    manifest.bounds.north * DEGREES_TO_RADIANS,
    minimumElevationMeters,
    maximumElevationMeters,
  ];
  let tile: Topographic3dTilesTile | null = null;
  for (const level of manifest.levels) {
    const levelRefinement = refinement.levels[level.level];
    if (!levelRefinement || levelRefinement.stride !== level.stride) {
      throw new Error(`3D Tiles LOD${level.level} refinement evidence is missing.`);
    }
    const next: Topographic3dTilesTile = {
      boundingVolume: { region: [...region] },
      geometricError: levelRefinement.geometricErrorMeters,
      content: { uri: level.fileName },
      ...(tile ? { children: [tile] } : {}),
    };
    tile = next;
  }
  if (!tile) throw new Error('3D Tiles hierarchy requires at least one LOD.');
  tile.transform = [...rootTransform];
  tile.refine = 'REPLACE';
  return {
    asset: {
      version: TOPOGRAPHIC_3D_TILES_ASSET_VERSION,
      tilesetVersion: lodBundle.manifest.sha256,
    },
    geometricError: refinement.tilesetGeometricErrorMeters,
    root: tile,
  };
}

function flattenTileUris(root: Topographic3dTilesTile) {
  const uris: string[] = [];
  let tile: Topographic3dTilesTile | undefined = root;
  while (tile) {
    uris.push(tile.content.uri);
    if (tile.children && tile.children.length !== 1) {
      throw new Error('3D Tiles v0.1 hierarchy must have exactly one child per level.');
    }
    tile = tile.children?.[0];
  }
  return uris;
}

function flattenTiles(root: Topographic3dTilesTile) {
  const tiles: Topographic3dTilesTile[] = [];
  let tile: Topographic3dTilesTile | undefined = root;
  while (tile) {
    tiles.push(tile);
    tile = tile.children?.[0];
  }
  return tiles;
}

export async function verifyTopographic3dTilesBundle(
  bundle: Topographic3dTilesBundle,
  lodBundle: LocalGeoTiffMeshLodBundle,
) {
  await verifyLocalGeoTiffMeshLodBundle(lodBundle);
  const tilesetData = `${JSON.stringify(bundle.tileset.tileset, null, 2)}\n`;
  if (
    bundle.tileset.data !== tilesetData
    || bundle.tileset.byteLength !== byteLength(tilesetData)
    || bundle.tileset.sha256 !== await sha256(tilesetData)
  ) {
    throw new Error('3D Tiles tileset integrity check failed.');
  }
  const evidenceData = `${JSON.stringify(bundle.evidence.manifest, null, 2)}\n`;
  if (
    bundle.evidence.data !== evidenceData
    || bundle.evidence.byteLength !== byteLength(evidenceData)
    || bundle.evidence.sha256 !== await sha256(evidenceData)
  ) {
    throw new Error('3D Tiles evidence integrity check failed.');
  }
  const expectedUris = [...lodBundle.artifacts]
    .reverse()
    .map(artifact => artifact.output.fileName);
  const actualUris = flattenTileUris(bundle.tileset.tileset.root);
  if (
    actualUris.length !== expectedUris.length
    || actualUris.some((uri, index) => uri !== expectedUris[index])
  ) {
    throw new Error('3D Tiles hierarchy does not bind every audited LOD artifact.');
  }
  const expectedRefinement =
    buildTopographic3dTilesRefinementContract(
      lodBundle.manifest.manifest,
    );
  if (
    JSON.stringify(bundle.evidence.manifest.refinement)
      !== JSON.stringify(expectedRefinement)
  ) {
    throw new Error('3D Tiles refinement evidence binding failed.');
  }
  const actualTiles = flattenTiles(bundle.tileset.tileset.root);
  const expectedErrors = [...expectedRefinement.levels]
    .reverse()
    .map(level => level.geometricErrorMeters);
  if (
    bundle.tileset.tileset.geometricError
      !== expectedRefinement.tilesetGeometricErrorMeters
    || actualTiles.length !== expectedErrors.length
    || actualTiles.some((tile, index) => (
      tile.geometricError !== expectedErrors[index]
      || !Number.isFinite(tile.geometricError)
      || tile.geometricError < 0
      || (
        index > 0
        && tile.geometricError > actualTiles[index - 1].geometricError
      )
    ))
    || actualTiles.at(-1)?.geometricError !== 0
  ) {
    throw new Error('3D Tiles geometric-error hierarchy binding failed.');
  }
  if (
    bundle.contents.length !== lodBundle.artifacts.length
    || bundle.contents.some((content, index) => (
      content.sha256 !== lodBundle.artifacts[index].sha256
    ))
  ) {
    throw new Error('3D Tiles content digest binding failed.');
  }
  for (const content of bundle.contents) {
    const gltf = JSON.parse(String(content.output.data)) as {
      asset?: { extras?: Record<string, unknown> };
      nodes?: Array<{ matrix?: number[] }>;
    };
    if (
      JSON.stringify(gltf.nodes?.[0]?.matrix)
        !== JSON.stringify(GLTF_Z_UP_TO_Y_UP_MATRIX)
      || gltf.asset?.extras?.localFrame !== 'WGS84-ECEF-to-ENU'
      || gltf.asset?.extras?.verticalMode !== 'ellipsoidal-height'
    ) {
      throw new Error('3D Tiles glTF coordinate-frame contract failed.');
    }
  }
  const coordinateEvidence =
    bundle.evidence.manifest.placement.contentCoordinates;
  if (
    coordinateEvidence.meshAxes !== 'x-east-y-north-z-up'
    || coordinateEvidence.gltfAxes !== 'x-east-y-up-z-south'
    || JSON.stringify(coordinateEvidence.gltfRootNodeMatrix)
      !== JSON.stringify(GLTF_Z_UP_TO_Y_UP_MATRIX)
    || coordinateEvidence.runtimeConversion
      !== 'ogc-3d-tiles-gltf-y-up-to-z-up-x-plus-90-degrees'
  ) {
    throw new Error('3D Tiles coordinate-frame evidence binding failed.');
  }
  const expectedPlacementAudit =
    auditTopographic3dTilesPlacement(lodBundle);
  if (
    JSON.stringify(bundle.evidence.manifest.placement.approximationAudit)
    !== JSON.stringify(expectedPlacementAudit)
  ) {
    throw new Error('3D Tiles placement audit binding failed.');
  }
}

export async function buildTopographic3dTilesBundle(
  lodBundle: LocalGeoTiffMeshLodBundle,
): Promise<Topographic3dTilesBuildResult> {
  const issues = auditMetadata(lodBundle);
  try {
    await verifyLocalGeoTiffMeshLodBundle(lodBundle);
  } catch (error) {
    issues.push({
      code: 'lod-bundle-integrity',
      message: error instanceof Error
        ? error.message
        : 'Mesh LOD bundle integrity check failed.',
    });
  }
  if (issues.length > 0) {
    return { status: 'blocked', issues, bundle: null };
  }

  const manifest = lodBundle.manifest.manifest;
  const approximationAudit = auditTopographic3dTilesPlacement(lodBundle);
  if (approximationAudit.status === 'failed') {
    return {
      status: 'blocked',
      issues: [{
        code: 'enu-placement-residual-exceeded',
        message:
          `3D Tiles local-frame residual ${approximationAudit.maximumResidualMeters.toFixed(6)} m exceeds the ${approximationAudit.maximumAllowedResidualMeters} m limit.`,
      }],
      bundle: null,
    };
  }
  const { origin, transform } = createEnuToEcefTransform(
    manifest.bounds.west,
    manifest.bounds.south,
  );
  const refinement =
    buildTopographic3dTilesRefinementContract(manifest);
  const tileset = createTileset(lodBundle, transform, refinement);
  const tilesetData = `${JSON.stringify(tileset, null, 2)}\n`;
  const tilesetSha256 = await sha256(tilesetData);
  const evidenceManifest: Topographic3dTilesEvidence = {
    schemaVersion: TOPOGRAPHIC_3D_TILES_EVIDENCE_SCHEMA,
    workflowVersion: TOPOGRAPHIC_3D_TILES_WORKFLOW_VERSION,
    generatedAt: manifest.generatedAt,
    source: {
      sourceId: manifest.source.sourceId,
      snapshotSha256: manifest.source.snapshotSha256,
      horizontalCrs: manifest.source.horizontalCrs,
      verticalDatum: manifest.source.verticalDatum,
      lodManifestSha256: lodBundle.manifest.sha256,
    },
    placement: {
      sourceCrs: 'EPSG:4979',
      targetCrs: 'EPSG:4978',
      method: 'proj4-epsg4979-to4978-plus-ecef-to-enu-v0.2',
      matrixOrder: 'column-major',
      localAxes: ['east', 'north', 'up'],
      origin: {
        longitudeDegrees: manifest.bounds.west,
        latitudeDegrees: manifest.bounds.south,
        ellipsoidalHeightMeters: 0,
        ecefMeters: origin,
      },
      rootTransform: [...transform],
      boundingRegion: [
        manifest.bounds.west * DEGREES_TO_RADIANS,
        manifest.bounds.south * DEGREES_TO_RADIANS,
        manifest.bounds.east * DEGREES_TO_RADIANS,
        manifest.bounds.north * DEGREES_TO_RADIANS,
        manifest.terrain.minimumElevationMeters,
        manifest.terrain.maximumElevationMeters,
      ],
      contentCoordinates: {
        meshAxes: 'x-east-y-north-z-up',
        gltfAxes: 'x-east-y-up-z-south',
        gltfRootNodeMatrix: [...GLTF_Z_UP_TO_Y_UP_MATRIX],
        runtimeConversion:
          'ogc-3d-tiles-gltf-y-up-to-z-up-x-plus-90-degrees',
      },
      approximationAudit,
    },
    refinement,
    files: [
      {
        role: 'tileset',
        level: null,
        fileName: 'tileset.json',
        mediaType: 'application/json',
        byteLength: byteLength(tilesetData),
        sha256: tilesetSha256,
      },
      ...lodBundle.artifacts.map(artifact => ({
        role: 'content' as const,
        level: artifact.level,
        fileName: artifact.output.fileName,
        mediaType: artifact.output.mediaType,
        byteLength: artifact.output.byteLength,
        sha256: artifact.sha256,
      })),
    ],
    warnings: [
      'All glTF content files must remain beside tileset.json using their manifest file names.',
      'Root placement uses the southwest grid corner at zero ellipsoidal height as the ENU origin.',
      `The ECEF/ENU round-trip passed a ${approximationAudit.maximumAllowedResidualMeters} m EPSG:4978 corner/extrema residual gate.`,
      'The SSE reference uses a fixed perspective profile; runtime viewers may apply different camera and device parameters.',
    ],
    nonClaims: [
      'Internal structure and digest checks are not an external 3D Tiles validator conformance result.',
      'The measured geometric error is not a continuous bidirectional Hausdorff-distance proof.',
      'The SSE reference is not evidence that a production renderer selected or displayed a particular LOD.',
      'The corner/extrema round-trip audit verifies transform consistency, not survey accuracy.',
      'The local ENU serializer does not prove deliverability or an address.',
    ],
  };
  const evidenceData = `${JSON.stringify(evidenceManifest, null, 2)}\n`;
  const bundle: Topographic3dTilesBundle = {
    contents: lodBundle.artifacts,
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
      sha256: await sha256(evidenceData),
      manifest: evidenceManifest,
    },
  };
  await verifyTopographic3dTilesBundle(bundle, lodBundle);
  return { status: 'ready', issues: [], bundle };
}
