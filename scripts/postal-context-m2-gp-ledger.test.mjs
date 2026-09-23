import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gp = ledger.countries.find(country => country.countryCode === 'GP');
const gs = ledger.countries.find(country => country.countryCode === 'GS');
const manifest = readJson('data/postal_country_packs/gp/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gp/postal-context/source-profile.json');
const build = readJson('reports/postal-context-m2/gp-current-postcodes-2026-09-01.json');
const validation = readJson('reports/postal-context-m2/gp-validation-2026-09-01.json');
const paths = [
  'data/postal_country_packs/gp/postal-context/m2/descriptor.json',
  'data/postal_country_packs/gp/postal-context/m2/graph.json',
  'data/postal_country_packs/gp/postal-context/m2/geometry.json',
  'reports/postal-context-m2/gp-current-postcodes-2026-09-01.json',
  'reports/postal-context-m2/gp-validation-2026-09-01.json',
  'data/postal_country_packs/gp/postal-context/source-profile.json',
  'data/postal_country_packs/gp/postal-context/M2-SOURCE-NOTICE.md',
  'docs/postal-context-guadeloupe-m2.md',
];
const bytes = paths.map(path => readFileSync(new URL(path, root)));

test('GP reaches M2 only under its complete current derived-commune definition', () => {
  assert.equal(gp.status, 'm2_verified');
  assert.equal(gp.attempts, 1);
  assert.equal(gp.blocker, null);
  assert.equal(gp.evidence.criterionSatisfied, true);
  assert.equal(gp.evidence.synthetic, false);
  assert.equal(gp.m2Definition.id, 'M2_current_laposte_all_postcodes_derived_commune_visualization');
  assert.ok(manifest.promotion.stages.some(stage => stage.id === gp.m2Definition.id));
});

test('GP evidence separates assignment, administrative geometry and derived surfaces', () => {
  assert.match(gp.evidence.scope, /38 GP assignment rows, 33 distinct postal codes and 32 COG 2026 communes/i);
  assert.match(gp.evidence.scope, /97139\/97142 share Les Abymes/i);
  assert.match(gp.evidence.scope, /97125, 97130, 97131 and 97180 have multiple Ligne 5 rows/i);
  assert.match(gp.evidence.scope, /BL 97133\/97701 and MF 97150\/97801 are excluded/i);
  assert.match(gp.evidence.scope, /never official postal boundaries/i);
  assert.equal(profile.sources[0].assignment_authority, 'official_postal_operator');
  assert.equal(profile.sources[0].geometry_authority, 'none');
  assert.equal(profile.sources[1].assignment_authority, 'none');
  assert.equal(profile.sources[1].geometry_authority, 'official_mapping_geometry');
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
});

test('GP ledger pins every published artifact to the immutable implementation commit', () => {
  assert.deepEqual(gp.evidence.artifacts.map(artifact => artifact.digest), bytes.map(digest));
  assert.deepEqual(gp.evidence.artifacts.map(artifact => artifact.bytes), bytes.map(value => value.byteLength));
  assert.ok(gp.evidence.artifacts.every(artifact => artifact.url.includes('/blob/d175a8afe9ac4cb319c19fa6053f2358df1efdc4/')));
});

test('GP sources retain editions, hashes, terms and reviewed rights', () => {
  assert.equal(gp.evidence.sources.length, 3);
  assert.ok(gp.evidence.sources.every(source => source.version && source.observedAt));
  assert.ok(gp.evidence.sources.every(source => /^sha256:[0-9a-f]{64}$/.test(source.digest)));
  assert.ok(gp.evidence.sources.every(source => source.termsUrl && /^sha256:[0-9a-f]{64}$/.test(source.termsDigest)));
  assert.ok(gp.evidence.sources.every(source => source.rightsReviewed === true));
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 40, exact_bytes: 3663819, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('GP runtime evidence covers real API/map flow, shared surfaces and no fabricated area', () => {
  assert.equal(gp.evidence.validation.passed, 177);
  assert.equal(gp.evidence.validation.failed, 0);
  assert.equal(build.denominator.gpRows, 38);
  assert.equal(build.denominator.distinctPostalCodes, 33);
  assert.equal(build.denominator.distinctCommuneCodes, 32);
  assert.deepEqual(build.denominator.excludedSamePrefixTerritories, [
    { postalCode: '97133', insee: '97701' },
    { postalCode: '97150', insee: '97801' },
  ]);
  assert.equal(build.scope.publishedGeometries, 33);
  assert.equal(build.geometry.allTurfValid, true);
  assert.equal(build.geometry.allJstsValid, true);
  assert.equal(validation.application.normalizedPostalCode, '97110');
  assert.equal(validation.application.apiGeometry, 'MultiPolygon');
  assert.deepEqual(validation.application.fitBounds, [[-61.557972, 16.213163], [-61.525526, 16.253081]]);
  assert.equal(validation.application.clearAndResearch, true);
  assert.equal(validation.application.invalidGeometryRefused, true);
  assert.equal(validation.application.sharedSurfaceIdentityPreserved, true);
  assert.equal(validation.application.multiLigne5SingleAreaPreserved, true);
  assert.equal(validation.authoritySeparation.addressOrBuildingRows, 0);
  assert.equal(validation.identity.identityMergedOrReassigned, false);
});

test('GP completion advances exactly one country to South Georgia and the South Sandwich Islands', () => {
  assert.equal(digest(bytes[3]), gp.lastAttempt.reportDigest);
  assert.equal(digest(bytes[4]), gp.lastAttempt.engineeringReportDigest);
  assert.equal(gs.status, 'pending');
  assert.equal(gs.attempts, 0);
});
