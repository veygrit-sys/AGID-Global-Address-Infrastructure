import { createHash } from 'node:crypto';

import { MAX_ELEVATION_GRID_CELLS } from './topographicElevationVectorizer';
import type { GeoTiffReadWindow } from './topographicGeoTiffAdapter';

export const NYC_3DEP_SOURCE_TILING_VERSION =
  'agid-nyc-3dep-source-window-tiling-v0.1';
export const NYC_3DEP_SOURCE_TILING_METHOD =
  'gdal-srcwin-compatible-no-resample-v1';

const SHA256 = /^sha256:[a-f0-9]{64}$/i;

export type Nyc3depSourceImageLayout = {
  sourceSnapshotSha256: `sha256:${string}`;
  imageIndex: number;
  width: number;
  height: number;
  storage: 'tiled' | 'striped';
  blockWidth: number;
  blockHeight: number;
};

export type Nyc3depSourceTilingRequest = {
  source: Nyc3depSourceImageLayout;
  maximumWindowWidth: number;
  maximumWindowHeight: number;
  maximumTileCount: number;
};

export type Nyc3depSourceTile = {
  id: string;
  row: number;
  column: number;
  window: GeoTiffReadWindow;
  gdalSrcwin: readonly [number, number, number, number];
  sharedSourceSamples: {
    north: number | null;
    east: number | null;
    south: number | null;
    west: number | null;
  };
};

export type Nyc3depSourceTilingPlan = {
  version: typeof NYC_3DEP_SOURCE_TILING_VERSION;
  method: typeof NYC_3DEP_SOURCE_TILING_METHOD;
  source: Nyc3depSourceImageLayout;
  maximumWindowWidth: number;
  maximumWindowHeight: number;
  maximumTileCount: number;
  sampleOverlap: 1;
  alignment: {
    xSamples: number;
    ySamples: number;
    strategy: 'tile-block-grid' | 'strip-row-grid';
  };
  tiles: Nyc3depSourceTile[];
  planSha256: `sha256:${string}`;
  privacy: {
    containsRawElevation: false;
    containsCoordinates: false;
    containsAddressData: false;
  };
  nonClaims: string[];
};

function sha256(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as const;
}

function requirePositiveInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive safe integer.`);
  }
}

function requireWindowDimension(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 2) {
    throw new Error(`${field} must be an integer of at least 2 samples.`);
  }
}

function validateSource(source: Nyc3depSourceImageLayout) {
  if (!SHA256.test(source.sourceSnapshotSha256)) {
    throw new Error('NYC source tiling requires a source snapshot SHA-256 digest.');
  }
  if (!Number.isSafeInteger(source.imageIndex) || source.imageIndex < 0) {
    throw new Error('imageIndex must be a non-negative safe integer.');
  }
  requireWindowDimension(source.width, 'source width');
  requireWindowDimension(source.height, 'source height');
  if (source.storage !== 'tiled' && source.storage !== 'striped') {
    throw new Error('source storage must be tiled or striped.');
  }
  requirePositiveInteger(source.blockWidth, 'source block width');
  requirePositiveInteger(source.blockHeight, 'source block height');
}

function axisIntervals(input: {
  sourceLength: number;
  maximumWindowLength: number;
  alignment: number;
  axis: 'x' | 'y';
}) {
  const maximumSpan = input.maximumWindowLength - 1;
  const alignedSpan = Math.floor(maximumSpan / input.alignment) * input.alignment;
  if (alignedSpan < 1) {
    throw new Error(
      `maximumWindow${input.axis === 'x' ? 'Width' : 'Height'} cannot retain a one-sample seam overlap with the selected source block alignment.`,
    );
  }

  const intervals: Array<{ start: number; length: number }> = [];
  for (let start = 0; start < input.sourceLength - 1;) {
    const end = Math.min(start + alignedSpan, input.sourceLength - 1);
    intervals.push({ start, length: end - start + 1 });
    if (end === input.sourceLength - 1) break;
    start = end;
  }
  return intervals;
}

function planPayload(plan: Omit<Nyc3depSourceTilingPlan, 'planSha256'>) {
  return JSON.stringify(plan);
}

function buildPlan(input: Nyc3depSourceTilingRequest): Omit<Nyc3depSourceTilingPlan, 'planSha256'> {
  validateSource(input.source);
  requireWindowDimension(input.maximumWindowWidth, 'maximumWindowWidth');
  requireWindowDimension(input.maximumWindowHeight, 'maximumWindowHeight');
  requirePositiveInteger(input.maximumTileCount, 'maximumTileCount');
  if (
    input.maximumWindowWidth * input.maximumWindowHeight
      > MAX_ELEVATION_GRID_CELLS
  ) {
    throw new Error(
      `maximum window exceeds ${MAX_ELEVATION_GRID_CELLS} source samples.`,
    );
  }

  const xAlignment = input.source.storage === 'tiled'
    ? input.source.blockWidth
    : 1;
  const yAlignment = input.source.blockHeight;
  const columns = axisIntervals({
    sourceLength: input.source.width,
    maximumWindowLength: input.maximumWindowWidth,
    alignment: xAlignment,
    axis: 'x',
  });
  const rows = axisIntervals({
    sourceLength: input.source.height,
    maximumWindowLength: input.maximumWindowHeight,
    alignment: yAlignment,
    axis: 'y',
  });
  if (columns.length * rows.length > input.maximumTileCount) {
    throw new Error(
      `NYC source tiling would create ${columns.length * rows.length} tiles, exceeding the maximum of ${input.maximumTileCount}.`,
    );
  }

  const tiles: Nyc3depSourceTile[] = [];
  for (let row = 0; row < rows.length; row += 1) {
    for (let column = 0; column < columns.length; column += 1) {
      const x = columns[column];
      const y = rows[row];
      const window = {
        x: x.start,
        y: y.start,
        width: x.length,
        height: y.length,
      };
      if (window.width * window.height > MAX_ELEVATION_GRID_CELLS) {
        throw new Error(
          `NYC source tile r${row}c${column} exceeds ${MAX_ELEVATION_GRID_CELLS} samples.`,
        );
      }
      tiles.push({
        id: `r${String(row).padStart(4, '0')}-c${String(column).padStart(4, '0')}`,
        row,
        column,
        window,
        gdalSrcwin: [window.x, window.y, window.width, window.height],
        sharedSourceSamples: {
          north: row === 0 ? null : window.width,
          east: column === columns.length - 1 ? null : window.height,
          south: row === rows.length - 1 ? null : window.width,
          west: column === 0 ? null : window.height,
        },
      });
    }
  }

  return {
    version: NYC_3DEP_SOURCE_TILING_VERSION,
    method: NYC_3DEP_SOURCE_TILING_METHOD,
    source: { ...input.source },
    maximumWindowWidth: input.maximumWindowWidth,
    maximumWindowHeight: input.maximumWindowHeight,
    maximumTileCount: input.maximumTileCount,
    sampleOverlap: 1,
    alignment: {
      xSamples: xAlignment,
      ySamples: yAlignment,
      strategy: input.source.storage === 'tiled' ? 'tile-block-grid' : 'strip-row-grid',
    },
    tiles,
    privacy: {
      containsRawElevation: false,
      containsCoordinates: false,
      containsAddressData: false,
    },
    nonClaims: [
      'The plan selects source pixel windows only; it does not resample, interpolate, or fill elevation values.',
      'Shared edge samples are an input-consistency contract, not a survey, cadastral, building, entrance, or delivery claim.',
      'GDAL execution, source promotion, vertical-datum conversion, and derived mesh validation remain separate gates.',
    ],
  };
}

/**
 * Plans exact local GeoTIFF source windows for NYC case-study batches. Adjacent
 * windows share their edge sample so separately derived regular-grid TINs can
 * verify the same source value at each seam without resampling.
 */
export function planNyc3depSourceTiles(
  input: Nyc3depSourceTilingRequest,
): Nyc3depSourceTilingPlan {
  const plan = buildPlan(input);
  return {
    ...plan,
    planSha256: sha256(planPayload(plan)),
  };
}

export function verifyNyc3depSourceTilingPlan(plan: Nyc3depSourceTilingPlan) {
  const expected = planNyc3depSourceTiles({
    source: plan.source,
    maximumWindowWidth: plan.maximumWindowWidth,
    maximumWindowHeight: plan.maximumWindowHeight,
    maximumTileCount: plan.maximumTileCount,
  });
  if (
    plan.planSha256 !== expected.planSha256
    || JSON.stringify(plan) !== JSON.stringify(expected)
  ) {
    throw new Error('NYC source tiling plan integrity check failed.');
  }
  return expected;
}
