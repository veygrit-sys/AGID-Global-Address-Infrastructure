import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ie = ledger.countries.find(country => country.countryCode === 'IE');
const im = ledger.countries.find(country => country.countryCode === 'IM');
const manifest = readJson('data/postal_country_packs/ie/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ie-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ie-checks-2026-08-30.json', root));

test('Ireland remains blocked under its full-code identity and Routing Key area criterion', () => {
  assert.equal(ie.status, 'blocked');
  assert.equal(ie.attempts, 1);
  assert.equal(ie.evidence, null);
  assert.equal(ie.m2Definition.id, 'M2_current_eircode_identity_and_routing_key_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ie.m2Definition.id), ie.m2Definition);
  assert.match(manifest.postal_system.normalization_rule, /D6W/);
  assert.match(manifest.postal_system.full_code_geometry_rule, /non-area/);
});

test('public TERCET correspondence never becomes an Irish postal polygon', () => {
  const evidence = ie.blocker.evidence;
  assert.equal(evidence.officialRoutingKeysDeclared, 139);
  assert.equal(evidence.tercetRoutingKeyRows, 139);
  assert.equal(evidence.distinctTercetRoutingKeys, 139);
  assert.equal(evidence.d6wExceptionPreserved, true);
  assert.equal(evidence.tercetGeoNamesRows, 139);
  assert.equal(evidence.tercetMemberStateOrAddressRows, 0);
  assert.equal(evidence.tercetCoordinateColumns, 0);
  assert.equal(evidence.officialRoutingKeyPolygonRecords, 0);
  assert.equal(evidence.pointNutsCountyOrStatisticalProxyPromoted, false);
});

test('licensed assignments and confidential CSO rows remain unavailable', () => {
  const evidence = ie.blocker.evidence;
  assert.equal(evidence.currentSevenCharacterAssignmentRowsAcquired, 0);
  assert.equal(evidence.ecafOrEcadRowsAcquired, 0);
  assert.equal(evidence.providerOrEndUserLicenceObtained, false);
  assert.equal(evidence.finderRowsOrMarkersExtracted, 0);
  assert.equal(evidence.csoMicrodataAvailableOutsideCso, false);
  assert.equal(evidence.addressBuildingCadastreOrLandRowsQueried, 0);
});

test('Ireland ledger pins exact reports and Isle of Man is next', () => {
  assert.equal(digest(sourceReport), ie.lastAttempt.reportDigest);
  assert.equal(digest(checks), ie.lastAttempt.engineeringReportDigest);
  assert.equal(ie.blocker.evidence.sourceReviewDigest, ie.lastAttempt.reportDigest);
  assert.equal(ie.blocker.evidence.engineeringChecksDigest, ie.lastAttempt.engineeringReportDigest);
  assert.equal(im.status, 'pending');
  assert.equal(im.region, 'europe');
});

test('shared UI capability does not promote fabricated real IE geometry', () => {
  const evidence = ie.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realIeAgidPostalApiVerified, false);
  assert.equal(evidence.realIeAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(ie.blocker.requiresExplicitApproval, false);
  assert.match(ie.blocker.retryPolicy, /Do not register.*authenticate.*accept.*request.*pay.*crawl.*query.*create.*publish.*deploy/i);
});
