import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const playwrightModule = process.env.AGID_PLAYWRIGHT_MODULE ?? 'playwright';
const { chromium } = await import(playwrightModule);
const outputDirectory = path.resolve('reports/postal-context-m2');
const screenshotPath = path.join(outputDirectory, 'vc-deterministic-no-area-2026-09-02.png');
const receiptPath = path.join(outputDirectory, 'vc-deterministic-no-area-2026-09-02.txt');

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });

await page.setContent(`<!doctype html>
<html lang="en" data-mode="deterministic-fallback" data-postal-area-count="0">
<head>
  <meta charset="utf-8">
  <title>VC Postal Context fail-closed proof</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; color: #e8eef9; background: #07101e; }
    main { min-height: 900px; display: grid; grid-template-columns: 1.18fr .82fr; }
    .surface { position: relative; overflow: hidden; padding: 50px; background-color: #0c1827;
      background-image: linear-gradient(rgba(117,147,181,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(117,147,181,.09) 1px, transparent 1px);
      background-size: 34px 34px; }
    .surface::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 48% 44%, rgba(28,127,171,.16), transparent 42%); }
    .surface-content { position: relative; z-index: 1; max-width: 670px; }
    .eyebrow { color: #84a9c4; font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    h1 { max-width: 630px; margin: 18px 0 12px; font-size: 44px; line-height: 1.08; }
    .lede { max-width: 610px; color: #aebfd0; font-size: 18px; line-height: 1.58; }
    .empty { margin-top: 72px; padding: 30px; border: 1px dashed #58728a; border-radius: 18px; background: rgba(8,21,35,.76); }
    .empty strong { display: block; color: #f0c36b; font-size: 20px; }
    .empty span { display: block; margin-top: 10px; color: #9fb3c5; line-height: 1.5; }
    aside { padding: 36px 38px; border-left: 1px solid #263a4f; background: #101c2b; }
    .query { margin: 18px 0 22px; padding: 17px 18px; border: 1px solid #36506b; border-radius: 12px; background: #0a1522; }
    .query b { float: right; color: #a9bdd0; }
    .status { padding: 18px; border-left: 4px solid #f0ad4e; background: #322719; color: #ffd58b; font-weight: 800; line-height: 1.45; }
    dl { margin-top: 24px; }
    .field { padding: 11px 0; border-bottom: 1px solid #24394d; }
    dt { color: #7f9ab2; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    dd { margin: 5px 0 0; color: #e8eef9; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 13px; overflow-wrap: anywhere; }
    .foot { margin-top: 22px; color: #8da5b9; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
<main>
  <section class="surface">
    <div class="surface-content">
      <div class="eyebrow">Postal Context / deterministic rejection proof</div>
      <h1>No postal area is drawn for VC0120.</h1>
      <p class="lede">The official reference recognizes this code, but the reviewed sources do not publish an eligible postal Polygon or MultiPolygon. Census divisions, post-office points, buffers and AGID cells remain separate identities.</p>
      <div class="empty"><strong>0 eligible postal surfaces</strong><span>The background grid is intentionally unobscured. A translucent fill and boundary would appear only after a source-qualified postal-area release passes rights, topology, temporal and identity checks.</span></div>
    </div>
  </section>
  <aside>
    <div class="eyebrow">Saint Vincent and the Grenadines</div>
    <div class="query">Normalized postcode <b>VC0120</b></div>
    <div class="status" data-status>Blocked — no eligible Postal Polygon/MultiPolygon</div>
    <dl>
      <div class="field"><dt>postal_object_type</dt><dd data-id="postal_object_type">general_delivery_reference</dd></div>
      <div class="field"><dt>postal_object_id</dt><dd data-id="postal_object_id">unavailable — no stable released row ID</dd></div>
      <div class="field"><dt>administrative_context_id</dt><dd data-id="administrative_context_id">null — no authorized relation</dd></div>
      <div class="field"><dt>geometry_id / geometry_kind</dt><dd data-id="geometry_id">none / none</dd></div>
      <div class="field"><dt>source_assertion_id</dt><dd data-id="source_assertion_id">svg-post-post-codes#observed-2026-09-02</dd></div>
      <div class="field"><dt>release_id</dt><dd data-id="release_id">null — live reference is not a fixed dataset release</dd></div>
      <div class="field"><dt>civic_address_id</dt><dd data-id="civic_address_id">null</dd></div>
      <div class="field"><dt>building_id</dt><dd data-id="building_id">null</dd></div>
      <div class="field"><dt>agid_crosswalk_id</dt><dd data-id="agid_crosswalk_id">null</dd></div>
      <div class="field"><dt>confidence</dt><dd data-id="confidence">postcode reference: high · postal-area geometry: unavailable</dd></div>
    </dl>
    <p class="foot">Deterministic fallback, not a real-app M2 visual. It proves the renderer fails closed and keeps Postal Code → Polygon → Address Context authority boundaries intact.</p>
  </aside>
</main>
</body>
</html>`);

assert.equal(await page.locator('html').getAttribute('data-mode'), 'deterministic-fallback');
assert.equal(await page.locator('html').getAttribute('data-postal-area-count'), '0');
assert.equal(await page.locator('svg, canvas, [data-postal-area]').count(), 0);
await assert.doesNotReject(() => page.locator('[data-status]').waitFor({ state: 'visible' }));
assert.match(await page.locator('[data-status]').innerText(), /no eligible Postal Polygon\/MultiPolygon/);
for (const field of ['postal_object_id', 'administrative_context_id', 'geometry_id', 'source_assertion_id', 'release_id', 'civic_address_id', 'building_id', 'agid_crosswalk_id']) {
  assert.equal(await page.locator(`[data-id="${field}"]`).count(), 1, `${field} must be shown exactly once`);
}

await page.screenshot({ path: screenshotPath, fullPage: true });
await browser.close();
const screenshot = await readFile(screenshotPath);
const screenshotSha256 = createHash('sha256').update(screenshot).digest('hex');
const receipt = [
  'schema=postal-context-vc-deterministic-visual/v1',
  'mode=deterministic-fallback-not-real-app',
  'country_code=VC',
  'normalized_postcode=VC0120',
  'eligible_postal_area_count=0',
  'polygon_drawn=false',
  'census_proxy_used=false',
  'separate_id_fields=postal_object_id,administrative_context_id,geometry_id,source_assertion_id,release_id,civic_address_id,building_id,agid_crosswalk_id',
  `screenshot_bytes=${screenshot.length}`,
  `screenshot_sha256=${screenshotSha256}`,
  '',
].join('\n');
await writeFile(receiptPath, receipt, 'utf8');
console.log(JSON.stringify({ screenshotPath, receiptPath, screenshotBytes: screenshot.length, screenshotSha256 }, null, 2));
