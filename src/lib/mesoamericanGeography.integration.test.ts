import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packPointResult, type PackHit } from '../../scripts/national-island-supplement';
import { encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';
import { matchMesoamericanGeography, mesoamericanWindows } from './mesoamericanReviewedGeography';

interface LandControl {
  name: string;
  lat: number;
  lon: number;
  country: string;
  kind: 'mainland' | 'island';
}

const land: LandControl[] = [
  { name: 'San Ysidro, California', lat: 32.544, lon: -117.03, country: 'US', kind: 'mainland' },
  { name: 'Tijuana, Baja California', lat: 32.541, lon: -117.03, country: 'MX', kind: 'mainland' },
  { name: 'Nogales, Arizona', lat: 31.335, lon: -110.9445, country: 'US', kind: 'mainland' },
  { name: 'Nogales, Sonora', lat: 31.331, lon: -110.9445, country: 'MX', kind: 'mainland' },
  { name: 'Border Field State Park', lat: 32.535827, lon: -117.1215, country: 'US', kind: 'mainland' },
  { name: 'Playas de Tijuana', lat: 32.532741, lon: -117.1215, country: 'MX', kind: 'mainland' },
  { name: 'Calexico', lat: 32.667805, lon: -115.499, country: 'US', kind: 'mainland' },
  { name: 'Mexicali', lat: 32.662401, lon: -115.499, country: 'MX', kind: 'mainland' },
  { name: 'El Paso', lat: 31.763873, lon: -106.447662, country: 'US', kind: 'mainland' },
  { name: 'Ciudad Juárez', lat: 31.758866, lon: -106.4505, country: 'MX', kind: 'mainland' },
  { name: 'Laredo', lat: 27.502381, lon: -99.505, country: 'US', kind: 'mainland' },
  { name: 'Nuevo Laredo', lat: 27.495099, lon: -99.505, country: 'MX', kind: 'mainland' },
  { name: 'Brownsville', lat: 25.882681, lon: -97.494138, country: 'US', kind: 'mainland' },
  { name: 'Matamoros', lat: 25.880949, lon: -97.501521, country: 'MX', kind: 'mainland' },
  { name: 'Eagle Pass', lat: 28.705393, lon: -100.506181, country: 'US', kind: 'mainland' },
  { name: 'Piedras Negras', lat: 28.705393, lon: -100.512681, country: 'MX', kind: 'mainland' },
  // INGUAT's 2026 Petén tourist map shows Flores and its streets within the lake.
  { name: 'Flores, Petén', lat: 16.930, lon: -89.8913, country: 'GT', kind: 'island' },
  // ICJ judgment of 11 September 1992, paragraph 431, identifies the three islands.
  { name: 'Meanguera', lat: 13.1836, lon: -87.704, country: 'SV', kind: 'island' },
  { name: 'Meanguerita', lat: 13.172639, lon: -87.685348, country: 'SV', kind: 'island' },
  { name: 'El Tigre', lat: 13.274, lon: -87.633, country: 'HN', kind: 'island' },
  { name: 'St George’s Caye, Belize', lat: 17.55545726, lon: -88.07182279, country: 'BZ', kind: 'island' },
  { name: 'Suchiate west bank', lat: 14.681, lon: -92.1495, country: 'MX', kind: 'mainland' },
  { name: 'Suchiate east bank', lat: 14.681, lon: -92.1435, country: 'GT', kind: 'mainland' },
  { name: 'Montecristo, Guatemala', lat: 14.427, lon: -89.364, country: 'GT', kind: 'mainland' },
  { name: 'Montecristo, El Salvador', lat: 14.411, lon: -89.36, country: 'SV', kind: 'mainland' },
  { name: 'Montecristo, Honduras', lat: 14.424, lon: -89.348, country: 'HN', kind: 'mainland' },
  { name: 'Sixaola', lat: 9.502, lon: -82.614, country: 'CR', kind: 'mainland' },
  { name: 'Guabito', lat: 9.495, lon: -82.613, country: 'PA', kind: 'mainland' },
  { name: 'Paso Canoas, western side', lat: 8.534, lon: -82.841, country: 'CR', kind: 'mainland' },
  { name: 'Paso Canoas, eastern side', lat: 8.532, lon: -82.836, country: 'PA', kind: 'mainland' },
  { name: 'Peñas Blancas, Costa Rica', lat: 11.21306, lon: -85.61083, country: 'CR', kind: 'mainland' },
  { name: 'Peñas Blancas, Nicaragua', lat: 11.21806, lon: -85.61278, country: 'NI', kind: 'mainland' },
  { name: 'Moyogalpa, Ometepe', lat: 11.54, lon: -85.700, country: 'NI', kind: 'island' },
  { name: 'Isla Carenero', lat: 9.343, lon: -82.2335, country: 'PA', kind: 'island' },
  // AAC Panamá AIP, AD 2.4 MPBO: runway centre 092027N 0821503W.
  { name: 'Bocas del Toro airport, Isla Colón', lat: 9.3408333333, lon: -82.2508333333, country: 'PA', kind: 'island' },
];

const water = [
  { name: 'Pacific water north of the border terminus', lat: 32.536, lon: -117.128, inland: false },
  { name: 'Pacific water south of the border terminus', lat: 32.532, lon: -117.128, inland: false },
  { name: 'West Caribbean east of St George’s Caye', lat: 17.5554, lon: -88.0701, inland: false },
  { name: 'Río Grande at Laredo', lat: 27.499946692521384, lon: -99.50487203803706, inland: true },
  { name: 'Río Grande at Brownsville', lat: 25.88033333, lon: -97.49745833, inland: true },
  { name: 'Río Grande at Eagle Pass', lat: 28.70540161470847, lon: -100.5118647029792, inland: true },
  { name: 'Lake Nicaragua at Moyogalpa', lat: 11.54, lon: -85.705, inland: true },
  { name: 'Sixaola river', lat: 9.499, lon: -82.614, inland: true },
  { name: 'Water east of Isla Colón', lat: 9.341, lon: -82.238, inland: false },
  { name: 'Suchiate river', lat: 14.681, lon: -92.1468, inland: true },
  { name: 'Lake Petén Itzá west of Flores', lat: 16.932, lon: -89.897, inland: true },
  { name: 'Gulf of Fonseca between El Tigre and Meanguera', lat: 13.222, lon: -87.672, inland: false },
];

// FieldMaps common vertex on Montecristo, where the Trinational Commission identifies
// the meeting of Guatemala, Honduras and El Salvador. Coordinates describe the source map.
const trifinio = { lat: 14.4204599, lon: -89.3559607 };
const threeCountries = ['GT', 'HN', 'SV'];

test('reviewed mainland and island interiors carry a single country in both AGID formats', () => {
  for (const { name, lat, lon, country, kind } of land) {
    for (const encode of [encodeAGID, encodeAGID16]) {
      const id = encode(lat, lon);
      assert.equal(id.prefix, country, name);
      assert.equal(id.regionCode, country, name);
      assert.equal(id.isSea, false, name);
    }
    for (const result of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 3 }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    ]) {
      assert.equal(result.surface, 'land', name);
      assert.equal(result.status, 'mapped', name);
      assert.deepEqual(result.regionCandidates, [country], name);
      assert.equal(result.territorialTopology?.landform, kind, name);
      if (kind === 'island') assert.deepEqual(result.island?.countryCodes, [country], name);
      else assert.equal(result.island, undefined, name);
      assert.equal(result.deliveryRegion, null, name);
      assert.ok(result.sources.some(s => s.source.startsWith('us-mx-ca-review+')), name);
    }
  }
});

