import data from '../data/buesingenBoundary.json';
import type { CountryMapUnitMatch } from './countryMapUnits';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';

const [west, south, east, north] = data.bounds;
const boundary = indexMapPolygon({ bbox: data.bounds, rings: [data.ring] });

/** Administrative areas, including parts of the Rhine. The build verifies the Swiss complement. */
export function matchBuesingenBoundary(lat: number, lon: number): (CountryMapUnitMatch & { attribution: string }) | undefined {
  if (!(west < lon && lon < east && south < lat && lat < north)) return undefined;
  const relation = classifyMapPolygon(lon, lat, boundary);
  const codes = relation === 'boundary' ? ['CH', 'DE'] : [relation === 'inside' ? 'DE' : 'CH'];
  return {
    source: data.manifest.source_id,
    version: data.manifest.source_version,
    attribution: data.manifest.attribution,
    relation: relation === 'boundary' ? 'boundary' : 'inside',
    codes,
  };
}
