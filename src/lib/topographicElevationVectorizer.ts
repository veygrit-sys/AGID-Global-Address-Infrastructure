import { featureCollection, isolines, point } from '@turf/turf';
import proj4 from 'proj4';

import {
  buildTopographicExportPlan,
  longitudeSpanDegrees,
  type TopographicBounds,
  type TopographicDataset,
  type TopographicExportPlan,
  type TopographicFeature,
  type TopographicLayerId,
  type TopographicMesh,
  type TopographicSourceRecord,
} from './topographicExport';

export const TOPOGRAPHIC_ELEVATION_VECTORIZER_VERSION =
  'agid-topographic-elevation-vectorizer-v0.7';
export const MAX_ELEVATION_GRID_CELLS = 1_000_000;
export const MAX_CONTOUR_LEVELS = 512;
export const MAX_CONTOUR_FEATURES = 100_000;
export const MAX_CONTOUR_BOUNDARY_CONTACTS = 16_384;
export const CONTOUR_COORDINATE_PRECISION_DECIMALS = 9;
export const MAX_MESH_LOD_LEVELS = 8;
export const MAX_MESH_LOD_STRIDE = 64;
export const MAX_MESH_VERTICAL_ERROR_METERS = 10_000;
export const MESH_ERROR_PRECISION_DECIMALS = 6;

export type NormalizedElevationGrid = {
  gridId: string;
  title: string;
  bounds: TopographicBounds;
  width: number;
  height: number;
  elevationsMeters: readonly number[] | Float32Array | Float64Array;
  rowOrder: 'north-to-south' | 'south-to-north';
  horizontalCrs: 'EPSG:4326';
  /**
   * Most normalized grids are rectilinear in WGS84. Projected grids such as
   * UTM are curvilinear after inverse projection and therefore retain every
   * node coordinate rather than silently approximating them with two axes.
   */
  coordinateModel?: 'rectilinear-axes' | 'per-grid-node';
  longitudeDegreesByColumn?: readonly number[];
  latitudeDegreesByRow?: readonly number[];
  longitudeLatitudeDegreesByCell?: readonly (readonly [number, number])[];
  curvilinearSourceGrid?: {
    sourceCrs: string;
    sourceCenterExtent: {
      minimumX: number;
      minimumY: number;
      maximumX: number;
      maximumY: number;
    };
    library: 'proj4js';
    interpolation: 'source-affine-linear-inverse-projection';
  };
  verticalDatum: string;
  sourceRecord: TopographicSourceRecord;
  generatedAt: string;
  countryCode?: string;
};

export type ElevationVectorizationOptions = {
  contourIntervalMeters: number;
  includeTerrainMesh?: boolean;
  includeContours?: boolean;
  meshLodStrides?: readonly number[];
  meshMaxVerticalErrorMeters?: number;
};

export type ElevationVectorizationMetrics = {
  gridCellCount: number;
  vertexCount: number;
  triangleCount: number;
  meshLodCount: number;
  contourLevelCount: number;
  contourFeatureCount: number;
  contourVertexCount: number;
  contourSegmentCount: number;
  contourBoundaryEndpointCount: number;
  contourBoundaryContactCount: number;
  minimumElevationMeters: number;
  maximumElevationMeters: number;
};

export type ContourBoundaryEdge = 'west' | 'south' | 'east' | 'north';

export type ContourBoundaryContact = {
  elevationMeters: number;
  edge: ContourBoundaryEdge;
  longitude: number;
  latitude: number;
  normalizedOffset: number;
  matchKey: string;
};

export type ContourTopologyAudit = {
  algorithm: 'turf-isolines-v7-marching-squares';
  coordinatePrecisionDecimals: number;
  axisRemappingApplied: boolean;
  coordinateRemapping:
    | 'none'
    | 'rectilinear-axes'
    | 'source-affine-inverse-projection';
  lineFeatureCount: number;
  closedLineCount: number;
  openLineCount: number;
  vertexCount: number;
  segmentCount: number;
  boundaryEndpointCount: number;
  boundaryContactCount: number;
  boundaryContacts: ContourBoundaryContact[];
  removedConsecutiveDuplicateVertexCount: number;
  duplicateSegmentCount: number;
  interiorEndpointCount: number;
};

export type ElevationMeshLod = {
  level: number;
  stride: number;
  mesh: TopographicMesh;
  vertexCount: number;
  triangleCount: number;
};

export type MeshLodErrorLevel = {
  level: number;
  stride: number;
  sourceSampleCount: number;
  maximumAbsoluteVerticalErrorMeters: number;
  meanAbsoluteVerticalErrorMeters: number;
  rootMeanSquareVerticalErrorMeters: number;
  maximumAllowedVerticalErrorMeters: number;
  passed: boolean;
};

export type MeshLodQualityAudit = {
  algorithm: 'regular-grid-tin-all-node-vertical-residual-v0.1';
  sampleBasis: 'all-normalized-grid-points';
  verticalUnits: 'metres';
  coordinateBasis:
    | 'adapter-provided-epsg4326-axes'
    | 'adapter-provided-epsg4326-grid-nodes';
  precisionDecimals: number;
  maximumAllowedVerticalErrorMeters: number | null;
  maximumObservedVerticalErrorMeters: number;
  levels: MeshLodErrorLevel[];
  passed: boolean;
};

export type ElevationVectorizationResult = {
  vectorizerVersion: string;
  dataset: TopographicDataset;
  meshLods: ElevationMeshLod[];
  meshLodQuality: MeshLodQualityAudit;
  sourceGate: TopographicExportPlan;
  metrics: ElevationVectorizationMetrics;
  contourTopology: ContourTopologyAudit;
  warnings: string[];
};

function requireIsoTimestamp(field: string, value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
}

