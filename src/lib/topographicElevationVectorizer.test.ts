import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGID_SYNTHETIC_TOPO_SOURCE,
  buildTopographicExportPlan,
  type TopographicSourceRecord,
} from './topographicExport';
import {
  MAX_ELEVATION_GRID_CELLS,
  MAX_MESH_LOD_LEVELS,
  vectorizeNormalizedElevationGrid,
  type NormalizedElevationGrid,
} from './topographicElevationVectorizer';
import { serializeTopographicExport } from './topographicExportSerializers';
import {
  createTopographicEnuFrame,
  geodeticToEnuPoint,
} from './topographicGeodesy';

const bounds = {
  south: 35,
  west: 139,
  north: 35.01,
  east: 139.01,
};

const grid: NormalizedElevationGrid = {
  gridId: 'synthetic-hill',
  title: 'Synthetic normalized hill',
  bounds,
  width: 4,
  height: 4,
  elevationsMeters: [
    0, 5, 5, 0,
    5, 20, 20, 5,
    5, 20, 20, 5,
    0, 5, 5, 0,
  ],
  rowOrder: 'north-to-south',
  horizontalCrs: 'EPSG:4326',
  verticalDatum: 'synthetic-local-datum',
  sourceRecord: AGID_SYNTHETIC_TOPO_SOURCE,
  generatedAt: '2026-07-27T03:00:00.000Z',
  countryCode: 'JP',
};

function firstGltfPosition(gltf: {
  buffers: Array<{ uri: string }>;
  bufferViews: Array<{ byteOffset?: number }>;
  accessors: Array<{
    bufferView: number;
    byteOffset?: number;
  }>;
}) {
  const encoded = gltf.buffers[0].uri.split(',')[1];
  const bytes = Uint8Array.from(Buffer.from(encoded, 'base64'));
  const accessor = gltf.accessors[0];
  const view = gltf.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const dataView = new DataView(
    bytes.buffer,
    bytes.byteOffset + offset,
    12,
  );
  return [
    dataView.getFloat32(0, true),
    dataView.getFloat32(4, true),
    dataView.getFloat32(8, true),
  ];
}

test('normalized elevation grid produces deterministic TIN and contour vectors', () => {
  const first = vectorizeNormalizedElevationGrid(grid, {
    contourIntervalMeters: 5,
  });
  const second = vectorizeNormalizedElevationGrid(grid, {
    contourIntervalMeters: 5,
  });

  assert.equal(first.sourceGate.status, 'ready');
  assert.equal(first.metrics.gridCellCount, 16);
  assert.equal(first.metrics.vertexCount, 16);
  assert.equal(first.metrics.triangleCount, 18);
  assert.equal(first.metrics.meshLodCount, 1);
  assert.equal(first.metrics.minimumElevationMeters, 0);
  assert.equal(first.metrics.maximumElevationMeters, 20);
  assert.equal(first.metrics.contourLevelCount, 3);
  assert.ok(first.metrics.contourFeatureCount > 0);
  assert.equal(
    first.metrics.contourFeatureCount,
    first.contourTopology.lineFeatureCount,
  );
  assert.equal(
    first.metrics.contourBoundaryContactCount,
    first.contourTopology.boundaryContacts.length,
  );
  assert.equal(first.contourTopology.interiorEndpointCount, 0);
  assert.equal(first.contourTopology.duplicateSegmentCount, 0);
  assert.deepEqual(first.dataset, second.dataset);
  assert.deepEqual(first.contourTopology, second.contourTopology);
  assert.equal(first.meshLods.length, 1);
  assert.ok(
    first.dataset.features.every(
      feature =>
        feature.layerId === 'contour-lines' &&
        feature.properties.vertical_datum === 'synthetic-local-datum' &&
        feature.sourceId === AGID_SYNTHETIC_TOPO_SOURCE.sourceId,
    ),
  );
});

