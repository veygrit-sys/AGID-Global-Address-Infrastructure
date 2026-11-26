import band0 from '../data/minorIslands/band0.json';
import band1 from '../data/minorIslands/band1.json';
import band2 from '../data/minorIslands/band2.json';
import band3 from '../data/minorIslands/band3.json';
import band4 from '../data/minorIslands/band4.json';
import band5 from '../data/minorIslands/band5.json';
import band6 from '../data/minorIslands/band6.json';
import band7 from '../data/minorIslands/band7.json';
import manifest from '../data/minorIslands/manifest.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';

type PackedRow = [number, number[], string[], Array<[number, string[] | null]>];
export interface MinorIslandPolygon {
  featureId: number;
  bbox: number[];
  rings: number[][][];
  codes: string[];
  sovereignCodes: string[];
}
export interface MinorIslandMatch {
  featureId: number;
  codes: string[];
  sovereignCodes: string[];
  relation: 'inside' | 'boundary';
  source: string;
  version: string;
}

export const minorIslandSource = { source: manifest.source, version: manifest.version };
const administrativeSources = {
  source: manifest.source + '+' + manifest.adminSource, version: manifest.version + '+' + manifest.adminVersion,
};
const rows = [band0, band1, band2, band3, band4, band5, band6, band7] as unknown as PackedRow[][];
const cellSize = 2;
const columns = 360 / cellSize;
const grid = new Map<number, PackedRow[]>();

function eachCell(bounds: number[], visit: (key: number) => void) {
  const [west, south, rawEast, north] = bounds;
  const east = rawEast < west ? rawEast + 360 : rawEast;
  const x0 = Math.floor((west + 180) / cellSize);
  const x1 = Math.min(x0 + columns - 1, Math.floor((east + 180) / cellSize));
  const y0 = Math.max(0, Math.floor((south + 90) / cellSize));
  const y1 = Math.min(180 / cellSize - 1, Math.floor((north + 90) / cellSize));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      visit(y * columns + ((x % columns) + columns) % columns);
    }
  }
}

function intersects(b: number[], query: number[]) {
  const [west, south, rawEast, north] = query;
  if (b[1] > north || b[3] < south) return false;
  const east = rawEast < west ? rawEast + 360 : rawEast;
  const shift = 360 * Math.round((west + east - b[0] - b[2]) / 720);
  return b[2] + shift >= west && b[0] + shift <= east;
}

const boxes = new Map<number, number[]>();
for (const band of rows) {
  for (const row of band) {
    const bbox = row[1].map(n => n / manifest.scale);
    boxes.set(row[0], bbox);
    eachCell(bbox, key => {
      const bucket = grid.get(key);
      if (bucket) bucket.push(row);
      else grid.set(key, [row]);
    });
  }
}

function unpackRing(encoded: string) {
  const ring: number[][] = [];
  let offset = 0;
  function read() {
    let packed = 0;
    let multiplier = 1;
    let digit;
    do {
      digit = encoded.charCodeAt(offset++) - 63;
      packed += (digit & 31) * multiplier;
      multiplier *= 32;
    } while (digit >= 32);
    return (packed & 1) ? -(packed + 1) / 2 : packed / 2;
  }
  let x = 0;
  let y = 0;
  while (offset < encoded.length) {
    x += read();
    y += read();
    ring.push([x / manifest.scale, y / manifest.scale]);
  }
  return ring;
}

function hydrate(row: PackedRow) {
  const [featureId, , physical, assigned] = row;
  const full = assigned.find(([, rings]) => rings === null);
  function build(encoded: string[], unit?: number) {
    const rings = encoded.map(unpackRing);
    const bbox = boxes.get(featureId)!;
    const [code, sovereign] = unit === undefined ? [] : manifest.units[unit];
    const polygon: MinorIslandPolygon = { featureId, bbox, rings, codes: code ? [code] : [], sovereignCodes: sovereign ? [sovereign] : [] };
    return { polygon, index: indexMapPolygon(polygon) };
  }
  const parts = [build(physical, full?.[0])];
  for (const [unit, rings] of assigned) {
    if (rings) parts.push(build(rings, unit));
  }
  return parts;
}
// Bound retained shoreline detail while a mobile user pans across the world.
const decoded = new Map<PackedRow, ReturnType<typeof hydrate>>();
function getParts(row: PackedRow) {
  let parts = decoded.get(row);
  if (!parts) {
    parts = hydrate(row);
    if (decoded.size >= 128) decoded.delete(decoded.keys().next().value!);
    decoded.set(row, parts);
  }
  return parts;
}

/** Return the physical shell and any finer evidenced administrative parts intersecting the bounding box. */
export function queryMinorIslandPolygons(bounds: number[]): MinorIslandPolygon[] {
  const candidates = new Set<PackedRow>();
  if (bounds.length !== 4 || !bounds.every(Number.isFinite) || bounds[1] > bounds[3]) return [];
  eachCell(bounds, key => grid.get(key)?.forEach(row => candidates.add(row)));
  const polygons: MinorIslandPolygon[] = [];
  for (const row of candidates) {
    if (!intersects(boxes.get(row[0])!, bounds)) continue;
    for (const { polygon } of getParts(row)) polygons.push(polygon);
  }
  return polygons;
}

/** The shape of an island alone carries no country code. Use the actual administrative intersection. */
export function matchMinorIsland(lat: number, lon: number): MinorIslandMatch | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)) return;
  const x = lon >= -180 && lon < 180 ? lon : ((lon % 360 + 540) % 360) - 180;
  const cell = Math.floor((lat + 90) / cellSize) * columns + Math.floor((x + 180) / cellSize);
  const candidates = grid.get(cell);
  if (!candidates) return;
  let featureId: number | undefined;
  const codes = new Set<string>();
  const sovereignCodes = new Set<string>();
  let boundary = false;
  for (const row of candidates) {
    const [w, s, e, n] = boxes.get(row[0])!;
    if (x < w || x > e || lat < s || lat > n) continue;
    const parts = getParts(row);
    const surface = classifyMapPolygon(x, lat, parts[0].index);
    if (surface === 'outside') continue;
    featureId ??= row[0];
    for (let i = 0; i < parts.length; i++) {
      const { polygon, index } = parts[i];
      const relation = i === 0 ? surface : classifyMapPolygon(x, lat, index);
      if (relation === 'outside') continue;
      if (relation === 'boundary') boundary = true;
      polygon.codes.forEach(c => codes.add(c));
      polygon.sovereignCodes.forEach(c => sovereignCodes.add(c));
    }
  }
  if (featureId === undefined) return;
  return {
    ...(codes.size ? administrativeSources : minorIslandSource), featureId,
    codes: [...codes].sort(), sovereignCodes: [...sovereignCodes].sort(),
    relation: boundary ? 'boundary' : 'inside',
  };
}