function validateGrid(
  grid: NormalizedElevationGrid,
  options: ElevationVectorizationOptions,
) {
  if (!grid.gridId.trim()) throw new Error('gridId is required.');
  if (!grid.title.trim()) throw new Error('title is required.');
  if (!grid.verticalDatum.trim()) throw new Error('verticalDatum is required.');
  if (!Number.isInteger(grid.width) || !Number.isInteger(grid.height)) {
    throw new Error('Elevation grid width and height must be integers.');
  }
  if (grid.width < 2 || grid.height < 2) {
    throw new Error('Elevation grid must be at least 2x2.');
  }
  const gridCellCount = grid.width * grid.height;
  if (gridCellCount > MAX_ELEVATION_GRID_CELLS) {
    throw new Error(`Elevation grid exceeds ${MAX_ELEVATION_GRID_CELLS} cells.`);
  }
  if (grid.elevationsMeters.length !== gridCellCount) {
    throw new Error(
      `Elevation grid requires ${gridCellCount} values; received ${grid.elevationsMeters.length}.`,
    );
  }
  for (let index = 0; index < grid.elevationsMeters.length; index += 1) {
    if (!Number.isFinite(grid.elevationsMeters[index])) {
      throw new Error(
        `Normalized elevation grid contains a non-finite value at index ${index}.`,
      );
    }
  }
  if (longitudeSpanDegrees(grid.bounds) <= 0 || longitudeSpanDegrees(grid.bounds) > 180) {
    throw new Error('Elevation grid bounds must span between 0 and 180 longitude degrees.');
  }
  if (grid.bounds.east < grid.bounds.west) {
    throw new Error(
      'Antimeridian elevation vectorization requires the projected-grid adapter planned for the next loop.',
    );
  }
  if (grid.horizontalCrs !== 'EPSG:4326') {
    throw new Error('The v0.1 elevation vectorizer requires EPSG:4326 input.');
  }
  const usesPerGridNodeCoordinates = grid.coordinateModel === 'per-grid-node';
  if (
    grid.coordinateModel !== undefined
    && grid.coordinateModel !== 'rectilinear-axes'
    && grid.coordinateModel !== 'per-grid-node'
  ) {
    throw new Error('Elevation grid coordinateModel is unsupported.');
  }
  if (
    usesPerGridNodeCoordinates
    && grid.longitudeLatitudeDegreesByCell === undefined
  ) {
    throw new Error('per-grid-node coordinateModel requires longitudeLatitudeDegreesByCell.');
  }
  if (usesPerGridNodeCoordinates && grid.curvilinearSourceGrid === undefined) {
    throw new Error('per-grid-node coordinateModel requires curvilinearSourceGrid evidence.');
  }
  if (
    !usesPerGridNodeCoordinates
    && grid.longitudeLatitudeDegreesByCell !== undefined
  ) {
    throw new Error('longitudeLatitudeDegreesByCell requires coordinateModel per-grid-node.');
  }
  if (
    usesPerGridNodeCoordinates
    && (
      grid.longitudeDegreesByColumn !== undefined
      || grid.latitudeDegreesByRow !== undefined
    )
  ) {
    throw new Error('per-grid-node coordinates cannot be combined with rectilinear axes.');
  }
  if (!usesPerGridNodeCoordinates && grid.curvilinearSourceGrid !== undefined) {
    throw new Error('curvilinearSourceGrid requires coordinateModel per-grid-node.');
  }
  if (grid.curvilinearSourceGrid !== undefined) {
    const { sourceCenterExtent } = grid.curvilinearSourceGrid;
    if (
      grid.curvilinearSourceGrid.library !== 'proj4js'
      || grid.curvilinearSourceGrid.interpolation
        !== 'source-affine-linear-inverse-projection'
      || !utmProjectionDefinition(grid.curvilinearSourceGrid.sourceCrs)
      || !Number.isFinite(sourceCenterExtent.minimumX)
      || !Number.isFinite(sourceCenterExtent.minimumY)
      || !Number.isFinite(sourceCenterExtent.maximumX)
      || !Number.isFinite(sourceCenterExtent.maximumY)
      || sourceCenterExtent.minimumX >= sourceCenterExtent.maximumX
      || sourceCenterExtent.minimumY >= sourceCenterExtent.maximumY
    ) {
      throw new Error('curvilinearSourceGrid must be an increasing supported UTM affine source frame.');
    }
  }
  if (grid.longitudeLatitudeDegreesByCell !== undefined) {
    if (grid.longitudeLatitudeDegreesByCell.length !== gridCellCount) {
      throw new Error('longitudeLatitudeDegreesByCell length must match grid cell count.');
    }
    for (let index = 0; index < grid.longitudeLatitudeDegreesByCell.length; index += 1) {
      const coordinate = grid.longitudeLatitudeDegreesByCell[index];
      const [longitude, latitude] = coordinate ?? [];
      if (
        !Number.isFinite(longitude)
        || !Number.isFinite(latitude)
        || longitude < -180
        || longitude > 180
        || latitude < -90
        || latitude > 90
      ) {
        throw new Error(`Invalid longitudeLatitudeDegreesByCell value at index ${index}.`);
      }
      if (
        longitude < grid.bounds.west
        || longitude > grid.bounds.east
        || latitude < grid.bounds.south
        || latitude > grid.bounds.north
      ) {
        throw new Error(`Grid-node coordinate at index ${index} is outside grid bounds.`);
      }
    }
  }
  if (grid.longitudeDegreesByColumn !== undefined) {
    if (grid.longitudeDegreesByColumn.length !== grid.width) {
      throw new Error('longitudeDegreesByColumn length must match grid width.');
    }
    for (let index = 0; index < grid.longitudeDegreesByColumn.length; index += 1) {
      const longitude = grid.longitudeDegreesByColumn[index];
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error(`Invalid longitudeDegreesByColumn value at index ${index}.`);
      }
      if (index > 0 && longitude <= grid.longitudeDegreesByColumn[index - 1]) {
        throw new Error('longitudeDegreesByColumn must be strictly increasing.');
      }
    }
  }
  if (grid.latitudeDegreesByRow !== undefined) {
    if (grid.latitudeDegreesByRow.length !== grid.height) {
      throw new Error('latitudeDegreesByRow length must match grid height.');
    }
    for (let index = 0; index < grid.latitudeDegreesByRow.length; index += 1) {
      const latitude = grid.latitudeDegreesByRow[index];
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new Error(`Invalid latitudeDegreesByRow value at index ${index}.`);
      }
      if (index > 0) {
        const previous = grid.latitudeDegreesByRow[index - 1];
        const ordered = grid.rowOrder === 'north-to-south'
          ? latitude < previous
          : latitude > previous;
        if (!ordered) {
          throw new Error(
            `latitudeDegreesByRow must follow ${grid.rowOrder} row order.`,
          );
        }
      }
    }
  }
  requireIsoTimestamp('generatedAt', grid.generatedAt);

  const includeTerrainMesh = options.includeTerrainMesh ?? true;
  const includeContours = options.includeContours ?? true;
  if (!includeTerrainMesh && !includeContours) {
    throw new Error('At least one of terrain mesh or contours must be requested.');
  }
  if (!includeTerrainMesh && options.meshLodStrides !== undefined) {
    throw new Error('meshLodStrides requires terrain mesh output.');
  }
  if (!includeTerrainMesh && options.meshMaxVerticalErrorMeters !== undefined) {
    throw new Error('meshMaxVerticalErrorMeters requires terrain mesh output.');
  }
  if (includeTerrainMesh && options.meshLodStrides !== undefined) {
    if (
      options.meshLodStrides.length === 0 ||
      options.meshLodStrides.length > MAX_MESH_LOD_LEVELS
    ) {
      throw new Error(
        `meshLodStrides must contain between 1 and ${MAX_MESH_LOD_LEVELS} levels.`,
      );
    }
    if (options.meshLodStrides[0] !== 1) {
      throw new Error('meshLodStrides must start with stride 1 for LOD0.');
    }
    for (let index = 0; index < options.meshLodStrides.length; index += 1) {
      const stride = options.meshLodStrides[index];
      if (
        !Number.isInteger(stride) ||
        stride < 1 ||
        stride > MAX_MESH_LOD_STRIDE
      ) {
        throw new Error(
          `Each mesh LOD stride must be an integer between 1 and ${MAX_MESH_LOD_STRIDE}.`,
        );
      }
      if (index > 0 && stride <= options.meshLodStrides[index - 1]) {
        throw new Error('meshLodStrides must be strictly increasing.');
      }
    }
  }
  const meshLodCount = options.meshLodStrides?.length ?? 1;
  if (
    includeTerrainMesh
    && meshLodCount > 1
    && options.meshMaxVerticalErrorMeters === undefined
  ) {
    throw new Error(
      'Multiple terrain mesh LODs require meshMaxVerticalErrorMeters.',
    );
  }
  if (
    includeTerrainMesh
    && options.meshMaxVerticalErrorMeters !== undefined
    && (
      !Number.isFinite(options.meshMaxVerticalErrorMeters)
      || options.meshMaxVerticalErrorMeters <= 0
      || options.meshMaxVerticalErrorMeters > MAX_MESH_VERTICAL_ERROR_METERS
    )
  ) {
    throw new Error(
      `meshMaxVerticalErrorMeters must be greater than 0 and at most ${MAX_MESH_VERTICAL_ERROR_METERS}.`,
    );
  }
  if (
    includeContours &&
    (!Number.isFinite(options.contourIntervalMeters) ||
      options.contourIntervalMeters < 0.25 ||
      options.contourIntervalMeters > 100)
  ) {
    throw new Error('Contour interval must be between 0.25 and 100 metres.');
  }
}

