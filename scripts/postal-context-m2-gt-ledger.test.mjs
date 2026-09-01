import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gt = ledger.countries.find(country => country.countryCode === 'GT');
const manifest = readJson('data/postal_country_packs/gt/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gt/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/gt-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/gt-checks-2026-09-01.json', root));

test('GT remains M1 blocked under its current real-area definition', () => {
  assert.equal(gt.status, 'blocked'); assert.equal(gt.attempts, 1); assert.equal(gt.evidence, null);
  assert.equal(gt.m2Definition.id, 'M2_current_correos_guatemala_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === gt.m2Definition.id), gt.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('GT fixes the complete current Correos assignment denominator', () => {
  const e = gt.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 29); assert.equal(e.exactOfficialBodiesBytes, 3683865);
  assert.equal(e.departmentPdfs, 22); assert.equal(e.departmentPdfPages, 35); assert.equal(e.currentUniquePostalCodes, 544);
  assert.equal(e.mixedPostalObjectTypesObserved, true);
});

test('missing rights and postal geometry never promote contextual proxies', () => {
  const e = gt.blocker.evidence;
  assert.equal(e.correosOpenPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.administrativeZoneLocalityCentroidPointBufferHullVoronoiRasterOrAgidCellProxiesPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('GT reports are digest-pinned and exactly one country advances', () => {
  assert.equal(digest(sourceReport), gt.lastAttempt.reportDigest); assert.equal(digest(checks), gt.lastAttempt.engineeringReportDigest);
  assert.equal(gt.blocker.evidence.sourceReviewDigest, gt.lastAttempt.reportDigest);
  assert.equal(gt.blocker.evidence.engineeringChecksDigest, gt.lastAttempt.engineeringReportDigest);
  assert.equal(gt.blocker.evidence.publishedEvidenceCommit, '8dc96ec82b404aa73b54f7c381db7210a0bd8dc5');
  const next = ledger.countries.find(country => country.countryCode === 'GY'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('running app evidence records the real gap without promoting an AGID cell', () => {
  const e = gt.blocker.evidence;
  assert.equal(e.appStarted, true); assert.equal(e.fallbackBrowserVisualInspectionCompleted, true);
  assert.equal(e.realGtAgidPostalApiVerified, false); assert.equal(e.realGtAgidAppAreaVisualizationVerified, false);
  assert.equal(e.postalAreaUnavailableNoticeDisplayed, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.directGtPostalApiStatus, 503); assert.equal(gt.blocker.requiresExplicitApproval, false);
  assert.match(gt.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('GT and its source object identities remain separate', () => {
  const e = gt.blocker.evidence;
  assert.equal(e.gtIdentityPreserved, true); assert.equal(e.departmentMunicipalityZoneAndLocalityIdentitiesPreserved, true);
  assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.match(manifest.postal_system.geometry_rule, /not guaranteed to be a polygon/);
});
