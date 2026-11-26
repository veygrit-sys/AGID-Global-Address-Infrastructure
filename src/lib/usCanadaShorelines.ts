import type { ReviewedGeographyMatch } from './reviewedGeography';
import dividedLakeData from '../data/usCanadaDividedLakeIslands.json';
import { scale, windows } from '../data/us-canada-shorelines/index';
import { normalizeLongitude } from './agidProjection';
import { needsIslandPolicyReview } from './disputedIslands';
import { classifyMapPolygon, indexMapPolygon, type IndexedMapPolygon } from './indexedMapPolygon';
import type { AgidIslandAssessment } from './islandPolicy';
import { unpackMapRing } from './packedMapRing';
import { matchNorthRockShoreline, northRockSource, northRockWindow, queryNorthRockShorelinePolygons } from './northRockShoreline';

export type { ReviewedGeographyMatch as UsCanadaShorelineMatch } from './reviewedGeography';

interface PackedPolygon {
  bbox: number[];
  rings: string[];
}
interface Shore extends PackedPolygon {
  id: number;
  level: number;
  kind: 'mainland' | 'island' | 'inland-water';
  source?: 'census-hydro' | 'ontario-islands' | 'ontario-hydro';
}
interface Owner extends PackedPolygon {
  code: string;
  source: string;
}
interface ShoreWindow {
  id: string;
  bbox: number[];
  physical: Shore[];
  owners: Owner[];
}

const regions = windows as ShoreWindow[];
interface LakePolygon {
  bbox: number[];
  rings: number[][][];
}
function indexLakePolygons<T extends LakePolygon>(polygons: T[]) {
  return polygons.map(polygon => ({ ...polygon, indexed: indexMapPolygon(polygon) }));
}
const dividedLakes = dividedLakeData.windows.map(w => ({
  ...w, land: indexLakePolygons(w.land), water: indexLakePolygons(w.water), owners: indexLakePolygons(w.owners),
}));
export const usCanadaShorelineWindows = [...regions, ...dividedLakes, northRockWindow].map(({ id, bbox }) => ({ id, bbox }));
export const usCanadaShorelineSource = {
  source: 'us-ca-reviewed-shorelines',
  version: 'GSHHG 2.3.7; FieldMaps USGS/LSIB 2025-07-29; Statistics Canada 2021',
  attribution: 'GSHHG: Paul Wessel and Walter H. F. Smith. FieldMaps international USGS/LSIB. '
    + 'Adapted from Statistics Canada, 2021 Census Boundary Files (provinces/territories, cartographic). '
    + 'This does not constitute an endorsement by Statistics Canada of this product.',
};
const baseUrls = [
  'https://www.soest.hawaii.edu/pwessel/gshhg/',
  'https://fieldmaps.io/data/adm0/',
  'https://www150.statcan.gc.ca/n1/pub/92-160-g/92-160-g2021002-eng.htm',
];
const lakeSurveys = {
  'ontario-islands': {
    rank: 1,
    version: 'Ontario Great Lakes Islands, April 2010',
    attribution: 'Ontario Ministry of Natural Resources © King’s Printer for Ontario.',
    url: 'https://geohub.lio.gov.on.ca/datasets/lio::great-lakes-islands-international',
  },
  'ontario-hydro': {
    rank: 2,
    version: 'Ontario Hydro Network Waterbody (St. Lawrence River, OGF 70428304/321973630/321974077)',
    attribution: 'Contains information licensed under the Open Government Licence – Ontario.',
    url: 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open01/MapServer/25',
  },
  'census-hydro': {
    rank: 2,
    version: 'US Census TIGER/Line Area Hydrography 2025',
    attribution: 'U.S. Census Bureau, 2025 TIGER/Line Shapefiles.',
    url: 'https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/',
  },
};
export function isUsCanadaShorelineSource(source: string) {
  return source === usCanadaShorelineSource.source || source.startsWith(`${usCanadaShorelineSource.source}+`)
    || source === northRockSource.source;
}
function surveyRank(shore?: Shore) {
  return shore?.source ? lakeSurveys[shore.source].rank : 0;
}
function evidence(shore?: Shore) {
  const survey = shore?.source && lakeSurveys[shore.source];
  if (!survey) return { ...usCanadaShorelineSource, evidenceUrls: [...baseUrls] };
  return {
    source: `${usCanadaShorelineSource.source}+${shore.source}`,
    version: `${usCanadaShorelineSource.version}; ${survey.version}`,
    attribution: `${usCanadaShorelineSource.attribution} ${survey.attribution}`,
    evidenceUrls: [...baseUrls, survey.url],
  };
}
const cache = new Map<PackedPolygon, { indexed: IndexedMapPolygon; rings: number[][][] }>();
function geometry(polygon: PackedPolygon) {
  let entry = cache.get(polygon);
  if (!entry) {
    const rings = polygon.rings.map(text => unpackMapRing(text, scale));
    entry = { rings, indexed: indexMapPolygon({ bbox: polygon.bbox, rings }) };
    if (cache.size >= 128) cache.delete(cache.keys().next().value!);
    cache.set(polygon, entry);
  }
  return entry;
}

