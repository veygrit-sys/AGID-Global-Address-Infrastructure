import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const cp = ledger.countries.find(country => country.countryCode === 'CP');
const manifest = readJson('data/postal_country_packs/cp/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/cp/postal-context/source-profile.json');
const descriptorBytes = readFileSync(new URL('data/postal_country_packs/cp/postal-context/m2/descriptor.json', root));
const graphBytes = readFileSync(new URL('data/postal_country_packs/cp/postal-context/m2/graph.json', root));
const geometryBytes = readFileSync(new URL('data/postal_country_packs/cp/postal-context/m2/geometry.json', root));
const buildBytes = readFileSync(new URL('reports/postal-context-m2/cp-current-single-postcode-2026-09-01.json', root));
const validationBytes = readFileSync(new URL('reports/postal-context-m2/cp-validation-2026-09-01.json', root));
const reportBytes = readFileSync(new URL('docs/postal-context-clipperton-m2.md', root));

test('CP reaches M2 only under its exact country definition', () => {
  assert.equal(cp.status, 'm2_verified');
  assert.equal(cp.attempts, 1);
  assert.equal(cp.blocker, null);
  assert.equal(cp.evidence.criterionSatisfied, true);
  assert.equal(cp.evidence.synthetic, false);
  assert.equal(cp.m2Definition.id, 'M2_current_laposte_single_postcode_derived_territory_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === cp.m2Definition.id), cp.m2Definition);
});

test('complete La Poste evidence proves one CP assignment without postal geometry authority', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.input.exactReceipts.length, 15);
  assert.equal(build.input.exactReceiptBytes, 2845023);
  assert.equal(build.input.officialDataset.rows, 39192);
  assert.equal(build.input.officialDataset.cpDenominatorRows, 1);
  assert.deepEqual(build.input.officialDataset.row, {
    insee: '98901', commune: 'ILE DE CLIPPERTON', postalCode: '98799',
    routingLabel: 'ILE DE CLIPPERTON', line5: '',
  });
  assert.equal(build.scope.officialPostalBoundaryClaimed, false);
  assert.equal(profile.sources[0].assignment_authority, 'official_postal_dictionary');
  assert.equal(profile.sources[0].geometry_authority, 'none');
});

test('derived government Polygon is real, fixed and coordinate-preserving', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.input.geoApi.exactGeometryEquality, true);
  assert.equal(build.geometry.type, 'Polygon');
  assert.equal(build.geometry.parts, 1);
  assert.equal(build.geometry.rings, 1);
  assert.equal(build.geometry.positions, 110);
  assert.equal(build.geometry.geometricModification, false);
  assert.equal(build.geometry.provenance, 'derived');
  assert.equal(build.geometry.confidence, 0.97);
  assert.equal(manifest.release_scope.contains_production_geometry, true);
});

test('ledger pins every published CP artifact to the immutable implementation commit', () => {
  const expected = [
    [descriptorBytes, 'sha256:763153bb5e2621e60bdebf3c337820da301f79ff9e4f40623f23341b45d97eda'],
    [graphBytes, 'sha256:020c3e97f3ceeb4575a5bd71c786ca717bfa1283c400faa35040418506dde311'],
    [geometryBytes, 'sha256:2ab74615c5679e6a398360a78aad1db5dd80085d02d08fe9a4dae8cab20b9662'],
    [buildBytes, 'sha256:e2ec9b3326d7dcbcdc39f42c8263b5812e31ad9f00f0480a12c2833026346b9d'],
    [validationBytes, 'sha256:66afb6a0ac0b9566815d1fba9b2a2bab260936ab7c4ca9ea2e5688c09a166860'],
    [reportBytes, 'sha256:ed960abc2451da4a6594f73622a0f7d0d8721d533da22aec6496489b65281d49'],
  ];
  assert.deepEqual(expected.map(([bytes]) => digest(bytes)), expected.map(([, value]) => value));
  assert.ok(cp.evidence.artifacts.every(artifact => artifact.url.includes('/blob/7f9723b9c8ef706027483b66646b7b0a08fc2190/')));
  assert.deepEqual(cp.evidence.artifacts.map(artifact => artifact.digest), expected.map(([, value]) => value));
});

test('runtime evidence includes real map fit, paint, states and no fabrication', () => {
  assert.equal(cp.evidence.validation.passed, 178);
  assert.equal(cp.evidence.validation.failed, 0);
  assert.equal(cp.evidence.runtime.descriptorDigest, digest(descriptorBytes));
  assert.match(cp.evidence.runtime.verificationCommand, /API lookup.*CP\/98799/);
  assert.match(cp.evidence.runtime.verificationCommand, /bounds fit/);
  assert.match(cp.evidence.runtime.verificationCommand, /loading\/no-match\/multiple\/API-failure\/invalid-geometry/);
  assert.match(cp.evidence.runtime.verificationCommand, /no fabricated area/);
  assert.equal(profile.receipt_summary.raw_source_bodies_in_git, 0);
});

test('CP completion advances exactly one country to Costa Rica', () => {
  assert.equal(digest(buildBytes), cp.lastAttempt.reportDigest);
  assert.equal(digest(validationBytes), cp.lastAttempt.engineeringReportDigest);
  const cr = ledger.countries.find(country => country.countryCode === 'CR');
  assert.equal(cr.status, 'pending');
  assert.equal(cr.attempts, 0);
});
