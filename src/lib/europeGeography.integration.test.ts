import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packPointResult, type PackHit } from '../../scripts/national-island-supplement';
import { encodeAGID, encodeAGID16, getAGIDCellKey } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography as assess } from './geographicAssessment';
import { islandDisplayRows } from './islandDisplay';

type Control = [name: string, lat: number, lon: number, region: string, landform?: string, sovereign?: string];
const controls: Control[] = [
  ['Gorizia', 45.9419, 13.6215, 'IT'],
  ['Nova Gorica', 45.9561, 13.6481, 'SI'],
  ['Badajoz', 38.8794, -6.9707, 'ES'],
  ['Elvas', 38.8815, -7.1637, 'PT'],
  ['Passau', 48.5744, 13.4551, 'DE'],
  ['Bratislava', 48.1486, 17.1077, 'SK'],
  ['Narva', 59.379, 28.199, 'EE'],
  ['Ivangorod', 59.371, 28.225, 'RU'],
  ['Gozo', 36.0446, 14.2395, 'MT', 'island'],
  ['Lampedusa', 35.501, 12.61, 'IT', 'island'],
  ['Bonifacio', 41.3873, 9.1592, 'FR', 'island'],
  ['La Maddalena', 41.214, 9.406, 'IT', 'island'],
  ['Djerba', 33.878, 10.858, 'TN', 'island'],
  ['Corfu', 39.623, 19.919, 'GR', 'island'],
  ['Strait of Bonifacio', 41.31, 9.2, 'water'],
  ['Strait of Messina', 38.238, 15.635, 'water'],
  ['Malta channel', 36.45, 14.3, 'water'],
  ['Alboran Sea', 36.1, -3.8, 'water'],
  ['Aegean Sea', 37.16, 25.92, 'water'],
  ['Narrow Samos strait', 37.69, 27.06, 'water'],
  ['Jersey', 49.19, -2.11, 'JE', 'island', 'GB'],
  ['Guernsey', 49.455, -2.543, 'GG', 'island', 'GB'],
  ['Torshavn', 62.013, -6.777, 'FO', 'island', 'DK'],
  ['Saint-Pierre', 46.783, -56.18, 'PM', 'island', 'FR'],
  ['Willemstad', 12.107, -68.933, 'CW', 'island', 'NL'],
  ['Saba', 17.627, -63.24, 'BQ', 'island', 'NL'],
  ['Hamilton', 32.295, -64.783, 'BM', 'island', 'GB'],
  ['Saint-Denis', -20.89, 55.451, 'RE', 'island', 'FR'],
  ['Mata-Utu', -13.281, -176.175, 'WF', 'island', 'FR'],
  ['Noumea', -22.269, 166.444, 'NC', 'island', 'FR'],
  ['Marigot', 18.068, -63.082, 'MF', 'island', 'FR'],
  ['Philipsburg', 18.025, -63.049, 'SX', 'island', 'NL'],
  ['Ile Royale, Guiana', 5.286, -52.59, 'GF', 'island', 'FR'],
  ['Cayenne', 4.922, -52.313, 'GF'],
  ['Pheasant Island', 43.3428359, -1.76533484, 'ES+FR', 'island'],
  ['Bidasoa river', 43.34322, -1.7657, 'water'],
];

test('36 regional controls cover mainland borders, island interiors, offshore passages and overseas address regions', () => {
  for (const [name, lat, lon, region, landform, sovereign] of controls) {
    const result = assess({ kind: 'pin', lat, lon });
    const water = region === 'water';
    const candidates = water ? [] : region.split('+');
    assert.equal(result.surface, water ? 'water' : 'land', name);
    assert.deepEqual(result.regionCandidates, candidates, name);
    assert.equal(result.deliveryRegion, null, name);
    if (landform) assert.equal(result.territorialTopology?.landform, landform, name);
    if (sovereign) assert.deepEqual(result.island?.sovereignCodes, [sovereign], name);
    for (const encode of [encodeAGID, encodeAGID16]) {
      const issued = encode(lat, lon);
      assert.equal(issued.isSea, water, name);
      if (candidates.length === 1) assert.equal(issued.regionCode, candidates[0], name);
      if (candidates.length > 1) assert.ok(!candidates.includes(issued.prefix), name);
    }
  }
});

