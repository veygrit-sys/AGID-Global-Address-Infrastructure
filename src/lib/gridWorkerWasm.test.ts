import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeAGID } from './agid';
import { getDisplayCellPolygon } from './gridGeometry';
import {
buildGridFeaturesFromPackedCells,
buildRegularMetricGridFeatures,
metricSquareCellFromCorners,
} from './gridWorkerWasm';

function boundsOf(poly: number[][]) {
  const ring = poly[0] === poly[poly.length - 1] ? poly.slice(0, -1) : poly;
  return {
    minLon: Math.min(...ring.map(point => point[0])),
    maxLon: Math.max(...ring.map(point => point[0])),
    minLat: Math.min(...ring.map(point => point[1])),
    maxLat: Math.max(...ring.map(point => point[1])),
  };
}

function samePolygon(a: number[][], b: number[][], epsilon = 1e-12) {
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.ok(Math.abs(a[i][0] - b[i][0]) <= epsilon, `lon ${i}: ${a[i][0]} !== ${b[i][0]}`);
    assert.ok(Math.abs(a[i][1] - b[i][1]) <= epsilon, `lat ${i}: ${a[i][1]} !== ${b[i][1]}`);
  }
}

test('builds grid GeoJSON from Rust-packed cell corner coordinates', () => {
  const packedCells = new Float64Array([
    139.0, 35.0,
    139.001, 35.0,
    139.001, 35.001,
    139.0, 35.001,
  ]);

  const result = buildGridFeaturesFromPackedCells({
    packedCells,
    count: 1,
    face: 0,
    startQX: 100,
    startQY: 200,
    step: 1,
  });

  assert.equal(result.gridCells.length, 1);
  assert.equal(result.gridCells[0].properties.id, '0_100_200_1');
  const cell = result.gridCells[0].geometry.coordinates[0];
  assert.equal(cell.length, 5);
  assert.equal(cell[0][1], cell[1][1]);
  assert.equal(cell[1][0], cell[2][0]);
  assert.equal(cell[2][1], cell[3][1]);
  assert.equal(cell[3][0], cell[0][0]);
  assert.equal(result.gridLines.length, 4);
});

test('normalizes Rust-packed cells to metric right-angle squares', () => {
  const cell = metricSquareCellFromCorners([
      [1, 1],
      [2, 2],
      [1, 3],
      [0, 2],
      [1, 1],
    ], 4);

  assert.equal(cell.length, 5);
  assert.equal(cell[0][1], cell[1][1]);
  assert.equal(cell[1][0], cell[2][0]);
  assert.equal(cell[2][1], cell[3][1]);
  assert.equal(cell[3][0], cell[0][0]);
});

test('builds display grid as one aligned lattice without railway-like duplicate edges', () => {
  const result = buildRegularMetricGridFeatures({
    lat: 35.6812,
    lon: 139.7671,
    zoom: 16,
    columns: 2,
    rows: 1,
  });

  assert.equal(result.gridCells.length, 2);
  assert.equal(result.gridLines.length, 7);
  assert.equal(result.gridCells[0].properties.absoluteAnchorVersion, 'agid-grid-anchors-v1');
  assert.equal(result.gridCells[0].properties.absoluteAnchorId, 'antimeridian-face');

  const uniqueSegments = new Set(result.gridLines.map(line => {
    const [a, b] = line;
    const forward = `${a[0].toFixed(10)},${a[1].toFixed(10)}|${b[0].toFixed(10)},${b[1].toFixed(10)}`;
    const reverse = `${b[0].toFixed(10)},${b[1].toFixed(10)}|${a[0].toFixed(10)},${a[1].toFixed(10)}`;
    return forward < reverse ? forward : reverse;
  }));

  assert.equal(uniqueSegments.size, result.gridLines.length);
  assert.equal(result.gridCells[0].geometry.coordinates[0][1][1], result.gridCells[1].geometry.coordinates[0][0][1]);
  assert.equal(result.gridCells[0].geometry.coordinates[0][1][0], result.gridCells[1].geometry.coordinates[0][0][0]);
});

test('marks Rust-packed display cells with their absolute anchor point', () => {
  const result = buildGridFeaturesFromPackedCells({
    packedCells: new Float64Array([
      179.999, 0,
      180.0001, 0,
      180.0001, 0.001,
      179.999, 0.001,
    ]),
    count: 1,
    face: 1,
    startQX: 10,
    startQY: 20,
    step: 1,
  });

  assert.equal(result.gridCells[0].properties.absoluteAnchorVersion, 'agid-grid-anchors-v1');
  assert.equal(result.gridCells[0].properties.absoluteAnchorId, 'antimeridian-face');
});

test('builds a viewport-covering grid whose black cells match selected red cells', () => {
  const zoom = 18;
  const anchorLat = 35.6812;
  const anchorLon = 139.7671;
  const selectedLat = 35.6834;
  const selectedLon = 139.7698;
  const viewportBounds: [[number, number], [number, number]] = [
    [139.764, 35.678],
    [139.772, 35.686],
  ];

  const result = buildRegularMetricGridFeatures({
    lat: anchorLat,
    lon: anchorLon,
    zoom,
    columns: 70,
    rows: 70,
    bounds: viewportBounds,
  });

  const gridBounds = result.gridCells.reduce((acc, cell: any) => {
    const bounds = boundsOf(cell.geometry.coordinates[0]);
    return {
      minLon: Math.min(acc.minLon, bounds.minLon),
      maxLon: Math.max(acc.maxLon, bounds.maxLon),
      minLat: Math.min(acc.minLat, bounds.minLat),
      maxLat: Math.max(acc.maxLat, bounds.maxLat),
    };
  }, { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity });

  assert.ok(gridBounds.minLon <= viewportBounds[0][0]);
  assert.ok(gridBounds.maxLon >= viewportBounds[1][0]);
  assert.ok(gridBounds.minLat <= viewportBounds[0][1]);
  assert.ok(gridBounds.maxLat >= viewportBounds[1][1]);

  const selected = getDisplayCellPolygon(encodeAGID(selectedLat, selectedLon), zoom, anchorLat);
  const containingCell = result.gridCells.find((cell: any) => {
    const bounds = boundsOf(cell.geometry.coordinates[0]);
    return selectedLon >= bounds.minLon && selectedLon <= bounds.maxLon && selectedLat >= bounds.minLat && selectedLat <= bounds.maxLat;
  });

  assert.ok(selected);
  assert.ok(containingCell);
  samePolygon(selected, containingCell.geometry.coordinates[0]);
});
