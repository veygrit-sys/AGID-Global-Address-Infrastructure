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

test('RoutingService is loaded only when bidirectional routing is requested', () => {
  assert.match(appSource, /import type \{ travelMode \} from '\.\/services\/RoutingService';/);
  assert.match(appSource, /await import\('\.\/services\/RoutingService'\)/);
  assert.deepEqual(runtimeImportLines(appSource, './services/RoutingService'), []);
});
