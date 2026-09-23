import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');

test('GeoAdminService is loaded only for admin, postal lab, or quality report actions', () => {
  assert.match(appSource, /import\('\.\/services\/GeoAdminService'\)/);
  assert.match(appSource, /fetchCountryStats/);
  assert.match(appSource, /fetchCountryBoundary/);
  assert.match(appSource, /fetchDataQualityReport/);
  assert.doesNotMatch(appSource, /from '\.\/services\/GeoAdminService'/);
});