function longitudeAt(grid: NormalizedElevationGrid, column: number) {
  return grid.longitudeDegreesByColumn?.[column]
    ?? grid.bounds.west
      + (grid.bounds.east - grid.bounds.west) * (column / (grid.width - 1));
}

function latitudeAt(
  grid: NormalizedElevationGrid,
  row: number,
) {
  if (grid.latitudeDegreesByRow) return grid.latitudeDegreesByRow[row];
  const ratio = row / (grid.height - 1);
  return grid.rowOrder === 'north-to-south'
    ? grid.bounds.north - (grid.bounds.north - grid.bounds.south) * ratio
    : grid.bounds.south + (grid.bounds.north - grid.bounds.south) * ratio;
}

function coordinateAt(
  grid: NormalizedElevationGrid,
  row: number,
  column: number,
) {
  return grid.longitudeLatitudeDegreesByCell?.[row * grid.width + column]
    ?? [longitudeAt(grid, column), latitudeAt(grid, row)] as const;
}

function sampleIndices(length: number, stride: number) {
  const indices: number[] = [];
  for (let index = 0; index < length; index += stride) {
    indices.push(index);
  }
  if (indices.at(-1) !== length - 1) {
    indices.push(length - 1);
  }
  return indices;
}

function createTerrainMesh(
  grid: NormalizedElevationGrid,
  stride: number,
  level: number,
): TopographicMesh {
  const rowIndices = sampleIndices(grid.height, stride);
  const columnIndices = sampleIndices(grid.width, stride);
  const vertices: Array<[number, number, number]> = [];
  for (const row of rowIndices) {
    for (const column of columnIndices) {
      const index = row * grid.width + column;
      const coordinate = coordinateAt(grid, row, column);
      vertices.push([
        coordinate[0],
        coordinate[1],
        grid.elevationsMeters[index],
      ]);
    }
  }

  const triangles: Array<[number, number, number]> = [];
  for (let row = 0; row < rowIndices.length - 1; row += 1) {
    for (let column = 0; column < columnIndices.length - 1; column += 1) {
      const topLeft = row * columnIndices.length + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + columnIndices.length;
      const bottomRight = bottomLeft + 1;
      if ((row + column) % 2 === 0) {
        triangles.push(
          [topLeft, bottomLeft, topRight],
          [topRight, bottomLeft, bottomRight],
        );
      } else {
        triangles.push(
          [topLeft, bottomLeft, bottomRight],
          [topLeft, bottomRight, topRight],
        );
      }
    }
  }

  return {
    id:
      level === 0
        ? `${grid.gridId}-terrain-mesh`
        : `${grid.gridId}-terrain-mesh-lod${level}-s${stride}`,
    layerId: 'terrain-mesh',
    vertices,
    triangles,
    sourceId: grid.sourceRecord.sourceId,
  };
}

function createTerrainMeshLods(
  grid: NormalizedElevationGrid,
  strides: readonly number[],
): ElevationMeshLod[] {
  return strides.map((stride, level) => {
    const mesh = createTerrainMesh(grid, stride, level);
    return {
      level,
      stride,
      mesh,
      vertexCount: mesh.vertices.length,
      triangleCount: mesh.triangles.length,
    };
  });
}

function roundMeshError(value: number) {
  return Number(value.toFixed(MESH_ERROR_PRECISION_DECIMALS));
}

