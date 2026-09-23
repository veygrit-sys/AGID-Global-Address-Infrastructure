import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const viteConfigSource = readFileSync('vite.config.ts', 'utf8');

test('Vite config restores VitePWA for production PWA builds', () => {
  assert.match(viteConfigSource, /import\s+\{\s*VitePWA\s*\}\s+from\s+'vite-plugin-pwa'/);
  assert.match(viteConfigSource, /VitePWA\(\{/);
  assert.match(viteConfigSource, /registerType:\s*'prompt'/);
  assert.match(viteConfigSource, /injectRegister:\s*null/);
  assert.doesNotMatch(viteConfigSource, /VitePWA disabled/);
});

test('PWA config defines installable manifest and service worker cache rules', () => {
  assert.match(viteConfigSource, /manifest:\s*\{/);
  assert.match(viteConfigSource, /id:\s*'\/'/);
  assert.match(viteConfigSource, /name:\s*'AGID/);
  assert.match(viteConfigSource, /short_name:\s*'AGID'/);
  assert.match(viteConfigSource, /display:\s*'standalone'/);
  assert.match(viteConfigSource, /display_override:\s*\[/);
  assert.match(viteConfigSource, /categories:\s*\[/);
  assert.match(viteConfigSource, /shortcuts:\s*\[/);
  assert.match(viteConfigSource, /start_url:\s*'\/'/);
  assert.match(viteConfigSource, /scope:\s*'\/'/);
  assert.match(viteConfigSource, /icons:\s*\[/);
  assert.match(viteConfigSource, /purpose:\s*'any maskable'/);
  assert.match(viteConfigSource, /includeAssets:\s*\[[^\]]*agid-logo\.png[^\]]*\]/s);
  assert.match(viteConfigSource, /workbox:\s*\{/);
  assert.match(viteConfigSource, /cleanupOutdatedCaches:\s*true/);
  assert.match(viteConfigSource, /clientsClaim:\s*true/);
  assert.match(viteConfigSource, /globIgnores:\s*\[[^\]]*assets\/\[A-Z\]\[A-Z\]\*-\*\.js[^\]]*\]/s);
  assert.match(viteConfigSource, /navigateFallback:\s*'\/index.html'/);
  assert.match(viteConfigSource, /navigateFallbackDenylist:/);
  assert.match(viteConfigSource, /maximumFileSizeToCacheInBytes:/);
  assert.match(viteConfigSource, /runtimeCaching:\s*\[/);
  assert.match(viteConfigSource, /handler:\s*'NetworkOnly'/);
});
