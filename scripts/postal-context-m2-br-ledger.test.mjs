import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const br = ledger.countries.find(country => country.countryCode === 'BR');
const manifest = readJson('data/postal_country_packs/br/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/br/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/br-source-review-2026-08-31.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/br-checks-2026-08-31.json', root));

test('BR remains blocked under its current Correios assignment and real-area criterion', () => {
  assert.equal(br.status, 'blocked'); assert.equal(br.attempts, 1); assert.equal(br.evidence, null);
  assert.equal(br.m2Definition.id, 'M2_current_correios_cep_assignment_and_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === br.m2Definition.id), br.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('official receipts pin current CEP semantics and restricted complete sources', () => {
  const e = br.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 4); assert.equal(e.exactOfficialBodiesBytes, 512491);
  assert.equal(e.postcodeDisplayFormat, 'NNNNN-NNN'); assert.equal(e.postcodeNormalizedFormat, 'NNNNNNNN');
  assert.equal(e.latestAdvertisedDneEdition, 'V.26082'); assert.equal(e.latestAdvertisedDnePublicationDate, '2026-08-31');
  assert.equal(e.dneCompleteDatasetAcquired, false); assert.equal(e.apiCredentialsOrContractUsed, false);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('licensed and authenticated sources do not imply public-serving rights', () => {
  const e = br.blocker.evidence;
  assert.equal(e.dneRequiresFormalRequestContractTermPaymentAndLicensedUse, true);
  assert.equal(e.apiRequiresCorporateAccountCommercialContractService86738AndBearerToken, true);
  assert.equal(e.publicCaptchaPortalTreatedAsCompleteRelease, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.featureOrAddressRowsQueried, 0); assert.equal(e.rawSourceBodiesInGit, 0);
});

test('all BR proxy surfaces and non-area objects fail closed', () => {
  const e = br.blocker.evidence;
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.cnefePointOrCepAggregateProxiesPromoted, 0);
  assert.equal(e.administrativeCensusRoadAddressBuildingBufferModelOrAgidProxiesPromoted, 0);
  assert.equal(e.streetRangeBuildingLargeUserUnitLockerPoBoxCommunityMailboxOrOrganizationObjectsExpandedToArea, 0);
  assert.equal(e.productionEligibleRecords, 0);
});

test('BR ledger pins exact reports and advances to Bahamas', () => {
  assert.equal(digest(sourceReport), br.lastAttempt.reportDigest); assert.equal(digest(checks), br.lastAttempt.engineeringReportDigest);
  assert.equal(br.blocker.evidence.sourceReviewDigest, br.lastAttempt.reportDigest);
  assert.equal(br.blocker.evidence.engineeringChecksDigest, br.lastAttempt.engineeringReportDigest);
  const bs = ledger.countries.find(country => country.countryCode === 'BS'); assert.equal(bs.status, 'pending'); assert.equal(bs.attempts, 0);
});

test('shared capability does not promote missing BR inputs or artifacts', () => {
  const e = br.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true); assert.equal(e.realBrAgidPostalApiVerified, false);
  assert.equal(e.realBrAgidAppAreaVisualizationVerified, false); assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.brIdentityPreserved, true);
  assert.equal(br.blocker.requiresExplicitApproval, true); assert.equal(br.blocker.retryAfter, '2026-09-07T14:18:56.294Z');
  assert.match(br.blocker.retryPolicy, /Do not contact.*register.*contract.*pay.*credentials.*query.*scrape.*create.*publish.*deploy/i);
});
