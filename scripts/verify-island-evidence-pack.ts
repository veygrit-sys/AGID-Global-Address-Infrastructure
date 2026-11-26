import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// An explicit local pack is required because the full-resolution edition is over 1 GB.
const [pack, python = 'python3'] = process.argv.slice(2);
if (!pack) throw new Error('Usage: node --import tsx scripts/verify-island-evidence-pack.ts PACK [PYTHON]');
const cli = fileURLToPath(new URL('./query-island-pack.ts', import.meta.url));
const lookup = (lat: number, lon: number) => JSON.parse(execFileSync(process.execPath,
  ['--import', 'tsx', cli, pack, String(lat), String(lon), '--python', python], { encoding: 'utf8' }));
const controls = [
  [4.88, 114.93, 'BN', 'gshhg:9'], [1.55, 110.35, 'MY', 'gshhg:9'], [-0.48, 117.13, 'ID', 'gshhg:9'],
  [45.85, -82.18, 'CA', 'gshhg:187164'], [45.78, -81.97, null], [71, -40, 'GL', 'gshhg:7'],
  [-16.85, 180, 'FJ'], [-16.85, -180, 'FJ'], [-17.0593091, -179.0205836, 'FJ', 'fieldmaps-20250729:160910'],
  [-48.945774, -75.45762053457514, 'CL'], // GSHHG/FieldMaps gap with positive bundled island evidence
  [69.2804165, -133.95786937131547, 'CA', 'gshhg:8361'],
  [32.7145415, 130.6160601592332, 'JP', 'gshhg:87717'],
  [82.76075, -67.13636713524467, 'CA', 'gshhg:18608'],
  [82.7517558, -67.24109433333334, 'unresolved', 'gshhg:18608'],
  [39.245389, 141.9685004390244, 'JP', 'gshhg:92768'],
  [39.2447332, 141.96655346666665, 'unresolved', 'gshhg:92768'],
  [18.19299444, -87.88635972, 'MX', 'gshhg:6815'],
  [18.188, -87.88240989966037, 'unresolved', 'gshhg:6815'],
  [25.7445, 123.4745, 'JP'], [-51.794, -58.61, 'disputed'], [0, -140, null], [48.85, 2.35, null],
] as const;
for (const [lat, lon, expected, id] of controls) {
  const result = lookup(lat, lon);
  assert.equal(result.deliveryRegion, null);
  if (expected === null) assert.equal(result.island, null);
  else if (expected === 'disputed') {
    assert.deepEqual(result.island.countryCodes, []);
    assert.deepEqual(result.island.claimantCodes, ['AR', 'GB']);
  } else if (expected === 'unresolved') {
    assert.equal(result.island.status, 'unresolved');
    assert.deepEqual(result.island.countryCodes, []);
  } else assert.deepEqual(result.island.countryCodes, [expected]);
  if (id) assert.equal(result.physicalIslandId, id);
  if (id === 'gshhg:6815') {
    assert.equal(result.territorialTopology.landform, expected === 'MX' ? 'island' : 'unknown');
    assert.equal(result.territorialTopology.status, expected === 'MX' ? 'inside' : 'uncertain');
  }
  if (expected === 'GL') assert.deepEqual(result.island.sovereignCodes, ['DK']);
  if (expected === 'CL') {
    assert.equal(result.island.source, 'natural-earth-global-island-map-units');
    assert.equal(result.physicalIslandId, undefined);
  }
  if (id === 'gshhg:8361' || (id === 'gshhg:18608' && expected === 'CA')) assert.equal(result.island.source, 'statcan-cbf-pr');
  if (id === 'gshhg:87717' || (id === 'gshhg:92768' && expected === 'JP')) assert.equal(result.island.source, 'mlit-n03-national');
  if (expected === 'JP' && !id) assert.equal(result.island.status, 'japan-position');
}
// Independent GSHHG + FieldMaps interior anchors on both sides of each shared
// island. The political code belongs to the pin; the physical ID spans the island.
const sharing = [
  { id: 8, pins: [[-4.72564, 138.71403, 'ID'], [-6.63990, 144.36179, 'PG']] },
  { id: 9, pins: [[4.53794, 114.46844, 'BN'], [0.10491, 113.32523, 'ID'], [3.93732, 114.61303, 'MY']] },
  { id: 26, pins: [[54.64134, -6.88882, 'GB'], [53.41606, -7.95824, 'IE']] },
  { id: 29, pins: [[18.77655, -70.12528, 'DO'], [18.98205, -72.28342, 'HT']] },
  { id: 35, pins: [[-53.84180, -68.09469, 'AR'], [-53.69923, -69.32612, 'CL']] },
  { id: 51, pins: [[-9.69354, 124.29676, 'ID'], [-8.88108, 125.76398, 'TL']] },
  { id: 564, pins: [[4.08436, 117.85811, 'ID'], [4.20940, 117.73188, 'MY']] },
  { id: 1592, pins: [[18.07673, -63.05870, 'MF'], [18.03950, -63.06954, 'SX']] },
] as const;
for (const { id, pins } of sharing) {
  for (const [lat, lon, owner] of pins) {
    const result = lookup(lat, lon);
    assert.deepEqual(result.island.countryCodes, [owner]);
    assert.equal(result.physicalIslandId, `gshhg:${id}`);
    assert.equal(result.territorialTopology.landform, 'island');
    assert.deepEqual(result.territorialTopology.sharedIslandCountryCodes, pins.map(pin => pin[2]));
    assert.equal(result.territorialTopology.physicalSource.source, 'gshhg-full');
  }
}

