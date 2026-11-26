import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packPointResult, type PackHit } from '../../scripts/national-island-supplement';
import { encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';

// Control coordinates use lat, lon. A point on a named group is only a land
// control when it can be placed on an individual island.
type Control = [place: string, lat: number, lon: number, code: string];
const islands: Control[] = [
  ['Pellow Islets, main islet', 48.724793, -123.357681, 'CA'],
  ['Pellow Islets, northwest islet', 48.725375, -123.359125, 'CA'],
  // Canadian Geographical Names Database, Cabbage Island (JAQOB).
  ['Cabbage Island', 48.798333, -123.087222, 'CA'],
  ['Portland Island, eastern shore', 48.7253475, -123.361361, 'CA'],
  ['Benson Island, Broken Group', 48.883112, -125.382882, 'CA'],
  ['Clarke Island, Broken Group', 48.888373, -125.376643, 'CA'],
  ['Hotspring Island, Haida Gwaii', 52.576811, -131.440682, 'CA'],
  ['SGang Gwaay, Haida Gwaii', 52.094655, -131.222976, 'CA'],
  ['Ciboux Island, Cape Breton', 46.383939, -60.374939, 'CA'],
  ['Hertford Island, Cape Breton', 46.365986, -60.396055, 'CA'],
  // Reference point of the Commission de toponymie du Québec, record 48200.
  // https://toponymie.gouv.qc.ca/ct/ToposWeb/Fiche.aspx?no_seq=48200
  ['Île aux Perroquets, Mingan', 50.22057, -64.20602, 'CA'],
  ['Île de la Maison, Mingan', 50.217788, -64.200286, 'CA'],
  ['Allan’s Island, Newfoundland', 46.8491667, -55.8005555, 'CA'],
  ['Île aux Marins, former town hall', 46.784444, -56.149444, 'PM'],
  ['Île aux Vainqueurs, Saint-Pierre-et-Miquelon', 46.79057, -56.128175, 'PM'],
  ['Gunning Island, Labrador', 52.2789251, -55.5902304, 'CA'],
  ['Great Caribou Island, Labrador', 52.272375, -55.591375, 'CA'],
  ['Wolf Islet, James Bay', 52.107074, -79.242810, 'CA'],
  ['Gasket Island, James Bay', 52.417617, -80.250878, 'CA'],
  ['Twin Cairns Island, Belcher Islands', 56.518818, -78.796612, 'CA'],
  ['Princess Charlotte Monument, Nunavut', 75.8412, -78.827, 'CA'],
  ['North Cheyne Island', 76.33263, -97.52233, 'CA'],
  ['Middle Cheyne Island', 76.30667, -97.52417, 'CA'],
  ['South Cheyne Island', 76.28825, -97.51608, 'CA'],
  ['Orne Island, Nunavut', 77.878941, -76.3339432, 'CA'],
  ['Seymour Island, Nunavut', 76.809, -101.285, 'CA'],
  ['Battle Island, Labrador', 52.2762824, -55.5842099, 'CA'],
  ['Flowerpot Island, Georgian Bay', 45.3005, -81.62646, 'CA'],
  ['Chantry Island, Lake Huron', 44.48976, -81.40317, 'CA'],
  ['Little Beausoleil Island', 44.87894, -79.83626, 'CA'],
  ['Beausoleil Island', 44.88738, -79.839715, 'CA'],
  ['Deer Island, Georgian Bay', 44.886735, -79.830598, 'CA'],
  ['Ice Island, Ontario', 44.45852, -75.83502, 'CA'],
  ['Dark Island, New York', 44.4521, -75.8127, 'US'],
];
const water: Control[] = [
  ['Channel between Ciboux and Hertford islands', 46.374, -60.386, 'STLA'],
  ['Mingan channel', 50.2198, -64.2025, 'STLA'],
  ['Atlantic off Allan’s Island', 46.851, -55.793, 'NATL'],
  ['Water off Île aux Marins', 46.789, -56.136, 'STLA'],
  ['Battle Harbour', 52.274213, -55.587259, 'LABR'],
  // The rounded geographical-names label lies offshore, outside the Wolf Islet outline.
  ['Water at the gazetteer label for Wolf Islet', 52.100000, -79.233333, 'HUDB'],
  ['James Bay east of Wolf Islet', 52.107196, -79.234194, 'HUDB'],
  ['James Bay off Gasket Island', 52.410861, -80.260133, 'HUDB'],
  ['Hudson Bay off Twin Cairns Island', 56.514832, -78.783753, 'HUDB'],
  ['Channel between the Cheyne Islands', 76.321, -97.522, 'ARCT'],
  ['Pond on Middle Cheyne Island', 76.310088, -97.522249, 'INLAND_WATER'],
  ['Arctic Ocean off Orne Island', 77.888, -76.353, 'ARCT'],
  ['Arctic Ocean off Seymour Island', 76.820, -101.275, 'ARCT'],
  ['Channel near Princess Charlotte Monument', 75.844, -78.847, 'ARCT'],
  ['Channel by the Pellow Islets', 48.726194, -123.358875, 'NEPC'],
  ['Reef Harbour by Cabbage Island', 48.7968, -123.087, 'NEPC'],
  ['Passage between Benson and Clarke', 48.8868, -125.379, 'NEPC'],
  ['Channel northeast of Hotspring Island', 52.5795, -131.4358, 'NEPC'],
  ['Sea off SGang Gwaay', 52.104, -131.224, 'NEPC'],
  ['Georgian Bay off Flowerpot Island', 45.293, -81.615, 'INLAND_WATER'],
  ['Lake Huron off Chantry Island', 44.49, -81.409, 'INLAND_WATER'],
  ['Pond within Little Beausoleil Island', 44.87665, -79.8374, 'INLAND_WATER'],
  ['Georgian Bay near Beausoleil Island', 44.886, -79.848, 'INLAND_WATER'],
  ['St. Lawrence River between Ice and Dark islands', 44.455, -75.8235, 'INLAND_WATER'],
  ['St. Lawrence River west of Dark Island', 44.452, -75.814, 'INLAND_WATER'],
];

type UncertainControl = [place: string, lat: number, lon: number];
const uncertain: UncertainControl[] = [
  ['Displaced outline near Princess Charlotte Monument', 75.8337, -78.831],
  ['Mixed shoreline observations on Wolf Islet', 52.107800, -79.241000],
  ['Mixed coastal pixels on Orne Island', 77.88075, -76.33168],
  ['Gull Shoal I, where the Ontario island and water inventories disagree', 44.4601573, -75.8204319],
  ['A narrow Pellow islet with conflicting shoreline observations', 48.724724, -123.360192],
];

test('individual Canadian islets and nearby foreign islands keep the address region at the pin and in the AGID cell', () => {
  for (const [place, lat, lon, code] of islands) {
    for (const issue of [encodeAGID, encodeAGID16]) {
      const issued = issue(lat, lon);
      assert.equal(issued.prefix, code, place);
      assert.equal(issued.isSea, false, place);
    }
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 3 }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    ]) {
      assert.equal(a.surface, 'land', place);
      assert.equal(a.status, 'mapped', place);
      assert.equal(a.territorialTopology?.landform, 'island', place);
      assert.deepEqual(a.regionCandidates, [code], place);
      assert.deepEqual(a.island?.countryCodes, [code], place);
      assert.deepEqual(a.island?.sovereignCodes, [code === 'PM' ? 'FR' : code], place);
      assert.equal(a.deliveryRegion, null, place);
    }
  }
});

