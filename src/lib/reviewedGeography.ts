import { southAmerica } from './southAmericanReviewedGeography';
import { matchMesoamericanGeography, mesoamericanWindows, queryMesoamericanPolygons } from './mesoamericanReviewedGeography';
import { isUsCanadaShorelineSource, matchUsCanadaShoreline, queryUsCanadaShorelinePolygons, usCanadaShorelineWindows } from './usCanadaShorelines';
import type { AgidIslandAssessment } from './islandPolicy';

export type ReviewedOceanRegion = 'NEPC' | 'SEPC' | 'CARB' | 'NATL' | 'SATL';

export interface ReviewedGeographyMatch {
  surface: 'land' | 'water' | 'boundary' | 'unknown';
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

export const reviewedWindows = [...usCanadaShorelineWindows, ...mesoamericanWindows, ...southAmerica.windows];

const surveySources = new Set([...mesoamericanWindows, ...southAmerica.windows].map(w => w.source));
export function isReviewedGeographySource(source: string) {
  return isUsCanadaShorelineSource(source) || surveySources.has(source);
}

// Reject distant latitudes before scanning any polygons in globally used issuance paths.
const usCanadaSouth = Math.min(...usCanadaShorelineWindows.map(w => w.bbox[1]));
export function matchReviewedGeography(lat: number, lon: number): ReviewedGeographyMatch | undefined {
  return (lat >= usCanadaSouth ? matchUsCanadaShoreline(lat, lon) : undefined)
    ?? matchMesoamericanGeography(lat, lon)
    ?? southAmerica.match(lat, lon);
}

export function* queryReviewedPolygons(bounds: number[]) {
  yield* queryUsCanadaShorelinePolygons(bounds);
  yield* queryMesoamericanPolygons(bounds);
  yield* southAmerica.query(bounds);
}
