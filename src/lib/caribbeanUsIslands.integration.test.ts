import assert from 'node:assert/strict';
import test from 'node:test';
import { packPointResult, type PackHit } from '../../scripts/national-island-supplement';
import { encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';

type IslandControl = [place: string, lat: number, lon: number, territory: string, sovereign?: string];
const islands: IslandControl[] = [
  ['Whistling Cay', 18.37009, -64.75672, 'VI', 'US'],
  ['Great Thatch', 18.38629, -64.74039, 'VG', 'GB'],
  ['Little Thatch', 18.38167, -64.71508, 'VG', 'GB'],
  ['Îlet Pinel', 18.10616363, -63.0147317, 'MF', 'FR'],
  ['Petite Clef', 18.1037637, -63.019166, 'MF', 'FR'],
  ['Île Fourchue', 17.9588744, -62.90400726, 'BL', 'FR'],
  ['Terre-de-Bas, Petite Terre', 16.1701488, -61.109068, 'GP', 'FR'],
  ['Terre-de-Haut, Petite Terre', 16.1770248, -61.1091628, 'GP', 'FR'],
  ['Moku Nui', 21.39172, -157.69887, 'US'],
  ['Moku Iki', 21.38761, -157.69775, 'US'],
  ['Garden Key, Fort Jefferson', 24.62758, -82.87316, 'US'],
  ['Loggerhead Key', 24.63175, -82.92075, 'US'],
  // Field coordinates published by the National Park Service for the backcountry campsite.
  // https://www.nps.gov/apis/planyourvisit/campsite-gps.htm
  ['Devils Island, NPS campsite 1', 47.06332841, -90.72800654, 'US'],
  ['Liberty Island, Statue of Liberty', 40.68925, -74.04454, 'US'],
  ['Ellis Island', 40.69945, -74.03965, 'US'],
  ['Georges Island, Fort Warren', 42.3201, -70.92720, 'US'],
  ['South Core Banks, Cape Lookout Lighthouse', 34.6229, -76.5244, 'US'],
  ['St. John above The Narrows', 18.368375, -64.7421667, 'VI', 'US'],
  ['Tortola at The Narrows', 18.389852, -64.7114371, 'VG', 'GB'],
  ['Culebra', 18.3122916, -65.249, 'PR', 'US'],
  ['Culebrita', 18.3155834, -65.2287917, 'PR', 'US'],
  ['Morrillito', 17.8823114, -66.5328699, 'PR', 'US'],
  ['Caja de Muertos', 17.8942916, -66.5198333, 'PR', 'US'],
  ['Buck Island off St. Croix', 17.7870416, -64.6195006, 'VI', 'US'],
  ['Fallen Jerusalem', 18.4173969, -64.4512173, 'VG', 'GB'],
  ['Virgin Gorda', 18.4282917, -64.4425834, 'VG', 'GB'],
  ['La Petite Islette', 17.9564395, -62.9107507, 'BL', 'FR'],
  ['Îlet au Vent', 17.9569928, -62.8966621, 'BL', 'FR'],
  ['Îlet Chancel', 14.6940008, -60.8893929, 'MQ', 'FR'],
  ['Îlet de la Grotte', 14.6872136, -60.8831899, 'MQ', 'FR'],
  ['Îlet à Eaux', 14.6862494, -60.8999668, 'MQ', 'FR'],
  ['Petit Saint Vincent', 12.537783, -61.3855755, 'VC'],
  ['Petite Martinique', 12.5215428, -61.3843048, 'GD'],
  ['Bush Key near Garden Key', 24.6280937, -82.8697425, 'US'],
  ['Little Brewster Island', 42.3279937, -70.8902861, 'US'],
  ['Lovells Island', 42.329935, -70.928982, 'US'],
  ['Shackleford Banks', 34.636877, -76.536699, 'US'],
  ['Molokini crater rim', 20.63193, -156.49384, 'US'],
  ['East Anacapa', 34.01462, -119.3659975, 'US'],
  ['St. Lazaria Island', 56.985038, -135.7017672, 'US'],
  ['Little Diomede', 65.7522073, -168.9407223, 'US'],
  ['Big Diomede', 65.7685158, -169.0380898, 'RU'],
  ['Middle Anacapa', 34.0093808, -119.3819309, 'US'],
  ['Warderick Wells', 24.3880924, -76.6224472, 'BS'],
  ['Isla Catalina, Dominican Republic', 18.3668409, -69.0120463, 'DO'],
  ['Salt Cay', 21.3293932, -71.2001844, 'TC', 'GB'],
  ['Cayo Largo del Sur airport', 21.616111, -81.545556, 'CU'],
  ['Lime Cay', 17.918875, -76.8201212, 'JM'],
  ['Little Cayman', 19.6681762, -80.0783138, 'KY', 'GB'],
  ['Owen Island', 19.6641069, -80.0628931, 'KY', 'GB'],
  ['Cocos Island, Guam', 13.238083, 144.651734, 'GU', 'US'],
  ['Mañagaha, Northern Mariana Islands', 15.241543, 145.712561, 'MP', 'US'],
  ['Aunuʻu, American Samoa', -14.283748, -170.553323, 'AS', 'US'],
  ['Sand Island, Midway', 28.202, -177.3775, 'UM', 'US'],
  ['Eastern Island, Midway', 28.207, -177.3291, 'UM', 'US'],
];
type WaterControl = [place: string, lat: number, lon: number, basin: string];
const water: WaterControl[] = [
  ['Channel between Moku Nui and Moku Iki', 21.3896, -157.6982, 'NEPC'],
  ['Anchorage off Garden Key', 24.626, -82.880, 'GMXC'],
  ['Upper New York Bay', 40.694, -74.042, 'NATL'],
  ['Barden Inlet', 34.626, -76.538, 'NATL'],
  ['Channel between Culebra and Culebrita', 18.317, -65.242, 'CARB'],
  ['Water off Morrillito', 17.88335, -66.53093, 'CARB'],
  ['Reef waters off Buck Island', 17.791, -64.615, 'CARB'],
  ['The Narrows between St. John and Great Thatch', 18.378, -64.741, 'CARB'],
  ['Channel between Virgin Gorda and Fallen Jerusalem', 18.4238, -64.447, 'CARB'],
  ['Îlet Pinel to Petite Clef', 18.1047, -63.0179, 'CARB'],
  ['Sea off Île Fourchue', 17.952, -62.905, 'CARB'],
  ['Between the Petite Terre islands', 16.175, -61.109, 'CARB'],
  ['Bay of Le Robert', 14.6845, -60.884, 'CARB'],
  ['Channel between Petit Saint Vincent and Petite Martinique', 12.53, -61.3837, 'CARB'],
  ['NPS mooring buoy off Loggerhead Key', 24.63055, -82.9197833333, 'GMXC'],
  ['Nantasket Roads', 42.325, -70.9273, 'NATL'],
  ['Lake Superior west of Devils Island', 47.068, -90.735, 'INLAND_WATER'],
  ['Ocean within flooded Molokini crescent', 20.6323, -156.4958, 'NEPC'],
  ['Sitka Sound off St. Lazaria', 56.9899, -135.7055, 'ALSK'],
  ['Strait between Big and Little Diomede', 65.761, -168.976, 'BERI'],
  ['Water at Petite Terre archipelago label', 16.17421918, -61.11225054, 'CARB'],
  ['Passage between East and Middle Anacapa', 34.0117, -119.379, 'NEPC'],
  ['Sea off Lime Cay', 17.9165869, -76.822417, 'CARB'],
  ['Channel between Owen Island and Little Cayman', 19.666952, -80.065412, 'CARB'],
  ['Sea off Isla Catalina', 18.377835, -69.0218271, 'CARB'],
  ['Sea off Cayo Largo', 21.6247165, -81.5459274, 'CARB'],
  ['Warderick Wells anchorage', 24.3918794, -76.6191245, 'NATL'],
  ['Atlantic north of Salt Cay', 21.3418482, -71.2065703, 'NATL'],
  ['Cocos lagoon, Guam', 13.243, 144.653, 'NPAC'],
  ['Philippine Sea off Mañagaha', 15.2445, 145.7132, 'PHLS'],
  ['Ocean off Aunuʻu', -14.291, -170.555, 'SEPC'],
  ['Midway lagoon', 28.22, -177.367, 'NEPC'],
];
type ShoreControl = [place: string, lat: number, lon: number];
const uncertain: ShoreControl[] = [
  ['Buck Island eastern reef-edge disagreement', 17.786875, -64.6121146],
  ['Fallen Jerusalem western shoreline disagreement', 18.4174265, -64.4528707],
  ['Mixed shoreline of Loggerhead Key', 24.631089, -82.922585],
  ['Îlet aux Rats gazetteer position on mixed coastal pixels', 14.68374506, -60.89880816],
  ['Lime Cay shoreline disagreement', 17.919619, -76.8195583],
  ['Warderick Wells uncertain shore', 24.3847339, -76.6232727],
  ['Pala Lake wetland on Aunuʻu', -14.2799, -170.5535],
  ['Mixed shoreline of Midway', 28.213, -177.353],
  ['Mixed shoreline of St. Lazaria', 56.987345, -135.7059157],
  ['Ellis Island bridge deck in the NOAA chart', 40.70187195, -74.043921794],
];

test('geography and issuance recognize each island with its address region and sovereign', () => {
  for (const [place, lat, lon, region, sovereign = region] of islands) {
    for (const issue of [encodeAGID, encodeAGID16]) {
      const id = issue(lat, lon);
      assert.equal(id.prefix, region, place);
      assert.equal(id.isSea, false, place);
    }
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    ]) {
      assert.equal(a.status, 'mapped', place);
      assert.equal(a.surface, 'land', place);
      assert.equal(a.territorialTopology?.landform, 'island', place);
      assert.deepEqual(a.regionCandidates, [region], place);
      assert.deepEqual(a.island?.countryCodes, [region], place);
      assert.deepEqual(a.island.sovereignCodes, [sovereign], place);
      assert.equal(a.deliveryRegion, null, place);
    }
  }
});

