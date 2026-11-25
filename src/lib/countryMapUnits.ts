import data from '../data/countryMapUnits.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';

export interface CountryMapUnitMatch {
  source: string;
  version: string;
  attribution?: string;
  relation: 'inside' | 'boundary';
  // Only units represented by the data at the query coordinate.
  codes: string[];
}

// Country rings are never artificially clipped to regional windows. Water
// rings extend past each window. The Fiji geometry is continuous across 180°.
export const countryMapUnitGeometry = data.units;
export const reviewedCoastalWaterGeometry = data.water;
export const reviewedCoastalWindows = data.water.map(({ code, name, bbox }) => ({ code, name, bbox }));
const coveredCodes = new Set(data.manifest.complete_units);

export function hasCountryMapUnit(code?: string): boolean {
  return code !== undefined && coveredCodes.has(code);
}

function inWindow([west, south, east, north]: number[], lat: number, lon: number): boolean {
  if (lat < south || lat > north) return false;
  return west <= east ? lon >= west && lon <= east : lon >= west || lon <= east;
}

export function hasReviewedCoastalCoverage(code: string | undefined, lat: number, lon: number): boolean {
  return reviewedCoastalWindows.some(window => window.code === code && inWindow(window.bbox, lat, lon));
}

function longitudeInSourceDomain(lon: number, code: string): number {
  return code === 'FJ' && lon < 0 ? lon + 360 : lon;
}

const units = data.units.map(unit => {
  const polygons = unit.polygons.map(indexMapPolygon);
  const bbox = [Math.min(...polygons.map(p => p.bbox[0])), Math.min(...polygons.map(p => p.bbox[1])),
    Math.max(...polygons.map(p => p.bbox[2])), Math.max(...polygons.map(p => p.bbox[3]))];
  return { code: unit.code, polygons, bbox };
});
const waterWindows = data.water.map(window => ({ ...window, polygons: window.polygons.map(indexMapPolygon) }));

export function matchCountryMapUnits(lat: number, lon: number): CountryMapUnitMatch | undefined {
  const codes: string[] = [];
  let relation: CountryMapUnitMatch['relation'] = 'inside';
  for (const unit of units) {
    const x = longitudeInSourceDomain(lon, unit.code);
    if (!inWindow(unit.bbox, lat, x)) continue;
    if (!coveredCodes.has(unit.code) && !hasReviewedCoastalCoverage(unit.code, lat, lon)) continue;
    for (const polygon of unit.polygons) {
      const result = classifyMapPolygon(x, lat, polygon);
      if (result === 'outside') continue;
      codes.push(unit.code);
      if (result === 'boundary') relation = 'boundary';
      break;
    }
  }
  if (codes.length === 0) return undefined;
  return { source: data.manifest.source_id, version: data.manifest.source_version, relation, codes: codes.sort() };
}

/** A strict positive ocean hit; points exactly on the shore do not count. */
export function matchReviewedCoastalWater(lat: number, lon: number): { source: string; version: string } | undefined {
  for (const window of waterWindows) {
    if (!inWindow(window.bbox, lat, lon)) continue;
    const x = longitudeInSourceDomain(lon, window.code);
    if (window.polygons.some(p => classifyMapPolygon(x, lat, p) === 'inside')) {
      return { source: data.manifest.ocean.source_id, version: data.manifest.ocean.source_version };
    }
  }
  return undefined;
}
