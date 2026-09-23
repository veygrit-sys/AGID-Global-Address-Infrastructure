import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const pt = ledger.countries.find(country => country.countryCode === 'PT');
const ro = ledger.countries.find(country => country.countryCode === 'RO');
const manifest = readJson('data/postal_country_packs/pt/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/pt/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/pt-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/pt-checks-2026-08-30.json', root));

test('Portugal remains blocked under its current assignment and authoritative area criterion', () => {
  assert.equal(pt.status, 'blocked'); assert.equal(pt.attempts, 1); assert.equal(pt.evidence, null);
  assert.equal(pt.m2Definition.id, 'M2_current_portugal_postcode_assignment_and_authoritative_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === pt.m2Definition.id), pt.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('six exact CTT bodies pin postcode, search, licensing and door-point evidence', () => {
  const evidence = pt.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 6);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNNN-NNN');
  assert.equal(evidence.cttDatabaseLicensingObserved, true);
  assert.equal(evidence.cttDoorCoordinateGeometry, 'Point');
  assert.equal(evidence.cttDoorCoordinateCrs, 'EPSG:4326');
  assert.equal(profile.sources.find(source => source.source_id === 'ctt-national-address-database-and-postal-gis').redistribution_class, 'R3_controlled_or_contract');
});

test('rights, fixed geometry and proxy gates fail closed', () => {
  const evidence = pt.blocker.evidence;
  assert.equal(evidence.cttAgidProcessingDerivationStorageRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.postcodeAreaGeometryTokens, 0);
  assert.equal(evidence.fixedAuthoritativeGeometryArtifactsInspected, 0);
  assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.assignmentAreaNonAreaRowsReconciled, 0);
  assert.equal(evidence.administrativeCadastralAddressOrDoorPointProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0); assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0); assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(evidence.ptIdentityPreserved, true);
});

test('Portugal ledger pins exact reports and preserves Romania next-country order', () => {
  assert.equal(digest(sourceReport), pt.lastAttempt.reportDigest); assert.equal(digest(checks), pt.lastAttempt.engineeringReportDigest);
  assert.equal(pt.blocker.evidence.sourceReviewDigest, pt.lastAttempt.reportDigest);
  assert.equal(pt.blocker.evidence.engineeringChecksDigest, pt.lastAttempt.engineeringReportDigest);
  assert.equal(ro.status, 'pending'); assert.equal(ro.region, 'europe');
});

test('shared UI capability does not promote a missing real PT runtime', () => {
  const evidence = pt.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true); assert.equal(evidence.realPtAgidPostalApiVerified, false);
  assert.equal(evidence.realPtAgidAppAreaVisualizationVerified, false); assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0); assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(pt.blocker.requiresExplicitApproval, false);
  assert.match(pt.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
