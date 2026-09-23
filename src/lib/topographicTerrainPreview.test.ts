import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSyntheticTopographicDataset,
  type TopographicBounds,
  type TopographicMesh,
} from './topographicExport';
import {
  TOPOGRAPHIC_TERRAIN_PREVIEW_SCHEMA,
  buildTopographicTerrainPreviewModel,
} from './topographicTerrainPreview';

test('terrain preview converts a synthetic mesh into deterministic local render buffers', () => {
  const bounds: TopographicBounds = {
    south: 35.675,
    west: 139.755,
    north: 35.695,
    east: 139.78,
  };
  const dataset = createSyntheticTopographicDataset(bounds);
  const first = buildTopographicTerrainPreviewModel(dataset.meshes[0], bounds);
  const second = buildTopographicTerrainPreviewModel(dataset.meshes[0], bounds);

  assert.equal(first.schema, TOPOGRAPHIC_TERRAIN_PREVIEW_SCHEMA);
  assert.equal(first.vertexCount, 64);
  assert.equal(first.triangleCount, 98);
  assert.equal(first.indices.length, 294);
  assert.equal(first.positions.length, 192);
  assert.equal(first.colors.length, 192);
  assert.ok(first.horizontalSpanMeters > 1_000);
  assert.ok(first.verticalExaggeration >= 1);
  assert.ok(first.verticalExaggeration <= 20);
  assert.equal(
    first.coordinateFrame.verticalTreatment,
    'relative-source-height-display-only',
  );
  assert.deepEqual([...first.positions], [...second.positions]);
  assert.deepEqual([...first.colors], [...second.colors]);
  assert.deepEqual([...first.indices], [...second.indices]);
  assert.ok([...first.positions].every(Number.isFinite));
  assert.ok([...first.colors].every(value => value >= 0 && value <= 1));
});

test('terrain preview centers antimeridian-spanning meshes without a world-scale jump', () => {
  const bounds: TopographicBounds = {
    south: -1,
    west: 179.8,
    north: 1,
    east: -179.8,
  };
  const mesh: TopographicMesh = {
    id: 'antimeridian-terrain',
    layerId: 'terrain-mesh',
    sourceId: 'antimeridian-fixture',
    vertices: [
      [179.9, -0.5, 0],
      [-179.9, -0.5, 10],
      [180, 0.5, 20],
    ],
    triangles: [[0, 1, 2]],
  };
  const model = buildTopographicTerrainPreviewModel(mesh, bounds);

  assert.equal(model.coordinateFrame.originLongitudeDegrees, 180);
  assert.ok(model.horizontalSpanMeters < 250_000);
  assert.equal(model.triangleCount, 1);
});

test('terrain preview fails closed on unsafe mesh data', () => {
  const bounds: TopographicBounds = {
    south: 0,
    west: 0,
    north: 1,
    east: 1,
  };
  const mesh: TopographicMesh = {
    id: 'invalid-terrain',
    layerId: 'terrain-mesh',
    sourceId: 'invalid-fixture',
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [1.1, 1, 0],
    ],
    triangles: [[0, 1, 2]],
  };

  assert.throws(
    () => buildTopographicTerrainPreviewModel(mesh, bounds),
    /terrain-preview-vertex-outside-bounds/,
  );
});
