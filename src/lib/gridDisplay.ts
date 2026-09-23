export const EARTH_METERS_PER_DEGREE = 111_320;
export const AGID_BASE_CELL_METERS = 4.4;
export const W3W_STYLE_GRID_FADE_START_ZOOM = 17.25;
export const W3W_STYLE_GRID_FULL_ZOOM = 18.25;
export const W3W_STYLE_GRID_MIN_ZOOM = W3W_STYLE_GRID_FADE_START_ZOOM;
export const W3W_STYLE_GRID_OPACITY_FLOOR = 3;
export const WEB_MERCATOR_RADIUS_METERS = EARTH_METERS_PER_DEGREE * 180 / Math.PI;
export const MAX_WEB_MERCATOR_LAT = 85.05112878;
export const ABSOLUTE_GRID_ANCHOR_VERSION = 'agid-grid-anchors-v1';

export type AbsoluteGridAnchorPoint = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  roles: readonly string[];
};

export const ABSOLUTE_GRID_ANCHOR_POINTS = [
  {
    id: 'null-island',
    label: 'Null Island / Equator and prime meridian',
    lat: 0,
    lon: 0,
    roles: ['display-origin', 'equator', 'prime-meridian', 'cubed-sphere-face-x-positive'],
  },
  {
    id: 'equator-east-face',
    label: 'Equator east cubed-sphere face center',
    lat: 0,
    lon: 90,
    roles: ['equator', 'cubed-sphere-face-y-positive'],
  },
  {
    id: 'antimeridian-face',
    label: 'Equator antimeridian cubed-sphere face center',
    lat: 0,
    lon: 180,
    roles: ['equator', 'antimeridian', 'cubed-sphere-face-x-negative'],
  },
  {
    id: 'equator-west-face',
    label: 'Equator west cubed-sphere face center',
    lat: 0,
    lon: -90,
    roles: ['equator', 'cubed-sphere-face-y-negative'],
  },
  {
    id: 'north-pole-face',
    label: 'North pole cubed-sphere face center',
    lat: 90,
    lon: 0,
    roles: ['polar', 'cubed-sphere-face-z-positive'],
  },
  {
    id: 'south-pole-face',
    label: 'South pole cubed-sphere face center',
    lat: -90,
    lon: 0,
    roles: ['polar', 'cubed-sphere-face-z-negative'],
  },
  {
    id: 'web-mercator-north-limit',
    label: 'Web Mercator north render limit',
    lat: MAX_WEB_MERCATOR_LAT,
    lon: 0,
    roles: ['display-limit', 'web-mercator'],
  },
  {
    id: 'web-mercator-south-limit',
    label: 'Web Mercator south render limit',
    lat: -MAX_WEB_MERCATOR_LAT,
    lon: 0,
    roles: ['display-limit', 'web-mercator'],
  },
] as const satisfies readonly AbsoluteGridAnchorPoint[];

export type GridVisibilityState = {
  zoom: number;
  isGridVisible: boolean;
  gridOpacityLevel: number;
};

export type GridFeatureResult = {
  gridLines: number[][][];
  gridCells: any[];
};

export function normalizeLongitude(lon: number) {
  let normalized = lon;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}

function toUnitSphereVector(lat: number, lon: number) {
  const latRad = degreesToRadians(Math.max(-90, Math.min(90, lat)));
  const lonRad = degreesToRadians(normalizeLongitude(lon));
  const cosLat = Math.cos(latRad);

  return {
    x: cosLat * Math.cos(lonRad),
    y: cosLat * Math.sin(lonRad),
    z: Math.sin(latRad),
  };
}

export function getAbsoluteGridAnchorPoint(id: string) {
  return ABSOLUTE_GRID_ANCHOR_POINTS.find(anchor => anchor.id === id);
}

export function getNearestAbsoluteGridAnchorPoint(lat: number, lon: number): AbsoluteGridAnchorPoint {
  const point = toUnitSphereVector(
    Number.isFinite(lat) ? lat : 0,
    Number.isFinite(lon) ? lon : 0,
  );

  return ABSOLUTE_GRID_ANCHOR_POINTS.reduce<AbsoluteGridAnchorPoint>((best, anchor) => {
    const bestVector = toUnitSphereVector(best.lat, best.lon);
    const anchorVector = toUnitSphereVector(anchor.lat, anchor.lon);
    const bestScore = point.x * bestVector.x + point.y * bestVector.y + point.z * bestVector.z;
    const anchorScore = point.x * anchorVector.x + point.y * anchorVector.y + point.z * anchorVector.z;
    return anchorScore > bestScore ? anchor : best;
  }, ABSOLUTE_GRID_ANCHOR_POINTS[0]);
}

export function clampWebMercatorLatitude(lat: number) {
  return Math.max(-MAX_WEB_MERCATOR_LAT, Math.min(MAX_WEB_MERCATOR_LAT, lat));
}

export function longitudeToAbsoluteGridX(lon: number) {
  return WEB_MERCATOR_RADIUS_METERS * lon * Math.PI / 180;
}

