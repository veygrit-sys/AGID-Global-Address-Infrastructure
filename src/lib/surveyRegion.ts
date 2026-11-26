import { normalizeLongitude } from './agidProjection';
import { matchDisputedIsland, matchRevisedIslandRegion, needsIslandPolicyReview } from './disputedIslands';
import { classifyMapPolygon, indexMapPolygon, type IndexedMapPolygon } from './indexedMapPolygon';
import { matchIslandBorderReview } from './islandBorderDisagreement';
import type { ReviewedGeographyMatch, ReviewedOceanRegion } from './reviewedGeography';

interface Polygon {
  bbox: number[];
  rings: number[][][];
}
export interface SurveyWindow {
  id: string;
  name: string;
  bbox: number[];
  source: string;
  version: string;
  attribution: string;
  evidenceUrls: string[];
  land: (Polygon & { kind: 'mainland' | 'island'; name?: string; sharedIslandCountryCodes?: string[] })[];
  oceanRegion?: ReviewedOceanRegion;
  water: (Polygon & { kind: 'inland' | 'ocean' })[];
  owners: (Polygon & { code: string; sovereignCode?: string })[];
}

function index<T extends Polygon>(polygons: T[]) {
  return polygons.map(polygon => ({ ...polygon, indexed: indexMapPolygon(polygon) }));
}

function hits<T extends { indexed: IndexedMapPolygon }>(polygons: T[], x: number, y: number) {
  return polygons.flatMap(polygon => {
    const relation = classifyMapPolygon(x, y, polygon.indexed);
    return relation === 'outside' ? [] : [{ polygon, relation }];
  });
}

function indexWindow(w: SurveyWindow) {
  return { ...w, land: index(w.land), water: index(w.water), owners: index(w.owners) };
}

type IndexedWindow = ReturnType<typeof indexWindow>;

function matchWindow(window: IndexedWindow, lat: number, x: number): ReviewedGeographyMatch | undefined {
  const lon = normalizeLongitude(x);
  // Preserve the individual island decisions, including disagreements between national shorelines.
  if (matchIslandBorderReview(lat, lon) || matchDisputedIsland(lat, lon) || matchRevisedIslandRegion(lat, lon)) return;
  const { source, version, attribution, evidenceUrls } = window;
  const common = { source, version, attribution, surveyWindowId: window.id, evidenceUrls: [...evidenceUrls], surveyedIslandOwnership: true };
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
  const protectedIsland = landform === 'island' && needsIslandPolicyReview(lat, lon);
  const owners = hits(window.owners, x, lat);
  const codes = protectedIsland ? [] : [...new Set(owners.map(hit => hit.polygon.code))].sort();
  const adminEdge = owners.length > 0 && !owners.some(hit => hit.relation === 'inside');
  const relation = shore || adminEdge || codes.length > 1 ? 'boundary' : 'inside';
  const ownershipReview = relation === 'boundary' || codes.length !== 1;
  const names = new Set(land.flatMap(hit => hit.polygon.name ? [hit.polygon.name] : []));
  // A divided island's metadata belongs to its physical polygon. Point owners remain independent.
  const shared = landform === 'island' && !shore && land.length === 1
    ? land[0].polygon.sharedIslandCountryCodes : undefined;
  return {
    ...(shared && { sharedIslandCountryCodes: [...shared] }),
    ...common, surface: shore ? 'boundary' : 'land', landform, codes, ownershipReview, relation,
    ...(landform === 'island' && { island: {
      source, version, attribution, evidenceUrls: [...evidenceUrls], relation,
      ...(names.size === 1 && { territory: [...names][0] }),
      status: ownershipReview ? 'unresolved' : 'mapped', countryCodes: ownershipReview ? [] : [...codes],
      ...(!ownershipReview && { sovereignCodes: [...new Set(owners.map(hit => hit.polygon.sovereignCode ?? hit.polygon.code))].sort() }),
    } }),
  };
}

function overlaps([w, s, e, n]: number[], [west, south, east, north]: number[]) {
  const shift = 360 * Math.round((west + east - w - e) / 720);
  return e + shift >= west && w + shift <= east && n >= south && s <= north;
}

function* queryPolygons(surveys: IndexedWindow[], bounds: number[]) {
  for (const window of surveys) {
    if (!overlaps(window.bbox, bounds)) continue;
    const { source, version, attribution } = window;
    for (const polygon of [...window.land, ...window.water]) {
      if (overlaps(polygon.bbox, bounds)) yield {
        source, version, attribution, surveyWindowId: window.id, bbox: polygon.bbox, rings: polygon.rings, kind: 'physical' as const, codes: [] as string[],
      };
    }
    for (const polygon of window.owners) {
      if (overlaps(polygon.bbox, bounds)) yield {
        source, version, attribution, surveyWindowId: window.id, bbox: polygon.bbox, rings: polygon.rings, kind: 'admin' as const, codes: [polygon.code],
      };
    }
  }
}

// Each input polygon extends beyond its lookup window, keeping clip edges out of point and GPS results.
export function createSurveyRegion(input: SurveyWindow[]) {
  const surveys = input.map(indexWindow);
  const windows = surveys.map(({ id, bbox, source }) => ({ id, bbox, source }));
  const south = Math.min(...windows.map(w => w.bbox[1]));
  const north = Math.max(...windows.map(w => w.bbox[3]));
  // Pacific surveys can span both ends of the longitude range while covering
  // very little land. Index only the ten-degree bands touched by each window.
  const band = (x: number) => Math.floor((x + 180) / 10);
  const bands: IndexedWindow[][] = Array.from({ length: 36 }, () => []);
  for (const window of surveys) {
    const [w, , e] = window.bbox;
    for (let i = band(w); i <= band(e); i++) bands[((i % 36) + 36) % 36].push(window);
  }
  function match(lat: number, lon: number) {
    if (!(lat >= south && lat <= north) || !Number.isFinite(lon)) return;
    const x = normalizeLongitude(lon);
    for (const window of bands[band(x) % 36]) {
      const [w, s, e, n] = window.bbox;
      if (lat < s || lat > n) continue;
      // A seam-crossing survey keeps its geometry continuous from w to e.
      // Move the pin into that chart so the meridian never becomes a shoreline.
      const local = w < -180 || e >= 180 ? x + 360 * Math.round(((w + e) / 2 - x) / 360) : x;
      if (local >= w && local <= e) return matchWindow(window, lat, local);
    }
  }
  return { windows, match, query: (bounds: number[]) => queryPolygons(surveys, bounds) };
}
