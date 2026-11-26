import survey from '../data/regional-islands/market-border.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';
import type { ReviewedShorelineMatch } from './reviewedShorelines';

const metadata = {
  source: 'market-2006-demarcation', version: '2006 demarcation + ESA WorldCover 2021 v200 + FieldMaps 2025-07-29',
  attribution: 'Finland–Sweden Boundary Commission. ESA WorldCover 2021 / Contains modified Copernicus Sentinel data 2021. FieldMaps USGS/LSIB.',
  evidenceUrls: ['https://www.maanmittauslaitos.fi/en/stateboundaries', 'https://esa-worldcover.org/en/data-access', 'https://fieldmaps.io/data/adm0/'],
};
export const marketSourceId = metadata.source;
const regions = [
  ...survey.review.map(p => ({ ...p, layer: 'review' })),
  ...survey.dry.map(p => ({ ...p, layer: 'dry' })),
  ...survey.ax.map(p => ({ ...p, layer: 'AX' })),
  ...survey.se.map(p => ({ ...p, layer: 'SE' })),
].map(p => ({ ...p, indexed: indexMapPolygon(p) }));
const envelope = survey.review[0].bbox;

export function matchMarketSurvey(lat: number, lon: number): ReviewedShorelineMatch | undefined {
  if (lon < envelope[0] || lon > envelope[2] || lat < envelope[1] || lat > envelope[3]) return;
  const codes = new Set<string>();
  let reviewed = false, dry = false, dryEdge = false, adminEdge = false;
  for (const region of regions) {
    const relation = classifyMapPolygon(lon, lat, region.indexed);
    if (relation === 'outside') continue;
    if (region.layer === 'review') reviewed = true;
    else if (region.layer === 'dry') { dry = true; dryEdge ||= relation === 'boundary'; }
    else { codes.add(region.layer); adminEdge ||= relation === 'boundary'; }
  }
  if (!reviewed) return;
  const common = { ...metadata, evidenceUrls: [...metadata.evidenceUrls], surveyedIslandOwnership: true };
  if (!dry) return { ...common, codes: [], ownershipReview: true, surface: 'unknown', relation: 'inside' };
  const countries = [...codes].sort();
  const ownershipReview = dryEdge || adminEdge || countries.length !== 1;
  const relation = dryEdge || adminEdge || countries.length > 1 ? 'boundary' : 'inside';
  return { ...common, codes: countries, ownershipReview, relation, landform: 'island',
    surface: dryEdge ? 'boundary' : 'land', sharedIslandCountryCodes: ['AX', 'SE'],
    island: { ...metadata, evidenceUrls: [...metadata.evidenceUrls], territory: 'Märket', territoryJa: 'マーケット島', relation,
      status: ownershipReview ? 'unresolved' : 'mapped', countryCodes: ownershipReview ? [] : countries,
      ...(!ownershipReview && { sovereignCodes: [countries[0] === 'AX' ? 'FI' : 'SE'] }) },
  };
}

export function* queryMarketSurvey([w, s, e, n]: number[]) {
  if (e < envelope[0] || w > envelope[2] || n < envelope[1] || s > envelope[3]) return;
  for (const { bbox, rings, layer } of regions) {
    const admin = layer === 'AX' || layer === 'SE';
    yield { ...metadata, bbox, rings, kind: admin ? 'admin' as const : 'physical' as const, codes: admin ? [layer] : [] };
  }
}