function segmentIndexBySample(
  length: number,
  sampledIndices: readonly number[],
) {
  const segments = new Uint32Array(length);
  let segment = 0;
  for (let index = 0; index < length; index += 1) {
    while (
      segment < sampledIndices.length - 2
      && index > sampledIndices[segment + 1]
    ) {
      segment += 1;
    }
    segments[index] = segment;
  }
  return segments;
}

function interpolationRatio(value: number, start: number, end: number) {
  const span = end - start;
  if (!Number.isFinite(span) || span === 0) {
    throw new Error('Terrain mesh LOD contains a degenerate coordinate axis.');
  }
  const ratio = (value - start) / span;
  if (!Number.isFinite(ratio) || ratio < -1e-12 || ratio > 1 + 1e-12) {
    throw new Error('Terrain mesh LOD interpolation escaped its source cell.');
  }
  return Math.min(1, Math.max(0, ratio));
}

function interpolateGridTinElevation(
  grid: NormalizedElevationGrid,
  sampledRows: readonly number[],
  sampledColumns: readonly number[],
  rowSegment: number,
  columnSegment: number,
  row: number,
  column: number,
) {
  const topRow = sampledRows[rowSegment];
  const bottomRow = sampledRows[rowSegment + 1];
  const leftColumn = sampledColumns[columnSegment];
  const rightColumn = sampledColumns[columnSegment + 1];
  const horizontalRatio = interpolationRatio(
    longitudeAt(grid, column),
    longitudeAt(grid, leftColumn),
    longitudeAt(grid, rightColumn),
  );
  const verticalRatio = interpolationRatio(
    latitudeAt(grid, row),
    latitudeAt(grid, topRow),
    latitudeAt(grid, bottomRow),
  );
  const topLeft = grid.elevationsMeters[topRow * grid.width + leftColumn];
  const topRight = grid.elevationsMeters[topRow * grid.width + rightColumn];
  const bottomLeft =
    grid.elevationsMeters[bottomRow * grid.width + leftColumn];
  const bottomRight =
    grid.elevationsMeters[bottomRow * grid.width + rightColumn];

  if ((rowSegment + columnSegment) % 2 === 0) {
    if (horizontalRatio + verticalRatio <= 1) {
      return topLeft
        + (topRight - topLeft) * horizontalRatio
        + (bottomLeft - topLeft) * verticalRatio;
    }
    return bottomRight
      + (topRight - bottomRight) * (1 - verticalRatio)
      + (bottomLeft - bottomRight) * (1 - horizontalRatio);
  }
  if (verticalRatio >= horizontalRatio) {
    return topLeft * (1 - verticalRatio)
      + bottomLeft * (verticalRatio - horizontalRatio)
      + bottomRight * horizontalRatio;
  }
  return topLeft * (1 - horizontalRatio)
    + topRight * (horizontalRatio - verticalRatio)
    + bottomRight * verticalRatio;
}

function auditTerrainMeshLods(
  grid: NormalizedElevationGrid,
  meshLods: readonly ElevationMeshLod[],
  maximumAllowedVerticalErrorMeters: number | undefined,
): MeshLodQualityAudit {
  const levels = meshLods.map(lod => {
    const sampledRows = sampleIndices(grid.height, lod.stride);
    const sampledColumns = sampleIndices(grid.width, lod.stride);
    const rowSegments = segmentIndexBySample(grid.height, sampledRows);
    const columnSegments = segmentIndexBySample(grid.width, sampledColumns);
    let maximumAbsoluteVerticalErrorMeters = 0;
    let absoluteErrorSum = 0;
    let squaredErrorSum = 0;

    for (let row = 0; row < grid.height; row += 1) {
      for (let column = 0; column < grid.width; column += 1) {
        const sourceElevation =
          grid.elevationsMeters[row * grid.width + column];
        const interpolatedElevation = interpolateGridTinElevation(
          grid,
          sampledRows,
          sampledColumns,
          rowSegments[row],
          columnSegments[column],
          row,
          column,
        );
        const absoluteError = Math.abs(
          sourceElevation - interpolatedElevation,
        );
        if (!Number.isFinite(absoluteError)) {
          throw new Error(
            `Terrain mesh LOD${lod.level} produced a non-finite vertical residual.`,
          );
        }
        maximumAbsoluteVerticalErrorMeters = Math.max(
          maximumAbsoluteVerticalErrorMeters,
          absoluteError,
        );
        absoluteErrorSum += absoluteError;
        squaredErrorSum += absoluteError * absoluteError;
      }
    }

    const sourceSampleCount = grid.width * grid.height;
    if (!Number.isFinite(absoluteErrorSum) || !Number.isFinite(squaredErrorSum)) {
      throw new Error(
        `Terrain mesh LOD${lod.level} residual aggregates exceed numeric limits.`,
      );
    }
    const roundedMaximumError = roundMeshError(
      maximumAbsoluteVerticalErrorMeters,
    );
    const allowedError = lod.level === 0
      ? 0
      : maximumAllowedVerticalErrorMeters
        ?? MAX_MESH_VERTICAL_ERROR_METERS;
    const passed = lod.level === 0
      ? roundedMaximumError === 0
      : maximumAbsoluteVerticalErrorMeters <= allowedError;
    return {
      level: lod.level,
      stride: lod.stride,
      sourceSampleCount,
      maximumAbsoluteVerticalErrorMeters: roundedMaximumError,
      meanAbsoluteVerticalErrorMeters: roundMeshError(
        absoluteErrorSum / sourceSampleCount,
      ),
      rootMeanSquareVerticalErrorMeters: roundMeshError(
        Math.sqrt(squaredErrorSum / sourceSampleCount),
      ),
      maximumAllowedVerticalErrorMeters: allowedError,
      passed,
    };
  });
  const failedLevel = levels.find(level => !level.passed);
  if (failedLevel) {
    throw new Error(
      `Terrain mesh LOD${failedLevel.level} vertical error `
      + `${failedLevel.maximumAbsoluteVerticalErrorMeters}m exceeds `
      + `${failedLevel.maximumAllowedVerticalErrorMeters}m.`,
    );
  }
  return {
    algorithm: 'regular-grid-tin-all-node-vertical-residual-v0.1',
    sampleBasis: 'all-normalized-grid-points',
    verticalUnits: 'metres',
    coordinateBasis: grid.coordinateModel === 'per-grid-node'
      ? 'adapter-provided-epsg4326-grid-nodes'
      : 'adapter-provided-epsg4326-axes',
    precisionDecimals: MESH_ERROR_PRECISION_DECIMALS,
    maximumAllowedVerticalErrorMeters:
      maximumAllowedVerticalErrorMeters ?? null,
    maximumObservedVerticalErrorMeters: Math.max(
      0,
      ...levels.map(level => level.maximumAbsoluteVerticalErrorMeters),
    ),
    levels,
    passed: true,
  };
}

