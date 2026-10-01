import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const rootSource = readFileSync('src/RootApp.tsx', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const screenSource = readFileSync('src/components/LicensesScreen.tsx', 'utf8');
const overlaySource = readFileSync('src/components/modals/LegalOverlays.tsx', 'utf8');

test('licenses and sources use a standalone route instead of a modal', () => {
  assert.match(rootSource, /window\.location\.pathname === '\/licenses'/);
  assert.match(rootSource, /route\.licenses[\s\S]*<LicensesScreen \/>/);
  assert.match(screenSource, /<main className="min-h-screen bg-white/);
  assert.match(screenSource, /DATA_SOURCES\.map/);
  assert.doesNotMatch(appSource, /showLicenses|LicensesOverlay/);
  assert.doesNotMatch(overlaySource, /function LicensesOverlay/);
});

test('standalone licenses page offers map back navigation and canonical source links', () => {
  assert.match(screenSource, /window\.history\.back\(\)/);
  assert.match(screenSource, /window\.location\.href = '\/'/);
  assert.match(screenSource, /DATA_LICENSES\.md/);
  assert.match(screenSource, /openstreetmap\.org\/copyright/);
});