test('open contours are boundary-terminated and emit deterministic seam match keys', () => {
  const rampGrid: NormalizedElevationGrid = {
    ...grid,
    gridId: 'synthetic-ramp',
    elevationsMeters: [
      0, 5, 10, 15,
      0, 5, 10, 15,
      0, 5, 10, 15,
      0, 5, 10, 15,
    ],
  };
  const first = vectorizeNormalizedElevationGrid(rampGrid, {
    contourIntervalMeters: 5,
    includeTerrainMesh: false,
  });
  const second = vectorizeNormalizedElevationGrid(rampGrid, {
    contourIntervalMeters: 5,
    includeTerrainMesh: false,
  });

  assert.equal(first.contourTopology.closedLineCount, 0);
  assert.equal(first.contourTopology.openLineCount, 2);
  assert.equal(first.contourTopology.boundaryEndpointCount, 4);
  assert.equal(first.contourTopology.boundaryContactCount, 4);
  assert.deepEqual(first.contourTopology, second.contourTopology);
  assert.deepEqual(first.dataset.features, second.dataset.features);
  assert.ok(
    first.contourTopology.boundaryContacts.every(contact =>
      contact.edge === 'north' || contact.edge === 'south'
    ),
  );
  assert.ok(
    first.contourTopology.boundaryContacts.every(contact =>
      /^\d+\.\d{9}@-?\d+\.\d{9},-?\d+\.\d{9}$/.test(contact.matchKey)
    ),
  );
  assert.ok(
    first.dataset.features.every(
      feature =>
        feature.properties.topology === 'boundary-open'
        && feature.properties.boundary_endpoint_count === 2,
    ),
  );
});

test('contours are remapped from Turf bounding-box space onto non-linear grid axes', () => {
  const longitudeDegreesByColumn = [139, 139.001, 139.004, 139.01];
  const latitudeDegreesByRow = [35.01, 35.008, 35.003, 35];
  const result = vectorizeNormalizedElevationGrid({
    ...grid,
    gridId: 'synthetic-nonlinear-axis-ramp',
    longitudeDegreesByColumn,
    latitudeDegreesByRow,
    elevationsMeters: [
      15, 15, 15, 15,
      10, 10, 10, 10,
      5, 5, 5, 5,
      0, 0, 0, 0,
    ],
  }, {
    contourIntervalMeters: 5,
    includeTerrainMesh: false,
  });

  assert.equal(result.contourTopology.axisRemappingApplied, true);
  assert.equal(result.contourTopology.openLineCount, 2);
  const latitudesByLevel = new Map<number, Set<number>>();
  for (const feature of result.dataset.features) {
    assert.equal(feature.geometry.type, 'LineString');
    const elevation = Number(feature.properties.elevation_m);
    const latitudes = latitudesByLevel.get(elevation) ?? new Set<number>();
    feature.geometry.coordinates.forEach(coordinate => latitudes.add(coordinate[1]));
    latitudesByLevel.set(elevation, latitudes);
  }
  assert.deepEqual([...latitudesByLevel.get(5)!], [35.003]);
  assert.deepEqual([...latitudesByLevel.get(10)!], [35.008]);
});

test('adjacent tiles emit the same contour match key at a shared boundary', () => {
  const elevationsMeters = [
    10, 10, 10,
    5, 5, 5,
    0, 0, 0,
  ];
  const shared = {
    ...grid,
    width: 3,
    height: 3,
    elevationsMeters,
  };
  const left = vectorizeNormalizedElevationGrid({
    ...shared,
    gridId: 'synthetic-adjacent-left',
    bounds: { south: 35, west: 139, north: 35.01, east: 139.01 },
  }, {
    contourIntervalMeters: 5,
    includeTerrainMesh: false,
  });
  const right = vectorizeNormalizedElevationGrid({
    ...shared,
    gridId: 'synthetic-adjacent-right',
    bounds: { south: 35, west: 139.01, north: 35.01, east: 139.02 },
  }, {
    contourIntervalMeters: 5,
    includeTerrainMesh: false,
  });

  const leftShared = left.contourTopology.boundaryContacts.find(
    contact => contact.edge === 'east',
  );
  const rightShared = right.contourTopology.boundaryContacts.find(
    contact => contact.edge === 'west',
  );
  assert.ok(leftShared);
  assert.ok(rightShared);
  assert.equal(leftShared.matchKey, rightShared.matchKey);
  assert.equal(leftShared.longitude, 139.01);
  assert.equal(rightShared.longitude, 139.01);
});

