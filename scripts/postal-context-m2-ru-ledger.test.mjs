import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ru = ledger.countries.find(country => country.countryCode === 'RU');
const se = ledger.countries.find(country => country.countryCode === 'SE');
const manifest = readJson('data/postal_country_packs/ru/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ru/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ru-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ru-checks-2026-08-31.json', root));

test('Russia remains blocked under its current assignment and area visualization criterion', () => {
  assert.equal(ru.status, 'blocked');
  assert.equal(ru.attempts, 1);
  assert.equal(ru.evidence, null);
  assert.equal(ru.m2Definition.id, 'M2_current_russia_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ru.m2Definition.id), ru.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('seven exact bodies pin current operator directory and FIAS authority evidence', () => {
  const evidence = ru.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 7);
  assert.equal(evidence.exactOfficialBodiesBytes, 2062744);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNNNNN');
  assert.equal(evidence.advertisedCurrentOfficeRecords, 61358);
  assert.equal(evidence.operatorReferenceDate, '2026-08-25');
  assert.equal(evidence.operatorReferenceUpdateFrequency, 'at-least-monthly');
  assert.equal(evidence.fiasGarOpenCommonAccessAddressBasisObserved, true);
  assert.equal(evidence.fiasAdvertisedSnapshotFrequency, 'twice-weekly');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('archive, assignment, rights, geometry and proxy gates fail closed', () => {
  const evidence = ru.blocker.evidence;
  assert.equal(evidence.currentRussianPostArchiveAcquired, false);
  assert.equal(evidence.currentArchiveHttpStatusObserved, 417);
  assert.equal(evidence.numberedArchiveHttpStatusObserved, 404);
  assert.equal(evidence.archiveAbsenceProven, false);
  assert.equal(evidence.completeCurrentAssignmentAndExceptionDenominatorEstablished, false);
  assert.equal(evidence.officialPostcodePolygonReleaseDiscovered, false);
  assert.equal(evidence.agidPostalAreaProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.fixedAuthoritativeGeometryArtifactsInspected, 0);
  assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.officeFiasAddressAdministrativeCadastralBuildingParcelProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('Russia ledger pins exact reports and preserves Sweden next-country order', () => {
  assert.equal(digest(sourceReport), ru.lastAttempt.reportDigest);
  assert.equal(digest(checks), ru.lastAttempt.engineeringReportDigest);
  assert.equal(ru.blocker.evidence.sourceReviewDigest, ru.lastAttempt.reportDigest);
  assert.equal(ru.blocker.evidence.engineeringChecksDigest, ru.lastAttempt.engineeringReportDigest);
  assert.equal(se.status, 'pending');
  assert.equal(se.region, 'europe');
});

test('shared UI capability does not promote a missing real RU runtime', () => {
  const evidence = ru.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realRuAgidPostalApiVerified, false);
  assert.equal(evidence.realRuAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.ruIdentityPreserved, true);
  assert.equal(ru.blocker.requiresExplicitApproval, false);
  assert.match(ru.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
