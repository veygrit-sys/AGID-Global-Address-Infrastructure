import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3037';
const reportPath = process.argv[3];
const screenshotPath = process.argv[4];
if (!reportPath || !screenshotPath) {
  throw new Error('usage: verify-postal-context-cv-browser.mjs <base-url> <report-path> <screenshot-path>');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

const search = page.locator('input[type="text"]').first();
await search.waitFor({ state: 'visible', timeout: 20000 });
await search.fill('Praia, Cabo Verde');
const candidate = page.locator('button').filter({ hasText: /Universidade de Cabo Verde/i }).first();
await candidate.waitFor({ state: 'visible', timeout: 30000 });
const selectedCandidateText = (await candidate.innerText()).replace(/\s+/gu, ' ').trim();
await candidate.click();
await page.waitForFunction(() => /\bCV[A-Z0-9]{10}\b/u.test(document.body.innerText), undefined, { timeout: 30000 });
await page.waitForTimeout(3000);

const bodyText = await page.locator('body').innerText();
const agidIds = [...new Set(bodyText.match(/\bCV[A-Z0-9]{10}\b/gu) ?? [])];
const renderedMapCanvasCount = await page.locator('canvas').count();
const postalAreaNoticeCount = await page.getByTestId('postal-area-notice').count();
const frameworkOverlayCount = await page.locator('vite-error-overlay, nextjs-portal').count();
await page.screenshot({ path: screenshotPath, fullPage: true });
const screenshot = readFileSync(screenshotPath);

const apiResponse = await fetch(`${baseUrl}/api/v1/postal/CV/7600?geometry=geojson`);
const apiBody = await apiResponse.json();
const report = {
  schemaVersion: 'postal-context-cv-browser-check/v1',
  countryCode: 'CV',
  browser: 'Chromium via deterministic Playwright fallback',
  manualVisualInspection: false,
  searchQuery: 'Praia, Cabo Verde',
  selectedCandidateText,
  selectedCountryCandidate: /Universidade de Cabo Verde/i.test(selectedCandidateText) && /Palmarejo Grande, Praia, Cabo Verde/i.test(selectedCandidateText),
  liveSearchSource: 'Photon',
  liveSearchNeedsReview: /Needs review/i.test(bodyText),
  nonPostalAgidIds: agidIds,
  bodyTextSample: bodyText.replace(/\s+/gu, ' ').trim().slice(0, 2000),
  renderedAddressContextIsMoreSpecificThanPostcode:
    /Praia/i.test(bodyText) && /(?:Universidade de Cabo Verde|Palmarejo Grande|En3-St-05)/i.test(bodyText),
  renderedMapCanvasCount,
  postalAreaNoticeCount,
  realCvPostalApi: { status: apiResponse.status, body: apiBody },
  postalApiMocked: false,
  realCvPostalAreaVisualized: false,
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

if (!report.selectedCountryCandidate || !report.nonPostalAgidIds.some(id => id.startsWith('CV'))) {
  throw new Error('CV source-qualified address and AGID context was not rendered');
}
if (!report.renderedAddressContextIsMoreSpecificThanPostcode || report.renderedMapCanvasCount < 1) {
  throw new Error('CV detailed address context or map canvas missing');
}
if (report.realCvPostalApi.status !== 503 || report.realCvPostalApi.body?.error !== 'Postal Context pack is unavailable') {
  throw new Error('CV real API did not fail closed while the production pack is absent');
}
if (report.postalAreaNoticeCount !== 0 || report.frameworkOverlayCount !== 0 || report.pageErrors.length) {
  throw new Error('unexpected postal overlay, framework overlay or page error');
}
