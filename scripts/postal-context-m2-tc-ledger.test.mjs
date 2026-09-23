import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root));
const readJson = path => JSON.parse(read(path).toString('utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const tc = ledger.countries.find(country => country.countryCode === 'TC');
const manifest = readJson('data/postal_country_packs/tc/postal-context/repository-manifest.json');
const descriptor = readJson('data/postal_country_packs/tc/postal-context/m2/descriptor.json');
const graph = readJson('data/postal_country_packs/tc/postal-context/m2/graph.json');
const geometry = readJson('data/postal_country_packs/tc/postal-context/m2/geometry.json');
const build = readJson('reports/postal-context-m2/tc-current-whole-territory-2026-09-02.json');
const checks = readJson('reports/postal-context-m2/tc-runtime-validation-2026-09-02.json');

const artifactPaths = [
  'data/postal_country_packs/tc/postal-context/m2/descriptor.json',
  'data/postal_country_packs/tc/postal-context/m2/graph.json',
  'data/postal_country_packs/tc/postal-context/m2/geometry.json',
  'reports/postal-context-m2/tc-current-whole-territory-2026-09-02.json',
  'reports/postal-context-m2/tc-runtime-validation-2026-09-02.json',
  'docs/postal-context-turks-caicos-m2.md',
];

test('TC reaches M2 only under its exact whole-territory derived-display definition', () => {
  assert.equal(tc.status, 'm2_verified');
  assert.equal(tc.attempts, 1);
  assert.equal(tc.blocker, null);
  assert.equal(tc.evidence.criterionSatisfied, true);
  assert.equal(tc.evidence.synthetic, false);
  assert.equal(tc.m2Definition.id, 'M2_current_upu_single_postcode_decr_derived_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === tc.m2Definition.id), tc.m2Definition);
});

test('official assignment and government geometry sources are exact and rights-reviewed', () => {
  assert.equal(tc.evidence.sources.length, 4);
  assert.ok(tc.evidence.sources.every(source => source.rightsReviewed === true));
  assert.equal(build.officialPostalEvidence.postalCode, 'TKCA 1ZZ');
  assert.equal(build.officialPostalEvidence.scope, 'single-postcode-for-whole-territory');
  assert.equal(build.officialPostalEvidence.geometryAuthority, 'none');
  assert.equal(build.input.sourceFeatures, 861);
  assert.equal(build.input.sourcePositions, 253775);
});

test('derived polygon quality is deterministic, valid and non-fabricated', () => {
  assert.equal(build.transformation.outputFeatures, 39);
  assert.equal(build.transformation.runtimeGeometryFeatures, 2);
  assert.equal(build.transformation.outputPositions, 7838);
  assert.equal(build.transformation.outputRings, 857);
  assert.equal(build.transformation.allOutputTurfValid, true);
  assert.equal(build.transformation.allOutputJstsValid, true);
  assert.equal(build.policy.outputProvenance, 'derived');
  assert.equal(build.policy.officialPostalGeometryClaimed, false);
  assert.equal(build.policy.inventedAreaRowsPublished, 0);
  assert.deepEqual(build.transformation.droppedDegenerateFeatures, [
    { sourceIndex: 101, objectId: 102, region: 'Grand Turk' },
  ]);
});

test('ledger pins every TC artifact to the evidence commit and exact digest', () => {
  const bytes = artifactPaths.map(read);
  assert.deepEqual(bytes.map(digest), tc.evidence.artifacts.map(artifact => artifact.digest));
  assert.deepEqual(bytes.map(item => item.byteLength), tc.evidence.artifacts.map(artifact => artifact.bytes));
  assert.ok(tc.evidence.artifacts.every(artifact => artifact.url.includes('/blob/651f0854a26f32b9209f710a1f6f1c6027760349/')));
  assert.equal(descriptor.artifacts.find(artifact => artifact.role === 'graph').digest, digest(read('data/postal_country_packs/tc/postal-context/m2/graph.json')));
  assert.equal(descriptor.artifacts.find(artifact => artifact.role === 'geometry').digest, digest(read('data/postal_country_packs/tc/postal-context/m2/geometry.json')));
});

test('runtime exposes authoritative IDs without promoting derived region audit IDs', () => {
  assert.equal(graph.nodes.filter(node => node.kind === 'postal_feature').length, 1);
  assert.equal(graph.nodes.filter(node => node.id.startsWith('admin-tc-decr-region-')).length, 27);
  assert.equal(graph.assertions.length, 28);
  assert.equal(geometry.features.length, 2);
  assert.deepEqual(checks.runtimeObservation.geometryFeatureIds, geometry.features.map(feature => feature.id));
  assert.equal(checks.runtimeObservation.officialCountryContextId, 'country-tc');
  assert.equal(checks.runtimeObservation.derivedRegionAuditIdsReturnedAsDefinitiveContexts, false);
});

test('deterministic fallback passes while visual inspection remains explicitly unclaimed', () => {
  assert.equal(checks.result, 'deterministic_fallback_passed');
  assert.equal(checks.validation.passed, 18);
  assert.equal(checks.validation.failed, 0);
  assert.equal(checks.visualInspection.attempted, true);
  assert.equal(checks.visualInspection.completed, false);
  assert.equal(checks.visualInspection.browserE2eVerified, false);
  assert.equal(tc.evidence.runtime.fullAgidViteAppVisualInspection, false);
  const tt = ledger.countries.find(country => country.countryCode === 'TT');
  assert.equal(tt.status, 'pending');
  assert.equal(tt.attempts, 0);
});
