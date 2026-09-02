import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bw = ledger.countries.find(country => country.countryCode === 'BW');
const manifest = readJson('data/postal_country_packs/bw/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bw/postal-context/source-profile.json');
const draft = readJson('data/postal_country_packs/bw/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/bw-source-review-2026-09-03.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/bw-checks-2026-09-03.json', root));

test('BW remains blocked and excluded from postcode data creation', () => {
  assert.equal(bw.status, 'blocked'); assert.equal(bw.attempts, 1); assert.equal(bw.evidence, null);
  assert.equal(bw.m2Definition.id, 'M2_current_botswanapost_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bw.m2Definition.id), bw.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(bw.blocker.evidence.dataCreationScope, 'excluded_no_current_postcode_system');
  assert.equal(bw.blocker.evidence.postcodeDataCreationTarget, false);
});

test('exact official receipts retain no-postcode and non-area delivery-object semantics', () => {
  const e = bw.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 5); assert.equal(e.exactOfficialBodiesBytes, 1102846);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuListsBotswanaAsNotRequiringPostalCodes, true);
  assert.equal(e.upuAddressSheetUsesPoBoxOrPrivateBagAndLocalityWithoutPostcode, true);
  assert.equal(e.currentBotswanaPostPageUsesPoBoxAndLocalityWithoutPostcode, true);
  assert.equal(e.governmentPageSeparatesPrivateBagPostalAddressFromPlotPhysicalAddress, true);
  assert.equal(e.postalBoxAndPrivateBagAreNonPostcodeObjects, true);
  assert.equal(e.priorAlpha2PlusThreeDigitRepositoryClaimPromoted, false);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('restricted rights and non-postal proxies never promote', () => {
  const e = bw.blocker.evidence;
  assert.equal(e.botswanaPostCopyrightRecorded, true); assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.countryDistrictWardVillageLocalityPostOfficeBoxPrivateBagPlotStreetRouteServiceAreaProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.voronoiOrRasterCells, 0); assert.equal(e.agidCellsPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('existing BW planning pack remains draft synthetic material', () => {
  const e = bw.blocker.evidence;
  assert.equal(draft.officialStatus, 'draft'); assert.equal(draft.counts.localities, 48);
  assert.equal(draft.counts.boundaries, 12); assert.equal(draft.counts.planningCells, 236); assert.equal(draft.counts.testVectors, 3);
  assert.equal(e.syntheticBwPlanningCellsPromoted, 0); assert.equal(e.syntheticBwCodeSeedsPromoted, 0);
});

test('BW ledger pins exact reports and advances to DR Congo', () => {
  assert.equal(digest(sourceReport), bw.lastAttempt.reportDigest); assert.equal(digest(checks), bw.lastAttempt.engineeringReportDigest);
  assert.equal(bw.blocker.evidence.sourceReviewDigest, bw.lastAttempt.reportDigest);
  assert.equal(bw.blocker.evidence.engineeringChecksDigest, bw.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'CD'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('published evidence artifacts and app limitations are represented without promotion', () => {
  const e = bw.blocker.evidence;
  for (const item of e.artifacts) {
    const path = new URL(item.url).pathname.split(`/${e.evidenceCommit}/`)[1];
    const bytes = execFileSync('git', ['show', `${e.evidenceCommit}:${path}`]);
    assert.equal(bytes.length, item.bytes); assert.equal(digest(bytes), item.digest);
  }
  assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realBwAgidPostalApiStatus, 404); assert.equal(e.realBwAgidPostalApiVerified, false);
  assert.equal(e.realBwAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.nonPostalAddressContextObserved, true); assert.equal(e.nonPostalAgidIdExample, 'BW03TY8S4KWK');
  assert.equal(e.nonPostalAgidIdPromotedToPostalId, false); assert.equal(e.explicitBotswanaCandidateSelected, true);
  assert.equal(e.manualVisualInspection, false); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.match(bw.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
