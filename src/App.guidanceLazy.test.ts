import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');

test('external map guidance engine is loaded only when navigation is opened', () => {
  assert.match(appSource, /import type \{ MapProvider \} from '\.\/lib\/guidanceEngine'/);
  assert.match(appSource, /await import\('\.\/lib\/guidanceEngine'\)/);
  assert.doesNotMatch(appSource, /import \{ GuidanceEngine,?\s*MapProvider \} from '\.\/lib\/guidanceEngine'/);
});
