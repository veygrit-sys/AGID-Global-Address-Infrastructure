import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const no = ledger.countries.find(country => country.countryCode === 'NO');
const pl = ledger.countries.find(country => country.countryCode === 'PL');
const manifest = readJson('data/postal_country_packs/no/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/no/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/no-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/no-checks-2026-08-30.json', root));

test('Norway remains blocked under its current assignment and official area criterion', () => {
  assert.equal(no.status, 'blocked'); assert.equal(no.attempts, 1); assert.equal(no.evidence, null);
  assert.equal(no.m2Definition.id, 'M2_current_norway_assignment_and_official_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === no.m2Definition.id), no.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('the full current Posten register and category denominator are pinned', () => {
  const evidence = no.blocker.evidence;
  assert.equal(evidence.postenRows, 5122); assert.equal(evidence.postenDistinctPostcodes, 5122);
  assert.equal(evidence.postenMalformedRows, 0); assert.equal(evidence.postenDuplicatePostcodes, 0);
  assert.equal(evidence.categoryG, 3318); assert.equal(evidence.categoryP, 1740);
  assert.equal(evidence.categoryB, 60); assert.equal(evidence.categoryS, 4);
  assert.equal(profile.sources.find(source => source.source_id === 'posten-bring-norway-postcode-register').redistribution_class, 'R1_public_reference');
});

test('rights, fixed geometry, non-area and territory gates fail closed', () => {
  const evidence = no.blocker.evidence;
  assert.equal(evidence.postenDatasetSpecificAgidProcessingAndPublicServingGrantEstablished, false);
  assert.equal(evidence.kartverketPostnummeromraaderCcBy40Observed, true);
  assert.equal(evidence.fixedKartverketGeometryArtifactsInspected, 0); assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.poBoxOrSpecialAreasInvented, 0); assert.equal(evidence.municipalityCountyAddressBuildingOrFkbProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0); assert.equal(evidence.convexOrConcaveHulls, 0); assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false); assert.equal(evidence.noAndSjIdentityPreserved, true);
  assert.equal(evidence.countyLike21SvalbardRows, 7); assert.equal(evidence.countyLike22JanMayenRows, 1);
});

test('Norway ledger pins exact reports and preserves Poland next-country order', () => {
  assert.equal(digest(sourceReport), no.lastAttempt.reportDigest); assert.equal(digest(checks), no.lastAttempt.engineeringReportDigest);
  assert.equal(no.blocker.evidence.sourceReviewDigest, no.lastAttempt.reportDigest);
  assert.equal(no.blocker.evidence.engineeringChecksDigest, no.lastAttempt.engineeringReportDigest);
  assert.equal(pl.status, 'pending'); assert.equal(pl.region, 'europe');
});

test('shared UI capability does not promote a missing real NO runtime', () => {
  const evidence = no.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true); assert.equal(evidence.realNoAgidPostalApiVerified, false);
  assert.equal(evidence.realNoAgidAppAreaVisualizationVerified, false); assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0); assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(no.blocker.requiresExplicitApproval, false);
  assert.match(no.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
