import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeAGID, encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo } from './agid';
import { matchPearlRiverDelta } from './pearlRiverDelta';

test('the two sides of each Pearl River Delta crossing retain their respective land regions', () => {
  const sites = [
    ['Futian weather station', 22.533333, 114, 'CN'],
    ['Hong Kong Observatory', 22.301944, 114.174167, 'HK'],
    ['Portas do Cerco, Macao', 22.215834, 113.548975, 'MO'],
    ['Gongbei, Zhuhai', 22.2208, 113.549, 'CN'],
    ['Guia Lighthouse, Macao', 22.198333, 113.550556, 'MO'],
    ['Coloane village, Macao', 22.1176, 113.5516, 'MO'],
  ] as const;
  for (const [site, lat, lon, code] of sites) {
    const match = matchPearlRiverDelta(lat, lon);
    assert.equal(match?.surface, 'land', site);
    assert.deepEqual(match.codes, [code], site);
    const region = getRegionInfo(lat, lon);
    assert.equal(region.isSea, false, site);
    assert.equal(region.mapUnitMatch?.source, 'fieldmaps-usgs-lsib', site);
    for (const encode of [encodeAGID, encodeAGID16]) {
      assert.equal(encode(lat, lon).regionCode, code, site);
    }
  }
});

test('both countries survive at shared vertices and edge midpoints', () => {
  const edges = [
    { a: [114.0654582, 22.5170013], b: [114.0657194, 22.5170955], north: 'CN', south: 'HK' },
    { a: [113.5350233, 22.2070469], b: [113.5346791, 22.2073667], north: 'MO', south: 'CN' },
  ];
  for (const { a, b, north, south } of edges) {
    const lon = (a[0] + b[0]) / 2;
    const lat = (a[1] + b[1]) / 2;
    for (const [x, y] of [a, [lon, lat]]) {
      const match = matchPearlRiverDelta(y, x);
      assert.equal(match?.relation, 'boundary');
      assert.deepEqual(match.codes, [north, south].sort());
      assert.deepEqual(getRegionInfo(y, x).mapUnitMatch?.codes, match.codes);
    }
    assert.deepEqual(matchPearlRiverDelta(lat + 0.00005, lon)?.codes, [north]);
    assert.deepEqual(matchPearlRiverDelta(lat - 0.00005, lon)?.codes, [south]);
  }
});

test('existing IDs for Futian and Portas do Cerco decode to the same cells after region correction', () => {
  for (const [lat, lon, oldId] of [
    [22.533333, 114, 'HK0AG22BYW3W1N4E'],
    [22.215834, 113.548975, 'CN0AG3CKSSC81DHH'],
  ] as const) {
    const updated = encodeAGID16(lat, lon);
    assert.equal(decodeAGID(oldId)?.prefix, oldId.slice(0, 2));
    assert.notEqual(updated.regionCode, oldId.slice(0, 2));
    assert.equal(getAGIDCellKey(oldId), getAGIDCellKey(updated.id));
  }
});

test('positive estuary and harbour water has no land region and map gaps stay unknown', () => {
  for (const [lat, lon] of [[22.289, 114.17], [22.14, 113.64]]) {
    const match = matchPearlRiverDelta(lat, lon);
    assert.equal(match?.surface, 'water');
    assert.deepEqual(match.codes, []);
    const region = getRegionInfo(lat, lon);
    assert.equal(region.isSea, true);
    assert.equal(region.waterMatch?.source, match.source);
    assert.equal(region.mapUnitMatch, undefined);
  }
  const gap = matchPearlRiverDelta(22.1581, 114.2541);
  assert.equal(gap?.surface, 'unknown');
  assert.deepEqual(gap.codes, []);
  assert.equal(matchPearlRiverDelta(22.2, 113.7), undefined);
});
