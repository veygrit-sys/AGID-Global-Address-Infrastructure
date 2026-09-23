import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bf = ledger.countries.find(country => country.countryCode === 'BF');
const manifest = readJson('data/postal_country_packs/bf/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bf/postal-context/source-profile.json');
const draft = readJson('data/postal_country_packs/bf/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/bf-source-review-2026-09-03.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/bf-checks-2026-09-03.json', root));

test('BF remains blocked while staying in postcode data-creation scope', () => {
  assert.equal(bf.status, 'blocked');
  assert.equal(bf.attempts, 1);
  assert.equal(bf.evidence, null);
  assert.equal(bf.m2Definition.id, 'M2_current_la_poste_burkina_faso_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bf.m2Definition.id), bf.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(bf.blocker.evidence.dataCreationScope, 'included_current_postcode_system_blocked_rights_and_geometry');
  assert.equal(bf.blocker.evidence.postcodeDataCreationTarget, true);
});

test('exact official receipts retain current five-digit and typed-object semantics', () => {
  const e = bf.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 10);
  assert.equal(e.exactOfficialBodiesBytes, 1364535);
  assert.equal(e.currentPostalSystemConfirmed, true);
  assert.equal(e.currentPostalCodeFormat, 'NNNNN');
  assert.equal(e.representativeCommuneCode, '10000');
  assert.equal(e.representativeQuarterCode, '10010');
  assert.equal(e.communeQuarterAndAgencyObjectsKeptDistinct, true);
  assert.equal(e.postalBoxIsNonPostcodeObject, true);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('restricted rights and non-postal proxies never promote', () => {
  const e = bf.blocker.evidence;
  assert.equal(e.laPosteAllRightsReservedRecorded, true);
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.countryRegionProvinceCommuneQuarterVillageAgencyBoxRoutePointOrBuildingProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0);
  assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidCellsPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('existing BF planning pack remains draft synthetic material', () => {
  const e = bf.blocker.evidence;
  assert.equal(draft.officialStatus, 'draft');
  assert.equal(draft.counts.sources, 3);
  assert.equal(draft.counts.localities, 48);
  assert.equal(draft.counts.boundaries, 12);
  assert.equal(draft.counts.planningCells, 218);
  assert.equal(draft.counts.routeEvidence, 55);
  assert.equal(draft.counts.qualityEvidence, 41);
  assert.equal(draft.counts.testVectors, 3);
  assert.equal(e.syntheticBfPlanningCellsPromoted, 0);
  assert.equal(e.syntheticFixturePromoted, false);
});

test('BF ledger pins exact reports and advances to Burundi', () => {
  assert.equal(digest(sourceReport), bf.lastAttempt.reportDigest);
  assert.equal(digest(checks), bf.lastAttempt.engineeringReportDigest);
  assert.equal(bf.blocker.evidence.sourceReviewDigest, bf.lastAttempt.reportDigest);
  assert.equal(bf.blocker.evidence.engineeringChecksDigest, bf.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'BI');
  assert.equal(next.status, 'pending');
  assert.equal(next.attempts, 0);
});

test('actual app result and visual limitations are represented without postal promotion', () => {
  const e = bf.blocker.evidence;
  assert.equal(e.appStarted, true);
  assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realBfAgidPostalApiStatus, 404);
  assert.equal(e.realBfAgidPostalApiVerified, false);
  assert.equal(e.realBfAgidAppAreaVisualizationVerified, false);
  assert.equal(e.controlledNonPostalAddressContextObserved, true);
  assert.equal(e.controlledNonPostalAgidIdPromotedToPostalId, false);
  assert.equal(e.manualVisualInspection, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0);
  assert.equal(e.rawSourceBodiesInGit, 0);
  assert.match(bf.blocker.retryPolicy, /Do not contact.*bulk extract.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
