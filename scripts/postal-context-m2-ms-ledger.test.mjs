import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ms = ledger.countries.find(country => country.countryCode === 'MS');
const manifest = readJson('data/postal_country_packs/ms/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ms/postal-context/source-profile.json');
const address = readJson('src/data/address_formats/americas/caribbean/MS.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ms-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ms-checks-2026-09-01.json', root));

test('MS remains M1 blocked under its current real-area definition', () => {
  assert.equal(ms.status, 'blocked'); assert.equal(ms.attempts, 1); assert.equal(ms.evidence, null);
  assert.equal(ms.m2Definition.id, 'M2_current_montserrat_postcode_assignments_and_delivery_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ms.m2Definition.id), ms.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('MS records integral syntax and eight guide codes without overclaiming current completeness', () => {
  const e = ms.blocker.evidence;
  assert.equal(address.postalCode.format, 'MSR9999'); assert.equal(address.postalCode.regex, '^MSR\\d{4}$');
  assert.equal(e.currentPostcodeSystemConfirmed, true); assert.equal(e.postcodeDataCreationTarget, true);
  assert.equal(e.integralCountryPrefix, 'MSR'); assert.equal(e.upuAddressingSheetEdition, '06/2026');
  assert.equal(e.observedGuidePostcodes, 8);
  assert.equal(e.observedGuidePostcodeSetSha256, '28c4a6162d72f74fe75498bda8c659b404e2fc0e5346fe3483280d3066bc12be');
  assert.equal(e.currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
});

test('limited rights and missing geometry never promote prose or contextual proxies', () => {
  const e = ms.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 6); assert.equal(e.exactOfficialBodiesBytes, 991172);
  assert.equal(e.statisticsDepartmentOpenLicenceScopeLimitRecorded, true);
  assert.equal(e.statisticsDepartmentLicenceProvenToCoverPostalOrPhysicalPlanningData, false);
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true); assert.equal(e.officialSpatialDataRequestPathRecorded, true);
  assert.equal(e.openPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.parishLocalityStreetOfficeRoutePoBoxOrganizationAddressBuildingProxiesPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('MS reports are digest-pinned and exactly one country advances to MX', () => {
  assert.equal(digest(sourceReport), ms.lastAttempt.reportDigest);
  assert.equal(digest(checks), ms.lastAttempt.engineeringReportDigest);
  assert.equal(ms.blocker.evidence.sourceReviewDigest, ms.lastAttempt.reportDigest);
  assert.equal(ms.blocker.evidence.engineeringChecksDigest, ms.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'MX');
  assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('actual app evidence records unsupported MS without promoting shared capability', () => {
  const e = ms.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.deterministicQuery, 'MSR1110 Montserrat'); assert.equal(e.msPostalContextRequestsObservedInBrowser, 0);
  assert.equal(e.renderedMapCanvasCount, 2); assert.equal(e.postalAreaNoticeCount, 0);
  assert.equal(e.realMsAgidPostalApiStatus, 404); assert.equal(e.realMsAgidPostalApiMessage, 'Postal Context country is not supported');
  assert.equal(e.realMsAgidPostalApiVerified, false); assert.equal(e.realMsAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false); assert.equal(e.visualInspectionCompleted, false);
  assert.equal(ms.blocker.requiresExplicitApproval, true);
  assert.match(ms.blocker.retryPolicy, /Do not contact.*request data.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('MS postal, administrative, address, building and neighboring identities remain separate', () => {
  const e = ms.blocker.evidence;
  assert.equal(e.msIdentityPreserved, true); assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.match(manifest.postal_system.geometry_rule, /cannot be relabelled as an official postal area/);
  assert.match(manifest.postal_system.building_rule, /not an exact address-to-building relation/);
  assert.match(manifest.postal_system.agid_rule, /AGID remains an independent spatial index/);
});