test('harbours, channels and water enclosed by an island have no address region', async () => {
  for (const [place, lat, lon, basin] of water) {
    const info = getRegionInfo(lat, lon);
    assert.equal(info.prefix, basin, place);
    assert.equal(info.isSea, true, place);
    const issued = encodeAGID16(lat, lon);
    assert.equal(issued.regionCode, basin, place);
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: issued.id }),
    ]) {
      assert.equal(a.status, 'mapped', place);
      assert.equal(a.surface, 'water', place);
      assert.deepEqual(a.regionCandidates, [], place);
      assert.equal(a.island, undefined, place);
      assert.equal(a.deliveryRegion, null, place);
    }
    const requested: string[] = [];
    await resolveAgidLocal({ coordinates: { lat, lon }, addressFormatResolver: async code => { requested.push(code); return null; } });
    assert.deepEqual(requested, [], place);
  }
});

test('locations with conflicting shoreline evidence require confirmation and have no automatic address country', async () => {
  for (const [place, lat, lon] of uncertain) {
    const a = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(a.status, 'needs-confirmation', place);
    assert.equal(a.surface, 'unknown', place);
    assert.deepEqual(a.regionCandidates, [], place);
    assert.equal(a.deliveryRegion, null, place);
    assert.equal(getRegionInfo(lat, lon).prefix, 'SHORELINE_UNRESOLVED', place);
    const requested: string[] = [];
    await resolveAgidLocal({ coordinates: { lat, lon }, addressFormatResolver: async code => { requested.push(code); return null; } });
    assert.deepEqual(requested, [], place);
  }
});

