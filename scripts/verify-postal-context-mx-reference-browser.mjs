import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4319';
const outputDirectory = resolve(process.argv[3] || 'reports/postal-context-m2');
const screenshotPath = resolve(outputDirectory, 'mx-reference-browser-visual-2026-09-03.png');
const reportPath = resolve(outputDirectory, 'mx-reference-browser-validation-2026-09-03.json');

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
  assert.ok([west, south, east, north].every(Number.isFinite), 'geometry bounds are finite');
  return [[west, south], [east, north]];
}

async function renderedCanvasStats(page, canvas) {
  const canvasPng = await canvas.screenshot();
  return page.evaluate(async dataUrl => {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const surface = document.createElement('canvas');
    surface.width = image.naturalWidth;
    surface.height = image.naturalHeight;
    const context = surface.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, surface.width, surface.height).data;
    const buckets = new Set();
    let opaquePixels = 0;
    let blueDominantPixels = 0;
    for (let index = 0; index < pixels.length; index += 16) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      if (alpha > 0) opaquePixels += 1;
      if (blue > red + 12 && blue > green + 4) blueDominantPixels += 1;
      buckets.add(`${red >> 4}:${green >> 4}:${blue >> 4}:${alpha >> 4}`);
    }
    return {
      screenshotWidth: surface.width,
      screenshotHeight: surface.height,
      sampledPixels: pixels.length / 16,
      opaquePixels,
      blueDominantPixels,
      colorBuckets: buckets.size,
    };
  }, `data:image/png;base64,${canvasPng.toString('base64')}`);
}

function nominatimCandidate(code, feature, index) {
  const [[west, south], [east, north]] = geometryBounds(feature.geometry);
  return {
    place_id: 60_000 + index,
    osm_type: 'relation',
    osm_id: 60_000 + index,
    class: 'place',
    type: 'postcode',
    lat: String((south + north) / 2),
    lon: String((west + east) / 2),
    display_name: `${code}, Ciudad de Mexico, Mexico`,
    boundingbox: [String(south), String(north), String(west), String(east)],
    address: {
      postcode: code,
      city: 'Ciudad de Mexico',
      state: 'Ciudad de Mexico',
      country: 'Mexico',
      country_code: 'mx',
    },
  };
}

async function readPostalApi(page, code) {
  return page.evaluate(async postalCode => {
    const response = await fetch(`/api/v1/postal/MX/${postalCode}?geometry=geojson`);
    return { status: response.status, body: await response.json() };
  }, code);
}

