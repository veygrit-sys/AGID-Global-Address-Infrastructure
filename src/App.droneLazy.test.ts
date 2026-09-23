import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');

function runtimeImportLines(source: string, modulePath: string) {
  const withoutTypeImports = source.replace(/import type \{[\s\S]*?\} from ['"][^'"]+['"];?/g, '');
  return withoutTypeImports
    .split(/\r?\n/)
    .filter(line => line.includes(`from '${modulePath}'`) && !line.trimStart().startsWith('import type'));
}

test('drone services are loaded only when drone operations are used', () => {
  assert.match(appSource, /import type \{[\s\S]*DroneNavigationPoint[\s\S]*\} from '\.\/services\/DroneNavigationService'/);
  assert.match(appSource, /import\('\.\/services\/DroneService'\)/);
  assert.match(appSource, /import\('\.\/services\/DroneNavigationService'\)/);
  assert.match(appSource, /import\('\.\/services\/DroneCorridorService'\)/);
  assert.deepEqual(runtimeImportLines(appSource, './services/DroneService'), []);
  assert.deepEqual(runtimeImportLines(appSource, './services/DroneNavigationService'), []);
  assert.deepEqual(runtimeImportLines(appSource, './services/DroneCorridorService'), []);
  assert.doesNotMatch(appSource, /shouldUseDroneNavigation/);
});
