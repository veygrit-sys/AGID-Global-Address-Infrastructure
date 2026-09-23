import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bj = ledger.countries.find(country => country.countryCode === 'BJ');
const manifest = readJson('data/postal_country_packs/bj/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bj/postal-context/source-profile.json');
const draft = readJson('data/postal_country_packs/bj/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/bj-source-review-2026-09-03.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/bj-checks-2026-09-03.json', root));

test('BJ remains blocked and excluded from postcode data creation', () => {
  assert.equal(bj.status, 'blocked'); assert.equal(bj.attempts, 1); assert.equal(bj.evidence, null);
  assert.equal(bj.m2Definition.id, 'M2_current_la_poste_benin_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bj.m2Definition.id), bj.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(bj.blocker.evidence.dataCreationScope, 'excluded_no_current_postcode_system');
  assert.equal(bj.blocker.evidence.postcodeDataCreationTarget, false);
});

test('exact official receipts retain no-postcode and non-area delivery-object semantics', () => {
  const e = bj.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 6); assert.equal(e.exactOfficialBodiesBytes, 1304281);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuListsBeninAsNotRequiringPostalCodes, true);
  assert.equal(e.currentUpuAddressSheetUsesDeliveryOfficeIdentifierAndBpWithoutPostcode, true);
  assert.equal(e.deliveryOfficeIdentifierIsNotPostcode, true); assert.equal(e.postalBoxIsNonPostcodeObject, true);
  assert.equal(e.officialAgencyDirectoryContainsPostcodeAssignments, false); assert.equal(e.priorFourDigitRepositoryClaimPromoted, false);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('restricted rights and non-postal proxies never promote', () => {
  const e = bj.blocker.evidence;
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true); assert.equal(e.laPosteAllRightsReservedRecorded, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.countryDepartmentCommuneArrondissementLocalityAgencyDeliveryOfficePostalBoxRouteServiceAreaProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.voronoiOrRasterCells, 0); assert.equal(e.agidCellsPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('existing BJ planning pack remains draft synthetic material', () => {
  const e = bj.blocker.evidence;
  assert.equal(draft.officialStatus, 'draft'); assert.equal(draft.counts.localities, 48);
  assert.equal(draft.counts.boundaries, 12); assert.equal(draft.counts.planningCells, 218); assert.equal(draft.counts.testVectors, 3);
  assert.equal(e.syntheticBjPlanningCellsPromoted, 0); assert.equal(e.syntheticBjCodeSeedsPromoted, 0);
});

test('BJ ledger pins exact reports and advances to Botswana', () => {
  assert.equal(digest(sourceReport), bj.lastAttempt.reportDigest); assert.equal(digest(checks), bj.lastAttempt.engineeringReportDigest);
  assert.equal(bj.blocker.evidence.sourceReviewDigest, bj.lastAttempt.reportDigest);
  assert.equal(bj.blocker.evidence.engineeringChecksDigest, bj.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'BW'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('published evidence artifacts and app limitations are represented without promotion', () => {
  const e = bj.blocker.evidence;
  for (const item of e.artifacts) {
    const path = new URL(item.url).pathname.split(`/${e.evidenceCommit}/`)[1];
    const bytes = execFileSync('git', ['show', `${e.evidenceCommit}:${path}`]);
    assert.equal(bytes.length, item.bytes); assert.equal(digest(bytes), item.digest);
  }
  assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realBjAgidPostalApiStatus, 404); assert.equal(e.realBjAgidPostalApiVerified, false);
  assert.equal(e.realBjAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.nonPostalAddressContextObserved, true); assert.equal(e.nonPostalAgidIdPromotedToPostalId, false);
  assert.equal(e.mergedSearchFalsePositiveOrderingObserved, true); assert.equal(e.explicitBeninCandidateSelectionRequired, true);
  assert.equal(e.manualVisualInspection, false); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.match(bj.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