const territories = [
  [45.968, 8.972, 'IT', 'enclave', 'mainland'],      // Campione d'Italia
  [42.465, 1.980, 'ES', 'enclave', 'mainland'],      // Llívia
  [47.7, 8.68333, 'DE', 'enclave', 'mainland'],      // Büsingen
  [-29.31, 27.49, 'LS', 'enclaved-state', 'mainland'],
  [-12.065, 34.731, 'MW', 'enclave', 'island'],     // Likoma in Lake Malawi
  [-12.019722222, 34.623611111, 'MW', 'enclave', 'island'], // Chizumulu in Lake Malawi
  [4.56, 115.13, 'BN', 'coastal-exclave', 'island'],       // Temburong on Borneo
  [-9.24, 124.36, 'TL', 'coastal-exclave', 'island'],      // Oecusse on Timor
] as const;
for (const [lat, lon, code, kind, landform] of territories) {
  const result = lookup(lat, lon);
  assert.equal(result.territorialTopology?.landform, landform);
  assert.equal(result.territorialTopology?.administration?.code, code);
  assert.equal(result.territorialTopology?.administration?.kind, kind);
  if (landform === 'mainland') {
    assert.equal(result.island, null);
    assert.equal(result.physicalIslandId, undefined);
  } else {
    assert.deepEqual(result.island.countryCodes, [code]);
  }
}
// These physically distinct islands overlap parts of a more generalized
// coastal exclave polygon. They must not inherit that mainland-only feature.
const offshore = [
  [60.610903, -164.80564600617583, 'gshhg:194'],
  [56.645875, -132.398389, 'gshhg:1751'],
  [55.1982915, 21.255011230468753, 'gshhg:70052'],
] as const;
for (const [lat, lon, id] of offshore) {
  const result = lookup(lat, lon);
  assert.equal(result.physicalIslandId, id);
  assert.equal(result.territorialTopology?.landform, 'island');
  assert.equal(result.territorialTopology?.administration, undefined);
}
// Administrative disjunction alone previously certified all five as shoreline
// islands. The independent GSHHG continental outline intersects each feature.
const conflictingShorelines = [
  [36.376087, -121.90695459408391],     // FieldMaps component 331955, US
  [42.57064305, -9.046625339587528],    // 144920, ES
  [44.6566645, -1.0360120694519146],    // 163116, FR
  [64.77253725, 11.636445418809949],    // 240901, NO
  [45.2803895, 12.165092762919219],     // 205011, IT
] as const;
for (const [lat, lon] of conflictingShorelines) {
  const result = lookup(lat, lon);
  assert.equal(result.physicalIslandId, undefined);
  assert.equal(result.island, null);
}
assert.equal(lookup(45.78, -81.97).territorialTopology, null); // Lake Manitou water
const count = controls.length + sharing.reduce((n, group) => n + group.pins.length, 0) + territories.length + offshore.length + conflictingShorelines.length + 1;
console.log(`Matched all ${count} complete-pack controls.`);
