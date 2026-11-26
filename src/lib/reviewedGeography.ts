import { canadianIslands } from './canadianReviewedGeography';
import islands1 from '../data/african-islands/islands-1.json';
import islands2 from '../data/african-islands/islands-2.json';
import islands3 from '../data/african-islands/islands-3.json';
import islands4 from '../data/african-islands/islands-4.json';
import rivers from '../data/africanBorderRiversReviewed.json';
import { createSurveyRegion, type SurveyWindow } from './surveyRegion';
import { africanMainlandSource, matchAfricanMainland, queryAfricanMainland, type BorderNotice } from './africanMainland';
import { southAmerica } from './southAmericanReviewedGeography';
import { matchMesoamericanGeography, mesoamericanWindows, queryMesoamericanPolygons } from './mesoamericanReviewedGeography';
import { isUsCanadaShorelineSource, matchUsCanadaShoreline, queryUsCanadaShorelinePolygons, usCanadaShorelineWindows } from './usCanadaShorelines';
import type { AgidIslandAssessment } from './islandPolicy';

export type ReviewedOceanRegion = 'NEPC' | 'SEPC' | 'CARB' | 'NATL' | 'SATL' | 'NIND' | 'SIND' | 'ARCT' | 'STLA' | 'LABR' | 'HUDB';

export interface ReviewedGeographyMatch {
  surface: 'land' | 'water' | 'boundary' | 'unknown';
  surveyWindowId?: string;
  waterKind?: 'inland' | 'ocean';
  oceanRegion?: ReviewedOceanRegion;
  landform?: 'mainland' | 'island';
  codes: string[];
  ownershipReview: boolean;
  territoryPrefix?: string;
  policySurvey?: boolean;
  borderNotices?: BorderNotice[];
  adjacentRegions?: string[];
  mapDisagreement?: boolean;
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

const africanSurveys = createSurveyRegion([
  ...rivers.windows, ...islands1.windows, ...islands2.windows, ...islands3.windows, ...islands4.windows,
] as SurveyWindow[]);
export const reviewedWindows = [
  ...canadianIslands.windows.map(w => ({ ...w, priority: 1 })),
  ...[...usCanadaShorelineWindows, ...mesoamericanWindows, ...southAmerica.windows, ...africanSurveys.windows]
    .map(w => ({ ...w, priority: 0 })),
];

const surveySources = new Set([...canadianIslands.windows, ...mesoamericanWindows, ...southAmerica.windows, ...africanSurveys.windows].map(w => w.source));
export function isReviewedGeographySource(source: string) {
  return source === africanMainlandSource || isUsCanadaShorelineSource(source) || surveySources.has(source);
}

// Reject distant latitudes before scanning any polygons in globally used issuance paths.
const usCanadaSouth = Math.min(...usCanadaShorelineWindows.map(w => w.bbox[1]));
export function matchReviewedGeography(lat: number, lon: number): ReviewedGeographyMatch | undefined {
  return canadianIslands.match(lat, lon)
    ?? (lat >= usCanadaSouth ? matchUsCanadaShoreline(lat, lon) : undefined)
    ?? matchMesoamericanGeography(lat, lon)
    ?? southAmerica.match(lat, lon)
    ?? africanSurveys.match(lat, lon)
    ?? matchAfricanMainland(lat, lon);
}

export function* queryReviewedPolygons(bounds: number[]) {
  yield* canadianIslands.query(bounds);
  yield* queryUsCanadaShorelinePolygons(bounds);
  yield* queryMesoamericanPolygons(bounds);
  yield* southAmerica.query(bounds);
  yield* africanSurveys.query(bounds);
  yield* queryAfricanMainland(bounds);
}
