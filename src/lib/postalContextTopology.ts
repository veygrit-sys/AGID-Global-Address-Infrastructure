import {
  locatePointInGeometry,
  type PostalContextGeoJsonGeometry,
  type PostalContextGeometryCollection,
  type PostalContextLinearRing,
  type PostalContextPolygonCoordinates,
  type PostalContextPosition,
} from './postalContextSpatial';

export const POSTAL_CONTEXT_PACK_LIMITS = {
  graphBytes: 32 * 1024 * 1024,
  geometryBytes: 64 * 1024 * 1024,
  nodes: 100_000,
  assertions: 500_000,
  features: 100_000,
  positions: 2_000_000,
  positionsPerRing: 20_000,
  topologyComparisons: 2_000_000,
  topologyErrors: 100,
} as const;

export type PostalContextBbox = readonly [
  minimumLongitude: number,
  minimumLatitude: number,
  maximumLongitude: number,
  maximumLatitude: number,
];

export type PostalContextTopologyValidation = {
  valid: boolean;
  errors: string[];
  positionCount: number;
};

const TOPOLOGY_EPSILON = 1e-12;

type TopologyValidationState = {
  errors: string[];
  budget: { remaining: number };
  aborted: boolean;
};

function addTopologyError(state: TopologyValidationState, error: string) {
  if (state.aborted) return;
  if (state.errors.length >= POSTAL_CONTEXT_PACK_LIMITS.topologyErrors - 1) {
    state.errors.push('geometry-topology-error-limit-exceeded');
    state.aborted = true;
    return;
  }
  state.errors.push(error);
}

function abortTopology(state: TopologyValidationState, error: string) {
  addTopologyError(state, error);
  state.aborted = true;
}

function abortForBudget(state: TopologyValidationState, id: string) {
  abortTopology(state, `geometry-topology-budget-exceeded:${id}`);
}

function samePosition(a: PostalContextPosition, b: PostalContextPosition) {
  return a[0] === b[0] && a[1] === b[1];
}

function signedRingArea(ring: PostalContextLinearRing) {
  let twiceArea = 0;
  for (let index = 1; index < ring.length; index += 1) {
    const previous = ring[index - 1];
    const current = ring[index];
    twiceArea += previous[0] * current[1] - current[0] * previous[1];
  }
  return twiceArea / 2;
}

function orientation(a: PostalContextPosition, b: PostalContextPosition, c: PostalContextPosition) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function pointOnSegment(point: PostalContextPosition, a: PostalContextPosition, b: PostalContextPosition) {
  return Math.abs(orientation(a, b, point)) <= TOPOLOGY_EPSILON
    && point[0] >= Math.min(a[0], b[0]) - TOPOLOGY_EPSILON
    && point[0] <= Math.max(a[0], b[0]) + TOPOLOGY_EPSILON
    && point[1] >= Math.min(a[1], b[1]) - TOPOLOGY_EPSILON
    && point[1] <= Math.max(a[1], b[1]) + TOPOLOGY_EPSILON;
}

function segmentsIntersect(
  a: PostalContextPosition,
  b: PostalContextPosition,
  c: PostalContextPosition,
  d: PostalContextPosition,
) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  if (((abC > TOPOLOGY_EPSILON && abD < -TOPOLOGY_EPSILON)
      || (abC < -TOPOLOGY_EPSILON && abD > TOPOLOGY_EPSILON))
    && ((cdA > TOPOLOGY_EPSILON && cdB < -TOPOLOGY_EPSILON)
      || (cdA < -TOPOLOGY_EPSILON && cdB > TOPOLOGY_EPSILON))) return true;
  return (Math.abs(abC) <= TOPOLOGY_EPSILON && pointOnSegment(c, a, b))
    || (Math.abs(abD) <= TOPOLOGY_EPSILON && pointOnSegment(d, a, b))
    || (Math.abs(cdA) <= TOPOLOGY_EPSILON && pointOnSegment(a, c, d))
    || (Math.abs(cdB) <= TOPOLOGY_EPSILON && pointOnSegment(b, c, d));
}

type Segment = {
  index: number;
  a: PostalContextPosition;
  b: PostalContextPosition;
  minimumLongitude: number;
  maximumLongitude: number;
  minimumLatitude: number;
  maximumLatitude: number;
};

function ringSegments(ring: PostalContextLinearRing): Segment[] {
  return ring.slice(1).map((point, index) => {
    const previous = ring[index];
    return {
      index,
      a: previous,
      b: point,
      minimumLongitude: Math.min(previous[0], point[0]),
      maximumLongitude: Math.max(previous[0], point[0]),
      minimumLatitude: Math.min(previous[1], point[1]),
      maximumLatitude: Math.max(previous[1], point[1]),
    };
  });
}

function adjacentSegments(left: number, right: number, segmentCount: number) {
  return Math.abs(left - right) <= 1
    || (left === 0 && right === segmentCount - 1)
    || (right === 0 && left === segmentCount - 1);
}

