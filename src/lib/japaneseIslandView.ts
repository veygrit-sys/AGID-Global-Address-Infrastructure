import data from '../data/japaneseIslandView.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';

export const japaneseIslandSource = {
  source: data.manifest.source,
  version: data.manifest.version,
  attribution: data.manifest.attribution,
};
export type JapaneseIslandGroup = 'northern-territories' | 'takeshima' | 'senkaku';
type NorthernIsland = 'etorofu' | 'kunashiri' | 'shikotan' | 'habomai';
type Subgroup = NorthernIsland | 'takeshima' | 'senkaku';
type PackedPolygon = [number[], ...string[]];
interface PackedGroup {
  name: Subgroup;
  bbox: number[];
  scale: number;
  polygons: PackedPolygon[];
}

const groupCodes = { 'northern-territories': 'JP_NT', takeshima: 'JP_TK', senkaku: 'JP_SK' } as const;
const groups = data.groups as PackedGroup[];
const kunashiri = groups.find(group => group.name === 'kunashiri')!.bbox;
const etorofu = groups.find(group => group.name === 'etorofu')!.bbox;
// The passage between Kunashiri and Etorofu lies outside both island envelopes.
// The source contains every N03 municipality in this narrow connecting strip.
const passage = [kunashiri[2], Math.max(kunashiri[1], etorofu[1]),
  etorofu[0], Math.min(kunashiri[3], etorofu[3])];

function unpackRing(packed: string, scale: number): number[][] {
  let x = 0, y = 0, i = 0;
  const points: number[][] = [];
  function readDelta(): number {
    let value = 0, place = 1, digit: number;
    do {
      digit = packed.charCodeAt(i++) - 63;
      value += (digit & 31) * place;
      place *= 32;
    } while (digit >= 32);
    return value % 2 ? -(value + 1) / 2 : value / 2;
  }
  while (i < packed.length) {
    x += readDelta();
    y += readDelta();
    points.push([x / scale, y / scale]);
  }
  points.push(points[0]);
  return points;
}

function unpack(row: PackedPolygon, scale: number) {
  const [bbox, ...packed] = row;
  const rings = packed.map(ring => unpackRing(ring, scale));
  return { ...japaneseIslandSource, bbox, rings, codes: ['JP'], index: indexMapPolygon({ bbox, rings }) };
}

const cache = new WeakMap<PackedPolygon, ReturnType<typeof unpack>>();
function geometry(row: PackedPolygon, scale: number) {
  let shape = cache.get(row);
  if (!shape) {
    shape = unpack(row, scale);
    cache.set(row, shape);
  }
  return shape;
}

function inBox(lat: number, lon: number, [west, south, east, north]: number[], margin = 0) {
  return lon >= west - margin && lon <= east + margin && lat >= south - margin && lat <= north + margin;
}

/** Restrict lower-resolution sources around each independently selected island/group.
 * A hit here alone never establishes an island, land/water, country, or route. */
export function isJapaneseIslandReviewArea(lat: number, lon: number) {
  return inBox(lat, lon, passage, 0.025) || groups.some(group => inBox(lat, lon, group.bbox, 0.025));
}

/** The active territorial view follows Japan's published position. Only positive
 * land geometry establishes a region. No buffer or surrounding sea is assigned to JP. */
export function matchJapaneseIslandView(lat: number, lon: number) {
  for (const subset of groups) {
    if (!inBox(lat, lon, subset.bbox)) continue;
    for (const row of subset.polygons) {
      if (!inBox(lat, lon, row[0])) continue;
      const relation = classifyMapPolygon(lon, lat, geometry(row, subset.scale).index);
      if (relation === 'outside') continue;
      const group: JapaneseIslandGroup = subset.name === 'takeshima' || subset.name === 'senkaku'
        ? subset.name : 'northern-territories';
      return { ...japaneseIslandSource, code: 'JP' as const, group, subgroup: subset.name,
        legacyRegionCode: groupCodes[group], relation };
    }
  }
  return undefined;
}

/** Bounding-box query for the uncertainty-disk contact solver. The input longitude
 * interval may be unwrapped as well as antimeridian-crossing. Rings use WGS84. */
export function* queryJapaneseIslandPolygons(disk: number[]) {
  const [west, south, rawEast, north] = disk;
  const east = rawEast < west ? rawEast + 360 : rawEast;
  function overlaps([w, s, e, n]: number[]) {
    if (s > north || n < south) return false;
    const turns = Math.round(((east + west) - (e + w)) / 720);
    return w + 360 * turns <= east && e + 360 * turns >= west;
  }
  for (const group of groups) {
    if (!overlaps(group.bbox)) continue;
    for (const row of group.polygons) {
      if (overlaps(row[0])) yield geometry(row, group.scale);
    }
  }
}
