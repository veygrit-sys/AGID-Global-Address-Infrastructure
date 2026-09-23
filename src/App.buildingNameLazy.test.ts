import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');
const geocodingServiceSource = readFileSync(join(here, 'services', 'GeocodingService.ts'), 'utf8');

function runtimeImportLines(source: string, modulePath: string) {
  return source
    .split(/\r?\n/)
    .filter(line => line.includes(`from '${modulePath}'`) && !line.trimStart().startsWith('import type'));
}

test('App loads rendered building-name enrichment only during address resolution', () => {
  assert.match(appSource, /import type \{ BuildingNameCandidate \} from '\.\/lib\/buildingName'/);
  assert.match(appSource, /await import\('\.\/lib\/buildingName'\)/);
  assert.deepEqual(runtimeImportLines(appSource, './lib/buildingName'), []);
});

test('GeocodingService keeps building-name helpers out of static imports', () => {
  assert.match(geocodingServiceSource, /import type \{ BuildingNameCandidate \} from '\.\.\/lib\/buildingName'/);
  assert.match(geocodingServiceSource, /import\('\.\.\/lib\/buildingName'\)/);
  assert.match(geocodingServiceSource, /import\('\.\.\/lib\/overtureMaps'\)/);
  assert.deepEqual(runtimeImportLines(geocodingServiceSource, '../lib/buildingName'), []);
  assert.deepEqual(runtimeImportLines(geocodingServiceSource, '../lib/overtureMaps'), []);
});
