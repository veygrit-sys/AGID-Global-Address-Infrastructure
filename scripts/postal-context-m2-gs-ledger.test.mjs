import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gs = ledger.countries.find(country => country.countryCode === 'GS');
const gt = ledger.countries.find(country => country.countryCode === 'GT');
const manifest = readJson('data/postal_country_packs/gs/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gs/postal-context/source-profile.json');
const build = readJson('reports/postal-context-m2/gs-current-whole-territory-2026-09-01.json');
const validation = readJson('reports/postal-context-m2/gs-validation-2026-09-01.json');
const browser = readJson('reports/postal-context-m2/gs-browser-visual-2026-09-01.json');
const paths = [
  'data/postal_country_packs/gs/postal-context/m2/descriptor.json',
  'data/postal_country_packs/gs/postal-context/m2/graph.json',
  'data/postal_country_packs/gs/postal-context/m2/geometry.json',
  'reports/postal-context-m2/gs-current-whole-territory-2026-09-01.json',
  'reports/postal-context-m2/gs-validation-2026-09-01.json',
  'reports/postal-context-m2/gs-browser-visual-2026-09-01.json',
  'reports/postal-context-m2/gs-browser-visual-2026-09-01-fit.png',
  'reports/postal-context-m2/gs-browser-visual-2026-09-01-closeup.png',
  'data/postal_country_packs/gs/postal-context/source-profile.json',
  'data/postal_country_packs/gs/postal-context/M2-SOURCE-NOTICE.md',
  'docs/postal-context-south-georgia-south-sandwich-islands-m2.md',
];
const bytes = paths.map(path => readFileSync(new URL(path, root)));

test('GS reaches M2 only under its current UPU whole-territory definition', () => {
  assert.equal(gs.status, 'm2_verified');
  assert.equal(gs.attempts, 1);
  assert.equal(gs.blocker, null);
  assert.equal(gs.evidence.criterionSatisfied, true);
  assert.equal(gs.evidence.synthetic, false);
  assert.equal(gs.m2Definition.id, 'M2_current_upu_siqq_whole_territory_derived_visualization');
  assert.ok(manifest.promotion.stages.some(stage => stage.id === gs.m2Definition.id));
});

test('GS evidence separates official postcode assignment and derived mapping geometry', () => {
  assert.match(gs.evidence.scope, /SIQQ 1ZZ as the single postcode for the whole territory/i);
  assert.match(gs.evidence.scope, /340 South Georgia and 17 South Sandwich polygon parts/i);
  assert.match(gs.evidence.scope, /90,610 positions exactly once/i);
  assert.match(gs.evidence.scope, /not an official postal, legal, survey, cadastral or delivery boundary/i);
  assert.equal(profile.sources[0].assignment_authority, 'official_postal_dictionary');
  assert.equal(profile.sources[0].geometry_authority, 'none');
  assert.equal(profile.sources[3].assignment_authority, 'derived_spatial_assignment');
  assert.equal(profile.sources[3].geometry_authority, 'official_mapping_geometry');
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
});

test('GS ledger pins every published artifact to the immutable implementation commit', () => {
  assert.deepEqual(gs.evidence.artifacts.map(artifact => artifact.digest), bytes.map(digest));
  assert.deepEqual(gs.evidence.artifacts.map(artifact => artifact.bytes), bytes.map(value => value.byteLength));
  assert.ok(gs.evidence.artifacts.every(artifact => artifact.url.includes('/blob/0953cdeb51f02228dd4acb6c2378badca7b886dd/')));
});

test('GS sources retain editions, hashes, terms and reviewed rights', () => {
  assert.equal(gs.evidence.sources.length, 4);
  assert.ok(gs.evidence.sources.every(source => source.version && source.observedAt));
  assert.ok(gs.evidence.sources.every(source => /^sha256:[0-9a-f]{64}$/.test(source.digest)));
  assert.ok(gs.evidence.sources.every(source => source.termsUrl && /^sha256:[0-9a-f]{64}$/.test(source.termsDigest)));
  assert.ok(gs.evidence.sources.every(source => source.rightsReviewed === true));
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 10, exact_bytes: 6655035, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('GS build and running-app evidence prove two real derived surfaces without fabricated address context', () => {
  assert.equal(gs.evidence.validation.passed, 181);
  assert.equal(gs.evidence.validation.failed, 0);
  assert.equal(build.officialPostalEvidence.postalCode, 'SIQQ 1ZZ');
  assert.equal(build.transformation.outputMultiPolygons, 2);
  assert.equal(build.transformation.polygonPartsPreservedExactlyOnce, true);
  assert.equal(build.transformation.coordinateRounding, false);
  assert.equal(build.transformation.coordinateSimplification, false);
  assert.equal(validation.browser.visualInspection, 'pass');
  assert.deepEqual(validation.browser.postalApiStatuses, [200, 200]);
  assert.equal(validation.browser.fitBothTerritoryGroups, true);
  assert.equal(validation.browser.clearRemovedNotice, true);
  assert.equal(validation.browser.reSearchRestoredNotice, true);
  assert.equal(validation.browser.postalGeometrySourceWasStubbed, false);
  assert.equal(browser.visualInspection.result, 'pass');
  assert.equal(browser.renderedBluePixelCount.removedByClear, 5110);
  assert.equal(browser.renderedBluePixelCount.restoredByReSearch, 5116);
  assert.equal(validation.authoritySeparation.addressOrBuildingRelationClaimed, false);
});

test('GS completion advances exactly one country to Guatemala', () => {
  assert.equal(digest(bytes[3]), gs.lastAttempt.reportDigest);
  assert.equal(digest(bytes[4]), gs.lastAttempt.engineeringReportDigest);
  assert.equal(gt.status, 'pending');
  assert.equal(gt.attempts, 0);
});
