import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ag = ledger.countries.find(country => country.countryCode === 'AG');
const manifest = readJson('data/postal_country_packs/ag/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ag/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ag-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ag-checks-2026-08-31.json', root));

test('AG remains blocked under its optional-identifier and real-area criterion', () => {
  assert.equal(ag.status, 'blocked'); assert.equal(ag.attempts, 1); assert.equal(ag.evidence, null);
  assert.equal(ag.m2Definition.id, 'M2_current_antigua_barbuda_optional_postal_identifier_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ag.m2Definition.id), ag.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('UPU optionality and current operator receipts remain an incomplete denominator', () => {
  const e = ag.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 7); assert.equal(e.exactOfficialBodiesBytes, 1674773);
  assert.equal(e.postcodeRequired, false); assert.equal(e.postcodeOptionalityDoesNotProveNoInternalIdentifiers, true);
  assert.equal(e.designatedOperator, 'Antigua and Barbuda Postal Service'); assert.equal(e.mdsaOrganizationCode, 'AGA');
  assert.equal(e.currentPostalIdentifierRowsValidated, 0);
  assert.equal(e.currentCompleteOperatorIdentifierAliasEligibilityExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('synthetic draft planning evidence and non-postal proxies never promote', () => {
  const e = ag.blocker.evidence;
  assert.equal(e.existingDraftOfficialStatus, 'draft'); assert.equal(e.existingSyntheticPlanningCells, 246);
  assert.equal(e.existingSyntheticLocalityIds, 48); assert.equal(e.existingRequiredBoundarySlots, 12);
  assert.equal(e.existingOfficialMunicipalityRecords, 0); assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.noRequiredPostcodeClassificationPromotedAsDatasetOrArea, 0);
  assert.equal(e.islandParishLocalityOfficeRoutePoBoxOrganizationAddressBuildingParcelProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidPlanningCellsPromoted, 0); assert.equal(e.productionEligibleRecords, 0);
});

test('AG ledger pins exact reports and advances to Anguilla', () => {
  assert.equal(digest(sourceReport), ag.lastAttempt.reportDigest); assert.equal(digest(checks), ag.lastAttempt.engineeringReportDigest);
  assert.equal(ag.blocker.evidence.sourceReviewDigest, ag.lastAttempt.reportDigest);
  assert.equal(ag.blocker.evidence.engineeringChecksDigest, ag.lastAttempt.engineeringReportDigest);
  const ai = ledger.countries.find(country => country.countryCode === 'AI'); assert.equal(ai.status, 'pending'); assert.equal(ai.attempts, 0);
});

test('shared capability does not promote a missing real AG artifact', () => {
  const e = ag.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realAgAgidPostalApiVerified, false);
  assert.equal(e.realAgAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0); assert.equal(e.agIdentityPreserved, true);
  assert.equal(ag.blocker.requiresExplicitApproval, false);
  assert.match(ag.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
