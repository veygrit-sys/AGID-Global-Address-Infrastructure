import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = body => `sha256:${createHash('sha256').update(body).digest('hex')}`;
const bytes = path => readFileSync(new URL(path, root));
const ledger = readJson('docs/postal-context-m2-rollout.json');
const mx = ledger.countries.find(country => country.countryCode === 'MX');
const manifest = readJson('data/postal_country_packs/mx/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/mx/postal-context/source-profile.json');
const descriptor = bytes('data/postal_country_packs/mx/postal-context/m2/descriptor.json');
const graph = bytes('data/postal_country_packs/mx/postal-context/m2/graph.json');
const geometry = bytes('data/postal_country_packs/mx/postal-context/m2/geometry.json');
const report = bytes('reports/postal-context-m2/mx-current-postal-polygons-2026-09-01.json');
const validation = bytes('reports/postal-context-m2/mx-validation-2026-09-01.json');
const countryDoc = bytes('docs/postal-context-mexico-m2.md');

test('MX reaches M2 only under its country-specific manifest definition', () => {
  assert.equal(mx.status, 'm2_verified');
  assert.equal(mx.attempts, 1);
  assert.equal(mx.blocker, null);
  assert.equal(mx.evidence.criterionSatisfied, true);
  assert.equal(mx.evidence.synthetic, false);
  assert.deepEqual(
    manifest.promotion.stages.find(stage => stage.id === mx.m2Definition.id),
    mx.m2Definition,
  );
});

test('MX denominator and real area geometry are complete without invented surfaces', () => {
  assert.equal(profile.validation.state_resources, 32);
  assert.equal(profile.validation.source_features, 35898);
  assert.equal(profile.validation.distinct_postal_codes, 35898);
  assert.equal(profile.validation.derived_features, 35898);
  assert.equal(profile.transformation.invented_surfaces, false);
  assert.equal(profile.receipt_summary.raw_source_bodies_in_git, 0);
});

test('ledger pins all MX artifacts by immutable commit, digest and byte length', () => {
  const bodies = [descriptor, graph, geometry, report, validation, countryDoc];
  assert.deepEqual(mx.evidence.artifacts.map(item => item.digest), bodies.map(digest));
  assert.deepEqual(mx.evidence.artifacts.map(item => item.bytes), bodies.map(body => body.byteLength));
  assert.ok(mx.evidence.artifacts.every(item => /\/blob\/[0-9a-f]{40}\//u.test(item.url)));
  assert.ok(mx.evidence.artifacts.every(item => item.url.includes('/veygrit-sys/AGID-Global-Address-Infrastructure/')));
});

test('runtime evidence is real and records the in-app browser limitation honestly', () => {
  const result = JSON.parse(validation);
  assert.equal(mx.evidence.validation.passed, 177);
  assert.equal(mx.evidence.validation.failed, 0);
  assert.equal(mx.evidence.runtime.descriptorDigest, digest(descriptor));
  assert.match(mx.evidence.runtime.verificationCommand, /06000/);
  assert.match(mx.evidence.runtime.verificationCommand, /01000/);
  assert.match(mx.evidence.runtime.verificationCommand, /in-app browser ACL bootstrap failed twice/);
  assert.equal(result.browserVerification.inAppBrowser, false);
  assert.deepEqual(result.browserVerification.checks.filter(item => item.status).map(item => item.status), [200, 200]);
});

test('MX completion leaves the next pending Americas country untouched', () => {
  assert.equal(digest(report), mx.lastAttempt.reportDigest);
  assert.equal(digest(validation), mx.lastAttempt.engineeringReportDigest);
  const ni = ledger.countries.find(country => country.countryCode === 'NI');
  assert.equal(ni.status, 'pending');
  assert.equal(ni.attempts, 0);
});