test('inland and coastal water do not acquire the country of the nearest bank or island', async () => {
  for (const { name, lat, lon, inland } of water) {
    const pin = assessAgidGeography({ kind: 'pin', lat, lon });
    const cell = assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id });
    for (const result of [pin, cell]) {
      assert.equal(result.surface, 'water', name);
      assert.equal(result.status, 'mapped', name);
      assert.deepEqual(result.regionCandidates, [], name);
      assert.equal(result.island, undefined, name);
      assert.equal(result.deliveryRegion, null, name);
    }
    for (const encode of [encodeAGID, encodeAGID16]) assert.equal(encode(lat, lon).isSea, true, name);
    if (inland) assert.equal(getRegionInfo(lat, lon).prefix, 'INLAND_WATER', name);
    const requests: string[] = [];
    await resolveAgidLocal({ coordinates: { lat, lon }, addressFormatResolver: async country => {
      requests.push(country); return null;
    } });
    assert.deepEqual(requests, [], name);
  }
});

test('the digital Montecristo tripoint returns the three land neighbours without selecting a delivery country', () => {
  for (const input of [
    { kind: 'pin', ...trifinio },
    { kind: 'pin', ...trifinio, method: 'device', accuracyMeters: 20 },
    { kind: 'cell', id: encodeAGID16(trifinio.lat, trifinio.lon).id },
  ] as const) {
    const result = assessAgidGeography(input);
    assert.equal(result.surface, 'land');
    assert.equal(result.status, 'needs-confirmation');
    assert.deepEqual(result.regionCandidates, threeCountries);
    assert.equal(result.island, undefined);
    assert.equal(result.deliveryRegion, null);
  }
  assert.ok(!threeCountries.includes(encodeAGID16(trifinio.lat, trifinio.lon).prefix));
});

