import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');

test('route and Photon search helpers are loaded only during routing or route search', () => {
  assert.match(appSource, /await import\('\.\/services\/RouteSearchService'\)/);
  assert.match(appSource, /fetchOsrmRoute/);
  assert.match(appSource, /fetchPhotonFeatures/);
  assert.match(appSource, /photonFeatureToNamedCoordinates/);
  assert.doesNotMatch(appSource, /from '\.\/services\/RouteSearchService'/);
});
