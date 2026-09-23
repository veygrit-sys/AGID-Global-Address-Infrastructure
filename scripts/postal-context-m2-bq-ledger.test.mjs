import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bq = ledger.countries.find(country => country.countryCode === 'BQ');
const manifest = readJson('data/postal_country_packs/bq/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bq/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/bq-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/bq-checks-2026-08-31.json', root));

test('BQ remains blocked under its current no-postcode and real-area criterion', () => {
  assert.equal(bq.status, 'blocked'); assert.equal(bq.attempts, 1); assert.equal(bq.evidence, null);
  assert.equal(bq.m2Definition.id, 'M2_current_caribbean_netherlands_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bq.m2Definition.id), bq.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve the current Caribbean Netherlands no-postcode result', () => {
  const e = bq.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 8); assert.equal(e.exactOfficialBodiesBytes, 1751301);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.rcnCurrentlySaysNoPostcodes, true);
  assert.equal(e.upuNoPostcodeListEdition, 'Sep. 2025');
  assert.equal(e.upuListsBonaireSaintEustatiusAndSabaAsNotRequiringPostalCodes, true);
  assert.equal(e.currentOperator, 'Flamingo Express Dutch Caribbean (FXDC)');
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('consultation proposal, workaround and possible first combination fail closed', () => {
  const e = bq.blocker.evidence;
  assert.equal(e.proposalRange, '0000AA-0999ZZ'); assert.equal(e.proposalRangeTreatedAsCurrentAssignment, false);
  assert.equal(e.workaroundIdentifier, '0000BQ'); assert.equal(e.workaroundIdentifierTreatedAsCurrentAssignment, false);
  assert.equal(e.firstPossibleCombination, '0100AA'); assert.equal(e.firstPossibleCombinationTreatedAsCurrentAssignment, false);
  assert.equal(e.proposalOrWorkaroundIdentifiersPromoted, 0);
});

test('text rights and all proxy surfaces never promote', () => {
  const e = bq.blocker.evidence;
  assert.equal(e.rcnEligibleWebsiteTextCc0_1_0, true); assert.equal(e.rcnMostImagesReusable, false);
  assert.equal(e.cc0WebsiteTextTreatedAsFuturePostalDatasetLicence, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.islandPublicBodyAdministrativeLocalityOfficeRouteAddressBuildingPointBufferModelOrAgidProxiesPromoted, 0);
  assert.equal(e.foreignOrEuropeanNetherlandsPolygonsPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.rawSourceBodiesInGit, 0);
});

test('BQ ledger pins exact reports and advances to Brazil', () => {
  assert.equal(digest(sourceReport), bq.lastAttempt.reportDigest); assert.equal(digest(checks), bq.lastAttempt.engineeringReportDigest);
  assert.equal(bq.blocker.evidence.sourceReviewDigest, bq.lastAttempt.reportDigest);
  assert.equal(bq.blocker.evidence.engineeringChecksDigest, bq.lastAttempt.engineeringReportDigest);
  const br = ledger.countries.find(country => country.countryCode === 'BR'); assert.equal(br.status, 'pending'); assert.equal(br.attempts, 0);
});

test('shared capability does not promote missing BQ inputs or artifacts', () => {
  const e = bq.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realBqAgidPostalApiVerified, false);
  assert.equal(e.realBqAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.bqIdentityPreserved, true);
  assert.equal(e.bonaireSintEustatiusAndSabaRemainDistinct, true);
  assert.equal(bq.blocker.requiresExplicitApproval, false); assert.equal(bq.blocker.retryAfter, '2026-09-07T13:36:23.702Z');
  assert.match(bq.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
