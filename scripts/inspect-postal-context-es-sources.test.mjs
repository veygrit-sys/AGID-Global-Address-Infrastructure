import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspectSpainSample, sourceDigest, validateSpainAuditReport } from './inspect-postal-context-es-sources.mjs';

const report = JSON.parse(readFileSync(new URL('../reports/postal-context-m2/es-source-review-2026-08-30.json', import.meta.url), 'utf8'));
const candidates = [{ type: 'Codpost', postalCode: '28013', geom: null }];
const find = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { postalCode: '28013' }, geometry: { type: 'Point', coordinates: [-3.71, 40.42] } }] };
const featureInfo = { type: 'FeatureCollection', features: [{ type: 'Feature', id: 'codigo-postal.1', properties: { cod_postal: '28013', alta_db: '2026-01-13T13:14:31Z', fecha_alta: 20260112 }, geometry: { type: 'Polygon', coordinates: [[[-3.72,40.41],[-3.69,40.41],[-3.69,40.43],[-3.72,40.41]]] } }], totalFeatures: 'unknown', numberReturned: 1, timeStamp: '2026-08-30T04:43:03.302Z' };

test('Spain source digests are deterministic', () => {
  assert.equal(sourceDigest(Buffer.from('es')), 'sha256:c0bc1e08f9743b2d50d5f1607503bf4e849af0e729fca896515bea955d70a33e');
});

test('sample audit distinguishes geocoder point from WMS Polygon', () => {
  const result = inspectSpainSample(candidates, find, featureInfo);
  assert.equal(result.postcode, '28013');
  assert.equal(result.findGeometryType, 'Point');
  assert.equal(result.featureInfoGeometryType, 'Polygon');
  assert.equal(result.ringCount, 1);
});

test('sample audit rejects an invented or open area', () => {
  const bad = structuredClone(featureInfo);
  bad.features[0].geometry.coordinates[0].pop();
  assert.throws(() => inspectSpainSample(candidates, find, bad), /es-source-audit:featureinfo-open-ring/);
});

test('fixed Spain report remains fail-closed despite a real official Polygon', () => {
  assert.deepEqual(validateSpainAuditReport(report), { references: 10, samplePostcode: '28013', sampleGeometryType: 'Polygon', productionEligibleRecords: 0, countryM2Achieved: false });
});
