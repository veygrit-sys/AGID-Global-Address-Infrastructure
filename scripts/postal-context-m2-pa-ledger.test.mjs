import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const pa = ledger.countries.find(country => country.countryCode === 'PA');
const manifest = readJson('data/postal_country_packs/pa/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/pa/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/pa-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/pa-checks-2026-09-01.json', root));

test('PA remains M1 blocked under its current complete geolocated-code definition', () => {
  assert.equal(pa.status, 'blocked'); assert.equal(pa.attempts, 1); assert.equal(pa.evidence, null);
  assert.equal(pa.m2Definition.id, 'M2_current_correos_panama_complete_geolocated_code_and_pico_cell_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === pa.m2Definition.id).definition, pa.m2Definition.definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('PA is in creation scope with two fixed observations but no complete denominator', () => {
  const e = pa.blocker.evidence;
  assert.equal(e.currentPostcodeSystemConfirmed, true); assert.equal(e.postcodeDataCreationTarget, true);
  assert.equal(e.currentPostalCodeFormat, 'XXXXX-XXXXX full; XXX-XXXXX grid-only'); assert.equal(e.officialLaunchDate, '2026-05-07');
  assert.equal(e.liveApiObservations, 2); assert.equal(e.observedNormalizedCode, 'A7C95-69R3E');
  assert.equal(e.locationPicoCells, 9); assert.equal(e.locationSelectedCells, 1); assert.equal(e.decodePicoCells, 9); assert.equal(e.decodeSelectedCells, 1);
  assert.equal(e.currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
});

test('free lookup and observed cells never promote rights or production geometry', () => {
  const e = pa.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 7); assert.equal(e.exactOfficialBodiesBytes, 1037823);
  assert.equal(e.freeLookupConfirmed, true); assert.equal(e.freeLookupIsBulkReusePermission, false); assert.equal(e.portalLicenceOrReuseMarkerMatches, 0);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.currentCompleteImmutablePostalAreaArtifactEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.postalZoneAreaScalarPromotedAsPolygon, 0); assert.equal(e.administrativePointRoutePoBoxOrganizationAddressBuildingProxiesPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('PA reports are digest-pinned and exactly one country advances to PE', () => {
  assert.equal(digest(sourceReport), pa.lastAttempt.reportDigest); assert.equal(digest(checks), pa.lastAttempt.engineeringReportDigest);
  assert.equal(pa.blocker.evidence.sourceReviewDigest, pa.lastAttempt.reportDigest);
  assert.equal(pa.blocker.evidence.engineeringChecksDigest, pa.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'PE');
  assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('actual app evidence records unavailable PA and negative visual inspection honestly', () => {
  const e = pa.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.deterministicQuery, 'A7C95-69R3E Panama'); assert.equal(e.genericSearchResults, 2);
  assert.equal(e.panamaPostalResultSelected, false); assert.equal(e.nonPanamaResultSelected, true); assert.equal(e.paPostalContextRequestsObservedInBrowser, 0);
  assert.equal(e.renderedMapCanvasCount, 2); assert.equal(e.postalAreaNoticeCount, 0); assert.equal(e.postalGeometryMetadataVisible, false);
  assert.equal(e.realPaAgidPostalApiStatus, 503); assert.equal(e.realPaAgidPostalApiMessage, 'Postal Context pack is unavailable');
  assert.equal(e.realPaAgidPostalApiVerified, false); assert.equal(e.realPaAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false); assert.equal(e.visualInspectionCompleted, true);
  assert.equal(pa.blocker.requiresExplicitApproval, true);
  assert.match(pa.blocker.retryPolicy, /Do not contact.*request data.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('PA postal, administrative, address, building and neighboring identities remain separate', () => {
  const e = pa.blocker.evidence;
  assert.equal(e.paIdentityPreserved, true); assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.match(manifest.postal_system.geometry_rule, /area scalar is not a polygon/i);
  assert.match(manifest.postal_system.building_rule, /not a stable building identifier/i);
  assert.match(manifest.postal_system.agid_rule, /AGID remains an independent spatial index/);
});
