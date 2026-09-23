import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bl = ledger.countries.find(country => country.countryCode === 'BL');
const manifest = readJson('data/postal_country_packs/bl/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bl/postal-context/source-profile.json');
const descriptorBytes = readFileSync(new URL('data/postal_country_packs/bl/postal-context/m2/descriptor.json', root));
const graphBytes = readFileSync(new URL('data/postal_country_packs/bl/postal-context/m2/graph.json', root));
const geometryBytes = readFileSync(new URL('data/postal_country_packs/bl/postal-context/m2/geometry.json', root));
const buildBytes = readFileSync(new URL('reports/postal-context-m2/bl-current-single-postcode-2026-08-31.json', root));
const validationBytes = readFileSync(new URL('reports/postal-context-m2/bl-validation-2026-08-31.json', root));
const reportBytes = readFileSync(new URL('docs/postal-context-saint-barthelemy-m2.md', root));

test('BL reaches M2 only under its exact country definition', () => {
  assert.equal(bl.status, 'm2_verified');
  assert.equal(bl.attempts, 1);
  assert.equal(bl.blocker, null);
  assert.equal(bl.evidence.criterionSatisfied, true);
  assert.equal(bl.evidence.synthetic, false);
  assert.equal(bl.m2Definition.id, 'M2_current_laposte_single_postcode_derived_collectivity_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bl.m2Definition.id), bl.m2Definition);
});

test('complete La Poste evidence proves one BL assignment without postal geometry authority', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.input.officialDataset.rows, 39192);
  assert.equal(build.input.officialDataset.blDenominatorRows, 1);
  assert.deepEqual(build.input.officialDataset.row, {
    insee: '97701', commune: 'ST BARTHELEMY', postalCode: '97133',
    routingLabel: 'ST BARTHELEMY', line5: '',
  });
  assert.equal(build.scope.officialPostalBoundaryClaimed, false);
  assert.equal(profile.sources[0].assignment_authority, 'official_postal_dictionary');
  assert.equal(profile.sources[0].geometry_authority, 'none');
});

test('derived government MultiPolygon is real, fixed and coordinate-preserving', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.input.geoApi.exactGeometryEquality, true);
  assert.equal(build.geometry.type, 'MultiPolygon');
  assert.equal(build.geometry.parts, 21);
  assert.equal(build.geometry.positions, 2912);
  assert.equal(build.geometry.geometricModification, false);
  assert.equal(build.geometry.provenance, 'derived');
  assert.equal(build.geometry.confidence, 0.97);
  assert.equal(manifest.release_scope.contains_production_geometry, true);
});

test('ledger pins every published BL artifact to the immutable implementation commit', () => {
  const expected = [
    [descriptorBytes, 'sha256:688cf43fd1a928f08517e18c7d7b2ecab0a9013a8ba2659fe72f64e09aa9c6d8'],
    [graphBytes, 'sha256:2e1395858b6b9d212aba3888b69073f8011c81c08f6f641aec123a70434d1f00'],
    [geometryBytes, 'sha256:244ed4000fdd1b31a9c90d128bd35f17a86f7561c63674bd0d730ba87745ebe1'],
    [buildBytes, 'sha256:6f13839e5d8d3647064e827bc4490e1229593f1d3655055fb02cc34810bfd8e2'],
    [validationBytes, 'sha256:bade8154b2ade5087c4a8ec68f177f1542675b28aa26ab7a10b50f72f0818bb6'],
    [reportBytes, 'sha256:9e38c65c9c0956fa4613416c675ef96e10fad9207f3d82be2e037b477cd5ae20'],
  ];
  assert.deepEqual(expected.map(([bytes]) => digest(bytes)), expected.map(([, value]) => value));
  assert.ok(bl.evidence.artifacts.every(artifact => artifact.url.includes('/blob/f66ebcd354b97507111691ba003f26e5eec31f57/')));
  assert.deepEqual(bl.evidence.artifacts.map(artifact => artifact.digest), expected.map(([, value]) => value));
});

test('runtime evidence includes real map fit, paint, states and no fabrication', () => {
  assert.equal(bl.evidence.validation.passed, 185);
  assert.equal(bl.evidence.validation.failed, 0);
  assert.equal(bl.evidence.runtime.descriptorDigest, digest(descriptorBytes));
  assert.match(bl.evidence.runtime.verificationCommand, /API lookup BL\/97133/);
  assert.match(bl.evidence.runtime.verificationCommand, /bounds fit/);
  assert.match(bl.evidence.runtime.verificationCommand, /loading\/no-match\/multiple\/API-failure\/invalid-geometry/);
  assert.match(bl.evidence.runtime.verificationCommand, /no fabricated area/);
  assert.equal(profile.receipt_summary.raw_source_bodies_in_git, 0);
});

test('BL completion advances exactly one country to Bermuda', () => {
  assert.equal(digest(buildBytes), bl.lastAttempt.reportDigest);
  assert.equal(digest(validationBytes), bl.lastAttempt.engineeringReportDigest);
  const bm = ledger.countries.find(country => country.countryCode === 'BM');
  assert.equal(bm.status, 'pending');
  assert.equal(bm.attempts, 0);
});
