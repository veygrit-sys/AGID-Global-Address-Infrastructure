import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';

type Pin = [place: string, lat: number, lon: number];
type Island = [...Pin, territory: string, islandName: string, sovereign?: string];
type Water = [...Pin, basin: string];

const islands: Island[] = [
  ['Dyer Island on the high-tide coastline', -32.0190156, 115.551179, 'AU', 'Dyer Island'],
  ['Permanently vegetated ridge between Rottnest lakes', -32.005209, 115.5185699, 'AU', 'Wadjemup / Rottnest Island'],
  ['Taveuni east of the 180th meridian', -16.805, -179.9995, 'FJ', 'Taveuni'],
  ['Taveuni west of the 180th meridian', -16.805, 179.9995, 'FJ', 'Taveuni'],
  ['Anearmej next to Ejit', 7.123728, 171.352798, 'MH', 'Anearmej'],
  ['Ejit in Majuro Atoll', 7.124162, 171.350434, 'MH', 'Ejit'],
  ['Garra next to Ejit', 7.124082, 171.347927, 'MH', 'Garra'],
  ['Eil Malk in Palau', 7.157687, 134.375225, 'PW', 'Eil Malk'],
  ['Lelu in Kosrae', 5.330939, 163.029175, 'FM', 'Lelu'],
  ['Rangatira Island in the Chatham group', -44.346133, -176.176697, 'NZ', 'Rangatira (South East Island)'],
  ['Ulva Island / Te Wharawhara', -46.9293674, 168.1176161, 'NZ', 'Ulva Island / Te Wharawhara'],
  ['Nauru land near Buada', -0.5328481, 166.9241491, 'NR', 'Nauru'],
  ['Uvea at Lake Lalolalo', -13.3031254, -176.236127, 'WF', 'Uvea', 'FR'],
  ['Upolu by Lake Lanotoʻo', -13.907873, -171.8248746, 'WS', 'Upolu'],
  ['Funafala in Funafuti', -8.62834, 179.10186, 'TV', 'Funafala'],
  ['Ronton on Kiritimati', 1.9838438, -157.4738437, 'KI', 'Kiritimati'],
  ['Motukitiu in Aitutaki', -18.948875, -159.731875, 'CK', 'Motukitiu'],
  ['Tapuaetai in Aitutaki', -18.9376, -159.7346, 'CK', 'Tapuaetai (One Foot Island)'],
  ['Tekopua in Aitutaki', -18.9299846, -159.7296667, 'CK', 'Tekopua'],
  ['Mount Garet peninsula on Gaua', -14.248, 167.521, 'VU', 'Gaua'],
  ['Efate at Port Vila', -17.747, 168.315, 'VU', 'Efate'],
  ['Ifira in Port Vila Harbour', -17.74805, 168.29543, 'VU', 'Ifira'],
  ['Iririki in Port Vila Harbour', -17.74468, 168.30956, 'VU', 'Iririki'],
];

const waters: Water[] = [
  ['Channel between Wallace and Dyer islands', -32.016, 115.553, 'SIND'],
  ['Sea at the generalized Dyer Island outline', -32.019682, 115.550638, 'SIND'],
  ['Sea at the generalized Wallace Island outline', -32.013382, 115.554953, 'SIND'],
  ['Rottnest Island eastern lake', -31.99701, 115.529164, 'INLAND_WATER'],
  ['Rottnest Island western lake', -31.99631, 115.518484, 'INLAND_WATER'],
  ['Somosomo Strait east of the 180th meridian', -16.7905, -179.9995, 'SPAC'],
  ['Somosomo Strait north of the original survey limit', -16.78895, 180, 'SPAC'],
  ['Somosomo Strait west of the 180th meridian', -16.7905, 179.9995, 'SPAC'],
  ['Majuro lagoon off Ejit', 7.120437, 171.350354, 'NPAC'],
  ['Jellyfish Lake on Eil Malk', 7.160866, 134.376131, 'INLAND_WATER'],
  ['Sand-bottom lagoon near Eil Malk', 7.164283, 134.37064, 'NPAC'],
  ['Ocean off Lelu', 5.339148, 163.036147, 'NPAC'],
  ['Ocean beside Rangatira', -44.3352083, -176.1868015, 'SEPC'],
  ['Paterson Inlet beside Ulva Island', -46.9333437, 168.1143438, 'SPAC'],
  ['Buada Lagoon on Nauru', -0.53525, 166.922625, 'INLAND_WATER'],
  ['Lake Lalolalo on Uvea', -13.3001231, -176.2333509, 'INLAND_WATER'],
  ['Lake Lanotoʻo on Upolu', -13.910377, -171.8279551, 'INLAND_WATER'],
  ['South Pacific off Funafala', -8.647, 179.118, 'SPAC'],
  ['Pacific offshore of Ronton', 1.983, -157.498, 'NEPC'],
  ['Pacific off Tapuaetai', -18.944, -159.695, 'SEPC'],
  ['Lake Letas on Gaua', -14.264, 167.521, 'INLAND_WATER'],
  ['Port Vila Harbour channel', -17.745, 168.304, 'SPAC'],
];