test('a stored British- or sea-prefixed ID keeps its cell and resolves the address format of the current island territory', async () => {
  // Issued on 366a8ea, before these US and Caribbean shoreline extracts.
  for (const [lat, lon, territory, ids] of [
    [18.37009, -64.75672, 'VI', ['VG0ETQRJ8SD4', 'VG0ETQRJ8SD41E34']],
    [17.9588744, -62.90400726, 'BL', ['5A0ETHKZ8SKK', '5A0ETHKZ8SKK1AH9']],
    [24.62758, -82.87316, 'US', ['4F0E8J9PPKSN', '4F0E8J9PPKSN1AEG']],
  ] as const) {
    const issued = encodeAGID16(lat, lon);
    assert.equal(issued.prefix, territory);
    for (const id of ids) {
      assert.equal(getAGIDCellKey(id), getAGIDCellKey(issued));
      const requested: string[] = [];
      const r = await resolveAgidLocal({ query: id, addressFormatResolver: async code => { requested.push(code); return null; } });
      assert.equal(r.agidId, id);
      assert.deepEqual(requested, [territory]);
    }
  }
});

test('reviewed island and water evidence prevails over incorrect or missing coarse offline hits', () => {
  const coarse: PackHit = { islandId: 'fixture:coarse', kind: 'ocean-island', codes: ['CA'],
    relation: 'inside', version: '1', source: 'fixture' };
  for (const raw of [coarse, null]) {
    for (const [place, lat, lon, region, sovereign = region] of islands) {
      const result = packPointResult(lat, lon, raw, !raw, true);
      assert.deepEqual(result.island?.countryCodes, [region], place);
      assert.deepEqual(result.island.sovereignCodes, [sovereign], place);
      assert.equal(result.territorialTopology?.landform, 'island', place);
      assert.equal(result.deliveryRegion, null, place);
    }
    for (const [place, lat, lon] of water) {
      const result = packPointResult(lat, lon, raw, false, true);
      assert.equal(result.island, null, place);
      assert.equal(result.territorialTopology, null, place);
    }
  }
});