function inBox(x: number, y: number, [west, south, east, north]: number[]) {
  return x >= west && x <= east && y >= south && y <= north;
}
function* hits<T extends PackedPolygon>(polygons: T[], x: number, y: number) {
  for (const polygon of polygons) {
    if (!inBox(x, y, polygon.bbox)) continue;
    const relation = classifyMapPolygon(x, y, geometry(polygon).indexed);
    if (relation !== 'outside') yield { polygon, relation };
  }
}

function lakeRelation(shapes: Array<{ indexed: IndexedMapPolygon }>, x: number, y: number) {
  let boundary = false;
  for (const shape of shapes) {
    const relation = classifyMapPolygon(x, y, shape.indexed);
    if (relation === 'inside') return relation;
    boundary ||= relation === 'boundary';
  }
  return boundary ? 'boundary' : 'outside';
}

function matchDividedLake(window: typeof dividedLakes[number], lat: number, x: number): ReviewedGeographyMatch {
  const { source, version, attribution } = window;
  const common = { source, version, attribution, evidenceUrls: [...window.evidenceUrls], surveyedIslandOwnership: true };
  const land = lakeRelation(window.land, x, lat);
  const water = lakeRelation(window.water, x, lat);
  if (land === 'outside' && water === 'inside') {
    return { ...common, surface: 'water', waterKind: 'inland', codes: [], ownershipReview: false, relation: 'inside' };
  }
  // Gaps in the surveyed land and water layers include disagreements between shoreline editions.
  if (land === 'outside' || water === 'inside') {
    return { ...common, surface: 'unknown', codes: [], ownershipReview: true, relation: 'inside' };
  }
  const owners = window.owners.filter(p => classifyMapPolygon(x, lat, p.indexed) !== 'outside');
  const codes = [...new Set(owners.map(p => p.code))].sort();
  const shore = land === 'boundary' || water === 'boundary';
  const ownershipReview = shore || codes.length !== 1;
  const relation = shore || codes.length > 1 ? 'boundary' : 'inside';
  const island: AgidIslandAssessment = {
    source, version, attribution, evidenceUrls: [...window.evidenceUrls], territory: window.name, relation,
    status: ownershipReview ? 'unresolved' : 'mapped', countryCodes: ownershipReview ? [] : [...codes],
    ...(!ownershipReview && { sovereignCodes: [...codes] }),
  };
  return {
    ...common, surface: shore ? 'boundary' : 'land', landform: 'island', surveyedLakeIsland: !shore,
    codes, relation, ownershipReview, island,
    ...(window.crossesBorder && {
      sharedIslandCountryCodes: ['CA', 'US'],
      ...(window.sharedIslandBasis === 'hydrographic-record' && { sharedIslandBasis: window.sharedIslandBasis }),
    }),
  };
}

