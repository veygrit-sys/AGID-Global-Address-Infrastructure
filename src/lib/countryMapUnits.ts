import data from '../data/countryMapUnits.json';

// Bounds and rings in this versioned subset use GeoJSON [longitude, latitude].
// The builder rejects polygons that would need antimeridian unwrapping.
const coveredCodes = new Set(data.units.map(unit => unit.code));

export function hasCountryMapUnit(code?: string): boolean {
  return code !== undefined && coveredCodes.has(code);
}

type RingRelation = 'outside' | 'inside' | 'boundary';
export interface CountryMapUnitMatch {
  source: string;
  version: string;
  relation: 'inside' | 'boundary';
  // Limited to units present in the pinned subset. Sorted by ISO alpha-2.
  codes: string[];
}

// Tolerance for floating point arithmetic only, in degrees. Meter-scale
// uncertainty of a user pin or a source boundary is a separate concern.
const EPSILON = 1e-12;

// A horizontal ray only crosses edges spanning its latitude. Index the original
// edges in quarter-degree bands without simplifying any coordinates.
function indexRing(points: number[][]) {
  const edges = new Map<number, number[]>();
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1][1], b = points[i][1];
    const last = Math.floor((Math.max(a, b) + EPSILON) * 4);
    for (let band = Math.floor((Math.min(a, b) - EPSILON) * 4); band <= last; band++) {
      const indices = edges.get(band);
      if (indices) indices.push(i);
      else edges.set(band, [i]);
    }
  }
  return { points, edges };
}

const units = data.units.map(unit => ({
  code: unit.code,
  polygons: unit.polygons.map(p => ({ bbox: p.bbox, rings: p.rings.map(indexRing) })),
}));
const boxes = units.flatMap(unit => unit.polygons.map(p => p.bbox));
const west = Math.min(...boxes.map(b => b[0])), east = Math.max(...boxes.map(b => b[2]));
const south = Math.min(...boxes.map(b => b[1])), north = Math.max(...boxes.map(b => b[3]));

function classifyRing(x: number, y: number, ring: ReturnType<typeof indexRing>): RingRelation {
  let inside = false;
  // The pinned source uses closed rings, so the last edge ends at ring[0].
  for (const i of ring.edges.get(Math.floor(y * 4)) ?? []) {
    const [ax, ay] = ring.points[i - 1];
    const [bx, by] = ring.points[i];
    if (y < Math.min(ay, by) - EPSILON || y > Math.max(ay, by) + EPSILON) continue;
    if (x >= Math.min(ax, bx) - EPSILON && x <= Math.max(ax, bx) + EPSILON) {
      const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      if (Math.abs(cross) <= EPSILON * (Math.abs(bx - ax) + Math.abs(by - ay))) return 'boundary';
    }
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
  }
  return inside ? 'inside' : 'outside';
}

function classifyPolygon(x: number, y: number, polygon: typeof units[number]['polygons'][number]): RingRelation {
  const [w, s, e, n] = polygon.bbox;
  if (x < w - EPSILON || x > e + EPSILON || y < s - EPSILON || y > n + EPSILON) return 'outside';

  const exterior = classifyRing(x, y, polygon.rings[0]);
  if (exterior !== 'inside') return exterior;
  for (let i = 1; i < polygon.rings.length; i++) {
    const hole = classifyRing(x, y, polygon.rings[i]);
    if (hole === 'boundary') return 'boundary';
    if (hole === 'inside') return 'outside';
  }
  return 'inside';
}

export function matchCountryMapUnits(lat: number, lon: number): CountryMapUnitMatch | undefined {
  if (lon < west - EPSILON || lon > east + EPSILON || lat < south - EPSILON || lat > north + EPSILON) return undefined;
  const codes: string[] = [];
  let relation: CountryMapUnitMatch['relation'] = 'inside';
  for (const unit of units) {
    for (const polygon of unit.polygons) {
      const result = classifyPolygon(lon, lat, polygon);
      if (result === 'outside') continue;
      codes.push(unit.code);
      if (result === 'boundary') relation = 'boundary';
      break;
    }
  }
  if (codes.length === 0) return undefined;
  return { source: data.manifest.source_id, version: data.manifest.source_version, relation, codes: codes.sort() };
}
