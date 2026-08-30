import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ro = ledger.countries.find(country => country.countryCode === 'RO');
const rs = ledger.countries.find(country => country.countryCode === 'RS');
const manifest = readJson('data/postal_country_packs/ro/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ro/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ro-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ro-checks-2026-08-30.json', root));

test('Romania remains blocked under its current assignment and authoritative area criterion', () => {
  assert.equal(ro.status, 'blocked'); assert.equal(ro.attempts, 1); assert.equal(ro.evidence, null);
  assert.equal(ro.m2Definition.id, 'M2_current_romania_postcode_assignment_and_authoritative_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ro.m2Definition.id), ro.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('seven exact official bodies pin current search, six-digit, Infocod, geography and access evidence', () => {
  const evidence = ro.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 7);
  assert.equal(evidence.exactOfficialBodiesBytes, 4689771);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNNNNN');
  assert.equal(evidence.publicSearchAddressToPostcode, true);
  assert.equal(evidence.publicSearchPostcodeToAddress, true);
  assert.equal(evidence.infocodMonthlyUpdates, true);
  assert.equal(evidence.ancomCivilContractAccessObserved, true);
  assert.equal(profile.sources.find(source => source.source_id === 'posta-romana-infocod').redistribution_class, 'R3_controlled_fee_or_contract');
});

test('rights, fixed geometry and proxy gates fail closed', () => {
  const evidence = ro.blocker.evidence;
  assert.equal(evidence.agidProcessingDerivationStorageRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.postcodeAreaDistributionTokens, 0);
  assert.equal(evidence.fixedAuthoritativeGeometryArtifactsInspected, 0);
  assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.assignmentAreaNonAreaRowsReconciled, 0);
  assert.equal(evidence.countyUatLocalitySirutaRennsAncpiProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0); assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0); assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(evidence.roIdentityPreserved, true);
});

test('Romania ledger pins exact reports and preserves Serbia next-country order', () => {
  assert.equal(digest(sourceReport), ro.lastAttempt.reportDigest); assert.equal(digest(checks), ro.lastAttempt.engineeringReportDigest);
  assert.equal(ro.blocker.evidence.sourceReviewDigest, ro.lastAttempt.reportDigest);
  assert.equal(ro.blocker.evidence.engineeringChecksDigest, ro.lastAttempt.engineeringReportDigest);
  assert.equal(rs.status, 'pending'); assert.equal(rs.region, 'europe');
});

test('shared UI capability does not promote a missing real RO runtime', () => {
  const evidence = ro.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true); assert.equal(evidence.realRoAgidPostalApiVerified, false);
  assert.equal(evidence.realRoAgidAppAreaVisualizationVerified, false); assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0); assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(ro.blocker.requiresExplicitApproval, false);
  assert.match(ro.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
