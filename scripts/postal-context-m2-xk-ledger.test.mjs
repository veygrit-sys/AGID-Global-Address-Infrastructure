import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const xk = ledger.countries.find(country => country.countryCode === 'XK');
const manifest = readJson('data/postal_country_packs/xk/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/xk/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/xk-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/xk-checks-2026-08-31.json', root));

test('XK remains blocked under its operator-reconciled immutable area criterion', () => {
  assert.equal(xk.status, 'blocked'); assert.equal(xk.attempts, 1); assert.equal(xk.evidence, null);
  assert.equal(xk.m2Definition.id, 'M2_current_kosovo_official_postal_code_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === xk.m2Definition.id), xk.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('official operator and Geoportal evidence stays incomplete and rights blocked', () => {
  const e = xk.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 8); assert.equal(e.exactOfficialBodiesBytes, 860744);
  assert.equal(e.operatorAssignments, 133); assert.equal(e.uniqueFiveDigitCodes, 133); assert.equal(e.operatorRegions, 7);
  assert.equal(e.completeAliasExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.equal(e.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(e.postaResourceSpecificAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(e.geoportalResourceSpecificAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('real representative geometry does not promote a dynamic or proxy artifact', () => {
  const e = xk.blocker.evidence;
  assert.equal(e.representativeGeometryType, 'MultiPolygon'); assert.equal(e.representativeNormalizedCode, '10000');
  assert.equal(e.representativeFeatureCount, 2); assert.equal(e.duplicateRepresentativeCodeFeatures, 2);
  assert.equal(e.representativeLevel, 1); assert.equal(e.representativeFiniteClosedRingsVerified, true);
  assert.equal(e.fixedImmutableCompletePostalZoneArtifactEstablished, false);
  assert.equal(e.dynamicWmsOrGetFeatureInfoPromoted, 0); assert.equal(e.levelOneOrDuplicateFeatureAssumptionsPromoted, 0);
  assert.equal(e.municipalitySettlementOfficeAddressBuildingParcelProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.xkIdentityPreserved, true);
});

test('XK ledger pins exact reports and advances to XU', () => {
  assert.equal(digest(sourceReport), xk.lastAttempt.reportDigest); assert.equal(digest(checks), xk.lastAttempt.engineeringReportDigest);
  assert.equal(xk.blocker.evidence.sourceReviewDigest, xk.lastAttempt.reportDigest);
  assert.equal(xk.blocker.evidence.engineeringChecksDigest, xk.lastAttempt.engineeringReportDigest);
  const xu = ledger.countries.find(country => country.countryCode === 'XU'); assert.equal(xu.status, 'pending'); assert.equal(xu.attempts, 0);
});

test('shared UI capability does not promote the missing complete XK artifact', () => {
  const e = xk.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realXkAgidPostalApiVerified, false);
  assert.equal(e.realXkAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(xk.blocker.requiresExplicitApproval, false);
  assert.match(xk.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
