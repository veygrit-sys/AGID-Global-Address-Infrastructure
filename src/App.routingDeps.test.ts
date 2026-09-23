import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');

test('App uses local navigation math instead of bundling the full Turf package', () => {
  assert.doesNotMatch(appSource, /from ['"]@turf\/turf['"]/);
  assert.match(appSource, /calculateDistance\(startPoint\.lat, startPoint\.lng/);
  assert.match(appSource, /calculateBearing\(startPoint\.lat, startPoint\.lng/);
});

test('direct fallback route reuses one distance calculation for distance and duration', () => {
  assert.match(
    appSource,
    /const directRouteDistanceKm = calculateDistance\(startPoint\.lat, startPoint\.lng, endPoint\.lat, endPoint\.lng\);/
  );
  assert.match(appSource, /distance: directRouteDistanceKm,/);
  assert.match(appSource, /duration: directRouteDistanceKm \* 12,/);
});

test('route updates use one shared JSON equality helper', () => {
  assert.match(appSource, /function keepPreviousIfJsonEqual<T>\(previous: T, next: T\): T/);
  assert.match(appSource, /setRouteData\(prev => keepPreviousIfJsonEqual\(prev, next\)\)/);
  assert.match(appSource, /setRouteData\(prev => keepPreviousIfJsonEqual\(prev, fallback\)\)/);
  assert.doesNotMatch(
    appSource,
    /setRouteData\(prev => JSON\.stringify\(prev\) === JSON\.stringify\((next|fallback)\)/
  );
});
