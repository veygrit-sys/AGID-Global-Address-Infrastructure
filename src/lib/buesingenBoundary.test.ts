import assert from 'node:assert/strict';
import test from 'node:test';
import data from '../data/buesingenBoundary.json';
import { encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo, toAGID16 } from './agid';
import { matchBuesingenBoundary } from './buesingenBoundary';

test('official country geometries identify the German exclave and Swiss surroundings', () => {
  const samples = [
    [47.700, 8.68333, 'DE'], // Büsingen administrative representative point
    [47.695, 8.687, 'DE'],
    [47.684, 8.655, 'CH'], [47.717, 8.720, 'CH'],
    [47.717, 8.670, 'CH'], [47.680, 8.680, 'CH'],
  ] as const;
  for (const [lat, lon, code] of samples) {
    const match = matchBuesingenBoundary(lat, lon);
    assert.equal(match?.relation, 'inside');
    assert.deepEqual(match.codes, [code]);
    assert.equal(match.attribution, 'Federal Office of Topography swisstopo');
    const region = getRegionInfo(lat, lon);
    assert.equal(region.prefix, code);
    assert.deepEqual(region.administrativeMatch, match);
    for (const encode of [encodeAGID, encodeAGID16]) {
      const encoded = encode(lat, lon);
      assert.equal(encoded.regionCode, code);
      assert.deepEqual(encoded.administrativeMatch, match);
    }
  }
});

test('a Büsingen ID issued with the legacy Swiss hint keeps its cell and original prefix', () => {
  const old = 'CH0GY834AKPW';
  const checked = toAGID16(old);
  assert.equal(checked, 'CH0GY834AKPW1C2Q');
  const corrected = encodeAGID16(47.7, 8.68333);
  assert.equal(corrected.prefix, 'DE');
  assert.equal(getAGIDCellKey(corrected.id), getAGIDCellKey(checked));
});

test('recovers both candidates on the shared border without importing the clipping window as a border', () => {
  const [[ax, ay], [bx, by]] = data.ring;
  for (const [lon, lat] of [[ax, ay], [(ax + bx) / 2, (ay + by) / 2]]) {
    const match = matchBuesingenBoundary(lat, lon);
    assert.equal(match?.relation, 'boundary');
    assert.deepEqual(match.codes, ['CH', 'DE']);
  }
  for (const [lat, lon] of [[47.70, 8.653], [47.719, 8.722], [47.75, 8.69], [NaN, 8.68], [47.7, NaN]]) {
    assert.equal(matchBuesingenBoundary(lat, lon), undefined);
  }
});

test('enclave pilot preserves the existing Vatican City and Rome assignments', () => {
  for (const [lat, lon, code] of [[41.902160, 12.457360, 'VA'], [41.890222, 12.492306, 'IT']] as const) {
    assert.equal(matchBuesingenBoundary(lat, lon), undefined);
    assert.equal(getRegionInfo(lat, lon).prefix, code);
  }
});
