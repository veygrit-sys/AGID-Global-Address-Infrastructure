import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const jm = ledger.countries.find(country => country.countryCode === 'JM');
const manifest = readJson('data/postal_country_packs/jm/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/jm/postal-context/source-profile.json');
const draftPack = readJson('data/postal_country_packs/jm/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/jm-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/jm-checks-2026-09-01.json', root));

test('JM remains blocked and excluded from postcode data creation under its no-postcode criterion', () => {
  assert.equal(jm.status, 'blocked'); assert.equal(jm.attempts, 1); assert.equal(jm.evidence, null);
  assert.equal(jm.m2Definition.id, 'M2_current_jamaica_post_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === jm.m2Definition.id), jm.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(jm.blocker.evidence.dataCreationScope, 'excluded_no_current_postcode_system');
  assert.equal(jm.blocker.evidence.postcodeDataCreationTarget, false);
});

test('exact official receipts preserve current no-postcode and Kingston-sector semantics', () => {
  const e = jm.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 7); assert.equal(e.exactOfficialBodiesBytes, 1076160);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuListsJamaicaAsNotRequiringPostalCodes, true);
  assert.equal(e.upuJamaicaSheetStatesNoPostcodeSystem, true); assert.equal(e.kingstonSectorCodesAreNotPostcodes, true);
  assert.equal(e.optionalPostcodeMetadataAndTemplateFieldCorrected, true);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('restricted rights and non-postal proxies never promote', () => {
  const e = jm.blocker.evidence;
  assert.equal(e.jamaicaPostAllRightsReservedRecorded, true);
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.openPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.islandParishKingstonSectorLocalityOfficeRouteServiceAreaProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidCellsPromoted, 0); assert.equal(e.commerceZipPlaceholdersPromoted, 0); assert.equal(e.productionEligibleRecords, 0);
});

test('existing JM planning pack remains draft synthetic material', () => {
  const e = jm.blocker.evidence;
  assert.equal(draftPack.officialStatus, 'draft'); assert.equal(draftPack.counts.localities, 48);
  assert.equal(draftPack.counts.boundaries, 12); assert.equal(draftPack.counts.planningCells, 225); assert.equal(draftPack.counts.testVectors, 3);
  assert.equal(e.syntheticJmPlanningCellsAvailable, 225); assert.equal(e.syntheticJmPlanningCellsPromoted, 0);
  assert.equal(e.syntheticJmCodeSeedsPromoted, 0); assert.equal(e.syntheticFixturePromoted, false);
});

test('JM ledger pins exact reports and advances to Saint Kitts and Nevis', () => {
  assert.equal(digest(sourceReport), jm.lastAttempt.reportDigest); assert.equal(digest(checks), jm.lastAttempt.engineeringReportDigest);
  assert.equal(jm.blocker.evidence.sourceReviewDigest, jm.lastAttempt.reportDigest);
  assert.equal(jm.blocker.evidence.engineeringChecksDigest, jm.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'KN'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('actual app failure is recorded without promoting shared capability or controlled browser evidence', () => {
  const e = jm.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realJmAgidPostalApiStatus, 404); assert.equal(e.realJmAgidPostalApiVerified, false);
  assert.equal(e.realJmAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.inAppBrowserNavigated, false); assert.equal(e.deterministicPlaywrightFallbackRan, true);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(jm.blocker.requiresExplicitApproval, false);
  assert.match(jm.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