/** The highest shoreline level wins: ocean land, lakes, lake islands, then ponds on lake islands. */
export function matchUsCanadaShoreline(lat: number, lon: number): ReviewedGeographyMatch | undefined {
  const x = normalizeLongitude(lon);
  const lake = dividedLakes.find(w => inBox(x, lat, w.bbox));
  if (lake) return matchDividedLake(lake, lat, x);
  const northRock = matchNorthRockShoreline(lat, x);
  if (northRock) return {
    ...northRockSource, ...northRock, evidenceUrls: [...northRockSource.evidenceUrls], codes: [], ownershipReview: northRock.surface !== 'water',
    ...(northRock.surface === 'land' && { landform: 'island' }),
    ...(northRock.surface === 'water' && { waterKind: 'ocean' }),
  };
  const window = regions.find(r => inBox(x, lat, r.bbox));
  if (!window) return;

  let shore: Shore | undefined;
  let physicalBoundary = false;
  let inlandWaterInterior = 0;
  let deepestLand = 0;
  for (const { polygon, relation } of hits(window.physical, x, lat)) {
    if (polygon.kind !== 'inland-water') deepestLand = Math.max(deepestLand, polygon.level);
    else if (relation === 'inside') inlandWaterInterior = Math.max(inlandWaterInterior, polygon.level);
    if (shore && shore.level > polygon.level) continue;
    const sameLevel = shore?.level === polygon.level;
    physicalBoundary = (sameLevel && physicalBoundary) || relation === 'boundary';
    // At the same hydrographic level prefer the named lake survey, then the GSHHG overview.
    if (!sameLevel || surveyRank(polygon) > surveyRank(shore)) shore = polygon;
  }
  const common = evidence(shore);
  // Administrative polygons can run straight through lakes. They cannot turn a lake back into land.
  // A county's hydrography can terminate mid-lake. The edge remains water where a
  // second water polygon contains it and no nested dry shoreline meets it.
  if (shore?.kind === 'inland-water' && (!physicalBoundary || inlandWaterInterior > deepestLand)) {
    return { ...common, surface: 'water', waterKind: 'inland', relation: 'inside', ownershipReview: false, codes: [] };
  }
  const owners = new Set<string>();
  let adminBoundary = false;
  for (const { polygon, relation } of hits(window.owners, x, lat)) {
    owners.add(polygon.code);
    adminBoundary ||= relation === 'boundary';
  }
  if (!shore) {
    if (owners.size) return { ...common, surface: 'unknown', relation: 'inside', ownershipReview: true, codes: [] };
    return { ...common, surface: 'water', waterKind: 'ocean', relation: 'inside', ownershipReview: false, codes: [] };
  }
  const landform = shore.kind === 'inland-water' ? undefined : shore.kind;
  const reviewArea = landform === 'island' && needsIslandPolicyReview(lat, x);
  const codes = reviewArea ? [] : [...owners].sort();
  const ownershipReview = reviewArea || adminBoundary || physicalBoundary || codes.length > 1;
  const relation = (adminBoundary || physicalBoundary || codes.length > 1) ? 'boundary' : 'inside';
  let island: AgidIslandAssessment | undefined;
  if (landform === 'island') {
    const mapped = !ownershipReview && codes.length === 1;
    island = { ...common, relation, status: mapped ? 'mapped' : 'unresolved', countryCodes: mapped ? [...codes] : [],
      ...(mapped && { sovereignCodes: [...codes] }) };
  }
  return {
    ...common, surface: physicalBoundary ? 'boundary' : 'land', landform, codes, relation, ownershipReview, island,
    ...(landform === 'island' && !physicalBoundary && shore.source && { surveyedLakeIsland: true }),
  };
}

// Query longitudes are unwrapped around the disk's center. Windows themselves are split at ±180°.
function overlaps([west, south, east, north]: number[], [w, s, e, n]: number[]) {
  if (south > n || north < s) return false;
  const shift = 360 * Math.round((w + e - west - east) / 720);
  return east + shift >= w && west + shift <= e;
}

/** Return edges for the existing geodesic disk/edge check. A political edge alone supplies no dry land. */
export function* queryUsCanadaShorelinePolygons(bounds: number[]) {
  for (const window of dividedLakes) {
    if (!overlaps(window.bbox, bounds)) continue;
    const { source, version, attribution } = window;
    for (const polygon of [...window.land, ...window.water]) {
      if (overlaps(polygon.bbox, bounds)) yield {
        source, version, attribution, bbox: polygon.bbox, rings: polygon.rings, kind: 'physical' as const, codes: [] as string[],
      };
    }
    for (const polygon of window.owners) {
      if (overlaps(polygon.bbox, bounds)) yield {
        source, version, attribution, bbox: polygon.bbox, rings: polygon.rings, kind: 'admin' as const, codes: [polygon.code],
      };
    }
  }
  if (overlaps(northRockWindow.bbox, bounds)) {
    for (const polygon of queryNorthRockShorelinePolygons(bounds)) {
      yield { ...northRockSource, ...polygon, kind: 'physical' as const, codes: [] as string[] };
    }
  }
  for (const window of regions) {
    if (!overlaps(window.bbox, bounds)) continue;
    for (const polygon of window.physical) {
      if (overlaps(polygon.bbox, bounds)) yield {
        ...evidence(polygon), bbox: polygon.bbox, kind: 'physical' as const, codes: [] as string[],
        get rings() { return geometry(polygon).rings; },
      };
    }
    for (const polygon of window.owners) {
      if (overlaps(polygon.bbox, bounds)) yield {
        ...usCanadaShorelineSource, bbox: polygon.bbox, kind: 'admin' as const, codes: [polygon.code],
        get rings() { return geometry(polygon).rings; },
      };
    }
  }
}
