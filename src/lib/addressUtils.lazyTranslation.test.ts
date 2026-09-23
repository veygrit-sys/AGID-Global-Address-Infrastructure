import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'addressUtils.ts'), 'utf8');

test('addressUtils loads open-source translation only inside translation execution', () => {
  assert.match(source, /await import\('\.\/openSourceTranslation'\)/);
  assert.doesNotMatch(
    source,
    /import \{[\s\S]*translateWithOpenSource[\s\S]*\} from '\.\/openSourceTranslation';/,
  );
});
