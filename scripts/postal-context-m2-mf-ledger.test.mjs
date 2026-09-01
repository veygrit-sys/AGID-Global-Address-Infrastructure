import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const mf = ledger.countries.find(country => country.countryCode === 'MF');
const manifest = readJson('data/postal_country_packs/mf/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/mf/postal-context/source-profile.json');
const descriptorBytes = readFileSync(new URL('data/postal_country_packs/mf/postal-context/m2/descriptor.json', root));
const graphBytes = readFileSync(new URL('data/postal_country_packs/mf/postal-context/m2/graph.json', root));
const geometryBytes = readFileSync(new URL('data/postal_country_packs/mf/postal-context/m2/geometry.json', root));
const buildBytes = readFileSync(new URL('reports/postal-context-m2/mf-current-single-postcode-2026-09-01.json', root));
const validationBytes = readFileSync(new URL('reports/postal-context-m2/mf-validation-2026-09-01.json', root));
const reportBytes = readFileSync(new URL('docs/postal-context-saint-martin-m2.md', root));

test('MF reaches M2 only under its exact country definition', () => {
  assert.equal(mf.status, 'm2_verified');
  assert.equal(mf.attempts, 1);
  assert.equal(mf.blocker, null);
  assert.equal(mf.evidence.criterionSatisfied, true);
  assert.equal(mf.evidence.synthetic, false);
  assert.equal(mf.m2Definition.id, 'M2_current_laposte_single_postcode_derived_collectivity_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === mf.m2Definition.id), mf.m2Definition);
});

test('complete La Poste evidence proves one MF assignment without postal geometry authority', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.input.officialDataset.rows, 39192);
  assert.equal(build.input.officialDataset.mfDenominatorRows, 1);
  assert.deepEqual(build.input.officialDataset.row, {
    insee: '97801', commune: 'ST MARTIN', postalCode: '97150',
    routingLabel: 'ST MARTIN', line5: '',
  });
  assert.equal(build.scope.officialPostalBoundaryClaimed, false);
  assert.equal(profile.sources[0].assignment_authority, 'official_postal_dictionary');
  assert.equal(profile.sources[0].geometry_authority, 'none');
});

test('derived government MultiPolygon is real, fixed and coordinate-preserving', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.input.geoApi.exactGeometryEquality, true);
  assert.equal(build.geometry.type, 'MultiPolygon');
  assert.equal(build.geometry.parts, 11);
  assert.equal(build.geometry.positions, 2136);
  assert.equal(build.geometry.geometricModification, false);
  assert.equal(build.geometry.provenance, 'derived');
  assert.equal(build.geometry.confidence, 0.97);
  assert.equal(manifest.release_scope.contains_production_geometry, true);
});

test('ledger pins every published MF artifact to the immutable implementation commit', () => {
  const expected = [
    [descriptorBytes, 'sha256:73b833176a1638cc7de680ad5874d76d9519dca780b9e87ad5a42e26ec5112e4'],
    [graphBytes, 'sha256:e092425a20160611fe8c94715b77a8abb11390c819a9e5636c25b14802a89f65'],
    [geometryBytes, 'sha256:1120b3e9896198169cbba4f2e2aad4ef769585660b2c8c2f8ebf19404eac8a37'],
    [buildBytes, 'sha256:eadf00e082d8ab8fdc317ce7045987a647a034a8b41b3ea2a6b724746e7d50bf'],
    [validationBytes, 'sha256:ff5f79c79c72746b2245236bd38a3dd8e63afcccb620c2949486e767e711dc89'],
    [reportBytes, 'sha256:7b97d6e234dae694e88f0f1d3612c19fd56a3a9f0d36cf5b90c5979596c2d4b7'],
  ];
  assert.deepEqual(expected.map(([bytes]) => digest(bytes)), expected.map(([, value]) => value));
  assert.ok(mf.evidence.artifacts.every(artifact => artifact.url.includes('/blob/9183040831e1474ede393193693c1692aa6f975c/')));
  assert.deepEqual(mf.evidence.artifacts.map(artifact => artifact.digest), expected.map(([, value]) => value));
});

test('runtime evidence is real and records the visual-inspection limit honestly', () => {
  const validation = JSON.parse(validationBytes);
  assert.equal(mf.evidence.validation.passed, 183);
  assert.equal(mf.evidence.validation.failed, 0);
  assert.equal(mf.evidence.runtime.descriptorDigest, digest(descriptorBytes));
  assert.match(mf.evidence.runtime.verificationCommand, /two API 200 lookups/);
  assert.match(mf.evidence.runtime.verificationCommand, /bounds-fit/);
  assert.match(mf.evidence.runtime.verificationCommand, /manual visual inspection is not claimed/);
  assert.equal(validation.applicationValidation.manualVisualInspection.performed, false);
  assert.deepEqual(validation.applicationValidation.apiRequests.map(request => request.status), [200, 200]);
  assert.equal(profile.receipt_summary.raw_source_bodies_in_git, 0);
});

test('MF completion advances exactly one country to Martinique', () => {
  assert.equal(digest(buildBytes), mf.lastAttempt.reportDigest);
  assert.equal(digest(validationBytes), mf.lastAttempt.engineeringReportDigest);
  const mq = ledger.countries.find(country => country.countryCode === 'MQ');
  assert.equal(mq.status, 'pending');
  assert.equal(mq.attempts, 0);
});
