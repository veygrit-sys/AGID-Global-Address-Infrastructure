import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const statusBarSource = readFileSync('src/components/PwaStatusBar.tsx', 'utf8');
const rootAppSource = readFileSync('src/RootApp.tsx', 'utf8');
const hookSource = readFileSync('src/hooks/usePwaLifecycle.ts', 'utf8');

test('PWA status bar is mounted at the app shell root', () => {
  assert.match(rootAppSource, /import\s+\{\s*PwaStatusBar\s*\}/);
  assert.match(rootAppSource, /<PwaStatusBar\s*\/>/);
});

test('PWA status bar only appears for actionable lifecycle states', () => {
  assert.match(statusBarSource, /usePwaLifecycle\(language\)/);
  assert.match(statusBarSource, /if \(!visible\) return null/);
  assert.match(statusBarSource, /snapshot\.updateAvailable/);
  assert.match(statusBarSource, /snapshot\.installState === 'ready'/);
  assert.match(statusBarSource, /aria-live=\{snapshot\.updateAvailable \? 'assertive' : 'polite'\}/);
});

test('PWA lifecycle hook manages install prompt and service worker update explicitly', () => {
  assert.match(hookSource, /from 'virtual:pwa-register'/);
  assert.match(hookSource, /beforeinstallprompt/);
  assert.match(hookSource, /event\.preventDefault\(\)/);
  assert.match(hookSource, /onNeedRefresh/);
  assert.match(hookSource, /updateServiceWorker\(true\)/);
});
