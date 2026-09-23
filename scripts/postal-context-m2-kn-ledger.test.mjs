import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const kn = ledger.countries.find(country => country.countryCode === 'KN');
const manifest = readJson('data/postal_country_packs/kn/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/kn/postal-context/source-profile.json');
const address = readJson('src/data/address_formats/americas/caribbean/KN.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/kn-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/kn-checks-2026-09-01.json', root));

test('KN remains M1 blocked under its current real-area definition', () => {
  assert.equal(kn.status, 'blocked'); assert.equal(kn.attempts, 1); assert.equal(kn.evidence, null);
  assert.equal(kn.m2Definition.id, 'M2_current_skn_postal_assignments_and_delivery_district_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === kn.m2Definition.id), kn.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('KN records official integral syntax and dated article observations without overclaiming current completeness', () => {
  const e = kn.blocker.evidence;
  assert.equal(address.postalCode.format, 'KN9999'); assert.equal(address.postalCode.regex, '^KN\\d{4}$');
  assert.equal(e.currentPostcodeSystemConfirmed, true); assert.equal(e.postcodeDataCreationTarget, true);
  assert.equal(e.integralCountryPrefix, 'KN'); assert.equal(e.upuAddressingSheetEdition, '12/2017');
  assert.equal(e.observedArticlePostcodes, 32); assert.equal(e.observedIrregularSpecialCode, 'KN7000');
  assert.equal(e.currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
});

test('restricted rights and missing geometry never promote prose or contextual proxies', () => {
  const e = kn.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 7); assert.equal(e.exactOfficialBodiesBytes, 1176198);
  assert.equal(e.governmentAllRightsReserved2026Recorded, true); assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.openPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.islandParishLocalityStreetOfficeRoutePoBoxOrganizationAddressBuildingProxiesPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('KN reports are digest-pinned and exactly one country advances to KY', () => {
  assert.equal(digest(sourceReport), kn.lastAttempt.reportDigest);
  assert.equal(digest(checks), kn.lastAttempt.engineeringReportDigest);
  assert.equal(kn.blocker.evidence.sourceReviewDigest, kn.lastAttempt.reportDigest);
  assert.equal(kn.blocker.evidence.engineeringChecksDigest, kn.lastAttempt.engineeringReportDigest);
  const next = ledger.countries.find(country => country.countryCode === 'KY');
  assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('actual app evidence records unsupported KN without promoting generic search or shared capability', () => {
  const e = kn.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.appStarted, true); assert.equal(e.appHttpStatus, 200);
  assert.equal(e.deterministicQuery, 'KN0101 Saint Kitts and Nevis'); assert.equal(e.selectedCountryAfterQuery, 'TR');
  assert.equal(e.knPostalContextRequestsObservedInBrowser, 0); assert.equal(e.realKnAgidPostalApiStatus, 404);
  assert.equal(e.realKnAgidPostalApiVerified, false); assert.equal(e.realKnAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false); assert.equal(e.visualInspectionCompleted, false);
  assert.match(kn.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('KN postal, administrative, address, building and neighboring identities remain separate', () => {
  const e = kn.blocker.evidence;
  assert.equal(e.knIdentityPreserved, true); assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.match(manifest.postal_system.geometry_rule, /cannot be relabelled as an official postal area/);
  assert.match(manifest.postal_system.building_rule, /not an exact address-to-building relation/);
  assert.match(manifest.postal_system.agid_rule, /AGID remains an independent spatial index/);
});
