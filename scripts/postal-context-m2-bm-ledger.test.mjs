import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const bm = ledger.countries.find(country => country.countryCode === 'BM');
const manifest = readJson('data/postal_country_packs/bm/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/bm/postal-context/source-profile.json');
const sourceReportBytes = readFileSync(new URL('reports/postal-context-m2/bm-source-review-2026-08-31.json', root));
const checksBytes = readFileSync(new URL('reports/postal-context-m2/bm-checks-2026-08-31.json', root));

test('BM remains blocked under its current assignment and real-area criterion', () => {
  assert.equal(bm.status, 'blocked'); assert.equal(bm.attempts, 1); assert.equal(bm.evidence, null);
  assert.equal(bm.m2Definition.id, 'M2_current_bpo_assignments_and_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === bm.m2Definition.id), bm.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('exact receipts prove format and workbook aggregate quality without raw rows', () => {
  const e = bm.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 12); assert.equal(e.exactOfficialBodiesBytes, 1039242);
  assert.equal(e.currentAddressingSheetEdition, '4/2026'); assert.equal(e.officialLocationExamplesValidated, 9);
  assert.equal(e.workbookLastSavedAt, '2019-03-28T19:32:44Z'); assert.equal(e.candidateAssignmentRows, 2087);
  assert.equal(e.uniqueNormalizedRows, 2086); assert.equal(e.uniqueNormalizedPostcodes, 102);
  assert.equal(e.homeDeliveryNumericCodes, 80); assert.equal(e.alphaPostcodes, 22);
  assert.equal(e.embeddedHeaders, 1); assert.equal(e.caseAnomalies, 1); assert.equal(e.qualifierAnomalies, 1);
  assert.equal(e.exactDuplicateRows, 1); assert.equal(e.ambiguousAssignmentKeys, 30);
  assert.equal(e.rawWorkbookRowsInGit, 0); assert.equal(profile.m2_review.exact_official_publication_and_metadata_bodies, 12);
});

test('Crown copyright and commercial UPU terms fail closed', () => {
  const e = bm.blocker.evidence;
  assert.equal(e.governmentSiteContentAndDatabaseCrownCopyright, true);
  assert.equal(e.governmentSiteUseGrantsIntellectualPropertyLicence, false);
  assert.equal(e.writtenPermissionRequiredForReproductionDistributionModificationOrTransmission, true);
  assert.equal(e.workbookSeparateOpenLicencePresent, false);
  assert.equal(e.upuUniversalPostcodeDatabaseVersion, '2026.1');
  assert.equal(e.upuCommercialDatabaseAccessed, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('tiles, false positives and attribute rows never stand in for postal areas', () => {
  const e = bm.blocker.evidence;
  assert.equal(e.officialWorkbookGeometryColumns, 0); assert.equal(e.belcoItemType, 'Tile Package');
  assert.equal(e.belcoItemLicenseInfo, ''); assert.equal(e.belcoItemAccessInformation, '');
  assert.equal(e.belcoQueryableVectorPostcodeLayerValidated, false); assert.equal(e.geotripzFalsePositiveIsBermuda, false);
  assert.equal(e.geotripzFalsePositivePostalCodeFields, 0);
  assert.equal(e.officialPostalAreaPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalAreaPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.streetParishBuildingTilePointBufferModelOrAgidProxiesPromoted, 0); assert.equal(e.productionEligibleRecords, 0);
});

test('BM ledger pins exact reports and advances to Bolivia', () => {
  assert.equal(digest(sourceReportBytes), bm.lastAttempt.reportDigest); assert.equal(digest(checksBytes), bm.lastAttempt.engineeringReportDigest);
  assert.equal(bm.blocker.evidence.sourceReviewDigest, bm.lastAttempt.reportDigest);
  assert.equal(bm.blocker.evidence.engineeringChecksDigest, bm.lastAttempt.engineeringReportDigest);
  const bo = ledger.countries.find(country => country.countryCode === 'BO'); assert.equal(bo.status, 'pending'); assert.equal(bo.attempts, 0);
});

test('shared capability does not promote missing BM inputs or artifacts', () => {
  const e = bm.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realBmAgidPostalApiVerified, false);
  assert.equal(e.realBmAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.bmIdentityPreserved, true);
  assert.equal(bm.blocker.requiresExplicitApproval, false); assert.equal(bm.blocker.retryAfter, '2026-09-07T11:37:20.370Z');
  assert.match(bm.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*protected.*create.*publish.*deploy/i);
});