test('Navassa remains disputed and its administrative and claimant fields do not become an address region', () => {
  const pin = assessAgidGeography({ kind: 'pin', lat: 18.405, lon: -75.012 });
  assert.equal(pin.surface, 'land');
  assert.equal(pin.status, 'needs-confirmation');
  assert.deepEqual(pin.regionCandidates, []);
  assert.equal(pin.island?.status, 'disputed');
  assert.equal(pin.island.administeringCode, 'US');
  assert.deepEqual(pin.island.claimantCodes, ['HT', 'US']);
  assert.equal(pin.deliveryRegion, null);
});

test('a GPS fix in The Narrows adds British and US Virgin Islands only when its footprint reaches the respective shores', () => {
  const point = { kind: 'pin', method: 'device', lat: 18.378, lon: -64.741 } as const;
  for (const [radius, codes] of [[300, []], [550, ['VG']], [800, ['VG', 'VI']]] as const) {
    const a = assessAgidGeography({ ...point, accuracyMeters: radius });
    assert.deepEqual(a.regionCandidates, codes, `radius ${radius} m`);
    assert.equal(a.status, codes.length ? 'needs-confirmation' : 'mapped');
    assert.equal(a.surface, codes.length ? 'unknown' : 'water');
    assert.equal(a.deliveryRegion, null);
  }
});

test('crossing a gap between shoreline sources can require confirmation before the GPS footprint reaches either Grenadine island', () => {
  const point = { kind: 'pin', method: 'device', lat: 12.53, lon: -61.3837 } as const;
  for (const [radius, surface, codes] of [
    [325, 'water', []], [350, 'unknown', []], [400, 'unknown', ['GD']], [500, 'unknown', ['GD', 'VC']],
  ] as const) {
    const a = assessAgidGeography({ ...point, accuracyMeters: radius });
    assert.equal(a.surface, surface);
    assert.deepEqual(a.regionCandidates, codes, `radius ${radius} m`);
    assert.equal(a.deliveryRegion, null);
  }
});

test('nearby island cores resolve their individual names on the public issuance path', () => {
  for (const [lat, lon, name] of [
    [21.39172, -157.69887, 'Moku Nui'], [21.38761, -157.69775, 'Moku Iki'],
    [18.37009, -64.75672, 'Whistling Cay'], [18.3155834, -65.2287917, 'Culebrita'],
    [12.5215428, -61.3843048, 'Petite Martinique'], [17.9588744, -62.90400726, 'Île Fourchue'],
  ] as const) {
    assert.equal(getRegionInfo(lat, lon).island?.territory, name);
  }
});

test('old Cayman land-prefixed IDs for South Hole Sound reassess as water without requesting an address format', async () => {
  const lat = 19.666952, lon = -80.065412;
  const issued = encodeAGID16(lat, lon);
  assert.equal(issued.regionCode, 'CARB');
  assert.equal(issued.isSea, true);
  for (const id of ['KY0E61NQZ7ZF', 'KY0E61NQZ7ZF1GSC']) {
    assert.equal(getAGIDCellKey(id), getAGIDCellKey(issued));
    const cell = assessAgidGeography({ kind: 'cell', id });
    assert.equal(cell.surface, 'water');
    assert.deepEqual(cell.regionCandidates, []);
    const requested: string[] = [];
    const result = await resolveAgidLocal({ query: id, addressFormatResolver: async code => { requested.push(code); return null; } });
    assert.equal(result.agidId, id);
    assert.deepEqual(requested, []);
  }
});