test('historical Guatemala-prefixed cells in Lake Petén Itzá still resolve at their original location', async () => {
  // Both IDs were issued at this open-water pin before the water polygon was added.
  const current = encodeAGID16(16.932, -89.897);
  for (const legacy of ['GT0E7G0DH4DA', 'GT0E7G0DH4DA1H1M']) {
    assert.equal(getAGIDCellKey(legacy), getAGIDCellKey(current));
    const result = assessAgidGeography({ kind: 'cell', id: legacy });
    assert.equal(result.surface, 'water');
    assert.deepEqual(result.regionCandidates, []);
    const requests: string[] = [];
    const resolved = await resolveAgidLocal({ query: legacy, addressFormatResolver: async country => {
      requests.push(country); return null;
    } });
    assert.equal(resolved.agidId, legacy);
    assert.deepEqual(requests, []);
  }
});

test('optional pack results preserve the surveyed island and cannot restore land in reviewed water', () => {
  const wrongHit: PackHit = { islandId: 'fixture:coarse-island', kind: 'ocean-island',
    codes: ['MX'], relation: 'inside', source: 'fixture', version: '1' };
  for (const hit of [null, wrongHit]) {
    const flores = packPointResult(16.93, -89.8913, hit, !hit, true);
    assert.deepEqual(flores.island?.countryCodes, ['GT']);
    assert.equal(flores.territorialTopology?.landform, 'island');
    assert.equal(flores.physicalIslandId, undefined);
    const lake = packPointResult(16.932, -89.897, hit, !hit, true);
    assert.equal(lake.island, null);
    assert.equal(lake.territorialTopology, null);
    assert.equal(lake.deliveryRegion, null);
  }
});

test('reviewed windows are disjoint and preserve existing decisions for nearby islands', () => {
  const chelem = { lat: 18 + 11 / 60 + 34.780 / 3600, lon: -(87 + 53 / 60 + 10.895 / 3600) };
  assert.equal(matchMesoamericanGeography(chelem.lat, chelem.lon), undefined);
  assert.deepEqual(getRegionInfo(chelem.lat, chelem.lon).island?.countryCodes, ['MX']);
  assert.equal(matchMesoamericanGeography(16.1081, -88.2689), undefined); // Hunting Caye, Sapodilla Cayes
  for (const [i, a] of mesoamericanWindows.entries()) {
    const [w, s, e, n] = a.bbox;
    assert.ok(w < e && s < n, a.id);
    for (const b of mesoamericanWindows.slice(i + 1)) {
      assert.ok(w > b.bbox[2] || e < b.bbox[0] || s > b.bbox[3] || n < b.bbox[1], a.id + ' / ' + b.id);
    }
  }
});

test('a device fix near the San Ysidro land border changes candidates only when its footprint reaches Mexico', () => {
  // The US–Mexico boundary trace here lies at 32.54240 N, nearly east–west.
  const position = { kind: 'pin', method: 'device', lat: 32.54250, lon: -117.03 } as const;
  const precise = assessAgidGeography({ ...position, accuracyMeters: 3 });
  assert.equal(precise.status, 'mapped');
  assert.deepEqual(precise.regionCandidates, ['US']);
  const crossing = assessAgidGeography({ ...position, accuracyMeters: 30 });
  assert.equal(crossing.surface, 'land');
  assert.equal(crossing.status, 'needs-confirmation');
  assert.deepEqual(crossing.regionCandidates, ['MX', 'US']);
  assert.equal(crossing.deliveryRegion, null);
});

