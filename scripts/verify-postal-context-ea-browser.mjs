import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3040';
const reportPath = process.argv[3];
const screenshotPath = process.argv[4];
if (!reportPath || !screenshotPath) throw new Error('usage: verify-postal-context-ea-browser.mjs <base-url> <report-path> <screenshot-path>');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
const search = page.locator('input[type="text"]').first();
await search.waitFor({ state: 'visible', timeout: 20000 });
await search.fill('51001 Ceuta, Spain');
const candidate = page.locator('button').filter({ hasText: /Ceuta|51001/i }).first();
await candidate.waitFor({ state: 'visible', timeout: 30000 });
const selectedCandidateText = (await candidate.innerText()).replace(/\s+/gu, ' ').trim();
await candidate.click();
await page.waitForFunction(() => /\b[A-Z]{2}[A-Z0-9]{10}\b/u.test(document.body.innerText), undefined, { timeout: 30000 });
await page.waitForTimeout(3000);
const bodyText = await page.locator('body').innerText();
const agidIds = [...new Set(bodyText.match(/\b[A-Z]{2}[A-Z0-9]{10}\b/gu) ?? [])];
const renderedMapCanvasCount = await page.locator('canvas').count();
const postalAreaNoticeCount = await page.getByTestId('postal-area-notice').count();
const frameworkOverlayCount = await page.locator('vite-error-overlay, nextjs-portal').count();
await page.screenshot({ path: screenshotPath, fullPage: true });
const screenshot = readFileSync(screenshotPath);
const apiResponse = await fetch(`${baseUrl}/api/v1/postal/EA/51001?geometry=geojson`);
const apiBody = await apiResponse.json();
const report = {
  schemaVersion: 'postal-context-ea-browser-check/v1',
  countryCode: 'EA',
  browser: 'Chromium via deterministic Playwright fallback',
  manualVisualInspection: false,
  searchQuery: '51001 Ceuta, Spain',
  selectedCandidateText,
  selectedCountryCandidate: /Ceuta|51001/i.test(selectedCandidateText),
  liveSearchSource: 'Photon',
  liveSearchNeedsReview: /Needs review/i.test(bodyText),
  nonPostalAgidIds: agidIds,
  nonPostalAgidPrefixes: [...new Set(agidIds.map(id => id.slice(0, 2)))],
  bodyTextSample: bodyText.replace(/\s+/gu, ' ').trim().slice(0, 2600),
  renderedAddressContextIsMoreSpecificThanPostcode: /Ceuta/i.test(bodyText) && /Spain|España|street|road|avenida|plaza|calle/i.test(bodyText),
  renderedMapCanvasCount,
  postalAreaNoticeCount,
  realEaPostalApi: { status: apiResponse.status, body: apiBody },
  postalApiMocked: false,
  realEaPostalAreaVisualized: false,
  frameworkOverlayCount,
  pageErrors,
  screenshot: {
    path: screenshotPath,
    bytes: screenshot.length,
    sha256: createHash('sha256').update(screenshot).digest('hex'),
  },
};
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (!report.selectedCountryCandidate || report.nonPostalAgidIds.length === 0) throw new Error('EA source-qualified result and AGID context not rendered');
if (!report.renderedAddressContextIsMoreSpecificThanPostcode) throw new Error('EA detailed address context missing');
if (report.renderedMapCanvasCount < 1) throw new Error('EA map canvas missing');
if (report.realEaPostalApi.status !== 503) throw new Error('EA real API did not fail closed as unavailable');
if (report.postalAreaNoticeCount !== 0 || report.frameworkOverlayCount !== 0 || report.pageErrors.length) throw new Error('unexpected postal overlay or page error');