test('channels and open water among the Canadian islands have a water prefix and no address hints', async () => {
  for (const [place, lat, lon, basin] of water) {
    const info = getRegionInfo(lat, lon);
    assert.equal(info.isSea, true, place);
    assert.equal(info.prefix, basin, place);
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    ]) {
      assert.equal(a.surface, 'water', place);
      assert.equal(a.status, 'mapped', place);
      assert.deepEqual(a.regionCandidates, [], place);
      assert.equal(a.island, undefined, place);
      assert.equal(a.deliveryRegion, null, place);
    }
    const called: string[] = [];
    await resolveAgidLocal({ coordinates: { lat, lon }, addressFormatResolver: async c => { called.push(c); return null; } });
    assert.deepEqual(called, [], place);
  }
});

test('historic US and sea-prefixed IDs retain their original cell and resolve to a Canadian address form', async () => {
  // Both ID formats were recorded on 903a8a2 before the Canadian survey.
  for (const [lat, lon, ids] of [
    [52.576811, -131.440682, ['US0JHMMGNY52', 'US0JHMMGNY521FTM']],
    [50.22057, -64.20602, ['2R0HJDBRPXS1', '2R0HJDBRPXS11872']],
  ] as const) {
    const current = encodeAGID16(lat, lon);
    assert.equal(current.prefix, 'CA');
    for (const id of ids) {
      assert.equal(getAGIDCellKey(id), getAGIDCellKey(current));
      const called: string[] = [];
      const resolved = await resolveAgidLocal({ query: id, addressFormatResolver: async c => { called.push(c); return null; } });
      assert.equal(resolved.agidId, id);
      assert.deepEqual(called, ['CA']);
    }
  }
});