test('the continental border through Gorizia preserves both sides and the measured footprint', () => {
  const lat = 45.956065;
  const vertex = { lat, lon: 13.634904 };
  const sides = ['IT', 'SI'];
  assert.deepEqual(assess({ kind: 'pin', ...vertex }).regionCandidates, sides);
  const id = encodeAGID16(lat, vertex.lon);
  assert.ok(!sides.includes(id.prefix));
  assert.deepEqual(assess({ kind: 'cell', id: id.id }).regionCandidates, sides);
  for (const [lon, country] of [[13.634854, 'IT'], [13.634954, 'SI']] as const) {
    const pin = { kind: 'pin', method: 'device', lat, lon } as const;
    assert.deepEqual(assess({ ...pin, accuracyMeters: 2 }).regionCandidates, [country]);
    for (const result of [assess({ ...pin, accuracyMeters: 15 }),
      assess({ ...pin, accuracyMeters: 2 }, { boundaryAllowanceMeters: 13 })]) {
      assert.deepEqual(result.regionCandidates, sides);
      assert.equal(result.surface, 'land');
      assert.equal(result.status, 'needs-confirmation');
      assert.equal(result.deliveryRegion, null);
    }
  }
  const paris = { kind: 'pin', lat: 48.8566, lon: 2.3522 } as const;
  assert.equal(assess(paris).status, 'mapped');
  assert.equal(assess({ ...paris, method: 'device' }).status, 'needs-confirmation');
});

test('the Vaalserberg tripoint returns three candidates and its three interiors resolve separately', () => {
  const lat = 50.754283, lon = 6.021017;
  for (const r of [assess({ kind: 'pin', lat, lon }), assess({ kind: 'cell', id: encodeAGID16(lat, lon).id })]) {
    assert.deepEqual(r.regionCandidates, ['BE', 'DE', 'NL']);
    assert.equal(r.status, 'needs-confirmation');
    assert.equal(r.surface, 'land');
    assert.equal(r.deliveryRegion, null);
  }
  for (const [lat, lon, side] of [[50.7551, 6.0204, 'NL'], [50.7549, 6.022, 'DE'], [50.7536, 6.0202, 'BE']] as const) {
    const pin = { kind: 'pin', method: 'device', lat, lon } as const;
    assert.deepEqual(assess({ ...pin, accuracyMeters: 5 }).regionCandidates, [side]);
    assert.deepEqual(assess({ ...pin, accuracyMeters: 120 }).regionCandidates, ['BE', 'DE', 'NL']);
  }
});

test('Pheasant Island is jointly administered throughout its dry interior, with independent river and bank evidence', () => {
  const p = assess({ kind: 'pin', lat: 43.3428359, lon: -1.76533484 });
  assert.equal(p.island?.administrationKind, 'condominium');
  assert.equal(p.island.status, 'mapped');
  assert.equal(p.island.claimantCodes, undefined);
  assert.deepEqual(p.island.countryCodes, ['ES', 'FR']);
  assert.ok(islandDisplayRows(p.island, true, codes => codes.join('/')).some(([k,v]) => k === '共同管理国' && v === 'ES/FR'));
  for (const [lat, lon, region] of [[43.3447, -1.7671, 'FR'], [43.3415, -1.76294, 'ES']] as const) {
    assert.deepEqual(assess({ kind: 'pin', lat, lon }).regionCandidates, [region]);
  }
  const tide = assess({ kind: 'pin', lat: 43.3426749, lon: -1.76516384 });
  assert.equal(tide.surface, 'unknown');
  assert.deepEqual(tide.regionCandidates, []);
  assert.equal(tide.island, undefined);
});

