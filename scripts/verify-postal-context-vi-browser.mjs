import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3026/';
const reportPath = process.argv[3] ?? 'reports/postal-context-m2/vi-browser-validation-2026-09-03.json';
const appScreenshotPath = process.argv[4] ?? 'reports/postal-context-m2/vi-actual-app-unavailable-2026-09-03.png';
const polygonScreenshotPath = process.argv[5] ?? 'reports/postal-context-m2/vi-derived-polygon-visual-2026-09-03.png';
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const sha256 = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const geometry = await readJson('data/postal_country_packs/vi/postal-context/m2/geometry.json');
const graph = await readJson('data/postal_country_packs/vi/postal-context/m2/graph.json');
const sourceReport = await readJson('reports/postal-context-m2/vi-zcta-validation-2026-09-03.json');
const browser = await chromium.launch({ headless: true });

let actualApp;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const postalRequests = [];
  page.on('response', response => {
    if (/\/api\/v1\/postal\/VI\//u.test(response.url())) postalRequests.push({ url: response.url(), status: response.status() });
  });
  await page.route('**/nominatim.openstreetmap.org/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/photon.komoot.io/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"features":[]}' }));
  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(3_000);
  const inputs = await page.locator('input').evaluateAll(elements => elements.map(element => ({
    placeholder: element.getAttribute('placeholder'),
    ariaLabel: element.getAttribute('aria-label'),
    type: element.getAttribute('type'),
  })));
  const selectCount = await page.locator('select').count();
  const selectIndex = await page.locator('select').evaluateAll(elements => elements.findIndex(element => [...element.options].some(option => option.value === 'VI')));
  const postcodeIndex = inputs.findIndex(item => /postal|postcode|zip|郵便/iu.test(`${item.placeholder ?? ''} ${item.ariaLabel ?? ''}`));
  let interaction = 'controls-not-found';
  if (selectIndex >= 0 && postcodeIndex >= 0) {
    await page.locator('select').nth(selectIndex).selectOption('VI');
    await page.locator('input').nth(postcodeIndex).fill('00802');
    const searchButton = page.getByRole('button', { name: /検索|search/iu }).first();
    await searchButton.click();
    await page.waitForTimeout(2_000);
    await searchButton.click();
    await page.waitForTimeout(2_000);
    interaction = 'searched-twice';
  }
  const bodyText = await page.locator('body').innerText();
  const canvasCount = await page.locator('canvas').count();
  const unavailableVisible = /POSTAL AREA UNAVAILABLE|Postal Context APIへ接続できません|推定ポリゴンは表示していません/iu.test(bodyText);
  await page.screenshot({ path: appScreenshotPath, fullPage: true });
  actualApp = {
    appHttpStatus: response?.status() ?? null,
    interaction,
    inputs,
    selectCount,
    bodyTextExcerpt: bodyText.slice(0, 2000),
    postalRequests,
    unavailableVisible,
    canvasCount,
    polygonDetailLabels: (bodyText.match(/Polygon|MultiPolygon/gu) ?? []).length,
    screenshot: appScreenshotPath,
  };
  await page.close();
} catch (error) {
  actualApp = { error: String(error), postalRequests: [], unavailableVisible: false, canvasCount: 0, polygonDetailLabels: 0 };
}

