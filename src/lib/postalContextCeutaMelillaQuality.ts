import { normalizeCeutaMelillaPostalCode } from './postalContextCountryPolicy';

type Position = [number, number];
type PolygonGeometry = { type: 'Polygon'; coordinates: Position[][] };
type MultiPolygonGeometry = { type: 'MultiPolygon'; coordinates: Position[][][] };

export type CeutaMelillaPostalScope = 'ceuta' | 'melilla';

export type CeutaMelillaGeometryAssessment = {
  valid: boolean;
  postalCode: string | null;
  scope: CeutaMelillaPostalScope | null;
  geometryType: 'Polygon' | 'MultiPolygon' | null;
  ringCount: number;
  positionCount: number;
  closedRingCount: number;
  zeroLengthSegments: number;
  duplicateNonTerminalPositions: number;
  selfIntersections: number;
  bbox: [number, number, number, number] | null;
  officialViewEvidence: boolean;
  productionEligible: false;
  reasons: string[];
};

const BOUNDS: Record<CeutaMelillaPostalScope, [number, number, number, number]> = {
  ceuta: [-5.45, 35.80, -5.15, 35.98],
  melilla: [-3.05, 35.20, -2.85, 35.35],
};

function samePosition(a: Position, b: Position) {
  return a[0] === b[0] && a[1] === b[1];
}

function orientation(a: Position, b: Position, c: Position) {
  return (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
}

function segmentsCross(a: Position, b: Position, c: Position, d: Position) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 !== 0 && o2 !== 0 && o3 !== 0 && Math.sign(o1) !== Math.sign(o2) && Math.sign(o3) !== Math.sign(o4);
}

function countSelfIntersections(ring: Position[]) {
  let count = 0;
  const segmentCount = Math.max(0, ring.length - 1);
  for (let first = 0; first < segmentCount; first += 1) {
    for (let second = first + 1; second < segmentCount; second += 1) {
      if (Math.abs(first - second) <= 1 || (first === 0 && second === segmentCount - 1)) continue;
      if (segmentsCross(ring[first], ring[first + 1], ring[second], ring[second + 1])) count += 1;
    }
  }
  return count;
}

export function classifyCeutaMelillaPostalScope(value: unknown): CeutaMelillaPostalScope | null {
  const postalCode = normalizeCeutaMelillaPostalCode(value);
  if (!postalCode) return null;
  return postalCode.startsWith('51') ? 'ceuta' : 'melilla';
}

export function assessCeutaMelillaOfficialViewFeature(feature: unknown): CeutaMelillaGeometryAssessment {
  const raw = feature as { properties?: { cod_postal?: unknown }; geometry?: PolygonGeometry | MultiPolygonGeometry };
  const postalCode = normalizeCeutaMelillaPostalCode(raw?.properties?.cod_postal);
  const scope = classifyCeutaMelillaPostalScope(postalCode);
  const geometry = raw?.geometry;
  const geometryType = geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon' ? geometry.type : null;
  const polygons = geometryType === 'Polygon'
    ? [(geometry as PolygonGeometry).coordinates]
    : geometryType === 'MultiPolygon'
      ? (geometry as MultiPolygonGeometry).coordinates
      : [];
  const rings = polygons.flat();
  const positions = rings.flat();
  const finitePositions = positions.filter(position => (
    Array.isArray(position) && position.length >= 2 &&
    Number.isFinite(position[0]) && Number.isFinite(position[1]) &&
    position[0] >= -180 && position[0] <= 180 && position[1] >= -90 && position[1] <= 90
  ));
  const bbox = finitePositions.length
    ? finitePositions.reduce<[number, number, number, number]>(
        (value, position) => [
          Math.min(value[0], position[0]),
          Math.min(value[1], position[1]),
          Math.max(value[2], position[0]),
          Math.max(value[3], position[1]),
        ],
        [Infinity, Infinity, -Infinity, -Infinity],
      )
    : null;
  const closedRingCount = rings.filter(ring => ring.length >= 4 && samePosition(ring[0], ring[ring.length - 1])).length;
  const zeroLengthSegments = rings.reduce((total, ring) => total + ring.slice(1)
    .filter((position, index) => samePosition(position, ring[index])).length, 0);
  const duplicateNonTerminalPositions = rings.reduce((total, ring) => {
    const nonTerminal = ring.slice(0, -1).map(position => position.join(','));
    return total + nonTerminal.length - new Set(nonTerminal).size;
  }, 0);
  const selfIntersections = rings.reduce((total, ring) => total + countSelfIntersections(ring), 0);
  const expectedBounds = scope ? BOUNDS[scope] : null;
  const insideScope = Boolean(bbox && expectedBounds &&
    bbox[0] >= expectedBounds[0] && bbox[1] >= expectedBounds[1] &&
    bbox[2] <= expectedBounds[2] && bbox[3] <= expectedBounds[3]);
  const reasons = [
    !postalCode && 'invalid-ea-postcode',
    !geometryType && 'not-polygon-or-multipolygon',
    rings.length === 0 && 'no-rings',
    finitePositions.length !== positions.length && 'non-finite-or-out-of-range-position',
    closedRingCount !== rings.length && 'unclosed-or-short-ring',
    zeroLengthSegments > 0 && 'zero-length-segment',
    duplicateNonTerminalPositions > 0 && 'duplicate-non-terminal-position',
    selfIntersections > 0 && 'self-intersection',
    !insideScope && 'postcode-prefix-and-territory-bbox-mismatch',
  ].filter(Boolean) as string[];
  return {
    valid: reasons.length === 0,
    postalCode,
    scope,
    geometryType,
    ringCount: rings.length,
    positionCount: positions.length,
    closedRingCount,
    zeroLengthSegments,
    duplicateNonTerminalPositions,
    selfIntersections,
    bbox,
    officialViewEvidence: Boolean(postalCode && geometryType),
    productionEligible: false,
    reasons,
  };
}
