import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gf = ledger.countries.find(country => country.countryCode === 'GF');
const gl = ledger.countries.find(country => country.countryCode === 'GL');
const manifest = readJson('data/postal_country_packs/gf/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gf/postal-context/source-profile.json');
const build = readJson('reports/postal-context-m2/gf-current-postcodes-2026-09-01.json');
const validation = readJson('reports/postal-context-m2/gf-validation-2026-09-01.json');
const paths = [
  'data/postal_country_packs/gf/postal-context/m2/descriptor.json',
  'data/postal_country_packs/gf/postal-context/m2/graph.json',
  'data/postal_country_packs/gf/postal-context/m2/geometry.json',
  'reports/postal-context-m2/gf-current-postcodes-2026-09-01.json',
  'reports/postal-context-m2/gf-validation-2026-09-01.json',
  'data/postal_country_packs/gf/postal-context/source-profile.json',
  'data/postal_country_packs/gf/postal-context/M2-SOURCE-NOTICE.md',
  'docs/postal-context-french-guiana-m2.md',
];
const bytes = paths.map(path => readFileSync(new URL(path, root)));

test('GF reaches M2 only under its complete current derived-commune definition', () => {
  assert.equal(gf.status, 'm2_verified');
  assert.equal(gf.attempts, 1);
  assert.equal(gf.blocker, null);
  assert.equal(gf.evidence.criterionSatisfied, true);
  assert.equal(gf.evidence.synthetic, false);
  assert.equal(gf.m2Definition.id, 'M2_current_laposte_all_postcodes_derived_commune_visualization');
  assert.ok(manifest.promotion.stages.some(stage => stage.id === gf.m2Definition.id));
});

test('GF evidence separates assignment, administrative geometry and derived surfaces', () => {
  assert.match(gf.evidence.scope, /25 distinct 973 postcode rows.*22 COG 2026 communes/i);
  assert.match(gf.evidence.scope, /never official postal boundaries/i);
  assert.match(gf.evidence.scope, /97311\/97352 share Roura.*97318\/97360 share Mana.*97353\/97390 share Régina/i);
  assert.equal(profile.sources[0].assignment_authority, 'official_postal_operator');
  assert.equal(profile.sources[0].geometry_authority, 'none');
  assert.equal(profile.sources[1].assignment_authority, 'none');
  assert.equal(profile.sources[1].geometry_authority, 'official_mapping_geometry');
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
});

test('GF ledger pins every published artifact to the immutable implementation commit', () => {
  assert.deepEqual(gf.evidence.artifacts.map(artifact => artifact.digest), bytes.map(digest));
  assert.deepEqual(gf.evidence.artifacts.map(artifact => artifact.bytes), bytes.map(value => value.byteLength));
  assert.ok(gf.evidence.artifacts.every(artifact => artifact.url.includes('/blob/410ce010d5e996adc2535c6f6e0e5a352122704c/')));
});

test('GF sources retain editions, hashes, terms and reviewed rights', () => {
  assert.equal(gf.evidence.sources.length, 3);
  assert.ok(gf.evidence.sources.every(source => source.version && source.observedAt));
  assert.ok(gf.evidence.sources.every(source => /^sha256:[0-9a-f]{64}$/.test(source.digest)));
  assert.ok(gf.evidence.sources.every(source => source.termsUrl && /^sha256:[0-9a-f]{64}$/.test(source.termsDigest)));
  assert.ok(gf.evidence.sources.every(source => source.rightsReviewed === true));
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 32, exact_bytes: 6473543, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('GF runtime evidence covers real API/map flow, shared surfaces and no fabricated area', () => {
  assert.equal(gf.evidence.validation.passed, 86);
  assert.equal(gf.evidence.validation.failed, 0);
  assert.equal(build.denominator.distinctPostalCodes, 25);
  assert.equal(build.denominator.distinctCommuneCodes, 22);
  assert.equal(build.geometry.allTurfValid, true);
  assert.equal(build.geometry.allJstsValid, true);
  assert.equal(validation.application.normalizedPostalCode, '97300');
  assert.equal(validation.application.apiGeometry, 'MultiPolygon');
  assert.deepEqual(validation.application.fitBounds, [[-52.593833, 4.886669], [-52.163557, 5.297322]]);
  assert.equal(validation.application.clearAndResearch, true);
  assert.equal(validation.application.invalidGeometryRefused, true);
  assert.equal(validation.application.sharedSurfaceIdentityPreserved, true);
  assert.equal(validation.authoritySeparation.addressOrBuildingRows, 0);
  assert.equal(validation.identity.identityMergedOrReassigned, false);
});

test('GF completion advances exactly one country to Greenland', () => {
  assert.equal(digest(bytes[3]), gf.lastAttempt.reportDigest);
  assert.equal(digest(bytes[4]), gf.lastAttempt.engineeringReportDigest);
  assert.equal(gl.status, 'pending');
  assert.equal(gl.attempts, 0);
});
