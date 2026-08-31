import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const se = ledger.countries.find(country => country.countryCode === 'SE');
const si = ledger.countries.find(country => country.countryCode === 'SI');
const manifest = readJson('data/postal_country_packs/se/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/se/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/se-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/se-checks-2026-08-31.json', root));

test('Sweden remains blocked under its five-digit assignment and area visualization criterion', () => {
  assert.equal(se.status, 'blocked');
  assert.equal(se.attempts, 1);
  assert.equal(se.evidence, null);
  assert.equal(se.m2Definition.id, 'M2_current_sweden_five_digit_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === se.m2Definition.id), se.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('nine exact bodies pin governance, provider rights and address Point evidence', () => {
  const evidence = se.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 9);
  assert.equal(evidence.exactOfficialAndProviderBodiesBytes, 910512);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNNNN');
  assert.equal(evidence.displayPostcodeFormat, 'NNN NN');
  assert.equal(evidence.advertisedApproximatePostcodes, 17000);
  assert.equal(evidence.advertisedPostTowns, 1743);
  assert.equal(evidence.advertisedDeliverablePostcodes, 10500);
  assert.equal(evidence.postnummerserviceAdvertisedUpdateFrequency, 'weekly');
  assert.equal(evidence.lantmaterietAdvertisedUpdateFrequency, 'half-yearly');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('delivery, rights, assignment, endpoint, geometry and proxy gates fail closed', () => {
  const evidence = se.blocker.evidence;
  assert.equal(evidence.commercialFiveDigitPostcodeSurfaceProductAdvertised, true);
  assert.equal(evidence.postnummerserviceProductPurchasedOrDelivered, false);
  assert.equal(evidence.postnummerserviceResaleAllowed, false);
  assert.equal(evidence.postnummerserviceSublicensingAllowed, false);
  assert.equal(evidence.lantmaterietCcBy4Observed, true);
  assert.equal(evidence.lantmaterietApplicationSubmittedOrApproved, false);
  assert.equal(evidence.completeCurrentAssignmentAndEndpointExceptionDenominatorEstablished, false);
  assert.equal(evidence.officialPostcodePolygonReleaseDiscovered, false);
  assert.equal(evidence.agidPostalAreaProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.fixedAuthorizedGeometryArtifactsInspected, 0);
  assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.addressPointMunicipalAdministrativeBuildingParcelProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('Sweden ledger pins exact reports and preserves Slovenia next-country order', () => {
  assert.equal(digest(sourceReport), se.lastAttempt.reportDigest);
  assert.equal(digest(checks), se.lastAttempt.engineeringReportDigest);
  assert.equal(se.blocker.evidence.sourceReviewDigest, se.lastAttempt.reportDigest);
  assert.equal(se.blocker.evidence.engineeringChecksDigest, se.lastAttempt.engineeringReportDigest);
  assert.equal(si.status, 'pending');
  assert.equal(si.region, 'europe');
});

test('shared UI capability does not promote a missing real SE runtime', () => {
  const evidence = se.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realSeAgidPostalApiVerified, false);
  assert.equal(evidence.realSeAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.seIdentityPreserved, true);
  assert.equal(se.blocker.requiresExplicitApproval, false);
  assert.match(se.blocker.retryPolicy, /Do not contact.*register.*authenticate.*application.*accept.*pay.*create.*publish.*deploy/i);
});
