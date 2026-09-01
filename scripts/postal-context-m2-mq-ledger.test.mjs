import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const mq = ledger.countries.find(country => country.countryCode === 'MQ');
const manifest = readJson('data/postal_country_packs/mq/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/mq/postal-context/source-profile.json');
const descriptorBytes = readFileSync(new URL('data/postal_country_packs/mq/postal-context/m2/descriptor.json', root));
const graphBytes = readFileSync(new URL('data/postal_country_packs/mq/postal-context/m2/graph.json', root));
const geometryBytes = readFileSync(new URL('data/postal_country_packs/mq/postal-context/m2/geometry.json', root));
const buildBytes = readFileSync(new URL('reports/postal-context-m2/mq-current-postcodes-2026-09-01.json', root));
const validationBytes = readFileSync(new URL('reports/postal-context-m2/mq-validation-2026-09-01.json', root));
const reportBytes = readFileSync(new URL('docs/postal-context-martinique-m2.md', root));

test('MQ reaches M2 only under its exact country definition', () => {
  assert.equal(mq.status, 'm2_verified');
  assert.equal(mq.attempts, 1);
  assert.equal(mq.evidence.criterionSatisfied, true);
  assert.equal(mq.evidence.synthetic, false);
  assert.equal(mq.m2Definition.id, 'M2_current_laposte_all_martinique_postcodes_derived_commune_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === mq.m2Definition.id), mq.m2Definition);
});

test('complete MQ assignment denominator preserves explicit geometry exceptions', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.denominator.mqRows, 38);
  assert.equal(build.denominator.distinctPostalCodes, 30);
  assert.equal(build.denominator.distinctPostcodeCommunePairs, 35);
  assert.deepEqual(build.scope.multiCommuneGroups.map(group => group.postalCode), ['97218', '97222', '97250']);
  assert.deepEqual(build.scope.sharedSurfaceGroups[0].postalCodes, ['97200', '97234']);
  assert.equal(build.policy.officialPostalBoundary, false);
});

test('MQ published geometry is valid, derived and coordinate-preserving', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.geometry.polygonFeatures, 21);
  assert.equal(build.geometry.multiPolygonFeatures, 14);
  assert.equal(build.geometry.positions, 40100);
  assert.equal(build.geometry.allTurfValid, true);
  assert.equal(build.geometry.allJstsValid, true);
  assert.equal(build.geometry.geometricModification, false);
  assert.equal(build.geometry.provenance, 'derived');
  assert.equal(profile.receipt_summary.raw_source_bodies_in_git, 0);
});

test('ledger pins every MQ artifact to the immutable implementation commit', () => {
  const expected = [
    [descriptorBytes, 'sha256:22e0ebf3386c6bfda50d84a102202da4a7f6846a4a0ea3aaf9c1aee409723758'],
    [graphBytes, 'sha256:5d3de3c265f67e440f332891bd158810a51d8987388f8b64b4d9aa250e680220'],
    [geometryBytes, 'sha256:b0048123e1c1485ba2b1e82e8bdc454484e2ce41e92f9d5d2fa87f3eabebf4d0'],
    [buildBytes, 'sha256:7e56b373eeb1d5a723cc62920aa21edd63bcda526907667ca7f2d328f40c7166'],
    [validationBytes, 'sha256:669facf3b58760471cb73f6de7899ccbd70dda941e80ffadb47d41c6824ca6a5'],
    [reportBytes, 'sha256:1e45854df73ae803a342a36d3aa2612b617a789e74530378c179fc5dce3f250a'],
  ];
  assert.deepEqual(expected.map(([bytes]) => digest(bytes)), expected.map(([, value]) => value));
  assert.ok(mq.evidence.artifacts.every(artifact => artifact.url.includes('/blob/67273667202defc00695de75e8d770b730bb4da5/')));
  assert.deepEqual(mq.evidence.artifacts.map(artifact => artifact.digest), expected.map(([, value]) => value));
});

test('runtime evidence records actual browser inspection without changing authority', () => {
  const validation = JSON.parse(validationBytes);
  assert.equal(mq.evidence.validation.passed, 190);
  assert.equal(mq.evidence.validation.failed, 0);
  assert.equal(validation.browser.manualVisualInspection, true);
  assert.equal(validation.browser.postalApi.httpStatus, 200);
  assert.equal(validation.browser.postalApi.status, 'ambiguous');
  assert.equal(validation.browser.postalApi.geometries, 3);
  assert.equal(validation.authority.publishedSurface, 'derived');
  assert.equal(validation.authority.officialPostalBoundaryClaimed, false);
});

test('MQ completion advances exactly one country to Montserrat', () => {
  assert.equal(digest(buildBytes), mq.lastAttempt.reportDigest);
  assert.equal(digest(validationBytes), mq.lastAttempt.engineeringReportDigest);
  const ms = ledger.countries.find(country => country.countryCode === 'MS');
  assert.equal(ms.status, 'pending');
  assert.equal(ms.attempts, 0);
});
