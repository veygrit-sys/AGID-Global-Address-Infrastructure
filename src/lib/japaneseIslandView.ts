import data from '../data/japaneseIslandView.json';
import remoteData from '../data/japaneseRemoteIslands.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';

export const japaneseIslandSource = {
  source: data.manifest.source,
  version: data.manifest.version,
  attribution: data.manifest.attribution,
};
export type JapaneseIslandGroup = 'northern-territories' | 'takeshima' | 'senkaku';
type NorthernIsland = 'etorofu' | 'kunashiri' | 'shikotan' | 'habomai';
type Subgroup = NorthernIsland | 'takeshima' | 'senkaku';
type RemoteIsland = 'okinotorishima' | 'minamitorishima' | 'nishinoshima';
type PackedPolygon = [number[], ...string[]];
interface PackedGroup<Name extends string> {
  name: Name;
  bbox: number[];
  scale: number;
  polygons: PackedPolygon[];
}

const groupCodes = { 'northern-territories': 'JP_NT', takeshima: 'JP_TK', senkaku: 'JP_SK' } as const;
const groups = data.groups as PackedGroup<Subgroup>[];
const remote = remoteData.groups as PackedGroup<RemoteIsland>[];
const allGroups = [...groups, ...remote];
const remoteSource = {
  source: remoteData.manifest.source, version: remoteData.manifest.version, attribution: remoteData.manifest.attribution,
};
const remoteNames = { okinotorishima: '沖ノ鳥島', minamitorishima: '南鳥島', nishinoshima: '西之島' } as const;
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

function unpack(row: PackedPolygon, scale: number, source: typeof japaneseIslandSource) {
  const [bbox, ...packed] = row;
  const rings = packed.map(ring => unpackRing(ring, scale));
  return { ...source, bbox, rings, codes: ['JP'], index: indexMapPolygon({ bbox, rings }) };
}

const cache = new WeakMap<PackedPolygon, ReturnType<typeof unpack>>();
function geometry(row: PackedPolygon, scale: number, source: typeof japaneseIslandSource) {
  let shape = cache.get(row);
  if (!shape) {
    shape = unpack(row, scale, source);
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
  return inBox(lat, lon, passage, 0.025) || allGroups.some(group => inBox(lat, lon, group.bbox, 0.025));
}

/** The active territorial view follows Japan's published position. Only positive
 * land geometry establishes a region. No buffer or surrounding sea is assigned to JP. */
export function matchJapaneseIslandView(lat: number, lon: number) {
  const hit = matchGroup(groups, japaneseIslandSource, lat, lon);
  if (!hit) return undefined;
  const group: JapaneseIslandGroup = hit.name === 'takeshima' || hit.name === 'senkaku'
    ? hit.name : 'northern-territories';
  return { ...japaneseIslandSource, code: 'JP' as const, group, subgroup: hit.name,
    legacyRegionCode: groupCodes[group], relation: hit.relation };
}

/** Ordinary Japanese islands, independent of the three territorial-view groups. */
export function matchJapaneseRemoteIsland(lat: number, lon: number) {
  const hit = matchGroup(remote, remoteSource, lat, lon);
  if (!hit) return undefined;
  return { ...remoteSource, territory: hit.name, territoryJa: remoteNames[hit.name], relation: hit.relation };
}

function matchGroup<Name extends string>(subsets: PackedGroup<Name>[], source: typeof japaneseIslandSource,
  lat: number, lon: number) {
  for (const subset of subsets) {
    if (!inBox(lat, lon, subset.bbox)) continue;
    for (const row of subset.polygons) {
      if (!inBox(lat, lon, row[0])) continue;
      const relation = classifyMapPolygon(lon, lat, geometry(row, subset.scale, source).index);
      if (relation !== 'outside') return { name: subset.name, relation };
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
  for (const group of allGroups) {
    if (!overlaps(group.bbox)) continue;
    const source = group.name in remoteNames ? remoteSource : japaneseIslandSource;
    for (const row of group.polygons) {
      if (overlaps(row[0])) yield geometry(row, group.scale, source);
    }
  }
}