const uncertain: Pin[] = [
  ['Wallace Island mixed high-tide pixels', -32.012267, 115.555057],
  ['Rottnest salt-lake margin', -31.9997146, 115.530376],
  ['Taveuni unresolved north coast', -16.7998398, 179.9970117],
  ['Majuro reef flat', 7.125775, 171.346069],
  ['Reef margin off Eil Malk', 7.15742, 134.380601],
  ['Lelu reef disagreement', 5.337203, 163.028283],
  ['Rangatira shoreline disagreement', -44.3450042, -176.1837173],
  ['Tāmihau coastal disagreement', -46.933619, 168.107149],
  ['Buada seasonal water margin', -0.5362102, 166.9225093],
  ['Lake Lalolalo source disagreement', -13.2999645, -176.234792],
  ['Lanotoʻo source disagreement', -13.9091268, -171.8282346],
  ['Enclosed lagoon near Funafala', -8.6297, 179.0931],
  ['Funafala reef flat', -8.6282, 179.0975],
  ['Forereef off Ronton', 1.976042, -157.4846533],
  ['Kiritimati shallow inner-lagoon margin', 1.98095, -157.46586],
  ['Western Kiritimati reef margin', 1.985, -157.486],
  ['Channel between Tapuaetai and Tekopua', -18.9367, -159.7314],
];


test('surveyed oceanic islands and motu retain their territory, sovereign and physical identity', () => {
  for (const [place, lat, lon, territory, islandName, sovereign = territory] of islands) {
    const id = encodeAGID16(lat, lon);
    assert.equal(id.regionCode, territory, place);
    assert.equal(id.isSea, false, place);
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: id.id }),
    ]) {
      assert.equal(a.surface, 'land', place);
      assert.equal(a.status, 'mapped', place);
      assert.deepEqual(a.regionCandidates, [territory], place);
      assert.equal(a.territorialTopology?.landform, 'island', place);
      assert.equal(a.island?.territory, islandName, place);
      assert.deepEqual(a.island?.countryCodes, [territory], place);
      assert.deepEqual(a.island?.sovereignCodes, [sovereign], place);
      assert.equal(a.deliveryRegion, null, place);
    }
  }
});

test('island lakes, lagoons and offshore channels resolve to the surveyed basin', () => {
  for (const [place, lat, lon, basin] of waters) {
    const id = encodeAGID16(lat, lon);
    assert.equal(id.regionCode, basin, place);
    assert.equal(id.isSea, true, place);
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: id.id }),
    ]) {
      assert.equal(a.status, 'mapped', place);
      assert.equal(a.surface, 'water', place);
      assert.deepEqual(a.regionCandidates, [], place);
      assert.equal(a.island, undefined, place);
      assert.equal(a.deliveryRegion, null, place);
    }
  }
});

test('uncertain reefs and shoreline controls withhold automatic address selection', async () => {
  for (const [place, lat, lon] of uncertain) {
    assert.equal(getRegionInfo(lat, lon).prefix, 'SHORELINE_UNRESOLVED', place);
    const requested: string[] = [];
    await resolveAgidLocal({ coordinates: { lat, lon },
      addressFormatResolver: async code => { requested.push(code); return null; } });
    assert.deepEqual(requested, [], place);
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    ]) {
      assert.equal(a.status, 'needs-confirmation', place);
      assert.equal(a.surface, 'unknown', place);
      assert.deepEqual(a.regionCandidates, [], place);
      assert.equal(a.deliveryRegion, null, place);
    }
  }
});

test('the 180th meridian passes through continuous land and water without creating a shoreline', () => {
  for (const [lat, surface, region, candidates] of [
    [-16.8084821, 'land', 'FJ', ['FJ']], [-16.7905, 'water', 'SPAC', []],
  ] as const) {
    const meridian = encodeAGID16(lat, 180);
    for (const lon of [-540, -180, 180, 540]) {
      const same = encodeAGID16(lat, lon);
      assert.equal(same.id, meridian.id);
      assert.equal(same.regionCode, region);
      const cell = assessAgidGeography({ kind: 'cell', id: same.id });
      assert.equal(cell.surface, surface);
      assert.deepEqual(cell.regionCandidates, candidates);
    }
    // A 100 m disk centered 11 m to either side reaches across the meridian.
    for (const lon of [179.9999, -179.9999, -180, 180]) {
      const a = assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 100 });
      assert.equal(a.surface, surface);
      assert.equal(a.status, 'mapped');
      assert.deepEqual(a.regionCandidates, candidates);
    }
  }
  // The chart extends past the coarse outline that overshoots the strait.
  for (const lon of [179.99998, -179.99998]) {
    const strait = assessAgidGeography({ kind: 'pin', method: 'device', lat: -16.78895, lon, accuracyMeters: 10 });
    assert.equal(strait.status, 'mapped');
    assert.equal(strait.surface, 'water');
    assert.deepEqual(strait.regionCandidates, []);
  }
  // The detailed survey and the adjoining ocean map both place the new
  // northern limit in open water. Neither assigns the strait a country.
  for (const lat of [-16.76501, -16.76499]) {
    for (const lon of [-180, 180]) {
      const a = assessAgidGeography({ kind: 'pin', lat, lon });
      assert.equal(a.surface, 'water');
      assert.deepEqual(a.regionCandidates, []);
    }
  }
  for (const lon of [-180, 180]) {
    const larger = assessAgidGeography({ kind: 'pin', method: 'device', lat: -16.7905, lon, accuracyMeters: 900 });
    assert.equal(larger.status, 'needs-confirmation');
    assert.equal(larger.surface, 'unknown');
    assert.deepEqual(larger.regionCandidates, ['FJ']);
  }
});