test('terrain mesh LODs are deterministic, bounded, and preserve grid edges', () => {
  const first = vectorizeNormalizedElevationGrid(grid, {
    contourIntervalMeters: 5,
    includeContours: false,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 20,
  });
  const second = vectorizeNormalizedElevationGrid(grid, {
    contourIntervalMeters: 5,
    includeContours: false,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 20,
  });

  assert.equal(first.metrics.meshLodCount, 2);
  assert.equal(first.dataset.meshes.length, 1);
  assert.equal(first.meshLods[0].vertexCount, 16);
  assert.equal(first.meshLods[0].triangleCount, 18);
  assert.equal(first.meshLods[1].vertexCount, 9);
  assert.equal(first.meshLods[1].triangleCount, 8);
  assert.equal(first.meshLods[1].mesh.id, 'synthetic-hill-terrain-mesh-lod1-s2');
  assert.deepEqual(first.meshLods, second.meshLods);
  assert.deepEqual(first.meshLodQuality, second.meshLodQuality);
  assert.equal(
    first.meshLodQuality.algorithm,
    'regular-grid-tin-all-node-vertical-residual-v0.1',
  );
  assert.equal(first.meshLodQuality.levels.length, 2);
  assert.deepEqual(first.meshLodQuality.levels[0], {
    level: 0,
    stride: 1,
    sourceSampleCount: 16,
    maximumAbsoluteVerticalErrorMeters: 0,
    meanAbsoluteVerticalErrorMeters: 0,
    rootMeanSquareVerticalErrorMeters: 0,
    maximumAllowedVerticalErrorMeters: 0,
    passed: true,
  });
  assert.equal(first.meshLodQuality.maximumAllowedVerticalErrorMeters, 20);
  assert.equal(first.meshLodQuality.maximumObservedVerticalErrorMeters, 15);
  assert.equal(
    first.meshLodQuality.levels[1].maximumAbsoluteVerticalErrorMeters,
    15,
  );
  assert.equal(first.meshLodQuality.passed, true);

  const coarseVertices = first.meshLods[1].mesh.vertices;
  assert.deepEqual(coarseVertices[0].slice(0, 2), [bounds.west, bounds.north]);
  assert.deepEqual(coarseVertices.at(-1)?.slice(0, 2), [
    bounds.east,
    bounds.south,
  ]);
  assert.ok(
    first.meshLods.every(
      lod => lod.mesh.sourceId === AGID_SYNTHETIC_TOPO_SOURCE.sourceId,
    ),
  );
});

test('adapter-provided geographic axes are retained by mesh vertices', () => {
  const longitudeDegreesByColumn = [139, 139.001, 139.004, 139.01];
  const latitudeDegreesByRow = [35.01, 35.008, 35.003, 35];
  const result = vectorizeNormalizedElevationGrid({
    ...grid,
    longitudeDegreesByColumn,
    latitudeDegreesByRow,
  }, {
    contourIntervalMeters: 5,
    includeContours: false,
  });

  assert.deepEqual(result.dataset.meshes[0].vertices[5].slice(0, 2), [
    longitudeDegreesByColumn[1],
    latitudeDegreesByRow[1],
  ]);
  assert.throws(
    () => vectorizeNormalizedElevationGrid({
      ...grid,
      latitudeDegreesByRow: [...latitudeDegreesByRow].reverse(),
    }, {
      contourIntervalMeters: 5,
      includeContours: false,
    }),
    /must follow north-to-south row order/,
  );
});

test('generated dataset passes existing glTF and GeoJSON serializers', () => {
  const result = vectorizeNormalizedElevationGrid(grid, {
    contourIntervalMeters: 5,
  });
  const gltfPlan = buildTopographicExportPlan({
    bounds,
    countryCode: 'JP',
    crs: 'EPSG:4326',
    format: 'gltf',
    layerIds: ['terrain-mesh', 'contour-lines'],
    sourceRecords: [AGID_SYNTHETIC_TOPO_SOURCE],
    dataMode: 'synthetic',
    contourIntervalMeters: 5,
    now: grid.generatedAt,
  });
  const geoJsonPlan = buildTopographicExportPlan({
    bounds,
    countryCode: 'JP',
    crs: 'EPSG:4326',
    format: 'geojson',
    layerIds: ['contour-lines'],
    sourceRecords: [AGID_SYNTHETIC_TOPO_SOURCE],
    dataMode: 'synthetic',
    contourIntervalMeters: 5,
    now: grid.generatedAt,
  });

  assert.equal(gltfPlan.status, 'ready');
  assert.equal(geoJsonPlan.status, 'ready');
  const gltf = JSON.parse(
    String(serializeTopographicExport(result.dataset, gltfPlan).data),
  );
  const geoJson = JSON.parse(
    String(serializeTopographicExport(result.dataset, geoJsonPlan).data),
  );
  assert.equal(gltf.asset.version, '2.0');
  assert.ok(gltf.meshes.length > 0);
  assert.deepEqual(gltf.nodes[0].matrix, [
    1, 0, 0, 0,
    0, 0, -1, 0,
    0, 1, 0, 0,
    0, 0, 0, 1,
  ]);
  assert.equal(gltf.asset.extras.verticalMode, 'source-height-local-up');
  const sourceVertex = result.dataset.meshes[0].vertices[0];
  const expectedPosition = geodeticToEnuPoint(
    sourceVertex[0],
    sourceVertex[1],
    0,
    createTopographicEnuFrame(bounds.west, bounds.south),
  );
  expectedPosition[2] += sourceVertex[2];
  firstGltfPosition(gltf).forEach((value, index) => {
    assert.ok(Math.abs(value - expectedPosition[index]) < 0.001);
  });
  assert.equal(geoJson.type, 'FeatureCollection');
  assert.ok(geoJson.features.length > 0);
});

