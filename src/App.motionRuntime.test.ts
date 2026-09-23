import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

test('map shell does not import motion runtime on the initial App path', () => {
  const appSource = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf8');
  const overlaysSource = readFileSync(join(process.cwd(), 'src', 'components', 'Overlays.tsx'), 'utf8');

  assert.doesNotMatch(appSource, /from 'motion\/react'/);
  assert.doesNotMatch(appSource, /<AnimatePresence|<motion\./);
  assert.doesNotMatch(overlaysSource, /from 'motion\/react'/);
  assert.doesNotMatch(overlaysSource, /<AnimatePresence|<motion\./);
});
