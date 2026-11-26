import { matchMesoamericanGeography, mesoamericanWindows, queryMesoamericanPolygons } from './mesoamericanReviewedGeography';
import { isUsCanadaShorelineSource, matchUsCanadaShoreline, queryUsCanadaShorelinePolygons, usCanadaShorelineWindows } from './usCanadaShorelines';
import type { AgidIslandAssessment } from './islandPolicy';

export interface ReviewedGeographyMatch {
  surface: 'land' | 'water' | 'boundary' | 'unknown';
  waterKind?: 'inland' | 'ocean';
  oceanRegion?: 'NEPC' | 'CARB';
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

export const reviewedWindows = [...usCanadaShorelineWindows, ...mesoamericanWindows];

const mesoamericanSources = new Set(mesoamericanWindows.map(w => w.source));
export function isReviewedGeographySource(source: string) {
  return isUsCanadaShorelineSource(source) || mesoamericanSources.has(source);
}

// Reject distant latitudes before scanning any polygons in globally used issuance paths.
const usCanadaSouth = Math.min(...usCanadaShorelineWindows.map(w => w.bbox[1]));
const mesoSouth = Math.min(...mesoamericanWindows.map(w => w.bbox[1]));
const mesoNorth = Math.max(...mesoamericanWindows.map(w => w.bbox[3]));
export function matchReviewedGeography(lat: number, lon: number): ReviewedGeographyMatch | undefined {
  if (lat >= mesoSouth && lat <= mesoNorth) {
    const local = matchMesoamericanGeography(lat, lon);
    if (local) return local;
  }
  if (lat >= usCanadaSouth) return matchUsCanadaShoreline(lat, lon);
}

export function* queryReviewedPolygons(bounds: number[]) {
  yield* queryUsCanadaShorelinePolygons(bounds);
  yield* queryMesoamericanPolygons(bounds);
}
