import manifest from '../data/territorial-exclaves/manifest.json';
import africa from '../data/territorial-exclaves/africa.json';
import arctic from '../data/territorial-exclaves/arctic.json';
import asia from '../data/territorial-exclaves/asia.json';
import europe from '../data/territorial-exclaves/europe.json';
import hostData from '../data/territorial-exclaves/hosts.json';
import swiss from '../data/buesingenBoundary.json';
import { matchBuesingenBoundary } from './buesingenBoundary';
import { classifyMapPolygon, indexMapPolygon, type IndexedMapPolygon } from './indexedMapPolygon';

export type TerritorialExclaveKind = 'enclave' | 'counter-enclave' | 'coastal-exclave' | 'exclave' | 'enclaved-state';

interface Source {
  source: string;
  version: string;
  attribution: string;
  evidenceUrls: string[];
}

export interface TerritorialExclaveFeature extends Source {
  id: string;
  name: string;
  nameJa: string;
  kind: TerritorialExclaveKind;
  code: string;
  /** All adjacent countries around this territory, including across enclosing lake water where applicable. */
  neighboringCodes: string[];
  physicalDomain: 'mainland' | 'island';
  /** Positive physical component required when more detailed island evidence is available. */
  gshhgPhysicalId?: string;
  /** Present only when independent physical-island geometry was positively intersected. */
  physicalIslandSource?: Source;
}

export interface TerritorialExclaveMatch extends TerritorialExclaveFeature {
  relation: 'inside' | 'boundary';
  /** Owner plus neighbors proven at this coordinate only. A coast does not imply an adjacent country. */
  boundaryCodes: string[];
}

export interface TerritorialAdministrationMatch extends Source {
  codes: string[];
  relation: 'inside' | 'boundary';
}

type SourceRow = [string, string, string[]];
type PolygonRow = [number, number[], string[]];
type BorderRow = [number, string, number[], string];
type HostRow = [[string, string, number[] | null], number[], string[]];

const sourceRows = manifest.sources as unknown as Record<string, SourceRow>;
function source(id: string): Source {
  const [version, attribution, urls] = sourceRows[id];
  return { source: id, version, attribution, evidenceUrls: urls };
}

export const territorialExclaveFeatures: readonly TerritorialExclaveFeature[] = manifest.features.map(feature => {
  const meta = source(feature.source);
  return {
    ...meta, id: feature.id, kind: feature.kind as TerritorialExclaveKind, code: feature.code,
    physicalDomain: ('sharedPhysicalId' in feature || 'physicalIslandId' in feature) ? 'island' : 'mainland',
    ...('sharedPhysicalId' in feature ? { gshhgPhysicalId: feature.sharedPhysicalId } :
      'physicalIslandId' in feature ? { gshhgPhysicalId: feature.physicalIslandId } : {}),
    name: feature.name, nameJa: feature.nameJa, neighboringCodes: feature.neighboringCodes,
    evidenceUrls: [...meta.evidenceUrls, ...feature.extraUrls],
    ...('physicalIslandId' in feature && {
      physicalIslandSource: {
        source: 'gshhg-full-lake-islands', version: '2.3.7',
        attribution: 'GSHHG (Paul Wessel and Walter H. F. Smith); UK Permanent Committee on Geographical Names.',
        evidenceUrls: ['https://www.soest.hawaii.edu/pwessel/gshhg/', ...feature.extraUrls],
      },
    }),
  };
});

const groups = [europe, asia, africa, arctic];
const polygons = groups.flatMap(g => g.polygons as unknown as PolygonRow[]).map(row => {
  if (territorialExclaveFeatures[row[0]].id !== 'buesingen') return row;
  // Keep exact outward bounds for the existing higher-precision official ring.
  const xs = swiss.ring.map(point => point[0]);
  const ys = swiss.ring.map(point => point[1]);
  const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  return [row[0], bounds, row[2]] as PolygonRow;
});
const borders = groups.flatMap(g => g.borders as unknown as BorderRow[]);
const hosts = hostData as unknown as HostRow[];
const scale = manifest.scale;
const epsilon = 1e-12;
const swissFeature = territorialExclaveFeatures.find(feature => feature.id === 'buesingen')!;

