import coverage from '../data/african-frontiers/coverage.json';
import naturalEarth from '../data/african-frontiers/natural-earth.json';
import zones from '../data/african-frontiers/policies.json';
import fm1 from '../data/african-frontiers/fieldmaps-1.json';
import fm2 from '../data/african-frontiers/fieldmaps-2.json';
import fm3 from '../data/african-frontiers/fieldmaps-3.json';
import fm4 from '../data/african-frontiers/fieldmaps-4.json';
import fm5 from '../data/african-frontiers/fieldmaps-5.json';
import fm6 from '../data/african-frontiers/fieldmaps-6.json';
import fm7 from '../data/african-frontiers/fieldmaps-7.json';
import fm8 from '../data/african-frontiers/fieldmaps-8.json';
import policies from '../../scripts/data/africa/mainland-policies.json';
import { matchGlobalLandform, isGlobalInlandWater, matchGlobalIsland } from './globalIslands';
import { matchTerritorialExclave } from './territorialExclaves';
import { matchMinorIsland } from './minorIslands';
import { unpackMapRing } from './packedMapRing';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';
import type { ReviewedGeographyMatch } from './reviewedGeography';

export interface BorderNotice {
  id: string;
  kind: string;
  name: string;
  ja: string;
  codes: string[];
  url: string;
}
type PolicyId = keyof typeof policies;
type Layer = 'natural-earth' | 'fieldmaps' | 'policy';
type Row = [string, number, number, number, number, ...string[]];
const source = 'african-mainland-frontiers';
const provenance = {
  source, version: 'Natural Earth v5.1.2 / FieldMaps USGS 2025-07-29 / GSHHG 2.3.7',
  attribution: 'Natural Earth; FieldMaps USGS/LSIB; GSHHG, Paul Wessel and Walter H. F. Smith.',
};
export const africanMainlandSource = source;
const size = coverage.tileDegrees;
const bin = (degrees: number) => Math.floor(degrees / size);
const key = (x: number, y: number) => y * (360 / size) + x;
const tiles = new Set(coverage.tiles.map(([x, y]) => key(x, y)));
const extent = [-18, -36, 53, 38];
const evidence = ['https://www.naturalearthdata.com/about/disputed-boundaries-policy/', 'https://fieldmaps.io/data/adm0/'];
function shape(row: Row, layer: Layer) {
  const [id, w, s, e, n, ...packed] = row;
  const bbox = [w,s,e,n].map(v => v / coverage.scale);
  let geometry: ReturnType<typeof indexMapPolygon> | undefined;
  return { id, layer, bbox, get geometry() {
    return geometry ??= indexMapPolygon({ bbox, rings: packed.map(r => unpackMapRing(r, coverage.scale)) });
  } };
}
type Shape = ReturnType<typeof shape>;
const index = new Map<number, Shape[]>();
for (const [layer, shards] of [
  ['natural-earth', [naturalEarth]], ['fieldmaps', [fm1, fm2, fm3, fm4, fm5, fm6, fm7, fm8]], ['policy', [zones]],
] as const) {
  for (const rows of shards) for (const row of rows as Row[]) {
    const feature = shape(row, layer);
    const [w, s, e, n] = feature.bbox;
    for (let y = bin(s); y <= bin(n); y++) for (let x = bin(w); x <= bin(e); x++) {
      const k = key(x, y);
      if (!tiles.has(k)) continue;
      const bucket = index.get(k);
      if (bucket) bucket.push(feature);
      else index.set(k, [feature]);
    }
  }
}

function tileRange([w, s, e, n]: number[]) {
  const shift = 360 * Math.round((w + e - extent[0] - extent[2]) / 720);
  return [bin(Math.max(extent[0], w-shift)), bin(Math.max(extent[1], s)),
    bin(Math.min(extent[2], e-shift)), bin(Math.min(extent[3], n))];
}
export function africanWindowsInBounds(bounds: number[]) {
  const windows = [];
  const [w,s,e,n] = tileRange(bounds);
  for (let y = s; y <= n; y++) for (let x = w; x <= e; x++) {
    if (tiles.has(key(x,y))) windows.push({ source, priority: -1, bbox: [x*size,y*size,(x+1)*size,(y+1)*size] });
  }
  return windows;
}
export function insideAfricanCoverage([w,s,e,n]: number[]) {
  if (w < extent[0] || s < extent[1] || e > extent[2] || n > extent[3]) return false;
  for (let y = bin(s); y <= bin(n); y++) for (let x = bin(w); x <= bin(e); x++) {
    if (!tiles.has(key(x,y))) return false;
  }
  return true;
}
function notice(id: PolicyId): BorderNotice {
  const {kind, name, ja, codes, url} = policies[id];
  return {id, kind, name, ja, codes: [...codes], url};
}

