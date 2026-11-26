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
  } else assert.deepEqual(result.island.countryCodes, [expected]);
  if (id) assert.equal(result.physicalIslandId, id);
  if (expected === 'GL') assert.deepEqual(result.island.sovereignCodes, ['DK']);
  if (expected === 'JP') assert.equal(result.island.status, 'japan-position');
}
console.log(`Matched all ${controls.length} complete-pack controls.`);
