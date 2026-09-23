import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');

test('privacyPolicy runtime helpers are loaded only for explicit private data clearing', () => {
  assert.match(
    appSource,
    /import type \{ RegisteredAddressQrPrivacy \} from '\.\/lib\/privacyPolicy';/,
  );
  assert.match(appSource, /await import\('\.\/lib\/privacyPolicy'\)/);
  assert.doesNotMatch(
    appSource,
    /import \{[\s\S]*clearPrivateLocalStorage[\s\S]*\} from '\.\/lib\/privacyPolicy';/,
  );
});
