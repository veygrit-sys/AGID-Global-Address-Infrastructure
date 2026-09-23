import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  inspectEstoniaFeaturePages,
  inspectEstoniaGeoJsonPage,
  sourceDigest,
  validateEstoniaAuditReport,
} from './inspect-postal-context-ee-sources.mjs';

const report = JSON.parse(readFileSync(new URL('../reports/postal-context-m2/ee-source-review-2026-08-30.json', import.meta.url), 'utf8'));

const square = (x, y) => [[x, y], [x + 0.1, y], [x + 0.1, y + 0.1], [x, y + 0.1], [x, y]];
const feature = (code, id, geometry) => ({
  type: 'Feature',
  properties: { id, sihtnumber: code, stamp_cre: '2026-07-08T12:21:37.647' },
  geometry,
});
const collection = features => ({ type: 'FeatureCollection', features });

test('Estonia source digests are deterministic', () => {
  assert.equal(sourceDigest(Buffer.from('ee')), 'sha256:27a84712e4b22c415fc544d55cdee82327a829f96d03329457f76ebf9af4dcaa');
});

test('GeoJSON inspection preserves five digits and accepts real area geometry classes', () => {
  const result = inspectEstoniaGeoJsonPage(collection([
    feature(123, 1, { type: 'Polygon', coordinates: [square(24, 59)] }),
    feature('10621', 2, { type: 'MultiPolygon', coordinates: [[[...square(24.2, 59.2)]]] }),
  ]));
  assert.deepEqual(result.codes, ['00123', '10621']);
  assert.deepEqual(result.geometryTypes, { Polygon: 1, MultiPolygon: 1 });
  assert.equal(result.invalidGeometryCount, 0);
  assert.equal(result.ringIssueCount, 0);
  assert.throws(() => inspectEstoniaGeoJsonPage(collection([feature('1234', 3, { type: 'Polygon', coordinates: [square(24, 59)] })])), /ee-source-audit:postcode-0/);
});

test('paged inspection detects cross-page postcode and id collisions', () => {
  const page1 = collection([feature('10621', 1, { type: 'Polygon', coordinates: [square(24, 59)] })]);
  const page2 = collection([feature('10621', 1, { type: 'Polygon', coordinates: [square(25, 58)] })]);
  const result = inspectEstoniaFeaturePages([page1, page2]);
  assert.deepEqual(result.pageFeatureCounts, [1, 1]);
  assert.equal(result.crossPageDuplicatePostcodes, 1);
  assert.equal(result.crossPageDuplicateIds, 1);
});

test('fixed Estonia report remains fail-closed despite a real postcode MultiPolygon', () => {
  assert.deepEqual(validateEstoniaAuditReport(report), {
    references: 14,
    officialFeatures: 5436,
    invalidGeometry: 91,
    publishedImmutableArtifacts: 0,
    countryM2Achieved: false,
  });
});
