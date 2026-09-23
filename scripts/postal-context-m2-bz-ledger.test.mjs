import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bz = ledger.countries.find(country => country.countryCode === 'BZ');
const manifest = readJson('data/postal_country_packs/bz/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bz/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/bz-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/bz-checks-2026-08-31.json', root));

test('BZ remains blocked under its current no-postcode and real-area criterion', () => {
  assert.equal(bz.status, 'blocked'); assert.equal(bz.attempts, 1); assert.equal(bz.evidence, null);
  assert.equal(bz.m2Definition.id, 'M2_current_belize_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bz.m2Definition.id), bz.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve the current Belize no-postcode result', () => {
  const e = bz.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 7); assert.equal(e.exactOfficialBodiesBytes, 1055719);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuBelizeSheetEdition, '05/2021');
  assert.equal(e.upuNoPostcodeListEdition, 'Sep. 2025'); assert.equal(e.upuListsBelizeAsNotRequiringPostalCodes, true);
  assert.equal(e.belizePostalServiceCurrentPagesContainPostcodeRequirement, false);
  assert.equal(e.upuAddressExampleContainsPostcode, false); assert.equal(e.poBoxNumbersArePostcodes, false);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0); assert.equal(e.completeAssignmentDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('boxes, address examples and geographic proxies fail closed', () => {
  const e = bz.blocker.evidence;
  assert.equal(e.poBoxNumbersArePostcodes, false); assert.equal(e.upuAddressExampleContainsPostcode, false);
  assert.equal(e.districtCayeSettlementLocalityOfficeRouteAddressBuildingParcelPointBufferCellModelOrAgidProxiesPromoted, 0);
  assert.equal(e.bzIdentityPreserved, true); assert.equal(e.sixDistrictIdentitiesPreserved, true);
  assert.equal(e.cayeAndSettlementIdentitiesPreserved, true);
});

test('reference rights and all proxy surfaces never promote', () => {
  const e = bz.blocker.evidence;
  assert.equal(e.upuDisclaimerAllowsWebsiteInformationReuseWithAcknowledgement, true);
  assert.equal(e.upuCopyrightAndDatabaseConditionsRemainApplicable, true);
  assert.equal(e.upuReferenceInformationTreatedAsPostalDatasetLicence, false);
  assert.equal(e.openCurrentAssignmentAndGeometryDatasetLicencePublished, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.rawSourceBodiesInGit, 0);
});

test('BZ ledger pins exact reports and advances to Canada', () => {
  assert.equal(digest(sourceReport), bz.lastAttempt.reportDigest); assert.equal(digest(checks), bz.lastAttempt.engineeringReportDigest);
  assert.equal(bz.blocker.evidence.sourceReviewDigest, bz.lastAttempt.reportDigest);
  assert.equal(bz.blocker.evidence.engineeringChecksDigest, bz.lastAttempt.engineeringReportDigest);
  const ca = ledger.countries.find(country => country.countryCode === 'CA'); assert.equal(ca.status, 'pending'); assert.equal(ca.attempts, 0);
});

test('shared capability does not promote missing BZ inputs or artifacts', () => {
  const e = bz.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realBzAgidPostalRuntimeVerified, false);
  assert.equal(e.realBzAgidPostalApiVerified, false); assert.equal(e.realBzAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false); assert.equal(e.approvedAgidRuntimeArtifacts, 0);
  assert.equal(bz.blocker.requiresExplicitApproval, false); assert.equal(bz.blocker.retryAfter, '2026-09-07T15:51:58.097Z');
  assert.match(bz.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
