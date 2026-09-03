import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl=process.argv[2]??'http://127.0.0.1:3035';
const reportPath=process.argv[3]; const screenshotPath=process.argv[4];
if(!reportPath||!screenshotPath) throw new Error('usage: verify-postal-context-ci-browser.mjs <base-url> <report-path> <screenshot-path>');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[]; page.on('pageerror',error=>pageErrors.push(String(error)));
await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
const search=page.locator('input[type="text"]').first();
await search.waitFor({state:'visible',timeout:20000});
await search.fill("Abidjan, Côte d'Ivoire");
const candidate=page.locator('button').filter({hasText:/Abidjan/i,hasNotText:/(Ambassade|Embassy|Paris|France|Canada)/i}).first();
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
const apiResponse=await fetch(`${baseUrl}/api/v1/postal/CI/06?geometry=geojson`);
const apiBody=await apiResponse.json();
const report={
 schemaVersion:'postal-context-ci-browser-check/v1',countryCode:'CI',
 browser:'Chromium via deterministic Playwright fallback',manualVisualInspection:false,
 searchQuery:"Abidjan, Côte d'Ivoire",selectedCandidateText,
 selectedCountryCandidate:/Abidjan/i.test(selectedCandidateText)&&/(Côte d.?Ivoire|Cote d.?Ivoire|Ivory Coast)/i.test(selectedCandidateText)&&!/(Ambassade|Embassy|Paris|France|Canada)/i.test(selectedCandidateText),
 nonPostalAgidIds:agidIds,bodyTextSample:bodyText.replace(/\s+/gu,' ').trim().slice(0,2000),
 renderedAddressContextIsMoreSpecificThanCountry:/Abidjan/i.test(bodyText),
 renderedMapCanvasCount,postalAreaNoticeCount,
 realCiPostalApi:{status:apiResponse.status,body:apiBody},postalApiMocked:false,
 realCiPostalAreaVisualized:false,frameworkOverlayCount,pageErrors,
 screenshot:{path:screenshotPath,bytes:screenshot.length,sha256:createHash('sha256').update(screenshot).digest('hex')},
};
writeFileSync(reportPath,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2)); await browser.close();
if(!report.selectedCountryCandidate||!report.nonPostalAgidIds.some(id=>id.startsWith('CI'))||!report.renderedAddressContextIsMoreSpecificThanCountry) throw new Error('CI detailed address context was not rendered');
if(report.renderedMapCanvasCount<1) throw new Error('map canvas missing');
if(report.realCiPostalApi.status!==404||report.realCiPostalApi.body?.error!=='Postal Context country is not supported') throw new Error('CI API did not fail closed');
if(report.postalAreaNoticeCount!==0||report.frameworkOverlayCount!==0||report.pageErrors.length) throw new Error('unexpected UI overlay or page error');
