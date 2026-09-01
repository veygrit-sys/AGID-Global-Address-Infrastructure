import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const sourceRoot = resolve(process.argv[2] ?? '.m2-sources-mx');
for (const name of [
  'converted100', 'fallback-original100', 'invalid-original100b', 'invalid-makevalid-polygons',
  'invalid-geos-selected', 'parser-invalid-original', 'parser-geos-selected',
]) rmSync(resolve(sourceRoot, name), { recursive: true, force: true });
const scripts = [
  'convert-postal-context-mx-official-shapes.mjs',
  'extract-postal-context-mx-collapsed-fallbacks.mjs',
  'build-postal-context-mx-m2.mjs',
  'extract-postal-context-mx-invalid-originals.mjs',
  'make-valid-postal-context-mx-invalids.mjs',
  'geos-repair-postal-context-mx-selected.mjs',
  'extract-postal-context-mx-strict-parser-fallbacks.mjs',
  'repair-postal-context-mx-m2.mjs',
];
for (const script of scripts) {
  const result = spawnSync(process.execPath, [resolve('scripts', script), sourceRoot], { encoding: 'utf8', stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${script} failed with ${result.status}`);
}
