import {
  calculateTopographicAreaKm2,
  longitudeSpanDegrees,
  type TopographicBounds,
} from './topographicExport';

type Position = [number, number];

type ExploreFeature = {
  type: 'Feature';
  properties: {
    kind: 'selection' | 'grid' | 'focus';
    part?: number;
  };
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: Position | Position[] | Position[][];
  };
};

export type TopographicExploreMapGeoJson = {
  type: 'FeatureCollection';
  features: ExploreFeature[];
};

const MAX_LATITUDE = 85;

function normalizeLongitude(value: number) {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 && value > 0 ? 180 : normalized;
}

function isFiniteBounds(bounds: TopographicBounds) {
  return Object.values(bounds).every(Number.isFinite)
    && bounds.south >= -MAX_LATITUDE
    && bounds.north <= MAX_LATITUDE
    && bounds.south < bounds.north
    && bounds.west >= -180
    && bounds.west <= 180
    && bounds.east >= -180
    && bounds.east <= 180
    && longitudeSpanDegrees(bounds) > 0
    && longitudeSpanDegrees(bounds) < 360;
}

function polygonRing(west: number, east: number, south: number, north: number): Position[] {
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
}

function horizontalSegments(
  bounds: TopographicBounds,
  latitude: number,
): Position[][] {
  if (bounds.west <= bounds.east) {
    return [[[bounds.west, latitude], [bounds.east, latitude]]];
  }
  return [
    [[bounds.west, latitude], [180, latitude]],
    [[-180, latitude], [bounds.east, latitude]],
  ];
}

function selectionPolygons(bounds: TopographicBounds) {
  if (bounds.west <= bounds.east) {
    return [polygonRing(bounds.west, bounds.east, bounds.south, bounds.north)];
  }
  return [
    polygonRing(bounds.west, 180, bounds.south, bounds.north),
    polygonRing(-180, bounds.east, bounds.south, bounds.north),
  ];
}

function selectionCenter(bounds: TopographicBounds): Position {
  const span = longitudeSpanDegrees(bounds);
  return [
    normalizeLongitude(bounds.west + span / 2),
    (bounds.south + bounds.north) / 2,
  ];
}

/**
 * Creates a tiny, in-memory GeoJSON scene for direct-manipulation selection.
 * It intentionally contains only the current public map extent and a local
 * reference grid; it has no external tile URL, address, recipient, AOID, or
 * source geometry.
 */
export function buildTopographicExploreMapGeoJson(
  bounds: TopographicBounds,
): TopographicExploreMapGeoJson {
  if (!isFiniteBounds(bounds)) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features: ExploreFeature[] = selectionPolygons(bounds).map((ring, index) => ({
    type: 'Feature',
    properties: { kind: 'selection', part: index },
    geometry: { type: 'Polygon', coordinates: [ring] },
  }));
  const span = longitudeSpanDegrees(bounds);
  for (let index = 1; index < 3; index += 1) {
    const longitude = normalizeLongitude(bounds.west + (span * index) / 3);
    features.push({
      type: 'Feature',
      properties: { kind: 'grid' },
      geometry: {
        type: 'LineString',
        coordinates: [[longitude, bounds.south], [longitude, bounds.north]],
      },
    });
    const latitude = bounds.south + ((bounds.north - bounds.south) * index) / 3;
    for (const segment of horizontalSegments(bounds, latitude)) {
      features.push({
        type: 'Feature',
        properties: { kind: 'grid' },
        geometry: { type: 'LineString', coordinates: segment },
      });
    }
  }
  features.push({
    type: 'Feature',
    properties: { kind: 'focus' },
    geometry: { type: 'Point', coordinates: selectionCenter(bounds) },
  });
  return { type: 'FeatureCollection', features };
}

/**
 * Normalizes a MapLibre viewport into the export contract without accepting a
 * world-wrap or polar extent that cannot be represented by the local export.
 */
export function topographicExploreBoundsFromViewport(input: {
  south: number;
  west: number;
  north: number;
  east: number;
}): TopographicBounds | null {
  if (!Object.values(input).every(Number.isFinite)) return null;
  const bounds: TopographicBounds = {
    south: input.south,
    west: normalizeLongitude(input.west),
    north: input.north,
    east: normalizeLongitude(input.east),
  };
  return isFiniteBounds(bounds) ? bounds : null;
}

export function topographicExploreAreaKm2(bounds: TopographicBounds) {
  return isFiniteBounds(bounds) ? calculateTopographicAreaKm2(bounds) : null;
}

export function canApplyTopographicExploreViewport(
  bounds: TopographicBounds,
  maximumAreaKm2: number,
) {
  const areaKm2 = topographicExploreAreaKm2(bounds);
  return areaKm2 !== null
    && Number.isFinite(maximumAreaKm2)
    && maximumAreaKm2 > 0
    && areaKm2 <= maximumAreaKm2 + 1e-9;
}
