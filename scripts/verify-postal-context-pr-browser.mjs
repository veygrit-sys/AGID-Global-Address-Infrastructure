import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3022';
const outputDirectory = resolve(process.argv[3] || 'reports/postal-context-m2');
const desktopScreenshotPath = resolve(outputDirectory, 'pr-browser-visual-desktop-2026-09-02.png');
const mobileScreenshotPath = resolve(outputDirectory, 'pr-browser-visual-mobile-2026-09-02.png');
const reportPath = resolve(outputDirectory, 'pr-browser-validation-2026-09-02.json');

const candidates = {
  '00926': {
    place_id: 926, lat: '18.3514', lon: '-66.0661',
    display_name: '00926, San Juan, Puerto Rico',
    boundingbox: ['18.30192300028008', '18.396658999825014', '-66.10244799956124', '-66.00346400025006'],
    address: { postcode: '00926', city: 'San Juan', country: 'Puerto Rico', country_code: 'pr' },
  },
  '00601': {
    place_id: 601, lat: '18.1800', lon: '-66.7500',
    display_name: '00601, Adjuntas, Puerto Rico',
    boundingbox: ['18.1172759997328', '18.2809180001463', '-66.8360640001512', '-66.659698000388'],
    address: { postcode: '00601', town: 'Adjuntas', country: 'Puerto Rico', country_code: 'pr' },
  },
  '00902': {
    place_id: 902, lat: '18.4655', lon: '-66.1057',
    display_name: '00902, San Juan, Puerto Rico',
    boundingbox: ['18.45', '18.48', '-66.13', '-66.08'],
    address: { postcode: '00902', city: 'San Juan', country: 'Puerto Rico', country_code: 'pr' },
  },
};
function geometryBounds(geometry) {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  const visit = value => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      west = Math.min(west, value[0]); south = Math.min(south, value[1]);
      east = Math.max(east, value[0]); north = Math.max(north, value[1]); return;
    }
    value.forEach(visit);
  };
  visit(geometry.coordinates);
  return [[west, south], [east, north]];
}
async function configurePage(page, evidence) {
  page.on('console', message => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) evidence.resourceFailures.push({ url: response.url(), status: response.status() });
    if (response.url().includes('/api/v1/postal/PR/')) evidence.postalRequests.push({ url: response.url(), status: response.status() });
  });
  await page.route('**/api/v1/osm-search?*', route => {
    const query = new URL(route.request().url()).searchParams.get('q') ?? '';
    const code = Object.keys(candidates).find(item => query.includes(item)) ?? '00926';
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{
      ...candidates[code], osm_type: 'relation', osm_id: Number(code), class: 'place', type: 'postcode',
    }]) });
  });
  await page.route('**/api/v1/photon?*', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
  }));
}
async function search(page, code) {
  const searchInput = page.locator('input[placeholder="ここで検索"], input[placeholder="Search here"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 20_000 });
  await searchInput.fill(code);
  await searchInput.press('Enter');
  const notice = page.getByTestId('postal-area-notice');
  const resultButton = page.locator('button.flex-1.px-5.py-3').filter({ hasText: code }).first();
  await Promise.race([
    notice.waitFor({ state: 'visible', timeout: 20_000 }),
    resultButton.waitFor({ state: 'visible', timeout: 20_000 }),
  ]);
  if (await resultButton.isVisible()) await resultButton.click();
  await notice.waitFor({ state: 'visible', timeout: 20_000 });
  return notice;
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evidence = { consoleErrors: [], postalRequests: [], resourceFailures: [] };
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  await configurePage(desktop, evidence);
  await desktop.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const notice = await search(desktop, '00926');
  await desktop.waitForFunction(() => {
    const text = document.querySelector('[data-testid="postal-area-notice"]')?.textContent ?? '';
    return text.includes('postal-pr-census-zcta-00926')
      && text.includes('census-pr-zcta-2020-00926')
      && text.includes('census-pr-zcta-2020-00926-part-of-pr')
      && text.includes('country-pr')
      && text.includes('population 96,732')
      && text.includes('housing 45,969');
  }, undefined, { timeout: 20_000 });
  await desktop.waitForTimeout(3_000);
  const noticeText = (await notice.innerText()).replace(/\r/g, '');
  for (const expected of [
    '2020 Census ZCTA 00926', 'population 96,732', 'housing 45,969', 'land 60.12 km²', 'water 0.22 km²',
    'postal-pr-census-zcta-00926', 'census-pr-zcta-2020-00926', 'census-pr-zcta-2020-00926-part-of-pr',
    'country-pr', 'pr-census-zcta-2020-20260902', 'derived', 'Polygon', '0.9',
    'us-census-public-use-attribution', '0438e99e895e732299d76ba85c2d7a0727a22ffa79f5ea886d1317ba13c20d31',
  ]) assert.ok(noticeText.includes(expected), expected);
  assert.ok(await desktop.locator('canvas.maplibregl-canvas').count() > 0);
  await desktop.screenshot({ path: desktopScreenshotPath, fullPage: true });

  await desktop.getByRole('button', { name: 'Clear postal area' }).click();
  await notice.waitFor({ state: 'detached', timeout: 10_000 });
  const secondNotice = await search(desktop, '00601');
  await desktop.waitForFunction(() =>
    document.querySelector('[data-testid="postal-area-notice"]')?.textContent?.includes('postal-pr-census-zcta-00601'),
  undefined, { timeout: 20_000 });
  assert.ok((await secondNotice.innerText()).includes('2020 Census ZCTA 00601'));

  const api = await desktop.evaluate(async () => {
    const success = await fetch('/api/v1/postal/PR/00926-3232?geometry=geojson').then(r => r.json());
    const absent = await fetch('/api/v1/postal/PR/00902?geometry=geojson').then(r => r.json());
    return { success, absent };
  });
  assert.equal(api.success.data.normalizedPostalCode, '00926');
  assert.equal(api.success.data.geometries[0].id, 'census-pr-zcta-2020-00926');
  assert.deepEqual(geometryBounds(api.success.data.geometries[0].geometry),
    [[-66.10244799956124, 18.30192300028008], [-66.00346400025006, 18.396658999825014]]);
  assert.equal(api.absent.data.status, 'no_match');
  assert.deepEqual(api.absent.data.geometries, []);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await configurePage(mobile, evidence);
  await mobile.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const mobileNotice = await search(mobile, '00926');
  await mobile.waitForFunction(() =>
    document.querySelector('[data-testid="postal-area-notice"]')?.textContent?.includes('census-pr-zcta-2020-00926'),
  undefined, { timeout: 20_000 });
  await mobile.waitForTimeout(2_000);
  assert.ok((await mobileNotice.innerText()).includes('population 96,732'));
  assert.ok(await mobile.locator('canvas.maplibregl-canvas').count() > 0);
  await mobile.screenshot({ path: mobileScreenshotPath, fullPage: true });

  const screenshots = {};
  for (const [name, path] of Object.entries({ desktop: desktopScreenshotPath, mobile: mobileScreenshotPath })) {
    screenshots[name] = {
      path: 'reports/postal-context-m2/' + path.split(/[\\/]/).at(-1),
      sha256: createHash('sha256').update(await readFile(path)).digest('hex'),
    };
  }
  const postalContextFailures = evidence.resourceFailures.filter(item => item.url.includes('/api/v1/postal/PR/'));
  assert.deepEqual(postalContextFailures, []);
  const report = {
    schemaVersion: '1.0.0', countryCode: 'PR', checkedAt: new Date().toISOString(), baseUrl,
    browser: 'Chromium via Playwright', visualMode: 'headless screenshots manually inspected after capture',
    viewports: { desktop: { width: 1440, height: 1100 }, mobile: { width: 390, height: 844 } },
    browserSkillAttempt: {
      attempted: true, succeeded: false,
      failure: 'node_repl kernel exited: windows sandbox failed: helper_unknown_error: apply deny-read ACLs',
    },
    geocoderTransport: {
      deterministicFixture: true,
      scope: 'Search-result transport only; Postal Context API, real Census geometry, MapLibre render, fit, clear and re-search were not intercepted.',
    },
    observed: {
      normalizedPostalCode: api.success.data.normalizedPostalCode,
      postalContextId: api.success.data.postalFeatures[0].id,
      postalLabel: api.success.data.postalFeatures[0].label,
      geometryFeatureId: api.success.data.geometries[0].id,
      linkedContextId: api.success.data.contexts[0].id,
      assertionId: api.success.data.assertionIds[0],
      releaseId: api.success.data.release.releaseId,
      geometryType: api.success.data.geometries[0].geometry.type,
      provenance: api.success.data.geometries[0].quality.status,
      confidence: api.success.data.geometries[0].quality.confidence,
      bounds: geometryBounds(api.success.data.geometries[0].geometry),
      noticeText, clearVerified: true, reSearch00601Verified: true, noMatch00902Verified: true,
      postalRequests: evidence.postalRequests, resourceFailures: evidence.resourceFailures,
      postalContextFailures, consoleErrors: evidence.consoleErrors,
    },
    screenshots, verdict: postalContextFailures.length ? 'fail' : 'pass',
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} finally {
  await browser.close();
}
