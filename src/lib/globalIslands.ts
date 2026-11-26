import manifest from '../data/global-islands/manifest.json';
import { globalIslandParts } from './globalIslandParts';
import { classifyMapPolygon, indexMapPolygon, type IndexedMapPolygon } from './indexedMapPolygon';

export interface IslandUnitMetadata {
  id: string;
  name: string;
  code: string | null;
  sovereignCode: string | null;
  disputed: boolean;
}

export const globalIslandUnits: readonly IslandUnitMetadata[] = manifest.units;
const unitsById = new Map(globalIslandUnits.map(unit => [unit.id, unit]));
export const getIslandUnitMetadata = (id: string) => unitsById.get(id);
export const globalIslandCoverage = manifest.counts;
export const globalIslandSource = { source: manifest.source, version: manifest.version };

export interface GlobalIslandMatch {
  source: string;
  version: string;
  relation: 'inside' | 'boundary';
  codes: string[];
  sovereignCodes: string[];
  unitIds: string[];
  disputed: boolean;
}

type PackedPolygon = [unit: number, w: number, s: number, e: number, n: number, ...rings: string[]];
type Bounds = [number, number, number, number];
type Extent = { bbox: Bounds; row: PackedPolygon };
type Geometry = { rings: number[][][]; indexed: IndexedMapPolygon };

const SCALE = manifest.coordinateScale;
const TILE = 2;
const COLUMNS = 360 / TILE;
const ROWS = 180 / TILE;
const extents: Extent[] = [];
const tiles = new Map<number, number[]>();
const latBin = (lat: number) => Math.max(0, Math.min(ROWS - 1, Math.floor((lat + 90) / TILE)));
const lonBin = (x: number) => Math.floor((x + 180) / TILE);
const key = (x: number, y: number) => y * COLUMNS + ((x % COLUMNS) + COLUMNS) % COLUMNS;

for (const shard of globalIslandParts as PackedPolygon[][]) {
  for (const row of shard) {
    const [w, s, e, n] = row.slice(1, 5).map(value => Number(value) / SCALE);
    const index = extents.length;
    extents.push({ row, bbox: [w, s, e, n] });
    for (let y = latBin(s); y <= latBin(n); y++) {
      for (let x = lonBin(w); x <= lonBin(e); x++) {
        const tile = key(x, y);
        const list = tiles.get(tile);
        if (list) list.push(index);
        else tiles.set(tile, [index]);
      }
    }
  }
}

function unpackRing(encoded: string): number[][] {
  const bytes = atob(encoded);
  const points: number[][] = [];
  let offset = 0, x = 0, y = 0;
  function next() {
    let total = 0, factor = 1, byte: number;
    do {
      byte = bytes.charCodeAt(offset++);
      total += (byte & 127) * factor;
      factor *= 128;
    } while (byte >= 128);
    return total % 2 ? -(total + 1) / 2 : total / 2;
  }
  while (offset < bytes.length) {
    x += next();
    y += next();
    points.push([x / SCALE, y / SCALE]);
  }
  points.push(points[0]);
  return points;
}

// Keep a bounded number of decoded polygons while panning a mobile map.
const geometries = new Map<number, Geometry>();
function geometry(index: number): Geometry {
  let value = geometries.get(index);
  if (value) return value;
  const { bbox, row } = extents[index];
  const rings = (row.slice(5) as string[]).map(unpackRing);
  value = { rings, indexed: indexMapPolygon({ bbox, rings }) };
  if (geometries.size >= 128) geometries.delete(geometries.keys().next().value!);
  geometries.set(index, value);
  return value;
}

function canonical(lon: number) {
  if (lon >= -180 && lon < 180) return lon;
  const mod = lon % 360;
  return mod < -180 ? mod + 360 : mod >= 180 ? mod - 360 : mod;
}

/** Source-view attribution at the original point. Missing shapes yield no country. */
export function matchGlobalIsland(lat: number, lon: number): GlobalIslandMatch | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)) return undefined;
  const longitude = canonical(lon);
  const tile = tiles.get(key(lonBin(longitude), latBin(lat)));
  if (!tile) return undefined;
  const ids = new Set<string>(), codes = new Set<string>(), sovereigns = new Set<string>();
  let boundary = false, disputed = false;
  for (const i of tile) {
    const { bbox: [w, s, e, n], row } = extents[i];
    const x = longitude + 360 * Math.round(((w + e) / 2 - longitude) / 360);
    if (x < w || x > e || lat < s || lat > n) continue;
    const hit = classifyMapPolygon(x, lat, geometry(i).indexed);
    if (hit === 'outside') continue;
    const unit = globalIslandUnits[row[0]];
    ids.add(unit.id);
    if (unit.code) codes.add(unit.code);
    if (unit.sovereignCode) sovereigns.add(unit.sovereignCode);
    boundary ||= hit === 'boundary';
    disputed ||= unit.disputed;
  }
  if (!ids.size) return undefined;
  return { ...globalIslandSource, relation: boundary ? 'boundary' : 'inside',
    unitIds: [...ids].sort(), codes: [...codes].sort(), sovereignCodes: [...sovereigns].sort(), disputed };
}

/** Exact political rings for intersecting bounding boxes, including holes and
 * continuous (unwrapped) antimeridian edges. The caller tests its true footprint. */
export function* queryGlobalIslandPolygons(disk: number[]) {
  const [w, s, rawE, n] = disk;
  if (disk.length !== 4 || !disk.every(Number.isFinite) || n < s || s > 90 || n < -90) return;
  const e = rawE < w ? rawE + 360 : rawE;
  const seen = new Set<number>();
  const firstX = lonBin(w);
  const lastX = Math.min(lonBin(e), firstX + COLUMNS - 1);
  for (let y = latBin(s); y <= latBin(n); y++) {
    for (let x = firstX; x <= lastX; x++) {
      for (const i of tiles.get(key(x, y)) ?? []) {
        if (seen.has(i)) continue;
        seen.add(i);
        const { row, bbox } = extents[i];
        const [west, south, east, north] = bbox;
        if (north < s || south > n) continue;
        const shift = 360 * Math.round((w + e - west - east) / 720);
        if (east + shift < w || west + shift > e) continue;
        const unit = globalIslandUnits[row[0]];
        yield { bbox, rings: geometry(i).rings, codes: unit.code ? [unit.code] : [],
          unitIds: [unit.id], sovereignCodes: unit.sovereignCode ? [unit.sovereignCode] : [], disputed: unit.disputed };
      }
    }
  }
}