function emptyMeshLodQuality(): MeshLodQualityAudit {
  return {
    algorithm: 'regular-grid-tin-all-node-vertical-residual-v0.1',
    sampleBasis: 'all-normalized-grid-points',
    verticalUnits: 'metres',
    coordinateBasis: 'adapter-provided-epsg4326-axes',
    precisionDecimals: MESH_ERROR_PRECISION_DECIMALS,
    maximumAllowedVerticalErrorMeters: null,
    maximumObservedVerticalErrorMeters: 0,
    levels: [],
    passed: true,
  };
}

function buildContourLevels(minimum: number, maximum: number, interval: number) {
  if (minimum === maximum) return [];
  const levels: number[] = [];
  const firstLevel = (Math.floor(minimum / interval) + 1) * interval;
  for (let elevation = firstLevel; elevation < maximum; elevation += interval) {
    levels.push(Number(elevation.toFixed(9)));
    if (levels.length > MAX_CONTOUR_LEVELS) {
      throw new Error(
        `Contour request exceeds ${MAX_CONTOUR_LEVELS} levels; increase the interval.`,
      );
    }
  }
  return levels;
}

type ContourCoordinate = [number, number, number];

type NormalizedContourLine = {
  elevation: number;
  coordinates: ContourCoordinate[];
  closed: boolean;
  boundaryEndpointCount: number;
};

function roundContourValue(value: number) {
  return Number(value.toFixed(CONTOUR_COORDINATE_PRECISION_DECIMALS));
}

function compareContourCoordinates(
  left: ContourCoordinate,
  right: ContourCoordinate,
) {
  return left[0] - right[0]
    || left[1] - right[1]
    || left[2] - right[2];
}

function contourCoordinateKey(coordinate: ContourCoordinate) {
  return coordinate
    .map(value => value.toFixed(CONTOUR_COORDINATE_PRECISION_DECIMALS))
    .join(',');
}

function compareCoordinateSequences(
  left: ContourCoordinate[],
  right: ContourCoordinate[],
) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const compared = compareContourCoordinates(left[index], right[index]);
    if (compared !== 0) return compared;
  }
  return left.length - right.length;
}

function canonicalizeContourLine(coordinates: ContourCoordinate[]) {
  const first = coordinates[0];
  const last = coordinates.at(-1)!;
  const closed = compareContourCoordinates(first, last) === 0;
  if (!closed) {
    return compareContourCoordinates(last, first) < 0
      ? [...coordinates].reverse()
      : coordinates;
  }

  const ring = coordinates.slice(0, -1);
  let minimum = ring[0];
  for (const coordinate of ring.slice(1)) {
    if (compareContourCoordinates(coordinate, minimum) < 0) {
      minimum = coordinate;
    }
  }
  const candidates: ContourCoordinate[][] = [];
  for (let start = 0; start < ring.length; start += 1) {
    if (compareContourCoordinates(ring[start], minimum) !== 0) continue;
    for (const direction of [1, -1]) {
      const candidate = Array.from(
        { length: ring.length },
        (_, offset) => ring[
          (start + direction * offset + ring.length) % ring.length
        ],
      );
      candidate.push(candidate[0]);
      candidates.push(candidate);
    }
  }
  candidates.sort(compareCoordinateSequences);
  return candidates[0];
}

function interpolateGridAxis(
  uniformValue: number,
  minimum: number,
  maximum: number,
  axis: readonly number[],
) {
  const normalized = Math.min(
    1,
    Math.max(0, (uniformValue - minimum) / (maximum - minimum)),
  );
  const position = normalized * (axis.length - 1);
  const lower = Math.floor(position);
  const upper = Math.min(axis.length - 1, lower + 1);
  const fraction = position - lower;
  return axis[lower] + (axis[upper] - axis[lower]) * fraction;
}

function contourAxes(grid: NormalizedElevationGrid) {
  const curvilinear = grid.coordinateModel === 'per-grid-node'
    ? createCurvilinearProjection(grid.curvilinearSourceGrid!)
    : undefined;
  const longitudes = grid.longitudeDegreesByColumn;
  const latitudes = grid.latitudeDegreesByRow === undefined
    ? undefined
    : grid.rowOrder === 'south-to-north'
      ? grid.latitudeDegreesByRow
      : [...grid.latitudeDegreesByRow].reverse();
  return { longitudes, latitudes, curvilinear };
}

function utmProjectionDefinition(sourceCrs: string) {
  const wgs84Match = /^EPSG:(326|327)(0[1-9]|[1-5]\d|60)$/.exec(sourceCrs);
  if (wgs84Match) {
    return [
      '+proj=utm',
      `+zone=${Number(wgs84Match[2])}`,
      wgs84Match[1] === '327' ? '+south' : '',
      '+datum=WGS84',
      '+units=m',
      '+no_defs',
    ].filter(Boolean).join(' ');
  }
  const nad83Match = /^EPSG:269(0[1-9]|1\d|2[0-3])$/.exec(sourceCrs);
  if (!nad83Match) return null;
  return [
    '+proj=utm',
    `+zone=${Number(nad83Match[1])}`,
    '+datum=NAD83',
    '+units=m',
    '+no_defs',
  ].filter(Boolean).join(' ');
}

function createCurvilinearProjection(
  sourceGrid: NonNullable<NormalizedElevationGrid['curvilinearSourceGrid']>,
) {
  const definition = utmProjectionDefinition(sourceGrid.sourceCrs);
  if (!definition) {
    throw new Error('Curvilinear contour mapping requires a supported WGS84 or NAD83 UTM source CRS.');
  }
  return {
    sourceGrid,
    sourceToWgs84: proj4(definition, 'EPSG:4326'),
    wgs84ToSource: proj4('EPSG:4326', definition),
  };
}

function boundedGridPosition(value: number, maximum: number, axis: 'x' | 'y') {
  const tolerance = 1e-7;
  if (!Number.isFinite(value) || value < -tolerance || value > maximum + tolerance) {
    throw new Error(`Curvilinear contour generator returned an out-of-grid ${axis} coordinate.`);
  }
  return Math.min(maximum, Math.max(0, value));
}

