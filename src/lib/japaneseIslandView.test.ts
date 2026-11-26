import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isJapaneseIslandReviewArea, japaneseIslandSource,
  matchJapaneseIslandView, queryJapaneseIslandPolygons,
} from './japaneseIslandView';

const checks = [
  ['etorofu', 45.2037, 148.02797],
  ['kunashiri', 44.29104, 146.13370],
  ['shikotan', 43.80, 146.74],
  ['habomai', 43.39649, 145.85748], // Small Kaigara group beyond Nemuro
  ['takeshima', 37.24213, 131.86471], // West island, Ojima
  ['takeshima', 37.24002, 131.87016], // East island, Mejima
  ['senkaku', 25 + 44/60 + 39/3600, 123 + 28/60 + 5/3600], // Uotsuri
  ['senkaku', 25 + 43/60 + 23/3600, 123 + 33/60 + 1/3600], // Minamikojima
  ['senkaku', 25 + 55/60 + 28/3600, 123 + 40/60 + 47/3600], // Kubashima
  ['senkaku', 25 + 55/60 + 21/3600, 124 + 33/60 + 29/3600], // Taisho
  ['senkaku', 25.779392, 123.53896], // Small Okinokitaiwa rock, inside N03 shoreline
] as const;

test('Japan view requires land in all four northern groups and the offshore islands of Takeshima and Senkaku', () => {
  for (const [subgroup, lat, lon] of checks) {
    const r = matchJapaneseIslandView(lat, lon);
    assert.equal(r?.subgroup, subgroup, subgroup);
    assert.equal(r.code, 'JP');
    assert.equal(r.relation, 'inside');
    assert.equal(r.source, japaneseIslandSource.source);
    assert.equal(r.version, japaneseIslandSource.version);
    assert.ok(r.attribution.includes('国土交通省'));
  }
});

test('offshore points have no Japan claim even inside a group, and neighbouring land stays outside the correction', () => {
  for (const [lat, lon] of [[37.24,131.86], [37.241,131.8675], [25.75,123.55], [44.5,146.8]]) {
    assert.equal(matchJapaneseIslandView(lat, lon), undefined);
  }
  for (const [lat, lon] of [
    [43.384,145.817], // Hokkaido, Cape Nosappu
    [45.904941,149.990952], // Urup north of the claimed group
    [37.49,130.87], // Ulleungdo
    [24.41,124.18], // Ishigaki
  ]) {
    assert.equal(isJapaneseIslandReviewArea(lat, lon), false);
    assert.equal(matchJapaneseIslandView(lat, lon), undefined);
  }
});

test('disk queries return true outlines for canonical and world-copy longitudes', () => {
  const disk = [131.85, 37.23, 131.88, 37.25];
  const shapes = [...queryJapaneseIslandPolygons(disk)];
  assert.ok(shapes.length >= 2);
  for (const shape of shapes) assert.deepEqual(shape.codes, ['JP']);
  assert.equal([...queryJapaneseIslandPolygons([disk[0]-360,disk[1],disk[2]-360,disk[3]])].length, shapes.length);
  assert.equal([...queryJapaneseIslandPolygons([179,37,-179,38])].length, 0);
  const [lon, lat] = shapes[0].rings[0][0];
  assert.equal(matchJapaneseIslandView(lat, lon)?.relation, 'boundary');
});

test('ordinary remote Japanese islands retain their own status and exclude the atoll, detached works and offshore water', async () => {
  const { assessAgidGeography: assess } = await import('./geographicAssessment');
  const { encodeAGID } = await import('./agid');
  for (const [lat, lon, territory] of [
    [20.425255,136.069763,'okinotorishima'], [20.425615,136.081145,'okinotorishima'],
    [24.289194,153.980548,'minamitorishima'], [27.245431,140.880136,'nishinoshima'],
  ] as const) {
    assert.equal(matchJapaneseIslandView(lat, lon), undefined);
    const result = assess({kind:'pin', lat, lon});
    assert.deepEqual(result.island?.countryCodes, ['JP']);
    assert.equal(result.island?.territory, territory);
    assert.equal(result.island?.status, 'mapped');
    assert.equal(result.deliveryRegion, null);
    assert.equal(encodeAGID(lat,lon).regionCode, 'JP');
  }
  for (const [lat, lon] of [
    [20.423011,136.073875], [20.4252,136.075], [20.42,136.085],
    [24.279,153.98], [27.232,140.87], [27.248,140.898],
  ]) {
    assert.equal(assess({kind:'pin', lat, lon}).island, undefined);
    assert.equal(encodeAGID(lat,lon).isSea, true);
  }
  const uncertain = assess({kind:'pin', lat:20.425255, lon:136.069763, method:'device', accuracyMeters:10});
  assert.equal(uncertain.status,'needs-confirmation');
  assert.equal(uncertain.deliveryRegion,null);
});
