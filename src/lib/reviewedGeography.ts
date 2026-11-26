import { canadianIslands } from './canadianReviewedGeography';
import { southAmerica } from './southAmericanReviewedGeography';
import { matchMesoamericanGeography, mesoamericanWindows, queryMesoamericanPolygons } from './mesoamericanReviewedGeography';
import { isUsCanadaShorelineSource, matchUsCanadaShoreline, queryUsCanadaShorelinePolygons, usCanadaShorelineWindows } from './usCanadaShorelines';
import type { AgidIslandAssessment } from './islandPolicy';

export type ReviewedOceanRegion = 'NEPC' | 'SEPC' | 'CARB' | 'NATL' | 'SATL' | 'ARCT' | 'STLA' | 'LABR' | 'HUDB';

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

// Detailed Canadian extracts can refine part of a larger US/Canadian shoreline window.
export const reviewedWindows = [
  ...canadianIslands.windows.map(w => ({ ...w, priority: 1 })),
  ...[...usCanadaShorelineWindows, ...mesoamericanWindows, ...southAmerica.windows].map(w => ({ ...w, priority: 0 })),
];

const surveySources = new Set([...canadianIslands.windows, ...mesoamericanWindows, ...southAmerica.windows].map(w => w.source));
export function isReviewedGeographySource(source: string) {
  return isUsCanadaShorelineSource(source) || surveySources.has(source);
}

// Reject distant latitudes before scanning any polygons in globally used issuance paths.
const usCanadaSouth = Math.min(...usCanadaShorelineWindows.map(w => w.bbox[1]));
export function matchReviewedGeography(lat: number, lon: number): ReviewedGeographyMatch | undefined {
  return canadianIslands.match(lat, lon)
    ?? (lat >= usCanadaSouth ? matchUsCanadaShoreline(lat, lon) : undefined)
    ?? matchMesoamericanGeography(lat, lon)
    ?? southAmerica.match(lat, lon);
}

export function* queryReviewedPolygons(bounds: number[]) {
  yield* canadianIslands.query(bounds);
  yield* queryUsCanadaShorelinePolygons(bounds);
  yield* queryMesoamericanPolygons(bounds);
  yield* southAmerica.query(bounds);
}
