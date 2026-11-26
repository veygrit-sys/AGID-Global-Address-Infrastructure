// Degrees of tolerance for floating point arithmetic only. Source-map and GPS
// uncertainty are evaluated separately in meters.
const EPSILON = 1e-12;
export type MapPolygonRelation = 'outside' | 'inside' | 'boundary';

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
