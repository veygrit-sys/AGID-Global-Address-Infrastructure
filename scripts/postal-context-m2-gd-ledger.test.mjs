import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gd = ledger.countries.find(country => country.countryCode === 'GD');
const manifest = readJson('data/postal_country_packs/gd/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gd/postal-context/source-profile.json');
const format = readJson('src/data/address_formats/americas/caribbean/GD.json');
const hierarchy = readJson('src/data/address_hierarchy/americas.json');
const draftPack = readJson('data/postal_country_packs/gd/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/gd-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/gd-checks-2026-09-01.json', root));

test('GD remains blocked under its official no-postcode and real-area criterion', () => {
  assert.equal(gd.status, 'blocked'); assert.equal(gd.attempts, 1); assert.equal(gd.evidence, null);
  assert.equal(gd.m2Definition.id, 'M2_current_grenada_postal_corporation_postcode_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === gd.m2Definition.id), gd.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts preserve current no-postcode status and address-format correction', () => {
  const e = gd.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 6); assert.equal(e.exactOfficialBodiesBytes, 1195959);
  assert.equal(e.currentPostalCodeFormat, 'none'); assert.equal(e.upuListsGrenadaAsNotRequiringPostalCodes, true);
  assert.equal(e.upuAddressingExamplesWithoutPostcode, 3); assert.equal(e.gpcCurrentLocationsReviewedWithoutPostcode, 10);
  assert.equal(e.governmentPostalStations, 52); assert.equal(e.governmentSubOffices, 6);
  assert.equal(e.optionalPostcodeMetadataAndTemplateFieldCorrected, true);
  assert.equal(format.postalCode.format, 'None'); assert.equal(format.addressRules.postalCode, null);
  assert.ok(format.native.fields.every(field => field.key !== 'postcode'));
  const embedded = Object.values(hierarchy.subregions).flatMap(region => region.countries).find(country => country.code === 'GD');
  assert.deepEqual(embedded.addressFormat, format);
});

test('restricted rights and non-postal proxies never promote', () => {
  const e = gd.blocker.evidence;
  assert.equal(e.gpcPagesStateAllRightsReserved, true); assert.equal(e.governmentPageCopyrightMarked, true);
  assert.equal(e.upuCopyrightAndDatabaseRestrictionsRecorded, true);
  assert.equal(e.openPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.islandParishDistrictLocalityAddressOfficeRouteServiceAreaProxiesPromoted, 0);
  assert.equal(e.pointBuffers, 0); assert.equal(e.convexOrConcaveHulls, 0); assert.equal(e.voronoiOrRasterCells, 0);
  assert.equal(e.agidCellsPromoted, 0); assert.equal(e.airportCodesPromoted, 0); assert.equal(e.commerceZipPlaceholdersPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('existing GD planning pack remains draft synthetic material', () => {
  const e = gd.blocker.evidence;
  assert.equal(draftPack.officialStatus, 'draft'); assert.equal(draftPack.counts.localities, 48);
  assert.equal(draftPack.counts.planningCells, 246); assert.equal(draftPack.counts.testVectors, 3);
  assert.equal(draftPack.counts.officialMunicipalityRecords, 0);
  assert.equal(e.syntheticGdPlanningCellsAvailable, 246); assert.equal(e.syntheticGdPlanningCellsPromoted, 0);
  assert.equal(e.syntheticGdCodeSeedsPromoted, 0); assert.equal(e.syntheticFixturePromoted, false);
});

test('GD ledger pins immutable reports and advances to French Guiana', () => {
  assert.equal(digest(sourceReport), gd.lastAttempt.reportDigest); assert.equal(digest(checks), gd.lastAttempt.engineeringReportDigest);
  assert.equal(gd.blocker.evidence.sourceReviewDigest, gd.lastAttempt.reportDigest);
  assert.equal(gd.blocker.evidence.engineeringChecksDigest, gd.lastAttempt.engineeringReportDigest);
  assert.equal(gd.blocker.evidence.publishedEvidenceCommit, '6ddfca0b8aa033ca76f67b69f6e222cb9f51066f');
  assert.match(gd.blocker.evidence.publishedSourceReviewUrl, /6ddfca0b8aa033ca76f67b69f6e222cb9f51066f/);
  assert.match(gd.blocker.evidence.publishedEngineeringChecksUrl, /6ddfca0b8aa033ca76f67b69f6e222cb9f51066f/);
  assert.equal(gd.blocker.evidence.publishedEvidenceGithubShaAndContentVerified, true);
  const next = ledger.countries.find(country => country.countryCode === 'GF'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('shared capability does not promote missing GD inputs or artifacts', () => {
  const e = gd.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realGdAgidPostalApiVerified, false);
  assert.equal(e.realGdAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(gd.blocker.requiresExplicitApproval, false);
  assert.match(gd.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('GD identity and source-described island objects stay separate from postal authority', () => {
  const e = gd.blocker.evidence;
  assert.equal(e.gdIdentityPreserved, true);
  assert.equal(e.grenadaCarriacouPetiteMartiniqueSourceIdentitiesPreserved, true);
  assert.match(manifest.postal_system.jurisdiction_rule, /Preserve ISO GD identity/);
  assert.match(manifest.postal_system.geometry_rule, /Carriacou.*Petite Martinique/);
});