export function latitudeToAbsoluteGridY(lat: number) {
  const clampedLat = clampWebMercatorLatitude(lat);
  if (Math.abs(clampedLat) <= 1e-12) return 0;
  const latRad = clampedLat * Math.PI / 180;
  return WEB_MERCATOR_RADIUS_METERS * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

export function lonLatToAbsoluteGridMeters(lat: number, lon: number) {
  return {
    x: longitudeToAbsoluteGridX(normalizeLongitude(lon)),
    y: latitudeToAbsoluteGridY(lat),
  };
}

export function getAbsoluteGridAnchorMeters(anchor: AbsoluteGridAnchorPoint) {
  return lonLatToAbsoluteGridMeters(anchor.lat, anchor.lon);
}

export function absoluteGridMetersToLonLat(x: number, y: number): number[] {
  const lon = normalizeLongitude((x / WEB_MERCATOR_RADIUS_METERS) * 180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / WEB_MERCATOR_RADIUS_METERS)) - Math.PI / 2) * 180 / Math.PI;
  return [lon, lat];
}

export function getDisplayGridStep(zoom: number): number {
  const idealStep = Math.pow(2, Math.max(0, Math.floor(18.5 - zoom)));
  let step = 1;
  while (step * 2 <= idealStep && step < 131072) step *= 2;
  return step;
}

export function getDisplayCellSizeMeters(zoom: number) {
  return AGID_BASE_CELL_METERS * getDisplayGridStep(zoom);
}

export function getCloseDistanceGridFade(zoom: number) {
  if (zoom <= W3W_STYLE_GRID_FADE_START_ZOOM) return 0;
  if (zoom >= W3W_STYLE_GRID_FULL_ZOOM) return 1;
  return (zoom - W3W_STYLE_GRID_FADE_START_ZOOM) / (W3W_STYLE_GRID_FULL_ZOOM - W3W_STYLE_GRID_FADE_START_ZOOM);
}

export function shouldShowDisplayGrid({ zoom, isGridVisible, gridOpacityLevel }: GridVisibilityState) {
  if (!isGridVisible) return false;
  if (Number.isFinite(gridOpacityLevel) && gridOpacityLevel <= 0) return false;
  return getCloseDistanceGridFade(zoom) > 0;
}

export function getEffectiveGridOpacityLevel(state: GridVisibilityState) {
  if (!shouldShowDisplayGrid(state)) return 0;
  const requestedOpacity = state.isGridVisible && Number.isFinite(state.gridOpacityLevel)
    ? Math.max(0, Math.min(5, state.gridOpacityLevel))
    : 0;
  return Math.max(requestedOpacity, W3W_STYLE_GRID_OPACITY_FLOOR);
}

export type RegularMetricGridMetrics = {
  step: number;
  cellMeters: number;
  latStep: number;
  lonStep: number;
};

export function getRegularMetricGridMetrics(zoom: number, _anchorLat: number): RegularMetricGridMetrics {
  const step = getDisplayGridStep(zoom);
  const cellMeters = AGID_BASE_CELL_METERS * step;
  const latStep = cellMeters / EARTH_METERS_PER_DEGREE;
  const lonStep = latStep;

  return { step, cellMeters, latStep, lonStep };
}

export function getAbsoluteGridAnchorCell(anchor: AbsoluteGridAnchorPoint, zoom: number) {
  const metrics = getRegularMetricGridMetrics(zoom, anchor.lat);
  const meters = getAbsoluteGridAnchorMeters(anchor);

  return {
    anchorId: anchor.id,
    col: Math.floor(meters.x / metrics.cellMeters),
    row: Math.floor(meters.y / metrics.cellMeters),
    step: metrics.step,
    cellMeters: metrics.cellMeters,
  };
}

export function regularMetricPointAt(col: number, row: number, metrics: RegularMetricGridMetrics): number[] {
  return absoluteGridMetersToLonLat(col * metrics.cellMeters, row * metrics.cellMeters);
}

export function regularMetricCellFromPoint(
  lat: number,
  lon: number,
  zoom: number,
  anchorLat = lat,
): number[][] {
  const metrics = getRegularMetricGridMetrics(zoom, anchorLat);
  const point = lonLatToAbsoluteGridMeters(lat, lon);
  const col = Math.floor(point.x / metrics.cellMeters);
  const row = Math.floor(point.y / metrics.cellMeters);
  const sw = regularMetricPointAt(col, row, metrics);
  const se = regularMetricPointAt(col + 1, row, metrics);
  const ne = regularMetricPointAt(col + 1, row + 1, metrics);
  const nw = regularMetricPointAt(col, row + 1, metrics);

  return [sw, se, ne, nw, sw];
}

export function getGridRenderRange(zoom: number) {
  if (zoom > 18) return 100;
  if (zoom > 15) return 70;
  return 40;
}

export function metricSquareCellFromCenter(lat: number, lon: number, sizeMeters: number): number[][] {
  const halfLat = (sizeMeters / 2) / EARTH_METERS_PER_DEGREE;
  const cosLat = Math.max(0.05, Math.cos(lat * Math.PI / 180));
  const halfLon = (sizeMeters / 2) / (EARTH_METERS_PER_DEGREE * cosLat);

  return [
    [normalizeLongitude(lon - halfLon), lat - halfLat],
    [normalizeLongitude(lon + halfLon), lat - halfLat],
    [normalizeLongitude(lon + halfLon), lat + halfLat],
    [normalizeLongitude(lon - halfLon), lat + halfLat],
    [normalizeLongitude(lon - halfLon), lat - halfLat],
  ];
}

export function toUndirectedSegmentKey(a: number[], b: number[], precision = 10) {
  const forward = `${a[0].toFixed(precision)}_${a[1].toFixed(precision)}_${b[0].toFixed(precision)}_${b[1].toFixed(precision)}`;
  const reverse = `${b[0].toFixed(precision)}_${b[1].toFixed(precision)}_${a[0].toFixed(precision)}_${a[1].toFixed(precision)}`;
  return forward < reverse ? forward : reverse;
}
