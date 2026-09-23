import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bo = ledger.countries.find(country => country.countryCode === 'BO');
const manifest = readJson('data/postal_country_packs/bo/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bo/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/bo-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/bo-checks-2026-08-31.json', root));

test('BO remains blocked under its current no-postcode and real-area criterion', () => {
  assert.equal(bo.status, 'blocked'); assert.equal(bo.attempts, 1); assert.equal(bo.evidence, null);
  assert.equal(bo.m2Definition.id, 'M2_current_agbc_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bo.m2Definition.id), bo.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve the current Bolivia no-postcode result', () => {
  const e = bo.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 9); assert.equal(e.exactOfficialBodiesBytes, 1421915);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.currentAddressingSheetEdition, '2/2026');
  assert.equal(e.upuNoPostcodeListEdition, 'Sep. 2025'); assert.equal(e.upuListsBoliviaAsNotRequiringPostalCodes, true);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('tracking, P.O. Box, rights and office aggregates fail closed', () => {
  const e = bo.blocker.evidence;
  assert.equal(e.agbcTrackingIdentifierExample, 'PE123456789'); assert.equal(e.agbcTrackingIdentifierTreatedAsPostcode, false);
  assert.equal(e.poBoxIdentifierTreatedAsPostcode, false); assert.equal(e.agbcOfficeRecordsInspectedAsAggregate, 9);
  assert.equal(e.agbcSiteCopyrightYear, 2026); assert.equal(e.agbcSiteAllRightsReserved, true);
  assert.equal(e.agbcTermsLinkTarget, '#'); assert.equal(e.publishedTermsTargetValidated, false);
  assert.equal(e.openPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
});

test('Colombian false positive and all proxy surfaces never promote', () => {
  const e = bo.blocker.evidence;
  assert.equal(e.arcgisFalsePositiveSpatialReference, 'EPSG:3116'); assert.equal(e.arcgisFalsePositiveIsBolivia, false);
  assert.equal(e.arcgisFalsePositiveFeatureRowsQueried, 0); assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.administrativeOfficeRouteAddressBuildingPointBufferModelOrAgidProxiesPromoted, 0);
  assert.equal(e.foreignPolygonsPromoted, 0); assert.equal(e.trackingIdentifiersOrPoBoxNumbersPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.rawSourceBodiesInGit, 0);
});

test('BO ledger pins exact reports and advances to Caribbean Netherlands', () => {
  assert.equal(digest(sourceReport), bo.lastAttempt.reportDigest); assert.equal(digest(checks), bo.lastAttempt.engineeringReportDigest);
  assert.equal(bo.blocker.evidence.sourceReviewDigest, bo.lastAttempt.reportDigest);
  assert.equal(bo.blocker.evidence.engineeringChecksDigest, bo.lastAttempt.engineeringReportDigest);
  const bq = ledger.countries.find(country => country.countryCode === 'BQ'); assert.equal(bq.status, 'pending'); assert.equal(bq.attempts, 0);
});

test('shared capability does not promote missing BO inputs or artifacts', () => {
  const e = bo.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realBoAgidPostalApiVerified, false);
  assert.equal(e.realBoAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.boIdentityPreserved, true);
  assert.equal(bo.blocker.requiresExplicitApproval, false); assert.equal(bo.blocker.retryAfter, '2026-09-07T12:44:51.745Z');
  assert.match(bo.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
