import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';

type Pin = [place: string, lat: number, lon: number];
type Dry = [...Pin, region: string, island: string | null, sovereign?: string];
type Wet = [...Pin, basin: string];

// Island names are checked separately from their address territory and sovereign.
// An empty island name marks an unnamed islet. A null name marks the mainland.
const dry: Dry[] = [
  ['Ryan Island in Siskiwit Lake', 48.0098831, -88.7709104, 'US', 'Ryan Island'],
  ['Siskiwit islet southeast of Ryan', 48.0047, -88.76488, 'US', ''],
  ['Isle Royale shore on Siskiwit Lake', 48.00286, -88.762, 'US', 'Isle Royale'],
  ['Heart Island at Boldt Castle', 44.344525, -75.922575, 'US', 'Heart Island'],
  ['Pelee Island at Lighthouse Point', 41.82519335, -82.635375, 'CA', 'Pelee Island'],
  ['Isla Ballena', 24.48328, -110.40348, 'MX', 'Isla Ballena'],
  ['Isla Gallo', 24.46616, -110.38536, 'MX', 'Isla Gallo'],
  ['Isla Gallina', 24.45724, -110.38396, 'MX', 'Isla Gallina'],
  ['Isla Mujeres between lagoons', 21.23332, -86.73283, 'MX', 'Isla Mujeres'],
  ['Punta Banda mainland barrier', 31.77, -116.624, 'MX', null],
  ['Punta Banda mainland shore', 31.77, -116.6085, 'MX', null],
  ['Alcatraz cellhouse', 37.8267, -122.423, 'US', 'Alcatraz Island'],
  ['Moss Landing mainland', 36.804946, -121.783484, 'US', null],
  ['Tangier village', 37.826, -75.9925, 'US', 'Tangier Island'],
  ['Culebrita dry upland', 18.318471, -65.232749, 'PR', 'Culebrita', 'US'],
  ['Culebra dry upland', 18.322731, -65.320215, 'PR', 'Culebra', 'US'],
  ['St. John dry upland', 18.310789, -64.704233, 'VI', 'St. John', 'US'],
  ['St. Croix dry upland', 17.72844, -64.661711, 'VI', 'St. Croix', 'US'],
  ['Terre de Bas ridge between salines', 16.1700962, -61.1159541, 'GP', 'Terre de Bas', 'FR'],
];

const wet: Wet[] = [
  ['Siskiwit Lake channel south of Ryan', 48.006, -88.768, 'INLAND_WATER'],
  ['St. Lawrence River beside Heart Island', 44.3448, -75.924, 'INLAND_WATER'],
  ['Lake Henry on Pelee Island', 41.826208, -82.637292, 'INLAND_WATER'],
  ['Lake Erie beside Pelee', 41.834, -82.639, 'INLAND_WATER'],
  ['Pelee barrier lagoon previously mapped as land', 41.8258333, -82.6400833, 'INLAND_WATER'],
  ['Gallo–Gallina channel', 24.4615, -110.3848, 'CALI'],
  ['Laguna Makax on Isla Mujeres', 21.2304, -86.7357, 'CARB'],
  ['Salina Grande on Isla Mujeres', 21.22866, -86.72972, 'INLAND_WATER'],
  ['Punta Banda estuary mouth', 31.77, -116.616, 'NEPC'],
  ['San Francisco Bay off Alcatraz', 37.827, -122.4195, 'NEPC'],
  ['Elkhorn Slough subtidal channel', 36.811028, -121.782287, 'NEPC'],
  ['Mailboat Harbor at Tangier', 37.8295, -75.987279, 'NATL'],
  ['Monterey Bay west of Moss Landing', 36.806347, -121.790802, 'NEPC'],
  ['Laguna de Molino on Culebrita', 18.320461, -65.236151, 'INLAND_WATER'],
  ['Laguna del Flamenco on Culebra', 18.325068, -65.315628, 'INLAND_WATER'],
  ['Salt Pond on St. John', 18.307698, -64.703533, 'INLAND_WATER'],
  ['Great Pond on St. Croix', 17.722771, -64.659438, 'INLAND_WATER'],
  ['Sea off Culebrita', 18.322965, -65.232789, 'CARB'],
  ['Sea off Culebra', 18.330569, -65.31636, 'CARB'],
  ['Salt Pond Bay off St. John', 18.310381, -64.700385, 'CARB'],
  ['Caribbean off St. Croix', 17.719799, -64.651803, 'CARB'],
  ['Terre de Bas western permanent saline', 16.1716198, -61.1193224, 'INLAND_WATER'],
  ['Terre de Bas eastern permanent saline', 16.1719192, -61.1155603, 'INLAND_WATER'],
  ['Offshore water north of Terre de Bas', 16.1730344, -61.1160733, 'CARB'],
];

const unresolved: Pin[] = [
  ['Lake Henry marsh', 41.8251845, -82.6387186],
  ['State Route 1 bridge over Elkhorn Slough', 36.809938, -121.784722],
  ['Elkhorn Slough wetland', 36.811754, -121.784454],
  ['Tangier tidal marsh', 37.832824, -75.993293],
  ['Elkhorn intertidal flat', 36.812376, -121.788351],
  ['Great Pond alternating marsh classifications', 17.724379, -64.656069],
  ['Terre de Bas intermittent saline', 16.17247197, -61.11400874],
];

