import indexData from '../data/europe-frontier-sides/index.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';
import { unpackMapRing } from './packedMapRing';
import type { PostalContextPosition } from './postalContextSpatial';

type Shape = [code: string, bbox: number[], encodedRings: string[]];
type Page = [tile: number, shapes: Shape[]][];
const index = indexData as Record<string, number>;
const scale = 1e7;
const tiles = 8;
const cache = new Map<Shape, ReturnType<typeof prepare>>();

function prepare(shape: Shape) {
  let points: number[][][] | undefined;
  const polygon = {
    bbox: shape[1].map(v => v / scale),
    get rings() { return points ??= shape[2].map(ring => unpackMapRing(ring, scale)); },
  };
  return { polygon, indexed: indexMapPolygon(polygon) };
}

export async function europeanFrontierSides(box: number[], center: PostalContextPosition, point: boolean,
  touches: (ax: number, ay: number, bx: number, by: number) => boolean) {
  const xmin = Math.floor((box[0]-1e-10)*tiles), xmax = Math.floor((box[2]+1e-10)*tiles);
  const ymin = Math.floor((box[1]-1e-10)*tiles), ymax = Math.floor((box[3]+1e-10)*tiles);
  if ((xmax-xmin+1)*(ymax-ymin+1) > 512) return;
  const wanted = new Map<number,number>();
  const ids = new Set<number>();
  for (let x = xmin; x <= xmax; x++) {
    for (let y = ymin; y <= ymax; y++) {
      const column = ((x + 180*tiles) % (360*tiles) + 360*tiles) % (360*tiles);
      const key = (y+90*tiles)*360*tiles+column;
      if (index[key] === undefined) return;
      wanted.set(key,(x-column+180*tiles)/tiles);
      ids.add(index[key]);
    }
  }
  const codes = new Set<string>();
  let masked = false;
  const pages = await Promise.all([...ids].map(id => import(`../data/europe-frontier-sides/sides-${id}.json`)));
  for (const module of pages) {
    for (const [key, shapes] of module.default as Page) {
      const shift = wanted.get(key);
      if (shift === undefined) continue;
      for (const shape of shapes) {
        const [code,b] = shape;
        if (b[0]/scale+shift>box[2]+1e-9 || b[2]/scale+shift<box[0]-1e-9 ||
            b[1]/scale>box[3]+1e-9 || b[3]/scale<box[1]-1e-9) continue;
        let part = cache.get(shape);
        if (!part) {
          part = prepare(shape);
          if (cache.size >= 128) cache.delete(cache.keys().next().value!);
          cache.set(shape,part);
        }
        const centerInShape = classifyMapPolygon(center[0]-shift,center[1],part.indexed) !== 'outside';
        const hit = centerInShape || (!point && part.polygon.rings.some(ring => ring.some(([x,y],i) =>
          i>0 && touches(ring[i-1][0]+shift,ring[i-1][1],x+shift,y))));
        if (hit && code === '*') masked = true;
        else if (hit) codes.add(code);
      }
    }
  }
  return {codes: [...codes].sort(), masked};
}