interface Tile {
  polygons: PolygonRow[];
  hosts: HostRow[];
  swiss: boolean;
}

// One-degree cells cover all unwrapped source extents. Include the arithmetic tolerance
// on both sides so a coordinate on a tile boundary sees every touching polygon.
const tiles = new Map<number, Tile>();
const tileKey = (x: number, y: number) => y * 361 + x;
function indexBounds([west, south, east, north]: number[], add: (tile: Tile) => void) {
  for (let y = Math.floor(south - epsilon); y <= Math.floor(north + epsilon); y++) {
    for (let x = Math.floor(west - epsilon); x <= Math.floor(east + epsilon); x++) {
      const key = tileKey(x, y);
      let tile = tiles.get(key);
      if (!tile) {
        tile = { polygons: [], hosts: [], swiss: false };
        tiles.set(key, tile);
      }
      add(tile);
    }
  }
}
for (const row of polygons) indexBounds(row[1], tile => tile.polygons.push(row));
for (const row of hosts) indexBounds(row[1], tile => tile.hosts.push(row));
indexBounds(swiss.bounds, tile => { tile.swiss = true; });

function tileAt(lat: number, lon: number) {
  return tiles.get(tileKey(Math.floor(lon), Math.floor(lat)));
}


function canonical(lon: number) {
  if (lon >= -180 && lon <= 180) return lon;
  return ((lon % 360 + 540) % 360) - 180;
}

function inBounds(x: number, y: number, [w, s, e, n]: number[]) {
  return x >= w - epsilon && x <= e + epsilon && y >= s - epsilon && y <= n + epsilon;
}

function unpack(encoded: string, close: boolean): number[][] {
  const raw = atob(encoded);
  let i = 0, x = 0, y = 0;
  function next() {
    let value = 0, shift = 1, byte: number;
    do {
      byte = raw.charCodeAt(i++);
      value += (byte & 127) * shift;
      shift *= 128;
    } while (byte > 127);
    return value % 2 === 0 ? value / 2 : -(value + 1) / 2;
  }
  const points: number[][] = [];
  while (i < raw.length) {
    x += next(); y += next();
    points.push([x / scale, y / scale]);
  }
  if (close) points.push(points[0]);
  return points;
}

const shapeCache = new WeakMap<object, { rings: number[][][]; indexed: IndexedMapPolygon }>();
function shape(row: PolygonRow | HostRow) {
  let value = shapeCache.get(row);
  if (!value) {
    const rings = typeof row[0] === 'number' && territorialExclaveFeatures[row[0]].id === 'buesingen'
      ? [swiss.ring] : row[2].map(line => unpack(line, true));
    value = { rings, indexed: indexMapPolygon({ bbox: row[1], rings }) };
    shapeCache.set(row, value);
  }
  return value;
}

// A source edge is recorded only when the owner and this neighboring country share both
// endpoints in the same edition. Consecutive edges for the same neighbor are stored together.
const lineCache = new WeakMap<BorderRow, number[][]>();
function onBorder(row: BorderRow, x: number, y: number) {
  if (!inBounds(x, y, row[2])) return false;
  let points = lineCache.get(row);
  if (!points) { points = unpack(row[3], false); lineCache.set(row, points); }
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    if (x < Math.min(ax, bx) - epsilon || x > Math.max(ax, bx) + epsilon ||
      y < Math.min(ay, by) - epsilon || y > Math.max(ay, by) + epsilon) continue;
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (Math.abs(cross) <= epsilon * (Math.abs(bx - ax) + Math.abs(by - ay))) return true;
  }
  return false;
}

