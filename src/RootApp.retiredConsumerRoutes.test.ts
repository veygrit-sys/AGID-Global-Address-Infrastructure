import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/RootApp.tsx', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');

test('retired AGID consumer routes migrate to AOID without mounting old screens', () => {
  assert.match(source, /function isRetiredConsumerRoute/);
  assert.match(source, /pathname === '\/portal'/);
  assert.match(source, /pathname === '\/playlist-commerce'/);
  assert.match(source, /hash\.startsWith\('#\/portal'\)/);
  assert.match(source, /hash\.startsWith\('#\/playlist-commerce'\)/);
  assert.match(source, /'\/\?action=aoid'/);
  assert.match(source, /agid:open-aoid/);
  assert.doesNotMatch(source, /import\('\.\/components\/AddressPortalScreen'\)/);
  assert.doesNotMatch(source, /import\('\.\/components\/PlaylistCommerceWidgetScreen'\)/);
});

test('AGID shell accepts AOID URL actions and direct open events', () => {
  assert.match(appSource, /action !== 'aoid'/);
  assert.match(appSource, /action === 'aoid'/);
  assert.match(appSource, /addEventListener\('agid:open-aoid'/);
  assert.match(appSource, /setSavedTab\('aoid'\)/);
  assert.match(appSource, /setShowSaved\(true\)/);
});