test('source rights, freshness, coverage, and requested layer gates remain enforced', () => {
  const pendingSource: TopographicSourceRecord = {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId: 'pending-elevation-source',
    reuseStatus: 'pending',
    syntheticOnly: false,
  };

  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(
        { ...grid, sourceRecord: pendingSource },
        { contourIntervalMeters: 5 },
      ),
    /source-reuse-pending/,
  );
});

test('malformed, excessive, and non-normalized grids fail closed', () => {
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(
        { ...grid, elevationsMeters: [0, 1] },
        { contourIntervalMeters: 5 },
      ),
    /requires 16 values/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(
        {
          ...grid,
          elevationsMeters: [
            0, 5, 5, 0,
            5, Number.NaN, 20, 5,
            5, 20, 20, 5,
            0, 5, 5, 0,
          ],
        },
        { contourIntervalMeters: 5 },
      ),
    /non-finite value/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(
        {
          ...grid,
          width: MAX_ELEVATION_GRID_CELLS + 1,
          height: 2,
          elevationsMeters: [],
        },
        { contourIntervalMeters: 5 },
      ),
    /exceeds 1000000 cells/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(
        {
          ...grid,
          bounds: { south: -1, west: 179.9, north: 1, east: -179.9 },
        },
        { contourIntervalMeters: 5 },
      ),
    /Antimeridian elevation vectorization/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(grid, {
        contourIntervalMeters: 5,
        meshLodStrides: [2],
      }),
    /must start with stride 1/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(grid, {
        contourIntervalMeters: 5,
        meshLodStrides: [1, 2, 2],
      }),
    /strictly increasing/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(grid, {
        contourIntervalMeters: 5,
        includeTerrainMesh: false,
        meshLodStrides: [1],
      }),
    /requires terrain mesh output/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(grid, {
        contourIntervalMeters: 5,
        meshLodStrides: Array.from(
          { length: MAX_MESH_LOD_LEVELS + 1 },
          (_, index) => index + 1,
        ),
      }),
    /must contain between 1 and 8 levels/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(grid, {
        contourIntervalMeters: 5,
        meshLodStrides: [1, 2],
      }),
    /require meshMaxVerticalErrorMeters/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(grid, {
        contourIntervalMeters: 5,
        meshLodStrides: [1, 2],
        meshMaxVerticalErrorMeters: 14.9999999,
      }),
    /LOD1 vertical error 15m exceeds 14.9999999m/,
  );
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(grid, {
        contourIntervalMeters: 5,
        meshMaxVerticalErrorMeters: 10_001,
      }),
    /at most 10000/,
  );
});

test('contour explosion is bounded and private address material is absent', () => {
  assert.throws(
    () =>
      vectorizeNormalizedElevationGrid(
        {
          ...grid,
          width: 2,
          height: 2,
          elevationsMeters: [0, 1000, 1000, 0],
        },
        { contourIntervalMeters: 0.25, includeTerrainMesh: false },
      ),
    /exceeds 512 levels/,
  );

  const result = vectorizeNormalizedElevationGrid(grid, {
    contourIntervalMeters: 5,
  });
  assert.doesNotMatch(
    JSON.stringify(result.dataset),
    /recipient|room_number|delivery_instruction|private_key|proof_secret/i,
  );
});
