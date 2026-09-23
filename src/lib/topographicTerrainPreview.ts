import {
  type TopographicBounds,
  type TopographicMesh,
} from './topographicExport';
import {
  createTopographicEnuFrame,
  geodeticToEnuPoint,
} from './topographicGeodesy';

export const TOPOGRAPHIC_TERRAIN_PREVIEW_SCHEMA =
  'agid.topographic-terrain-preview.v1' as const;

const MAX_PREVIEW_VERTICES = 250_000;
const MAX_PREVIEW_TRIANGLES = 500_000;
const MIN_VERTICAL_EXAGGERATION = 1;
const MAX_VERTICAL_EXAGGERATION = 20;
const TARGET_RELIEF_TO_SPAN_RATIO = 0.12;

export type TopographicTerrainPreviewModel = {
  schema: typeof TOPOGRAPHIC_TERRAIN_PREVIEW_SCHEMA;
  meshId: string;
  sourceId: string;
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  triangleCount: number;
  horizontalSpanMeters: number;
  elevationRangeMeters: {
    minimum: number;
    maximum: number;
  };
  verticalExaggeration: number;
  coordinateFrame: {
    originLongitudeDegrees: number;
    originLatitudeDegrees: number;
    horizontalCrs: 'EPSG:4326 to local WGS84 ENU';
    modelAxes: 'X=east, Y=relative source height, Z=-north';
    verticalTreatment: 'relative-source-height-display-only';
  };
};

function requireBounds(bounds: TopographicBounds) {
  if (
    !Number.isFinite(bounds.south)
    || !Number.isFinite(bounds.west)
    || !Number.isFinite(bounds.north)
    || !Number.isFinite(bounds.east)
    || bounds.south < -90
    || bounds.north > 90
    || bounds.south >= bounds.north
    || bounds.west < -180
    || bounds.west > 180
    || bounds.east < -180
    || bounds.east > 180
  ) {
    throw new Error('terrain-preview-invalid-bounds');
  }
}

function longitudeWithinBounds(
  longitude: number,
  bounds: TopographicBounds,
) {
  const epsilon = 1e-9;
  if (bounds.west <= bounds.east) {
    return longitude >= bounds.west - epsilon
      && longitude <= bounds.east + epsilon;
  }
  return longitude >= bounds.west - epsilon
    || longitude <= bounds.east + epsilon;
}

function centerLongitude(bounds: TopographicBounds) {
  const adjustedEast = bounds.east < bounds.west
    ? bounds.east + 360
    : bounds.east;
  const center = (bounds.west + adjustedEast) / 2;
  return center > 180 ? center - 360 : center;
}

function interpolateColor(
  start: readonly [number, number, number],
  end: readonly [number, number, number],
  ratio: number,
): [number, number, number] {
  return [
    start[0] + (end[0] - start[0]) * ratio,
    start[1] + (end[1] - start[1]) * ratio,
    start[2] + (end[2] - start[2]) * ratio,
  ];
}

function terrainColor(ratio: number): [number, number, number] {
  const low = [0.086, 0.306, 0.388] as const;
  const middle = [0.396, 0.639, 0.051] as const;
  const high = [0.973, 0.98, 0.988] as const;
  if (ratio <= 0.58) {
    return interpolateColor(low, middle, ratio / 0.58);
  }
  return interpolateColor(middle, high, (ratio - 0.58) / 0.42);
}

function requireMeshShape(mesh: TopographicMesh) {
  if (mesh.layerId !== 'terrain-mesh') {
    throw new Error('terrain-preview-requires-terrain-mesh');
  }
  if (
    mesh.vertices.length < 3
    || mesh.vertices.length > MAX_PREVIEW_VERTICES
  ) {
    throw new Error('terrain-preview-vertex-count-out-of-range');
  }
  if (
    mesh.triangles.length < 1
    || mesh.triangles.length > MAX_PREVIEW_TRIANGLES
  ) {
    throw new Error('terrain-preview-triangle-count-out-of-range');
  }
  if (!mesh.id.trim() || !mesh.sourceId.trim()) {
    throw new Error('terrain-preview-missing-mesh-identity');
  }
}

