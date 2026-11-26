import manifest from '../data/global-islands/manifest.json';
import sharedInteriors from '../data/global-islands/landform-shared-interiors.json';
import topology from '../data/global-islands/landform-components.json';
import { landformBounds, landformCertificate, regionalLandformCertificate, regionalLandformSource } from './globalLandformGrid';
import { inlandWaterParts } from './globalInlandWaterParts';
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
type Extent = { bbox: Bounds; row: PackedPolygon; scale: number };
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
  for (const original of shard) {
    const index = extents.length;
    const corrected = (topology.correctedRows as unknown as Record<string, PackedPolygon>)[index];
    const row = corrected ?? original;
    const scale = corrected ? 1_000_000_000 : SCALE;
    const [w, s, e, n] = row.slice(1, 5).map(value => Number(value) / scale);
    extents.push({ row, scale, bbox: [w, s, e, n] });
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

function unpackRing(encoded: string, scale: number): number[][] {
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
    points.push([x / scale, y / scale]);
  }
  points.push(points[0]);
  return points;
}

// Keep a bounded number of decoded polygons while panning a mobile map.
const geometries = new Map<number, Geometry>();
function geometry(index: number): Geometry {
  let value = geometries.get(index);
  if (value) return value;
  const { bbox, row, scale } = extents[index];
  const rings = (row.slice(5) as string[]).map(ring => unpackRing(ring, scale));
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

function* positiveIslandExtents(lat: number, longitude: number) {
  const tile = tiles.get(key(lonBin(longitude), latBin(lat)));
  for (const i of tile ?? []) {
    const { bbox: [w, s, e, n] } = extents[i];
    const x = longitude + 360 * Math.round(((w + e) / 2 - longitude) / 360);
    if (x < w || x > e || lat < s || lat > n) continue;
    const relation = classifyMapPolygon(x, lat, geometry(i).indexed);
    if (relation !== 'outside') yield { i, x, relation };
  }
}

/** Source-view attribution at the original point. Missing shapes yield no country. */
export function matchGlobalIsland(lat: number, lon: number): GlobalIslandMatch | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)) return undefined;
  const ids = new Set<string>(), codes = new Set<string>(), sovereigns = new Set<string>();
  let boundary = false, disputed = false;
  for (const { i, relation } of positiveIslandExtents(lat, canonical(lon))) {
    if (!ids.size && isGlobalInlandWater(lat,lon)) return undefined;
    const unit = globalIslandUnits[extents[i].row[0]];
    ids.add(unit.id);
    if (unit.code) codes.add(unit.code);
    if (unit.sovereignCode) sovereigns.add(unit.sovereignCode);
    boundary ||= relation === 'boundary';
    disputed ||= unit.disputed;
  }
  if (!ids.size) return undefined;
  return { ...globalIslandSource, relation: boundary ? 'boundary' : 'inside',
    unitIds: [...ids].sort(), codes: [...codes].sort(), sovereignCodes: [...sovereigns].sort(), disputed };
}

export interface GlobalLandformMatch {
  kind: 'island' | 'mainland';
  physicalId: string;
  relation: 'inside' | 'boundary';
  source: string;
  version: string;
  sharedIslandCountryCodes?: string[];
  attribution?: string;
}

function physical(component: number, relation: GlobalLandformMatch['relation']): GlobalLandformMatch {
  const shared = (topology.sharedCountries as Record<string, string[]>)[component];
  return {
    kind: topology.mainland.includes(component) ? 'mainland' : 'island',
    physicalId: `ne-land-v5.1.2:${component}`, relation, source: 'natural-earth-physical-land+hydrography',
    version: topology.version, attribution: 'Made with Natural Earth and GSHHG (Paul Wessel and Walter H. F. Smith).', ...(shared && { sharedIslandCountryCodes: [...shared] }),
  };
}

/** If the center is inside and no polygon edge can reach the closed rectangle,
 * all of the rectangle, including the uncertainty disk, stays on the same land. */
function awayFromEdges(rings: number[][][], bounds: number[], shift: number) {
  const [w,s,e,n] = bounds;
  const west = w + shift, east = e + shift;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1], b = ring[i];
      if (Math.min(a[0],b[0]) <= east && Math.max(a[0],b[0]) >= west &&
          Math.min(a[1],b[1]) <= n && Math.max(a[1],b[1]) >= s) return false;
    }
  }
  return true;
}

const sharedGeometry = new WeakMap<PackedPolygon, Geometry>();

function corroborated(component: number, relation: GlobalLandformMatch['relation'], lat: number, lon: number,
  bounds: number[], radius: number) {
  const pieces = (sharedInteriors as unknown as Record<string, PackedPolygon[]>)[component];
  if (!pieces) return physical(component,relation);
  for (const piece of pieces) {
    const bbox = piece.slice(1,5).map(x => Number(x)/SCALE);
    if (lon < bbox[0] || lat < bbox[1] || lon > bbox[2] || lat > bbox[3]) continue;
    let g = sharedGeometry.get(piece);
    if (!g) {
      const rings = (piece.slice(5) as string[]).map(r => unpackRing(r,SCALE));
      g = { rings, indexed: indexMapPolygon({bbox,rings}) };
      sharedGeometry.set(piece,g);
    }
    if (classifyMapPolygon(lon,lat,g.indexed) === 'inside' &&
        (radius===0 || awayFromEdges(g.rings,bounds,0))) return physical(component,relation);
  }
  // A shoreline discrepancy can place a neighbouring island inside the coarse
  // political polygon. Do not inherit the larger island's ID or shared countries.
}

