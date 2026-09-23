import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const read = path => readFileSync(new URL(path, root));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const py = ledger.countries.find(country => country.countryCode === 'PY');
const manifest = readJson('data/postal_country_packs/py/postal-context/repository-manifest.json');
const source = readJson('reports/postal-context-m2/py-source-review-2026-09-02.json');
const build = readJson('reports/postal-context-m2/py-build-2026-09-02.json');
const checks = readJson('reports/postal-context-m2/py-checks-2026-09-02.json');
const artifacts = [
  'data/postal_country_packs/py/postal-context/repository-manifest.json',
  'data/postal_country_packs/py/postal-context/m2/descriptor.json',
  'data/postal_country_packs/py/postal-context/m2/graph.json',
  'data/postal_country_packs/py/postal-context/m2/geometry.json',
  'reports/postal-context-m2/py-source-review-2026-09-02.json',
  'reports/postal-context-m2/py-build-2026-09-02.json',
  'reports/postal-context-m2/py-checks-2026-09-02.json',
  'reports/postal-context-m2/py-visual-001518-2026-09-02.png',
  'docs/postal-context-paraguay-m2.md'
].map(read);

test('PY reaches M2 only under its exact national DINACOPA definition', () => {
  assert.equal(py.status, 'm2_verified');
  assert.equal(py.attempts, 1);
  assert.equal(py.blocker, null);
  assert.equal(py.evidence.criterionSatisfied, true);
  assert.equal(py.evidence.synthetic, false);
  assert.equal(py.m2Definition.id, 'M2_current_national_dinacopa_postal_zone_derived_area_visualization');
  assert.equal(manifest.repository.maturity, 'M2_national_derived_visualization');
});

test('official denominator, detailed identities and reusable rights are fixed', () => {
  assert.equal(source.sourceValidation.features, 8646);
  assert.equal(source.sourceValidation.distinctPostalCodes, 2887);
  assert.equal(source.sourceValidation.codeStructureMismatches, 0);
  assert.equal(source.identityReview.globalCodBarCollapseAllowed, false);
  assert.equal(source.rights.redistributionAndTransformationAllowed, true);
});

test('derived geometry is deterministic, valid and non-fabricated', () => {
  assert.equal(build.geometry.outputProvenance, 'derived');
  assert.equal(build.geometry.outputMultiPolygons, 2887);
  assert.equal(build.geometry.positions, 339723);
  assert.equal(build.geometry.rings, 8058);
  assert.equal(build.geometry.allOgrValid, true);
  assert.equal(build.geometry.inventedAreaRows, 0);
  assert.equal(build.policy.officialPostalGeometryClaimed, false);
});

test('ledger pins every PY artifact to the implementation commit and exact digest', () => {
  const expected = py.evidence.artifacts;
  assert.deepEqual(artifacts.map(digest), expected.map(artifact => artifact.digest));
  assert.deepEqual(artifacts.map(bytes => bytes.byteLength), expected.map(artifact => artifact.bytes));
  assert.ok(expected.every(artifact => artifact.url.includes('/blob/4db0bb649af292e1cb08e872c6411ceadb57dffc/')));
});

test('browser evidence uses the real configured store and records the fallback limit', () => {
  assert.equal(checks.result, 'pass');
  assert.equal(checks.browser.actualConfiguredApiStore, true);
  assert.equal(checks.browser.syntheticFixtureUsed, false);
  assert.equal(checks.browser.deterministicBrowserVisualInspection, true);
  assert.equal(checks.browser.fullAgidViteAppVisualInspection, false);
  assert.equal(checks.browser.openStreetMapRasterTileResponses, 25);
  assert.equal(checks.browser.clearRemovedSourceAndLayers, true);
  assert.equal(checks.browser.researchRestoredSameGeometryAndPaint, true);
  assert.equal(py.evidence.validation.passed, 46);
  assert.equal(py.evidence.validation.failed, 0);
});

test('PY completion advances exactly one country to Suriname', () => {
  assert.equal(digest(read('reports/postal-context-m2/py-source-review-2026-09-02.json')), py.lastAttempt.reportDigest);
  assert.equal(digest(read('reports/postal-context-m2/py-checks-2026-09-02.json')), py.lastAttempt.engineeringReportDigest);
  const sr = ledger.countries.find(country => country.countryCode === 'SR');
  assert.equal(sr.status, 'pending');
  assert.equal(sr.attempts, 0);
});
