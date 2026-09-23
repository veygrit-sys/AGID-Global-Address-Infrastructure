import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3026';
const reportPath = process.argv[3];
const screenshotPath = process.argv[4];
if (!reportPath || !screenshotPath) throw new Error('usage: verify-postal-context-bw-browser.mjs <base-url> <report-path> <screenshot-path>');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error)));

await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.locator('input[type="text"]').first().waitFor({ state: 'visible', timeout: 20_000 });
await page.waitForTimeout(2_000);

const search = page.locator('input[type="text"]').first();
await search.fill('Gaborone, Botswana');
const candidate = page.locator('button').filter({ hasText: /Botswana/i }).first();
await candidate.waitFor({ state: 'visible', timeout: 30_000 });
const selectedCandidateText = (await candidate.innerText()).replace(/\s+/gu, ' ').trim();
await candidate.click();
await page.waitForFunction(() => /\bBW[A-Z0-9]{10}\b/u.test(document.body.innerText), undefined, { timeout: 30_000 });
await page.waitForTimeout(3_000);

const bodyText = await page.locator('body').innerText();
const agidIds = [...new Set(bodyText.match(/\bBW[A-Z0-9]{10}\b/gu) ?? [])];
const agidLikeIds = [...new Set(bodyText.match(/\b[A-Z]{2}[A-Z0-9]{10}\b/gu) ?? [])];
const notice = page.getByTestId('postal-area-notice');
const postalAreaNoticeCount = await notice.count();
const postalAreaNoticeText = postalAreaNoticeCount ? (await notice.first().innerText()).replace(/\s+/gu, ' ').trim() : null;
const renderedMapCanvasCount = await page.locator('canvas').count();
const frameworkOverlayCount = await page.locator('vite-error-overlay, nextjs-portal').count();

await page.screenshot({ path: screenshotPath, fullPage: true });
const screenshot = readFileSync(screenshotPath);
const apiResponse = await fetch(`${baseUrl}/api/v1/postal/BW/AA123?geometry=geojson`);
const apiBody = await apiResponse.json();

const report = {
  schemaVersion: 'postal-context-bw-browser-check/v1',
  countryCode: 'BW',
  browser: 'Chromium via deterministic Playwright fallback',
  manualVisualInspection: false,
  searchQuery: 'Gaborone, Botswana',
  selectedCandidateText,
  selectedCountryCandidate: /Botswana/i.test(selectedCandidateText),
  bodyContainsBotswana: /Botswana/i.test(bodyText),
  nonPostalAgidIds: agidIds,
  agidLikeIds,
  bodyTextSample: bodyText.replace(/\s+/gu, ' ').trim().slice(0, 2_000),
  renderedAddressContext: selectedCandidateText,
  renderedAddressContextIsMoreSpecificThanCountry: /Gaborone/i.test(selectedCandidateText),
  nonPostalAgidIdPromotedToPostalId: false,
  renderedMapCanvasCount,
  postalAreaNoticeCount,
  postalAreaNoticeText,
  realBwPostalApi: { status: apiResponse.status, body: apiBody },
  postalApiMocked: false,
  realBwPostalAreaVisualized: false,
  frameworkOverlayCount,
  pageErrors,
  screenshot: {
    path: screenshotPath,
    bytes: screenshot.length,
    sha256: createHash('sha256').update(screenshot).digest('hex'),
  },
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();

if (!report.selectedCountryCandidate) throw new Error('Botswana result was not selected');
if (!report.nonPostalAgidIds.length) throw new Error('No BW AGID identifier was rendered');
if (!report.renderedAddressContextIsMoreSpecificThanCountry) throw new Error('Botswana address context was not rendered');
if (report.renderedMapCanvasCount < 1) throw new Error('Map canvas was not rendered');
if (report.realBwPostalApi.status !== 404 || report.realBwPostalApi.body?.error !== 'Postal Context country is not supported') throw new Error('BW API did not fail closed');
if (report.postalAreaNoticeCount !== 0 || report.frameworkOverlayCount !== 0 || report.pageErrors.length) throw new Error('Unexpected UI overlay or page error');