const visual = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await visual.setContent(`<!doctype html><meta charset="utf-8"><title>AGID VI Postal Context</title>
<style>
body{margin:0;font:15px system-ui;background:#eef3f8;color:#142033}main{display:grid;grid-template-columns:390px 1fr;min-height:100vh}.panel{padding:28px;background:#fff;border-right:1px solid #cad6e2}.map{position:relative;padding:28px;background:linear-gradient(#dcebf3,#eef7fb)}h1{font-size:22px;margin:0 0 8px}.sub{color:#52657a;font-size:13px}label{display:block;font-weight:700;margin-top:22px}input,button{font:inherit;padding:11px;border-radius:8px;border:1px solid #aab8c7}input{width:210px}button{margin-left:8px;background:#075985;color:white;border-color:#075985}.clear{background:#fff;color:#334155}.state{margin:16px 0;padding:12px;border-radius:8px;background:#e0f2fe}.card{margin-top:14px;padding:14px;border:1px solid #d4dee8;border-radius:10px;background:#f8fafc}.row{display:grid;grid-template-columns:125px 1fr;gap:8px;margin:7px 0}.id{font:12px ui-monospace,monospace;overflow-wrap:anywhere}.warn{color:#9a3412}svg{width:100%;height:760px;border:1px solid #a4b5c5;border-radius:12px;background:#e7f3f7}.grid{stroke:#c7d9e2;stroke-width:.5}.area{fill:rgba(14,165,233,.38);stroke:#0f172a;stroke-width:1.8;vector-effect:non-scaling-stroke}.badge{position:absolute;top:48px;left:48px;background:#fff;padding:10px 12px;border-radius:8px;box-shadow:0 2px 12px #64748b55;font-weight:700}
</style><main><section class="panel"><h1>VI Postal Context research</h1><div class="sub">Fixed Census 2020 ZCTA validation surfaces · not current USPS delivery boundaries</div><label for="q">郵便番号</label><div><input id="q" value="00802"><button id="search">検索</button><button id="clear" class="clear">解除</button></div><div id="state" class="state">検索してください</div><div id="details"></div></section><section class="map"><div class="badge" id="badge">NO AREA SELECTED</div><svg viewBox="0 0 1000 760" id="svg"><g id="grid"></g><g id="areas"></g></svg></section></main>`);

const payload = {
  features: geometry.features,
  nodes: graph.nodes,
  assertions: graph.assertions,
  releaseId: graph.release.releaseId,
  idRows: sourceReport.idLinkage.recordsDetail,
};
await visual.evaluate(data => {
  const svgNs = 'http://www.w3.org/2000/svg';
  const grid = document.querySelector('#grid');
  for (let x = 0; x <= 1000; x += 100) { const line = document.createElementNS(svgNs, 'line'); line.setAttribute('x1', x); line.setAttribute('x2', x); line.setAttribute('y1', 0); line.setAttribute('y2', 760); line.setAttribute('class', 'grid'); grid.append(line); }
  for (let y = 0; y <= 760; y += 95) { const line = document.createElementNS(svgNs, 'line'); line.setAttribute('x1', 0); line.setAttribute('x2', 1000); line.setAttribute('y1', y); line.setAttribute('y2', y); line.setAttribute('class', 'grid'); grid.append(line); }
  const ringsOf = geometry => geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
  const draw = code => {
    const matches = data.features.filter(feature => feature.nodeId.endsWith(code));
    const state = document.querySelector('#state'); const details = document.querySelector('#details'); const areas = document.querySelector('#areas'); const badge = document.querySelector('#badge');
    areas.replaceChildren(); details.replaceChildren();
    if (!matches.length) { state.textContent = `該当なし: ${code}`; badge.textContent = 'NO MATCH'; return; }
    if (matches.length > 1) { state.textContent = `複数候補: ${matches.length}件`; badge.textContent = 'MULTIPLE'; return; }
    const feature = matches[0]; const node = data.nodes.find(item => item.id === feature.nodeId); const idRow = data.idRows.find(item => item.postalCode === code); const assertions = data.assertions.filter(item => item.fromNodeId === feature.nodeId);
    const rings = ringsOf(feature.geometry); const points = rings.flat(); const xs = points.map(point => point[0]); const ys = points.map(point => point[1]); const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys); const scale = Math.min(900 / (maxX - minX), 660 / (maxY - minY)); const ox = 500 - ((minX + maxX) / 2) * scale; const oy = 380 + ((minY + maxY) / 2) * scale;
    for (const ring of rings) { const path = document.createElementNS(svgNs, 'path'); path.setAttribute('d', ring.map((point, index) => `${index ? 'L' : 'M'}${point[0] * scale + ox},${-point[1] * scale + oy}`).join(' ') + ' Z'); path.setAttribute('class', 'area'); areas.append(path); }
    state.textContent = `表示中: ${code} · ${feature.geometry.type} · derived · confidence ${feature.quality.confidence}`; badge.textContent = `${code} · FITTED AREA`;
    const rows = [
      ['Postal Context ID', feature.nodeId], ['Geometry ID', feature.id], ['Census GEOID', idRow.censusGeoid], ['Census OID', idRow.censusOid], ['Census OBJECTID', String(idRow.censusObjectId)], ['Country assertion', idRow.countryAssertionId], ['AGID assertion', idRow.agidAssertionId ?? 'withheld'], ['AGID cell', idRow.agidCellId ?? `withheld (${idRow.computedAgidCellId} prefix mismatch)`], ['Release ID', data.releaseId], ['Geometry', feature.geometry.type], ['Provenance', feature.source.sourceType], ['Source date', feature.source.sourceDate], ['Source', feature.source.sourceId], ['Label', node.label], ['Address/building relation', 'none']
    ];
    const card = document.createElement('div'); card.className = 'card'; for (const [label, value] of rows) { const row = document.createElement('div'); row.className = 'row'; row.innerHTML = `<strong>${label}</strong><span class="id">${value}</span>`; card.append(row); } details.append(card);
    if (!assertions.length) throw new Error('missing assertions');
  };
  document.querySelector('#search').addEventListener('click', () => draw(document.querySelector('#q').value.trim()));
  document.querySelector('#clear').addEventListener('click', () => { document.querySelector('#areas').replaceChildren(); document.querySelector('#details').replaceChildren(); document.querySelector('#state').textContent = '解除済み'; document.querySelector('#badge').textContent = 'NO AREA SELECTED'; });
}, payload);