const dryBorder = [
  { name: 'San Ysidro', lat: 32.542407648528034, lon: -117.03000001572802 },
  { name: 'Nogales', lat: 31.332735386836507, lon: -110.94449996055343 },
  { name: 'Calexico', lat: 32.6647064674088, lon: -115.49900000624541 },
];

test('dry USIBWC crossings keep both countries available without choosing one in either ID format', async () => {
  for (const { name, lat, lon } of dryBorder) {
    const coordinates = { lat, lon };
    const pin = assessAgidGeography({ kind: 'pin', ...coordinates });
    assert.equal(pin.surface, 'land', name);
    assert.equal(pin.status, 'needs-confirmation', name);
    assert.deepEqual(pin.regionCandidates, ['MX', 'US'], name);
    for (const encode of [encodeAGID, encodeAGID16]) {
      const id = encode(lat, lon);
      assert.equal(id.isSea, false, name);
      assert.ok(!['MX', 'US'].includes(id.prefix), name);
    }
    const requests: string[] = [];
    await resolveAgidLocal({ coordinates, addressFormatResolver: async country => { requests.push(country); return null; } });
    assert.deepEqual(requests, [], name);
  }
});

test('source disagreements withhold the address country and retain land only where surveys agree on it', async () => {
  for (const [name, lat, lon, surface] of [
    ['St George’s Caye wetland', 17.5554, -88.0745, 'unknown'],
    ['El Paso river channel', 31.764040157320977, -106.45017191721837, 'unknown'],
    ['Brownsville river channel', 25.879605715919872, -97.49612751123698, 'unknown'],
    ['Peñas Blancas land between the boundary traces', 11.216, -85.612, 'land'],
  ] as const) {
    const coordinates = { lat, lon };
    const pin = assessAgidGeography({ kind: 'pin', ...coordinates });
    assert.equal(pin.status, 'needs-confirmation', name);
    assert.equal(pin.surface, surface, name);
    assert.deepEqual(pin.regionCandidates, [], name);
    assert.equal(pin.island, undefined, name);
    assert.equal(pin.deliveryRegion, null, name);
    assert.equal(getRegionInfo(lat, lon).prefix, 'SHORELINE_UNRESOLVED', name);
    const calls: string[] = [];
    await resolveAgidLocal({ coordinates, addressFormatResolver: async country => { calls.push(country); return null; } });
    assert.deepEqual(calls, [], name);
  }
});

test('the Suchiate GPS disk adds each country only when it reaches that country’s dry bank', () => {
  // The nearest retained Mexican land lies about 49 m from the pin, and Guatemalan land about 68 m.
  const center = { kind: 'pin', lat: 14.681, lon: -92.1468, method: 'device' } as const;
  for (const [accuracyMeters, candidates] of [[10, []], [60, ['MX']], [90, ['GT', 'MX']]] as const) {
    const result = assessAgidGeography({ ...center, accuracyMeters });
    assert.deepEqual(result.regionCandidates, candidates);
    assert.equal(result.status, candidates.length ? 'needs-confirmation' : 'mapped');
    assert.equal(result.surface, candidates.length ? 'unknown' : 'water');
    assert.equal(result.deliveryRegion, null);
  }
});

test('reviewed coasts distinguish the Pacific and Caribbean when a coarse ocean polygon spans the isthmus', () => {
  for (const [lat, lon, basin, prefix] of [
    [32.532, -117.128, 'NEPC', 'P0'],
    [13.222, -87.672, 'NEPC', 'P0'],
    [17.5554, -88.0701, 'CARB', '5A'],
    [9.341, -82.238, 'CARB', '5A'],
  ] as const) {
    assert.equal(getRegionInfo(lat, lon).prefix, basin);
    for (const encode of [encodeAGID, encodeAGID16]) {
      const current = encode(lat, lon);
      assert.equal(current.prefix, prefix);
      assert.equal(current.isSea, true);
    }
  }
  const fonseca = encodeAGID16(13.222, -87.672);
  for (const old of ['NI0E78V3AGSE', 'NI0E78V3AGSE1HYH']) {
    assert.equal(getAGIDCellKey(old), getAGIDCellKey(fonseca));
    assert.deepEqual(assessAgidGeography({ kind: 'cell', id: old }).regionCandidates, []);
  }
});