test('point and cell distinguish lake islands, their enclosing islands, mainland spits and territory coasts', () => {
  for (const [place, lat, lon, region, islandName, sovereign = region] of dry) {
    const issued = encodeAGID16(lat, lon);
    assert.equal(issued.regionCode, region, place);
    assert.equal(issued.isSea, false, place);
    assert.equal(encodeAGID(lat, lon).prefix, region, place);
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: issued.id }),
    ]) {
      assert.equal(a.status, 'mapped', place);
      assert.equal(a.surface, 'land', place);
      assert.deepEqual(a.regionCandidates, [region], place);
      assert.equal(a.deliveryRegion, null, place);
      if (islandName === null) {
        assert.equal(a.territorialTopology?.landform, 'mainland', place);
        assert.equal(a.island, undefined, place);
      } else {
        assert.equal(a.territorialTopology?.landform, 'island', place);
        assert.equal(a.island?.territory, islandName || undefined, place);
        assert.deepEqual(a.island?.countryCodes, [region], place);
        assert.deepEqual(a.island?.sovereignCodes, [sovereign], place);
      }
    }
  }
});

test('enclosed ponds and estuaries use the mapped basin for pins and decoded cells', () => {
  for (const [place, lat, lon, basin] of wet) {
    const issued = encodeAGID16(lat, lon);
    assert.equal(issued.regionCode, basin, place);
    assert.equal(issued.isSea, true, place);
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
  }
});

test('mixed marsh and shoreline evidence withholds automatic territory and address format', async () => {
  for (const [place, lat, lon] of unresolved) {
    assert.equal(getRegionInfo(lat, lon).prefix, 'SHORELINE_UNRESOLVED', place);
    const requested: string[] = [];
    await resolveAgidLocal({ coordinates: { lat, lon },
      addressFormatResolver: async code => { requested.push(code); return null; } });
    assert.deepEqual(requested, [], place);
    for (const a of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    ]) {
      assert.equal(a.surface, 'unknown', place);
      assert.equal(a.status, 'needs-confirmation', place);
      assert.deepEqual(a.regionCandidates, [], place);
      assert.equal(a.deliveryRegion, null, place);
    }
  }
});

test('GPS accuracy accounts for the distance to mapped water, uncertain shoreline pixels and dry island', () => {
  for (const [place, lat, lon, observations] of [
    ['Siskiwit Lake', 48.006, -88.768, [[10, 'water', []], [150, 'water', []], [350, 'unknown', ['US']]]],
    ['Laguna de Molino', 18.320461, -65.236151, [[10, 'water', []], [40, 'unknown', []], [200, 'unknown', ['PR']]]],
    ['Terre de Bas western saline', 16.1716198, -61.1193224, [[10, 'water', []], [35, 'unknown', []], [140, 'unknown', ['GP']]]],
    ['Canal between Gallo and Gallina', 24.4615, -110.3848, [[10, 'water', []], [350, 'water', []], [500, 'unknown', ['MX']]]],
  ] as const) {
    for (const [accuracyMeters, surface, regions] of observations) {
      const a = assessAgidGeography({ kind: 'pin', method: 'device', lat, lon, accuracyMeters });
      const message = `${place} (${accuracyMeters} m)`;
      assert.equal(a.surface, surface, message);
      assert.equal(a.status, surface === 'unknown' ? 'needs-confirmation' : 'mapped', message);
      assert.deepEqual(a.regionCandidates, regions, message);
      assert.equal(a.deliveryRegion, null, message);
    }
  }
});

test('pins on either side of the Culebrita survey limit keep the active evidence as the footprint grows', () => {
  // The southern edge of the pond survey is 18.316 degrees north. Dry land is
  // corroborated by the older island survey immediately south of this edge.
  const lon = -65.2312;
  for (const [lat, surface, codes] of [[18.31602, 'unknown', []], [18.31598, 'land', ['PR']]] as const) {
    const pin = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(pin.surface, surface);
    assert.deepEqual(pin.regionCandidates, codes);
    const precise = assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 1 });
    assert.equal(precise.surface, surface);
    assert.deepEqual(precise.regionCandidates, codes);
    const wide = assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 10 });
    assert.equal(wide.status, 'needs-confirmation');
    assert.equal(wide.surface, 'unknown');
    assert.deepEqual(wide.regionCandidates, ['PR']);
  }
});

test('historical lake, ocean and territory prefixes retain the cell and resolve using the corrected surface', async () => {
  // These 12- and 16-character IDs were issued by 5a9fa1b at the original pin.
  for (const [lat, lon, format, ids] of [
    [48.0098831, -88.7709104, 'US', ['C00HNCYHWBFH', 'C00HNCYHWBFH1A7X']],
    [24.48328, -110.40348, 'MX', ['6X0DG7GEH7EY', '6X0DG7GEH7EY106C']],
    [18.325068, -65.315628, null, ['PR0ETQWM4155', 'PR0ETQWM41551QZP']],
    [18.307698, -64.703533, null, ['VI0ETQRMV0C7', 'VI0ETQRMV0C716PN']],
  ] as const) {
    const current = encodeAGID16(lat, lon);
    for (const id of ids) {
      assert.equal(getAGIDCellKey(id), getAGIDCellKey(current), id);
      const cell = assessAgidGeography({ kind: 'cell', id });
      assert.equal(cell.surface, format ? 'land' : 'water', id);
      assert.deepEqual(cell.regionCandidates, format ? [format] : [], id);
      const requested: string[] = [];
      const result = await resolveAgidLocal({ query: id,
        addressFormatResolver: async code => { requested.push(code); return null; } });
      assert.equal(result.agidId, id);
      assert.deepEqual(requested, format ? [format] : [], id);
    }
  }
});