export function matchAfricanMainland(lat: number, lon: number): ReviewedGeographyMatch | undefined {
  if (lat < extent[1] || lat > extent[3] || lon < extent[0] || lon > extent[2]) return;
  const entries = index.get(key(bin(lon), bin(lat)));
  if (!entries) return;
  const ordinary = { 'natural-earth': new Set<string>(), fieldmaps: new Set<string>() };
  const policyIds = new Set<PolicyId>();
  let edge = false;
  for (const part of entries) {
    const hit = classifyMapPolygon(lon, lat, part.geometry);
    if (hit === 'outside') continue;
    edge ||= hit === 'boundary';
    if (part.layer === 'policy') policyIds.add(part.id as PolicyId);
    else ordinary[part.layer].add(part.id);
  }
  // The territorial unit and the dispute layer have different shoreline and border generalization.
  // Keep the status when either source places the point in one of these named map units.
  if (ordinary['natural-earth'].has('EH')) policyIds.add('western-sahara');
  if (ordinary['natural-earth'].has('BT_T')) policyIds.add('bir-tawil');
  const notices = [...policyIds].sort().map(notice);
  if (!notices.length && !ordinary['natural-earth'].size && !ordinary.fieldmaps.size) return;
  const physical = matchGlobalLandform(lat, lon);
  // Political polygons cross water. Existing island-specific records retain priority.
  if (physical?.kind === 'island' || matchTerritorialExclave(lat, lon)?.physicalDomain === 'island') return;
  const common = { ...provenance, evidenceUrls: evidence, relation: 'inside' as const };
  if (isGlobalInlandWater(lat, lon)) return {
    ...common, surface: 'water', waterKind: 'inland', codes: [], ownershipReview: false,
  };
  if (!physical && (matchGlobalIsland(lat, lon) || matchMinorIsland(lat, lon))) return;
  const mappedCodes = new Set([...ordinary['natural-earth'], ...ordinary.fieldmaps]);
  const disagreement = ordinary['natural-earth'].size !== ordinary.fieldmaps.size
    || [...ordinary['natural-earth']].some(c => !ordinary.fieldmaps.has(c));
  const candidates = new Set(notices.flatMap(n => n.codes));
  // On an actual shared edge the adjoining jurisdiction may be a third party to this location.
  // A boundary neighbourhood does not give that neighbour a claim to the disputed territory.
  if (!notices.length || edge) {
    for (const code of mappedCodes) if (code !== 'BT_T') candidates.add(code);
  }
  const codes = [...candidates].sort();
  const policy = notices.length === 1 ? policies[notices[0].id as PolicyId] : undefined;
  return {
    ...common, surface: physical ? 'land' : 'unknown', ...(physical && { landform: 'mainland' as const }),
    codes: physical || notices.length ? codes : [], relation: edge ? 'boundary' : 'inside',
    ...(!physical && !notices.length && codes.length > 1 && { adjacentRegions: codes }),
    ownershipReview: !physical || edge || disagreement || codes.length !== 1 || notices.length > 0,
    ...(notices.length && { borderNotices: notices }),
    ...(disagreement && !notices.length && { mapDisagreement: true }),
    ...(policy && 'prefix' in policy && { territoryPrefix: policy.prefix }),
  };
}

/** The bounded disk contacts the actual source rings, never a tile's cropping edge. */
export function* queryAfricanMainland(bounds: number[]) {
  const seen = new Set<Shape>();
  for (const { bbox: [x,y] } of africanWindowsInBounds(bounds)) {
    for (const part of index.get(key(bin(x),bin(y))) ?? []) {
      if (seen.has(part)) continue;
      seen.add(part);
      if (part.bbox[0] > bounds[2] || part.bbox[2] < bounds[0] || part.bbox[1] > bounds[3] || part.bbox[3] < bounds[1]) continue;
      yield { ...provenance, bbox: part.bbox, rings: part.geometry.rings.map(r => r.points),
        kind: part.layer === 'policy' ? 'policy' as const : 'admin' as const,
        codes: part.layer === 'policy' ? policies[part.id as PolicyId].codes : [part.id] };
    }
  }
}
