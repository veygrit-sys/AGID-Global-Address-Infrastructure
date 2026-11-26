import { caribbeanUsIslands } from './caribbeanUsReviewedGeography';
import { canadianIslands } from './canadianReviewedGeography';
import { southAmerica } from './southAmericanReviewedGeography';
import { matchMesoamericanGeography, mesoamericanWindows, queryMesoamericanPolygons } from './mesoamericanReviewedGeography';
import { isUsCanadaShorelineSource, matchUsCanadaShoreline, queryUsCanadaShorelinePolygons, usCanadaShorelineWindows } from './usCanadaShorelines';
import type { AgidIslandAssessment } from './islandPolicy';

export type ReviewedOceanRegion = 'NEPC' | 'SEPC' | 'CARB' | 'NATL' | 'SATL' | 'ARCT' | 'STLA' | 'LABR' | 'HUDB'
  | 'NPAC' | 'BERI' | 'ALSK' | 'GMXC' | 'PHLS';

export interface ReviewedGeographyMatch {
  surface: 'land' | 'water' | 'boundary' | 'unknown';
  surveyWindowId?: string;
  waterKind?: 'inland' | 'ocean';
  oceanRegion?: ReviewedOceanRegion;
  landform?: 'mainland' | 'island';
  codes: string[];
  ownershipReview: boolean;
  surveyedLakeIsland?: boolean;
  surveyedIslandOwnership?: boolean;
  sharedIslandCountryCodes?: string[];
  sharedIslandBasis?: 'hydrographic-record';
  relation: 'inside' | 'boundary';
  source: string;
  version: string;
  attribution: string;
  evidenceUrls: string[];
  island?: AgidIslandAssessment;
}

// Detailed regional extracts can refine part of an earlier shoreline window.
const detailedWindows = [...canadianIslands.windows, ...caribbeanUsIslands.windows];
export const reviewedWindows = [
  ...detailedWindows.map(w => ({ ...w, priority: 1 })),
  ...[...usCanadaShorelineWindows, ...mesoamericanWindows, ...southAmerica.windows].map(w => ({ ...w, priority: 0 })),
];

const surveySources = new Set([...detailedWindows, ...mesoamericanWindows, ...southAmerica.windows].map(w => w.source));
export function isReviewedGeographySource(source: string) {
  return isUsCanadaShorelineSource(source) || surveySources.has(source);
}

// Reject distant latitudes before scanning any polygons in globally used issuance paths.
const usCanadaSouth = Math.min(...usCanadaShorelineWindows.map(w => w.bbox[1]));
export function matchReviewedGeography(lat: number, lon: number): ReviewedGeographyMatch | undefined {
  return caribbeanUsIslands.match(lat, lon)
    ?? canadianIslands.match(lat, lon)
    ?? (lat >= usCanadaSouth ? matchUsCanadaShoreline(lat, lon) : undefined)
    ?? matchMesoamericanGeography(lat, lon)
    ?? southAmerica.match(lat, lon);
}

export function* queryReviewedPolygons(bounds: number[]) {
  yield* caribbeanUsIslands.query(bounds);
  yield* canadianIslands.query(bounds);
  yield* queryUsCanadaShorelinePolygons(bounds);
  yield* queryMesoamericanPolygons(bounds);
  yield* southAmerica.query(bounds);
}
