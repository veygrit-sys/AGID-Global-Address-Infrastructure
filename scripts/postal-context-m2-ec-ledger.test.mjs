import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const country = ledger.countries.find(candidate => candidate.countryCode === 'EC');
const manifest = readJson('data/postal_country_packs/ec/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ec/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ec-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ec-checks-2026-09-01.json', root));

test('EC remains blocked under its current complete assignment and real-area criterion', () => {
  assert.equal(country.status, 'blocked');
  assert.equal(country.attempts, 1);
  assert.equal(country.evidence, null);
  assert.equal(country.m2Definition.id, 'M2_current_mintel_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === country.m2Definition.id), country.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(manifest.promotion.agid_integration_verified, false);
});

test('exact receipts preserve official semantics without treating historical counts as current', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 9);
  assert.equal(evidence.exactOfficialBodiesBytes, 667199);
  assert.equal(evidence.technicalStandardMarkedVigente, true);
  assert.equal(evidence.technicalStandardHistoricalZoneCount, 1225);
  assert.equal(evidence.historicalZoneCountTreatedAsCurrentDenominator, false);
  assert.equal(evidence.standardAllowsAssignmentChanges, true);
  assert.equal(evidence.currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished, false);
});

test('official example remains a bounded observation rather than an approved national artifact', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.fixedOfficialExample, '180204');
  assert.equal(evidence.lookupRows, 1);
  assert.equal(evidence.lookupGeometryType, 'MultiPolygon');
  assert.equal(evidence.lookupCoordinatePairs, 227);
  assert.equal(evidence.lookupClosedRings, 1);
  assert.equal(evidence.lookupInvalidPositions, 0);
  assert.equal(evidence.officialClientFetchesSameOriginLookup, true);
  assert.equal(evidence.officialClientFitsAndDrawsArea, true);
  assert.equal(evidence.completeAssignmentOrGeometryCoverageProofPublished, false);
  assert.equal(evidence.fixedOfficialPostalGeometryArtifactsEligibleForAgid, 0);
});

test('controlled public-product declaration is not mistaken for compatible granted rights', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.officialVectorProductDeclaredPublic, true);
  assert.equal(evidence.vectorDownloadRequiresUseAgreementAcceptance, true);
  assert.equal(evidence.vectorDownloadRequiresSafeguards, true);
  assert.equal(evidence.annexOneUseAgreementIncludedInFixedResolution, false);
  assert.equal(evidence.useAgreementReviewedOrAccepted, false);
  assert.equal(evidence.vectorArtifactDownloaded, false);
  assert.equal(evidence.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('administrative, non-area and synthetic proxies never promote', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.administrativePlanningCensusLocalityAddressOfficeRoutePoBoxParcelBuildingProxiesPromoted, 0);
  assert.equal(evidence.pointBuffersOrHullsPromoted, 0);
  assert.equal(evidence.voronoiRasterOrAgidCellsPromoted, 0);
  assert.equal(evidence.synthetic999999FixturePromoted, false);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
});

test('official and shared map capability does not promote missing EC inputs', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.officialMapPathObserved, true);
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realEcAgidPostalApiVerified, false);
  assert.equal(evidence.realEcAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.separateDataAppBuilt, false);
  assert.equal(evidence.ecIdentityPreserved, true);
  assert.equal(country.blocker.requiresExplicitApproval, false);
  assert.match(country.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*agreement.*protected download.*bulk crawl.*create.*publish.*deploy/i);
});

test('EC ledger pins exact reports and advances only to Falkland Islands', () => {
  assert.equal(digest(sourceReport), country.lastAttempt.reportDigest);
  assert.equal(digest(checks), country.lastAttempt.engineeringReportDigest);
  assert.equal(country.blocker.evidence.sourceReviewDigest, country.lastAttempt.reportDigest);
  assert.equal(country.blocker.evidence.engineeringChecksDigest, country.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(candidate => candidate.countryCode === 'FK');
  assert.equal(next.status, 'pending');
  assert.equal(next.attempts, 0);
  assert.equal(ledger.countries.some(candidate => candidate.status === 'in_progress'), false);
});
