import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const ledger = readJson('docs/postal-context-m2-rollout.json');
const lt = ledger.countries.find(country => country.countryCode === 'LT');
const lu = ledger.countries.find(country => country.countryCode === 'LU');
const manifest = readJson('data/postal_country_packs/lt/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/lt/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/lt-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/lt-checks-2026-08-30.json', root));

test('Lithuania remains blocked under its operator postcode-area criterion', () => {
  assert.equal(lt.status, 'blocked');
  assert.equal(lt.attempts, 1);
  assert.equal(lt.evidence, null);
  assert.equal(lt.m2Definition.id, 'M2_current_lietuvos_pastas_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === lt.m2Definition.id), lt.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('authenticated optional geoArea is not promoted without rights and completeness', () => {
  const evidence = lt.blocker.evidence;
  assert.equal(evidence.authenticatedPostcodeEndpointDocumented, true);
  assert.equal(evidence.optionalOperatorGeoAreaDocumented, true);
  assert.equal(evidence.anonymousEndpointStatus, 401);
  assert.equal(evidence.operatorContractObtained, false);
  assert.equal(evidence.operatorCredentialsRequestedOrUsed, false);
  assert.equal(evidence.currentNationwideAssignmentRowsAcquired, 0);
  assert.equal(evidence.operatorGeoAreaResponsesAcquired, 0);
  assert.equal(evidence.productionEligibleRecords, 0);
});

test('address points and proxy geometry remain separate from postcode surfaces', () => {
  const evidence = lt.blocker.evidence;
  assert.equal(evidence.addressPointsCcBy40Observed, true);
  assert.equal(evidence.addressPointsPromotedToAreas, 0);
  assert.equal(evidence.deliveryAreasOrPostOfficesPromoted, 0);
  assert.equal(evidence.administrativeOrBuildingProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0);
  assert.equal(evidence.voronoiCells, 0);
  assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(evidence.inventedPointRoutePoBoxOrOrganizationAreas, 0);
  const operator = profile.sources.find(source => source.source_id === 'lietuvos-pastas-authenticated-api');
  assert.match(operator.terms_note, /contract/i);
});

test('Lithuania ledger pins exact reports and Luxembourg is next', () => {
  assert.equal(digest(sourceReport), lt.lastAttempt.reportDigest);
  assert.equal(digest(checks), lt.lastAttempt.engineeringReportDigest);
  assert.equal(lt.blocker.evidence.sourceReviewDigest, lt.lastAttempt.reportDigest);
  assert.equal(lt.blocker.evidence.engineeringChecksDigest, lt.lastAttempt.engineeringReportDigest);
  assert.equal(lu.status, 'pending');
  assert.equal(lu.region, 'europe');
});

test('shared UI capability does not promote fabricated real LT geometry', () => {
  const evidence = lt.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true);
  assert.equal(evidence.realLtAgidPostalApiVerified, false);
  assert.equal(evidence.realLtAgidAppAreaVisualizationVerified, false);
  assert.equal(evidence.browserE2eVerified, false);
  assert.equal(lt.blocker.requiresExplicitApproval, false);
  assert.match(lt.blocker.retryPolicy, /Do not register.*authenticate.*request.*accept.*pay.*query.*create.*publish.*deploy/i);
});
