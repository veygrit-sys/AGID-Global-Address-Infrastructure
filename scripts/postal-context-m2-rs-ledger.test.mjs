import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const rs = ledger.countries.find(country => country.countryCode === 'RS');
const ru = ledger.countries.find(country => country.countryCode === 'RU');
const manifest = readJson('data/postal_country_packs/rs/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/rs/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/rs-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/rs-checks-2026-08-30.json', root));

test('Serbia remains blocked under its current postcode assignment and official PAK area criterion', () => {
  assert.equal(rs.status, 'blocked'); assert.equal(rs.attempts, 1); assert.equal(rs.evidence, null);
  assert.equal(rs.m2Definition.id, 'M2_current_serbia_postcode_assignment_and_pak_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === rs.m2Definition.id), rs.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('fifteen exact bodies pin postcode, PAK polygon, controlled delivery and RGZ separation evidence', () => {
  const evidence = rs.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 15);
  assert.equal(evidence.exactOfficialBodiesBytes, 1411809);
  assert.equal(evidence.canonicalPostcodeFormat, 'NNNNN'); assert.equal(evidence.canonicalPakFormat, 'NNNNNN');
  assert.equal(evidence.officialPakPolygonExistenceEstablished, true);
  assert.equal(evidence.advertisedPakCountLowerBound, 113000);
  assert.equal(evidence.pakPriceRsdPerDataUnit, 90); assert.equal(evidence.gisPriceVatExcluded, true);
  assert.equal(profile.sources.find(source => source.source_id === 'posta-srbije-pak-gis').redistribution_class, 'R3_controlled_or_contract');
});

test('rights, fixed delivery, reconciliation and proxy gates fail closed', () => {
  const evidence = rs.blocker.evidence;
  assert.equal(evidence.completeFiveDigitDatabaseDownloadAvailable, false);
  assert.equal(evidence.enpPdfIsCompleteNationalDenominator, false);
  assert.equal(evidence.agidProcessingDerivationStorageRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.fixedAuthoritativePakGeometryArtifactsInspected, 0);
  assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.fiveDigitAssignmentAreaNonAreaRowsReconciled, 0);
  assert.equal(evidence.enpOfficeRgzAddressAdministrativeCadastralBuildingParcelProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0); assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0); assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(evidence.rsXkIdentityPreserved, true);
});

test('Serbia ledger pins exact reports and preserves Russia next-country order', () => {
  assert.equal(digest(sourceReport), rs.lastAttempt.reportDigest); assert.equal(digest(checks), rs.lastAttempt.engineeringReportDigest);
  assert.equal(rs.blocker.evidence.sourceReviewDigest, rs.lastAttempt.reportDigest);
  assert.equal(rs.blocker.evidence.engineeringChecksDigest, rs.lastAttempt.engineeringReportDigest);
  assert.equal(ru.status, 'pending'); assert.equal(ru.region, 'europe');
});

test('shared UI capability does not promote a missing real RS runtime', () => {
  const evidence = rs.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true); assert.equal(evidence.realRsAgidPostalApiVerified, false);
  assert.equal(evidence.realRsAgidAppAreaVisualizationVerified, false); assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0); assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(rs.blocker.requiresExplicitApproval, false);
  assert.match(rs.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
