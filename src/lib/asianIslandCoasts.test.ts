import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAGID, encodeAGID16, getAGIDCellKey } from './agid';
import { assessAgidGeography } from './geographicAssessment';
import { matchRegionalCoast } from './pearlRiverDelta';

const land = [
  ['Ishigaki', 24.41, 124.2, 'JP'],
  ['Iriomote', 24.33, 123.82, 'JP'],
  ['Jeju', 33.38, 126.56, 'KR'],
  ['Udo', 33.505, 126.953, 'KR'],
  ['Sanya', 18.25, 109.51, 'CN'],
  ['Agatti', 10.85, 72.19, 'IN'],
  ['Kavaratti', 10.565, 72.639, 'IN'],
  ['Pamban', 9.277, 79.257, 'IN'],
  ['Delft', 9.515, 79.69, 'LK'],
  ['Mannar', 9.035, 79.85, 'LK'],
  ['Male', 4.175, 73.509, 'MV'],
  ['Bandos', 4.2691, 73.4915, 'MV'],
  ['Huraa', 4.3352, 73.6013, 'MV'],
  ['Kurumba', 4.2276, 73.5209, 'MV'],
  ['Kuda Bandos', 4.26391, 73.50085, 'MV'],
  ['Kutubdia', 21.825, 91.855, 'BD'],
  ['Sandwip', 22.49, 91.49, 'BD'],
  ['Astola', 25.123, 63.846, 'PK'],
  ['Bahrain', 26.04, 50.55, 'BH'],
  ['Failaka', 29.44, 48.32, 'KW'],
  ['Bubiyan', 29.77, 48.25, 'KW'],
  ['Masirah', 20.46, 58.81, 'OM'],
  ['Farasan', 16.76, 42.09, 'SA'],
] as const;

const water = [
  ['Yaeyama passage', 24.31, 124.005],
  ['Off Ishigaki', 24.46, 124.11],
  ['East of Jeju', 33.42, 126.99],
  ['South of Jeju', 33.18, 126.6],
  ['West of Jeju', 33.3, 126.13],
  ['Southwest of Hainan', 18.21, 109.35],
  ['South of Hainan', 18.2, 110.1],
  ['Wonsan Bay', 39.175, 127.544],
  ['Outer Wonsan Bay', 39.19, 127.578],
  ['Lakshadweep passage', 10.7, 72.45],
  ['North Male lagoon', 4.25, 73.45],
  ['Kutubdia Channel', 21.827, 91.887],
  ['Sandwip Channel', 22.45, 91.62],
  ['North of Astola', 25.18, 63.85],
  ['West of Bahrain', 26.03, 50.43],
  ['East of Bahrain', 26.03, 50.68],
  ['West of the causeway', 26.21, 50.35],
  ['Kuwait Bay', 29.415, 48.12],
  ['West of Failaka', 29.43, 48.23],
  ['Masirah Channel', 20.42, 58.65],
  ['East of Farasan', 16.71, 42.3],
  ['South of Penghu', 23.48, 119.58],
] as const;

test('Asian island and coastal land resolves to its own region through both issuers', () => {
  for (const [name, lat, lon, code] of land) {
    const pin = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(pin.surface, 'land', name);
    assert.deepEqual(pin.regionCandidates, [code], name);
    assert.equal(pin.deliveryRegion, null, name);
    for (const issue of [encodeAGID, encodeAGID16]) {
      const id = issue(lat, lon);
      assert.equal(id.isSea, false, name);
      assert.equal(id.regionCode, code, name);
    }
  }
});

test('open passages and lagoons return positive water evidence and no country candidates', () => {
  for (const [name, lat, lon] of water) {
    const pin = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(pin.surface, 'water', name);
    assert.deepEqual(pin.regionCandidates, [], name);
    assert.equal(pin.island, undefined, name);
    for (const issue of [encodeAGID, encodeAGID16]) {
      const id = issue(lat, lon);
      assert.equal(id.isSea, true, name);
      assert.equal(id.waterMatch?.source, 'fieldmaps-usgs-lsib+natural-earth-10m-ocean', name);
    }
  }
});

