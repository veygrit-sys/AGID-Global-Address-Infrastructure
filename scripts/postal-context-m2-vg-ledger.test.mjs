import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const ledger = JSON.parse(readFileSync('docs/postal-context-m2-rollout.json', 'utf8'));
const country = ledger.countries.find(item => item.countryCode === 'VG');
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

test('VG stays M1 blocked under its current real-area definition', () => {
  const manifest = JSON.parse(readFileSync(country.manifest, 'utf8'));
  assert.equal(country.status, 'blocked');
  assert.equal(country.attempts, 1);
  assert.equal(country.evidence, null);
  assert.equal(country.m2Definition.id, 'M2_current_bvi_post_complete_typed_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === country.m2Definition.id).definition, country.m2Definition.definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
});

test('VG is in creation scope but exact sources establish neither denominator nor public-serving geometry rights', () => {
  const e = country.blocker.evidence;
  assert.equal(e.currentPostalSystemConfirmed, true);
  assert.equal(e.postcodeDataCreationTarget, true);
  assert.equal(e.currentPostalCodeFormat, 'VGNNNN');
  assert.equal(e.sourceBodyCount, 7);
  assert.equal(e.sourceBodyBytes, 4718229);
  assert.deepEqual(e.currentGovernmentCodesObserved, ['VG1110', 'VG1140', 'VG1150', 'VG1160']);
  assert.equal(e.commercialCatalogAdvertisedFourDigitPostcodeAreaPolygons, 6);
  assert.equal(e.commercialGeometryBytesAccessed, 0);
  assert.equal(e.currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.fabricatedSurfaces, 0);
  assert.equal(e.rawSourceBodiesInGit, 0);
});

test('VG artifact links resolve to the fixed evidence commit and local hashes and sizes match', () => {
  const e = country.blocker.evidence;
  assert.equal(e.evidenceCommit, 'eeec74b5df90b0998ca1eac67426e266313d4807');
  for (const artifact of e.artifacts) {
    const marker = `/blob/${e.evidenceCommit}/`;
    assert.ok(artifact.url.includes(marker), artifact.url);
    const path = artifact.url.split(marker)[1];
    assert.equal(existsSync(path), true, path);
    const bytes = readFileSync(path);
    assert.equal(bytes.length, artifact.bytes, path);
    assert.equal(digest(bytes), artifact.digest, path);
  }
  assert.equal(digest(readFileSync(country.lastAttempt.report)), country.lastAttempt.reportDigest);
  assert.equal(digest(readFileSync(country.lastAttempt.engineeringReport)), country.lastAttempt.engineeringReportDigest);
  assert.equal(digest(readFileSync(country.lastAttempt.countryReport)), country.lastAttempt.countryReportDigest);
});

test('actual VG app evidence fails closed without claiming a postal surface or live visual inspection', () => {
  const e = country.blocker.evidence;
  assert.equal(e.appStarted, true);
  assert.equal(e.appHttpStatus, 200);
  assert.equal(e.realVgAgidPostalApiStatus, 404);
  assert.equal(e.realVgAgidPostalApiMessage, 'Postal Context country is not supported');
  assert.equal(e.vgPostalContextRequestsObservedInBrowser, 4);
  assert.equal(e.postalAreaNoticeVisible, true);
  assert.equal(e.renderedMapCanvasCount, 1);
  assert.equal(e.polygonDetailLabels, 0);
  assert.equal(e.browserE2eVerified, true);
  assert.equal(e.screenshotBitmapInspectionSucceeded, false);
  assert.equal(e.manualLiveBrowserVisualInspection, false);
  assert.equal(e.realVgAgidAppAreaVisualizationVerified, false);
});

test('VG preserves authority separation and rollout advances only to VI', () => {
  const manifest = JSON.parse(readFileSync(country.manifest, 'utf8'));
  const next = ledger.countries.find(item => item.countryCode === 'VI');
  assert.equal(country.blocker.requiresExplicitApproval, true);
  assert.match(country.blocker.retryPolicy, /Do not contact.*request data.*register.*authenticate.*accept.*pay.*access protected.*publish.*deploy/iu);
  assert.match(manifest.postal_system.geometry_rule, /Do not turn an island/iu);
  assert.match(manifest.postal_system.building_rule, /does not establish a building relation/iu);
  assert.match(manifest.postal_system.agid_rule, /AGID is an independent spatial index/iu);
  assert.equal(country.blocker.evidence.vgIdentityPreserved, true);
  assert.equal(country.blocker.evidence.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.equal(next.status, 'pending');
  assert.equal(next.attempts, 0);
});
