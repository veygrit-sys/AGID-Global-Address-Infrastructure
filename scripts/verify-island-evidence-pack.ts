import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// An explicit local pack is required because the full-resolution edition is over 1 GB.
const [pack, python = 'python3'] = process.argv.slice(2);
if (!pack) throw new Error('Usage: node --import tsx scripts/verify-island-evidence-pack.ts PACK [PYTHON]');
const cli = fileURLToPath(new URL('./query-island-pack.ts', import.meta.url));
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
  [25.7445, 123.4745, 'JP'], [-51.794, -58.61, 'disputed'], [0, -140, null], [48.85, 2.35, null],
] as const;
for (const [lat, lon, expected, id] of controls) {
  const result = JSON.parse(execFileSync(process.execPath,
    ['--import', 'tsx', cli, pack, String(lat), String(lon), '--python', python], { encoding: 'utf8' }));
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
  if (expected === 'GL') assert.deepEqual(result.island.sovereignCodes, ['DK']);
  if (expected === 'CL') {
    assert.equal(result.island.source, 'natural-earth-global-island-map-units');
    assert.equal(result.physicalIslandId, undefined);
  }
  if (id === 'gshhg:8361' || (id === 'gshhg:18608' && expected === 'CA')) assert.equal(result.island.source, 'statcan-cbf-pr');
  if (id === 'gshhg:87717' || (id === 'gshhg:92768' && expected === 'JP')) assert.equal(result.island.source, 'mlit-n03-national');
  if (expected === 'JP' && !id) assert.equal(result.island.status, 'japan-position');
}
console.log(`Matched all ${controls.length} complete-pack controls.`);
