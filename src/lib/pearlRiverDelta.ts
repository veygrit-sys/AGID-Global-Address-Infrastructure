import data from '../data/pearlRiverDelta.json';
import asianCoasts from '../data/asianIslandCoasts.json';
import { classifyMapPolygon, indexMapPolygon, type IndexedMapPolygon } from './indexedMapPolygon';

interface PackedPolygon {
  bbox: number[];
  rings: string[];
  isolatedIsland?: boolean;
}

interface PilotWindow {
  name: string;
  bbox: number[];
  surfaces: Record<string, PackedPolygon[]>;
  crossCheckedSource?: { source_id: string; source_version: string; attribution: string };
}

export interface DeltaMapMatch {
  surface: 'land' | 'water' | 'unknown';
  relation: 'inside' | 'boundary';
  codes: string[];
  isolatedIsland?: boolean;
  requiresAgreement?: boolean;
  attribution?: string;
  source: string;
  version: string;
}

const landSource = { source: data.manifest.source_id, version: data.manifest.source_version };
const waterSources = {
  source: `${landSource.source}+${data.manifest.ocean.source_id}`,
  version: `${landSource.version}+${data.manifest.ocean.source_version}`,
};

// Base-32 signed deltas, [longitude, latitude], seven decimal places. Keep
// arithmetic outside JS signed bitwise overflow for the first longitude.
function unpackRing(text: string): number[][] {
  const ring: number[][] = [];
  let offset = 0;
  let x = 0;
  let y = 0;
  function nextDelta() {
    let packed = 0;
    let multiplier = 1;
    let digit: number;
    do {
      digit = text.charCodeAt(offset++) - 63;
      packed += (digit & 31) * multiplier;
      multiplier *= 32;
    } while (digit >= 32);
    return packed % 2 === 1 ? -(packed + 1) / 2 : packed / 2;
  }
  while (offset < text.length) {
    x += nextDelta();
    y += nextDelta();
    ring.push([x / data.scale, y / data.scale]);
  }
  return ring;
}

function lazyPolygon(code: string, packed: PackedPolygon) {
  let indexed: IndexedMapPolygon | undefined;
  function geometry() {
    indexed ??= indexMapPolygon({ bbox: packed.bbox, rings: packed.rings.map(unpackRing) });
    return indexed;
  }
  return { code, bbox: packed.bbox, geometry, isolatedIsland: packed.isolatedIsland };
}

/** Geometry access for uncertainty disks. Clip edges lie outside every lookup window. */
function indexWindows(windows: PilotWindow[]) {
  return windows.map(window => {
    const crossCheck = window.crossCheckedSource;
    const land = crossCheck ? {
      source: crossCheck.source_id, version: crossCheck.source_version, attribution: crossCheck.attribution,
    } : landSource;
    const water = crossCheck ? {
      source: land.source + '+' + data.manifest.ocean.source_id,
      version: land.version + '+' + data.manifest.ocean.source_version,
      attribution: crossCheck.attribution,
    } : waterSources;
    return {
      name: window.name, bbox: window.bbox, land, water, requiresAgreement: Boolean(crossCheck),
      polygons: Object.entries(window.surfaces).flatMap(([code, parts]) => parts.map(part => lazyPolygon(code, part))),
    };
  });
}

export const pearlRiverDeltaWindows = indexWindows(data.windows as PilotWindow[]);
export const regionalCoastWindows = [...pearlRiverDeltaWindows, ...indexWindows(asianCoasts.windows as PilotWindow[])];

function inBox(x: number, y: number, [w, s, e, n]: number[]) {
  return x >= w && x <= e && y >= s && y <= n;
}

/** Return point evidence only in the two reviewed windows. Water has no inferred country. */
export function matchPearlRiverDelta(lat: number, lon: number): DeltaMapMatch | undefined {
  return matchWindow(pearlRiverDeltaWindows, lat, lon);
}

export function matchRegionalCoast(lat: number, lon: number): DeltaMapMatch | undefined {
  return matchWindow(regionalCoastWindows, lat, lon);
}

function matchWindow(windows: typeof regionalCoastWindows, lat: number, lon: number): DeltaMapMatch | undefined {
  const window = windows.find(w => inBox(lon, lat, w.bbox));
  if (!window) return undefined;
  const countries = new Set<string>();
  let boundary = false;
  let isolatedIsland = false;
  let oceanInterior = false;
  for (const polygon of window.polygons) {
    if (!inBox(lon, lat, polygon.bbox)) continue;
    const relation = classifyMapPolygon(lon, lat, polygon.geometry());
    if (relation === 'outside') continue;
    if (polygon.code === 'water') {
      if (relation === 'inside') oceanInterior = true;
    } else {
      countries.add(polygon.code);
      isolatedIsland ||= polygon.isolatedIsland === true;
      if (relation === 'boundary') boundary = true;
    }
  }
  if (countries.size) return {
    ...window.land, surface: 'land', codes: [...countries].sort(), relation: boundary ? 'boundary' : 'inside',
    ...(window.requiresAgreement && { requiresAgreement: true }),
    ...(isolatedIsland && countries.size === 1 && { isolatedIsland: true }),
  };
  if (oceanInterior) return { ...window.water, surface: 'water', codes: [], relation: 'inside',
    ...(window.requiresAgreement && { requiresAgreement: true }) };
  return { ...window.water, surface: 'unknown', codes: [], relation: 'inside',
    ...(window.requiresAgreement && { requiresAgreement: true }) };
}