test('isolated components surrounded by mapped ocean retain small islands absent from the coarse shoreline', () => {
  for (const [lat, lon, code] of [
    [4.2691, 73.4915, 'MV'], [4.26391, 73.50085, 'MV'], [4.2276, 73.5209, 'MV'], [25.123, 63.846, 'PK'],
  ] as const) {
    const pin = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(pin.island?.status, 'mapped');
    assert.deepEqual(pin.island.countryCodes, [code]);
    assert.equal(pin.island.source, 'fieldmaps-usgs-lsib');
  }
  // Hainan extends beyond the local extract. A clipped mainland or island
  // component cannot acquire a new physical-island label from its clipped edge.
  assert.equal(matchRegionalCoast(18.25, 109.51)?.isolatedIsland, undefined);
});

test('a coastal accuracy disk needs review and a neighbouring survey gap stays unassessed', () => {
  const disk = assessAgidGeography({ kind: 'pin', lat: 4.2691, lon: 73.4915, method: 'device', accuracyMeters: 600 });
  assert.equal(disk.status, 'needs-confirmation');
  assert.equal(disk.surface, 'boundary');
  assert.deepEqual(disk.regionCandidates, ['MV']);
  assert.deepEqual(disk.island?.countryCodes, []);
  assert.equal(matchRegionalCoast(23.485, 119.58), undefined);
  assert.equal(matchRegionalCoast(22.2, 113.7), undefined);
});

test('issued IDs keep their cell when the sea or territorial prefix changes', () => {
  for (const [lat, lon, old] of [
    [18.21, 109.35, 'VN0A52PSHQM013S6'], [9.277, 79.257, '1D09YMVSQ8C812ZR'],
    [26.21, 50.35, 'IR099GBJH6J51AMT'],
  ] as const) {
    const id = encodeAGID16(lat, lon).id;
    assert.notEqual(old, id);
    assert.ok(getAGIDCellKey(old));
    assert.equal(getAGIDCellKey(old), getAGIDCellKey(id));
  }
});

test('Megisti survey agreement preserves three Greek islands, the Turkish mainland, water and source gaps', () => {
  for (const [lat, lon, code] of [[36.14, 29.58, 'GR'], [36.157, 29.504, 'GR'],
    [36.113, 29.637, 'GR'], [36.20, 29.64, 'TR']] as const) {
    const pin = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.deepEqual(pin.regionCandidates, [code]);
    assert.equal(pin.surface, 'land');
    assert.equal(pin.island?.status, code === 'GR' ? 'mapped' : undefined);
    assert.match(pin.sources[0].attribution ?? '', /ELSTAT/);
    for (const issue of [encodeAGID, encodeAGID16]) assert.equal(issue(lat, lon).regionCode, code);
  }
  const passage = assessAgidGeography({ kind: 'pin', lat: 36.175, lon: 29.59 });
  assert.equal(passage.surface, 'water');
  assert.deepEqual(passage.regionCandidates, []);
  for (const [lat, lon] of [[36.15, 29.59], [36.153423, 29.592050901], [36.15344, 29.608890027]]) {
    const pin = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(pin.surface, 'unknown');
    assert.equal(pin.status, 'needs-confirmation');
    assert.deepEqual(pin.regionCandidates, []);
    for (const issue of [encodeAGID, encodeAGID16]) assert.equal(issue(lat, lon).regionCode, 'ISLAND_UNRESOLVED');
  }
  const coast = assessAgidGeography({ kind: 'pin', lat: 36.14, lon: 29.58, accuracyMeters: 1500 });
  assert.equal(coast.status, 'needs-confirmation');
  assert.deepEqual(coast.regionCandidates, ['GR']);
});
