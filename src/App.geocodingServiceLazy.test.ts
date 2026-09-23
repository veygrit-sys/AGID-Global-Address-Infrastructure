import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const appSource = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf8');

test('geocoding service loads only when search or reverse geocoding runs', () => {
  assert.match(appSource, /const loadGeocodingService = \(\) => import\('\.\/services\/GeocodingService'\);/);
  assert.doesNotMatch(
    appSource,
    /import \{[\s\S]*(smartSearch|regionalReverseGeocode|fetchNearbyOSMPlaces|fetchNearestRoad)[\s\S]*\} from '\.\/services\/GeocodingService';/,
  );
});
