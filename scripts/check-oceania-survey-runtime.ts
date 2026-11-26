/** Batch bridge for the Shapely differential check in verify-oceania-survey-runtime.py. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchReviewedGeography, queryReviewedPolygons } from '../src/lib/reviewedGeography';
import { createSurveyRegion, type SurveyWindow } from '../src/lib/surveyRegion';

type ShapeHit = [string, number[], ...string[]];
interface PointCheck {
  id: string; lat: number; lon: number;
  expected: {
    surface: string; kind: string | null; codes: string[]; ocean: string | null;
    island: string | null; sovereigns: string[]; review: boolean;
  };
}
interface QueryCheck {
  id: string; bbox: number[]; expected: ShapeHit[];
}
interface Batch { points: PointCheck[]; queries: QueryCheck[]; fixture?: SurveyWindow[] }

const batches: Batch[] = JSON.parse(readFileSync(0, 'utf8'));
for (const { fixture, points, queries } of batches) {
  const { match, query } = fixture ? createSurveyRegion(fixture)
    : { match: matchReviewedGeography, query: queryReviewedPolygons };
  if (fixture) {
    assert.equal(match(NaN, 180), undefined);
    assert.equal(match(fixture[0].bbox[1], Infinity), undefined);
  }
  for (const { id, lat, lon, expected } of points) {
    for (const shift of [-360, 0, 360]) {
      const hit = match(lat, lon + shift);
      const where = `${id} at (${lon + shift}, ${lat})`;
      assert.equal(hit?.surveyWindowId, id, where);
      assert.deepEqual({
        surface: hit.surface, kind: hit.waterKind ?? hit.landform ?? null, codes: hit.codes,
        ocean: hit.oceanRegion ?? null, island: hit.island?.territory ?? null,
        sovereigns: hit.island?.sovereignCodes ?? [], review: hit.ownershipReview,
      }, expected, where);
    }
  }
  for (const { id, bbox, expected } of queries) {
    const keys = (hits: ShapeHit[]) => hits.map(hit => JSON.stringify(hit)).sort();
    for (const shift of [-360, 0, 360]) {
      const [w, s, e, n] = bbox;
      const hits: ShapeHit[] = [];
      for (const hit of query([w + shift, s, e + shift, n])) {
        if ('surveyWindowId' in hit && hit.surveyWindowId === id) hits.push([hit.kind, hit.bbox, ...hit.codes]);
      }
      assert.deepEqual(keys(hits), keys(expected), `${id}: candidate boxes near ${w + shift}, ${s}`);
    }
  }
}
