import { europeanBorderWindows, isEuropeanBorderSource, matchEuropeanBorderShoreline, queryEuropeanBorderPolygons } from './europeBorderSurveys';
import { marketSourceId, matchMarketSurvey, queryMarketSurvey } from './marketShoreline';
import dividedLakeData from '../data/usCanadaDividedLakeIslands.json';
import { scale, windows } from '../data/us-canada-shorelines/index';
import europeWindows from '../../scripts/data/europe-shoreline-windows.json';
import { parts } from '../data/europe-shorelines/index';
import { normalizeLongitude } from './agidProjection';
import { needsIslandPolicyReview } from './disputedIslands';
import { classifyMapPolygon, indexMapPolygon, overlapsWrappedMapBounds, type IndexedMapPolygon } from './indexedMapPolygon';
import type { AgidIslandAssessment } from './islandPolicy';
import { unpackMapRing } from './packedMapRing';
import { matchNorthRockShoreline, northRockSource, northRockWindow, queryNorthRockShorelinePolygons } from './northRockShoreline';

interface PackedPolygon {
  bbox: number[];
  rings: string[];
}
interface Shore extends PackedPolygon {
  id: number;
  level: number;
  kind: 'mainland' | 'island' | 'inland-water' | 'intertidal';
  source?: 'census-hydro' | 'ontario-islands' | 'ontario-hydro' | 'ign-bidasoa' | 'ign-salut';
}
interface Owner extends PackedPolygon {
  code: string;
  sovereign?: string;
  review?: boolean;
  source: string;
}
interface ShoreWindow {
  id: string;
  bbox: number[];
  european?: boolean;
  physical: Shore[];
  owners: Owner[];
}

export interface ReviewedShorelineMatch {
  surface: 'land' | 'water' | 'boundary' | 'unknown';
  waterKind?: 'inland' | 'ocean';
  landform?: 'mainland' | 'island';
  codes: string[];
  ownershipReview: boolean;
  surveyedLakeIsland?: boolean;
  surveyedIslandOwnership?: boolean;
  administrativeSourceDisagreement?: true;
  physicalSource?: { source: string; version: string; attribution: string };
  sharedIslandCountryCodes?: string[];
  sharedIslandBasis?: 'hydrographic-record';
  relation: 'inside' | 'boundary';
  source: string;
  version: string;
  attribution: string;
  evidenceUrls: string[];
  island?: AgidIslandAssessment;
}

