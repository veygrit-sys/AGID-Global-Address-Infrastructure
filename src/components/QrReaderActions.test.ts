import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, '..', 'App.tsx'), 'utf8');
const searchSidebarSource = readFileSync(join(here, 'SearchSidebar.tsx'), 'utf8');
const savedLocationsSource = readFileSync(join(here, 'SavedLocations.tsx'), 'utf8');
const qrReaderActionScreenSource = readFileSync(join(here, 'modals', 'QrReaderActionScreen.tsx'), 'utf8');

test('search and saved QR surfaces use one QR entry action instead of separate camera and upload icons', () => {
  assert.match(searchSidebarSource, /openQrReader: \(\) => void/);
  assert.match(savedLocationsSource, /openQrReader: \(\) => void/);
  assert.doesNotMatch(searchSidebarSource, /Camera,/);
  assert.doesNotMatch(searchSidebarSource, /<Camera/);
  assert.doesNotMatch(savedLocationsSource, /Camera,/);
  assert.doesNotMatch(savedLocationsSource, /<Camera/);
  assert.match(searchSidebarSource, /title="Open QR Reader"/);
  assert.match(savedLocationsSource, /title="Open QR Reader"/);
});

test('QR reader screen routes to camera scan or QR image import through the existing handlers', () => {
  assert.match(qrReaderActionScreenSource, /onStartCamera: \(\) => void/);
  assert.match(qrReaderActionScreenSource, /onPickImage: \(\) => void/);
  assert.match(qrReaderActionScreenSource, /Camera Scan/);
  assert.match(qrReaderActionScreenSource, /Import QR Image/);
  assert.match(qrReaderActionScreenSource, /max-w-sm/);
  assert.match(qrReaderActionScreenSource, /px-4 py-3/);
  assert.match(qrReaderActionScreenSource, /gap-2 px-4 py-4/);
  assert.match(qrReaderActionScreenSource, /h-9 w-9/);
  assert.match(appSource, /<QrReaderActionScreen/);
  assert.match(appSource, /startQrScanner\(\)/);
  assert.match(appSource, /qrFileRef\.current\?\.click\(\)/);
});

test('QR image file input is centralized in App so multiple QR buttons do not fight over one ref', () => {
  assert.doesNotMatch(searchSidebarSource, /ref=\{qrFileRef\}/);
  assert.doesNotMatch(savedLocationsSource, /ref=\{qrFileRef\}/);
  assert.match(appSource, /ref=\{qrFileRef\}/);
  assert.match(appSource, /onChange=\{handleQrFileUpload\}/);
});
