import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  inspectDenmarkGeoJson,
  inspectDenmarkJsonList,
  sourceDigest,
  validateDenmarkAuditReport,
} from './inspect-postal-context-dk-sources.mjs';

const report = JSON.parse(readFileSync(new URL('../reports/postal-context-m2/dk-source-review-2026-08-30.json', import.meta.url), 'utf8'));

function collection(secondRing = [[12.1,55.1],[12.2,55.1],[12.2,55.2],[12.1,55.2],[12.1,55.1]]) {
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { nr: '0012', navn: 'Leading zero', stormodtager: false }, geometry: { type: 'MultiPolygon', coordinates: [[[[12,55],[12.1,55],[12.1,55.1],[12,55.1],[12,55]]]] } },
      { type: 'Feature', properties: { nr: '2400', navn: 'Sample', stormodtager: false }, geometry: { type: 'MultiPolygon', coordinates: [[secondRing]] } },
    ],
  };
}

test('Danish source digests are deterministic', () => {
  assert.equal(sourceDigest(Buffer.from('dk')), 'sha256:867b4bf4357a7c0e415ffd537f61ea8785dd47113104000b534a130c98a42ce8');
});

test('GeoJSON inspection preserves leading zeroes and validates MultiPolygon rings', () => {
  const valid = inspectDenmarkGeoJson(collection());
  assert.deepEqual(valid.codes, ['0012', '2400']);
  assert.equal(valid.geometryTypes.MultiPolygon, 2);
  assert.equal(valid.invalidGeometryCount, 0);
  assert.equal(valid.ringIssueCount, 0);
  const broken = inspectDenmarkGeoJson(collection([[12.1,55.1],[12.2,55.1],[12.1,55.1]]));
  assert.equal(broken.invalidGeometryCount, 1);
  assert.deepEqual(broken.ringIssueCodes, ['2400']);
});

test('postcode-list inspection rejects duplicate or malformed denominator claims', () => {
  assert.deepEqual(inspectDenmarkJsonList([{ nr: '0012' }, { nr: '2400' }]), { recordCount: 2, codes: ['0012', '2400'], duplicateCodeCount: 0 });
  assert.equal(inspectDenmarkJsonList([{ nr: '0012' }, { nr: '0012' }]).duplicateCodeCount, 1);
  assert.throws(() => inspectDenmarkJsonList([{ nr: '12' }]), /dk-source-audit:json-postcode-0/);
});

test('fixed Denmark report remains fail-closed despite real public polygons and permissive terms', () => {
  assert.deepEqual(validateDenmarkAuditReport(report), {
    references: 11,
    officialFeatures: 1089,
    invalidGeometry: 39,
    publishedImmutableArtifacts: 0,
    countryM2Achieved: false,
  });
});
