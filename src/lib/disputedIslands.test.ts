import assert from 'node:assert/strict';
import test from 'node:test';
import data from '../data/disputedIslandGeometry.json';
import {
  matchDisputedIsland, matchRevisedIslandRegion, needsIslandPolicyReview,
  queryDisputedIslandPolygons, queryRevisedIslandPolygons,
} from './disputedIslands';

test('a Falklands/Malvinas land hit has both claimants and a separate administration', () => {
  const location = [-51.794, -58.61] as const;
  const result = matchDisputedIsland(...location)!;
  assert.equal(result.status, 'disputed');
  assert.equal(result.administeringCode, 'GB');
  assert.deepEqual(result.claimantCodes, ['AR', 'GB']);
  result.claimantCodes.pop();
  assert.deepEqual(matchDisputedIsland(...location)?.claimantCodes, ['AR', 'GB']);
  assert.equal(matchDisputedIsland(-52, -56), undefined);
});

test('competing claims follow positive island shapes, including small islands missing from global Administrative Disputes', () => {
  for (const [lat, lon, expected] of [
    [44.5024, -67.10159, ['CA', 'US']], [26.2419, 55.1472, ['AE', 'IR']],
    [26.265, 55.305, ['AE', 'IR']], [37.04749, 27.14549, ['GR', 'TR']],
    [15.1205179, 117.8400019, ['CN', 'PH', 'TW']], [-15.889, 54.518, ['FR', 'MU']],
  ] as const) assert.deepEqual(matchDisputedIsland(lat, lon)?.claimantCodes, expected);
  for (const [lat, lon] of [[44.503, -67.08], [37.048, 27.148], [26.25, 55.20], [-15.889, 54.55]]) {
    assert.equal(matchDisputedIsland(lat, lon), undefined);
  }
});

test('an archipelago does not share one administrator or assign all claimants to each reef', () => {
  const island = matchDisputedIsland(8.6446992, 111.9201361)!;
  assert.equal(island.territory, 'Spratly Islands');
  assert.equal(island.claimScope, 'island-group');
  assert.equal(island.administeringCode, null);
  assert.deepEqual(island.claimantCodes, ['BN', 'CN', 'MY', 'PH', 'TW', 'VN']);
  assert.equal(matchDisputedIsland(9.5, 113), undefined);
  assert.equal(needsIslandPolicyReview(9.5, 113), true);
  // A review window by itself is never positive land or a country.
  assert.equal(needsIslandPolicyReview(-33.9, 151.2), false);
  assert.equal(matchDisputedIsland(9.5, 113 + 360), undefined);
});

test('historical claims yield review or a separately evidenced revised attribution', () => {
  for (const [lat, lon] of [[80.82629, -66.44927], [35.3459, 33.8151]]) {
    const match = matchDisputedIsland(lat, lon)!;
    assert.equal(match.status, 'review-required');
    assert.equal(match.administeringCode, null);
    assert.deepEqual(match.claimantCodes, []);
  }
  // The older Hans Island geometry is displaced into water in the newer coastline.
  assert.equal(matchDisputedIsland(80.82695, -66.33765), undefined);
  for (const [lat, lon, iso] of [[27.94368, 34.7016, 'SA'], [0.809111, 9.378858, 'GQ']] as const) {
    const result = matchRevisedIslandRegion(lat, lon)!;
    assert.equal(result.code, iso);
    assert.equal(result.status, 'revised');
    assert.ok(result.evidenceUrls.some(s => s.startsWith('https://')));
    assert.equal(matchDisputedIsland(lat, lon), undefined);
    assert.ok(queryRevisedIslandPolygons([lon - 0.01, lat - 0.01, lon + 0.01, lat + 0.01]).length);
  }
});

test('exact shores are boundaries and disk queries include a real intersecting polygon in wrapped charts', () => {
  const fk = data.groups.find(g => g.id === 'B12')!;
  const [x, y] = fk.polygons[0].rings[0][0];
  assert.equal(matchDisputedIsland(y, x)?.relation, 'boundary');
  assert.equal(matchDisputedIsland(y, x + 360)?.relation, 'boundary');
  const small = [x - .01, y - .01, x + .01, y + .01];
  const wrapped = [small[0] + 360, small[1], small[2] + 360, small[3]];
  const names = (q: number[]) => queryDisputedIslandPolygons(q).map(p => p.territory);
  assert.ok(names(small).includes('Falkland Islands (Malvinas)'));
  assert.deepEqual(names(wrapped), names(small));
  assert.deepEqual(names([179, -1, 181, 1]), []);
  for (const [lat, lon] of [[44.03, 145.87], [25.745, 123.47], [37.242, 131.864]]) {
    assert.equal(matchDisputedIsland(lat, lon), undefined);
    assert.equal(needsIslandPolicyReview(lat, lon), false);
  }
});
