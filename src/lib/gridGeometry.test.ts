import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import { encodeAGID } from './agid';
import {
areGridPolygonsEquivalent,
findContainingGridCellPolygon,
getDisplayCellPolygon,
getDisplayGridStep,
getGridCellMetricSummary,
getGridCellsRenderBounds,
getGridHighlightFrame,
gridBoundsCoverBounds,
gridCellsCoverBounds,
polygonToRightAngleCell,
resolveGridHighlightPolygons,
rightAngleCellLines,
shouldDisplayGridResponse,
shouldRefreshGridForViewport,
} from './gridGeometry';
import { buildRegularMetricGridFeatures } from './gridWorkerWasm';

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

describe('grid display geometry', () => {
  it('converts a diamond-like polygon to an axis-aligned right-angle cell', () => {
    const cell = polygonToRightAngleCell([
      [1, 1],
      [2, 2],
      [1, 3],
      [0, 2],
      [1, 1],
    ]);

    assert.deepEqual(cell, [
      [0, 1],
      [2, 1],
      [2, 3],
      [0, 3],
      [0, 1],
    ]);
    assert.deepEqual(rightAngleCellLines(cell), [
      [[0, 1], [2, 1]],
      [[2, 1], [2, 3]],
      [[2, 3], [0, 3]],
      [[0, 3], [0, 1]],
    ]);
  });

  it('uses the same zoom-derived step for selected cells as the gray grid', () => {
    const agid = encodeAGID(35.6812, 139.7671);
    const zoom = 16;
    const selected = getDisplayCellPolygon(agid, zoom);

    assert.equal(getDisplayGridStep(zoom), 4);
    assert.ok(selected);
    assert.equal(selected.length, 5);
    assert.equal(selected[0][1], selected[1][1]);
    assert.equal(selected[1][0], selected[2][0]);
    assert.equal(selected[2][1], selected[3][1]);
    assert.equal(selected[3][0], selected[0][0]);
  });

  it('aligns selected red cells to the regular metric grid line cell containing the selected point', () => {
    const lat = 35.681234;
    const lon = 139.767123;
    const zoom = 16;
    const selected = getDisplayCellPolygon(encodeAGID(lat, lon), zoom, lat);
    const grid = buildRegularMetricGridFeatures({ lat, lon, zoom, columns: 12, rows: 12 });
    const containingCell = grid.gridCells.find((cell: any) => {
      const bounds = boundsOf(cell.geometry.coordinates[0]);
      return lon >= bounds.minLon && lon <= bounds.maxLon && lat >= bounds.minLat && lat <= bounds.maxLat;
    });

    assert.ok(selected);
    assert.ok(containingCell);
    samePolygon(selected, containingCell.geometry.coordinates[0]);
  });

  it('keeps selected cells at absolute earth-fixed positions when the viewport anchor changes', () => {
    const lat = 35.681234;
    const lon = 139.767123;
    const zoom = 18;
    const selectedNearAnchor = getDisplayCellPolygon(encodeAGID(lat, lon), zoom, 35.6812);
    const selectedFarAnchor = getDisplayCellPolygon(encodeAGID(lat, lon), zoom, 35.7062);

    assert.ok(selectedNearAnchor);
    assert.ok(selectedFarAnchor);
    samePolygon(selectedNearAnchor, selectedFarAnchor);
  });

  it('can reuse the rendered black grid cell polygon for the red selected fill', () => {
    const selected = encodeAGID(35.6834, 139.7698);
    const selectedPolygon = getDisplayCellPolygon(selected, 18, 35.6812);

    assert.ok(selectedPolygon);

    const renderedCells = [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [selectedPolygon],
        },
        properties: {},
      },
    ];

    const renderedPolygon = findContainingGridCellPolygon(renderedCells, selected);

    assert.equal(renderedPolygon, selectedPolygon);
  });

  it('detects when a rendered grid only covers part of the visible bounds', () => {
    const visibleBounds: [[number, number], [number, number]] = [
      [139.764, 35.678],
      [139.772, 35.686],
    ];
    const partialGrid = buildRegularMetricGridFeatures({
      lat: 35.6812,
      lon: 139.7671,
      zoom: 18,
      columns: 4,
      rows: 4,
    });
    const coveringGrid = buildRegularMetricGridFeatures({
      lat: 35.6812,
      lon: 139.7671,
      zoom: 18,
      columns: 70,
      rows: 70,
      bounds: visibleBounds,
    });

    assert.equal(gridCellsCoverBounds(partialGrid.gridCells, visibleBounds), false);
    assert.equal(gridCellsCoverBounds(coveringGrid.gridCells, visibleBounds), true);
  });

  it('caches rendered grid bounds so repeated coverage checks avoid rescanning cells', () => {
    const grid = buildRegularMetricGridFeatures({
      lat: 35.6812,
      lon: 139.7671,
      zoom: 18,
      columns: 10,
      rows: 10,
    });

    const firstBounds = getGridCellsRenderBounds(grid.gridCells);
    const secondBounds = getGridCellsRenderBounds(grid.gridCells);

    assert.ok(firstBounds);
    assert.equal(firstBounds, secondBounds);
  });

  it('rejects worker grid responses that would only cover part of the current viewport', () => {
    const currentVisibleBounds: [[number, number], [number, number]] = [
      [139.764, 35.678],
      [139.772, 35.686],
    ];
    const staleWorkerGrid = buildRegularMetricGridFeatures({
      lat: 35.6812,
      lon: 139.7671,
      zoom: 18,
      columns: 4,
      rows: 4,
    });
    const currentWorkerGrid = buildRegularMetricGridFeatures({
      lat: 35.6812,
      lon: 139.7671,
      zoom: 18,
      columns: 70,
      rows: 70,
      bounds: currentVisibleBounds,
    });

    assert.equal(shouldDisplayGridResponse(staleWorkerGrid.gridCells, currentVisibleBounds), false);
    assert.equal(shouldDisplayGridResponse(currentWorkerGrid.gridCells, currentVisibleBounds), true);
  });

  it('requests a fast refresh while panning when cached grid cells no longer cover the viewport', () => {
    const visibleBounds: [[number, number], [number, number]] = [
      [139.764, 35.678],
      [139.772, 35.686],
    ];
    const renderBounds: [[number, number], [number, number]] = [
      [139.76, 35.674],
      [139.776, 35.69],
    ];
    const slightlyPannedVisibleBounds: [[number, number], [number, number]] = [
      [139.765, 35.679],
      [139.773, 35.687],
    ];
    const partialGrid = buildRegularMetricGridFeatures({
      lat: 35.6812,
      lon: 139.7671,
      zoom: 18,
      columns: 4,
      rows: 4,
    });
    const coveringGrid = buildRegularMetricGridFeatures({
      lat: 35.6812,
      lon: 139.7671,
      zoom: 18,
      columns: 70,
      rows: 70,
      bounds: renderBounds,
    });

    assert.equal(shouldRefreshGridForViewport(false, partialGrid.gridCells, visibleBounds), true);
    assert.equal(shouldRefreshGridForViewport(false, coveringGrid.gridCells, visibleBounds), false);
    assert.equal(shouldRefreshGridForViewport(false, coveringGrid.gridCells, slightlyPannedVisibleBounds), false);
    assert.equal(shouldRefreshGridForViewport(true, coveringGrid.gridCells, visibleBounds), true);
  });

  it('does not keep replacing pending grid requests when the pending bounds already cover the viewport', () => {
    const visibleBounds: [[number, number], [number, number]] = [
      [139.764, 35.678],
      [139.772, 35.686],
    ];
    const pendingBounds: [[number, number], [number, number]] = [
      [139.76, 35.674],
      [139.776, 35.69],
    ];
    const outsidePendingBounds: [[number, number], [number, number]] = [
      [139.778, 35.678],
      [139.786, 35.686],
    ];

    assert.equal(gridBoundsCoverBounds(pendingBounds, visibleBounds), true);
    assert.equal(gridBoundsCoverBounds(pendingBounds, outsidePendingBounds), false);
    assert.equal(shouldRefreshGridForViewport(false, [], visibleBounds, pendingBounds), false);
    assert.equal(shouldRefreshGridForViewport(false, [], outsidePendingBounds, pendingBounds), true);
  });

  it('keeps preview highlights aligned to the already rendered grid frame', () => {
    const gridLat = 35.6812;
    const previewLat = 35.7062;
    const lon = 139.767123;
    const zoom = 16;
    const pointLat = 35.681234;
    const pointLon = 139.767123;

    const grid = buildRegularMetricGridFeatures({ lat: gridLat, lon, zoom, columns: 12, rows: 12 });
    const containingCell = grid.gridCells.find((cell: any) => {
      const bounds = boundsOf(cell.geometry.coordinates[0]);
      return pointLon >= bounds.minLon && pointLon <= bounds.maxLon && pointLat >= bounds.minLat && pointLat <= bounds.maxLat;
    });

    const frame = getGridHighlightFrame(
      { anchorLat: previewLat, zoom },
      { anchorLat: gridLat, zoom },
      false,
    );
    const selected = getDisplayCellPolygon(encodeAGID(pointLat, pointLon), frame.zoom, frame.anchorLat);

    assert.ok(containingCell);
    assert.ok(selected);
    samePolygon(selected, containingCell.geometry.coordinates[0]);
  });

  it('keeps highlights on the rendered grid while a refreshed grid is pending', () => {
    const frame = getGridHighlightFrame(
      { anchorLat: 35.6812, zoom: 18 },
      { anchorLat: 35.6812, zoom: 16 },
      true,
    );

    assert.deepEqual(frame, { anchorLat: 35.6812, zoom: 16 });
  });

  it('keeps neighboring display cells nearly equal in metric size', () => {
    const zoom = 16;
    const cells = [
      encodeAGID(35.6812, 139.7671),
      encodeAGID(35.68125, 139.7671),
      encodeAGID(35.6812, 139.76715),
    ].map(result => getDisplayCellPolygon(result, zoom)).filter(Boolean) as number[][][];

    const summary = getGridCellMetricSummary(cells);

    assert.ok(summary.count >= 3);
    assert.ok(summary.maxAreaM2 / summary.minAreaM2 <= 1.02);
    assert.ok(summary.averageAreaM2 > 0);
  });

  it('shows hover preview and selected cell together when active hover and selected cell differ', () => {
    const active = encodeAGID(35.6812, 139.7671);
    const selected = encodeAGID(35.682, 139.768);
    const highlights = resolveGridHighlightPolygons(active, selected, 16);

    assert.ok(highlights.activePolygon);
    assert.ok(highlights.selectedPolygon);
  });

  it('suppresses duplicate hover preview when active hover and selected cell are the same', () => {
    const selected = encodeAGID(35.6812, 139.7671);
    const highlights = resolveGridHighlightPolygons(selected, selected, 16);

    assert.equal(highlights.activePolygon, null);
    assert.ok(highlights.selectedPolygon);
  });

  it('suppresses hover preview when active and selected AGIDs are in the same rendered display cell', () => {
    const active = { ...encodeAGID(35.681200, 139.767100), id: 'ACTIVE_DIFFERENT_ID' };
    const selected = { ...encodeAGID(35.681201, 139.767101), id: 'SELECTED_DIFFERENT_ID' };
    const highlights = resolveGridHighlightPolygons(active, selected, 18);

    assert.ok(highlights.selectedPolygon);
    assert.equal(highlights.activePolygon, null);
  });

  it('compares display-cell polygons by earth-fixed bounds', () => {
    const a = getDisplayCellPolygon(encodeAGID(35.681200, 139.767100), 18);
    const b = getDisplayCellPolygon(encodeAGID(35.681201, 139.767101), 18);

    assert.equal(areGridPolygonsEquivalent(a, b), true);
  });
});
