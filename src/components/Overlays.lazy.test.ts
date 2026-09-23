import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, '..', 'App.tsx'), 'utf8');
const overlaysSource = readFileSync(join(here, 'Overlays.tsx'), 'utf8');
const legalOverlaysSource = readFileSync(join(here, 'modals', 'LegalOverlays.tsx'), 'utf8');

test('feedback dialogs are loaded only when they are visible', () => {
  assert.match(appSource, /const CustomAlert = React\.lazy\(\(\) => import\('\.\/components\/modals\/FeedbackOverlays'\)/);
  assert.match(appSource, /const ConfirmModal = React\.lazy\(\(\) => import\('\.\/components\/modals\/FeedbackOverlays'\)/);
  assert.match(appSource, /alertConfig\?\.show && \(\s*<React\.Suspense fallback=\{null\}>/s);
  assert.match(appSource, /confirmConfig\?\.show && \(\s*<React\.Suspense fallback=\{null\}>/s);
  assert.doesNotMatch(appSource, /import \{ CenterActionButton,ConfirmModal,CustomAlert \} from '\.\/components\/Overlays'/);
});

test('primary overlay module keeps only the always-available center action', () => {
  assert.match(overlaysSource, /export function CenterActionButton/);
  assert.doesNotMatch(overlaysSource, /export function CustomAlert/);
  assert.doesNotMatch(overlaysSource, /export function ConfirmModal/);
});

test('legal copy data stays inside the lazy legal overlay chunk', () => {
  assert.doesNotMatch(appSource, /import legalData from '\.\/data\/legal\.json'/);
  assert.doesNotMatch(appSource, /legalData=\{legalData\}/);
  assert.match(legalOverlaysSource, /import legalData from '\.\.\/\.\.\/data\/legal\.json'/);
});
