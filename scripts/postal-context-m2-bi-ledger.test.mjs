import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bi = ledger.countries.find(country => country.countryCode === 'BI');
const manifest = readJson('data/postal_country_packs/bi/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bi/postal-context/source-profile.json');
const draft = readJson('data/postal_country_packs/bi/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/bi-source-review-2026-09-03.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/bi-checks-2026-09-03.json', root));

test('BI remains blocked and excluded from postcode data creation', () => {
  assert.equal(bi.status, 'blocked'); assert.equal(bi.attempts, 1); assert.equal(bi.evidence, null);
  assert.equal(bi.m2Definition.id, 'M2_current_rnp_burundi_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bi.m2Definition.id), bi.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(bi.blocker.evidence.dataCreationScope, 'excluded_no_current_postcode_system');
  assert.equal(bi.blocker.evidence.postcodeDataCreationTarget, false);
});

test('exact official receipts retain no-postcode and non-area box semantics', () => {
  const e = bi.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 5); assert.equal(e.exactOfficialBodiesBytes, 1060734);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuListsBurundiAsNotRequiringPostalCodes, true);
  assert.equal(e.currentUpuAddressSheetUsesBpCommuneProvinceWithoutPostcode, true);
  assert.equal(e.postalBoxIsNonPostcodeObject, true); assert.equal(e.unverifiedFourDigitCodeWebsitePromoted, false);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('restricted rights and non-postal proxies never promote', () => {
  const e = bi.blocker.evidence;
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.countryProvinceCommuneLocalityOfficeRouteServiceAreaPostalBoxProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.voronoiOrRasterCells, 0); assert.equal(e.agidCellsPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('existing BI planning pack remains draft synthetic material', () => {
  const e = bi.blocker.evidence;
  assert.equal(draft.officialStatus, 'draft'); assert.equal(draft.counts.localities, 48);
  assert.equal(draft.counts.boundaries, 12); assert.equal(draft.counts.planningCells, 218); assert.equal(draft.counts.testVectors, 3);
  assert.equal(e.syntheticBiPlanningCellsPromoted, 0); assert.equal(e.syntheticBiCodeSeedsPromoted, 0);
});

test('BI ledger pins exact reports and advances to Benin', () => {
  assert.equal(digest(sourceReport), bi.lastAttempt.reportDigest); assert.equal(digest(checks), bi.lastAttempt.engineeringReportDigest);
  assert.equal(bi.blocker.evidence.sourceReviewDigest, bi.lastAttempt.reportDigest);
  assert.equal(bi.blocker.evidence.engineeringChecksDigest, bi.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'BJ'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('published evidence artifacts and app limitations are represented without promotion', () => {
  const e = bi.blocker.evidence;
  for (const item of e.artifacts) {
    const path = new URL(item.url).pathname.split(`/${e.evidenceCommit}/`)[1];
    const bytes = execFileSync('git', ['show', `${e.evidenceCommit}:${path}`]);
    assert.equal(bytes.length, item.bytes); assert.equal(digest(bytes), item.digest);
  }
  assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realBiAgidPostalApiStatus, 404); assert.equal(e.realBiAgidPostalApiVerified, false);
  assert.equal(e.realBiAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.nonPostalAddressContextObserved, true); assert.equal(e.nonPostalAgidIdPromotedToPostalId, false);
  assert.equal(e.manualVisualInspection, false); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.match(bi.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