function remapCurvilinearContourPosition(
  grid: NormalizedElevationGrid,
  projection: NonNullable<ReturnType<typeof contourAxes>['curvilinear']>,
  columnFromWest: number,
  rowFromSouth: number,
) {
  const column = boundedGridPosition(columnFromWest, grid.width - 1, 'x');
  const row = grid.height - 1 - boundedGridPosition(
    rowFromSouth,
    grid.height - 1,
    'y',
  );
  const extent = projection.sourceGrid.sourceCenterExtent;
  const sourceX = extent.minimumX
    + (extent.maximumX - extent.minimumX) * (column / (grid.width - 1));
  const sourceY = extent.maximumY
    - (extent.maximumY - extent.minimumY) * (row / (grid.height - 1));
  const projected = projection.sourceToWgs84.forward([sourceX, sourceY]);
  const longitude = Number(projected[0]);
  const latitude = Number(projected[1]);
  if (
    !Number.isFinite(longitude)
    || !Number.isFinite(latitude)
    || longitude < -180
    || longitude > 180
    || latitude < -90
    || latitude > 90
  ) {
    throw new Error('Curvilinear contour inverse projection produced an invalid WGS84 coordinate.');
  }
  return [longitude, latitude] as const;
}

function remapContourPosition(
  grid: NormalizedElevationGrid,
  axes: ReturnType<typeof contourAxes>,
  longitude: number,
  latitude: number,
) {
  if (axes.curvilinear) {
    return remapCurvilinearContourPosition(
      grid,
      axes.curvilinear,
      longitude,
      latitude,
    );
  }
  return [
    axes.longitudes
      ? interpolateGridAxis(
          longitude,
          grid.bounds.west,
          grid.bounds.east,
          axes.longitudes,
        )
      : longitude,
    axes.latitudes
      ? interpolateGridAxis(
          latitude,
          grid.bounds.south,
          grid.bounds.north,
          axes.latitudes,
        )
      : latitude,
  ] as const;
}

function snapContourPositionToBounds(
  grid: NormalizedElevationGrid,
  longitude: number,
  latitude: number,
) {
  if (grid.coordinateModel === 'per-grid-node') {
    return [
      roundContourValue(longitude),
      roundContourValue(latitude),
    ] as const;
  }
  const { bounds } = grid;
  const longitudeTolerance = Math.max(
    10 ** -CONTOUR_COORDINATE_PRECISION_DECIMALS * 2,
    (bounds.east - bounds.west) * 1e-9,
  );
  const latitudeTolerance = Math.max(
    10 ** -CONTOUR_COORDINATE_PRECISION_DECIMALS * 2,
    (bounds.north - bounds.south) * 1e-9,
  );
  const snappedLongitude = Math.abs(longitude - bounds.west) <= longitudeTolerance
    ? bounds.west
    : Math.abs(longitude - bounds.east) <= longitudeTolerance
      ? bounds.east
      : longitude;
  const snappedLatitude = Math.abs(latitude - bounds.south) <= latitudeTolerance
    ? bounds.south
    : Math.abs(latitude - bounds.north) <= latitudeTolerance
      ? bounds.north
      : latitude;
  return [
    roundContourValue(snappedLongitude),
    roundContourValue(snappedLatitude),
  ] as const;
}

function boundaryEdges(
  grid: NormalizedElevationGrid,
  axes: ReturnType<typeof contourAxes>,
  coordinate: ContourCoordinate,
): ContourBoundaryEdge[] {
  if (axes.curvilinear) {
    const source = axes.curvilinear.wgs84ToSource.forward([
      coordinate[0],
      coordinate[1],
    ]);
    const sourceX = Number(source[0]);
    const sourceY = Number(source[1]);
    const extent = axes.curvilinear.sourceGrid.sourceCenterExtent;
    const tolerance = Math.max(
      0.001,
      Math.max(
        extent.maximumX - extent.minimumX,
        extent.maximumY - extent.minimumY,
      ) * 1e-10,
    );
    const edges: ContourBoundaryEdge[] = [];
    if (Math.abs(sourceX - extent.minimumX) <= tolerance) edges.push('west');
    if (Math.abs(sourceY - extent.minimumY) <= tolerance) edges.push('south');
    if (Math.abs(sourceX - extent.maximumX) <= tolerance) edges.push('east');
    if (Math.abs(sourceY - extent.maximumY) <= tolerance) edges.push('north');
    return edges;
  }
  const { bounds } = grid;
  const edges: ContourBoundaryEdge[] = [];
  if (coordinate[0] === roundContourValue(bounds.west)) edges.push('west');
  if (coordinate[1] === roundContourValue(bounds.south)) edges.push('south');
  if (coordinate[0] === roundContourValue(bounds.east)) edges.push('east');
  if (coordinate[1] === roundContourValue(bounds.north)) edges.push('north');
  return edges;
}

function normalizedBoundaryOffset(
  grid: NormalizedElevationGrid,
  axes: ReturnType<typeof contourAxes>,
  edge: ContourBoundaryEdge,
  coordinate: ContourCoordinate,
) {
  if (axes.curvilinear) {
    const source = axes.curvilinear.wgs84ToSource.forward([
      coordinate[0],
      coordinate[1],
    ]);
    const extent = axes.curvilinear.sourceGrid.sourceCenterExtent;
    const offset = edge === 'west' || edge === 'east'
      ? (Number(source[1]) - extent.minimumY) / (extent.maximumY - extent.minimumY)
      : (Number(source[0]) - extent.minimumX) / (extent.maximumX - extent.minimumX);
    return roundContourValue(Math.min(1, Math.max(0, offset)));
  }
  const { bounds } = grid;
  const offset = edge === 'west' || edge === 'east'
    ? (coordinate[1] - bounds.south) / (bounds.north - bounds.south)
    : (coordinate[0] - bounds.west) / (bounds.east - bounds.west);
  return roundContourValue(Math.min(1, Math.max(0, offset)));
}

