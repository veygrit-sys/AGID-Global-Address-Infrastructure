import { type AGIDResult } from './agid';
import { regularMetricCellFromPoint } from './gridDisplay';

export { getDisplayCellSizeMeters,getDisplayGridStep,metricSquareCellFromCenter } from './gridDisplay';

export type GridRenderFrame = {
  anchorLat: number;
  zoom: number;
};

export type GridCellBounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

const gridCellBoundsCache = new WeakMap<any[], GridCellBounds | null>();
export const GRID_COVERAGE_EPSILON_DEGREES = 1e-8;

export function getGridHighlightFrame(
  currentFrame: GridRenderFrame,
  renderedFrame: GridRenderFrame | null | undefined,
  refreshGrid: boolean,
): GridRenderFrame {
  if (!renderedFrame) return currentFrame;
  if (refreshGrid) return renderedFrame;
  return renderedFrame;
}

export function polygonToRightAngleCell(polygon: number[][]): number[][] {
  const ring = polygon[0] === polygon[polygon.length - 1] ? polygon.slice(0, -1) : polygon;
  const lons = ring.map(point => point[0]);
  const lats = ring.map(point => point[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  return [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat],
    [minLon, minLat],
  ];
}

function haversineMeters(a: number[], b: number[]) {
  const radius = 6_371_000;
  const dLat = (b[1] - a[1]) * Math.PI / 180;
  const dLon = (b[0] - a[0]) * Math.PI / 180;
  const lat1 = a[1] * Math.PI / 180;
  const lat2 = b[1] * Math.PI / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function getCellMetricAreaM2(polygon: number[][]) {
  if (polygon.length < 4) return 0;
  const width = (haversineMeters(polygon[0], polygon[1]) + haversineMeters(polygon[3], polygon[2])) / 2;
  const height = (haversineMeters(polygon[1], polygon[2]) + haversineMeters(polygon[0], polygon[3])) / 2;
  return width * height;
}

export function getGridCellMetricSummary(polygons: number[][][]) {
  const areas = polygons
    .map(getCellMetricAreaM2)
    .filter(area => Number.isFinite(area) && area > 0);
  const count = areas.length;
  const minAreaM2 = count ? Math.min(...areas) : 0;
  const maxAreaM2 = count ? Math.max(...areas) : 0;
  const averageAreaM2 = count ? areas.reduce((sum, area) => sum + area, 0) / count : 0;

  return {
    count,
    minAreaM2,
    maxAreaM2,
    averageAreaM2,
  };
}

export function rightAngleCellLines(polygon: number[][]): number[][][] {
  const cell = polygonToRightAngleCell(polygon);
  return [
    [cell[0], cell[1]],
    [cell[1], cell[2]],
    [cell[2], cell[3]],
    [cell[3], cell[0]],
  ];
}

export function getDisplayCellPolygon(result: AGIDResult | undefined, zoom: number, anchorLat?: number): number[][] | null {
  if (!result) return null;
  return regularMetricCellFromPoint(result.lat, result.lon, zoom, anchorLat ?? result.lat);
}

function alignLongitudeToReference(lon: number, referenceLon: number) {
  let aligned = lon;
  while (aligned - referenceLon > 180) aligned -= 360;
  while (aligned - referenceLon < -180) aligned += 360;
  return aligned;
}

export function findContainingGridCellPolygon(
  gridCells: any[] | null | undefined,
  result: AGIDResult | undefined,
  epsilon = 1e-12,
): number[][] | null {
  if (!gridCells?.length || !result) return null;

  for (const cell of gridCells) {
    const polygon = cell?.geometry?.coordinates?.[0];
    if (!Array.isArray(polygon) || polygon.length < 4) continue;

    const ring = polygon[0] === polygon[polygon.length - 1] ? polygon.slice(0, -1) : polygon;
    const referenceLon = ring[0]?.[0];
    if (!Number.isFinite(referenceLon)) continue;

    const lons = ring.map(point => alignLongitudeToReference(point[0], referenceLon));
    const lats = ring.map(point => point[1]);
    const pointLon = alignLongitudeToReference(result.lon, referenceLon);
    const pointLat = result.lat;

    if (
      pointLon >= Math.min(...lons) - epsilon &&
      pointLon <= Math.max(...lons) + epsilon &&
      pointLat >= Math.min(...lats) - epsilon &&
      pointLat <= Math.max(...lats) + epsilon
    ) {
      return polygon;
    }
  }

  return null;
}

export function gridCellsCoverBounds(
  gridCells: any[] | null | undefined,
  bounds: [[number, number], [number, number]],
  epsilon = GRID_COVERAGE_EPSILON_DEGREES,
) {
  const renderedBounds = getGridCellsRenderBounds(gridCells);
  if (!renderedBounds) return false;

  const [[west, south], [east, north]] = bounds;
  return (
    renderedBounds.minLon <= Math.min(west, east) + epsilon &&
    renderedBounds.maxLon >= Math.max(west, east) - epsilon &&
    renderedBounds.minLat <= Math.min(south, north) + epsilon &&
    renderedBounds.maxLat >= Math.max(south, north) - epsilon
  );
}

export function getGridCellsRenderBounds(gridCells: any[] | null | undefined): GridCellBounds | null {
  if (!gridCells?.length) return null;

  const cached = gridCellBoundsCache.get(gridCells);
  if (cached !== undefined) return cached;

  const renderBounds = gridCells.reduce<GridCellBounds>((acc, cell) => {
    const polygon = cell?.geometry?.coordinates?.[0];
    if (!Array.isArray(polygon) || polygon.length < 4) return acc;
    const ring = polygon[0] === polygon[polygon.length - 1] ? polygon.slice(0, -1) : polygon;

    for (const point of ring) {
      acc.minLon = Math.min(acc.minLon, point[0]);
      acc.maxLon = Math.max(acc.maxLon, point[0]);
      acc.minLat = Math.min(acc.minLat, point[1]);
      acc.maxLat = Math.max(acc.maxLat, point[1]);
    }

    return acc;
  }, { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity });

  const normalizedBounds = [renderBounds.minLon, renderBounds.maxLon, renderBounds.minLat, renderBounds.maxLat].every(Number.isFinite)
    ? renderBounds
    : null;

  gridCellBoundsCache.set(gridCells, normalizedBounds);
  return normalizedBounds;
}

export function gridBoundsCoverBounds(
  outerBounds: [[number, number], [number, number]] | null | undefined,
  innerBounds: [[number, number], [number, number]],
  epsilon = GRID_COVERAGE_EPSILON_DEGREES,
) {
  if (!outerBounds) return false;

  const [[outerWest, outerSouth], [outerEast, outerNorth]] = outerBounds;
  const [[innerWest, innerSouth], [innerEast, innerNorth]] = innerBounds;

  return (
    Math.min(outerWest, outerEast) <= Math.min(innerWest, innerEast) + epsilon &&
    Math.max(outerWest, outerEast) >= Math.max(innerWest, innerEast) - epsilon &&
    Math.min(outerSouth, outerNorth) <= Math.min(innerSouth, innerNorth) + epsilon &&
    Math.max(outerSouth, outerNorth) >= Math.max(innerSouth, innerNorth) - epsilon
  );
}

export function shouldRefreshGridForViewport(
  refreshGrid: boolean,
  gridCells: any[] | null | undefined,
  bounds: [[number, number], [number, number]],
  pendingBounds?: [[number, number], [number, number]] | null,
) {
  return refreshGrid || (!gridCellsCoverBounds(gridCells, bounds) && !gridBoundsCoverBounds(pendingBounds, bounds));
}

export function shouldDisplayGridResponse(
  gridCells: any[] | null | undefined,
  currentVisibleBounds: [[number, number], [number, number]],
) {
  return gridCellsCoverBounds(gridCells, currentVisibleBounds);
}

export function resolveGridHighlightPolygons(
  activeResult: AGIDResult | undefined,
  selectedResult: AGIDResult | undefined,
  zoom: number,
  anchorLat?: number,
) {
  const selectedPolygon = getDisplayCellPolygon(selectedResult, zoom, anchorLat);
  const activePolygon = getDisplayCellPolygon(activeResult, zoom, anchorLat);
  const shouldShowActive = Boolean(
    activePolygon &&
    !areGridPolygonsEquivalent(activePolygon, selectedPolygon),
  );

  return {
    activePolygon: shouldShowActive ? activePolygon : null,
    selectedPolygon,
  };
}

export function areGridPolygonsEquivalent(
  a: number[][] | null | undefined,
  b: number[][] | null | undefined,
  epsilon = 1e-12,
) {
  if (!a || !b || a.length !== b.length) return false;

  const boundsA = getPolygonBounds(a);
  const boundsB = getPolygonBounds(b);

  return (
    Math.abs(boundsA.minLon - boundsB.minLon) <= epsilon &&
    Math.abs(boundsA.maxLon - boundsB.maxLon) <= epsilon &&
    Math.abs(boundsA.minLat - boundsB.minLat) <= epsilon &&
    Math.abs(boundsA.maxLat - boundsB.maxLat) <= epsilon
  );
}

function getPolygonBounds(polygon: number[][]) {
  const ring = polygon[0] === polygon[polygon.length - 1] ? polygon.slice(0, -1) : polygon;
  return {
    minLon: Math.min(...ring.map(point => point[0])),
    maxLon: Math.max(...ring.map(point => point[0])),
    minLat: Math.min(...ring.map(point => point[1])),
    maxLat: Math.max(...ring.map(point => point[1])),
  };
}