const northAmerican = windows as ShoreWindow[];
const european: ShoreWindow[] = europeWindows.map(w => ({ ...w, european: true, physical: [], owners: [] }));
type Row = [number, 'physical', Shore] | [number, 'owners', Owner];
for (const page of parts as unknown as Row[][]) {
  for (const [index, field, polygon] of page) {
    if (field === 'physical') european[index].physical.push(polygon);
    else european[index].owners.push(polygon);
  }
}
const regions = [...northAmerican, ...european];

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
export const usCanadaShorelineWindows = [...northAmerican, ...dividedLakes, northRockWindow].map(({ id, bbox }) => ({ id, bbox }));
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
export const reviewedShorelineWindows = [...usCanadaShorelineWindows, ...europeWindows, ...europeanBorderWindows];
const europeSource = {
  source: 'europe-mediterranean-overseas-shorelines',
  version: 'GSHHG 2.3.7 + FieldMaps USGS/LSIB 2025-07-29',
  attribution: 'GSHHG © Paul Wessel and Walter H. F. Smith. FieldMaps USGS/LSIB international edition.',
};
const ignSource = {
  source: 'ign-bdtopo-bidasoa', version: 'IGN BD TOPO hydrography 2021–2025 and named island',
  attribution: 'IGN BD TOPO®, Licence Ouverte 2.0.',
  evidenceUrls: ['https://geoservices.ign.fr/bdtopo',
    'https://www.diplomatie.gouv.fr/files/files/le-ministere/lieux-emblematiques/13_notice_hendaye-faisans_complete_v2.pdf'],
};
const salutSource = {
  source: 'ign-bdtopo-iles-du-salut', version: 'IGN BD TOPO high/low water lines 2021 and Cayenne 97302',
  attribution: 'IGN BD TOPO®, Licence Ouverte 2.0.',
  evidenceUrls: ['https://geoservices.ign.fr/bdtopo', 'https://cnes.fr/geoimage/iles-salut'],
};
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
export function isReviewedShorelineSource(source: string) {
  return isUsCanadaShorelineSource(source) || source === europeSource.source || source === ignSource.source || source === salutSource.source || source === marketSourceId || isEuropeanBorderSource(source);
}
// Physical IDs refer to individual GSHHG 2.3.7 islands. Opposite-side control pins
// in the regional integration tests verify both the component and its address regions.
export const sharedEuropeanIslands = new Map<number, string[]>([
  [26, ['GB', 'IE']], [585, ['DE', 'PL']], [1592, ['MF', 'SX']],
]);
function surveyRank(shore?: Shore) {
  return shore?.source && shore.source !== 'ign-bidasoa' && shore.source !== 'ign-salut' ? lakeSurveys[shore.source].rank : 0;
}
function evidence(window: ShoreWindow, shore?: Shore) {
  if (shore?.source === 'ign-bidasoa') return { ...ignSource, evidenceUrls: [...ignSource.evidenceUrls] };
  if (shore?.source === 'ign-salut') return { ...salutSource, evidenceUrls: [...salutSource.evidenceUrls] };
  if (window.european) return { ...europeSource, evidenceUrls: baseUrls.slice(0, 2) };
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

function matchDividedLake(window: typeof dividedLakes[number], lat: number, x: number): ReviewedShorelineMatch {
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
function matchShoreline(lat: number, lon: number, available: ShoreWindow[]): ReviewedShorelineMatch | undefined {
  const x = normalizeLongitude(lon);
  const lake = dividedLakes.find(w => inBox(x, lat, w.bbox));
  if (lake) return matchDividedLake(lake, lat, x);
  const northRock = matchNorthRockShoreline(lat, x);
  if (northRock) return {
    ...northRockSource, ...northRock, evidenceUrls: [...northRockSource.evidenceUrls], codes: [], ownershipReview: northRock.surface !== 'water',
    ...(northRock.surface === 'land' && { landform: 'island' }),
    ...(northRock.surface === 'water' && { waterKind: 'ocean' }),
  };
  const window = available.find(r => inBox(x, lat, r.bbox));
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
  const common = {
    ...evidence(window, shore),
    ...((shore?.source === 'ign-bidasoa' || window.id === 'guyane-salut') && { surveyedIslandOwnership: true }),
  };
  // The three IGN high/low-water pairs delimit the Îles du Salut. A displaced
  // older island footprint outside those outlines is insufficient evidence of land.
  if (window.id === 'guyane-salut' && shore && shore.source !== 'ign-salut') {
    return { ...salutSource, evidenceUrls: [...salutSource.evidenceUrls], surveyedIslandOwnership: true, surface: 'unknown',
      relation: 'inside', ownershipReview: true, codes: [] };
  }
  if (shore?.kind === 'intertidal') {
    return { ...common, surface: 'unknown', relation: physicalBoundary ? 'boundary' : 'inside', ownershipReview: true, codes: [] };
  }
  // This one measured river hole encloses the IGN named point. Joint administration
  // applies throughout its interior; the international line across the river does not split the island.
  if (shore?.source === 'ign-bidasoa' && shore.kind === 'island') {
    const codes = ['ES', 'FR'];
    const relation = physicalBoundary ? 'boundary' : 'inside';
    const island: AgidIslandAssessment = { ...common, relation, status: 'mapped', countryCodes: [...codes],
      sovereignCodes: [...codes], administrationKind: 'condominium', territory: 'Pheasant Island', territoryJa: 'フェザント島' };
    return { ...common, relation, island, codes, landform: 'island', surveyedLakeIsland: !physicalBoundary,
      surface: physicalBoundary ? 'boundary' : 'land', ownershipReview: true };
  }
  // Administrative polygons can run straight through lakes. They cannot turn a lake back into land.
  // A county's hydrography can terminate mid-lake. The edge remains water where a
  // second water polygon contains it and no nested dry shoreline meets it.
  if (shore?.kind === 'inland-water' && (!physicalBoundary || inlandWaterInterior > deepestLand)) {
    return { ...common, surface: 'water', waterKind: 'inland', relation: 'inside', ownershipReview: false, codes: [] };
  }
  const owners = new Set<string>();
  const sovereigns = new Set<string>();
  let withheldOwner = false;
  let adminBoundary = false;
  for (const { polygon, relation } of hits(window.owners, x, lat)) {
    if (shore?.source === 'ign-salut' && polygon.source !== 'ign-cayenne') continue;
    if (polygon.review || !polygon.code) withheldOwner = true;
    else owners.add(polygon.code);
    const sovereign = window.european ? polygon.sovereign : polygon.code;
    if (sovereign) sovereigns.add(sovereign);
    adminBoundary ||= relation === 'boundary';
  }
  if (!shore) {
    if (owners.size || withheldOwner) return { ...common, surface: 'unknown', relation: 'inside', ownershipReview: true, codes: [] };
    return { ...common, surface: 'water', waterKind: 'ocean', relation: 'inside', ownershipReview: false, codes: [] };
  }
  const landform = shore.kind === 'inland-water' ? undefined : shore.kind;
  const reviewArea = withheldOwner || (landform === 'island' && needsIslandPolicyReview(lat, x));
  const codes = reviewArea ? [] : [...owners].sort();
  const ownershipReview = reviewArea || adminBoundary || physicalBoundary || codes.length > 1;
  const relation = (adminBoundary || physicalBoundary || codes.length > 1) ? 'boundary' : 'inside';
  let island: AgidIslandAssessment | undefined;
  if (landform === 'island') {
    const mapped = !ownershipReview && codes.length === 1;
    island = { ...common, relation, status: mapped ? 'mapped' : 'unresolved', countryCodes: mapped ? [...codes] : [],
      ...(mapped && sovereigns.size > 0 && { sovereignCodes: [...sovereigns].sort() }) };
  }
  return {
    ...common, surface: physicalBoundary ? 'boundary' : 'land', landform, codes, relation, ownershipReview, island,
    ...(landform === 'island' && !physicalBoundary && shore.source && { surveyedLakeIsland: true }),
    ...(landform === 'island' && window.european && !shore.source && sharedEuropeanIslands.has(shore.id)
      && { sharedIslandCountryCodes: [...sharedEuropeanIslands.get(shore.id)!] }),
  };
}

export const matchUsCanadaShoreline = (lat: number, lon: number) => matchShoreline(lat, lon, northAmerican);
export function matchReviewedShoreline(lat: number, lon: number) {
  const x = normalizeLongitude(lon);
  return matchEuropeanBorderShoreline(lat, x) ?? matchMarketSurvey(lat, x) ?? matchShoreline(lat, x, regions);
}

/** Return edges for the existing geodesic disk/edge check. A political edge alone supplies no dry land. */
function* queryPolygons(bounds: number[], available: ShoreWindow[]) {
  for (const window of dividedLakes) {
    if (!overlapsWrappedMapBounds(window.bbox, bounds)) continue;
    const { source, version, attribution } = window;
    for (const polygon of [...window.land, ...window.water]) {
      if (overlapsWrappedMapBounds(polygon.bbox, bounds)) yield {
        source, version, attribution, bbox: polygon.bbox, rings: polygon.rings, kind: 'physical' as const, codes: [] as string[],
      };
    }
    for (const polygon of window.owners) {
      if (overlapsWrappedMapBounds(polygon.bbox, bounds)) yield {
        source, version, attribution, bbox: polygon.bbox, rings: polygon.rings, kind: 'admin' as const, codes: [polygon.code],
      };
    }
  }
  if (overlapsWrappedMapBounds(northRockWindow.bbox, bounds)) {
    for (const polygon of queryNorthRockShorelinePolygons(bounds)) {
      yield { ...northRockSource, ...polygon, kind: 'physical' as const, codes: [] as string[] };
    }
  }
  for (const window of available) {
    if (!overlapsWrappedMapBounds(window.bbox, bounds)) continue;
    for (const polygon of window.physical) {
      if (overlapsWrappedMapBounds(polygon.bbox, bounds)) yield {
        ...evidence(window, polygon), bbox: polygon.bbox, kind: 'physical' as const, codes: polygon.source === 'ign-bidasoa' && polygon.kind === 'island' ? ['ES','FR'] : [],
        get rings() { return geometry(polygon).rings; },
      };
    }
    for (const polygon of window.owners) {
      if (overlapsWrappedMapBounds(polygon.bbox, bounds)) yield {
        ...evidence(window), bbox: polygon.bbox, kind: 'admin' as const, codes: polygon.review || !polygon.code ? [] : [polygon.code],
        get rings() { return geometry(polygon).rings; },
      };
    }
  }
}

export const queryUsCanadaShorelinePolygons = (bounds: number[]) => queryPolygons(bounds, northAmerican);
export function* queryReviewedShorelinePolygons(bounds: number[]) {
  yield* queryEuropeanBorderPolygons(bounds);
  yield* queryMarketSurvey(bounds);
  yield* queryPolygons(bounds, regions);
}
