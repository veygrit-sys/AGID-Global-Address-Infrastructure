import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const xd = ledger.countries.find(country => country.countryCode === 'XD');
const manifest = readJson('data/postal_country_packs/xd/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/xd/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/xd-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/xd-checks-2026-08-31.json', root));

test('XD remains blocked under its dual-system postal-area criterion', () => {
  assert.equal(xd.status, 'blocked'); assert.equal(xd.attempts, 1); assert.equal(xd.evidence, null);
  assert.equal(xd.m2Definition.id, 'M2_current_dhekelia_bfpo_and_cyprus_assignment_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === xd.m2Definition.id), xd.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('BFPO and Cyprus Post evidence remains a non-geospatial incomplete denominator', () => {
  const e = xd.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 7); assert.equal(e.exactOfficialBodiesBytes, 4207851);
  assert.equal(e.bfpoNumber, '58'); assert.equal(e.shadowPostcode, 'BF1 2AU'); assert.deepEqual(e.cyprusPostcodes, ['6370', '7502']);
  assert.equal(e.exactDekeleiaStreetRows7502, 39); assert.equal(e.militaryLabelRows6370, 1); assert.equal(e.communityRows, 2);
  assert.equal(e.currentCompleteDualSystemAssignmentEligibilityExceptionAndNonAreaDenominatorEstablished, false);
  assert.equal(e.cyprusPostResourceSpecificAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('territory, rows, environmental maps and points fail closed', () => {
  const e = xd.blocker.evidence;
  assert.equal(e.fixedAuthorizedPostcodeGeometryArtifactsInspected, 0); assert.equal(e.assignmentsReconciledToAreaOrExplicitNonArea, 0);
  assert.equal(e.territoryCommunityStreetEnvironmentalOfficeAddressBuildingParcelProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.syntheticFixturePromoted, false); assert.equal(e.xdIdentityPreserved, true);
});

test('XD ledger pins exact reports and advances to Kosovo', () => {
  assert.equal(digest(sourceReport), xd.lastAttempt.reportDigest); assert.equal(digest(checks), xd.lastAttempt.engineeringReportDigest);
  assert.equal(xd.blocker.evidence.sourceReviewDigest, xd.lastAttempt.reportDigest);
  assert.equal(xd.blocker.evidence.engineeringChecksDigest, xd.lastAttempt.engineeringReportDigest);
  const xk = ledger.countries.find(country => country.countryCode === 'XK'); assert.equal(xk.status, 'pending'); assert.equal(xk.attempts, 0);
});

test('shared UI capability does not promote a missing real XD artifact', () => {
  const e = xd.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realXdAgidPostalApiVerified, false);
  assert.equal(e.realXdAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.productionEligibleRecords, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(xd.blocker.requiresExplicitApproval, false);
  assert.match(xd.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
