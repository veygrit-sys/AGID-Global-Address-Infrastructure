import windows from '../../scripts/data/europe-overview-windows.json';
import { landParts } from '../data/europe-overview/index';
import ocean from '../data/europe-overview/ocean.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';
import { unpackMapRing } from './packedMapRing';

export const europeLandSource = {
  source: 'europe-mediterranean-continental-map-units',
  version: 'FieldMaps USGS/LSIB 2025-07-29 + Natural Earth v5.1.2',
  attribution: 'FieldMaps USGS/LSIB international edition. Natural Earth.',
};
export const europeOceanSource = {
  source: 'europe-overseas-open-water', version: 'Natural Earth v5.1.2 + GSHHG 2.3.7 + FieldMaps USGS/LSIB 2025-07-29',
  attribution: 'Natural Earth. GSHHG © Paul Wessel and Walter H. F. Smith. FieldMaps USGS/LSIB.',
};
export const europeLandWindows = windows.filter(w => w.land);

function contains(box: number[], x: number, y: number) {
  return box[0] <= x && x <= box[2] && box[1] <= y && y <= box[3];
}
function overlaps(a: number[], b: number[]) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}
type Row = [index: number, window: number, code: string, bbox: number[]] | [index: number, ringIndex: number, fragment: string];
function makeUnit(window: number, code: string, bbox: number[]) {
  const packed: string[] = [];
  let decoded: number[][][] | undefined;
  const feature = { bbox, get rings() { return decoded ??= packed.map(r => unpackMapRing(r, 1e6)); } };
  return { indexed: indexMapPolygon(feature), code, coverage: windows[window].bbox, feature, packed };
}
const units: ReturnType<typeof makeUnit>[] = [];
const bins = new Map<number, number[]>();
const tile = (x: number, y: number) => y * 181 + x;
for (const page of landParts as unknown as Row[][]) {
  for (const row of page) {
    if (row.length === 3) {
      const [index, ri, fragment] = row;
      const packed = units[index].packed;
      packed[ri] = (packed[ri] ?? '') + fragment;
      continue;
    }
    const [index, window, code, bbox] = row;
    units[index] = makeUnit(window, code, bbox);
    for (let y = Math.floor(bbox[1]/2); y <= Math.floor(bbox[3]/2); y++) {
      for (let x = Math.floor(bbox[0]/2); x <= Math.floor(bbox[2]/2); x++) {
        const key = tile(x, y);
        const entries = bins.get(key);
        if (entries) entries.push(index);
        else bins.set(key, [index]);
      }
    }
  }
}

export function matchEuropeLandUnits(lat: number, lon: number) {
  if (!europeLandWindows.some(w => contains(w.bbox, lon, lat))) return;
  const codes = new Set<string>();
  let boundary = false;
  for (const index of bins.get(tile(Math.floor(lon/2), Math.floor(lat/2))) ?? []) {
    const unit = units[index];
    if (!contains(unit.coverage, lon, lat) || !contains(unit.feature.bbox, lon, lat)) continue;
    const relation = classifyMapPolygon(lon, lat, unit.indexed);
    if (relation === 'outside') continue;
    codes.add(unit.code);
    boundary ||= relation === 'boundary';
  }
  if (codes.size) return { ...europeLandSource, codes: [...codes].sort(), relation: boundary ? 'boundary' as const : 'inside' as const };
}

// The two mainland windows are away from the date line. A wrapped disk with
// center near ±180 can reach the Guianas/Europe only at very large radii.
export function* queryEuropeLandUnits(disk: number[]) {
  const seen = new Set<number>();
  for (const { bbox } of europeLandWindows) {
    if (!overlaps(bbox, disk)) continue;
    const west = Math.floor(Math.max(bbox[0], disk[0]) / 2), east = Math.floor(Math.min(bbox[2], disk[2]) / 2);
    const south = Math.floor(Math.max(bbox[1], disk[1]) / 2), north = Math.floor(Math.min(bbox[3], disk[3]) / 2);
    for (let y = south; y <= north; y++) {
      for (let x = west; x <= east; x++) {
        for (const index of bins.get(tile(x, y)) ?? []) {
          if (seen.has(index)) continue;
          seen.add(index);
          if (overlaps(units[index].feature.bbox, disk)) yield units[index];
        }
      }
    }
  }
}
export function inEuropeLandWindow(coverage: number[], lon: number, lat: number) {
  return contains(coverage, lon, lat);
}

const resolution = ocean.cellsPerDegree;
const bitmaps = windows.map(({ bbox }, i) => {
  const bytes = atob(ocean.bits[i]);
  const [w, s, e, n] = bbox;
  return { w, s, e, n, columns: (e - w) * resolution, bytes };
});

/** True only if one reviewed extent contains the whole rectangle and every touched tile is certified open water. */
export function isEuropeanOpenWater([west, south, east, north]: number[]): boolean {
  for (const map of bitmaps) {
    // East and south are half-open tile edges. At an outer boundary defer to other evidence.
    if (west < map.w || east >= map.e || south <= map.s || north > map.n) continue;
    const firstX = Math.floor((west - map.w) * resolution), lastX = Math.floor((east - map.w) * resolution);
    const firstY = Math.floor((map.n - north) * resolution), lastY = Math.floor((map.n - south) * resolution);
    let whole = true;
    for (let y = firstY; whole && y <= lastY; y++) {
      for (let x = firstX; x <= lastX; x++) {
        const bit = y * map.columns + x;
        if (!(map.bytes.charCodeAt(bit >> 3) & (1 << (bit & 7)))) { whole = false; break; }
      }
    }
    if (whole) return true;
  }
  return false;
}
