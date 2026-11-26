import enclave from '../data/buesingenBoundary.json';
import { countryMapUnitGeometry, hasCountryMapUnit, reviewedCoastalWindows } from './countryMapUnits';
import { regionalCoastWindows } from './pearlRiverDelta';

// Broad phase only. Each marked tile can contain land, water, a border, or a source gap.
const tileDegrees = 2;
const columns = 360 / tileDegrees;
const rows = 180 / tileDegrees;
const tiles = new Uint8Array(columns * rows);
const row = (lat: number) => Math.max(0, Math.min(rows - 1, Math.floor(lat / tileDegrees) + rows / 2));
const column = (lon: number) => Math.floor(lon / tileDegrees) + columns / 2;

function include([west, south, east, north]: number[]) {
  // Walk a continuous longitude interval, including unwrapped island polygons.
  const right = east < west ? east + 360 : east;
  for (let y = row(south - 1e-12); y <= row(north + 1e-12); y++) {
    for (let x = column(west - 1e-12); x <= column(right + 1e-12); x++) {
      const wrapped = ((x % columns) + columns) % columns;
      tiles[y * columns + wrapped] = 1;
    }
  }
}

for (const unit of countryMapUnitGeometry) {
  if (!hasCountryMapUnit(unit.code)) continue;
  for (const polygon of unit.polygons) include(polygon.bbox);
}
for (const window of [...reviewedCoastalWindows, ...regionalCoastWindows]) include(window.bbox);
include(enclave.bounds);

/** Validated latitude and a canonical longitude in [-180, 180). */
export function mayHaveReviewedGeography(lat: number, lon: number) {
  return tiles[row(lat) * columns + column(lon)] === 1;
}
