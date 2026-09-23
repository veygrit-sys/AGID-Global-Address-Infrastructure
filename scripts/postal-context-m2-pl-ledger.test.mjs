import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const pl = ledger.countries.find(country => country.countryCode === 'PL');
const pt = ledger.countries.find(country => country.countryCode === 'PT');
const manifest = readJson('data/postal_country_packs/pl/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/pl/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/pl-source-review-2026-08-30.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/pl-checks-2026-08-30.json', root));

test('Poland remains blocked under its current assignment and authoritative area criterion', () => {
  assert.equal(pl.status, 'blocked'); assert.equal(pl.attempts, 1); assert.equal(pl.evidence, null);
  assert.equal(pl.m2Definition.id, 'M2_current_poland_pna_assignment_and_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === pl.m2Definition.id), pl.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
});

test('the current July 2026 PNA PDF and public 00-940 search receipt are pinned', () => {
  const evidence = pl.blocker.evidence;
  assert.equal(evidence.exactBodiesByteAndSha256Bound, 8);
  assert.equal(evidence.pdfEdition, 'July 2026'); assert.equal(evidence.pdfPages, 1786);
  assert.equal(evidence.pdfBytes, 7874157); assert.equal(evidence.pdfPnaOccurrences, 121627);
  assert.equal(evidence.pdfDistinctPnaCodes, 21642); assert.equal(evidence.minimumPna, '00-001');
  assert.equal(evidence.maximumPna, '99-440'); assert.equal(evidence.publicSearchDatabaseDate, '2026-08-30');
  assert.equal(evidence.searchExamplePna, '00-940'); assert.equal(evidence.searchExampleRows, 6);
  assert.equal(profile.sources.find(source => source.source_id === 'poczta-polska-system-pna').redistribution_class, 'R3_controlled_or_contract');
});

test('rights, fixed geometry and proxy gates fail closed', () => {
  const evidence = pl.blocker.evidence;
  assert.equal(evidence.pocztaAgidProcessingDerivationStorageRedistributionAndPublicServingPermissionEstablished, false);
  assert.equal(evidence.pdfGeometryTerms, 0); assert.equal(evidence.searchGeometryTokens, 0);
  assert.equal(evidence.fixedAuthoritativeGeometryArtifactsInspected, 0);
  assert.equal(evidence.polygonOrMultiPolygonFeaturesValidated, 0);
  assert.equal(evidence.assignmentAreaNonAreaRowsReconciled, 0);
  assert.equal(evidence.administrativeAddressOrLookupRowProxiesPromoted, 0);
  assert.equal(evidence.pointBuffers, 0); assert.equal(evidence.convexOrConcaveHulls, 0);
  assert.equal(evidence.voronoiOrRasterCells, 0); assert.equal(evidence.syntheticFixturePromoted, false);
  assert.equal(evidence.plIdentityPreserved, true);
});

test('Poland ledger pins exact reports and preserves Portugal next-country order', () => {
  assert.equal(digest(sourceReport), pl.lastAttempt.reportDigest); assert.equal(digest(checks), pl.lastAttempt.engineeringReportDigest);
  assert.equal(pl.blocker.evidence.sourceReviewDigest, pl.lastAttempt.reportDigest);
  assert.equal(pl.blocker.evidence.engineeringChecksDigest, pl.lastAttempt.engineeringReportDigest);
  assert.equal(pt.status, 'pending'); assert.equal(pt.region, 'europe');
});

test('shared UI capability does not promote a missing real PL runtime', () => {
  const evidence = pl.blocker.evidence;
  assert.equal(evidence.sharedAppAreaPathVerified, true); assert.equal(evidence.realPlAgidPostalApiVerified, false);
  assert.equal(evidence.realPlAgidAppAreaVisualizationVerified, false); assert.equal(evidence.browserE2eVerified, false);
  assert.equal(evidence.approvedAgidRuntimeArtifacts, 0); assert.equal(evidence.rawSourceBodiesInGit, 0);
  assert.equal(pl.blocker.requiresExplicitApproval, false);
  assert.match(pl.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});
