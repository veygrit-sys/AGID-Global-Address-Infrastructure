import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3038';
const reportPath = process.argv[3];
const screenshotPath = process.argv[4];
if (!reportPath || !screenshotPath) throw new Error('usage: verify-postal-context-dj-browser.mjs <base-url> <report-path> <screenshot-path>');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
const search = page.locator('input[type="text"]').first();
await search.waitFor({ state: 'visible', timeout: 20000 });
await search.fill('La Poste de Djibouti, Djibouti');
const candidate = page.locator('button').filter({ hasText: /Djibouti/i }).first();
await candidate.waitFor({ state: 'visible', timeout: 30000 });
const selectedCandidateText = (await candidate.innerText()).replace(/\s+/gu, ' ').trim();
await candidate.click();
await page.waitForFunction(() => /\bDJ[A-Z0-9]{10}\b/u.test(document.body.innerText), undefined, { timeout: 30000 });
await page.waitForTimeout(3000);
const bodyText = await page.locator('body').innerText();
const agidIds = [...new Set(bodyText.match(/\bDJ[A-Z0-9]{10}\b/gu) ?? [])];
const renderedMapCanvasCount = await page.locator('canvas').count();
const postalAreaNoticeCount = await page.getByTestId('postal-area-notice').count();
const frameworkOverlayCount = await page.locator('vite-error-overlay, nextjs-portal').count();
await page.screenshot({ path: screenshotPath, fullPage: true });
const screenshot = readFileSync(screenshotPath);
const apiResponse = await fetch(`${baseUrl}/api/v1/postal/DJ/77101?geometry=geojson`);
const apiBody = await apiResponse.json();
const report = {
  schemaVersion: 'postal-context-dj-browser-check/v1', countryCode: 'DJ',
  browser: 'Chromium via deterministic Playwright fallback', manualVisualInspection: false,
  searchQuery: 'La Poste de Djibouti, Djibouti', selectedCandidateText,
  selectedCountryCandidate: /Djibouti/i.test(selectedCandidateText), liveSearchSource: 'Photon',
  liveSearchNeedsReview: /Needs review/i.test(bodyText), nonPostalAgidIds: agidIds,
  bodyTextSample: bodyText.replace(/\s+/gu, ' ').trim().slice(0, 2400),
  renderedAddressContextIsMoreSpecificThanPostcode: /Djibouti/i.test(bodyText) && /(?:La Poste|Boulevard|street|road|voie|Republic)/i.test(bodyText),
  renderedMapCanvasCount, postalAreaNoticeCount,
  realDjPostalApi: { status: apiResponse.status, body: apiBody }, postalApiMocked: false,
  realDjPostalAreaVisualized: false, frameworkOverlayCount, pageErrors,
  screenshot: { path: screenshotPath, bytes: screenshot.length, sha256: createHash('sha256').update(screenshot).digest('hex') },
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (!report.selectedCountryCandidate || !report.nonPostalAgidIds.some(id => id.startsWith('DJ'))) throw new Error('DJ source-qualified result and AGID context not rendered');
if (report.renderedMapCanvasCount < 1) throw new Error('DJ map canvas missing');
if (report.realDjPostalApi.status !== 404 || report.realDjPostalApi.body?.error !== 'Postal Context country is not supported') throw new Error('DJ real API did not fail closed');
if (report.postalAreaNoticeCount !== 0 || report.frameworkOverlayCount !== 0 || report.pageErrors.length) throw new Error('unexpected postal overlay or page error');
