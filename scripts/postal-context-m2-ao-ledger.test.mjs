import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ao = ledger.countries.find(country => country.countryCode === 'AO');
const manifest = readJson('data/postal_country_packs/ao/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ao/postal-context/source-profile.json');
const draft = readJson('data/postal_country_packs/ao/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ao-source-review-2026-09-03.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ao-checks-2026-09-03.json', root));

test('AO remains blocked and excluded from postcode data creation', () => {
  assert.equal(ao.status, 'blocked'); assert.equal(ao.attempts, 1); assert.equal(ao.evidence, null);
  assert.equal(ao.m2Definition.id, 'M2_current_correios_angola_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ao.m2Definition.id), ao.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(ao.blocker.evidence.dataCreationScope, 'excluded_no_current_postcode_system');
  assert.equal(ao.blocker.evidence.postcodeDataCreationTarget, false);
});

test('exact official receipts retain no-postcode and non-area box semantics', () => {
  const e = ao.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 7); assert.equal(e.exactOfficialBodiesBytes, 1158228);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuListsAngolaAsNotRequiringPostalCodes, true);
  assert.equal(e.postalBoxIsNonPostcodeObject, true); assert.equal(e.incorrectFourDigitMetadataCorrected, true);
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('restricted rights and non-postal proxies never promote', () => {
  const e = ao.blocker.evidence;
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.countryProvinceMunicipalityLocalityStationRouteServiceAreaPostalBoxProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.voronoiOrRasterCells, 0); assert.equal(e.agidCellsPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('existing AO planning pack remains draft synthetic material', () => {
  const e = ao.blocker.evidence;
  assert.equal(draft.officialStatus, 'draft'); assert.equal(draft.counts.localities, 48);
  assert.equal(draft.counts.boundaries, 12); assert.equal(draft.counts.planningCells, 245); assert.equal(draft.counts.testVectors, 3);
  assert.equal(e.syntheticAoPlanningCellsPromoted, 0); assert.equal(e.syntheticAoCodeSeedsPromoted, 0);
});

test('AO ledger pins exact reports and advances to Burkina Faso', () => {
  assert.equal(digest(sourceReport), ao.lastAttempt.reportDigest); assert.equal(digest(checks), ao.lastAttempt.engineeringReportDigest);
  assert.equal(ao.blocker.evidence.sourceReviewDigest, ao.lastAttempt.reportDigest);
  assert.equal(ao.blocker.evidence.engineeringChecksDigest, ao.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'BF'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('actual app result and visual limitations are represented without promotion', () => {
  const e = ao.blocker.evidence;
  assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realAoAgidPostalApiStatus, 404); assert.equal(e.realAoAgidPostalApiVerified, false);
  assert.equal(e.realAoAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.controlledNonPostalAddressContextObserved, true); assert.equal(e.controlledNonPostalAgidIdPromotedToPostalId, false);
  assert.equal(e.manualVisualInspection, false); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.match(ao.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
