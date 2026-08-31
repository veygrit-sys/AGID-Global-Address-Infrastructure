import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const cw = ledger.countries.find(country => country.countryCode === 'CW');
const manifest = readJson('data/postal_country_packs/cw/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/cw/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/cw-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/cw-checks-2026-09-01.json', root));

test('CW remains blocked under its official no-postcode and real-area criterion', () => {
  assert.equal(cw.status, 'blocked'); assert.equal(cw.attempts, 1); assert.equal(cw.evidence, null);
  assert.equal(cw.m2Definition.id, 'M2_current_cpost_curacao_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === cw.m2Definition.id), cw.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve current no-postcode status and the address correction', () => {
  const e = cw.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 4); assert.equal(e.exactOfficialBodiesBytes, 926717);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuListsCuracaoAsNotRequiringPostalCodes, true);
  assert.equal(e.cpostCurrentServicesReviewed, true); assert.equal(e.unverifiedFourDigitMetadataCorrected, true);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('copyright and non-postal proxies never promote', () => {
  const e = cw.blocker.evidence;
  assert.equal(e.cpostSiteCopyrightYear, 2026); assert.equal(e.openPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.islandDistrictLocalityNeighbourhoodAddressRouteServiceAreaProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidCellsPromoted, 0); assert.equal(e.syntheticCwPlanningCodesPromoted, 0);
  assert.equal(e.commerceZipPlaceholdersPromoted, 0); assert.equal(e.unverifiedFourDigitValidatorsPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('CW ledger pins exact reports and advances to Dominica', () => {
  assert.equal(digest(sourceReport), cw.lastAttempt.reportDigest); assert.equal(digest(checks), cw.lastAttempt.engineeringReportDigest);
  assert.equal(cw.blocker.evidence.sourceReviewDigest, cw.lastAttempt.reportDigest);
  assert.equal(cw.blocker.evidence.engineeringChecksDigest, cw.lastAttempt.engineeringReportDigest);
  const dm = ledger.countries.find(country => country.countryCode === 'DM'); assert.equal(dm.status, 'pending'); assert.equal(dm.attempts, 0);
});

test('shared capability does not promote missing CW inputs or artifacts', () => {
  const e = cw.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realCwAgidPostalApiVerified, false);
  assert.equal(e.realCwAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0); assert.equal(e.cwIdentityPreserved, true);
  assert.equal(cw.blocker.requiresExplicitApproval, false);
  assert.match(cw.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