test('a coarse offline hit cannot give an island to open water or a different address country to a surveyed island', () => {
  const coarse: PackHit = { islandId: 'fixture:wrong-shore', kind: 'ocean-island', codes: ['GL'],
    relation: 'inside', version: '1', source: 'fixture' };
  for (const raw of [null, coarse]) {
    for (const [place, lat, lon, code] of islands) {
      const result = packPointResult(lat, lon, raw, !raw, true);
      assert.deepEqual(result.island?.countryCodes, [code], place);
      assert.equal(result.territorialTopology?.landform, 'island', place);
      assert.equal(result.deliveryRegion, null, place);
    }
    for (const [place, lat, lon] of water) {
      const result = packPointResult(lat, lon, raw, !raw, true);
      assert.equal(result.island, null, place);
      assert.equal(result.territorialTopology, null, place);
      assert.equal(result.deliveryRegion, null, place);
    }
  }
});

test('GPS and cell footprints honor new Pacific shorelines inside the earlier Salish Sea survey', () => {
  // Each center was on a coarse polygon edge. In the BC atlas and both WorldCover
  // editions the first lies within Portland Island and the second within a channel.
  for (const [lat, lon, radius, expected, codes] of [
    [48.7253475, -123.361361, 6, 'land', ['CA']],
    [48.726194, -123.358875, 10, 'water', []],
  ] as const) {
    for (const result of [
      assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: radius }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    ]) {
      assert.equal(result.surface, expected);
      assert.equal(result.status, 'mapped');
      assert.deepEqual(result.regionCandidates, codes);
    }
  }
  const crossing = assessAgidGeography({ kind: 'pin', lat: 48.7253475, lon: -123.361361,
    method: 'device', accuracyMeters: 30 });
  assert.equal(crossing.status, 'needs-confirmation');
  assert.equal(crossing.surface, 'unknown');
  assert.deepEqual(crossing.regionCandidates, ['CA']);
});

test('a river fix between Ice and Dark islands includes only countries whose land its radius reaches', () => {
  const point = { kind: 'pin', lat: 44.455, lon: -75.8235, method: 'device' } as const;
  for (const [radius, codes] of [[175, []], [400, ['CA']], [1300, ['CA', 'US']]] as const) {
    const result = assessAgidGeography({ ...point, accuracyMeters: radius });
    assert.deepEqual(result.regionCandidates, codes);
    assert.equal(result.status, codes.length ? 'needs-confirmation' : 'mapped');
    assert.equal(result.surface, codes.length ? 'unknown' : 'water');
    assert.equal(result.deliveryRegion, null);
  }
});

test('a disagreement between island outlines and physical observations does not issue a country', async () => {
  for (const [place, lat, lon] of uncertain) {
    const result = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(result.status, 'needs-confirmation', place);
    assert.equal(result.surface, 'unknown', place);
    assert.deepEqual(result.regionCandidates, [], place);
    assert.equal(result.island, undefined, place);
    assert.equal(result.deliveryRegion, null, place);
    assert.ok(!['CA', 'US', 'PM'].includes(encodeAGID16(lat, lon).prefix), place);
    const called: string[] = [];
    await resolveAgidLocal({ coordinates: { lat, lon }, addressFormatResolver: async c => { called.push(c); return null; } });
    assert.deepEqual(called, [], place);
  }
});

test('Canadian island detail retains the distinct existing reviews at Tartupaluk and Machias Seal Island', () => {
  const tartupaluk = assessAgidGeography({ kind: 'pin', lat: 80.82629, lon: -66.44927 });
  assert.equal(tartupaluk.island?.status, 'unresolved');
  assert.deepEqual(tartupaluk.island.claimantCodes, []);
  const machias = assessAgidGeography({ kind: 'pin', lat: 44.50183333, lon: -67.10113889 });
  assert.equal(machias.island?.status, 'disputed');
  assert.deepEqual(machias.island.claimantCodes, ['CA', 'US']);
  for (const result of [tartupaluk, machias]) {
    assert.equal(result.surface, 'land');
    assert.equal(result.status, 'needs-confirmation');
    assert.deepEqual(result.regionCandidates, []);
    assert.equal(result.deliveryRegion, null);
  }
});

test('the Parks Canada chairs on Île aux Perroquets are on land while their cell reaches uncertain ground', () => {
  // https://parks.canada.ca/pn-np/qc/mingan/activ/chaises-rouges-red-chairs
  const lat = 50.220793, lon = -64.206102;
  const pin = assessAgidGeography({ kind: 'pin', lat, lon });
  assert.equal(pin.surface, 'land');
  assert.equal(pin.status, 'mapped');
  assert.equal(pin.territorialTopology?.landform, 'island');
  assert.deepEqual(pin.regionCandidates, ['CA']);
  for (const result of [
    assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 3 }),
    assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
  ]) {
    assert.equal(result.status, 'needs-confirmation');
    assert.deepEqual(result.regionCandidates, ['CA']);
    assert.equal(result.deliveryRegion, null);
  }
});
