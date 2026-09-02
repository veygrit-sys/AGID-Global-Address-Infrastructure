import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = body => `sha256:${createHash('sha256').update(body).digest('hex')}`;
const bytes = path => readFileSync(new URL(path, root));
const ledger = readJson('docs/postal-context-m2-rollout.json');
const pm = ledger.countries.find(country => country.countryCode === 'PM');
const manifest = readJson('data/postal_country_packs/pm/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/pm/postal-context/source-profile.json');
const descriptor = bytes('data/postal_country_packs/pm/postal-context/m2/descriptor.json');
const graph = bytes('data/postal_country_packs/pm/postal-context/m2/graph.json');
const geometry = bytes('data/postal_country_packs/pm/postal-context/m2/geometry.json');
const report = bytes('reports/postal-context-m2/pm-current-single-postcode-2026-09-01.json');
const validation = bytes('reports/postal-context-m2/pm-browser-validation-2026-09-02.json');
const screenshot = bytes('reports/postal-context-m2/pm-browser-visual-2026-09-02.png');
const countryDoc = bytes('data/postal_country_packs/pm/postal-context/README.md');

test('PM reaches M2 only under its country-specific manifest definition', () => {
  assert.equal(pm.status, 'm2_verified');
  assert.equal(pm.attempts, 1);
  assert.equal(pm.blocker, null);
  assert.equal(pm.evidence.criterionSatisfied, true);
  assert.equal(pm.evidence.synthetic, false);
  assert.deepEqual(
    manifest.promotion.stages.find(stage => stage.id === pm.m2Definition.id),
    pm.m2Definition,
  );
});

test('PM denominator and derived geometry retain exact linked identities', () => {
  const build = JSON.parse(report);
  assert.equal(build.input.officialDataset.pmDenominatorRows, 3);
  assert.deepEqual(build.scope.publishedPostalCodes, ['97500']);
  assert.deepEqual(build.scope.linkedAdministrativeIds, ['97501', '97502']);
  assert.equal(build.geometry.parts, 78);
  assert.equal(build.geometry.rings, 78);
  assert.equal(build.geometry.positions, 9097);
  assert.equal(build.geometry.geometricModification, false);
  assert.equal(build.geometry.provenance, 'derived');
  assert.equal(profile.receipt_summary.raw_source_bodies_in_git, 0);
});

test('ledger pins all PM artifacts by immutable commit, digest and byte length', () => {
  const bodies = [descriptor, graph, geometry, report, validation, screenshot, countryDoc];
  assert.deepEqual(pm.evidence.artifacts.map(item => item.digest), bodies.map(digest));
  assert.deepEqual(pm.evidence.artifacts.map(item => item.bytes), bodies.map(body => body.byteLength));
  assert.ok(pm.evidence.artifacts.every(item => item.url.includes('/blob/91bc2aa7d3c9393a0670fb5ddd25fc71074094ca/')));
  assert.ok(pm.evidence.artifacts.every(item => item.url.includes('/veygrit-sys/AGID-Global-Address-Infrastructure/')));
});

test('browser evidence proves real postal rendering and detailed ID linkage honestly', () => {
  const result = JSON.parse(validation);
  assert.equal(result.verdict, 'pass_with_ancillary_address_context_unavailable');
  assert.equal(result.geocoderTransport.deterministicFixture, true);
  assert.equal(result.observed.postalContextId, 'postal-pm-97500');
  assert.deepEqual(result.observed.linkedContextIds, [
    'admin-pm-insee-97501',
    'admin-pm-insee-97502',
  ]);
  assert.equal(result.observed.geometryType, 'MultiPolygon');
  assert.equal(result.observed.polygonParts, 78);
  assert.equal(result.observed.provenance, 'derived');
  assert.equal(result.observed.clearVerified, true);
  assert.deepEqual(result.observed.postalRequests.map(request => request.status), [200, 200]);
  assert.deepEqual(result.observed.postalContextFailures, []);
  assert.match(pm.evidence.runtime.verificationCommand, /in-app browser Windows ACL bootstrap failed and is not claimed/);
});

test('PM completion advances exactly one country to Puerto Rico', () => {
  assert.equal(digest(report), pm.lastAttempt.reportDigest);
  assert.equal(digest(validation), pm.lastAttempt.engineeringReportDigest);
  const pr = ledger.countries.find(country => country.countryCode === 'PR');
  assert.equal(pr.status, 'pending');
  assert.equal(pr.attempts, 0);
});
