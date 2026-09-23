import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const mt = ledger.countries.find(country => country.countryCode === 'MT');
const nl = ledger.countries.find(country => country.countryCode === 'NL');
const manifest = readJson('data/postal_country_packs/mt/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/mt/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/mt-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/mt-checks-2026-08-30.json', root));

test('Malta remains blocked under its current postcode-area criterion', () => {
  assert.equal(mt.status, 'blocked'); assert.equal(mt.attempts, 1); assert.equal(mt.evidence, null);
  assert.equal(mt.m2Definition.id, 'M2_current_malta_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === mt.m2Definition.id), mt.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('current MaltaPost finder/API receipts remain address assignment without geometry', () => {
  const evidence = mt.blocker.evidence;
  assert.equal(evidence.operatorTowns, 89); assert.equal(evidence.operatorHamrunStreets, 116);
  assert.equal(evidence.operatorSampleSearchRecords, 3); assert.equal(evidence.operatorSampleSearchDistinctPostcodes, 1);
  assert.equal(evidence.officialPostcodePolygonRecords, 0);
  assert.equal(profile.sources.find(source => source.source_id === 'maltapost-postcode-finder-api-v1').geometry_authority, 'none');
});

test('rights, denominator and geometric proxy gates fail closed', () => {
  const evidence = mt.blocker.evidence;
  assert.equal(evidence.completeOrdinaryAndExceptionAllocationDenominatorAvailable, false);
  assert.equal(evidence.operatorDatasetSpecificBulkProcessingDerivationPublicServingAndRedistributionGrantEstablished, false);
  assert.equal(evidence.oarLocalityRows, 85); assert.equal(evidence.oarPostcodeColumns, 0); assert.equal(evidence.oarGeometryColumns, 0);
  assert.equal(evidence.addressStreetLocalityBuildingAdminCadastralProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0); assert.equal(evidence.convexOrConcaveHullsCreated, 0); assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('Malta ledger pins exact reports and preserves the next-country order', () => {
  assert.equal(digest(sourceReport), mt.lastAttempt.reportDigest); assert.equal(digest(checks), mt.lastAttempt.engineeringReportDigest);
  assert.equal(mt.blocker.evidence.sourceReviewDigest, mt.lastAttempt.reportDigest);
  assert.equal(mt.blocker.evidence.engineeringChecksDigest, mt.lastAttempt.engineeringReportDigest);
  assert.equal(nl.status, 'pending'); assert.equal(nl.region, 'europe');
});

test('shared UI capability does not promote fabricated real MT geometry', () => {
  const evidence = mt.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true); assert.equal(evidence.realMtAgidPostalApiVerified, false);
  assert.equal(evidence.realMtAgidAppAreaVisualizationVerified, false); assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.rawSourceBodiesInGit, 0); assert.equal(mt.blocker.requiresExplicitApproval, false);
  assert.match(mt.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