async function search(page, code) {
  const searchInput = page.locator('input[placeholder="ここで検索"], input[placeholder="Search here"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 30_000 });
  await searchInput.click();
  await searchInput.press('Control+A');
  await searchInput.fill(code);
  const notice = page.getByTestId('postal-area-notice');
  const resultButton = page.locator('button.flex-1.px-5.py-3').filter({ hasText: code }).first();
  await page.waitForTimeout(700);
  if (await resultButton.isVisible()) {
    await resultButton.click();
  } else {
    await searchInput.press('Enter');
  }
  await Promise.race([
    notice.waitFor({ state: 'visible', timeout: 30_000 }),
    resultButton.waitFor({ state: 'visible', timeout: 30_000 }),
  ]);
  if (await resultButton.isVisible()) await resultButton.click();
  await notice.waitFor({ state: 'visible', timeout: 30_000 });
  return notice;
}

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const evidence = {
  consoleErrors: [],
  consoleWarnings: [],
  postalRequests: [],
  resourceFailures: [],
};

try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
  const fixtures = {};

  page.on('console', message => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text());
    if (message.type() === 'warning') evidence.consoleWarnings.push(message.text());
  });
  page.on('response', response => {
    const item = { url: response.url(), status: response.status() };
    if (response.status() >= 400) evidence.resourceFailures.push(item);
    if (response.url().includes('/api/v1/postal/MX/')) evidence.postalRequests.push(item);
  });
  await page.route('**/api/v1/osm-search?*', route => {
    const query = new URL(route.request().url()).searchParams.get('q') ?? '';
    const code = Object.keys(fixtures).find(item => query.includes(item)) ?? '06000';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([fixtures[code]]),
    });
  });
  await page.route('**/api/v1/photon?*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
  }));

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  const api06000 = await readPostalApi(page, '06000');
  const api01000 = await readPostalApi(page, '01000');
  const apiNoMatch = await readPostalApi(page, '00000');
  assert.equal(api06000.status, 200);
  assert.equal(api01000.status, 200);
  assert.equal(apiNoMatch.status, 200);
  assert.equal(api06000.body.data.status, 'unique');
  assert.equal(api01000.body.data.status, 'unique');
  assert.equal(apiNoMatch.body.data.status, 'no_match');
  assert.deepEqual(apiNoMatch.body.data.geometries, []);

  const feature06000 = api06000.body.data.geometries[0];
  const feature01000 = api01000.body.data.geometries[0];
  fixtures['06000'] = nominatimCandidate('06000', feature06000, 0);
  fixtures['01000'] = nominatimCandidate('01000', feature01000, 1);

  const countryFilter = page.locator('input[placeholder="jp, us, ca"]').first();
  if (await countryFilter.count()) await countryFilter.fill('mx');

  const notice = await search(page, '06000');
  await page.waitForFunction(() => {
    const text = document.querySelector('[data-testid="postal-area-notice"]')?.textContent ?? '';
    return text.includes('postal-mx-06000')
      && text.includes('mx-derived-06000')
      && text.includes('sepomex-mx-2025-06000-part-of-mx')
      && text.includes('country-mx')
      && text.includes('AGID Postal Context chain');
  }, undefined, { timeout: 30_000 });
  await page.waitForTimeout(3_000);

  const noticeText = (await notice.innerText()).replace(/\r/g, '');
  for (const expected of [
    '06000 — SEPOMEX 2025 derived display area',
    'postal-mx-06000',
    'mx-derived-06000',
    'postal-mx-06000 -> mx-derived-06000',
    'sepomex-mx-2025-06000-part-of-mx',
    'country-mx',
    'AGID Postal Context chain',
    'official_postal_mapping_authority',
    'official_postal_geometry',
    'CP_CDMX/250m-derived-repaired-v3',
    'confidence 0.92',
    'accuracy 250 m',
    'mx-sepomex-postal-polygons-2025-20260901',
    'sha256:45fd1dcc147a6e49c85e012a4cfd99f89ea2a93b6066be3021b42d8c3b1a037a',
    'mx-sepomex-derived-display-2025',
    'derived',
    'Polygon',
    '2025-01-01',
  ]) assert.ok(noticeText.toLowerCase().includes(expected.toLowerCase()), `notice contains ${expected}`);

  assert.ok(await page.locator('canvas.maplibregl-canvas').count() > 0, 'MapLibre canvas exists');
  const canvas = page.locator('canvas.maplibregl-canvas').first();
  const canvasBox = await canvas.boundingBox();
  assert.ok(canvasBox && canvasBox.width > 300 && canvasBox.height > 300, 'MapLibre canvas has visible dimensions');
  const renderStats = await renderedCanvasStats(page, canvas);
  assert.ok(renderStats, 'MapLibre screenshot pixels are readable');
  assert.ok(renderStats.opaquePixels > 1_000, 'MapLibre canvas contains rendered pixels');
  assert.ok(renderStats.colorBuckets > 32, 'MapLibre canvas is not a flat placeholder');
  assert.ok(renderStats.blueDominantPixels > 20, 'postal blue fill/boundary pixels are present');

  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.getByRole('button', { name: 'Clear postal area' }).click();
  await notice.waitFor({ state: 'detached', timeout: 10_000 });
  await page.waitForTimeout(1_000);
  const clearedRenderStats = await renderedCanvasStats(page, canvas);
  assert.ok(clearedRenderStats, 'cleared MapLibre screenshot pixels are readable');
  assert.ok(renderStats.blueDominantPixels > clearedRenderStats.blueDominantPixels + 1_000,
    'clearing removes the postal blue fill/boundary pixels');
  const secondNotice = await search(page, '01000');
  await page.waitForFunction(() => {
    const text = document.querySelector('[data-testid="postal-area-notice"]')?.textContent ?? '';
    return text.includes('postal-mx-01000')
      && text.includes('mx-derived-01000')
      && text.includes('sepomex-mx-2025-01000-part-of-mx');
  }, undefined, { timeout: 30_000 });
  const secondNoticeText = (await secondNotice.innerText()).replace(/\r/g, '');
  await page.waitForTimeout(2_000);
  const reSearchRenderStats = await renderedCanvasStats(page, canvas);
  assert.ok(reSearchRenderStats, 're-search MapLibre screenshot pixels are readable');
  assert.ok(reSearchRenderStats.blueDominantPixels > clearedRenderStats.blueDominantPixels + 1_000,
    're-search restores the postal blue fill/boundary pixels');

  const postalContextFailures = evidence.resourceFailures.filter(item => item.url.includes('/api/v1/postal/MX/'));
  assert.deepEqual(postalContextFailures, []);
  const screenshotBytes = await readFile(screenshotPath);
  const report = {
    schemaVersion: '1.0.0',
    countryCode: 'MX',
    checkedAt: new Date().toISOString(),
    baseUrl,
    browser: 'Chromium via Playwright',
    visualMode: 'headless screenshot plus deterministic rendered-canvas pixel inspection; manual visual inspection was unavailable because both image-view and Windows UI helpers failed with the recorded ACL error',
    viewport: { width: 1600, height: 1200 },
    browserSkillAttempt: {
      attempted: true,
      succeeded: false,
      failure: 'node_repl kernel exited unexpectedly; windows sandbox failed: helper_unknown_error: apply deny-read ACLs',
    },
    geocoderTransport: {
      deterministicFixture: true,
      scope: 'Search-result transport only. Postal Context API, fixed SEPOMEX-derived geometry, MapLibre render, fit, clear and re-search were not intercepted.',
    },
    observed: {
      normalizedPostalCode: api06000.body.data.normalizedPostalCode,
      postalContextId: api06000.body.data.postalFeatures[0].id,
      geometryFeatureId: feature06000.id,
      linkedContextId: api06000.body.data.contexts[0].id,
      assertionId: api06000.body.data.assertionIds[0],
      repositoryId: api06000.body.data.release.repositoryId,
      releaseId: api06000.body.data.release.releaseId,
      manifestDigest: api06000.body.data.release.manifestDigest,
      geometryType: feature06000.geometry.type,
      provenance: feature06000.quality.status,
      sourceId: feature06000.source.sourceId,
      sourceVersion: feature06000.source.sourceVersion,
      sourceDate: feature06000.source.sourceDate,
      assignmentAuthority: feature06000.source.assignmentAuthority,
      geometryAuthority: feature06000.source.geometryAuthority,
      confidence: feature06000.quality.confidence,
      accuracyMeters: feature06000.quality.accuracyMeters,
      bounds: geometryBounds(feature06000.geometry),
      noticeText,
      mapCanvas: canvasBox,
      renderStats,
      clearedRenderStats,
      reSearchRenderStats,
      clearVerified: true,
      reSearch01000Verified: secondNoticeText.includes('postal-mx-01000') && secondNoticeText.includes('mx-derived-01000'),
      noMatch00000Verified: true,
      postalRequests: evidence.postalRequests,
      resourceFailures: evidence.resourceFailures,
      postalContextFailures,
      consoleErrors: evidence.consoleErrors,
      consoleWarnings: evidence.consoleWarnings,
    },
    screenshot: {
      path: `reports/postal-context-m2/${screenshotPath.split(/[\\/]/).at(-1)}`,
      bytes: screenshotBytes.byteLength,
      sha256: createHash('sha256').update(screenshotBytes).digest('hex'),
    },
    verdict: postalContextFailures.length ? 'fail' : 'pass',
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
}
