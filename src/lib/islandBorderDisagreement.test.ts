import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeAGID16, getRegionInfo } from './agid';
import { assessAgidGeography } from './geographicAssessment';
import { chelemReviewSource, chelemSurveySource, matchIslandBorderReview } from './islandBorderDisagreement';
import { islandDisplayRows } from './islandDisplay';
import { applyIslandPolicyToEvidence } from './islandPolicy';

const official = { lat: 18 + 11/60 + 34.780/3600, lon: -(87 + 53/60 + 10.895/3600) };
const gap = { lat: 18.188, lon: -87.88240989966037 };

test('the official Cayo Chelem dry-land polygon confirms the Mexican country, including against a coarse Belize tag', () => {
  const mapped = getRegionInfo(official.lat, official.lon);
  assert.deepEqual(mapped.island?.countryCodes, ['MX']);
  assert.equal(mapped.island?.source, chelemSurveySource);
  assert.equal(mapped.prefix, 'MX');
  for (const codes of [['BZ'], ['MX']]) {
    assert.deepEqual(applyIslandPolicyToEvidence(official.lat, official.lon + 360,
      { codes, relation: 'inside', source: 'external', version: 'test' })?.countryCodes, ['MX']);
  }
  const cell = encodeAGID16(official.lat, official.lon);
  for (const result of [assessAgidGeography({ kind: 'pin', ...official, accuracyMeters: 30 }),
    assessAgidGeography({ kind: 'cell', id: 'BZ' + cell.hash })]) {
    assert.equal(result.status, 'mapped');
    assert.deepEqual(result.regionCandidates, ['MX']);
    assert.equal(result.deliveryRegion, null);
  }
});

test('conflicting shorelines at the representative location yield a review without inferred claimants', () => {
  for (const accuracyMeters of [0, 30]) {
    const result = assessAgidGeography({ kind: 'pin', ...gap, accuracyMeters });
    assert.equal(result.status, 'needs-confirmation');
    assert.equal(result.surface, 'unknown');
    assert.equal(result.territorialTopology?.status, 'uncertain');
    assert.deepEqual(result.regionCandidates, []);
    const island = result.island!;
    assert.equal(island.source, chelemReviewSource);
    assert.deepEqual(island.countryCodes, []);
    assert.equal(island.status, 'unresolved');
    assert.equal(island.claimantCodes, undefined);
    assert.ok(island.evidenceUrls?.some(url => url.includes('inegi.org.mx')));
    assert.match(JSON.stringify(islandDisplayRows(island, true, c => c.join(','))), /資料が一致しない/);
  }
});

test('shoreline crossings keep confirmed land as a candidate and do not extend the rejected Belize tag to this island', () => {
  for (const center of [official, gap]) {
    const near = assessAgidGeography({ kind: 'pin', ...center, accuracyMeters: 600 });
    assert.deepEqual(near.regionCandidates, ['MX']);
    assert.equal(near.island?.status, 'unresolved');
    assert.equal(near.status, 'needs-confirmation');
  }
  const wide = assessAgidGeography({ kind: 'pin', ...official, accuracyMeters: 5_000 });
  assert.deepEqual(wide.regionCandidates, ['BZ', 'MX']);
  assert.equal(matchIslandBorderReview(18.2, -87.92), undefined);
  assert.equal(getRegionInfo(18.2, -87.92).island, undefined);
  assert.deepEqual(getRegionInfo(18.05, -87.93).island?.countryCodes, ['BZ']);
});
