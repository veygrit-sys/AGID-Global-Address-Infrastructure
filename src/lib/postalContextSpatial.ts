import type {
  PostalContextAssertionQuality,
  PostalContextGeometryAuthority,
  PostalContextSource,
  PostalContextTimeRange,
} from './postalContextGraph';

export const POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION = 'postal-context-geometry/v0.1' as const;

export type PostalContextPosition = readonly [longitude: number, latitude: number];
export type PostalContextLinearRing = readonly PostalContextPosition[];
export type PostalContextPolygonCoordinates = readonly PostalContextLinearRing[];

export type PostalContextPointGeometry = {
  type: 'Point';
  coordinates: PostalContextPosition;
};

export type PostalContextPolygonGeometry = {
  type: 'Polygon';
  coordinates: PostalContextPolygonCoordinates;
};

export type PostalContextMultiPolygonGeometry = {
  type: 'MultiPolygon';
  coordinates: readonly PostalContextPolygonCoordinates[];
};

export type PostalContextGeoJsonGeometry =
  | PostalContextPointGeometry
  | PostalContextPolygonGeometry
  | PostalContextMultiPolygonGeometry;

export type PostalContextGeometryRole =
  | 'postal_area'
  | 'address_point'
  | 'building_footprint'
  | 'entrance_point';

export type PostalContextGeometryPublicationClass =
  | 'public_context'
  | 'public_civic_address'
  | 'public_building'
  | 'public_facility';

export type PostalContextGeometryFeature = {
  id: string;
  nodeId: string;
  role: PostalContextGeometryRole;
  publicationClass: PostalContextGeometryPublicationClass;
  geometry: PostalContextGeoJsonGeometry;
  source: PostalContextSource;
  validTime: PostalContextTimeRange;
  knownTime: PostalContextTimeRange;
  quality: PostalContextAssertionQuality;
  /** Maximum source-authorized coordinate-to-address match radius. Never inferred by the API. */
  matchRadiusMeters?: number;
};

export type PostalContextGeometryCollection = {
  schemaVersion: typeof POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION;
  countryCode: string;
  releaseId: string;
  features: readonly PostalContextGeometryFeature[];
};

export type PostalContextSpatialRelation = 'inside' | 'boundary' | 'outside';

export type PostalContextGeometryValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const BOUNDARY_EPSILON = 1e-10;
const EARTH_RADIUS_METERS = 6_371_008.8;

function instantValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validTimeRange(range: PostalContextTimeRange) {
  const from = instantValue(range.from);
  const to = range.to ? instantValue(range.to) : null;
  return from !== null && (!range.to || (to !== null && from < to));
}

function instantInRange(value: string, range: PostalContextTimeRange) {
  const instant = instantValue(value);
  const from = instantValue(range.from);
  const to = range.to ? instantValue(range.to) : null;
  return instant !== null && from !== null && (!range.to || to !== null)
    && instant >= from && (to === null || instant < to);
}

function validPosition(position: PostalContextPosition) {
  return position.length === 2
    && Number.isFinite(position[0])
    && Number.isFinite(position[1])
    && position[0] >= -180
    && position[0] <= 180
    && position[1] >= -90
    && position[1] <= 90;
}

function samePosition(a: PostalContextPosition, b: PostalContextPosition) {
  return a[0] === b[0] && a[1] === b[1];
}

function validateRing(
  ring: PostalContextLinearRing,
  featureId: string,
  ringId: string,
  errors: string[],
) {
  if (ring.length < 4) errors.push(`geometry-ring-too-short:${featureId}:${ringId}`);
  if (ring.length && !samePosition(ring[0], ring[ring.length - 1])) {
    errors.push(`geometry-ring-not-closed:${featureId}:${ringId}`);
  }
  ring.forEach((position, index) => {
    if (!validPosition(position)) errors.push(`invalid-geometry-position:${featureId}:${ringId}:${index}`);
  });
}

function validateGeometry(
  feature: PostalContextGeometryFeature,
  errors: string[],
) {
  const { geometry } = feature;
  if (geometry.type === 'Point') {
    if (!validPosition(geometry.coordinates)) errors.push(`invalid-geometry-position:${feature.id}:point`);
    return;
  }

  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.coordinates;
  if (!polygons.length) errors.push(`geometry-polygon-empty:${feature.id}`);
  polygons.forEach((polygon, polygonIndex) => {
    if (!polygon.length) errors.push(`geometry-rings-empty:${feature.id}:${polygonIndex}`);
    polygon.forEach((ring, ringIndex) => {
      validateRing(ring, feature.id, `${polygonIndex}:${ringIndex}`, errors);
    });
  });
}

function geometryAuthorityPresent(authority: PostalContextGeometryAuthority) {
  return authority !== 'none';
}

