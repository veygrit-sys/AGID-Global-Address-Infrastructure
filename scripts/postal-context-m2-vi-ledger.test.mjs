import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const ledger = JSON.parse(readFileSync('docs/postal-context-m2-rollout.json', 'utf8'));
const vi = ledger.countries.find(item => item.countryCode === 'VI');
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

test('VI remains blocked while publishing only real fixed Census validation geometry', () => {
  const manifest = JSON.parse(readFileSync(vi.manifest, 'utf8'));
  assert.equal(vi.status, 'blocked');
  assert.equal(vi.attempts, 1);
  assert.equal(vi.evidence, null);
  assert.equal(vi.m2Definition.id, 'M2_current_usps_vi_complete_typed_assignment_and_postal_area_runtime');
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(vi.blocker.evidence.censusZctaFeaturesPublished, 6);
  assert.equal(vi.blocker.evidence.officialUspsPostalPolygonRecords, 0);
  assert.equal(vi.blocker.evidence.fabricatedSurfaces, 0);
  assert.equal(vi.blocker.evidence.currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished, false);
});

test('VI evidence links resolve to exact immutable bytes', () => {
  const evidence = vi.blocker.evidence;
  assert.equal(evidence.evidenceCommit, 'd281ee8288dd7440499fdc2d0f1bbbc13127c70a');
  for (const item of evidence.artifacts) {
    const marker = `/blob/${evidence.evidenceCommit}/`;
    assert.ok(item.url.includes(marker), item.url);
    const path = item.url.split(marker)[1];
    assert.equal(existsSync(path), true, path);
    const bytes = readFileSync(path);
    assert.equal(bytes.length, item.bytes, path);
    assert.equal(digest(bytes), item.digest, path);
  }
  assert.equal(digest(readFileSync(vi.lastAttempt.report)), vi.lastAttempt.reportDigest);
  assert.equal(digest(readFileSync(vi.lastAttempt.engineeringReport)), vi.lastAttempt.engineeringReportDigest);
  assert.equal(digest(readFileSync(vi.lastAttempt.browserReport)), vi.lastAttempt.browserReportDigest);
  assert.equal(digest(readFileSync(vi.lastAttempt.countryReport)), vi.lastAttempt.countryReportDigest);
});

test('VI visual and ID evidence remains explicit about production failure and withheld mismatch', () => {
  const evidence = vi.blocker.evidence;
  assert.equal(evidence.actualAppStarted, true);
  assert.equal(evidence.actualAppHttpStatus, 200);
  assert.equal(evidence.realViAgidPostalApiStatus, 404);
  assert.equal(evidence.realViAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.inAppBrowserAttempted, true);
  assert.equal(evidence.inAppBrowserNavigated, false);
  assert.equal(evidence.manualLiveBrowserVisualInspection, false);
  assert.equal(evidence.deterministicRealSourceGeometryFitAndRenderPassed, true);
  assert.equal(evidence.deterministicDetailedIdsVisible, true);
  assert.equal(evidence.agidCrosswalksPublished, 5);
  assert.equal(evidence.agidCrosswalksWithheld, 1);
  assert.equal(evidence.mismatchedComputedAgidCellId, 'VG0ETQRJZKGQ');
  assert.equal(evidence.viIdentityPreserved, true);
  assert.equal(evidence.neighbouringCountryOrTerritoryIdentityMerged, false);
});

test('VI advances the pending sweep to AC without bypassing the retry gate', () => {
  assert.equal(vi.blocker.requiresExplicitApproval, true);
  assert.match(vi.blocker.retryPolicy, /Do not contact.*request data.*register.*authenticate.*accept terms.*pay.*access protected.*publish.*deploy/iu);
  assert.equal(ledger.countries.find(item => item.countryCode === 'AC')?.status, 'pending');
});
