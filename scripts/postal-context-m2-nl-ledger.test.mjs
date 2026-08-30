import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const nl = ledger.countries.find(country => country.countryCode === 'NL');
const no = ledger.countries.find(country => country.countryCode === 'NO');
const manifest = readJson('data/postal_country_packs/nl/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/nl/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/nl-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/nl-checks-2026-08-30.json', root));

test('Netherlands remains blocked under its current assignment and CBS area criterion', () => {
  assert.equal(nl.status, 'blocked'); assert.equal(nl.attempts, 1); assert.equal(nl.evidence, null);
  assert.equal(nl.m2Definition.id, 'M2_current_netherlands_pc6_assignment_and_cbs_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === nl.m2Definition.id), nl.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('corrected CBS release is pinned as valid derived geometry only', () => {
  const evidence = nl.blocker.evidence;
  assert.equal(evidence.cbsCorrectedPc6Features, 465935);
  assert.equal(evidence.cbsDistinctPc6Codes, 465935);
  assert.equal(evidence.cbsMalformedCodes, 0); assert.equal(evidence.cbsEmptyGeometry, 0); assert.equal(evidence.cbsInvalidGeometry, 0);
  assert.equal(evidence.cbsPolygonParts, 597956); assert.equal(evidence.cbsPositions, 14458509);
  assert.equal(profile.sources.find(source => source.source_id === 'cbs-esri-postcode-statistics-areas').geometry_authority, 'derived_geometry');
  assert.equal(profile.sources.find(source => source.source_id === 'cbs-esri-postcode-statistics-areas').assignment_authority, 'none');
});

test('PostNL rights, denominator and exception gates fail closed', () => {
  const evidence = nl.blocker.evidence;
  assert.equal(evidence.completeOrdinaryAndExceptionPostnlDenominatorAvailableForAgidPublicServing, false);
  assert.equal(evidence.postnlDatasetSpecificAgidProcessingDerivationPublicServingAndRedistributionGrantEstablished, false);
  assert.equal(evidence.headquarters2521CaAreaRecords, 1); assert.equal(evidence.publicPoBox2500GgAreaRecords, 0);
  assert.equal(evidence.cbsDerivedAreasPromotedAsPostnlAssignment, 0);
  assert.equal(evidence.poBoxNapoOrganizationReplyFreepostFacilityOrSpecialAreasInvented, 0);
  assert.equal(evidence.bagAddressBuildingPc4Pc5AdminStatisticalCadastralProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0); assert.equal(evidence.convexOrConcaveHullsCreated, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0); assert.equal(evidence.syntheticFixturePromoted, false);
});

test('Netherlands ledger pins exact reports and preserves Norway next-country order', () => {
  assert.equal(digest(sourceReport), nl.lastAttempt.reportDigest); assert.equal(digest(checks), nl.lastAttempt.engineeringReportDigest);
  assert.equal(nl.blocker.evidence.sourceReviewDigest, nl.lastAttempt.reportDigest);
  assert.equal(nl.blocker.evidence.engineeringChecksDigest, nl.lastAttempt.engineeringReportDigest);
  assert.equal(no.status, 'pending'); assert.equal(no.region, 'europe');
});

test('shared UI capability does not promote a partial real NL runtime', () => {
  const evidence = nl.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true); assert.equal(evidence.realNlAgidPostalApiVerified, false);
  assert.equal(evidence.realNlAgidAppAreaVisualizationVerified, false); assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.rawSourceBodiesInGit, 0); assert.equal(nl.blocker.requiresExplicitApproval, false);
  assert.match(nl.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
