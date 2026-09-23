import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'file:///C:/Users/kitau/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import pngjs from 'file:///C:/Users/kitau/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs/lib/png.js';

const geometry = JSON.parse(readFileSync('data/postal_country_packs/uy/postal-context/m2/geometry.json', 'utf8'));
const graph = JSON.parse(readFileSync('data/postal_country_packs/uy/postal-context/m2/graph.json', 'utf8'));
const report = JSON.parse(readFileSync('reports/postal-context-m2/uy-fixed-official-release-2026-09-02.json', 'utf8'));
const feature = geometry.features.find(item => item.nodeId === 'postal-uy-correo-2023-11000');
const postal = graph.nodes.find(item => item.id === feature.nodeId);
const cell = graph.nodes.find(item => item.id === report.idLinkage.sample.agidNodeId);
const output = resolve(process.argv[2] ?? 'reports/postal-context-m2/uy-deterministic-visual-2026-09-02.png');
const receipt = resolve(process.argv[3] ?? 'reports/postal-context-m2/uy-deterministic-visual-2026-09-02.txt');

const ring = feature.geometry.coordinates[0];
const bounds = ring.reduce((value, [x, y]) => [Math.min(value[0], x), Math.min(value[1], y), Math.max(value[2], x), Math.max(value[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
const width = 880; const height = 780; const padding = 70;
const scale = Math.min((width - padding * 2) / (bounds[2] - bounds[0]), (height - padding * 2) / (bounds[3] - bounds[1]));
const path = ring.map(([x, y], index) => `${index ? 'L' : 'M'} ${(padding + (x - bounds[0]) * scale).toFixed(2)} ${(height - padding - (y - bounds[1]) * scale).toFixed(2)}`).join(' ') + ' Z';
const html = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box} body{margin:0;background:#f3f6f4;font:14px/1.45 system-ui;color:#11241b}.shell{display:grid;grid-template-columns:minmax(0,1fr) 430px;height:900px}.map{position:relative;overflow:hidden;background-color:#e7efe9;background-image:linear-gradient(#cfdad2 1px,transparent 1px),linear-gradient(90deg,#cfdad2 1px,transparent 1px);background-size:48px 48px}.map:before{content:'Montevideo · deterministic official polygon view';position:absolute;left:24px;top:20px;background:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 4px 18px #183b2630;z-index:2;font-weight:700}.map svg{width:100%;height:100%}.area{fill:#1683c7;fill-opacity:.24;stroke:#063d61;stroke-width:4;stroke-linejoin:round}.panel{background:#fff;padding:28px;overflow:auto;border-left:1px solid #cad6ce}.eyebrow{color:#256947;text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:800}h1{font-size:32px;margin:5px 0 4px}.tags{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.tag{background:#e7f4ec;color:#175f3c;padding:5px 9px;border-radius:99px;font-weight:700}.status{border-left:5px solid #21835a;background:#eef8f2;padding:12px;margin:16px 0}.id{background:#f4f7f5;border:1px solid #dce5df;border-radius:8px;padding:10px;margin:8px 0;font:12px/1.4 ui-monospace;overflow-wrap:anywhere}.label{font:700 11px system-ui;color:#5e7166;text-transform:uppercase}.warning{background:#fff4d9;border:1px solid #e5c46f;padding:12px;border-radius:8px;margin-top:18px}.controls{display:flex;gap:8px;margin:14px 0}.controls button{padding:8px 12px;border:1px solid #9eb3a7;background:#fff;border-radius:6px}
</style><main class="shell"><section class="map"><svg viewBox="0 0 ${width} ${height}" aria-label="Postal polygon 11000"><path class="area" d="${path}"/></svg></section><aside class="panel"><div class="eyebrow">Uruguay postal context</div><h1>11000</h1><div>${postal.label}</div><div class="tags"><span class="tag">Polygon</span><span class="tag">official source</span><span class="tag">August 2023</span><span class="tag">confidence 0.99</span></div><div class="status" id="status">1件の公式固定リリース面を表示 · boundsへfit済み</div><div class="controls"><button id="clear">解除</button><button id="search">再検索</button><button id="no-match">該当なし</button></div><div class="label">Postal Context ID</div><div class="id">${postal.id}</div><div class="label">Official source feature ID</div><div class="id">cp_id ${report.idLinkage.sample.officialCpId}</div><div class="label">Geometry ID</div><div class="id">${feature.id}</div><div class="label">Country assertion</div><div class="id">${report.idLinkage.sample.countryAssertionId}</div><div class="label">AGID reference node</div><div class="id">${cell.id}</div><div class="label">AGID cell</div><div class="id">${cell.agidCellId}</div><div class="warning">AGIDはポリゴン内部の参照セルであり、郵便区域全体の被覆・住所・建物を意味しません。詳細CPAは公開対象外です。2026年の現行割当・後継版は未確認です。</div></aside></main><script>
const pathEl=document.querySelector('.area'); const status=document.querySelector('#status'); document.querySelector('#clear').onclick=()=>{pathEl.style.display='none';status.textContent='選択を解除しました'}; document.querySelector('#search').onclick=()=>{status.textContent='検索中…';setTimeout(()=>{pathEl.style.display='';status.textContent='1件の公式固定リリース面を表示 · boundsへfit済み'},15)}; document.querySelector('#no-match').onclick=()=>{pathEl.style.display='none';status.textContent='該当する郵便区域はありません'};
</script>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
if (await page.locator('.area').count() !== 1) throw new Error('polygon-layer-missing');
if (!/fit済み/u.test(await page.locator('#status').textContent())) throw new Error('fit-status-missing');
await page.locator('#clear').click(); if (await page.locator('.area').isVisible()) throw new Error('clear-failed');
await page.locator('#search').click(); await page.waitForTimeout(25); if (!(await page.locator('.area').isVisible())) throw new Error('research-failed');
await page.locator('#no-match').click(); if (!/該当/u.test(await page.locator('#status').textContent())) throw new Error('no-match-failed');
await page.locator('#search').click(); await page.waitForTimeout(25);
const screenshot = await page.screenshot({ fullPage: true });
writeFileSync(output, screenshot);
const pixels = pngjs.PNG.sync.read(screenshot);
let blueFillPixels = 0; let darkBoundaryPixels = 0;
for (let index = 0; index < pixels.data.length; index += 4) {
  const red = pixels.data[index]; const green = pixels.data[index + 1]; const blue = pixels.data[index + 2];
  if (blue > red + 25 && blue > green + 5 && red < 190) blueFillPixels += 1;
  if (red < 45 && green < 105 && blue > 65 && blue < 140) darkBoundaryPixels += 1;
}
const audit = await page.evaluate(() => ({ status: document.querySelector('#status')?.textContent, polygonVisible: !!document.querySelector('.area')?.getClientRects().length, fillOpacity: getComputedStyle(document.querySelector('.area')).fillOpacity, strokeWidth: getComputedStyle(document.querySelector('.area')).strokeWidth, postalId: [...document.querySelectorAll('.id')].some(node => node.textContent?.includes('postal-uy-correo-2023-11000')), geometryId: [...document.querySelectorAll('.id')].some(node => node.textContent?.includes('correo-uy-postal-2023-11000')), agidId: [...document.querySelectorAll('.id')].some(node => node.textContent?.includes('UY0FZ5D9368V')) }));
await browser.close();
if (!audit.polygonVisible || audit.fillOpacity !== '0.24' || audit.strokeWidth !== '4px' || !audit.postalId || !audit.geometryId || !audit.agidId || blueFillPixels < 10000 || darkBoundaryPixels < 500) throw new Error(`visual-contract:${JSON.stringify({ audit, blueFillPixels, darkBoundaryPixels })}`);
const result = { ...audit, blueFillPixels, darkBoundaryPixels };
writeFileSync(receipt, `${JSON.stringify({ countryCode: 'UY', samplePostalCode: '11000', mode: 'deterministic-Playwright-fallback-not-real-app', viewport: [1440, 900], actions: ['render', 'fit-status', 'clear', 're-search', 'no-match', 're-search'], audit: result }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result));
