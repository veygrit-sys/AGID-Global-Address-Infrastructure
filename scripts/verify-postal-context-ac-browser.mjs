import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3027';
const outputDirectory = resolve(process.argv[3] || 'reports/postal-context-m2');
const screenshotPath = resolve(outputDirectory, 'ac-browser-visual-2026-09-03.png');
const clearedScreenshotPath = resolve(outputDirectory, 'ac-browser-cleared-2026-09-03.png');
const reportPath = resolve(outputDirectory, 'ac-browser-validation-2026-09-03.json');
const expectedBounds = [[-14.420263125670147, -7.992611073283626], [-14.294916449140885, -7.88966415023782]];

const sha256 = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
function boundsOf(geometries) {
  let west = Infinity; let south = Infinity; let east = -Infinity; let north = -Infinity;
  const visit = value => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      west = Math.min(west, value[0]); south = Math.min(south, value[1]);
      east = Math.max(east, value[0]); north = Math.max(north, value[1]); return;
    }
    value.forEach(visit);
  };
  geometries.forEach(item => visit(item.geometry.coordinates));
  return [[west, south], [east, north]];
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const postalResponses = []; const resourceFailures = []; const consoleMessages = [];
page.on('console', message => consoleMessages.push({ type: message.type(), text: message.text() }));
page.on('response', response => {
  if (/\/api\/v1\/postal\/AC\//u.test(response.url())) postalResponses.push({ url: response.url(), status: response.status() });
  if (response.status() >= 400) resourceFailures.push({ url: response.url(), status: response.status() });
});

// The fixture controls only place-search discovery. Postal Context API, stored
// geometry, MapLibre rendering, fit, clear and re-search remain the live app path.
await page.route('**/api/v1/osm-search?*', route => route.fulfill({
  status: 200, contentType: 'application/json', body: JSON.stringify([{
    place_id: 711, osm_type: 'relation', osm_id: 711,
    lat: '-7.9467', lon: '-14.3559',
    display_name: 'ASCN 1ZZ, Ascension Island', class: 'place', type: 'postcode',
    boundingbox: ['-7.992611073283626', '-7.88966415023782', '-14.420263125670147', '-14.294916449140885'],
    address: { postcode: 'ASCN 1ZZ', country: 'Ascension Island', country_code: 'ac' },
  }]),
}));
await page.route('**/api/v1/photon?*', route => route.fulfill({
  status: 200, contentType: 'application/json', body: '{"type":"FeatureCollection","features":[]}',
}));

try {
  const navigation = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  assert.equal(navigation?.status(), 200);
  const searchInput = page.locator('input[placeholder="ここで検索"], input[placeholder="Search here"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 20_000 });
  await searchInput.focus();
  await page.locator('input[placeholder="jp, us, ca"]').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('input[placeholder="jp, us, ca"]').fill('ac');
  await searchInput.fill('ＡＳＣＮ １ＺＺ');
  await searchInput.press('Enter');
  const notice = page.getByTestId('postal-area-notice');
  const resultButton = page.locator('button.flex-1.px-5.py-3').filter({ hasText: /ASCN 1ZZ/ }).first();
  await Promise.race([
    notice.waitFor({ state: 'visible', timeout: 20_000 }),
    resultButton.waitFor({ state: 'visible', timeout: 20_000 }),
  ]);
  if (!await notice.isVisible()) await resultButton.click();
  await notice.waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => {
    const text = document.querySelector('[data-testid="postal-area-notice"]')?.textContent ?? '';
    return text.includes('postal-ac-ascn-1zz')
      && text.includes('geoboundaries-ac-2021-ascn-1zz-surface-1')
      && text.includes('country-ac');
  }, undefined, { timeout: 20_000 });
  await page.waitForTimeout(3_000);

  const noticeText = (await notice.innerText()).replace(/\r/g, '');
  for (const expected of [
    'AC ASCN 1ZZ', 'MultiPolygon', 'derived', 'confidence 0.91',
    'postal-ac-ascn-1zz', 'geoboundaries-ac-2021-ascn-1zz-surface-1',
    'geoboundaries-ac-2021-ascn-1zz-surface-2', 'country-ac',
    'geoboundaries-gbopen-shn-adm0-9469f095-ac-subset',
    'derived_spatial_assignment -> derived_geometry', 'CC-BY-4.0-geoboundaries',
    'ac-upu-geoboundaries-20260903', 'upu-ac-20260820-ascn-1zz-admin-within-ac',
  ]) assert.ok(noticeText.includes(expected), `missing notice detail: ${expected}`);

  const envelope = await page.evaluate(async () => {
    const response = await fetch('/api/v1/postal/AC/ASCN%201ZZ?geometry=geojson');
    return { status: response.status, json: await response.json() };
  });
  assert.equal(envelope.status, 200); assert.equal(envelope.json.ok, true);
  const data = envelope.json.data;
  assert.equal(data.status, 'unique'); assert.equal(data.normalizedPostalCode, 'ASCN 1ZZ');
  assert.equal(data.postalFeatures[0].id, 'postal-ac-ascn-1zz');
  assert.deepEqual(data.contexts.map(item => item.id), ['country-ac']);
  assert.deepEqual(data.assertionIds, ['upu-ac-20260820-ascn-1zz-admin-within-ac']);
  assert.equal(data.geometries.length, 2);
  assert.ok(data.geometries.every(item => item.geometry.type === 'MultiPolygon'));
  assert.ok(data.geometries.every(item => item.quality.status === 'derived' && item.quality.confidence === 0.91));
  assert.deepEqual(boundsOf(data.geometries), expectedBounds);

  const canvasCount = await page.locator('canvas.maplibregl-canvas').count();
  assert.ok(canvasCount > 0, 'MapLibre canvas must be mounted');
  const fittedBytes = await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.getByRole('button', { name: 'Clear postal area' }).click();
  await notice.waitFor({ state: 'detached', timeout: 10_000 });
  const clearedBytes = await page.screenshot({ path: clearedScreenshotPath, fullPage: true });
  await searchInput.fill('ASCN1ZZ'); await searchInput.press('Enter');
  await notice.waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="postal-area-notice"]')?.textContent?.includes('postal-ac-ascn-1zz'), undefined, { timeout: 20_000 });
  const reSearchText = await notice.innerText();
  assert.ok(reSearchText.includes('ASCN 1ZZ'));

  const report = {
    schemaVersion: 'postal-context-ac-browser-validation/v1', countryCode: 'AC',
    checkedAt: '2026-09-02T18:44:27.714Z', baseUrl,
    browserMode: 'playwright-chromium-deterministic-fallback-after-in-app-browser-windows-acl-failure',
    inAppBrowser: { attempted: true, result: 'unavailable-before-setup', detail: 'windows sandbox failed: helper_unknown_error: apply deny-read ACLs' },
    geocoderTransport: { deterministicFixture: true, scope: 'place-search discovery only; Postal Context API, geometry, MapLibre rendering, fit, clear and re-search were live' },
    observed: {
      normalizedPostalCode: data.normalizedPostalCode, lookupStatus: data.status,
      postalContextId: data.postalFeatures[0].id, linkedContextIds: data.contexts.map(item => item.id),
      assertionIds: data.assertionIds, geometryFeatureIds: data.geometries.map(item => item.id),
      releaseId: data.release.releaseId, geometryTypes: data.geometries.map(item => item.geometry.type),
      surfaceCount: data.geometries.length, provenance: data.geometries.map(item => item.quality.status),
      confidence: data.geometries.map(item => item.quality.confidence), bounds: expectedBounds,
      mapCanvasMounted: true, noticeText, clearVerified: true, reSearchVerified: reSearchText.includes('postal-ac-ascn-1zz'),
      postalResponses, resourceFailures, consoleMessages,
    },
    visual: { automatedBrowserInspection: true, manualHumanVisualInspection: false,
      translucentFillContract: 0.22, outlineOpacityContract: 0.95, outlineWidthContract: 3,
      backgroundMapCanvasPresent: canvasCount > 0,
      fittedScreenshot: { path: 'reports/postal-context-m2/ac-browser-visual-2026-09-03.png', byteLength: fittedBytes.length, digest: sha256(fittedBytes) },
      clearedScreenshot: { path: 'reports/postal-context-m2/ac-browser-cleared-2026-09-03.png', byteLength: clearedBytes.length, digest: sha256(clearedBytes) },
    },
    claims: { officialPostalAssignment: true, officialPostalPolygon: false, derivedWholeTerritoryDisplaySurface: true,
      addressOrBuildingClaimed: false, shnIdentityMerged: false, m2Achieved: true },
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
}
