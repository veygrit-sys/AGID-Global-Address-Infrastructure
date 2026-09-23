import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { P1HighGeoRepositoryPlan } from '../src/lib/p1HighGeoRepositoryPlan';
import { buildP1HighWaveRecoverySeed } from '../src/lib/p1HighWaveRecoverySeed';
import {
  buildP1HighWaveRepositoryFiles,
  filterP1HighWaveRepositoryFiles,
  P1_HIGH_WAVE_REPOSITORY_FILES_VERSION,
  type P1HighRepositoryFileScope,
} from '../src/lib/p1HighWaveRepositoryFiles';

function argValue(name: string, fallback: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find(arg => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const wave = Number.parseInt(argValue('--wave', '1'), 10);
const scope = argValue('--scope', 'all') as P1HighRepositoryFileScope;
const write = process.argv.includes('--write');

if (!Number.isInteger(wave) || wave < 1) {
  throw new Error(`Invalid --wave value: ${wave}`);
}
if (scope !== 'all' && scope !== 'core' && scope !== 'fixtures') {
  throw new Error(`Invalid --scope value: ${scope}`);
}

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p1-high-33-plan.json', 'utf8'),
) as P1HighGeoRepositoryPlan;

const seed = buildP1HighWaveRecoverySeed(plan, wave);
const allFiles = buildP1HighWaveRepositoryFiles(seed);
const files = filterP1HighWaveRepositoryFiles(allFiles, scope);

if (write) {
  for (const file of files) {
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, 'utf8');
  }
}

console.log(JSON.stringify({
  version: P1_HIGH_WAVE_REPOSITORY_FILES_VERSION,
  mode: write ? 'write' : 'dry-run',
  wave,
  scope,
  packageCount: seed.packageCount,
  fileCount: files.length,
  allFileCount: allFiles.length,
  firstRepositories: seed.packages.slice(0, 5).map(pkg => pkg.repository),
  nextCommand: write ? undefined : `npx tsx scripts/prepare-p1-high-wave.ts --wave=${wave} --scope=${scope} --write`,
}, null, 2));
