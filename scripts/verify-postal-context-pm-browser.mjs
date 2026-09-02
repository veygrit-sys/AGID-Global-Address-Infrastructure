import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3010';
const outputDirectory = resolve(process.argv[3] || 'reports/postal-context-m2');
const screenshotPath = resolve(outputDirectory, 'pm-browser-visual-2026-09-02.png');
const reportPath = resolve(outputDirectory, 'pm-browser-validation-2026-09-02.json');
const expectedBounds = [[-56.518569, 46.749454], [-56.119017, 47.144249]];

function geometryBounds(geometry) {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  const visit = value => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      west = Math.min(west, value[0]);
      south = Math.min(south, value[1]);
      east = Math.max(east, value[0]);
      north = Math.max(north, value[1]);
      return;
    }
    value.forEach(visit);
  };
  visit(geometry.coordinates);
  return [[west, south], [east, north]];
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const postalRequests = [];
const resourceFailures = [];
page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('response', response => {
  if (response.status() >= 400) {
    resourceFailures.push({ url: response.url(), status: response.status() });
  }
  if (response.url().includes('/api/v1/postal/PM/')) {
    postalRequests.push({ url: response.url(), status: response.status() });
  }
});

// Nominatim currently returns no PM postcode hit. Keep the UI transport deterministic,
// while leaving the Postal Context API, real geometry, map rendering, and fit path untouched.
await page.route('**/api/v1/osm-search?*', route => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify([{
    place_id: 97500,
    osm_type: 'relation',
    osm_id: 97500,
    lat: '46.7790',
    lon: '-56.1770',
    display_name: '97500, Saint-Pierre, Saint Pierre and Miquelon',
    class: 'place',
    type: 'postcode',
    boundingbox: ['46.749454', '47.144249', '-56.518569', '-56.119017'],
    address: {
      postcode: '97500',
      town: 'Saint-Pierre',
      country: 'Saint Pierre and Miquelon',
      country_code: 'pm',
    },
  }]),
}));
await page.route('**/api/v1/photon?*', route => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
}));

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const searchInput = page.locator('input[placeholder="ここで検索"], input[placeholder="Search here"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 20_000 });
  await searchInput.focus();
  await page.locator('input[placeholder="jp, us, ca"]').fill('pm');
  await searchInput.fill('97500');
  await searchInput.press('Enter');

  const notice = page.getByTestId('postal-area-notice');
  const resultButton = page.locator('button.flex-1.px-5.py-3').filter({ hasText: '97500' }).first();
  await Promise.race([
    notice.waitFor({ state: 'visible', timeout: 20_000 }),
    resultButton.waitFor({ state: 'visible', timeout: 20_000 }),
  ]);
  if (!await notice.isVisible()) await resultButton.click();
  await notice.waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => {
    const panel = document.querySelector('[data-testid="postal-area-notice"]');
    return panel?.textContent?.includes('postal-pm-97500')
      && panel.textContent.includes('admin-pm-insee-97501')
      && panel.textContent.includes('admin-pm-insee-97502');
  }, undefined, { timeout: 20_000 });
  await page.waitForTimeout(3_000);

  const noticeText = (await notice.innerText()).replace(/\r/g, '');
  for (const expected of [
    'postal-pm-97500',
    'admin-pm-insee-97501',
    'admin-pm-insee-97502',
    'Miquelon-Langlade',
    'Saint-Pierre',
    'MultiPolygon',
    'derived',
    'pm-laposte-geoapi-single-postcode-20260901',
    'laposte-pm-20260808-97500-admin-within-97501',
    'laposte-pm-20260808-97500-admin-within-97502',
  ]) assert.match(noticeText, new RegExp(expected));

  const envelope = await page.evaluate(async () => {
    const response = await fetch('/api/v1/postal/PM/97500?geometry=geojson');
    return { status: response.status, json: await response.json() };
  });
  assert.equal(envelope.status, 200);
  assert.equal(envelope.json.ok, true);
  const data = envelope.json.data;
  assert.equal(data.status, 'ambiguous');
  assert.equal(data.normalizedPostalCode, '97500');
  assert.equal(data.postalFeatures[0].id, 'postal-pm-97500');
  assert.deepEqual(data.alternatives.map(item => item.contexts[0].id), [
    'admin-pm-insee-97501',
    'admin-pm-insee-97502',
  ]);
  assert.equal(data.geometries[0].geometry.type, 'MultiPolygon');
  assert.equal(data.geometries[0].geometry.coordinates.length, 78);
  assert.equal(data.geometries[0].quality.status, 'derived');
  assert.equal(data.geometries[0].quality.confidence, 0.95);
  assert.deepEqual(geometryBounds(data.geometries[0].geometry), expectedBounds);

  const canvasCount = await page.locator('canvas.maplibregl-canvas').count();
  assert.ok(canvasCount > 0, 'MapLibre canvas must be mounted');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const screenshotSha256 = createHash('sha256').update(await readFile(screenshotPath)).digest('hex');
  const postalContextFailures = resourceFailures.filter(item => item.url.includes('/api/v1/postal/PM/'));
  assert.deepEqual(postalContextFailures, []);
  assert.ok(resourceFailures.every(item => [
    '/api/postal-code/nearest',
    '/api/overture/building-name',
    '/api/overpass',
  ].some(path => item.url.includes(path))), 'Only ancillary address/building lookups may fail');

  await page.getByRole('button', { name: 'Clear postal area' }).click();
  await notice.waitFor({ state: 'detached', timeout: 10_000 });

  const report = {
    schemaVersion: '1.0.0',
    countryCode: 'PM',
    checkedAt: new Date().toISOString(),
    baseUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
    geocoderTransport: {
      deterministicFixture: true,
      reason: 'The public Nominatim proxy returned no PM postcode result at verification time.',
      scope: 'Search-result transport only; Postal Context API, geometry, MapLibre rendering, and map fit were not intercepted.',
    },
    observed: {
      normalizedPostalCode: data.normalizedPostalCode,
      lookupStatus: data.status,
      postalContextId: data.postalFeatures[0].id,
      linkedContextIds: data.alternatives.map(item => item.contexts[0].id),
      linkedContextLabels: data.alternatives.map(item => item.contexts[0].label),
      assertionIds: data.alternatives.flatMap(item => item.assertionIds),
      releaseId: data.release.releaseId,
      geometryType: data.geometries[0].geometry.type,
      polygonParts: data.geometries[0].geometry.coordinates.length,
      provenance: data.geometries[0].quality.status,
      confidence: data.geometries[0].quality.confidence,
      bounds: expectedBounds,
      mapCanvasMounted: canvasCount > 0,
      noticeText,
      clearVerified: true,
      postalRequests,
      resourceFailures,
      postalContextFailures,
      consoleErrors,
    },
    screenshot: {
      path: 'reports/postal-context-m2/pm-browser-visual-2026-09-02.png',
      sha256: screenshotSha256,
    },
    verdict: resourceFailures.length ? 'pass_with_ancillary_address_context_unavailable' : 'pass',
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} finally {
  await browser.close();
}
