import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');

test('open source translation provider is loaded only when address translation runs', () => {
  assert.match(appSource, /await import\('\.\/lib\/openSourceTranslation'\)/);
  assert.doesNotMatch(
    appSource,
    /import \{[\s\S]*translateWithOpenSource[\s\S]*\} from '\.\/lib\/openSourceTranslation';/,
  );
});
