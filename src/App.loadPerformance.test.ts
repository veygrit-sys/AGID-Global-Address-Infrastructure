import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');
const rootSource = readFileSync(join(here, 'RootApp.tsx'), 'utf8');
const indexSource = readFileSync(join(here, '..', 'index.html'), 'utf8');

test('map chrome is split from the initial App module', () => {
  assert.match(appSource, /const SearchSidebar = React\.lazy\(\(\) => import\('\.\/components\/SearchSidebar'\)/);
  assert.match(appSource, /const MapControls = React\.lazy\(\(\) => import\('\.\/components\/MapControls'\)/);
  assert.doesNotMatch(appSource, /^import \{ SearchSidebar \}/m);
  assert.doesNotMatch(appSource, /^import \{ MapControls \}/m);
});

test('the initial route shell gives the browser an eager, stable LCP image', () => {
  assert.match(indexSource, /rel="preload" as="image" href="\/agid-logo\.png" fetchpriority="high"/);
  assert.match(rootSource, /width="476"/);
  assert.match(rootSource, /height="305"/);
  assert.match(rootSource, /fetchPriority="high"/);
});