function emptyContourTopology(): ContourTopologyAudit {
  return {
    algorithm: 'turf-isolines-v7-marching-squares',
    coordinatePrecisionDecimals: CONTOUR_COORDINATE_PRECISION_DECIMALS,
    axisRemappingApplied: false,
    coordinateRemapping: 'none',
    lineFeatureCount: 0,
    closedLineCount: 0,
    openLineCount: 0,
    vertexCount: 0,
    segmentCount: 0,
    boundaryEndpointCount: 0,
    boundaryContactCount: 0,
    boundaryContacts: [],
    removedConsecutiveDuplicateVertexCount: 0,
    duplicateSegmentCount: 0,
    interiorEndpointCount: 0,
  };
}

function createContourFeatures(
  grid: NormalizedElevationGrid,
  levels: number[],
): {
  features: TopographicFeature[];
  topology: ContourTopologyAudit;
} {
  if (levels.length === 0) {
    return { features: [], topology: emptyContourTopology() };
  }
  const points = [];
  for (let row = 0; row < grid.height; row += 1) {
    for (let column = 0; column < grid.width; column += 1) {
      const index = row * grid.width + column;
      const contourCoordinate = grid.coordinateModel === 'per-grid-node'
        ? [column, grid.height - 1 - row]
        : [longitudeAt(grid, column), latitudeAt(grid, row)];
      points.push(
        point(
          contourCoordinate,
          { elevation_m: grid.elevationsMeters[index] },
        ),
      );
    }
  }

  const contours = isolines(featureCollection(points), levels, {
    zProperty: 'elevation_m',
  });
  const axes = contourAxes(grid);
  const normalizedLines: NormalizedContourLine[] = [];
  const topology = emptyContourTopology();
  topology.axisRemappingApplied = Boolean(
    axes.longitudes || axes.latitudes || axes.curvilinear,
  );
  topology.coordinateRemapping = axes.curvilinear
    ? 'source-affine-inverse-projection'
    : axes.longitudes || axes.latitudes
      ? 'rectilinear-axes'
      : 'none';
  const segmentKeys = new Set<string>();

  for (const contour of contours.features) {
    const elevation = Number(contour.properties?.elevation_m);
    if (!Number.isFinite(elevation)) {
      throw new Error('Contour generator returned a non-finite elevation.');
    }
    for (let lineIndex = 0; lineIndex < contour.geometry.coordinates.length; lineIndex += 1) {
      const rawCoordinates = contour.geometry.coordinates[lineIndex];
      const coordinates: ContourCoordinate[] = [];
      for (const rawCoordinate of rawCoordinates) {
        if (
          rawCoordinate.length < 2
          || !Number.isFinite(rawCoordinate[0])
          || !Number.isFinite(rawCoordinate[1])
        ) {
          throw new Error('Contour generator returned an invalid GeoJSON position.');
        }
        const remapped = remapContourPosition(
          grid,
          axes,
          rawCoordinate[0],
          rawCoordinate[1],
        );
        const snapped = snapContourPositionToBounds(
          grid,
          remapped[0],
          remapped[1],
        );
        const coordinate: ContourCoordinate = [
          snapped[0],
          snapped[1],
          roundContourValue(elevation),
        ];
        if (
          coordinates.length > 0
          && compareContourCoordinates(coordinates.at(-1)!, coordinate) === 0
        ) {
          topology.removedConsecutiveDuplicateVertexCount += 1;
          continue;
        }
        coordinates.push(coordinate);
      }
      if (coordinates.length < 2) {
        throw new Error('Contour topology audit rejected a degenerate LineString.');
      }

      const canonicalCoordinates = canonicalizeContourLine(coordinates);
      const closed = compareContourCoordinates(
        canonicalCoordinates[0],
        canonicalCoordinates.at(-1)!,
      ) === 0;
      let boundaryEndpointCount = 0;
      if (closed) {
        topology.closedLineCount += 1;
      } else {
        topology.openLineCount += 1;
        topology.boundaryEndpointCount += 2;
        boundaryEndpointCount = 2;
        for (const endpoint of [
          canonicalCoordinates[0],
          canonicalCoordinates.at(-1)!,
        ]) {
          const edges = boundaryEdges(grid, axes, endpoint);
          if (edges.length === 0) {
            topology.interiorEndpointCount += 1;
            continue;
          }
          for (const edge of edges) {
            if (
              topology.boundaryContacts.length
              >= MAX_CONTOUR_BOUNDARY_CONTACTS
            ) {
              throw new Error(
                `Contour boundary contacts exceed ${MAX_CONTOUR_BOUNDARY_CONTACTS}.`,
              );
            }
            topology.boundaryContacts.push({
              elevationMeters: roundContourValue(elevation),
              edge,
              longitude: endpoint[0],
              latitude: endpoint[1],
              normalizedOffset: normalizedBoundaryOffset(
                grid,
                axes,
                edge,
                endpoint,
              ),
              matchKey:
                `${roundContourValue(elevation).toFixed(9)}@`
                + `${endpoint[0].toFixed(9)},${endpoint[1].toFixed(9)}`,
            });
          }
        }
      }

      for (let index = 1; index < canonicalCoordinates.length; index += 1) {
        const left = contourCoordinateKey(canonicalCoordinates[index - 1]);
        const right = contourCoordinateKey(canonicalCoordinates[index]);
        const segmentKey = `${roundContourValue(elevation).toFixed(9)}|`
          + (left < right ? `${left}|${right}` : `${right}|${left}`);
        if (segmentKeys.has(segmentKey)) {
          topology.duplicateSegmentCount += 1;
        } else {
          segmentKeys.add(segmentKey);
        }
      }

      normalizedLines.push({
        elevation: roundContourValue(elevation),
        coordinates: canonicalCoordinates,
        closed,
        boundaryEndpointCount,
      });
      if (normalizedLines.length > MAX_CONTOUR_FEATURES) {
        throw new Error(`Contour output exceeds ${MAX_CONTOUR_FEATURES} features.`);
      }
    }
  }

  if (topology.interiorEndpointCount > 0) {
    throw new Error(
      `Contour topology audit found ${topology.interiorEndpointCount} interior dangling endpoints.`,
    );
  }
  if (topology.duplicateSegmentCount > 0) {
    throw new Error(
      `Contour topology audit found ${topology.duplicateSegmentCount} duplicate segments.`,
    );
  }

  normalizedLines.sort((left, right) => (
    left.elevation - right.elevation
    || compareCoordinateSequences(left.coordinates, right.coordinates)
  ));
  topology.boundaryContacts.sort((left, right) => (
    left.elevationMeters - right.elevationMeters
    || left.matchKey.localeCompare(right.matchKey)
    || left.edge.localeCompare(right.edge)
  ));
  topology.lineFeatureCount = normalizedLines.length;
  topology.vertexCount = normalizedLines.reduce(
    (total, line) => total + line.coordinates.length,
    0,
  );
  topology.segmentCount = normalizedLines.reduce(
    (total, line) => total + line.coordinates.length - 1,
    0,
  );
  topology.boundaryContactCount = topology.boundaryContacts.length;

  const elevationIndexes = new Map<number, number>();
  const features = normalizedLines.map<TopographicFeature>(line => {
    const nextIndex = (elevationIndexes.get(line.elevation) ?? 0) + 1;
    elevationIndexes.set(line.elevation, nextIndex);
    return {
      id: `${grid.gridId}-contour-${line.elevation}-${nextIndex}`,
      layerId: 'contour-lines',
      geometry: { type: 'LineString', coordinates: line.coordinates },
      properties: {
        elevation_m: line.elevation,
        vertical_datum: grid.verticalDatum,
        derived: true,
        topology: line.closed ? 'closed' : 'boundary-open',
        boundary_endpoint_count: line.boundaryEndpointCount,
        coordinate_precision_decimals:
          CONTOUR_COORDINATE_PRECISION_DECIMALS,
        vectorizer_version: TOPOGRAPHIC_ELEVATION_VECTORIZER_VERSION,
      },
      sourceId: grid.sourceRecord.sourceId,
    };
  });
  return { features, topology };
}

