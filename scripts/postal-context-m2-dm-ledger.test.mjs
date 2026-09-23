import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const dm = ledger.countries.find(country => country.countryCode === 'DM');
const manifest = readJson('data/postal_country_packs/dm/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/dm/postal-context/source-profile.json');
const draftPack = readJson('data/postal_country_packs/dm/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/dm-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/dm-checks-2026-09-01.json', root));

test('DM remains blocked under its official no-postcode and real-area criterion', () => {
  assert.equal(dm.status, 'blocked'); assert.equal(dm.attempts, 1); assert.equal(dm.evidence, null);
  assert.equal(dm.m2Definition.id, 'M2_current_dominica_postal_service_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === dm.m2Definition.id), dm.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve current no-postcode status and the address correction', () => {
  const e = dm.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 6); assert.equal(e.exactOfficialBodiesBytes, 1455690);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuListsDominicaAsNotRequiringPostalCodes, true);
  assert.equal(e.upuAddressingSheetRoseauExampleHasNoPostcode, true);
  assert.equal(e.optionalPostcodeMetadataAndTemplateFieldCorrected, true);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('restricted rights and non-postal proxies never promote', () => {
  const e = dm.blocker.evidence;
  assert.equal(e.dominicaGovernmentAllowsOnlyUnalteredPersonalNonCommercialCopying, true);
  assert.equal(e.dominicaGovernmentProhibitsTransmissionOrDistributionWithoutPriorWrittenPermission, true);
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.openPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.islandParishDistrictLocalityAddressOfficeRouteServiceAreaProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidCellsPromoted, 0); assert.equal(e.commerceZipPlaceholdersPromoted, 0);
  assert.equal(e.dominicanRepublicCodesPromoted, 0); assert.equal(e.productionEligibleRecords, 0);
});

test('existing DM planning pack remains draft synthetic material', () => {
  const e = dm.blocker.evidence;
  assert.equal(draftPack.officialStatus, 'draft'); assert.equal(draftPack.counts.localities, 48);
  assert.equal(draftPack.counts.planningCells, 246); assert.equal(draftPack.counts.testVectors, 3);
  assert.equal(e.syntheticDmPlanningCellsAvailable, 246); assert.equal(e.syntheticDmPlanningCellsPromoted, 0);
  assert.equal(e.syntheticDmCodeSeedsPromoted, 0); assert.equal(e.syntheticFixturePromoted, false);
});

test('DM ledger pins exact reports and advances to Dominican Republic', () => {
  assert.equal(digest(sourceReport), dm.lastAttempt.reportDigest); assert.equal(digest(checks), dm.lastAttempt.engineeringReportDigest);
  assert.equal(dm.blocker.evidence.sourceReviewDigest, dm.lastAttempt.reportDigest);
  assert.equal(dm.blocker.evidence.engineeringChecksDigest, dm.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'DO'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('shared capability does not promote missing DM inputs, artifacts or DO identity', () => {
  const e = dm.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realDmAgidPostalApiVerified, false);
  assert.equal(e.realDmAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(e.dmIdentityPreserved, true); assert.equal(e.dominicanRepublicDoIdentityKeptSeparate, true);
  assert.equal(dm.blocker.requiresExplicitApproval, false);
  assert.match(dm.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
