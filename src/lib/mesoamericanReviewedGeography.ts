import usMexico from '../data/usMexicoReviewed.json';
import northern from '../data/northernCentralAmericaReviewed.json';
import southern from '../data/southernCentralAmericaReviewed.json';
import { normalizeLongitude } from './agidProjection';
import { matchDisputedIsland, matchRevisedIslandRegion, needsIslandPolicyReview } from './disputedIslands';
import { classifyMapPolygon, indexMapPolygon, type IndexedMapPolygon } from './indexedMapPolygon';
import { matchIslandBorderReview } from './islandBorderDisagreement';
import type { ReviewedGeographyMatch } from './reviewedGeography';

interface Polygon {
  bbox: number[];
  rings: number[][][];
}
interface SurveyWindow {
  id: string;
  name: string;
  bbox: number[];
  source: string;
  version: string;
  attribution: string;
  evidenceUrls: string[];
  land: (Polygon & { kind: 'mainland' | 'island'; name?: string })[];
  oceanRegion?: 'NEPC' | 'CARB';
  water: (Polygon & { kind: 'inland' | 'ocean' })[];
  owners: (Polygon & { code: string })[];
}

function index<T extends Polygon>(polygons: T[]) {
  return polygons.map(polygon => ({ ...polygon, indexed: indexMapPolygon(polygon) }));
}

// Review windows are disjoint; each builder clips the source geometry beyond the search window.
const surveys = ([...usMexico.windows, ...northern.windows, ...southern.windows] as SurveyWindow[])
  .map(w => ({ ...w, land: index(w.land), water: index(w.water), owners: index(w.owners) }));
export const mesoamericanWindows = surveys.map(({ id, bbox, source }) => ({ id, bbox, source }));
const west = Math.min(...surveys.map(w => w.bbox[0]));
const east = Math.max(...surveys.map(w => w.bbox[2]));

function hits<T extends { indexed: IndexedMapPolygon }>(polygons: T[], x: number, y: number) {
  return polygons.flatMap(polygon => {
    const relation = classifyMapPolygon(x, y, polygon.indexed);
    return relation === 'outside' ? [] : [{ polygon, relation }];
  });
}

export function matchMesoamericanGeography(lat: number, lon: number): ReviewedGeographyMatch | undefined {
  const x = normalizeLongitude(lon);
  if (x < west || x > east) return;
  const window = surveys.find(({ bbox: [w, s, e, n] }) => x >= w && x <= e && lat >= s && lat <= n);
  if (!window) return;
  // Preserve the individual island decisions, including disagreements between national shorelines.
  if (matchIslandBorderReview(lat, x) || matchDisputedIsland(lat, x) || matchRevisedIslandRegion(lat, x)) return;
  const { source, version, attribution, evidenceUrls } = window;
  const common = { source, version, attribution, evidenceUrls: [...evidenceUrls], surveyedIslandOwnership: true };
  const land = hits(window.land, x, lat);
  const water = hits(window.water, x, lat);
  const wetInterior = water.some(hit => hit.relation === 'inside');
  if (!land.length && wetInterior) {
    const kinds = new Set(water.map(hit => hit.polygon.kind));
    if (kinds.size === 1) return {
      ...common, surface: 'water', waterKind: water[0].polygon.kind,
      ...(water[0].polygon.kind === 'ocean' && window.oceanRegion && { oceanRegion: window.oceanRegion }),
      relation: 'inside', ownershipReview: false, codes: [],
    };
  }
  // Missing or contradictory physical evidence takes precedence over every administrative polygon.
  if (!land.length || wetInterior) {
    return { ...common, surface: 'unknown', relation: 'inside', ownershipReview: true, codes: [] };
  }
  const shore = water.length > 0 || !land.some(hit => hit.relation === 'inside');
  const landforms = new Set(land.map(hit => hit.polygon.kind));
  const landform = landforms.size === 1 ? land[0].polygon.kind : undefined;
  const protectedIsland = landform === 'island' && needsIslandPolicyReview(lat, x);
  const owners = hits(window.owners, x, lat);
  const codes = protectedIsland ? [] : [...new Set(owners.map(hit => hit.polygon.code))].sort();
  const adminEdge = owners.length > 0 && !owners.some(hit => hit.relation === 'inside');
  const relation = shore || adminEdge || codes.length > 1 ? 'boundary' : 'inside';
  const ownershipReview = relation === 'boundary' || codes.length !== 1;
  const names = new Set(land.flatMap(hit => hit.polygon.name ? [hit.polygon.name] : []));
  return {
    ...common, surface: shore ? 'boundary' : 'land', landform, codes, ownershipReview, relation,
    ...(landform === 'island' && { island: {
      source, version, attribution, evidenceUrls: [...evidenceUrls], relation,
      ...(names.size === 1 && { territory: [...names][0] }),
      status: ownershipReview ? 'unresolved' : 'mapped', countryCodes: ownershipReview ? [] : [...codes],
      ...(!ownershipReview && { sovereignCodes: [...codes] }),
    } }),
  };
}

function overlaps([w, s, e, n]: number[], [west, south, east, north]: number[]) {
  const shift = 360 * Math.round((west + east - w - e) / 720);
  return e + shift >= west && w + shift <= east && n >= south && s <= north;
}

export function* queryMesoamericanPolygons(bounds: number[]) {
  for (const window of surveys) {
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
}
