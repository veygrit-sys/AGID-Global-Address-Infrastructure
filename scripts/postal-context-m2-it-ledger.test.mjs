import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const it = ledger.countries.find(country => country.countryCode === 'IT');
const je = ledger.countries.find(country => country.countryCode === 'JE');
const manifest = readJson('data/postal_country_packs/it/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/it-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/it-checks-2026-08-30.json', root));

test('Italy remains blocked under its current assignment, rights and real-area criterion', () => {
  assert.equal(it.status, 'blocked');
  assert.equal(it.attempts, 1);
  assert.equal(it.evidence, null);
  assert.equal(it.m2Definition.id, 'M2_current_poste_italiane_assignment_and_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === it.m2Definition.id), it.m2Definition);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
});

test('change PDFs, controlled assignment and non-postal sources never become IT polygons', () => {
  const evidence = it.blocker.evidence;
  assert.equal(evidence.currentPosteChangePackageMembers, 2);
  assert.equal(evidence.currentPosteChangePackagePdfMembers, 2);
  assert.equal(evidence.currentPosteChangePackageGeometryMembers, 0);
  assert.equal(evidence.completePublicNationwideAssignmentRows, 0);
  assert.equal(evidence.capProfessionalRowsAcquired, 0);
  assert.equal(evidence.capProfessionalInternalUseRestrictionObserved, true);
  assert.equal(evidence.capProfessionalThirdPartyTransferProhibited, true);
  assert.equal(evidence.anncsuPostcodeFields, 0);
  assert.equal(evidence.anncsuAddressRowsQueried, 0);
  assert.equal(evidence.officialPostalPolygonRecords, 0);
  assert.equal(evidence.rightsClearedDerivedPostalPolygonRecords, 0);
  assert.equal(evidence.istatAdministrativeRecordsPromoted, 0);
  assert.equal(evidence.dbgtBuildingRecordsPromoted, 0);
  assert.equal(evidence.pointNutsOrAdministrativeProxyPromoted, false);
});

test('Italy ledger pins exact reports and Jersey is next', () => {
  assert.equal(digest(sourceReport), it.lastAttempt.reportDigest);
  assert.equal(digest(checks), it.lastAttempt.engineeringReportDigest);
  assert.equal(it.blocker.evidence.sourceReviewDigest, it.lastAttempt.reportDigest);
  assert.equal(it.blocker.evidence.engineeringChecksDigest, it.lastAttempt.engineeringReportDigest);
  assert.equal(je.status, 'pending');
  assert.equal(je.region, 'europe');
});

test('shared UI capability does not promote fabricated real IT geometry', () => {
  const evidence = it.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realItAgidPostalApiVerified, false);
  assert.equal(evidence.realItAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.addressBuildingCadastreOrLandRowsQueried, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(it.blocker.requiresExplicitApproval, false);
  assert.match(it.blocker.retryPolicy, /Do not purchase.*register.*authenticate.*contact.*accept.*request.*pay.*query.*create.*publish.*deploy/i);
});
