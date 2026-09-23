import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const tt = ledger.countries.find(item => item.countryCode === 'TT');
const manifest = readJson('data/postal_country_packs/tt/postal-context/repository-manifest.json');
const sourceProfile = readJson('data/postal_country_packs/tt/postal-context/source-profile.json');
const addressFormat = readJson('src/data/address_formats/americas/caribbean/TT.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/tt-source-review-2026-09-02.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/tt-checks-2026-09-02.json', root));

test('TT remains blocked under the complete typed denominator and real-area criterion', () => {
  assert.equal(tt.status, 'blocked');
  assert.equal(tt.attempts, 1);
  assert.equal(tt.evidence, null);
  assert.equal(tt.m2Definition.id, 'M2_current_ttpost_complete_typed_assignment_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(item => item.id === tt.m2Definition.id), tt.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
});

test('exact evidence confirms six digits and national completion without claiming assignments or rights', () => {
  const evidence = tt.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 5);
  assert.equal(evidence.exactOfficialBodiesBytes, 2571401);
  assert.equal(evidence.currentPostalCodeFormat, 'NNNNNN');
  assert.equal(evidence.upuCurrentDatabaseRequiresPostalCodes, true);
  assert.equal(evidence.upuCurrentLength, 6);
  assert.equal(evidence.ttPostSystemCompletedForAllAddresses, true);
  assert.equal(evidence.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(evidence.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
});

test('TT address metadata is current while postal, address, building and AGID IDs stay separate', () => {
  assert.equal(addressFormat.postalCode.format, 'NNNNNN');
  assert.equal(addressFormat.postalCode.regex, '^\\d{6}$');
  assert.equal(addressFormat.addressRules.postalCode.required, true);
  assert.ok(addressFormat.native.fields.some(item => item.key === 'postcode' && item.required === true));
  assert.ok(addressFormat.english.fields.some(item => item.key === 'postcode' && item.required === true));
  assert.equal(tt.blocker.evidence.postalAdministrativeAddressBuildingAndAgidIdsKeptSeparate, true);
  assert.equal(tt.blocker.evidence.exactAddressOrBuildingIdsInferredFromPostcode, 0);
});

test('postal geometry and detailed identities are not fabricated', () => {
  const evidence = tt.blocker.evidence;
  assert.equal(evidence.mixedAreaAndNonAreaPostalObjectSemantics, true);
  assert.equal(evidence.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(evidence.districtLoopRouteZoneAdministrativePointBuildingOrCellProxiesPromoted, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(sourceProfile.sources.length, 5);
});

test('reports are digest pinned and next pending country is United States', () => {
  assert.equal(digest(sourceReport), tt.lastAttempt.reportDigest);
  assert.equal(digest(checks), tt.lastAttempt.engineeringReportDigest);
  assert.equal(tt.blocker.evidence.sourceReviewDigest, tt.lastAttempt.reportDigest);
  assert.equal(tt.blocker.evidence.engineeringChecksDigest, tt.lastAttempt.engineeringReportDigest);
  const us = ledger.countries.find(item => item.countryCode === 'US');
  assert.equal(us.status, 'pending');
  assert.equal(us.attempts, 0);
  assert.equal(tt.blocker.evidence.realTtAgidPostalApiVerified, false);
  assert.equal(tt.blocker.evidence.realTtAgidAppAreaVisualizationVerified, false);
  assert.equal(tt.blocker.evidence.browserE2eVerified, false);
  assert.match(tt.blocker.retryPolicy, /Do not contact.*request.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
