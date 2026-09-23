import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ni = ledger.countries.find(country => country.countryCode === 'NI');
const manifest = readJson('data/postal_country_packs/ni/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ni/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ni-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ni-checks-2026-09-01.json', root));

test('NI remains M1 blocked under its current real-area definition', () => {
  assert.equal(ni.status, 'blocked'); assert.equal(ni.attempts, 1); assert.equal(ni.evidence, null);
  assert.equal(ni.m2Definition.id, 'M2_current_correos_nicaragua_typed_postcode_assignments_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ni.m2Definition.id).definition, ni.m2Definition.definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('NI is in creation scope under current five-digit evidence without overclaiming completeness', () => {
  const e = ni.blocker.evidence;
  assert.equal(e.currentPostcodeSystemConfirmed, true); assert.equal(e.postcodeDataCreationTarget, true);
  assert.equal(e.currentPostalCodeFormat, 'NNNNN'); assert.equal(e.upuGeneralAddressingEdition, '08/2026');
  assert.equal(e.upuAddressingSheetEdition, '05/2014'); assert.equal(e.numericFiveDigitFormatConfirmed, true);
  assert.equal(e.correosCurrentContentRetrieved, false); assert.equal(e.correosCloudflareChallengeBodies, 2);
  assert.equal(e.currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
});

test('restricted rights and administrative context never promote postal geometry', () => {
  const e = ni.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 7); assert.equal(e.exactOfficialBodiesBytes, 1024163);
  assert.equal(e.reviewedIneterSpatialCatalogBodies, 2); assert.equal(e.reviewedIneterPostalTermMatches, 0);
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.codigoMaestroBarrioComarcaAdministrativePointRoutePoBoxOrganizationAddressBuildingProxiesPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('NI reports are digest-pinned and exactly one country advances to PA', () => {
  assert.equal(digest(sourceReport), ni.lastAttempt.reportDigest); assert.equal(digest(checks), ni.lastAttempt.engineeringReportDigest);
  assert.equal(ni.blocker.evidence.sourceReviewDigest, ni.lastAttempt.reportDigest);
  assert.equal(ni.blocker.evidence.engineeringChecksDigest, ni.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'PA');
  assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('actual app evidence records unavailable NI and negative visual inspection honestly', () => {
  const e = ni.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.deterministicQuery, '12012 Nicaragua'); assert.equal(e.niPostalContextRequestsObservedInBrowser, 0);
  assert.equal(e.renderedMapCanvasCount, 2); assert.equal(e.postalAreaNoticeCount, 0);
  assert.equal(e.realNiAgidPostalApiStatus, 503); assert.equal(e.realNiAgidPostalApiMessage, 'Postal Context pack is unavailable');
  assert.equal(e.realNiAgidPostalApiVerified, false); assert.equal(e.realNiAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false); assert.equal(e.visualInspectionCompleted, true);
  assert.equal(ni.blocker.requiresExplicitApproval, true);
  assert.match(ni.blocker.retryPolicy, /Do not contact.*request data.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('NI postal, administrative, address, building and neighboring identities remain separate', () => {
  const e = ni.blocker.evidence;
  assert.equal(e.niIdentityPreserved, true); assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.match(manifest.postal_system.geometry_rule, /cannot fill unknown coverage/);
  assert.match(manifest.postal_system.building_rule, /not an exact address-to-building relation/);
  assert.match(manifest.postal_system.agid_rule, /AGID remains an independent spatial index/);
});