function ringsIntersect(
  left: PostalContextLinearRing,
  right: PostalContextLinearRing,
  budget: { remaining: number },
) {
  const firstSegments = ringSegments(left).sort((a, b) =>
    a.minimumLongitude - b.minimumLongitude || a.index - b.index);
  const secondSegments = ringSegments(right).sort((a, b) =>
    a.minimumLongitude - b.minimumLongitude || a.index - b.index);
  for (const first of firstSegments) {
    for (const second of secondSegments) {
      if (second.minimumLongitude > first.maximumLongitude) break;
      if (second.maximumLongitude < first.minimumLongitude) continue;
      if (first.maximumLatitude < second.minimumLatitude
        || second.maximumLatitude < first.minimumLatitude) continue;
      if (--budget.remaining < 0) return 'budget' as const;
      if (segmentsIntersect(first.a, first.b, second.a, second.b)) return true;
    }
  }
  return false;
}

function ringSelfIntersects(ring: PostalContextLinearRing, budget: { remaining: number }) {
  const segments = ringSegments(ring).sort((left, right) =>
    left.minimumLongitude - right.minimumLongitude || left.index - right.index);
  for (let leftIndex = 0; leftIndex < segments.length; leftIndex += 1) {
    const left = segments[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < segments.length; rightIndex += 1) {
      const right = segments[rightIndex];
      if (right.minimumLongitude > left.maximumLongitude) break;
      if (adjacentSegments(left.index, right.index, segments.length)) continue;
      if (--budget.remaining < 0) return 'budget' as const;
      if (left.maximumLatitude < right.minimumLatitude
        || right.maximumLatitude < left.minimumLatitude) continue;
      if (segmentsIntersect(left.a, left.b, right.a, right.b)) return true;
    }
  }
  return false;
}

function pointInRing(point: PostalContextPosition, ring: PostalContextLinearRing) {
  let inside = false;
  for (let index = 1; index < ring.length; index += 1) {
    const a = ring[index - 1];
    const b = ring[index];
    if (pointOnSegment(point, a, b)) return 'boundary' as const;
    if ((a[1] > point[1]) !== (b[1] > point[1])) {
      const crossingLongitude = ((b[0] - a[0]) * (point[1] - a[1]))
        / (b[1] - a[1]) + a[0];
      if (point[0] < crossingLongitude) inside = !inside;
    }
  }
  return inside ? 'inside' as const : 'outside' as const;
}

function validateRing(
  ring: PostalContextLinearRing,
  id: string,
  state: TopologyValidationState,
) {
  if (state.aborted) return;
  if (ring.length > POSTAL_CONTEXT_PACK_LIMITS.positionsPerRing) {
    addTopologyError(state, `geometry-ring-position-limit:${id}`);
    return;
  }
  const distinct = new Set(ring.slice(0, -1).map(position => `${position[0]}\u0000${position[1]}`));
  if (distinct.size < 3) addTopologyError(state, `geometry-ring-distinct-position-count:${id}`);
  for (let index = 1; index < ring.length; index += 1) {
    if (samePosition(ring[index - 1], ring[index])) {
      addTopologyError(state, `geometry-ring-consecutive-duplicate:${id}:${index}`);
      break;
    }
  }
  if (Math.abs(signedRingArea(ring)) <= TOPOLOGY_EPSILON) {
    addTopologyError(state, `geometry-ring-zero-area:${id}`);
  }
  if (state.aborted) return;
  const selfIntersection = ringSelfIntersects(ring, state.budget);
  if (selfIntersection === 'budget') abortForBudget(state, id);
  else if (selfIntersection) addTopologyError(state, `geometry-ring-self-intersection:${id}`);
}

function validatePolygon(
  polygon: PostalContextPolygonCoordinates,
  id: string,
  state: TopologyValidationState,
) {
  for (let index = 0; index < polygon.length; index += 1) {
    validateRing(polygon[index], `${id}:${index}`, state);
    if (state.aborted) return;
  }
  const outer = polygon[0];
  if (!outer?.length) return;
  for (let index = 1; index < polygon.length; index += 1) {
    const hole = polygon[index];
    if (!hole?.length) continue;
    const relation = pointInRing(hole[0], outer);
    if (relation !== 'inside') addTopologyError(state, `geometry-hole-outside-outer:${id}:${index}`);
    if (state.aborted) return;
    const outerIntersection = ringsIntersect(outer, hole, state.budget);
    if (outerIntersection === 'budget') {
      abortForBudget(state, `${id}:${index}`);
      return;
    }
    if (outerIntersection) addTopologyError(state, `geometry-hole-intersects-outer:${id}:${index}`);
    if (state.aborted) return;
    for (let other = 1; other < index; other += 1) {
      const intersection = ringsIntersect(polygon[other], hole, state.budget);
      if (intersection === 'budget') {
        abortForBudget(state, `${id}:${other}:${index}`);
        return;
      }
      if (intersection || pointInRing(hole[0], polygon[other]) === 'inside'
        || pointInRing(polygon[other][0], hole) === 'inside') {
        addTopologyError(state, `geometry-holes-overlap:${id}:${other}:${index}`);
      }
      if (state.aborted) return;
    }
  }
}

