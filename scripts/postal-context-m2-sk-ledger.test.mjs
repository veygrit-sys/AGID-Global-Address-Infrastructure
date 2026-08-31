import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const sk = ledger.countries.find(country => country.countryCode === 'SK');
const manifest = readJson('data/postal_country_packs/sk/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/sk/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/sk-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/sk-checks-2026-08-31.json', root));

test('SK remains blocked under its complete assignment and area visualization criterion', () => {
  assert.equal(sk.status, 'blocked');
  assert.equal(sk.attempts, 1);
  assert.equal(sk.evidence, null);
  assert.equal(sk.m2Definition.id, 'M2_current_slovakia_psc_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === sk.m2Definition.id), sk.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('twenty exact bodies bind bounded operator samples and current real address data', () => {
  const evidence = sk.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 20);
  assert.equal(evidence.exactOfficialBodiesBytes, 135325717);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNN NN');
  assert.equal(evidence.operatorSampleQueries, 2);
  assert.equal(evidence.operatorSampleAssignmentRows, 2);
  assert.equal(evidence.completeOperatorAssignmentDenominatorEstablished, false);
  assert.equal(evidence.nuts3MetadataDatasets, 8);
  assert.equal(evidence.registerAddressesCcBy4ForAuthorAndDatabaseRightsObserved, true);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('real address and access-point Points fail area, rights, reconciliation and proxy gates closed', () => {
  const evidence = sk.blocker.evidence;
  assert.equal(evidence.slovakPostAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.accessPointRecords, 2449);
  assert.equal(evidence.accessPointPointRecords, 2449);
  assert.equal(evidence.accessPointPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.sk010AddressFeatures, 160897);
  assert.equal(evidence.sk010PointFeatures, 158803);
  assert.equal(evidence.sk010NullGeometryFeatures, 2094);
  assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(evidence.addressPointsPromotedAsAreas, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0);
  assert.equal(evidence.administrativeCadastralBuildingOfficeProxiesPromoted, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
});

test('SK ledger pins exact reports and keeps the next country pending', () => {
  assert.equal(digest(sourceReport), sk.lastAttempt.reportDigest);
  assert.equal(digest(checks), sk.lastAttempt.engineeringReportDigest);
  assert.equal(sk.blocker.evidence.sourceReviewDigest, sk.lastAttempt.reportDigest);
  assert.equal(sk.blocker.evidence.engineeringChecksDigest, sk.lastAttempt.engineeringReportDigest);
  const statusScript = readFileSync(new URL('scripts/postal-context-m2-rollout.mjs', root), 'utf8');
  assert.match(statusScript, /next/i);
});

test('shared UI capability and source rows do not promote a missing real SK artifact', () => {
  const evidence = sk.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realSkAgidPostalApiVerified, false);
  assert.equal(evidence.realSkAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.skIdentityPreserved, true);
  assert.equal(sk.blocker.requiresExplicitApproval, false);
  assert.match(sk.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
