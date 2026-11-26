// Degrees of tolerance for floating point arithmetic only. Source-map and GPS
// uncertainty are evaluated separately in meters.
const EPSILON = 1e-12;
export type MapPolygonRelation = 'outside' | 'inside' | 'boundary';

function indexRing(points: number[][]) {
  let south = Infinity, north = -Infinity;
  for (const [, lat] of points) {
    south = Math.min(south,lat);
    north = Math.max(north,lat);
  }
  const count = Math.min(256, Math.max(1, Math.ceil((points.length-1)/16)));
  const scale = north > south ? count/(north-south) : 0;
  const band = (lat: number) => Math.max(0,Math.min(count-1,Math.floor((lat-south)*scale)));
  const edges: number[][] = Array.from({length:count}, () => []);
  for (let i = 1; i < points.length; i++) {
    const a = points[i-1][1], b = points[i][1];
    const last = band(Math.max(a,b)+EPSILON);
    for (let j=band(Math.min(a,b)-EPSILON); j<=last; j++) edges[j].push(i);
  }
  return {points,edges,band};
}

export function indexMapPolygon(polygon: { bbox: number[]; rings: number[][][] }) {
  let rings: ReturnType<typeof indexRing>[] | undefined;
  return {
    bbox: polygon.bbox,
    get rings() { return rings ??= polygon.rings.map(indexRing); },
  };
}
export type IndexedMapPolygon = ReturnType<typeof indexMapPolygon>;

function classifyRing(x: number, y: number, ring: ReturnType<typeof indexRing>): MapPolygonRelation {
  let inside = false;
  for (const i of ring.edges[ring.band(y)]) {
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

/** x, y and polygon must use the same continuous longitude domain. */
export function classifyMapPolygon(x: number, y: number, polygon: IndexedMapPolygon): MapPolygonRelation {
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

// Query longitudes are unwrapped around the disk's center. Windows themselves are split at ±180°.
export function overlapsWrappedMapBounds([west, south, east, north]: number[], [w, s, e, n]: number[]) {
  if (south > n || north < s) return false;
  const shift = 360 * Math.round((w + e - west - east) / 720);
  return east + shift >= w && west + shift <= e;
}
