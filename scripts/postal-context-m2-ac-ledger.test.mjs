import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ac = ledger.countries.find(country => country.countryCode === 'AC');
const ao = ledger.countries.find(country => country.countryCode === 'AO');
const manifest = readJson('data/postal_country_packs/ac/postal-context/repository-manifest.json');
const build = readJson('reports/postal-context-m2/ac-current-whole-territory-2026-09-03.json');
const validation = readJson('reports/postal-context-m2/ac-validation-2026-09-03.json');
const browser = readJson('reports/postal-context-m2/ac-browser-validation-2026-09-03.json');
const paths = [
  'data/postal_country_packs/ac/postal-context/m2/descriptor.json',
  'data/postal_country_packs/ac/postal-context/m2/graph.json',
  'data/postal_country_packs/ac/postal-context/m2/geometry.json',
  'data/postal_country_packs/ac/postal-context/repository-manifest.json',
  'data/postal_country_packs/ac/postal-context/source-profile.json',
  'data/postal_country_packs/ac/postal-context/M2-SOURCE-NOTICE.md',
  'reports/postal-context-m2/ac-current-whole-territory-2026-09-03.json',
  'reports/postal-context-m2/ac-validation-2026-09-03.json',
  'reports/postal-context-m2/ac-browser-validation-2026-09-03.json',
  'reports/postal-context-m2/ac-browser-visual-2026-09-03.png',
  'reports/postal-context-m2/ac-browser-cleared-2026-09-03.png',
  'docs/postal-context-ascension-island-m2.md',
];
const bytes = paths.map(path => readFileSync(new URL(path, root)));

test('AC satisfies only its current UPU whole-territory derived-display definition', () => {
  assert.equal(ac.status, 'm2_verified'); assert.equal(ac.attempts, 1); assert.equal(ac.blocker, null);
  assert.equal(ac.evidence.criterionSatisfied, true); assert.equal(ac.evidence.synthetic, false);
  assert.equal(ac.m2Definition.id, 'M2_current_upu_whole_territory_derived_visualization');
  assert.ok(manifest.promotion.stages.some(stage => stage.id === ac.m2Definition.id));
});

test('AC pins all artifacts to the immutable evidence commit with matching bytes and digests', () => {
  assert.deepEqual(ac.evidence.artifacts.map(item => item.digest), bytes.map(digest));
  assert.deepEqual(ac.evidence.artifacts.map(item => item.bytes), bytes.map(item => item.byteLength));
  assert.ok(ac.evidence.artifacts.every(item => item.url.includes('/blob/baf75c19ad3ffd50bd6c86e7f6f2874b70aa409d/')));
});

test('AC preserves official assignment, derived geometry and territory identity boundaries', () => {
  assert.equal(build.officialPostalEvidence.postalCode, 'ASCN 1ZZ');
  assert.equal(build.officialPostalEvidence.geometryAuthority, 'none');
  assert.equal(build.transformation.outputMultiPolygons, 2); assert.equal(build.transformation.areaDeltaSquareMetres, 0);
  assert.equal(build.policy.outputProvenance, 'derived'); assert.equal(build.policy.shnIdentityMergedIntoAc, false);
  assert.equal(validation.geometry.positions, 1261); assert.equal(validation.privacyAndAuthority.addresses, 0);
});

test('AC actual app uses live Postal API and exposes detailed IDs without a human-visual claim', () => {
  assert.equal(browser.observed.lookupStatus, 'unique');
  assert.deepEqual(browser.observed.postalResponses.map(item => item.status), [200, 200, 200]);
  assert.equal(browser.observed.mapCanvasMounted, true); assert.equal(browser.observed.clearVerified, true);
  assert.equal(browser.observed.reSearchVerified, true); assert.equal(browser.visual.manualHumanVisualInspection, false);
  for (const id of ['postal-ac-ascn-1zz', 'country-ac', 'geoboundaries-ac-2021-ascn-1zz-surface-1', 'upu-ac-20260820-ascn-1zz-admin-within-ac']) {
    assert.ok(browser.observed.noticeText.includes(id), id);
  }
});

test('AC completion advances one country to Angola', () => {
  assert.equal(digest(bytes[6]), ac.lastAttempt.reportDigest);
  assert.equal(digest(bytes[7]), ac.lastAttempt.engineeringReportDigest);
  assert.equal(digest(bytes[8]), ac.lastAttempt.browserReportDigest);
  assert.equal(ao.status, 'pending'); assert.equal(ao.attempts, 0);
});
