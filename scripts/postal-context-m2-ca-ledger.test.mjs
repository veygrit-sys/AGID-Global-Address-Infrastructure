import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ca = ledger.countries.find(country => country.countryCode === 'CA');
const manifest = readJson('data/postal_country_packs/ca/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ca/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ca-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ca-checks-2026-08-31.json', root));

test('CA remains blocked under its current assignment and real full-code area criterion', () => {
  assert.equal(ca.status, 'blocked'); assert.equal(ca.attempts, 1); assert.equal(ca.evidence, null);
  assert.equal(ca.m2Definition.id, 'M2_current_canada_post_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ca.m2Definition.id), ca.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts pin the current licensed assignment release without acquiring rows', () => {
  const e = ca.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 11); assert.equal(e.exactOfficialBodiesBytes, 2395946);
  assert.equal(e.currentPostalCodeFormat, 'ANA NAN'); assert.equal(e.currentLicensedAssignmentReleaseIdentified, '260807ad.zip');
  assert.equal(e.currentCompleteLicensedAssignmentAcquired, false); assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.completeAssignmentDenominatorEstablished, false); assert.equal(e.featureOrAddressRowsQueried, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('full-code non-area semantics and every geographic proxy fail closed', () => {
  const e = ca.blocker.evidence;
  assert.equal(e.licensedProductContainsPolygonGeometrySchema, false);
  assert.equal(e.officialFullCodePostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualFullCodePostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.nonAreaPostalObjectsExpandedIntoSurfaces, 0);
  assert.equal(e.fsaCfsaPccfNarOdbAdminRoadParcelPointBufferCellModelOrAgidProxiesPromoted, 0);
});

test('CFSA remains three-character 2021 census reference geometry under separate rights', () => {
  const e = ca.blocker.evidence;
  assert.equal(e.cfsaReferenceYear, 2021); assert.equal(e.cfsaRecordsDeclared, 1643); assert.equal(e.cfsaKeyLength, 3);
  assert.equal(e.cfsaIsCurrentCanadaPostFullCodeGeometry, false);
  assert.equal(e.licensedDataRequestLeadsToPricingAndLicenceAgreement, true);
  assert.equal(e.addressCompleteRequiresCredentialAndTerms, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.caIdentityPreserved, true); assert.equal(e.provinceTerritoryAndIndigenousIdentitiesPreserved, true);
  assert.equal(e.postalCensusAdministrativeAddressBuildingAndAgidAuthoritiesSeparated, true);
});

test('CA ledger pins exact reports and advances to Chile', () => {
  assert.equal(digest(sourceReport), ca.lastAttempt.reportDigest); assert.equal(digest(checks), ca.lastAttempt.engineeringReportDigest);
  assert.equal(ca.blocker.evidence.sourceReviewDigest, ca.lastAttempt.reportDigest);
  assert.equal(ca.blocker.evidence.engineeringChecksDigest, ca.lastAttempt.engineeringReportDigest);
  const cl = ledger.countries.find(country => country.countryCode === 'CL'); assert.equal(cl.status, 'pending'); assert.equal(cl.attempts, 0);
});

test('shared capability does not promote unavailable CA assignments or areas', () => {
  const e = ca.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realCaAgidPostalRuntimeVerified, false);
  assert.equal(e.realCaAgidPostalApiVerified, false); assert.equal(e.realCaAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false); assert.equal(e.approvedAgidRuntimeArtifacts, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(ca.blocker.requiresExplicitApproval, true); assert.equal(ca.blocker.retryAfter, '2026-09-07T16:29:28.906Z');
  assert.match(ca.blocker.retryPolicy, /Do not contact.*submit.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