const WATER_SCALE = 100_000_000;
const waterTiles = new Map<number, PackedPolygon[]>();
const waterGeometry = new WeakMap<PackedPolygon, Geometry>();
for (const shard of inlandWaterParts as unknown as PackedPolygon[][]) {
  for (const row of shard) {
    const [w,s,e,n] = row.slice(1,5).map(v => Number(v)/WATER_SCALE);
    for (let y=latBin(s); y<=latBin(n); y++) {
      for (let x=lonBin(w); x<=lonBin(e); x++) {
        const id = key(x,y);
        const found = waterTiles.get(id);
        if (found) found.push(row);
        else waterTiles.set(id,[row]);
      }
    }
  }
}

function withinReviewedWater(lat: number, longitude: number, bounds: number[], radius: number) {
  for (const row of waterTiles.get(key(lonBin(longitude),latBin(lat))) ?? []) {
    const [w,s,e,n] = row.slice(1,5).map(v => Number(v)/WATER_SCALE);
    const x = longitude + 360*Math.round(((w+e)/2-longitude)/360);
    if (x < w || lat < s || x > e || lat > n) continue;
    let g = waterGeometry.get(row);
    if (!g) {
      const rings = (row.slice(5) as string[]).map(r => unpackRing(r,WATER_SCALE));
      g = { rings, indexed: indexMapPolygon({bbox:[w,s,e,n],rings}) };
      waterGeometry.set(row,g);
    }
    if (classifyMapPolygon(x,lat,g.indexed) === 'inside' &&
        (radius === 0 || awayFromEdges(g.rings,bounds,x-longitude))) return true;
  }
  return false;
}

export const globalInlandWaterSource = {
  source: 'gshhg-inland-water', version: 'GSHHG 2.3.7',
  attribution: 'GSHHG: Paul Wessel and Walter H. F. Smith.',
};

export function mayTouchGlobalInlandWater(lat: number, lon: number, radiusMeters: number): boolean {
  if (!Number.isFinite(lat) || Math.abs(lat)>90 || !Number.isFinite(lon) ||
      !Number.isFinite(radiusMeters) || radiusMeters<=0) return false;
  const bounds = landformBounds(lat,canonical(lon),radiusMeters);
  if (regionalLandformCertificate(bounds)?.component !== undefined) return false;
  return landformCertificate(bounds).guarded;
}

let previousWaterPoint: { lat: number; lon: number; water: boolean } | undefined;

/** Positive inland-water cells exclude lake islands and all mapped shore contacts.
 * A river/shore guard alone never suppresses political island evidence. */
export function isGlobalInlandWater(lat: number, lon: number, radiusMeters = 0): boolean {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) ||
      !Number.isFinite(radiusMeters) || radiusMeters < 0) return false;
  const longitude = canonical(lon);
  const bounds = landformBounds(lat,longitude,radiusMeters);
  if (radiusMeters === 0 && previousWaterPoint?.lat === lat && previousWaterPoint.lon === longitude) {
    return previousWaterPoint.water;
  }
  const water = landformCertificate(bounds).inlandWater === true || withinReviewedWater(lat,longitude,bounds,radiusMeters);
  if (radiusMeters === 0) previousWaterPoint = { lat, lon: longitude, water };
  return water;
}

/** Positive physical map evidence at the pin or throughout the reported radius.
 * Missing evidence, excluded hydrography and overly broad footprints abstain. */
export function matchGlobalLandform(lat: number, lon: number, radiusMeters = 0): GlobalLandformMatch | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) ||
      !Number.isFinite(radiusMeters) || radiusMeters < 0) return undefined;
  const longitude = canonical(lon);
  const bounds = landformBounds(lat, longitude, radiusMeters);
  const detailed = regionalLandformCertificate(bounds);
  if (detailed) return detailed.component === undefined ? undefined :
    { ...physical(detailed.component, 'inside'), ...regionalLandformSource };
  const certificate = landformCertificate(bounds);
  if (certificate.guarded) return undefined;
  if (certificate.component !== undefined) return corroborated(certificate.component, 'inside', lat,longitude,bounds,radiusMeters);
  for (const { i, x, relation } of positiveIslandExtents(lat, longitude)) {
    if (radiusMeters === 0 || (relation === 'inside' && awayFromEdges(geometry(i).rings, bounds, x - longitude))) {
      return corroborated(topology.rowPhysicalIds[i], relation, lat,longitude,bounds,radiusMeters);
    }
  }
  return undefined;
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
