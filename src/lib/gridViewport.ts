type ViewportPoint = {
  lng?: number;
  lon?: number;
  lat: number;
} | [number, number];

export const GRID_VIEWPORT_MAX_METERS = Number.POSITIVE_INFINITY;
export const GRID_VIEWPORT_RENDER_PADDING_RATIO = 1.25;

function getLon(point: ViewportPoint) {
  return Array.isArray(point) ? point[0] : point.lng ?? point.lon ?? 0;
}

function getLat(point: ViewportPoint) {
  return Array.isArray(point) ? point[1] : point.lat;
}

function distanceMeters(a: ViewportPoint, b: ViewportPoint) {
  const radius = 6_371_000;
  const lat1 = getLat(a) * Math.PI / 180;
  const lat2 = getLat(b) * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLon = (getLon(b) - getLon(a)) * Math.PI / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function getViewportSpanMeters(points: ViewportPoint[]) {
  if (points.length < 4) return { widthMeters: Infinity, heightMeters: Infinity };

  return {
    widthMeters: Math.max(distanceMeters(points[0], points[1]), distanceMeters(points[3], points[2])),
    heightMeters: Math.max(distanceMeters(points[0], points[3]), distanceMeters(points[1], points[2])),
  };
}

export function shouldShowGridForViewport(points: ViewportPoint[], maxMeters = GRID_VIEWPORT_MAX_METERS) {
  if (points.length < 4) return false;
  if (!Number.isFinite(maxMeters)) return true;
  const { widthMeters } = getViewportSpanMeters(points);
  return widthMeters <= maxMeters;
}

export function getViewportSamplePixelCoordinates(width: number, height: number) {
  const right = Math.max(0, width);
  const bottom = Math.max(0, height);
  const midX = right / 2;
  const midY = bottom / 2;

  return [
    [0, 0],
    [right, 0],
    [right, bottom],
    [0, bottom],
    [midX, 0],
    [right, midY],
    [midX, bottom],
    [0, midY],
    [midX, midY],
  ];
}

export function getViewportGridBounds(points: ViewportPoint[], paddingRatio = 0.5): [[number, number], [number, number]] {
  const lons = points.map(getLon);
  const lats = points.map(getLat);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lonPad = (maxLon - minLon) * paddingRatio;
  const latPad = (maxLat - minLat) * paddingRatio;

  return [
    [minLon - lonPad, minLat - latPad],
    [maxLon + lonPad, maxLat + latPad],
  ];
}
