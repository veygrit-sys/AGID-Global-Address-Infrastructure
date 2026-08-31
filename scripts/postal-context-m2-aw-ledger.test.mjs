import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const aw = ledger.countries.find(country => country.countryCode === 'AW');
const manifest = readJson('data/postal_country_packs/aw/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/aw/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/aw-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/aw-checks-2026-08-31.json', root));

test('AW remains blocked under its official no-postcode and real-area criterion', () => {
  assert.equal(aw.status, 'blocked'); assert.equal(aw.attempts, 1); assert.equal(aw.evidence, null);
  assert.equal(aw.m2Definition.id, 'M2_current_post_aruba_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === aw.m2Definition.id), aw.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve the current no-postcode result', () => {
  const e = aw.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 4); assert.equal(e.exactOfficialBodiesBytes, 839174);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.postArubaStatesArubaHasNoPostalCode, true);
  assert.equal(e.upuEdition, 'Sep. 2025'); assert.equal(e.upuListsArubaAsNotRequiringPostalCodes, true);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('copyright and non-postal proxies never promote', () => {
  const e = aw.blocker.evidence;
  assert.equal(e.postArubaSiteCopyrightYear, 2026); assert.equal(e.openPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.districtLocalityNeighbourhoodAddressRouteServiceAreaProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidCellsPromoted, 0); assert.equal(e.syntheticAwPlanningCodesPromoted, 0);
  assert.equal(e.commerceZipPlaceholdersPromoted, 0); assert.equal(e.productionEligibleRecords, 0);
});

test('AW ledger pins exact reports and advances to Barbados', () => {
  assert.equal(digest(sourceReport), aw.lastAttempt.reportDigest); assert.equal(digest(checks), aw.lastAttempt.engineeringReportDigest);
  assert.equal(aw.blocker.evidence.sourceReviewDigest, aw.lastAttempt.reportDigest);
  assert.equal(aw.blocker.evidence.engineeringChecksDigest, aw.lastAttempt.engineeringReportDigest);
  const bb = ledger.countries.find(country => country.countryCode === 'BB'); assert.equal(bb.status, 'pending'); assert.equal(bb.attempts, 0);
});

test('shared capability does not promote missing AW inputs or artifacts', () => {
  const e = aw.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realAwAgidPostalApiVerified, false);
  assert.equal(e.realAwAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0); assert.equal(e.awIdentityPreserved, true);
  assert.equal(aw.blocker.requiresExplicitApproval, false);
  assert.match(aw.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
