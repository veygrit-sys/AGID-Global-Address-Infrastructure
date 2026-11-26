import assert from 'node:assert/strict';
import { test } from 'node:test';
import { globalIslandCoverage, isGlobalInlandWater, legacyIslandAtInlandWater, matchGlobalIsland, matchGlobalLandform, mayTouchGlobalInlandWater, queryGlobalIslandPolygons } from './globalIslands';

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

test('separately mapped island components identify Borneo without giving its satellites the same countries', () => {
  const brunei = matchGlobalLandform(4.89,114.94,10);
  const malaysia = matchGlobalLandform(5.25,116.4);
  assert.equal(brunei?.kind,'island');
  assert.deepEqual(brunei.sharedIslandCountryCodes,['BN','ID','MY']);
  assert.equal(malaysia?.physicalId,brunei.physicalId);
  for (const [lat,lon] of [[2.1137085,117.8612687425],[-2.0020975,137.21],[54.418694,-8.50174082]]) {
    assert.equal(matchGlobalLandform(lat,lon)?.sharedIslandCountryCodes,undefined);
  }
  assert.equal(matchGlobalLandform(-16.85,180)?.physicalId, matchGlobalLandform(-16.85,-180)?.physicalId);
});

test('continental positives need physical land and respect the extent of a pin', () => {
  for (const [lat,lon] of [[47.7,8.68333],[45.968,8.972],[42.465,1.980],[51.439542,4.9229224],
    [41.90216,12.45736],[-29.31,27.49],[-5.56,12.19]]) {
    const form = matchGlobalLandform(lat,lon,3);
    assert.equal(form?.kind,'mainland');
    assert.match(form.attribution ?? '', /ESA WorldCover/);
  }
  assert.equal(matchGlobalLandform(47.7,8.68333,5000),undefined);
  assert.equal(matchGlobalLandform(-25,135)?.kind, 'mainland');
  assert.equal(matchGlobalLandform(45.9678,8.9638),undefined); // Lake Lugano
  assert.equal(matchGlobalLandform(39.17616667,45.3605),undefined); // Reservoir island
  for (const [lat,lon] of [[24.937875,-108.0787825823],[53.9641665,14.7340555072]]) {
    assert.notEqual(matchGlobalLandform(lat,lon)?.kind,'mainland');
  }
});

test('strict inland water veto applies to global island country geometry and preserves uncertain coasts', () => {
  for (const [lat,lon] of [[2.7,98.86],[-38.82,175.93],[-5.3245975,147.09981925],
    [22.106597,113.2949307296],[32.563514,130.47343925409487],[45.9678,8.9638]]) {
    assert.equal(isGlobalInlandWater(lat,lon),true);
    assert.equal(matchGlobalIsland(lat,lon),undefined);
  }
  assert.equal(isGlobalInlandWater(45.85,-82.18),false); // Land on Manitoulin Island
  assert.equal(mayTouchGlobalInlandWater(47.7,8.68333,10),false);
  assert.equal(isGlobalInlandWater(45.9678,8.9638,5000),false);
  // Raw Maldives map-unit polygon protrudes beyond the independently surveyed physical shape.
  assert.equal(matchGlobalIsland(0.238857,73.21316970456542),undefined);
});

test('historic routing lookup retains a source-covered lake only for the same pin', () => {
  assert.equal(matchGlobalIsland(2.7,98.86),undefined);
  const old = legacyIslandAtInlandWater(2.7,98.86);
  assert.ok(old);
  assert.deepEqual(old.codes,['ID']);
  old.codes.push('XX');
  assert.deepEqual(legacyIslandAtInlandWater(2.7,98.86)?.codes,['ID']);
  assert.equal(legacyIslandAtInlandWater(2.7,98.861),undefined);
  assert.equal(legacyIslandAtInlandWater(2.701,98.86),undefined);
  assert.equal(matchGlobalIsland(52.52,13.4),undefined);
  assert.equal(legacyIslandAtInlandWater(2.7,98.86),undefined);
});
