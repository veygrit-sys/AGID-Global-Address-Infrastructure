import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'App.tsx'), 'utf8');
const geocodingServiceSource = readFileSync(join(here, 'services', 'GeocodingService.ts'), 'utf8');

test('map feature address enrichment is loaded only during address resolution', () => {
  assert.match(source, /import type \{ MapAddressFeatureCandidate \} from '\.\/lib\/mapFeatureAddress'/);
  assert.match(source, /await import\('\.\/lib\/mapFeatureAddress'\)/);
  const runtimeImports = source
    .split(/\r?\n/)
    .filter(line => line.includes("from './lib/mapFeatureAddress'") && !line.trimStart().startsWith('import type'));
  assert.deepEqual(runtimeImports, []);
});

test('geocoding service keeps map feature address helpers out of its static imports', () => {
  assert.match(geocodingServiceSource, /import type \{[\s\S]*MapAddressFeatureCandidate[\s\S]*\} from '\.\.\/lib\/mapFeatureAddress'/);
  assert.match(geocodingServiceSource, /import\('\.\.\/lib\/mapFeatureAddress'\)/);
  const withoutTypeImports = geocodingServiceSource.replace(/import type \{[\s\S]*?\} from '\.\.\/lib\/mapFeatureAddress';/, '');
  const runtimeImports = withoutTypeImports
    .split(/\r?\n/)
    .filter(line => line.includes("from '../lib/mapFeatureAddress'") && !line.trimStart().startsWith('import type'));
  assert.deepEqual(runtimeImports, []);
});