export function buildTopographicTerrainPreviewModel(
  mesh: TopographicMesh,
  bounds: TopographicBounds,
): TopographicTerrainPreviewModel {
  requireBounds(bounds);
  requireMeshShape(mesh);

  const originLongitudeDegrees = centerLongitude(bounds);
  const originLatitudeDegrees = (bounds.south + bounds.north) / 2;
  const frame = createTopographicEnuFrame(
    originLongitudeDegrees,
    originLatitudeDegrees,
    0,
  );
  const horizontalCoordinates: Array<[number, number]> = [];
  let minimumEast = Number.POSITIVE_INFINITY;
  let maximumEast = Number.NEGATIVE_INFINITY;
  let minimumNorth = Number.POSITIVE_INFINITY;
  let maximumNorth = Number.NEGATIVE_INFINITY;
  let minimumElevation = Number.POSITIVE_INFINITY;
  let maximumElevation = Number.NEGATIVE_INFINITY;

  for (const [longitude, latitude, elevation] of mesh.vertices) {
    if (
      !Number.isFinite(longitude)
      || !Number.isFinite(latitude)
      || !Number.isFinite(elevation)
      || latitude < bounds.south - 1e-9
      || latitude > bounds.north + 1e-9
      || !longitudeWithinBounds(longitude, bounds)
    ) {
      throw new Error('terrain-preview-vertex-outside-bounds');
    }
    const [east, north] = geodeticToEnuPoint(
      longitude,
      latitude,
      0,
      frame,
    );
    horizontalCoordinates.push([east, north]);
    minimumEast = Math.min(minimumEast, east);
    maximumEast = Math.max(maximumEast, east);
    minimumNorth = Math.min(minimumNorth, north);
    maximumNorth = Math.max(maximumNorth, north);
    minimumElevation = Math.min(minimumElevation, elevation);
    maximumElevation = Math.max(maximumElevation, elevation);
  }

  const eastCenter = (minimumEast + maximumEast) / 2;
  const northCenter = (minimumNorth + maximumNorth) / 2;
  const elevationCenter = (minimumElevation + maximumElevation) / 2;
  const horizontalSpanMeters = Math.max(
    maximumEast - minimumEast,
    maximumNorth - minimumNorth,
  );
  const elevationRelief = maximumElevation - minimumElevation;
  const verticalExaggeration = elevationRelief > 0 && horizontalSpanMeters > 0
    ? Math.min(
        MAX_VERTICAL_EXAGGERATION,
        Math.max(
          MIN_VERTICAL_EXAGGERATION,
          (horizontalSpanMeters * TARGET_RELIEF_TO_SPAN_RATIO) / elevationRelief,
        ),
      )
    : MIN_VERTICAL_EXAGGERATION;
  const positions = new Float32Array(mesh.vertices.length * 3);
  const colors = new Float32Array(mesh.vertices.length * 3);

  for (let index = 0; index < mesh.vertices.length; index += 1) {
    const [, , elevation] = mesh.vertices[index];
    const [east, north] = horizontalCoordinates[index];
    const offset = index * 3;
    positions[offset] = east - eastCenter;
    positions[offset + 1] =
      (elevation - elevationCenter) * verticalExaggeration;
    positions[offset + 2] = -(north - northCenter);
    const ratio = elevationRelief > 0
      ? (elevation - minimumElevation) / elevationRelief
      : 0.5;
    const color = terrainColor(ratio);
    colors.set(color, offset);
  }

  const indices = new Uint32Array(mesh.triangles.length * 3);
  mesh.triangles.forEach((triangle, triangleIndex) => {
    if (
      triangle.length !== 3
      || triangle.some(vertexIndex => (
        !Number.isInteger(vertexIndex)
        || vertexIndex < 0
        || vertexIndex >= mesh.vertices.length
      ))
      || new Set(triangle).size !== 3
    ) {
      throw new Error('terrain-preview-invalid-triangle');
    }
    indices.set(triangle, triangleIndex * 3);
  });

  return {
    schema: TOPOGRAPHIC_TERRAIN_PREVIEW_SCHEMA,
    meshId: mesh.id,
    sourceId: mesh.sourceId,
    positions,
    colors,
    indices,
    vertexCount: mesh.vertices.length,
    triangleCount: mesh.triangles.length,
    horizontalSpanMeters,
    elevationRangeMeters: {
      minimum: minimumElevation,
      maximum: maximumElevation,
    },
    verticalExaggeration,
    coordinateFrame: {
      originLongitudeDegrees,
      originLatitudeDegrees,
      horizontalCrs: 'EPSG:4326 to local WGS84 ENU',
      modelAxes: 'X=east, Y=relative source height, Z=-north',
      verticalTreatment: 'relative-source-height-display-only',
    },
  };
}
