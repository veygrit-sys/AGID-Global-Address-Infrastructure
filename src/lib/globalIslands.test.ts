import assert from 'node:assert/strict';
import { test } from 'node:test';
import { globalIslandCoverage, matchGlobalIsland, queryGlobalIslandPolygons } from './globalIslands';

test('a shared island uses the map unit containing the point on each side', () => {
  for (const [lat, lon, territory, sovereign] of [
    [4.89, 114.94, 'BN', 'BN'], [5.25, 116.4, 'MY', 'MY'], [-0.49, 117.15, 'ID', 'ID'],
    [-5, 139.5, 'ID', 'ID'], [-5, 145, 'PG', 'PG'],
    [18.06, -63.075, 'MF', 'FR'], [18.028, -63.045, 'SX', 'NL'],
  ] as const) {
    const result = matchGlobalIsland(lat, lon);
    assert.deepEqual(result?.codes, [territory], `${lat},${lon}`);
    assert.deepEqual(result?.sovereignCodes, [sovereign]);
  }
  // Interior of an exact shared edge in the pinned map units, away from its endpoints.
  const hit = matchGlobalIsland((18.06212 + 18.058511) / 2, (-63.107004 - 63.085886) / 2);
  assert.equal(hit?.relation, 'boundary');
  assert.deepEqual(hit?.codes, ['MF','SX']);
});

test('keeps overseas and sovereign source codes independent and skips continental land', () => {
  for (const [lat, lon, territory, sovereign] of [
    [71, -42, 'GL', 'DK'], [-21.13, 55.5, 'RE', 'FR'], [18, -66.4, 'PR', 'US'],
    [-29.036, 167.95, 'NF', 'AU'], [21.311, -157.848, 'US', 'US'], [7.88, 80.77, 'LK', 'LK'],
  ] as const) {
    const hit = matchGlobalIsland(lat, lon);
    assert.deepEqual(hit?.codes, [territory]);
    assert.deepEqual(hit?.sovereignCodes, [sovereign]);
  }
  for (const [lat, lon] of [[52.52,13.4], [-24,135], [66.61,-177.43], [0,0], [35.35,139.76], [95,20], [NaN,0]]) {
    assert.equal(matchGlobalIsland(lat, lon), undefined, `${lat},${lon}`);
  }
  assert.equal(globalIslandCoverage.sourceMapUnitPolygons,
    globalIslandCoverage.islandMapUnitPolygons + globalIslandCoverage.mainlandPolygons);
});

test('uses the continuous island at the antimeridian for both point and disk lookup', () => {
  for (const lon of [-540,-180,180,540]) {
    const result = matchGlobalIsland(-16.85, lon);
    assert.deepEqual(result?.codes, ['FJ']);
    assert.equal(result?.relation, 'inside');
    assert.ok([...queryGlobalIslandPolygons([lon - .001,-16.851,lon + .001,-16.849])].some(p => p.codes.includes('FJ')));
  }
  assert.equal(matchGlobalIsland(-16.85, -179.7), undefined);
  assert.ok([...queryGlobalIslandPolygons([179.98,-16.86,-179.98,-16.84])].some(p => p.codes.includes('FJ')));
});
