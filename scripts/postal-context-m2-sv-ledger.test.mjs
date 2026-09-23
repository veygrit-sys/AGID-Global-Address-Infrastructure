import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const sv = ledger.countries.find(item => item.countryCode === 'SV');
const manifest = readJson('data/postal_country_packs/sv/postal-context/repository-manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/sv-source-review-2026-09-02.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/sv-checks-2026-09-02.json', root));

test('SV remains blocked under current complete-denominator and real-area criterion', () => {
  assert.equal(sv.status, 'blocked');
  assert.equal(sv.attempts, 1);
  assert.equal(sv.evidence, null);
  assert.equal(sv.m2Definition.id, 'M2_current_correos_el_salvador_complete_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(item => item.id === sv.m2Definition.id), sv.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
});

test('exact evidence confirms four digits without claiming assignments or rights', () => {
  const evidence = sv.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 5);
  assert.equal(evidence.exactOfficialBodiesBytes, 1106242);
  assert.equal(evidence.currentPostalCodeFormat, 'NNNN');
  assert.equal(evidence.upuCurrentDatabaseRequiresPostalCodes, true);
  assert.equal(evidence.upuCurrentLength, 4);
  assert.equal(evidence.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(evidence.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
});

test('postal geometry and more-detailed IDs are not fabricated', () => {
  const evidence = sv.blocker.evidence;
  assert.equal(evidence.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.cnrAdministrativeCodesOrGeometryPromoted, 0);
  assert.equal(evidence.localityDeliveryLabelOfficeRoutePoBoxOrganizationAddressBuildingPointOrCellProxiesPromoted, 0);
  assert.equal(evidence.synthetic9999FixturePromoted, false);
  assert.equal(evidence.productionEligibleRecords, 0);
});

test('reports are digest pinned and next pending country is Sint Maarten', () => {
  assert.equal(digest(sourceReport), sv.lastAttempt.reportDigest);
  assert.equal(digest(checks), sv.lastAttempt.engineeringReportDigest);
  assert.equal(sv.blocker.evidence.sourceReviewDigest, sv.lastAttempt.reportDigest);
  assert.equal(sv.blocker.evidence.engineeringChecksDigest, sv.lastAttempt.engineeringReportDigest);
  const sx = ledger.countries.find(item => item.countryCode === 'SX');
  assert.equal(sx.status, 'pending');
  assert.equal(sx.attempts, 0);
});

test('shared capability is not misreported as an SV runtime', () => {
  const evidence = sv.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realSvAgidPostalApiVerified, false);
  assert.equal(evidence.realSvAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(evidence.svIdentityPreserved, true);
  assert.match(sv.blocker.retryPolicy, /Do not contact.*request.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
