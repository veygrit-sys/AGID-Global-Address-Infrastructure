import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'MapLayersMenu.tsx'), 'utf8');
const appSource = readFileSync(join(here, '..', 'App.tsx'), 'utf8');

test('does not expose AGID grid size or resolution text in layer controls', () => {
  assert.doesNotMatch(source, /RESOLUTION/i);
  assert.doesNotMatch(source, /4\.4m/);
});

test('loads the layer menu only when the sheet is open', () => {
  assert.match(appSource, /const MapLayersMenu = React\.lazy/);
  assert.match(appSource, /showStyleMenu && \(\s*<React\.Suspense fallback=\{null\}>/s);
  assert.doesNotMatch(appSource, /import \{ MapLayersMenu \} from '\.\/components\/MapLayersMenu'/);
});