test('a Tāmihau land pin can be confirmed while its four-metre cell reaches uncertain shore', () => {
  const lat = -46.933375, lon = 168.1072084;
  const pin = assessAgidGeography({ kind: 'pin', lat, lon });
  assert.equal(pin.status, 'mapped');
  assert.equal(pin.surface, 'land');
  assert.equal(pin.island?.territory, 'Tāmihau Island');
  assert.deepEqual(pin.regionCandidates, ['NZ']);
  for (const a of [
    assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 5 }),
  ]) {
    assert.equal(a.status, 'needs-confirmation');
    assert.equal(a.surface, 'unknown');
    assert.deepEqual(a.regionCandidates, ['NZ']);
    assert.equal(a.deliveryRegion, null);
  }
});

test('broader GPS footprints around enclosed water and a lagoon add only reachable island territories', () => {
  for (const [place, lat, lon, cases] of [
    ['Jellyfish Lake', 7.160866, 134.376131, [[1, 'water', []], [25, 'unknown', []], [100, 'unknown', ['PW']]]],
    ['Majuro lagoon', 7.120437, 171.350354, [[10, 'water', []], [125, 'water', []], [400, 'unknown', ['MH']]]],
    ['Port Vila Harbour', -17.745, 168.304, [[10, 'water', []], [150, 'water', []], [500, 'unknown', ['VU']]]],
  ] as const) {
    for (const [accuracyMeters, surface, codes] of cases) {
      const a = assessAgidGeography({ kind: 'pin', method: 'device', lat, lon, accuracyMeters });
      const label = `${place}, ${accuracyMeters} m`;
      assert.equal(a.surface, surface, label);
      assert.equal(a.status, surface === 'water' ? 'mapped' : 'needs-confirmation', label);
      assert.deepEqual(a.regionCandidates, codes, label);
      assert.equal(a.deliveryRegion, null, label);
    }
  }
});

test('stored 12- and 16-character codes keep their cell while the resolver applies the current geography', async () => {
  // Issued by revision 1fb1162, before the Oceania surveys.
  for (const [lat, lon, territory, ids] of [
    [-16.7905, 179.9995, null, ['FJ04K5APN6HT', 'FJ04K5APN6HT1H8J']],
    [-31.99631, 115.518484, null, ['AU0BSHKME480', 'AU0BSHKME4801D0N']],
    [-13.3001231, -176.2333509, null, ['WF07CJ5HH8NR', 'WF07CJ5HH8NR1X7K']],
    [-18.9376, -159.7346, 'CK', ['P207FXEDYY1M', 'P207FXEDYY1M14F6']],
  ] as const) {
    for (const id of ids) {
      assert.equal(getAGIDCellKey(id), getAGIDCellKey(encodeAGID(lat, lon)), id);
      const cell = assessAgidGeography({ kind: 'cell', id });
      assert.equal(cell.surface, territory ? 'land' : 'water', id);
      assert.deepEqual(cell.regionCandidates, territory ? [territory] : [], id);
      const requested: string[] = [];
      const result = await resolveAgidLocal({ query: id,
        addressFormatResolver: async code => { requested.push(code); return null; } });
      assert.equal(result.agidId, id);
      assert.deepEqual(requested, territory ? [territory] : [], id);
    }
  }
});

test('a GPS disk reaching the edge of the Taveuni survey keeps its Fiji candidate', () => {
  // These two inland points are 11 m to either side of the southern survey limit.
  for (const [lat, named] of [[-16.8099, true], [-16.8101, false]] as const) {
    const lon = 180;
    assert.equal(getRegionInfo(lat, lon).island?.territory === 'Taveuni', named);
    const tight = assessAgidGeography({ kind: 'pin', method: 'device', lat, lon, accuracyMeters: 3 });
    assert.equal(tight.surface, 'land');
    assert.deepEqual(tight.regionCandidates, ['FJ']);
    const wider = assessAgidGeography({ kind: 'pin', method: 'device', lat, lon, accuracyMeters: 25 });
    assert.equal(wider.status, 'needs-confirmation');
    assert.equal(wider.surface, 'unknown');
    assert.deepEqual(wider.regionCandidates, ['FJ']);
  }
});