function touchingCodes(feature: TerritorialExclaveFeature, index: number, lat: number, lon: number) {
  if (feature.source === 'kadaster-brk-bestuurlijke-gebieden' || feature.id === 'buesingen') {
    return [feature.code, ...feature.neighboringCodes].sort();
  }
  const codes = new Set([feature.code]);
  for (const border of borders) if (border[0] === index && onBorder(border, lon, lat)) codes.add(border[1]);
  return [...codes].sort();
}

function matchInTile(lat: number, lon: number, tile: Tile): TerritorialExclaveMatch | undefined {
  let boundary: TerritorialExclaveMatch | undefined;
  for (const row of tile.polygons) {
    if (!inBounds(lon, lat, row[1])) continue;
    const relation = classifyMapPolygon(lon, lat, shape(row).indexed);
    if (relation === 'outside') continue;
    const feature = territorialExclaveFeatures[row[0]];
    if (relation === 'inside') return { ...feature, relation, boundaryCodes: [feature.code] };
    if (!boundary || feature.kind === 'counter-enclave') {
      boundary = { ...feature, relation, boundaryCodes: touchingCodes(feature, row[0], lat, lon) };
    }
  }
  return boundary;
}

export function matchTerritorialExclave(lat: number, lon: number): TerritorialExclaveMatch | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)) return;
  lon = canonical(lon);
  const tile = tileAt(lat, lon);
  return tile && matchInTile(lat, lon, tile);
}

export function matchTerritorialAdministration(lat: number, lon: number): TerritorialAdministrationMatch | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)) return;
  lon = canonical(lon);
  const tile = tileAt(lat, lon);
  if (!tile) return;
  const feature = matchInTile(lat, lon, tile);
  if (feature) {
    return { source: feature.source, version: feature.version, attribution: feature.attribution,
      evidenceUrls: feature.evidenceUrls, codes: feature.boundaryCodes, relation: feature.relation };
  }
  const swissHit = tile.swiss && matchBuesingenBoundary(lat, lon);
  if (swissHit) return { ...source(swissFeature.source), relation: swissHit.relation, codes: swissHit.codes };
  let selectedCode: string | undefined;
  let selectedSource: string | undefined;
  for (const row of tile.hosts) {
    const [[code, id, window], bounds] = row;
    if (!inBounds(lon, lat, bounds)) continue;
    // Frame edges are an extraction artifact. Only strict interiors of positive host polygons qualify.
    if (window && (lon <= window[0] || lat <= window[1] || lon >= window[2] || lat >= window[3])) continue;
    if (classifyMapPolygon(lon, lat, shape(row).indexed) !== 'inside') continue;
    if (selectedCode && selectedCode !== code) return;
    selectedCode = code;
    selectedSource = id;
  }
  if (selectedCode && selectedSource) return { ...source(selectedSource), codes: [selectedCode], relation: 'inside' };
  return undefined;
}

/** Index candidate polygons for footprint classification, using continuous or wrapped longitudes. */
export function* queryTerritorialExclavePolygons(bounds: number[]) {
  const [west, south, rawEast, north] = bounds;
  if (bounds.length !== 4 || !bounds.every(Number.isFinite) || north < south) return;
  const east = rawEast < west ? rawEast + 360 : rawEast;
  const left = canonical(west);
  const singleTile = Math.floor(left) === Math.floor(left + (east - west)) && Math.floor(south) === Math.floor(north);
  const candidates = singleTile ? tileAt(south, left)?.polygons : polygons;
  if (!candidates) return;
  for (const row of candidates) {
    const [w, s, e, n] = row[1];
    if (n < south || s > north) continue;
    const shift = 360 * Math.round((west + east - w - e) / 720);
    if (e + shift < west || w + shift > east) continue;
    const feature = territorialExclaveFeatures[row[0]];
    yield { bbox: row[1], rings: shape(row).rings, codes: [feature.code], feature,
      source: feature.source, version: feature.version, attribution: feature.attribution };
  }
}
