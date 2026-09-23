import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTopographic3dTilesRefinementContract,
  calculateTopographicPerspectiveRefinementDistance,
  calculateTopographicPerspectiveScreenSpaceError,
} from './topographic3dTilesRefinement';
import type {
  LocalGeoTiffMeshLodManifest,
} from './topographicLocalGeoTiffWorkflow';

function manifest(): LocalGeoTiffMeshLodManifest {
  return {
    schemaVersion: 'agid-topographic-mesh-lod-bundle-v0.2',
    workflowVersion: 'agid-local-geotiff-workflow-v0.8',
    generatedAt: '2026-07-27T12:00:00.000Z',
    datasetId: 'refinement-fixture',
    source: {
      sourceId: 'refinement-source',
      snapshotSha256: `sha256:${'a'.repeat(64)}`,
      horizontalCrs: 'EPSG:4326',
      verticalDatum: 'EPSG:4979',
    },
    bounds: { west: 0, south: 0, east: 0.02, north: 0.02 },
    terrain: {
      minimumElevationMeters: 0,
      maximumElevationMeters: 10,
    },
    output: {
      format: 'gltf',
      layerId: 'terrain-mesh',
      sampleBasis: 'all-normalized-grid-points',
      maximumAllowedVerticalErrorMeters: 5,
    },
    levels: [
      {
        level: 0,
        stride: 1,
        meshId: 'lod0',
        fileName: 'lod0.gltf',
        mediaType: 'model/gltf+json',
        byteLength: 1,
        sha256: `sha256:${'b'.repeat(64)}`,
        vertexCount: 25,
        triangleCount: 32,
        sourceSampleCount: 25,
        maximumAbsoluteVerticalErrorMeters: 0,
        meanAbsoluteVerticalErrorMeters: 0,
        rootMeanSquareVerticalErrorMeters: 0,
      },
      {
        level: 1,
        stride: 2,
        meshId: 'lod1',
        fileName: 'lod1.gltf',
        mediaType: 'model/gltf+json',
        byteLength: 1,
        sha256: `sha256:${'c'.repeat(64)}`,
        vertexCount: 9,
        triangleCount: 8,
        sourceSampleCount: 25,
        maximumAbsoluteVerticalErrorMeters: 4,
        meanAbsoluteVerticalErrorMeters: 1,
        rootMeanSquareVerticalErrorMeters: 2,
      },
      {
        level: 2,
        stride: 4,
        meshId: 'lod2',
        fileName: 'lod2.gltf',
        mediaType: 'model/gltf+json',
        byteLength: 1,
        sha256: `sha256:${'d'.repeat(64)}`,
        vertexCount: 4,
        triangleCount: 2,
        sourceSampleCount: 25,
        maximumAbsoluteVerticalErrorMeters: 3,
        meanAbsoluteVerticalErrorMeters: 1.5,
        rootMeanSquareVerticalErrorMeters: 2,
      },
    ],
    warnings: [],
    nonClaims: [],
  };
}

test('measured LOD residuals become a monotonic geometric-error envelope', () => {
  const contract = buildTopographic3dTilesRefinementContract(manifest());

  assert.equal(contract.tilesetGeometricErrorMeters, 4);
  assert.deepEqual(
    contract.levels.map(level => ({
      level: level.level,
      observed: level.observedMaximumVerticalResidualMeters,
      geometric: level.geometricErrorMeters,
      adjustment: level.monotonicAdjustmentMeters,
    })),
    [
      { level: 0, observed: 0, geometric: 0, adjustment: 0 },
      { level: 1, observed: 4, geometric: 4, adjustment: 0 },
      { level: 2, observed: 3, geometric: 4, adjustment: 1 },
    ],
  );
  assert.equal(
    contract.screenSpaceReference.levels[0]
      .refinementDistanceThresholdMeters,
    0,
  );
  assert.ok(
    contract.screenSpaceReference.levels[2]
      .refinementDistanceThresholdMeters > 200,
  );
});

test('perspective SSE and inverse refinement distance agree', () => {
  const distance = calculateTopographicPerspectiveRefinementDistance({
    geometricErrorMeters: 3,
    viewportHeightPixels: 1080,
    verticalFieldOfViewDegrees: 60,
    pixelRatio: 1,
    maximumScreenSpaceErrorPixels: 16,
  });
  const sse = calculateTopographicPerspectiveScreenSpaceError({
    geometricErrorMeters: 3,
    distanceToTileMeters: distance,
    viewportHeightPixels: 1080,
    verticalFieldOfViewDegrees: 60,
    pixelRatio: 1,
  });

  assert.ok(Math.abs(sse - 16) < 1e-12);
});

test('refinement contract fails closed on invalid or unevidenced errors', () => {
  const invalidLod0 = manifest();
  invalidLod0.levels[0].maximumAbsoluteVerticalErrorMeters = 0.1;
  assert.throws(
    () => buildTopographic3dTilesRefinementContract(invalidLod0),
    /LOD0 geometric error must be zero/,
  );

  const overBudget = manifest();
  overBudget.levels[2].maximumAbsoluteVerticalErrorMeters = 6;
  assert.throws(
    () => buildTopographic3dTilesRefinementContract(overBudget),
    /exceeds its evidenced error budget/,
  );

  assert.throws(
    () => calculateTopographicPerspectiveScreenSpaceError({
      geometricErrorMeters: 1,
      distanceToTileMeters: 0,
      viewportHeightPixels: 1080,
      verticalFieldOfViewDegrees: 60,
      pixelRatio: 1,
    }),
    /distanceToTileMeters/,
  );
});