test('divided islands distinguish the country at the pin from the countries on the island', () => {
  for (const [lat, lon, side, whole] of [
    [55.036, -7.386, 'IE', ['GB','IE']], [54.995, -7.324, 'GB', ['GB','IE']],
    [53.9559, 14.1644, 'DE', ['DE','PL']], [53.912, 14.237, 'PL', ['DE','PL']],
    [18.068, -63.082, 'MF', ['MF','SX']], [18.025, -63.049, 'SX', ['MF','SX']],
    [60.301008, 19.131432, 'AX', ['AX','SE']], [60.3008, 19.13291, 'SE', ['AX','SE']],
  ] as const) {
    for (const r of [assess({ kind: 'pin', lat, lon }), assess({ kind: 'cell', id: encodeAGID16(lat, lon).id })]) {
      assert.deepEqual(r.regionCandidates, [side]);
      assert.deepEqual(r.territorialTopology?.sharedIslandCountryCodes, whole);
      if (side === 'AX') assert.deepEqual(r.island?.sovereignCodes, ['FI']);
      assert.equal(r.island?.claimantCodes, undefined);
    }
  }
  for (const [lat, lon, sides] of [[18.055642, -63.040013, ['MF', 'SX']],
    [60.300944916667, 19.132242277778, ['AX', 'SE']]] as const) {
    const id = encodeAGID16(lat, lon);
    assert.ok(!sides.some(side => side === id.prefix));
    for (const r of [assess({ kind: 'pin', lat, lon }), assess({ kind: 'cell', id: id.id })]) {
      assert.equal(r.surface, 'land');
      assert.deepEqual(r.regionCandidates, sides);
      assert.equal(r.status, 'needs-confirmation');
      assert.equal(r.island?.claimantCodes, undefined);
    }
  }
  assert.equal(assess({ kind: 'pin', lat: 18.214, lon: -63.05 }).territorialTopology?.sharedIslandCountryCodes, undefined);
});

test('official place-name controls identify all three Îles du Salut and retain water in the passage', () => {
  for (const [lat, lon] of [[5.28115771, -52.5820114], [5.29273684, -52.58401652], [5.28743317, -52.58927156]]) {
    const r = assess({ kind: 'pin', lat, lon });
    assert.deepEqual(r.regionCandidates, ['GF']);
    assert.deepEqual(r.island?.sovereignCodes, ['FR']);
    assert.equal(r.territorialTopology?.landform, 'island');
  }
  const channel = assess({ kind: 'pin', lat: 5.2825, lon: -52.5847 });
  assert.equal(channel.surface, 'water');
  assert.deepEqual(channel.regionCandidates, []);
});

test('both historic wire forms preserve the original cell while resolving the address hint afresh', async () => {
  for (const [lat, lon, ids, expected] of [
    [45.9419, 13.6215, ['SI0GXXW5AFSE', 'SI0GXXW5AFSE1FXT'], ['IT']],
    [43.3428359, -1.76533484, ['FR01N8PKQ38K', 'FR01N8PKQ38K1QX7'], []],
    [41.31, 9.20, ['IT02BD5KHP0S', 'IT02BD5KHP0S1BQB'], []],
  ] as const) {
    const current = encodeAGID16(lat, lon);
    for (const id of ids) {
      assert.equal(getAGIDCellKey(id), getAGIDCellKey(current));
      const requests: string[] = [];
      const resolved = await resolveAgidLocal({ query: id, addressFormatResolver: async c => { requests.push(c); return null; } });
      assert.equal(resolved.agidId, id);
      assert.deepEqual(requests, expected);
    }
  }
  const requests: string[] = [];
  await resolveAgidLocal({ query: 'FR01N8PKQ38K1QX7', countryCode: 'ES', addressFormatResolver: async c => { requests.push(c); return null; } });
  assert.deepEqual(requests, ['ES']);
});

test('the optional offline pack respects national surveys, shared island identity and nearby water', () => {
  const conflicting: PackHit = { islandId: 'fixture:older-outline', kind: 'ocean-island',
    codes: ['GB'], source: 'fixture', version: '1', relation: 'inside' };
  for (const [lat, lon, codes] of [[60.301008, 19.131432, ['AX']],
    [43.3428359, -1.76533484, ['ES', 'FR']], [5.28115771, -52.5820114, ['GF']]] as const) {
    for (const raw of [null, conflicting]) {
      const pack = packPointResult(lat, lon, raw, true, true);
      assert.deepEqual(pack.island?.countryCodes, codes);
      assert.equal(pack.physicalIslandId, undefined);
      assert.equal(pack.deliveryRegion, null);
    }
  }
  const passage = packPointResult(5.2825, -52.5847, conflicting, false, true);
  assert.equal(passage.island, null);
  assert.equal(passage.territorialTopology, null);
  const usedom = packPointResult(53.9559, 14.1644, {
    ...conflicting, islandId: 'gshhg:585', codes: ['DE'],
  }, false, true);
  assert.deepEqual(usedom.island?.countryCodes, ['DE']);
  assert.deepEqual(usedom.territorialTopology?.sharedIslandCountryCodes, ['DE', 'PL']);
});
