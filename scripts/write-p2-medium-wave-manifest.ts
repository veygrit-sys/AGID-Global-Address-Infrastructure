import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { P2MediumGeoRepositoryPlan } from '../src/lib/p2MediumGeoRepositoryPlan';
import { buildP2MediumWaveManifest, P2_MEDIUM_WAVE_MANIFEST_VERSION } from '../src/lib/p2MediumWaveManifest';
import { buildP2MediumWavePackageSeed } from '../src/lib/p2MediumWavePackageSeed';

function argValue(name: string, fallback: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find(arg => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const wave = Number.parseInt(argValue('--wave', '1'), 10);
const output = argValue('--output', `data/open_geo_repositories/p2-medium-wave-${wave}-manifest.json`);
const write = process.argv.includes('--write');

if (!Number.isInteger(wave) || wave < 1) {
  throw new Error(`Invalid --wave value: ${wave}`);
}

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p2-medium-200-plan.json', 'utf8'),
) as P2MediumGeoRepositoryPlan;

const seed = buildP2MediumWavePackageSeed(plan, wave);
const manifest = buildP2MediumWaveManifest(seed, existsSync);

if (write) {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({
  version: P2_MEDIUM_WAVE_MANIFEST_VERSION,
  mode: write ? 'write' : 'dry-run',
  wave,
  output,
  packageCount: manifest.packageCount,
  coreCompleteCount: manifest.coreCompleteCount,
  fixtureCompleteCount: manifest.fixtureCompleteCount,
  sourceReviewReadyCount: manifest.sourceReviewReadyCount,
  nextCommand: write ? undefined : `npx tsx scripts/write-p2-medium-wave-manifest.ts --wave=${wave} --write`,
}, null, 2));
