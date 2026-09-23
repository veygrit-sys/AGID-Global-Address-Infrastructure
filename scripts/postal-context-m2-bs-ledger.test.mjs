import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bs = ledger.countries.find(country => country.countryCode === 'BS');
const manifest = readJson('data/postal_country_packs/bs/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bs/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/bs-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/bs-checks-2026-08-31.json', root));

test('BS remains blocked under its current no-postcode and real-area criterion', () => {
  assert.equal(bs.status, 'blocked'); assert.equal(bs.attempts, 1); assert.equal(bs.evidence, null);
  assert.equal(bs.m2Definition.id, 'M2_current_bahamas_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bs.m2Definition.id), bs.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve the current Bahamas no-postcode result', () => {
  const e = bs.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 6); assert.equal(e.exactOfficialBodiesBytes, 2910631);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuBahamasSheetEdition, '10/2025');
  assert.equal(e.upuBahamasSaysNoPostcodeSystem, true); assert.equal(e.upuBahamasSaysNoHomeDeliverySystem, true);
  assert.equal(e.mailDispatchMode, 'Post Office Boxes'); assert.equal(e.postRestanteAvailableWithoutPoBox, true);
  assert.equal(e.upuNoPostcodeListEdition, 'Sep. 2025'); assert.equal(e.upuListsBahamasAsNotRequiringPostalCodes, true);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0); assert.equal(e.completeAssignmentDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('boxes, post-office abbreviations and island names fail closed', () => {
  const e = bs.blocker.evidence;
  assert.equal(e.postOfficeAbbreviationsArePostcodes, false); assert.equal(e.poBoxNumbersArePostcodes, false);
  assert.equal(e.islandNamesOrAbbreviationsArePostcodes, false);
  assert.equal(e.islandAdministrativePlanningElectoralLocalityOfficeRouteAddressBuildingParcelProxiesPromoted, 0);
  assert.equal(e.bsIdentityPreserved, true); assert.equal(e.islandIdentitiesPreserved, true);
});

test('reference rights and all proxy surfaces never promote', () => {
  const e = bs.blocker.evidence;
  assert.equal(e.upuDisclaimerAllowsWebsiteInformationReuseWithAcknowledgement, true);
  assert.equal(e.upuCopyrightAndDatabaseConditionsRemainApplicable, true);
  assert.equal(e.upuReferenceInformationTreatedAsPostalDatasetLicence, false);
  assert.equal(e.openCurrentAssignmentAndGeometryDatasetLicencePublished, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.rawSourceBodiesInGit, 0);
});

test('BS ledger pins exact reports and advances to Belize', () => {
  assert.equal(digest(sourceReport), bs.lastAttempt.reportDigest); assert.equal(digest(checks), bs.lastAttempt.engineeringReportDigest);
  assert.equal(bs.blocker.evidence.sourceReviewDigest, bs.lastAttempt.reportDigest);
  assert.equal(bs.blocker.evidence.engineeringChecksDigest, bs.lastAttempt.engineeringReportDigest);
  const bz = ledger.countries.find(country => country.countryCode === 'BZ'); assert.equal(bz.status, 'pending'); assert.equal(bz.attempts, 0);
});

test('shared capability does not promote missing BS inputs or artifacts', () => {
  const e = bs.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realBsAgidPostalRuntimeVerified, false);
  assert.equal(e.realBsAgidPostalApiVerified, false); assert.equal(e.realBsAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false); assert.equal(e.approvedAgidRuntimeArtifacts, 0);
  assert.equal(bs.blocker.requiresExplicitApproval, false); assert.equal(bs.blocker.retryAfter, '2026-09-07T14:59:26.917Z');
  assert.match(bs.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
