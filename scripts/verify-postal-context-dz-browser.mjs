import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3039';
const reportPath = process.argv[3];
const screenshotPath = process.argv[4];
if (!reportPath || !screenshotPath) throw new Error('usage: verify-postal-context-dz-browser.mjs <base-url> <report-path> <screenshot-path>');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
const search = page.locator('input[type="text"]').first();
await search.waitFor({ state: 'visible', timeout: 20000 });
await search.fill('Algérie Poste, Bab Ezzouar, Algeria');
const candidate = page.locator('button').filter({ hasText: /Bab Ezzouar|Alger|Algérie/i }).first();
await candidate.waitFor({ state: 'visible', timeout: 30000 });
const selectedCandidateText = (await candidate.innerText()).replace(/\s+/gu, ' ').trim();
await candidate.click();
await page.waitForFunction(() => /\bDZ[A-Z0-9]{10}\b/u.test(document.body.innerText), undefined, { timeout: 30000 });
await page.waitForTimeout(3000);
const bodyText = await page.locator('body').innerText();
const agidIds = [...new Set(bodyText.match(/\bDZ[A-Z0-9]{10}\b/gu) ?? [])];
const renderedMapCanvasCount = await page.locator('canvas').count();
const postalAreaNoticeCount = await page.getByTestId('postal-area-notice').count();
const frameworkOverlayCount = await page.locator('vite-error-overlay, nextjs-portal').count();
await page.screenshot({ path: screenshotPath, fullPage: true });
const screenshot = readFileSync(screenshotPath);
const apiResponse = await fetch(`${baseUrl}/api/v1/postal/DZ/16024?geometry=geojson`);
const apiBody = await apiResponse.json();
const report = {
  schemaVersion: 'postal-context-dz-browser-check/v1', countryCode: 'DZ',
  browser: 'Chromium via deterministic Playwright fallback', manualVisualInspection: false,
  searchQuery: 'Algérie Poste, Bab Ezzouar, Algeria', selectedCandidateText,
  selectedCountryCandidate: /Alger|Algérie|Bab Ezzouar/i.test(selectedCandidateText), liveSearchSource: 'Photon',
  liveSearchNeedsReview: /Needs review/i.test(bodyText), nonPostalAgidIds: agidIds,
  bodyTextSample: bodyText.replace(/\s+/gu, ' ').trim().slice(0, 2600),
  renderedAddressContextIsMoreSpecificThanPostcode: /Bab Ezzouar|Alger|Algérie/i.test(bodyText) && /(?:Rue|Route|Boulevard|street|road|voie|building|place)/i.test(bodyText),
  renderedMapCanvasCount, postalAreaNoticeCount,
  realDzPostalApi: { status: apiResponse.status, body: apiBody }, postalApiMocked: false,
  realDzPostalAreaVisualized: false, frameworkOverlayCount, pageErrors,
  screenshot: { path: screenshotPath, bytes: screenshot.length, sha256: createHash('sha256').update(screenshot).digest('hex') },
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (!report.selectedCountryCandidate || !report.nonPostalAgidIds.some(id => id.startsWith('DZ'))) throw new Error('DZ source-qualified result and AGID context not rendered');
if (!report.renderedAddressContextIsMoreSpecificThanPostcode) throw new Error('DZ detailed address context missing');
if (report.renderedMapCanvasCount < 1) throw new Error('DZ map canvas missing');
if (report.realDzPostalApi.status < 400) throw new Error('DZ real API unexpectedly returned production data');
if (report.postalAreaNoticeCount !== 0 || report.frameworkOverlayCount !== 0 || report.pageErrors.length) throw new Error('unexpected postal overlay or page error');
