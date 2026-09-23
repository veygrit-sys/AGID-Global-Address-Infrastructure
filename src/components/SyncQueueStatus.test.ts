import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'SyncQueueStatus.tsx'), 'utf8');
const appSource = readFileSync(join(here, '..', 'App.tsx'), 'utf8');

test('SyncQueueStatus exposes pending sync without raw address fields', () => {
  assert.match(source, /records: SyncQueueRecord\[\]/);
  assert.match(source, /no raw address/);
  assert.match(source, /生住所なし/);
  assert.match(source, /entityId/);
  assert.doesNotMatch(source, /\.address/);
  assert.doesNotMatch(source, /recipient|phone|room/);
});

test('SyncQueueStatus keeps QR scan and saved QR actions one tap away', () => {
  assert.match(source, /onScanQr/);
  assert.match(source, /onOpenQrLibrary/);
  assert.match(source, /QrCode/);
});

test('SyncQueueStatus is loaded only when a queue exists', () => {
  assert.match(appSource, /const SyncQueueStatus = React\.lazy/);
  assert.match(appSource, /syncQueue\.length > 0/);
});
