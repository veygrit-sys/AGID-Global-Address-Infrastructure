import {
ABSOLUTE_GRID_ANCHOR_VERSION,
AGID_BASE_CELL_METERS,
type GridFeatureResult,
getRegularMetricGridMetrics,
getNearestAbsoluteGridAnchorPoint,
latitudeToAbsoluteGridY,
lonLatToAbsoluteGridMeters,
longitudeToAbsoluteGridX,
metricSquareCellFromCenter,
normalizeLongitude,
regularMetricPointAt,
toUndirectedSegmentKey,
} from './gridDisplay';

export type PackedGridBuildInput = {
  packedCells: Float64Array;
  count: number;
  face: number;
  startQX: number;
  startQY: number;
  step: number;
};

type RegularMetricGridInput = {
  lat: number;
  lon: number;
  zoom: number;
  columns: number;
  rows: number;
  bounds?: [[number, number], [number, number]];
  paddingCells?: number;
};

export function buildRegularMetricGridFeatures({
  lat,
  lon,
  zoom,
  columns,
  rows,
  bounds,
  paddingCells = 4,
}: RegularMetricGridInput): GridFeatureResult {
  const metrics = getRegularMetricGridMetrics(zoom, lat);
  const absoluteAnchor = getNearestAbsoluteGridAnchorPoint(lat, lon);
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeRows = Math.max(1, Math.floor(rows));

  if (bounds) {
    const { minLon, maxLon, minLat, maxLat } = normalizeGridBounds(bounds, lon);
    const startCol = Math.floor(longitudeToAbsoluteGridX(minLon) / metrics.cellMeters) - paddingCells;
    const endCol = Math.ceil(longitudeToAbsoluteGridX(maxLon) / metrics.cellMeters) + paddingCells;
    const startRow = Math.floor(latitudeToAbsoluteGridY(minLat) / metrics.cellMeters) - paddingCells;
    const endRow = Math.ceil(latitudeToAbsoluteGridY(maxLat) / metrics.cellMeters) + paddingCells;
    return buildRegularMetricGridFeaturesFromRange({
      startCol,
      startRow,
      columns: Math.max(safeColumns, endCol - startCol),
      rows: Math.max(safeRows, endRow - startRow),
      metrics,
      absoluteAnchorId: absoluteAnchor.id,
    });
  }

  const point = lonLatToAbsoluteGridMeters(lat, lon);
  const startCol = Math.floor(point.x / metrics.cellMeters) - Math.floor(safeColumns / 2);
  const startRow = Math.floor(point.y / metrics.cellMeters) - Math.floor(safeRows / 2);

  return buildRegularMetricGridFeaturesFromRange({
    startCol,
    startRow,
    columns: safeColumns,
    rows: safeRows,
    metrics,
    absoluteAnchorId: absoluteAnchor.id,
  });
}

function normalizeGridBounds(bounds: [[number, number], [number, number]], anchorLon: number) {
  const [[rawWest, rawSouth], [rawEast, rawNorth]] = bounds;
  const minLat = Math.min(rawSouth, rawNorth);
  const maxLat = Math.max(rawSouth, rawNorth);
  let west = normalizeLongitude(rawWest);
  let east = normalizeLongitude(rawEast);
  const normalizedAnchorLon = normalizeLongitude(anchorLon);

  if (east < west) {
    if (normalizedAnchorLon >= west) {
      east += 360;
    } else {
      west -= 360;
    }
  }

  return {
    minLon: Math.min(west, east),
    maxLon: Math.max(west, east),
    minLat,
    maxLat,
  };
}

