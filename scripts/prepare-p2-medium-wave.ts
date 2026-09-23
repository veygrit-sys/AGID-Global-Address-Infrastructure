import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { P2MediumGeoRepositoryPlan } from '../src/lib/p2MediumGeoRepositoryPlan';
import { buildP2MediumWavePackageSeed } from '../src/lib/p2MediumWavePackageSeed';
import {
  buildP2MediumWaveRepositoryFiles,
  filterP2MediumWaveRepositoryFiles,
  P2_MEDIUM_WAVE_REPOSITORY_FILES_VERSION,
  type P2MediumRepositoryFileScope,
} from '../src/lib/p2MediumWaveRepositoryFiles';

function argValue(name: string, fallback: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find(arg => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const wave = Number.parseInt(argValue('--wave', '1'), 10);
const scope = argValue('--scope', 'all') as P2MediumRepositoryFileScope;
const write = process.argv.includes('--write');

if (!Number.isInteger(wave) || wave < 1) {
  throw new Error(`Invalid --wave value: ${wave}`);
}
if (scope !== 'all' && scope !== 'core') {
  throw new Error(`Invalid --scope value: ${scope}`);
}

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p2-medium-200-plan.json', 'utf8'),
) as P2MediumGeoRepositoryPlan;

const seed = buildP2MediumWavePackageSeed(plan, wave);
const allFiles = buildP2MediumWaveRepositoryFiles(seed);
const files = filterP2MediumWaveRepositoryFiles(allFiles, scope);

if (write) {
  for (const file of files) {
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, 'utf8');
  }
}

console.log(JSON.stringify({
  version: P2_MEDIUM_WAVE_REPOSITORY_FILES_VERSION,
  mode: write ? 'write' : 'dry-run',
  wave,
  scope,
  packageCount: seed.packageCount,
  fileCount: files.length,
  allFileCount: allFiles.length,
  firstRepositories: seed.packages.slice(0, 5).map(pkg => pkg.repository),
  nextCommand: write ? undefined : `npx tsx scripts/prepare-p2-medium-wave.ts --wave=${wave} --scope=${scope} --write`,
}, null, 2));
