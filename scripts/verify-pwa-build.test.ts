import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { verifyPwaBuild } from './verify-pwa-build';

async function createDist(files: Record<string, string>) {
  const dir = await mkdtemp(path.join(tmpdir(), 'agid-pwa-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(dir, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
  }
  return dir;
}

const validManifest = JSON.stringify({
  name: 'AGID - Absolute Grid Identity',
  short_name: 'AGID',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  theme_color: '#0f172a',
  background_color: '#0f172a',
  icons: [
    { src: '/agid-logo.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/agid-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
  shortcuts: [
    { name: 'POS', url: '/pos' },
    { name: 'Field Handoff', url: '/field' },
  ],
});

test('verifyPwaBuild accepts a generated manifest and service worker', async () => {
  const dist = await createDist({
    'manifest.webmanifest': validManifest,
    'sw.js': 'self.__WB_MANIFEST = []; precacheAndRoute(self.__WB_MANIFEST);',
    'registerSW.js': 'navigator.serviceWorker.register("/sw.js");',
  });

  try {
    const result = await verifyPwaBuild(dist);
    assert.equal(result.manifest.name, 'AGID - Absolute Grid Identity');
    assert.equal(result.hasServiceWorker, true);
    assert.equal(result.hasRegistrationScript, true);
    assert.equal(result.precacheBudget.entries, 0);
    assert.equal(result.precacheBudget.localBytes, 0);
    assert.equal(result.chunkBudget.jsChunks, 0);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test('verifyPwaBuild tracks Workbox precache entry count and local bytes', async () => {
  const dist = await createDist({
    'manifest.webmanifest': validManifest,
    'sw.js': 'precacheAndRoute([{url:"index.html",revision:"a"},{url:"assets/main.js",revision:null}]);',
    'registerSW.js': 'navigator.serviceWorker.register("/sw.js");',
    'index.html': '<html></html>',
    'assets/main.js': 'x'.repeat(128),
  });

  try {
    const result = await verifyPwaBuild(dist);
    assert.equal(result.precacheBudget.entries, 2);
    assert.ok(result.precacheBudget.localBytes >= 128);
    assert.equal(result.precacheBudget.maxEntries, 450);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test('verifyPwaBuild rejects country and region pack chunks in precache', async () => {
  const dist = await createDist({
    'manifest.webmanifest': validManifest,
    'sw.js': 'precacheAndRoute([{url:"assets/JP_TK-demo.js",revision:"a"}]);',
    'registerSW.js': 'navigator.serviceWorker.register("/sw.js");',
    'assets/JP_TK-demo.js': 'export default {};',
  });

  try {
    await assert.rejects(() => verifyPwaBuild(dist), /country\/region pack chunks/i);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test('verifyPwaBuild allows app shell chunks in precache', async () => {
  const dist = await createDist({
    'manifest.webmanifest': validManifest,
    'sw.js': 'precacheAndRoute([{url:"assets/App-demo.js",revision:"a"}]);',
    'registerSW.js': 'navigator.serviceWorker.register("/sw.js");',
    'assets/App-demo.js': 'export default {};',
  });

  try {
    const result = await verifyPwaBuild(dist);
    assert.equal(result.precacheBudget.entries, 1);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});


test('verifyPwaBuild rejects missing service worker and non-installable manifest', async () => {
  const dist = await createDist({
    'manifest.webmanifest': JSON.stringify({ name: 'AGID' }),
  });

  try {
    await assert.rejects(() => verifyPwaBuild(dist), /service worker|short_name|start_url|display|icons/i);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test('verifyPwaBuild rejects unknown JS chunks above the default budget', async () => {
  const dist = await createDist({
    'manifest.webmanifest': validManifest,
    'sw.js': 'self.__WB_MANIFEST = []; precacheAndRoute(self.__WB_MANIFEST);',
    'registerSW.js': 'navigator.serviceWorker.register("/sw.js");',
    'assets/feature-too-large.js': 'x'.repeat(501 * 1024),
  });

  try {
    await assert.rejects(() => verifyPwaBuild(dist), /feature-too-large\.js.*default-js-chunk budget/i);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test('verifyPwaBuild allows known heavy map and language chunks within explicit budgets', async () => {
  const dist = await createDist({
    'manifest.webmanifest': validManifest,
    'sw.js': 'self.__WB_MANIFEST = []; precacheAndRoute(self.__WB_MANIFEST);',
    'registerSW.js': 'navigator.serviceWorker.register("/sw.js");',
    'assets/vendor-maplibre-demo.js': 'x'.repeat(560 * 1024),
    'assets/vendor-language-opencc-demo.js': 'x'.repeat(560 * 1024),
  });

  try {
    const result = await verifyPwaBuild(dist);
    assert.equal(result.chunkBudget.largeChunks.length, 2);
    assert.deepEqual(
      result.chunkBudget.largeChunks.map(chunk => chunk.budgetId).sort(),
      ['map-renderer-vendor', 'script-conversion-vendor'],
    );
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});
