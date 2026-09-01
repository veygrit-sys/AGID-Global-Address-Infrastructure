import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const country = ledger.countries.find(candidate => candidate.countryCode === 'DO');
const manifest = readJson('data/postal_country_packs/do/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/do/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/do-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/do-checks-2026-09-01.json', root));

test('DO remains blocked under its current complete assignment and real-area criterion', () => {
  assert.equal(country.status, 'blocked');
  assert.equal(country.attempts, 1);
  assert.equal(country.evidence, null);
  assert.equal(country.m2Definition.id, 'M2_current_inposdom_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === country.m2Definition.id), country.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
});
test('exact receipts preserve the static-index quality findings', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 12);
  assert.equal(evidence.exactOfficialBodiesBytes, 2524052);
  assert.equal(evidence.publicClientLoadsStaticPostcodeIndex, true);
  assert.equal(evidence.publicClientFetchesSameOriginPolygonEndpoint, true);
  assert.equal(evidence.searchIndexRows, 1403);
  assert.equal(evidence.validFiveDigitRows, 1401);
  assert.equal(evidence.validUniquePostcodes, 528);
  assert.equal(evidence.invalidPostcodeRows, 2);
  assert.equal(evidence.missingCoordinateRows, 0);
  assert.equal(evidence.exactDuplicateGroups, 29);
  assert.equal(evidence.indexLastModified, '2021-04-16T00:27:40Z');
  assert.equal(evidence.currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished, false);
});

test('valid Polygon probes remain observations rather than an approved complete artifact', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.polygonProbes, 3);
  assert.equal(evidence.polygonFeatures, 6);
  assert.equal(evidence.polygonRings, 6);
  assert.equal(evidence.polygonVertices, 11465);
  assert.equal(evidence.invalidPolygonRingsOrPositions, 0);
  assert.equal(evidence.completeGeometryCoverageProofPublished, false);
  assert.equal(evidence.immutableGeometryReleasePublished, false);
  assert.equal(evidence.officialDerivedVirtualClassAndProvenancePublished, false);
  assert.equal(evidence.crsMethodConfidenceAndExceptionModelPublished, false);
  assert.equal(evidence.fixedOfficialPostalGeometryArtifactsEligibleForAgid, 0);
});

test('reviewed rights and current-data access remain incompatible or controlled', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.inposdomTermsProtectPortalContentCompilationsAndPrograms, true);
  assert.equal(evidence.explicitBulkExtractionProcessingDerivationRedistributionOrPublicServingLicencePublished, false);
  assert.equal(evidence.upuCurrentCompleteDatabaseEdition, '2026.1');
  assert.equal(evidence.upuCurrentCompleteDatabaseRequiresContractNdaDataUseDeclarationAndRates, true);
  assert.equal(evidence.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(evidence.governmentOpenDataPortalInposdomDatasetCount, 4);
  assert.equal(evidence.governmentOpenDataPortalPublishesPostcodeAssignmentOrPolygonDataset, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('postal, administrative, non-area and synthetic proxies never promote', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.administrativeLocalitySectorAddressOfficeRoutePoBoxParcelBuildingProxiesPromoted, 0);
  assert.equal(evidence.pointBuffersOrHullsPromoted, 0);
  assert.equal(evidence.voronoiRasterOrAgidCellsPromoted, 0);
  assert.equal(evidence.synthetic99999FixturePromoted, false);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
});

test('official and shared map capability does not promote missing DO inputs', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.officialInposdomMapPathObserved, true);
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realDoAgidPostalApiVerified, false);
  assert.equal(evidence.realDoAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.doIdentityPreserved, true);
  assert.equal(country.blocker.requiresExplicitApproval, false);
  assert.match(country.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*contract.*NDA.*pay.*bulk crawl.*protected.*create.*publish.*deploy/i);
});

test('DO ledger pins exact reports and advances only to Ecuador', () => {
  assert.equal(digest(sourceReport), country.lastAttempt.reportDigest);
  assert.equal(digest(checks), country.lastAttempt.engineeringReportDigest);
  assert.equal(country.blocker.evidence.sourceReviewDigest, country.lastAttempt.reportDigest);
  assert.equal(country.blocker.evidence.engineeringChecksDigest, country.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(candidate => candidate.countryCode === 'EC');
  assert.equal(next.status, 'pending');
  assert.equal(next.attempts, 0);
  assert.equal(ledger.countries.some(candidate => candidate.status === 'in_progress'), false);
});