function sourceGateFor(
  grid: NormalizedElevationGrid,
  layerIds: TopographicLayerId[],
  contourIntervalMeters: number,
) {
  return buildTopographicExportPlan({
    bounds: grid.bounds,
    countryCode: grid.countryCode,
    crs: grid.horizontalCrs,
    format: 'txt',
    layerIds,
    sourceRecords: [grid.sourceRecord],
    dataMode: grid.sourceRecord.syntheticOnly ? 'synthetic' : 'source-backed',
    contourIntervalMeters: layerIds.includes('contour-lines')
      ? contourIntervalMeters
      : undefined,
    now: grid.generatedAt,
  });
}

export function vectorizeNormalizedElevationGrid(
  grid: NormalizedElevationGrid,
  options: ElevationVectorizationOptions,
): ElevationVectorizationResult {
  validateGrid(grid, options);
  const includeTerrainMesh = options.includeTerrainMesh ?? true;
  const includeContours = options.includeContours ?? true;
  const layerIds: TopographicLayerId[] = [
    ...(includeTerrainMesh ? (['terrain-mesh'] as const) : []),
    ...(includeContours ? (['contour-lines'] as const) : []),
  ];
  const sourceGate = sourceGateFor(grid, layerIds, options.contourIntervalMeters);
  if (sourceGate.status !== 'ready') {
    throw new Error(
      `Elevation source gate blocked: ${sourceGate.issues
        .map(issue => `${issue.code}: ${issue.message}`)
        .join('; ')}`,
    );
  }

  let minimumElevationMeters = Number.POSITIVE_INFINITY;
  let maximumElevationMeters = Number.NEGATIVE_INFINITY;
  for (const elevation of grid.elevationsMeters) {
    minimumElevationMeters = Math.min(minimumElevationMeters, elevation);
    maximumElevationMeters = Math.max(maximumElevationMeters, elevation);
  }
  const contourLevels = includeContours
    ? buildContourLevels(
        minimumElevationMeters,
        maximumElevationMeters,
        options.contourIntervalMeters,
      )
    : [];
  const meshLods = includeTerrainMesh
    ? createTerrainMeshLods(grid, options.meshLodStrides ?? [1])
    : [];
  const meshLodQuality = includeTerrainMesh
    ? auditTerrainMeshLods(
        grid,
        meshLods,
        options.meshMaxVerticalErrorMeters,
      )
    : emptyMeshLodQuality();
  const terrainMesh = meshLods[0]?.mesh;
  const contourResult = includeContours
    ? createContourFeatures(grid, contourLevels)
    : { features: [], topology: emptyContourTopology() };
  const contourFeatures = contourResult.features;
  const dataset: TopographicDataset = {
    datasetId: `${grid.gridId}-vectorized`,
    title: grid.title,
    bounds: { ...grid.bounds },
    crs: grid.horizontalCrs,
    generatedAt: grid.generatedAt,
    synthetic: grid.sourceRecord.syntheticOnly === true,
    features: contourFeatures,
    meshes: terrainMesh ? [terrainMesh] : [],
    rasters: [],
  };

  return {
    vectorizerVersion: TOPOGRAPHIC_ELEVATION_VECTORIZER_VERSION,
    dataset,
    meshLods,
    meshLodQuality,
    sourceGate,
    metrics: {
      gridCellCount: grid.width * grid.height,
      vertexCount: terrainMesh?.vertices.length ?? 0,
      triangleCount: terrainMesh?.triangles.length ?? 0,
      meshLodCount: meshLods.length,
      contourLevelCount: contourLevels.length,
      contourFeatureCount: contourFeatures.length,
      contourVertexCount: contourResult.topology.vertexCount,
      contourSegmentCount: contourResult.topology.segmentCount,
      contourBoundaryEndpointCount:
        contourResult.topology.boundaryEndpointCount,
      contourBoundaryContactCount:
        contourResult.topology.boundaryContactCount,
      minimumElevationMeters,
      maximumElevationMeters,
    },
    contourTopology: contourResult.topology,
    warnings: [
      'The v0.5 mesh and contour vectors retain normalized EPSG:4326 coordinates and preserve adapter-provided row and column axes.',
      'Every mesh LOD is audited against all normalized source-grid points with deterministic vertical residual metrics; multiple LODs fail closed without an explicit maximum vertical error.',
      'Contour lines are canonicalized and fail closed on interior dangling endpoints or duplicate segments; boundary match keys are deterministic seam hints, not cryptographic signatures.',
      'The primary dataset contains LOD0 only; additional deterministic meshes are returned in meshLods for explicit downstream selection.',
      'The input must already have no-data cells and source quality masks resolved.',
      'Derived geometry does not prove an address, entrance, recipient, or delivery point.',
    ],
  };
}
