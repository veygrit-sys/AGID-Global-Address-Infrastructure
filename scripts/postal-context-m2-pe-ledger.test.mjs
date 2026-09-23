import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const pe = ledger.countries.find(country => country.countryCode === 'PE');
const manifest = readJson('data/postal_country_packs/pe/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/pe/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/pe-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/pe-checks-2026-09-01.json', root));

test('PE remains M1 blocked under its current complete MTC assignment and area definition', () => {
  assert.equal(pe.status, 'blocked');
  assert.equal(pe.attempts, 1);
  assert.equal(pe.evidence, null);
  assert.equal(pe.m2Definition.id, 'M2_current_mtc_complete_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === pe.m2Definition.id).definition, pe.m2Definition.definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
});

test('PE is in creation scope but its dated denominator is not current or complete', () => {
  const e = pe.blocker.evidence;
  assert.equal(e.currentPostcodeSystemConfirmed, true);
  assert.equal(e.postcodeDataCreationTarget, true);
  assert.equal(e.currentPostcodeFormat, 'NNNNN');
  assert.equal(e.datedReleaseRows, 98378);
  assert.equal(e.datedReleaseFiveDigitRows, 98378);
  assert.equal(e.datedReleaseUniquePostalCodes, 2669);
  assert.equal(e.publishedBulletinCodeDenominator, 2670);
  assert.equal(e.datedReleaseUniqueCodeGapFromBulletin, 1);
  assert.equal(e.currentCompleteAssignmentValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
});

test('dated ODC-By assignment evidence never promotes absent current geometry or rights', () => {
  const e = pe.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 8);
  assert.equal(e.exactOfficialAndLicenceBodiesBytes, 10888424);
  assert.equal(e.datedReleaseReuseRightsEstablishedWithAttribution, true);
  assert.equal(e.currentLookupAutomationCachingAndRedistributionRightsEstablished, false);
  assert.equal(e.compatibleCurrentAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.datedReleaseGeometryColumns, 0);
  assert.equal(e.datedReleaseCoordinateColumns, 0);
  assert.equal(e.currentCompleteImmutablePostalAreaArtifactEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.productionEligibleRecords, 0);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0);
  assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('PE reports are digest-pinned and exactly one country advances to PM', () => {
  assert.equal(digest(sourceReport), pe.lastAttempt.reportDigest);
  assert.equal(digest(checks), pe.lastAttempt.engineeringReportDigest);
  assert.equal(pe.blocker.evidence.sourceReviewDigest, pe.lastAttempt.reportDigest);
  assert.equal(pe.blocker.evidence.engineeringChecksDigest, pe.lastAttempt.engineeringReportDigest);
  const index = ledger.countries.findIndex(country => country.countryCode === 'PE');
  const next = ledger.countries[index + 1];
  assert.equal(next.countryCode, 'PM');
  assert.equal(next.status, 'pending');
  assert.equal(next.attempts, 0);
  assert.equal(ledger.countries.filter(country => country.status === 'in_progress').length, 0);
});

test('actual app evidence records the PE API failure and no fabricated postal area', () => {
  const e = pe.blocker.evidence;
  assert.equal(e.appStarted, true);
  assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realPeAgidPostalApiStatus, 503);
  assert.equal(e.realPeAgidPostalApiMessage, 'Postal Context pack is unavailable');
  assert.equal(e.realPeAgidPostalApiVerified, false);
  assert.equal(e.realPeAgidAppAreaVisualizationVerified, false);
  assert.equal(e.peruResultSelected, true);
  assert.equal(e.pePostalContextV1RequestsObservedInBrowser, 0);
  assert.equal(e.postalGeometryMetadataVisible, false);
  assert.equal(e.browserE2eVerified, false);
  assert.equal(e.visualInspectionCompleted, true);
  assert.equal(e.agidCellsPromoted, 0);
});

test('PE identity and Postal Code to Polygon to Address Context authority remain separated', () => {
  const e = pe.blocker.evidence;
  assert.equal(e.peIdentityPreserved, true);
  assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.equal(e.administrativePointRoutePoBoxOrganizationAddressBuildingProxiesPromoted, 0);
  assert.match(manifest.postal_system.geometry_rule, /not a polygon release/);
  assert.match(manifest.postal_system.agid_rule, /AGID remains an independent spatial index/);
});