export function validatePostalContextGeometryTopology(
  collection: PostalContextGeometryCollection,
): PostalContextTopologyValidation {
  const state: TopologyValidationState = {
    errors: [],
    budget: { remaining: POSTAL_CONTEXT_PACK_LIMITS.topologyComparisons },
    aborted: false,
  };
  let positionCount = 0;
  for (const feature of collection.features) {
    if (state.aborted) break;
    if (feature.geometry.type === 'Point') {
      positionCount += 1;
      if (positionCount > POSTAL_CONTEXT_PACK_LIMITS.positions) {
        abortTopology(state, 'geometry-position-limit-exceeded');
      }
      continue;
    }
    const polygons = feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
    for (let index = 0; index < polygons.length; index += 1) {
      if (state.aborted) break;
      const polygon = polygons[index];
      positionCount += polygon.reduce((sum, ring) => sum + ring.length, 0);
      if (positionCount > POSTAL_CONTEXT_PACK_LIMITS.positions) {
        abortTopology(state, 'geometry-position-limit-exceeded');
        break;
      }
      let minimumLongitude = Number.POSITIVE_INFINITY;
      let maximumLongitude = Number.NEGATIVE_INFINITY;
      for (const ring of polygon) {
        for (const position of ring) {
          minimumLongitude = Math.min(minimumLongitude, position[0]);
          maximumLongitude = Math.max(maximumLongitude, position[0]);
        }
      }
      if (Number.isFinite(minimumLongitude) && maximumLongitude - minimumLongitude > 180) {
        addTopologyError(state, `geometry-antimeridian-unsupported:${feature.id}:${index}`);
      }
      validatePolygon(polygon, `${feature.id}:${index}`, state);
    }
  }
  return { valid: state.errors.length === 0, errors: state.errors, positionCount };
}

export function validPostalContextBbox(value: readonly number[]): value is PostalContextBbox {
  return value.length === 4
    && value.every(Number.isFinite)
    && value[0] >= -180
    && value[2] <= 180
    && value[1] >= -90
    && value[3] <= 90
    && value[0] < value[2]
    && value[1] < value[3];
}

export function postalContextGeometryBounds(
  geometry: PostalContextGeoJsonGeometry,
): PostalContextBbox {
  if (geometry.type === 'Point') {
    return [
      geometry.coordinates[0],
      geometry.coordinates[1],
      geometry.coordinates[0],
      geometry.coordinates[1],
    ];
  }
  let minimumLongitude = Number.POSITIVE_INFINITY;
  let minimumLatitude = Number.POSITIVE_INFINITY;
  let maximumLongitude = Number.NEGATIVE_INFINITY;
  let maximumLatitude = Number.NEGATIVE_INFINITY;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const position of ring) {
        minimumLongitude = Math.min(minimumLongitude, position[0]);
        minimumLatitude = Math.min(minimumLatitude, position[1]);
        maximumLongitude = Math.max(maximumLongitude, position[0]);
        maximumLatitude = Math.max(maximumLatitude, position[1]);
      }
    }
  }
  return [minimumLongitude, minimumLatitude, maximumLongitude, maximumLatitude];
}

function positionInBbox(position: PostalContextPosition, bbox: PostalContextBbox) {
  return position[0] >= bbox[0] && position[0] <= bbox[2]
    && position[1] >= bbox[1] && position[1] <= bbox[3];
}

function segmentIntersectsBbox(a: PostalContextPosition, b: PostalContextPosition, bbox: PostalContextBbox) {
  if (positionInBbox(a, bbox) || positionInBbox(b, bbox)) return true;
  const corners: PostalContextPosition[] = [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[1]],
    [bbox[2], bbox[3]],
    [bbox[0], bbox[3]],
  ];
  return corners.some((corner, index) =>
    segmentsIntersect(a, b, corner, corners[(index + 1) % corners.length]));
}

export function postalContextGeometryIntersectsBbox(
  geometry: PostalContextGeoJsonGeometry,
  bbox: PostalContextBbox,
) {
  const bounds = postalContextGeometryBounds(geometry);
  if (bounds[2] < bbox[0] || bbox[2] < bounds[0]
    || bounds[3] < bbox[1] || bbox[3] < bounds[1]) return false;
  if (geometry.type === 'Point') return positionInBbox(geometry.coordinates, bbox);
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const corners: PostalContextPosition[] = [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[1]],
    [bbox[2], bbox[3]],
    [bbox[0], bbox[3]],
  ];
  for (const polygon of polygons) {
    if (polygon.some(ring => ring.some(position => positionInBbox(position, bbox)))) return true;
    if (corners.some(corner => locatePointInGeometry(corner, { type: 'Polygon', coordinates: polygon }) !== 'outside')) {
      return true;
    }
    if (polygon.some(ring => ring.slice(1).some((position, index) =>
      segmentIntersectsBbox(ring[index], position, bbox)))) return true;
  }
  return false;
}
