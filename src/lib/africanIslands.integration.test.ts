import assert from 'node:assert/strict';
import test from 'node:test';
import { packPointResult, type PackHit } from '../../scripts/national-island-supplement';
import { encodeAGID, encodeAGID16, getAGIDCellKey } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography as assess } from './geographicAssessment';

type Control = [place: string, country: string, lat: number, lon: number, waterLat: number, waterLon: number, basin: string];
const controls: Control[] = [
  ['Santiago, Cabo Verde', 'CV', 14.92, -23.51, 15.04, -23.96, 'NATL'],
  ['São Tomé', 'ST', .30, 6.62, .25, 6.75, 'GUIN'],
  ['Príncipe', 'ST', 1.62, 7.42, 1.66, 7.50, 'GUIN'],
  ['Bioko', 'GQ', 3.55, 8.65, 3.52, 8.42, 'GUIN'],
  ['Annobón', 'GQ', -1.43, 5.625, -1.42, 5.67, 'GUIN'],
  ['Tenerife', 'ES', 28.37, -16.56, 28.37, -15.9, 'NATL'],
  ['Madeira', 'PT', 32.75, -16.98, 32.8, -16.61, 'NATL'],
  ['Saint Helena', 'SH', -15.95, -5.71, -15.95, -5.81, 'SATL'],
  ['Ascension', 'SH', -7.94, -14.35, -7.94, -14.43, 'SATL'],
  ['Tristan da Cunha', 'SH', -37.106, -12.27, -37.10, -12.35, 'SATL'],
  ['Grande Comore', 'KM', -11.7, 43.33, -11.85, 43.60, 'SIND'],
  ['Mahé', 'SC', -4.62, 55.45, -4.51, 55.55, 'SIND'],
  ['Mauritius', 'MU', -20.28, 57.55, -20.11, 57.28, 'SIND'],
  ['Rodrigues', 'MU', -19.72, 63.43, -19.73, 63.53, 'SIND'],
  ['Réunion', 'RE', -21.1, 55.5, -21.09, 55.2, 'SIND'],
  ['Nosy Be', 'MG', -13.32, 48.25, -13.52, 48.28, 'SIND'],
  ['Sainte-Marie', 'MG', -16.92, 49.87, -16.93, 49.75, 'SIND'],
  ['Unguja', 'TZ', -6.16, 39.2, -6.15, 39.06, 'SIND'],
  ['Pemba', 'TZ', -5.24, 39.78, -5.24, 39.62, 'SIND'],
  ['Likoma', 'MW', -12.065, 34.736, -12.05, 34.685, 'INLAND_WATER'],
  ['Chizumulu', 'MW', -12.02, 34.62, -12.04, 34.80, 'INLAND_WATER'],
];
const prefixes: Record<string, string> = { Tenerife: 'ES_CAN', Madeira: 'PT_MAD', Ascension: 'AC', 'Tristan da Cunha': 'TA' };

test('the African island interiors keep the territory, sovereign and local issuance prefix in both formats', () => {
  for (const [place, country, lat, lon] of controls) {
    const legacy = encodeAGID(lat, lon);
    const current = encodeAGID16(lat, lon);
    assert.equal(getAGIDCellKey(legacy), getAGIDCellKey(current), place);
    for (const encoded of [legacy, current]) {
      assert.equal(encoded.regionCode, prefixes[place] ?? country, place);
      assert.equal(encoded.isSea, false, place);
    }
    for (const input of [{ kind: 'pin', lat, lon }, { kind: 'pin', lat, lon, method: 'device', accuracyMeters: 5 },
      { kind: 'cell', id: legacy.id }, { kind: 'cell', id: current.id }] as const) {
      const r = assess(input);
      assert.equal(r.status, 'mapped', place);
      assert.equal(r.surface, 'land', place);
      assert.equal(r.territorialTopology?.landform, 'island', place);
      assert.deepEqual(r.regionCandidates, [country], place);
      assert.deepEqual(r.island?.countryCodes, [country], place);
      assert.deepEqual(r.island?.sovereignCodes, [country === 'SH' ? 'GB' : country === 'RE' ? 'FR' : country], place);
      assert.equal(r.deliveryRegion, null, place);
      assert.ok(r.sources.some(s => s.source.startsWith('africa-island+')), place);
    }
  }
});

test('neighbouring saltwater and freshwater keep their basin and have no address country', () => {
  for (const [place, , , , lat, lon, basin] of controls) {
    for (const encode of [encodeAGID, encodeAGID16]) {
      const code = encode(lat, lon);
      assert.equal(code.regionCode, basin, place);
      assert.equal(code.isSea, true, place);
      const r = assess({ kind: 'cell', id: code.id });
      assert.equal(r.surface, 'water', place);
      assert.deepEqual(r.regionCandidates, [], place);
      assert.equal(r.island, undefined, place);
    }
  }
});

test('Mayotte retains its territory identifier and group-level claims only on observed land', async () => {
  const lat = -12.78, lon = 45.18;
  for (const input of [{ kind: 'pin', lat, lon }, { kind: 'cell', id: encodeAGID16(lat, lon).id }] as const) {
    const r = assess(input);
    assert.equal(r.surface, 'land');
    assert.equal(r.status, 'needs-confirmation');
    assert.equal(r.island?.status, 'disputed');
    assert.equal(r.island?.claimScope, 'island-group');
    assert.deepEqual(r.island?.claimantCodes, ['FR', 'KM']);
    assert.deepEqual(r.regionCandidates, []);
    assert.equal(r.deliveryRegion, null);
  }
  assert.equal(encodeAGID16(lat, lon).regionCode, 'YT');
  const calls: string[] = [];
  await resolveAgidLocal({ coordinates: { lat, lon }, addressFormatResolver: async c => { calls.push(c); return null; } });
  assert.deepEqual(calls, []);
  const water = assess({ kind: 'pin', lat: -12.71, lon: 45.3, method: 'device', accuracyMeters: 25 });
  assert.equal(water.surface, 'water');
  assert.equal(water.island, undefined);
  assert.deepEqual(water.regionCandidates, []);
  assert.deepEqual(assess({ kind: 'pin', lat: .809, lon: 9.38 }).island?.countryCodes, ['GQ']);
});

test('the optional island pack follows the surveyed lake shore and the Mayotte policy even with older conflicting evidence', () => {
  const raw: PackHit = { source: 'gshhg-full+fieldmaps-usgs-lsib', version: '2.3.7+2025-07-29',
    islandId: 'test-feature', kind: 'lake-island', codes: ['MZ'], sovereignCodes: ['MZ'], relation: 'inside' };
  assert.deepEqual(packPointResult(-12.065, 34.736, null, true, true).island?.countryCodes, ['MW']);
  assert.equal(packPointResult(-12.05, 34.685, raw, false, true).island, null);
  assert.deepEqual(packPointResult(-12.78, 45.18, raw, false, true).island?.claimantCodes, ['FR', 'KM']);
  assert.equal(packPointResult(-12.71, 45.3, raw, false, true).island, null);
});
