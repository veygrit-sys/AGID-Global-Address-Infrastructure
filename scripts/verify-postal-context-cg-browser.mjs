import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl=process.argv[2]??'http://127.0.0.1:3034';
const reportPath=process.argv[3]; const screenshotPath=process.argv[4];
if(!reportPath||!screenshotPath) throw new Error('usage: verify-postal-context-cg-browser.mjs <base-url> <report-path> <screenshot-path>');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[]; page.on('pageerror',error=>pageErrors.push(String(error)));
await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
const search=page.locator('input[type="text"]').first();
await search.waitFor({state:'visible',timeout:20000});
await search.fill('Brazzaville, Congo');
const candidate=page.locator('button').filter({hasText:/Brazzaville/i,hasNotText:/(Ambassade|Embassy|Bruxelles|Brussel|Belg)/i}).first();
await candidate.waitFor({state:'visible',timeout:30000});
const selectedCandidateText=(await candidate.innerText()).replace(/\s+/gu,' ').trim();
await candidate.click();
await page.waitForFunction(()=>/\b[A-Z]{2}[A-Z0-9]{10}\b/u.test(document.body.innerText),undefined,{timeout:30000});
await page.waitForTimeout(3000);
const bodyText=await page.locator('body').innerText();
const agidIds=[...new Set(bodyText.match(/\b[A-Z]{2}[A-Z0-9]{10}\b/gu)??[])];
const postalAreaNoticeCount=await page.getByTestId('postal-area-notice').count();
const renderedMapCanvasCount=await page.locator('canvas').count();
const frameworkOverlayCount=await page.locator('vite-error-overlay, nextjs-portal').count();
await page.screenshot({path:screenshotPath,fullPage:true});
const screenshot=readFileSync(screenshotPath);
const apiResponse=await fetch(`${baseUrl}/api/v1/postal/CG/00000?geometry=geojson`);
const apiBody=await apiResponse.json();
const report={
 schemaVersion:'postal-context-cg-browser-check/v1',countryCode:'CG',
 browser:'Chromium via deterministic Playwright fallback',manualVisualInspection:false,
 searchQuery:'Brazzaville, Congo',selectedCandidateText,
 selectedCountryCandidate:/Brazzaville/i.test(selectedCandidateText)&&/(Congo|République)/i.test(selectedCandidateText)&&!/(Ambassade|Embassy|Bruxelles|Brussel|Belg)/i.test(selectedCandidateText),
 nonPostalAgidIds:agidIds,bodyTextSample:bodyText.replace(/\s+/gu,' ').trim().slice(0,2000),
 renderedAddressContextIsMoreSpecificThanCountry:/Brazzaville/i.test(bodyText),
 renderedMapCanvasCount,postalAreaNoticeCount,
 realCgPostalApi:{status:apiResponse.status,body:apiBody},postalApiMocked:false,
 realCgPostalAreaVisualized:false,frameworkOverlayCount,pageErrors,
 screenshot:{path:screenshotPath,bytes:screenshot.length,sha256:createHash('sha256').update(screenshot).digest('hex')},
};
writeFileSync(reportPath,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2)); await browser.close();
if(!report.selectedCountryCandidate||!report.nonPostalAgidIds.some(id=>id.startsWith('CG'))||!report.renderedAddressContextIsMoreSpecificThanCountry) throw new Error('CG detailed address context was not rendered');
if(report.renderedMapCanvasCount<1) throw new Error('map canvas missing');
if(report.realCgPostalApi.status!==404||report.realCgPostalApi.body?.error!=='Postal Context country is not supported') throw new Error('CG API did not fail closed');
if(report.postalAreaNoticeCount!==0||report.frameworkOverlayCount!==0||report.pageErrors.length) throw new Error('unexpected UI overlay or page error');
