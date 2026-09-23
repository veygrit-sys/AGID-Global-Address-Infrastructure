import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAppleCompatibilityReport } from './appleCompatibility';

const goodIndexHtml = `
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="color-scheme" content="light dark" />
<meta name="format-detection" content="telephone=no,email=no,address=no" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="AGID" />
<link rel="apple-touch-icon" href="/agid-logo.png" />
<meta name="theme-color" content="#0f172a" />
`;

const goodEmbedHtml = `
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="color-scheme" content="light dark" />
<meta name="format-detection" content="telephone=no,email=no,address=no" />
`;

const goodViteConfig = `
includeAssets: ['agid-logo.png', 'agid-logo.jpg', 'pwa-icon.svg'],
manifest: {
  display: 'standalone',
  background_color: '#0f172a',
  icons: [{ src: '/agid-logo.png', purpose: 'any maskable' }],
}
`;

const goodCss = `
:root { --safe-area-top: env(safe-area-inset-top); }
html, body, #root { min-height: -webkit-fill-available; }
.map-container { min-height: 100dvh; overscroll-behavior: none; }
`;

const goodSource = `
const apple = 'https://maps.apple.com/?ll=35,139';
const nfc = 'Web NFC unavailable';
const reader = window.NDEFReader;
const qr = 'QR scanner unavailable';
void navigator.share;
void navigator.clipboard;
`;

test('apple compatibility report is ready with PWA, safe-area, and fallback coverage', () => {
  const report = buildAppleCompatibilityReport({
    htmlFiles: [
      { path: 'index.html', content: goodIndexHtml },
      { path: 'embed.html', content: goodEmbedHtml },
    ],
    cssFiles: [{ path: 'src/index.css', content: goodCss }],
    sourceFiles: [{ path: 'src/lib/guidanceEngine.ts', content: goodSource }],
    viteConfigSource: goodViteConfig,
  });

  assert.equal(report.status, 'ready');
  assert.equal(report.summary.fail, 0);
  assert.equal(report.summary.warn, 0);
});

test('apple compatibility report blocks missing main Apple PWA metadata', () => {
  const report = buildAppleCompatibilityReport({
    htmlFiles: [
      { path: 'index.html', content: '<meta name="viewport" content="width=device-width" />' },
      { path: 'embed.html', content: goodEmbedHtml },
    ],
    cssFiles: [{ path: 'src/index.css', content: goodCss }],
    sourceFiles: [{ path: 'src/lib/guidanceEngine.ts', content: goodSource }],
    viteConfigSource: goodViteConfig,
  });

  assert.equal(report.status, 'blocked');
  assert.ok(report.checks.some(check => check.id === 'apple-pwa-meta' && check.severity === 'fail'));
});

test('apple compatibility report blocks missing Safari viewport CSS safeguards', () => {
  const report = buildAppleCompatibilityReport({
    htmlFiles: [
      { path: 'index.html', content: goodIndexHtml },
      { path: 'embed.html', content: goodEmbedHtml },
    ],
    cssFiles: [{ path: 'src/index.css', content: '.map-container { height: 100vh; }' }],
    sourceFiles: [{ path: 'src/lib/guidanceEngine.ts', content: goodSource }],
    viteConfigSource: goodViteConfig,
  });

  assert.equal(report.status, 'blocked');
  assert.ok(report.checks.some(check => check.id === 'safari-safe-area-css' && check.severity === 'fail'));
});

test('apple compatibility report warns when Apple Maps handoff is absent', () => {
  const report = buildAppleCompatibilityReport({
    htmlFiles: [
      { path: 'index.html', content: goodIndexHtml },
      { path: 'embed.html', content: goodEmbedHtml },
    ],
    cssFiles: [{ path: 'src/index.css', content: goodCss }],
    sourceFiles: [{ path: 'src/lib/guidanceEngine.ts', content: 'const map = "google";' }],
    viteConfigSource: goodViteConfig,
  });

  assert.equal(report.status, 'attention');
  assert.ok(report.checks.some(check => check.id === 'apple-maps-provider' && check.severity === 'warn'));
});