export function validatePostalContextGeometryCollection(
  collection: PostalContextGeometryCollection,
): PostalContextGeometryValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  if (collection.schemaVersion !== POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION) {
    errors.push(`unsupported-geometry-schema:${collection.schemaVersion}`);
  }
  if (!/^[A-Z]{2}$/.test(collection.countryCode)) errors.push('invalid-geometry-country-code');
  if (!collection.releaseId) errors.push('geometry-release-id-required');
  if (!collection.features.length) warnings.push('geometry-collection-empty');

  for (const feature of collection.features) {
    if (!feature.id) errors.push('geometry-feature-id-required');
    if (ids.has(feature.id)) errors.push(`duplicate-geometry-feature:${feature.id}`);
    ids.add(feature.id);
    if (!feature.nodeId) errors.push(`geometry-node-id-required:${feature.id}`);
    if (!feature.source.sourceId) errors.push(`geometry-source-required:${feature.id}`);
    if (!geometryAuthorityPresent(feature.source.geometryAuthority)) {
      errors.push(`geometry-authority-required:${feature.id}`);
    }
    if (!validTimeRange(feature.validTime)) errors.push(`invalid-geometry-valid-time:${feature.id}`);
    if (!validTimeRange(feature.knownTime)) errors.push(`invalid-geometry-known-time:${feature.id}`);
    if (feature.quality.confidence !== undefined
      && (!Number.isFinite(feature.quality.confidence)
        || feature.quality.confidence < 0
        || feature.quality.confidence > 1)) {
      errors.push(`invalid-geometry-confidence:${feature.id}`);
    }
    if (feature.matchRadiusMeters !== undefined
      && (!Number.isFinite(feature.matchRadiusMeters)
        || feature.matchRadiusMeters < 0
        || feature.matchRadiusMeters > 25)) {
      errors.push(`invalid-address-point-match-radius:${feature.id}`);
    }
    if (feature.role !== 'address_point' && feature.matchRadiusMeters !== undefined) {
      errors.push(`match-radius-only-valid-for-address-point:${feature.id}`);
    }
    if (feature.role === 'address_point' && feature.matchRadiusMeters === undefined) {
      errors.push(`address-point-match-radius-required:${feature.id}`);
    }
    const validPublicationClass =
      (feature.role === 'postal_area' && feature.publicationClass === 'public_context')
      || (feature.role === 'address_point'
        && (feature.publicationClass === 'public_civic_address'
          || feature.publicationClass === 'public_facility'))
      || (feature.role === 'building_footprint'
        && (feature.publicationClass === 'public_building'
          || feature.publicationClass === 'public_facility'))
      || (feature.role === 'entrance_point' && feature.publicationClass === 'public_facility');
    if (!validPublicationClass) errors.push(`invalid-geometry-publication-class:${feature.id}`);
    if ((feature.role === 'postal_area' || feature.role === 'building_footprint')
      && geometryIsPoint(feature.geometry)) {
      errors.push(`polygon-role-requires-polygon:${feature.id}`);
    }
    if ((feature.role === 'address_point' || feature.role === 'entrance_point')
      && !geometryIsPoint(feature.geometry)) {
      errors.push(`point-role-requires-point:${feature.id}`);
    }
    validateGeometry(feature, errors);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function isPostalContextGeometryEffectiveAt(
  feature: PostalContextGeometryFeature,
  validAt: string,
  knownAt: string = validAt,
) {
  return instantInRange(validAt, feature.validTime)
    && instantInRange(knownAt, feature.knownTime);
}

export function geometryIsPoint(
  geometry: PostalContextGeoJsonGeometry,
): geometry is PostalContextPointGeometry {
  return geometry.type === 'Point';
}

function pointOnSegment(
  point: PostalContextPosition,
  a: PostalContextPosition,
  b: PostalContextPosition,
) {
  const cross = (point[1] - a[1]) * (b[0] - a[0])
    - (point[0] - a[0]) * (b[1] - a[1]);
  const scale = Math.max(1, Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  if (Math.abs(cross) > BOUNDARY_EPSILON * scale) return false;
  return point[0] >= Math.min(a[0], b[0]) - BOUNDARY_EPSILON
    && point[0] <= Math.max(a[0], b[0]) + BOUNDARY_EPSILON
    && point[1] >= Math.min(a[1], b[1]) - BOUNDARY_EPSILON
    && point[1] <= Math.max(a[1], b[1]) + BOUNDARY_EPSILON;
}

function pointInRing(
  point: PostalContextPosition,
  ring: PostalContextLinearRing,
): PostalContextSpatialRelation {
  let inside = false;
  for (let i = 0, previous = ring.length - 1; i < ring.length; previous = i++) {
    const a = ring[previous];
    const b = ring[i];
    if (pointOnSegment(point, a, b)) return 'boundary';
    const crossesLatitude = (a[1] > point[1]) !== (b[1] > point[1]);
    if (crossesLatitude) {
      const crossingLongitude = ((b[0] - a[0]) * (point[1] - a[1]))
        / (b[1] - a[1]) + a[0];
      if (point[0] < crossingLongitude) inside = !inside;
    }
  }
  return inside ? 'inside' : 'outside';
}

function pointInPolygon(
  point: PostalContextPosition,
  polygon: PostalContextPolygonCoordinates,
): PostalContextSpatialRelation {
  if (!polygon.length) return 'outside';
  const outer = pointInRing(point, polygon[0]);
  if (outer !== 'inside') return outer;
  for (const hole of polygon.slice(1)) {
    const relation = pointInRing(point, hole);
    if (relation === 'boundary') return 'boundary';
    if (relation === 'inside') return 'outside';
  }
  return 'inside';
}

export function locatePointInGeometry(
  point: PostalContextPosition,
  geometry: PostalContextGeoJsonGeometry,
): PostalContextSpatialRelation {
  if (geometry.type === 'Point') {
    return samePosition(point, geometry.coordinates) ? 'boundary' : 'outside';
  }
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let inside = false;
  for (const polygon of polygons) {
    const relation = pointInPolygon(point, polygon);
    if (relation === 'boundary') return 'boundary';
    if (relation === 'inside') inside = true;
  }
  return inside ? 'inside' : 'outside';
}

function radians(value: number) {
  return value * Math.PI / 180;
}

export function haversineDistanceMeters(
  a: PostalContextPosition,
  b: PostalContextPosition,
) {
  const latitudeDelta = radians(b[1] - a[1]);
  const longitudeDelta = radians(b[0] - a[0]);
  const latitudeA = radians(a[1]);
  const latitudeB = radians(b[1]);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
}