await visual.locator('#search').click();
await visual.waitForSelector('text=表示中: 00802');
const firstAreaPaths = await visual.locator('path.area').count();
const detailsText = await visual.locator('#details').innerText();
await visual.locator('#clear').click();
const afterClearPaths = await visual.locator('path.area').count();
await visual.locator('#q').fill('00830');
await visual.locator('#search').click();
await visual.waitForSelector('text=prefix mismatch');
const withheldMismatchVisible = await visual.getByText(/withheld \(VG0ETQRJZKGQ prefix mismatch\)/u).isVisible();
await visual.locator('#q').fill('00802');
await visual.locator('#search').click();
await visual.waitForSelector('text=表示中: 00802');
await visual.screenshot({ path: polygonScreenshotPath, fullPage: true });
const translucentFill = await visual.locator('path.area').first().evaluate(element => getComputedStyle(element).fill);
const clearBoundary = await visual.locator('path.area').first().evaluate(element => getComputedStyle(element).stroke);
const appScreenshot = await readFile(appScreenshotPath).catch(() => null);
const polygonScreenshot = await readFile(polygonScreenshotPath);

const report = {
  schemaVersion: 'postal-context-vi-browser-validation/v1',
  countryCode: 'VI',
  generatedAt: '2026-09-02T18:08:57.070Z',
  browserMode: 'deterministic-playwright-fallback-after-in-app-browser-windows-acl-failure',
  actualApp: {
    ...actualApp,
    realPostalApiSupported: actualApp.postalRequests.some(item => item.status === 200),
    realViAreaVisualized: false,
    screenshotDigest: appScreenshot ? sha256(appScreenshot) : null,
    screenshotBytes: appScreenshot?.length ?? 0,
  },
  derivedGeometryVisual: {
    realSourceGeometry: true,
    syntheticGeometry: false,
    selectedPostalCode: '00802',
    firstAreaPaths,
    afterClearPaths,
    reSearchSucceeded: await visual.getByText(/表示中: 00802/u).isVisible(),
    fitSucceeded: await visual.getByText(/00802 · FITTED AREA/u).isVisible(),
    translucentFill,
    clearBoundary,
    detailedIdsVisible: ['postal-vi-census-zcta-00802', 'census-vi-zcta-2020-00802', '221704258615104', '23557', 'VI0ETQS7G4ZH'].every(value => detailsText.includes(value)),
    withheldMismatchVisible,
    screenshot: polygonScreenshotPath,
    screenshotDigest: sha256(polygonScreenshot),
    screenshotBytes: polygonScreenshot.length,
  },
  claims: {
    manualLiveVisualInspection: false,
    inAppBrowserNavigated: false,
    deterministicRenderVerified: true,
    m2Achieved: false,
  },
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();
