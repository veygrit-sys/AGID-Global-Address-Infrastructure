import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'SavedLocations.tsx'), 'utf8');

test('saved QR list can render generated QR codes from registered-address payloads', () => {
  assert.match(source, /QRCodeCanvas/);
  assert.match(source, /q\.payload && !q\.imageData/);
  assert.match(source, /value=\{q\.payload\}/);
});

test('empty AOID state opens registration in forced AOID mode', () => {
  assert.match(source, /setAoidModeForced: \(forced: boolean\) => void/);
  assert.match(source, /const startAoidRegistration/);
  assert.match(source, /setAoidModeForced\(true\);\s*setShowAddressRegistration\(true\);/);
  assert.match(source, /Register First AOID/);
});

test('saved identifier panel can save the current AGID and start another AOID registration', () => {
  assert.match(source, /saveCurrentAgid: \(\) => void/);
  assert.match(source, /onClick=\{saveCurrentAgid\}/);
  assert.match(source, /Save Current AGID/);
  assert.match(source, /title: 'Saved AGIDs'/);
  assert.match(source, /title: 'Saved AOIDs'/);
});

test('saved AOID cards render a structured location-only preview', () => {
  assert.match(source, /formatRegisteredAddressLocationDisplay/);
  assert.match(source, /const locationDisplay = formatRegisteredAddressLocationDisplay\(aoid\)/);
  assert.match(source, /\{locationDisplay \|\| aoid\.address\}/);
});
