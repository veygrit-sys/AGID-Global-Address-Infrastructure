import scope from '../../scripts/data/europe-frontiers/scope.json';
import tilePages from '../data/europe-frontiers/index.json';
import { unpackMapLine } from './packedMapRing';

export interface FrontierFeature {
  id: string;
  source: string;
  kind: 'international' | 'reference' | 'water-line' | 'joint-limit' | 'signed-agreement' | 'demarcation' | 'survey' | 'marine';
  codes: string[];
  name: string;
  classification: string;
  parts: number;
  vertices: number;
  searchCodes?: string[];
  territories?: string[];
  sovereigns?: string[];
  territoryIds?: number[];
  note?: string;
  evidenceUrls?: string[];
}
type Block = [feature: number, bounds: number[], line: string, part: number, start: number];
const index = tilePages as Record<string, number[]>;
const scale = 1e7;
const epsilon = 1e-7;
const cache = new Map<Block, number[][]>();

export async function europeanFrontierCatalog(): Promise<readonly FrontierFeature[]> {
  return (await import('../data/europe-frontiers/catalog.json')).default as FrontierFeature[];
}

export async function frontiersForRegion(raw: string) {
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) throw new RangeError('Expected a two-letter country or territory code');
  const related = new Set([code, ...((scope.parentSearch as Record<string,string[]>)[code] ?? [])]);
  const matched = (await europeanFrontierCatalog()).filter(f => (f.searchCodes ?? f.codes).some(c => related.has(c)));
  return matched.map(f => structuredClone(f));
}

/** Query bounds and callback longitudes use the same continuous longitude interval. */
export async function europeanFrontiersTouching(box: number[], touches: (ax: number, ay: number, bx: number, by: number) => boolean) {
  const [w,s,e,n] = box;
  const pages = new Set<number>();
  for (let y = Math.floor(Math.max(-90,s-epsilon)/2); y <= Math.floor(Math.min(90,n+epsilon)/2); y++) {
    for (let x = Math.floor((w-epsilon)/2); x <= Math.floor((e+epsilon)/2); x++) {
      const key = (y+45)*180 + ((x+90)%180+180)%180;
      for (const id of index[key] ?? []) pages.add(id);
    }
  }
  if (!pages.size) return [];
  const found = new Set<number>();
  for (const mod of await Promise.all([...pages].map(id => import(`../data/europe-frontiers/lines-${id}.json`)))) {
    for (const block of mod.default as Block[]) {
      const [id,bounds,path] = block;
      if (found.has(id) || bounds[1]/scale > n+epsilon || bounds[3]/scale < s-epsilon) continue;
      const shift = 360*Math.round(((w+e)-(bounds[0]+bounds[2])/scale)/720);
      if (bounds[0]/scale+shift > e+epsilon || bounds[2]/scale+shift < w-epsilon) continue;
      let points = cache.get(block);
      if (!points) {
        points = unpackMapLine(path,scale);
        if (cache.size >= 512) cache.delete(cache.keys().next().value!);
        cache.set(block,points);
      }
      for (let i=1; i<points.length; i++) {
        const [x,y] = points[i-1], [u,v] = points[i];
        if (Math.min(x,u)+shift > e+epsilon || Math.max(x,u)+shift < w-epsilon ||
            Math.min(y,v)>n+epsilon || Math.max(y,v)<s-epsilon) continue;
        if (touches(x+shift,y,u+shift,v)) { found.add(id); break; }
      }
    }
  }
  if (!found.size) return [];
  const catalog = await europeanFrontierCatalog();
  return [...found].sort((a,b) => a-b).map(id => structuredClone(catalog[id]));
}