function buildRegularMetricGridFeaturesFromRange({
  startCol,
  startRow,
  columns,
  rows,
  metrics,
  absoluteAnchorId,
}: {
  startCol: number;
  startRow: number;
  columns: number;
  rows: number;
  metrics: ReturnType<typeof getRegularMetricGridMetrics>;
  absoluteAnchorId: string;
}): GridFeatureResult {
  const { step } = metrics;
  const gridCells: any[] = [];
  const gridLines: number[][][] = [];

  const points: number[][][] = Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: columns + 1 }, (_, col) =>
      regularMetricPointAt(startCol + col, startRow + row, metrics),
    ),
  );

  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col < columns; col++) {
      gridLines.push([points[row][col], points[row][col + 1]]);
    }
  }

  for (let col = 0; col <= columns; col++) {
    for (let row = 0; row < rows; row++) {
      gridLines.push([points[row][col], points[row + 1][col]]);
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const sw = points[row][col];
      const se = points[row][col + 1];
      const ne = points[row + 1][col + 1];
      const nw = points[row + 1][col];
      const poly = [sw, se, ne, nw, sw];

      gridCells.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [poly] },
        properties: {
          id: `display_${startCol + col}_${startRow + row}_${step}`,
          step,
          isFocus: step === 1,
          absoluteAnchorId,
          absoluteAnchorVersion: ABSOLUTE_GRID_ANCHOR_VERSION,
        },
      });
    }
  }

  return { gridLines, gridCells };
}

export function metricSquareCellFromCorners(polygon: number[][], step: number): number[][] {
  const ring = polygon[0] === polygon[polygon.length - 1] ? polygon.slice(0, -1) : polygon;
  const refLon = ring[0]?.[0] ?? 0;
  const adjusted = ring.map(point => {
    let lon = point[0];
    if (lon - refLon > 180) lon -= 360;
    else if (lon - refLon < -180) lon += 360;
    return [lon, point[1]];
  });
  const lat = adjusted.reduce((sum, point) => sum + point[1], 0) / adjusted.length;
  const lon = normalizeLongitude(adjusted.reduce((sum, point) => sum + point[0], 0) / adjusted.length);
  return metricSquareCellFromCenter(lat, lon, AGID_BASE_CELL_METERS * step);
}

export function buildGridFeaturesFromPackedCells({
  packedCells,
  count,
  face,
  startQX,
  startQY,
  step,
}: PackedGridBuildInput): GridFeatureResult {
  const gridCells: any[] = [];
  const gridLines: number[][][] = [];
  const lineCache = new Set<string>();

  const cols = Math.max(1, Math.round(Math.sqrt(count)));

  for (let index = 0; index < count; index++) {
    const offset = index * 8;
    const p1 = [packedCells[offset], packedCells[offset + 1]];
    const p2 = [packedCells[offset + 2], packedCells[offset + 3]];
    const p3 = [packedCells[offset + 4], packedCells[offset + 5]];
    const p4 = [packedCells[offset + 6], packedCells[offset + 7]];
    const poly = metricSquareCellFromCorners([p1, p2, p3, p4, p1], step);
    const centerLon = normalizeLongitude(poly.slice(0, -1).reduce((sum, point) => sum + point[0], 0) / 4);
    const centerLat = poly.slice(0, -1).reduce((sum, point) => sum + point[1], 0) / 4;
    const absoluteAnchor = getNearestAbsoluteGridAnchorPoint(centerLat, centerLon);

    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = startQX + col * step;
    const y = startQY + row * step;
    const cellId = `${face}_${x}_${y}_${step}`;

    gridCells.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [poly] },
      properties: {
        id: cellId,
        step,
        isFocus: step === 1,
        absoluteAnchorId: absoluteAnchor.id,
        absoluteAnchorVersion: ABSOLUTE_GRID_ANCHOR_VERSION,
      },
    });

    for (let i = 0; i < 4; i++) {
      const ptA = poly[i];
      const ptB = poly[i + 1];
      const segmentKey = toUndirectedSegmentKey(ptA, ptB, 8);

      if (!lineCache.has(segmentKey)) {
        gridLines.push([ptA, ptB]);
        lineCache.add(segmentKey);
      }
    }
  }

  return { gridLines, gridCells };
}
