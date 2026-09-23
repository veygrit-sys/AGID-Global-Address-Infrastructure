import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const fk = ledger.countries.find(country => country.countryCode === 'FK');
const gd = ledger.countries.find(country => country.countryCode === 'GD');
const manifest = readJson('data/postal_country_packs/fk/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/fk/postal-context/source-profile.json');
const validation = readJson('reports/postal-context-m2/fk-validation-2026-09-01.json');
const paths = [
  'data/postal_country_packs/fk/postal-context/m2/descriptor.json',
  'data/postal_country_packs/fk/postal-context/m2/graph.json',
  'data/postal_country_packs/fk/postal-context/m2/geometry.json',
  'reports/postal-context-m2/fk-current-whole-territory-2026-09-01.json',
  'reports/postal-context-m2/fk-validation-2026-09-01.json',
  'data/postal_country_packs/fk/postal-context/source-profile.json',
  'data/postal_country_packs/fk/postal-context/M2-SOURCE-NOTICE.md',
];
const bytes = paths.map(path => readFileSync(new URL(path, root)));

test('FK reaches M2 only under its exact real-data definition', () => {
  assert.equal(fk.status, 'm2_verified');
  assert.equal(fk.attempts, 1);
  assert.equal(fk.blocker, null);
  assert.equal(fk.evidence.criterionSatisfied, true);
  assert.equal(fk.evidence.synthetic, false);
  assert.equal(fk.m2Definition.id, 'M2_current_upu_fiqq_whole_territory_derived_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === fk.m2Definition.id), fk.m2Definition);
});

test('FK evidence separates official FIQQ assignment from derived display geometry', () => {
  assert.match(fk.evidence.scope, /F1QQ 1ZZ is retained as a rejected source exception/);
  assert.match(fk.evidence.scope, /No official postal geometry was located/);
  assert.equal(profile.sources[0].assignment_authority, 'official_postal_dictionary');
  assert.equal(profile.sources[0].geometry_authority, 'none');
  assert.equal(profile.sources[3].geometry_authority, 'derived_geometry');
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
});

test('FK ledger pins every published artifact to the immutable implementation commit', () => {
  assert.deepEqual(fk.evidence.artifacts.map(artifact => artifact.digest), bytes.map(digest));
  assert.deepEqual(fk.evidence.artifacts.map(artifact => artifact.bytes), bytes.map(value => value.byteLength));
  assert.ok(fk.evidence.artifacts.every(artifact => artifact.url.includes('/blob/59799057a8dfee4bc943a83c28c561b0e0374ce6/')));
});

test('FK sources retain editions, hashes, terms and reviewed rights', () => {
  assert.equal(fk.evidence.sources.length, 4);
  assert.ok(fk.evidence.sources.every(source => source.version && source.observedAt));
  assert.ok(fk.evidence.sources.every(source => /^sha256:[0-9a-f]{64}$/.test(source.digest)));
  assert.ok(fk.evidence.sources.every(source => source.termsUrl && /^sha256:[0-9a-f]{64}$/.test(source.termsDigest)));
  assert.ok(fk.evidence.sources.every(source => source.rightsReviewed === true));
});

test('FK runtime evidence covers real API/map flow and no fabricated area', () => {
  assert.equal(fk.evidence.validation.passed, 185);
  assert.equal(fk.evidence.validation.failed, 0);
  assert.equal(validation.runtimeEvidence.geometryFeatures, 2);
  assert.equal(validation.runtimeEvidence.geometryType, 'MultiPolygon');
  assert.equal(validation.runtimeEvidence.provenance, 'derived');
  assert.equal(validation.runtimeEvidence.fitBoundsVerified, true);
  assert.equal(validation.runtimeEvidence.clearVerified, true);
  assert.equal(validation.runtimeEvidence.reSearchVerified, true);
  assert.equal(validation.runtimeEvidence.sourceExceptionF1qqRejected, true);
  assert.equal(validation.runtimeEvidence.invalidCodeNoFabricatedAreaVerified, true);
});

test('FK completion advances exactly one country to Grenada', () => {
  assert.equal(digest(bytes[3]), fk.lastAttempt.reportDigest);
  assert.equal(digest(bytes[4]), fk.lastAttempt.engineeringReportDigest);
  assert.equal(gd.status, 'pending');
  assert.equal(gd.attempts, 0);
});
