import data from '../data/northRockShoreline.json';
import { normalizeLongitude } from './agidProjection';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';

export const northRockWindow = { id: 'north-rock', bbox: data.window };
export const northRockDryPolygon = data.dry;
export const northRockSource = {
  source: 'canvec-north-rock-shoreline',
  version: 'CanVec 1:50,000 NB (2019 release, 2007 survey); GSHHG 2.3.7',
  attribution: 'Contains information licensed under the Open Government Licence – Canada. '
    + 'Natural Resources Canada, CanVec. GSHHG: Paul Wessel and Walter H. F. Smith.',
  evidenceUrls: [
    'https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/canvec/shp/Land/canvec_50K_NB_Land_shp.zip',
    'https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/canvec/shp/Hydro/canvec_50K_NB_Hydro_shp.zip',
    'https://open.canada.ca/en/open-government-licence-canada',
    'https://www.soest.hawaii.edu/pwessel/gshhg/',
    'https://notmar.gc.ca/publications/list-lights/atl/atl58-en.php',
    'https://www.govinfo.gov/content/pkg/FR-2023-12-21/pdf/2023-28158.pdf',
  ],
};

const dry = indexMapPolygon(data.dry);
const water = indexMapPolygon(data.water);
const [west, south, east, north] = data.window;

export function matchNorthRockShoreline(lat: number, lon: number) {
  const x = normalizeLongitude(lon);
  if (x < west || x > east || lat < south || lat > north) return;
  const land = classifyMapPolygon(x, lat, dry);
  if (land === 'inside') return { surface: 'land', relation: 'inside' } as const;
  if (land === 'boundary') return { surface: 'boundary', relation: 'boundary' } as const;

  const ocean = classifyMapPolygon(x, lat, water);
  // Clipping the survey creates four artificial edges in already charted ocean.
  if (ocean === 'inside' || x === west || x === east || lat === south || lat === north) {
    return { surface: 'water', relation: 'inside' } as const;
  }
  // The limits of conflicting surveys and of tidal reefs do not establish a coast.
  return { surface: 'unknown', relation: 'inside' } as const;
}

export function* queryNorthRockShorelinePolygons([w, s, e, n]: number[]) {
  const shift = 360 * Math.round((w + e - west - east) / 720);
  if (s > north || n < south || w > east + shift || e < west + shift) return;
  yield data.dry;
  // The outside ring is the coverage window, already checked separately.
  yield { bbox: data.water.bbox, rings: data.water.rings.slice(1) };
}
